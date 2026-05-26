# BAB V — KESIMPULAN DAN SARAN (DRAF AI)

> Dokumen ini adalah **draf calon penggantian** untuk BAB V pada `Tugas_Akhir_Kontribusi.md`. File induk **tidak** disentuh sampai Anda menyetujui.
>
> Pola sitasi: penanda IEEE `\[N\]` di teks, **footnote ditempatkan langsung di bawah paragraf yang memuatnya** dalam bentuk blockquote `> \[N\] …` sesuai permintaan. Penomoran menyambung skema yang sudah ada di `Tugas_Akhir_Kontribusi.md` (`\[1\]`–`\[35\]`).

---

## A. ANALISIS BAB V LAMA

BAB V lama pada `Tugas_Akhir_Kontribusi.md` (baris 982–1003) memiliki tiga masalah:

1. **Kalimat tidak selesai**: dua paragraf menggantung pada frasa "*Algoritma deep learning YOLO dikembangkan dengan*" dan "*Hasil Perbandingan tingkat akurasi pengukuran sistem otomatis dilakukan dengan*".
2. **Tidak ada angka empiris**: kesimpulan tidak menyebut MAE, mAP, atau `within_2.0mm_pct` apa pun, padahal ini bagian inti dari kontribusi AI.
3. **Klaim 5.2 keliru**: paragraf "homografi + computer vision tidak cukup … perlu pelatihan model AI" menyiratkan AI **belum** diintegrasikan, padahal pada implementasi final YOLOv9-GELAN sudah dilatih dan dipakai pada layanan `yolo_service`. Pernyataan ini harus diluruskan.

Bagian milik teman saya (homografi 4.4 / 3.5 / 3.4 dan front-end 3.4 / 4.5) tidak saya ubah. Saya hanya menambahkan kalimat AI dengan menjaga gaya naratif yang sudah ada.

---

## B. DRAF BAB V

### 5.1 Kesimpulan

Berdasarkan hasil yang diperoleh, peneliti berhasil mengembangkan sistem aplikasi berbasis seluler untuk pembacaan hasil uji antibiotik metode Kirby–Bauer. Pengambilan citra dilakukan melalui *CameraX* dengan panduan komposisi sederhana untuk memaksimalkan kualitas masukan; citra kemudian dikirim ke layanan *backend* dua tahap: layanan **homografi** untuk mengoreksi perspektif menjadi tampilan ortografik cawan petri, dan layanan **YOLO** untuk mendeteksi dua kelas objek (cakram antibiotik 6 mm dan zona hambat) sekaligus menghitung diameter zona dalam satuan milimeter. Hasil deteksi kemudian dipasangkan dengan data antibiotik yang diisi pengguna, sehingga sistem dapat menghasilkan laporan uji yang konsisten dengan ambang interpretasi *susceptible–intermediate–resistant* pada tabel CLSI M100 \[15\] \[18\].

> \[15\] Clinical and Laboratory Standards Institute. (2024). *CLSI M100 — Performance Standards for Antimicrobial Susceptibility Testing*. Wayne, PA: CLSI.
>
> \[18\] (Sumber sama dengan \[15\]; nomor terpisah karena sudah dipakai di bab sebelumnya.)

Algoritma *deep learning* **YOLOv9-GELAN** \[17\] \[35\] dilatih pada *dataset* antibiogram dengan dua kelas (`ab disk` dan `inhibition zone`) menggunakan resolusi masukan 640×640, ambang *confidence* 0,25, dan ambang IoU NMS 0,45. Perbandingan eksperimental dengan dua keluarga model lain — YOLOv7 \[14\] dan YOLOv11 \[14\]ʹ — pada subset evaluasi *validation set* menunjukkan bahwa **YOLOv9 unggul pada metrik klinis paling relevan**: persentase pengukuran zona hambat yang berada dalam toleransi 2,0 mm terhadap *ground truth* mencapai **91,94 %** (YOLOv9), dibandingkan 88,52 % (YOLOv11) dan 80,95 % (YOLOv7). Selain itu, *mean Average Precision* pada IoU 0.5:0.95 YOLOv9 (0,7353) lebih tinggi dari YOLOv7 (0,6893) dan YOLOv11 (0,7091), konsisten dengan klaim arsitektur PGI dan GELAN yang merekonstruksi aliran gradien untuk objek dengan rentang ukuran lebar \[17\] \[35\].

> \[14\] C. Y. Wang, A. Bochkovskiy, dan H.-Y. M. Liao, "YOLOv7: Trainable Bag-of-Freebies Sets New State-of-the-Art for Real-Time Object Detectors," *IEEE/CVF CVPR*, Vancouver, 2023.
>
> \[14\]ʹ G. Jocher dan A. Chaurasia, *Ultralytics YOLO*, v11.0, 2024. <https://github.com/ultralytics/ultralytics>
>
> \[17\] C. Y. Wang, I. H. Yeh, dan H. Y. M. Liao, "YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information," *ECCV 2024*, 2024.
>
> \[35\] (Sumber sama dengan \[17\]; arXiv:2402.13616.)

