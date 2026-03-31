// Firebase initialization script - creates demo users
// Run this once to set up your Firebase with demo accounts

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDkE1YUTPPwHdfeQgKxj0Sf7fJrtmsX030",
  authDomain: "quantumard-os.firebaseapp.com",
  projectId: "quantumard-os",
  storageBucket: "quantumard-os.firebasestorage.app",
  messagingSenderId: "794070720610",
  appId: "1:794070720610:web:9185fc320685b192ab313b",
  measurementId: "G-5J3Q3QR928"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const demoUsers = [
  {
    email: 'admin@quantumard.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    bio: 'System Administrator with full access',
    phone: '+1 234 567 8900'
  },
  {
    email: 'manager@quantumard.com',
    password: 'manager123',
    name: 'Deepak Singh',
    role: 'manager',
    bio: 'Project Manager handling multiple teams',
    phone: '+91 98765 43210'
  },
  {
    email: 'employee@quantumard.com',
    password: 'employee123',
    name: 'Arjun Developer',
    role: 'employee',
    bio: 'Full Stack Developer',
    phone: '+91 87654 32109'
  }
];

async function setupFirebase() {
  console.log('🔥 Starting Firebase setup...\n');

  for (const userData of demoUsers) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const uid = userCredential.user.uid;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        bio: userData.bio,
        phone: userData.phone,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  ${userData.email} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }
  }

  console.log('\n✨ Firebase setup complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('Admin    : admin@quantumard.com / admin123');
  console.log('Manager  : manager@quantumard.com / manager123');
  console.log('Employee : employee@quantumard.com / employee123');
  process.exit(0);
}

setupFirebase();
