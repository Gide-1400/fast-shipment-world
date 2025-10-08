// تهيئة لوحة التحكم
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadDashboardData();
    setupDashboardEventListeners();
});

// تهيئة لوحة التحكم
function initializeDashboard() {
    // التحقق من تسجيل الدخول
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    document.getElementById('userName').textContent = user.name || 'المستخدم';
    
    // تهيئة القائمة الجانبية
    initializeSidebar();
}

// تهيئة القائمة الجانبية
function initializeSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showSection(section);
            
            // تحديث النشاط
            sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
        });
    });
}

// عرض قسم معين
function showSection(sectionName) {
    // إخفاء جميع الأقسام
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // عرض القسم المطلوب
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // تحديث العنوان
        updatePageTitle(sectionName);
        
        // تحميل بيانات القسم إذا لزم الأمر
        loadSectionData(sectionName);
    }
}

// تحديث عنوان الصفحة
function updatePageTitle(sectionName) {
    const titles = {
        'overview': 'نظرة عامة',
        'shipments': 'شحناتي',
        'offers': 'العروض',
        'messages': 'الرسائل',
        'ratings': 'التقييمات',
        'settings': 'الإعدادات'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'لوحة التحكم';
}

// تحميل بيانات القسم
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'shipments':
            loadShipmentsData();
            break;
        case 'offers':
            loadOffersData();
            break;
        case 'messages':
            loadMessagesData();
            break;
        case 'ratings':
            loadRatingsData();
            break;
    }
}

// تحميل بيانات النظرة العامة
function loadOverviewData() {
    // تحديث الإحصائيات
    updateOverviewStats();
    
    // رسم المخططات البيانية
    drawCharts();
    
    // تحميل النشاطات الأخيرة
    loadRecentActivity();
}

// تحديث إحصائيات النظرة العامة
function updateOverviewStats() {
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // حساب الإحصائيات
    const totalShipments = shipments.length;
    const activeShipments = shipments.filter(s => s.status === 'active').length;
    const completedShipments = shipments.filter(s => s.status === 'completed').length;
    const totalDonations = shipments.reduce((sum, s) => {
        return sum + (s.donation ? parseFloat(s.budget || 0) * 0.01 : 0);
    }, 0);
    
    // تحديث واجهة المستخدم
    document.getElementById('totalShipments').textContent = totalShipments;
    document.getElementById('activeShipments').textContent = activeShipments;
    document.getElementById('averageRating').textContent = user.rating || '4.5';
    document.getElementById('totalDonations').textContent = totalDonations.toFixed(2);
}