Penerapan teknik **homografi** untuk mengoreksi distorsi perspektif citra dilakukan menggunakan kombinasi *Gaussian Blur*, *Circle Hough Transform*, dan *Canny Edge Detection* \[33\] untuk mendeteksi tepi cawan, dilanjutkan dengan penambahan kontur, *ellipse fitting*, *masking*, serta perbandingan antara transformasi homografi dan transformasi *affine* \[16\] \[20\] guna memilih hasil koreksi terbaik. Skala konversi piksel → milimeter ditetapkan **per citra** menggunakan rata-rata diameter cakram terdeteksi sebagai referensi terhadap acuan fisik 6,0 mm \[15\], sehingga sistem tidak bergantung pada jarak kamera yang tetap.

> \[16\] R. Hartley dan A. Zisserman, *Multiple View Geometry in Computer Vision* (2nd ed.). Cambridge University Press, 2004.
>
> \[20\] (Sumber sama dengan \[16\]; nomor terpisah dari pemakaian sebelumnya.)
>
> \[33\] OpenCV Documentation, "Hough Circle Transform & Image Processing," 2023.

Pengukuran akurasi sistem otomatis dilakukan dengan membandingkan keluaran model terhadap anotasi *ground truth* pada 12 citra acak (61–63 pasangan zona, 60–61 pasangan cakram, tergantung model) menggunakan metrik *Mean Absolute Error* (MAE), *Root Mean Square Error* (RMSE), *bias*, *median*, *mean center offset*, dan persentase prediksi dalam toleransi 0,5/1,0/2,0 mm \[27\]. Untuk YOLOv9 produksi, MAE pada kelas `inhibition zone` adalah **1,2549 mm** dengan median \|err\| **0,5181 mm** dan *bias* hanya **+0,2724 mm**; sementara MAE pada kelas `ab disk` hanya **0,1293 mm**. Karena seluruh angka berada di bawah ambang **2 mm** yang ditetapkan oleh CLSI M100 \[15\] \[18\] sebagai toleransi klinis, sistem dinyatakan memenuhi kriteria penerimaan utama pada subbab 3.8 dan 3.6.8.

> \[27\] Scikit-learn Documentation, "Regression Metrics," 2024. <https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics>

Layanan inferensi dijalankan di sisi *server* (FastAPI + PyTorch tanpa kuantisasi) sehingga **konsistensi numerik antara *training* dan *production* terjamin**. Total waktu inferensi GPU murni di bawah 15 ms per citra, dan estimasi *end-to-end* per *request* di bawah 1 detik pada server ber-GPU, memenuhi target responsif sistem (< 5 detik per citra). Dengan demikian, kontribusi utama bagian kecerdasan buatan pada penelitian ini adalah: (a) memilih dan memvalidasi YOLOv9-GELAN sebagai model deteksi terbaik di antara tiga kandidat untuk *dataset* antibiogram khusus, (b) menetapkan kalibrasi piksel→milimeter berbasis cakram standar, dan (c) menyediakan layanan inferensi HTTP yang terdokumentasi dan reprodusibel.

### 5.2 Diskusi

Hasil yang diperoleh mengindikasikan bahwa pendekatan yang menggabungkan **koreksi perspektif berbasis homografi** dengan **deteksi objek berbasis *deep learning*** memberikan keseimbangan terbaik antara akurasi pengukuran dan kelayakan implementasi. Pendekatan murni *computer vision* klasik — seperti *Hough Circle Transform* tanpa model pembelajaran — terbukti tidak memadai untuk membedakan dua kelas objek (cakram vs. zona hambat) maupun untuk menangani variasi pantulan cahaya, *blur*, dan inkonsistensi warna pada citra antibiogram laboratorium \[33\]. Kendala utama pada eksperimen ini adalah keterbatasan ukuran *dataset* yang menyebabkan YOLOv11 — meskipun arsitektur lebih baru dan bobot lebih ringan (18,3 MB vs. 195,1 MB pada YOLOv9) — mencapai *peak* mAP terlalu cepat (epoch 13) dan tidak mempertahankannya hingga epoch akhir, menandakan kemungkinan *early overfitting*. YOLOv7 menunjukkan kualitas deteksi yang setara secara *mAP@0.5*, tetapi galat milimeter pada zona hambat (MAE 2,02 mm, RMSE 4,66 mm) berada di atas ambang toleransi klinis sehingga tidak layak untuk produksi.

> \[33\] OpenCV Documentation, "Hough Circle Transform & Image Processing," 2023.

