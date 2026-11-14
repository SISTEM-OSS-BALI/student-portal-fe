/**
 * Standar Nama dan Metadata Dokumen Persyaratan Visa
 * Sesuai dengan spesifikasi master checklist resmi:
 * 26 Dokumen terstandar dalam format penamaan Bahasa Inggris profesional (Title Case).
 */

export const STANDARD_DOCUMENT_NAMES = [
  "Plane Ticket",
  "Invitation Letter",
  "Previous Visa Grant/Refusal",
  "Old Passport",
  "Proof of Business",
  "Sponsor Sign",
  "Sponsor Bank Reference",
  "Sponsor Bank Statement",
  "Sponsor Land Asset",
  "Sponsor SIUP",
  "Sponsor NIB",
  "Sponsor Work Reference Letter",
  "Sponsor NPWP",
  "Sponsor ID Card",
  "Sign",
  "NPWP",
  "DET",
  "IELTS",
  "Photo 4x6",
  "Bachelor Certificate",
  "Diploma Certificate",
  "High School Certificate",
  "Family Card",
  "Birth Certificate",
  "ID Card",
  "Passport",
] as const;

export type StandardDocumentName = (typeof STANDARD_DOCUMENT_NAMES)[number];

export const STANDARD_LABEL_TO_CODE_MAP: Record<string, string> = {
  "Plane Ticket": "PLANE_TICKET",
  "Invitation Letter": "INVITATION_LETTER",
  "Previous Visa Grant/Refusal": "PREV_VISA",
  "Visa Grant": "VISA_GRANT",
  "Visa Refusal": "VISA_REFUSAL",
  "Old Passport": "OLD_PASSPORT",
  "Proof of Business": "PROOF_BUSINESS",
  "Sponsor Sign": "SPONSOR_SIGN",
  "Sponsor Bank Reference": "SPONSOR_BANK_REF",
  "Sponsor Bank Statement": "SPONSOR_BANK_STMT",
  "Sponsor Land Asset": "SPONSOR_LAND_ASSET",
  "Sponsor SIUP": "SPONSOR_SIUP",
  "Sponsor NIB": "SPONSOR_NIB",
  "Sponsor Work Reference Letter": "SPONSOR_WORK_REF",
  "Sponsor NPWP": "SPONSOR_NPWP",
  "Sponsor ID Card": "SPONSOR_ID",
  Sign: "SIGN",
  NPWP: "NPWP",
  DET: "DET",
  IELTS: "IELTS",
  "Photo 4x6": "PHOTO_4X6",
  "Bachelor Certificate": "BACHELOR_CERT",
  "Diploma Certificate": "DIPLOMA_CERT",
  "High School Certificate": "HIGH_SCHOOL_CERT",
  "Family Card": "FAMILY_CARD",
  "Birth Certificate": "BIRTH_CERTIFICATE",
  "ID Card": "ID_CARD",
  Passport: "PASSPORT",

  // Legacy mappings
  "Academic Transcript": "TRANSCRIPT",
  "Recommendation Letter": "RECOMMENDATION",
  "Curriculum Vitae": "CURRICULUM_VITAE",
  "Statement of Purpose": "STATEMENT_OF_PURPOSE",
  "Sponsor Guarantee Letter": "SPONSOR_LETTER",
  "Police Clearance Certificate": "POLICE_CLEARANCE",
  "Medical Examination Report": "MEDICAL_REPORT",
};

export const STANDARD_DOCUMENT_ORDER_MAP: Record<string, number> = {
  // Title Case
  "Plane Ticket": 1,
  "Invitation Letter": 2,
  "Previous Visa Grant/Refusal": 3,
  "Old Passport": 4,
  "Proof of Business": 5,
  "Sponsor Sign": 6,
  "Sponsor Bank Reference": 7,
  "Sponsor Bank Statement": 8,
  "Sponsor Land Asset": 9,
  "Sponsor SIUP": 10,
  "Sponsor NIB": 11,
  "Sponsor Work Reference Letter": 12,
  "Sponsor NPWP": 13,
  "Sponsor ID Card": 14,
  Sign: 15,
  NPWP: 16,
  DET: 17,
  IELTS: 18,
  "Photo 4x6": 19,
  "Bachelor Certificate": 20,
  "Diploma Certificate": 21,
  "High School Certificate": 22,
  "Family Card": 23,
  "Birth Certificate": 24,
  "ID Card": 25,
  Passport: 26,

  // Uppercase aliases
  "PLANE TICKET": 1,
  "INVITATION LETTER": 2,
  "PREVIOUS VISA GRANT/REFUSAL": 3,
  "OLD PASSPORT": 4,
  "PROOF OF BUSINESS": 5,
  "SPONSOR SIGN": 6,
  "SPONSOR BANK REFERENCE": 7,
  "SPONSOR BANK STATEMENT": 8,
  "SPONSOR LAND ASSET": 9,
  "SPONSOR SIUP": 10,
  "SPONSOR NIB": 11,
  "SPONSOR WORK REFERENCE LETTER": 12,
  "SPONSOR NPWP": 13,
  "SPONSOR ID CARD": 14,
  SIGN: 15,
  "PHOTO 4X6": 19,
  "BACHELOR CERTIFICATE": 20,
  "DIPLOMA CERTIFICATE": 21,
  "HIGH SCHOOL CERTIFICATE": 22,
  "FAMILY CARD": 23,
  "BIRTH CERTIFICATE": 24,
  "ID CARD": 25,
  PASSPORT: 26,
};

