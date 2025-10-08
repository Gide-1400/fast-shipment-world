import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, collection, addDoc, serverTimestamp, getDocs, query, where } from './firebase.js';

// ✅ تسجيل دخول بـ Email
export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert('يرجى إدخال البيميل وكلمة المرور');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('✅ تم تسجيل الدخول بنجاح');
        document.getElementById('loginModal').style.display = 'none';
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(getFirebaseError(error));
    }
}

// ✅ التسجيل الجديد
export async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const type = document.getElementById('regType').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !phone || !type || !password) {
        alert('يرجى ملء جميع الحقول');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        await addDoc(collection(db, 'users'), {
            uid: user.uid,
            name,
            email,
            phone,
            type,
            createdAt: serverTimestamp(),
            rating: 5.0,
            verified: false
        });

        alert('✅ تم إنشاء الحساب بنجاح');
        document.getElementById('registerModal').style.display = 'none';
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(getFirebaseError(error));
    }
}

// ✅ تسجيل دخول بـ Google
export async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const snap = await getDocs(q);

        if (snap.empty) {
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                type: 'sender',
                createdAt: serverTimestamp(),
                rating: 5.0,
                verified: false
            });
        }

        alert('✅ تم تسجيل الدخول بنجاح');
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert(getFirebaseError(error));
        console.error('Google login error:', error);
    }
}

// ✅ تسجيل الخروج
window.logout = async function() {
    try {
        await signOut(auth);
        alert('✅ تم تسجيل الخروج بنجاح');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
        alert('حدث خطأ أثناء تسجيل الخروج');
    }
};

// ✅ معالجة الأخطاء
export function getFirebaseError(error) {
    const errors = {
        'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
        'auth/invalid-email': 'بريد إلكتروني غير صالح',
        'auth/weak-password': 'كلمة المرور ضعيفة',
        'auth/user-not-found': 'لا يوجد حساب بهذا البريد',
        'auth/wrong-password': 'كلمة المرور غير صحيحة'
    };
    return errors[error.code] || error.message || 'حدث خطأ غير متوقع';
}

// ✅ نوافذ منبثقة
window.showLogin = function() {
    document.getElementById('loginModal').style.display = 'block';
};

window.showRegister = function() {
    document.getElementById('registerModal').style.display = 'block';
};