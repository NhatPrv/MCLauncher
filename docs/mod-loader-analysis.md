# Phân tích cơ chế Mod Loader trong Launcher (Fabric / Forge / NeoForge / Quilt)  
và so sánh với TLauncher / các launcher phổ biến

> Repo: `NhatPrv/MCLauncher`  
> Mục tiêu: giải thích cách launcher nên hoạt động với từng loader, so sánh best-practice, và chỉ ra lỗi/sai sót thường gặp (bao gồm lỗi hiện tại: launch ra vanilla thay vì Fabric).

---

## 1) Mô hình chuẩn của một launcher modded

Một launcher hỗ trợ mod cần tách rõ **3 lớp version**:

1. **Minecraft base version**  
   Ví dụ: `1.20.1`

2. **Loader version**  
   - Fabric Loader: `0.16.10`
   - Forge: `47.3.0` (tuỳ MC version)
   - NeoForge: `20.4.223` (ví dụ)
   - Quilt Loader: `0.27.x`

3. **Launch target version id (quan trọng nhất)**  
   Đây là ID thực sự dùng để chạy game, *không phải* lúc nào cũng là `1.20.1`.
   - Fabric: `fabric-loader-0.16.10-1.20.1`
   - Forge/NeoForge: thường là custom profile/version id do installer tạo
   - Quilt: `quilt-loader-<loader>-<mcVersion>`

Nếu launcher dùng nhầm `minecraftVersion` làm `versionId` khi khởi chạy thì game sẽ lên **vanilla**.

---

## 2) Cách hoạt động của từng loader

---

### 2.1 Fabric

#### Cơ chế
- Fabric dùng **fabric-loader** làm entrypoint.
- Cần có:
  - Version JSON của Fabric profile (trong `versions/<fabric-version-id>/...json`)
  - Libraries của Fabric loader + intermediary + dependencies
  - Mods trong thư mục `mods/`

#### Đặc điểm dependency
- Nhiều mod Fabric yêu cầu:
  - `fabric-api` (phổ biến nhất)
  - `cloth-config`, `architectury`, v.v.
- Nếu launcher chỉ tải file mod chính mà không resolve dependency -> crash hoặc missing mod.

#### Quy tắc launch
- `versionId` phải là `fabric-loader-...`
- Không được fallback sang `1.xx.x` vanilla ở bước cuối.

---

### 2.2 Forge

#### Cơ chế
- Forge thường cài qua installer, tạo:
  - custom version JSON
  - libraries đặc thù
  - args riêng (`--launchTarget`, modules, classpath...)
- Forge mới (1.13+) có cấu trúc khác Forge cũ (1.12 trở xuống).

#### Sai sót thường gặp
- Reuse logic Fabric cho Forge (sai vì Forge cần xử lý args/classpath khác).
- Không chạy bước processor/installer đầy đủ.

---

### 2.3 NeoForge

#### Cơ chế
- Tương tự Forge nhưng ecosystem và metadata riêng.
- Từ góc launcher: coi như 1 loader riêng, không gộp cứng với Forge.

#### Sai sót thường gặp
- Map nhầm NeoForge -> Forge endpoint.
- Dùng sai version schema khi resolve.

---

### 2.4 Quilt

#### Cơ chế
- Quilt tương tự Fabric ở cách “loader + mods”.
- Một số mod chỉ compatible Quilt hoặc Fabric tuỳ metadata.

#### Sai sót thường gặp
- Không kiểm tra `game_versions` + `loader compatibility`.
- Cài mod Fabric không tương thích trực tiếp với Quilt mà không cảnh báo.

---

## 3) So sánh với TLauncher / launcher khác

> Mục tiêu không phải “copy TLauncher”, mà là nhìn best-practice của launcher modded phổ biến (Prism Launcher, MultiMC derivatives, GDLauncher, etc.).

### 3.1 Điểm các launcher tốt thường làm

1. **Instance/Profile độc lập**
   - Mỗi profile có thư mục riêng (`mods`, `config`, `saves`, `versions` override).
   - Tránh đụng chéo mod giữa vanilla và modded.

2. **Launch target rõ ràng**
   - UI hiển thị rõ đang chạy `fabric-loader-x.y.z-mc`.
   - Không mơ hồ “1.20.1” khi thực chất là modded.

3. **Dependency resolution**
   - Tự động kéo dependency bắt buộc từ Modrinth/CurseForge metadata.
   - Cảnh báo dependency optional / conflict.