export const STANDARD_DOCUMENT_REQUIRED_MAP: Record<string, boolean> = {
  // Title Case
  "Plane Ticket": false,
  "Invitation Letter": false,
  "Previous Visa Grant/Refusal": false,
  "Old Passport": false,
  "Proof of Business": false,
  "Sponsor Sign": true,
  "Sponsor Bank Reference": true,
  "Sponsor Bank Statement": true,
  "Sponsor Land Asset": false,
  "Sponsor SIUP": false,
  "Sponsor NIB": false,
  "Sponsor Work Reference Letter": false,
  "Sponsor NPWP": true,
  "Sponsor ID Card": true,
  Sign: true,
  NPWP: false,
  DET: false,
  IELTS: true,
  "Photo 4x6": true,
  "Bachelor Certificate": false,
  "Diploma Certificate": false,
  "High School Certificate": true,
  "Family Card": true,
  "Birth Certificate": true,
  "ID Card": true,
  Passport: true,

  // Uppercase aliases
  "PLANE TICKET": false,
  "INVITATION LETTER": false,
  "PREVIOUS VISA GRANT/REFUSAL": false,
  "OLD PASSPORT": false,
  "PROOF OF BUSINESS": false,
  "SPONSOR SIGN": true,
  "SPONSOR BANK REFERENCE": true,
  "SPONSOR BANK STATEMENT": true,
  "SPONSOR LAND ASSET": false,
  "SPONSOR SIUP": false,
  "SPONSOR NIB": false,
  "SPONSOR WORK REFERENCE LETTER": false,
  "SPONSOR NPWP": true,
  "SPONSOR ID CARD": true,
  SIGN: true,
  "PHOTO 4X6": true,
  "BACHELOR CERTIFICATE": false,
  "DIPLOMA CERTIFICATE": false,
  "HIGH SCHOOL CERTIFICATE": true,
  "FAMILY CARD": true,
  "BIRTH CERTIFICATE": true,
  "ID CARD": true,
  PASSPORT: true,
};

