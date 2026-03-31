'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.log('Firestore error:', error.message);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
        return userDoc.data();
      }
      throw new Error('User profile not found');
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (email, password, userData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const profileData = {
      uid: userCredential.user.uid,
      email,
      ...userData,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), profileData);
    setUserProfile(profileData);
    return profileData;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setUserProfile(null);
    router.push('/login');
  };

  const updateUserProfile = async (updates) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), updates);
      } catch (e) {
        throw new Error('Failed to update profile');
      }
      setUserProfile({ ...userProfile, ...updates });
    }
  };

  const changePassword = async (newPassword) => {
    if (user && !user.uid.startsWith('demo-')) {
      await updatePassword(user, newPassword);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
