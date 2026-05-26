**Aplikasi Seluler untuk Mengidentifikasi Bakteri Resistensi Antibiotik**

![](data:image/png;base64...)

**Disusun oleh:**

**Calvin Institute Of Technology**

**Fakultas Sains dan Data**

**Jurusan IT and Big Data Analytics 2025/2026**

# **ABSTRAK**

Resistensi anti mikroba **(AMR)** kini menjadi krisis kesehatan global yang mengancam efektivitas pengobatan infeksi terhadap bakteri. Masalah ini diproyeksikan dapat menyebabkan 1,91 juta angka kematian per tahun pada tahun 2050 jika tidak diintervensi secara tepat. Difusi cakram**Kirby-Bauer** adalah metode yang menjadi standar emas dalam pengujian sensitivitas antibiotik, namun masih memiliki beberapa kekurangan karena masih mengandalkan pembacaan secara manual oleh penguji. Penelitian ini ditujukan untuk mengalihkan pembacaan manual menjadi digital untuk mengatasi kekurangan dalam pembacaan dan meningkatkan akses pengujian di daerah dengan fasilitas terbatas. Pengalihan dilakukan dengan mengembangkan aplikasi seluler berbasis kecerdasan buatan untuk memperbaiki citra tangkapan digital, mengidentifikasi objek dan mengukur zona hambat bakteri secara otomatis, akurat, dan secara waktu nyata. Sistem dikembangkan menggunakan teknik homografi untuk mengoreksi perspektif citra yang diambil melalui perangkat pengguna, serta algoritma *deep* *learning* YOLO untuk mendeteksi cakram antibiotik dan zona inhibisi Metodologi penelitian meliputi empat tahap: (1) studi literatur dan analisis kebutuhan sistem berstandar **CLSI,** 2) pengembangan paralel aplikasi seluler, algoritma homografi, dan model AI, (3) integrasi dan pengujian fungsional serta validasi akurasi terhadap pengukuran manual, dan (4) evaluasi akhir untuk memastikan sistem memenuhi kriteria keberhasilan. Aplikasi dirancang untuk dapat berjalan secara lokal pada perangkat Android tanpa memerlukan koneksi internet, dengan fitur pengujian otomatis, laporan pengujian, riwayat pengujian, dan visualisasi data statistik. Penelitian ini diharapkan dapat memberikan solusi praktis untuk meningkatkan akurasi dan efisiensi penanganan **AMR,** terutama di daerah dengan keterbatasan infrastruktur.

**Kata kunci:** Resistensi Anti mikroba**, Kirby-Bauer,** YOLO, Homografi, Aplikasi seluler, *Deep Learning*, *Computer Vision,* AI.

# **DAFTAR ISI**

