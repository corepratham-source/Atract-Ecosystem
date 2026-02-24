import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvoH4QjSTcpGCaaljb0SA23cvRdT_VT0w",
  authDomain: "atract-5fcea.firebaseapp.com",
  projectId: "atract-5fcea",
  storageBucket: "atract-5fcea.firebasestorage.app",
  messagingSenderId: "717049174465",
  appId: "1:717049174465:web:2af4fc72bd027ee440f740",
  measurementId: "G-3211H3LF91"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
