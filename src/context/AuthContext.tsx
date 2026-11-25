import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { clearLegacyDemoStorage } from '../lib/storage';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    clearLegacyDemoStorage();

    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Supabase getSession error:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const err = new Error('Supabase is not configured. Please check your environment variables.');
      showToast({
        type: 'error',
        title: 'Configuration Missing',
        message: err.message,
      });
      return { error: err };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      setSession(data.session);
      showToast({
        type: 'success',
        title: 'Signed in successfully',
        message: `Welcome back, ${data.user?.email}`,
      });
      return { error: null };
    } catch (err: unknown) {
      const error = err as Error;
      showToast({
        type: 'error',
        title: 'Sign In Failed',
        message: error.message || 'Check your credentials and try again.',
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const err = new Error('Supabase is not configured. Please check your environment variables.');
      showToast({
        type: 'error',
        title: 'Configuration Missing',
        message: err.message,
      });
      return { error: err };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      if (data.user && !data.session) {
        showToast({
          type: 'info',
          title: 'Confirmation Email Sent',
          message: 'Please check your inbox to confirm your Tracker account.',
        });
      } else if (data.user) {
        setUser(data.user);
        setSession(data.session);
        showToast({
          type: 'success',
          title: 'Account Created',
          message: `Welcome to Tracker, ${data.user.email}!`,
        });
      }
      return { error: null };
    } catch (err: unknown) {
      const error = err as Error;
      showToast({
        type: 'error',
        title: 'Sign Up Failed',
        message: error.message || 'Could not create account.',
      });
      return { error };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    setSession(null);
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been signed out of Tracker.',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
