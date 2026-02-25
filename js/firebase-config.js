// Your Firebase configuration (replace with your own from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyA3y3QLa89nJGrhhz7EdY9uXHrwG7qXX_s",
    authDomain: "quize-platform-b5154.firebaseapp.com",
    projectId: "quize-platform-b5154",
    storageBucket: "quize-platform-b5154.appspot.com",
    messagingSenderId: "93074908972",
    appId: "1:93074908972:web:4050c53757e5f62011ee89",
    measurementId: "G-Q1MKKV83QR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();