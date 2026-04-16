import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ── Messaging (client-only) ───────────────────────────────────────────────────
let messaging = null;

/**
 * Initialise FCM and return the messaging instance.
 * Safe to call multiple times — returns cached instance.
 */
export async function initMessaging() {
  if (typeof window === 'undefined') return null;
  if (messaging) return messaging;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
}

/**
 * Request notification permission and get FCM token.
 * Returns the token string or null.
 */
export async function getFCMToken() {
  try {
    const msg = await initMessaging();
    if (!msg) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Register our service worker first
    const swReg = await navigator.serviceWorker.register('/sw.js');

    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg
    });
    return token || null;
  } catch (err) {
    console.warn('FCM token error:', err);
    return null;
  }
}

/**
 * Listen for foreground messages.
 * @param {Function} callback — called with the payload
 * @returns unsubscribe function
 */
export async function onForegroundMessage(callback) {
  const msg = await initMessaging();
  if (!msg) return () => {};
  return onMessage(msg, callback);
}

export { app, auth, db, storage };
