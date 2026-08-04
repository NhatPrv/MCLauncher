# MCLauncher Windows Release Build Script
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Building MCLauncher Production Bundle " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "[1/3] Verifying Frontend Build..." -ForegroundColor Yellow
npm run build

Write-Host "[2/3] Building Tauri Rust Production Executable..." -ForegroundColor Yellow
npm run tauri build

Write-Host "[3/3] Build completed successfully!" -ForegroundColor Green
Write-Host "Executables generated under src-tauri/target/release/bundle/" -ForegroundColor Cyan
