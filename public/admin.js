// تهيئة لوحة تحكم المسؤول
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    loadAdminData();
    setupAdminEventListeners();
});

// تهيئة لوحة المسؤول
function initializeAdmin() {
    // التحقق من صلاحيات المسؤول
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    if (user.type !== 'admin') {
        alert('ليس لديك صلاحيات المسؤول');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // تحميل البيانات الأولية
    loadAdminStats();
}

// تحميل بيانات لوحة المسؤول
function loadAdminData() {
    loadUsersData();
    loadAdminShipmentsData();
    loadAdminMessagesData();
    loadDonationsData();
    drawAdminCharts();
}

// تحميل إحصائيات المسؤول
function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    const donations = JSON.parse(localStorage.getItem('donations') || '[]');
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalShipments').textContent = shipments.length;
    document.getElementById('totalDonations').textContent = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0).toFixed(2);
    document.getElementById('growthRate').textContent = '+23%';
}

// رسم مخططات المسؤول
function drawAdminCharts() {
    // مخطط نمو المستخدمين
    const usersCtx = document.getElementById('usersChart');
    if (usersCtx) {
        new Chart(usersCtx, {
            type: 'line',
            data: {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                datasets: [{
                    label: 'عدد المستخدمين',
                    data: [120, 190, 300, 500, 800, 1234],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // مخطط أنواع الشحنات
    const shipmentsCtx = document.getElementById('shipmentsTypeChart');
    if (shipmentsCtx) {
        new Chart(shipmentsCtx, {
            type: 'doughnut',
            data: {
                labels: ['مستندات', 'طرود صغيرة', 'طرود كبيرة', 'أثاث'],
                datasets: [{
                    data: [30, 35, 20, 15],
                    backgroundColor: [
                        '#2563eb',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// عرض قسم معين
function showAdminSection(sectionName) {
    // إخفاء جميع الأقسام
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // عرض القسم المطلوب
    const targetSection = document.getElementById('admin' + sectionName.charAt(0).toUpperCase() + sectionName.slice(1));
    if (targetSection) {
        targetSection.classList.add('active');
        
        // تحديث العنوان
        document.getElementById('adminTitle').textContent = getAdminSectionTitle(sectionName);
    }
}

// الحصول على عنوان القسم
function getAdminSectionTitle(sectionName) {
    const titles = {
        'overview': 'نظرة عامة',
        'users': 'إدارة المستخدمين',
        'shipments': 'إدارة الشحنات',
        'messages': 'رسائل المستخدمين',
        'donations': 'التبرعات الطوعية',
        'settings': 'إعدادات المنصة'
    };
    return titles[sectionName] || 'لوحة تحكم المسؤول';
}

// تحميل بيانات المستخدمين
function loadUsersData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const usersTable = document.getElementById('usersTable');
    
    if (users.length === 0) {
        usersTable.innerHTML = '<p class="no-data">لا يوجد مستخدمون حتى الآن</p>';
        return;
    }
    
    usersTable.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>البريد الإلكتروني</th>
                    <th>النوع</th>
                    <th>التقييم</th>
                    <th>تاريخ التسجيل</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${getUserTypeLabel(user.type)}</td>
                        <td>${user.rating || '4.5'} <i class="fas fa-star"></i></td>
                        <td>${new Date(user.createdAt || Date.now()).toLocaleDateString('ar-SA')}</td>
                        <td>
                            <button class="btn-action btn-view" onclick="viewUser('${user.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action btn-edit" onclick="editUser('${user.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteUser('${user.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// تحميل بيانات الشحنات
function loadAdminShipmentsData() {
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    const adminShipmentsTable = document.getElementById('adminShipmentsTable');
    
    if (shipments.length === 0) {
        adminShipmentsTable.innerHTML = '<p class="no-data">لا توجد شحنات حتى الآن</p>';
        return;
    }
    
    adminShipmentsTable.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>رقم الشحنة</th>
                    <th>المرسل</th>
                    <th>المسار</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${shipments.map(shipment => `
                    <tr>
                        <td>${shipment.id}</td>
                        <td>${shipment.senderName || 'غير محدد'}</td>
                        <td>${shipment.fromCity} → ${shipment.toCity}</td>
                        <td>${getShipmentTypeLabel(shipment.shipmentType)}</td>
                        <td><span class="status-badge ${shipment.status || 'active'}">${getStatusLabel(shipment.status || 'active')}</span></td>
                        <td>${new Date(shipment.createdAt || shipment.timestamp || Date.now()).toLocaleDateString('ar-SA')}</td>
                        <td>
                            <button class="btn-action btn-view" onclick="viewShipment('${shipment.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action btn-edit" onclick="editShipment('${shipment.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// تحميل الرسائل
function loadAdminMessagesData() {
    const messages = [
        {
            id: 'MSG001',
            sender: 'أحمد محمد',
            subject: 'استفسار عن شحنة',
            message: 'متى تصل شحنتي رقم SH001؟',
            date: '2025-10-01',
            status: 'unread'
        },
        {
            id: 'MSG002',
            sender: 'خالد سعيد',
            subject: 'شكوى',
            message: 'الناقل تأخر في التوصيل',
            date: '2025-09-30',
            status: 'read'
        }
    ];
    
    const adminMessagesList = document.getElementById('adminMessagesList');
    adminMessagesList.innerHTML = messages.map(msg => `
        <div class="message-item ${msg.status}">
            <div class="message-header">
                <h4>${msg.subject}</h4>
                <span class="message-date">${msg.date}</span>
            </div>
            <p class="message-sender">من: ${msg.sender}</p>
            <p class="message-content">${msg.message}</p>
            <div class="message-actions">
                <button class="btn-action btn-reply" onclick="replyToMessage('${msg.id}')">
                    <i class="fas fa-reply"></i> رد
                </button>
                <button class="btn-action btn-mark-read" onclick="markAsRead('${msg.id}')">
                    <i class="fas fa-envelope-open"></i> تحديد كمقروء
                </button>
            </div>
        </div>
    `).join('');
}

// تحميل التبرعات
function loadDonationsData() {
    const donations = JSON.parse(localStorage.getItem('donations') || '[]');
    const donationsTable = document.getElementById('donationsTable');
    
    if (donations.length === 0) {
        donationsTable.innerHTML = '<p class="no-data">لا توجد تبرعات حتى الآن</p>';
        return;
    }
    
    donationsTable.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>المتبرع</th>
                    <th>المبلغ</th>
                    <th>النوع</th>
                    <th>تاريخ التبرع</th>
                </tr>
            </thead>
            <tbody>
                ${donations.map(donation => `
                    <tr>
                        <td>${donation.donorName || 'غير محدد'}</td>
                        <td>${donation.amount} ريال</td>
                        <td>${donation.type === 'sender' ? 'مرسل' : 'ناقل'}</td>
                        <td>${new Date(donation.date || Date.now()).toLocaleDateString('ar-SA')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// إعداد مستمعي الأحداث
function setupAdminEventListeners() {
    // فلترة الشحنات
    const shipmentStatusFilter = document.getElementById('shipmentStatusFilter');
    if (shipmentStatusFilter) {
        shipmentStatusFilter.addEventListener('change', filterAdminShipments);
    }
}

// تصفية الشحنات
function filterAdminShipments() {
    const status = document.getElementById('shipmentStatusFilter').value;
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    
    let filteredShipments = shipments;
    if (status !== 'all') {
        filteredShipments = shipments.filter(s => (s.status || 'active') === status);
    }
    
    displayFilteredAdminShipments(filteredShipments);
}

// عرض الشحنات المصفاة
function displayFilteredAdminShipments(shipments) {
    const adminShipmentsTable = document.getElementById('adminShipmentsTable');
    
    if (shipments.length === 0) {
        adminShipmentsTable.innerHTML = '<p class="no-data">لا توجد نتائج</p>';
        return;
    }
    
    adminShipmentsTable.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>رقم الشحنة</th>
                    <th>المرسل</th>
                    <th>المسار</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${shipments.map(shipment => `
                    <tr>
                        <td>${shipment.id}</td>
                        <td>${shipment.senderName || 'غير محدف'}</td>
                        <td>${shipment.fromCity} → ${shipment.toCity}</td>
                        <td>${getShipmentTypeLabel(shipment.shipmentType)}</td>
                        <td><span class="status-badge ${shipment.status || 'active'}">${getStatusLabel(shipment.status || 'active')}</span></td>
                        <td>${new Date(shipment.createdAt || shipment.timestamp || Date.now()).toLocaleDateString('ar-SA')}</td>
                        <td>
                            <button class="btn-action btn-view" onclick="viewShipment('${shipment.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action btn-edit" onclick="editShipment('${shipment.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// حفظ الإعدادات
function saveSettings() {
    const senderCommission = document.getElementById('senderCommission').value;
    const carrierCommission = document.getElementById('carrierCommission').value;
    const welcomeMessage = document.getElementById('welcomeMessage').value;
    
    // حفظ الإعدادات
    const settings = {
        senderCommission: senderCommission,
        carrierCommission: carrierCommission,
        welcomeMessage: welcomeMessage,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showSuccessMessage('تم حفظ الإعدادات بنجاح');
}

// دوال مساعدة
function getUserTypeLabel(type) {
    const labels = {
        'sender': 'مرسل',
        'carrier': 'ناقل',
        'both': 'مرسل وناقل',
        'admin': 'مسؤول'
    };
    return labels[type] || type;
}

function showSuccessMessage(message) {
    alert(message); // يمكن استبدالها بتوست رسائل
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// دوال إجراءات المسؤول
function viewUser(userId) {
    showSuccessMessage(`عرض بيانات المستخدم: ${userId}`);
}

function editUser(userId) {
    showSuccessMessage(`تعديل بيانات المستخدم: ${userId}`);
}

function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        showSuccessMessage(`تم حذف المستخدم: ${userId}`);
    }
}

function viewShipment(shipmentId) {
    showSuccessMessage(`عرض تفاصيل الشحنة: ${shipmentId}`);
}

function editShipment(shipmentId) {
    showSuccessMessage(`تعديل الشحنة: ${shipmentId}`);
}

function replyToMessage(messageId) {
    showSuccessMessage(`الرد على الرسالة: ${messageId}`);
}

function markAsRead(messageId) {
    showSuccessMessage(`تم تحديد الرسالة كمقروءة: ${messageId}`);
}