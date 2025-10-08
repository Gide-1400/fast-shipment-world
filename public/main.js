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
        // تحديث واجهة المستخدم
        const userNameEl = document.getElementById('userName');
        const userTypeEl = document.getElementById('userType');
        if (userNameEl) userNameEl.textContent = doc.name || 'المستخدم';
        if (userTypeEl) userTypeEl.textContent = doc.type === 'sender' ? 'مرسل' : doc.type === 'carrier' ? 'ناقل' : 'مرسل وناقل';
    }
}

// ✅ الإحصائيات الحقيقية
function loadRealtimeStats() {
    const shipmentsRef = collection(db, 'shipments');
    const carriersRef = collection(db, 'users');

    onSnapshot(shipmentsRef, snap => {
        const el = document.getElementById('statsShipments');
        if (el) el.textContent = snap.size;
    });

    onSnapshot(query(carriersRef, where('type', 'in', ['carrier', 'both'])), snap => {
        const el = document.getElementById('statsCarriers');
        if (el) el.textContent = snap.size;
    });
}

// ✅ نموذج الشحنة
function setupShipmentForm() {
    const form = document.getElementById('shipmentForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            alert('يرجى تسجيل الدخول أولاً');
            return;
        }

        const data = {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            fromCity: document.getElementById('fromCity').value.trim(),
            toCity: document.getElementById('toCity').value.trim(),
            shipmentType: document.getElementById('shipmentType').value,
            weight: document.getElementById('weight').value.trim(),
            budget: parseFloat(document.getElementById('budget').value),
            urgency: document.getElementById('urgency').value,
            description: document.getElementById('description').value.trim(),
            voluntaryDonation: document.getElementById('voluntaryDonation').checked,
            status: 'active',
            createdAt: serverTimestamp(),
            offers: [],
            views: 0
        };

        try {
            await addDoc(collection(db, 'shipments'), data);
            alert('✅ تم إنشاء الشحنة بنجاح');
            form.reset();
            updateDonationAmount();
        } catch (error) {
            alert('❌ حدث خطأ أثناء إنشاء الشحنة');
        }
    });
}

// ✅ تحديث مبلغ التبرع
function updateDonationAmount() {
    const donationCheckbox = document.getElementById('voluntaryDonation');
    const budgetInput = document.getElementById('budget');
    const donationAmount = document.getElementById('donationAmount');
    if (donationCheckbox && donationCheckbox.checked && budgetInput && budgetInput.value) {
        const donation = parseFloat(budgetInput.value) * 0.01;
        donationAmount.textContent = `${donation.toFixed(2)} ريال`;
    } else {
        donationAmount.textContent = '0 ريال';
    }
}

// ✅ التحقق من الصلاحيات
window.checkAuthThenCreateShipment = function () {
    const user = auth.currentUser;
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        window.showLogin();
        return;
    }
    document.getElementById('quickShipment').scrollIntoView({ behavior: 'smooth' });
};

window.checkAuthThenBecomeCarrier = function () {
    const user = auth.currentUser;
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        window.showLogin();
        return;
    }
    window.location.href = 'carrier.html';
};

// ✅ نوافذ منبثقة
window.showLogin = function () {
    document.getElementById('loginModal').style.display = 'block';
};

window.showRegister = function () {
    document.getElementById('registerModal').style.display = 'block';
};

window.logout = async function () {
    await signOut(auth);
    alert('✅ تم تسجيل الخروج بنجاح');
    setTimeout(() => window.location.reload(), 1000);
};
