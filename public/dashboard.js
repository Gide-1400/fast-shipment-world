// dashboard.js - منطق لوحة التحكم
import { 
    auth, 
    db, 
    signOut, 
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
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
        // التحقق من المصادقة
        await checkAuthentication();
        
        // إعداد مستمعي الأحداث
        setupDashboardEventListeners();
        
        // تحميل بيانات المستخدم
        await loadUserData();
        
        // تحميل البيانات الأولية
        await loadInitialData();
        
        // تحديث واجهة المستخدم
        updateDashboardUI();
        
        hideLoading();
        
        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize dashboard:', error);
        showAlert('فشل في تحميل لوحة التحكم', 'error');
        redirectToLogin();
    }
}

// التحقق من المصادقة
function checkAuthentication() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
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

// تحميل بيانات المستخدم
async function loadUserData() {
    try {
        const userQuery = query(
            collection(db, 'users'), 
            where('uid', '==', dashboardState.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(userQuery);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            dashboardState.userData = {
                id: userDoc.id,
                ...userDoc.data()
            };
            
            updateUserProfileUI();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

// تحميل البيانات الأولية
async function loadInitialData() {
    try {
        await Promise.all([
            loadShipments(),
            loadOffers(),
            loadNotifications(),
            setupRealtimeListeners()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        throw error;
    }
}

// تحميل الشحنات
async function loadShipments() {
    try {
        const shipmentsQuery = query(
            collection(db, 'shipments'),
            where('senderId', '==', dashboardState.currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(shipmentsQuery);
        dashboardState.shipments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateShipmentsUI();
        updateOverviewStats();
    } catch (error) {
        console.error('Error loading shipments:', error);
    }
}

// تحميل العروض
async function loadOffers() {
    try {
        // في الواقع، يجب جلب العروض المرتبطة بشحنات المستخدم
        const offersQuery = query(
            collection(db, 'offers'),
            where('shipmentOwnerId', '==', dashboardState.currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(offersQuery);
        dashboardState.offers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateOffersUI();
    } catch (error) {
        console.error('Error loading offers:', error);
        // استخدام بيانات تجريبية للعرض
        loadSampleOffers();
    }
}

// تحميل الإشعارات
async function loadNotifications() {
    try {
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', dashboardState.currentUser.uid),
            orderBy('createdAt', 'desc'),
            where('read', '==', false)
        );
        
        const querySnapshot = await getDocs(notificationsQuery);
        dashboardState.notifications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateNotificationsUI();
    } catch (error) {
        console.error('Error loading notifications:', error);
        loadSampleNotifications();
    }
}

// إعداد المستمعين في الوقت الحقيقي
function setupRealtimeListeners() {
    // مستمع للشحنات
    const shipmentsQuery = query(
        collection(db, 'shipments'),
        where('senderId', '==', dashboardState.currentUser.uid),
        orderBy('createdAt', 'desc')
    );
    
    onSnapshot(shipmentsQuery, (snapshot) => {
        dashboardState.shipments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateShipmentsUI();
        updateOverviewStats();
    });
    
    // مستمع للإشعارات
    const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', dashboardState.currentUser.uid),
        orderBy('createdAt', 'desc')
    );
    
    onSnapshot(notificationsQuery, (snapshot) => {
        dashboardState.notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateNotificationsUI();
    });
}

// إعداد مستمعي الأحداث
function setupDashboardEventListeners() {
    // تبديل الإشعارات
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    
    if (notificationsBtn && notificationsPanel) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsPanel.classList.toggle('show');
        });
        
        // إغلاق لوحة الإشعارات عند النقر خارجها
        document.addEventListener('click', function() {
            notificationsPanel.classList.remove('show');
        });
    }
    
    // فلاتر الشحنات
    const statusFilter = document.getElementById('statusFilter');
    const searchShipments = document.getElementById('searchShipments');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterShipments);
    }
    
    if (searchShipments) {
        searchShipments.addEventListener('input', searchShipments);
    }
    
    // النماذج
    setupDashboardForms();
    
    // الترجمة
    const languageSelect = document.getElementById('dashboardLanguage');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            if (window.changeLanguage) {
                window.changeLanguage(this.value);
            }
        });
    }
}

// إعداد النماذج
function setupDashboardForms() {
    const profileForm = document.getElementById('profileForm');
    const preferencesForm = document.getElementById('preferencesForm');
    const securityForm = document.getElementById('securityForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', handlePreferencesUpdate);
    }
    
    if (securityForm) {
        securityForm.addEventListener('submit', handlePasswordChange);
    }
}

