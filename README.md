# 🎮 MCLauncher

**MCLauncher** là launcher Minecraft desktop xây bằng **Tauri + Rust + React**, tập trung vào hiệu năng nhẹ, bảo mật và hỗ trợ nhiều mod loader.

## Tính năng chính

- Tải và chạy nhiều phiên bản Minecraft Vanilla
- Hỗ trợ cài đặt loader: **Fabric, Forge, Quilt, NeoForge, OptiFine, Iris**
- Đăng nhập **Offline** và **Microsoft OAuth2**
- Tự động phát hiện/cấu hình Java, tuỳ chỉnh RAM và JVM args
- Giao diện React + TailwindCSS với hỗ trợ Light/Dark mode

## Kiến trúc nhanh

- **Frontend**: React + TypeScript (`/src`)
- **Backend**: Rust (Tauri commands, `/src-tauri/src`)
- **Core modules**: `auth`, `config`, `version_manifest`, `installer`, `downloader`, `launcher`

Tài liệu chi tiết:
- `/home/runner/work/MCLauncher/MCLauncher/ARCHITECTURE.md`
- `/home/runner/work/MCLauncher/MCLauncher/ROADMAP.md`
- `/home/runner/work/MCLauncher/MCLauncher/docs/mod-loader-analysis.md`

## Yêu cầu môi trường

- Node.js 18+
- Rust toolchain (`rustup`, `cargo`)
- Nền tảng chính: Windows (target hiện tại)

## Chạy dự án

```bash
npm install
npm run tauri dev
```

## Build

Frontend build:

```bash
npm run build
```

Tauri build:

```bash
npm run tauri build
```

Tuỳ chọn script PowerShell:

```powershell
powershell ./scripts/build.ps1
```

## Cấu trúc thư mục

- `/home/runner/work/MCLauncher/MCLauncher/src`: UI React
- `/home/runner/work/MCLauncher/MCLauncher/src-tauri`: backend Rust + config Tauri
- `/home/runner/work/MCLauncher/MCLauncher/public`: static assets
- `/home/runner/work/MCLauncher/MCLauncher/docs`: tài liệu phân tích bổ sung

## Lưu ý pháp lý

Minecraft là thương hiệu thuộc sở hữu của Mojang AB/Microsoft. Dự án không liên kết chính thức với Mojang AB.
