// script.js - الملف الرئيسي للتطبيق
import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    googleProvider,
    signInWithPopup,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp,
    getFirebaseError
} from './firebase.js';

// حالة التطبيق
let appState = {
    currentUser: null,
    isLoading: false,
    language: 'ar'
};

// تهيئة التطبيق
async function initApp() {
    showLoading();
    
    try {
        // تهيئة نظام الترجمة
        await waitForI18n();
        
        // إعداد مستمعي الأحداث
        setupEventListeners();
        
        // التحقق من حالة المصادقة
        setupAuthListener();
        
        // إعداد النماذج
        setupForms();
        
        // إعداد التنقل
        setupNavigation();
        
        hideLoading();
        
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        hideLoading();
        showAlert('فشل في تهيئة التطبيق', 'error');
    }
}

// انتظار تهيئة نظام الترجمة
function waitForI18n() {
    return new Promise((resolve) => {
        if (window.i18n && window.i18n.isInitialized) {
            resolve();
        } else {
            window.addEventListener('i18nReady', resolve);
        }
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // التمرير للنافذة
    window.addEventListener('scroll', handleScroll);
    
    // النقر خارج النماذج
    window.addEventListener('click', handleOutsideClick);
    
    // تغيير اللغة
    window.addEventListener('languageChanged', handleLanguageChange);
    
    // إعادة تحجيم النافذة
    window.addEventListener('resize', handleResize);
}

// إعداد نظام المصادقة
function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            handleUserLogin(user);
        } else {
            handleUserLogout();
        }
    });
}

async function handleUserLogin(user) {
    try {
        appState.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        };
        
        // الحصول على بيانات إضافية من Firestore
        const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(userQuery);
        
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            appState.currentUser = { ...appState.currentUser, ...userData };
        }
        
        updateUIForAuthenticatedUser();
        showAlert(`مرحباً ${user.displayName || user.email}`, 'success');
        
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function handleUserLogout() {
    appState.currentUser = null;
    updateUIForUnauthenticatedUser();
    localStorage.removeItem('currentUser');
}

// إعداد النماذج
function setupForms() {
    setupAuthForms();
    setupShipmentForm();
    setupCarrierForm();
}

function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        setupPasswordToggle('loginPassword');
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        setupPasswordToggle('regPassword');
        setupPasswordToggle('regConfirmPassword');
        setupPasswordStrength();
    }
}

// معالجة تسجيل الدخول
async function handleLogin(e) {
    e.preventDefault();
    if (appState.isLoading) return;
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!validateEmail(email)) {
        showAlert('البريد الإلكتروني غير صالح', 'error');
        return;
    }
    
    if (!password) {
        showAlert('يرجى إدخال كلمة المرور', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        showAlert('تم تسجيل الدخول بنجاح', 'success');
        closeModal('loginModal');
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert(getFirebaseError(error), 'error');
    } finally {
        setLoading(false);
    }
}

// معالجة التسجيل
async function handleRegister(e) {
    e.preventDefault();
    if (appState.isLoading) return;
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const type = document.getElementById('regType').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // التحقق من البيانات
    if (!validateRegistrationData({ name, email, phone, type, password, confirmPassword, agreeTerms })) {
        return;
    }
    
    setLoading(true);
    
    try {
        // إنشاء المستخدم
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // تحديث الملف الشخصي
        await updateProfile(user, {
            displayName: name
        });
        
        // حفظ البيانات الإضافية في Firestore
        const userData = {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            type: type,
            createdAt: serverTimestamp(),
            rating: 5.0,
            totalShipments: 0,
            status: 'active'
        };
        
        await addDoc(collection(db, 'users'), userData);
        
        showAlert('تم إنشاء الحساب بنجاح', 'success');
        closeModal('registerModal');
        
    } catch (error) {
        console.error('Registration error:', error);
        showAlert(getFirebaseError(error), 'error');
    } finally {
        setLoading(false);
    }
}

// التحقق من بيانات التسجيل
function validateRegistrationData(data) {
    const { name, email, phone, type, password, confirmPassword, agreeTerms } = data;
    
    if (!name || name.length < 2) {
        showAlert('الاسم يجب أن يكون至少 حرفين', 'error');
        return false;
    }
    
    if (!validateEmail(email)) {
        showAlert('البريد الإلكتروني غير صالح', 'error');
        return false;
    }
    
    if (!validatePhone(phone)) {
        showAlert('رقم الجوال غير صالح', 'error');
        return false;
    }
    
    if (!type) {
        showAlert('يرجى اختيار نوع الحساب', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showAlert('كلمات المرور غير متطابقة', 'error');
        return false;
    }
    
    if (!agreeTerms) {
        showAlert('يرجى الموافقة على الشروط والأحكام', 'error');
        return false;
    }
    
    return true;
}

// تسجيل الدخول بـ Google
async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        showAlert('تم تسجيل الدخول بنجاح', 'success');
        closeModal('loginModal');
    } catch (error) {
        console.error('Google login error:', error);
        showAlert(getFirebaseError(error), 'error');
    }
}

