// script.js – تسجيل دخول / تسجيل + توجيه زر الشحنة
document.addEventListener('DOMContentLoaded', setupAuthForms);

/* ---------- إعداد نماذج Firebase ---------- */
function setupAuthForms() {
    const loginForm  = document.getElementById('loginForm');
    const regForm    = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim();
            const pass  = document.getElementById('loginPassword')?.value.trim();
            if (!email || !pass) return alert('يرجى ملء جميع الحقول');

            firebase.auth().signInWithEmailAndPassword(email, pass)
                .then(u => {
                    const userData = { id: u.user.uid, name: u.user.displayName || email.split('@')[0], email: u.user.email, type: 'sender' };
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    alert('تم تسجيل الدخول بنجاح');
                    window.location.href = 'dashboard.html';
                })
                .catch(err => alert('خطأ في تسجيل الدخول: ' + err.message));
        });
    }

    if (regForm) {
        regForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name  = document.getElementById('regName')?.value.trim();
            const email = document.getElementById('regEmail')?.value.trim();
            const phone = document.getElementById('regPhone')?.value.trim();
            const type  = document.getElementById('regType')?.value;
            const pass  = document.getElementById('regPassword')?.value.trim();
            if (!name || !email || !phone || !type || !pass) return alert('يرجى ملء جميع الحقول');

            firebase.auth().createUserWithEmailAndPassword(email, pass)
                .then(u => u.user.updateProfile({ displayName: name }))
                .then(() => {
                    const userData = { id: firebase.auth().currentUser.uid, name, email, phone, type };
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    alert('تم إنشاء الحساب بنجاح');
                    window.location.href = 'dashboard.html';
                })
                .catch(err => alert('خطأ في إنشاء الحساب: ' + err.message));
        });
    }
}

/* ---------- نافذات المودال ---------- */
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
}
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}
function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
}
function switchToRegister() {
    closeModal('loginModal');
    showRegister();
}

/* ---------- زر الشحنة (حجب للزوار) ---------- */
function showCreateShipment() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        showLogin();
        return;
    }
    document.getElementById('quickShipment').scrollIntoView({ behavior: 'smooth' });
}

/* ---------- إغلاق المودال بالنقر خارج الصندوق ---------- */
window.onclick = function (event) {
    const modals = ['loginModal', 'registerModal'];
    modals.forEach(id => {
        const m = document.getElementById(id);
        if (m && event.target === m) m.style.display = 'none';
    });
};
