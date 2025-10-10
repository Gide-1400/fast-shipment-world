document.addEventListener('DOMContentLoaded', function () {
  setupAuthForms();
});

function setupAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value.trim();

      if (!email || !password) {
        alert('يرجى ملء جميع الحقول');
        return;
      }

      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(userCredential => {
          const user = userCredential.user;
          const userData = {
            id: user.uid,
            name: user.displayName || email.split('@')[0],
            email: user.email,
            type: 'sender'
          };
          localStorage.setItem('currentUser', JSON.stringify(userData));
          alert('تم تسجيل الدخول بنجاح');
          window.location.href = 'dashboard.html';
        })
        .catch(error => {
          alert('خطأ في تسجيل الدخول: ' + error.message);
        });
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('regName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const phone = document.getElementById('regPhone')?.value.trim();
      const type = document.getElementById('regType')?.value;
      const password = document.getElementById('regPassword')?.value.trim();

      if (!name || !email || !phone || !type || !password) {
        alert('يرجى ملء جميع الحقول');
        return;
      }

      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
          const user = userCredential.user;
          return user.updateProfile({ displayName: name });
        })
        .then(() => {
          const userData = {
            id: firebase.auth().currentUser.uid,
            name,
            email,
            phone,
            type
          };
          localStorage.setItem('currentUser', JSON.stringify(userData));
          alert('تم إنشاء الحساب بنجاح');
          window.location.href = 'dashboard.html';
        })
        .catch(error => {
          alert('خطأ في إنشاء الحساب: ' + error.message);
        });
    });
  }
}

// دوال مساعدة
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function switchToRegister() {
  closeModal('loginModal');
  document.getElementById('registerModal').style.display = 'block';
}

function showLogin() {
  document.getElementById('loginModal').style.display = 'block';
}

function showRegister() {
  document.getElementById('registerModal').style.display = 'block';
}