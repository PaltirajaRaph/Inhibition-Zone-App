# Inhibition Zone App
## 1. What This Project Contains

The app consists of multiple parts that must work together.

- Frontend: React + Vite + Capacitor
- API backend: PHP (served by Apache, connected to MySQL)
- AI service 1: Homography FastAPI service
- AI service 2: YOLO FastAPI service (PyTorch)
- Database: MySQL schema + migrations
- Runtime reference data: Table 2A.csv

Required healthy endpoints during runtime:

- http://localhost/biotech-api/health
- http://localhost:8000/health
- http://localhost:9000/health

If one endpoint is down, some app features will fail.

## 2. What You Need Before Starting

If using NVIDIA GPU for acceleration:

- Install recent NVIDIA driver
- Install Microsoft Visual C++ Redistributable 2015-2022 x64

## 3. First-Time Installation on a New Laptop

Open PowerShell as Administrator and install required tools.

### 3.1 Core tools

Run:

winget install -e --id Git.Git
winget install -e --id GitHub.GitLFS
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Python.Python.3.10
winget install -e --id Google.AndroidStudio

For web server + MySQL, install one option:

- Option A: XAMPP
	winget install -e --id ApacheFriends.Xampp.8.2

- Option B: WAMP (install manually from official site)

### 3.2 Visual C++ runtime (important for torch/opencv)

Install:

- Microsoft Visual C++ Redistributable 2015-2022 (x64)

### 3.3 Verify installation

Close and reopen terminal, then run:

git --version
git lfs version
node -v
npm.cmd -v
py -0p
python --version
java -version

Make sure Python 3.10 appears in py -0p list.

## 4. Clone and Verify Repository

Run:

git clone <REPOSITORY_URL>
cd Inhibition-Zone-App
git lfs install
git lfs pull

Verify YOLO model file exists:

Test-Path "App tugas akhir\App tugas akhir\YOLO AI\best.pt"

If result is False, run git lfs pull again.

## 5. Frontend Setup (React + Vite + Capacitor)

Go to app root folder:

cd "App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"

Install node dependencies:

npm.cmd ci

Create environment file:

copy .env.example .env

### 5.1 Configure .env for Android emulator

Use:

VITE_ANDROID_API_BASE_URL=http://10.0.2.2/biotech-api

VITE_ANDROID_API_BASE_URL_FALLBACKS=http://10.0.3.2/biotech-api

VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://10.0.2.2:8000

VITE_ANDROID_YOLO_API_BASE_URL=http://10.0.2.2:9000

### 5.2 Configure .env for physical phone (same Wi-Fi)

Find Device's IPv4:

ipconfig

Then set:

VITE_ANDROID_API_BASE_URL=http://<YOUR_PC_IPV4>/biotech-api

VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://<YOUR_PC_IPV4>:8000

VITE_ANDROID_YOLO_API_BASE_URL=http://<YOUR_PC_IPV4>:9000

Notes:

- Open firewall ports 80, 8000, 9000 if needed.
- Never commit .env.

## 6. Database and PHP API Setup (XAMPP or WAMP)

### 6.1 Start web server + MySQL

If using XAMPP:

- Start Apache
- Start MySQL

If using WAMP:

- Start Apache
- Start MySQL

### 6.2 Create database

