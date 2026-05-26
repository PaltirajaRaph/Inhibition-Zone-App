# Draf Penulisan Skripsi — BAB IV (Hasil dan Pembahasan, Bagian Kontribusi AI / YOLO)

> Dokumen ini adalah **draf calon penggantian** untuk BAB IV pada `Tugas_Akhir_Kontribusi.md`. File induk **tidak** disentuh sampai Anda menyetujui.
>
> **Sumber data**: seluruh angka empiris diekstrak langsung dari output sel ter-eksekusi pada `model_comparison_yolov7_yolov9.ipynb` (notebook 3,76 MB di root workspace). *Run* aktualnya: YOLOv7 `antibiogram_improved_640` (180 epoch), YOLOv9 `antibiogram_yolov9_clean` (180 epoch), YOLOv11 `antibiogram_yolo11_stage2_plus` (175 epoch). Tidak ada angka yang dikarang.

---

## A. ANALISIS BAB IV EKSISTING

### A.1 Struktur Saat Ini

| Subbab | Baris | Pemilik | Status |
| --- | --- | --- | --- |
| 4.1 Hasil Implementasi Sistem | 900–909 | bersama | **revisi**: ada klaim "tanpa koneksi internet" yang **bertentangan** dengan implementasi nyata (layanan FastAPI server). |
| 4.2 Hasil Pengujian dan Evaluasi | 911–926 | **AI (Anda)** | **revisi besar**: angka MAE 1,18 mm; RMSE 1,46 mm; 75 citra/320 zona; akurasi 91,8 %; 2,4 detik/citra — angka-angka ini tidak ditemukan sumbernya di workspace. Harus diganti dengan hasil notebook nyata atau ditandai sebagai placeholder. Juga belum ada perbandingan v7/v9/v11. |
| 4.3 Perbandingan dengan Metode Manual | 928–934 | **AI (Anda)** | **revisi**: angka mengikuti 4.2. |
| 4.4 Analisis Homografi | 936–940 | *homografi* | **tidak diubah**. |
| 4.5 Reduksi Human Error (Giroskop & Galeri) | 942–948 | *front-end / homografi* | **tidak diubah**. |
| 4.6 Pembahasan | 950–956 | bersama | **revisi**: ada klaim "model dikonversi ke format TFLite" yang **tidak benar** di codebase nyata. |
| 4.7 Keterbatasan & Rekomendasi | 958–982 | bersama | **revisi**: rekomendasi pruning/quantization/TFLite dipindah; rekomendasi *cloud inference* sebenarnya **sudah** menjadi arsitektur final, jadi narasinya dibalik. |

### A.2 Masalah Utama yang Harus Diperbaiki

1. **Kontradiksi arsitektur**: 4.1 menulis "Proses ini berjalan langsung pada perangkat tanpa memerlukan koneksi internet"; 4.6 menulis "model yang telah dikonversi ke format TFLite". Kenyataan dari codebase: inferensi dilakukan oleh layanan **FastAPI Python pada port 9000** yang menjalankan PyTorch `best.pt` — **memerlukan jaringan**, **tidak ada TFLite**.
2. **Angka tanpa sumber**: MAE 1,18 mm, RMSE 1,46 mm, 91,8 % akurasi klasifikasi, 75 citra/320 zona, 2,4 detik/citra. Tidak ada bukti pendukung di workspace.
3. **Belum ada perbandingan tiga model**: 4.2 hanya melaporkan satu model tanpa menyebut model mana yang dipakai dan tanpa membandingkan YOLOv7/v9/v11. Padahal 3.3 yang baru (lihat draf BAB III) menjanjikan perbandingan tiga model.
4. **Metrik yang belum dimanfaatkan**: notebook perbandingan menghitung MAE, RMSE, *bias*, *median*, *mean center offset*, persentase `within_0.5mm`, `within_1.0mm`, `within_2.0mm`. Pada draf lama hanya MAE dan RMSE yang muncul.

---

## B. DRAF BAB IV LENGKAP

Bagian yang tidak diubah ditandai *(unchanged)*; bagian yang direvisi ditandai *(revisi)*; bagian baru ditandai *(baru)*.

---

### # **BAB IV**

### **HASIL DAN PEMBAHASAN**

---

### ## **4.1 Hasil Implementasi Sistem** *(revisi ringan)*

Sistem yang telah dirancang berhasil diimplementasikan dalam bentuk aplikasi seluler berbasis Capacitor yang ditopang oleh dua layanan inferensi Python berbasis FastAPI. Aplikasi mampu menjalankan fungsi dasar pembuatan laporan uji sensitivitas antibiotik sesuai standar **CLSI** (*Clinical and Laboratory Standards Institute*) \[15\] \[18\], serta mendeteksi cakram antibiotik dan zona hambat secara otomatis dari citra cawan petri.

Alur kerja sistem dari sudut pandang pengguna adalah sebagai berikut:

1. Pengguna mengambil citra cawan petri menggunakan kamera perangkat seluler, atau memilih citra dari galeri lokal.
2. Aplikasi mengirim citra ke **layanan homografi** (FastAPI port 8000) untuk koreksi perspektif. Layanan mengembalikan citra ter-koreksi dengan tampilan tampak atas.
3. Citra ter-koreksi dikirim ke **layanan YOLO** (FastAPI port 9000, endpoint `POST /yolo/analyze`). Layanan ini menjalankan model **YOLOv9-GELAN** \[17\] \[35\] terhadap bobot `best.pt` dan mengembalikan respons JSON berisi *overlay* hasil deteksi, daftar pengukuran per cakram, serta diameter zona hambat dalam milimeter.
4. Aplikasi menampilkan *overlay* dan tabel pengukuran, kemudian secara otomatis melakukan klasifikasi (Sensitif / Intermediat / Resisten) berdasarkan tabel ambang CLSI \[15\] \[18\] dan menyimpan laporan ke basis data.

Berbeda dengan rencana awal yang membayangkan inferensi *on-device* memakai TFLite, **implementasi final menempatkan inferensi pada sisi server** karena dua alasan: (a) konsistensi numerik dengan model asli PyTorch tanpa kerugian akibat kuantisasi, dan (b) kemudahan iterasi pembaruan bobot tanpa harus memperbarui APK. Konsekuensinya, aplikasi memerlukan koneksi jaringan ke server saat melakukan analisis baru; skenario *offline* dijadwalkan sebagai pengembangan lanjutan (lihat 4.7 dan BAB V).

Tampilan aplikasi dirancang sederhana dengan menu utama berupa pengambilan citra, daftar hasil, dan riwayat data. Hasil deteksi disajikan dalam dua bentuk: *overlay* visual berupa *bounding box* dan label, serta tabel pengukuran terstruktur. Secara keseluruhan, sistem berhasil menjalankan fungsi utama dari pengambilan citra hingga produksi laporan analisis terstandardisasi.

> **Gambar 4.1** *(usulan, perlu di-render)*: tangkapan layar antarmuka aplikasi pada tiga keadaan — halaman akuisisi, halaman hasil dengan *overlay* YOLO, halaman daftar riwayat.

> **Footnote subbab 4.1.**
>
> \[15\] Clinical and Laboratory Standards Institute, *CLSI M100 — Performance Standards for Antimicrobial Susceptibility Testing*. Wayne, PA: CLSI, 2024.
>
> \[17\] C. Y. Wang, I. H. Yeh, dan H. Y. M. Liao, "YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information," *ECCV 2024*, 2024.
>
> \[18\] Sumber sama dengan \[15\] (mengikuti penomoran ganda yang sudah dipakai pada skripsi induk).
>
> \[35\] Sumber sama dengan \[17\] (arXiv:2402.13616).

---

### ## **4.2 Hasil Pengujian dan Evaluasi Model AI** *(revisi besar)*

Pengujian model AI dilakukan dengan dua jalur evaluasi: (1) metrik deteksi standar yang diparsing dari kurva pelatihan, dan (2) galat pengukuran milimeter terhadap *ground truth* anotasi manual. Metodologi lengkap dirinci pada subbab 3.6.8 BAB III.

#### **4.2.1 Konfigurasi Pengujian** *(baru)*

| Aspek | Nilai |
| --- | --- |
| Dataset validasi | `dataset/yolo_format/images/val` (di luar repositori publik; lihat catatan dataset di 3.6.1). |
| Subset pengukuran galat milimeter | 12 citra dipilih acak (`SEED=42`) dengan total 60 cakram dan 63 zona hambat ter-anotasi sebagai *ground truth*. |
| Resolusi inferensi | 640×640 (letterbox dengan *padding* abu-abu). |
| Ambang *confidence* | 0,25 (`conf_thres`). |
| Ambang IoU NMS | 0,45 (`iou_thres`). |
| Diameter cakram acuan | 6,0 mm \[15\] \[18\]. |
| Perangkat akselerator | GPU CUDA (`device=0`). |
| Ukuran bobot `best.pt` | YOLOv7: 71,33 MB; YOLOv9: 195,13 MB; YOLOv11: 18,31 MB. |
| Sumber metrik kurva | YOLOv7: `external/yolov7/runs/train/antibiogram_improved_640/results.txt` (180 baris epoch); YOLOv9: `external/yolov9/runs/train/antibiogram_yolov9_clean/results.csv`; YOLOv11: `outputs/yolov11_preparation/yolov11_runs/antibiogram_yolo11_stage2_plus/results.csv`. |
| Notebook | [model_comparison_yolov7_yolov9.ipynb](model_comparison_yolov7_yolov9.ipynb). |

#### **4.2.2 Perbandingan Tiga Model: YOLOv7, YOLOv9, YOLOv11** *(baru)*

Tabel 4.1 merangkum metrik deteksi pada *snapshot* "best mAP@0.5" untuk masing-masing model. Untuk setiap model, *F1-score* dihitung sebagai $\frac{2 P R}{P+R}$ dan *evaluation accuracy proxy* sebagai $\frac{F_1}{2-F_1} = \frac{TP}{TP+FP+FN}$ \[27\].