const CODE_TO_STANDARD_NAME: Record<string, string> = {
  // Plane Ticket
  doc_plane_ticket: "Plane Ticket",
  PLANE_TICKET: "Plane Ticket",
  "TIKET PESAWAT": "Plane Ticket",
  TIKET_PESAWAT: "Plane Ticket",

  // Invitation Letter
  doc_invitation_letter: "Invitation Letter",
  INVITATION_LETTER: "Invitation Letter",
  "SURAT UNDANGAN": "Invitation Letter",
  SURAT_UNDANGAN: "Invitation Letter",

  // Previous visa
  doc_prev_visa: "Previous Visa Grant/Refusal",
  PREV_VISA: "Previous Visa Grant/Refusal",
  PREVIOUS_VISA: "Previous Visa Grant/Refusal",
  VISA_GRANT_REFUSAL: "Previous Visa Grant/Refusal",
  "PREVIOUS VISA GRANT/REFUSAL": "Previous Visa Grant/Refusal",
  "PREVIOUS VISA GRANT / REFUSAL": "Previous Visa Grant/Refusal",

  // Visa Grant (terpisah)
  doc_visa_grant: "Visa Grant",
  VISA_GRANT: "Visa Grant",
  "VISA GRANT": "Visa Grant",

  // Visa Refusal (terpisah)
  doc_visa_refusal: "Visa Refusal",
  VISA_REFUSAL: "Visa Refusal",
  "VISA REFUSAL": "Visa Refusal",

  // Old passport
  doc_old_passport: "Old Passport",
  OLD_PASSPORT: "Old Passport",
  PASPOR_LAMA: "Old Passport",
  "PASPOR LAMA": "Old Passport",

  // Proof of business
  doc_proof_business: "Proof of Business",
  PROOF_BUSINESS: "Proof of Business",
  "FOTO BUKTI USAHA SPONSOR": "Proof of Business",
  "BUKTI USAHA": "Proof of Business",

  // Sponsor sign
  doc_sponsor_sign: "Sponsor Sign",
  SPONSOR_SIGN: "Sponsor Sign",
  "TTD SPONSOR": "Sponsor Sign",
  TTD_SPONSOR: "Sponsor Sign",

  // Sponsor bank stmt
  doc_sponsor_bank_stmt: "Sponsor Bank Statement",
  SPONSOR_BANK_STMT: "Sponsor Bank Statement",
  "REKENING KORAN SPONSOR": "Sponsor Bank Statement",
  REKENING_KORAN: "Sponsor Bank Statement",

  // Sponsor land asset
  doc_sponsor_land_asset: "Sponsor Land Asset",
  SPONSOR_LAND_ASSET: "Sponsor Land Asset",
  "SERTIFIKAT ASET/TANAH/RUMAH SPONSOR": "Sponsor Land Asset",
  ASET_SPONSOR: "Sponsor Land Asset",

  // Sponsor bank ref
  doc_sponsor_bank_ref: "Sponsor Bank Reference",
  SPONSOR_BANK_REF: "Sponsor Bank Reference",
  "SURAT REFERENSI BANK SPONSOR": "Sponsor Bank Reference",
  REFERENSI_BANK: "Sponsor Bank Reference",

  // Sponsor siup
  doc_sponsor_siup: "Sponsor SIUP",
  SPONSOR_SIUP: "Sponsor SIUP",
  "SIUP PERUSAHAAN SPONSOR": "Sponsor SIUP",
  SIUP: "Sponsor SIUP",

  // Sponsor nib
  doc_sponsor_nib: "Sponsor NIB",
  SPONSOR_NIB: "Sponsor NIB",
  "NIB PERUSAHAAN SPONSOR": "Sponsor NIB",
  NIB: "Sponsor NIB",

  // Sponsor work ref
  doc_sponsor_work_ref: "Sponsor Work Reference Letter",
  SPONSOR_WORK_REF: "Sponsor Work Reference Letter",
  "SURAT KETERANGAN BEKERJA SPONSOR": "Sponsor Work Reference Letter",
  "SURAT KETERANGAN KERJA SPONSOR": "Sponsor Work Reference Letter",
  SURAT_KERJA: "Sponsor Work Reference Letter",

  // Sponsor npwp
  doc_sponsor_npwp: "Sponsor NPWP",
  SPONSOR_NPWP: "Sponsor NPWP",
  "NPWP SPONSOR": "Sponsor NPWP",

  // Sponsor id card
  doc_sponsor_id: "Sponsor ID Card",
  SPONSOR_ID: "Sponsor ID Card",
  SPONSOR_ID_CARD: "Sponsor ID Card",
  "KTP SPONSOR": "Sponsor ID Card",

  // Sign student
  doc_sign: "Sign",
  STUDENT_SIGN: "Sign",
  SIGN: "Sign",
  TTD: "Sign",

  // NPWP student
  doc_npwp: "NPWP",
  NPWP: "NPWP",
  "KARTU NPWP": "NPWP",

  // DET
  doc_det: "DET",
  DET_CERT: "DET",
  DET: "DET",
  "DUOLINGO ENGLISH TEST": "DET",

  // IELTS
  doc_ielts: "IELTS",
  "doc-english-test": "IELTS",
  ENG_CERT: "IELTS",
  ENGLISH_TEST: "IELTS",
  IELTS: "IELTS",
  "SERTIFIKAT IELTS": "IELTS",

  // Photo
  doc_photo: "Photo 4x6",
  "doc-photo": "Photo 4x6",
  PROFILE_PHOTO: "Photo 4x6",
  PHOTO: "Photo 4x6",
  PHOTO_4X6: "Photo 4x6",
  "DIGITAL PHOTO": "Photo 4x6",
  "FOTO 4X6": "Photo 4x6",

  // Bachelor cert
  doc_ijzh_s1: "Bachelor Certificate",
  BACHELOR_CERT: "Bachelor Certificate",
  "IJAZAH S1": "Bachelor Certificate",

  // High school cert
  doc_ijzh_sma: "High School Certificate",
  HIGH_SCHOOL_CERT: "High School Certificate",
  "IJAZAH SMA": "High School Certificate",
  IJAZAH: "High School Certificate",
  "IJAZAH PENDIDIKAN TERAKHIR": "High School Certificate",

  // Family card
  doc_family_card: "Family Card",
  "doc-family-card": "Family Card",
  FAMILY_CARD: "Family Card",
  "KARTU KELUARGA": "Family Card",
  KK: "Family Card",

  // Birth cert
  doc_birth_cert: "Birth Certificate",
  "doc-birth-cert": "Birth Certificate",
  BIRTH_CERTIFICATE: "Birth Certificate",
  "AKTA LAHIR": "Birth Certificate",
  "AKTA KELAHIRAN": "Birth Certificate",

  // Diploma cert
  doc_ijzh_d3: "Diploma Certificate",
  "doc-diploma": "Diploma Certificate",
  DIPLOMA_CERT: "Diploma Certificate",
  DIPLOMA: "Diploma Certificate",
  "SERTIFIKAT DIPLOMA": "Diploma Certificate",

  // Passport
  doc_pass: "Passport",
  "doc-passport": "Passport",
  PASSPORT: "Passport",
  PASPOR: "Passport",

  // Id card / KTP
  doc_ktp: "ID Card",
  "doc-ktp": "ID Card",
  NATIONAL_ID: "ID Card",
  ID_CARD: "ID Card",
  KTP: "ID Card",

  // Legacy mappings
  doc_trns: "Academic Transcript",
  TRANSKRIP: "Academic Transcript",
  TRANSCRIPT: "Academic Transcript",
  doc_rekomendasi: "Recommendation Letter",
  RECOMMENDATION_LETTER: "Recommendation Letter",
  RECOMMENDATION: "Recommendation Letter",
  doc_cv: "Curriculum Vitae",
  CURRICULUM_VITAE: "Curriculum Vitae",
  CV: "Curriculum Vitae",
  doc_sop: "Statement of Purpose",
  STATEMENT_OF_PURPOSE: "Statement of Purpose",
  SOP: "Statement of Purpose",
  doc_sponsor: "Sponsor Guarantee Letter",
  SPONSOR_LETTER: "Sponsor Guarantee Letter",
  doc_skck: "Police Clearance Certificate",
  POLICE_CLEARANCE: "Police Clearance Certificate",
  SKCK: "Police Clearance Certificate",
  doc_medical: "Medical Examination Report",
  MEDICAL_CHECKUP: "Medical Examination Report",
  MEDICAL_REPORT: "Medical Examination Report",
};