Open phpMyAdmin (usually http://localhost/phpmyadmin), then:

- Create database named biotech_dashboard

### 6.3 Import base schema

Import this file:

App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/biotech_db.sql

### 6.4 Run migrations

Import all SQL files in chronological order from:

App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/migrations

### 6.5 Deploy PHP API to web root

Important:

- Do not copy API into MySQL data folder.
- Copy API into Apache web root.

From dashboard app root:

- XAMPP target:
	robocopy ".\database\api" "C:\xampp\htdocs\biotech-api" /MIR

- WAMP target:
	robocopy ".\database\api" "C:\wamp64\www\biotech-api" /MIR

### 6.6 Configure DB credential for API

File:

App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/api/config/database.php

Default values:

- host: localhost
- db_name: biotech_dashboard
- username: root
- password: empty

If your MySQL root has password, update that file before copying API to web root.

### 6.7 Verify API health

Open:

http://localhost/biotech-api/health

It must return JSON with success true.

## 7. Python Services Setup (Homography and YOLO)

Project uses separate virtual environments to avoid dependency conflicts.

### 7.1 Homography service setup

cd "App tugas akhir\App tugas akhir\homography"
py -3.10 -m venv .venv-homography
.\.venv-homography\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -c "import fastapi, cv2, numpy; print('homography deps OK')"
deactivate

### 7.2 YOLO service setup

cd "..\yolo_service"
py -3.10 -m venv .venv-yolo
.\.venv-yolo\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -c "import torch, torchvision, cv2, fastapi; print('yolo deps OK')"
deactivate

If pycocotools fails on Windows:

pip install pycocotools-windows

If torch reports DLL load error:

- install Visual C++ Redistributable x64
- reopen terminal and reinstall requirements in YOLO venv

## 8. Run the App in Web Mode (No Android Studio)

You can run the app from browser only.

### 8.1 Start backend stack

From dashboard app root:

- If using XAMPP automation:
	npm.cmd run backend:start

- If using WAMP or manual Apache/MySQL:
	npm.cmd run backend:start:noxampp

Check health:

npm.cmd run backend:status

### 8.2 Start frontend

npm.cmd run dev

Open URL printed by Vite (usually http://localhost:3000 or http://localhost:5173).

### 8.3 Web mode quick validation

Confirm these URLs:

- http://localhost/biotech-api/health
- http://localhost:8000/health
- http://localhost:9000/health

## 9. Run the App in Android Studio

### 9.1 Build web assets and sync Capacitor

From dashboard app root:

npm.cmd run android:sync

This command does:

- vite build
- cap sync android

### 9.2 Open Android project

npx cap open android

### 9.3 Android Studio required configuration

1. Wait for Gradle Sync to finish.
2. Set Gradle JDK to Embedded JDK or JDK 17.
3. Select emulator/device.
4. Press Run.

Every time frontend code or .env changes, run npm.cmd run android:sync again.

## 10. Daily Development Workflow

Use this sequence every day.

### 10.1 Start working

From dashboard app root:

npm.cmd run backend:start:noxampp
npm.cmd run backend:status
npm.cmd run dev

For Android testing:

npm.cmd run android:sync
npx cap open android

### 10.2 While coding

- Edit React code in src
- Check browser first (faster feedback)
- Only sync Android when native package or env changed

### 10.3 Before stopping

Stop backend:

npm.cmd run backend:stop:noxampp

## 11. Git Workflow for Individual Development

Recommended safe flow:

1. Update local main:
	 git checkout main
	 git pull

2. Create feature branch:
	 git checkout -b feat/<short-feature-name>

3. Commit in small logical steps:
	 git add .
	 git commit -m "feat: <what changed>"

4. Push branch:
	 git push -u origin feat/<short-feature-name>

5. Open pull request to main.

Do not work directly on main for feature development.

## 12. Troubleshooting and Fixes

### 12.1 py -3.10 not found

- reinstall Python 3.10
- enable Add Python to PATH
- reopen terminal
- verify with py -0p

### 12.2 PowerShell blocks venv activation

Run in current terminal:

Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned

### 12.3 npm not recognized in PowerShell

Use npm.cmd, not npm.

### 12.4 Port 8000 or 9000 already in use

npm.cmd run backend:start:force

### 12.5 Android cannot access local backend

- emulator must use 10.0.2.2
- physical phone must use laptop IPv4
- phone and laptop must be on same Wi-Fi
- open firewall ports 80, 8000, 9000

### 12.6 API health returns database access denied

- update API DB credentials in database.php
- recopy API to htdocs/www using robocopy

### 12.7 YOLO model not found

git lfs pull

Then verify best.pt exists.

### 12.8 Android error: cordova.variables.gradle does not exist

Usually caused by running cap sync before build.

Run:

npm.cmd run build
Test-Path .\build\index.html
npx cap sync android

If still failing, regenerate Android platform:

Remove-Item -Recurse -Force .\android
npx cap add android
npm.cmd run android:sync

### 12.9 npx cap sync android fails: web assets directory .\build missing

Run build first:

npm.cmd run build
npx cap sync android

## 13. Files and Folders That Must Not Be Committed

Do not commit local runtime files:

- .env
- node_modules
- all Python virtual environment folders
- android/local.properties
- build caches and outputs

Required runtime artifacts that must remain in repository:

- Table 2A.csv
- App tugas akhir/App tugas akhir/YOLO AI/best.pt
- App tugas akhir/App tugas akhir/homography
- App tugas akhir/App tugas akhir/yolo_service
- App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database

---

If you are mentoring new teammates, share this sequence:

1. Verify tools
2. Clone + git lfs pull
3. Setup DB + API health
4. Setup Python services + health
5. Run web mode first
6. Then move to Android Studio

This order reduces setup failures significantly for beginners.
```powershell
py -0p
```

Then use explicit launcher:

```powershell
py -3.10 -m venv .venv
```

### Error: PowerShell blocks venv activation

Fix for current shell only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

### Error: Android app cannot hit local backend

Checklist:

1. Emulator uses `10.0.2.2`
2. Physical phone uses laptop IPv4
3. Same Wi-Fi
4. Firewall open for ports 80/8000/9000

---

## 12. Daily Run Commands

### Option A: Web-only development

1. Start Apache + MySQL
2. Start homography service (`python server.py`)
3. Start YOLO service (`python server.py`)
4. Start frontend (`npm.cmd run dev`)

### Option B: Android development

1. Start all backend services
2. `npm.cmd run android:sync`
3. `npx cap open android`
4. Run in Android Studio

---

## 13. Team Development Workflow (Individual Contribution)

Use this so everyone can develop independently without conflicts.

### 13.1 One-time Git setup

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### 13.2 Create your own feature branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/<short-topic>
```

Examples:

1. `feature/login-validation`
2. `feature/yolo-overlay-improvement`

### 13.3 Commit safely

Before commit:

```powershell
git status
```

Never commit:

1. `.env`
2. `node_modules`
3. Python virtualenv folders
4. Android local files (`local.properties`, build outputs)

Commit flow:

```powershell
git add <files>
git commit -m "feat: short clear message"
git push -u origin feature/<short-topic>
```

### 13.4 Before opening PR

1. Rebase or merge latest `main`
2. Ensure app still runs locally (health checks + frontend)
3. Include testing notes in PR description

---

## 14. Final Preflight Checklist

Before saying setup is done, confirm all are true:

1. `best.pt` exists and was pulled with Git LFS
2. API health returns success JSON
3. Homography health is OK
4. YOLO health is OK
5. Frontend opens and can call backends
6. Android sync runs clean (if using Android)

If all six are green, your laptop is ready for individual development.

---

## 15. Runtime Files and Repo Safety

Keep these project assets intact:

1. `Table 2A.csv`
2. `App tugas akhir/App tugas akhir/YOLO AI/best.pt`
3. `App tugas akhir/App tugas akhir/homography`
4. `App tugas akhir/App tugas akhir/yolo_service`
5. `App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database`

Do not restructure nested directories unless the team agrees and updates scripts.
