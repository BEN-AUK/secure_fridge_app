// src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ 替换为你自己的配置
const firebaseConfig = {
    apiKey: "AIzaSyCnj6jaFXHgkWWcB6dxMHTp934g0VjHcVk",
    authDomain: "fridge-mvp-a32a5.firebaseapp.com",
    projectId: "fridge-mvp-a32a5",
    storageBucket: "fridge-mvp-a32a5.firebasestorage.app",
    messagingSenderId: "872229587572",
    appId: "1:872229587572:web:0aee9fca77a77cdca1df21"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);