/**
 * Mengubah label dokumen yang variatif / lokal menjadi standar resmi Title Case Bahasa Inggris
 */
export function normalizeDocumentLabel(doc?: {
  id?: string | number | null;
  internal_code?: string | null;
  label?: string | null;
}): string {
  if (!doc) return "Document";

  const idKey = String(doc.id ?? "");
  const codeKey = String(doc.internal_code ?? "").toUpperCase().trim();
  const rawLabel = String(doc.label ?? "").toUpperCase().trim();

  if (CODE_TO_STANDARD_NAME[idKey]) return CODE_TO_STANDARD_NAME[idKey];
  if (CODE_TO_STANDARD_NAME[codeKey]) return CODE_TO_STANDARD_NAME[codeKey];
  if (CODE_TO_STANDARD_NAME[rawLabel]) return CODE_TO_STANDARD_NAME[rawLabel];

  // Heuristik pencocokan teks nama jika label dari database masih berupa bahasa Indonesia / deskriptif
  if (rawLabel.includes("PLANE TICKET") || rawLabel.includes("TIKET PESAWAT")) return "Plane Ticket";
  if (rawLabel.includes("INVITATION LETTER") || rawLabel.includes("SURAT UNDANGAN")) return "Invitation Letter";
  if (rawLabel.includes("OLD PASSPORT") || rawLabel.includes("PASPOR LAMA")) return "Old Passport";
  if (rawLabel.includes("PASPOR") || rawLabel.includes("PASSPORT")) return "Passport";

  if (
    rawLabel.includes("SPONSOR ID") ||
    rawLabel.includes("KTP SPONSOR") ||
    (rawLabel.includes("SPONSOR") && rawLabel.includes("KTP"))
  ) {
    return "Sponsor ID Card";
  }
  if (
    rawLabel.includes("KTP") ||
    rawLabel.includes("TANDA PENDUDUK") ||
    rawLabel.includes("ID CARD") ||
    rawLabel.includes("NATIONAL ID")
  ) {
    return "ID Card";
  }

  if (rawLabel.includes("KARTU KELUARGA") || rawLabel.includes("FAMILY CARD") || rawLabel === "KK") {
    return "Family Card";
  }
  if (rawLabel.includes("AKTA") || rawLabel.includes("AKTE") || rawLabel.includes("BIRTH CERTIFICATE")) {
    return "Birth Certificate";
  }
  if (
    rawLabel.includes("PASFOTO") ||
    rawLabel.includes("PAS FOTO") ||
    rawLabel.includes("PHOTO") ||
    rawLabel.includes("FOTO 4X6") ||
    rawLabel.includes("DIGITAL PHOTO") ||
    rawLabel.includes("4X6")
  ) {
    return "Photo 4x6";
  }

  if (rawLabel.includes("SMA") || rawLabel.includes("SMK") || rawLabel.includes("HIGH SCHOOL")) {
    return "High School Certificate";
  }
  if (rawLabel.includes("S1") || rawLabel.includes("SARJANA") || rawLabel.includes("BACHELOR")) {
    return "Bachelor Certificate";
  }
  if (rawLabel.includes("D3") || rawLabel.includes("DIPLOMA")) {
    return "Diploma Certificate";
  }

  if (rawLabel.includes("DUOLINGO") || rawLabel.includes("DET")) {
    return "DET";
  }
  if (rawLabel.includes("IELTS") || rawLabel.includes("TOEFL") || rawLabel.includes("PTE") || rawLabel.includes("BAHASA INGGRIS")) {
    return "IELTS";
  }

  if (
    rawLabel.includes("SPONSOR SIGN") ||
    rawLabel.includes("TTD SPONSOR") ||
    (rawLabel.includes("SPONSOR") && rawLabel.includes("TANDA TANGAN"))
  ) {
    return "Sponsor Sign";
  }
  if (rawLabel.includes("TANDA TANGAN") || rawLabel.includes("SIGNATURE") || rawLabel === "SIGN" || rawLabel === "TTD") {
    return "Sign";
  }

  if (rawLabel.includes("SPONSOR NPWP") || (rawLabel.includes("SPONSOR") && rawLabel.includes("NPWP"))) {
    return "Sponsor NPWP";
  }
  if (rawLabel.includes("NPWP")) {
    return "NPWP";
  }

  if (
    rawLabel.includes("SPONSOR BANK STMT") ||
    rawLabel.includes("REKENING KORAN") ||
    (rawLabel.includes("SPONSOR") && rawLabel.includes("STATEMENT"))
  ) {
    return "Sponsor Bank Statement";
  }
  if (rawLabel.includes("SPONSOR BANK REF") || rawLabel.includes("REFERENSI BANK")) {
    return "Sponsor Bank Reference";
  }
  if (
    rawLabel.includes("LAND ASSET") ||
    rawLabel.includes("ASET SPONSOR") ||
    rawLabel.includes("SERTIFIKAT TANAH") ||
    rawLabel.includes("RUMAH SPONSOR") ||
    rawLabel.includes("SHM")
  ) {
    return "Sponsor Land Asset";
  }
  if (rawLabel.includes("SIUP")) {
    return "Sponsor SIUP";
  }
  if (rawLabel.includes("NIB")) {
    return "Sponsor NIB";
  }
  if (rawLabel.includes("PROOF OF BUSINESS") || rawLabel.includes("BUKTI USAHA") || rawLabel.includes("AKTIVITAS BISNIS")) {
    return "Proof of Business";
  }
  if (
    (rawLabel.includes("GRANT") && rawLabel.includes("REFUSAL")) ||
    rawLabel.includes("PREVIOUS VISA") ||
    rawLabel === "VISA_GRANT_REFUSAL" ||
    rawLabel === "PREV_VISA"
  ) {
    return "Previous Visa Grant/Refusal";
  }
  if (
    rawLabel.includes("VISA GRANT") ||
    (rawLabel.includes("GRANT") && !rawLabel.includes("REFUSAL"))
  ) {
    return doc.label && !doc.label.toUpperCase().includes("REFUSAL")
      ? doc.label
      : "Visa Grant";
  }
  if (
    rawLabel.includes("VISA REFUSAL") ||
    (rawLabel.includes("REFUSAL") && !rawLabel.includes("GRANT"))
  ) {
    return doc.label && !doc.label.toUpperCase().includes("GRANT")
      ? doc.label
      : "Visa Refusal";
  }
  if (
    rawLabel.includes("WORK REFERENCE") ||
    rawLabel.includes("KETERANGAN BEKERJA") ||
    rawLabel.includes("KETERANGAN KERJA")
  ) {
    return "Sponsor Work Reference Letter";
  }

  // Legacy database heuristics
  if (rawLabel.includes("TRANSKRIP") || rawLabel.includes("TRANSCRIPT")) return "Academic Transcript";
  if (rawLabel.includes("REKOMENDASI") || rawLabel.includes("RECOMMENDATION")) return "Recommendation Letter";
  if (rawLabel.includes("CURRICULUM VITAE") || rawLabel.includes("CV")) return "Curriculum Vitae";
  if (rawLabel.includes("STATEMENT OF PURPOSE") || rawLabel.includes("SOP") || rawLabel.includes("GTE")) return "Statement of Purpose";
  if (rawLabel.includes("SPONSOR") && (rawLabel.includes("PERNYATAAN") || rawLabel.includes("LETTER"))) return "Sponsor Guarantee Letter";
  if (rawLabel.includes("SKCK") || rawLabel.includes("KEPOLISIAN") || rawLabel.includes("POLICE")) return "Police Clearance Certificate";
  if (rawLabel.includes("KESEHATAN") || rawLabel.includes("MEDICAL") || rawLabel.includes("MCU")) return "Medical Examination Report";
  if (rawLabel.includes("IJAZAH")) return "High School Certificate";

  return doc.label || "Document";
}

