// Initialize Firebase with demo users
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const DEMO_USERS = [
  {
    email: 'admin@quantumard.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    bio: 'System Administrator',
    phone: '+1 234 567 8900'
  },
  {
    email: 'manager@quantumard.com',
    password: 'manager123',
    name: 'Deepak Singh',
    role: 'manager',
    bio: 'Project Manager',
    phone: '+91 98765 43210',
    assignedClients: []
  },
  {
    email: 'employee@quantumard.com',
    password: 'employee123',
    name: 'Arjun Developer',
    role: 'employee',
    bio: 'Full Stack Developer',
    phone: '+91 87654 32109'
  },
  {
    email: 'client@quantumard.com',
    password: 'client123',
    name: 'Rajesh Kumar',
    role: 'client',
    bio: 'Client - TechLearn Academy',
    phone: '+91 99999 11111',
    company: 'TechLearn Academy',
    industry: 'EdTech',
    onboardingComplete: false,
    assignedManager: null
  }
];

export async function initDemoUsers() {
  try {
    for (const userData of DEMO_USERS) {
      try {
        // Try to sign in first
        await signInWithEmailAndPassword(auth, userData.email, userData.password);
        console.log(`✅ User exists: ${userData.email}`);
        auth.signOut(); // Sign out immediately
      } catch (signInError) {
        // User doesn't exist, create them
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
          );
          
          // Create Firestore document
          const { password, ...profileData } = userData;
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            ...profileData,
            createdAt: new Date().toISOString(),
            status: 'active'
          });
          
          console.log(`✅ Created user: ${userData.email}`);
          auth.signOut(); // Sign out immediately
        } catch (createError) {
          if (createError.code !== 'auth/email-already-in-use') {
            console.error(`Error creating ${userData.email}:`, createError.message);
          }
        }
      }
    }
  } catch (error) {
    console.log('Demo users initialization:', error.message);
  }
}

export { app, auth, db, storage };