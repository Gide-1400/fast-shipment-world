import { auth, db, collection, addDoc, query, where, onSnapshot, serverTimestamp } from './firebase.js';

export function initializeApp() {
    setupAuthListener();
    loadRealtimeStats();
    setupShipmentForm();
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
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'shipments'), data);
            alert('تم إنشاء الشحنة بنجاح');
            form.reset();
        } catch (error) {
            alert('حدث خطأ أثناء إنشاء الشحنة');
        }
    });
}

window.checkAuthThenCreateShipment = function() {
    const user = auth.currentUser;
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        document.getElementById('loginModal').style.display = 'block';
        return;
    }
    document.getElementById('quickShipment').scrollIntoView({ behavior: 'smooth' });
};

window.checkAuthThenBecomeCarrier = function() {
    const user = auth.currentUser;
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        document.getElementById('loginModal').style.display = 'block';
        return;
    }
    window.location.href = 'carrier.html';
};

window.showLogin = function() {
    document.getElementById('loginModal').style.display = 'block';
};

window.showRegister = function() {
    document.getElementById('registerModal').style.display = 'block';
};
