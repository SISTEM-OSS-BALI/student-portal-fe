-- ==============================================================================
-- OSS BALI STUDENT PORTAL - COMPLETE STUDENT ONBOARDING & CV SEED SCRIPT
-- Populates:
-- 1. Student Test User (Budi Pratama Santoso) with Campus Target & Study Info
-- 2. Director & Admission Accounts (Reviewers)
-- 3. 7 Submissions for All Question Bases (answer_submissions)
-- 4. 46 Answers across all Onboarding Questionnaire Categories (answer_questions)
-- 5. Selected Options for Select / Radio questions (answer_selected_options)
-- 6. Verification & Approval status (answer_approvals) -> READY TO GENERATE CV AI!
-- ==============================================================================

USE db_student_portal;

-- ------------------------------------------------------------------------------
-- 1. SEED / UPDATE TEST USERS
-- Password bcrypt default: 'password123'
-- ------------------------------------------------------------------------------

-- (A) DIRECTOR (Super Admin & Reviewer)
INSERT INTO users (
    id, name, email, password, role, created_at, updated_at
) VALUES (
    'usr_dir_admin_001',
    'Admin Director',
    'apply@onestepsolutionbali.com',
    '$2a$10$wSj6k8u2zY.QfG1m3r4wEOXkL7w5H0j2qP4t8bY7tV6s5u4r3q2a',
    'DIRECTOR',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE 
    role = 'DIRECTOR',
    name = 'Admin Director',
    updated_at = NOW();

-- (B) ADMISSION STAFF
INSERT INTO users (
    id, name, email, password, role, created_at, updated_at
) VALUES (
    'usr_adm_staff_001',
    'Admission Staff',
    'admission@onestepsolutionbali.com',
    '$2a$10$wSj6k8u2zY.QfG1m3r4wEOXkL7w5H0j2qP4t8bY7tV6s5u4r3q2a',
    'ADMISSION',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE 
    role = 'ADMISSION',
    name = 'Admission Staff',
    updated_at = NOW();

-- (C) TEST STUDENT (Budi Pratama Santoso)
-- Diupdate lengkap dengan nama kampus, jenjang, visa Australia subclass 500
INSERT INTO users (
    id, name, email, password, role, no_phone,
    stage_id, visa_type, name_campus, degree, name_degree, source,
    created_at, updated_at
) VALUES (
    'usr_std_test_001',
    'Budi Pratama Santoso',
    'student@onestepsolutionbali.com',
    '$2a$10$wSj6k8u2zY.QfG1m3r4wEOXkL7w5H0j2qP4t8bY7tV6s5u4r3q2a',
    'STUDENT',
    '+6281234567890',
    'stg_aus_1',
    'student_visa_subclass_500',
    'University of Melbourne',
    'Master',
    'Master of Information Technology',
    'Website',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE 
    name = 'Budi Pratama Santoso',
    no_phone = '+6281234567890',
    stage_id = 'stg_aus_1',
    visa_type = 'student_visa_subclass_500',
    name_campus = 'University of Melbourne',
    degree = 'Master',
    name_degree = 'Master of Information Technology',
    source = 'Website',
    updated_at = NOW();

-- Ambil ID student untuk referensi konsisten
SET @student_id = (SELECT id FROM users WHERE email = 'student@onestepsolutionbali.com' LIMIT 1);
SET @reviewer_id = (SELECT id FROM users WHERE email = 'apply@onestepsolutionbali.com' LIMIT 1);

-- ------------------------------------------------------------------------------
-- 2. SEED SUBMISSIONS (answer_submissions)
-- 7 Kategori Form Onboarding OSS
-- ------------------------------------------------------------------------------
INSERT INTO answer_submissions (id, base_id, student_id, status, version, submitted_at, created_at, updated_at) VALUES
('sub_pd_std1',  'qb_personal_details',     @student_id, 'APPROVED', 1, NOW(), NOW(), NOW()),
('sub_fe_std1',  'qb_formal_education',     @student_id, 'APPROVED', 1, NOW(), NOW(), NOW()),
('sub_nfe_std1', 'qb_nonformal_education',  @student_id, 'APPROVED', 1, NOW(), NOW(), NOW()),
('sub_eh_std1',  'qb_employment_history',   @student_id, 'APPROVED', 1, NOW(), NOW(), NOW()),
('sub_ac_std1',  'qb_achievement',          @student_id, 'APPROVED', 1, NOW(), NOW(), NOW()),
('sub_th_std1',  'qb_travel_history',       @student_id, 'APPROVED', 1, NOW(), NOW(), NOW()),
('sub_nok_std1', 'qb_next_of_kin',          @student_id, 'APPROVED', 1, NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    status = 'APPROVED',
    submitted_at = NOW(),
    updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 3. SEED ANSWERS (answer_questions)
-- Lengkap untuk keperluan Generate CV AI & Template CV Resmi
-- ------------------------------------------------------------------------------

-- (A) PERSONAL DETAILS
INSERT INTO answer_questions (id, submission_id, question_id, answer_text, student_id, created_at, updated_at) VALUES
('ans_pd_01_std1', 'sub_pd_std1', 'q_pd_01', 'Budi Pratama Santoso', @student_id, NOW(), NOW()),
('ans_pd_02_std1', 'sub_pd_std1', 'q_pd_02', 'Budi', @student_id, NOW(), NOW()),
('ans_pd_03_std1', 'sub_pd_std1', 'q_pd_03', 'Laki-laki (Male)', @student_id, NOW(), NOW()),
('ans_pd_04_std1', 'sub_pd_std1', 'q_pd_04', 'Denpasar', @student_id, NOW(), NOW()),
('ans_pd_05_std1', 'sub_pd_std1', 'q_pd_05', '1998-05-15', @student_id, NOW(), NOW()),
('ans_pd_06_std1', 'sub_pd_std1', 'q_pd_06', 'Indonesia (WNI)', @student_id, NOW(), NOW()),
('ans_pd_07_std1', 'sub_pd_std1', 'q_pd_07', '5171011505980002', @student_id, NOW(), NOW()),
('ans_pd_08_std1', 'sub_pd_std1', 'q_pd_08', 'B8392014', @student_id, NOW(), NOW()),
('ans_pd_09_std1', 'sub_pd_std1', 'q_pd_09', '2032-11-20', @student_id, NOW(), NOW()),
('ans_pd_10_std1', 'sub_pd_std1', 'q_pd_10', 'Belum Menikah (Single)', @student_id, NOW(), NOW()),
('ans_pd_11_std1', 'sub_pd_std1', 'q_pd_11', 'Islam', @student_id, NOW(), NOW()),
('ans_pd_12_std1', 'sub_pd_std1', 'q_pd_12', '+6281234567890', @student_id, NOW(), NOW()),
('ans_pd_13_std1', 'sub_pd_std1', 'q_pd_13', 'Jl. Sunset Road No. 88, Seminyak, Kuta', @student_id, NOW(), NOW()),
('ans_pd_14_std1', 'sub_pd_std1', 'q_pd_14', 'Badung', @student_id, NOW(), NOW()),
('ans_pd_15_std1', 'sub_pd_std1', 'q_pd_15', 'Bali', @student_id, NOW(), NOW()),
('ans_pd_16_std1', 'sub_pd_std1', 'q_pd_16', '80361', @student_id, NOW(), NOW()),
('ans_pd_17_std1', 'sub_pd_std1', 'q_pd_17', '173', @student_id, NOW(), NOW()),
('ans_pd_18_std1', 'sub_pd_std1', 'q_pd_18', '80', @student_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text), updated_at = NOW();

-- (B) FORMAL EDUCATION
INSERT INTO answer_questions (id, submission_id, question_id, answer_text, student_id, created_at, updated_at) VALUES
('ans_fe_01_std1', 'sub_fe_std1', 'q_fe_01', 'Sarjana (S1 / Bachelor Degree)', @student_id, NOW(), NOW()),
('ans_fe_02_std1', 'sub_fe_std1', 'q_fe_02', 'Universitas Udayana', @student_id, NOW(), NOW()),
('ans_fe_03_std1', 'sub_fe_std1', 'q_fe_03', 'Teknologi Informasi (Information Technology)', @student_id, NOW(), NOW()),
('ans_fe_04_std1', 'sub_fe_std1', 'q_fe_04', 'Denpasar, Indonesia', @student_id, NOW(), NOW()),
('ans_fe_05_std1', 'sub_fe_std1', 'q_fe_05', '2019', @student_id, NOW(), NOW()),
('ans_fe_06_std1', 'sub_fe_std1', 'q_fe_06', '2023', @student_id, NOW(), NOW()),
('ans_fe_07_std1', 'sub_fe_std1', 'q_fe_07', '3.82 / 4.00 (Cum Laude)', @student_id, NOW(), NOW()),
('ans_fe_08_std1', 'sub_fe_std1', 'q_fe_08', 'Bahasa Inggris (English)', @student_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text), updated_at = NOW();

-- (C) NONFORMAL EDUCATION
INSERT INTO answer_questions (id, submission_id, question_id, answer_text, student_id, created_at, updated_at) VALUES
('ans_nfe_01_std1', 'sub_nfe_std1', 'q_nfe_01', 'IELTS Academic Intensive & Cloud System Specialist', @student_id, NOW(), NOW()),
('ans_nfe_02_std1', 'sub_nfe_std1', 'q_nfe_02', 'IALF Bali & Google Cloud Skills Academy', @student_id, NOW(), NOW()),
('ans_nfe_03_std1', 'sub_nfe_std1', 'q_nfe_03', '2023-08-01', @student_id, NOW(), NOW()),
('ans_nfe_04_std1', 'sub_nfe_std1', 'q_nfe_04', '2023-11-25', @student_id, NOW(), NOW()),
('ans_nfe_05_std1', 'sub_nfe_std1', 'q_nfe_05', 'IALF-2023-ENG-8492', @student_id, NOW(), NOW()),
('ans_nfe_06_std1', 'sub_nfe_std1', 'q_nfe_06', 'IELTS Academic Preparation (Band 7.5), Cloud Architecture, Containerization Docker & Kubernetes, serta API Security.', @student_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text), updated_at = NOW();

-- (D) EMPLOYMENT HISTORY
INSERT INTO answer_questions (id, submission_id, question_id, answer_text, student_id, created_at, updated_at) VALUES
('ans_eh_01_std1', 'sub_eh_std1', 'q_eh_01', 'PT Bali Global Technology Nusantara', @student_id, NOW(), NOW()),
('ans_eh_02_std1', 'sub_eh_std1', 'q_eh_02', 'Associate Software Engineer & IT Systems', @student_id, NOW(), NOW()),
('ans_eh_03_std1', 'sub_eh_std1', 'q_eh_03', 'Penuh Waktu (Full-Time)', @student_id, NOW(), NOW()),
('ans_eh_04_std1', 'sub_eh_std1', 'q_eh_04', '2023-09-01', @student_id, NOW(), NOW()),
('ans_eh_05_std1', 'sub_eh_std1', 'q_eh_05', '2024-08-31', @student_id, NOW(), NOW()),
('ans_eh_06_std1', 'sub_eh_std1', 'q_eh_06', 'Tidak (No)', @student_id, NOW(), NOW()),
('ans_eh_07_std1', 'sub_eh_std1', 'q_eh_07', 'Badung, Indonesia', @student_id, NOW(), NOW()),
('ans_eh_08_std1', 'sub_eh_std1', 'q_eh_08', 'Merancang dan memelihara backend API berbasis microservices, mengoptimalkan query database MySQL yang meningkatkan response time sebesar 35%, serta berkolaborasi dengan cross-functional agile teams.', @student_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text), updated_at = NOW();

-- (E) ACHIEVEMENT
INSERT INTO answer_questions (id, submission_id, question_id, answer_text, student_id, created_at, updated_at) VALUES
('ans_ac_01_std1', 'sub_ac_std1', 'q_ac_01', 'Juara 1 National Web & Software Engineering Hackathon', @student_id, NOW(), NOW()),
('ans_ac_02_std1', 'sub_ac_std1', 'q_ac_02', 'Akademik (Academic)', @student_id, NOW(), NOW()),
('ans_ac_03_std1', 'sub_ac_std1', 'q_ac_03', 'Nasional (National)', @student_id, NOW(), NOW()),
('ans_ac_04_std1', 'sub_ac_std1', 'q_ac_04', '2023', @student_id, NOW(), NOW()),
('ans_ac_05_std1', 'sub_ac_std1', 'q_ac_05', 'Kemendikbudristek Republik Indonesia', @student_id, NOW(), NOW()),
('ans_ac_06_std1', 'sub_ac_std1', 'q_ac_06', 'Meraih penghargaan emas dalam perancangan platform integrasi data layanan publik berbasis cloud computing dan kecerdasan buatan.', @student_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text), updated_at = NOW();

-- (F) TRAVEL HISTORY
INSERT INTO answer_questions (id, submission_id, question_id, answer_text, student_id, created_at, updated_at) VALUES
('ans_th_01_std1', 'sub_th_std1', 'q_th_01', 'Australia', @student_id, NOW(), NOW()),
('ans_th_02_std1', 'sub_th_std1', 'q_th_02', 'Liburan / Wisata (Holiday / Tourism)', @student_id, NOW(), NOW()),
('ans_th_03_std1', 'sub_th_std1', 'q_th_03', '2022-07-10', @student_id, NOW(), NOW()),
('ans_th_04_std1', 'sub_th_std1', 'q_th_04', '2022-07-25', @student_id, NOW(), NOW()),
('ans_th_05_std1', 'sub_th_std1', 'q_th_05', 'Visitor Visa (Subclass 600)', @student_id, NOW(), NOW()),
('ans_th_06_std1', 'sub_th_std1', 'q_th_06', 'Tidak Pernah (No)', @student_id, NOW(), NOW()),
('ans_th_07_std1', 'sub_th_std1', 'q_th_07', 'Tidak pernah memiliki catatan penolakan visa ke negara manapun (Clear travel and immigration record).', @student_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text), updated_at = NOW();

-- (G) NEXT OF KIN / PARENTS
INSERT INTO answer_questions (id, submission_id, question_id, answer_text, student_id, created_at, updated_at) VALUES
('ans_nok_01_std1', 'sub_nok_std1', 'q_nok_01', 'Bambang Santoso', @student_id, NOW(), NOW()),
('ans_nok_02_std1', 'sub_nok_std1', 'q_nok_02', 'Ayah Kandung (Father)', @student_id, NOW(), NOW()),
('ans_nok_03_std1', 'sub_nok_std1', 'q_nok_03', '+6281987654321', @student_id, NOW(), NOW()),
('ans_nok_04_std1', 'sub_nok_std1', 'q_nok_04', 'bambang.santoso@example.com', @student_id, NOW(), NOW()),
('ans_nok_05_std1', 'sub_nok_std1', 'q_nok_05', 'Senior Business Managing Director', @student_id, NOW(), NOW()),
('ans_nok_06_std1', 'sub_nok_std1', 'q_nok_06', 'Jl. Sunset Road No. 88, Seminyak, Kuta, Kabupaten Badung, Bali 80361', @student_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text), updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 4. SEED SELECTED OPTIONS (answer_selected_options)
-- Menghubungkan jawaban dropdown/radio ke ID master options
-- ------------------------------------------------------------------------------
INSERT INTO answer_selected_options (answer_id, option_id) VALUES
('ans_pd_03_std1', 'opt_pd_03_1'), -- Jenis Kelamin: Laki-laki
('ans_pd_06_std1', 'opt_pd_06_1'), -- Kewarganegaraan: WNI
('ans_pd_10_std1', 'opt_pd_10_1'), -- Status: Belum Menikah
('ans_pd_11_std1', 'opt_pd_11_1'), -- Agama: Islam
('ans_fe_01_std1', 'opt_fe_01_3'), -- Pendidikan: Sarjana (S1)
('ans_fe_08_std1', 'opt_fe_08_2'), -- Bahasa Pengantar: Inggris
('ans_eh_03_std1', 'opt_eh_03_1'), -- Tipe Kerja: Full-Time
('ans_eh_06_std1', 'opt_eh_06_2'), -- Masih Aktif: Tidak
('ans_ac_02_std1', 'opt_ac_02_1'), -- Prestasi Kategori: Akademik
('ans_ac_03_std1', 'opt_ac_03_4'), -- Tingkat Prestasi: Nasional
('ans_th_02_std1', 'opt_th_02_1'), -- Tujuan Kunjungan: Wisata
('ans_th_06_std1', 'opt_th_06_1'), -- Tolak Visa: Tidak Pernah
('ans_nok_02_std1', 'opt_nok_02_1')  -- Next of Kin: Ayah Kandung
ON DUPLICATE KEY UPDATE option_id = VALUES(option_id);

-- ------------------------------------------------------------------------------
-- 5. SEED APPROVALS (answer_approvals)
-- Status langsung di-approve agar tombol GENERATE CV AI di frontend langsung aktif!
-- ------------------------------------------------------------------------------
INSERT INTO answer_approvals (id, answer_id, student_id, reviewer_id, status, note, reviewed_at, created_at, updated_at) VALUES
('app_pd_01_std1', 'ans_pd_01_std1', @student_id, @reviewer_id, 'approved', 'Data nama valid sesuai KTP & Paspor.', NOW(), NOW(), NOW()),
('app_pd_02_std1', 'ans_pd_02_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_03_std1', 'ans_pd_03_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_04_std1', 'ans_pd_04_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_05_std1', 'ans_pd_05_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_06_std1', 'ans_pd_06_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_07_std1', 'ans_pd_07_std1', @student_id, @reviewer_id, 'approved', 'NIK terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_08_std1', 'ans_pd_08_std1', @student_id, @reviewer_id, 'approved', 'Nomor paspor aktif terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_09_std1', 'ans_pd_09_std1', @student_id, @reviewer_id, 'approved', 'Masa berlaku paspor memenuhi syarat (> 6 bulan).', NOW(), NOW(), NOW()),
('app_pd_10_std1', 'ans_pd_10_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_11_std1', 'ans_pd_11_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_pd_12_std1', 'ans_pd_12_std1', @student_id, @reviewer_id, 'approved', 'Nomor telepon aktif.', NOW(), NOW(), NOW()),
('app_pd_13_std1', 'ans_pd_13_std1', @student_id, @reviewer_id, 'approved', 'Alamat domisili lengkap.', NOW(), NOW(), NOW()),

('app_fe_01_std1', 'ans_fe_01_std1', @student_id, @reviewer_id, 'approved', 'Jenjang S1 terverifikasi.', NOW(), NOW(), NOW()),
('app_fe_02_std1', 'ans_fe_02_std1', @student_id, @reviewer_id, 'approved', 'Institusi terverifikasi di PDDikti.', NOW(), NOW(), NOW()),
('app_fe_03_std1', 'ans_fe_03_std1', @student_id, @reviewer_id, 'approved', 'Jurusan linear dan relevan.', NOW(), NOW(), NOW()),
('app_fe_04_std1', 'ans_fe_04_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_fe_05_std1', 'ans_fe_05_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_fe_06_std1', 'ans_fe_06_std1', @student_id, @reviewer_id, 'approved', 'Lulus tepat waktu.', NOW(), NOW(), NOW()),
('app_fe_07_std1', 'ans_fe_07_std1', @student_id, @reviewer_id, 'approved', 'IPK memenuhi syarat admisi S2.', NOW(), NOW(), NOW()),
('app_fe_08_std1', 'ans_fe_08_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),

('app_nfe_01_std1', 'ans_nfe_01_std1', @student_id, @reviewer_id, 'approved', 'Pelatihan bahasa & IT terverifikasi.', NOW(), NOW(), NOW()),
('app_nfe_02_std1', 'ans_nfe_02_std1', @student_id, @reviewer_id, 'approved', 'Lembaga terakreditasi.', NOW(), NOW(), NOW()),
('app_nfe_03_std1', 'ans_nfe_03_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_nfe_04_std1', 'ans_nfe_04_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_nfe_05_std1', 'ans_nfe_05_std1', @student_id, @reviewer_id, 'approved', 'Sertifikat valid.', NOW(), NOW(), NOW()),
('app_nfe_06_std1', 'ans_nfe_06_std1', @student_id, @reviewer_id, 'approved', 'Keahlian menunjang aplikasi studi.', NOW(), NOW(), NOW()),

('app_eh_01_std1', 'ans_eh_01_std1', @student_id, @reviewer_id, 'approved', 'Pengalaman kerja valid.', NOW(), NOW(), NOW()),
('app_eh_02_std1', 'ans_eh_02_std1', @student_id, @reviewer_id, 'approved', 'Posisi relevan dengan program studi tujuan.', NOW(), NOW(), NOW()),
('app_eh_03_std1', 'ans_eh_03_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_eh_04_std1', 'ans_eh_04_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_eh_05_std1', 'ans_eh_05_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_eh_06_std1', 'ans_eh_06_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_eh_07_std1', 'ans_eh_07_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_eh_08_std1', 'ans_eh_08_std1', @student_id, @reviewer_id, 'approved', 'Deskripsi pekerjaan terinci dan profesional.', NOW(), NOW(), NOW()),

('app_ac_01_std1', 'ans_ac_01_std1', @student_id, @reviewer_id, 'approved', 'Prestasi juara nasional terverifikasi.', NOW(), NOW(), NOW()),
('app_ac_02_std1', 'ans_ac_02_std1', @student_id, @reviewer_id, 'approved', 'Kategori akademik valid.', NOW(), NOW(), NOW()),
('app_ac_03_std1', 'ans_ac_03_std1', @student_id, @reviewer_id, 'approved', 'Tingkat nasional valid.', NOW(), NOW(), NOW()),
('app_ac_04_std1', 'ans_ac_04_std1', @student_id, @reviewer_id, 'approved', 'Data terverifikasi.', NOW(), NOW(), NOW()),
('app_ac_05_std1', 'ans_ac_05_std1', @student_id, @reviewer_id, 'approved', 'Pemberi penghargaan resmi pemerintah.', NOW(), NOW(), NOW()),
('app_ac_06_std1', 'ans_ac_06_std1', @student_id, @reviewer_id, 'approved', 'Prestasi menaikkan daya saing profil GTE/GS.', NOW(), NOW(), NOW()),

('app_th_01_std1', 'ans_th_01_std1', @student_id, @reviewer_id, 'approved', 'Riwayat kunjungan Australia valid.', NOW(), NOW(), NOW()),
('app_th_02_std1', 'ans_th_02_std1', @student_id, @reviewer_id, 'approved', 'Tujuan kunjungan valid.', NOW(), NOW(), NOW()),
('app_th_03_std1', 'ans_th_03_std1', @student_id, @reviewer_id, 'approved', 'Data kedatangan valid.', NOW(), NOW(), NOW()),
('app_th_04_std1', 'ans_th_04_std1', @student_id, @reviewer_id, 'approved', 'Data kepulangan tepat waktu (tidak pernah overstay).', NOW(), NOW(), NOW()),
('app_th_05_std1', 'ans_th_05_std1', @student_id, @reviewer_id, 'approved', 'Subclass visa sebelumnya valid.', NOW(), NOW(), NOW()),
('app_th_06_std1', 'ans_th_06_std1', @student_id, @reviewer_id, 'approved', 'Imigrasi bersih (No visa refusal).', NOW(), NOW(), NOW()),
('app_th_07_std1', 'ans_th_07_std1', @student_id, @reviewer_id, 'approved', 'Keterangan konsisten.', NOW(), NOW(), NOW()),

('app_nok_01_std1', 'ans_nok_01_std1', @student_id, @reviewer_id, 'approved', 'Nama orang tua/sponsor valid sesuai KK.', NOW(), NOW(), NOW()),
('app_nok_02_std1', 'ans_nok_02_std1', @student_id, @reviewer_id, 'approved', 'Hubungan keluarga valid.', NOW(), NOW(), NOW()),
('app_nok_03_std1', 'ans_nok_03_std1', @student_id, @reviewer_id, 'approved', 'Kontak darurat aktif.', NOW(), NOW(), NOW()),
('app_nok_04_std1', 'ans_nok_04_std1', @student_id, @reviewer_id, 'approved', 'Email aktif terverifikasi.', NOW(), NOW(), NOW()),
('app_nok_05_std1', 'ans_nok_05_std1', @student_id, @reviewer_id, 'approved', 'Pekerjaan sponsor kredibel untuk financial capacity.', NOW(), NOW(), NOW()),
('app_nok_06_std1', 'ans_nok_06_std1', @student_id, @reviewer_id, 'approved', 'Alamat domisili keluarga valid.', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    status = 'approved',
    note = VALUES(note),
    reviewed_at = NOW(),
    updated_at = NOW();

