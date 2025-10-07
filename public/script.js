// script.js - الإصدار الكامل مع Firebase
// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    checkAuthStatus();
});

// تهيئة الصفحة
function initializePage() {
    addLoadingEffect();
    initializeForms();
    initializeLanguage();
    updateDonationAmount();
}

// إضافة تأثير التحميل
function addLoadingEffect() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
    
    setTimeout(() => {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 300);
    }, 1000);
}

// تهيئة مستمعي الأحداث
function setupEventListeners() {
    const shipmentForm = document.getElementById('shipmentForm');
    if (shipmentForm) {
        shipmentForm.addEventListener('submit', handleCreateShipment);
    }
    
    const budgetInput = document.getElementById('budget');
    const donationCheckbox = document.getElementById('voluntaryDonation');
    if (budgetInput && donationCheckbox) {
        budgetInput.addEventListener('input', updateDonationAmount);
        donationCheckbox.addEventListener('change', updateDonationAmount);
    }
    
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.addEventListener('change', changeLanguage);
    }
    
    setupSmoothScrolling();
    window.addEventListener('scroll', updateHeaderOnScroll);
}

// دالة تسجيل الدخول الجديدة
async function handleLogin() {
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // استخدام Firebase مباشرة
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // حفظ بيانات المستخدم
        const userData = {
            id: user.uid,
            name: user.displayName || email.split('@')[0],
            email: user.email,
            type: 'sender'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        showSuccessMessage('تم تسجيل الدخول بنجاح!');
        
        setTimeout(() => {
            closeModal('loginModal');
            updateUIForLoggedInUser(userData);
        }, 1000);
        
    } catch (error) {
        showErrorMessage('خطأ في تسجيل الدخول: ' + error.message);
    }
}

// دالة التسجيل الجديدة
async function handleRegister() {
    try {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('regPhone').value;
        const type = document.getElementById('regType').value;
        const password = document.getElementById('regPassword').value;
        
        // استخدام Firebase مباشرة
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // تحديث الاسم
        await user.updateProfile({
            displayName: name
        });
        
        // حفظ بيانات المستخدم
        const userData = {
            id: user.uid,
            name: name,
            email: email,
            phone: phone,
            type: type
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        showSuccessMessage('تم إنشاء الحساب بنجاح!');
        
        setTimeout(() => {
            closeModal('registerModal');
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showErrorMessage('خطأ في إنشاء الحساب: ' + error.message);
    }
}

// معالجة إنشاء الشحنة
async function handleCreateShipment(e) {
    e.preventDefault();
    
    const shipmentData = {
        fromCity: document.getElementById('fromCity').value,
        toCity: document.getElementById('toCity').value,
        shipmentType: document.getElementById('shipmentType').value,
        weight: document.getElementById('weight').value,
        budget: document.getElementById('budget').value,
        urgency: document.getElementById('urgency').value,
        description: document.getElementById('description').value,
        donation: document.getElementById('voluntaryDonation').checked,
        timestamp: new Date().toISOString()
    };
    
    try {
        showLoading();
        saveShipmentToLocal(shipmentData);
        await simulateServerRequest();
        showSuccessMessage('تم إنشاء الشحنة بنجاح! سيتم توجيهك إلى لوحة التحكم...');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        showErrorMessage('حدث خطأ أثناء إنشاء الشحنة. حاول مرة أخرى.');
    } finally {
        hideLoading();
    }
}

// حفظ الشحنة في localStorage
function saveShipmentToLocal(shipmentData) {
    let shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
    shipmentData.id = 'SH-' + Date.now();
    shipments.push(shipmentData);
    localStorage.setItem('shipments', JSON.stringify(shipments));
}

// تحديث حساب العمولة الطوعية
function updateDonationAmount() {
    const budget = parseFloat(document.getElementById('budget').value) || 0;
    const donationCheckbox = document.getElementById('voluntaryDonation');
    const donationAmount = document.getElementById('donationAmount');
    
    if (donationCheckbox.checked && budget > 0) {
        const amount = budget * 0.01;
        donationAmount.textContent = amount.toFixed(2) + ' ريال';
    } else {
        donationAmount.textContent = '0 ريال';
    }
}

// تغيير اللغة
function changeLanguage(e) {
    const language = e.target.value;
    if (language === 'en') {
        document.body.style.direction = 'ltr';
        document.body.style.textAlign = 'left';
    } else {
        document.body.style.direction = 'rtl';
        document.body.style.textAlign = 'right';
    }
}

// التنقل السلس
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// تحديث الهيدر عند التمرير
function updateHeaderOnScroll() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'var(--white)';
        header.style.backdropFilter = 'none';
    }
}

// نافذة تسجيل الدخول
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

// نافذة التسجيل
function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
}

// إغلاق النافذة
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// التبديل بين التسجيل وتسجيل الدخول
function switchToRegister() {
    closeModal('loginModal');
    showRegister();
}

// إظهار نموذج إنشاء الشحنة
function showCreateShipment() {
    document.getElementById('quickShipment').scrollIntoView({
        behavior: 'smooth'
    });
}

// إظهار تسجيل الناقل
function showCarrierRegister() {
    showRegister();
    setTimeout(() => {
        document.getElementById('regType').value = 'carrier';
    }, 100);
}

// التحقق من حالة المصادقة
function checkAuthStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        updateUIForLoggedInUser(JSON.parse(user));
    }
}

// تحديث واجهة المستخدم للمستخدم المسجل
function updateUIForLoggedInUser(user) {
    const authButtons = document.querySelector('.auth-buttons');
    authButtons.innerHTML = `
        <div class="user-menu">
            <span>مرحباً، ${user.name}</span>
            <button onclick="goToDashboard()">لوحة التحكم</button>
            <button onclick="logout()">خروج</button>
        </div>
    `;
}

// الذهاب إلى لوحة التحكم
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// إظهار تأثير التحميل
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
}

// إخفاء تأثير التحميل
function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
}

// إظهار رسالة النجاح
function showSuccessMessage(message) {
    const toast = createToast(message, 'success');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// إظهار رسالة الخطأ
function showErrorMessage(message) {
    const toast = createToast(message, 'error');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// إنشاء رسالة توست
function createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    return toast;
}

// محاكاة طلب الخادم
function simulateServerRequest() {
    return new Promise(resolve => {
        setTimeout(resolve, 1500);
    });
}

// تهيئة النماذج
function initializeForms() {
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // نموذج التسجيل
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister();
        });
    }
}

// تهيئة اللغة
function initializeLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'ar';
    document.getElementById('language').value = savedLanguage;
    
    if (savedLanguage === 'en') {
        document.body.style.direction = 'ltr';
        document.body.style.textAlign = 'left';
    }
}

// إضافة أنماط التوست
const toastStyles = `
<style>
.toast {
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 3000;
    animation: slideInRight 0.3s ease;
}

.toast-success {
    border-right: 4px solid #10b981;
    color: #10b981;
}

.toast-error {
    border-right: 4px solid #ef4444;
    color: #ef4444;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', toastStyles);

// تصدير الدوال للاستخدام الخارجي
window.showLogin = showLogin;
window.showRegister = showRegister;
window.closeModal = closeModal;
window.switchToRegister = switchToRegister;
window.showCreateShipment = showCreateShipment;
window.showCarrierRegister = showCarrierRegister;
window.goToDashboard = goToDashboard;
window.logout = logout;