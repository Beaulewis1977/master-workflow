import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => void;
  reset: () => void;
  
  // Computed
  isAuthenticated: boolean;
  isVerified: boolean;
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  isAuthenticated: false,
  isVerified: false,
};

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          ...initialState,
          
          // Computed getters
          get isAuthenticated() {
            return !!get().session && !!get().user;
          },
          
          get isVerified() {
            const user = get().user;
            return !!user?.email_confirmed_at;
          },
          
          // Actions
          setUser: (user) =>
            set((state) => {
              state.user = user;
            }),
            
          setSession: (session) =>
            set((state) => {
              state.session = session;
            }),
            
          setProfile: (profile) =>
            set((state) => {
              state.profile = profile;
            }),
            
          setLoading: (loading) =>
            set((state) => {
              state.isLoading = loading;
            }),
            
          setInitialized: (initialized) =>
            set((state) => {
              state.isInitialized = initialized;
            }),
            
          signOut: () =>
            set((state) => {
              state.user = null;
              state.session = null;
              state.profile = null;
              state.isLoading = false;
            }),
            
          reset: () =>
            set((state) => {
              Object.assign(state, initialState);
            }),
        }),
        {
          name: 'auth-store',
          partialize: (state) => ({
            user: state.user,
            session: state.session,
            profile: state.profile,
            isInitialized: state.isInitialized,
          }),
        }
      )
    )
  )
);

// Selectors for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsVerified = () => useAuthStore((state) => state.isVerified);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsInitialized = () => useAuthStore((state) => state.isInitialized);

// Subscribe to auth changes
if (typeof window !== 'undefined') {
  useAuthStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated, previousIsAuthenticated) => {
      if (isAuthenticated !== previousIsAuthenticated) {
        // Trigger analytics or other side effects
        console.log('Auth state changed:', { isAuthenticated, previousIsAuthenticated });
      }
    }
  );
}