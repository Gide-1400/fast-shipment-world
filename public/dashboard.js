// dashboard.js – نسخة متوافقة مع index.html/admin.html
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    // ملء اسم المستخدم في كل مكان يحمل id="userName"
    document.querySelectorAll('#userName').forEach(el => el.textContent = user.name || user.email || 'زائر');

    initializeDashboard();
    loadDashboardData();
    setupDashboardEventListeners();
});

/* ---------- التهيئة ---------- */
function initializeDashboard() {
    // إذا لم يكن مسجلاً يرسله للدخول
    if (!localStorage.getItem('currentUser')) {
        window.location.href = 'index.html';
        return;
    }
    loadDashboardStats();
    drawDashboardCharts();
    loadRecentActivity();
}

/* ---------- الإحصائيات ---------- */
function loadDashboardStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    const donations = JSON.parse(localStorage.getItem('donations') || '[]');

    const totalShipments = shipments.length;
    const activeShipments = shipments.filter(s => (s.status || 'active') === 'active').length;
    const completedShipments = shipments.filter(s => s.status === 'completed').length;
    const totalDonations = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

    // لوحة المستخدم (dashboard.html)
    const elTotal = document.getElementById('totalShipments');
    const elActive = document.getElementById('activeShipments');
    const elCompleted = document.getElementById('completedShipments');
    const elDonations = document.getElementById('totalDonations');
    if (elTotal) elTotal.textContent = totalShipments;
    if (elActive) elActive.textContent = activeShipments;
    if (elCompleted) elCompleted.textContent = completedShipments;
    if (elDonations) elDonations.textContent = totalDonations.toFixed(2);
}

/* ---------- الرسوم البيانية ---------- */
function drawDashboardCharts() {
    // مخطط خطي لنشاط الشحنات
    const ctx1 = document.getElementById('shipmentsChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                datasets: [{
                    label: 'عدد الشحنات',
                    data: [12, 19, 15, 25, 22, 30],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    // مخطط دائري لأنواع الشحنات
    const ctx2 = document.getElementById('typesChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['مستندات', 'طرود صغيرة', 'طرود كبيرة', 'أثاث'],
                datasets: [{ data: [30, 35, 20, 15], backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

/* ---------- النشاطات الأخيرة ---------- */
function loadRecentActivity() {
    const list = document.getElementById('activityList');
    if (!list) return;
    const activities = [
        { icon: 'fa-box', title: 'تم إنشاء شحنة جديدة', desc: 'شحنة مستندات من الرياض إلى جدة', time: 'منذ 2 ساعة', type: 'success' },
        { icon: 'fa-handshake', title: 'تم قبول عرض نقل', desc: 'عرض من أحمد - راكب طائرة', time: 'منذ 5 ساعات', type: 'info' },
        { icon: 'fa-star', title: 'تم التقييم', desc: 'قيمك محمد بـ 5 نجوم', time: 'منذ يوم', type: 'warning' }
    ];
    list.innerHTML = activities.map(act => `
        <div class="activity-item">
            <div class="activity-icon ${act.type}"><i class="fas ${act.icon}"></i></div>
            <div class="activity-content"><h4>${act.title}</h4><p>${act.desc}</p><span class="activity-time">${act.time}</span></div>
        </div>
    `).join('');
}

/* ---------- فلاتر الشحنات ---------- */
function setupDashboardEventListeners() {
    const statusFilter = document.getElementById('statusFilter');
    const searchShipments = document.getElementById('searchShipments');
    if (statusFilter) statusFilter.addEventListener('change', filterShipments);
    if (searchShipments) searchShipments.addEventListener('input', searchInShipments);
}

function filterShipments() {
    const status = document.getElementById('statusFilter').value;
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    const filtered = status === 'all' ? shipments : shipments.filter(s => (s.status || 'active') === status);
    displayFilteredShipments(filtered);
}

function searchInShipments() {
    const term = document.getElementById('searchShipments').value.toLowerCase();
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    const filtered = shipments.filter(s =>
        s.fromCity?.toLowerCase().includes(term) ||
        s.toCity?.toLowerCase().includes(term) ||
        s.shipmentType?.toLowerCase().includes(term)
    );
    displayFilteredShipments(filtered);
}

function displayFilteredShipments(shipments) {
    const grid = document.getElementById('shipmentsGrid');
    if (!grid) return;
    if (shipments.length === 0) {
        grid.innerHTML = '<p class="no-results">لا توجد نتائج</p>';
        return;
    }
    grid.innerHTML = shipments.map(shipment => `
        <div class="shipment-card">
            <div class="shipment-header">
                <span class="shipment-id">#${shipment.id}</span>
                <span class="shipment-status ${shipment.status || 'active'}">${getStatusLabel(shipment.status || 'active')}</span>
            </div>
            <div class="shipment-details">
                <div class="shipment-route"><i class="fas fa-map-marker-alt"></i><span>${shipment.fromCity} → ${shipment.toCity}</span></div>
                <div class="shipment-type"><i class="fas fa-box"></i><span>${getShipmentTypeLabel(shipment.shipmentType)}</span></div>
                <div class="shipment-budget"><i class="fas fa-money-bill"></i><span>${shipment.budget} ريال</span></div>
            </div>
            <div class="shipment-actions">
                <button class="btn-secondary" onclick="viewShipment('${shipment.id}')"><i class="fas fa-eye"></i> عرض</button>
                <button class="btn-primary" onclick="trackShipment('${shipment.id}')"><i class="fas fa-map"></i> تتبع</button>
            </div>
        </div>
    `).join('');
}

/* ---------- مساعدة ---------- */
function getStatusLabel(status) {
    const map = { active: 'نشطة', completed: 'مكتملة', cancelled: 'ملغية', pending: 'قيد الانتظار' };
    return map[status] || status;
}
function getShipmentTypeLabel(type) {
    const map = { documents: 'مستندات', small_package: 'طرد صغير', large_package: 'طرد كبير', furniture: 'أثاث', electronics: 'أجهزة', other: 'أخرى' };
    return map[type] || type;
}
function viewShipment(id) { alert(`عرض تفاصيل الشحنة #${id}`); }
function trackShipment(id) { alert(`تتبع الشحنة #${id}`); }
function createNewShipment() { window.location.href = 'index.html#quickShipment'; }
function logout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; }