import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    setDoc,
    getDoc,
    addDoc,
    serverTimestamp,
    onSnapshot
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

// Config Admin Emails
const ADMIN_EMAILS = ['vokien609@gmail.com', 'admin@edubourbon.com', 'bourbon@edubourbon.com', 'admin@gmail.com'];

// Elements
const statTotalUsers = document.getElementById('statTotalUsers');
const statTotalLeads = document.getElementById('statTotalLeads');
const statTotalUpdates = document.getElementById('statTotalUpdates');

const usersTableBody = document.getElementById('users-table-body');
const leadsTableBody = document.getElementById('leads-table-body');
const updatesTableBody = document.getElementById('updates-table-body');

const countUsers = document.getElementById('count-users');
const countLeads = document.getElementById('count-leads');
const countUpdates = document.getElementById('count-updates');

const adminLogoutBtn = document.getElementById('adminLogoutBtn');

let currentUser = null;

// Auth check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verification: check if the user is an admin
        const isAdmin = ADMIN_EMAILS.includes(user.email) || user.email.toLowerCase().includes('admin');
        
        if (!isAdmin) {
            alert('Lỗi truy cập: Tài khoản của bạn không có quyền quản trị viên!');
            window.location.href = 'index.html';
            return;
        }

        currentUser = user;
        // Fetch and display dashboard stats and tables
        loadAllData();
    } else {
        // Redirect to homepage if not logged in at all
        alert('Vui lòng đăng nhập bằng tài khoản Admin để tiếp tục!');
        window.location.href = 'index.html';
    }
});

// Format Firestore timestamp
function formatTime(timestamp) {
    if (!timestamp) return 'Chưa rõ';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// Fetch all database records
// Fetch all database records in real-time
async function loadAllData() {
    try {
        // Ensure default records exist in Firestore
        await seedDefaultData();

        // Register real-time listeners
        loadUsersRealtime();
        loadLeadsRealtime();
        loadUpdatesRealtime();
        loadCoursesRealtime();
        loadDocsRealtime();
        loadClassroomRealtime();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu bảng:", error);
    }
}

// 1. Fetch Users in Real-time
let activeCoursesCache = [];
let studentPermissionsCache = {};
let usersCache = [];

function renderUsersTable() {
    if (!usersTableBody) return;
    const total = usersCache.length;
    statTotalUsers.textContent = total;
    countUsers.textContent = `${total} học viên`;

    if (total === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="6" class="table-empty">Chưa có học viên nào đăng ký.</td></tr>`;
        return;
    }

    usersTableBody.innerHTML = '';
    usersCache.forEach((data) => {
        const permissions = studentPermissionsCache[data.uid] || {};
        const row = document.createElement('tr');
        
        // Build dynamic checkboxes
        let checkboxHtml = `<div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">`;
        activeCoursesCache.forEach(c => {
            const isChecked = !!permissions[c.id];
            checkboxHtml += `
                <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; cursor: pointer;">
                    <input type="checkbox" class="course-toggle" data-uid="${data.uid}" data-course="${c.id}" ${isChecked ? 'checked' : ''}> ${c.icon} ${c.title.split(' ')[0]}
                </label>
            `;
        });
        checkboxHtml += `</div>`;

        row.innerHTML = `
            <td><strong>${data.name || 'Không rõ'}</strong></td>
            <td>${data.email}</td>
            <td><code style="font-size: 11px; background: rgba(15,23,42,0.05); padding: 2px 6px; border-radius: 4px;">${data.uid}</code></td>
            <td><span style="font-size: 11px; font-weight:700; background: ${data.provider === 'google' ? '#f0fdf4' : '#eff6ff'}; color: ${data.provider === 'google' ? '#166534' : '#1e40af'}; padding: 4px 10px; border-radius: 50px;">${(data.provider || 'Password').toUpperCase()}</span></td>
            <td>${formatTime(data.createdAt)}</td>
            <td>${checkboxHtml}</td>
        `;
        usersTableBody.appendChild(row);
    });

    // Add event listeners to course toggles
    document.querySelectorAll('.course-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const uid = e.target.getAttribute('data-uid');
            const course = e.target.getAttribute('data-course');
            const isChecked = e.target.checked;
            
            try {
                await setDoc(doc(db, "student_courses", uid), {
                    [course]: isChecked
                }, { merge: true });
            } catch (err) {
                console.error("Lỗi cập nhật quyền học:", err);
                alert("Không thể cập nhật quyền học: " + err.message);
                e.target.checked = !isChecked; // Revert
            }
        });
    });
}

