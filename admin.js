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
    orderBy
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
async function loadAllData() {
    try {
        await Promise.all([
            loadUsers(),
            loadLeads(),
            loadUpdates()
        ]);
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu bảng:", error);
    }
}

// 1. Fetch Users
async function loadUsers() {
    try {
        const usersSnapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
        const total = usersSnapshot.size;
        statTotalUsers.textContent = total;
        countUsers.textContent = `${total} học viên`;

        if (total === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="5" class="table-empty">Chưa có học viên nào đăng ký.</td></tr>`;
            return;
        }

        usersTableBody.innerHTML = '';
        usersSnapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data.name || 'Không rõ'}</strong></td>
                <td>${data.email}</td>
                <td><code style="font-size: 12px; background: rgba(15,23,42,0.05); padding: 2px 6px; border-radius: 4px;">${data.uid}</code></td>
                <td><span style="font-size: 11px; font-weight:700; background: ${data.provider === 'google' ? '#f0fdf4' : '#eff6ff'}; color: ${data.provider === 'google' ? '#166534' : '#1e40af'}; padding: 4px 10px; border-radius: 50px;">${(data.provider || 'Password').toUpperCase()}</span></td>
                <td>${formatTime(data.createdAt)}</td>
            `;
            usersTableBody.appendChild(row);
        });
    } catch (e) {
        console.error("Lỗi loadUsers:", e);
        usersTableBody.innerHTML = `<tr><td colspan="5" class="table-error">Lỗi tải dữ liệu. Bán hãy chắc chắn Firestore rules cho phép truy cập.</td></tr>`;
    }
}

// 2. Fetch Leads
async function loadLeads() {
    try {
        const leadsSnapshot = await getDocs(query(collection(db, "leads"), orderBy("createdAt", "desc")));
        const total = leadsSnapshot.size;
        statTotalLeads.textContent = total;
        countLeads.textContent = `${total} khách hàng`;

        if (total === 0) {
            leadsTableBody.innerHTML = `<tr><td colspan="3" class="table-empty">Chưa có ai đăng ký nhận ưu đãi.</td></tr>`;
            return;
        }

        leadsTableBody.innerHTML = '';
        leadsSnapshot.forEach((documentSnapshot) => {
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
                        loadLeads(); // Reload leads table
                    } catch (err) {
                        alert('Có lỗi xảy ra: ' + err.message);
                    }
                }
            });
        });

    } catch (e) {
        console.error("Lỗi loadLeads:", e);
        leadsTableBody.innerHTML = `<tr><td colspan="3" class="table-error">Lỗi tải dữ liệu.</td></tr>`;
    }
}

// 3. Fetch Updates
async function loadUpdates() {
    try {
        const updatesSnapshot = await getDocs(query(collection(db, "profile_updates"), orderBy("timestamp", "desc")));
        const total = updatesSnapshot.size;
        statTotalUpdates.textContent = total;
        countUpdates.textContent = `${total} hoạt động`;

        if (total === 0) {
            updatesTableBody.innerHTML = `<tr><td colspan="4" class="table-empty">Chưa có nhật ký hoạt động nào.</td></tr>`;
            return;
        }

        updatesTableBody.innerHTML = '';
        updatesSnapshot.forEach((doc) => {
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
    } catch (e) {
        console.error("Lỗi loadUpdates:", e);
        updatesTableBody.innerHTML = `<tr><td colspan="4" class="table-error">Lỗi tải dữ liệu nhật ký.</td></tr>`;
    }
}

// Expose tab switching to window scope
window.switchAdminTab = function(tab) {
    // Buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Contents
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`content-${tab}`).classList.add('active');
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
