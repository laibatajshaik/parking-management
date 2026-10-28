import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBGwP4YbEnK3QXceJfYxhmYaz-JtFyat4Y",
  authDomain: "shnoor-parking-system.firebaseapp.com",
  projectId: "shnoor-parking-system",
  storageBucket: "shnoor-parking-system.firebasestorage.app",
  messagingSenderId: "527247217014",
  appId: "1:527247217014:web:e903dc432dec79fbc72a57",
  measurementId: "G-BS09WJ9E6Z"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;