async function registerWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // حفظ بيانات المستخدم في Firestore
        const userData = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            type: 'both',
            createdAt: serverTimestamp(),
            rating: 5.0,
            totalShipments: 0,
            status: 'active'
        };
        
        await addDoc(collection(db, 'users'), userData);
        
        showAlert('تم إنشاء الحساب بنجاح', 'success');
        closeModal('registerModal');
        
    } catch (error) {
        console.error('Google registration error:', error);
        showAlert(getFirebaseError(error), 'error');
    }
}

// إعداد نموذج الشحنة
function setupShipmentForm() {
    const form = document.getElementById('shipmentForm');
    if (!form) return;
    
    form.addEventListener('submit', handleShipmentCreation);
    
    // متابعة التبرعات
    const budgetInput = document.getElementById('budget');
    const donationCheckbox = document.getElementById('voluntaryDonation');
    
    if (budgetInput && donationCheckbox) {
        budgetInput.addEventListener('input', updateDonationAmount);
        donationCheckbox.addEventListener('change', updateDonationAmount);
    }
}

async function handleShipmentCreation(e) {
    e.preventDefault();
    
    if (!appState.currentUser) {
        showAlert('يرجى تسجيل الدخول أولاً', 'error');
        showLogin();
        return;
    }
    
    const formData = getShipmentFormData();
    if (!formData) return;
    
    setLoading(true);
    
    try {
        const shipmentData = {
            ...formData,
            senderId: appState.currentUser.uid,
            senderName: appState.currentUser.displayName || appState.currentUser.name,
            status: 'active',
            createdAt: serverTimestamp(),
            offers: [],
            views: 0
        };
        
        await addDoc(collection(db, 'shipments'), shipmentData);
        
        showAlert('تم إنشاء الشحنة بنجاح!', 'success');
        document.getElementById('shipmentForm').reset();
        updateDonationAmount();
        
    } catch (error) {
        console.error('Error creating shipment:', error);
        showAlert('حدث خطأ أثناء إنشاء الشحنة', 'error');
    } finally {
        setLoading(false);
    }
}

function getShipmentFormData() {
    const fromCity = document.getElementById('fromCity').value.trim();
    const toCity = document.getElementById('toCity').value.trim();
    const shipmentType = document.getElementById('shipmentType').value;
    const weight = document.getElementById('weight').value.trim();
    const budget = document.getElementById('budget').value;
    const urgency = document.getElementById('urgency').value;
    const description = document.getElementById('description').value.trim();
    const voluntaryDonation = document.getElementById('voluntaryDonation').checked;
    
    if (!fromCity || !toCity || !shipmentType || !weight || !budget) {
        showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
        return null;
    }
    
    if (parseFloat(budget) <= 0) {
        showAlert('الميزانية يجب أن تكون أكبر من الصفر', 'error');
        return null;
    }
    
    return {
        fromCity,
        toCity,
        shipmentType,
        weight,
        budget: parseFloat(budget),
        urgency,
        description,
        voluntaryDonation
    };
}

// دوال المساعدة
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

