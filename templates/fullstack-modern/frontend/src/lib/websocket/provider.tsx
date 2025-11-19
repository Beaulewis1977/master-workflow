'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  send: (message: WebSocketMessage) => void;
  subscribe: (type: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  send: () => {},
  subscribe: () => () => {},
});

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const session = useAuthStore((state) => state.session);
  const setWsConnected = useAppStore((state) => state.setWsConnected);
  const setWsReconnecting = useAppStore((state) => state.setWsReconnecting);
  const addNotification = useAppStore((state) => state.addNotification);
  
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!session?.access_token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000', {
      auth: {
        token: session.access_token,
      },
      transports: ['websocket'],
      reconnection: false, // Handle reconnection manually
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setWsConnected(true);
      setWsReconnecting(false);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
      setWsConnected(false);
      
      // Attempt to reconnect unless it was a manual disconnect
      if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts) {
        scheduleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
      setWsConnected(false);
      scheduleReconnect();
    });

    // Handle incoming messages
    newSocket.on('message', (message: WebSocketMessage) => {
      handleMessage(message);
    });

    // Handle specific message types
    newSocket.on('chat_message', (data) => {
      handleMessage({ type: 'chat_message', data, timestamp: Date.now() });
    });

    newSocket.on('notification', (data) => {
      addNotification({
        type: data.type || 'info',
        title: data.title,
        message: data.message,
      });
      handleMessage({ type: 'notification', data, timestamp: Date.now() });
    });

    newSocket.on('user_online', (data) => {
      handleMessage({ type: 'user_online', data, timestamp: Date.now() });
    });

    newSocket.on('user_offline', (data) => {
      handleMessage({ type: 'user_offline', data, timestamp: Date.now() });
    });

    newSocket.on('typing_start', (data) => {
      handleMessage({ type: 'typing_start', data, timestamp: Date.now() });
    });

    newSocket.on('typing_stop', (data) => {
      handleMessage({ type: 'typing_stop', data, timestamp: Date.now() });
    });

    setSocket(newSocket);
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttempts.current += 1;
    setWsReconnecting(true);

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (reconnectAttempts.current < maxReconnectAttempts) {
        connect();
      } else {
        setWsReconnecting(false);
        addNotification({
          type: 'error',
          title: 'Connection Lost',
          message: 'Unable to reconnect to server. Please refresh the page.',
        });
      }
    }, delay);
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setConnected(false);
    setWsConnected(false);
    setWsReconnecting(false);
    reconnectAttempts.current = 0;
  };

  const handleMessage = (message: WebSocketMessage) => {
    const listeners = listenersRef.current.get(message.type);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(message.data);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  };

  const send = (message: WebSocketMessage) => {
    if (socket?.connected) {
      socket.emit('message', message);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  };

  const subscribe = (type: string, callback: (data: any) => void) => {
    const listeners = listenersRef.current.get(type) || new Set();
    listeners.add(callback);
    listenersRef.current.set(type, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = listenersRef.current.get(type);
      if (currentListeners) {
        currentListeners.delete(callback);
        if (currentListeners.size === 0) {
          listenersRef.current.delete(type);
        }
      }
    };
  };

  // Connect when session is available
  useEffect(() => {
    if (session?.access_token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [session?.access_token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: WebSocketContextType = {
    socket,
    connected,
    send,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hooks for specific WebSocket functionality

export function useChatMessages(chatId: string) {
  const { subscribe } = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe('chat_message', (data) => {
      if (data.chat_id === chatId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return unsubscribe;
  }, [chatId, subscribe]);

  return messages;
}

export function useTypingIndicator(chatId: string) {
  const { subscribe } = useWebSocket();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribeStart = subscribe('typing_start', (data) => {
      if (data.chat_id === chatId) {
        setTypingUsers((prev) => new Set([...prev, data.user_id]));
      }
    });

    const unsubscribeStop = subscribe('typing_stop', (data) => {
      if (data.chat_id === chatId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.user_id);
          return newSet;
        });
      }
    });

    return () => {
      unsubscribeStart();
      unsubscribeStop();
    };
  }, [chatId, subscribe]);

  return Array.from(typingUsers);
}

export function useUserPresence() {
  const { subscribe } = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribeOnline = subscribe('user_online', (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.user_id]));
    });

    const unsubscribeOffline = subscribe('user_offline', (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.user_id);
        return newSet;
      });
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, [subscribe]);

  return Array.from(onlineUsers);
}