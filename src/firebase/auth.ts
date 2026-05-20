import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";
import { ensureUserProfileExists } from "./firestore";
import { logAuditEvent } from "./audit";
import { getDemoUserProfile } from "./localStore";

const DEMO_AUTH_KEY = "kandahar_wms_demo_auth_user";
const DEMO_AUTH_EVENT = "kandahar-wms-demo-auth-change";

const safeRun = async (task: () => Promise<unknown>, label: string) => {
  try {
    await task();
  } catch (error) {
    console.warn(`${label} failed, but auth flow continued:`, error);
  }
};

const createDemoUser = (email: string): User => {
  const cleanEmail = email.trim() || "admin@kandahar.edu.af";
  return {
    uid: "demo-super-admin",
    email: cleanEmail,
    displayName: "Super Admin",
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as User["metadata"],
    providerData: [],
    refreshToken: "demo-refresh-token",
    tenantId: null,
    delete: async () => undefined,
    getIdToken: async () => "demo-token",
    getIdTokenResult: async () => ({ token: "demo-token" } as Awaited<ReturnType<User["getIdTokenResult"]>>),
    reload: async () => undefined,
    toJSON: () => ({ uid: "demo-super-admin", email: cleanEmail }),
    phoneNumber: null,
    photoURL: null,
    providerId: "demo",
  } as unknown as User;
};

const getStoredDemoUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { email?: string };
    return createDemoUser(parsed.email || "admin@kandahar.edu.af");
  } catch {
    return null;
  }
};

const notifyDemoAuthChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
  }
};

export const login = async (email: string, pass: string): Promise<User> => {
  const cleanEmail = email.trim();

  if (!isFirebaseConfigured) {
    const user = createDemoUser(cleanEmail);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify({ email: user.email }));
      getDemoUserProfile(user.email);
      notifyDemoAuthChanged();
    }
    return user;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    await safeRun(
      () => ensureUserProfileExists(user.uid, user.email || cleanEmail),
      "Ensure user profile"
    );

    safeRun(
      () => logAuditEvent(user.uid, user.email || cleanEmail, "login"),
      "Login audit log"
    );

    return user;
  } catch (error: any) {
    console.error("Login error:", error);
    throw error;
  }
};

export const register = async (email: string, pass: string, name: string): Promise<User> => {
  const cleanEmail = email.trim();

  if (!isFirebaseConfigured) {
    const user = createDemoUser(cleanEmail);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify({ email: user.email }));
      getDemoUserProfile(user.email);
      notifyDemoAuthChanged();
    }
    return user;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    await safeRun(
      () => ensureUserProfileExists(user.uid, user.email || cleanEmail, name),
      "Create user profile"
    );

    safeRun(
      () => logAuditEvent(user.uid, user.email || cleanEmail, "signup"),
      "Signup audit log"
    );

    return user;
  } catch (error: any) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  if (!isFirebaseConfigured) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DEMO_AUTH_KEY);
      notifyDemoAuthChanged();
    }
    return;
  }

  const currentUser = auth.currentUser;
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Logout error:", error);
    throw error;
  } finally {
    if (currentUser) {
      safeRun(
        () => logAuditEvent(currentUser.uid, currentUser.email || "", "logout"),
        "Logout audit log"
      );
    }
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!isFirebaseConfigured) {
    callback(getStoredDemoUser());
    const handler = () => callback(getStoredDemoUser());
    window.addEventListener(DEMO_AUTH_EVENT, handler);
    return () => window.removeEventListener(DEMO_AUTH_EVENT, handler);
  }

  return onAuthStateChanged(auth, callback);
};

export const loginUser = login;
export const logoutUser = logout;
