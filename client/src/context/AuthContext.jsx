import React, { createContext, useEffect, useState } from "react";
import { auth, db, isFirebaseConfigured } from "../config/firebaseConfig";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      console.warn("[AuthContext] Firebase not available - running in demo mode");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up with email/password
  const signup = async (email, password, additionalData = {}) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error("Firebase is not configured. Please add your Firebase credentials to .env file.");
    }
    
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;
    
    // Store user data in Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      createdAt: serverTimestamp(),
      role: additionalData.role || "customer",
      lastLogin: serverTimestamp(),
      ...additionalData
    });
    
    return firebaseUser;
  };

  // Login with email/password
  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error("Firebase is not configured. Please add your Firebase credentials to .env file.");
    }
    
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;
    
    // Update last login in Firestore
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        lastLogin: serverTimestamp()
      },
      { merge: true }
    );
    
    return firebaseUser;
  };

  // Sign in with Google
  const googleSignIn = async (role = "customer") => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error("Firebase is not configured. Please add your Firebase credentials to .env file.");
    }
    
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    // Check if user exists in Firestore
    const docRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Create new user document
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        photoURL: firebaseUser.photoURL,
        createdAt: serverTimestamp(),
        role: role,
        lastLogin: serverTimestamp(),
        emailVerified: firebaseUser.emailVerified
      });
    } else {
      // Update last login
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        { lastLogin: serverTimestamp() },
        { merge: true }
      );
    }
    
    return firebaseUser;
  };

  // Logout
  const logout = async () => {
    if (!isFirebaseConfigured || !auth) {
      // Just clear local state if Firebase not available
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  // Listen for auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      console.warn("[AuthContext] Firebase not available - running in demo mode");
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          // Create user document if doesn't exist
          await setDoc(doc(db, "users", firebaseUser.uid), {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            createdAt: serverTimestamp(),
            role: "customer",
            lastLogin: serverTimestamp()
          });
        }
        
        // Set user with additional Firestore data
        const userData = docSnap.exists() ? docSnap.data() : {};
        setUser({
          ...firebaseUser,
          ...userData
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        googleSignIn,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