4. **Preflight validation**
   - Check thiếu mod phụ thuộc, trùng mod, sai loader, sai game version.
   - Chặn launch nếu chắc chắn fail.

5. **Log dễ debug**
   - Log “resolved profile”, “resolved version json path”, “mainClass”, “classpath size”.

### 3.2 Khác biệt thường thấy ở launcher tự làm (và dễ lỗi)
- Gộp logic vanilla và modded vào 1 pipeline duy nhất, không có branch theo loader.
- Fallback quá “dễ dãi” về vanilla khi thiếu file loader.
- Không có lock/version pin theo profile.

---

## 4) Lỗi hiện tại quan sát được (theo mô tả)

Từ triệu chứng:
- “Chọn bản có mod loader nhưng game mở lên vanilla”
- “Không lên Fabric, không kéo đúng mod cần thiết như Fabric API”

=> khả năng cao có các lỗi sau:

1. **Sai launch `versionId`**
   - Profile lưu `mcVersion=1.20.1`, nhưng runtime lấy luôn `1.20.1` để chạy.
   - Đúng phải là `fabric-loader-<loader>-1.20.1`.

2. **Sai đường dẫn version JSON khi launch**
   - Đang đọc `versions/1.20.1/1.20.1.json` thay vì `versions/fabric-loader-.../...json`.

3. **Không resolve dependency mod**
   - Chỉ tải mod chính, bỏ qua dependency (`fabric-api`...), dẫn tới lỗi runtime hoặc world không load mod đúng.

4. **Fallback logic không an toàn**
   - Nếu thiếu loader manifest thì launcher silently fallback vanilla thay vì báo lỗi rõ.

5. **Thiếu bước verify trước launch**
   - Không có check “profile là fabric mà resolved id lại vanilla” để chặn lỗi.

---

## 5) Checklist kỹ thuật nên áp dụng ngay

### 5.1 Data model profile
Nên có các field riêng:

- `minecraftVersion`
- `loaderType` (`vanilla|fabric|forge|neoforge|quilt`)
- `loaderVersion`
- `launchVersionId` (derived, immutable theo cài đặt)
- `mods[]` (projectId/versionId/source/pinned)

### 5.2 Install pipeline
1. Resolve MC metadata  
2. Install loader metadata + libraries  
3. Resolve mod list theo `(mcVersion, loaderType, loaderVersion)`  
4. Resolve dependencies recursively  
5. Write lockfile (để reproducible)  
6. Save `launchVersionId`

### 5.3 Launch pipeline
1. Load profile  
2. Assert loader invariants:
   - Fabric => `launchVersionId` bắt đầu `fabric-loader-`
   - Forge => có forge launch target tương ứng
3. Read version JSON từ `launchVersionId`
4. Build classpath/args
5. Launch

### 5.4 Guardrails bắt buộc
- Nếu profile `loaderType != vanilla` mà version json không tồn tại:
  - **Hard fail** + thông báo “Loader installation corrupted/missing”
  - Không fallback vanilla

---

## 6) Đề xuất logging để bắt lỗi nhanh

Log tối thiểu trước khi spawn Java:

- `profile.id`
- `profile.loaderType`
- `profile.minecraftVersion`
- `profile.loaderVersion`
- `resolved.launchVersionId`
- `resolved.versionJsonPath`
- `resolved.mainClass`
- `mods.count`
- `missingDependencies[]`

Chỉ cần 1 lần log này là debug được 80% lỗi “vào nhầm vanilla”.

---

## 7) Kết luận ngắn

Lỗi chính hiện tại nhiều khả năng là **nhầm giữa `minecraftVersion` và `launchVersionId`** ở bước chạy.  
Hệ quả: launcher cài loader/mod có thể đã đúng một phần, nhưng khi run lại dùng vanilla manifest -> game lên vanilla.

Fix ưu tiên:
1. Ràng buộc `launchVersionId` theo loader  
2. Không fallback vanilla cho profile modded  
3. Resolve dependency bắt buộc (Fabric API)  
4. Thêm preflight validation + logs

---

## 8) Hướng mở rộng

- Thêm `modpack.lock` (pin exact file hash/version) để reproducible.
- Tách thư mục instance cho từng profile.
- Tích hợp conflict detection (2 mods cùng provide 1 module).
- UI cảnh báo compatibility matrix theo loader/version.

---
Nếu cần, có thể tạo thêm tài liệu:
- `docs/fabric-flow-sequence.md` (sequence diagram)
- `docs/forge-flow-sequence.md`
- `docs/preflight-rules.md`
