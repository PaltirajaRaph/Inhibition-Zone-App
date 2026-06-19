# Inhibition Zone App - Full Setup Guide 

## A. Gambaran Sistem

Repository ini berisi:

- Frontend React + Vite + Capacitor
- PHP API (XAMPP Apache)
- Service Homography (FastAPI)
- Service YOLO (FastAPI + PyTorch)
- Database MySQL
- File breakpoint runtime S/I/R: Table 2A.csv

## B. Install Semua Dependensi Sistem

Jalankan PowerShell as Administrator untuk install awal.

### 1. Install tool utama

```powershell
winget install -e --id Git.Git
winget install -e --id GitHub.GitLFS
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Python.Python.3.10
winget install -e --id ApacheFriends.Xampp.8.2
winget install -e --id Google.AndroidStudio
```

Jika salah satu package tidak tersedia di winget, install manual dari website resmi.

### 2. Install Visual C++ Runtime (penting untuk numpy/opencv/torch)

Jika belum ada, install Microsoft Visual C++ Redistributable 2015-2022 (x64).

### 3. Reopen terminal dan verifikasi

```powershell
git --version
git lfs version
node -v
npm.cmd -v
py -0p
python --version
java -version
```

Harus terlihat Python 3.10 pada output py -0p.

## C. Clone Repository

```powershell
git clone <REPOSITORY_URL>
cd Inhibition-Zone-App
git lfs install
git lfs pull
```

Verifikasi file model YOLO ada:

```powershell
Test-Path "App tugas akhir\App tugas akhir\YOLO AI\best.pt"
```

Kalau hasil False, jalankan ulang git lfs pull.

## D. Struktur Folder Kerja

Sebagian besar command dijalankan dari folder app ini:

```powershell
cd "App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
```

Layout nested folder jangan diubah, karena script backend bergantung pada relative path saat ini.

## E. Setup Frontend (Node)

Dari folder app:

```powershell
npm.cmd ci
```

Jika npm error permission di PowerShell, tetap gunakan npm.cmd (bukan npm).

## F. Setup Environment Variable Frontend

Dari folder app:

```powershell
copy .env.example .env
```

Isi file .env.

### 1. Untuk Android Emulator

```env
VITE_ANDROID_API_BASE_URL=http://10.0.2.2/biotech-api
VITE_ANDROID_API_BASE_URL_FALLBACKS=http://10.0.3.2/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://10.0.2.2:8000
VITE_ANDROID_YOLO_API_BASE_URL=http://10.0.2.2:9000
```

### 2. Untuk HP fisik (satu Wi-Fi dengan laptop)

Cari IPv4 laptop:

```powershell
ipconfig
```

Lalu isi:

```env
VITE_ANDROID_API_BASE_URL=http://<YOUR_PC_IPV4>/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://<YOUR_PC_IPV4>:8000
VITE_ANDROID_YOLO_API_BASE_URL=http://<YOUR_PC_IPV4>:9000
```

Catatan:

- Buka firewall untuk port 80, 8000, 9000 jika akses dari HP gagal.
- Jangan commit file .env.

## G. Setup Database dan PHP API

### 1. Start service XAMPP

- Start Apache
- Start MySQL

### 2. Buat database

- Buka http://localhost/phpmyadmin
- Create database: biotech_dashboard

### 3. Import schema awal

Import file:

App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/biotech_db.sql

### 4. Jalankan migration SQL

Execute semua file SQL di folder berikut secara urut (nama file ascending):

App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/migrations

### 5. Deploy API PHP ke htdocs

Dari folder app:

```powershell
robocopy ".\database\api" "C:\xampp\htdocs\biotech-api" /MIR
```

### 6. Verifikasi API

Buka URL berikut, harus return JSON sehat:

http://localhost/biotech-api/health

## H. Setup Python Environment (2 service)

Project ini menggunakan dua venv terpisah agar dependency tidak bentrok.

### 1. Homography service

```powershell
cd "App tugas akhir\App tugas akhir\homography"
py -3.10 -m venv .venv-homography
.\.venv-homography\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -c "import fastapi, cv2, numpy; print('homography deps OK')"
deactivate
```

