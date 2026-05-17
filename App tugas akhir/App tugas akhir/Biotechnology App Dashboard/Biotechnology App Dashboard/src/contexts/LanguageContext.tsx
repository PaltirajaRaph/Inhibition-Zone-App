import { createContext, useContext, useState } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  id: {
    
    'app.title': 'BioLab Analyzer',
    'app.subtitle': 'Analisis Resistensi Antibiotik',
    'dashboard.startAnalysis': 'Mulai Analisis Baru',
    'dashboard.startAnalysisDesc': 'Ambil foto petri dish untuk memulai',
    'dashboard.recentAnalysis': 'Analisis Terakhir',
    'dashboard.viewAll': 'Lihat Semua',
    'dashboard.noAnalysis': 'Belum ada analisis',
    'dashboard.noAnalysisDesc': 'Mulai analisis pertama Anda',
    'dashboard.test': 'Tes',
    'dashboard.totalTests': 'Total Tes',
    'dashboard.completed': 'Selesai',
    'dashboard.failed': 'Gagal',
    'dashboard.quickMenu': 'Menu Cepat',
    'dashboard.antibioticsDb': 'Database Antibiotik',
    'dashboard.antibioticsDbDesc': 'Referensi & standar CLSI',
    'dashboard.settings': 'Pengaturan',
    'dashboard.settingsDesc': 'Preferensi aplikasi',

    
    'camera.back': 'Kembali',
    'camera.instruction': 'Sejajarkan petri dish dengan panduan lingkaran',
    'camera.tilt': 'Kemiringan',
    'camera.goodAngle': 'Sudut Baik ✓',
    'camera.levelCamera': 'Ratakan Kamera',
    'camera.retake': 'Ambil Ulang',
    'camera.usePhoto': 'Gunakan Foto',

    
    'loading.processing': 'Memproses Analisis',
    'loading.pleaseWait': 'Mohon tunggu sebentar...',
    'loading.step': 'Langkah',
    'loading.of': 'dari',
    'loading.correctAngle': 'Mengoreksi sudut foto...',
    'loading.detectZone': 'Mendeteksi zona hambat...',
    'loading.measureDiameter': 'Mengukur diameter...',
    'loading.accessDb': 'Mengakses database...',
    'loading.generateReport': 'Menghasilkan laporan...',
    'loading.algorithm': 'Algoritma homographic projection dan circle detection sedang bekerja',

    
    'report.title': 'Laporan Hasil Analisis',
    'report.testNum': 'Tes',
    'report.imageComparison': 'Perbandingan Gambar',
    'report.originalPhoto': 'Foto Asli',
    'report.detectionResult': 'Hasil Deteksi',
    'report.detectionDesc': 'Lingkaran hijau menunjukkan zona hambat yang terdeteksi. Garis merah menunjukkan diameter pengukuran.',
    'report.resultSummary': 'Hasil Kesimpulan',
    'report.detailAnalysis': 'Detail Analisis',
    'report.interpretationGuide': 'Panduan Interpretasi',
    'report.susceptible': 'Rentan (Susceptible)',
    'report.intermediate': 'Intermediat',
    'report.resistant': 'Resisten (Resistant)',
    'report.exportPdf': 'Ekspor sebagai PDF',
    'report.editData': 'Edit Data',
    'report.delete': 'Hapus',
    'report.saveDb': 'Simpan ke Database',
    'report.share': 'Bagikan Laporan',
    'report.notes': 'Catatan',
    'report.editTitle': 'Edit Data Analisis',
    'report.editDesc': 'Perbarui informasi hasil analisis',
    'report.bacteriaName': 'Nama Bakteri',
    'report.antibioticA': 'Antibiotik A',
    'report.antibioticADesc': 'Deskripsi Antibiotik A',
    'report.antibioticB': 'Antibiotik B',
    'report.antibioticBDesc': 'Deskripsi Antibiotik B',
    'report.diameter': 'Diameter (mm)',
    'report.notesPlaceholder': 'Tambahkan catatan observasi...',
    'report.cancel': 'Batal',
    'report.saveChanges': 'Simpan Perubahan',
    'report.deleteTitle': 'Hapus Data Analisis',
    'report.deleteConfirm': 'Apakah Anda yakin ingin menghapus data analisis',
    'report.deleteWarning': 'Tindakan ini tidak dapat dibatalkan.',
    'report.saved': 'Hasil telah disimpan ke database',
    'report.updated': 'Data berhasil diperbarui',

    
    'history.title': 'Riwayat Database',
    'history.totalAnalysis': 'total analisis',
    'history.search': 'Cari ID Tes atau Nama Bakteri...',
    'history.filterSort': 'Filter & Sortir',
    'history.filterData': 'Filter Data',
    'history.filterPeriod': 'Filter Periode',
    'history.month': 'Bulan',
    'history.year': 'Tahun',
    'history.allMonths': 'Semua Bulan',
    'history.allYears': 'Semua Tahun',
    'history.status': 'Status',
    'history.result': 'Hasil',
    'history.all': 'Semua',
    'history.sort': 'Urutkan',
    'history.newest': 'Terbaru',
    'history.oldest': 'Terlama',
    'history.resetFilters': 'Reset Semua Filter',
    'history.activeFilters': 'Filter Aktif:',
    'history.showing': 'Menampilkan',
    'history.from': 'dari',
    'history.results': 'hasil',
    'history.noResults': 'Tidak ada hasil yang ditemukan',
    'history.tryDifferent': 'Coba ubah filter atau kata kunci pencarian',
    'history.notIdentified': 'Tidak diidentifikasi',
    'history.antibiotic': 'Antibiotik',

    
    'settings.title': 'Pengaturan',
    'settings.subtitle': 'Preferensi aplikasi',
    'settings.appearance': 'Tampilan',
    'settings.darkMode': 'Mode Gelap',
    'settings.darkModeDesc': 'Aktifkan tema gelap',
    'settings.language': 'Bahasa',
    'settings.languageApp': 'Bahasa Aplikasi',
    'settings.languageDesc': 'Pilih bahasa yang digunakan',
    'settings.indonesian': 'Bahasa Indonesia',
    'settings.english': 'English',
    'settings.notifications': 'Notifikasi',
    'settings.pushNotif': 'Notifikasi Push',
    'settings.pushNotifDesc': 'Terima pemberitahuan hasil analisis',
    'settings.about': 'Tentang',
    'settings.version': 'Versi',
    'settings.description': 'Aplikasi analisis resistensi antibiotik menggunakan teknologi computer vision untuk deteksi zona hambat secara otomatis.',
    'settings.copyright': '© 2025 BioLab Analyzer. All rights reserved.',
    'settings.dataManagement': 'Manajemen Data',
    'settings.backup': 'Backup Data ke Cloud',
    'settings.restore': 'Restore Data dari Backup',
    'settings.deleteAll': 'Hapus Semua Data',
    'settings.deleteConfirm': 'Yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.',
    'settings.deleteSuccess': 'Data berhasil dihapus. Refresh halaman untuk reset aplikasi.',

    
    'antibiotics.title': 'Database Antibiotik',
    'antibiotics.subtitle': 'Referensi & Standar CLSI',
    'antibiotics.search': 'Cari antibiotik...',
    'antibiotics.clsiInfo': 'Standar CLSI',
    'antibiotics.clsiDesc': 'Zona hambat diukur dalam milimeter (mm) berdasarkan standar Clinical and Laboratory Standards Institute (CLSI).',
    'antibiotics.found': 'Antibiotik Ditemukan',
    'antibiotics.mechanism': 'Mekanisme Kerja',
    'antibiotics.spectrum': 'Spektrum',
    'antibiotics.clsiStandards': 'Standar CLSI (Diameter Zona Hambat)',
    'antibiotics.susceptible': 'Rentan',
    'antibiotics.intermediate': 'Intermediat',
    'antibiotics.resistant': 'Resisten',
    'antibiotics.notFound': 'Antibiotik tidak ditemukan',
    'antibiotics.tryOther': 'Coba kata kunci lain',

    
    'analysis.title': 'Detail Analisis',
    'analysis.subtitle': 'Hasil pengujian sensitivitas antibiotik',
    'analysis.idTest': 'ID TEST',
    'analysis.table1': 'Tabel 1 - Antibiotik A (Primer)',
    'analysis.table2': 'Tabel 2 - Antibiotik B (Sekunder)',
    'analysis.table3': 'Tabel 3 - Bakteri & Rangkuman Analisis',
    'analysis.antibiotic': 'Antibiotik',
    'analysis.mechanismDesc': 'Deskripsi Mekanisme',
    'analysis.interpretation': 'Interpretasi',
    'analysis.bacteria': 'Bakteri Uji',
    'analysis.summary': 'Rangkuman Hasil',
    'analysis.primaryData': 'Data sensitivitas primer untuk antibiotik A',
    'analysis.secondaryData': 'Data sensitivitas sekunder untuk antibiotik B',
    'analysis.summaryData': 'Rangkuman menyatukan respons terhadap kedua antibiotik',
    'analysis.clsiFooter': 'Hasil interpretasi didasarkan pada standar CLSI (Clinical and Laboratory Standards Institute) dengan pengukuran diameter zona hambat.',

    
    'common.status': 'Status',
    'common.completed': 'Selesai',
    'common.failed': 'Gagal',
    'common.processing': 'Processing',
    'common.resistant': 'Resisten',
    'common.susceptible': 'Rentan',
    'common.intermediate': 'Intermediat',
    'common.unknown': 'Tidak Diketahui',
    'common.tests': 'tes',
    'common.mm': 'mm',
  },
  en: {
    
    'app.title': 'BioLab Analyzer',
    'app.subtitle': 'Antibiotic Resistance Analysis',
    'dashboard.startAnalysis': 'Start New Analysis',
    'dashboard.startAnalysisDesc': 'Take a photo of petri dish to begin',
    'dashboard.recentAnalysis': 'Recent Analysis',
    'dashboard.viewAll': 'View All',
    'dashboard.noAnalysis': 'No analysis yet',
    'dashboard.noAnalysisDesc': 'Start your first analysis',
    'dashboard.test': 'Test',
    'dashboard.totalTests': 'Total Tests',
    'dashboard.completed': 'Completed',
    'dashboard.failed': 'Failed',
    'dashboard.quickMenu': 'Quick Menu',
    'dashboard.antibioticsDb': 'Antibiotics Database',
    'dashboard.antibioticsDbDesc': 'Reference & CLSI standards',
    'dashboard.settings': 'Settings',
    'dashboard.settingsDesc': 'App preferences',

    
    'camera.back': 'Back',
    'camera.instruction': 'Align petri dish with circle guides',
    'camera.tilt': 'Tilt Level',
    'camera.goodAngle': 'Good Angle ✓',
    'camera.levelCamera': 'Level Camera',
    'camera.retake': 'Retake',
    'camera.usePhoto': 'Use Photo',

    
    'loading.processing': 'Processing Analysis',
    'loading.pleaseWait': 'Please wait a moment...',
    'loading.step': 'Step',
    'loading.of': 'of',
    'loading.correctAngle': 'Correcting photo angle...',
    'loading.detectZone': 'Detecting inhibition zone...',
    'loading.measureDiameter': 'Measuring diameter...',
    'loading.accessDb': 'Accessing database...',
    'loading.generateReport': 'Generating report...',
    'loading.algorithm': 'Homographic projection and circle detection algorithms are working',

    
    'report.title': 'Analysis Report',
    'report.testNum': 'Test',
    'report.imageComparison': 'Image Comparison',
    'report.originalPhoto': 'Original Photo',
    'report.detectionResult': 'Detection Result',
    'report.detectionDesc': 'Green circle shows detected inhibition zone. Red line shows measurement diameter.',
    'report.resultSummary': 'Result Summary',
    'report.detailAnalysis': 'Detailed Analysis',
    'report.interpretationGuide': 'Interpretation Guide',
    'report.susceptible': 'Susceptible',
    'report.intermediate': 'Intermediate',
    'report.resistant': 'Resistant',
    'report.exportPdf': 'Export as PDF',
    'report.editData': 'Edit Data',
    'report.delete': 'Delete',
    'report.saveDb': 'Save to Database',
    'report.share': 'Share Report',
    'report.notes': 'Notes',
    'report.editTitle': 'Edit Analysis Data',
    'report.editDesc': 'Update analysis results information',
    'report.bacteriaName': 'Bacteria Name',
    'report.antibioticA': 'Antibiotic A',
    'report.antibioticADesc': 'Antibiotic A Description',
    'report.antibioticB': 'Antibiotic B',
    'report.antibioticBDesc': 'Antibiotic B Description',
    'report.diameter': 'Diameter (mm)',
    'report.notesPlaceholder': 'Add observation notes...',
    'report.cancel': 'Cancel',
    'report.saveChanges': 'Save Changes',
    'report.deleteTitle': 'Delete Analysis Data',
    'report.deleteConfirm': 'Are you sure you want to delete analysis data',
    'report.deleteWarning': 'This action cannot be undone.',
    'report.saved': 'Results have been saved to database',
    'report.updated': 'Data successfully updated',

    
    'history.title': 'Database History',
    'history.totalAnalysis': 'total analysis',
    'history.search': 'Search Test ID or Bacteria Name...',
    'history.filterSort': 'Filter & Sort',
    'history.filterData': 'Filter Data',
    'history.filterPeriod': 'Period Filter',
    'history.month': 'Month',
    'history.year': 'Year',
    'history.allMonths': 'All Months',
    'history.allYears': 'All Years',
    'history.status': 'Status',
    'history.result': 'Result',
    'history.all': 'All',
    'history.sort': 'Sort',
    'history.newest': 'Newest',
    'history.oldest': 'Oldest',
    'history.resetFilters': 'Reset All Filters',
    'history.activeFilters': 'Active Filters:',
    'history.showing': 'Showing',
    'history.from': 'of',
    'history.results': 'results',
    'history.noResults': 'No results found',
    'history.tryDifferent': 'Try changing filters or search keywords',
    'history.notIdentified': 'Not identified',
    'history.antibiotic': 'Antibiotic',

    
    'settings.title': 'Settings',
    'settings.subtitle': 'App preferences',
    'settings.appearance': 'Appearance',
    'settings.darkMode': 'Dark Mode',
    'settings.darkModeDesc': 'Enable dark theme',
    'settings.language': 'Language',
    'settings.languageApp': 'App Language',
    'settings.languageDesc': 'Choose your preferred language',
    'settings.indonesian': 'Bahasa Indonesia',
    'settings.english': 'English',
    'settings.notifications': 'Notifications',
    'settings.pushNotif': 'Push Notifications',
    'settings.pushNotifDesc': 'Receive analysis result notifications',
    'settings.about': 'About',
    'settings.version': 'Version',
    'settings.description': 'Antibiotic resistance analysis application using computer vision technology for automatic inhibition zone detection.',
    'settings.copyright': '© 2025 BioLab Analyzer. All rights reserved.',
    'settings.dataManagement': 'Data Management',
    'settings.backup': 'Backup Data to Cloud',
    'settings.restore': 'Restore Data from Backup',
    'settings.deleteAll': 'Delete All Data',
    'settings.deleteConfirm': 'Are you sure you want to delete all data? This action cannot be undone.',
    'settings.deleteSuccess': 'Data successfully deleted. Refresh page to reset application.',

    
    'antibiotics.title': 'Antibiotics Database',
    'antibiotics.subtitle': 'Reference & CLSI Standards',
    'antibiotics.search': 'Search antibiotics...',
    'antibiotics.clsiInfo': 'CLSI Standards',
    'antibiotics.clsiDesc': 'Inhibition zone measured in millimeters (mm) based on Clinical and Laboratory Standards Institute (CLSI) standards.',
    'antibiotics.found': 'Antibiotics Found',
    'antibiotics.mechanism': 'Mechanism of Action',
    'antibiotics.spectrum': 'Spectrum',
    'antibiotics.clsiStandards': 'CLSI Standards (Inhibition Zone Diameter)',
    'antibiotics.susceptible': 'Susceptible',
    'antibiotics.intermediate': 'Intermediate',
    'antibiotics.resistant': 'Resistant',
    'antibiotics.notFound': 'Antibiotic not found',
    'antibiotics.tryOther': 'Try other keywords',

    
    'analysis.title': 'Detailed Analysis',
    'analysis.subtitle': 'Antibiotic sensitivity test results',
    'analysis.idTest': 'TEST ID',
    'analysis.table1': 'Table 1 - Antibiotic A (Primary)',
    'analysis.table2': 'Table 2 - Antibiotic B (Secondary)',
    'analysis.table3': 'Table 3 - Bacteria & Analysis Summary',
    'analysis.antibiotic': 'Antibiotic',
    'analysis.mechanismDesc': 'Mechanism Description',
    'analysis.interpretation': 'Interpretation',
    'analysis.bacteria': 'Test Bacteria',
    'analysis.summary': 'Results Summary',
    'analysis.primaryData': 'Primary sensitivity data for antibiotic A',
    'analysis.secondaryData': 'Secondary sensitivity data for antibiotic B',
    'analysis.summaryData': 'Summary combines responses to both antibiotics',
    'analysis.clsiFooter': 'Interpretation results are based on CLSI (Clinical and Laboratory Standards Institute) standards with inhibition zone diameter measurement.',

    
    'common.status': 'Status',
    'common.completed': 'Completed',
    'common.failed': 'Failed',
    'common.processing': 'Processing',
    'common.resistant': 'Resistant',
    'common.susceptible': 'Susceptible',
    'common.intermediate': 'Intermediate',
    'common.unknown': 'Unknown',
    'common.tests': 'tests',
    'common.mm': 'mm',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'id';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