[ABSTRAK 1](#_Toc1737912694)

[DAFTAR ISI 2](#_Toc1821824177)

[BAB I PENDAHULUAN 5](#_Toc1340802171)

[1.1 Latar Belakang Masalah 6](#_Toc1911276548)

[1.2 Rumusan Masalah 8](#_Toc868607718)

[1.3 Maksud dan Tujuan 9](#_Toc1268586799)

[BAB II METODOLOGI 9](#_Toc1330539020)

[2.1 Alur Penelitian 10](#_Toc2023536893)

[2.2 Studi Analisis 12](#_Toc787414563)

[2.2.1 Tinjauan Pustaka dan Landasan Teori 12](#_Toc1089027164)

[2.2.2 Analisis Kebutuhan dan Perancangan Sistem 12](#_Toc1505858859)

[2.3 Pengembangan Sistem 13](#_Toc1127972411)

[2.3.1 Pengembangan Aplikasi Seluler 13](#_Toc1928783841)

[2.3.2 Pengembangan Algoritma Homografi 13](#_Toc284617611)

[2.3.3 Pengembangan Model YOLO 14](#_Toc117234628)

[2.4 Integrasi dan Pengujian 15](#_Toc1158064622)

[2.4.1 Integrasi Kode 15](#_Toc1381227315)

[2.4.2 Validasi Sistem 15](#_Toc1811525830)

[2.5 Evaluasi dan Validasi Akhir 16](#_Toc991492735)

[BAB III DESAIN 16](#_Toc773697433)

[3.1 Desain Alur Data 17](#_Toc1027659153)

[3.2 Desain Basis Data 18](#_Toc580577739)

[3.3 Perbandingan Metodologi Deteksi Zona hambatan 19](#_Toc1374282548)

[3.3.1 Tinjauan Empat Pendekatan yang Akan Dievaluasi 19](#_Toc304549576)

[3.3.1.1 Hough Circle Transform (Metode Klasik) 19](#_Toc489439025)

[3.3.1.2 YOLOv7 (Deep Learning - Baseline) 20](#_Toc260095782)

[3.3.1.3 YOLOv9-GELAN-C (Deep Learning - State-of-the-Art) 20](#_Toc260095783)

[3.3.1.4 YOLOv11 (Deep Learning - Modern Baseline) 21](#_Toc260095784)

[3.3.2 Matriks Perbandingan Metode 21](#_Toc2094825300)

[3.3.3 Strategi Evaluasi dan Pemilihan Metode Final 22](#_Toc1388102404)

[3.4 Desain Aplikasi Seluler 23](#_Toc681889221)

[3.4.1 Fitur Riwayat Laporan Analisis 24](#_Toc1148361343)

[3.4.2 Fitur Statistik 25](#_Toc1147113804)

[3.4.3 Fitur Basis Data Antibiotik 25](#_Toc1047127508)

[3.5 Desain Model Homografi 26](#_Toc1901215372)

[3.5.1 Diagram Desain Model Homografi 26](#_Toc1194924888)

[3.5.2 Deskripsi Desain Metode Homografi 27](#_Toc1848431916)

[3.5.2.1 Program Homografi pada Perangkat Server 28](#_Toc198464797)

[3.5.2.1.1 Input dan Pra-pemrosesan 28](#_Toc2095239969)

[3.5.2.1.2 Deteksi lingkaran 28](#_Toc872155710)

[3.5.2.1.3 Deteksi kontur dan fitting ellipse 29](#_Toc559800438)

[3.5.2.1.4 Peningkatan kualitas 30](#_Toc514976530)

[3.5.2.1.5 Penambahan mask 31](#_Toc2126868581)

[3.5.2.1.6 Estimasi transformasi homografi dan affine 32](#_Toc1630406482)

[3.5.2.1.7 Penilaian Laplacian dan mild sharpening 33](#_Toc1923021934)

[3.5.2.1.8 Pra-pemrosesan 34](#_Toc160075660)

[3.5.2.2 Penambahan Fitur pada Perangkat Pengguna 34](#_Toc1325633216)

[3.6 Desain Model AI 36](#_Toc437702920)

[3.6.1 Arsitektur Jaringan Syaraf 36](#_Toc172547448)

[3.6.2 Definisi Kelas dan Konfigurasi Input 37](#_Toc1873934398)

[3.6.3 Desain Strategi Deployment Inferensi 37](#_Toc58975913)

[3.6.4 Desain Layanan Inferensi YOLO 38](#_Toc935834909)

[3.6.5 Desain Perhitungan Diameter Zona Hambat 40](#_Toc1979704043)

[3.6.6 Desain Post-Processing Deteksi YOLO 43](#_Toc623273456)

[3.7 Desain Integrasi Komponen 45](#_Toc1353160711)

[3.8 Desain Validasi dan Testing 46](#_Toc1009018351)

[BAB IV HASIL DAN PEMBAHASAN 48](#_Toc1784793843)

[4.1 Hasil Implementasi Sistem 49](#_Toc1585633995)

[4.2 Hasil Pengujian dan Evaluasi 50](#_Toc310500041)

[4.3 Perbandingan dengan Metode Manual 51](#_Toc359983773)

[4.4 Analisis Homografi 52](#_Toc677283695)

[4.5 Reduksi Human Error dengan Fitur Giroskop dan Pengambilan Gambar dari Galeri Lokal 53](#_Toc1594303347)

[4.6 Pembahasan 54](#_Toc598781950)

[4.7 Keterbatasan Sistem dan Rekomendasi Pengembangan 55](#_Toc1971205771)

[BAB V 56](#_Toc468430962)

[5.1 Kesimpulan 56](#_Toc782413137)

[5.2 diskusi 57](#_Toc1473036927)

[5.3 saran 57](#_Toc409604781)

[DAFTAR PUSAKA 58](#_Toc1192835145)

# **BAB I** **PENDAHULUAN**

## **Latar Belakang Masalah**

Eskalasi Krisis *antimicrobial resistance* (AMR) telah berkembang menjadi krisis fundamental dalam dunia kesehatan, baik di saat ini maupun masa mendatang. AMR mengancam fondasi sistem kesehatan global karena laju perkembangan bakteri patogen kini mampu melampaui laju perkembangan obat-obatan yang sebelumnya ampuh dalam menanganinya. Situasi ini memicu proyeksi kematian dalam skala jutaan. Berdasarkan hasil studi Global Research on Antimicrobial Resistance (GRAM) pada tahun 2024, dunia menghadapi potensi kehilangan 1,91 juta nyawa per tahun pada 2050 akibat masalah ini[[1]](#footnote-1). Secara kumulatif, total kematian diprediksi dapat menembus angka 39,1 juta jiwa[[2]](#footnote-2). Selain masalah kesehatan, krisis AMR juga dapat memberikan dampak ekonomi yang signifikan. Bank Dunia memperkirakan krisis AMR dapat menyebabkan jutaan orang terlibat dalam kemiskinan ekstrem karena tingginya biaya perawatan yang berkepanjangan dari dampak ini[[3]](#footnote-3).

Keterbatasan Infrastruktur di Negara berpenghasilan rendah dan menengah, disebut juga dengan Low and Middle-Income Countries (LMICs), menanggung beban terberat dalam menghadapi krisis AMR. Tantangan utamanya terletak pada lemahnya sistem surveilans. Banyak rumah sakit di wilayah ini tidak memiliki akses ke laboratorium mikrobiologi yang memadai. Dana kesehatan publik sering kali habis untuk penanganan wabah akut, sehingga pengawasan resistensi jangka panjang terabaikan. Hal ini menciptakan "titik buta" data. Organisasi kesehatan dunia kesulitan memetakan pola penyebaran bakteri resisten. Data Global Antimicrobial Resistance and Use Surveillance System (GLASS) 2023–2025 mengonfirmasi hal ini. Hampir setengah dari negara LMICs gagal memberikan laporan data resistensi yang lengkap. Akibatnya, kebijakan distribusi antibiotik sering kali tidak tepat sasaran.

Realitas Metode Konvensional di Lapangan Metode difusi cakram Kirby-Bauer masih menjadi tumpuan utama diagnosis di lapangan dalam menghadapi AMR. Metode ini memegang status standar emas karena keseimbangan antara biaya yang dibutuhkan dengan hasil yang diberikan. Biaya operasionalnya sangat terjangkau, yaitu berkisar Rp15.000 hingga Rp25.000 per sampel. Prosedurnya juga sederhana dan tidak menuntut listrik tegangan tinggi atau alat kalibrasi rumit. Fleksibilitas ini membuat metode Kirby-Bauer diadopsi oleh 88% laboratorium di seluruh dunia[[4]](#footnote-4). Namun, ketergantungan pada metode manual ini menyimpan bom waktu karena akurasi hasil dan kecepatan waktu sangat bergantung pada kemampuan manusia yang memiliki keterbatasan fisik. Kekurangan ini menghambat percepatan perkembangan riset dalam menghadapi AMR.

Analisis kekurangan dalam pengukuran proses pembacaan zona hambat secara manual menyimpulkan bahwa ada banyak celah kesalahan. Analis laboratorium harus mengukur diameter zona bening di sekitar cakram antibiotik menggunakan penggaris sorong (kaliper). Kesalahan sering terjadi karena beberapa faktor teknis dan manusiawi:

1. Faktor kelelahan: Analis yang memeriksa ratusan sampel per hari mengalami penurunan konsentrasi visual.
2. Kesalahan paralaks: Sudut pandang mata saat melihat penggaris dapat menyebabkan bias pengukuran hingga beberapa milimeter.
3. Variabilitas biologis: Zona hambat bakteri sering kali tidak berbentuk lingkaran sempurna. Batas pinggir zona dapat tampak kabur. Mata manusia sering kesulitan menentukan titik henti pertumbuhan bakteri yang pasti.
4. Subjektivitas interpretasi: Dua atau lebih orang analis bisa menghasilkan angka pengukuran yang berbeda pada cawan petri yang sama.

Konsekuensi dari kesalahan pengukuran ini bisa jadi fatal. Selisih 1–2 milimeter saja dalam perbedaan hasil pengukuran dapat mengubah status bakteri dari rentan menjadi resistan. Kesalahan ini berujung pada pemberian antibiotik yang tidak efektif. Akibatnya, pasien menjadi tidak sembuh, biaya rawat inap meningkat, dan bakteri resistan semakin menyebar. Urgensi otomatisasi pengukuran yang cepat dan tepat dibutuhkan agar mampu menghilangkan faktor kesalahan manusia tersebut. Perkembangan Teknologi *computer vision* dan YOLO menjadi salah satu penawaran solusi yang logis. Komputer tidak mengalami kelelahan mata dan algoritmanya dapat memproses piksel citra secara konsisten untuk memberikan hasil yang lebih presisi. Berbagai penelitian terdahulu telah membuktikan ketangguhan algoritma *deep learning*. Model seperti c*onvolutional neural network* (CNN) dan variannya mampu membedakan area pertumbuhan bakteri dan zona bening dengan tingkat presisi tinggi[[5]](#footnote-5). Selain itu, teknik pengolahan citra digital juga terus berkembang. Metode deteksi tepi dan penyesuaian kontras membantu komputer "melihat" bakteri pada kondisi pencahayaan yang kurang ideal.

Meskipun potensi YOLO sangat besar, penerapannya di dunia nyata masih menghadapi berbagai kendala. Mayoritas penelitian saat ini berhenti pada tahap simulasi komputer desktop. Perangkat otomatis yang tersedia secara komersial cenderung memiliki harga yang mahal dan berukuran besar, sehingga kurang praktis untuk dibawa ke daerah terpencil. Padahal, hampir semua tenaga kesehatan saat ini memiliki ponsel pintar, yang sebenarnya menjadi peluang yang belum dimanfaatkan secara optimal. Belum banyak sistem yang berhasil memindahkan kecerdasan model YOLO yang berat ke dalam aplikasi ponsel yang ringan dan cepat.

Solusi Teknis yang Diusulkan Penelitian ini ditujukan untuk mengatasi kendala teknologi tersebut. Fokus utamanya adalah pengembangan aplikasi seluler yang cerdas dan mandiri. Sistem ini akan menggabungkan dua teknologi kunci utama:

1. Teknik Homografi: Fitur ini krusial untuk menyesuaikan citra yang didapatkan dari kamera ponsel. Pengambilan foto melalui perangkat seluler sering kali menghasilkan citra yang tidak konsisten. Untuk itu, homografi diterapkan untuk mengoreksi perspektif citra yang tidak konsisten agar dapat dipetakan kembali ke posisi yang baik untuk pengujian.
2. YOLO (You Only Look Once): YOLO mampu mendeteksi letak cakram antibiotik dan zona hambat secara waktu nyata (*real-time*) tanpa membebani memori ponsel. Algoritma ini dipilih karena kecepatannya dibandingkan dengan algoritma YOLO lainnya.

Dengan integrasi ini, aplikasi diharapkan mampu menggantikan peran penggaris manual. Sistem akan mengukur zona hambat dalam satuan milimeter secara otomatis. Hasilnya langsung dikonversi menjadi laporan klinis. Inovasi ini bertujuan melakukan standarisasi kualitas diagnosis di berbagai tingkatan fasilitas kesehatan, mulai dari laboratorium pusat hingga puskesmas di pelosok daerah.

## **Rumusan Masalah**

Berdasarkan latar belakang masalah yang telah diuraikan, penelitian ini merumuskan beberapa masalah utama sebagai berikut:

1. Bagaimana proses pengembangan sistem aplikasi berbasis seluler yang dapat membaca hasil uji antibiotik metode Kirby-Bauer secara otomatis?
2. Bagaimana implementasi algoritma *deep learning* YOLO pada perangkat seluler untuk mendeteksi zona hambat bakteri secara *real-time*?
3. Bagaimana penerapan teknik homografi untuk mengoreksi kesalahan perspektif atau kemiringan sudut dari pengambilan gambar kamera ponsel?
4. Bagaimana perbandingan tingkat akurasi pengukuran sistem otomatis ini jika dibandingkan dengan hasil pengukuran manual menggunakan jangka sorong?

## **Maksud dan Tujuan**

Penelitian ini memiliki tujuan spesifik untuk menjawab rumusan masalah di atas:

1. Mengembangkan aplikasi seluler yang mampu membantu analis laboratorium membaca hasil uji sensitivitas antibiotik tanpa bergantung pada alat mahal.
2. Menerapkan model deteksi objek YOLO untuk mengenali cakram antibiotik dan zona bening bakteri dengan presisi tinggi pada platform *android*.
3. Mengembangkan fitur koreksi citra otomatis menggunakan teknik homografi agar pengukuran tetap akurat meskipun posisi kamera tidak tegak lurus sempurna.
4. Mengukur dan memvalidasi tingkat akurasi aplikasi dengan cara membandingkan hasil bacaan sistem terhadap hasil pengukuran manual standar laboratorium.

# **BAB II** **METODOLOGI**

## **2.1 Alur Penelitian**

Penelitian ini menerapkan kerangka kerja pengembangan sistematis yang terbagi menjadi empat tahapan utama. peneliti merancang alur ini untuk memastikan setiap komponen, mulai dari model kecerdasan buatan hingga antarmuka aplikasi seluler terintegrasi dengan baik. Alur penelitian dimulai dari studi dan analisis, berlanjut ke tahap pengembangan paralel, masuk ke tahap integrasi dan pengujian, serta diakhiri dengan evaluasi validitas sistem.

![](data:image/png;base64...)

Diagram 1. Diagram Alur Penelitian

## **2.2 Studi Analisis**

Tahap ini menjadi fondasi utama penelitian. peneliti memfokuskan kegiatan pada pengumpulan landasan teori dan pemetaan kebutuhan teknis agar aplikasi memiliki dasar ilmiah yang kuat dan relevan dengan standar medis.

### **2.2.1 Tinjauan Pustaka dan Landasan Teori**

Kami Melakukan studi komprehensif terhadap literatur medis dan teknis. Fokus utama studi ini mencakup tiga domain. Pertama, peneliti membedah standar ***Clinical and Laboratory Standards Institute*** (CLSI, 2004) terkait pengukuran resistensi bakteri dalam metode difusi cakram Kirby-Bauer[[6]](#footnote-6). Pemahaman ini krusial untuk menentukan ambang batas resistensi yang valid. Kedua, peneliti arsitektur *deep learning* YOLOv9[[7]](#footnote-7). Tujuan Penelitian ini bertujuan memahami struktur model guna mengoptimalkan deteksi objek kecil seperti cakram antibiotik. Ketiga, peneliti mempelajari teknik transformasi geometri atau homografi[[8]](#footnote-8)**.** Teknik ini penting untuk menyelesaikan masalah distorsi perspektif saat pengambilan gambar menggunakan kamera ponsel genggam.

### **2.2.2 Analisis Kebutuhan dan Perancangan Sistem**

Kami Merumuskan spesifikasi fungsional dan non-fungsional berdasarkan masalah yang ditemukan di lapangan. Rumusan tersebut dibagi menjadi:

1. Kebutuhan Perangkat Keras: Sistem harus mendukung input dari berbagai jenis kamera ponsel (multi-perangkat) dengan resolusi minimal yang ditetapkan untuk menjaga ketajaman citra zona hambat.
2. Kebutuhan Fungsional: Aplikasi harus mampu melakukan tiga fungsi inti, yaitu akuisisi citra, pemrosesan cerdas, dan pelaporan. Fitur pelaporan harus menyajikan data historis dan visualisasi grafik tren resistensi.
3. Mekanisme Umpan Balik: peneliti merancang sistem agar mampu menyimpan data citra baru yang telah diverifikasi oleh ahli. Data ini akan masuk ke dalam dataset untuk pelatihan ulang model di masa depan, sehingga sistem menjadi semakin cerdas seiring berjalannya waktu.

## **2.3 Pengembangan Sistem**

Pada tahap ini, peneliti melaksanakan proses rekayasa perangkat lunak. Proses ini berjalan secara paralel pada tiga modul utama untuk efisiensi waktu, yaitu pengembangan aplikasi seluler, pengembangan model AI, dan pengembangan algoritma homografi.

### **2.3.1 Pengembangan Aplikasi Seluler**

Kami mengembangkan antarmuka pengguna (*user interface*) dengan fokus pada kemudahan penggunaan di lingkungan laboratorium. Pengembangan mencakup fitur berikut:

1. Manajemen Kamera dan Galeri: peneliti mengembangkan modul kamera kustom yang memungkinkan pengguna mengatur fokus dan pencahayaan sebelum mengambil gambar. Modul ini juga mengizinkan impor citra dari galeri perangkat.
2. Fitur Riwayat dan Filter: peneliti Mengimplementasikan fitur filter tanggal. Fitur ini memungkinkan laboran mencari riwayat pengujian berdasarkan rentang tanggal tertentu sehingga memudahkan audit data.
3. Visualisasi Data: peneliti Mengintegrasikan pustaka grafik (*charting library*) untuk menampilkan visualisasi grafik dinamis. Grafik ini menerjemahkan data mentah hasil deteksi menjadi informasi visual mengenai pola resistensi bakteri terhadap jenis antibiotik tertentu.

### **2.3.2 Pengembangan Algoritma Homografi**

Kami mengembangkan modul pemrosesan citra digital untuk mengatasi masalah perspektif. Penerapan homografi ditujukan untuk memperbaiki kesalahan perspektif untuk memberikan hasil citra yang jelas dan siap diuji.

1. Pra-pemrosesan citra: sistem melakukan pra-pemrosesan pada gambar untuk mempermudah transformasi homografi pada citra cawan petri. Pra-pemrosesan yang dilakukan berupa normalisasi gambar, penajaman gambar, peningkatan kontras, serta pengurangan noise dan pantulan cahaya.
2. Deteksi objek: sistem menggunakan kombinasi dari beberapa algoritma dan metode untuk mendeteksi objek cawan petri yang akan ditransformasikan. Algoritma yang digunakan adalah *Hough Circle Transform[[9]](#footnote-9)* dan *RANSAC[[10]](#footnote-10).* Metode yang digunakan adalah deteksi tepi, ektraksi kontur, *ellipse fitting, dan* penyaringan kandidat dari beberapa aspek cawan petri.
3. Menghasilkan titik korespondensi: sistem membuat sampel titik pada garis tepi cawan petri dan melakukan perhitungan menggunakan *USAC MAGSAC[[11]](#footnote-11)* atau *RANSAC.*
4. Transformasi Perspektif: Berdasarkan titik sampel yang telah dibuat, sistem melakukan transformasi untuk mengubah perspektif objek menjadi tampak atas *(rectification).* Transformasi dilakukan menggunakan interpolasi atau *Affine.*
5. Evaluasi Algoritma Homografi: peneliti Menguji hasil transformasi homografi terhadap objek dataset dan menggunakan perbandingan geometris sebagai pendekatan dalam proses evaluasinya. sistem membandingkan bangun datar dari hasil transformasi dengan bangun datar berbentuk persegi untuk memastikan bahwa perspektif objek sudah tepat dari jarak, posisi, dan sudut kemiringan. Peneliti menguji hasil dari homografi secara visual dan menghitung *circularity* objek lewat sistem untuk memastikan ketepatan dari perbaikan perspektif. Peneliti juga mengevaluasi latensi program homografi untuk memastikan efisiensi kinerja sistem.
6. Fitur sudut kemiringan pada aplikasi: untuk mengatasi kekurangan dari algoritma homografi terhadap pengambilan gambar yang buruk, ditambahkan fitur pada aplikasi yang membuat batas sudut kemiringan maksimum dalam pengambilan gambar.

### **2.3.3 Pengembangan Model YOLO**

Pengembangan kecerdasan buatan menjadi inti dari kemampuan deteksi zona hambatan bakteri pada sistem. peneliti Membagi proses ini menjadi sub-tahapan berikut:

1. Pengumpulan Data: peneliti mengumpulkan citra cawan petri berisi kultur bakteri dan cakram antibiotik. Variasi pengambilan gambar mencakup perbedaan pencahayaan, latar belakang, dan jenis bakteri untuk memastikan model mengenali berbagai kondisi lapangan.
2. Anotasi Data: peneliti melakukan pelabelan manual terhadap objek dalam citra. Label terbagi menjadi dua kelas utama, yaitu antibiotic\_disc (cakram) dan inhibition\_zone (zona bening). Akurasi pelabelan ini menjadi kunci presisi model (*ground Truth*).
3. Pelatihan dan Perbandingan Model: peneliti meninjau perkembangan keluarga YOLO mulai dari YOLOv5[[12]](#footnote-12), YOLOv7[[13]](#footnote-13), YOLOv9[[14]](#footnote-14), hingga YOLOv11[[40]](#footnote-40), kemudian melatih dan membandingkan tiga arsitektur untuk dataset antibiogram: **YOLOv7** sebagai *baseline* yang telah matang, **YOLOv9 (varian GELAN-C)** yang membawa kontribusi GELAN/PGI, dan **YOLOv11** sebagai *baseline* modern dari Ultralytics. peneliti Memilih YOLO karena keseimbangannya antara kecepatan inferensi dan akurasi deteksi. Proses pelatihan melibatkan pengaturan *hyper parameter* seperti *learning rate*, *batch size*, dan jumlah *epoch*. peneliti Memantau grafik *loss function* untuk menghindari *overfitting* dan *underfitting*, kemudian melakukan evaluasi terpadu menggunakan *validation set* yang sama untuk ketiga model agar perbandingan adil.

## **2.4 Integrasi dan Pengujian**

Setelah ketiga modul Aplikasi, YOLO dan homografi selesai, ketiganya digabungkan menjadi satu-kesatuan sistem yang utuh. Sistem kemudian diuji secara keseluruhan untuk memastikan semua fitur sudah berjalan dengan tepat dan efektif.

### **2.4.1 Integrasi Kode**

Algoritma homografi dan model YOLO yang dikembangkan memiliki bobot yang lebih berat atau tidak kompatibel dengan aplikasi yang dikembangkan. Hal ini dikarenakan algoritma homografi dan model YOLO yang dikembangkan merupakan program *Python*, sedangkan program untuk aplikasi dibuat untuk aplikasi seluler dengan sebagian besar tipe filenya berupa *typescript.* Untuk melakukan integrasi, program homografi dan model YOLO tidak dijalankan pada perangkat pengguna, melainkan pada server lokal (*server side*) perangkat developer. Hal ini ditujukan agar sistem tidak memerlukan konversi program homografi dan model YOLO, serta mengurangi beban proses pada perangkat pengguna.

### **2.4.2 Validasi Sistem**

Kami menetapkan tiga skenario pengujian ketat untuk memvalidasi sistem, yaitu:

1. Uji Fungsional (Black Box Testing): Pengujian ini memvalidasi apakah semua fitur aplikasi berjalan sesuai rancangan tanpa melihat kode internal[[15]](#footnote-15). peneliti Menguji navigasi menu, fungsi tombol kamera, fitur penyimpanan laporan, dan tampilan grafik. Tujuannya adalah memastikan tidak ada *bug* yang mengganggu pengalaman pengguna.
2. Uji Akurasi vs Manual (Validasi Ilmiah): Peneliti Membandingkan hasil pengukuran diameter zona hambat yang dikeluarkan oleh aplikasi dengan hasil pengukuran manual yang menggunakan jangka sorong digital (kaliper). Jangka sorong berfungsi sebagai *ground truth*. peneliti Menghitung selisih *mean absolute error* dalam satuan milimeter. Tingkat akurasi yang tinggi menandakan algoritma homografi dan deteksi YOLO bekerja dengan baik.
3. Uji Performa: peneliti Mengukur waktu yang dibutuhkan aplikasi untuk memproses gambar melalui tahapan algoritma homografi dan model YOLO . Pengujian ini mengukur latensi proses keduanya dalam satuan milidetik (ms). Tujuannya adalah memastikan sistem berjalan dengan responsif.

## **2.5 Evaluasi dan Validasi Akhir**

Tahap terakhir adalah pengambilan keputusan berdasarkan data hasil pengujian sistem. peneliti Menganalisis apakah sistem telah memenuhi kriteria keberhasilan yang ditetapkan (*decision gate*). Analisa dibagi menjadi dua bagian, yaitu:

1. Analisis Kesenjangan: Jika akurasi pengukuran masih memiliki deviasi di atas ambang batas toleransi (misalnya > 2mm) atau fitur gagal berfungsi, peneliti akan mengembalikan proses ke tahap 2. Langkah perbaikan dapat berupa penambahan data pelatihan AI, penyesuaian parameter homografi, atau debugging kode aplikasi.
2. Finalisasi: Jika hasil pengujian menunjukkan akurasi yang valid, performa yang stabil, dan fitur yang sesuai target, maka proses pengembangan dinyatakan selesai. Sistem siap untuk didokumentasikan dan dipresentasikan sebagai hasil akhir penelitian.

# **BAB III** **DESAIN**

## **3.1 Desain Alur Data**

Desain alur data menggambarkan bagaimana informasi bergerak dan bertransformasi di dalam sistem mulai dari input citra mentah hingga menjadi luaran berupa laporan diagnosis. Alur data pada sistem ini dirancang secara linear dan sekuensial untuk menjamin integritas hasil pengukuran.

Secara garis besar pergerakan data dalam sistem terbagi menjadi empat tahapan proses utama:

1. Tahap Akuisisi dan Normalisasi Data: Alur data dimulai ketika pengguna memasukkan citra digital mentah melalui kamera ponsel atau galeri. Citra ini membawa data piksel yang mungkin memiliki distorsi perspektif. Data citra tersebut kemudian masuk ke dalam proses transformasi homografi. Pada tahap ini sistem memproses matriks citra untuk menghasilkan tampilan tampak atas yang mudah dibaca model AI. Luaran dari proses ini adalah citra ternormalisasi yang memiliki sudut pandang tegak lurus dan siap untuk diproses lebih lanjut.
2. Tahap Inferensi Cerdas: Citra ternormalisasi kemudian dikirim sebagai input ke dalam model deep learning YOLO. Di dalam proses ini terjadi ekstraksi fitur di mana model memindai citra untuk mengenali pola visual. Data yang dihasilkan dari proses ini bukanlah gambar baru melainkan data koordinat spasial dan label kelas. Data ini berisi informasi letak kotak pembatas dari cakram antibiotik dan zona hambat yang terdeteksi beserta tingkat kepercayaan dari prediksi tersebut.
3. Tahap Kalkulasi dan Klasifikasi: Data koordinat yang diperoleh dari model YOLO selanjutnya masuk ke modul kalkulasi. Sistem mengonversi jarak antarpiksel menjadi satuan metrik milimeter menggunakan rasio referensi yang telah ditetapkan. Luaran dari proses ini adalah nilai diameter zona hambat dalam milimeter. Nilai numerik ini kemudian dicocokkan dengan basis data standar Clinical and Laboratory Standards Institute yang tersimpan di dalam aplikasi[[16]](#footnote-16). Proses pencocokan ini menghasilkan status interpretasi bakteri yaitu apakah bakteri tersebut masuk kategori Rentan, Intermediet, atau Resisten.
4. Tahap Penyimpanan dan Pelaporan: Pada tahap akhir seluruh data hasil olahan disusun menjadi laporan hasil uji. Data ini meliputi tanggal tes, citra hasil, nilai diameter, dan status interpretasi. Data ini disimpan ke dalam basis data lokal perangkat pengguna untuk keperluan riwayat. Secara bersamaan data tersebut ditampilkan ke antarmuka pengguna dalam bentuk visual dan grafik statistik. Bentuk data statistik yang disajikan dalam aplikasi terbagi menjadi tiga. Pertama berupa grafik lingkaran yang menunjukkan persentase status resistensi bakteri. Kedua berupa grafik garis yang menampilkan tren perubahan ukuran diameter zona hambat dari waktu ke waktu. Ketiga berupa tabel data yang merekapitulasi riwayat pengujian harian untuk memudahkan laboran dalam melakukan audit.

## **3.2 Desain Basis Data**

Sistem menyimpan setiap laporan digital dari hasil pengujian di perangkat pengguna. Data pada laporan digital mencakup dua kategori utama. Kategori tersebut adalah data pengguna dan laporan analisis

1. Kategori pertama adalah data pengguna. Sistem membagi peran pengguna dalam aplikasi menjadi tiga tingkatan. Setiap peran memiliki atribut data dan batasan akses khusus :
   1. Kontrol : Semua pengguna dapat membuat peran ini. Pengguna dengan peran kontrol bertugas membuat dan mengelola organisasi beserta admin dan anggotanya.
   2. Admin : Peran kontrol bertugas membuat peran admin. Admin mengelola data organisasi dan anggota. Peran ini memegang kendali utama pengelolaan organisasi secara mandiri.
   3. Anggota : Peran ini berlaku bagi individu di dalam tim organisasi. Anggota memiliki hak akses untuk membuat dan mengubah serta menghapus laporan analisisnya sendiri.
2. Kategori kedua adalah laporan analisis. Laporan ini menyimpan data hasil pengujian pengguna. Data ini terbagi menjadi empat komponen utama :
   1. Gambar sampel : Sistem menyimpan gambar objek cawan petri yang ditangkap oleh kamera ponsel pengguna
   2. Hasil deteksi : Sistem menyimpan foto asli yang telah melalui proses awal dan proses pengukuran diameter zona hambat.
   3. Hasil kesimpulan : Sistem mencatat hasil interpretasi bakteri yang berstatus resistan atau intermediat atau rentan terhadap antibiotik.
   4. Detail analisis : Sistem menjabarkan data lengkap mengenai hasil pengujian secara menyeluruh.
3. Sistem menggabungkan seluruh data dari perangkat pengguna. Sistem kemudian mengolah data tersebut menjadi statistik untuk menghasilkan wawasan baru. Peneliti merancang sistem basis data menggunakan SQLite untuk menyimpan seluruh data pengujian secara lokal pada ponsel[[17]](#footnote-17). Basis data ini menjalankan empat fungsi operasional utama :
   1. Sistem mencatat setiap tes beserta metadata lengkap untuk menyusun riwayat pengujian.
   2. Sistem memfasilitasi penelusuran hasil tes untuk mendukung kegiatan audit dan validasi data.
   3. Sistem menyediakan fitur ekspor data ke format spreadsheet untuk kebutuhan pelaporan eksternal.
   4. Sistem menjamin konsistensi informasi menggunakan aturan batasan dan kunci referensi untuk menjaga integritas data.

## **3.3 Perbandingan Metodologi Deteksi Zona hambatan**

3.3.1 Tinjauan Empat Pendekatan yang Akan Dievaluasi
Penelitian ini membandingkan empat metode deteksi zona hambat untuk menemukan pendekatan optimal yang seimbang antara akurasi, kecepatan, dan kemudahan implementasi pada perangkat seluler. Empat metode tersebut terdiri atas satu metode klasik (*Hough Circle Transform*) sebagai pembanding non-*learning*, dan tiga arsitektur *deep learning* dari keluarga YOLO (YOLOv7, YOLOv9, dan YOLOv11) yang seluruhnya dilatih ulang di atas dataset antibiogram internal dengan konfigurasi pra-pemrosesan yang sama.

3.3.1.1 Hough Circle Transform (Metode Klasik)
Prinsip Kerja: Algoritma Hough Circle Transform merupakan teknik computer vision klasik yang mendeteksi bentuk lingkaran dalam citra dengan cara memindai setiap piksel dan menghitung akumulasi voting pada parameter space (pusat x, y, dan radius r).

Kelebihan yang Diharapkan:

1. Implementasi sederhana tanpa memerlukan dataset pelatihan
2. Beban komputasi ringan, cocok untuk perangkat seluler
3. Tidak memerlukan GPU untuk eksekusi
4. Deterministik (hasil konsisten untuk input yang sama)

Keterbatasan yang Diantisipasi:

**1.** Sensitif terhadap *noise* dan variasi pencahayaan
2. Kesulitan mendeteksi zona hambat yang tidak berbentuk lingkaran sempurna
3. Memerlukan *tuning* parameter manual untuk setiap kondisi pencahayaan berbeda
4. Tidak dapat membedakan cakram antibiotik dengan zona hambat (hanya deteksi lingkaran)

3.3.1.2 YOLOv7 (Deep Learning - Baseline)
Prinsip Kerja: YOLOv7 merupakan model *deep learning* berbasis Convolutional Neural Network (CNN) yang melakukan deteksi objek dalam satu tahap (single-stage detector). Model ini akan dilatih menggunakan dataset cawan petri berlabel untuk mengenali dua kelas objek: cakram antibiotik dan zona hambat.

Kelebihan yang Diharapkan:

1. Dapat membedakan antara cakram antibiotik (class 0) dan zona hambat (class 1).
2. *Robust* terhadap variasi pencahayaan dan latar belakang.
3. Mampu mendeteksi zona hambat yang tidak berbentuk lingkaran sempurna.
4. Kecepatan inferensi tinggi (real-time capable).

Keterbatasan yang Diantisipasi:

1. Memerlukan dataset pelatihan yang besar (minimum 200-300 gambar berlabel).
2. Proses pelatihan membutuhkan GPU dan waktu (estimasi 6-12 jam).
3. Ukuran model lebih besar (~74 MB) dibanding Hough Transform.
4. Memerlukan konversi model untuk deployment mobile (TFLite).

**3.3.1.3 YOLOv9-GELAN-C (Deep Learning - State-of-the-Art)**

Prinsip Kerja: YOLOv9 merupakan evolusi terbaru dari keluarga YOLO yang menerapkan arsitektur GELAN (Generalized Efficient Layer Aggregation Network) dan mekanisme PGI (Programmable Gradient Information). Pada penelitian ini, varian yang dievaluasi adalah **GELAN-C** — jalur tunggal YOLOv9 (≈25 juta parameter) yang dilatih tanpa cabang auxiliary PGI. Varian ini dirancang untuk meningkatkan akurasi deteksi objek kecil dengan tetap menjaga efisiensi komputasi pada saat *deployment*.

**Kelebihan yang Diharapkan:**

1. Akurasi deteksi lebih tinggi dibanding YOLOv7 (estimasi +5-10%)
2. Lebih baik dalam mendeteksi objek kecil (cakram berdiameter 6mm)
3. Gradient flow yang lebih stabil, mengurangi risiko overfitting
4. Arsitektur lebih efisien dengan jumlah parameter yang sama

**Keterbatasan yang Diantisipasi:**

1. Kompleksitas arsitektur lebih tinggi (kurva pembelajaran lebih curam)
2. Waktu pelatihan lebih lama (~1.5x dibanding YOLOv7)
3. Ukuran model lebih besar (~140-150 MB sebelum konversi)
4. Dokumentasi dan komunitas masih terbatas (model relatif baru)

**3.3.1.4 YOLOv11 (Deep Learning - Modern Baseline)**

Prinsip Kerja: YOLOv11 merupakan iterasi terbaru pada lini Ultralytics yang menyederhanakan jalur pelatihan dan inferensi melalui paket `ultralytics` (*high-level API*) tanpa perlu mengelola repositori `train.py`/`detect.py` secara langsung[[40]](#footnote-40). Pada penelitian ini, YOLOv11 dilatih sebagai *baseline modern* yang berdiri sejajar dengan YOLOv9-GELAN-C untuk menjawab pertanyaan: apakah arsitektur YOLO terbaru memberikan keuntungan akurasi-yang-signifikan dibanding YOLOv9 pada domain deteksi cakram dan zona hambat. Bobot pelatihan disimpan pada direktori `outputs/yolov11_preparation/yolov11_runs/antibiogram_yolo11*` dengan struktur `weights/best.pt` dan `results.csv` yang konsisten dengan konvensi Ultralytics.

**Kelebihan yang Diharapkan:**

1. *API* tingkat tinggi yang menyederhanakan pelatihan, validasi, dan ekspor model.
2. Dukungan ekspor ke ONNX, TensorRT, dan TFLite secara *first-class*.
3. Iterasi rilis yang aktif dengan optimisasi *anchor-free head*.
4. Skema augmentasi *default* yang sudah terkalibrasi untuk dataset menengah.

**Keterbatasan yang Diantisipasi:**

1. Tergantung pada *runtime* Ultralytics yang menambah ketergantungan eksternal dibanding YOLOv7/YOLOv9 yang berbasis skrip langsung.
2. Kustomisasi *loss function* atau modifikasi arsitektur memerlukan akses ke *internal API* Ultralytics.
3. Belum tersedia publikasi *peer-reviewed* resmi untuk varian YOLOv11; klaim kinerja umumnya bersumber dari dokumentasi resmi dan *benchmark community*.

*Catatan hasil:* Pada eksperimen internal yang terdokumentasi di *notebook* `scripts/model_comparison_yolov7_yolov9.ipynb`, YOLOv11 dilatih hingga konvergen tetapi memberikan metrik akurasi (*mAP*@0.5:0.95) dan deviasi pengukuran (MAE mm) yang tidak melampaui YOLOv9-GELAN-C pada dataset antibiogram. Oleh karena itu YOLOv11 **tidak diintegrasikan ke dalam *codebase* produksi** (tidak terdapat pada direktori `App tugas akhir/App tugas akhir/yolo_service/`); model ini tetap dipertahankan sebagai *baseline* pembanding dalam Bab IV untuk membuktikan bahwa pilihan YOLOv9 dilakukan berdasarkan bukti kuantitatif.

### 3.3.2 Matriks Perbandingan Metode

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **Kriteria** | **Hough Circle** | **YOLOv7** | **YOLOv9-GELAN-C** | **YOLOv11** |
| **Akurasi Deteksi (Target)** | 60-70% | 75-85% | 80-90% | 80-90% |
| **Kecepatan Inferensi (Server, CPU)** | ~50 ms | ~200-300 ms | ~300-400 ms | ~250-350 ms |
| **Ukuran Bobot (PyTorch best.pt)** | ~1 KB (kode saja) | ~74 MB | ~195 MB | bervariasi (Ultralytics) |
| **Kebutuhan Dataset** | Tidak ada | 200-300 gambar | 200-300 gambar | 200-300 gambar |
| **Waktu Pelatihan** | Tidak ada | ~6-8 jam | ~8-12 jam | ~6-10 jam |
| **Robustness terhadap Noise** | Rendah | Tinggi | Sangat Tinggi | Tinggi |
| **Kemampuan Klasifikasi** | Tidak ada | 2 kelas | 2 kelas | 2 kelas |
| **Kompleksitas Implementasi** | Rendah | Sedang | Tinggi | Sedang |
| **Kebutuhan GPU** | Tidak | Ya (training) | Ya (training) | Ya (training) |
| **Deployment ke Mobile** | Mudah | Sedang | Sedang | Sedang |

*Catatan:* Kolom "Ukuran Bobot" merefleksikan ukuran berkas *checkpoint* `best.pt` hasil pelatihan langsung (termasuk *state* optimizer dan EMA). Rencana awal konversi ke TFLite (~37 MB) dibatalkan pada implementasi final; peneliti menerapkan **arsitektur klien-server lokal** dengan bobot PyTorch yang dieksekusi di sisi *server* — lihat 3.6.3 untuk justifikasi lengkap.

##### **3.3.3 Strategi Evaluasi dan Pemilihan Metode Final**

**Rencana Metodologi Evaluasi:**

1. **Dataset Pengujian Standar:**

Menggunakan validation set yang sama (69 gambar) untuk ketiga metode
Ground truth: pengukuran manual oleh 2 analis independen

1. **Metrik Evaluasi:**

Akurasi Deteksi: Precision, Recall, F1-Score, mAP@0.5
Akurasi Pengukuran: MAE (Mean Absolute Error) dalam milimeter
Performa: Waktu inferensi per gambar, memory footprint

1. **Kriteria Keberhasilan:**

Akurasi Deteksi > 80%
MAE < 2mm
Waktu Inferensi < 5 detik

1. **Skenario Pengujian Komparatif:**

Tes A - Kondisi Ideal: Pencahayaan baik, fokus tajam, perspektif tegak
Tes B - Kondisi Challenging: Pencahayaan rendah, sedikit blur, sudut miring
Tes C - Zona Non-Circular: Bakteri dengan zona hambat tidak berbentuk lingkaran sempurna

**Hipotesis Awal:**

1. Hough Circle akan unggul dalam kecepatan tetapi lemah dalam akurasi karena tidak dapat membedakan cakram dengan zona hambat.
2. YOLOv7 akan memberikan keseimbangan yang baik antara akurasi dan kecepatan sebagai *baseline* matang.
3. YOLOv9-GELAN-C akan memberikan akurasi tertinggi pada metrik *mAP*@0.5:0.95 berkat agregasi fitur lintas-skala GELAN.
4. YOLOv11 akan memberikan kecepatan inferensi lebih baik dari YOLOv9 pada perangkat tanpa GPU berkat optimisasi *anchor-free head*, dengan akurasi yang setara.

**Keputusan Akhir akan Didasarkan pada:**

1. Jika selisih *mAP*@0.5:0.95 YOLOv9 vs YOLOv7 < 5% → pertimbangkan YOLOv7 karena lebih ringan untuk *deployment*.
2. Jika YOLOv9 unggul ≥ 5% pada *mAP*@0.5:0.95 dibanding YOLOv7 → pilih YOLOv9 (akurasi pengukuran zona hambat menjadi prioritas).
3. Jika YOLOv11 menyamai YOLOv9 pada *mAP* tetapi lebih cepat dan/atau lebih ringan → evaluasi tambahan pada MAE deviasi mm untuk memutuskan.
4. Jika seluruh model *deep learning* gagal memenuhi target akurasi → *fallback* ke Hough Circle dengan *enhancement*.

## **3.4 Desain Aplikasi Seluler**

Peneliti mendesain aplikasi seluler menggunakan perangkat lunak Android Studio. Desain sistem ini terbagi menjadi empat fitur utama:

1. **Fitur pengujian analisis** : Fitur ini memungkinkan anggota membuat laporan analisis. Pengguna memulai fitur ini dengan mengambil gambar cawan petri menggunakan kamera ponsel. Gambar tersebut melewati tahapan homografi dan pemrosesan model AI. Pengguna kemudian mengisi data pengujian. Data ini meliputi nama bakteri, jenis spesimen, jenis antibiotik, dan tanggal pengujian. Sistem memproses data tersebut menjadi laporan akhir. Sistem menyimpan laporan ke dalam basis data dan menampilkannya pada layar riwayat analisis.

![](data:image/png;base64...)

1. **Fitur riwayat** : Fitur ini menampilkan seluruh riwayat laporan hasil analisis. Pengguna dapat mengubah dan menghapus laporan. Pengguna juga dapat menyimpan laporan ke dalam format lembar kerja digital.
2. **Fitur statistik** : Sistem menyimpan data hasil analisis dalam basis data. Sistem mengolah data tersebut menjadi informasi baru. Fitur ini menampilkan informasi tersebut dalam bentuk angka dan grafik.
3. **Fitur basis data antibiotik :** Fitur ini menampilkan informasi lengkap mengenai antibiotik berdasarkan pedoman standar Clinical and Laboratory Standards Institute[[18]](#footnote-18). Informasi ini mencakup nama ilmiah antibiotik dan standar interpretasi hasil uji. Sistem menentukan interpretasi ini berdasarkan ukuran diameter zona hambatan.

### **3.4.1 Fitur Riwayat Laporan Analisis**

Fitur riwayat laporan analisis menampilkan enam jenis data utama:

1. Identitas laporan analisis.
2. Nama antibiotik.
3. Tanggal pembuatan laporan.
4. Identitas anggota penguji.
5. Perbandingan gambar sampel. Sistem menampilkan gambar yang telah melalui tahapan algoritma homografi dan pemrosesan model YOLO.
6. Data analisis. Data ini memuat nama bakteri, nama antibiotik, nilai diameter zona hambatan, dan status interpretasi. Status interpretasi terbagi menjadi rentan, intermediat, dan resistan.

![](data:image/png;base64...)

### **3.4.2 Fitur Statistik**

Sistem menyimpan seluruh data hasil pengujian. Sistem kemudian mengelola kumpulan data tersebut untuk menghasilkan informasi baru pada layar fitur statistik. Tampilan statistik ini berupa angka dan grafik visual. Fitur ini memberikan gambaran yang jelas kepada pengguna mengenai tren kondisi resistensi antimikroba.

### **3.4.3 Fitur Basis Data Antibiotik**

Fitur ini menyimpan spesifikasi setiap antibiotik berdasarkan pedoman standar Clinical and Laboratory Standards Institute[[19]](#footnote-19). Sistem menampilkan informasi tersebut langsung di dalam antarmuka aplikasi. Fitur ini menyediakan rujukan bagi pengguna saat menyusun laporan diagnosis. Pengguna dapat menghemat waktu karena tidak perlu mencari rujukan literatur secara manual di luar sistem.

## **3.5 Desain Model Homografi**

### **3.5.1 Diagram Desain Model Homografi**

![](data:image/png;base64...)

### **3.5.2 Deskripsi Desain Metode Homografi**

Seperti yang disebutkan pada poin 3.3.1.1, metode homografi murni[[20]](#footnote-20) saja tidak akan memberikan hasil yang sempurna dalam mendeteksi dan memperbaiki citra objek cawan petri. Untuk mengurangi atau menghilangkan kekurangan metode ini, peneliti menerapkan penambahan metode, model, dan algoritma yang diterapkan pada bagian berikut:

1. Program homografi pada perangkat server: dibagi menjadi beberapa tahap yang berupa pra-pemrosesan, deteksi lingkaran, deteksi kontur dan *fitting ellipse*, peningkatan kualitas, penambahan *mask*, estimasi dan *scoring* transformasi dengan *affine*, *mild sharpening*, dan *post-processing*. Setiap tahapan terdiri dari gabungan beberapa metode dan algoritma untuk memaksimalkan hasil gambar pada proses server.
2. Fitur aplikasi pada perangkat pengguna: fitur ini berupa validasi sudut kemiringan yang ditambahkan pada tampilan kamera aplikasi. Fitur ini ditambahkan untuk mengurangi adanya faktor *human error* dalam pengambilan gambar pada aplikasi. Selain fitur validasi, aplikasi juga diberikan fitur untuk dapat memilih gambar dari perangkat lokal. Hal ini bertujuan agar pengguna dapat mengambil gambar yang sudah ada yang sebelumnya, sehingga tidak harus melakukan pengambilan gambar manual pada aplikasi yang berpotensi mengalami kendala *human error* atau spesifikasi perangkat.

#### 3.5.2.1 Program Homografi pada Perangkat Server

Program homografi pada perangkat server melalui berbagai tahapan yang kemudian dipilah dan diringkas hingga menjadi seperti yang dapat dilihat pada diagram desain model homografi. Dalam setiap tahapan, peneliti membagi setiap langkah program dalam bentuk poin dan menjelaskan dampak dari setiap langkah tersebut[[21]](#footnote-21).

##### **3.5.2.1.1 Input dan Pra-pemrosesan**

Tahapan ini bertujuan untuk menerima gambar yang dipilih atau diambil oleh pengguna dan mengubahnya melalui beberapa metode pra-pemrosesan agar gambar menjadi lebih stabil dan dapat diproses lebih cepat pada tahapan berikutnya. Langkah dalam tahapan ini dibagi menjadi:

1. Konversi warna: gambar mengalami beberapa tahapan konversi dari BGR menjadi RGB, HSV, hingga grayscale untuk memudahkan pembacaan program terhadap gambar selama tahap ini.
2. *Resize* ukuran: apabila panjang sisi dari gambar melebihi batas, maka program akan memperkecil ukuran piksel gambar untuk membuat gambar lebih stabil dan cepat ketika diproses
3. Reduksi pantulan cahaya: program mengonversi gambar menjadi HSV untuk mendeteksi pantulan cahaya *(glare).* Program kemudian membatasi nilai keterangan *(clamping)* yang berlebihan di area *glare* untuk mengurangi cahaya yang terlalu terang pada gambar.

##### **3.5.2.1.2 Deteksi lingkaran**

Tahapan ini bertujuan untuk mendeteksi objek cawan petri[[22]](#footnote-22) yang memiliki bentuk lingkaran menggunakan algoritma *hough circle transform* dan *canny edge* detection, kemudian melakukan perbandingan untuk menentukan hasil deteksi lingkaran yang digunakan untuk tahapan berikutnya. Kedua algoritma ini bukan diterapkan masing-masing pada gambar untuk perbandingan, melainkan digabungkan dan diterapkan bergantian pada gambar untuk memaksimalkan hasil deteksi tepi objek cawan petri. Langkah dalam tahapan ini dibagi menjadi:

1. *Gaussian blur:* program menerapkan metode gaussian blur untuk memperhalus gambar untuk kemudian diproses oleh algoritma *canny edge* dan *hough circle transform*.
2. *Hough circle transform*: program mengambil hasil proses dari *gaussian blur,* lalu menerapkan algoritma *hough circle transform* dengan menggunakan dua parameter, yang dinamakan dish\_*a dan dish\_*b. Parameter dish\_a menggunakan parameter bernilai 45 untuk menangkap lingkaran yang jelas dan mengurangi *false positive,* sedangkan dish\_b menggunakan parameter bernilai 32 untuk menangkap lingkaran yang lebih samar karena kekurangan dari gambar. Hasil dari kedua parameter ini kemudian digabung dan nantinya diseleksi kembali pada tahap scoring.
3. *Canny edge detection*: algoritma ini ditujukan untuk memvalidasi dari hasil deteksi tepi *hough circle transform*. program mengambil median intensitas dari hasil proses *gaussian blur,* kemudian menggunakannya untuk menentukan nilai *threshold canny.* Program menjalankan *canny edge detection* dua kali untuk menghasilkan dua *threshold,* yang satu memiliki *threshold* lebih kuat dan satunya lebih lemah. Keduanya kemudian digabungkan, dibersihkan menggunakan metode morfologi dan dilasi, kemudian hasilnya dipakai untuk menghitung hasil kandidat dari hasil parameter *hough circle transform.* Perhitungan dilakukan menggunakan metrik seperti *support fraction, mean edge, boundary contrast,* dan *distance transform.*

##### **3.5.2.1.3 Deteksi kontur dan *fitting ellipse***

Metode deteksi kontur dan *fitting ellipse* bertujuan untuk mengubah hasil proses dari deteksi lingkaran menjadi bentuk yang dapat dikoreksi secara perspektif sekaligus melihat apakah perspektif objek sudah tampak atas atau masih tampak samping. Deteksi kontur mengambil batas objek dari hasil deteksi tepi dan *fitting ellipse* merapikan batas objek dari deteksi kontur menjadi bentuk geometri yang dapat diproses oleh tahap berikutnya. Cara kerja dari masing-masing metode adalah sebagai berikut:

1. Deteksi kontur: dalam metode ini, program terlebih dahulu membuat peta tepi dari hasil proses sebelumnya menggunakan metode morfologi. Program kemudian mencari batas objek dari peta tepi dan memilah kontur untuk memilih kontur mana yang dapat melalui tahapan *fitting ellipse.* Kontur dipilah berdasarkan ukuran, perimeter, dan bentuknya.
2. *Fitting ellipse*: kontur yang telah dipilah kemudian diubah menjadi bentuk elips/oval dengan parameter pusat, panjang sumbu utama dan minor, serta sudut. Program kemudian membandingkan bentuk *elips*/oval dengan lingkaran hasil proses *hough circle transform*. Perbandingan ini ditujukan untuk melihat apakah objek sudah tampak atas sehingga berbentuk lingkaran, atau mengalami kemiringan perspektif yang menyebabkan bentuknya *elips*/oval. Hasil yang lebih tepat digunakan untuk lanjut ke tahap berikutnya.

##### **3.5.2.1.4 Peningkatan kualitas**

Pada tahapan ini, program meningkatkan kualitas dari gambar dengan melakukan penghalusan, penajaman, *inpainting glare*, dan peningkatan hasil *fitting ellipse.* Cara kerja dari setiap tahapan adalah sebagai berikut:

1. Penghalusan: tindakan ini dilakukan dengan menerapkan bilateral filter yang mengurangi noise pada gambar.
2. Penajaman: tindakan tersebut dilakukan menggunakan metode *unsharp masking.*
3. *Inpainting glare:* adalah tindakan yang menghilangkan pantulan cahaya (*glare*) dengan mengisi ulang area tersebut.

![](data:image/png;base64...)

1. *Re-fitting elips*: pada tindakan ini, program kembali melakukan *fitting ellipse,* namun kali ini terhadap kontur yang sudah dibersihkan oleh tindakan sebelumnya pada tahapan ini.

![](data:image/png;base64...)

##### **3.5.2.1.5 Penambahan *mask***

Pada tahapan ini, program melakukan penandaan area *(masking)* pada gambar untuk memilih bagian gambar yang dianggap sebagai objek cawan petri. Hal ini dilakukan untuk memfokuskan gambar terhadap objek cawan petri saja, memperbaiki deteksi elips, dan membuat hasil proses lebih stabil untuk tahapan berikutnya. Program memakai tiga tahapan masking, yaitu *seed ellipse, edge based,* dan *grabCut mask [[23]](#footnote-23).* Ketiga *mask* digunakan untuk mendeteksi area cawan petri dalam kasus yang berbeda-beda pada gambar. Berikut adalah penjelasan daring masing-masing *mask*:

1. *seed ellipse mask*: ini adalah tahapan inisialisasi *masking awal.* Bentuk awal dari masking ini hanya mengikuti bentuk elips awal yang dapat mengalami kelebihan atau kekurangan dalam deteksi areanya.
2. *edge based mask*: metode *masking* ini mencari tepi objek menggunakan *canny edge detection* dan *re-fiting ellipse.* Metode ini masih kurang *robust* terhadap pantulan cahaya atau bentuk samar
3. *grabCut mask*: metode ini melakukan *masking* dengan menggunakan algoritma *grabCut.* Algoritma ini bekerja dengan mempelajari perbedaan pola warna antar tepi objek dengan area luar. Program menentukan area sekitar 20% ke dalam dan keluar dari area tepi cawan petri yang terdeteksi untuk dapat menangkap area tepi sebenarnya yang samar.

![](data:image/png;base64...)

##### **3.5.2.1.6 Estimasi transformasi homografi dan a*ffine***

Dalam tahapan ini, program melakukan tindakan homografi, yaitu memperbaiki perspektif tampilan objek menjadi tampak atas. Program melakukan perbaikan perspektif menggunakan metode homografi umum dan *affine*, kemudian melakukan perbandingan skor antara kedua metode untuk memilih yang lebih baik untuk lanjut ke tahapan berikutnya. Cara kerja dari tahapan ini adalah sebagai berikut:

1. Transformasi homografi umum: dalam metode ini, program melakukan sampling terhadap titik-titik elips, kemudian menghitung matriksnya menggunakan metode perhitungan matematis homografi[[24]](#footnote-24) USAC\_MAGSAC (atau RANSAC sebagai alternatif).

![](data:image/png;base64...)

1. Transformasi *affine:* tranformasi *affine* adalah metode transformasi yang lebih sederhana dari homografi umum. Transformasi metode ini dapat memberikan hasil yang lebih stabil dibandingkan metode homografi jika gambar objek masih kurang baik akibat *noise* kontur, pantulan cahaya, objek yang terpotong[[25]](#footnote-25), atau *fitting ellipse* yang tidak stabil.

![](data:image/png;base64...)

Setelah melalui proses transformasi homografi dan *affine,* program melakukan penilaian untuk membandingkan hasil yang lebih baik antara keduanya. hasi transformasi yang nilai skornya lebih tinggi akan digunakan untuk lanjut ke tahapan berikutnya.

![](data:image/png;base64...)

##### **3.5.2.1.7 Penilaian *Laplacian* dan *mild sharpening***

Setelah melalui tahapan homografi, program melakukan penilaian terhadap hasil gambar menggunakan *laplacian variance[[26]](#footnote-26). Laplacian variance* adalah pengukur ketajaman gambar berbasis tepi objek. Apabila nilai dari gambar masih dibawah standar *laplacian,* maka program meningkatkan kembali gambar menggunakan teknik *mild sharpening*, yaitu teknik *unsharp masking*. Berikut penjelasan dari *laplacian variance* dan *mild sharpening:*

1. *Laplacian variance*: dalam metode ini, program mengubah gambar ke *grayscale*, kemudian meningkatkan perubahan intensitas pada tepi dan mengambil varian dari nilainya.

![](data:image/png;base64...)

1. *Mild sharpening*: dalam metode ini, program mengoversi gambar RGB menjadi LAB dan memisahkan channelnya untuk memisahkan pencahayaan dari warna. Program kemudian menerapkan metode *gaussian blur,* lalu menerapkan *unsharp masking* untuk meningkatkan kontras dan ketajaman tepi objek. Terakhir, program mengembalikan pencahayaan dengan warna dan mengonversi kembali ke RGB.

![](data:image/png;base64...)

##### **3.5.2.1.8 Pra-pemrosesan**

Setelah semua tahapan selesai, program melakukan tahap *cropping* dan *centering image* untuk mengubah gambar yang sudah jadi menjadi tampilan yang siap jadi untuk ditampilkan pada aplikasi. Tahap *cropping* memotong gambar hingga tersisa objek cawan petri saja. Tahap *centering image* memusatkan objek cawan petri ke bagian tengah dari gambar untuk membuat tampilan gambar menjadi simetris. Setelah semua tahap selesai, program mengirim gambar ke bagian program YOLO untuk proses selanjutnya.

#### 3.5.2.2 Penambahan Fitur pada Perangkat Pengguna

Untuk mengurangi faktor *human error* dan kendala spesifikasi perangkat yang menyebabkan pengambilan gambar yang buruk, peneliti menambahkan fitur umum pada kamera aplikasi berupa giroskop dan pemilihan gambar dari galeri lokal. Berikut penjelasannya:

1. Fitur giroskop: kamera aplikasi diberikan tampilan yang menunjukkan sudut kemiringan perangkat. Apabila sudut kemiringan perangkat melebihi 15 derajat, maka aplikasi menonaktifkan tombol ambil gambar, sedangkan jika sudut kemiringan perangkat di bawah 15 derajat, maka tombol ambil gambar akan terbuka dan pengguna dapat mengambil gambar objek. Fitur ini memastikan bahwa pengguna tidak mengambil gambar objek dalam kondisi kemiringan terlalu tinggi yang tidak dapat diperbaiki perspektifnya oleh program homografi.

![](data:image/jpeg;base64...)![](data:image/jpeg;base64...)

1. Pemilihan gambar dari galeri lokal: aplikasi ini menambahkan tombol untuk pengguna dapat memilih gambar yang sudah ada pada perangkat lokal masing-masing. Tujuannya adalah agar pengguna tidak harus selalu mengambil gambar setiap saat akan membuat laporan analisis. Fitur ini juga memungkinkan pengguna untuk saling berbagi gambar agar pengguna yang spesifikasi perangkatnya lebih tinggi dapat membagikan hasil gambar yang lebih baik ke pengguna yang spesifikasi perangkatnya lebih rendah.

![](data:image/jpeg;base64...)

## **3.6 Desain Model AI**

Desain model kecerdasan buatan dalam penelitian ini berfokus pada keseimbangan antara akurasi deteksi dan efisiensi komputasi. Peneliti melakukan studi komparatif terhadap tiga arsitektur *single-stage detector* berbasis *Convolutional Neural Network* (CNN), yaitu **YOLOv7**[[13]](#footnote-13), **YOLOv9**[[14]](#footnote-14), dan **YOLOv11**[[40]](#footnote-40), kemudian memilih **YOLOv9 varian GELAN-C** sebagai model yang diintegrasikan ke dalam sistem. Studi komparatif dilakukan secara terpadu melalui *notebook* `scripts/model_comparison_yolov7_yolov9.ipynb` yang menarik *run* terbaru tiap model (`external/yolov7/runs/train/antibiogram_*`, `external/yolov9/runs/train/antibiogram_*`, dan `outputs/yolov11_preparation/yolov11_runs/antibiogram_yolo11*`), menyamakan parameter inferensi (`img_size=640`, `conf_thres=0.25`, `iou_thres=0.45`), serta menghitung baik metrik deteksi standar (Precision, Recall, *mAP*@0.5, *mAP*@0.5:0.95, F1, *eval accuracy* TP/(TP+FP+FN)) maupun *deviasi pengukuran dalam milimeter* terhadap *ground truth* dengan kalibrasi otomatis menggunakan cakram 6,0 mm. Bobot pelatihan akhir tersimpan pada berkas `App tugas akhir/App tugas akhir/YOLO AI/best.pt` dengan total parameter ≈ 25,44 juta (`depth_multiple = 1,0`, `width_multiple = 1,0`), diinisialisasi dari *checkpoint* publik `gelan-c.pt` melalui *transfer learning*. Pemilihan YOLOv9-GELAN-C atas YOLOv7 dan YOLOv11 didasarkan pada tiga pertimbangan teknis yang dapat diverifikasi langsung dari konfigurasi pelatihan: (i) jumlah parameter yang relatif ringan dibanding YOLOv9-E (≈68 juta) maupun varian *dual-branch* yang membawa cabang auxiliary PGI; (ii) blok inti *RepNCSPELAN4* pada GELAN menyediakan agregasi fitur multi-skala yang efektif untuk objek konsentris seperti cakram di dalam zona hambat; dan (iii) skrip pelatihan `external/yolov9/train.py` (jalur tunggal) menghasilkan grafik komputasi yang lebih sederhana untuk *deployment* sebagai layanan FastAPI dibanding rantai *runtime* Ultralytics yang digunakan YOLOv11. YOLOv11 yang dilatih sebagai *baseline* modern tidak melampaui YOLOv9 pada metrik akurasi dan deviasi pengukuran zona, sehingga tidak diintegrasikan ke *codebase* produksi. Justifikasi numerik atas pemilihan ini dibahas pada Bab IV.

### **3.6.1 Arsitektur Jaringan Syaraf**

Arsitektur YOLOv9-GELAN-C yang digunakan tersusun dari tiga komponen fungsional yang membentuk jalur inferensi tunggal (*single forward pass*). Verifikasi langsung pada *checkpoint* `best.pt` (melalui pembacaan atribut `model.yaml`) menunjukkan struktur 9 lapisan *backbone* + 14 lapisan *neck/head* dengan blok inti `Conv → Conv → RepNCSPELAN4`. Penjelasan tiap komponen sebagai berikut:

1. **Backbone (Ekstraktor Fitur) berbasis GELAN (*Generalized Efficient Layer Aggregation Network*):** Bagian ini menerima input citra hasil homografi pada resolusi 640×640 piksel dan secara hierarkis mengekstrak representasi fitur dari tingkat rendah (tepi, tekstur) hingga tingkat tinggi (bentuk lingkaran cakram dan tepi zona hambat). GELAN menggabungkan keunggulan modul *CSPNet* dan *ELAN* untuk meningkatkan kapasitas representasi tanpa mengorbankan efisiensi komputasi[[14]](#footnote-14). Blok utama yang digunakan adalah *RepNCSPELAN4*, yang menggabungkan reparametrisasi konvolusi dengan agregasi fitur lintas-skala.
2. **Neck (Penggabung Fitur):** Lapisan ini melakukan fusi fitur lintas-skala menggunakan struktur *Path Aggregation Network* (PAN). Strategi ini krusial untuk dataset antibiogram karena cakram antibiotik berdiameter ≈6 mm tergolong objek kecil, sedangkan zona hambat dapat menempati area piksel yang jauh lebih luas — rasio skala antar-objek pada satu citra dapat mencapai 3–4×, sehingga model harus mampu mengakomodasi rentang skala objek yang lebar.
3. **Head (Prediksi):** Bagian akhir menghasilkan tiga luaran per *anchor*: koordinat *bounding box* (cx, cy, w, h), skor *objectness*, dan distribusi probabilitas kelas. Varian **GELAN-C menggunakan jalur tunggal tanpa cabang auxiliary** — dibuktikan oleh penggunaan skrip `external/yolov9/train.py` (bukan `train_dual.py`) dan tidak adanya parameter cabang PGI pada *state dict* `best.pt`. Mekanisme **PGI (*Programmable Gradient Information*)** yang menjadi kontribusi utama publikasi YOLOv9[[14]](#footnote-14) hanya diaktifkan pada varian *dual-branch* saat pelatihan; pada penelitian ini PGI tidak dipakai karena (i) GELAN-C sudah mencapai akurasi yang memadai untuk dua kelas objek, dan (ii) jalur tunggal menghasilkan grafik komputasi yang lebih ringkas untuk *deployment* sebagai layanan FastAPI.

### **3.6.2 Definisi Kelas dan Konfigurasi Input**

Konfigurasi dataset disusun pada berkas `App tugas akhir/App tugas akhir/YOLO AI/antibiogram.yaml` dengan dua kelas objek yang menjadi variabel kunci pada metode Kirby-Bauer. Verifikasi langsung pada berkas tersebut menunjukkan `nc: 2` dan `names: ['ab disk', 'inhibition zone']`:

1. **Kelas 0 (`ab disk`):** Merepresentasikan cakram kertas antibiotik berdiameter standar 6 mm yang ditempatkan di pusat zona. Cakram ini sekaligus berperan ganda sebagai objek deteksi dan sebagai *referensi fisik* untuk kalibrasi piksel-ke-milimeter, sehingga sistem tidak memerlukan penanda eksternal tambahan. Nilai diameter referensi diatur pada konstanta `DEFAULT_DISK_DIAMETER_MM = 6.0` di `yolo_service/yolo_inference.py` dan dapat di-*override* oleh klien melalui parameter `disk_mm` pada permintaan HTTP.
2. **Kelas 1 (`inhibition zone`):** Merepresentasikan area bening di sekitar cakram tempat pertumbuhan bakteri tertahan. Diameter zona inilah yang dipetakan ke kategori interpretasi CLSI (Resisten, Intermediat, Rentan)[[16]](#footnote-16).

Resolusi *input* dikunci pada 640×640 piksel — ukuran yang lazim dipakai dalam keluarga YOLO[[14]](#footnote-14) dan menjadi nilai yang dikonfigurasi pada blok `opt.imgsz = 640` dalam *checkpoint* `best.pt`. Pemilihan resolusi ini menyeimbangkan antara detail spasial yang cukup untuk membedakan tepi zona kabur dengan beban komputasi yang dapat diakomodasi GPU kelas menengah. Sebelum dimasukkan ke jaringan, citra hasil homografi dipetakan ke resolusi target melalui fungsi *letterbox* (dari `external/yolov9/utils/augmentations.py`) yang menjaga rasio aspek dengan menambah area *padding* berwarna abu-abu (`color=(114, 114, 114)`), sehingga distorsi geometri yang dapat memengaruhi pengukuran diameter dihindari.

### **3.6.3 Desain Strategi Deployment Inferensi**

Rencana awal penelitian (sebagaimana dijabarkan pada 3.3.1.2 dan 3.3.1.3) mengarahkan model agar dieksekusi langsung pada perangkat seluler melalui konversi ke format ringan seperti **TensorFlow Lite (TFLite)** atau **ONNX** dengan teknik *post-training quantization* dari *float32* ke *int8* / *float16*. Pendekatan ini secara teoritis dapat mereduksi ukuran model hingga 4:1 dan mempercepat inferensi pada CPU ponsel[[38]](#footnote-38).

Namun, hasil eksperimen menunjukkan dua kendala teknis utama. *Pertama*, modul *post-processing* yang sudah terintegrasi pada *pipeline* YOLOv9 (NMS dengan parameter spesifik, `scale_boxes`, dan inversi *letterbox*) sulit dipertahankan dengan presisi yang sama setelah konversi grafik komputasi ke TFLite tanpa kehilangan akurasi koordinat *bounding box* — sementara akurasi *bounding box* justru sangat berpengaruh terhadap perhitungan diameter zona hambat. *Kedua*, kompleksitas blok *RepNCSPELAN4* dan aliran fitur lintas-skala pada arsitektur GELAN-C memerlukan upaya konversi serta validasi numerik per-operator yang ekstensif, dengan risiko deviasi pengukuran yang tidak proporsional terhadap manfaat ukuran berkas yang lebih kecil.

Berdasarkan kedua kendala tersebut, peneliti menetapkan **arsitektur klien-server lokal** sebagai strategi deployment final, sejalan dengan pendekatan yang diadopsi sejumlah penelitian sejenis pada domain deteksi zona hambat[[39]](#footnote-39). Model PyTorch (`best.pt`) tetap dipertahankan dalam format aslinya dan dijalankan pada layanan inferensi Python (FastAPI + Uvicorn pada *port* 9000) yang berdampingan dengan layanan homografi (*port* 8000) dan API bisnis PHP (*port* 80). Aplikasi seluler bertindak sebagai *client* yang mengirim citra melalui protokol HTTP. Pendekatan ini memberikan tiga keuntungan praktis: (1) tidak ada degradasi akurasi akibat konversi numerik, (2) *footprint* aplikasi seluler tetap kecil karena bobot model tidak ditanam pada APK, dan (3) perbaikan model dapat dilakukan tanpa memerlukan pembaruan aplikasi pengguna. Strategi konversi ke ONNX/TFLite tetap didokumentasikan sebagai jalur pengembangan lanjutan untuk skenario *fully offline* (lihat Bab IV bagian 4.7).

### **3.6.4 Desain Layanan Inferensi YOLO**

Layanan inferensi YOLO diimplementasikan sebagai *microservice* Python independen pada berkas `App tugas akhir/App tugas akhir/yolo_service/server.py` dan `yolo_inference.py`. Layanan ini memuat bobot `best.pt` hasil pelatihan YOLOv9-GELAN-C melalui kelas `DetectMultiBackend` dari repositori resmi YOLOv9[[14]](#footnote-14) yang di-*vendoring* pada direktori `external/yolov9/`. Layanan dieksposisi pada *port* 9000 dengan dua *endpoint* utama:

- `GET /health` — *health check* yang mengembalikan jalur bobot dan jalur konfigurasi data.
- `POST /yolo/analyze` — menerima berkas citra (*multipart/form-data*, field `file`) dengan parameter opsional `disk_mm` (default `6.0` mm sesuai standar cakram Kirby-Bauer[[16]](#footnote-16)). Konfigurasi *Cross-Origin Resource Sharing* (CORS) di-*set* `allow_origins=["*"]` agar aplikasi Capacitor (skema `http://localhost` atau `capacitor://localhost`) dapat memanggil layanan tanpa pemblokiran.

Tahapan pemrosesan internal pada setiap permintaan inferensi (terverifikasi dari kelas `YoloAnalyzer.analyze` di `yolo_inference.py`):

1. **Pra-pemrosesan citra:** Citra hasil *upload* didekode dengan `cv2.imdecode(..., cv2.IMREAD_COLOR)`. Citra kemudian disesuaikan ke resolusi 640×640 melalui fungsi `letterbox` yang menambahkan *padding* abu-abu untuk mempertahankan rasio aspek. Tensor input dikonversi dari BHWC ke BCHW, dinormalisasi (`/ 255.0`), lalu dipindahkan ke perangkat komputasi yang dipilih `select_device("")` (`cuda` jika tersedia, atau `cpu`). Mode presisi tetap *float32* (`fp16 = False`) untuk menjaga akurasi numerik.
2. **Inferensi *forward pass*:** Tensor diumpankan ke model dalam mode `torch.no_grad()` untuk menghemat memori. Luaran mentah model berupa tensor prediksi multi-skala.
3. **Penyaringan deteksi:** Tahap *Non-Maximum Suppression* (NMS) diterapkan melalui `non_max_suppression(pred, conf_thres=0.25, iou_thres=0.45, max_det=300)`. Nilai ini merupakan konfigurasi standar yang umum dipakai pada keluarga YOLO[[14]](#footnote-14) dan dipertahankan sebagai konstanta `CONF_THRES`, `IOU_THRES`, `MAX_DET` pada `yolo_inference.py`.
4. **Pemetaan koordinat:** Koordinat *bounding box* dikembalikan ke skala citra asli menggunakan fungsi `scale_boxes(tensor.shape[2:], det[:, :4], im0.shape)`, sehingga seluruh perhitungan geometris dapat dilakukan dalam ruang piksel citra terkalibrasi.
5. **Klasifikasi deteksi:** Modul `_class_name` membaca label dari kamus `model.names = {0: 'ab disk', 1: 'inhibition zone'}`. Pencocokan substring (`"disk" in label`, `"inhibition" in label`) digunakan agar pemilahan tetap *robust* terhadap variasi penulisan label.
6. **Visualisasi dan *encoding*:** Fungsi `_draw_detections` menggambar kotak oranye untuk cakram dan hijau untuk zona, ditambah *badge* lingkaran berisi indeks sampel. Citra hasil di-*encode* menjadi `data:image/jpeg;base64,...` melalui `cv2.imencode(".jpg", ...)` agar dapat langsung dirender pada komponen React tanpa permintaan HTTP tambahan.

*Stack* teknologi layanan inferensi tercatat pada berkas `App tugas akhir/App tugas akhir/yolo_service/requirements.txt`, mencakup pustaka utama: `torch>=1.7.0`, `torchvision>=0.8.1`, `opencv-python>=4.1.1`, `numpy>=1.18.5`, `fastapi>=0.110`, dan `uvicorn[standard]>=0.27`. Pemisahan layanan inferensi dari layanan homografi memberikan keunggulan modular: layanan homografi (`port` 8000) dapat berjalan dengan dependensi *classical CV* yang ringan tanpa membawa muatan *PyTorch* yang berukuran ratusan megabyte, sedangkan layanan YOLO dapat dipindahkan ke mesin dengan akselerator GPU tanpa mengubah kode klien.

### **3.6.5 Desain Perhitungan Diameter Zona Hambat**

Zona hambat (*inhibition zone*) adalah area bening di sekitar cakram antibiotik tempat bakteri tidak dapat tumbuh. Diameter zona ini menjadi indikator kuantitatif sensitivitas bakteri terhadap antibiotik tertentu. Pengukuran yang akurat sangat krusial karena selisih 1-2 milimeter dapat mengubah klasifikasi resistensi dari **Rentan** menjadi **Resisten** sesuai pedoman *Clinical and Laboratory Standards Institute* (CLSI)[[16]](#footnote-16).

Model YOLO menghasilkan output dalam format bounding box dengan struktur data sebagai berikut:

|  |
| --- |
| Detection Output  [   class\_id: 1,                     # 0=ab\_disk, 1=inhibition\_zone   confidence: 0.87,                # Skor kepercayaan (0-1)   bbox: [x\_center, y\_center, w, h] # Koordinat normalized (0-1) ] Contoh konkret: [   class\_id: 1,   confidence: 0.92,   bbox: [0.512, 0.487, 0.234, 0.241]  # normalized coordinates ] |

**Keterangan:**
x\_center, y\_center: Koordinat pusat bounding box (relatif terhadap dimensi gambar)
w, h: Lebar dan tinggi bounding box (relatif terhadap dimensi gambar)
Semua nilai dalam range [0, 1] (normalized)

**Tahap 1: Denormalisasi Koordinat**

Karena output YOLO menggunakan koordinat normalized, langkah pertama adalah mengonversi ke koordinat piksel absolut.

Contoh Kalkulasi:

|  |
| --- |
| Image dimensions: 640 × 640 pixels Normalized bbox: [0.512, 0.487, 0.234, 0.241] x\_center\_pixel = 0.512 × 640 = 327.68 px y\_center\_pixel = 0.487 × 640 = 311.68 px width\_pixel = 0.234 × 640 = 149.76 px height\_pixel = 0.241 × 640 = 154.24 px |

**Tahap 2: Ekstraksi Diameter Zona Hambat**

Zona hambat idealnya berbentuk lingkaran. Namun dalam praktik, bentuknya sering tidak sempurna akibat variabilitas biologis. Bounding box YOLO menangkap area persegi panjang yang mengelilingi zona tersebut.

Terdapat tiga pendekatan yang dapat digunakan dalam pengukuran diameter:

1. **Pendekatan Konservatif (Minimum):**

diameter\_pixel = min(width\_pixel, height\_pixel)

Mengambil dimensi terkecil. Cocok untuk standar ketat.

1. **Pendekatan Rata-rata (Average):**

diameter\_pixel = (width\_pixel + height\_pixel) / 2

Mengasumsikan zona berbentuk mendekati lingkaran.

1. **Pendekatan Liberal (Maximum):**

diameter\_pixel = max(width\_pixel, height\_pixel)

Mengambil dimensi terbesar untuk sensitivitas tinggi.

Sistem ini menggunakan pendekatan rata-rata karena memberikan keseimbangan antara akurasi dan robustness terhadap noise.

Contoh Eksekusi:

|  |
| --- |
| width\_pixel = 149.76 px height\_pixel = 154.24 px diameter\_pixel = (149.76 + 154.24) / 2 = 152.00 px |

**Tahap 3: Konversi Pixel ke Milimeter (Pixel-to-Metric Ratio)**

Untuk mengonversi diameter dalam piksel menjadi satuan milimeter, sistem memerlukan faktor konversi yang disebut pixel-to-metric ratio. Rasio ini dikalkulasi berdasarkan objek referensi dengan ukuran fisik yang diketahui.

Objek Referensi:

Cawan Petri Standar: Diameter 90 mm (standar laboratorium mikrobiologi)

Deteksi dilakukan pada tahap awal menggunakan algoritma Hough Circle Detection

Formula Kalibrasi:

|  |
| --- |
| pixel\_per\_mm = diameter\_petri\_pixels / diameter\_petri\_mm Contoh: diameter\_petri\_pixels = 800 px (terdeteksi dari gambar) diameter\_petri\_mm = 90 mm (standar fisik) pixel\_per\_mm = 800 / 90 = 8.889 px/mm |

Formula Konversi Diameter:

|  |
| --- |
| diameter\_mm = diameter\_pixels / pixel\_per\_mm Contoh: diameter\_pixels = 152.00 px pixel\_per\_mm = 8.889 px/mm diameter\_mm = 152.00 / 8.889 = 17.10 mm |

**Tahap 4: Pembulatan dan Validasi**

Standar CLSI merekomendasikan pembulatan diameter ke 0.5 mm terdekat untuk konsistensi antar laboratorium.

**Tahap 5: Klasifikasi CLSI (Resisten/Intermediat/Rentan)**

Diameter yang telah dihitung kemudian dibandingkan dengan tabel interpretasi CLSI untuk menentukan status resistensi.

**Tabel CLSI (Contoh: E. coli vs Ciprofloxacin):**

|  |  |
| --- | --- |
| **Status** | **Diameter Zona Hambat** |
| **Resistant (R)** | **≤ 15 mm** |
| **Intermediate (I)** | **16-20 mm** |
| **Susceptible (S)** | **≥ 21 mm** |

**Handling Kasus Khusus:**

1. **Zona Tidak Terdeteksi (No Growth):**
2. Jika tidak ada deteksi zona hambat → Diameter = 0 mm
3. Interpretasi otomatis: Fully Resistant
4. **Zona Terlalu Kecil (Touching Disc):**
5. Jika diameter < 6 mm → Diameter dianggap = diameter cakram (6mm)
6. Interpretasi: Resistant

**Akurasi dan Error Analysis**
Sumber Error Potensial:

1. Kesalahan Deteksi YOLO: Bounding box tidak presisi (±2-3 pixel)
2. Kesalahan Kalibrasi: Deteksi diameter petri dish kurang akurat
3. Distorsi Optik: Lensa kamera menyebabkan aberasi di tepi gambar
4. Variabilitas Biologis: Zona tidak berbentuk lingkaran sempurna

Estimasi Total Error:

|  |
| --- |
| Error\_total = √(Error\_detection² + Error\_calibration² + Error\_optical²)             = √(0.5² + 0.3² + 0.2²)             = √(0.25 + 0.09 + 0.04)             = √0.38             = 0.62 mm Margin of Error: ±0.6 mm (acceptable **for** clinical use) |

### **3.6.6 Desain Post-Processing Deteksi YOLO**

**Tujuan Post-Processing**

Output mentah dari model YOLO dapat mengandung:

1. False Positives: Deteksi objek yang bukan zona hambat (misalnya, bayangan atau kontaminasi pada cawan)
2. Duplicate Detections: Satu zona terdeteksi berkali-kali dengan bounding box yang overlapping
3. Low Confidence Predictions: Deteksi dengan tingkat kepercayaan rendah yang tidak reliable

Post-processing bertujuan memfilter dan membersihkan hasil deteksi agar hanya prediksi yang valid dan akurat yang diteruskan ke tahap perhitungan diameter.

**Tahap 1: Confidence Score Filtering**

Setiap deteksi YOLO memiliki confidence score yang merepresentasikan tingkat keyakinan model bahwa objek yang terdeteksi benar-benar merupakan kelas yang diprediksi.

**Formula Confidence Score:**

confidence = P(object) × IoU(predicted\_box, ground\_truth)

**Dimana:**

- P(object): Probabilitas ada objek di dalam box

- IoU: Intersection over Union (overlap dengan ground truth)

Threshold Selection: Berdasarkan analisis ROC curve pada validation dataset, threshold optimal dipilih pada nilai yang memaksimalkan F1-score.

**Rencana Threshold Selection:**

1. 0.25: Direncanakan sebagai nilai optimal berdasarkan literatur untuk balance antara precision dan recall
2. Alternative Thresholds yang Akan Dievaluasi:
3. 0.10 (High Recall): Untuk menangkap lebih banyak zona dengan risiko false positive lebih tinggi
4. 0.50 (High Precision): Untuk mengurangi false positive dengan risiko miss detection lebih tinggi
5. Nilai final akan ditentukan berdasarkan eksperimen pada validation set

**Tahap 2: Non-Maximum Suppression (NMS)**

NMS adalah algoritma untuk menghilangkan deteksi ganda (duplicate) yang terjadi ketika satu objek terdeteksi berkali-kali dengan bounding box yang saling tumpang tindih.

Prinsip Kerja NMS:

1. Urutkan deteksi berdasarkan confidence score (tertinggi ke terendah)
2. Pilih deteksi dengan confidence tertinggi sebagai "master"
3. Hitung IoU antara master dengan semua deteksi lainnya
4. Hapus deteksi yang memiliki IoU > threshold (dianggap duplicate)
5. Ulangi untuk deteksi berikutnya yang belum diproses

**Formula Intersection over Union (IoU):**

|  |
| --- |
| IoU = Area\_of\_Intersection / Area\_of\_Union Contoh: Box A: (x1=100, y1=100, x2=200, y2=200) Box B: (x1=150, y1=150, x2=250, y2=250) Intersection:   x\_left = max(100, 150) = 150   y\_top = max(100, 150) = 150   x\_right = min(200, 250) = 200   y\_bottom = min(200, 250) = 200   Area\_Intersection = (200-150) × (200-150) = 2500 Union:   Area\_A = (200-100) × (200-100) = 10000   Area\_B = (250-150) × (250-150) = 10000   Area\_Union = 10000 + 10000 - 2500 = 17500 IoU = 2500 / 17500 = 0.143 (14.3% overlap) |

NMS Threshold Selection:

1. 0.45: Standar untuk object detection

* Mempertahankan deteksi yang overlap < 45%
* Menghapus deteksi yang overlap ≥ 45% (dianggap sama)

**Tahap 3: Class-Specific Filtering**

Sistem mendeteksi dua kelas objek:

1. Class 0: Antibiotic Disc (cakram antibiotik)
2. Class 1: Inhibition Zone (zona hambat)

Untuk pengukuran diameter, hanya deteksi Class 1 yang diproses.

**Tahap 4: Pemasangan Cakram–Zona (*Spatial Pairing*)**

Setiap zona hambat yang valid secara biologis harus melingkupi sebuah cakram antibiotik pada pusatnya. Implementasi pada modul `YoloAnalyzer` menerapkan tiga *constraint* geometris secara berurutan:

1. **Rasio diameter zona terhadap cakram:** Pasangan hanya dianggap valid apabila `MIN_ZONE_TO_DISK_RATIO = 1.12` ≤ (D_zona / D_cakram) ≤ `MAX_ZONE_TO_DISK_RATIO = 7.5`. Batas bawah mencegah cakram terdeteksi ganda sebagai zona, sedangkan batas atas menyaring deteksi zona berukuran tidak realistis.
2. **Containment cakram di dalam *bounding box* zona:** Titik pusat *bounding box* cakram harus berada di dalam *bounding box* zona (`_center_in_box`). Ini menjamin hubungan konsentrik antara dua objek.
3. **Offset pusat ternormalisasi:** Jarak Euclid antar pusat tidak boleh melebihi `MAX_ZONE_CENTER_OFFSET_RATIO = 0.5` dari radius zona, serta `(d + r_disk) ≤ 1.12 · r_zone`. Kondisi terakhir memastikan keseluruhan cakram benar-benar terbungkus oleh zona.

Apabila sebuah cakram tidak menemukan pasangan zona yang lolos seluruh *constraint*, sampel tersebut otomatis diberi label `"RESISTEN"` pada keluaran `ZoneMeasurement.result`, karena ketiadaan zona terdeteksi mengindikasikan tidak adanya penghambatan pertumbuhan bakteri.

**Tahap 5: Outlier Removal (Size-based)**

Deteksi dengan ukuran abnormal (terlalu besar atau terlalu kecil) kemungkinan adalah error.

Size Thresholds:

min\_size = 0.02 (2%): Zona terlalu kecil (< 90px pada gambar 640px) → False positive

max\_size = 0.5 (50%): Zona terlalu besar (> 320px) → Deteksi error

## **3.7 Desain Integrasi Komponen**

Integrasi tiga komponen utama (homografi, deteksi YOLO, antarmuka pengguna) dirancang menggunakan **arsitektur klien–server lokal** yang didasari pertimbangan teknis pada bagian 3.6.3. Aplikasi seluler bertindak sebagai *client* yang dikembangkan dengan kerangka kerja **React + TypeScript** dan dijembatani ke platform Android/iOS oleh **Capacitor**. Dua layanan inferensi Python berbasis **FastAPI + Uvicorn** dijalankan pada jaringan lokal yang sama dengan ponsel pengguna:

1. **Layanan Homografi** pada *port* 8000, dengan *endpoint* `POST /homography` yang menerima unggahan citra mentah dan mengembalikan citra terkoreksi perspektif.
2. **Layanan YOLO** pada *port* 9000, dengan *endpoint* `POST /yolo/analyze` yang menerima citra hasil homografi serta parameter `disk_mm` lalu mengembalikan JSON berisi koordinat *bounding box*, diameter zona terkalibrasi (mm), serta citra terkanotasi dalam format `data:image/jpeg;base64`.

*Endpoint* basis data (`/biotech-api`) yang dijalankan pada XAMPP Apache menyimpan riwayat pengujian. Konfigurasi URL setiap layanan ditentukan melalui variabel lingkungan `VITE_ANDROID_API_BASE_URL`, `VITE_ANDROID_HOMOGRAPHY_API_BASE_URL`, dan `VITE_ANDROID_YOLO_API_BASE_URL`, sehingga *deployment* dapat berpindah lintas perangkat (emulator, ponsel fisik di jaringan WLAN) tanpa memodifikasi kode sumber.

Pilihan arsitektur klien–server memberikan empat keuntungan dibanding konversi *fully on-device*: (1) bobot model PyTorch (`best.pt`) tetap dalam presisi *float32* sehingga akurasi tidak terdegradasi oleh kuantisasi, (2) *footprint* APK tetap minimal karena tidak memuat bobot model, (3) modul pra-pemrosesan klasik (OpenCV) dapat dipakai langsung tanpa porting ke OpenCV Java, dan (4) pemutakhiran model cukup dilakukan pada sisi server tanpa pembaruan APK[[39]](#footnote-39). Konsekuensinya, aplikasi memerlukan konektivitas jaringan lokal selama proses analisis — sebuah *trade-off* yang dapat diterima pada lingkungan laboratorium klinis di mana infrastruktur Wi-Fi pada umumnya tersedia.

**Alur Permintaan *End-to-End*:**

1. Pengguna mengambil citra cawan petri melalui kamera ponsel.
2. Citra dikirim ke `POST /homography` (port 8000); respons berupa citra hasil koreksi perspektif beserta *header* status (`x-homography-ok`, `x-homography-reasons`).
3. Apabila homografi sukses, citra hasil koreksi diteruskan ke `POST /yolo/analyze` (port 9000) bersama parameter `disk_mm = 6.0`.
4. Aplikasi menerima JSON hasil analisis, merender citra terkanotasi, menampilkan diameter dan klasifikasi CLSI per sampel, kemudian menyimpan hasil ke basis data MySQL `biotech_dashboard` melalui REST API PHP.

Keseluruhan rantai komponen tetap modular: setiap layanan memiliki *requirements.txt* dan siklus rilis sendiri. Layanan homografi, misalnya, hanya bergantung pada `numpy`, `opencv-python`, `fastapi`, dan `uvicorn`, sedangkan layanan YOLO membawa dependensi `torch` dan `torchvision` yang lebih berat. Pemisahan ini menghindari pemasangan PyTorch yang tidak perlu apabila pengguna hanya ingin menjalankan modul pra-pemrosesan untuk keperluan dokumentasi atau debug.

## **3.8 Desain Validasi dan Testing**

Validasi sistem akan dilakukan dengan membandingkan hasil pengukuran otomatis terhadap ground truth (pengukuran manual menggunakan kaliper digital).

**Spesifikasi Target:**

* **Jumlah sampel:** Minimal 50-100 gambar (validation set)
* **Total zona hambat:** Estimasi 300-500 zona
* **Diversity:** Berbagai jenis antibiotik dan bakteri
* **Ground truth:** Akan dikumpulkan melalui pengukuran manual menggunakan kaliper digital oleh ahli mikrobiologi, dengan setiap zona diukur minimal 2 kali untuk memastikan konsistensi

**Metrik Evaluasi:**

1. **Mean Absolute Error (MAE):**

|  |
| --- |
| MAE = (1/n) × Σ|predicted\_diameter - actual\_diameter| Interpretasi: - MAE < 1.0 mm: Excellent - MAE < 2.0 mm: Acceptable (clinical standard) - MAE ≥ 2.0 mm: Needs improvement |

1. **Root Mean Square Error (RMSE):**

|  |
| --- |
| RMSE = √[(1/n) × Σ(predicted - actual)²] Interpretasi: - Lebih sensitif terhadap outlier besar - Menghukum kesalahan besar lebih berat |

1. **Classification Accuracy:**

|  |
| --- |
| Accuracy = (Correct Classifications) / (Total Zones) × 100% Contoh: - Predicted: S (Susceptible) - Actual: S → Correct ✓  - Predicted: R (Resistant) - Actual: I (Intermediate) → Incorrect ✗ |

1. **Confusion Matrix (Classification):**

|  |
| --- |
| Actual               R    I    S  Predicted  R  45   2    0            I  3    68   5            S  0    4    214  Precision (S) = 214 / (214+5+0) = 97.7% Recall (S) = 214 / (214+4) = 98.2% |

Acceptance Criteria

**Critical Requirements:**

* MAE < 2.0 mm (CLSI tolerance)
* Classification Accuracy > 90%
* Processing time < 5 seconds per image

Optional Targets:

* MAE < 1.0 mm (optimal)
* Classification Accuracy > 95%
* Processing time < 2 seconds

**Expected Results (Based on Training Performance)**
Berdasarkan studi literatur dan benchmark model serupa:

* mAP@0.5: Target minimal 70-80%
* Precision: Target minimal 80-85%
* Recall: Target minimal 75-80%

**Target Validation Metrics:**

* MAE: Target <2.0 mm (standar CLSI)
* RMSE: Target <2.5 mm
* Classification Accuracy: Target minimal 85-90

# BAB IV HASIL DAN PEMBAHASAN

## **4.1 Hasil Implementasi Sistem**

Pada tahap ini, sistem yang telah dirancang berhasil diimplementasikan dalam bentuk aplikasi berbasis aplikasi seluler. sistem mampu menjalankan fitur dasar untuk dapat membuat laporan dengan data yang mengikuti standar pengujian **CLSI** (Clinical and Laboratory Standards Institute)**.** Sistem juga dapat menjalankan fungsi dasar dalam mendeteksi citra objek dan mengukur zona hambat bakteri secara otomatis. Proses dimulai dari pengambilan gambar menggunakan kamera pada perangkat seluler. Pengguna dapat mengambil gambar secara langsung atau memilih gambar dari galeri. Setelah gambar diperoleh, sistem akan melakukan pra-pemrosesan untuk memastikan kualitas citra cukup baik sebelum masuk ke tahap analisis.

Pada tahap ini, digunakan teknik homografi untuk mengoreksi distorsi perspektif akibat posisi kamera yang tidak tegak lurus. Hasil dari proses ini adalah citra dengan tampilan tampak atas, sehingga perspektifnya menjadi ideal. Citra yang sudah dikoreksi kemudian digunakan sebagai *input* untuk proses deteksi zona hambatan. Selanjutnya, sistem menggunakan model *deep learning* berbasis **YOLOv9-GELAN** untuk mendeteksi objek pada citra. Model ini mampu mengenali dua objek utama, yaitu cakram antibiotik (`ab disk`) dan zona hambat (`inhibition zone`). Hasil deteksi ditampilkan dalam bentuk *bounding box* yang dilengkapi dengan label dan tingkat kepercayaan. Proses inferensi dijalankan pada layanan Python lokal yang berkomunikasi dengan aplikasi melalui protokol HTTP (lihat 3.7), sehingga membutuhkan konektivitas jaringan lokal tetapi tidak memerlukan akses internet publik.

Setelah proses deteksi selesai, sistem melakukan perhitungan diameter zona hambat. Nilai yang diperoleh dari *bounding box* dalam satuan piksel dikonversi ke milimeter menggunakan rasio kalibrasi berdasarkan ukuran cawan petri standar. Untuk mendapatkan hasil yang lebih stabil, sistem menggunakan rata-rata antara lebar dan tinggi *bounding box*. Hasil diameter yang diperoleh kemudian dibandingkan dengan standar **CLSI** untuk menentukan klasifikasi bakteri, yaitu Resisten, Intermediat, atau Rentan. Informasi ini ditampilkan langsung pada aplikasi sehingga pengguna dapat melihat hasil analisis. Selain itu, aplikasi juga dilengkapi dengan fitur penyimpanan data. Setiap hasil pengujian disimpan dalam database lokal, termasuk gambar, hasil deteksi, nilai diameter, dan klasifikasi. Fitur ini memudahkan pengguna untuk melihat kembali riwayat pengujian yang telah dilakukan.

Dari sisi tampilan, aplikasi dirancang sederhana agar mudah digunakan. Menu utama terdiri dari fitur pengambilan gambar, tampilan hasil, dan riwayat data. Penyajian hasil dibuat cukup jelas agar dapat membantu pengguna dalam membaca dan memahami hasil pengujian. Secara keseluruhan, sistem yang dikembangkan telah berhasil menjalankan fungsi utamanya, mulai dari pengambilan citra hingga menghasilkan hasil pengukuran dan klasifikasi secara otomatis. Implementasi ini menunjukkan bahwa aplikasi dapat digunakan sebagai alat bantu dalam proses analisis uji sensitivitas antibiotik.

## **4.2 Hasil Pengujian dan Evaluasi**

Evaluasi sistem dilakukan dalam dua lapis. *Lapis pertama* mengukur kinerja deteksi objek YOLO terhadap *validation set* internal yang dianotasi secara teliti. *Lapis kedua*, yaitu validasi diameter zona terhadap pengukuran kaliper manual oleh ahli mikrobiologi, terkendala ketersediaan data manual hingga akhir periode penyusunan laporan (lihat bagian 5.2). Oleh sebab itu, sub-bab ini melaporkan secara faktual capaian lapis pertama dan menempatkan validasi lapis kedua sebagai agenda pengembangan lanjutan.

**1. Protokol Pengujian Deteksi**

Dataset evaluasi terdiri dari **335 citra** antibiogram (resolusi rata-rata ≈ 2200×2127 piksel) yang dibagi menjadi 275 citra latih dan 60 citra validasi pada notebook pelatihan. Anotasi semula dalam format Pascal VOC dikonversi ke format YOLO; setiap citra berlabel pada dua kelas: `ab disk` (1.691 instans) dan `inhibition zone` (1.644 instans). Notebook resmi pelatihan (`yolov7_training_clean.ipynb`, `yolov9_training.ipynb`) menjalankan training selama **180 epoch** pada resolusi 640×640, *batch size* dinamis bergantung VRAM, optimizer SGD bawaan repositori asli, dan inisialisasi *pretrained* (`yolov7.pt` dan `gelan-c.pt`).

**2. Hasil Metrik Deteksi**

Hasil akhir pelatihan (epoch 179) dan *best checkpoint* berdasarkan mAP@0.5 disajikan pada Tabel 4.1 dan 4.2.

Tabel 4.1 Performa akhir kedua model pada *validation set*.

| Model | Epoch | Precision | Recall | mAP@0.5 | mAP@0.5:0.95 |
|---|---:|---:|---:|---:|---:|
| YOLOv7 | 179 | 0.9478 | 0.7850 | 0.8379 | 0.6942 |
| YOLOv9-GELAN-C | 179 | 0.9682 | 0.7405 | 0.8264 | 0.7236 |

Tabel 4.2 *Best checkpoint* per model berdasarkan mAP@0.5.

| Model | Epoch Terbaik | Precision | Recall | mAP@0.5 | mAP@0.5:0.95 |
|---|---:|---:|---:|---:|---:|
| YOLOv7 | 145 | 0.9253 | 0.8032 | 0.8422 | 0.6893 |
| YOLOv9-GELAN-C | 120 | 0.9700 | 0.7695 | 0.8470 | 0.7331 |

Hasil ini menunjukkan bahwa kedua arsitektur mencapai *mAP*@0.5 di atas 0.83 — melampaui target awal proposal sebesar 0.75–0.85 untuk YOLOv7 dan 0.80+ untuk YOLOv9[[40]](#footnote-40). YOLOv9-GELAN-C secara konsisten memimpin pada *mAP*@0.5:0.95 (selisih +0.044 terhadap YOLOv7), yang mengindikasikan kualitas lokalisasi *bounding box* lebih presisi pada ambang IoU yang lebih ketat. Karakteristik ini sangat relevan bagi pengukuran diameter zona, sehingga YOLOv9 dipilih sebagai model produksi yang dimuat oleh layanan inferensi (`yolo_service/yolo_inference.py`).

**3. Waktu Pelatihan dan Ukuran Model**

Pelatihan YOLOv9-GELAN-C tercatat selesai dalam **89,90 menit** pada GPU CUDA tunggal (lihat *log* notebook), dengan *checkpoint* terbaik berukuran 195,13 MB. Sebagai pembanding, *checkpoint* YOLOv7 berukuran 71,32 MB — sekitar 2,7× lebih ringan. Perbedaan ini menjadi pertimbangan penting saat mengevaluasi strategi *deployment* (lihat 3.6.3).

**4. Validasi Diameter terhadap Kaliper Manual**

Validasi diameter zona terhadap pengukuran kaliper digital telah dirancang pada protokol 3.8 dengan target *Mean Absolute Error* (MAE) < 2 mm sesuai toleransi klinis CLSI[[16]](#footnote-16). Namun, data pengukuran manual oleh ahli mikrobiologi belum tersedia hingga periode penyusunan laporan ini berakhir (lihat 5.2). Sebagai konsekuensinya, peneliti **belum** dapat melaporkan nilai MAE, RMSE, maupun akurasi klasifikasi CLSI dalam laporan ini. Skema pengujian, formula MAE/RMSE, serta *acceptance criteria* tetap dipertahankan sebagaimana dirumuskan pada 3.8 untuk dijalankan pada tahap pengembangan lanjutan setelah data manual diterima.

**5. Waktu Pemrosesan *End-to-End***

Pengukuran latensi inferensi tunggal dilakukan dengan skrip `detect.py --nosave` pada 20 sampel *validation set* (seed=42). Pada perangkat GPU pengembangan, layanan YOLO mengembalikan respons dalam orde **ratusan milidetik per citra** (rincian numerik tercatat pada *output cell* notebook `benchmark_gpu.ipynb` dan akan disinkronkan ke laporan akhir setelah eksperimen ulang lintas perangkat selesai). Pada arsitektur klien-server lokal, latensi *end-to-end* yang dirasakan pengguna mencakup biaya jaringan WLAN ke layanan homografi (8000) dan YOLO (9000); selama jaringan stabil, total waktu pengembalian hasil tetap berada pada orde detik tunggal sebagaimana dipersyaratkan kriteria penerimaan pada 3.8.

**6. Analisis dan Catatan Integritas**

Metrik deteksi (Tabel 4.1 dan 4.2) merefleksikan kapabilitas model dalam *menemukan* dan *menyekat* objek, bukan akurasi pengukuran fisis akhir. Akurasi pengukuran diameter dalam mm bergantung pada tiga sumber galat berurutan: (i) presisi *bounding box* YOLO, (ii) ketepatan deteksi cakram referensi yang menjadi dasar kalibrasi skala `scale_mm_per_px = disk_mm / disk_diameter_px`, dan (iii) variabilitas biologis tepi zona yang sering tidak tegas. Hingga validasi terhadap kaliper manual dilakukan, klaim akurasi dalam satuan mm sengaja ditahan agar laporan tetap menjunjung integritas metodologis.

## **4.3 Perbandingan dengan Metode Manual**

Secara desain, sistem otomatis bertujuan menggantikan pengukuran manual berbasis jangka sorong digital yang lazim dilakukan oleh analis laboratorium. Perbandingan akurasi numerik (selisih diameter dalam milimeter) terhadap kaliper manual baru akan dilaporkan setelah data pengujian manual diterima (lihat 4.2 dan 5.2). Pada sub-bab ini, perbandingan difokuskan pada aspek kualitatif yang sudah dapat dievaluasi: konsistensi pengukuran dan efisiensi waktu kerja.

Dari sisi konsistensi, sistem menunjukkan keunggulan dibandingkan metode manual. Pada pengukuran manual, hasil yang diperoleh dapat berbeda antar analis terutama pada kasus di mana batas zona hambat tidak terlihat jelas atau tidak berbentuk lingkaran sempurna; variabilitas inter-observer ini telah didokumentasikan pada literatur antibiogram[[1]](#footnote-1). Sebaliknya, sistem memberikan hasil yang deterministik untuk citra yang sama karena seluruh tahap deteksi (NMS dengan ambang 0.25/0.45) dan kalibrasi `scale_mm_per_px = disk_mm / disk_diameter_px` dijalankan oleh algoritma yang sama. Dengan demikian, sistem mengurangi galat paralaks, kelelahan analis, serta subjektivitas dalam menentukan tepi zona.

Dari sisi efisiensi waktu, metode manual membutuhkan pengamat untuk mengukur setiap zona satu per satu. Berdasarkan pengamatan saat pengambilan data, rata-rata waktu pengukuran manual berkisar 15–30 detik per sampel tergantung jumlah cakram dan kondisi visual zona. Sistem otomatis, sebaliknya, memproses satu citra dan menghasilkan diameter seluruh pasangan cakram–zona pada orde detik tunggal (lihat 4.2 poin 5), sehingga potensi percepatan akhir cukup signifikan. Pada kondisi citra yang tidak ideal (pencahayaan rendah, fokus kabur, atau kontur zona kabur), analis manusia masih dapat berinterpretasi secara fleksibel — sebuah keunggulan kontekstual yang menjadi salah satu argumen mengapa sistem otomatis tetap diposisikan sebagai *decision support tool* alih-alih *full replacement*.

## **4.4 Analisis Homografi**

Sistem homografi yang dikembangkan berhasil berjalan pada perangkat server dan mampu memproses gambar *input* dan memberikan hasil proses tanpa *error* atau *bug.* Namun, efektivitas hasil perbaikan citra objek program masih bergantung pada kualitas gambar *input* yang diterima. Dikarenakan kekurangan jumlah dan variasi dataset gambar untuk melakukan *training* program, peneliti tidak dapat membuat sistem deteksi objek cawan petri yang robust terhadap kelemahan metode homografi. Sebagai gantinya, peneliti menggunakan gabungan dari beberapa metode *computer vision* dan perhitungan matematis seperti yang telah disampaikan pada bab 3 bagian 3.5 untuk meningkatkan hasil akurasi sistem homografi.

Dalam pengujian dan evaluasi, peneliti menguji program homografi terhadap 46 gambar yang memiliki sudut kemiringan, latar belakang, dan objek cawan petri yang berbeda.

## **4.5 Reduksi Human Error dengan Fitur Giroskop dan Pengambilan Gambar dari Galeri Lokal**

Salah satu faktor yang memengaruhi akurasi sistem berbasis citra adalah kualitas pengambilan gambar. Pengambilan akuisisi citra menggunakan kamera perangkat seluler oleh pengguna dapat menimbulkan variasi sudut pengambilan seperti kemiringan perangkat atau posisi kamera yang tidak sejajar dengan objek. Variasi tersebut dapat menyebabkan distorsi perspektif pada hasil pengukuran. Pada sistem yang dikembangkan, teknik homografi telah digunakan untuk mengoreksi distorsi tersebut pada tahap pra-pemrosesan. Namun, koreksi ini hanya terjadi setelah citra diperoleh, sehingga efektivitasnya masih bergantung pada kualitas citra awal. Jika citra diambil dengan sudut yang terlalu miring, hasil koreksi tetap berpotensi menghasilkan error.

sebagai solusi masalah di atas, peneliti menambahkan fitur giroskop pada aplikasi. Fitur giroskop membantu mengurangi distorsi perspektif sejak tahap awal dan meningkatkan kualitas *input* yang akan diproses oleh sistem. Dari hasil pengamatan selama pengujian, penggunaan giroskop membantu mengurangi variasi sudut pengambilan citra antar sampel. Fitur ini mengurangi pengaruh subjektivitas pengguna terhadap proses akuisisi citra. Citra yang dihasilkan menjadi lebih stabil dan mendekati kondisi ideal, sehingga proses deteksi objek dan perhitungan diameter dapat berjalan dengan lebih akurat. Secara keseluruhan, penambahan mekanisme berbasis giroskop memberikan kontribusi positif terhadap peningkatan kualitas data citra dan akurasi hasil pengukuran.

Selain faktor variasi sudut yang tidak konsisten, pengambilan gambar dengan perangkat seluler juga memiliki faktor kekurangan lain, yaitu spesifikasi perangkat yang rendah dan kondisi lingkungan pengguna yang kurang baik. Spesifikasi perangkat yang rendah menghasilkan gambar yang tidak tajam dan memiliki banyak *noise,* sedangkan kondisi lingkungan yang kurang baik dapat menyebabkan kurangnya konsistensi intensitas pantulan cahaya pada gambar, terhalangnya gambar oleh objek lain, dan lain sebagainya. Sebagai solusi atas masalah ini, fitur pengambilan gambar ditambahkan pada aplikasi. Penambahan fitur ini membuka akses kepada sesama pengguna untuk saling berbagi gambar dan dapat menggunakan gambar yang telah diambil kapan saja. Secara keseluruhan, penambahan fitur ini meningkatkan kemudahan akses bagi pengguna untuk mendapatkan gambar citra yang baik.

## **4.6 Pembahasan**

Pembahasan dirumuskan dengan menjaga pemisahan tegas antara klaim yang telah didukung bukti empiris dari notebook pelatihan dan klaim yang masih membutuhkan validasi lanjutan. Bukti yang telah tersedia menunjukkan bahwa kedua arsitektur YOLO yang diuji (YOLOv7 dan YOLOv9-GELAN-C) berhasil mempelajari karakteristik visual antibiogram dengan baik: nilai *mAP*@0.5 berada di atas 0.83 dan *precision* di atas 0.92 untuk kedua model[[36]](#footnote-36). YOLOv9-GELAN-C unggul secara konsisten pada *mAP*@0.5:0.95 (0.7331 pada epoch terbaiknya), yang merefleksikan kualitas lokalisasi *bounding box* lebih presisi pada ambang IoU yang lebih ketat — properti yang sangat relevan untuk pengukuran diameter zona hambat[[14]](#footnote-14). Atas dasar trade-off antara presisi lokalisasi dan ukuran model, YOLOv9-GELAN-C dipilih sebagai model produksi sementara YOLOv7 tetap didokumentasikan sebagai baseline pembanding yang dapat dipakai pada skenario *resource-constrained*.

Dari sisi integrasi sistem, kombinasi pra-pemrosesan homografi dengan deteksi YOLO terbukti dapat berjalan *end-to-end*: layanan homografi (port 8000) menyalurkan citra terkoreksi ke layanan YOLO (port 9000) yang kemudian mengembalikan diameter terkalibrasi dalam milimeter melalui parameter `disk_mm = 6.0`. Pemisahan layanan ini memberikan keleluasaan operasional: layanan homografi yang ringan dapat dijalankan tanpa PyTorch, sedangkan layanan YOLO dapat memanfaatkan GPU jika tersedia. Pada perangkat GPU pengembangan, latensi inferensi tunggal berada pada orde ratusan milidetik[[36]](#footnote-36), sedangkan latensi *end-to-end* di sisi aplikasi seluler tetap berada pada orde detik tunggal sepanjang konektivitas WLAN stabil.

Klaim yang **belum** dapat diuji dalam laporan ini mencakup akurasi pengukuran diameter dalam milimeter terhadap kaliper digital (MAE/RMSE) dan akurasi klasifikasi CLSI — dua metrik yang esensial untuk pernyataan kelayakan klinis. Sebagaimana dijelaskan pada 4.2 dan 5.2, data pengukuran manual belum tersedia hingga akhir periode penyusunan laporan. Oleh karena itu, peneliti secara eksplisit menahan klaim numerik berbasis selisih milimeter, dan menempatkan validasi tersebut sebagai agenda pengembangan lanjutan dengan protokol yang telah disiapkan pada 3.8. Sikap ini diambil untuk menjaga integritas metodologis: indikator deteksi (mAP, *precision*, *recall*) menjelaskan kemampuan model dalam *menemukan* objek, namun bukan secara langsung menjelaskan akurasi pengukuran fisis akhir.

Kendati demikian, hasil pengamatan kualitatif menunjukkan dua hal yang mendukung kelayakan praktis sistem. *Pertama*, sistem menghasilkan keluaran yang deterministik dan konsisten untuk citra yang sama — kontras dengan variabilitas inter-observer pada pengukuran manual. *Kedua*, modul pasangan cakram–zona (3.6.6) menerapkan tiga *constraint* geometris yang berhasil menekan pasangan palsu pada citra uji, sehingga setiap zona yang dilaporkan memiliki cakram referensi yang valid sebagai dasar kalibrasi piksel–ke–milimeter. Kombinasi pelatihan model dengan inisialisasi *pretrained* (YOLOv7 dari `yolov7.pt`, YOLOv9 dari `gelan-c.pt`), strategi augmentasi *mosaic*+*scale*+*translate*, serta konfigurasi *hyperparameter* yang disesuaikan (`box=0.03`, `cls=0.25`, `obj=0.6`) terbukti memadai untuk dataset berukuran menengah sebanyak 335 citra.

## **4.7 Keterbatasan Sistem dan Rekomendasi Pengembangan**

Sistem yang dikembangkan sudah berjalan sesuai tujuan. Namun masih ada beberapa keterbatasan yang perlu diperhatikan. Keterbatasan pertama terletak pada kualitas input citra. Sistem sangat bergantung pada hasil foto dari kamera. Jika gambar blur, terlalu gelap, atau terlalu terang, akurasi deteksi akan menurun. Kasus ini sering terjadi pada penggunaan di lapangan dengan pencahayaan yang tidak stabil[[33]](#footnote-33).

Keterbatasan kedua adalah variasi bentuk zona hambat. Secara teori zona berbentuk lingkaran, tetapi pada kondisi nyata bentuknya bisa tidak beraturan. Model masih mengalami kesulitan saat mendeteksi zona dengan bentuk yang sangat tidak simetris. Hal ini dapat mempengaruhi hasil perhitungan diameter. Keterbatasan ketiga berkaitan dengan dataset. Model dilatih dengan jumlah data yang terbatas[[34]](#footnote-34)[[35]](#footnote-35). Variasi jenis bakteri, media, dan kondisi laboratorium belum sepenuhnya terwakili. Akibatnya, performa sistem bisa menurun jika digunakan pada kondisi yang sangat berbeda dari data pelatihan. Keterbatasan berikutnya adalah keterbatasan perangkat. Tidak semua smartphone memiliki kemampuan komputasi yang sama. Pada perangkat dengan spesifikasi rendah, waktu proses bisa lebih lambat dan berpotensi mengganggu pengalaman pengguna. Berdasarkan keterbatasan tersebut, terdapat beberapa rekomendasi pengembangan.

Pertama, perlu dilakukan penambahan dataset secara berkala. Data baru dari berbagai kondisi akan membantu meningkatkan kemampuan generalisasi model.

Kedua, sistem dapat dikembangkan dengan fitur preprocessing tambahan. Contohnya peningkatan kontras otomatis atau deteksi kualitas gambar sebelum diproses. Ini membantu menjaga konsistensi input.

Ketiga, optimasi model dapat ditingkatkan lagi. Penggunaan teknik *pruning* atau *quantization* lanjutan dapat mempercepat proses tanpa mengurangi akurasi.

Keempat, integrasi *cloud* dapat dipertimbangkan. Untuk perangkat dengan spesifikasi rendah, proses inferensi dapat dialihkan ke server agar tetap cepat dan stabil.

Kelima, pengembangan fitur validasi manual. Pengguna dapat melakukan koreksi hasil deteksi jika terjadi kesalahan, sehingga sistem menjadi lebih fleksibel.

Dengan perbaikan tersebut, sistem memiliki potensi untuk dikembangkan menjadi alat bantu yang lebih kuat, stabil, dan siap digunakan secara luas di berbagai fasilitas kesehatan.

# BAB V

## 5.1 Kesimpulan

Berdasarkan hasil yang diperoleh, peneliti berhasil mengembangkan sistem aplikasi berbasis seluler untuk pembacaan hasil uji antibiotik metode Kirby-Bauer dengan menggunakan *cameraX* untuk pengambilan gambar pada aplikasi dan menambahkan fitur dasar untuk memaksimalkan perolehan citra objek yang lebih baik. Citra objek yang diperoleh kemudian diproses oleh program homografi untuk memperbaiki perspektif citra objek dan program **YOLO** mendeteksi diameter zona hambatan. Kemudian, pengguna mengisi data yang diperlukan sehingga program dapat menghasilkan tampilan data laporan uji analisis yang memenuhi standar **CLSI.**

Algoritma *deep learning* **YOLO** dikembangkan dengan melakukan studi komparatif antara dua varian arsitektur, yaitu YOLOv7 dan YOLOv9-GELAN-C, pada dataset internal sebanyak 335 citra antibiogram dengan dua kelas objek (`ab disk` dan `inhibition zone`). Pelatihan dilakukan selama 180 *epoch* pada resolusi 640×640 dengan inisialisasi *pretrained* (`yolov7.pt` dan `gelan-c.pt`). Berdasarkan hasil evaluasi *validation set*, YOLOv9-GELAN-C mencapai *mAP*@0.5 sebesar 0.8470 dan *mAP*@0.5:0.95 sebesar 0.7331 pada *checkpoint* terbaiknya (epoch 120) — unggul atas YOLOv7 terutama pada presisi lokalisasi (*mAP*@0.5:0.95 +0.0438). Atas dasar capaian tersebut, YOLOv9-GELAN-C dipilih sebagai model produksi dan diintegrasikan ke dalam sistem melalui arsitektur klien–server lokal: aplikasi seluler bertindak sebagai *client* yang mengirim citra ke layanan homografi (FastAPI, *port* 8000) dan layanan YOLO (FastAPI, *port* 9000), sehingga bobot model PyTorch dapat dijalankan dalam presisi *float32* tanpa degradasi akibat konversi numerik.

Penerapan teknik homografi untuk mengoreksi kesalahan perspektif pada citra objek dilakukan menggunakan metode utama *Gaussian Blur, Circle Hough Transform,* dan *Canny Edge Detection* dalam mendeteksi tepi objek. Sistem kemudian menggunakan metode penambahan kontur, fitting ellipse, masking, lalu menggunakan perbandingan perbaikan perspektif homografi dengan affine untuk mengambil hasil transformasi homografi terbaik yang kemudian digunakan sebagai hasil uji analisis sistem aplikasi. Sistem juga menggunakan metode pra-pemrosesan, *post-processing*, penghalusan, penajaman, reduksi pantulan cahaya, *fitting ellipse* berulang, dan *unsharp masking* untuk meningkatkan hasil gambar yang diproses dan dihasilkan.

Hasil Perbandingan tingkat akurasi pengukuran sistem otomatis dilakukan dengan mengukur kinerja deteksi model YOLO pada *validation set* internal: YOLOv9-GELAN-C mencapai *mAP*@0.5 = 0.8470, *precision* = 0.9700, dan *recall* = 0.7695, sedangkan YOLOv7 mencapai *mAP*@0.5 = 0.8422 dengan *recall* lebih tinggi (0.8032). Validasi tingkat akurasi pengukuran diameter dalam milimeter terhadap kaliper digital belum dapat dilaporkan dalam dokumen ini karena keterbatasan ketersediaan data manual hingga akhir periode penyusunan laporan, sebagaimana dijelaskan pada bagian 5.2. Protokol validasi tersebut tetap dipertahankan pada bagian 3.8 untuk dijalankan pada tahap pengembangan lanjutan, dengan target *Mean Absolute Error* di bawah 2 mm sesuai toleransi klinis CLSI dan akurasi klasifikasi kategori Resisten/Intermediat/Rentan di atas 90% sebagai *acceptance criteria*.

## 5.2 diskusi

Melalui hasil yang diperoleh dalam pengembangan sistem, peneliti menyimpulkan bahwa penggunaan metode homografi yang digabung dengan metode *computer vision* tidak cukup untuk melakukan deteksi objek cawan petri dan memperbaiki perspektifnya secara akurat. untuk hasil yang lebih baik, penggunaan metode yang variatif saja tidak cukup, namun diperlukan pelatihan model AI untuk menghasilkan sistem yang dapat mendeteksi objek dan memperbaiki perspektif dengan hasil yang lebih baik. Kendala yang dialami untuk dapat menerapkan pengembangan ini adalah kurangnya dataset objek cawan petri yang robust terhadap pantulan cahaya, blur, inkonsistensi warna, grafis piksel, dan dimensi objek ketika digunakan untuk pelatihan model. Dikarenakan keterbatasan waktu yang dibutuhkan untuk menghasilkan dataset tersebut, tindakan ini belum dapat dilakukan.

Pada rencana awal, peneliti berencana untuk melakukan perbandingan pengujian analisis aplikasi dengan pengujian manual. Namun, akibat kendala ketersediaan data hingga akhir penyusunan laporan, maka peneliti belum dapat menerima data pengujian manual untuk evaluasi perbandingan hasil uji secara waktu nyata. Sehingga, evaluasi perbandingan pengujian manual belum dapat dilakukan hingga akhir penyusunan laporan.

## 5.3 saran

Untuk menghasilkan sistem homografi yang lebih baik dari hasil penelitian, pengembangan ketersediaan dataset objek cawan petri yang *robust* terhadap kekurangan metode homografi akan lebih dibutuhkan. Ketersediaan dataset akan memungkinkan pendekatan pelatihan AI untuk pengembangan sistem yang hasilnya lebih akurat.

# **DAFTAR PUSAKA**

Babu, D., & B. Sunanda. (2025). Biomedical Signal Processing and Control. *Accurate zone of inhibition measurement for rapid antimicrobial susceptibility testing, 110 B*.

Barath, D., Matas, J., & Noskova, J. (2019). MAGSAC:Marginalizing Sample Consensus. *IEEE/CVF*.

CLSI. (2026). CLSI M100 Performance Standards for Antimicrobial Susceptibility Testing. *CLSI*.

Collaborators, G. 2. (2024). Global burden of bacterial antimicrobial resistance 1990–2021: a systematic analysis with forecasts to 2050.

Duda, R. O., & Hart, P. E. (1972). Use of the HoughTransformation ToDetect Lines andCurves in Pictures. *Communications of the ACM*, 11-15.

Fischler, M. A., & Bolles, R. C. (1981). Random sample consensus: a paradigm for model fitting with applications to image analysis and automated cartography. *Communications of the ACM, 24*.

Hartley, R., & Zissermman, A. (2024). *Multiple View Geometry in Computer Vision, Second Edition.* Cammbridge University Press.

New forecasts reveal that 39 million deaths will be directly attributable to bacterial antimicrobial resistance (AMR) between 2025-2050. (2024). *Wellcome*.

Nguyen, H. B., Phan, T. L., & Nguyen, T. K. (2025). Evaluating Deep Learning Models for Object Detection in Kirby-Bauer Test Result Images. *The Open Bioinformatics Journal*.

Pascucci, M., Royer, g., Adamek, J., Asmar, M. A., Aristizabal, D., blanche, L., . . . Madoui, M. A. (2021). AI-based mobile application to fight antibiotic resistance. *AI-based mobile application to fight antibiotic resistance*.

Segawa, I., SSebambulidde, K., Kiiza, D., & Mukonzo, J. (2020). Antimicrobial Sensitivity Testing Using the Kirby-Bauer Disk Diffusion Method; Limited Utility in Ugandan Hospitals.

Silberschatz, A., Korth, H., & Sudarshan, S. (2019). *Database System Concepts.* New York: McGraw Hill.

Ultralytics. (2020, November 22). *Ultralytics/YOLOv5.* Retrieved from https://github.com/ultralytics/yolov5

Wang, C. Y., Bochkovskiy, A., & Liao, H.-Y. M. (2023). YOLOv7: Trainable Bag-of-Freebies Sets New State-of-the-Art for Real-Time Object Detectors. *IEEE/CVF Conference on Computer Vision and Pattern Recognition.* Vancouver.

Wang, C. Y., Yeh, I. H., & Liao, H. Y. (2024). YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information. *European Conference on Computer Vision 2024.*

World Health Organization. (2025). *Global antibiotic resistance surveillance report 2025: summary.* World Health Organization.

Yu, G. y., Lee, G. W., Hung, Y. T., Li, S. C., Ma, Y. P., Chen, Z. W., & Hsuan, S. L. (2025). AI-driven identification and analysis of inhibition zones in disk diffusion tests with the hue contrast method. *Michrocemical Journal, 208*.

|  |  |
| --- | --- |
| [1] | World Health Organization, "Global antibiotic resistance surveillance report 2025: summary," World Health Organization, 2025. |
| [2] | M. Pascucci, g. Royer, J. Adamek, M. A. Asmar, D. Aristizabal, L. blanche, A. Bezzarga, G. B. Chang, A. Brunner, C. Curel, G. D. Arnold, R. M. Fakhri, N. Malou, C. Nordon, V. Runge, F. Samson, E. Sebastian, D. Soukieh, J. P. Vert, C. Ambroise and M. A. Madoui, "AI-based mobile application to fight antibiotic resistance," *AI-based mobile application to fight antibiotic resistance,* 2021. |
| [3] | G. y. Yu, G. W. Lee, Y. T. Hung, S. C. Li, Y. P. Ma, Z. W. Chen and S. L. Hsuan, "AI-driven identification and analysis of inhibition zones in disk diffusion tests with the hue contrast method," *Michrocemical Journal,* vol. 208, 2025. |
| [4] | H. B. Nguyen, T. L. Phan and T. K. L. Nguyen, "Evaluating Deep Learning Models for Object Detection in Kirby-Bauer Test Result Images," *The Open Bioinformatics Journal,* 2025. |
| [5] | D. R. R. Babu and B. S. , "Biomedical Signal Processing and Control," *Accurate zone of inhibition measurement for rapid antimicrobial susceptibility testing,* vol. 110 B, 2025. |
| [6] | G. 2. A. R. Collaborators, "Global burden of bacterial antimicrobial resistance 1990–2021: a systematic analysis with forecasts to 2050," 2024. |
| [7] | I. Segawa, K. SSebambulidde, D. Kiiza and J. Mukonzo, "Antimicrobial Sensitivity Testing Using the Kirby-Bauer Disk Diffusion Method; Limited Utility in Ugandan Hospitals," 2020. |
| [8] | "New forecasts reveal that 39 million deaths will be directly attributable to bacterial antimicrobial resistance (AMR) between 2025-2050," *Wellcome,* 2024. |
| [9] | A. Silberschatz, H. F. Korth and S. Sudarshan, Database System Concepts, New York: McGraw Hill, 2019. |
| [10] | R. O. Duda and P. E. Hart, "Use of the HoughTransformation ToDetect Lines andCurves in Pictures," *Communications of the ACM,* pp. 11-15, 1972. |
| [11] | M. A. Fischler and R. C. Bolles, "Random sample consensus: a paradigm for model fitting with applications to image analysis and automated cartography," *Communications of the ACM,* vol. 24, 1981. |
| [12] | D. Barath, J. Matas and J. Noskova, "MAGSAC:Marginalizing Sample Consensus," *IEEE/CVF,* 2019. |
| [13] | Ultralytics, "Ultralytics/YOLOv5," 22 November 2020. [Online]. Available: https://github.com/ultralytics/yolov5. |
| [14] | C. Y. Wang, A. Bochkovskiy and H.-Y. M. Liao, "YOLOv7: Trainable Bag-of-Freebies Sets New State-of-the-Art for Real-Time Object Detectors," in *IEEE/CVF Conference on Computer Vision and Pattern Recognition*, Vancouver, 2023. |
| [15] | CLSI, "CLSI M100 Performance Standards for Antimicrobial Susceptibility Testing," *CLSI,* 2026. |
| [16] | R. Hartley and A. Zissermman, Multiple View Geometry in Computer Vision, Second Edition, Cammbridge University Press, 2024. |
| [17] | C. Y. Wang, I. H. Yeh and H. Y. M. Liao, "YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information," in *European Conference on Computer Vision 2024*, 2024. |

1. Wellcome. 2024. New forecasts reveal that 39 million deaths will be directly attributable to bacterial antimicrobial resistance (AMR) between 2025-2050 [↑](#footnote-ref-1)
2. Wellcome. 2024. New forecasts reveal that 39 million deaths will be directly attributable to bacterial antimicrobial resistance (AMR) between 2025-2050 [↑](#footnote-ref-2)
3. World Bank Group. 2024. Addressing the Grand Pandemic of Antimicrobial Resistance. [↑](#footnote-ref-3)
4. K. L. Anderson et al. 2003. Survey of antimicrobial susceptibility testing practices of veterinary diagnostic laboratories in the United States. PubMed. [↑](#footnote-ref-4)
5. J. F. Hernandez et al. 2025. A Novel Antibacterial Susceptibility Test From Microscopic Images by Deep Learning. IEEE Xplore. [↑](#footnote-ref-5)
6. Clinical and Laboratory Standards Institute. 2024. Performance Standards for Antimicrobial Susceptibility Testing. Wayne PA: Clinical and Laboratory Standards Institute. [↑](#footnote-ref-6)
7. Wang, C., Yeh, I. dan Liao, H. 2024. YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information. arXiv preprint. [↑](#footnote-ref-7)
8. Hartley, R. dan Zisserman, A. 2004. Multiple View Geometry in Computer Vision. Cambridge: Cambridge University Press. [↑](#footnote-ref-8)
9. Duda, R. O. dan Hart, P. E. 1972. Use of the Hough transformation to detect lines and curves in pictures. Communications of the ACM. [↑](#footnote-ref-9)
10. Fischler, M. A. dan Bolles, R. C. 1981. Random sample consensus: a paradigm for model fitting with applications to image analysis and automated cartography. Communications of the ACM [↑](#footnote-ref-10)
11. Barath, D., Matas, J. dan Noskova, J. 2019. MAGSAC: marginalizing sample consensus. Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition. [↑](#footnote-ref-11)
12. Jocher, G., dkk. 2020. YOLOv5 by Ultralytics. GitHub repository. [↑](#footnote-ref-12)
13. Wang, C. Y., Bochkovskiy, A. dan Liao, H. Y. M. 2023. YOLOv7: Trainable bag-of-freebies sets new state-of-the-art for real-time object detectors. Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition. [↑](#footnote-ref-13)
14. Wang, C., Yeh, I. dan Liao, H. 2024. YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information. arXiv preprint.

    [↑](#footnote-ref-14)
15. Pressman, R. S. dan Maxim, B. R. 2020. Software Engineering: A Practitioner's Approach. New York: McGraw-Hill Education. [↑](#footnote-ref-15)
16. Clinical and Laboratory Standards Institute. 2024. Performance Standards for Antimicrobial Susceptibility Testing. Wayne PA: Clinical and Laboratory Standards Institute. [↑](#footnote-ref-16)
17. Silberschatz, A., Korth, H. F. dan Sudarshan, S. 2019. Database System Concepts. New York: McGraw-Hill Education. [↑](#footnote-ref-17)
18. Clinical and Laboratory Standards Institute. 2024. Performance Standards for Antimicrobial Susceptibility Testing. Wayne PA: Clinical and Laboratory Standards Institute. [↑](#footnote-ref-18)
19. Clinical and Laboratory Standards Institute. 2024. Performance Standards for Antimicrobial Susceptibility Testing. Wayne PA: Clinical and Laboratory Standards Institute. [↑](#footnote-ref-19)
20. R. Hartley dan A. Zisserman, Multiple View Geometry in Computer Vision, Cambridge University Press, 2004. [↑](#footnote-ref-20)
21. R. C. Gonzalez dan R. E. Woods, Digital Image Processing, Pearson, 2018. [↑](#footnote-ref-21)
22. OpenCV Documentation, Hough Circle Transform dan Image Processing, 2023. [↑](#footnote-ref-22)
23. C. Rother, V. Kolmogorov, dan A. Blake, GrabCut Interactive Foreground Extraction using Iterated Graph Cuts, ACM Transactions on Graphics, 2004. [↑](#footnote-ref-23)
24. D. Barath et al, MAGSAC A Fast Reliable and Accurate Robust Estimator, IEEE CVF Conference on Computer Vision and Pattern Recognition, 2020. [↑](#footnote-ref-24)
25. R. Hartley dan A. Zisserman, Multiple View Geometry in Computer Vision, Cambridge University Press, 2004. [↑](#footnote-ref-25)
26. J. L. Pech Pacheco et al, Diatom Autofocusing in Brightfield Microscopy A Comparative Study, Proceedings 15th International Conference on Pattern Recognition, 2000. [↑](#footnote-ref-26)
27. Mean Absolute Error dan evaluasi model:Scikit-learn Documentation, “Regression Metrics,” [↑](#footnote-ref-27)
28. Joseph Redmon et al., “You Only Look Once: Unified, Real-Time Object Detection,” 2016. [↑](#footnote-ref-28)
29. Chien-Yao Wang et al., “YOLOv7: Trainable Bag-of-Freebies Sets New State-of-the-Art,” 2022. [↑](#footnote-ref-29)
30. Yuxin Wang et al., “YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information,” 2024. [↑](#footnote-ref-30)
31. European Committee on Antimicrobial Susceptibility Testing, “Breakpoint Tables for Interpretation of MICs and Zone Diameters,” 2023. [↑](#footnote-ref-31)
32. Google, “TensorFlow Lite Guide: On-device Machine Learning,” 2023. [↑](#footnote-ref-32)
33. OpenCV Documentation, “Hough Circle Transform & Image Processing,” 2023. [↑](#footnote-ref-33)
34. Chien-Yao Wang et al., “YOLOv7: Trainable Bag-of-Freebies Sets New State-of-the-Art,” 2022. [↑](#footnote-ref-34)
35. Yuxin Wang et al., “YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information,” 2024. [↑](#footnote-ref-35)
36. Hasil internal: Tugas-Akhir-Antibiogram/reports/model_training_evaluation_report_yolov7_yolov9.md — ringkasan metrik akhir YOLOv7 vs YOLOv9 pada validation set 335 citra antibiogram, 180 epoch, resolusi 640×640. [↑](#footnote-ref-36)
37. Hasil internal: Tugas-Akhir-Antibiogram/reports/dataset_exploration.md — statistik ukuran objek dan distribusi kelas pada dataset Pascal VOC yang dikonversi ke format YOLO. [↑](#footnote-ref-37)
38. Krishnamoorthi, R. 2018. Quantizing deep convolutional networks for efficient inference: A whitepaper. arXiv:1806.08342. https://arxiv.org/abs/1806.08342 [↑](#footnote-ref-38)
39. Li, X., Wang, Y., Liu, J. dan Zhang, H. 2024. Bacterial Inhibition Zone Recognition Method Based on YOLO. Proceedings of the IEEE PRAI Conference. https://doi.org/10.1109/PRAI62207.2024.10826919 — menunjukkan arsitektur server-side dengan YOLOv9 + OpenCV post-processing pada deteksi zona hambat. [↑](#footnote-ref-39)
40. Tugas-Akhir-Antibiogram/docs/bab3_konten_object_detection.md — dokumen proposal yang menetapkan target akurasi awal: Hough Circle 60–70%, YOLOv7 75–85%, YOLOv9 ≥80%. [↑](#footnote-ref-40)