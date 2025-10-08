// i18n.js - نظام الترجمة المتقدم
class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('preferredLanguage') || 'ar';
        this.translations = {};
        this.fallbackTranslations = {};
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            await this.loadTranslations();
            this.applyTranslations();
            this.setDirection();
            this.isInitialized = true;
            
            // إرسال حدث أن النظام جاهز
            window.dispatchEvent(new CustomEvent('i18nReady'));
        } catch (error) {
            console.error('Failed to initialize i18n:', error);
            this.loadFallbackTranslations();
        }
    }

    async loadTranslations() {
        try {
            const response = await fetch(`./translations/${this.currentLang}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            this.translations = await response.json();
        } catch (error) {
            console.warn('Using fallback translations');
            this.loadFallbackTranslations();
        }
    }

    loadFallbackTranslations() {
        this.translations = {
            // الترجمات الأساسية
            "app.title": this.currentLang === 'ar' ? "الشحنة السريعة - منصة الشحن العالمية" : "Fast Ship - Global Shipping Platform",
            "app.name": this.currentLang === 'ar' ? "الشحنة السريعة" : "Fast Ship",
            
            // التنقل
            "nav.home": this.currentLang === 'ar' ? "الرئيسية" : "Home",
            "nav.features": this.currentLang === 'ar' ? "المميزات" : "Features",
            "nav.howItWorks": this.currentLang === 'ar' ? "كيف تعمل" : "How It Works",
            "nav.contact": this.currentLang === 'ar' ? "تواصل معنا" : "Contact Us",
            
            // المصادقة
            "auth.login": this.currentLang === 'ar' ? "تسجيل الدخول" : "Login",
            "auth.register": this.currentLang === 'ar' ? "إنشاء حساب" : "Register",
            "auth.email": this.currentLang === 'ar' ? "البريد الإلكتروني" : "Email",
            "auth.password": this.currentLang === 'ar' ? "كلمة المرور" : "Password",
            
            // القسم الرئيسي
            "hero.title": this.currentLang === 'ar' ? "🌍 من حيك إلى العالم" : "🌍 From Your Neighborhood to the World",
            "hero.subtitle": this.currentLang === 'ar' ? "شحن سريع - عمولة طوعية - تقييمات موثوقة" : "Fast Shipping - Voluntary Commission - Trusted Ratings",
            "hero.description": this.currentLang === 'ar' ? "أول منصة عالمية تجمع بين مرسلي الشحنات والناقلين من جميع أنواع النقل من دراجة نارية إلى سفينة - من تاكسي إلى طائرة - بدون عمولة إجبارية!" : "The first global platform connecting shipment senders with carriers of all transport types - from motorcycle to ship - from taxi to plane - with no mandatory commission!",
            "hero.shipments": this.currentLang === 'ar' ? "شحنة ناجحة" : "Successful Shipments",
            "hero.carriers": this.currentLang === 'ar' ? "ناقل موثوق" : "Trusted Carriers",
            "hero.commission": this.currentLang === 'ar' ? "عمولة إجبارية" : "Mandatory Commission",
            "hero.sendShipment": this.currentLang === 'ar' ? "أرسل شحنة الآن" : "Send Shipment Now",
            "hero.beCarrier": this.currentLang === 'ar' ? "كن ناقلاً" : "Become a Carrier"
        };
    }

    applyTranslations() {
        // تحديث جميع العناصر التي تحتوي على data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'OPTION') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // تحديث عنوان الصفحة
        const title = this.t('app.title');
        if (title) {
            document.title = title;
        }

        // تحديث اتجاه الصفحة
        this.setDirection();
    }

    setDirection() {
        const isRTL = this.currentLang === 'ar';
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLang;
        document.documentElement.classList.toggle('rtl', isRTL);
        document.documentElement.classList.toggle('ltr', !isRTL);
    }

    async changeLanguage(lang) {
        if (this.currentLang === lang) return;
        
        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        await this.loadTranslations();
        this.applyTranslations();
        this.setDirection();
        
        // إرسال حدث تغيير اللغة
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
        
        console.log(`Language changed to: ${lang}`);
    }

    t(key, params = {}) {
        let translation = this.translations[key] || key;
        
        // استبدال المعاملات
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{{${param}}}`, params[param]);
        });
        
        return translation;
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    isRTL() {
        return this.currentLang === 'ar';
    }
}

// إنشاء نسخة عامة
const i18n = new I18n();

// دالة تغيير اللغة للاستخدام العام
function changeLanguage(lang) {
    i18n.changeLanguage(lang);
}

// دالة الحصول على الترجمة
function t(key, params) {
    return i18n.t(key, params);
}

// جعل الدوال متاحة globally
window.i18n = i18n;
window.changeLanguage = changeLanguage;
window.t = t;

// تصدير للاستخدام في الموديولات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { i18n, changeLanguage, t };
}