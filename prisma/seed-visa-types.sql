-- ==============================================================================
-- OSS BALI STUDENT PORTAL - SEED MASTER VISA TYPE LENGKAP
-- Target Database: db_student_portal
-- Target Tables: country_managements, visa_type_managements
-- ==============================================================================

USE db_student_portal;

-- ------------------------------------------------------------------------------
-- 1. MASTER COUNTRY (Negara Tujuan Utama)
-- Pastikan seluruh negara tujuan tersedia
-- ------------------------------------------------------------------------------
INSERT INTO `country_managements` (`id`, `name_country`, `created_at`, `updated_at`)
VALUES 
    ('cty_aus', 'Australia', NOW(), NOW()),
    ('cty_can', 'Canada', NOW(), NOW()),
    ('cty_uk',  'United Kingdom', NOW(), NOW()),
    ('cty_nz',  'New Zealand', NOW(), NOW()),
    ('cty_usa', 'United States', NOW(), NOW()),
    ('cty_deu', 'Germany', NOW(), NOW()),
    ('cty_sgp', 'Singapore', NOW(), NOW()),
    ('cty_irl', 'Ireland', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    `name_country` = VALUES(`name_country`), 
    `updated_at` = NOW();

-- ------------------------------------------------------------------------------
-- 2. MASTER VISA TYPE MANAGEMENT
-- Resolusi country_id dinamis agar sinkron dengan ID negara yang sudah ada
-- ------------------------------------------------------------------------------

-- === AUSTRALIA ===
SET @aus_id = COALESCE((SELECT `id` FROM `country_managements` WHERE LOWER(`name_country`) = 'australia' ORDER BY `created_at` ASC LIMIT 1), 'cty_aus');

INSERT INTO `visa_type_managements` (`id`, `name`, `country_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('visa_aus_500', 'Student Visa (Subclass 500)', @aus_id, NOW(), NOW(), NULL),
('visa_aus_485', 'Temporary Graduate Visa (Subclass 485)', @aus_id, NOW(), NOW(), NULL),
('visa_aus_462', 'Working and Holiday Visa (Subclass 462)', @aus_id, NOW(), NOW(), NULL),
('visa_aus_600', 'Visitor Visa (Subclass 600)', @aus_id, NOW(), NOW(), NULL),
('visa_aus_407', 'Training Visa (Subclass 407)', @aus_id, NOW(), NOW(), NULL),
('visa_aus_590', 'Student Guardian Visa (Subclass 590)', @aus_id, NOW(), NOW(), NULL),
('visa_aus_476', 'Skilled - Recognised Graduate Visa (Subclass 476)', @aus_id, NOW(), NOW(), NULL),
('visa_aus_189', 'Skilled Independent Visa (Subclass 189)', @aus_id, NOW(), NOW(), NULL),
('visa_aus_190', 'Skilled Nominated Visa (Subclass 190)', @aus_id, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `country_id` = VALUES(`country_id`), 
    `deleted_at` = NULL,
    `updated_at` = NOW();

-- === CANADA ===
SET @can_id = COALESCE((SELECT `id` FROM `country_managements` WHERE LOWER(`name_country`) = 'canada' ORDER BY `created_at` ASC LIMIT 1), 'cty_can');

INSERT INTO `visa_type_managements` (`id`, `name`, `country_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('visa_can_study', 'Study Permit', @can_id, NOW(), NOW(), NULL),
('visa_can_trv', 'Temporary Resident Visa (TRV)', @can_id, NOW(), NOW(), NULL),
('visa_can_pgwp', 'Post-Graduation Work Permit (PGWP)', @can_id, NOW(), NOW(), NULL),
('visa_can_coop', 'Co-op Work Permit', @can_id, NOW(), NOW(), NULL),
('visa_can_visitor', 'Visitor Visa (Tourist / Business)', @can_id, NOW(), NOW(), NULL),
('visa_can_super', 'Super Visa (Parents / Grandparents)', @can_id, NOW(), NOW(), NULL),
('visa_can_work_open', 'Open Work Permit (Spousal)', @can_id, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `country_id` = VALUES(`country_id`), 
    `deleted_at` = NULL,
    `updated_at` = NOW();

-- === UNITED KINGDOM (UK) ===
SET @uk_id = COALESCE((SELECT `id` FROM `country_managements` WHERE LOWER(`name_country`) IN ('united kingdom', 'uk') ORDER BY `created_at` ASC LIMIT 1), 'cty_uk');

INSERT INTO `visa_type_managements` (`id`, `name`, `country_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('visa_uk_student', 'Student Visa (General / Tier 4)', @uk_id, NOW(), NOW(), NULL),
('visa_uk_graduate', 'Graduate Visa (Post-Study Work)', @uk_id, NOW(), NOW(), NULL),
('visa_uk_child_student', 'Child Student Visa', @uk_id, NOW(), NOW(), NULL),
('visa_uk_short_study', 'Short-term Study Visa (English Language)', @uk_id, NOW(), NOW(), NULL),
('visa_uk_visitor', 'Standard Visitor Visa', @uk_id, NOW(), NOW(), NULL),
('visa_uk_skilled', 'Skilled Worker Visa', @uk_id, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `country_id` = VALUES(`country_id`), 
    `deleted_at` = NULL,
    `updated_at` = NOW();

-- === NEW ZEALAND ===
SET @nz_id = COALESCE((SELECT `id` FROM `country_managements` WHERE LOWER(`name_country`) = 'new zealand' ORDER BY `created_at` ASC LIMIT 1), 'cty_nz');

INSERT INTO `visa_type_managements` (`id`, `name`, `country_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('visa_nz_fee_paying', 'Fee Paying Student Visa', @nz_id, NOW(), NOW(), NULL),
('visa_nz_post_study', 'Post-Study Work Visa', @nz_id, NOW(), NOW(), NULL),
('visa_nz_pathway', 'Pathway Student Visa', @nz_id, NOW(), NOW(), NULL),
('visa_nz_working_holiday', 'Working Holiday Visa', @nz_id, NOW(), NOW(), NULL),
('visa_nz_visitor', 'Visitor Visa', @nz_id, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `country_id` = VALUES(`country_id`), 
    `deleted_at` = NULL,
    `updated_at` = NOW();

-- === UNITED STATES (USA) ===
SET @usa_id = COALESCE((SELECT `id` FROM `country_managements` WHERE LOWER(`name_country`) IN ('united states', 'usa', 'united states of america') ORDER BY `created_at` ASC LIMIT 1), 'cty_usa');

INSERT INTO `visa_type_managements` (`id`, `name`, `country_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('visa_usa_f1', 'F-1 Student Visa (Academic)', @usa_id, NOW(), NOW(), NULL),
('visa_usa_m1', 'M-1 Student Visa (Vocational)', @usa_id, NOW(), NOW(), NULL),
('visa_usa_j1', 'J-1 Exchange Visitor Visa', @usa_id, NOW(), NOW(), NULL),
('visa_usa_b1_b2', 'B-1/B-2 Visitor Visa (Tourist & Business)', @usa_id, NOW(), NOW(), NULL),
('visa_usa_opt', 'Optional Practical Training (F-1 OPT STEM)', @usa_id, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `country_id` = VALUES(`country_id`), 
    `deleted_at` = NULL,
    `updated_at` = NOW();

-- === GERMANY (JERMAN) ===
SET @deu_id = COALESCE((SELECT `id` FROM `country_managements` WHERE LOWER(`name_country`) IN ('germany', 'jerman') ORDER BY `created_at` ASC LIMIT 1), 'cty_deu');

INSERT INTO `visa_type_managements` (`id`, `name`, `country_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('visa_deu_student', 'National Student Visa (Type D)', @deu_id, NOW(), NOW(), NULL),
('visa_deu_applicant', 'Student Applicant Visa (Studienbewerbervisum)', @deu_id, NOW(), NOW(), NULL),
('visa_deu_lang', 'Language Course Visa (Sprachkursvisum)', @deu_id, NOW(), NOW(), NULL),
('visa_deu_jobseeker', 'Job Seeker Visa for Graduates', @deu_id, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `country_id` = VALUES(`country_id`), 
    `deleted_at` = NULL,
    `updated_at` = NOW();

-- === SINGAPORE (SINGAPURA) ===
SET @sgp_id = COALESCE((SELECT `id` FROM `country_managements` WHERE LOWER(`name_country`) IN ('singapore', 'singapura') ORDER BY `created_at` ASC LIMIT 1), 'cty_sgp');

INSERT INTO `visa_type_managements` (`id`, `name`, `country_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('visa_sgp_stp', 'Student Pass (STP)', @sgp_id, NOW(), NOW(), NULL),
('visa_sgp_visit', 'Social Visit Pass', @sgp_id, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `country_id` = VALUES(`country_id`), 
    `deleted_at` = NULL,
    `updated_at` = NOW();

-- === IRELAND (IRLANDIA) ===
SET @irl_id = COALESCE((SELECT `id` FROM `country_managements` WHERE LOWER(`name_country`) IN ('ireland', 'irlandia') ORDER BY `created_at` ASC LIMIT 1), 'cty_irl');

INSERT INTO `visa_type_managements` (`id`, `name`, `country_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('visa_irl_study', 'Study Visa (Stamp 2 / Degree Programme)', @irl_id, NOW(), NOW(), NULL),
('visa_irl_third_level', 'Third Level Graduate Scheme (Stamp 1G)', @irl_id, NOW(), NOW(), NULL),
('visa_irl_short_study', 'Short Stay Study Visa (C Visa)', @irl_id, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`), 
    `country_id` = VALUES(`country_id`), 
    `deleted_at` = NULL,
    `updated_at` = NOW();
