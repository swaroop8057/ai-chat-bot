import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'askflow_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    // 1. If Supabase is configured, listen to Supabase Auth state changes
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          };
          setUser(authUser);
          setToken(session.access_token);
        } else {
          checkDemoFallback();
        }
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          };
          setUser(authUser);
          setToken(session.access_token);
          setIsDemoMode(false);
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Supabase is not configured, check local demo session
      checkDemoFallback();
      setLoading(false);
    }
  }, []);

  const checkDemoFallback = () => {
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
        setIsDemoMode(true);
      }
    } catch {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        setToken(data.session.access_token);
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        });
        setIsDemoMode(false);
      }
      return {};
    }

    // Demo / Sandbox fallback
    const demoUser: User = {
      id: '00000000-0000-0000-0000-000000000001',
      email: email.trim(),
      name: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') || 'AskFlow User',
    };
    const mockToken = btoa(JSON.stringify(demoUser));
    setUser(demoUser);
    setToken(mockToken);
    setIsDemoMode(true);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, token: mockToken }));
    return {};
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string; message?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        setUser({
          id: data.user!.id,
          email: data.user!.email || '',
          name: fullName.trim() || data.user!.email?.split('@')[0] || 'User',
        });
        setToken(data.session.access_token);
        setIsDemoMode(false);
      } else if (data.user && !data.session) {
        return {
          message: 'Signup successful! Please check your email to confirm your account, or sign in.',
        };
      }
      return {};
    }

    // Demo mode fallback
    const demoUser: User = {
      id: '00000000-0000-0000-0000-000000000001',
      email: email.trim(),
      name: fullName.trim() || 'AskFlow User',
    };
    const mockToken = btoa(JSON.stringify(demoUser));
    setUser(demoUser);
    setToken(mockToken);
    setIsDemoMode(true);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, token: mockToken }));
    return {};
  };

  const signOut = async (): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setToken(null);
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  const loginAsDemo = () => {
    const demoUser: User = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'alex.rivers@askflow.ai',
      name: 'Alex Rivers',
    };
    const mockToken = btoa(JSON.stringify(demoUser));
    setUser(demoUser);
    setToken(mockToken);
    setIsDemoMode(true);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, token: mockToken }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        loginAsDemo,
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
