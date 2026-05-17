# Run The App From Start

This guide is for testing the clean production repo on this PC.

## 1. Open The Correct Folder

Open a terminal in the new repo root:

```powershell
cd "C:\Tugas Akhir Palti\Biotechnology-App-Production"
```

The React/Capacitor app folder is:

```powershell
cd "C:\Tugas Akhir Palti\Biotechnology-App-Production\App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
```

Most app commands below are run from that React/Capacitor app folder.

## 2. Install Required Programs

Make sure these are installed:

- XAMPP
- Node.js LTS
- Python 3.10 or 3.11
- Git LFS
- Android Studio
- Android SDK
- Android Studio Embedded JDK or JDK 17

Check basics:

```powershell
node -v
npm.cmd -v
python --version
git lfs version
```

Use `npm.cmd`, not `npm`, in PowerShell.

## 3. Install Frontend Dependencies

From the React/Capacitor app folder:

```powershell
npm.cmd ci
```

This recreates `node_modules` from `package-lock.json`.

## 4. Create The App Environment File

From the React/Capacitor app folder:

```powershell
copy .env.example .env
```

Edit `.env`.

For Android emulator, use:

```env
VITE_ANDROID_API_BASE_URL=http://10.0.2.2/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://10.0.2.2:8000
VITE_ANDROID_YOLO_API_BASE_URL=http://10.0.2.2:9000
```

For a physical phone on the same Wi-Fi, find this PC's IPv4 address:

```powershell
ipconfig
```

Then use your PC IP, for example:

```env
VITE_ANDROID_API_BASE_URL=http://192.168.1.2/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://192.168.1.2:8000
VITE_ANDROID_YOLO_API_BASE_URL=http://192.168.1.2:9000
```

## 5. Set Up The MySQL Database

Start XAMPP:

- Apache: Start
- MySQL: Start

Open phpMyAdmin:

```text
http://localhost/phpmyadmin
```

Create a database named:

```text
biotech_dashboard
```

Import this file:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/biotech_db.sql
```

Then apply migrations in order from:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/migrations
```

## 6. Deploy The PHP API To XAMPP

From the React/Capacitor app folder:

```powershell
robocopy ".\database\api" "C:\xampp\htdocs\biotech-api" /MIR
```

Check the API:

```text
http://localhost/biotech-api/health
```

It should return a healthy JSON response.

## 7. Create Python Environments

From the React/Capacitor app folder, create the homography environment:

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

The YOLO model must exist here:

```text
App tugas akhir/App tugas akhir/YOLO AI/best.pt
```

If the file is missing after cloning, run this from the repo root:

```powershell
git lfs pull
```

## 8. Start All Backend Services

Go back to the React/Capacitor app folder:

```powershell
cd "C:\Tugas Akhir Palti\Biotechnology-App-Production\App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
```

Start services:

```powershell
npm.cmd run backend:start
```

Check services:

```powershell
npm.cmd run backend:status
```

Expected services:

- PHP API: `http://localhost/biotech-api/health`
- Homography: `http://localhost:8000/health`
- YOLO: `http://localhost:9000/health`

If ports are stuck from an old run:

```powershell
npm.cmd run backend:start:force
```

## 9. Test In Web Browser

From the React/Capacitor app folder:

```powershell
npm.cmd run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

This tests the React app in the browser. Camera/Android behavior still needs Android Studio.

## 10. Build And Sync Android

From the React/Capacitor app folder:

```powershell
npm.cmd run android:sync
```

This creates the web build and copies it into the Android project.

## 11. Open Android Studio

From the React/Capacitor app folder:

```powershell
npx cap open android
```

In Android Studio:

1. Wait for Gradle Sync.
2. Select Embedded JDK or JDK 17 if asked.
3. Select emulator or physical phone.
4. Click Run.

## 12. Daily Run After Setup

After the first setup, the normal flow is shorter.

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

## 13. Common Problems

If login/register cannot reach database:

- XAMPP Apache and MySQL must be running.
- API must exist at `C:\xampp\htdocs\biotech-api`.
- `.env` must use the correct emulator or phone URL.
- Run `npm.cmd run android:sync` after changing `.env`.

If YOLO fails:

- Check `App tugas akhir/App tugas akhir/YOLO AI/best.pt` exists.
- Run `git lfs pull` if cloned from GitHub.
- Check `http://localhost:9000/health`.
- Use Python 3.10 or 3.11.

If homography fails:

- Check `http://localhost:8000/health`.
- For physical phone, laptop and phone must be on the same Wi-Fi.
- Windows Firewall may need to allow Python on private networks.

If Android shows old UI:

```powershell
npm.cmd run android:sync
```

Then run the app again from Android Studio.

If PowerShell blocks `npm`:

```powershell
npm.cmd ci
npm.cmd run android:sync
```

If Gradle JDK is invalid:

- Android Studio > Settings > Build, Execution, Deployment > Build Tools > Gradle
- Set Gradle JDK to Embedded JDK or JDK 17.
