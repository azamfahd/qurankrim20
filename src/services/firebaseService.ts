import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: "wide-honor-1v7sv",
  appId: "1:744795722163:web:b079d3125368f0d4713bc6",
  apiKey: "AIzaSyDEsTiGIChlkO9LVGq95s1isWlogFCPDpU",
  authDomain: "wide-honor-1v7sv.firebaseapp.com",
  storageBucket: "wide-honor-1v7sv.firebasestorage.app",
  messagingSenderId: "744795722163"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-6a2f14db-5e96-44db-85fc-8413a4d56af2");
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });
    }
    return result.user;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function syncUserDataToCloud(userId: string, data: any): Promise<void> {
  try {
    const userDocRef = doc(db, 'user_data', userId);
    await setDoc(userDocRef, {
      userId,
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error syncing user data to Firebase cloud:', error);
  }
}

export async function fetchUserDataFromCloud(userId: string): Promise<any | null> {
  try {
    const userDocRef = doc(db, 'user_data', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data from Firebase cloud:', error);
    return null;
  }
}
