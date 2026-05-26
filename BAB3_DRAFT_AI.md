# Draf Penulisan Skripsi — BAB III (Bagian Kontribusi AI / YOLO)

> Dokumen ini disusun untuk **calon penggantian / penambahan** terhadap file utama `Tugas_Akhir_Kontribusi.md`. Tidak ada perubahan apapun yang dilakukan pada file utama. Anda dapat me-review draf ini, lalu menyalin bagian yang sudah disetujui ke dalam skripsi induk.

---

## A. ANALISIS DOKUMEN SKRIPSI EKSISTING

### A.1 Ringkasan Struktur Saat Ini

Berdasarkan pembacaan menyeluruh terhadap `Tugas_Akhir_Kontribusi.md` (662 baris fisik, ±1,9 MB karena memuat gambar base64), struktur skripsi yang sudah dikerjakan oleh dua anggota tim adalah sebagai berikut:

| BAB | Subbab | Pemilik (dugaan) | Status |
| --- | --- | --- | --- |
| ABSTRAK, DAFTAR ISI | — | bersama | sudah ada |
| BAB I Pendahuluan | Latar Belakang, Rumusan Masalah, Maksud dan Tujuan | bersama | sudah ada |
| BAB II Metodologi | 2.1 Alur Penelitian; 2.2 Studi Analisis; 2.3 Pengembangan Sistem (termasuk 2.3.3 Pengembangan Model YOLO); 2.4 Integrasi dan Pengujian; 2.5 Evaluasi dan Validasi Akhir | bersama | sudah ada |
| BAB III Desain | 3.1 Desain Alur Data; 3.2 Desain Basis Data | bersama / *back-end* | sudah ada |
|  | **3.3 Perbandingan Metodologi Deteksi Zona Hambatan** (3.3.1 Tinjauan Tiga Pendekatan, 3.3.2 Matriks Perbandingan, 3.3.3 Strategi Evaluasi) | **AI (Anda)** | sudah ada, **perlu revisi**: masih bersifat rencana/estimasi, belum mencerminkan implementasi nyata |
|  | 3.4 Desain Aplikasi Seluler (3.4.1 Riwayat, 3.4.2 Statistik, 3.4.3 Basis Data Antibiotik) | *front-end / back-end* | jangan diubah signifikan |
|  | 3.5 Desain Model Homografi (3.5.1 Diagram, 3.5.2 Deskripsi termasuk Program Server & Fitur Pengguna) | *homografi* | jangan diubah signifikan |
|  | **3.6 Desain Model AI** (3.6.1 Arsitektur Jaringan Syaraf; 3.6.2 Definisi Kelas & Konfigurasi Input; 3.6.3 Desain Optimasi untuk Perangkat Bergerak; 3.6.4 Desain Konversi Model YOLO untuk Implementasi Seluler; 3.6.5 Desain Perhitungan Diameter Zona Hambat; 3.6.6 Desain Post-Processing Deteksi YOLO) | **AI (Anda)** | sudah ada, **perlu revisi besar** karena banyak bagian (kuantisasi TFLite, kode Kotlin/Swift) tidak sesuai implementasi nyata di codebase |
|  | 3.7 Desain Integrasi Komponen | *bersama* | perlu revisi ringan agar konsisten dengan arsitektur server FastAPI |
|  | 3.8 Desain Validasi dan Testing | *bersama* | dapat dipertahankan dengan tambahan acuan metrik MAE/RMSE/within-tolerance |
| BAB IV Hasil | 4.1–4.7 | bersama | sudah ada (akan ditangani terpisah pada permintaan berikutnya) |
| BAB V Penutup | 5.1 Kesimpulan, 5.2 Diskusi, 5.3 Saran | bersama | sudah ada |
| DAFTAR PUSTAKA | dua format paralel: APA-like list + tabel IEEE bernomor `[n]` + footnote `[↑](#footnote-ref-N)` | bersama | perlu ditambah referensi |

### A.2 Gaya Penulisan & Sistem Sitasi

- **Bahasa**: Bahasa Indonesia akademik formal.
- **Istilah teknis asing** ditulis miring dengan markdown italic (`_…_`).
- **Sitasi**: campuran. Yang paling konsisten muncul pada bagian teman saya adalah pola footnote dengan penanda `[↑](#footnote-ref-N)` di daftar pustaka, dipanggil dari teks sebagai `<sup>[\[N\]](#footnote-N)</sup>` atau `\[N\]`. Saya akan mengikuti pola `\[N\]` di teks (sesuai gaya bagian 3.6.5–3.6.6 yang sudah memakai `\[29\]`, `\[30\]`).
- **Penomoran**: bab pakai `# **BAB III**`; subbab utama `## **3.x …**`; sub-subbab `### **3.x.y …**`; sub-sub-subbab `#### 3.x.y.z …` atau teks tebal di awal paragraf.

### A.3 Bagian yang Harus Ditulis / Direvisi oleh Saya

1. **Revisi 3.3** — Perbandingan tiga metode dipersempit menjadi **YOLOv7 vs YOLOv9 vs YOLOv11** sesuai permintaan, dan diselaraskan dengan hasil notebook perbandingan.
2. **Revisi 3.6** — Disinkronkan dengan implementasi nyata: arsitektur YOLOv9 (`best.pt` via `DetectMultiBackend`), bukan jalur ekspor TFLite/ONNX yang sebelumnya direncanakan. Subbab kuantisasi dan contoh kode Kotlin/Swift dihapus atau diubah menjadi catatan keterbatasan/rencana lanjutan.
3. **Tambahan subbab** di dalam 3.6 untuk mencakup yang belum terdokumentasi: **3.6.1 Dataset dan Anotasi**, **3.6.2 Pra-pemrosesan Data**, **3.6.5 Pelatihan Model**, **3.6.8 Strategi Evaluasi (metode notebook)**, **3.6.9 Strategi Pengukuran Galat Milimeter**. (Diberi nomor baru, lihat draf bagian C.)
4. **Revisi 3.7** — Menyelaraskan deskripsi integrasi dengan implementasi aktual: layanan inferensi adalah **FastAPI Python (`yolo_service/`)** pada port 9000 yang dipanggil oleh front-end melalui HTTP, **bukan** model TFLite yang dipaketkan dalam APK.
5. **Tambahan sitasi** pada referensi YOLOv7, YOLOv9, dasar object detection, metrik deteksi, dan CLSI.

---

## B. ANALISIS CODEBASE (FAKTA-FAKTA YANG DIRUJUK)

Semua poin di bawah ini diverifikasi langsung dari source code di workspace pada saat draf ini disusun. Setiap fakta diberi referensi file.

### B.1 Komponen Utama dan Alur Sistem

```
Front-end (Capacitor + React)
  └─► Back-end PHP (XAMPP/MySQL)                — bukan ranah AI
  └─► Layanan Homografi (FastAPI, :8000)         — bukan ranah AI
  └─► Layanan YOLO (FastAPI, :9000) ◄────── ranah AI saya
            └─► models/common.DetectMultiBackend
                  └─► bobot best.pt (YOLOv9-c)
```

### B.2 Layanan Inferensi AI (FastAPI)

File: [App tugas akhir/App tugas akhir/yolo_service/server.py](App%20tugas%20akhir/App%20tugas%20akhir/yolo_service/server.py)