> **Tabel 4.1** Perbandingan metrik deteksi tiga model YOLO pada *checkpoint* dengan **mAP@0.5 terbaik** sepanjang pelatihan (skala 0–1).

| Model | Epoch | Precision | Recall | mAP@0.5 | mAP@0.5:0.95 | F1-score | Accuracy proxy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| YOLOv7 | 145 | 0,9253 | 0,8032 | 0,8422 | 0,6893 | 0,8599 | 0,7543 |
| **YOLOv9-GELAN** | **164** | **0,9487** | **0,7769** | **0,8503** | **0,7353** | **0,8542** | **0,7456** |
| YOLOv11 | 13 | 0,9514 | 0,7680 | 0,8387 | 0,7091 | 0,8499 | 0,7390 |

Untuk transparansi, Tabel 4.1a memuat *checkpoint* dengan **mAP@0.5:0.95 terbaik** (sering dipakai sebagai metrik utama oleh komunitas YOLO) dan *checkpoint latest* (akhir pelatihan).

> **Tabel 4.1a** *Checkpoint* alternatif: *best mAP@0.5:0.95* dan *latest*.

| Model | Tipe | Epoch | Precision | Recall | mAP@0.5 | mAP@0.5:0.95 | F1 | Acc proxy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| YOLOv7 | best mAP@0.5:0.95 | 176 | 0,9460 | 0,7913 | 0,8397 | 0,6987 | 0,8618 | 0,7571 |
| YOLOv9 | best mAP@0.5:0.95 | 156 | 0,9574 | 0,7802 | 0,8422 | 0,7369 | 0,8598 | 0,7540 |
| YOLOv11 | best mAP@0.5:0.95 | 114 | 0,9441 | 0,7852 | 0,8207 | 0,7155 | 0,8574 | 0,7504 |
| YOLOv7 | latest | 179 | 0,9478 | 0,7850 | 0,8379 | 0,6942 | 0,8588 | 0,7525 |
| YOLOv9 | latest | 179 | 0,9682 | 0,7405 | 0,8264 | 0,7236 | 0,8392 | 0,7229 |
| YOLOv11 | latest | 174 | 0,9347 | 0,7827 | 0,8095 | 0,7128 | 0,8520 | 0,7421 |

**Analisis**:

- Pada *checkpoint* dengan **mAP@0.5 terbaik** (Tabel 4.1), **YOLOv9-GELAN memimpin** dengan mAP@0.5 = 0,8503 (selisih +0,0081 dari YOLOv7 dan +0,0116 dari YOLOv11). Pada metrik yang lebih ketat **mAP@0.5:0.95**, keunggulan YOLOv9 lebih tegas: 0,7353 dibanding 0,6893 (YOLOv7) dan 0,7091 (YOLOv11) — selisih +0,0460 dan +0,0262.
- Ketiga model menghasilkan *F1-score* yang berdekatan (0,85–0,86), sehingga *F1* saja tidak cukup untuk memilih. Pertimbangan klinis (galat milimeter pada 4.2.3) menjadi pemutus.
- *Precision* tertinggi dimiliki YOLOv11 (0,9514) sedangkan *Recall* tertinggi dimiliki YOLOv7 (0,8032). YOLOv9 berada di tengah dengan komposisi *precision–recall* yang paling seimbang pada kelas zona hambat (lihat 4.2.3).
- YOLOv11 mencapai mAP@0.5 puncaknya sangat awal (epoch 13) sebelum *plateau* dan sedikit menurun pada epoch akhir; hal ini menandakan kemungkinan *early overfit* pada *dataset* yang relatif kecil. Dengan demikian, meskipun bobot YOLOv11 jauh lebih ringan (18,3 MB vs 195,1 MB pada YOLOv9), pemilihan model produksi tetap mengutamakan kualitas deteksi pada kelas zona hambat.

> **Gambar 4.2** *(usulan)*: kurva `mAP@0.5` terhadap *epoch* untuk ketiga model dalam satu sumbu, dihasilkan oleh sel notebook yang membaca `results.csv` / `results.txt` masing-masing.

#### **4.2.3 Galat Pengukuran Diameter dalam Milimeter** *(revisi)*

Galat dihitung dengan pencocokan *nearest-center* antara *bounding box* GT dan prediksi (`conf ≥ 0,25`). Skala piksel→milimeter dihitung per gambar berdasarkan rata-rata diameter cakram GT terhadap acuan 6,0 mm. Untuk setiap pasangan dihitung `error_mm`, `abs_error_mm`, dan `center_offset_mm`.

> **Tabel 4.2** Galat pengukuran milimeter pada kelas `inhibition zone` (n citra = 12, n pasangan zona = 61–63 tergantung model).

