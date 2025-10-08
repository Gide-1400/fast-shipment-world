document.addEventListener('DOMContentLoaded', () => {
    // ===== Global Variables =====
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');
    const modalOverlay = document.getElementById('modalOverlay');
    const backToTopBtn = document.getElementById('backToTop');
    const currentYearSpan = document.getElementById('current-year');
    const donationCheckbox = document.getElementById('voluntaryDonation');
    const budgetInput = document.getElementById('budget');
    const donationAmountSpan = document.getElementById('donationAmount');
    const shipmentForm = document.getElementById('shipmentForm');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // ===== Initialize =====
    currentYearSpan.textContent = new Date().getFullYear();

    // ===== Event Listeners =====
    // Mobile Navigation Toggle
    navToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile nav when a link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Back to Top Button
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Modal Functions
    window.showModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };
    
    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scroll
    };

    window.switchModal = (closeModalId, openModalId) => {
        closeModal(closeModalId);
        showModal(openModalId);
    };

    modalOverlay.addEventListener('click', () => {
        document.querySelectorAll('.modal.active').forEach(modal => {
            closeModal(modal.id);
        });
    });

    // Donation Calculation
    const updateDonation = () => {
        const budget = parseFloat(budgetInput.value) || 0;
        const donation = donationCheckbox.checked ? (budget * 0.01).toFixed(2) : 0;
        donationAmountSpan.textContent = `المساهمة: ${donation} ريال`;
    };
    donationCheckbox.addEventListener('change', updateDonation);
    budgetInput.addEventListener('input', updateDonation);

    // Form Submissions
    shipmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Here you would normally send the data to your backend (e.g., Firestore)
        alert('تم نشر شحنتك بنجاح! سيتم إعلامك عند تلقي العروض.');
        shipmentForm.reset();
        updateDonation();
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.loginEmail.value;
        const password = loginForm.loginPassword.value;
        
        // Firebase Authentication Logic
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in
                alert('تم تسجيل الدخول بنجاح!');
                closeModal('loginModal');
                // Redirect user to dashboard or update UI
            })
            .catch((error) => {
                alert(`خطأ في تسجيل الدخول: ${error.message}`);
            });
    });

    // ======== التعديل الجديد هنا ========
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = registerForm.regName.value;
        const email = registerForm.regEmail.value;
        const phone = registerForm.regPhone.value;
        const type = registerForm.regType.value;
        const password = registerForm.regPassword.value;

        // 1. إنشاء المستخدم في Firebase Authentication
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // 2. بعد نجاح إنشاء الحساب، احفظ البيانات الإضافية في Firestore
                const userId = userCredential.user.uid; // الحصول على معرّف المستخدم الفريد
                
                return firebase.firestore().collection('users').doc(userId).set({
                    fullName: name,
                    email: email,
                    phone: phone,
                    accountType: type, // 'sender', 'carrier', or 'both'
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    rating: 0, // تقييم مبدئي
                    trips: 0   // عدد رحلات مبدئي
                });
            })
            .then(() => {
                alert('تم إنشاء الحساب وحفظ بياناتك بنجاح!');
                closeModal('registerModal');
                registerForm.reset();
                // هنا يمكنك توجيه المستخدم إلى لوحة التحكم في المستقبل
            })
            .catch((error) => {
                console.error("Error during registration:", error);
                alert(`خطأ في إنشاء الحساب: ${error.message}`);
            });
    });
    // ======== نهاية التعديل ========

    // ===== Utility Functions =====
    window.scrollToSection = (sectionId) => {
        document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    };

    // ===== Animations =====
    // Animate stats on scroll
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat-number[data-target]');
        stats.forEach(stat => {
            const target = +stat.getAttribute('data-target');
            const increment = target / 200;
            const updateCount = () => {
                const count = +stat.innerText.replace(/[^0-9]/g, '');
                if (count < target) {
                    stat.innerText = Math.ceil(count + increment) + (stat.innerText.includes('+') ? '+' : '');
                    setTimeout(updateCount, 10);
                } else {
                    stat.innerText = target.toLocaleString() + (stat.innerText.includes('+') ? '+' : '');
                }
            };
            // Check if element is in viewport
            const rect = stat.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                updateCount();
                stat.removeAttribute('data-target'); // Run animation only once
            }
        });
    };
    window.addEventListener('scroll', animateStats);
    animateStats(); // Run once on load in case stats are already visible

    // Active navigation link on scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });
});
