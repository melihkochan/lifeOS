import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ data: any; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        // Email confirmation'ı devre dışı bırak (development için)
        // Production'da email confirmation açık olmalı
      },
    });
    return { data, error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Giriş hatası:', error);
      
      // Email confirmation hatası durumunda
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        // Email doğrulama linki gönder
        try {
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });
          
          if (resendError) {
            console.error('Email gönderme hatası:', resendError);
            return { 
              error: new Error('E-posta doğrulama linki gönderilemedi. Lütfen Supabase Dashboard\'da email confirmation\'ı kapatın veya e-postanızı kontrol edin.') as Error 
            };
          }
          
          return { 
            error: new Error('E-posta adresiniz doğrulanmamış. Doğrulama linki e-postanıza gönderildi. Lütfen e-postanızı kontrol edin.') as Error 
          };
        } catch (err) {
          return { 
            error: new Error('E-posta doğrulama hatası. Lütfen Supabase Dashboard\'da email confirmation\'ı kapatın.') as Error 
          };
        }
      }
      
      // Diğer hata mesajları
      if (error.message.includes('Invalid login credentials')) {
        return { error: new Error('E-posta veya şifre hatalı') as Error };
      }
    }
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
