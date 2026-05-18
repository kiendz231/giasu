import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showAlert, showConfirm } from "./modals.js";

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

// Elements
const profileAvatar = document.getElementById('profileAvatar');
const profileAvatarPlaceholder = document.getElementById('profileAvatarPlaceholder');
const profileDisplayName = document.getElementById('profileDisplayName');
const profileEmailBadge = document.getElementById('profileEmailBadge');
const profileUid = document.getElementById('profileUid');
const profileProvider = document.getElementById('profileProvider');
const profileLogoutBtn = document.getElementById('profileLogoutBtn');

const profileEditForm = document.getElementById('profileEditForm');
const editName = document.getElementById('editName');
const editEmail = document.getElementById('editEmail');
const editPhotoUrl = document.getElementById('editPhotoUrl');

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        // Populate overview
        profileDisplayName.textContent = user.displayName || 'Chưa đặt tên';
        profileEmailBadge.textContent = user.email;
        profileUid.textContent = user.uid;
        profileProvider.textContent = user.providerData[0]?.providerId || 'Email/Password';
        
        // Populate inputs
        editName.value = user.displayName || '';
        editEmail.value = user.email || '';
        editPhotoUrl.value = user.photoURL || '';

        // Handle Avatar displaying
        updateAvatarDisplay(user);
    } else {
        // Not logged in, redirect to home
        await showAlert('Vui lòng đăng nhập trước khi xem trang hồ sơ!', 'Yêu cầu đăng nhập', '🔒');
        window.location.href = 'index.html';
    }
});

function updateAvatarDisplay(user) {
    if (user.photoURL) {
        profileAvatar.src = user.photoURL;
        profileAvatar.style.display = 'block';
        profileAvatarPlaceholder.style.display = 'none';
    } else {
        profileAvatar.style.display = 'none';
        profileAvatarPlaceholder.style.display = 'flex';
        profileAvatarPlaceholder.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
    }
}

// Save changes
if (profileEditForm) {
    profileEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const newName = editName.value.trim();
        const newPhotoUrl = editPhotoUrl.value.trim();

        try {
            // Update Firebase Auth profile
            await updateProfile(currentUser, {
                displayName: newName,
                photoURL: newPhotoUrl || null
            });

            // Save / log update event in Firestore
            await addDoc(collection(db, "profile_updates"), {
                uid: currentUser.uid,
                updatedName: newName,
                updatedPhotoUrl: newPhotoUrl || null,
                timestamp: serverTimestamp()
            });
            
            await showAlert('Cập nhật hồ sơ thành công!', 'Thành công', '✅');
            
            // Live reload overview
            profileDisplayName.textContent = newName;
            updateAvatarDisplay(currentUser);
        } catch (error) {
            console.error("Lỗi cập nhật hồ sơ:", error);
            await showAlert(`Không thể cập nhật hồ sơ: ${error.message}`, 'Lỗi cập nhật', '❌');
        }
    });
}

// Logout button
if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener('click', async () => {
        const confirmLogout = await showConfirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?", "Xác nhận đăng xuất", "🚪");
        if (!confirmLogout) return;

        try {
            await signOut(auth);
            await showAlert('Đăng xuất thành công!', 'Tạm biệt', '👋');
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
            await showAlert(`Lỗi đăng xuất: ${error.message}`, 'Lỗi', '❌');
        }
    });
}