### 2. YOLO service

```powershell
cd "..\yolo_service"
py -3.10 -m venv .venv-yolo
.\.venv-yolo\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -c "import torch, torchvision, cv2, fastapi; print('yolo deps OK')"
deactivate
```

Jika install pycocotools gagal di Windows:

```powershell
pip install pycocotools-windows
```

## I. Start Semua Backend Service

Kembali ke folder app:

```powershell
cd "..\Biotechnology App Dashboard\Biotechnology App Dashboard"
npm.cmd run backend:start
npm.cmd run backend:status
```

Endpoint health yang harus aktif:

- http://localhost/biotech-api/health
- http://localhost:8000/health
- http://localhost:9000/health

Command penting:

- Force cleanup port: npm.cmd run backend:start:force
- Start Python only (tanpa start XAMPP): npm.cmd run backend:start:noxampp
- Stop backend: npm.cmd run backend:stop

## J. Jalankan Frontend Web

Dari folder app:

```powershell
npm.cmd run dev
```

Buka URL Vite yang tampil (biasanya http://localhost:5173).

## K. Build dan Jalankan Android

### 1. Sinkronisasi Capacitor

```powershell
npm.cmd run android:sync
```

### 2. Buka project Android Studio

```powershell
npx cap open android
```

### 3. Di Android Studio

1. Tunggu Gradle Sync selesai.
2. Jika diminta JDK, pilih Embedded JDK atau JDK 17.
3. Pilih emulator atau device fisik.
4. Klik Run.

Setiap ada perubahan frontend atau .env, wajib jalankan ulang npm.cmd run android:sync.

## L. Setup Emulator (Jika Belum Ada)

Di Android Studio:

1. More Actions > Virtual Device Manager.
2. Create Device (misalnya Pixel 4/5).
3. Pilih system image Android 13+ (x86_64).
4. Finish dan start emulator.

## M. Daily Run (Setelah Setup Selesai)

Dari folder app:

```powershell
npm.cmd run backend:start
npm.cmd run backend:status
npm.cmd run android:sync
npx cap open android
```

Atau gunakan shortcut:

```powershell
npm.cmd run android:daily
```

## N. Troubleshooting Umum

### 1. py -3.10 tidak ditemukan

- Install ulang Python 3.10.
- Pastikan Add Python to PATH aktif.
- Tutup dan buka terminal baru.
- Cek ulang dengan py -0p.

### 2. ExecutionPolicy block saat activate venv

Di PowerShell session saat ini:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

### 3. npm tidak jalan di PowerShell

Gunakan npm.cmd, contoh:

```powershell
npm.cmd ci
```

### 4. Port 8000/9000 sudah dipakai

```powershell
npm.cmd run backend:start:force
```

### 5. Android tidak bisa akses backend lokal

- Emulator harus pakai 10.0.2.2.
- Device fisik harus pakai IPv4 laptop.
- Pastikan laptop dan HP satu Wi-Fi.
- Buka firewall port 80, 8000, 9000.

### 6. API health gagal

- Cek Apache MySQL di XAMPP harus running.
- Pastikan folder C:\xampp\htdocs\biotech-api sudah terisi file API terbaru.

### 7. Model YOLO tidak ditemukan

```powershell
git lfs pull
```

Lalu cek ulang file best.pt.

### 8. Build Android gagal karena JDK/Gradle

- Android Studio > Settings > Build, Execution, Deployment > Build Tools > Gradle
- Set Gradle JDK ke Embedded JDK atau JDK 17
- Sync Project with Gradle Files

## O. File Lokal yang Tidak Boleh Di-commit

- .env
- node_modules
- semua folder virtual environment Python
- Android local.properties
- folder build/cache/outputs

## P. File Runtime yang Harus Tetap Ada di Repo

- Table 2A.csv
- App tugas akhir/App tugas akhir/YOLO AI/best.pt
- App tugas akhir/App tugas akhir/homography
- App tugas akhir/App tugas akhir/yolo_service
- App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database
