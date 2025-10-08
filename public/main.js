import { auth, db, collection, addDoc, query, where, onSnapshot, serverTimestamp } from './firebase.js';

export function initializeApp() {
    setupAuthListener();
    loadRealtimeStats();
    setupShipmentForm();
    // ✅ العنوان ثابت: "ارسل شحنتك من بيتك إلى كل أنحاء العالم"
}

function setupAuthListener() {
    auth.onAuthStateChanged(user => {
        if (user) {
            updateUIForAuthenticatedUser();
        } else {
            updateUIForUnauthenticatedUser();
        }
    });
}

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

function setupShipmentForm() {
    const form = document.getElementById('shipmentForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showAlert('يرجى تسجيل الدخول أولاً', 'error');
            showLogin();
            return;
        }

        const data = {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            senderPhone: user.phoneNumber || '',
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
            showAlert('تم إنشاء الشحنة بنجاح', 'success');
            form.reset();
            updateDonationAmount();
        } catch (error) {
            console.error('Error creating shipment:', error);
            showAlert('حدث خطأ أثناء إنشاء الشحنة', 'error');
        }
    });
}

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

function updateUIForAuthenticatedUser() {
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

function updateUIForUnauthenticatedUser() {
    const authButtons = document.getElementById('authButtons');
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn-login" onclick="showLogin()" data-i18n="auth.login">تسجيل الدخول</button>
            <button class="btn-register" onclick="showRegister()" data-i18n="auth.register">إنشاء حساب</button>
        `;
        if (window.i18n) window.i18n.applyTranslations();
    }
}

window.logout = async function() {
    try {
        await signOut(auth);
        showAlert('تم تسجيل الخروج بنجاح', 'success');
        setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
        showAlert('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
};

function showAlert(message, type = 'info') {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}
