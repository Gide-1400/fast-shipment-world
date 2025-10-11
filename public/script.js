// script.js - نسخة مبسطة ومضمونة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الموقع بنجاح');
    setupBasicFunctionality();
});

function setupBasicFunctionality() {
    // النماذج الأساسية
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const shipmentForm = document.getElementById('quickShipmentForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showAlert('سيتم تفعيل تسجيل الدخول قريباً', 'info');
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showAlert('سيتم تفعيل إنشاء الحساب قريباً', 'info');
        });
    }

    if (shipmentForm) {
        shipmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showAlert('تم إرسال طلب الشحنة بنجاح!', 'success');
            shipmentForm.reset();
        });
    }

    // التنقل السلس
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
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

/* ---------- دوال التحكم بالنوافذ المنبثقة ---------- */
function showLogin() {
    document.getElementById('loginModal').style.display = 'flex';
}

function showRegister() {
    document.getElementById('registerModal').style.display = 'flex';
}

function showCreateShipment() {
    document.getElementById('quickShipment').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchToRegister() {
    closeModal('loginModal');
    setTimeout(() => showRegister(), 300);
}

/* ---------- إغلاق النافذة المنبثقة بالنقر خارجها ---------- */
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/* ---------- عرض التنبيهات ---------- */
function showAlert(message, type = 'info') {
    // إزالة أي تنبيهات سابقة
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(alert);

    // إزالة التنبيه تلقائيًا بعد 5 ثوانٍ
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}