/**
 * Mengubah kode internal menjadi kode uppercase standar bahasa Inggris
 */
export function normalizeDocumentCode(doc?: {
  id?: string | number | null;
  internal_code?: string | null;
  label?: string | null;
}): string {
  if (!doc) return "DOCUMENT";
  const standardLabel = normalizeDocumentLabel(doc);
  if (STANDARD_LABEL_TO_CODE_MAP[standardLabel]) {
    return STANDARD_LABEL_TO_CODE_MAP[standardLabel];
  }
  const rawCode = String(doc.internal_code || "").trim();
  if (!rawCode) return "DOCUMENT";
  return rawCode.toUpperCase().replace(/\s+/g, "_");
}

/**
 * Mengembalikan urutan prioritas tampilan dokumen (1-26)
 */
export function getStandardDocumentOrder(doc?: {
  id?: string | number | null;
  internal_code?: string | null;
  label?: string | null;
}): number {
  const standardName = normalizeDocumentLabel(doc);
  return STANDARD_DOCUMENT_ORDER_MAP[standardName] ?? 999;
}

/**
 * Mengembalikan status required resmi untuk dokumen tertentu
 */
export function getStandardDocumentRequired(doc?: {
  id?: string | number | null;
  internal_code?: string | null;
  label?: string | null;
  required?: boolean;
}): boolean {
  const standardName = normalizeDocumentLabel(doc);
  if (standardName in STANDARD_DOCUMENT_REQUIRED_MAP) {
    return STANDARD_DOCUMENT_REQUIRED_MAP[standardName];
  }
  return Boolean(doc?.required);
}

