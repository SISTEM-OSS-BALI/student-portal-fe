-- ========================================================
-- Seed Data: Documents (Snake_case Schema Compatibility)
-- ========================================================

CREATE TABLE IF NOT EXISTS `documents` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `internal_code` VARCHAR(191) NOT NULL,
    `file_type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `translation_needed` ENUM('yes', 'no') NOT NULL DEFAULT 'no',
    `required` BOOLEAN NOT NULL DEFAULT false,
    `auto_rename_pattern` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(500) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `doc_internal_code_uq` (`internal_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `documents` 
(`id`, `label`, `internal_code`, `file_type`, `category`, `translation_needed`, `required`, `auto_rename_pattern`, `notes`)
VALUES
('doc-passport', 'PASSPORT', 'PASSPORT', 'PDF', 'IDENTITAS', 'no', true, '[STUDENT_NAME]_PASSPORT', 'Scan berwarna halaman identitas paspor yang masih aktif minimal 6 bulan.'),
('doc-diploma', 'DIPLOMA CERTIFICATE', 'DIPLOMA', 'PDF', 'AKADEMIK', 'yes', false, '[STUDENT_NAME]_DIPLOMA', 'Scan ijazah asli atau legalisir dalam format PDF resolusi tinggi.'),
('doc-transcript', 'Transkrip Nilai Akademik', 'ACADEMIC_TRANSCRIPT', 'PDF', 'AKADEMIK', 'yes', true, '[STUDENT_NAME]_TRANSCRIPT', 'Scan transkrip nilai akademik lengkap dari semester awal hingga akhir.'),
('doc-birth-cert', 'BIRTH CERTIFICATE', 'BIRTH_CERTIFICATE', 'PDF', 'IDENTITAS', 'yes', true, '[STUDENT_NAME]_AKTA_KELAHIRAN', 'Scan akta kelahiran asli berwarna.'),
('doc-family-card', 'FAMILY CARD', 'FAMILY_CARD', 'PDF', 'IDENTITAS', 'yes', true, '[STUDENT_NAME]_KARTU_KELUARGA', 'Scan Kartu Keluarga terbaru yang terdaftar resmi di Disdukcapil.'),
('doc-ktp', 'ID CARD', 'NATIONAL_ID', 'IMAGE', 'IDENTITAS', 'no', true, '[STUDENT_NAME]_KTP', 'Foto atau scan KTP asli yang jelas dan tidak buram.'),
('doc-photo', 'PHOTO 4X6', 'PROFILE_PHOTO', 'IMAGE', 'IDENTITAS', 'no', true, '[STUDENT_NAME]_PAS_FOTO', 'Pas foto formal terbaru dengan latar belakang polos.'),
('doc-english-test', 'IELTS', 'ENGLISH_TEST', 'PDF', 'AKADEMIK', 'no', true, '[STUDENT_NAME]_ENGLISH_CERTIFICATE', 'Sertifikat resmi IELTS, TOEFL iBT, atau PTE Academic.'),
('doc-bank-statement', 'SPONSOR BANK STATEMENT', 'BANK_STATEMENT', 'PDF', 'KEUANGAN', 'no', true, '[STUDENT_NAME]_BANK_STATEMENT', 'Rekening koran 3 bulan terakhir dari bank yang disetujui.'),
('doc-sponsor-letter', 'Surat Pernyataan Sponsor Finansial', 'SPONSOR_LETTER', 'PDF', 'KEUANGAN', 'yes', false, '[STUDENT_NAME]_SURAT_SPONSOR', 'Surat pernyataan dukungan finansial bermeterai dari pihak sponsor.'),
('doc-cv', 'Curriculum Vitae (CV)', 'CURRICULUM_VITAE', 'PDF', 'AKADEMIK', 'no', true, '[STUDENT_NAME]_CV', 'Curriculum Vitae terbaru dalam bahasa Inggris.'),
('doc-sop', 'Statement of Purpose (SOP) / GTE Statement', 'STATEMENT_OF_PURPOSE', 'PDF', 'AKADEMIK', 'no', true, '[STUDENT_NAME]_SOP', 'Surat pernyataan motivasi studi.'),
('doc-recommendation', 'Surat Rekomendasi Akademik / Kerja', 'RECOMMENDATION_LETTER', 'PDF', 'AKADEMIK', 'yes', false, '[STUDENT_NAME]_REKOMENDASI', 'Surat rekomendasi dari dosen atau atasan kerja langsung.'),
('doc-skck', 'Surat Keterangan Catatan Kepolisian (SKCK)', 'POLICE_CLEARANCE', 'PDF', 'Lainnya', 'yes', false, '[STUDENT_NAME]_SKCK', 'SKCK tingkat Polda atau Mabes Polri.'),
('doc-medical', 'Hasil Pemeriksaan Kesehatan (Medical Check-up)', 'MEDICAL_CHECKUP', 'PDF', 'Lainnya', 'no', false, '[STUDENT_NAME]_MEDICAL', 'Laporan e-Medical dari panel klinik kedutaan.')
ON DUPLICATE KEY UPDATE
    `label` = VALUES(`label`),
    `file_type` = VALUES(`file_type`),
    `category` = VALUES(`category`),
    `translation_needed` = VALUES(`translation_needed`),
    `required` = VALUES(`required`),
    `auto_rename_pattern` = VALUES(`auto_rename_pattern`),
    `notes` = VALUES(`notes`);
