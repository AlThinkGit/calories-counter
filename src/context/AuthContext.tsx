import React, { createContext, useState, useCallback, useEffect, useContext } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getAuthMessage, getStoredLanguage } from "../i18n";
import { getUserProfile, updateUserProfile } from "../../services/calorieLogService";

interface RegisterPayload {
  email: string;
  password: string;
  nickname: string;
}

interface AuthContextType {
  currentUser: User | null;
  authLoading: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberSession?: boolean) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  authLoading: true,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string, rememberSession = true) => {
    setLoading(true);
    setError(null);
    try {
      await setPersistence(
        auth,
        rememberSession ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Firebase login error:", err?.code, err?.message);
      setError(getAuthMessage(err?.code, getStoredLanguage()));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ email, password, nickname }: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: nickname.trim() });
      const existingProfile = await getUserProfile(credential.user.uid);
      await updateUserProfile(credential.user.uid, { ...existingProfile, displayName: nickname.trim() });
    } catch (err: any) {
      console.error("Firebase register error:", err?.code, err?.message);
      setError(getAuthMessage(err?.code, getStoredLanguage()));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};