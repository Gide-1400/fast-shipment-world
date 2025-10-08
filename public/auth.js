import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from './firebase.js';

// التحقق من صلاحيات قبل إنشاء شحنة
export function checkAuthThenCreateShipment() {
    const user = auth.currentUser;
    if (!user) {
        showAlert('يرجى تسجيل الدخول أولاً لإنشاء شحنة', 'warning');
        showLogin();
        return;
    }
    document.getElementById('quickShipment').scrollIntoView({ behavior: 'smooth' });
}

export function checkAuthThenBecomeCarrier() {
    const user = auth.currentUser;
    if (!user) {
        showAlert('يرجى تسجيل الدخول أولاً لتسجيل كناقل', 'warning');
        showLogin();
        return;
    }
    window.location.href = 'carrier.html';
}

// تسجيل الدخول
export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        showAlert('يرجى إدخال البريد وكلمة المرور', 'error');
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showAlert('تم تسجيل الدخول بنجاح', 'success');
        closeModal('loginModal');
        updateUIForAuthenticatedUser();
    } catch (error) {
        showAlert(getFirebaseError(error), 'error');
    }
}

// التسجيل
export async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const type = document.getElementById('regType').value;
    const password = document.getElementById('regPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    if (!name || !email || !phone || !type || !password) {
        showAlert('يرجى ملء جميع الحقول', 'error');
        return;
    }
    if (!agreeTerms) {
        showAlert('يجب الموافقة على الشروط والأحكام', 'error');
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

        showAlert('تم إنشاء الحساب بنجاح', 'success');
        closeModal('registerModal');
        updateUIForAuthenticatedUser();
    } catch (error) {
        showAlert(getFirebaseError(error), 'error');
    }
}

// تسجيل الدخول بـ Google
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

        showAlert('تم تسجيل الدخول بنجاح', 'success');
        closeModal('loginModal');
        updateUIForAuthenticatedUser();
    } catch (error) {
        showAlert(getFirebaseError(error), 'error');
    }
}

export async function registerWithGoogle() {
    await loginWithGoogle();
}

// تحديث واجهة المستخدم بعد تسجيل الدخول
export function updateUIForAuthenticatedUser() {
    const user = auth.currentUser;
    if (!user) return;

    const authButtons = document.getElementById('authButtons');
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn-secondary" onclick="window.location.href='dashboard.html'">
                <i class="fas fa-tachometer-alt"></i> <span data-i18n="nav.dashboard">لوحة التحكم</span>
            </button>
            <button class="btn-logout" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> <span data-i18n="auth.logout">تسجيل الخروج</span>
            </button>
        `;
        if (window.i18n) window.i18n.applyTranslations();
    }
}

// تسجيل الخروج
export async function logout() {
    try {
        await signOut(auth);
        showAlert('تم تسجيل الخروج بنجاح', 'success');
        setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
        showAlert('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// نوافذ منبثقة
export function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}
export function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
}
export function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}
export function switchToRegister() {
    closeModal('loginModal');
    showRegister();
}
export function switchToLogin() {
    closeModal('registerModal');
    showLogin();
}

// إظهار الأخطاء
function showAlert(message, type = 'info') {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

// معالجة أخطاء Firebase
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