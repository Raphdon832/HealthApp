import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendVerification } from './email';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // {role: 'customer'|'pharmacy', displayName, ...}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setProfile(snap.data());
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const signUp = async ({ email, password, displayName, role }) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(user, { displayName });
    await setDoc(doc(db, 'users', user.uid), { uid: user.uid, email, displayName, role });
    if (role === 'pharmacy') {
      await setDoc(doc(db, 'pharmacies', user.uid), { id: user.uid, name: displayName || 'Pharmacy', email, address: '', etaMins: 30, phone: '' });
    }
    await sendVerification(user);
    return { user, verificationSent: true };
  };

  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, profile, loading, signIn, signUp, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}