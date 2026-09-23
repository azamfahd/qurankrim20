import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer, 
  onSnapshot 
} from 'firebase/firestore';
import { Bookmark, ChatSession, UserSettings } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyArrm3AkW24fFHo0jGcZ_5c_RJuEgrlXuY",
  authDomain: "accounting-828e5.firebaseapp.com",
  projectId: "accounting-828e5",
  storageBucket: "accounting-828e5.firebasestorage.app",
  messagingSenderId: "1026973565471",
  appId: "1:1026973565471:web:1bbae86f003f6352d0cb2a",
  firestoreDatabaseId: "(default)"
};

// 1. Initialize Firebase App securely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// 3. Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
}

// Validate connection to Firestore on app startup
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('🔥 [Firebase] Firestore connection verified successfully!');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('🔥 [Firebase] Firestore client running in offline mode.');
    } else {
      console.info('🔥 [Firebase] Connection probe completed:', error);
    }
    return false;
  }
}

// Firebase Auth Service Helpers
export class FirebaseService {
  /**
   * Sign in using Google OAuth Popup
   */
  static async signInWithGoogle(): Promise<User | null> {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Sync user profile to Firestore
        await this.saveUserProfile(result.user);
      }
      return result.user;
    } catch (error) {
      console.error('Firebase Google Sign-In Error:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  static async signOutUser(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Firebase Sign-Out Error:', error);
    }
  }

  /**
   * Listen to Firebase Auth state changes
   */
  static onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        this.saveUserProfile(user).catch(err => console.warn('User profile sync note:', err));
      }
      callback(user);
    });
  }

  /**
   * Save / Sync User Profile document to `users/{userId}`
   */
  static async saveUserProfile(user: User): Promise<void> {
    if (!user || !user.uid) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'مستخدم أنيس القلوب',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Save User App Data (bookmarks, notes, settings) to `user_data/{userId}`
   */
  static async saveUserData(userId: string, data: {
    bookmarks?: Bookmark[];
    sessions?: ChatSession[];
    settings?: Partial<UserSettings>;
  }): Promise<void> {
    if (!userId) return;
    const path = `user_data/${userId}`;
    try {
      await setDoc(doc(db, 'user_data', userId), {
        userId,
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('🔥 [Firebase] User data synced successfully to Firestore!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * Fetch User App Data from `user_data/{userId}`
   */
  static async getUserData(userId: string): Promise<any | null> {
    if (!userId) return null;
    const path = `user_data/${userId}`;
    try {
      const docSnap = await getDoc(doc(db, 'user_data', userId));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  /**
   * Subscribe to real-time updates for user app data
   */
  static subscribeToUserData(userId: string, callback: (data: any) => void) {
    if (!userId) return () => {};
    const path = `user_data/${userId}`;
    return onSnapshot(
      doc(db, 'user_data', userId), 
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data());
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }
}