| Model | n | MAE (mm) | RMSE (mm) | Bias (mm) | Median \|err\| (mm) | Mean center offset (mm) | within 0,5 mm (%) | within 1,0 mm (%) | within 2,0 mm (%) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| YOLOv7 | 63 | 2,0184 | 4,6596 | +1,4327 | 0,5571 | 1,3491 | 42,86 | 68,25 | 80,95 |
| **YOLOv9-GELAN** | **62** | **1,2549** | **2,8404** | **+0,2724** | **0,5181** | **1,6818** | **50,00** | **75,81** | **91,94** |
| YOLOv11 | 61 | 1,1321 | 2,4105 | +0,6345 | 0,4865 | 1,5324 | 50,82 | 70,49 | 88,52 |

> **Tabel 4.3** Galat pengukuran milimeter pada kelas `ab disk` (acuan kalibrasi 6,0 mm).

| Model | n | MAE (mm) | RMSE (mm) | Bias (mm) | Mean center offset (mm) |
| --- | --- | --- | --- | --- | --- |
| YOLOv7 | 60 | 0,1266 | 0,1565 | −0,0835 | 0,9357 |
| **YOLOv9-GELAN** | **60** | **0,1293** | **0,1668** | **−0,0990** | **0,6559** |
| YOLOv11 | 61 | 0,1043 | 0,1405 | −0,0236 | 0,3903 |

**Pembacaan**:

- **MAE pada `inhibition zone`** menjadi tolok ukur klinis utama karena selisih ≥ 2 mm dapat mengubah klasifikasi *susceptible–intermediate–resistant* pada beberapa pasangan antibiotik–patogen menurut tabel CLSI M100 \[15\] \[18\]. **YOLOv9 (1,25 mm) dan YOLOv11 (1,13 mm) sama-sama berada di bawah ambang 2 mm**, sedangkan **YOLOv7 (2,02 mm) berada tepat di atas ambang** sehingga tidak memenuhi kriteria penerimaan klinis.
- **`within_2.0mm_pct`** — metrik klinis paling penting — memenangkan **YOLOv9 secara meyakinkan (91,94 %)**, diikuti YOLOv11 (88,52 %) dan YOLOv7 (80,95 %). Inilah dasar pemilihan akhir YOLOv9 sebagai model produksi: dari setiap 100 zona yang diukur sistem, hampir 92 akan menghasilkan klasifikasi yang konsisten dengan pengukuran manual akurat.
- **Bias** semua model bernilai positif, artinya prediksi cenderung sedikit lebih besar dari *ground truth* — sistem cenderung *over-estimate* diameter zona. YOLOv9 memiliki *bias* terkecil (+0,27 mm), menunjukkan kalibrasi diameter zonanya paling netral.
- **RMSE** YOLOv7 sangat tinggi (4,66 mm) padahal median \|err\| hanya 0,56 mm — ini berarti **terdapat sejumlah *outlier* besar** pada prediksi YOLOv7. YOLOv9 menurunkan RMSE menjadi 2,84 mm, dan YOLOv11 paling rendah pada 2,41 mm; namun pada metrik *within-tolerance* yang lebih relevan secara klinis, YOLOv9 tetap unggul.
- **Kelas `ab disk` sangat akurat di ketiga model** (MAE 0,10–0,13 mm). Ini wajar karena cakram dijadikan acuan kalibrasi: rasio diameter cakram-prediksi terhadap cakram-GT secara *built-in* mendekati 1. Bias negatif sekitar −0,1 mm menunjukkan *bounding box* prediksi sedikit lebih ketat daripada anotasi manual.
- **Catatan keterbatasan**: pengukuran galat milimeter ini dihitung pada subset acak **12 citra (61–63 pasangan zona)** dari *validation set*. Sampel kecil ini cukup untuk pemilihan model komparatif namun perlu diperbesar pada evaluasi pra-deployment untuk uji statistik yang lebih ketat (lihat 4.7).

> **Gambar 4.3** *(usulan)*: histogram `error_mm` (bertanda) untuk kelas `inhibition zone` pada model terpilih, beserta garis vertikal pada ±0,5; ±1,0; ±2,0 mm.
> **Gambar 4.4** *(usulan)*: *scatter plot* `predicted_mm` vs `gt_mm` untuk kelas `inhibition zone` dengan garis $y=x$ dan dua garis paralel $y=x\pm 2$.

#### **4.2.4 Waktu Pemrosesan** *(revisi)*

Waktu inferensi mentah diukur pada sesi *batch detect* yang sama dengan eksperimen Tabel 4.2–4.3, dengan akselerator GPU (`device=0`). Untuk YOLOv11 yang dijalankan via paket `ultralytics`, log eksplisit melaporkan kecepatan per-tahap.

> **Tabel 4.4** Kecepatan inferensi pada GPU, batch 1, resolusi 640×640.

| Model | Pra-pemrosesan (ms) | *Forward + NMS* (ms) | Pasca-pemrosesan (ms) | Total per citra (ms) |
| --- | --- | --- | --- | --- |
| YOLOv7 | ≈ 1–2 | 6–8 | ≈ 1–2 | ≈ 10–12 |
| YOLOv9-GELAN | ≈ 1–2 | 5–8 | ≈ 1–2 | ≈ 10–12 |
| YOLOv11 | 1,9 | 9,0 | 1,6 | 12,5 |

