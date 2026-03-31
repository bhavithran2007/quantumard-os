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
import { initDemoUsers } from '@/lib/initFirebase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Demo users for fallback authentication
const DEMO_CREDENTIALS = {
  'admin@quantumard.com': { password: 'admin123', role: 'admin', name: 'Admin User', uid: 'demo-admin' },
  'manager@quantumard.com': { password: 'manager123', role: 'manager', name: 'Deepak Singh', uid: 'demo-manager' },
  'employee@quantumard.com': { password: 'employee123', role: 'employee', name: 'Arjun Developer', uid: 'demo-employee' },
  'client@quantumard.com': { password: 'client123', role: 'client', name: 'Rajesh Kumar', uid: 'demo-client', company: 'TechLearn Academy', onboardingComplete: false }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Try to initialize demo users
    initDemoUsers().catch(() => {});

    // Check for demo user in localStorage
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      try {
        const profile = JSON.parse(demoUser);
        setUser({ uid: profile.uid, email: profile.email });
        setUserProfile(profile);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('demoUser');
      }
    }

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
          console.log('Firestore not available, using demo mode');
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
      // First try Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
        return userDoc.data();
      }
      throw new Error('User profile not found');
    } catch (error) {
      // Fallback to demo credentials
      if (DEMO_CREDENTIALS[email] && DEMO_CREDENTIALS[email].password === password) {
        const demoProfile = {
          uid: DEMO_CREDENTIALS[email].uid,
          email,
          name: DEMO_CREDENTIALS[email].name,
          role: DEMO_CREDENTIALS[email].role,
          bio: `Demo ${DEMO_CREDENTIALS[email].role}`,
          createdAt: new Date().toISOString(),
          status: 'active',
          ...(DEMO_CREDENTIALS[email].company && { company: DEMO_CREDENTIALS[email].company }),
          ...(DEMO_CREDENTIALS[email].onboardingComplete !== undefined && { onboardingComplete: DEMO_CREDENTIALS[email].onboardingComplete })
        };
        
        setUser({ uid: demoProfile.uid, email });
        setUserProfile(demoProfile);
        localStorage.setItem('demoUser', JSON.stringify(demoProfile));
        return demoProfile;
      }
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
    localStorage.removeItem('demoUser');
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
        // Demo mode - update localStorage
        const demoUser = localStorage.getItem('demoUser');
        if (demoUser) {
          const profile = JSON.parse(demoUser);
          const updated = { ...profile, ...updates };
          localStorage.setItem('demoUser', JSON.stringify(updated));
          setUserProfile(updated);
          return;
        }
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