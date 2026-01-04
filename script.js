// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQuGUV1A7esCJRkPhcAP6i2UStvdJw-Zg",
  authDomain: "pkpd-database.firebaseapp.com",
  databaseURL: "https://pkpd-database-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pkpd-database",
  storageBucket: "pkpd-database.firebasestorage.app",
  messagingSenderId: "280364999020",
  appId: "1:280364999020:web:f565467add14c0c4851349",
  measurementId: "G-BDGVRP0DJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