function loadUsersRealtime() {
    // 1. Listen to courses collection
    onSnapshot(collection(db, "courses"), (snap) => {
        activeCoursesCache = [];
        snap.forEach(docSnap => {
            activeCoursesCache.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderUsersTable();
    }, (err) => console.error("Lỗi đồng bộ courses trong loadUsers:", err));

    // 2. Listen to student permissions
    onSnapshot(collection(db, "student_courses"), (snap) => {
        studentPermissionsCache = {};
        snap.forEach(docSnap => {
            studentPermissionsCache[docSnap.id] = docSnap.data();
        });
        renderUsersTable();
    }, (err) => console.error("Lỗi đồng bộ student_courses:", err));

    // 3. Listen to users collection
    onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (snap) => {
        usersCache = [];
        snap.forEach(docSnap => {
            usersCache.push(docSnap.data());
        });
        renderUsersTable();
    }, (err) => {
        console.error("Lỗi đồng bộ users:", err);
        if (usersTableBody) {
            usersTableBody.innerHTML = `<tr><td colspan="6" class="table-error">Lỗi tải dữ liệu. Hãy chắc chắn Firestore rules cho phép truy cập.</td></tr>`;
        }
    });
}

// 2. Fetch Leads in Real-time
function loadLeadsRealtime() {
    if (!leadsTableBody) return;
    onSnapshot(query(collection(db, "leads"), orderBy("createdAt", "desc")), (snap) => {
        const total = snap.size;
        statTotalLeads.textContent = total;
        countLeads.textContent = `${total} khách hàng`;

        if (total === 0) {
            leadsTableBody.innerHTML = `<tr><td colspan="3" class="table-empty">Chưa có ai đăng ký nhận ưu đãi.</td></tr>`;
            return;
        }

        leadsTableBody.innerHTML = '';
        snap.forEach((documentSnapshot) => {
            const data = documentSnapshot.data();
            const docId = documentSnapshot.id;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data.email}</strong></td>
                <td>${formatTime(data.createdAt)}</td>
                <td>
                    <button class="btn btn-delete-lead" data-id="${docId}" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1.5px solid rgba(239,68,68,0.2); cursor: pointer;">
                        Xóa Lead
                    </button>
                </td>
            `;
            leadsTableBody.appendChild(row);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.btn-delete-lead').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const docId = e.target.getAttribute('data-id');
                if (confirm('Bạn chắc chắn muốn xóa email này khỏi danh sách nhận ưu đãi?')) {
                    try {
                        await deleteDoc(doc(db, "leads", docId));
                        alert('Xóa thành công!');
                    } catch (err) {
                        alert('Có lỗi xảy ra: ' + err.message);
                    }
                }
            });
        });
    }, (e) => {
        console.error("Lỗi loadLeads:", e);
        leadsTableBody.innerHTML = `<tr><td colspan="3" class="table-error">Lỗi tải dữ liệu.</td></tr>`;
    });
}

// 3. Fetch Updates in Real-time
function loadUpdatesRealtime() {
    if (!updatesTableBody) return;
    onSnapshot(query(collection(db, "profile_updates"), orderBy("timestamp", "desc")), (snap) => {
        const total = snap.size;
        statTotalUpdates.textContent = total;
        countUpdates.textContent = `${total} hoạt động`;

        if (total === 0) {
            updatesTableBody.innerHTML = `<tr><td colspan="4" class="table-empty">Chưa có nhật ký hoạt động nào.</td></tr>`;
            return;
        }

        updatesTableBody.innerHTML = '';
        snap.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><code style="font-size: 11px;">${data.uid}</code></td>
                <td><strong>${data.updatedName || 'Không thay đổi'}</strong></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${data.updatedPhotoUrl ? `<a href="${data.updatedPhotoUrl}" target="_blank" style="color: var(--primary-blue); font-size:12px;">Xem ảnh đại diện</a>` : 'Không thiết lập'}
                </td>
                <td>${formatTime(data.timestamp)}</td>
            `;
            updatesTableBody.appendChild(row);
        });
    }, (e) => {
        console.error("Lỗi loadUpdates:", e);
        updatesTableBody.innerHTML = `<tr><td colspan="4" class="table-error">Lỗi tải dữ liệu nhật ký.</td></tr>`;
    });
}

