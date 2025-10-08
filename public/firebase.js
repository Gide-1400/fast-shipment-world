// firebase.js - الإصدار المحدث مع دعم كامل
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCkr2Yy_HP_l1x_Hber8EPxQb9h6oabJyM",
    authDomain: "fastship-new.firebaseapp.com",
    projectId: "fastship-new",
    storageBucket: "fastship-new.firebasestorage.app",
    messagingSenderId: "977835487089",
    appId: "1:977835487089:web:b7533c67af3f379df0d0d0",
    measurementId: "G-79LYR6CWBP"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة الخدمات
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// تصدير الدوال والخدمات
export { 
    app,
    auth, 
    db, 
    storage,
    googleProvider,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    signInWithPopup,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL
};

// دالة المساعدة للتحقق من اتصال Firebase
export const checkFirebaseConnection = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'test'));
        return true;
    } catch (error) {
        console.error('Firebase connection error:', error);
        return false;
    }
};

// دالة المساعدة لمعالجة الأخطاء
export const getFirebaseError = (error) => {
    const errorMessages = {
        'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
        'auth/invalid-email': 'بريد إلكتروني غير صالح',
        'auth/operation-not-allowed': 'عملية غير مسموحة',
        'auth/weak-password': 'كلمة المرور ضعيفة جداً',
        'auth/user-disabled': 'هذا الحساب معطل',
        'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني',
        'auth/wrong-password': 'كلمة المرور غير صحيحة',
        'auth/too-many-requests': 'محاولات تسجيل دخول كثيرة، حاول لاحقاً',
        'auth/network-request-failed': 'خطأ في الشبكة، تحقق من اتصالك',
        'permission-denied': 'ليس لديك صلاحية للقيام بهذه العملية',
        'unavailable': 'الخدمة غير متوفرة حالياً'
    };
    
    return errorMessages[error.code] || error.message || 'حدث خطأ غير متوقع';
};
