import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoUser: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A virtual demo user for testing/preview when not connected to Supabase
const DEMO_USER: User = {
  id: 'demo-gate-aspirant',
  app_metadata: {},
  user_metadata: { name: 'GATE Aspirant' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'aspirant@gate-tracker.dev',
  role: 'authenticated',
} as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEMO_USER);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(DEMO_USER);
      setIsDemoUser(true);
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        setIsDemoUser(false);
      } else {
        setUser(DEMO_USER);
        setIsDemoUser(true);
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('Supabase getSession error:', err);
      setUser(DEMO_USER);
      setIsDemoUser(true);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        setIsDemoUser(false);
      } else {
        setUser(DEMO_USER);
        setIsDemoUser(true);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      showToast({
        type: 'warning',
        title: 'Demo Mode Active',
        message: 'Supabase credentials are not configured yet. Running in offline demo mode.',
      });
      setUser(DEMO_USER);
      setIsDemoUser(true);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      setSession(data.session);
      setIsDemoUser(false);
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
      showToast({
        type: 'warning',
        title: 'Demo Mode Active',
        message: 'Supabase is not configured yet. Sign up works in real cloud mode once keys are set.',
      });
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
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
        setIsDemoUser(false);
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
    setUser(DEMO_USER);
    setSession(null);
    setIsDemoUser(true);
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You are now in local demo mode.',
    });
  };

  const continueAsGuest = () => {
    setUser(DEMO_USER);
    setSession(null);
    setIsDemoUser(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemoUser,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        continueAsGuest,
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
