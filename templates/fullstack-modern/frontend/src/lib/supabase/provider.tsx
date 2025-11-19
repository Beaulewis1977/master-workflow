'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';

const SupabaseContext = createContext<any>(null);

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  
  const {
    setUser,
    setSession,
    setProfile,
    setLoading,
    setInitialized,
    signOut: storeSignOut,
  } = useAuthStore();
  
  const { addToast } = useAppStore();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          addToast({
            type: 'error',
            title: 'Authentication Error',
            description: 'Failed to get session',
          });
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Get user profile if authenticated
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Unexpected error during session initialization:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      setSession(session);
      setUser(session?.user ?? null);
      
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            await fetchUserProfile(session.user.id);
            addToast({
              type: 'success',
              title: 'Welcome back!',
              description: 'You have been signed in successfully.',
            });
            router.push('/dashboard');
          }
          break;
          
        case 'SIGNED_OUT':
          setProfile(null);
          addToast({
            type: 'info',
            title: 'Signed out',
            description: 'You have been signed out successfully.',
          });
          router.push('/auth/signin');
          break;
          
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
          break;
          
        case 'USER_UPDATED':
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
          break;
          
        case 'PASSWORD_RECOVERY':
          addToast({
            type: 'info',
            title: 'Password Recovery',
            description: 'Check your email for password reset instructions.',
          });
          break;
      }

      // Refresh the page to sync server and client
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, setUser, setSession, setProfile, setLoading, setInitialized, addToast]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is okay for new users
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(profile);
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        addToast({
          type: 'error',
          title: 'Sign Up Failed',
          description: error.message,
        });
        return { data: null, error };
      }

      if (data.user && !data.session) {
        addToast({
          type: 'info',
          title: 'Check Your Email',
          description: 'Please check your email to confirm your account.',
        });
      }

      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      addToast({
        type: 'error',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addToast({
          type: 'error',
          title: 'Sign In Failed',
          description: error.message,
        });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      addToast({
        type: 'error',
        title: 'Sign In Failed',
        description: errorMessage,
      });
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'discord') => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        addToast({
          type: 'error',
          title: 'Sign In Failed',
          description: error.message,
        });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      addToast({
        type: 'error',
        title: 'Sign In Failed',
        description: errorMessage,
      });
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        addToast({
          type: 'error',
          title: 'Sign Out Failed',
          description: error.message,
        });
        return { error };
      }

      storeSignOut();
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      addToast({
        type: 'error',
        title: 'Sign Out Failed',
        description: errorMessage,
      });
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        addToast({
          type: 'error',
          title: 'Reset Failed',
          description: error.message,
        });
        return { error };
      }

      addToast({
        type: 'success',
        title: 'Reset Email Sent',
        description: 'Check your email for password reset instructions.',
      });
      
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      addToast({
        type: 'error',
        title: 'Reset Failed',
        description: errorMessage,
      });
      return { error: { message: errorMessage } };
    }
  };

  const updatePassword = async (password: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        addToast({
          type: 'error',
          title: 'Update Failed',
          description: error.message,
        });
        return { error };
      }

      addToast({
        type: 'success',
        title: 'Password Updated',
        description: 'Your password has been updated successfully.',
      });
      
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: errorMessage,
      });
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        addToast({
          type: 'error',
          title: 'Update Failed',
          description: error.message,
        });
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: errorMessage,
      });
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    supabase,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}