function setupPasswordToggle(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input?.parentElement.querySelector('.password-toggle');
    
    if (toggle) {
        toggle.addEventListener('click', function() {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
}

function setupPasswordStrength() {
    const passwordInput = document.getElementById('regPassword');
    const strengthElement = document.getElementById('passwordStrength');
    
    if (passwordInput && strengthElement) {
        passwordInput.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            strengthElement.textContent = strength.text;
            strengthElement.className = `password-strength ${strength.level}`;
        });
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const levels = [
        { level: 'weak', text: 'ضعيفة' },
        { level: 'medium', text: 'متوسطة' },
        { level: 'strong', text: 'قوية' },
        { level: 'very-strong', text: 'قوية جداً' }
    ];
    
    return levels[Math.min(score, levels.length - 1)];
}

// التحقق من البيانات
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[0-9]{10,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// تحديث واجهة المستخدم
function updateUIForAuthenticatedUser() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;
    
    authButtons.innerHTML = `
        <button class="btn-secondary" onclick="goToDashboard()">
            <i class="fas fa-tachometer-alt"></i>
            <span data-i18n="nav.dashboard">لوحة التحكم</span>
        </button>
        <button class="btn-logout" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i>
            <span data-i18n="auth.logout">تسجيل الخروج</span>
        </button>
    `;
    
    // إعادة تطبيق الترجمات
    if (window.i18n) {
        window.i18n.applyTranslations();
    }
}

function updateUIForUnauthenticatedUser() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;
    
    authButtons.innerHTML = `
        <button class="btn-login" onclick="showLogin()" data-i18n="auth.login">تسجيل الدخول</button>
        <button class="btn-register" onclick="showRegister()" data-i18n="auth.register">إنشاء حساب</button>
    `;
    
    // إعادة تطبيق الترجمات
    if (window.i18n) {
        window.i18n.applyTranslations();
    }
}

// دوال النوافذ المنبثقة
function showLogin() {
    showModal('loginModal');
}

function showRegister() {
    showModal('registerModal');
}

function showCarrierRegister() {
    if (!appState.currentUser) {
        showAlert('يرجى تسجيل الدخول أولاً', 'error');
        showLogin();
        return;
    }
    showModal('carrierModal');
}

function showCreateShipment() {
    if (!appState.currentUser) {
        showAlert('يرجى تسجيل الدخول أولاً', 'error');
        showLogin();
        return;
    }
    document.getElementById('quickShipment').scrollIntoView({ behavior: 'smooth' });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function switchToRegister() {
    closeModal('loginModal');
    showRegister();
}

function switchToLogin() {
    closeModal('registerModal');
    showLogin();
}

// إعداد التنقل
function setupNavigation() {
    // التنقل السلس
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // القائمة المتنقلة
    setupMobileMenu();
    
    // زر العودة للأعلى
    setupScrollToTop();
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.getElementById('mainNav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
}

function toggleMobileMenu() {
    const nav = document.getElementById('mainNav');
    if (nav) {
        nav.classList.toggle('active');
    }
}

function setupScrollToTop() {
    const scrollButton = document.getElementById('scrollToTop');
    if (scrollButton) {
        window.addEventListener('scroll', toggleScrollButton);
    }
}

function toggleScrollButton() {
    const scrollButton = document.getElementById('scrollToTop');
    if (scrollButton) {
        if (window.pageYOffset > 300) {
            scrollButton.classList.add('show');
        } else {
            scrollButton.classList.remove('show');
        }
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// معالجة الأحداث
function handleScroll() {
    toggleScrollButton();
    updateActiveNavLink();
}

function handleOutsideClick(e) {
    // إغلاق النماذج عند النقر خارجها
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
    
    // إغلاق القائمة المتنقلة عند النقر خارجها
    const nav = document.getElementById('mainNav');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (nav && nav.classList.contains('active') && 
        !nav.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
        nav.classList.remove('active');
    }
}

function handleLanguageChange(event) {
    console.log('Language changed to:', event.detail.language);
    // إعادة تحميل البيانات إذا لزم الأمر
}

function handleResize() {
    // إغلاق القائمة المتنقلة على الشاشات الكبيرة
    if (window.innerWidth > 768) {
        const nav = document.getElementById('mainNav');
        if (nav) {
            nav.classList.remove('active');
        }
    }
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// نظام الإشعارات
function showAlert(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${getAlertIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(alert);
    
    // إضافة الأنماط إذا لزم الأمر
    if (!document.querySelector('#alert-styles')) {
        const styles = document.createElement('style');
        styles.id = 'alert-styles';
        styles.textContent = `
            .notifications-container {
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            }
            .alert {
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                animation: slideInRight 0.3s ease;
                border-right: 4px solid;
            }
            .alert-success { border-color: #10b981; }
            .alert-error { border-color: #ef4444; }
            .alert-info { border-color: #3b82f6; }
            .alert-warning { border-color: #f59e0b; }
            .alert-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            .alert-close {
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 5px;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // إزالة التنبيه تلقائياً
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, duration);
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'info': 'info-circle',
        'warning': 'exclamation-triangle'
    };
    return icons[type] || 'info-circle';
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

function setLoading(loading) {
    appState.isLoading = loading;
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
        } else {
            button.disabled = false;
            // إعادة تعيين نص الزر (سيتم تطبيق الترجمات تلقائياً)
            if (window.i18n) {
                window.i18n.applyTranslations();
            }
        }
    });
}

// تسجيل الخروج
async function logout() {
    try {
        await signOut(auth);
        showAlert('تم تسجيل الخروج بنجاح', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

// جعل الدوال متاحة globally
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showCarrierRegister = showCarrierRegister;
window.showCreateShipment = showCreateShipment;
window.closeModal = closeModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.logout = logout;
window.goToDashboard = goToDashboard;
window.changeLanguage = changeLanguage;
window.scrollToTop = scrollToTop;
window.togglePassword = function(inputId) {
    setupPasswordToggle(inputId);
};
window.loginWithGoogle = loginWithGoogle;
window.registerWithGoogle = registerWithGoogle;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);
