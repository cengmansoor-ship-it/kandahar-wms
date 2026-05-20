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
import { getDemoUserProfile, DEMO_SEED_USERS } from "./localStore";

const DEMO_AUTH_KEY = "kandahar_wms_demo_auth_user";
const DEMO_AUTH_EVENT = "kandahar-wms-demo-auth-change";

const safeRun = async (task: () => Promise<unknown>, label: string) => {
  try {
    await task();
  } catch (error) {
    console.warn(`${label} failed, but auth flow continued:`, error);
  }
};

const createDemoUser = (email: string, uid?: string, displayName?: string): User => {
  const cleanEmail = email.trim() || "superadmin@ku.edu.af";
  return {
    uid: uid || "seed_super_admin",
    email: cleanEmail,
    displayName: displayName || "Super Admin",
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
    toJSON: () => ({ uid: uid || "seed_super_admin", email: cleanEmail }),
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
    const parsed = JSON.parse(raw) as { email?: string; uid?: string; displayName?: string };
    return createDemoUser(
      parsed.email || "superadmin@ku.edu.af",
      parsed.uid,
      parsed.displayName
    );
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
  const cleanEmail = email.trim().toLowerCase();

  if (!isFirebaseConfigured) {
    const matched = DEMO_SEED_USERS.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matched) {
      const err: any = new Error("auth/user-not-found");
      err.code = "auth/user-not-found";
      throw err;
    }

    if (matched.password !== pass) {
      const err: any = new Error("auth/wrong-password");
      err.code = "auth/wrong-password";
      throw err;
    }

    const user = createDemoUser(matched.email, matched.uid, matched.name);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify({
        email: matched.email,
        uid: matched.uid,
        displayName: matched.name,
      }));
      getDemoUserProfile(matched.email);
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