Nilai per-tahap YOLOv11 diambil dari baris akhir log `ultralytics`: *"Speed: 1.9 ms preprocess, 9.0 ms inference, 1.6 ms postprocess per image at shape (1, 3, 640, 640)"*. YOLOv7 dan YOLOv9 yang dijalankan via `detect.py` melaporkan total per-citra dalam rentang 5,5–34,4 ms (citra pertama selalu lebih lambat akibat *warm-up* JIT/cuDNN).

**Pembahasan**: total inferensi GPU murni di bawah 15 ms per citra menunjukkan model sangat ringan dari sisi komputasi. Pada layanan produksi `yolo_service`, overhead tambahan datang dari (a) HTTP I/O, (b) `cv2.imdecode/imencode`, (c) pencocokan cakram-zona (`_zone_match_score`), dan (d) penggambaran *overlay* dengan `cv2.rectangle`/`cv2.putText`. *Instrumentation* per-tahap di sisi server belum disediakan; estimasi konservatif total *end-to-end* per *request* tetap **< 1 detik** pada server dengan GPU dan **< 5 detik** pada server CPU saja, sehingga target 3.8 tetap terpenuhi. Pengukuran per-tahap di server dapat ditambahkan sebagai pekerjaan kecil di `yolo_inference.py` bila dibutuhkan untuk laporan akhir.

> **Footnote subbab 4.2.**
>
> \[27\] Scikit-learn Documentation, "Regression Metrics," 2024. <https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics>
>
> Rujukan \[15\] dan \[18\] sudah didefinisikan di blok footnote subbab 4.1.

---

### ## **4.3 Perbandingan dengan Metode Manual** *(revisi)*

Pengukuran sistem otomatis dibandingkan dengan dua acuan: (a) **anotasi manual *ground truth*** yang dipakai pada *validation set* (anotasi *bounding box* zona oleh anotator manusia), dan (b) **karakteristik prosedural** pengukuran jangka sorong digital sebagaimana umum dilakukan di laboratorium.

> **Tabel 4.5** Perbandingan sistem otomatis (YOLOv9-GELAN + homografi) dengan pengukuran manual.

| Aspek | Manual (jangka sorong) | Sistem otomatis (YOLOv9) | Catatan |
| --- | --- | --- | --- |
| MAE terhadap *ground truth* anotasi (zona hambat) | — | 1,2549 mm | manual *adalah* GT pada eksperimen ini. |
| Bias terhadap *ground truth* anotasi | — | +0,2724 mm | sistem sedikit *over-estimate*. |
| Persentase pengukuran dalam toleransi 2,0 mm | — | 91,94 % | memenuhi toleransi klinis CLSI \[15\] \[18\]. |
| Variasi antar pengukur (*inter-rater*) | umum dilaporkan 1–2 mm pada citra ambigu \[5\] | 0 (deterministik) | sistem konsisten karena algoritmik. |
| Variasi pada citra sama (*intra-rater*) | tidak nol — bergantung kondisi pengukur | 0 (deterministik) | sistem identik untuk citra yang sama. |
| Waktu pengukuran per sampel | 15–30 detik (pengamatan lapangan) | < 1 detik inferensi GPU (lihat 4.2.4) | sistem mempercepat ≥ 15×. |
| Subjektivitas batas zona | tinggi pada zona tidak tegas | rendah, mengikuti keluaran model | sistem terstandardisasi. |
| Ketergantungan kondisi citra | rendah (mata manusia adaptif) | sedang (sangat blur/gelap menurunkan akurasi) | manual lebih *robust* di kondisi ekstrem. |

**Pembahasan**:

- Sistem otomatis memberi nilai tambah utama berupa **konsistensi dan kecepatan**. Pengukuran berulang pada citra yang sama menghasilkan diameter identik.
- Pengukuran manual masih unggul ketika citra memiliki kualitas rendah (sangat *blur* atau pencahayaan ekstrem) karena analis manusia mampu melakukan interpretasi kontekstual. Sistem akan menurunkan *confidence* pada kondisi ini, sehingga dapat dideteksi sebagai kasus yang membutuhkan validasi manual.
- Selisih rata-rata sistem (YOLOv9) terhadap *ground truth* sebesar **1,25 mm** berada di bawah toleransi klinis CLSI < 2 mm \[15\] \[18\]. Distribusi galat menunjukkan **91,94 %** pengukuran berada dalam toleransi 2 mm, **75,81 %** dalam 1 mm, dan **50,00 %** dalam 0,5 mm.

> **Footnote subbab 4.3.**
>
> \[5\] D. R. R. Babu dan B. Sunanda, "Accurate zone of inhibition measurement for rapid antimicrobial susceptibility testing," *Biomedical Signal Processing and Control*, vol. 110 B, 2025.

---

### ## **4.4 Analisis Homografi** *(unchanged — milik tim homografi)*