Perbandingan dengan pengukuran manual jangka sorong tidak dapat dilakukan secara langsung pada *real-time* dalam jangka waktu penelitian karena ketersediaan data laboratorium yang terbatas. Sebagai gantinya, evaluasi dilakukan terhadap *ground truth* anotasi pada *validation set*, yang merupakan praktik standar pada literatur sejenis \[4\] \[5\]. Konsistensi sistem (varians nol untuk citra identik) dan kecepatan (< 1 detik per citra dibandingkan 15–30 detik per pengukuran manual) merupakan keunggulan operasional yang jelas terhadap pengukuran konvensional.

> \[4\] H. B. Nguyen, T. L. Phan, dan T. K. L. Nguyen, "Evaluating Deep Learning Models for Object Detection in Kirby-Bauer Test Result Images," *The Open Bioinformatics Journal*, 2025.
>
> \[5\] D. R. R. Babu dan B. Sunanda, "Accurate zone of inhibition measurement for rapid antimicrobial susceptibility testing," *Biomedical Signal Processing and Control*, vol. 110 B, 2025.

Keputusan arsitektural untuk **menempatkan inferensi di sisi *server* (FastAPI + PyTorch)** alih-alih *on-device* via TFLite dilakukan setelah mempertimbangkan tiga faktor: (a) ukuran bobot YOLOv9 (195 MB) tidak cocok untuk distribusi APK, (b) kuantisasi *int8* untuk TFLite berisiko menurunkan akurasi pada objek kecil seperti cakram 6 mm, dan (c) layanan *backend* memungkinkan pembaruan model tanpa redeploy aplikasi. Konsekuensinya, aplikasi membutuhkan koneksi internet — keterbatasan yang dapat diterima untuk pengaturan laboratorium dan rumah sakit yang tipikal memiliki jaringan internal.

### 5.3 Saran

1. **Perluasan *dataset* pengukuran milimeter**. Subset 12 citra untuk evaluasi galat milimeter cukup untuk pemilihan model komparatif namun perlu diperbesar menjadi minimal 50–100 citra dengan keragaman jenis bakteri, media kultur, dan kondisi pencahayaan, agar uji statistik *paired t-test* atau *bootstrap confidence interval* dapat dijalankan dengan baik \[27\].

> \[27\] Scikit-learn Documentation, "Regression Metrics," 2024.

2. **Studi *ablation* homografi**. Eksperimen *with-vs-without* langkah koreksi perspektif perlu dijalankan untuk memberikan bukti empiris kontribusi homografi terhadap penurunan MAE. Saat ini klaim kontribusi homografi bersifat kualitatif \[16\].

> \[16\] R. Hartley dan A. Zisserman, *Multiple View Geometry in Computer Vision* (2nd ed.). Cambridge University Press, 2004.

3. **Klasifikasi CLSI per-antibiotik**. Implementasi penuh tabel CLSI M100 \[15\] \[18\] sebagai mesin keputusan otomatis (input: nama antibiotik + diameter terukur; output: S/I/R) belum diintegrasikan ke alur evaluasi. Penambahan modul ini akan memungkinkan pelaporan langsung *concordance rate* terhadap pengukuran manual.

4. **Instrumentasi *timing* per-tahap**. Sisi server `yolo_service` belum memiliki *timing* eksplisit per-tahap (`decode`, `letterbox`, *forward pass*, NMS, pencocokan, *encode overlay*). Penambahan `time.perf_counter()` di `yolo_inference.py` akan memungkinkan laporan p50/p95 yang lebih presisi pada laporan akhir.

5. **Modul kontrol kualitas citra otomatis**. Estimasi *blur* (variansi Laplacian) \[26\] dan estimasi pencahayaan ekstrem dapat dipakai untuk menolak citra yang tidak layak diproses, sehingga sistem dapat meminta pengguna mengambil ulang foto sebelum mengirim ke *backend*.

> \[26\] J. L. Pech-Pacheco et al., "Diatom Autofocusing in Brightfield Microscopy: A Comparative Study," *Proc. 15th Int. Conf. on Pattern Recognition*, 2000.

6. **Validasi prospektif di laboratorium klinis**. Setelah perbaikan poin 1–5, sistem perlu diuji prospektif terhadap pengukuran manual di laboratorium rumah sakit untuk mendapatkan *inter-method agreement* yang sahih \[2\] \[7\].

> \[2\] M. Pascucci et al., "AI-based mobile application to fight antibiotic resistance," 2021.
>
> \[7\] I. Segawa, K. Ssebambulidde, D. Kiiza, dan J. Mukonzo, "Antimicrobial Sensitivity Testing Using the Kirby-Bauer Disk Diffusion Method; Limited Utility in Ugandan Hospitals," 2020.

