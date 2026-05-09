import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// INSTRUCTIONS: 
// 1. Open your app and log in with Google.
// 2. Open browser console (F12) and copy the "Logged in UID".
// 3. Paste it in the variable below.
// 4. Run: npx tsx seed_admin.ts

const YOUR_UID = "REPLACE_WITH_YOUR_UID"; 

async function seed() {
  if (YOUR_UID === "REPLACE_WITH_YOUR_UID") {
    console.error("ERROR: Debes colocar tu UID en la constante YOUR_UID.");
    process.exit(1);
  }

  console.log(`Setting up admin for UID: ${YOUR_UID}...`);
  
  try {
    await setDoc(doc(db, 'admins', YOUR_UID), {
      email: "joseacostafilms@gmail.com",
      role: "owner",
      createdAt: serverTimestamp()
    });
    console.log("SUCCESS: Ya eres administrador. Reinicia la app.");
  } catch (e) {
    console.error("Error setting up admin: ", e);
  }
  process.exit(0);
}

seed();