// معالجة تحديث الملف الشخصي
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const city = document.getElementById('profileCity').value.trim();
    
    if (!name || !phone || !city) {
        showAlert('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    setLoading(true, 'profileForm');
    
    try {
        // تحديث البيانات في Firestore
        const userQuery = query(
            collection(db, 'users'),
            where('uid', '==', dashboardState.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(userQuery);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'users', userDoc.id), {
                name: name,
                phone: phone,
                city: city,
                updatedAt: serverTimestamp()
            });
            
            // تحديث الحالة المحلية
            dashboardState.userData.name = name;
            dashboardState.userData.phone = phone;
            dashboardState.userData.city = city;
            
            updateUserProfileUI();
            showAlert('تم تحديث الملف الشخصي بنجاح', 'success');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('حدث خطأ أثناء تحديث الملف الشخصي', 'error');
    } finally {
        setLoading(false, 'profileForm');
    }
}

// تحديث واجهة المستخدم
function updateDashboardUI() {
    updateUserProfileUI();
    updateOverviewStats();
    updateShipmentsUI();
    updateOffersUI();
    updateNotificationsUI();
}

function updateUserProfileUI() {
    const userName = document.getElementById('userName');
    const userType = document.getElementById('userType');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileCity = document.getElementById('profileCity');
    
    if (dashboardState.userData) {
        if (userName) userName.textContent = dashboardState.userData.name || 'المستخدم';
        if (userType) userType.textContent = getUserTypeLabel(dashboardState.userData.type);
        if (profileName) profileName.value = dashboardState.userData.name || '';
        if (profileEmail) profileEmail.value = dashboardState.userData.email || '';
        if (profilePhone) profilePhone.value = dashboardState.userData.phone || '';
        if (profileCity) profileCity.value = dashboardState.userData.city || '';
    }
}

function updateOverviewStats() {
    const totalShipments = document.getElementById('totalShipments');
    const activeShipments = document.getElementById('activeShipments');
    const averageRating = document.getElementById('averageRating');
    const totalDonations = document.getElementById('totalDonations');
    
    if (totalShipments) {
        totalShipments.textContent = dashboardState.shipments.length;
    }
    
    if (activeShipments) {
        const active = dashboardState.shipments.filter(s => s.status === 'active').length;
        activeShipments.textContent = active;
    }
    
    if (averageRating) {
        averageRating.textContent = dashboardState.userData?.rating?.toFixed(1) || '5.0';
    }
    
    if (totalDonations) {
        const donations = dashboardState.shipments.reduce((sum, shipment) => {
            return sum + (shipment.voluntaryDonation ? (shipment.budget || 0) * 0.01 : 0);
        }, 0);
        totalDonations.textContent = donations.toFixed(2);
    }
    
    drawCharts();
    loadRecentActivity();
}

function updateShipmentsUI() {
    const shipmentsGrid = document.getElementById('shipmentsGrid');
    
    if (!shipmentsGrid) return;
    
    if (dashboardState.shipments.length === 0) {
        shipmentsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد شحنات حتى الآن</h3>
                <p>أنشئ أول شحنة لك وابدأ في استخدام المنصة</p>
                <button class="btn-primary" onclick="createNewShipment()">
                    <i class="fas fa-plus"></i> إنشاء شحنة
                </button>
            </div>
        `;
        return;
    }
    
    shipmentsGrid.innerHTML = dashboardState.shipments.map(shipment => `
        <div class="shipment-card" onclick="showShipmentDetails('${shipment.id}')">
            <div class="shipment-header">
                <span class="shipment-id">#${shipment.id.slice(-6)}</span>
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
                <button class="btn-secondary" onclick="event.stopPropagation(); viewShipment('${shipment.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="btn-primary" onclick="event.stopPropagation(); trackShipment('${shipment.id}')">
                    <i class="fas fa-map"></i> تتبع
                </button>
            </div>
        </div>
    `).join('');
}

function updateOffersUI() {
    const offersList = document.getElementById('offersList');
    
    if (!offersList) return;
    
    if (dashboardState.offers.length === 0) {
        offersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-handshake"></i>
                <h3>لا توجد عروض حتى الآن</h3>
                <p>سيظهر هنا العروض المقدمة على شحناتك</p>
            </div>
        `;
        return;
    }
    
    offersList.innerHTML = dashboardState.offers.map(offer => `
        <div class="offer-card">
            <div class="offer-header">
                <div class="carrier-info">
                    <div class="carrier-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="carrier-details">
                        <h4>${offer.carrierName || 'ناقل'}</h4>
                        <div class="carrier-rating">
                            <i class="fas fa-star"></i>
                            <span>${offer.carrierRating || '5.0'}</span>
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
                    <span>${offer.vehicleType || 'مركبة'}</span>
                </div>
                <p class="offer-message">${offer.message || 'عرض للتوصيل'}</p>
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

function updateNotificationsUI() {
    const notificationsList = document.getElementById('notificationsList');
    const messagesBadge = document.getElementById('messagesBadge');
    const notificationCount = document.querySelector('.notification-count');
    
    const unreadCount = dashboardState.notifications.filter(n => !n.read).length;
    
    if (messagesBadge) {
        messagesBadge.textContent = unreadCount > 0 ? unreadCount : '';
        messagesBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    
    if (notificationCount) {
        notificationCount.textContent = unreadCount > 9 ? '9+' : unreadCount;
        notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    
    if (notificationsList) {
        if (dashboardState.notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <i class="fas fa-bell-slash"></i>
                    <p>لا توجد إشعارات جديدة</p>
                </div>
            `;
            return;
        }
        
        notificationsList.innerHTML = dashboardState.notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" 
                 onclick="markNotificationAsRead('${notification.id}')">
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${formatTime(notification.createdAt?.toDate())}</span>
                </div>
            </div>
        `).join('');
    }
}

// دوال العرض
function showSection(sectionName) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إخفاء جميع عناصر القائمة
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // عرض القسم المطلوب
    const targetSection = document.getElementById(sectionName);
    const targetMenuItem = document.querySelector(`[href="#${sectionName}"]`).parentElement;
    
    if (targetSection && targetMenuItem) {
        targetSection.classList.add('active');
        targetMenuItem.classList.add('active');
        
        // تحديث العنوان
        updatePageTitle(sectionName);
        
        // تحميل بيانات القسم إذا لزم الأمر
        loadSectionData(sectionName);
    }
}

function showSettingsTab(tabName) {
    // إخفاء جميع علامات التبويب
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إزالة النشاط من الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // عرض علامة التبويب المطلوبة
    const targetTab = document.getElementById(tabName + 'Settings');
    const targetBtn = event.target;
    
    if (targetTab && targetBtn) {
        targetTab.classList.add('active');
        targetBtn.classList.add('active');
    }
}

// دوال المساعدة
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

function getUserTypeLabel(type) {
    const labels = {
        'sender': 'مرسل',
        'carrier': 'ناقل',
        'both': 'مرسل وناقل',
        'admin': 'مسؤول'
    };
    return labels[type] || type;
}

function formatTime(date) {
    if (!date) return 'الآن';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return 'الآن';
}

// دوال التفاعل
async function createNewShipment() {
    window.location.href = 'index.html#quickShipment';
}

async function showShipmentDetails(shipmentId) {
    const shipment = dashboardState.shipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    
    const modal = document.getElementById('shipmentDetailsModal');
    const content = document.getElementById('shipmentDetailsContent');
    
    if (modal && content) {
        content.innerHTML = `
            <div class="shipment-details-content">
                <div class="detail-row">
                    <strong>رقم الشحنة:</strong>
                    <span>#${shipment.id.slice(-6)}</span>
                </div>
                <div class="detail-row">
                    <strong>المسار:</strong>
                    <span>${shipment.fromCity} → ${shipment.toCity}</span>
                </div>
                <div class="detail-row">
                    <strong>نوع الشحنة:</strong>
                    <span>${getShipmentTypeLabel(shipment.shipmentType)}</span>
                </div>
                <div class="detail-row">
                    <strong>الوزن:</strong>
                    <span>${shipment.weight}</span>
                </div>
                <div class="detail-row">
                    <strong>الميزانية:</strong>
                    <span>${shipment.budget} ريال</span>
                </div>
                <div class="detail-row">
                    <strong>الحالة:</strong>
                    <span class="shipment-status ${shipment.status}">${getStatusLabel(shipment.status)}</span>
                </div>
                <div class="detail-row">
                    <strong>الوصف:</strong>
                    <span>${shipment.description || 'لا يوجد وصف'}</span>
                </div>
                <div class="detail-actions">
                    <button class="btn-primary" onclick="trackShipment('${shipment.id}')">
                        <i class="fas fa-map"></i> تتبع الشحنة
                    </button>
                    <button class="btn-secondary" onclick="closeModal('shipmentDetailsModal')">
                        <i class="fas fa-times"></i> إغلاق
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }
}

