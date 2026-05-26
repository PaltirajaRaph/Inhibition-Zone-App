
  # Biotechnology App Dashboard

  This is a code bundle for Biotechnology App Dashboard. The original project is available at https://www.figma.com/design/GMfqW8xUnXFzJqFkuxYHCO/Biotechnology-App-Dashboard.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the local development server.

  ## Start all backend services with one command (Windows)

  Dari folder app ini, jalankan:

  - `npm.cmd run backend:start`

  Script ini akan mencoba menjalankan semua service berikut:

  - PHP API via XAMPP (Apache + MySQL, jika script XAMPP tersedia)
  - Homography service (`http://localhost:8000/health`)
  - YOLO service (`http://localhost:9000/health`)

  Perintah tambahan:

  - `npm.cmd run backend:status` untuk cek status health
  - `npm.cmd run backend:start:force` untuk start + bersihkan konflik port 8000/9000 otomatis
  - `npm.cmd run backend:stop` untuk stop semua service yang dijalankan script
  - `npm.cmd run backend:restart` untuk restart cepat

  Catatan:

  - Script launcher: `scripts/backend-services.ps1`
  - Jika PowerShell policy ketat, tetap gunakan `npm.cmd` (bukan `npm`).

  ## One-command Windows workflow

  Run these commands from this app folder:

  ```powershell
  cd "c:\Calvin Institute\Tugas Akhir Production\Inhibition-Zone-App\App tugas akhir\App tugas akhir\Biotechnology App Dashboard\Biotechnology App Dashboard"
  ```

  Full run: start/check servers, deploy PHP API, sync Android, build debug APK, then open Android Studio:

  ```powershell
  npm.cmd run app:run
  ```

  Full run without opening Android Studio:

  ```powershell
  npm.cmd run app:run:noopen
  ```

  Server + sync only: start/check servers, deploy PHP API, sync Android assets, then open Android Studio. Use this when you want Android Studio to do the final build/install with the **Run** button:

  ```powershell
  npm.cmd run app:run -- -SkipGradleBuild
  ```

  Server + sync only without opening Android Studio:

  ```powershell
  npm.cmd run app:run:noopen -- -SkipGradleBuild
  ```

  The `app:run` commands automatically do these steps:

  - Deploy `database/api` to `C:\xampp\htdocs\biotech-api`
  - Start/check PHP API, Homography, and YOLO services
  - Run `android:sync`
  - Build Android debug APK unless `-SkipGradleBuild` is used
  - Open Android Studio unless `app:run:noopen` is used

  Important: these commands do not create/import/reset the MySQL database. Create `biotech_dashboard`, import `database/biotech_db.sql`, and apply migrations once before using the app.

  Older lightweight workflow:

  - `npm.cmd run android:daily` starts backend in no-XAMPP mode, syncs Android, and opens Android Studio.
  - `npm.cmd run android:daily:noopen` does the same without opening Android Studio.

  ## Run on Android Studio (1-click Run)

  Tujuan: setelah project Android terbuka dan Gradle sync selesai, Anda cukup pilih device lalu klik tombol **Run** di Android Studio.

  1. Dari root project jalankan:
     - `npm i`
     - `npm run android:sync`
  2. Buka Android Studio -> **Open** -> pilih folder `android/` (di dalam project ini).
  3. Tunggu **Gradle Sync** selesai.
  4. Pilih emulator / device fisik, lalu klik **Run**.

  Jika muncul error **Invalid Gradle JDK configuration**:
  - Di Android Studio buka: **File -> Settings -> Build, Execution, Deployment -> Build Tools -> Gradle -> Gradle JDK**
  - Pilih **Embedded JDK** / **JDK 17** yang valid.
  - (Opsional) Hapus file `android/.gradle/config.properties` jika ada nilai `java.home` yang mengarah ke path JDK yang tidak ada.

  Catatan:
  - File `android/local.properties` sudah diset ke SDK default Windows (`%LOCALAPPDATA%\\Android\\Sdk`). Kalau SDK Anda berada di lokasi lain, Android Studio akan meng-update file ini otomatis.
  - Setiap kali ada perubahan frontend, jalankan lagi `npm run android:sync`, lalu kembali ke Android Studio dan klik **Run**.

  ## API requirements

  1. Start XAMPP: Apache and MySQL must be running.
  2. Place backend API in `C:\xampp\htdocs\biotech-api`.
  3. Check API health in browser: `http://localhost/biotech-api/health`.

    ## Mobile data + Wi-Fi fallback (Android)

    Goal: HP can use mobile data (public internet) and still work on same Wi-Fi LAN as fallback.

    1. Keep LAN API in `.env`:
      - `VITE_ANDROID_API_BASE_URL=http://<IP-PC-ANDA>/biotech-api`
    2. Start a public tunnel to your local Apache:
      - `npm run api:tunnel`
    3. Copy tunnel URL from terminal (example: `https://abc123.loca.lt`).
    4. Set public URL in `.env`:
      - `VITE_PUBLIC_API_BASE_URL=https://abc123.loca.lt/biotech-api`
    5. Rebuild + sync Android app:
      - `npm run android:sync`
    6. Buka Android Studio dan klik **Run** (Android Studio yang akan build + install ke device).

    URL priority in app (Android):
    1. `VITE_PUBLIC_API_BASE_URL` (mobile data)
    2. `VITE_ANDROID_API_BASE_URL` (Wi-Fi LAN)
    3. Fallback lists + emulator defaults

    Notes:
    - If tunnel URL changes, update `.env` and rebuild APK.
    - XAMPP Apache/MySQL must remain running.

  ## Homography service (Laptop <-> HP)

  Flow yang dipakai app:
  - HP ambil gambar + klik **Gunakan Foto**
  - Gambar di-upload ke service homografi di laptop
  - Laptop mengembalikan gambar hasil homografi
  - App memakai hasil tersebut sebagai gambar di **Create Report**

    Cara menjalankan service homography (di laptop):

    1. Buat virtual environment (direkomendasikan) dan aktifkan:

      Powershell (Windows):

      ```powershell
      python -m venv .venv-homography
      .\.venv-homography\Scripts\Activate.ps1
      ```

      Bash / macOS / WSL:

      ```bash
      python -m venv .venv-homography
      source .venv-homography/bin/activate
      ```

    2. Install dependencies:

      ```bash
      pip install -r ../homography/requirements.txt
      ```

    3. Jalankan server (dari folder `homography/`):

      ```bash
      cd homography
      # cepat: python server.py
      python server.py
      # atau (lebih control):
      uvicorn server:app --host 0.0.0.0 --port 8000
      ```

    4. Verifikasi server:

      - Buka `http://localhost:8000/health` di laptop — harus mengembalikan `{ "ok": true }`.

    5. Konfigurasi di app / device:

      - Untuk emulator Android: di `.env` set `VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://10.0.2.2:8000`
      - Untuk perangkat fisik di jaringan yang sama: di `.env` set `VITE_ANDROID_HOMOGRAPHY_API_BASE_URL=http://<IP_LAPTOP_ANDA>:8000`

      Setelah mengubah `.env` jalankan:

      ```bash
      npm run android:sync
      ```

    6. Debugging jika homografi selalu gagal dari app:

      - Pastikan HP dan laptop berada di jaringan yang sama (atau gunakan tunnel publik).
      - Dari HP buka `http://<IP_LAPTOP_ANDA>:8000/health` untuk memastikan reachable.
      - Periksa terminal yang menjalankan server untuk error saat menerima upload.
      - Anda bisa menjalankan `homography/test_upload.py` untuk menguji upload dari laptop.

    Catatan teknis:

    - Endpoint: `POST /homography` multipart form field `file` (server mengembalikan JPEG/PNG hasil).
    - Header `x-homography-ok: 1` berarti homografi berhasil.
    - Jika server mengembalikan error (400/500), aplikasi akan menampilkan notifikasi dan tidak membuat report.

    ## Android Studio sync with database (important)

    1. Copy `.env.example` to `.env`.
    2. For emulator, set `VITE_ANDROID_API_BASE_URL=http://10.0.2.2/biotech-api`.
    3. For physical Android device, set `VITE_ANDROID_API_BASE_URL=http://<IP-PC-ANDA>/biotech-api`.
    4. Rebuild and sync Android assets every time you change frontend code:
      - `npm run android:sync`
    5. In Android Studio, run Clean/Rebuild and reinstall app.

    If API URL is wrong, login/register will fail because app cannot reach database.

    ## If emulator still shows old UI

    Jalankan `npm run android:sync`, lalu klik **Run** lagi di Android Studio.
  