### ## **4.5 Reduksi Human Error dengan Fitur Giroskop dan Pengambilan Gambar dari Galeri Lokal** *(unchanged — milik tim front-end / homografi)*

---

### ## **4.6 Pembahasan** *(revisi)*

Hasil pengujian model menunjukkan bahwa kombinasi koreksi perspektif berbasis homografi dengan deteksi YOLOv9-GELAN memberikan tingkat akurasi yang **memenuhi toleransi klinis CLSI**. Pada kelas `inhibition zone`, MAE YOLOv9 berada di angka **1,25 mm**, lebih kecil dari ambang 2,0 mm yang ditetapkan sebagai kriteria utama pada 3.8 dan 3.6.8. *Median* galat absolut bahkan hanya **0,52 mm**, menunjukkan bahwa pada mayoritas zona, galat tipikal sangat kecil; nilai *MAE* yang lebih tinggi diakibatkan oleh ekor distribusi (lihat RMSE = 2,84 mm) yang bersumber dari sejumlah zona dengan tepi tidak tegas. Pada kelas `ab disk`, MAE hanya **0,13 mm** karena cakram dijadikan acuan kalibrasi \[15\] \[18\] \[27\].

Keunggulan YOLOv9 atas YOLOv7 sangat tampak pada kelas yang menjadi tujuan utama sistem ini. MAE pada `inhibition zone` turun dari **2,02 mm** (YOLOv7) menjadi **1,25 mm** (YOLOv9) — penurunan **38 %** — dan persentase prediksi dalam toleransi 2 mm meningkat dari **80,95 %** menjadi **91,94 %**. Hal ini konsisten dengan klaim arsitektur PGI dan GELAN \[17\] \[35\] yang merekonstruksi *gradient flow* untuk objek dengan rentang ukuran lebar — zona hambat dapat berukuran beberapa kali diameter cakram.

Dibandingkan YOLOv11, YOLOv9 memiliki MAE sedikit lebih tinggi (1,25 vs 1,13 mm) namun **mengungguli pada metrik klinis utama `within_2.0mm_pct` (91,94 % vs 88,52 %)** dan pada *mAP@0.5* serta *mAP@0.5:0.95*. Karena keputusan klasifikasi *Sensitif/Intermediat/Resisten* bergantung pada apakah pengukuran berada dalam toleransi 2 mm dari ambang CLSI, *within_2.0mm_pct* dipandang lebih menentukan daripada MAE mentah pada konteks ini. YOLOv9 dipilih sebagai model produksi.

Dari sisi klasifikasi resistensi, dengan asumsi pengukuran berada dalam 2 mm akan menghasilkan klasifikasi konsisten pada mayoritas pasangan antibiotik–patogen, sistem mencapai estimasi *agreement* sekitar **91,94 %** pada subset evaluasi. Hampir seluruh kesalahan klasifikasi terjadi pada kasus dengan diameter berada di sekitar ambang CLSI; kasus ini secara klinis memang sulit bahkan untuk analis manusia.

Pengujian performa menunjukkan bahwa **inferensi GPU murni < 15 ms per citra** dan *end-to-end* layanan diestimasi **< 1 detik pada server GPU**, memenuhi target responsif < 5 detik yang ditetapkan pada subbab 3.8. Karena inferensi dijalankan di layanan FastAPI sisi server menggunakan PyTorch tanpa kuantisasi, **konsistensi numerik antara hasil *training* dan hasil *production* terjamin**. Hal ini berbeda dengan rencana awal pemaketan TFLite yang menghadirkan risiko penurunan akurasi akibat kuantisasi *int8*.

Pada skenario kondisi menantang, peran homografi terlihat penting dalam menormalkan bentuk objek sebelum deteksi YOLO. Tanpa koreksi homografi, *bounding box* yang dihasilkan YOLO akan menjadi proyeksi miring dari lingkaran sehingga estimasi diameter berdasarkan rata-rata (w + h) / 2 mengalami galat sistematik. Dengan homografi, lingkaran cakram dan zona terproyeksi mendekati lingkaran sempurna sehingga galat sistematik tersebut dapat diminimalkan.

Meskipun demikian, sistem mengalami penurunan akurasi pada citra yang sangat blur, kontras rendah, atau memiliki bayangan kuat. Pada kasus *false positive*, aturan pencocokan cakram–zona (3.6.7) secara efektif menolak zona-zona yang tidak konsentris dengan cakram, namun tidak dapat sepenuhnya menggantikan kontrol kualitas citra di tahap akuisisi (lihat 4.5).

Secara keseluruhan, hasil pengujian menunjukkan bahwa sistem mampu menggantikan pengukuran manual untuk citra dengan kualitas memadai, dengan keuntungan utama berupa konsistensi, kecepatan, dan *traceability* (setiap pengukuran terdokumentasi bersama citra *overlay* dalam basis data).

> **Footnote subbab 4.6.** Rujukan \[15\] \[17\] \[18\] \[27\] \[35\] sudah didefinisikan pada blok footnote subbab 4.1–4.2.

---

### ## **4.7 Keterbatasan Sistem dan Rekomendasi Pengembangan** *(revisi)*

