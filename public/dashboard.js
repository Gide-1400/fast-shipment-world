import { 
    auth, 
    db, 
    signOut, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from './firebase.js';

// حالة لوحة التحكم
let dashboardState = {
    currentUser: null,
    userData: null,
    shipments: [],
    offers: [],
    messages: [],
    notifications: [],
    currentSection: 'overview',
    currentChat: null
};

// تهيئة لوحة التحكم
export async function initializeDashboard() {
    showLoading();
    try {
        await checkAuthentication();
        await loadUserData();
        setupRealtimeListeners();
        updateDashboardUI();
        hideLoading();
    } catch (error) {
        console.error('❌ Failed to initialize dashboard:', error);
        showAlert('فشل في تحميل لوحة التحكم', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
    }
}

// التحقق من المصادقة
function checkAuthentication() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            if (user) {
                dashboardState.currentUser = user;
                resolve(user);
            } else {
                reject(new Error('User not authenticated'));
            }
        });
    });
}

// تحميل بيانات المستخدم الحقيقية
async function loadUserData() {
    const q = query(collection(db, 'users'), where('uid', '==', dashboardState.currentUser.uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const doc = snap.docs[0];
        dashboardState.userData = { id: doc.id, ...doc.data() };
    } else {
        throw new Error('User data not found');
    }
}

// إعداد المستمعين في الوقت الفعلي
function setupRealtimeListeners() {
    // شحنات المستخدم
    const shipmentsQuery = query(
        collection(db, 'shipments'),
        where('senderId', '==', dashboardState.currentUser.uid),
        orderBy('createdAt', 'desc')
    );
    onSnapshot(shipmentsQuery, snap => {
        dashboardState.shipments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        updateShipmentsUI();
        updateOverviewStats();
    });

    // العروض على شحناته
    const offersQuery = query(
        collection(db, 'offers'),
        where('shipmentOwnerId', '==', dashboardState.currentUser.uid),
        orderBy('createdAt', 'desc')
    );
    onSnapshot(offersQuery, snap => {
        dashboardState.offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        updateOffersUI();
    });

    // الإشعارات
    const notifQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', dashboardState.currentUser.uid),
        orderBy('createdAt', 'desc')
    );
    onSnapshot(notifQuery, snap => {
        dashboardState.notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        updateNotificationsUI();
    });
}

// تحديث واجهة المستخدم
function updateDashboardUI() {
    updateUserProfileUI();
    updateOverviewStats();
    drawCharts();
    loadRecentActivity();
}

function updateUserProfileUI() {
    document.getElementById('userName').textContent = dashboardState.userData.name || 'المستخدم';
    document.getElementById('userType').textContent = getUserTypeLabel(dashboardState.userData.type);
    document.getElementById('profileName').value = dashboardState.userData.name || '';
    document.getElementById('profileEmail').value = dashboardState.userData.email || '';
    document.getElementById('profilePhone').value = dashboardState.userData.phone || '';
    document.getElementById('profileCity').value = dashboardState.userData.city || '';
}

