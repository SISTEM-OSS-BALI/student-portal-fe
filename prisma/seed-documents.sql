-- ==============================================================================
-- OSS BALI STUDENT PORTAL - SEED MASTER DOKUMEN LENGKAP
-- Target Database: db_student_portal
-- Target Table: documents_managements (GORM Backend Table)
-- ==============================================================================

USE db_student_portal;

INSERT INTO `documents_managements` 
(`id`, `label`, `internal_code`, `file_type`, `category`, `translation_needed`, `required`, `auto_rename_pattern`, `notes`, `created_at`, `updated_at`)
VALUES
-- 1. Dokumen Identitas & Perjalanan
('doc_pass', 'PASSPORT', 'PASSPORT', 'pdf', 'identity', 'NO', 1, '{studentName}_PASSPORT.pdf', 'Scan warna seluruh halaman identitas paspor yang masih aktif minimal 6 bulan sebelum keberangkatan.', NOW(), NOW()),
('doc_birth_cert', 'BIRTH CERTIFICATE', 'BIRTH_CERTIFICATE', 'pdf', 'identity', 'YES', 1, '{studentName}_BIRTH_CERTIFICATE.pdf', 'Scan akta kelahiran asli berwarna yang diterbitkan oleh Disdukcapil.', NOW(), NOW()),
('doc_family_card', 'FAMILY CARD', 'FAMILY_CARD', 'pdf', 'identity', 'YES', 1, '{studentName}_FAMILY_CARD.pdf', 'Scan Kartu Keluarga terbaru yang memuat data seluruh anggota keluarga inti.', NOW(), NOW()),
('doc_ktp', 'ID CARD', 'NATIONAL_ID', 'image', 'identity', 'NO', 1, '{studentName}_KTP.png', 'Foto atau scan KTP asli yang jelas, tidak terpotong, dan dapat dibaca dengan baik.', NOW(), NOW()),
('doc_photo', 'PHOTO 4X6', 'PROFILE_PHOTO', 'image', 'identity', 'NO', 1, '{studentName}_PAS_FOTO.png', 'Pasfoto formal studio terbaru dengan pencahayaan baik dan latar belakang putih polos.', NOW(), NOW()),

-- 2. Dokumen Akademik & Kualifikasi
('doc_ijzh', 'HIGH SCHOOL CERTIFICATE', 'IJAZAH', 'pdf', 'academic', 'YES', 1, '{studentName}_IJAZAH.pdf', 'Scan ijazah asli atau legalisir pendidikan formal terakhir dalam format PDF resolusi tinggi.', NOW(), NOW()),
('doc_trns', 'Transkrip Nilai Lengkap', 'TRANSKRIP', 'pdf', 'academic', 'YES', 1, '{studentName}_TRANSKRIP.pdf', 'Transkrip nilai akademik lengkap dari semester awal hingga akhir dalam bahasa asli.', NOW(), NOW()),
('doc_ielts', 'IELTS', 'ENG_CERT', 'pdf', 'academic', 'NO', 1, '{studentName}_ENGLISH_CERT.pdf', 'Skor sertifikat kemampuan bahasa Inggris resmi yang masih berlaku (maksimal 2 tahun).', NOW(), NOW()),
('doc_cv', 'Curriculum Vitae (CV) Bahasa Inggris', 'CURRICULUM_VITAE', 'pdf', 'academic', 'NO', 1, '{studentName}_CV.pdf', 'Curriculum Vitae formal dalam bahasa Inggris mencakup riwayat studi dan pengalaman.', NOW(), NOW()),
('doc_sop', 'Statement of Purpose (SOP) / GTE Statement', 'STATEMENT_OF_PURPOSE', 'pdf', 'academic', 'NO', 1, '{studentName}_SOP.pdf', 'Esai motivasi studi yang menjelaskan alasan memilih jurusan, institusi, dan prospek karir.', NOW(), NOW()),
('doc_rekomendasi', 'Surat Rekomendasi Akademik / Kerja', 'RECOMMENDATION_LETTER', 'pdf', 'academic', 'YES', 0, '{studentName}_RECOMMENDATION.pdf', 'Surat rekomendasi dari dosen pembimbing, kepala sekolah, atau atasan kerja langsung.', NOW(), NOW()),

-- 3. Dokumen Finansial & Sponsor
('doc_bank', 'SPONSOR BANK STATEMENT', 'FINANCIAL', 'pdf', 'finance', 'NO', 1, '{studentName}_BANK_STATEMENT.pdf', 'Rekening koran 3 bulan terakhir dari bank yang disetujui untuk persyaratan visa.', NOW(), NOW()),
('doc_sponsor', 'Surat Pernyataan Sponsor Finansial', 'SPONSOR_LETTER', 'pdf', 'finance', 'YES', 0, '{studentName}_SPONSOR_LETTER.pdf', 'Surat pernyataan dukungan finansial bermeterai dan ditandatangani oleh pihak sponsor/orang tua.', NOW(), NOW()),

-- 4. Dokumen Pendukung Lainnya
('doc_skck', 'Surat Keterangan Catatan Kepolisian (SKCK)', 'POLICE_CLEARANCE', 'pdf', 'other', 'YES', 0, '{studentName}_SKCK.pdf', 'SKCK tingkat Polda atau Mabes Polri untuk keperluan studi ke luar negeri.', NOW(), NOW()),
('doc_medical', 'Hasil Pemeriksaan Kesehatan (Medical Check-up)', 'MEDICAL_CHECKUP', 'pdf', 'other', 'NO', 0, '{studentName}_MEDICAL_REPORT.pdf', 'Laporan hasil pemeriksaan kesehatan dari panel klinik kedutaan yang ditunjuk.', NOW(), NOW())

ON DUPLICATE KEY UPDATE 
    `label` = VALUES(`label`), 
    `internal_code` = VALUES(`internal_code`), 
    `file_type` = VALUES(`file_type`), 
    `category` = VALUES(`category`), 
    `translation_needed` = VALUES(`translation_needed`), 
    `required` = VALUES(`required`), 
    `auto_rename_pattern` = VALUES(`auto_rename_pattern`), 
    `notes` = VALUES(`notes`), 
    `updated_at` = NOW();