// رسم المخططات البيانية
function drawCharts() {
    // مخطط نشاط الشحنات
    const shipmentsCtx = document.getElementById('shipmentsChart');
    if (shipmentsCtx) {
        new Chart(shipmentsCtx, {
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
    const typesCtx = document.getElementById('typesChart');
    if (typesCtx) {
        new Chart(typesCtx, {
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

// تحميل النشاطات الأخيرة
function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    const activities = [
        {
            icon: 'fa-box',
            title: 'تم إنشاء شحنة جديدة',
            description: 'شحنة مستندات من الرياض إلى جدة',
            time: 'منذ 2 ساعة',
            type: 'success'
        },
        {
            icon: 'fa-handshake',
            title: 'تم قبول عرض نقل',
            description: 'عرض من أحمد - راكب طائرة',
            time: 'منذ 5 ساعات',
            type: 'info'
        },
        {
            icon: 'fa-star',
            title: 'تم التقييم',
            description: 'قيمك محمد بـ 5 نجوم',
            time: 'منذ يوم',
            type: 'warning'
        }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// تحميل بيانات الشحنات
function loadShipmentsData() {
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    const shipmentsGrid = document.getElementById('shipmentsGrid');
    
    if (shipments.length === 0) {
        shipmentsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد شحنات حتى الآن</h3>
                <p>أنشئ أول شحنة لك وابدأ في استخدام المنصة</p>
                <button class="btn-primary" onclick="createNewShipment()">إنشاء شحنة</button>
            </div>
        `;
        return;
    }
    
    shipmentsGrid.innerHTML = shipments.map(shipment => `
        <div class="shipment-card">
            <div class="shipment-header">
                <span class="shipment-id">#${shipment.id}</span>
                <span class="shipment-status ${shipment.status || 'active'}">
                    ${getStatusLabel(shipment.status || 'active')}
                </span>
            </div>
            <div class="shipment-details">
                <div class="shipment-route">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${shipment.fromCity} → ${shipment.toCity}</span>
                </div>
                <div class="shipment-type">
                    <i class="fas fa-box"></i>
                    <span>${getShipmentTypeLabel(shipment.shipmentType)}</span>
                </div>
                <div class="shipment-budget">
                    <i class="fas fa-money-bill"></i>
                    <span>${shipment.budget} ريال</span>
                </div>
            </div>
            <div class="shipment-actions">
                <button class="btn-secondary" onclick="viewShipment('${shipment.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="btn-primary" onclick="trackShipment('${shipment.id}')">
                    <i class="fas fa-map"></i> تتبع
                </button>
            </div>
        </div>
    `).join('');
}

// تحميل بيانات العروض
function loadOffersData() {
    const offers = [
        {
            id: 'OF-001',
            shipmentId: 'SH-001',
            carrier: 'أحمد - راكب طائرة',
            price: 150,
            estimatedTime: '2 ساعة',
            rating: 4.8,
            vehicle: 'سيارة',
            message: 'يمكنني التوصيل اليوم'
        },
        {
            id: 'OF-002',
            shipmentId: 'SH-002',
            carrier: 'محمد - سائق شاحنة',
            price: 200,
            estimatedTime: '4 ساعات',
            rating: 4.5,
            vehicle: 'شاحنة صغيرة',
            message: 'متاح غداً صباحاً'
        }
    ];
    
    const offersList = document.getElementById('offersList');
    offersList.innerHTML = offers.map(offer => `
        <div class="offer-card">
            <div class="offer-header">
                <div class="carrier-info">
                    <img src="https://via.placeholder.com/50" alt="Carrier" class="carrier-avatar">
                    <div>
                        <h4>${offer.carrier}</h4>
                        <div class="carrier-rating">
                            <i class="fas fa-star"></i>
                            <span>${offer.rating}</span>
                        </div>
                    </div>
                </div>
                <div class="offer-price">
                    <span class="price">${offer.price} ريال</span>
                    <span class="time">${offer.estimatedTime}</span>
                </div>
            </div>
            <div class="offer-details">
                <div class="offer-vehicle">
                    <i class="fas fa-truck"></i>
                    <span>${offer.vehicle}</span>
                </div>
                <p class="offer-message">${offer.message}</p>
            </div>
            <div class="offer-actions">
                <button class="btn-success" onclick="acceptOffer('${offer.id}')">
                    <i class="fas fa-check"></i> قبول
                </button>
                <button class="btn-secondary" onclick="negotiateOffer('${offer.id}')">
                    <i class="fas fa-comments"></i> تفاوض
                </button>
                <button class="btn-danger" onclick="rejectOffer('${offer.id}')">
                    <i class="fas fa-times"></i> رفض
                </button>
            </div>
        </div>
    `).join('');
}

// تحميل بيانات الرسائل
function loadMessagesData() {
    const chats = [
        {
            id: 'CH-001',
            user: 'أحمد - راكب طائرة',
            lastMessage: 'تم استلام الشحنة، في الطريق الآن',
            time: 'منذ 10 دقائق',
            unread: 2,
            avatar: 'https://via.placeholder.com/40'
        },
        {
            id: 'CH-002',
            user: 'محمد - سائق شاحنة',
            lastMessage: 'متى يمكنني استلام الطرد؟',
            time: 'منذ ساعة',
            unread: 0,
            avatar: 'https://via.placeholder.com/40'
        }
    ];
    
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = chats.map(chat => `
        <div class="chat-item ${chat.unread > 0 ? 'unread' : ''}" onclick="openChat('${chat.id}')">
            <img src="${chat.avatar}" alt="User" class="chat-avatar">
            <div class="chat-info">
                <h4>${chat.user}</h4>
                <p>${chat.lastMessage}</p>
            </div>
            <div class="chat-meta">
                <span class="chat-time">${chat.time}</span>
                ${chat.unread > 0 ? `<span class="unread-count">${chat.unread}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// فتح المحادثة
function openChat(chatId) {
    const chatTitle = document.getElementById('chatTitle');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    
    // محاكاة فتح المحادثة
    chatTitle.textContent = 'أحمد - راكب طائرة';
    chatInput.style.display = 'flex';
    
    // عرض الرسائل
    const messages = [
        {
            sender: 'other',
            text: 'مرحباً، تم استلام الشحنة بنجاح',
            time: '10:30 ص'
        },
        {
            sender: 'me',
            text: 'ممتاز، متى تتوقع الوصول؟',
            time: '10:32 ص'
        },
        {
            sender: 'other',
            text: 'خلال ساعة إن شاء الله',
            time: '10:33 ص'
        }
    ];
    
    chatMessages.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender}">
            <div class="message-content">
                <p>${msg.text}</p>
                <span class="message-time">${msg.time}</span>
            </div>
        </div>
    `).join('');
    
    // التمرير لآخر رسالة
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// إرسال رسالة
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message me';
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${text}</p>
            <span class="message-time">${new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// تحميل بيانات التقييمات
function loadRatingsData() {
    const reviews = [
        {
            id: 'REV-001',
            user: 'خالد محمد',
            rating: 5,
            comment: 'خدمة ممتازة وسرعة في التوصيل',
            date: '2025-10-01',
            shipment: 'مستندات إلى جدة'
        },
        {
            id: 'REV-002',
            user: 'سعيد أحمد',
            rating: 4,
            comment: 'جيد جداً but can improve',
            date: '2025-09-28',
            shipment: 'طرد صغير إلى مكة'
        }
    ];
    
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="reviewer-info">
                    <img src="https://via.placeholder.com/50" alt="Reviewer" class="reviewer-avatar">
                    <div>
                        <h4>${review.user}</h4>
                        <div class="review-rating">
                            ${generateStars(review.rating)}
                        </div>
                    </div>
                </div>
                <span class="review-date">${review.date}</span>
            </div>
            <p class="review-comment">${review.comment}</p>
            <div class="review-shipment">
                <i class="fas fa-box"></i>
                <span>${review.shipment}</span>
            </div>
        </div>
    `).join('');
}

// إنشاء نجوم التقييم
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// إعداد مستمعي الأحداث
function setupDashboardEventListeners() {
    // فلاتر الشحنات
    const statusFilter = document.getElementById('statusFilter');
    const searchShipments = document.getElementById('searchShipments');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterShipments);
    }
    
    if (searchShipments) {
        searchShipments.addEventListener('input', searchInShipments);
    }
}

// تصفية الشحنات
function filterShipments() {
    const status = document.getElementById('statusFilter').value;
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    
    let filteredShipments = shipments;
    if (status !== 'all') {
        filteredShipments = shipments.filter(s => (s.status || 'active') === status);
    }
    
    displayFilteredShipments(filteredShipments);
}

// البحث في الشحنات
function searchInShipments() {
    const searchTerm = document.getElementById('searchShipments').value.toLowerCase();
    const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    
    const filteredShipments = shipments.filter(s => 
        s.fromCity.toLowerCase().includes(searchTerm) ||
        s.toCity.toLowerCase().includes(searchTerm) ||
        s.shipmentType.toLowerCase().includes(searchTerm)
    );
    
    displayFilteredShipments(filteredShipments);
}

// عرض الشحنات المصفاة
function displayFilteredShipments(shipments) {
    const shipmentsGrid = document.getElementById('shipmentsGrid');
    
    if (shipments.length === 0) {
        shipmentsGrid.innerHTML = '<p class="no-results">لا توجد نتائج</p>';
        return;
    }
    
    shipmentsGrid.innerHTML = shipments.map(shipment => `
        <div class="shipment-card">
            <div class="shipment-header">
                <span class="shipment-id">#${shipment.id}</span>
                <span class="shipment-status ${shipment.status || 'active'}">
                    ${getStatusLabel(shipment.status || 'active')}
                </span>
            </div>
            <div class="shipment-details">
                <div class="shipment-route">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${shipment.fromCity} → ${shipment.toCity}</span>
                </div>
                <div class="shipment-type">
                    <i class="fas fa-box"></i>
                    <span>${getShipmentTypeLabel(shipment.shipmentType)}</span>
                </div>
                <div class="shipment-budget">
                    <i class="fas fa-money-bill"></i>
                    <span>${shipment.budget} ريال</span>
                </div>
            </div>
            <div class="shipment-actions">
                <button class="btn-secondary" onclick="viewShipment('${shipment.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="btn-primary" onclick="trackShipment('${shipment.id}')">
                    <i class="fas fa-map"></i> تتبع
                </button>
            </div>
        </div>
    `).join('');
}

// دوال مساعدة
function getStatusLabel(status) {
    const labels = {
        'active': 'نشطة',
        'completed': 'مكتملة',
        'cancelled': 'ملغية',
        'pending': 'قيد الانتظار'
    };
    return labels[status] || status;
}

function getShipmentTypeLabel(type) {
    const labels = {
        'documents': 'مستندات',
        'small_package': 'طرد صغير',
        'large_package': 'طرد كبير',
        'furniture': 'أثاث',
        'electronics': 'أجهزة',
        'other': 'أخرى'
    };
    return labels[type] || type;
}

// إنشاء شحنة جديدة
function createNewShipment() {
    window.location.href = 'index.html#quickShipment';
}

// عرض تفاصيل الشحنة
function viewShipment(shipmentId) {
    showSuccessMessage(`عرض تفاصيل الشحنة #${shipmentId}`);
}

// تتبع الشحنة
function trackShipment(shipmentId) {
    showSuccessMessage(`تتبع الشحنة #${shipmentId}`);
}

// قبول العرض
function acceptOffer(offerId) {
    showSuccessMessage(`تم قبول العرض #${offerId}`);
}

// تفاوض على العرض
function negotiateOffer(offerId) {
    showSuccessMessage(`تم فتح نافذة التفاوض للعرض #${offerId}`);
}

// رفض العرض
function rejectOffer(offerId) {
    showSuccessMessage(`تم رفض العرض #${offerId}`);
}

// تبديل علامات التبويب في الإعدادات
function showSettingsTab(tabName) {
    // إخفاء جميع علامات التبويب
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // إزالة النشاط من الأزرار
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // عرض علامة التبويب المطلوبة
    document.getElementById(tabName + 'Settings').classList.add('active');
    
    // تفعيل الزر المقابل
    event.target.classList.add('active');
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// تحميل بيانات لوحة التحكم
function loadDashboardData() {
    // محاكاة تحميل البيانات
    setTimeout(() => {
        loadOverviewData();
    }, 500);
}