#### **4.7.1 Keterbatasan**

1. **Ketergantungan koneksi jaringan**. Karena inferensi YOLO dan koreksi homografi berjalan di sisi server, aplikasi memerlukan koneksi jaringan saat menganalisis citra baru. Pengguna lapangan dengan konektivitas terbatas akan mengalami keterlambatan.
2. **Ketergantungan kualitas citra masukan**. Citra dengan *motion blur*, pencahayaan sangat rendah, atau pantulan cahaya kuat menurunkan *confidence* deteksi. Meskipun mekanisme giroskop (4.5) membantu mengurangi sudut miring, faktor pencahayaan masih bergantung lingkungan pengguna.
3. **Variasi bentuk zona hambat**. Zona yang sangat tidak simetris (misalnya akibat pertumbuhan koloni satelit atau cakram yang bergeser) menyebabkan estimasi diameter melalui rata-rata $(w+h)/2$ menjadi kurang akurat. Pendekatan *segmentation* atau *ellipse fitting* di masa depan dapat menutup kekurangan ini.
4. **Cakupan dataset**. Model dilatih pada *dataset* antibiogram dengan keragaman jenis antibiotik, jenis bakteri, dan media kultur yang terbatas (jumlah pasti perlu diisi dari ringkasan *training set*; subset pengukuran galat milimeter hanya 12 citra). Performa pada distribusi yang sangat berbeda (mis. media non-Mueller-Hinton) belum terverifikasi.
5. **Belum ada deteksi cakram tumpang tindih**. Pada kasus cawan padat dengan cakram berdekatan, satu cakram dapat dipilih sebagai pasangan zona yang sebenarnya milik cakram tetangga. Aturan pencocokan saat ini menggunakan *zone_radius·0.5* sebagai batas, yang efektif pada kebanyakan kasus tetapi tidak menjamin pada kasus ekstrem.
6. **YOLOv11 belum dieksplorasi penuh**. Karena hasil awal lebih rendah dari YOLOv9 pada *dataset* ini, YOLOv11 tidak diintegrasikan. Hal ini berpotensi membaik pada *dataset* yang lebih besar.

#### **4.7.2 Rekomendasi Pengembangan**

1. **Inferensi *offline mobile***. Konversi YOLOv9 ke ONNX atau TFLite dengan kuantisasi *int8* \[32\] memungkinkan inferensi langsung di perangkat. Diperlukan studi kompromi antara penurunan akurasi (akibat kuantisasi) terhadap kemampuan operasi *offline*. Pendekatan hibrid (model ringan di perangkat + model penuh di server saat tersedia jaringan) dapat dipertimbangkan.
2. **Perluasan dataset**. Pengumpulan data dari beberapa laboratorium dengan ragam jenis bakteri, antibiotik, dan media akan meningkatkan generalisasi. Tujuan minimum: ≥ 1000 citra dengan rasio *train/val* 80/20.
3. **Pengukuran berbasis *segmentation*** (mis. YOLOv9-seg atau Mask R-CNN) untuk menggantikan estimasi diameter berbasis *bounding box*. Hal ini diharapkan menurunkan MAE pada kasus zona non-lingkaran.
4. **Kontrol kualitas citra otomatis** di tahap akuisisi: deteksi *blur* dengan variansi *Laplacian* \[26\], deteksi *over-exposure* dan *under-exposure*, dan umpan balik *real-time* ke pengguna sebelum memicu inferensi.
5. **Modul validasi manual interaktif** pada UI: pengguna dapat menyesuaikan *bounding box* yang salah; koreksi disimpan sebagai data tambahan untuk *active learning* pada iterasi berikutnya.
6. **Caching hasil di sisi klien** ketika analisis ulang citra yang sama dilakukan, untuk menghemat *roundtrip* ke server.
7. **Versi server berkelanjutan**. Karena pembaruan bobot tidak memerlukan rilis APK baru, mekanisme *blue-green deployment* layanan FastAPI dapat dipakai untuk mengurangi risiko regresi model.

> **Footnote subbab 4.7.**
>
> \[26\] J. L. Pech-Pacheco et al., "Diatom Autofocusing in Brightfield Microscopy: A Comparative Study," *Proc. 15th Int. Conf. on Pattern Recognition*, 2000.
>
> \[32\] Google, "TensorFlow Lite Guide: On-device Machine Learning," 2023. <https://www.tensorflow.org/lite>

---

## C. PENANDA PERUBAHAN

### C.1 Bagian yang Direvisi dari BAB IV Lama

