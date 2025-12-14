import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Storage dinonaktifkan agar tidak perlu setup kartu kredit/billing
// import { getStorage } from "firebase/storage"; 

// --- PENTING: GANTI DATA DI BAWAH INI DENGAN CONFIG DARI FIREBASE CONSOLE KAMU ---
// Caranya: Buka Firebase Console -> Project Settings -> Scroll ke bawah (Your Apps) -> Copy config object
const firebaseConfig = {
  apiKey: "AIzaSyCE3ExjhfleyOFYlVuXo_M5RM9cr-m3UQA",
  authDomain: "emipazil-journey.firebaseapp.com",
  projectId: "emipazil-journey",
  storageBucket: "emipazil-journey.firebasestorage.app",
  messagingSenderId: "994010915938",
  appId: "1:994010915938:web:3a6ae186c18f63175d5d3b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// export const storage = getStorage(app);