- Memuat satu instance `YoloAnalyzer` saat *startup*.
- Endpoint utama: `POST /yolo/analyze` menerima file gambar (`multipart/form-data`) dan parameter opsional `disk_mm` (diameter cakram dalam mm, default 6.0).
- Endpoint kesehatan: `GET /health`.
- CORS diaktifkan untuk semua *origin* agar dapat dipanggil dari aplikasi seluler (WebView Capacitor) dan klien web *debug*.
- Variabel lingkungan:
	- `YOLO_WEIGHTS` (default `../YOLO AI/best.pt`)
	- `YOLO_DATA` (default `../YOLO AI/antibiogram.yaml`)
	- `YOLO_DISK_DIAMETER_MM` (default `6`)
	- `PORT` (default `9000`).

### B.3 Modul Analyzer

File: [App tugas akhir/App tugas akhir/yolo_service/yolo_inference.py](App%20tugas%20akhir/App%20tugas%20akhir/yolo_service/yolo_inference.py)

Kelas `YoloAnalyzer` memiliki ciri-ciri berikut:

| Atribut | Nilai default | Keterangan |
| --- | --- | --- |
| `img_size` | 640 | dipaksa kelipatan `stride` model lewat `check_img_size`. |
| `conf_thres` | 0.25 | ambang skor *confidence*. |
| `iou_thres` | 0.45 | ambang IoU NMS. |
| `disk_diameter_mm` | 6.0 | acuan kalibrasi piksel ke milimeter. |
| `MIN_ZONE_TO_DISK_RATIO` | 1.12 | rasio minimum diameter zona terhadap cakram. |
| `MAX_ZONE_TO_DISK_RATIO` | 7.5 | rasio maksimum, sebagai pencegah *outlier*. |
| `MAX_ZONE_CENTER_OFFSET_RATIO` | 0.5 | toleransi offset titik pusat zona vs cakram. |

Modul *backend* yang dipakai adalah `DetectMultiBackend` dari repositori `external/yolov9/` (subrepositori resmi YOLOv9 oleh Wang dkk., 2024), bukan paket `ultralytics`. Inferensi berjalan pada PyTorch (`fp16=False`), CUDA otomatis dipakai jika tersedia.

Tahapan pemrosesan setiap citra masuk:

1. Decode JPEG/PNG menjadi `numpy` BGR (`cv2.imdecode`).
2. `letterbox` ke 640×640 dengan menjaga *aspect ratio* (modul `utils.augmentations.letterbox` milik YOLOv9).
3. Permutasi `HWC→CHW`, normalisasi `/255.0`, dipindahkan ke *device*.
4. Forward pass model, lalu `non_max_suppression(pred, conf_thres, iou_thres, max_det=300)`.
5. `scale_boxes` mengembalikan koordinat ke ruang gambar asli.
6. Pemilahan deteksi ke dua kelas: `ab disk` dan `inhibition zone` (mengikuti `antibiogram.yaml`, lihat B.4).
7. **Pencocokan zona–cakram** (`_build_measurements`): untuk setiap cakram, dicari zona terbaik dengan tiga aturan:
	- rasio diameter zona/cakram dalam rentang `[1.12, 7.5]`;
	- pusat cakram berada *di dalam* bounding box zona;
	- jarak antar pusat tidak melebihi `max(zone_radius·0.5, disk_radius·0.75)` dan `distance + disk_radius ≤ zone_radius·1.12` (jaminan konsentris).
	- skoring: minimasi *center offset* ternormalisasi, sekunder dengan rasio terbesar, tersier dengan *confidence* zona tertinggi.
8. **Kalibrasi piksel→milimeter**: `scale_mm_per_px = disk_mm / disk_diameter_px`, dengan `disk_diameter_px = (w + h) / 2` (rata-rata aritmetik dua sumbu *bounding box*).
9. Cakram yang tidak menemukan pasangan zona dilabeli sebagai **RESISTEN** (zona ≤ cakram → bakteri tahan terhadap antibiotik).
10. Penggambaran *overlay*: rektangel hijau untuk zona terpilih, oranye untuk cakram, badge bulat berisi indeks sampel; hasil di-*encode* ke `data:image/jpeg;base64,...`.

Output JSON: berisi `processedImage`, `diameterMm`, `diskDiameterPx`, `zoneDiameterPx`, `scaleMmPerPx`, `zoneConfidence`, daftar `measurements[]` per sampel, dan daftar mentah `detections[]`.

### B.4 Konfigurasi Dataset

File: [App tugas akhir/App tugas akhir/YOLO AI/antibiogram.yaml](App%20tugas%20akhir/App%20tugas%20akhir/YOLO%20AI/antibiogram.yaml)

```yaml
path: c:/Tugas Akhir Palti/Tugas-Akhir-Antibiogram/dataset/yolo_format
train: c:/Tugas Akhir Palti/Tugas-Akhir-Antibiogram/dataset/yolo_format/images/train
val:   c:/Tugas Akhir Palti/Tugas-Akhir-Antibiogram/dataset/yolo_format/images/val
nc: 2
names: ['ab disk', 'inhibition zone']
```

Struktur dataset mengikuti konvensi YOLO: dua folder paralel `images/{train,val}` dan `labels/{train,val}`. Setiap *label file* berisi baris `class cx cy w h` (semua ter-normalisasi 0..1) sesuai konvensi YOLO standar.

### B.5 Repositori YOLO yang Digunakan

Folder: [external/yolov9/](external/yolov9/) berisi pohon kode lengkap YOLOv9 resmi (Wang dkk., 2024) — `detect.py`, `train.py`, `val.py`, `models/detect/yolov9-*.yaml`, dan modul utilitas (`utils/augmentations.py`, `utils/general.py`, `utils/torch_utils.py`). Pelatihan dijalankan langsung dari skrip resmi tersebut.

### B.6 Pipeline Perbandingan Tiga Model

