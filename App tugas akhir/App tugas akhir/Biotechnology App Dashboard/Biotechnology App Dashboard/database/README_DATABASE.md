# 🗄️ Database Setup Guide - Biotechnology Dashboard

## Cara Install Database di XAMPP

### Step 1: Start XAMPP
1. Buka XAMPP Control Panel
2. Start **Apache** dan **MySQL**
3. Pastikan keduanya berjalan (status hijau)

### Step 2: Import Database

#### Cara A: Via phpMyAdmin (Recommended)
1. Buka browser, akses: `http://localhost/phpmyadmin`
2. Klik tab **"Import"**
3. Klik **"Choose File"** → pilih file `biotech_db.sql`
4. Klik **"Go"** / **"Import"**
5. Tunggu sampai selesai ✅

#### Cara B: Via MySQL Command Line
```bash
# Buka terminal/cmd
cd C:\xampp\mysql\bin

# Import database
mysql -u root -p < "C:\path\to\biotech_db.sql"
```

### Step 3: Verifikasi
Setelah import, cek di phpMyAdmin:
- Database: `biotech_dashboard`
- Tables: 10 tabel + 2 views + 3 stored procedures

---

## 📋 Struktur Database

```
biotech_dashboard/
├── users              # Data user (email, password, nama)
├── sessions           # Login sessions
├── antibiotics        # Master data antibiotik (25 jenis)
├── analyses           # Hasil analisis per user
├── results            # Detail hasil per antibiotik
├── user_settings      # Pengaturan per user
├── organizations      # Data organisasi
├── organization_admins# Akun admin organisasi
├── organization_teams # Tim per organisasi
├── organization_members # Akun member per tim
├── v_user_analysis_summary (VIEW)
└── v_recent_analyses (VIEW)
```

---

## 🔑 Konsep Data Isolation

Setiap user hanya bisa akses data miliknya sendiri:

```sql
-- User Budi login (user_id = 'user_budi_123')
-- Query hanya ambil data milik Budi:
SELECT * FROM analyses WHERE user_id = 'user_budi_123';

-- User Ani login (user_id = 'user_ani_456')
-- Query hanya ambil data milik Ani:
SELECT * FROM analyses WHERE user_id = 'user_ani_456';
```

**Visualisasi:**
```
┌─────────────────────────────────────────┐
│           DATABASE                       │
├─────────────────────────────────────────┤
│  User Budi      User Ani      User X    │
│  ┌─────────┐   ┌─────────┐   ┌────────┐│
│  │Analysis1│   │Analysis1│   │Analysis│ │
│  │Analysis2│   │Analysis2│   │   ...  │ │
│  │Analysis3│   │   ...   │   │        │ │
│  └─────────┘   └─────────┘   └────────┘│
│       ↑              ↑            ↑     │
│   user_id        user_id      user_id   │
└─────────────────────────────────────────┘
```

---

## 📡 Contoh Query

### 1. Login User
```sql
SELECT * FROM users 
WHERE email = 'test@example.com' 
AND is_active = TRUE;
```

### 2. Get User's Analyses
```sql
-- Menggunakan Stored Procedure
CALL sp_get_user_analyses('user_test_001');

-- Atau manual query
SELECT * FROM analyses 
WHERE user_id = 'user_test_001' 
ORDER BY created_at DESC;
```

### 3. Get User Statistics
```sql
CALL sp_get_user_statistics('user_test_001');
```

### 4. Create New Analysis
```sql
INSERT INTO analyses (
    id, user_id, bacteria_name, 
    antibiotic_a, antibiotic_a_result,
    status, original_image
) VALUES (
    'AN_20260201_001',
    'user_test_001',
    'Escherichia coli',
    'AB010', -- Ciprofloxacin
    'resistant',
    'completed',
    '/uploads/images/petri_001.jpg'
);
```

### 5. Get Antibiotics List
```sql
SELECT antibiotic_id, name, category, 
       resistance_threshold, sensitive_threshold 
FROM antibiotics 
WHERE is_active = TRUE 
ORDER BY name;
```

---

## 🔐 Test Account

| Field | Value |
|-------|-------|
| Email | test@example.com |
| Password | password123 |
| User ID | user_test_001 |

> ⚠️ Password di database sudah di-hash. Untuk login, gunakan password asli.

---

## 🛠️ Konfigurasi Koneksi

### PHP (untuk API)
```php
<?php
$host = 'localhost';
$dbname = 'biotech_dashboard';
$username = 'root';
$password = ''; // default XAMPP kosong

$conn = new PDO(
    "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
    $username,
    $password
);
```

### JavaScript (Supabase Alternative)
Jika menggunakan Supabase, setup berbeda. File ini untuk XAMPP lokal.

---

## 📊 ERD (Entity Relationship Diagram)

```
┌──────────┐       ┌──────────────┐       ┌────────────┐
│  users   │───┬───│   analyses   │───────│  results   │
└──────────┘   │   └──────────────┘       └────────────┘
     │         │                                  │
     │         │                                  ▼
     ▼         │                            ┌────────────┐
┌──────────┐   │                            │ antibiotics│
│ sessions │   │                            └────────────┘
└──────────┘   │
           ▼
    ┌──────────────┐
    │user_settings │
    └──────────────┘

┌───────────────┐      ┌────────────────────┐      ┌─────────────────────┐
│ organizations │──────│ organization_teams │──────│ organization_members│
└───────────────┘      └────────────────────┘      └─────────────────────┘
    │
    └──────────────► organization_admins
```

---

## ⚡ Tips Performance

1. **Selalu filter dengan user_id** - Hindari full table scan
2. **Gunakan index yang ada** - Query akan lebih cepat
3. **Limit hasil** - Gunakan LIMIT untuk pagination
4. **Compress images** - Jangan simpan gambar terlalu besar

---

## 🆘 Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
- Cek password MySQL di phpMyAdmin
- Default XAMPP: username=root, password=(kosong)

### Error: "Unknown database 'biotech_dashboard'"
- Jalankan ulang script SQL
- Pastikan CREATE DATABASE berhasil

### Error: "Table doesn't exist"
- Import ulang file `biotech_db.sql`
- Cek tidak ada error saat import
