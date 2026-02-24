import React, { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebaseConfig";
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

  // Sign up with email/password
  const signup = async (email, password, additionalData = {}) => {
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
  const logout = () => signOut(auth);

  // Listen for auth state changes
  useEffect(() => {
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
