import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // [필수]

const firebaseConfig = {
  apiKey: "AIzaSyACXIzFFN2iqX5K2s36y7vYZ19WFZEMqKw",
  authDomain: "matflow-v1.firebaseapp.com",
  projectId: "matflow-v1",
  storageBucket: "matflow-v1.firebasestorage.app", // [필수] 버킷 주소 확인
  messagingSenderId: "842083600726",
  appId: "1:842083600726:web:2a5ae7aac1a449e12b6ef7",
  measurementId: "G-EP2RZ01WVV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // [필수] 내보내기