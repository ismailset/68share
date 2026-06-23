import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBBCaFO7ROBt5RPOIDTwXx3mHBWZg1POHA",
  authDomain: "gen-lang-client-0211367334.firebaseapp.com",
  projectId: "gen-lang-client-0211367334",
  storageBucket: "gen-lang-client-0211367334.firebasestorage.app",
  messagingSenderId: "429661434880",
  appId: "1:429661434880:web:fc92caa4877a71821fd4e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from the config (it uses a non-default database id: "ai-studio-8d94d414-404c-4149-9e38-6a6165d13f8b")
export const db = getFirestore(app, "ai-studio-8d94d414-404c-4149-9e38-6a6165d13f8b");
