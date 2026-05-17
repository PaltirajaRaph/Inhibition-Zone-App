# Biotechnology App Production Repo Setup

This repository is the clean production/mobile runtime version of the project. The old thesis workspace can remain as an archive for notebooks, datasets, training runs, and experiments.

## Folder To Open

Use this folder for the React/Capacitor app:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard
```

The nested path is preserved because the backend launcher and YOLO service depend on the current relative layout.

## Required Software

Install these on the new laptop:

- Git
- Git LFS
- Node.js LTS
- Python 3.10 or 3.11
- XAMPP with Apache and MySQL
- Android Studio with Android SDK
- Android Studio Embedded JDK or JDK 17

Check available Python versions with:

```powershell
py -0p
```

For consistency with the current PC, install and use Python 3.10 on the new laptop.

If Python 3.10 is missing, install Python 3.10 first:

```powershell
winget install -e --id Python.Python.3.10
```

## First Clone

```powershell
git clone <YOUR_NEW_REPO_URL>
cd Biotechnology-App-Production
git lfs pull
```

## Frontend Dependencies

```powershell
cd "App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
npm ci
copy .env.example .env
```

Edit `.env` and replace `<LAPTOP_IPV4>` with the new laptop IPv4 address for physical phone testing, or use `10.0.2.2` for Android emulator.

## Python Services

First confirm your Python versions:

```powershell
py -0p
```

Use Python 3.10 for both services so the new laptop matches the current machine.

```powershell
cd "..\..\homography"
py -3.10 -m venv .venv-homography
.\.venv-homography\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
deactivate

cd "..\yolo_service"
py -3.10 -m venv .venv-yolo
.\.venv-yolo\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
deactivate
```

If `py -3.10` fails with `No suitable Python runtime found`, install Python 3.10, reopen the terminal, and rerun the commands.

The YOLO service expects the model here:

```text
App tugas akhir/App tugas akhir/YOLO AI/best.pt
```

That file is tracked through Git LFS in this clean repo.

## Database/API

1. Start XAMPP Apache and MySQL.
2. Create database `biotech_dashboard` in phpMyAdmin.
3. Import the schema from:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/biotech_db.sql
```

4. Apply migrations in chronological order from:

```text
App tugas akhir/App tugas akhir/Biotechnology App Dashboard/Biotechnology App Dashboard/database/migrations
```

5. Deploy the PHP API to XAMPP:

```powershell
cd "App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
robocopy ".\database\api" "C:\xampp\htdocs\biotech-api" /MIR
```

6. Check this URL in a browser:

```text
http://localhost/biotech-api/health
```

## Run Backend Services

From the React/Capacitor app folder:

```powershell
npm.cmd run backend:start
npm.cmd run backend:status
```

This starts or checks:

- PHP API through XAMPP
- Homography service on port 8000
- YOLO service on port 9000

## Android Build

From the React/Capacitor app folder:

```powershell
npm.cmd run android:sync
npx cap open android
```

In Android Studio:

1. Wait for Gradle Sync.
2. Use Embedded JDK or JDK 17.
3. Select emulator or phone.
4. Click Run.

Every time `.env` or frontend code changes, run `npm.cmd run android:sync` again.

## Do Not Commit

Do not commit these generated/local files:

- `.env`
- `node_modules`
- Python virtual environments
- Android `local.properties`
- Gradle build/cache folders
- APK extraction folders
- datasets, outputs, and training runs

## Old Repo

The old repository can stay untouched as an archive. This new repo is meant to be the clean handoff version.
