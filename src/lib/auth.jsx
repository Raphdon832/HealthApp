import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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

  const signUp = async ({ email, password, displayName, role, address, lat, lon }) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(user, { displayName });
    const userData = { uid: user.uid, email, displayName, role };
    if (address) userData.address = address;
    if (lat) userData.lat = lat;
    if (lon) userData.lon = lon;
    await setDoc(doc(db, 'users', user.uid), userData);
    if (role === 'pharmacy') {
      await setDoc(doc(db, 'pharmacies', user.uid), { id: user.uid, name: displayName || 'Pharmacy', email, address: address || '', etaMins: 30, phone: '' });
    }
    await sendVerification(user);
    return { user, verificationSent: true };
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
  };

  const signUpWithGoogle = async (userLocation) => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const { user } = result;
    
    // Check if this is a new user by looking for existing profile
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // New user - create profile with location-based address
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'customer',
        address: userLocation?.address || 'Location not available',
        lat: userLocation?.latitude,
        lon: userLocation?.longitude
      };
      
      await setDoc(userRef, userData);
      
      // No need to send verification for Google users
      return { user, verificationSent: false, isNewUser: true };
    } else {
      // Existing user
      return { user, verificationSent: false, isNewUser: false };
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, profile, loading, signIn, signUp, signInWithGoogle, signUpWithGoogle, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}