function updateOverviewStats() {
    document.getElementById('totalShipments').textContent = dashboardState.shipments.length;
    document.getElementById('activeShipments').textContent = dashboardState.shipments.filter(s => s.status === 'active').length;
    document.getElementById('averageRating').textContent = (dashboardState.userData.rating || 5).toFixed(1);
    const donations = dashboardState.shipments.reduce((sum, s) => sum + (s.voluntaryDonation ? (s.budget * 0.01) : 0), 0);
    document.getElementById('totalDonations').textContent = donations.toFixed(2);
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

function updateOffersUI() {
    const list = document.getElementById('offersList');
    if (!list) return;
    if (dashboardState.offers.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-handshake"></i>
                <h3>لا توجد عروض حتى الآن</h3>
                <p>سيظهر هنا العروض المقدمة على شحناتك</p>
            </div>
        `;
        return;
    }
    list.innerHTML = dashboardState.offers.map(o => `
        <div class="offer-card">
            <div class="offer-header">
                <div class="carrier-info">
                    <div class="carrier-avatar"><i class="fas fa-user"></i></div>
                    <div class="carrier-details">
                        <h4>${o.carrierName || 'ناقل'}</h4>
                        <div class="carrier-rating"><i class="fas fa-star"></i><span>${o.carrierRating || '5.0'}</span></div>
                    </div>
                </div>
                <div class="offer-price">
                    <span class="price">${o.price} ريال</span>
                    <span class="time">${o.estimatedTime || 'غير محدد'}</span>
                </div>
            </div>
            <div class="offer-details">
                <div class="offer-vehicle"><i class="fas fa-truck"></i><span>${o.vehicleType || 'مركبة'}</span></div>
                <p class="offer-message">${o.message || 'عرض للتوصيل'}</p>
            </div>
            <div class="offer-actions">
                <button class="btn-success" onclick="acceptOffer('${o.id}')"><i class="fas fa-check"></i> قبول</button>
                <button class="btn-secondary" onclick="negotiateOffer('${o.id}')"><i class="fas fa-comments"></i> تفاوض</button>
                <button class="btn-danger" onclick="rejectOffer('${o.id}')"><i class="fas fa-times"></i> رفض</button>
            </div>
        </div>
    `).join('');
}

function updateNotificationsUI() {
    const unread = dashboardState.notifications.filter(n => !n.read).length;
    document.querySelector('.notification-count').textContent = unread > 9 ? '9+' : unread;
    const list = document.getElementById('notificationsList');
    if (!list) return;
    list.innerHTML = dashboardState.notifications.map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}" onclick="markNotificationAsRead('${n.id}')">
            <div class="notification-content">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <span class="notification-time">${formatTime(n.createdAt?.toDate())}</span>
            </div>
        </div>
    `).join('');
}

// رسم المخططات البيانية
function drawCharts() {
    drawShipmentsChart();
    drawTypesChart();
}

function drawShipmentsChart() {
    const ctx = document.getElementById('shipmentsChart');
    if (!ctx) return;
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    const data = [12, 19, 15, 25, 22, dashboardState.shipments.length];
    new Chart(ctx, {
        type: 'line',
        data: { labels: months, datasets: [{ label: 'عدد الشحنات', data, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', tension: 0.4, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function drawTypesChart() {
    const ctx = document.getElementById('typesChart');
    if (!ctx) return;
    const types = {};
    dashboardState.shipments.forEach(s => {
        types[s.shipmentType] = (types[s.shipmentType] || 0) + 1;
    });
    const labels = Object.keys(types).map(t => getShipmentTypeLabel(t));
    const data = Object.values(types);
    new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'] }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

// عرض تفاصيل الشحنة
window.showShipmentDetails = function(id) {
    const s = dashboardState.shipments.find(x => x.id === id);
    if (!s) return;
    const content = document.getElementById('shipmentDetailsContent');
    content.innerHTML = `
        <div class="shipment-details-content">
            <div class="detail-row"><strong>رقم الشحنة:</strong><span>#${s.id.slice(-6)}</span></div>
            <div class="detail-row"><strong>المسار:</strong><span>${s.fromCity} → ${s.toCity}</span></div>
            <div class="detail-row"><strong>نوع الشحنة:</strong><span>${getShipmentTypeLabel(s.shipmentType)}</span></div>
            <div class="detail-row"><strong>الوزن:</strong><span>${s.weight}</span></div>
            <div class="detail-row"><strong>الميزانية:</strong><span>${s.budget} ريال</span></div>
            <div class="detail-row"><strong>الحالة:</strong><span class="shipment-status ${s.status}">${getStatusLabel(s.status)}</span></div>
            <div class="detail-row"><strong>الوصف:</strong><span>${s.description || 'لا يوجد وصف'}</span></div>
            <div class="detail-actions">
                <button class="btn-primary" onclick="trackShipment('${s.id}')"><i class="fas fa-map"></i> تتبع</button>
                <button class="btn-secondary" onclick="closeModal('shipmentDetailsModal')"><i class="fas fa-times"></i> إغلاق</button>
            </div>
        </div>
    `;
    document.getElementById('shipmentDetailsModal').style.display = 'block';
};

// قبول/رفض/تفاوض على العرض
window.acceptOffer = async function(id) {
    await updateDoc(doc(db, 'offers', id), { status: 'accepted' });
    showAlert('تم قبول العرض', 'success');
};

window.rejectOffer = async function(id) {
    await updateDoc(doc(db, 'offers', id), { status: 'rejected' });
    showAlert('تم رفض العرض', 'info');
};

window.negotiateOffer = function(id) {
    showAlert('ميزة التفاوض قريباً', 'info');
};

// تسجيل الخروج
window.logout = async function() {
    try {
        await signOut(auth);
        showAlert('تم تسجيل الخروج بنجاح', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
        showAlert('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
};

// إظهار قسم معين
window.showSection = function(name) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.getElementById(name).classList.add('active');
    document.querySelector(`[href="#${name}"]`).parentElement.classList.add('active');
};

// إظهار تبويب الإعدادات
window.showSettingsTab = function(name) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(name + 'Settings').classList.add('active');
    event.target.classList.add('active');
};

// إنشاء شحنة جديدة
window.createNewShipment = function() {
    window.location.href = 'index.html#quickShipment';
};

// مساعدة
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

function getUserTypeLabel(type) {
    const map = { sender: 'مرسل', carrier: 'ناقل', both: 'مرسل وناقل', admin: 'مسؤول' };
    return map[type] || type;
}

function formatTime(date) {
    if (!date) return 'الآن';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return 'الآن';
}

// تحميل النشاطات الأخيرة
function loadRecentActivity() {
    const list = document.getElementById('activityList');
    if (!list) return;
    const activities = dashboardState.shipments.slice(0, 3).map(s => ({
        icon: 'fa-box',
        title: 'تم إنشاء شحنة جديدة',
        description: `شحنة من ${s.fromCity} إلى ${s.toCity}`,
        time: formatTime(s.createdAt?.toDate()),
        type: 'success'
    }));
    list.innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-icon ${a.type}"><i class="fas ${a.icon}"></i></div>
            <div class="activity-content">
                <h4>${a.title}</h4>
                <p>${a.description}</p>
                <span class="activity-time">${a.time}</span>
            </div>
        </div>
    `).join('');
}

// تصفية الشحنات
window.filterShipments = function() {
    const status = document.getElementById('statusFilter').value;
    const search = document.getElementById('searchShipments').value.toLowerCase();
    let filtered = dashboardState.shipments;
    if (status !== 'all') filtered = filtered.filter(s => s.status === status);
    if (search) filtered = filtered.filter(s => 
        s.fromCity.toLowerCase().includes(search) ||
        s.toCity.toLowerCase().includes(search) ||
        s.shipmentType.toLowerCase().includes(search)
    );
    displayFilteredShipments(filtered);
};

function displayFilteredShipments(shipments) {
    const grid = document.getElementById('shipmentsGrid');
    if (!grid) return;
    if (shipments.length === 0) {
        grid.innerHTML = '<p class="no-results">لا توجد نتائج</p>';
        return;
    }
    grid.innerHTML = shipments.map(s => `
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

// إظهار/إخفاء التحميل
function showLoading() {
    document.getElementById('loadingBar')?.classList.add('active');
}
function hideLoading() {
    document.getElementById('loadingBar')?.classList.remove('active');
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