// Expose tab switching to window scope
window.switchAdminTab = function(tab) {
    // Buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    const targetTabBtn = document.getElementById(`tab-${tab}`);
    if (targetTabBtn) targetTabBtn.classList.add('active');

    // Contents
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    const targetContent = document.getElementById(`content-${tab}`);
    if (targetContent) targetContent.classList.add('active');
}

// 4. Seed Default Database Data if Empty
async function seedDefaultData() {
    try {
        const systemRef = doc(db, "system", "config");
        const systemSnap = await getDoc(systemRef);
        if (systemSnap.exists() && systemSnap.data().seeded) {
            // Already seeded! Do not seed again even if empty.
            return;
        }

        const coursesCheck = await getDocs(collection(db, "courses"));
        if (coursesCheck.empty) {
            const defaultCourses = [
                { id: 'web', title: "Lập Trình Web Thực Chiến", icon: "💻", gradient: "gradient-blue", description: "Làm chủ HTML, CSS, JavaScript và phát triển ứng dụng Web hoàn chỉnh.", badge: "Đang học", progress: 80 },
                { id: 'english', title: "Chinh Phục Tiếng Anh Giao Tiếp", icon: "🇬🇧", gradient: "gradient-green", description: "Luyện nói phản xạ, tự tin giao tiếp với gia sư nước ngoài và chuyên gia.", badge: "Đang học", progress: 45 },
                { id: 'math', title: "Toán Cao Cấp Đại Cương", icon: "📐", gradient: "gradient-purple", description: "Ôn thi học phần Toán cao cấp, giải đề thực chiến đạt điểm A+.", badge: "Mới", progress: 0 }
            ];
            for (const c of defaultCourses) {
                await setDoc(doc(db, "courses", c.id), c);
            }
        }

        const docsCheck = await getDocs(collection(db, "documents"));
        if (docsCheck.empty) {
            const defaultDocs = [
                { name: "Ebook - Cẩm nang Javascript từ cơ bản đến nâng cao.pdf", type: "PDF", size: "15.4 MB", icon: "📄" },
                { name: "Tài liệu ôn thi cuối kỳ môn Toán Đại Cương.docx", type: "DOCX", size: "2.1 MB", icon: "📝" },
                { name: "Slide bài giảng - Thiết kế Responsive & CSS Grid nâng cao.pptx", type: "PPTX", size: "8.7 MB", icon: "📊" }
            ];
            for (const d of defaultDocs) {
                await addDoc(collection(db, "documents"), d);
            }
        }

        const lessonsCheck = await getDocs(collection(db, "classroom_lessons"));
        if (lessonsCheck.empty) {
            const defaultLessons = [
                { title: "Bài 1: Tổng quan về Web & Cú pháp cơ bản", duration: "35 phút", status: "completed" },
                { title: "Bài 2: Làm chủ CSS Grid & Responsive Layout", duration: "45 phút", status: "active" },
                { title: "Bài 3: DOM Manipulation và Sự kiện trong JS", duration: "40 phút", status: "locked" },
                { title: "Bài 4: Tích hợp cơ sở dữ liệu Firebase Firestore", duration: "50 phút", status: "locked" }
            ];
            for (const l of defaultLessons) {
                await addDoc(collection(db, "classroom_lessons"), l);
            }
        }

        const liveCheck = await getDoc(doc(db, "classroom", "live"));
        if (!liveCheck.exists()) {
            await setDoc(doc(db, "classroom", "live"), {
                title: "Bài 2: Làm chủ CSS Grid & Responsive Layout",
                instructor: "Gia sư Võ Anh Kiệt",
                viewers: 42
            });
        }

        // Set seeded flag so it never runs again
        await setDoc(systemRef, { seeded: true });
    } catch (e) {
        console.error("Lỗi khi seedDefaultData:", e);
    }
}

