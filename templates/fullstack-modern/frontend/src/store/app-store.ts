import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
}

interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Toasts
  toasts: ToastMessage[];
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Error handling
  errors: Record<string, string>;
  
  // WebSocket
  wsConnected: boolean;
  wsReconnecting: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Toasts
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Loading
  setGlobalLoading: (loading: boolean) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  clearLoadingState: (key: string) => void;
  
  // Errors
  setError: (key: string, error: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  
  // WebSocket
  setWsConnected: (connected: boolean) => void;
  setWsReconnecting: (reconnecting: boolean) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          // Initial state
          theme: 'system',
          sidebarOpen: true,
          sidebarCollapsed: false,
          notifications: [],
          unreadCount: 0,
          toasts: [],
          globalLoading: false,
          loadingStates: {},
          errors: {},
          wsConnected: false,
          wsReconnecting: false,
          
          // Theme actions
          setTheme: (theme) =>
            set((state) => {
              state.theme = theme;
            }),
            
          // Sidebar actions
          setSidebarOpen: (open) =>
            set((state) => {
              state.sidebarOpen = open;
            }),
            
          setSidebarCollapsed: (collapsed) =>
            set((state) => {
              state.sidebarCollapsed = collapsed;
            }),
            
          toggleSidebar: () =>
            set((state) => {
              state.sidebarOpen = !state.sidebarOpen;
            }),
            
          // Notification actions
          addNotification: (notification) =>
            set((state) => {
              const newNotification: Notification = {
                ...notification,
                id: generateId(),
                timestamp: Date.now(),
                read: false,
              };
              state.notifications.unshift(newNotification);
              state.unreadCount = state.notifications.filter(n => !n.read).length;
            }),
            
          markNotificationRead: (id) =>
            set((state) => {
              const notification = state.notifications.find(n => n.id === id);
              if (notification) {
                notification.read = true;
                state.unreadCount = state.notifications.filter(n => !n.read).length;
              }
            }),
            
          markAllNotificationsRead: () =>
            set((state) => {
              state.notifications.forEach(n => n.read = true);
              state.unreadCount = 0;
            }),
            
          removeNotification: (id) =>
            set((state) => {
              state.notifications = state.notifications.filter(n => n.id !== id);
              state.unreadCount = state.notifications.filter(n => !n.read).length;
            }),
            
          clearNotifications: () =>
            set((state) => {
              state.notifications = [];
              state.unreadCount = 0;
            }),
            
          // Toast actions
          addToast: (toast) =>
            set((state) => {
              const newToast: ToastMessage = {
                ...toast,
                id: generateId(),
              };
              state.toasts.push(newToast);
            }),
            
          removeToast: (id) =>
            set((state) => {
              state.toasts = state.toasts.filter(t => t.id !== id);
            }),
            
          clearToasts: () =>
            set((state) => {
              state.toasts = [];
            }),
            
          // Loading actions
          setGlobalLoading: (loading) =>
            set((state) => {
              state.globalLoading = loading;
            }),
            
          setLoadingState: (key, loading) =>
            set((state) => {
              if (loading) {
                state.loadingStates[key] = true;
              } else {
                delete state.loadingStates[key];
              }
            }),
            
          clearLoadingState: (key) =>
            set((state) => {
              delete state.loadingStates[key];
            }),
            
          // Error actions
          setError: (key, error) =>
            set((state) => {
              state.errors[key] = error;
            }),
            
          clearError: (key) =>
            set((state) => {
              delete state.errors[key];
            }),
            
          clearAllErrors: () =>
            set((state) => {
              state.errors = {};
            }),
            
          // WebSocket actions
          setWsConnected: (connected) =>
            set((state) => {
              state.wsConnected = connected;
            }),
            
          setWsReconnecting: (reconnecting) =>
            set((state) => {
              state.wsReconnecting = reconnecting;
            }),
        }),
        {
          name: 'app-store',
          partialize: (state) => ({
            theme: state.theme,
            sidebarCollapsed: state.sidebarCollapsed,
            notifications: state.notifications,
          }),
        }
      )
    )
  )
);

// Selectors
export const useTheme = () => useAppStore((state) => state.theme);
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useUnreadCount = () => useAppStore((state) => state.unreadCount);
export const useToasts = () => useAppStore((state) => state.toasts);
export const useGlobalLoading = () => useAppStore((state) => state.globalLoading);
export const useWsStatus = () => useAppStore((state) => ({ 
  connected: state.wsConnected, 
  reconnecting: state.wsReconnecting 
}));