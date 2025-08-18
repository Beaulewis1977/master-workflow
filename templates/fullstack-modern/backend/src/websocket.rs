use std::collections::HashMap;
use std::sync::Arc;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

use crate::{auth::Claims, services::Services};

// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    // Connection management
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "pong")]
    Pong,
    
    // Chat messages
    #[serde(rename = "chat_message")]
    ChatMessage {
        chat_id: Uuid,
        message_id: Uuid,
        content: String,
        sender_id: Uuid,
        timestamp: chrono::DateTime<chrono::Utc>,
    },
    
    // Typing indicators
    #[serde(rename = "typing_start")]
    TypingStart {
        chat_id: Uuid,
        user_id: Uuid,
    },
    #[serde(rename = "typing_stop")]
    TypingStop {
        chat_id: Uuid,
        user_id: Uuid,
    },
    
    // Notifications
    #[serde(rename = "notification")]
    Notification {
        id: Uuid,
        title: String,
        message: String,
        notification_type: String,
        timestamp: chrono::DateTime<chrono::Utc>,
    },
    
    // User presence
    #[serde(rename = "user_online")]
    UserOnline {
        user_id: Uuid,
    },
    #[serde(rename = "user_offline")]
    UserOffline {
        user_id: Uuid,
    },
    
    // System messages
    #[serde(rename = "error")]
    Error {
        message: String,
        code: Option<String>,
    },
    
    #[serde(rename = "success")]
    Success {
        message: String,
    },
}

// Connection manager
#[derive(Debug)]
pub struct ConnectionManager {
    // User ID -> WebSocket sender
    connections: Arc<RwLock<HashMap<Uuid, broadcast::Sender<WsMessage>>>>,
    // Chat ID -> Set of user IDs
    chat_participants: Arc<RwLock<HashMap<Uuid, Vec<Uuid>>>>,
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
            chat_participants: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_connection(&self, user_id: Uuid, sender: broadcast::Sender<WsMessage>) {
        let mut connections = self.connections.write().await;
        connections.insert(user_id, sender);
        
        // Notify others that user is online
        self.broadcast_to_all(WsMessage::UserOnline { user_id }).await;
    }

    pub async fn remove_connection(&self, user_id: &Uuid) {
        let mut connections = self.connections.write().await;
        connections.remove(user_id);
        
        // Notify others that user is offline
        self.broadcast_to_all(WsMessage::UserOffline { user_id: *user_id }).await;
    }

    pub async fn send_to_user(&self, user_id: &Uuid, message: WsMessage) {
        let connections = self.connections.read().await;
        if let Some(sender) = connections.get(user_id) {
            let _ = sender.send(message);
        }
    }

    pub async fn send_to_chat(&self, chat_id: &Uuid, message: WsMessage, exclude_user: Option<Uuid>) {
        let chat_participants = self.chat_participants.read().await;
        if let Some(participants) = chat_participants.get(chat_id) {
            let connections = self.connections.read().await;
            
            for user_id in participants {
                if exclude_user.map_or(true, |excluded| excluded != *user_id) {
                    if let Some(sender) = connections.get(user_id) {
                        let _ = sender.send(message.clone());
                    }
                }
            }
        }
    }

    pub async fn broadcast_to_all(&self, message: WsMessage) {
        let connections = self.connections.read().await;
        for sender in connections.values() {
            let _ = sender.send(message.clone());
        }
    }

    pub async fn add_user_to_chat(&self, chat_id: Uuid, user_id: Uuid) {
        let mut chat_participants = self.chat_participants.write().await;
        chat_participants
            .entry(chat_id)
            .or_insert_with(Vec::new)
            .push(user_id);
    }

    pub async fn remove_user_from_chat(&self, chat_id: &Uuid, user_id: &Uuid) {
        let mut chat_participants = self.chat_participants.write().await;
        if let Some(participants) = chat_participants.get_mut(chat_id) {
            participants.retain(|id| id != user_id);
            if participants.is_empty() {
                chat_participants.remove(chat_id);
            }
        }
    }

    pub async fn get_online_users(&self) -> Vec<Uuid> {
        let connections = self.connections.read().await;
        connections.keys().cloned().collect()
    }
}

// WebSocket handler
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(services): State<Services>,
) -> Response {
    ws.on_upgrade(|socket| websocket_connection(socket, services))
}

