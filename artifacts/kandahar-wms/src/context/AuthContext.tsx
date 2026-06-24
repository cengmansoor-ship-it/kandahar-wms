import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToAuthChanges } from "../firebase/auth";
import { getUserProfile, UserProfile } from "../firebase/firestore";
import { isFirebaseConfigured } from "../firebase/firebase";
import { getDemoUserProfile } from "../firebase/localStore";
import { ROLES } from "../constants/roles";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fallbackProfile = (firebaseUser: User): UserProfile => ({
  uid: firebaseUser.uid,
  name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Super Admin",
  email: firebaseUser.email || "admin@kandahar.edu.af",
  phone: "",
  role: ROLES.SUPER_ADMIN,
  active: true,
  forcePasswordChange: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = () => {
    if (!isFirebaseConfigured && user?.email) {
      setProfile(getDemoUserProfile(user.email));
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setLoading(true);
      setError(null);

      try {
        if (!firebaseUser) {
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(firebaseUser);

        if (!isFirebaseConfigured) {
          setProfile(getDemoUserProfile(firebaseUser.email));
          return;
        }

        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile || fallbackProfile(firebaseUser));
      } catch (err) {
        console.error("Error fetching profile:", err);
        setProfile(firebaseUser ? fallbackProfile(firebaseUser) : null);
        setError("د کارونکي پروفایل په خوندي حالت کې بار شو.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for user profile changes from UserManagement (localStorage updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes("users") && !isFirebaseConfigured && user?.email) {
        setProfile(getDemoUserProfile(user.email));
      }
    };

    // Also listen for a custom event dispatched by UserManagement after saving
    const handleProfileUpdate = () => {
      if (!isFirebaseConfigured && user?.email) {
        setProfile(getDemoUserProfile(user.email));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wms_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wms_profile_updated", handleProfileUpdate);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