// 5. Manage Courses Logic
// 5. Manage Courses Logic in Real-time
function loadCoursesRealtime() {
    const listBody = document.getElementById('courses-list-body');
    const countSpan = document.getElementById('count-courses');
    if (!listBody) return;

    onSnapshot(collection(db, "courses"), (snap) => {
        countSpan.textContent = `${snap.size} khóa học`;

        if (snap.empty) {
            listBody.innerHTML = `<tr><td colspan="3" class="table-empty">Chưa có khóa học nào.</td></tr>`;
            return;
        }

        listBody.innerHTML = '';
        snap.forEach(dSnap => {
            const data = dSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data.icon} ${data.title}</strong> <span style="font-size:10px; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius:4px;">${data.badge}</span></td>
                <td><span style="font-size: 12px; color: #64748b;">${data.description}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteCourse('${dSnap.id}')">Xóa</button>
                </td>
            `;
            listBody.appendChild(row);
        });
    }, (err) => {
        console.error("Lỗi loadCourses:", err);
        listBody.innerHTML = `<tr><td colspan="3" class="table-error">Lỗi tải khóa học.</td></tr>`;
    });
}

// Form create course submit
const formCreateCourse = document.getElementById('form-create-course');
if (formCreateCourse) {
    formCreateCourse.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('course-title').value;
        const icon = document.getElementById('course-icon').value;
        const badge = document.getElementById('course-badge').value;
        const gradient = document.getElementById('course-gradient').value;
        const progress = parseInt(document.getElementById('course-progress').value) || 0;
        const description = document.getElementById('course-desc').value;
        
        // Generate a simple dynamic ID
        const id = title.toLowerCase().replace(/[^a-z0-9]/g, '') || 'course_' + Date.now();

        try {
            await setDoc(doc(db, "courses", id), {
                id, title, icon, badge, gradient, progress, description
            });
            alert('Tạo khóa học thành công!');
            formCreateCourse.reset();
        } catch (err) {
            console.error("Lỗi khi thêm khóa học:", err);
            alert("Lỗi: " + err.message);
        }
    });
}

window.deleteCourse = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa khóa học này không?')) return;
    try {
        await deleteDoc(doc(db, "courses", id));
        alert('Xóa khóa học thành công!');
    } catch (err) {
        console.error("Lỗi khi xóa khóa học:", err);
        alert("Lỗi: " + err.message);
    }
}

// 6. Manage Docs Logic in Real-time
function loadDocsRealtime() {
    const listBody = document.getElementById('docs-list-body');
    const countSpan = document.getElementById('count-docs');
    if (!listBody) return;

    onSnapshot(collection(db, "documents"), (snap) => {
        countSpan.textContent = `${snap.size} tài liệu`;

        if (snap.empty) {
            listBody.innerHTML = `<tr><td colspan="3" class="table-empty">Chưa có tài liệu học tập nào.</td></tr>`;
            return;
        }

        listBody.innerHTML = '';
        snap.forEach(dSnap => {
            const data = dSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data.icon} ${data.name}</strong></td>
                <td><span style="font-size: 11px; background: #eff6ff; color: #1e40af; padding: 2px 6px; border-radius:4px; font-weight:700;">${data.type}</span> <code style="font-size:11px;">${data.size}</code></td>
                <td>
                    <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteDocItem('${dSnap.id}')">Xóa</button>
                </td>
            `;
            listBody.appendChild(row);
        });
    }, (err) => {
        console.error("Lỗi loadDocs:", err);
        listBody.innerHTML = `<tr><td colspan="3" class="table-error">Lỗi tải tài liệu.</td></tr>`;
    });
}

const formAddDoc = document.getElementById('form-add-doc');
if (formAddDoc) {
    formAddDoc.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('doc-name').value;
        const type = document.getElementById('doc-type').value;
        const size = document.getElementById('doc-size').value;
        const icon = document.getElementById('doc-icon').value;

        try {
            await addDoc(collection(db, "documents"), { name, type, size, icon });
            alert('Thêm tài liệu thành công!');
            formAddDoc.reset();
        } catch (err) {
            console.error("Lỗi khi thêm tài liệu:", err);
            alert("Lỗi: " + err.message);
        }
    });
}

