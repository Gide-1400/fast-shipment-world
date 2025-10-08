import { auth, db, collection, addDoc, serverTimestamp } from './firebase.js';

document.getElementById('carrierForm').addEventListener('submit', async e => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showAlert('يرجى تسجيل الدخول أولاً', 'error');
        window.location.href = 'index.html';
        return;
    }

    const data = {
        uid: user.uid,
        name: user.displayName || user.email,
        vehicleType: document.getElementById('vehicleType').value,
        licenseNumber: document.getElementById('licenseNumber').value.trim(),
        workingAreas: document.getElementById('workingAreas').value.split(',').map(a => a.trim()),
        experienceYears: document.getElementById('experienceYears').value,
        status: 'pending',
        rating: 5,
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(collection(db, 'carriers'), data);
        showAlert('تم تسجيلك كناقل بنجاح، ستتم مراجعة طلبك قريباً', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    } catch (error) {
        showAlert('حدث خطأ أثناء التسجيل', 'error');
    }
});

function showAlert(message, type = 'info') {
    const container = document.getElementById('notificationsContainer') || document.body;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}