async fn websocket_connection(socket: WebSocket, services: Services) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = broadcast::channel::<WsMessage>(100);
    
    // Handle authentication
    let user_id = match authenticate_websocket(&mut receiver).await {
        Ok(user_id) => user_id,
        Err(error) => {
            let error_msg = WsMessage::Error {
                message: error,
                code: Some("AUTH_FAILED".to_string()),
            };
            let _ = sender.send(Message::Text(serde_json::to_string(&error_msg).unwrap())).await;
            return;
        }
    };

    // Add connection to manager
    services.connection_manager.add_connection(user_id, tx.clone()).await;

    // Send welcome message
    let welcome_msg = WsMessage::Success {
        message: "Connected successfully".to_string(),
    };
    let _ = tx.send(welcome_msg);

    // Handle outgoing messages
    let tx_clone = tx.clone();
    let sender_task = tokio::spawn(async move {
        while let Ok(message) = rx.recv().await {
            let text = match serde_json::to_string(&message) {
                Ok(text) => text,
                Err(_) => continue,
            };
            
            if sender.send(Message::Text(text)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages
    let services_clone = services.clone();
    let receiver_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(ws_message) = serde_json::from_str::<WsMessage>(&text) {
                        handle_websocket_message(ws_message, user_id, &services_clone, &tx_clone).await;
                    }
                }
                Ok(Message::Binary(_)) => {
                    // Handle binary messages if needed
                }
                Ok(Message::Close(_)) => {
                    break;
                }
                Ok(Message::Ping(data)) => {
                    let _ = tx_clone.send(WsMessage::Pong);
                }
                Ok(Message::Pong(_)) => {
                    // Handle pong
                }
                Err(_) => {
                    break;
                }
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = sender_task => {},
        _ = receiver_task => {},
    }

    // Clean up connection
    services.connection_manager.remove_connection(&user_id).await;
}

async fn authenticate_websocket(receiver: &mut futures::stream::SplitStream<WebSocket>) -> Result<Uuid, String> {
    // Wait for authentication message
    if let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                #[derive(Deserialize)]
                struct AuthMessage {
                    token: String,
                }
                
                let auth_msg: AuthMessage = serde_json::from_str(&text)
                    .map_err(|_| "Invalid authentication message format")?;
                
                // Verify JWT token
                let claims = crate::auth::verify_token(&auth_msg.token)
                    .map_err(|_| "Invalid or expired token")?;
                
                Ok(claims.sub)
            }
            _ => Err("Expected text message for authentication".to_string()),
        }
    } else {
        Err("No authentication message received".to_string())
    }
}

async fn handle_websocket_message(
    message: WsMessage,
    user_id: Uuid,
    services: &Services,
    _tx: &broadcast::Sender<WsMessage>,
) {
    match message {
        WsMessage::Ping => {
            // Respond with pong
            let _ = _tx.send(WsMessage::Pong);
        }
        
        WsMessage::ChatMessage { 
            chat_id, 
            content, 
            .. 
        } => {
            // Handle chat message
            let message_id = Uuid::new_v4();
            let timestamp = chrono::Utc::now();
            
            // Store message in database
            // let create_message = crate::models::CreateMessage {
            //     id: message_id,
            //     chat_id,
            //     sender_id: user_id,
            //     content: content.clone(),
            //     message_type: crate::models::MessageType::Text,
            //     metadata: None,
            // };
            
            // Broadcast to chat participants
            let broadcast_message = WsMessage::ChatMessage {
                chat_id,
                message_id,
                content,
                sender_id: user_id,
                timestamp,
            };
            
            services.connection_manager
                .send_to_chat(&chat_id, broadcast_message, Some(user_id))
                .await;
        }
        
        WsMessage::TypingStart { chat_id } => {
            let typing_message = WsMessage::TypingStart {
                chat_id,
                user_id,
            };
            
            services.connection_manager
                .send_to_chat(&chat_id, typing_message, Some(user_id))
                .await;
        }
        
        WsMessage::TypingStop { chat_id } => {
            let typing_message = WsMessage::TypingStop {
                chat_id,
                user_id,
            };
            
            services.connection_manager
                .send_to_chat(&chat_id, typing_message, Some(user_id))
                .await;
        }
        
        _ => {
            // Handle other message types
        }
    }
}