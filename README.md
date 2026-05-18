# EDU BOURBON - Online Learning Platform Landing Page 🎓

EDU BOURBON là một Landing Page giới thiệu khóa học trực tuyến đa năng, sở hữu giao diện trắng-xanh hiện đại, hiệu ứng kính mờ (Glassmorphism) đẳng cấp, hoạt động mượt mà và tối ưu hóa 100% trên các thiết bị di động (Mobile Responsive). 

Dự án được kết nối trực tiếp với cơ sở dữ liệu thời gian thực **Firebase (Auth & Firestore)** để vận hành toàn bộ luồng đăng ký, đăng nhập, tùy chỉnh hồ sơ cá nhân và trang quản trị Admin tối tân.

---

## ✨ Các Tính Năng Nổi Bật

### 1. 🏠 Landing Page Giới Thiệu Khóa Học
- Thiết kế tông Trắng - Xanh thanh lịch, chuyên nghiệp.
- Chuẩn SEO, tốc độ tải trang cực nhanh nhờ tối ưu hóa assets.
- Hiệu ứng cuộn mượt (Smooth Scroll) và hiệu ứng tương tác (Micro-interactions) đỉnh cao.
- **Form đăng ký nhận ưu đãi 50%**: Gửi trực tiếp thông tin email của khách hàng về Firestore.

### 2. 🔐 Hệ Thống Đăng Ký / Đăng Nhập Đa Phương Thức
- Popup Modal được thiết kế hai cột cao cấp (banner minh họa bên trái + form tương tác bên phải).
- **Email & Password**: Tích hợp Firebase Auth để đăng ký/đăng nhập và tự động đồng bộ hóa thông tin sang Firestore collection `users`.
- **Google Social Login**: Đăng nhập nhanh bằng tài khoản Google chỉ trong 1 chạm.

### 3. 👤 Trang Hồ Sơ Cá Nhân (`profile.html`)
- Bảo mật thông minh: Tự động chặn truy cập trái phép và yêu cầu đăng nhập.
- Cho phép người dùng chỉnh sửa **Họ và tên** và **Liên kết ảnh đại diện (URL)**.
- Tự động sinh Avatar chứa ký tự đầu của tên nếu tài khoản không thiết lập ảnh đại diện.
- Đồng bộ hóa dữ liệu thời gian thực với Firebase Auth và ghi nhận lịch sử thay đổi vào Firestore collection `profile_updates`.

### 4. 🛠️ Trang Quản Trị Tối Tân (`admin.html`)
- Hệ thống tự nhận diện Email Admin chính thức: **`vokien609@gmail.com`** (và các email có chứa từ khóa `admin`).
- Tự động hiển thị nút **"Trang Admin"** trên Navbar sau khi đăng nhập thành công bằng tài khoản Admin.
- **Bảng điều khiển (Dashboard) trực quan**:
  - Biểu đồ số liệu thời gian thực: Tổng học viên, Khách nhận ưu đãi, Số lượt cập nhật.
  - Tab **Quản lý học viên**: Xem danh sách chi tiết học viên, phương thức đăng nhập, ngày đăng ký.
  - Tab **Khách nhận ưu đãi**: Xem danh sách email đăng ký nhận quà kèm **nút Xóa Lead** trực tiếp khỏi database.
  - Tab **Nhật ký hoạt động**: Xem lịch sử cập nhật tài khoản của học viên.

### 📱 5. Mobile Responsive 100%
- Tự động co giãn theo tỷ lệ vàng trên mọi kích thước màn hình (từ máy tính bảng đến các điện thoại nhỏ 320px).
- Nút "Trang Admin" và "Đăng Xuất" tự động thu gọn thành các nút tròn chứa biểu tượng cảm xúc (🛠️, 🚪) trên di động để giữ cho Navbar luôn tinh tế và cân đối.

---

## 🛠️ Công Nghệ Sử Dụng
- **Front-end**: HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism, Responsive Grid), ES6 Javascript Modules.
- **Back-end & Database**: Firebase Client SDK v10.8.0 (Authentication & Cloud Firestore).

---

## 🚀 Hướng Dẫn Deploy Lên GitHub Pages

Để đưa dự án này chạy online miễn phí trên GitHub Pages, bạn thực hiện các bước đơn giản sau:

### Bước 1: Khởi tạo Git và Push lên GitHub
Mở Terminal tại thư mục dự án và chạy các lệnh:
```bash
# Khởi tạo repository cục bộ
git init

# Thêm tất cả file vào staging
git add .

# Commit phiên bản đầu tiên
git commit -m "feat: initial commit with landing, profile, admin and mobile optimizations"

# Liên kết với Repository trống trên GitHub của bạn
git branch -M main
git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_KHO_LƯU_TRỮ.git

# Push mã nguồn lên GitHub
git push -u origin main
```

### Bước 2: Kích hoạt GitHub Pages
1. Truy cập vào kho lưu trữ (Repository) của bạn trên trang web GitHub.
2. Vào mục **Settings** (Cài đặt) -> Chọn **Pages** ở thanh menu bên trái.
3. Tại phần **Build and deployment** -> **Source**, chọn **Deploy from a branch**.
4. Tại phần **Branch**, chọn nhánh **`main`** và chọn thư mục **`/ (root)`**, sau đó nhấn **Save** (Lưu).
5. Đợi khoảng 1-2 phút, GitHub sẽ cung cấp cho bạn một đường dẫn URL dạng: `https://username.github.io/repository-name/` hoạt động hoàn hảo trực tuyến!

---

## 📝 Cấu Trúc Thư Mục Dự Án
```text
online-course-landing/
├── index.html        # Trang chủ landing page & popup auth
├── style.css         # File thiết kế CSS dùng chung toàn hệ thống
├── script.js        # Logic điều khiển trang chủ & Firebase chính
├── profile.html      # Trang cá nhân của học viên
├── profile.js        # Logic điều khiển trang cá nhân
├── admin.html        # Trang quản trị dành cho Admin
├── admin.js          # Logic truy vấn và quản lý Firestore
├── README.md         # Tài liệu hướng dẫn dự án
└── .gitignore        # Các tệp tin được bỏ qua khi push git
```
