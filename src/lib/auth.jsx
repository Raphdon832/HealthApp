import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { sendVerification } from './email';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // {role: 'customer'|'pharmacy', displayName, ...}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile;
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }
      if (u) {
        const ref = doc(db, 'users', u.uid);
        unsubscribeProfile = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data());
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const signUp = async ({ email, password, displayName, role, address, lat, lon, phone }) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(user, { displayName });
    const userData = { uid: user.uid, email, displayName, role };
    if (address) userData.address = address;
    if (lat) userData.lat = lat;
    if (lon) userData.lon = lon;
    if (phone) userData.phoneNumber = phone;
    await setDoc(doc(db, 'users', user.uid), userData);
    if (role === 'pharmacy') {
      await setDoc(doc(db, 'pharmacies', user.uid), { id: user.uid, name: displayName || 'Pharmacy', email, address: address || '', etaMins: 30, phone: '' });
    }
    await sendVerification(user);
    return { user, verificationSent: true };
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    // Configure the provider for better UX
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      console.log('Attempting Google sign-in...');
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user.email);
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/internal-error') {
        throw new Error('Google sign-in is not properly configured. Please contact support.');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('Google sign-in configuration missing. Please contact support.');
      }
      
      // Re-throw the original error for debugging
      throw error;
    }
  };

  const signUpWithGoogle = async (userLocation) => {
    const provider = new GoogleAuthProvider();
    
    // Configure the provider for better UX
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      console.log('Attempting Google registration/sign-in...');
      const result = await signInWithPopup(auth, provider);
      const { user } = result;
      console.log('Google auth successful for:', user.email);
      
      // Check if this is a new user by looking for existing profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('Creating new customer profile for:', user.email);
        // Completely new user - create profile with location-based address
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Google User',
          role: 'customer',
          address: userLocation?.address || 'Location not available',
          lat: userLocation?.latitude,
          lon: userLocation?.longitude,
          createdAt: new Date().toISOString(),
          authMethod: 'google'
        };
        
        await setDoc(userRef, userData);
        console.log('New customer profile created successfully');
        
        // No need to send verification for Google users
        return { user, verificationSent: false, isNewUser: true };
      } else {
        console.log('Existing user found:', user.email);
        // Existing user - check if they're a customer
        const existingData = userSnap.data();
        
        if (existingData.role !== 'customer') {
          // User exists but is not a customer - this shouldn't happen in customer registration
          throw new Error('This email is associated with a pharmacy account. Please use pharmacy sign-in instead.');
        }
        
        // Existing customer - just sign them in
        return { user, verificationSent: false, isNewUser: false, existingCustomer: true };
      }
    } catch (error) {
      console.error('Google registration/sign-in error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/account-exists-with-different-credential') {
        // This means the email exists with a different sign-in method (email/password)
        throw new Error('An account with this email already exists. Please sign in with your email and password instead, or use the "Sign In with Google" option.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/internal-error') {
        throw new Error('Google sign-in is not properly configured. Please contact support.');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('Google sign-in configuration missing. Please contact support.');
      }
      
      // Re-throw the original error for debugging
      throw error;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, profile, loading, signIn, signUp, signInWithGoogle, signUpWithGoogle, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
