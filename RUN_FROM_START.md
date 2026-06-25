# Inhibition Zone App Setup Guide

This guide is the canonical runbook for setting up, developing, and running the project on Windows, including stricter-policy laptops and free ngrok workflow.

The system includes:

- React + Capacitor frontend
- PHP API (XAMPP)
- Homography FastAPI service
- YOLO FastAPI service
- Breakpoint CSV for S/I/R suggestions

## 1. Clone Repository

```powershell
git clone <REPOSITORY_URL>
cd Inhibition-Zone-App
git lfs pull
```

`git lfs pull` is required because YOLO model files are stored with Git LFS.

## 2. Install Required Software

For a fresh Windows PC, install tools in this order.

### 2.1 Install Core CLI Tools (recommended via winget)

Open PowerShell as Administrator and run:

```powershell
winget install -e --id Git.Git
winget install -e --id GitHub.GitLFS
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Python.Python.3.10
winget install -e --id Ngrok.Ngrok
```

If any package ID is unavailable on your machine, install it from official websites, then reopen terminal.

### 2.2 Install GUI Tools

Install manually:

- XAMPP (Apache + MySQL)
- Android Studio (includes Android SDK manager)

In Android Studio, make sure these are installed:

- Android SDK Platform + Build-Tools (target API used by project)
- Android SDK Platform-Tools
- Android Emulator (if you use emulator)
- Embedded JDK (or use JDK 17)

### 2.3 Verify PATH And Install Success

Open a new terminal (important) and verify:

```powershell
git --version
git lfs version
node -v
npm.cmd -v
py -0p
ngrok version
```

If `ngrok` is not recognized, it is not installed correctly or PATH is not refreshed.

Quick check:

```powershell
where.exe ngrok
```

If empty result:

1. Reopen terminal and run `ngrok version` again.
2. Reinstall with `winget install -e --id Ngrok.Ngrok`.
3. If still failing, install ngrok manually and ensure folder containing `ngrok.exe` is in PATH.

If Python 3.10 is missing, run:

```powershell
winget install -e --id Python.Python.3.10
```

Then reopen terminal and run `py -0p` again.

### 2.4 ngrok First-Time Auth (required once)

After signing up/logging in to ngrok dashboard, set your authtoken:

```powershell
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```

Verify config:

```powershell
ngrok config check
```

## 3. Go To App Folder

All npm scripts must be run from this exact folder:

```powershell
cd "App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
```

Quick check:

```powershell
Get-ChildItem package.json
```

If this file is not found, you are in the wrong folder depth.

## 4. Install Frontend Dependencies

```powershell
npm.cmd ci
```

## 5. Configure Environment Variables

```powershell
copy .env.example .env
```

### Option A: Local LAN (same Wi-Fi)

Emulator:

```env
VITE_ANDROID_API_BASE_URL=http://10.0.2.2/biotech-api
VITE_ANDROID_API_BASE_URL_FALLBACKS=http://10.0.3.2/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://10.0.2.2:8000
VITE_ANDROID_YOLO_API_BASE_URL=http://10.0.2.2:9000
```

Physical phone on same Wi-Fi:

```env
VITE_ANDROID_API_BASE_URL=http://<YOUR_PC_IPV4>/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://<YOUR_PC_IPV4>:8000
VITE_ANDROID_YOLO_API_BASE_URL=http://<YOUR_PC_IPV4>:9000
```

### Option B: Recommended Free ngrok Single-Tunnel

Use this to avoid LAN firewall and network policy problems.

How to get the ngrok URL:

1. Start local gateway in app folder:

```powershell
npm.cmd run gateway:start
```

2. In a second terminal (same folder), start ngrok:

```powershell
npm.cmd run gateway:ngrok
```

3. Copy the URL shown in ngrok output at `Forwarding`.
Example:

```text
Forwarding  https://bootlace-slicer-carload.ngrok-free.dev -> http://localhost:8088
```

Use only the left side URL (`https://bootlace-slicer-carload.ngrok-free.dev`).

Set `.env` using that URL:

```env
VITE_ANDROID_API_BASE_URL=https://<NGROK_URL>/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=https://<NGROK_URL>/homography-service
VITE_ANDROID_YOLO_API_BASE_URL=https://<NGROK_URL>/yolo-service
```

Concrete example:

```env
VITE_ANDROID_API_BASE_URL=https://bootlace-slicer-carload.ngrok-free.dev/biotech-api
VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=https://bootlace-slicer-carload.ngrok-free.dev/homography-service
VITE_ANDROID_YOLO_API_BASE_URL=https://bootlace-slicer-carload.ngrok-free.dev/yolo-service
```

## 6. Setup Database And PHP API

Start XAMPP and enable Apache + MySQL.

Open `http://localhost/phpmyadmin`.

Create DB: `biotech_dashboard`.

Import:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/biotech_db.sql
```

Run all SQL migration files in order from:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/migrations
```

Deploy PHP API to XAMPP from app folder:

```powershell
robocopy ".\database\api" "C:\xampp\htdocs\biotech-api" /MIR
```

Verify:

```powershell
curl http://localhost/biotech-api/health
```

## 7. Setup Python Environments (Python 3.10)

### Homography

```powershell
cd "..\..\homography"
py -3.10 -m venv .venv-homography
```

Install without activation (works on strict PowerShell policies):

```powershell
.\.venv-homography\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
.\.venv-homography\Scripts\python.exe -m pip install -r requirements.txt
```

### YOLO

```powershell
cd "..\yolo_service"
py -3.10 -m venv .venv-yolo
.\.venv-yolo\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
.\.venv-yolo\Scripts\python.exe -m pip install -r requirements.txt
.\.venv-yolo\Scripts\python.exe install_torch.py
```

Verify YOLO uses GPU when available:

```powershell
.\.venv-yolo\Scripts\python.exe -c "import torch; print(torch.__version__); print('cuda?', torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

YOLO model file must exist:

```text
App tugas akhir/App tugas akhir/YOLO AI/best.pt
```

If missing:

```powershell
git lfs pull
```

## 8. Start Backend Services

Return to app folder and run:

```powershell
npm.cmd run backend:start
npm.cmd run backend:status
```

Expected health endpoints:

- `http://localhost/biotech-api/health`
- `http://localhost:8000/health`
- `http://localhost:9000/health`

If old process/port conflict:

```powershell
npm.cmd run backend:start:force
```

If Apache + MySQL are already started manually:

```powershell
npm.cmd run backend:start:noxampp
```

## 9. Start Single ngrok Tunnel (Free Plan)

From app folder, terminal A:

```powershell
npm.cmd run gateway:start
```

From app folder, terminal B:

```powershell
npm.cmd run gateway:ngrok
```

This project uses one gateway port (`8088`) and routes all services by path.

Keep both terminals running while testing.

Validate public endpoints:

```powershell
curl https://<NGROK_URL>/biotech-api/health
curl https://<NGROK_URL>/homography-service/health
curl https://<NGROK_URL>/yolo-service/health
```

## 10. Build And Open Android

From app folder:

```powershell
cd "Inhibition-Zone-App-main\Inhibition-Zone-App\App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
npm.cmd run android:sync
npx cap open android
```

In Android Studio:

1. Wait for Gradle sync.
2. Select emulator or physical phone.
3. Click Run.

Run `npm.cmd run android:sync` every time `.env` or frontend code changes.

## 11. Daily Run (Recommended Sequence)

From app folder:

```powershell
npm.cmd run backend:start
npm.cmd run gateway:start
npm.cmd run gateway:ngrok
npm.cmd run android:sync
npx cap open android
```

## 12. Troubleshooting (Real Issues Encountered)

### `npm.cmd` not found

Cause: Node.js not installed or PATH not loaded in current terminal.

Fix:

```powershell
node -v
where.exe npm.cmd
```

Reinstall Node.js LTS if needed, then reopen terminal.

### `npm error enoent ... package.json`

Cause: command run from wrong folder depth.

Fix: go to exact app folder and verify `package.json` exists.

### Mistyped command `npm. cmd`

Correct command is `npm.cmd` with no space.

### `No suitable Python runtime found` for `py -3.10`

Cause: Python 3.10 missing.

Fix:

```powershell
winget install -e --id Python.Python.3.10
py -3.10 --version
```

### PowerShell blocks `Activate.ps1`

Use direct interpreter path and skip activation:

```powershell
.\.venv-yolo\Scripts\python.exe -m pip install -r requirements.txt
```

Optional policy change:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Backend says `YOLO process started but did not become healthy`

Cause: usually wrong/missing yolo venv or dependencies.

Fix:

```powershell
cd "..\..\yolo_service"
Get-ChildItem -Name .venv*
.\.venv-yolo\Scripts\python.exe -m pip install -r requirements.txt
.\.venv-yolo\Scripts\python.exe install_torch.py
.\.venv-yolo\Scripts\python.exe -c "import torch; print(torch.__version__); print('cuda?', torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
.\.venv-yolo\Scripts\python.exe server.py
curl http://127.0.0.1:9000/health
```

If startup shows `torch-...+cpu CPU`, rerun `install_torch.py` in the YOLO venv.

### LAN IP works on localhost only, fails on `http://<IP>:8000/health`

Cause: firewall/network profile on stricter PC.

Fix: use single ngrok tunnel workflow in this guide.

### ngrok free warning page appears

Expected on browser. API clients in this project already send bypass headers.

### ngrok `ERR_NGROK_334 endpoint already online`

Fix order:

1. Stop other ngrok sessions.
2. Use one tunnel only: `npm.cmd run gateway:ngrok`.
3. The script uses `ngrok http 8088` for widest version compatibility.

### ngrok `unknown flag: --pooling-enabled`

Cause: ngrok version on that PC does not support the `--pooling-enabled` flag.

Fix: use compatible command:

```powershell
ngrok http 8088
```

This repo now uses that command in `npm.cmd run gateway:ngrok`.

### Data does not appear immediately after app reopen/update

Cause: cold-start hydration race (UI opened before local/API analyses finished loading).

Status: fixed in app code by loading local analyses first, then merging API data.

If you still see empty history on first open:

1. Confirm login uses the same member/admin account as before.
2. Wait 2-3 seconds after login for API merge on slow network.
3. Verify API health endpoint is reachable from your phone via ngrok.

### New analysis ID starts again from 1

Cause: processing started before existing analyses finished hydrating.

Status: fixed in app code by reading stored analyses immediately and using that pool for next ID calculation.

If this still happens, ensure old app data was not cleared by Android uninstall/clear-data.

### Homography/YOLO logs are fast but app stays on Processing too long

Cause: usually API fallback retries (unreachable base URLs) or slow API save call after model inference.

Status: improved in app code by:

1. Prioritizing reachable API candidates via fast `/health` probe.
2. Navigating to Create Report immediately after inference, while API save continues in background.

If delay persists, check `.env` so the first API base points to your active ngrok URL.

## 13. Files To Keep Local Only

Do not commit:

- `.env`
- `node_modules`
- Python virtual environments
- Android `local.properties`
- Gradle build folders
- temporary outputs and caches

## 14. Runtime Files That Must Stay In Repo

Do not remove:

- `Table 2A.csv`
- `App tugas akhir/App tugas akhir/YOLO AI/best.pt`
- `App tugas akhir/App tugas akhir/homography`
- `App tugas akhir/App tugas akhir/yolo_service`
- `App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database`