/**
 * Petunjuk pengunggahan resmi (Document Instructions) untuk masing-masing dokumen
 */
export const STANDARD_DOCUMENT_INSTRUCTIONS_MAP: Record<string, string> = {
  "Plane Ticket":
    "WAJIB ADA untuk client yang mengunjungi anak/keluarga di luar negeri - WAJIB ADA untuk turis visa - Bukti yang menunjukan estimasi lama atau perjalanan di luar negeri",
  "Invitation Letter":
    "WAJIB ADA untuk client yang mengunjungi anak/keluarga di luar negeri - WAJIB ADA untuk turis visa - Surat dibuat oleh family member yang diluar negeri",
  "Previous Visa Grant/Refusal":
    "Hasil scan/dokumen pastikan JELAS dan DATA TIDAK TERTUTUP - Upload jika sebelumnya pernah mendapat visa/ditolak visa",
  "Old Passport":
    "Scan Halaman pertama (informasi pribadi), halaman 4 & 5, halaman stamp (jika ada), halaman terakhir yang sudah di ttd - Hasil scan pastikan JELAS dan DATA TIDAK TERTUTUP",
  Passport:
    "Paspor berlaku MIN 6 bulan sebelum tanggal expired - Scan Halaman pertama (informasi pribadi), halaman 4 & 5, halaman stamp (jika ada), halaman terakhir yang sudah di ttd - Hasil scan pastikan JELAS dan DATA TIDAK TERTUTUP",
  "ID Card":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Halaman belakang tidak perlu di scan, cukup halaman depan - KTP berlaku seumur hidup",
  "Birth Certificate":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Jika sudah BILINGUAL/2 BAHASA, TIDAK PERLU DITRANSLATE",
  "Family Card":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Pastikan NAMA STUDENT/CLIENT ADA DI KK",
  Sign:
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Pastikan latar POLOS (KERTAS PUTIH)",
  "Photo 4x6":
    "Latar belakang PUTIH - Warna baju TIDAK BOLEH PUTIH - Pastikan terlihat bagian TELINGA, BAHU HINGGA DADA ATAS - Pastikan hasil JELAS",
  "High School Certificate":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Jika sudah BILINGUAL/2 BAHASA (Inggris dan Indonesia), TIDAK PERLU DITRANSLATE",
  "Bachelor Certificate":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Jika sudah BILINGUAL/2 BAHASA (Inggris dan Indonesia), TIDAK PERLU DITRANSLATE",
  "Diploma Certificate":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Jika sudah BILINGUAL/2 BAHASA (Inggris dan Indonesia), TIDAK PERLU DITRANSLATE",
  IELTS:
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Pastikan sertifikat BELUM KEDALUWARSA (lewat 2 tahun dari tanggal tes diambil) - Pastikan IELTS ACADEMIC bukan General - Pastikan nilai IELTS memenuhi hasil minimum (6.0)",
  DET:
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Pastikan sertifikat BELUM KEDALUWARSA (lewat 2 tahun dari tanggal tes diambil) - Pastikan nilai DET memenuhi hasil minimum",
  "Proof of Business":
    "WAJIB ADA jika sponsor memiliki bisnis/perusahaan - Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Pastikan dalam gambar terdapat foto sponsor yang sedang melakukan aktivitas bisnis - Pastikan file di MERGE DAN CONVERT PDF",
  "Sponsor Sign":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Pastikan latar POLOS (KERTAS PUTIH)",
  "Sponsor Bank Reference":
    "WAJIB ADA min 450 juta rupiah - Bank Reference terbaru (3 bulan sebelum visa application) - Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - JIKA SUDAH BAHASA INGGRIS ATAU BILINGUAL, tidak perlu ditranslate lagi - Pastikan informasi data jelas",
  "Sponsor Bank Statement":
    "WAJIB ADA min 450 juta rupiah - Rekening koran WAJIB 3 BULAN TERAKHIR (1-2 bulan sebelum visa application) - Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - JIKA SUDAH BAHASA INGGRIS ATAU BILINGUAL, tidak perlu ditranslate lagi - Pastikan informasi data jelas",
  "Sponsor Land Asset":
    "WAJIB ADA jika student apply study ke negara CANADA - Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - JIKA SUDAH BAHASA INGGRIS ATAU BILINGUAL, tidak perlu ditranslate lagi - Pastikan informasi data jelas",
  "Sponsor SIUP":
    "WAJIB ADA jika sponsor tidak memiliki work reference letter (bekerja di bawah perusahaan milik sendiri) - Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - JIKA SUDAH BAHASA INGGRIS ATAU BILINGUAL, tidak perlu ditranslate lagi - Pastikan informasi data jelas",
  "Sponsor NIB":
    "WAJIB ADA jika sponsor tidak memiliki work reference letter (bekerja di bawah perusahaan milik sendiri) - Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - JIKA SUDAH BAHASA INGGRIS ATAU BILINGUAL, tidak perlu ditranslate lagi - Pastikan informasi data jelas",
  "Sponsor Work Reference Letter":
    "WAJIB ADA jika sponsor tidak memiliki bisnis/usaha pribadi - Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - JIKA SUDAH BAHASA INGGRIS ATAU BILINGUAL, tidak perlu ditranslate lagi - Pastikan informasi data jelas (Nama kontak penanggung jawab/HR, nomor telfon, email, logo dan nama perusahaan, posisi student/client, durasi bekerja)",
  "Sponsor NPWP":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Halaman belakang tidak perlu di scan, cukup halaman depan - GABUNG NPWP ayah dan ibu menjadi 1 FILE (jika ada lebih dari 1 NPWP)",
  "Sponsor ID Card":
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Halaman belakang tidak perlu di scan, cukup halaman depan - KTP berlaku seumur hidup - GABUNG KTP ayah dan ibu atau sponsor menjadi 1 FILE",
  NPWP:
    "Pastikan hasil scan JELAS dan DATA TIDAK TERTUTUP - Halaman belakang tidak perlu di scan, cukup halaman depan",

  // Legacy mappings
  "Academic Transcript":
    "Pastikan transkrip akademik resmi mencantumkan nilai lengkap dari semester awal hingga akhir serta stempel institusi.",
  "Recommendation Letter":
    "Surat rekomendasi dari dosen pembimbing akademik atau atasan kerja yang mencantumkan kontak resmi perekomendasi.",
  "Curriculum Vitae":
    "Format CV profesional dalam bahasa Inggris yang memuat riwayat pendidikan, pengalaman kerja, dan prestasi.",
  "Statement of Purpose":
    "Surat motivasi atau Genuine Temporary Entrant (GTE) statement yang menjelaskan latar belakang studi dan rencana masa depan.",
  "Sponsor Guarantee Letter":
    "Surat pernyataan penjaminan biaya studi yang ditandatangani di atas meterai oleh pihak sponsor.",
  "Police Clearance Certificate":
    "Surat Keterangan Catatan Kepolisian (SKCK) yang masih berlaku untuk keperluan studi atau visa luar negeri.",
  "Medical Examination Report":
    "Laporan hasil pemeriksaan kesehatan atau medical check-up (MCU) dari rumah sakit atau klinik panel yang ditunjuk kedutaan.",
};

