// firebase.js - الإصدار المبسط
// لا نستخدم import/export لأن Netlify ما يدعمه

// تهيئة Firebase مباشرة
const firebaseConfig = {
    apiKey: "AIzaSyCkr2Yy_HP_l1x_Hber8EPxQb9h6oabJyM",
    authDomain: "fastship-new.firebaseapp.com",
    projectId: "fastship-new",
    storageBucket: "fastship-new.firebasestorage.app",
    messagingSenderId: "977835487089",
    appId: "1:977835487089:web:b7533c67af3f379df0d0d0"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}