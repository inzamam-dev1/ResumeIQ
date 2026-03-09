import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase.js";

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);   // Firebase user object
  const [profile, setProfile]     = useState(null);   // Firestore user doc
  const [loading, setLoading]     = useState(true);   // Initial auth check

  // ── Listen to Firebase auth state ─────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe; // cleanup on unmount
  }, []);

  // ── Load user profile from Firestore ──────────────────────────────────────
  async function loadProfile(uid) {
    try {
      const ref  = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data());
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  }

  // ── Create Firestore user doc on first signup ──────────────────────────────
  async function createUserDoc(uid, name, email) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const data = {
        name,
        email,
        plan: "free",
        scansUsed: 0,
        scansResetAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, data);
      setProfile(data);
    } else {
      setProfile(snap.data());
    }
  }

  // ── Sign up with email + password ──────────────────────────────────────────
  async function signup(email, password, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await createUserDoc(result.user.uid, name, email);
    return result.user;
  }

  // ── Log in with email + password ──────────────────────────────────────────
  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(result.user.uid);
    return result.user;
  }

  // ── Sign in with Google ────────────────────────────────────────────────────
  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const { uid, displayName, email } = result.user;
    await createUserDoc(uid, displayName || email.split("@")[0], email);
    return result.user;
  }

  // ── Log out ────────────────────────────────────────────────────────────────
  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  // ── Send password reset email ──────────────────────────────────────────────
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  // ── Increment scan count (enforce free tier limit) ─────────────────────────
  async function incrementScanCount() {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data       = snap.data();
    const newCount   = (data.scansUsed || 0) + 1;
    await setDoc(ref, { scansUsed: newCount }, { merge: true });
    setProfile(prev => ({ ...prev, scansUsed: newCount }));
  }

  // ── Check if user can scan (free = 3/month) ────────────────────────────────
  function canScan() {
    if (!profile) return true;
    if (profile.plan === "premium") return true;
    return (profile.scansUsed || 0) < 3;
  }

  // ── Upgrade plan (called after Stripe payment — for now manual) ────────────
  async function upgradeToPremium() {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, { plan: "premium" }, { merge: true });
    setProfile(prev => ({ ...prev, plan: "premium" }));
  }

  async function downgradeToFree() {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, { plan: "free" }, { merge: true });
    setProfile(prev => ({ ...prev, plan: "free" }));
  }

  const value = {
    user,
    profile,
    loading,
    plan: profile?.plan || "free",
    scansUsed: profile?.scansUsed || 0,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    incrementScanCount,
    canScan,
    upgradeToPremium,
    downgradeToFree,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