/**
 * Mengembalikan Document Instructions resmi untuk dokumen tertentu
 */
export function getStandardDocumentInstructions(doc?: {
  id?: string | number | null;
  internal_code?: string | null;
  label?: string | null;
  notes?: string | null;
}): string {
  if (doc?.notes && doc.notes.trim()) {
    return doc.notes.trim();
  }
  const standardName = normalizeDocumentLabel(doc);
  return STANDARD_DOCUMENT_INSTRUCTIONS_MAP[standardName] ?? "";
}

/**
 * Kata kunci verifikasi OCR resmi untuk masing-masing dokumen standar
 */
export const STANDARD_DOCUMENT_KEYWORDS_MAP: Record<string, string> = {
  "Plane Ticket": "tiket pesawat, plane ticket, flight itinerary, passenger ticket, boarding pass",
  "Invitation Letter": "surat undangan, invitation letter, host family, sponsor visit",
  "Previous Visa Grant/Refusal": "visa grant, visa refusal, subclass, decision record, immi",
  "Visa Grant": "visa grant, visa grant notice, subclass, granted, immi",
  "Visa Refusal": "visa refusal, decision record, notification of refusal, refused",
  "Old Passport": "paspor lama, old passport, passport, expired passport",
  Passport: "paspor, passport, republic of indonesia, kantor imigrasi",
  "ID Card": "kartu tanda penduduk, ktp, nik, jenis kelamin, provinsi",
  "Birth Certificate": "akta kelahiran, kutipan akta kelahiran, pencatatan sipil, birth certificate",
  "Family Card": "kartu keluarga, kepala keluarga, no. kk, nik, susunan anggota keluarga",
  Sign: "tanda tangan, signature",
  "Photo 4x6": "pas foto, foto 4x6, photograph",
  "High School Certificate": "ijazah sma, ijazah smk, surat keterangan lulus, kementerian pendidikan",
  "Bachelor Certificate": "ijazah s1, sarjana, bachelor degree, graduation certificate, surat keterangan lulus",
  "Diploma Certificate": "ijazah diploma, ahli madya, diploma certificate",
  IELTS: "ielts, test report form, band score, overall score",
  DET: "duolingo english test, det, test score, certificate",
  "Proof of Business": "bukti usaha, proof of business, surat keterangan usaha, sku, foto usaha",
  "Sponsor Sign": "tanda tangan sponsor, sponsor signature",
  "Sponsor Bank Reference": "surat referensi bank, bank reference letter, saldo rekening",
  "Sponsor Bank Statement": "rekening koran, bank statement, mutasi rekening, saldo akhir",
  "Sponsor Land Asset": "sertifikat tanah, hak milik, shm, land asset, bukti kepemilikan",
  "Sponsor SIUP": "surat izin usaha perdagangan, siup, nomor siup",
  "Sponsor NIB": "nomor induk berusaha, nib, oss, badan koordinasi penanaman modal",
  "Sponsor Work Reference Letter": "surat keterangan kerja, work reference letter, slip gaji, surat rekomendasi kerja",
  "Sponsor NPWP": "nomor pokok wajib pajak, npwp, surat keterangan terdaftar, djp",
  "Sponsor ID Card": "ktp sponsor, kartu tanda penduduk, nik, ktp orang tua",
  NPWP: "nomor pokok wajib pajak, npwp, kartu npwp, direktorat jenderal pajak",

  // Legacy mappings
  "Academic Transcript": "transkrip nilai, academic transcript, daftar nilai, indeks prestasi, ipk",
  "Recommendation Letter": "surat rekomendasi, recommendation letter, dosen pembimbing",
  "Curriculum Vitae": "curriculum vitae, cv, resume, riwayat hidup",
  "Statement of Purpose": "statement of purpose, sop, motivasi studi, personal statement",
  "Sponsor Guarantee Letter": "surat sponsor, sponsorship letter, surat penjamin, financial guarantee",
  "Police Clearance Certificate": "skck, surat keterangan catatan kepolisian, police clearance",
  "Medical Examination Report": "pemeriksaan kesehatan, medical examination, medical check up, mcu",
};

/**
 * Mengembalikan Kata Kunci OCR rekomendasi resmi untuk dokumen tertentu
 */
export function getStandardDocumentKeywords(doc?: {
  id?: string | number | null;
  internal_code?: string | null;
  label?: string | null;
  ocr_keywords?: string | null;
}): string {
  if (doc?.ocr_keywords && doc.ocr_keywords.trim()) {
    return doc.ocr_keywords.trim();
  }
  const standardName = normalizeDocumentLabel(doc);
  return STANDARD_DOCUMENT_KEYWORDS_MAP[standardName] ?? "";
}
