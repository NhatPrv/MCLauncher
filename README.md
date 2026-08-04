# 🎮 MCLauncher - Next-Gen Minecraft Launcher

**MCLauncher** là ứng dụng khởi chạy Minecraft hiện đại, tốc độ cao, tiêu thụ cực ít tài nguyên hệ thống (RAM < 50MB) và được thiết kế với tiêu chí **BẢO MẬT HÀNG ĐẦU, NÓI KHÔNG VỚI MALWARE & BLOATWARE**. Dự án ra đời nhằm thay thế hoàn hảo các launcher thiếu an toàn như TLauncher.

---

## 🌟 Tính Năng Nổi Bật

- 🚀 **Siêu Nhẹ & Tốc Độ:** Được xây dựng bằng Rust (Tauri v2) + React + TailwindCSS.
- 🔒 **Bảo Mật Bộ Nhớ Tuyệt Đối:** Không chứa code theo dõi, không quảng cáo, không thu thập dữ liệu trái phép.
- 📦 **Hỗ Trợ Mọi Phiên Bản Vanilla:** Tải và khởi chạy tự động các bản Minecraft từ cổ điển đến mới nhất (1.0 -> 1.21+).
- 🛠️ **Tích Hợp Tự Động Mod Loaders:**
  - ⚡ **Fabric Loader**
  - 🔨 **Forge Loader**
  - 🍃 **Quilt Loader**
  - 💥 **NeoForge**
- 🎨 **Tối Ưu Đồ Họa Hàng Đầu:** Tích hợp sẵn cài đặt **OptiFine** & **Iris Shaders**.
- 🔑 **Quản Lý Tài Khoản Linh Hoạt:**
  - 🟢 **Offline Mode (Cracked):** Đăng nhập nhanh với tên tùy chọn.
  - 🟦 **Microsoft Online Account:** Đăng nhập chính chủ an toàn qua Microsoft OAuth2 Protocol.
- ⚙️ **Cấu Hình Game Mạnh Mẽ:** Tùy chỉnh RAM Min/Max, đường dẫn Java Executable, độ phân giải màn hình, tham số JVM Custom.
- 🌓 **Giao Diện Hiện Đại & Dark Mode:** Hỗ trợ chuyển đổi giao diện Sáng / Tối linh hoạt.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ | Lý do chọn |
| :--- | :--- | :--- |
| **Backend Core** | Rust (Tauri v2) | Hiệu năng native, bảo mật bộ nhớ, RAM cực nhẹ (< 50MB) |
| **Frontend UI** | React + TypeScript | Giao diện tương tác mượt mà, cấu trúc code rõ ràng |
| **Styling** | TailwindCSS | Thiết kế UI hiện đại, Dark/Light Mode linh hoạt |
| **Build Tools** | Vite + Cargo | Tốc độ biên dịch và đóng gói siêu nhanh |

---

## 🚀 Hướng Dẫn Cài Đặt & Phát Triển (Development)

### Yêu cầu hệ thống:
- [Node.js](https://nodejs.org/) (v18 trở lên)
- [Rust & Cargo](https://rustup.rs/)

### Các bước cài đặt:

1. **Clone repository:**
   ```bash
   git clone https://github.com/NhatPrv/MCLauncher.git
   cd MCLauncher
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Chạy ứng dụng ở chế độ Development:**
   ```bash
   npm run tauri dev
   ```

4. **Đóng gói ứng dụng (Production Build):**
   ```bash
   npm run tauri build
   ```

---

## 📜 Giấy Phép & Bản Quyền

Dự án được phát hành dưới giấy phép **MIT License**.

Minecraft là thương hiệu thuộc sở hữu của **Mojang AB / Microsoft**. MCLauncher không liên kết trực tiếp với Mojang AB.