window.deleteDocItem = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) return;
    try {
        await deleteDoc(doc(db, "documents", id));
        alert('Xóa tài liệu thành công!');
    } catch (err) {
        console.error("Lỗi khi xóa tài liệu:", err);
        alert("Lỗi: " + err.message);
    }
}

// 7. Manage Classroom Logic in Real-time
function loadClassroomRealtime() {
    const lessonsBody = document.getElementById('lessons-list-body');
    const countSpan = document.getElementById('count-lessons');
    
    // Live Classroom Form inputs
    const liveTitle = document.getElementById('live-title');
    const liveInstructor = document.getElementById('live-instructor');
    const liveViewers = document.getElementById('live-viewers');

    // Sync Live Info
    onSnapshot(doc(db, "classroom", "live"), (liveSnap) => {
        if (liveSnap.exists()) {
            const data = liveSnap.data();
            if (liveTitle && document.activeElement !== liveTitle) liveTitle.value = data.title || '';
            if (liveInstructor && document.activeElement !== liveInstructor) liveInstructor.value = data.instructor || '';
            if (liveViewers && document.activeElement !== liveViewers) liveViewers.value = data.viewers || '';
        }
    }, (err) => console.error("Lỗi đồng bộ classroom live:", err));

    // Sync Playlist lessons
    onSnapshot(collection(db, "classroom_lessons"), (snap) => {
        if (countSpan) countSpan.textContent = `${snap.size} bài học`;

        if (!lessonsBody) return;
        if (snap.empty) {
            lessonsBody.innerHTML = `<tr><td colspan="3" class="table-empty">Chưa có bài học nào.</td></tr>`;
            return;
        }

        lessonsBody.innerHTML = '';
        snap.forEach(dSnap => {
            const data = dSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data.title}</strong></td>
                <td><span style="font-size: 11px; background: #f0fdf4; color: #166534; padding: 2px 6px; border-radius:4px; font-weight:700;">${data.status.toUpperCase()}</span> <code style="font-size:11px;">${data.duration}</code></td>
                <td>
                    <button class="btn btn-outline btn-sm" style="color: #ef4444; border-color: #fca5a5;" onclick="deleteLesson('${dSnap.id}')">Xóa</button>
                </td>
            `;
            lessonsBody.appendChild(row);
        });
    }, (err) => console.error("Lỗi đồng bộ lessons:", err));
}

// Form config live submit
const formConfigLive = document.getElementById('form-config-live');
if (formConfigLive) {
    formConfigLive.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('live-title').value;
        const instructor = document.getElementById('live-instructor').value;
        const viewers = parseInt(document.getElementById('live-viewers').value) || 0;

        try {
            await setDoc(doc(db, "classroom", "live"), { title, instructor, viewers });
            alert('Cập nhật phòng học trực tiếp thành công!');
        } catch (err) {
            console.error("Lỗi cập nhật livestream:", err);
            alert("Lỗi: " + err.message);
        }
    });
}

// Form add lesson submit
const formAddLesson = document.getElementById('form-add-lesson');
if (formAddLesson) {
    formAddLesson.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('lesson-title').value;
        const duration = document.getElementById('lesson-duration').value;
        const status = document.getElementById('lesson-status').value;

        try {
            await addDoc(collection(db, "classroom_lessons"), { title, duration, status });
            alert('Thêm bài học thành công!');
            formAddLesson.reset();
        } catch (err) {
            console.error("Lỗi khi thêm bài học:", err);
            alert("Lỗi: " + err.message);
        }
    });
}

window.deleteLesson = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa bài học này không?')) return;
    try {
        await deleteDoc(doc(db, "classroom_lessons", id));
        alert('Xóa bài học thành công!');
    } catch (err) {
        console.error("Lỗi khi xóa bài học:", err);
        alert("Lỗi: " + err.message);
    }
}

// Logout Admin
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            alert('Đăng xuất Admin thành công!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    });
}