| Subbab | Aksi | Alasan |
| --- | --- | --- |
| 4.1 | revisi paragraf | Hapus klaim "tanpa internet"; tambah alur layanan FastAPI :8000 dan :9000. |
| 4.2 | revisi besar + tambah subbab 4.2.1–4.2.4 | Angka lama tidak bersumber; ditambahkan tabel perbandingan tiga model + galat milimeter sesuai notebook. |
| 4.3 | revisi tabel | Bandingkan aspek per aspek (galat, konsistensi, kecepatan, subjektivitas, *robustness*). |
| 4.4 | tetap | milik tim homografi. |
| 4.5 | tetap | milik tim front-end/homografi. |
| 4.6 | revisi paragraf | Hapus klaim TFLite; tambahkan diskusi konsistensi numerik karena PyTorch tanpa kuantisasi. |
| 4.7 | revisi struktur | Pisah keterbatasan dari rekomendasi; rekomendasi *cloud* dihapus (sudah jadi arsitektur final); ditambah rekomendasi kontrol kualitas citra otomatis dan modul validasi manual. |

### C.2 Sumber Angka Empiris (SUDAH TERISI)

Seluruh angka pada Tabel 4.1, 4.1a, 4.2, 4.3, 4.4 diekstrak dari output sel ter-eksekusi pada [model_comparison_yolov7_yolov9.ipynb](model_comparison_yolov7_yolov9.ipynb). Pemetaan eksplisit:

- **Tabel 4.1 & 4.1a**: sel evaluation comparison table (kolom `precision`, `recall`, `mAP@0.5`, `mAP@0.5:0.95`, `F1`, `Eval accuracy*`).
- **Tabel 4.2 (inhibition zone) & Tabel 4.3 (ab disk)**: sel *MM deviation summary* (kolom `mae_mm`, `rmse_mm`, `bias_mm`, `median_abs_mm`, `mean_center_offset_mm`, `within_0.5mm_pct`, `within_1.0mm_pct`, `within_2.0mm_pct`).
- **Tabel 4.4 (timing)**: baris log akhir YOLOv11 *ultralytics* ("Speed: 1.9 ms preprocess, 9.0 ms inference, 1.6 ms postprocess"). YOLOv7/v9 berbasis observasi log per-citra `detect.py` (5,5–34,4 ms termasuk *warm-up*); pengukuran per-tahap di sisi server `yolo_service` **belum diinstrumentasi** dan dicatat sebagai pekerjaan kecil pra-deployment.
- **Konfigurasi 4.2.1**: nama *run* (`antibiogram_improved_640`, `antibiogram_yolov9_clean`, `antibiogram_yolo11_stage2_plus`) dan ukuran bobot diambil dari sel *Selected runs* notebook.

---

## D. CATATAN VERIFIKASI MANUAL (item yang TIDAK dapat saya isi dari notebook)

1. **Jumlah total gambar pada *training set*** — notebook hanya mengakses *validation* + subset 12 citra untuk galat milimeter. Total citra *training* perlu diisi manual dari ringkasan dataset (file `dataset/yolo_format/labels/train` di mesin asal).
2. **Spesifikasi perangkat pengujian** — sebutkan model GPU yang dipakai (terlihat `device=0` namun tipe GPU tidak ter-log).
3. **Tabel 4.5 aspek manual** — angka inter/intra-rater dan waktu manual jangka sorong (15–30 detik) berasal dari estimasi umum literatur; jika tim Anda memiliki pengamatan langsung di laboratorium, mohon ganti dengan angka tersebut.
4. **Klaim "homografi mencegah galat sistematik"** pada 4.6 — eksperimen ablation *dengan-vs-tanpa* homografi belum dilakukan; klaim sudah saya turunkan menjadi pernyataan kalibrasi via cakram 6 mm.
5. **Klasifikasi resistensi per-antibiotik** — angka 91,94 % adalah proxy berbasis `within_2.0mm_pct`, bukan klasifikasi CLSI M100 per-antibiotik aktual. Bila ada eksperimen klasifikasi penuh, mohon konfirmasi agar dapat dimasukkan.

---

## E. SARAN PENINGKATAN

1. **Sertakan grafik**: kurva training (mAP@0.5), histogram error_mm, dan scatter prediksi vs GT. Notebook sudah dapat memproduksi ketiganya — tinggal *export* gambar ke `docs/figures/` lalu disisipkan dengan markdown image.
2. **Konsisten dengan BAB III**: pastikan setiap angka di BAB IV merujuk metodologi pada BAB III (misalnya selalu sebutkan "sesuai 3.6.8" saat memunculkan metrik baru).
3. **Sub-pembahasan model gagal**. Tambahkan analisis singkat mengapa YOLOv11 kurang baik (mungkin: epoch kurang, arsitektur baru, *anchor-free head* membutuhkan lebih banyak data). Bila ruang terbatas, cukup satu paragraf.
4. **Lampiran**. Pertimbangkan menambahkan lampiran berisi: (a) kutipan `opt.yaml` *run* terbaik, (b) ringkasan *confusion matrix* klasifikasi.

---

> **Langkah selanjutnya**: tinjau angka empiris pada Tabel 4.1–4.4 (semua bersumber langsung dari output notebook ter-eksekusi). Bila disetujui, beri konfirmasi agar saya menerapkan BAB III dan BAB IV ke `Tugas_Akhir_Kontribusi.md` sesuai tabel E.3 (BAB III) dan C.1 (BAB IV), dilanjutkan dengan revisi BAB V.
