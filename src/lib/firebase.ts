import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Export Storage
export const storage = getStorage(app);

