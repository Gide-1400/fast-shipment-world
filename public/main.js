import { auth, db, collection, addDoc, query, where, onSnapshot, serverTimestamp, getDocs } from './firebase.js';

export function initializeApp() {
    setupAuthListener();
    loadRealtimeStats();
    loadUserData();
    setupShipmentForm();
}

// ✅ بيانات المستخدم الحقيقية
async function loadUserData() {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'users'), where('uid', '==', user.uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const doc = snap.docs[0].data();
        document.getElementById('userName').textContent = doc.name || 'المستخدم';
        document.getElementById('userType').textContent = doc.type === 'sender' ? 'مرسل' : doc.type === 'carrier' ? 'ناقل' : 'مرسل وناقل';
    }
}

// ✅ الإحصائيات الحقيقية
function loadRealtimeStats() {
    const shipmentsRef = collection(db, 'shipments');
    const carriersRef = collection(db, 'users');

    onSnapshot(shipmentsRef, snap => {
        document.getElementById('statsShipments').textContent = snap.size;
    });

    onSnapshot(query(carriersRef, where('type', 'in', ['carrier', 'both'])), snap => {
        document.getElementById('statsCarriers').textContent = snap.size;
    });
}

// ✅ تسجيل الدخول + التسجيل
window.showLogin = function() {
    document.getElementById('loginModal').style.display = 'block';
};

window.showRegister = function() {
    document.getElementById('registerModal').style.display = 'block';
};

window.checkAuthThenCreateShipment = function() {
    const user = auth.currentUser;
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        showLogin();
        return;
    }
    document.getElementById('quickShipment').scrollIntoView({ behavior: 'smooth' });
};

window.checkAuthThenBecomeCarrier = function() {
    const user = auth.currentUser;
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        showLogin();
        return;
    }
    window.location.href = 'carrier.html';
};