File notebook eksternal: [model_comparison_yolov7_yolov9.ipynb](file:///c%3A/Users/banga/Downloads/Telegram%20Desktop/model_comparison_yolov7_yolov9.ipynb)

Notebook melakukan tiga hal yang menjadi tulang punggung evaluasi:

1. **Pemilihan *run* terbaik**: helper `latest_dir()` memindai folder `external/yolov7/runs/train/antibiogram_*`, `external/yolov9/runs/train/antibiogram_*`, dan `outputs/yolov11_preparation/yolov11_runs/antibiogram_yolo11*`, lalu memilih folder paling baru berdasarkan *mtime*.
2. **Parsing metrik kurva pelatihan**:
	- YOLOv7: parser khusus untuk `results.txt` (kolom 8–11: precision, recall, mAP@0.5, mAP@0.5:0.95).
	- YOLOv9 dan YOLOv11: parser CSV (`metrics/precision(B)`, `metrics/recall(B)`, `metrics/mAP50(B)`, `metrics/mAP50-95(B)`).
	- Untuk setiap kurva diambil tiga snapshot: *latest*, *best mAP@0.5*, *best mAP@0.5:0.95*.
3. **Pengukuran galat diameter dalam milimeter** dengan pencocokan *nearest-center*:
	- Untuk setiap citra validasi, *ground truth* dibaca dari `labels/val/*.txt`.
	- Skala piksel→milimeter dihitung *per gambar* memakai rata-rata diameter cakram *ground truth* terhadap acuan 6,0 mm.
	- Untuk setiap pasangan GT–prediksi terdekat dihitung: `error_mm`, `abs_error_mm`, `center_offset_mm`.
	- Agregat per (model, kelas): `MAE`, `RMSE`, `bias`, *median*, dan persentase prediksi dengan `abs_error_mm ≤ {0.5, 1.0, 2.0}` mm.

Karena YOLOv11 belum memberikan hasil yang memuaskan, model ini **dimasukkan dalam perbandingan literatur dan eksperimen pendahuluan saja**, tidak dimuat ke dalam codebase aplikasi.

### B.7 Aset Model Produksi

- [App tugas akhir/App tugas akhir/YOLO AI/best.pt](App%20tugas%20akhir/App%20tugas%20akhir/YOLO%20AI/best.pt) — bobot terbaik yang dipakai layanan FastAPI di lingkungan produksi/uji.
- Format bobot: `*.pt` (PyTorch checkpoint) — **tetap PyTorch**, **tidak** dikonversi ke ONNX/TFLite pada implementasi final (perlu verifikasi manual, lihat F).

### B.8 Library yang Dipakai

Berdasarkan `yolo_service/` (mengikuti `requirements.txt` dan impor pada `yolo_inference.py`):

- `torch`, `torchvision` — inferensi neural network.
- `opencv-python` (`cv2`) — *decoding*, *letterbox*, anotasi *overlay*.
- `numpy` — operasi numerik.
- `fastapi`, `uvicorn` — *web framework* layanan inferensi.
- modul lokal `external/yolov9` — `models.common.DetectMultiBackend`, `utils.augmentations.letterbox`, `utils.general.{check_img_size, non_max_suppression, scale_boxes}`, `utils.torch_utils.select_device`.

### B.9 Alasan Pemilihan YOLO

Argumen yang dapat dibenarkan berbasis kode dan literatur:

1. *Single-stage detector* sehingga *throughput* tinggi (`predict` lalu `non_max_suppression` dalam satu jalur), sesuai kebutuhan layanan HTTP yang dipanggil pengguna.
2. Mampu mendeteksi sekaligus **mengklasifikasikan** dua kelas berbeda (`ab disk` vs `inhibition zone`) dalam satu *pass*, sesuatu yang tidak dapat dilakukan algoritma klasik seperti Hough Circle Transform.
3. YOLOv9 menghadirkan *Programmable Gradient Information* (PGI) dan *Generalized ELAN* (GELAN) yang memperbaiki aliran gradien pada objek kecil seperti cakram 6 mm \[35\].
4. Tersedia *open-source* dengan repositori `external/yolov9` yang stabil sehingga seluruh jalur *training–inference* dapat di-*reproduce*.

---

## C. PENULISAN SKRIPSI — DRAF BAB III LENGKAP

> Bagian yang **dipertahankan apa adanya** dari teman tim ditandai *(unchanged)*.  
> Bagian yang **direvisi** ditandai *(revisi)*.  
> Bagian yang **baru** ditandai *(baru)*.  
> Catatan editorial saya pada bagian teman tidak mengubah substansi.

---

### # **BAB III**

### **DESAIN** *(unchanged)*

### ## **3.1 Desain Alur Data** *(unchanged — lihat dokumen induk)*

### ## **3.2 Desain Basis Data** *(unchanged — lihat dokumen induk)*

---

### ## **3.3 Perbandingan Metodologi Deteksi Zona Hambat** *(revisi)*

Penelitian ini membandingkan tiga arsitektur *one-stage object detector* dari keluarga **YOLO** (You Only Look Once), yaitu **YOLOv7**, **YOLOv9-GELAN**, dan **YOLOv11**, untuk memilih model yang paling sesuai dijalankan pada layanan deteksi zona hambat. Alasan pembatasan pada keluarga YOLO adalah kebutuhan akan model deteksi *real-time* yang sekaligus mampu mengklasifikasikan dua kelas objek (cakram antibiotik dan zona hambat) dalam satu *forward pass*, sesuatu yang tidak dapat dipenuhi oleh metode klasik seperti *Hough Circle Transform* yang hanya mendeteksi bentuk lingkaran tanpa membedakan jenis objek \[33\].

#### **3.3.1 Tinjauan Tiga Pendekatan yang Dievaluasi** *(revisi)*

##### 3.3.1.1 YOLOv7 *(revisi)*

YOLOv7 dirilis oleh Wang dkk. pada tahun 2023 dan menjadi *state-of-the-art* untuk *real-time object detector* pada saat itu, dengan kontribusi utama berupa *trainable bag-of-freebies* dan *extended efficient layer aggregation network* (E-ELAN) \[14\]. Model ini menjadi *baseline deep learning* dalam penelitian ini karena dokumentasi pelatihannya matang dan banyak dipakai pada studi deteksi objek biomedis sebelumnya.

**Kelebihan untuk konteks penelitian ini:**

- mampu mendeteksi sekaligus mengklasifikasikan dua kelas (cakram dan zona);
- *robust* terhadap variasi pencahayaan dan latar belakang;
- *checkpoint* `*.pt` mudah dimuat melalui repositori resmi.

**Keterbatasan yang diantisipasi:**

- akurasi *small-object detection* lebih rendah dibanding arsitektur yang lebih baru;
- aliran gradien pada *deep network* berpotensi *information bottleneck* pada objek dengan ukuran ekstrem (cakram berdiameter 6 mm).

##### 3.3.1.2 YOLOv9-GELAN *(revisi)*

YOLOv9 diperkenalkan oleh Wang dkk. pada tahun 2024 dengan dua kontribusi utama: arsitektur **GELAN** (*Generalized Efficient Layer Aggregation Network*) dan mekanisme **PGI** (*Programmable Gradient Information*) yang merekonstruksi *gradient flow* pada lapisan dalam jaringan, sehingga mengurangi *information loss* pada objek kecil \[17\] \[35\]. Berdasarkan klaim peneliti aslinya, YOLOv9 mengungguli YOLOv7 dalam *mean Average Precision* (mAP) pada *benchmark* MS COCO dengan jumlah parameter setara atau lebih kecil. Sifat ini sangat relevan untuk citra antibiogram di mana cakram 6 mm hanya mengisi sebagian kecil bidang gambar (640×640) sehingga termasuk kategori *small object*.

**Kelebihan yang diharapkan:**

- akurasi lebih tinggi pada objek kecil;
- aliran gradien yang lebih stabil mengurangi risiko *overfitting* pada *dataset* terbatas;
- *backbone* GELAN efisien dari sisi jumlah parameter.

**Keterbatasan yang diantisipasi:**

- kompleksitas arsitektur dan waktu pelatihan relatif lebih besar dibanding YOLOv7;
- jumlah komunitas dan *tooling* mobile masih lebih sedikit dibanding versi turunan *Ultralytics*.

##### 3.3.1.3 YOLOv11 *(revisi)*

YOLOv11 dipublikasikan oleh **Ultralytics** sebagai penerus YOLOv8 dengan klaim efisiensi parameter dan *inference time* yang lebih baik \[14\]. Dalam penelitian ini, YOLOv11 hanya digunakan sebagai pembanding pada tahap eksperimen pendahuluan, **tidak diintegrasikan** ke dalam layanan produksi karena kualitas hasilnya pada *dataset* antibiogram yang dipakai masih di bawah YOLOv9 (lihat hasil empiris pada BAB IV). Faktor yang diduga menjadi penyebabnya adalah ukuran dataset yang relatif kecil dan distribusi objek yang sangat *imbalanced* antara cakram dan zona hambat.

#### **3.3.2 Strategi Evaluasi** *(revisi)*

Evaluasi dilakukan dalam dua dimensi yang saling melengkapi:

1. **Metrik deteksi standar**: *Precision*, *Recall*, *mAP@0.5*, *mAP@0.5:0.95*, *F1-score*, dan *evaluation accuracy proxy* yang didefinisikan sebagai `TP / (TP + FP + FN)`. *Accuracy proxy* dipakai karena metrik *accuracy* klasik tidak lazim pada *object detection* — *true negative* tidak terdefinisi dengan jelas di ruang anchor padat \[27\] \[28\].
2. **Galat ukuran milimeter** terhadap *ground truth*. Galat dihitung dengan pencocokan *nearest-center* antara *bounding box* prediksi dan GT, lalu setiap pasangan dievaluasi menggunakan: *Mean Absolute Error* (MAE), *Root Mean Square Error* (RMSE), *bias*, *median*, *mean center offset*, serta persentase prediksi yang berada dalam toleransi 0,5 mm; 1,0 mm; dan 2,0 mm. Skala konversi piksel→milimeter dihitung **per gambar** menggunakan rata-rata diameter cakram *ground truth* terhadap acuan fisik **6,0 mm** sesuai panduan CLSI \[15\] \[18\].

Pemilihan model final didasarkan pada keseimbangan antara *mAP@0.5*, *Eval accuracy proxy*, dan stabilitas MAE pada kelas `inhibition zone`. Model yang dipilih untuk implementasi layanan inferensi adalah **YOLOv9-GELAN**.

> **Footnote subbab 3.3.**
>
> \[14\] C. Y. Wang, A. Bochkovskiy, dan H.-Y. M. Liao, "YOLOv7: Trainable Bag-of-Freebies Sets New State-of-the-Art for Real-Time Object Detectors," *IEEE/CVF CVPR*, Vancouver, 2023.
>
> \[14\]ʹ G. Jocher dan A. Chaurasia, *Ultralytics YOLO*, v11.0 (YOLOv11), 2024. <https://github.com/ultralytics/ultralytics>
>
> \[15\] Clinical and Laboratory Standards Institute, *CLSI M100 — Performance Standards for Antimicrobial Susceptibility Testing*. Wayne, PA: CLSI, 2024.
>
> \[17\] C. Y. Wang, I. H. Yeh, dan H. Y. M. Liao, "YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information," *ECCV 2024*, 2024.
>
> \[18\] Sumber sama dengan \[15\] (mengikuti penomoran ganda yang sudah dipakai pada skripsi induk).
>
> \[27\] Scikit-learn Documentation, "Regression Metrics," 2024. <https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics>
>
> \[28\] J. Redmon, S. Divvala, R. Girshick, dan A. Farhadi, "You Only Look Once: Unified, Real-Time Object Detection," *IEEE CVPR*, 2016.
>
> \[33\] OpenCV Documentation, "Hough Circle Transform & Image Processing," 2023.
>
> \[35\] Sumber sama dengan \[17\] (arXiv:2402.13616; mengikuti penomoran ganda yang sudah dipakai pada skripsi induk).

---

### ## **3.4 Desain Aplikasi Seluler** *(unchanged — milik tim front-end/back-end)*

### ## **3.5 Desain Model Homografi** *(unchanged — milik tim homografi)*

---

### ## **3.6 Desain Model AI** *(revisi besar)*

Desain model kecerdasan buatan pada sistem ini berfokus pada **deteksi dua kelas objek** — cakram antibiotik (`ab disk`) dan zona hambat (`inhibition zone`) — sekaligus mengukur diameter zona hambat dalam satuan milimeter. Implementasi final menggunakan arsitektur **YOLOv9-GELAN** \[17\] \[35\] yang dilatih pada *dataset* antibiogram khusus dan disajikan melalui layanan HTTP berbasis FastAPI sehingga aplikasi seluler tidak perlu memuat bobot model di sisi *device*.

#### **3.6.1 Dataset dan Anotasi** *(baru)*

Dataset disusun mengikuti konvensi format YOLO yang didefinisikan pada berkas konfigurasi `antibiogram.yaml` dengan dua kelas dan dua *split* (`train`, `val`):

```yaml
nc: 2
names: ['ab disk', 'inhibition zone']
```

Struktur direktori `dataset/yolo_format/{images,labels}/{train,val}` dipilih agar dapat digunakan langsung oleh skrip pelatihan resmi YOLOv9 tanpa adaptor tambahan. Setiap citra didampingi berkas anotasi `.txt` yang berisi satu baris per objek dengan format ter-normalisasi:

```
class_id  cx  cy  w  h
```

Anotasi dilakukan secara manual menggunakan perangkat penganotasi gambar, dengan kebijakan: (1) *bounding box* cakram dipasang ketat di tepi luar cakram kertas, (2) *bounding box* zona hambat dipasang pada tepi terluar area bening yang dapat dibedakan dari pertumbuhan koloni, (3) zona yang tidak terlihat (resisten) tidak dianotasi sehingga sistem dapat mempelajari ketiadaan zona sebagai sinyal *RESISTEN* pada saat pencocokan zona–cakram.

#### **3.6.2 Pra-pemrosesan Data** *(baru)*

Pra-pemrosesan terbagi menjadi dua jalur. Jalur pertama berlaku pada saat pelatihan dan ditangani oleh modul `utils.augmentations` milik YOLOv9 secara *built-in*. Jalur kedua berlaku pada saat inferensi dan diimplementasikan pada kelas `YoloAnalyzer`. Pada kedua jalur, dua transformasi utama yang dilakukan adalah:

1. ***Letterbox resize*** ke 640×640 piksel dengan mempertahankan *aspect ratio* asli; area kosong di tepi diisi *padding* abu-abu. Strategi ini menjaga lingkaran cakram tetap melingkar dan tidak mengalami distorsi anisotropik yang dapat merusak estimasi diameter \[35\].
2. **Normalisasi nilai piksel** dari rentang `[0, 255]` ke `[0.0, 1.0]` dalam format tensor `CHW` (`channels-first`) sesuai konvensi PyTorch \[28\].

Citra yang diterima layanan dapat berasal dari (a) keluaran homografi pra-pemrosesan teman tim (citra yang telah dikoreksi perspektifnya), atau (b) galeri lokal pengguna. Karena kedua sumber sudah menjamin orientasi *top-down* terhadap cawan, *augmentation* spasial yang agresif dihindari pada *training* untuk mempertahankan korespondensi geometris antara cakram fisik 6 mm dan piksel.

#### **3.6.3 Arsitektur Jaringan yang Digunakan** *(revisi dari 3.6.1 lama)*

Model produksi mengikuti konfigurasi `yolov9-c.yaml` dari repositori resmi YOLOv9 \[17\] yang terdiri dari tiga komponen utama:

- ***Backbone* (Ekstraktor Fitur)** — varian GELAN yang menumpuk blok CSP-ELAN. Bertugas mengekstrak fitur visual hierarkis dari citra masukan: tepi, tekstur, dan bentuk lingkaran khas cakram serta zona hambat.
- ***Neck* (Penggabung Fitur)** — modul Feature Pyramid Network (FPN) dan Path Aggregation Network (PAN) yang menggabungkan fitur multi-skala. Tahap ini krusial agar model mendeteksi objek dengan rentang ukuran yang lebar — cakram berukuran kecil dan tetap relatif berbeda dengan zona yang dapat tumbuh hingga beberapa kali diameter cakram.
- ***Head* (Prediksi)** — *decoupled head* dengan jalur tambahan **PGI** (Programmable Gradient Information) untuk mempertahankan informasi gradien pada lapisan dalam. *Head* menghasilkan *bounding box* `(cx, cy, w, h)`, *objectness score*, dan distribusi kelas.

Resolusi masukan dipatok pada **640×640** piksel dengan langkah *stride* maksimum jaringan, dipastikan kompatibel melalui `check_img_size(...)` pada saat *runtime*.

#### **3.6.4 Definisi Kelas dan Konfigurasi Input** *(revisi)*

Sesuai `antibiogram.yaml`, dua kelas didefinisikan:

- **Kelas 0 — `ab disk`**: cakram kertas antibiotik. Deteksi ini menjadi titik referensi kalibrasi karena ukurannya bersifat **standar 6 mm** \[15\].
- **Kelas 1 — `inhibition zone`**: area bening tempat bakteri tidak tumbuh, mengelilingi cakram.

Citra masukan dinormalisasi (lihat 3.6.2), kemudian melewati *forward pass* dengan *threshold* awal `conf_thres = 0.25` dan `iou_thres = 0.45` (lihat 3.6.7).

#### **3.6.5 Pelatihan Model** *(baru)*

Pelatihan dilakukan menggunakan skrip resmi `external/yolov9/train.py` pada lingkungan dengan akselerator GPU. Konfigurasi pelatihan yang dipakai dibatasi pada parameter berikut:

- **arsitektur**: `models/detect/yolov9-c.yaml`;
- **dataset**: `antibiogram.yaml`;
- **resolusi masukan**: 640;
- **batch size**: ditentukan berdasarkan memori GPU yang tersedia (perlu verifikasi manual, lihat F.2);
- **jumlah *epoch***: ditentukan berdasarkan konvergensi pada kurva `results.csv` (perlu verifikasi manual, lihat F.2);
- **optimizer dan *hyper-parameter*** mengikuti file *hyperparameter* bawaan repositori YOLOv9.

Output pelatihan ditempatkan di `external/yolov9/runs/train/antibiogram_<timestamp>/`. Dari setiap *run*, berkas yang dimanfaatkan adalah `weights/best.pt` dan `results.csv`. Berkas `best.pt` dari *run* terbaik kemudian disalin menjadi `App tugas akhir/YOLO AI/best.pt` untuk dipakai oleh layanan inferensi.

Pelatihan untuk **YOLOv7** dijalankan pada repositori terpisah (`external/yolov7/`) dengan parser metrik berbasis `results.txt`. Pelatihan **YOLOv11** dijalankan secara terpisah menggunakan paket `ultralytics` dengan keluaran `results.csv` di `outputs/yolov11_preparation/yolov11_runs/`. Pemilihan *run* terbaru secara otomatis dilakukan oleh utilitas `latest_dir(...)` di notebook perbandingan.

#### **3.6.6 Pipeline Inferensi pada Layanan Produksi** *(baru, menggantikan 3.6.3 dan 3.6.4 lama tentang konversi mobile)*

Layanan inferensi diimplementasikan sebagai server Python berbasis **FastAPI** pada modul `yolo_service/` yang berjalan di *port* 9000. Pemilihan arsitektur server bukan *on-device* didasarkan pada pertimbangan berikut:

1. **Konsistensi numerik**: bobot `*.pt` dijalankan tanpa kuantisasi sehingga MAE yang diukur sama persis dengan yang dilaporkan pada evaluasi notebook.
2. **Kebebasan iterasi model**: pembaruan bobot tidak memerlukan pembaruan APK; pengguna selalu memperoleh versi model terbaru.
3. **Kemudahan integrasi dengan layanan homografi** (port 8000) yang juga berbasis Python — kedua layanan dapat berbagi tumpukan *library* yang sama.

Akibatnya, **konversi ke TFLite/ONNX serta kuantisasi *int8* yang sebelumnya dirancang menjadi rencana lanjutan**, dan dipindahkan ke saran pengembangan pada BAB V. Hal ini juga menjelaskan mengapa contoh kode Kotlin/Swift untuk pemanggilan *interpreter* TFLite tidak disertakan pada implementasi final.

Alur inferensi tiap permintaan `POST /yolo/analyze` adalah sebagai berikut:

1. *Multipart upload* diterima sebagai `UploadFile`. Validasi: berkas non-kosong dan dapat di-*decode* oleh `cv2.imdecode`.
2. Citra di-*letterbox* ke 640 dan dinormalisasi (lihat 3.6.2).
3. Tensor diumpankan ke `DetectMultiBackend(best.pt)`; hasil mentah melewati `non_max_suppression(conf_thres=0.25, iou_thres=0.45, max_det=300)`.
4. Koordinat dikembalikan ke ruang gambar asli melalui `scale_boxes(...)`.
5. Deteksi dipilah berdasarkan kelas; pasangan cakram–zona dibangun (lihat 3.6.7).
6. Kalibrasi piksel→milimeter dilakukan **per cakram** dengan persamaan:
	$$
	\text{scale}_{\text{mm/px}} = \frac{D_{\text{disk,mm}}}{D_{\text{disk,px}}},\qquad D_{\text{disk,px}} = \frac{w_{\text{disk}} + h_{\text{disk}}}{2}
	$$
	dengan $D_{\text{disk,mm}}=6{,}0$ mm secara *default* (dapat di-*override* via parameter `disk_mm`).
7. Diameter zona dihitung:
	$$
	D_{\text{zone,mm}} = \frac{w_{\text{zone}}+h_{\text{zone}}}{2} \cdot \text{scale}_{\text{mm/px}}.
	$$
8. *Overlay* visual dibangun dengan `cv2.rectangle` dan `cv2.putText` untuk setiap *bounding box* dan badge angka sampel; hasilnya di-*encode* sebagai `data:image/jpeg;base64,...` agar dapat langsung ditampilkan di komponen `<img>` pada aplikasi.
9. Respon JSON dikirim ke klien (struktur lengkap dijelaskan pada 3.7).

#### **3.6.7 Pasca-pemrosesan Deteksi: Pencocokan Cakram–Zona dan Penolakan *Outlier*** *(revisi dari 3.6.6 lama)*

Keluaran mentah YOLOv9 berpotensi mengandung *false positive*, deteksi ganda, atau zona yang tidak berpasangan dengan cakram manapun. Sistem menerapkan rantai pasca-pemrosesan berikut, semua diimplementasikan pada kelas `YoloAnalyzer`:

1. ***Confidence filtering***: ambang `conf_thres = 0.25` diterapkan langsung di `non_max_suppression`. Nilai ini dipilih sebagai *trade-off* antara *precision* dan *recall* berdasarkan praktik standar pada *one-stage detector* \[28\] dan dapat dievaluasi ulang lewat kurva ROC pada *validation set*.
2. ***Non-Maximum Suppression*** dengan `iou_thres = 0.45` menghilangkan deteksi ganda untuk objek yang sama. IoU dihitung sebagai $\text{IoU} = \frac{|A\cap B|}{|A\cup B|}$ untuk dua *bounding box* \[28\].
3. ***Class-specific filtering***: deteksi dipisah ke `disk_candidates` dan `zone_candidates`.
4. ***Pencocokan cakram–zona*** (`_zone_match_score`) — untuk setiap cakram dicari zona terbaik yang memenuhi semua aturan berikut:
	- rasio diameter zona/cakram berada dalam rentang `[MIN_ZONE_TO_DISK_RATIO, MAX_ZONE_TO_DISK_RATIO] = [1.12, 7.5]`;
	- pusat cakram terletak di dalam *bounding box* zona;
	- jarak antar pusat tidak melebihi $\max(0{,}5 \cdot r_{\text{zone}}, 0{,}75 \cdot r_{\text{disk}})$;
	- syarat konsentris: $d + r_{\text{disk}} \le 1{,}12 \cdot r_{\text{zone}}$.
	Skoring menggunakan tuple `(center_offset_norm, −rasio, −confidence_zona)` dengan tujuan **minimasi**: pertama kedekatan pusat, kedua memilih rasio yang besar (zona lebih luas), ketiga memilih *confidence* tertinggi.
5. ***Outlier removal*** implisit melalui aturan rasio: zona yang terlalu kecil (≤ 1,12 × diameter cakram, kurang dari tepi cakram) atau terlalu besar (> 7,5 × diameter cakram, melampaui ukuran cawan petri 90 mm) ditolak.
6. ***Label RESISTEN otomatis***: jika cakram tidak menemukan pasangan zona yang valid, sistem menetapkan `result = "RESISTEN"`, yang secara biologis konsisten dengan keadaan saat bakteri tidak terhambat oleh antibiotik.

Mekanisme ini berhasil menggantikan ambang ukuran *hard-coded* (`min_size = 0.02`, `max_size = 0.5`) yang sebelumnya direncanakan secara murni piksel, dengan aturan **rasio relatif terhadap cakram** yang lebih *robust* terhadap variasi resolusi kamera.

#### **3.6.8 Strategi Evaluasi Model: Metrik Deteksi dan Galat Milimeter** *(baru, eksplisit menjelaskan pipeline notebook B.6)*

Evaluasi sistem terdiri dari dua bagian yang saling melengkapi.

##### 3.6.8.1 Metrik Deteksi Standar

Diparsing dari kurva pelatihan setiap *run*:

- **Precision**, **Recall**, **mAP@0.5**, **mAP@0.5:0.95**.
- **F1-score** $= \dfrac{2 P R}{P + R}$.
- ***Evaluation accuracy proxy*** $= \dfrac{F_1}{2 - F_1}$, ekuivalen dengan $\dfrac{TP}{TP+FP+FN}$. Metrik *accuracy* klasik tidak relevan pada *object detection* karena ruang *true negative* tidak terbatas \[27\].

Untuk setiap model diambil tiga snapshot: *latest*, *best mAP@0.5*, *best mAP@0.5:0.95*.

##### 3.6.8.2 Galat Pengukuran dalam Milimeter

Karena galat dalam piksel tidak relevan secara klinis, evaluasi diperdalam ke ruang fisik milimeter. Untuk setiap citra di *validation set*:

1. *Ground truth* diparsing dari `labels/val/*.txt`.
2. Skala $\text{mm/px}$ dihitung dari **rata-rata diameter cakram GT** dibagi 6,0 mm.
3. *Bounding box* GT dan prediksi (di atas ambang `conf ≥ 0.25`) dipasangkan dengan strategi *nearest-center* (`match_by_nearest_center`).
4. Untuk setiap pasangan:
	$$
	\text{error}_{\text{mm}} = D_{\text{pred,mm}} - D_{\text{gt,mm}}, \quad \text{abs\_error} = |\text{error}_{\text{mm}}|.
	$$
5. Hasil dikelompokkan per `(model, kelas)` lalu diringkas dengan:
	- **MAE** — galat absolut rata-rata;
	- **RMSE** — galat kuadrat rata-rata (lebih sensitif terhadap *outlier*) \[27\];
	- **bias** — galat rata-rata bertanda (positif → *over-estimate*, negatif → *under-estimate*);
	- **mean center offset** — pergeseran pusat objek;
	- **within_0.5mm_pct, within_1.0mm_pct, within_2.0mm_pct** — persentase prediksi yang memenuhi toleransi 0,5; 1,0; dan 2,0 mm.

Ambang **2,0 mm** menjadi *acceptance criterion* utama karena selisih ini sudah cukup untuk mengubah interpretasi *susceptible–intermediate–resistant* pada beberapa pasangan antibiotik–patogen menurut tabel CLSI M100 \[15\] \[18\].

#### **3.6.9 Catatan Implementasi *Edge Cases*** *(baru)*

Beberapa *corner case* yang ditemukan selama pengembangan dan ditangani secara eksplisit pada `YoloAnalyzer`:

- **Citra kosong / korup**: divalidasi pada *handler* `analyze()` dengan pengecekan `image_bgr.size == 0`.
- **Tidak ada cakram terdeteksi**: tidak ada pengukuran yang dibangun; respons JSON tetap mengembalikan daftar `detections[]` kosong dan `diameterMm = null` agar *front-end* dapat menampilkan pesan informatif.
- **Cakram tanpa pasangan zona**: ditandai `RESISTEN` (lihat 3.6.7 butir 6).
- **Zona tanpa pasangan cakram**: tidak dilaporkan dalam *measurements*, namun tetap muncul pada `detections[]` untuk keperluan audit.
- **Beberapa cakram dalam satu cawan**: setiap cakram diberi indeks `Sample N` yang ditampilkan sebagai *badge* di *overlay*, sehingga *front-end* dapat menyajikan tabel hasil per cakram.

> **Footnote subbab 3.6.** Seluruh rujukan \[15\] \[17\] \[18\] \[27\] \[28\] \[35\] pada subbab 3.6 sudah didefinisikan di blok footnote subbab 3.3. Tidak ada sumber baru pada subbab 3.6.

---

### ## **3.7 Desain Integrasi Komponen** *(revisi ringan)*

Sistem terdiri dari tiga komponen yang berkomunikasi melalui protokol HTTP:

| Komponen | Teknologi | Port | Tanggung jawab |
| --- | --- | --- | --- |
| Aplikasi seluler | Capacitor + React (Web View Android) | — | UI pengguna, kamera, galeri, riwayat |
| API utama | PHP + MySQL (XAMPP) | 80 | persistensi laporan, autentikasi |
| Layanan homografi | Python + FastAPI | 8000 | koreksi perspektif citra |
| Layanan YOLO | Python + FastAPI | 9000 | inferensi dan kalkulasi diameter |

Pada saat pengguna menyelesaikan langkah pengambilan citra:

1. Aplikasi mengirim citra ke layanan **homografi** (`POST :8000/...`). Layanan mengembalikan citra ter-koreksi.
2. Citra ter-koreksi dikirim ke layanan **YOLO** (`POST :9000/yolo/analyze`) bersama parameter opsional `disk_mm` jika pengguna mengganti acuan diameter cakram.
3. Layanan YOLO mengembalikan JSON yang berisi:
	- `processedImage`: *data URL* berisi *overlay* hasil deteksi;
	- `diameterMm`: diameter zona hambat utama;
	- `measurements[]`: rincian per cakram (`label`, `result`, `diameterMm`, *bounding box* cakram dan zona, *confidence*);
	- `detections[]`: deteksi mentah untuk keperluan *debug*.
4. Aplikasi menampilkan *overlay*, mengisi otomatis kolom diameter, dan meminta pengguna mengonfirmasi sebelum menyimpan laporan ke API utama.

Karena seluruh pipeline AI berjalan di Python pada lingkungan server, sisi aplikasi seluler tidak perlu memuat *runtime* PyTorch/ONNX/TFLite. Konsekuensinya, aplikasi memerlukan koneksi jaringan ke server saat pengguna melakukan analisis baru. Skenario *offline mobile* yang dipaket dengan TFLite/ONNX *quantized* dicatat sebagai **arah pengembangan lanjutan** pada BAB V.

---

### ## **3.8 Desain Validasi dan Testing** *(revisi ringan, mengaitkan ke 3.6.8)*

Strategi validasi yang dipakai oleh tim AI dirinci pada **3.6.8** dan terdiri dari dua dimensi: metrik deteksi standar (Precision, Recall, mAP, F1, accuracy proxy) dan galat ukuran milimeter (MAE, RMSE, bias, *within-tolerance*). Untuk metrik milimeter, *ground truth* diperoleh dari anotasi manual yang sama yang dipakai pada *validation set*, dengan kalibrasi piksel→milimeter per gambar berdasarkan cakram standar 6,0 mm. Kriteria penerimaan utama:

- **MAE < 2,0 mm** untuk kelas `inhibition zone` (toleransi CLSI \[15\] \[18\]);
- **within_2.0mm_pct** maksimal;
- **mAP@0.5 ≥ 0,80** pada *validation set* khusus antibiogram.

Detail BAB IV akan memuat angka empiris.

> **Footnote subbab 3.8.** Rujukan \[15\] dan \[18\] sudah didefinisikan di blok footnote subbab 3.3.

---

## D. DAFTAR SITASI YANG SAYA TAMBAHKAN / RUJUK

Catatan: penomoran mengikuti tabel `[n]` IEEE-like yang sudah ada di skripsi induk. Saya **tidak** menambahkan entri baru ke tabel tersebut secara otomatis — silakan tambahkan sesuai daftar di bawah jika belum tercantum.

| Nomor (saran) | Referensi | Status di skripsi induk |
| --- | --- | --- |
| \[14\] | Wang, C. Y., Bochkovskiy, A., & Liao, H.-Y. M. (2023). *YOLOv7: Trainable Bag-of-Freebies Sets New State-of-the-Art for Real-Time Object Detectors*. IEEE/CVF CVPR. | sudah ada |
| \[14\] | Jocher, G., & Chaurasia, A. (2024). *Ultralytics YOLO*, v11.0. <https://github.com/ultralytics/ultralytics> | sudah ada di footnote-ref-14 |
| \[15\] / \[18\] | CLSI. (2024). *Performance Standards for Antimicrobial Susceptibility Testing — M100*. Wayne, PA. | sudah ada |
| \[17\] / \[35\] | Wang, C. Y., Yeh, I. H., & Liao, H. Y. M. (2024). *YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information*. ECCV 2024. arXiv:2402.13616. | sudah ada |
| \[27\] | Scikit-learn Developers. (2024). *Regression Metrics — User Guide*. <https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics> | sudah ada di footnote-ref-27 |
| \[28\] | Redmon, J., Divvala, S., Girshick, R., & Farhadi, A. (2016). *You Only Look Once: Unified, Real-Time Object Detection*. IEEE CVPR. doi:10.1109/CVPR.2016.91 | sudah ada di footnote-ref-28 |
| \[32\] | Google. (2024). *TensorFlow Lite Guide: On-device Machine Learning*. <https://www.tensorflow.org/lite/guide> | sudah ada di footnote-ref-32 (dipakai untuk saran *future work* pada 3.6.6) |
| \[33\] | OpenCV Developers. (2024). *Hough Circle Transform & Image Processing*. <https://docs.opencv.org/4.x/da/d53/tutorial_py_houghcircles.html> | sudah ada di footnote-ref-33 |

**Referensi tambahan yang disarankan untuk ditambahkan** (belum ada di daftar pustaka induk; rekomendasi):

1. Padilla, R., Netto, S. L., & da Silva, E. A. B. (2020). *A Survey on Performance Metrics for Object-Detection Algorithms*. International Conference on Systems, Signals and Image Processing (IWSSIP). doi:10.1109/IWSSIP48289.2020.9145130. — untuk memperkuat justifikasi metrik mAP/F1/accuracy proxy.
2. Lin, T.-Y., Maire, M., Belongie, S., et al. (2014). *Microsoft COCO: Common Objects in Context*. ECCV 2014. arXiv:1405.0312. — referensi konvensi anotasi *bounding box*.
3. Bochkovskiy, A., Wang, C. Y., & Liao, H.-Y. M. (2020). *YOLOv4: Optimal Speed and Accuracy of Object Detection*. arXiv:2004.10934. — referensi rangkaian YOLO modern, opsional.

---

## E. PENANDA PERUBAHAN

### E.1 File yang Dibuat oleh Draf Ini

- [BAB3_DRAFT_AI.md](BAB3_DRAFT_AI.md) *(file baru — dokumen yang Anda baca sekarang; tidak menyentuh skripsi induk)*

### E.2 File Skripsi Induk

- [Tugas_Akhir_Kontribusi.md](Tugas_Akhir_Kontribusi.md) — **TIDAK DIUBAH** pada putaran ini. Semua perubahan akan dieksekusi setelah Anda menyetujui draf.

### E.3 Bagian Skripsi Induk yang Direncanakan untuk Diganti / Ditambah

| Subbab | Baris (perkiraan) | Aksi yang disarankan |
| --- | --- | --- |
| 3.3 Perbandingan Metodologi (3.3.1 – 3.3.3) | 332 – 444 | **Ganti** dengan versi pada bagian C (lebih ringkas, tiga model YOLO saja, tanpa Hough). |
| 3.6 Desain Model AI (seluruh 3.6.1 – 3.6.6) | 596 – 809 | **Ganti** dengan versi pada bagian C (3.6.1 – 3.6.9 baru). Hapus subbab konversi TFLite/Kotlin/Swift; pindahkan ke saran BAB V. |
| 3.7 Desain Integrasi Komponen | 810 – 817 | **Revisi ringan**: tambahkan tabel layanan dan alur 4 langkah, sebutkan FastAPI port 8000/9000. |
| 3.8 Desain Validasi dan Testing | 818 – 895 | **Revisi ringan**: rujuk ke 3.6.8 untuk metrik milimeter; metrik klasifikasi tetap. |
| Daftar Pustaka & Footnote | 1004 – 1129 | **Pertahankan**, tambahkan tiga referensi pada D bila disetujui. |
| 3.1 Desain Alur Data | 295 – 305 | **Tidak diubah**. |
| 3.2 Desain Basis Data | 306 – 331 | **Tidak diubah**. |
| 3.4 Desain Aplikasi Seluler | 445 – 487 | **Tidak diubah** (milik tim *front-end*/*back-end*). |
| 3.5 Desain Model Homografi | 488 – 595 | **Tidak diubah** (milik tim homografi). |

### E.4 Paragraf yang Diedit dari Versi Lama 3.6

- **Paragraf pembuka 3.6** — diubah dari "menggunakan YOLOv7" menjadi "menggunakan YOLOv9-GELAN" agar konsisten dengan `best.pt` yang aktif pada layanan.
- **3.6.3 Desain Optimasi untuk Perangkat Bergerak (lama)** — dihapus; isinya bersifat rencana TFLite yang tidak terlaksana. Dipindah menjadi *saran pengembangan*.
- **3.6.4 Desain Konversi Model YOLO untuk Implementasi Seluler (lama)** — dihapus; contoh kode Kotlin/Swift dihapus karena tidak ada *integration* TFLite di codebase. Diganti dengan **3.6.6 Pipeline Inferensi pada Layanan Produksi (baru)** berbasis FastAPI.
- **3.6.5 Desain Perhitungan Diameter Zona Hambat (lama)** — disempurnakan: persamaan kalibrasi dirumuskan ulang, koneksi ke `_build_measurements` dijelaskan, ambang piksel diganti aturan rasio relatif.
- **3.6.6 Desain Post-Processing Deteksi YOLO (lama)** — sebagian dipertahankan (filter confidence, NMS, IoU), sebagian besar diganti dengan aturan pencocokan cakram–zona yang nyata di `_zone_match_score`.

### E.5 Bagian yang Berasal dari Analisis Codebase

Seluruh angka, ambang, dan aturan berikut diambil langsung dari source code, bukan asumsi:

- `conf_thres = 0.25`, `iou_thres = 0.45`, `img_size = 640`, `max_det = 300` — dari `YoloAnalyzer.__init__` dan `analyze()`.
- `MIN_ZONE_TO_DISK_RATIO = 1.12`, `MAX_ZONE_TO_DISK_RATIO = 7.5`, `MAX_ZONE_CENTER_OFFSET_RATIO = 0.5` — dari konstanta kelas.
- Diameter cakram default 6,0 mm — dari `disk_diameter_mm = 6.0` dan `DEFAULT_DISK_MM`.
- Kelas dan nama label `['ab disk', 'inhibition zone']` — dari `antibiogram.yaml`.
- Struktur `images/{train,val}` dan `labels/{train,val}` — dari `antibiogram.yaml`.
- Tahapan letterbox→normalize→inference→NMS→scale_boxes — dari `YoloAnalyzer.analyze`.
- *Format response* JSON pada 3.6.6 — dari `server.yolo_analyze`.
- Pipeline notebook (parser metrik YOLOv7/v9/v11, pencocokan *nearest-center*, metrik MAE/RMSE/bias/within-tolerance) — dari `model_comparison_yolov7_yolov9.ipynb`.

### E.6 Bagian yang **Perlu Review Manual**

Lihat bagian F.

---

## F. CATATAN VERIFIKASI MANUAL

Tandai poin-poin berikut sebagai **"perlu verifikasi manual"** sebelum draf masuk ke versi final skripsi:

1. **Hyperparameter pelatihan** (`batch_size`, `epochs`, `optimizer`, `lr0`, `weight_decay`, `image augmentation` aktif). Saya tidak menemukan berkas konfigurasi pelatihan kustom di workspace. Asumsi saya: dipakai *default* dari `external/yolov9/data/hyps/hyp.scratch-high.yaml`. → **Tolong konfirmasi nilainya dan isi 3.6.5.**
2. **Jumlah gambar pelatihan dan validasi** (`|train|` dan `|val|`). Pada notebook disebut "69 gambar" untuk validasi YOLOv7, namun jumlah *train* tidak terbaca dari workspace. → **Tolong tambahkan angka aktual ke 3.6.1.**
3. **Berapa *epoch* yang dijalankan pada *run* `antibiogram_*` final**. Bisa dilihat di `external/yolov9/runs/train/antibiogram_<latest>/results.csv`. → **Akan otomatis muncul di BAB IV; pastikan konsisten dengan klaim 3.6.5.**
4. **Apakah ada augmentasi tambahan** (mosaic, mixup, hsv) yang diaktifkan/dimatikan secara eksplisit. Saya menulis 3.6.2 dengan asumsi *default* YOLOv9. → **Tolong verifikasi.**
5. **Status final konversi mobile**. Saya menulis bahwa konversi TFLite/ONNX **tidak** diintegrasikan pada implementasi final dan dipindahkan ke saran. Jika pada akhirnya Anda berhasil melakukan konversi sebelum sidang, bagian 3.6.6 dan 3.7 perlu disesuaikan.
6. **Versi YOLOv11** yang dipakai (Ultralytics 8.x atau 11.0). → **Tolong cantumkan versi paket pada 3.6.5 jika tersedia.**
7. **Hak akses dataset** dan apakah dataset bersumber publik (mis. Roboflow) atau dibuat sendiri. Saya menulis "anotasi dilakukan manual"; ganti sesuai kenyataan.
8. **Apakah `MAX_ZONE_CENTER_OFFSET_RATIO = 0.5` dan rasio `[1.12, 7.5]`** adalah hasil *tuning* empiris atau diturunkan dari literatur. Saya menyajikan keduanya sebagai *engineering rule of thumb*; tambahkan justifikasi pada 3.6.7 jika berasal dari eksperimen.

---

## G. SARAN PENINGKATAN KUALITAS SKRIPSI

1. **Konsistensi nama versi YOLO**. Pada BAB II teman tim menyebut "YOLOv7" sebagai pilihan; pada BAB III implementasi akhir memakai YOLOv9. Sebaiknya BAB II ditambahi paragraf penjelas bahwa pilihan akhir bergeser ke YOLOv9 setelah perbandingan empiris.
2. **Sumber gambar pada subbab AI**. Daftar gambar saat ini hanya berisi diagram peran pengguna. Tambahkan gambar: (a) contoh anotasi *bounding box*, (b) kurva *training* `mAP@0.5` tiga model, (c) histogram `abs_error_mm`, (d) contoh *overlay* hasil deteksi. Semuanya sudah dapat diregenerasi dari notebook perbandingan.
3. **Tabel perbandingan angka empiris** sebaiknya dipindahkan dari 3.3.3 (yang sifatnya rencana) ke BAB IV (yang sifatnya hasil), dan angka dummy "60–70 %" dst. diganti dengan hasil aktual.
4. **Standardisasi gaya sitasi**. Skripsi induk menggunakan tiga gaya paralel (APA-like, IEEE `[n]`, dan footnote dengan tanda `[↑]`). Sebelum sidang, sebaiknya pilih satu gaya konsisten — saya merekomendasikan IEEE numerik karena paling banyak terpakai pada bagian teknis.
5. **Daftar singkatan**. Tambahkan glosarium singkatan (CLSI, mAP, IoU, NMS, GELAN, PGI, FPN, PAN, FastAPI) di awal dokumen agar pembaca non-teknis dapat mengikuti.
6. **Versi *library*** sebaiknya dicantumkan dalam tabel (PyTorch, OpenCV, FastAPI, YOLOv9 commit). Dapat dibuat tabel "Spesifikasi Lingkungan Pengembangan" pada BAB III atau lampiran.
7. **Reproduktibilitas**: di subbab 3.6.5 boleh ditambahkan perintah satu baris yang dipakai untuk melatih, misalnya:
	```bash
	python train.py --data antibiogram.yaml --cfg models/detect/yolov9-c.yaml --img 640 --epochs <N> --batch <B>
	```
	(angka N dan B menunggu verifikasi manual F.1).

---

> **Langkah selanjutnya yang saya sarankan**: konfirmasikan persetujuan terhadap draf ini, lalu saya akan menerapkan perubahan ke `Tugas_Akhir_Kontribusi.md` mengikuti tabel E.3. Setelah BAB III selesai dikunci, kita lanjut ke BAB IV (hasil empiris berbasis tabel evaluasi notebook) dan BAB V (kesimpulan + saran TFLite/ONNX).
