// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAt5p5_qf4AZYDffNPYbOhl25fQTfQShw",
  authDomain: "giasu-58b66.firebaseapp.com",
  projectId: "giasu-58b66",
  storageBucket: "giasu-58b66.firebasestorage.app",
  messagingSenderId: "435873012515",
  appId: "1:435873012515:web:4e97cf3429ee41e22eca96",
  measurementId: "G-9GQYXSCHH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Smooth scrolling for anchor links
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

// DOM Elements for Auth Modal
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

// Export functions to window scope for inline HTML handlers
window.openModal = function(tab) {
    if (authModal) {
        authModal.classList.add('active');
        window.switchTab(tab);
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

window.closeModal = function() {
    if (authModal) {
        authModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

window.switchTab = function(tab) {
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
}

// Close modal when clicking outside
if (authModal) {
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            window.closeModal();
        }
    });
}

// Translate Firebase auth errors to Vietnamese
function translateError(code) {
    switch (code) {
        case 'auth/invalid-email':
            return 'Email không hợp lệ.';
        case 'auth/user-disabled':
            return 'Tài khoản này đã bị khóa.';
        case 'auth/user-not-found':
            return 'Tài khoản không tồn tại.';
        case 'auth/wrong-password':
            return 'Mật khẩu không chính xác.';
        case 'auth/email-already-in-use':
            return 'Email đã được sử dụng bởi một tài khoản khác.';
        case 'auth/weak-password':
            return 'Mật khẩu quá yếu (phải chứa ít nhất 6 ký tự).';
        case 'auth/popup-closed-by-user':
            return 'Cửa sổ đăng nhập đã bị đóng.';
        case 'auth/cancelled-popup-request':
            return 'Yêu cầu đăng nhập đã bị hủy.';
        default:
            return 'Đã xảy ra lỗi không xác định.';
    }
}

// Handle Form Submissions via Firebase

// 1. Log In Form
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            alert(`Đăng nhập thành công! Xin chào ${userCredential.user.displayName || email}`);
            window.closeModal();
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            alert(`Lỗi đăng nhập: ${translateError(error.code)}`);
        }
    });
}

// 2. Register Form
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update displayName
            await updateProfile(userCredential.user, {
                displayName: name
            });
            
            // Save additional user info to Firestore database
            await addDoc(collection(db, "users"), {
                uid: userCredential.user.uid,
                name: name,
                email: email,
                createdAt: serverTimestamp()
            });

            alert('Đăng ký tài khoản thành công! Hệ thống đã tự động đăng nhập.');
            window.closeModal();
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            alert(`Lỗi đăng ký: ${translateError(error.code)}`);
        }
    });
}

// 3. Social login - Google Sign-In
const googleButtons = document.querySelectorAll('.google-btn');
googleButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Save / sync user in Firestore
            await addDoc(collection(db, "users"), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                provider: 'google',
                createdAt: serverTimestamp()
            });

            alert(`Đăng nhập bằng Google thành công! Xin chào ${user.displayName}`);
            window.closeModal();
        } catch (error) {
            console.error("Lỗi đăng nhập Google:", error);
            alert(`Lỗi đăng nhập Google: ${translateError(error.code)}`);
        }
    });
});

// 4. Social login - Facebook Sign-In (Mockup notification for full production compliance)
const facebookButtons = document.querySelectorAll('.facebook-btn');
facebookButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        alert('Tính năng đăng nhập Facebook đang được bảo trì. Vui lòng sử dụng Đăng nhập bằng Email hoặc Google!');
    });
});

// 5. Connect Leads (Nhận ưu đãi) to Firestore
const enrollForm = document.querySelector('.enroll-form');
if (enrollForm) {
    enrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = enrollForm.querySelector('input');
        const email = emailInput.value;
        
        try {
            await addDoc(collection(db, "leads"), {
                email: email,
                createdAt: serverTimestamp()
            });
            alert(`Đăng ký nhận ưu đãi thành công cho email: ${email}. Hãy kiểm tra hòm thư của bạn sớm nhé!`);
            enrollForm.reset();
        } catch (error) {
            console.error("Lỗi lưu email nhận ưu đãi:", error);
            alert(`Có lỗi xảy ra khi đăng ký: ${error.message}`);
        }
    });
}

// 6. Listen to Auth State Changes & Update Navbar UI
const authButtons = document.getElementById('authButtons');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const userAvatarPlaceholder = document.getElementById('userAvatarPlaceholder');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const adminBtn = document.getElementById('adminBtn');
const mobileLogin = document.getElementById('mobileLogin');
const mobileRegister = document.getElementById('mobileRegister');

const ADMIN_EMAILS = ['vokien609@gmail.com', 'admin@edubourbon.com', 'bourbon@edubourbon.com', 'admin@gmail.com'];

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in.
        if (authButtons) authButtons.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        
        // Hide mobile dropdown login/register buttons
        if (mobileLogin) mobileLogin.style.display = 'none';
        if (mobileRegister) mobileRegister.style.display = 'none';
        
        if (userName) {
            userName.textContent = user.displayName || user.email.split('@')[0];
        }
        
        if (user.photoURL) {
            if (userAvatar) {
                userAvatar.src = user.photoURL;
                userAvatar.style.display = 'block';
            }
            if (userAvatarPlaceholder) userAvatarPlaceholder.style.display = 'none';
        } else {
            if (userAvatar) userAvatar.style.display = 'none';
            if (userAvatarPlaceholder) {
                userAvatarPlaceholder.style.display = 'flex';
                userAvatarPlaceholder.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
            }
        }

        // Toggle Admin Button
        const isAdmin = ADMIN_EMAILS.includes(user.email) || user.email.toLowerCase().includes('admin');
        if (adminBtn) {
            adminBtn.style.display = isAdmin ? 'inline-block' : 'none';
        }
    } else {
        // User is signed out.
        if (authButtons) authButtons.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
        
        // Show mobile dropdown login/register buttons
        if (mobileLogin) mobileLogin.style.display = 'block';
        if (mobileRegister) mobileRegister.style.display = 'block';
    }
});

// 7. Handle Sign Out Button
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            alert('Đăng xuất thành công!');
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
            alert(`Lỗi đăng xuất: ${error.message}`);
        }
    });
}

// 8. Mobile Menu Drawer Toggling Logic
const menuIcon = document.getElementById('menuIcon');
const navLinks = document.getElementById('navLinks');

if (menuIcon && navLinks) {
    menuIcon.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        menuIcon.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });
}

window.toggleMenu = function() {
    if (navLinks) {
        navLinks.classList.remove('open');
    }
    if (menuIcon) {
        menuIcon.textContent = '☰';
    }
}
