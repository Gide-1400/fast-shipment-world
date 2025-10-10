// dashboard.js - نسخة عربية كاملة
document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = user.name || user.email || 'المستخدم';

    // ملء بيانات الإعدادات
    document.querySelector('#profileSettings input[type="text"]').value = user.name || '';
    document.querySelector('#profileSettings input[type="email"]').value = user.email || '';
    document.querySelector('#profileSettings input[type="tel"]').value = user.phone || '';
    document.querySelector('#profileSettings input[type="tel"]').closest('.form-group').nextElementSibling.querySelector('input').value = user.city || '';

    loadDashboardData();
    setupDashboardEventListeners();
});

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionName).classList.add('active');

    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    document.querySelector(`.sidebar-menu a[href="#${sectionName}"]`).parentElement.classList.add('active');

    updatePageTitle(sectionName);
    loadSectionData(sectionName);
}