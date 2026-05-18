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
    serverTimestamp,
    doc,
    getDoc,
    getDocs,
    setDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showAlert, showConfirm } from "./modals.js";

// Bind custom modals to window so inline onclick handlers can call them
window.showAlert = showAlert;
window.showConfirm = showConfirm;

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
            await showAlert(`Đăng nhập thành công! Xin chào ${userCredential.user.displayName || email}`, 'Đăng nhập thành công', '🎉');
            window.closeModal();
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            await showAlert(`Lỗi đăng nhập: ${translateError(error.code)}`, 'Lỗi đăng nhập', '❌');
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
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: name,
                email: email,
                createdAt: serverTimestamp()
            });

            await showAlert('Đăng ký tài khoản thành công! Hệ thống đã tự động đăng nhập.', 'Thành công', '✨');
            window.closeModal();
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            await showAlert(`Lỗi đăng ký: ${translateError(error.code)}`, 'Lỗi đăng ký', '❌');
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
            
            // Save / sync user in Firestore using setDoc with merge to preserve fields
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                provider: 'google',
                createdAt: serverTimestamp()
            }, { merge: true });

            await showAlert(`Đăng nhập bằng Google thành công! Xin chào ${user.displayName}`, 'Đăng nhập thành công', '🎉');
            window.closeModal();
        } catch (error) {
            console.error("Lỗi đăng nhập Google:", error);
            await showAlert(`Lỗi đăng nhập Google: ${translateError(error.code)}`, 'Lỗi Google Sign-In', '❌');
        }
    });
});

// 4. Social login - Facebook Sign-In (Mockup notification for full production compliance)
const facebookButtons = document.querySelectorAll('.facebook-btn');
facebookButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        await showAlert('Tính năng đăng nhập Facebook đang được bảo trì. Vui lòng sử dụng Đăng nhập bằng Email hoặc Google!', 'Đang bảo trì', 'ℹ️');
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
            await showAlert(`Đăng ký nhận ưu đãi thành công cho email: ${email}. Hãy kiểm tra hòm thư của bạn sớm nhé!`, 'Đăng ký thành công', '🎁');
            enrollForm.reset();
        } catch (error) {
            console.error("Lỗi lưu email nhận ưu đãi:", error);
            await showAlert(`Có lỗi xảy ra khi đăng ký: ${error.message}`, 'Lỗi đăng ký', '❌');
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

const studentDashboard = document.getElementById('studentDashboard');
const landingSections = document.querySelectorAll('.landing-section');

// Student Panel Dynamic Tab Swapper
window.switchStudentTab = function(tabId) {
    const contents = document.querySelectorAll('.student-tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    const selectedContent = document.getElementById(`tabContent-${tabId}`);
    if (selectedContent) selectedContent.classList.add('active');
    
    const studentLinks = document.querySelectorAll('.student-nav-link');
    studentLinks.forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    if (window.toggleMenu) {
        window.toggleMenu();
    }
};

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

        // SWAP TO STUDENT DASHBOARD
        if (navLinks) {
            navLinks.innerHTML = `
                <li><a href="#" onclick="switchStudentTab('courses')" class="student-nav-link active" data-tab="courses">Khóa học của tôi</a></li>
                <li><a href="#" onclick="switchStudentTab('docs')" class="student-nav-link" data-tab="docs">Tài liệu</a></li>
                <li><a href="#" onclick="switchStudentTab('classroom')" class="student-nav-link" data-tab="classroom">Phòng học</a></li>
                <li><a href="#" onclick="switchStudentTab('leaderboard')" class="student-nav-link" data-tab="leaderboard">Xếp hạng</a></li>
            `;
        }
        
        landingSections.forEach(el => el.style.display = 'none');
        if (studentDashboard) {
            studentDashboard.style.display = 'block';
        }

        // Update Dynamic Leaderboard User Data
        const currentUserName = document.getElementById('currentUserRankName');
        const currentUserEmail = document.getElementById('currentUserRankEmail');
        const currentUserPlaceholder = document.getElementById('currentUserRankPlaceholder');
        if (currentUserName) currentUserName.textContent = user.displayName || user.email.split('@')[0];
        if (currentUserEmail) currentUserEmail.textContent = user.email;
        switchStudentTab('courses');
        
        // Asynchronous Self-Healing user verification in Firestore
        (async () => {
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        uid: user.uid,
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        photoURL: user.photoURL || '',
                        createdAt: serverTimestamp()
                    });
                    console.log("Self-healing: Created missing user document in Firestore.");
                }
            } catch (err) {
                console.error("Lỗi tự động khôi phục dữ liệu học viên:", err);
            }
        })();

        loadStudentDashboardData(user.uid);

    } else {
        // User is signed out.
        if (authButtons) authButtons.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
        
        // Show mobile dropdown login/register buttons
        if (mobileLogin) mobileLogin.style.display = 'block';
        if (mobileRegister) mobileRegister.style.display = 'block';

        // SWAP TO PUBLIC LANDING
        if (navLinks) {
            navLinks.innerHTML = `
                <li><a href="#about" onclick="toggleMenu()">Giới Thiệu</a></li>
                <li><a href="#features" onclick="toggleMenu()">Lợi Ích</a></li>
                <li class="mobile-only" id="mobileLogin"><a href="#" onclick="openModal('login'); toggleMenu();">Đăng Nhập</a></li>
                <li class="mobile-only" id="mobileRegister"><a href="#" onclick="openModal('register'); toggleMenu();" class="btn-primary-mobile">Đăng Ký</a></li>
            `;
        }

        landingSections.forEach(el => el.style.display = '');
        if (studentDashboard) {
            studentDashboard.style.display = 'none';
        }
    }
});

