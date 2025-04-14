import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase-client";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signUp: (email: string, password: string, fullname: string, username: string) => Promise<{ success: boolean, error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>;
  signOut: () => void;
  updateProfile: (full_name: string, username: string, avatar_url?: string, bio?: string) => Promise<{ success: boolean, error?: string }>;
  loading: boolean;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user || null);
    setLoading(false); // loading is false AFTER we check once
  };

  getSession();

    // Set up auth listener
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!error && data) {
      setProfile(data);
    }
  };

  const signUp = async (email: string, password: string, fullname: string, username: string) => {
    try {
      // setLoading(true);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullname,
            username: username,
          },
        },
      });

      if (signUpError || !signUpData.user) {
        return { success: false, error: signUpError?.message || "Sign up failed" };
      }

      // Insert user into profiles table with default avatar_url and bio
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: signUpData.user.id,
          email,
          full_name: fullname,
          username,
          avatar_url: "", // default empty
          bio: "",        // default empty
        },
      ]);

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      await fetchUserProfile(signUpData.user.id);
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "An unknown error occurred" };
    } 
  };

  const signIn = async (email: string, password: string) => {
    try {
      // setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || "Sign in failed" };
      }

      await fetchUserProfile(data.user.id);
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "An unknown error occurred" };
    } 
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const updateProfile = async (full_name: string, username: string, avatar_url?: string, bio?: string) => {
    try {
      if (!user) return { success: false, error: "Not logged in" };

      const updates: Partial<Profile> = {
        full_name,
        username,
      };

      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (bio !== undefined) updates.bio = bio;

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) return { success: false, error: error.message };

      await fetchUserProfile(user.id);
      return { success: true };
    } catch (error) {
      if (error instanceof Error) return { success: false, error: error.message };
      return { success: false, error: "An unknown error occurred" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, signUp, signIn, signOut, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within the AuthProvider");
  }
  return context;
};