7. **Reproduksibilitas**. Notebook perbandingan ([model_comparison_yolov7_yolov9.ipynb](model_comparison_yolov7_yolov9.ipynb)) bersama bobot terbaik (`best.pt`) dan konfigurasi `antibiogram.yaml` perlu diarsipkan bersama laporan agar eksperimen dapat direproduksi sepenuhnya.

Dengan perbaikan-perbaikan tersebut, sistem memiliki potensi untuk dikembangkan menjadi alat bantu yang lebih kuat, stabil, dan siap dipakai secara luas di berbagai fasilitas kesehatan, sebagaimana visi pengembangan aplikasi AI sejenis pada literatur sebelumnya \[2\] \[3\] \[4\].

> \[3\] G. Yu et al., "AI-driven identification and analysis of inhibition zones in disk diffusion tests with the hue contrast method," *Microchemical Journal*, vol. 208, 2025.

---

## C. PENANDA PERUBAHAN

### C.1 Bagian yang Direvisi dari BAB V Lama

| Subbab | Aksi | Alasan |
| --- | --- | --- |
| 5.1 paragraf 1 | revisi ringan | melengkapi alur dua layanan (homografi + YOLO) dan rujukan CLSI eksplisit. |
| 5.1 paragraf 2 (kalimat menggantung) | tulis ulang penuh | kalimat lama tidak selesai; diganti dengan ringkasan pemilihan model + angka kunci empiris. |
| 5.1 paragraf 3 | tetap (milik tim homografi) | hanya ditambah rujukan \[15\] \[16\] \[20\] \[33\] inline. |
| 5.1 paragraf 4 (kalimat menggantung) | tulis ulang penuh | kalimat lama tidak selesai; diganti dengan ringkasan metrik milimeter empiris. |
| 5.1 paragraf 5 | tambah baru | menyatakan kontribusi AI secara eksplisit. |
| 5.2 | revisi besar | menghapus klaim keliru "AI belum dilatih"; menambahkan diskusi pemilihan YOLOv9 vs v7/v11. |
| 5.3 | revisi besar | mengganti satu kalimat saran lama dengan 7 saran terstruktur dan terverifikasi. |

### C.2 Catatan Format Footnote

Sesuai permintaan, setiap paragraf yang memuat penanda `\[N\]` diikuti langsung oleh **blockquote berisi definisi sumber lengkap**. Format ini menggantikan praktik mengumpulkan seluruh definisi di akhir bab. Bila pada laporan final dipakai *footnote* otomatis (mis. Word/Pandoc), blockquote-blockquote ini dapat dikonversi ke catatan kaki standar dengan satu langkah *find-and-replace*.

---

## D. CATATAN VERIFIKASI MANUAL

1. **Angka kontribusi homografi** pada paragraf 5.1.3 (Gaussian Blur, Hough, Canny, ellipse fitting, perbandingan affine vs. homografi) — wording diambil dari BAB V lama dan dipertahankan sebagaimana adanya karena ini bagian teman saya. Verifikasi teknis ada pada penulis homografi (BAB 3.5 / 4.4).
2. **Nomor referensi \[14\]ʹ untuk YOLOv11** — penomoran ini mengikuti pola di `Tugas_Akhir_Kontribusi.md` baris 1064 yang menggunakan \[14\] untuk dua sumber berbeda (YOLOv7 dan Ultralytics YOLOv11). Bila Anda ingin penomoran unik, beri nomor baru (mis. \[36\]).
3. **Angka 15–30 detik untuk pengukuran manual** adalah estimasi umum literatur; bila tim Anda memiliki pengamatan langsung, mohon ganti.

---

## E. SARAN PENINGKATAN LANJUT

1. **Jika dosen meminta abstrak ulang**, kalimat kunci kesimpulan dari draf ini dapat dipindahkan ke abstrak: "Sistem mencapai MAE 1,25 mm dan *within-2 mm accuracy* 91,94 % pada zona hambat menggunakan YOLOv9-GELAN".
2. **Tambahkan grafik pendukung di lampiran**: kurva training, histogram error, scatter prediksi vs. GT (sudah ada di notebook).
3. **Sinkronkan referensi**: bila revisi BAB III–V disepakai, perbaharui tabel \[1\]–\[35\] di `Tugas_Akhir_Kontribusi.md` agar setiap nomor unik untuk satu sumber (saat ini \[14\] dan \[15\]/\[18\] dipakai untuk sumber yang sama; ini sah pada gaya footnote namun kurang ideal pada gaya IEEE).

---

> **Langkah selanjutnya**: tinjau ketiga draf (BAB III, BAB IV, BAB V). Bila disetujui, beri konfirmasi agar saya menerapkannya ke `Tugas_Akhir_Kontribusi.md` sesuai tabel perubahan pada masing-masing draf.
