import { auth, db, collection, query, where, onSnapshot, getDocs, signOut } from './firebase.js';

let dashboardState = {
    currentUser: null,
    userData: null,
    shipments: [],
    offers: []
};

export async function initializeDashboard() {
    const user = auth.currentUser;
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        window.location.href = 'index.html';
        return;
    }

    dashboardState.currentUser = user;
    await loadUserData();
    setupRealtimeListeners();
    updateDashboardUI();
}

async function loadUserData() {
    const q = query(collection(db, 'users'), where('uid', '==', dashboardState.currentUser.uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const doc = snap.docs[0];
        dashboardState.userData = { id: doc.id, ...doc.data() };
        document.getElementById('userName').textContent = dashboardState.userData.name || 'المستخدم';
        document.getElementById('userType').textContent = dashboardState.userData.type === 'sender' ? 'مرسل' : dashboardState.userData.type === 'carrier' ? 'ناقل' : 'مرسل وناقل';
    }
}

function setupRealtimeListeners() {
    // ✅ شحنات المستخدم
    const shipmentsQuery = query(collection(db, 'shipments'), where('senderId', '==', dashboardState.currentUser.uid), orderBy('createdAt', 'desc'));
    onSnapshot(shipmentsQuery, snap => {
        dashboardState.shipments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        updateShipmentsUI();
    });

    // ✅ العروض على شحناته
    const offersQuery = query(collection(db, 'offers'), where('shipmentOwnerId', '==', dashboardState.currentUser.uid), orderBy('createdAt', 'desc'));
    onSnapshot(offersQuery, snap => {
        dashboardState.offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        updateOffersUI();
    });
}

function updateShipmentsUI() {
    const grid = document.getElementById('shipmentsGrid');
    if (!grid) return;
    if (dashboardState.shipments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد شحنات حتى الآن</h3>
                <p>أنشئ أول شحنة لك وابدأ في استخدام المنصة</p>
                <button class="btn-primary" onclick="createNewShipment()">إنشاء شحنة</button>
            </div>
        `;
        return;
    }
    grid.innerHTML = dashboardState.shipments.map(s => `
        <div class="shipment-card" onclick="showShipmentDetails('${s.id}')">
            <div class="shipment-header">
                <span class="shipment-id">#${s.id.slice(-6)}</span>
                <span class="shipment-status ${s.status}">${getStatusLabel(s.status)}</span>
            </div>
            <div class="shipment-details">
                <div class="shipment-route"><i class="fas fa-map-marker-alt"></i><span>${s.fromCity} → ${s.toCity}</span></div>
                <div class="shipment-type"><i class="fas fa-box"></i><span>${getShipmentTypeLabel(s.shipmentType)}</span></div>
                <div class="shipment-budget"><i class="fas fa-money-bill"></i><span>${s.budget} ريال</span></div>
            </div>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    const map = { active: 'نشطة', completed: 'مكتملة', cancelled: 'ملغية' };
    return map[status] || status;
}

function getShipmentTypeLabel(type) {
    const map = {
        documents: 'مستندات',
        small_package: 'طرد صغير',
        large_package: 'طرد كبير',
        furniture: 'أثاث',
        electronics: 'أجهزة',
        other: 'أخرى'
    };
    return map[type] || type;
}

window.showShipmentDetails = function(id) {
    const s = dashboardState.shipments.find(x => x.id === id);
    if (!s) return;
    alert(`تفاصيل الشحنة #${s.id.slice(-6)}\nمن: ${s.fromCity}\nإلى: ${s.toCity}\nالنوع: ${getShipmentTypeLabel(s.shipmentType)}\nالميزانية: ${s.budget} ريال`);
};

window.createNewShipment = function() {
    window.location.href = 'index.html#quickShipment';
};

window.logout = async function() {
    await signOut(auth);
    alert('✅ تم تسجيل الخروج بنجاح');
    setTimeout(() => window.location.href = 'index.html', 1000);
};
