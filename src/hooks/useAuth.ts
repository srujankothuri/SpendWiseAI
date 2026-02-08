import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";

// ============================================
// useAuth HOOK
// ============================================
// Custom hook that manages all authentication state.
// Any component that needs to know if a user is logged in,
// or needs login/signup/logout functions, just calls:
//
//   const { user, session, loading, signIn, signUp, signOut } = useAuth();
//
// How it works:
// - On app start, it checks if there's an existing session (user was previously logged in)
// - It listens for auth state changes (login, logout, token refresh)
// - Provides functions for email/password auth

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    // This is what keeps users logged in after closing the app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    // Fires when: user logs in, logs out, or token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Cleanup listener when component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },  // this gets passed to our profile trigger
      },
    });
    return { data, error };
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    session,    // full session object (includes tokens)
    user,       // user object (id, email, metadata)
    loading,    // true while checking initial session
    signUp,
    signIn,
    signOut,
  };
}