async function acceptOffer(offerId) {
    try {
        // في الواقع، يجب تحديث حالة العرض في قاعدة البيانات
        showAlert('تم قبول العرض بنجاح', 'success');
        
        // إزالة العرض من القائمة
        dashboardState.offers = dashboardState.offers.filter(offer => offer.id !== offerId);
        updateOffersUI();
        
    } catch (error) {
        console.error('Error accepting offer:', error);
        showAlert('حدث خطأ أثناء قبول العرض', 'error');
    }
}

// تسجيل الخروج
async function logout() {
    try {
        await signOut(auth);
        showAlert('تم تسجيل الخروج بنجاح', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// إعادة التوجيه لتسجيل الدخول
function redirectToLogin() {
    window.location.href = 'index.html';
}

// جعل الدوال متاحة globally
window.showSection = showSection;
window.showSettingsTab = showSettingsTab;
window.createNewShipment = createNewShipment;
window.showShipmentDetails = showShipmentDetails;
window.acceptOffer = acceptOffer;
window.negotiateOffer = function(offerId) {
    showAlert('تم فتح نافذة التفاوض', 'info');
};
window.rejectOffer = function(offerId) {
    if (confirm('هل أنت متأكد من رفض هذا العرض؟')) {
        dashboardState.offers = dashboardState.offers.filter(offer => offer.id !== offerId);
        updateOffersUI();
        showAlert('تم رفض العرض', 'success');
    }
};
window.logout = logout;
window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

// بيانات تجريبية للعرض
function loadSampleOffers() {
    dashboardState.offers = [
        {
            id: 'OF-001',
            carrierName: 'أحمد محمد',
            carrierRating: 4.8,
            price: 150,
            estimatedTime: '2 ساعة',
            vehicleType: 'سيارة',
            message: 'يمكنني التوصيل اليوم خلال ساعتين'
        },
        {
            id: 'OF-002',
            carrierName: 'خالد سعيد',
            carrierRating: 4.5,
            price: 200,
            estimatedTime: '4 ساعات',
            vehicleType: 'شاحنة صغيرة',
            message: 'متاح غداً صباحاً للتوصيل'
        }
    ];
    
    updateOffersUI();
}

function loadSampleNotifications() {
    dashboardState.notifications = [
        {
            id: 'NOT-001',
            title: 'عرض جديد',
            message: 'هناك عرض جديد على شحنتك من أحمد',
            read: false,
            createdAt: new Date(Date.now() - 300000) // 5 minutes ago
        },
        {
            id: 'NOT-002',
            title: 'شحنة مكتملة',
            message: 'تم تسليم شحنتك رقم #123456 بنجاح',
            read: false,
            createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        }
    ];
    
    updateNotificationsUI();
}

// المخططات البيانية
function drawCharts() {
    drawShipmentsChart();
    drawTypesChart();
}

function drawShipmentsChart() {
    const ctx = document.getElementById('shipmentsChart');
    if (!ctx) return;
    
    // بيانات تجريبية
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            datasets: [{
                label: 'عدد الشحنات',
                data: [12, 19, 15, 25, 22, 30],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function drawTypesChart() {
    const ctx = document.getElementById('typesChart');
    if (!ctx) return;
    
    // بيانات تجريبية
    new Chart(ctx, {
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

// النشاطات الأخيرة
function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
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

// دوال التحميل
function showLoading() {
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) {
        loadingBar.classList.add('active');
    }
}

function hideLoading() {
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) {
        loadingBar.classList.remove('active');
    }
}

function setLoading(loading, formId = null) {
    const buttons = formId ? 
        document.querySelectorAll(`#${formId} button[type="submit"]`) :
        document.querySelectorAll('button[type="submit"]');
    
    buttons.forEach(button => {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
        } else {
            button.disabled = false;
            // إعادة تعيين نص الزر
            if (window.i18n) {
                window.i18n.applyTranslations();
            }
        }
    });
}

// نظام الإشعارات
function showAlert(message, type = 'info') {
    // استخدام نظام الإشعارات الموجود في script.js
    if (window.showAlert) {
        window.showAlert(message, type);
    } else {
        // نسخة احتياطية
        alert(message);
    }
}

// تصفية الشحنات
function filterShipments() {
    const status = document.getElementById('statusFilter').value;
    let filteredShipments = dashboardState.shipments;
    
    if (status !== 'all') {
        filteredShipments = dashboardState.shipments.filter(s => s.status === status);
    }
    
    displayFilteredShipments(filteredShipments);
}

function searchShipments() {
    const searchTerm = document.getElementById('searchShipments').value.toLowerCase();
    const filteredShipments = dashboardState.shipments.filter(s => 
        s.fromCity.toLowerCase().includes(searchTerm) ||
        s.toCity.toLowerCase().includes(searchTerm) ||
        s.shipmentType.toLowerCase().includes(searchTerm)
    );
    
    displayFilteredShipments(filteredShipments);
}

function displayFilteredShipments(shipments) {
    const shipmentsGrid = document.getElementById('shipmentsGrid');
    
    if (!shipmentsGrid) return;
    
    if (shipments.length === 0) {
        shipmentsGrid.innerHTML = '<p class="no-results">لا توجد نتائج</p>';
        return;
    }
    
    shipmentsGrid.innerHTML = shipments.map(shipment => `
        <div class="shipment-card" onclick="showShipmentDetails('${shipment.id}')">
            <div class="shipment-header">
                <span class="shipment-id">#${shipment.id.slice(-6)}</span>
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
        </div>
    `).join('');
}
