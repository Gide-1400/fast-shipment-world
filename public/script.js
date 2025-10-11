// script.js – نسخة محسنة ومصححة
document.addEventListener('DOMContentLoaded', function() {
    setupAuthForms();
    setupShipmentForm();
    checkAuthState();
});

/* ---------- إعداد نماذج المصادقة ---------- */
function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (regForm) {
        regForm.addEventListener('submit', handleRegister);
    }
}

/* ---------- معالجة تسجيل الدخول ---------- */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value.trim();
    
    if (!email || !pass) {
        showAlert('يرجى ملء جميع الحقول', 'error');
        return;
    }

    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, pass);
        const user = userCredential.user;
        
        // الحصول على بيانات المستخدم الإضافية
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        const userInfo = {
            id: user.uid,
            name: userData?.name || user.displayName || email.split('@')[0],
            email: user.email,
            type: userData?.type || 'sender',
            phone: userData?.phone || ''
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        showAlert('تم تسجيل الدخول بنجاح', 'success');
        closeModal('loginModal');
        
        // توجيه إلى لوحة التحكم بعد ثانية
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (err) {
        console.error('Login error:', err);
        showAlert('خطأ في تسجيل الدخول: ' + err.message, 'error');
    }
}

/* ---------- معالجة التسجيل ---------- */
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const type = document.getElementById('regType')?.value;
    const pass = document.getElementById('regPassword')?.value.trim();
    
    if (!name || !email || !phone || !type || !pass) {
        showAlert('يرجى ملء جميع الحقول', 'error');
        return;
    }

    if (pass.length < 6) {
        showAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, pass);
        const user = userCredential.user;
        
        // تحديث الملف الشخصي
        await user.updateProfile({
            displayName: name
        });

        // حفظ البيانات الإضافية في Firestore
        await firebase.firestore().collection('users').doc(user.uid).set({
            name: name,
            email: email,
            phone: phone,
            type: type,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            rating: 5,
            completedShipments: 0
        });

        const userInfo = {
            id: user.uid,
            name: name,
            email: email,
            type: type,
            phone: phone
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        showAlert('تم إنشاء الحساب بنجاح', 'success');
        closeModal('registerModal');
        
        // توجيه إلى لوحة التحكم بعد ثانية
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (err) {
        console.error('Registration error:', err);
        showAlert('خطأ في إنشاء الحساب: ' + err.message, 'error');
    }
}

/* ---------- إعداد نموذج الشحنة ---------- */
function setupShipmentForm() {
    const shipmentForm = document.getElementById('quickShipmentForm');
    if (shipmentForm) {
        shipmentForm.addEventListener('submit', handleShipmentSubmit);
    }

    // تحديث مبلغ التبرع
    const donateCheckbox = document.getElementById('donate');
    const budgetInput = document.getElementById('budget');
    
    if (donateCheckbox && budgetInput) {
        budgetInput.addEventListener('input', updateDonationAmount);
        donateCheckbox.addEventListener('change', updateDonationAmount);
    }
}

/* ---------- معالجة إرسال الشحنة ---------- */
async function handleShipmentSubmit(e) {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        showAlert('يرجى تسجيل الدخول أولاً', 'error');
        showLogin();
        return;
    }

    const shipmentData = {
        fromCity: document.getElementById('fromCity').value,
        toCity: document.getElementById('toCity').value,
        shipmentType: document.getElementById('shipmentType').value,
        weight: document.getElementById('weight').value || 0,
        budget: document.getElementById('budget').value,
        urgency: document.getElementById('urgency').value,
        description: document.getElementById('description').value,
        donate: document.getElementById('donate').checked,
        status: 'active',
        userId: user.id,
        userName: user.name,
        createdAt: new Date().toISOString(),
        offers: []
    };

    try {
        // حفظ الشحنة في Firestore
        await firebase.firestore().collection('shipments').add(shipmentData);
        
        showAlert('تم نشر الشحنة بنجاح!', 'success');
        document.getElementById('quickShipmentForm').reset();
        updateDonationAmount();
        
    } catch (err) {
        console.error('Shipment error:', err);
        showAlert('خطأ في نشر الشحنة: ' + err.message, 'error');
    }
}

/* ---------- تحديث مبلغ التبرع ---------- */
function updateDonationAmount() {
    const donateCheckbox = document.getElementById('donate');
    const budgetInput = document.getElementById('budget');
    const donationAmount = document.querySelector('.donation-amount');
    
    if (donateCheckbox && budgetInput && donationAmount) {
        const budget = parseFloat(budgetInput.value) || 0;
        const donation = donateCheckbox.checked ? Math.max(1, budget * 0.01) : 0;
        donationAmount.textContent = `+${donation.toFixed(1)} ريال`;
    }
}

/* ---------- التحقق من حالة المصادقة ---------- */
function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // المستخدم مسجل الدخول
            console.log('User is signed in:', user.email);
        } else {
            // المستخدم غير مسجل الدخول
            console.log('User is signed out');
        }
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
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        showAlert('يرجى تسجيل الدخول أولاً', 'error');
        showLogin();
        return;
    }
    
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

    // إضافة التنسيقات إذا لم تكن موجودة
    if (!document.querySelector('#alert-styles')) {
        const styles = document.createElement('style');
        styles.id = 'alert-styles';
        styles.textContent = `
            .custom-alert {
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 1rem;
                max-width: 400px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                animation: slideInRight 0.3s ease;
            }
            .custom-alert.success { background: linear-gradient(135deg, #4CAF50, #45a049); }
            .custom-alert.error { background: linear-gradient(135deg, #f44336, #d32f2f); }
            .custom-alert.info { background: linear-gradient(135deg, #2196F3, #1976D2); }
            .custom-alert button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            .custom-alert button:hover {
                background: rgba(255,255,255,0.2);
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(alert);

    // إزالة التنبيه تلقائيًا بعد 5 ثوانٍ
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

/* ---------- التنقل السلس ---------- */
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