// 7. Handle Sign Out Button
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const isConfirmed = await showConfirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', 'Xác nhận đăng xuất', '🚪');
        if (!isConfirmed) return;
        try {
            await signOut(auth);
            await showAlert('Đăng xuất thành công!', 'Tạm biệt', '👋');
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
            await showAlert(`Lỗi đăng xuất: ${error.message}`, 'Lỗi', '❌');
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

// 9. Load Student Dashboard Data & Real-Time Sync
let currentPermissions = {};
let currentCourses = [];

function renderCoursesUI() {
    const grid = document.getElementById('coursesGridDynamic');
    if (!grid) return;

    if (currentCourses.length === 0) {
        grid.innerHTML = `<div style="padding: 30px; text-align: center; color: #64748b; grid-column: 1/-1;">Hiện chưa có khóa học nào được phát hành.</div>`;
        return;
    }

    grid.innerHTML = '';
    currentCourses.forEach(course => {
        const hasAccess = !!currentPermissions[course.id];
        const card = document.createElement('div');
        card.className = 'course-card glass-card';
        card.id = `courseCard-${course.id}`;

        const gradientClass = course.gradient || 'gradient-blue';

        // Apply style if locked
        if (!hasAccess) {
            card.style.opacity = '0.7';
            card.style.filter = 'grayscale(0.3)';
        }

        // Setup dynamic buttons
        let btnClass = course.id === 'math' ? 'btn btn-outline' : 'btn btn-primary';
        let btnText = course.id === 'math' ? 'Bắt Đầu Học' : 'Tiếp Tục Học';
        let onclickAction = `switchStudentTab('classroom')`;

        if (course.id === 'english') {
            onclickAction = `showAlert('Đang tải nội dung khóa học...', 'Thông báo', 'ℹ️')`;
        }

        if (!hasAccess) {
            btnClass = 'btn btn-outline';
            btnText = 'Liên Hệ Admin';
            onclickAction = `showAlert('Khóa học &ldquo;${course.title}&rdquo; chưa được cấp quyền bởi quản trị viên. Vui lòng liên hệ Admin để kích hoạt!', 'Khóa học chưa kích hoạt', '🔒')`;
        }

        const badgeText = hasAccess ? (course.badge || 'Đang học') : '🔒 Chưa Cấp';
        const badgeStyle = hasAccess ? '' : 'style="background: #64748b;"';

        card.innerHTML = `
            <div class="course-badge" ${badgeStyle}>${badgeText}</div>
            <div class="course-header-bg ${gradientClass}">${course.icon || '💻'}</div>
            <div class="course-body">
                <h3>${course.title}</h3>
                <p class="course-desc">${course.description}</p>
                <div class="course-progress-container">
                    <div class="progress-info">
                        <span>Tiến độ: ${course.progress || 0}%</span>
                        <span>${hasAccess ? 'Đang cập nhật' : 'Chưa bắt đầu'}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${course.progress || 0}%; ${gradientClass === 'gradient-green' ? 'background: #10b981;' : ''}"></div>
                    </div>
                </div>
                <button class="${btnClass}" style="width: 100%; border-radius: 12px; ${!hasAccess ? 'border-color: #94a3b8; color: #64748b;' : ''}" onclick="${onclickAction}">${btnText}</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function loadStudentDashboardData(uid) {
    try {
        loadStudentCoursesRealtime(uid);
        loadStudentDocsRealtime();
        loadStudentClassroomRealtime();
    } catch (err) {
        console.error("Lỗi khi đăng ký đồng bộ Dashboard học viên:", err);
    }
}

function loadStudentCoursesRealtime(uid) {
    // Listen to student permission doc
    onSnapshot(doc(db, "student_courses", uid), (snap) => {
        currentPermissions = snap.exists() ? snap.data() : {};
        renderCoursesUI();
    }, (err) => console.error("Lỗi đồng bộ quyền học:", err));

    // Listen to courses collection
    onSnapshot(collection(db, "courses"), (snap) => {
        currentCourses = [];
        snap.forEach(docSnap => {
            currentCourses.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderCoursesUI();
    }, (err) => console.error("Lỗi đồng bộ khóa học:", err));
}

function loadStudentDocsRealtime() {
    const docsList = document.getElementById('docsListDynamic');
    if (!docsList) return;

    onSnapshot(collection(db, "documents"), (snap) => {
        if (snap.empty) {
            docsList.innerHTML = `<div style="padding: 30px; text-align: center; color: #64748b;">Chưa có tài liệu học tập nào được tải lên.</div>`;
            return;
        }

        docsList.innerHTML = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const item = document.createElement('div');
            item.className = 'doc-item';
            item.innerHTML = `
                <div class="doc-icon">${data.icon || '📄'}</div>
                <div class="doc-details">
                    <h4>${data.name}</h4>
                    <span>${data.type} • ${data.size} • Đã tải lên</span>
                </div>
                <button class="btn btn-outline btn-sm" onclick="showAlert('Bắt đầu tải xuống tài liệu: ${data.name}', 'Đang tải xuống', '📥')">📥 Tải Xuống</button>
            `;
            docsList.appendChild(item);
        });
    }, (err) => console.error("Lỗi đồng bộ tài liệu:", err));
}

function loadStudentClassroomRealtime() {
    const videoArea = document.getElementById('classroomVideoDynamic');
    const playlist = document.getElementById('lessonListDynamic');

    if (videoArea) {
        onSnapshot(doc(db, "classroom", "live"), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                videoArea.innerHTML = `
                    <div class="video-placeholder">
                        <div class="play-btn-pulse">▶</div>
                        <h3>${data.title}</h3>
                        <p>Đang trực tiếp cùng ${data.instructor}</p>
                    </div>
                    <div class="video-controls">
                        <span>🔴 ĐANG HỌC TRỰC TUYẾN</span>
                        <span>Đang xem: ${data.viewers} học viên</span>
                    </div>
                `;
            } else {
                videoArea.innerHTML = `<div style="padding: 30px; text-align: center; color: white;">Không có lớp học live nào đang diễn ra.</div>`;
            }
        }, (err) => console.error("Lỗi đồng bộ Live Classroom:", err));
    }

    if (playlist) {
        onSnapshot(collection(db, "classroom_lessons"), (snap) => {
            if (snap.empty) {
                playlist.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b;">Chưa có bài học nào trong danh sách phát.</div>`;
                return;
            }

            playlist.innerHTML = '';
            snap.forEach(docSnap => {
                const data = docSnap.data();
                const item = document.createElement('div');

                let statusClass = 'locked';
                let statusIcon = '🔒';
                let statusText = 'Chưa mở khóa';

                if (data.status === 'completed') {
                    statusClass = 'completed';
                    statusIcon = '✅';
                    statusText = 'Đã hoàn thành';
                } else if (data.status === 'active') {
                    statusClass = 'active';
                    statusIcon = '🎬';
                    statusText = 'Đang học trực tiếp';
                }

                item.className = `lesson-item ${statusClass}`;
                item.innerHTML = `
                    <span class="lesson-status">${statusIcon}</span>
                    <div class="lesson-info">
                        <h5>${data.title}</h5>
                        <span>${data.duration} • ${statusText}</span>
                    </div>
                `;
                playlist.appendChild(item);
            });
        }, (err) => console.error("Lỗi đồng bộ playlist bài học:", err));
    }
}
