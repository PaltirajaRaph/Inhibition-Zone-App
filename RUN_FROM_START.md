# Inhibition Zone App Setup

This repository is the handoff version for running the inhibition-zone analysis system. It includes the React/Capacitor frontend, PHP API, homography service, YOLO inference service, and the breakpoint CSV used for automatic S/I/R suggestions.

## 1. Clone The Repository

```powershell
git clone <REPOSITORY_URL>
cd Inhibition-Zone-App
git lfs pull
```

`git lfs pull` is required because the YOLO model is stored with Git LFS.

## 2. Install Required Software

Install these first:

- Git
- Git LFS
- Node.js LTS
- Python 3.10
- XAMPP with Apache and MySQL
- Android Studio with Android SDK
- Android Studio Embedded JDK or JDK 17

Check the tools:

```powershell
node -v
npm.cmd -v
py -0p
git lfs version
```

Use `npm.cmd` in PowerShell on Windows.

If Python 3.10 is missing, install it with:

```powershell
winget install -e --id Python.Python.3.10
```

Then reopen the terminal and confirm `py -0p` shows Python 3.10.

## 3. Open The App Folder

Most app commands are run from:

```powershell
cd "App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
```

The nested folder layout is intentional because the backend scripts rely on the current relative paths.

## 4. Install Frontend Dependencies

From the app folder:

```powershell
npm.cmd ci
```

## 5. Create The Environment File

From the app folder:

```powershell
copy .env.example .env
```

Edit `.env` based on your target device.

For Android emulator:

```env
VITE_ANDROID_API_BASE_URL=http://10.0.2.2/biotech-api
VITE_ANDROID_API_BASE_URL_FALLBACKS=http://10.0.3.2/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://10.0.2.2:8000
VITE_ANDROID_YOLO_API_BASE_URL=http://10.0.2.2:9000
```

For a physical Android phone on the same Wi-Fi, find your PC IPv4 address:

```powershell
ipconfig
```

Then set:

```env
VITE_ANDROID_API_BASE_URL=http://<YOUR_PC_IPV4>/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://<YOUR_PC_IPV4>:8000
VITE_ANDROID_YOLO_API_BASE_URL=http://<YOUR_PC_IPV4>:9000
```

## 6. Set Up The Database And PHP API

Start XAMPP and enable:

- Apache
- MySQL

Open phpMyAdmin at `http://localhost/phpmyadmin`.

Create a database named `biotech_dashboard`.

Import:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/biotech_db.sql
```

Then apply every SQL file in this folder in chronological order:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/migrations
```

Deploy the PHP API into XAMPP from the app folder:

```powershell
robocopy ".\database\api" "C:\xampp\htdocs\biotech-api" /MIR
```

Verify the API at `http://localhost/biotech-api/health`.

## 7. Create Python Environments

The two Python services should use Python 3.10.

Create the homography environment:

```powershell
cd "..\..\homography"
py -3.10 -m venv .venv-homography
.\.venv-homography\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
deactivate
```

Create the YOLO environment:

```powershell
cd "..\yolo_service"
py -3.10 -m venv .venv-yolo
.\.venv-yolo\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
deactivate
```

The YOLO model file must exist here:

```text
App tugas akhir/App tugas akhir/YOLO AI/best.pt
```

If that file is missing after cloning, rerun:

```powershell
git lfs pull
```

## 8. Start The Backend Services

Return to the app folder and run:

```powershell
npm.cmd run backend:start
npm.cmd run backend:status
```

Expected health endpoints:

- PHP API: `http://localhost/biotech-api/health`
- Homography: `http://localhost:8000/health`
- YOLO: `http://localhost:9000/health`

If a port is still occupied from an older run:

```powershell
npm.cmd run backend:start:force
```

If Apache and MySQL are already started manually and you only want the Python services:

```powershell
npm.cmd run backend:start:noxampp
```

## 9. Run The Web App

From the app folder:

```powershell
npm.cmd run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## 10. Build And Run Android

From the app folder:

```powershell
npm.cmd run android:sync
npx cap open android
```

In Android Studio:

1. Wait for Gradle sync to finish.
2. Select an emulator or physical device.
3. Run the app.

Run `npm.cmd run android:sync` again whenever frontend code or `.env` changes.

## 11. Keep These Files Local Only

Do not commit these local or generated files:

- `.env`
- `node_modules`
- Python virtual environments
- Android `local.properties`
- Gradle build folders
- temporary outputs and caches

## 12. Runtime Files That Must Stay In The Repo

These are part of the application runtime and should not be removed:

- `Table 2A.csv`
- `App tugas akhir/App tugas akhir/YOLO AI/best.pt`
- `App tugas akhir/App tugas akhir/homography`
- `App tugas akhir/App tugas akhir/yolo_service`
- `App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database`

In Android Studio:

1. Wait for Gradle Sync.
2. Select Embedded JDK or JDK 17 if asked.
3. Select emulator or physical phone.
4. Click Run.

## 12. Daily Run After Setup

Dari folder app:
"C:\Calvin Institute\Tugas Akhir Production\Inhibition-Zone-App\App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"

Start backend:

```powershell
npm.cmd run backend:start
npm.cmd run backend:status
```

Build/sync Android:

```powershell
npm.cmd run android:sync
```

Open Android Studio:

```powershell
npx cap open android
```

Or use the shortcut:

```powershell
npm.cmd run android:daily
```

If PowerShell blocks `npm`:

```powershell
npm.cmd ci
npm.cmd run android:sync
```

If Gradle JDK is invalid:

- Android Studio > Settings > Build, Execution, Deployment > Build Tools > Gradle
- Set Gradle JDK to Embedded JDK or JDK 17.
