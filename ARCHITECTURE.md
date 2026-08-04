# 🏛️ ARCHITECTURE.md - Kiến Trúc Kỹ Thuật MCLauncher

Tài liệu này mô tả chi tiết kiến trúc phần mềm, luồng dữ liệu và cơ chế bảo mật của **MCLauncher**.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

MCLauncher áp dụng mô hình kiến trúc hai tầng (Two-Tiered Architecture) phân tách triệt để giữa UI (Frontend) và System Engine (Backend):

```
┌────────────────────────────────────────────────────────┐
│                   REACT FRONTEND (UI)                  │
│   TypeScript | TailwindCSS | Lucide Icons | Components │
└───────────────────────────┬────────────────────────────┘
                            │  Tauri IPC Commands / Events
┌───────────────────────────▼────────────────────────────┐
│                    RUST BACKEND CORE                   │
│  Tauri App Core  │  Version Manifest  │ Auth Manager   │
│  Parallel Downloader │ Java Spawner  │ Config Manager │
└───────────────────────────┬────────────────────────────┘
                            │ System Process Call
┌───────────────────────────▼────────────────────────────┐
│              MINECRAFT JAVA RUNTIME (GAME)             │
└────────────────────────────────────────────────────────┘
```

---

## 2. Các Mô-đun Rust Backend (`src-tauri/src`)

1. **`auth.rs` (Authentication Module):**
   - Hỗ trợ **Offline Mode**: Sinh UUID v3/v4 đếm lập từ tên người chơi.
   - Hỗ trợ **Microsoft OAuth2**: Thực hiện quy trình cấp phép Device Code Flow hoặc Auth Token với Mojang Live Services, đổi lấy Minecraft Access Token.

2. **`version_manifest.rs` (Version Manager):**
   - Truy vấn Mojang Official Manifest API (`https://piston-meta.mojang.com/mc/game/version_manifest_v2.json`).
   - Lấy siêu dữ liệu cho Mod Loaders: Fabric Meta API, Forge Promo, Quilt Meta, NeoForge, OptiFine.

3. **`downloader.rs` (Parallel Downloader):**
   - Tải tệp tin đa luồng (Multi-threaded) song song với `reqwest` & `tokio`.
   - Xác thực Checksum (SHA-1) từng asset / library / client.jar trước khi khởi chạy để tránh hỏng dữ liệu.

4. **`installer.rs` (Mod & Modloader Installer):**
   - Trích xuất và giải nén tự động tệp Jar/Zip của Fabric, Forge, Quilt, NeoForge, OptiFine, Iris Shaders.
   - Xây dựng file JSON cấu hình phiên bản modded tương thích tiêu chuẩn Minecraft Launcher.

5. **`launcher.rs` (Process Spawner):**
   - Phát hiện tự động cài đặt Java JRE/JDK sẵn có trên Windows.
   - Xây dựng classpath hoàn chỉnh (`-cp`) cùng các đối số JVM (RAM, Garbage Collector flags).
   - Khởi chạy tiến trình `javaw.exe` độc lập không làm gián đoạn UI.

6. **`config.rs` (System Configuration):**
   - Lưu trữ thiết lập người dùng vào file JSON tại `AppData/Roaming/MCLauncher/config.json`.

---

## 3. Cơ Chế Bảo Mật & Tối Ưu Hiệu Năng (Security & Performance)

- 🔒 **No Telemetry / No Malware:** Không gửi bất kỳ dữ liệu nhạy cảm nào về máy chủ bên thứ ba.
- ⚡ **RAM Optimization:** Nhờ sử dụng Rust thay vì Electron, ứng dụng tiêu thụ < 50MB RAM khi ở chế độ chờ.
- 🛡️ **Memory Safety:** Rust loại bỏ hoàn toàn các lỗi Null Pointer, Buffer Overflow hay Data Race.
