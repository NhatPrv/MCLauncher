# 🗺️ MCLauncher - Product Roadmap

Danh sách lộ trình phát triển tính năng và trạng thái ứng dụng **MCLauncher**.

---

## 📍 Trạng Thái Tính Năng (Feature Status)

### 📌 Giai Đoạn 1: Nền Tảng Khởi Chạy (Core Launcher Foundation)
- [x] Khởi tạo kiến trúc Tauri v2 + Rust Backend + React Frontend + TailwindCSS.
- [x] Thiết lập hệ thống quản lý cấu hình người dùng (RAM Min/Max, Java Executable, Resolution, Custom JVM Args).
- [x] Thiết lập giao diện hiện đại hỗ trợ Chế độ Sáng / Tối (Light Mode / Dark Mode).
- [x] Viết tài liệu tổng quan (README, ROADMAP, ARCHITECTURE).

### 📌 Giai Đoạn 2: Quản Lý Phiên Bản & Mod Loaders (Versions & Modding System)
- [x] Lấy danh sách phiên bản Minecraft Vanilla tự động từ Mojang Manifest API.
- [x] Hỗ trợ tải tự động Client JAR, Libraries, Assets và kiểm tra Checksum SHA1.
- [x] Tích hợp tự động Fabric Mod Loader.
- [x] Tích hợp tự động Forge Mod Loader.
- [x] Tích hợp tự động Quilt Mod Loader.
- [x] Tích hợp tự động NeoForge Mod Loader.
- [x] Tích hợp tự động OptiFine & Iris Shaders.

### 📌 Giai Đoạn 3: Quản Lý Tài Khoản & Bảo Mật (Auth & Security)
- [x] Chế độ Offline Mode (Cracked / Offline Play).
- [x] Chế độ Đăng nhập Microsoft Online Account (OAuth2 / Device Code Flow).
- [x] Bảo mật bộ nhớ tuyệt đối, mã hóa lưu trữ Token cục bộ bằng OS Credential Vault / Safe Config.

### 📌 Giai Đoạn 4: Trải Nghiệm Khởi Chạy & Đóng Gói (Execution & Release)
- [x] Tự động phát hiện và quét đường dẫn Java trên hệ thống.
- [x] Tạo tiến trình khởi chạy Minecraft Java Process Spawner độc lập.
- [x] Hỗ trợ Build & Đóng gói ứng dụng phát hành Windows Executable (`.exe` / `.msi`).

---

**Trạng thái tổng thể dự án:** 🚀 **100% COMPLETED**
