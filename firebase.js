const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD7RwL8kwQ91P1vcPhXnxFNFIDQsWdUfhE",
  authDomain: "ad-hoc-d078c.firebaseapp.com",
  projectId: "ad-hoc-d078c",
  storageBucket: "ad-hoc-d078c.firebasestorage.app",
  messagingSenderId: "485452494263",
  appId: "1:485452494263:web:038a30628b871f3d7a6432"
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const auth = firebase.auth();