/**
 * Kamus pemetaan pertanyaan resmi dari Bahasa Indonesia ke Bahasa Inggris formal.
 * Memastikan seluruh label pertanyaan di seluruh section tampil konsisten dalam Bahasa Inggris,
 * sementara deskripsi / petunjuk (help text) tetap dalam Bahasa Indonesia formal.
 */
const QUESTION_LABEL_TRANSLATIONS: Record<string, string> = {
  // 1. Personal Details
  "nama lengkap sesuai paspor atau ktp": "Full Name as per Passport or ID Card",
  "nama lengkap sesuai paspor / ktp": "Full Name as per Passport or ID Card",
  "nama lengkap sesuai paspor": "Full Name as per Passport or ID Card",
  "nama panggilan": "Preferred Name",
  "jenis kelamin": "Gender",
  "tempat lahir": "Place of Birth",
  "tanggal lahir": "Date of Birth",
  "kewarganegaraan": "Nationality",
  "nomor induk kependudukan": "National Identification Number (NIK)",
  "nomor induk kependudukan (nik ktp)": "National Identification Number (NIK)",
  "nik ktp": "National Identification Number (NIK)",
  "nomor paspor": "Passport Number",
  "tanggal dikeluarkan paspor": "Passport Issue Date",
  "tanggal habis berlaku paspor": "Passport Expiry Date",
  "status perkawinan": "Marital Status",
  "nomor telepon whatsapp aktif": "Active Phone or WhatsApp Number",
  "nomor telepon / whatsapp aktif": "Active Phone or WhatsApp Number",
  "nomor telepon aktif": "Active Phone or WhatsApp Number",
  "alamat tempat tinggal saat ini": "Current Residential Address",
  "alamat tempat tinggal": "Residential Address",
  "kota domisili": "Residential City",
  "provinsi": "State or Province",
  "provinsi / wilayah": "State or Province",
  "provinsi atau wilayah": "State or Province",
  "kode pos": "Postal Code",
  "tinggi badan": "Height (cm)",
  "tinggi badan (cm)": "Height (cm)",
  "berat badan": "Weight (kg)",
  "berat badan (kg)": "Weight (kg)",
  "ringkasan profil profesional": "Professional Profile Summary",

  // 2. Formal Education
  "jenjang pendidikan": "Education Level",
  "nama institusi pendidikan": "School or University Name",
  "nama sekolah / institusi / universitas": "School or University Name",
  "program studi": "Major or Field of Study",
  "jurusan / bidang studi": "Major or Field of Study",
  "jurusan atau bidang studi": "Major or Field of Study",
  "kota institusi": "Institution City",
  "tahun masuk": "Start Year",
  "tahun kelulusan": "Graduation Year",
  "tahun kelulusan / selesai": "Graduation Year",
  "tahun kelulusan atau selesai": "Graduation Year",
  "nilai akhir ipk": "GPA or Final Grade",
  "nilai akhir / ipk": "GPA or Final Grade",
  "nilai akhir / ipk (gpa)": "GPA or Final Grade",

  // 3. Nonformal Education
  "nama pelatihan atau sertifikasi": "Course or Certification Name",
  "nama kursus / pelatihan / sertifikasi": "Course or Certification Name",
  "nama kursus atau pelatihan atau sertifikasi": "Course or Certification Name",
  "nama kursus": "Course or Certification Name",
  "lembaga penyelenggara": "Issuing Organization",
  "tanggal mulai": "Start Date",
  "tanggal selesai": "Completion Date",
  "apakah masih mengikuti pelatihan ini?": "Are You Still Attending This Training?",
  "apakah masih mengikuti pelatihan ini": "Are You Still Attending This Training?",
  "nomor sertifikat": "Certificate or Credential ID",
  "nomor sertifikat / kredensial": "Certificate or Credential ID",
  "materi yang dipelajari": "Skills or Topics Covered",
  "keterampilan / materi yang dipelajari": "Skills or Topics Covered",
  "keterampilan atau materi yang dipelajari": "Skills or Topics Covered",

  // 4. Employment History
  "nama perusahaan": "Company or Employer Name",
  "nama perusahaan / tempat bekerja": "Company or Employer Name",
  "posisi pekerjaan": "Job Title or Position",
  "jabatan / posisi pekerjaan": "Job Title or Position",
  "jabatan atau posisi pekerjaan": "Job Title or Position",
  "kota perusahaan": "Company City",
  "tanggal mulai bekerja": "Start Date",
  "tanggal selesai bekerja": "End Date",
  "apakah masih bekerja di sini?": "Are You Still Working Here?",
  "apakah masih bekerja di sini": "Are You Still Working Here?",
  "deskripsi pekerjaan dan tanggung jawab": "Job Description and Responsibilities",

  // 5. Achievement
  "nama prestasi": "Award or Achievement Name",
  "nama prestasi / penghargaan": "Award or Achievement Name",
  "kategori prestasi": "Achievement Category",
  "tingkat prestasi": "Competition Level",
  "lembaga pemberi": "Awarding Institution",
  "lembaga / pihak pemberi": "Awarding Institution",
  "tahun perolehan": "Year Awarded",
  "deskripsi prestasi": "Achievement Description",

  // 6. Travel History
  "negara tujuan kunjungan": "Destination Country",
  "tujuan perjalanan": "Purpose of Travel",
  "tanggal kedatangan": "Arrival Date",
  "tanggal kedatangan (arrival)": "Arrival Date",
  "tanggal kepulangan": "Departure Date",
  "tanggal kepulangan (departure)": "Departure Date",
  "jenis visa yang digunakan": "Visa Type Used",
  "apakah pernah mengalami penolakan visa?": "Have You Ever Had a Visa Refused or Cancelled?",
  "apakah pernah mengalami penolakan visa": "Have You Ever Had a Visa Refused or Cancelled?",
  "apakah pernah mengalami penolakan visa ke negara manapun?": "Have You Ever Had a Visa Refused or Cancelled?",
  "keterangan penolakan visa": "Details of Visa Refusal",

  // 7. Next of Kin
  "nama lengkap kontak darurat": "Full Name of Emergency Contact",
  "nama lengkap orang tua / kontak darurat": "Full Name of Emergency Contact",
  "nama lengkap orang tua atau kontak darurat": "Full Name of Emergency Contact",
  "nama kontak darurat": "Full Name of Emergency Contact",
  "hubungan keluarga": "Relationship",
  "hubungan kekerabatan": "Relationship",
  "hubungan kekerabatan dengan siswa": "Relationship",
  "hubungan kerabat": "Relationship",
  "nomor telepon kontak darurat": "Emergency Contact Phone Number",
  "nomor kontak darurat": "Emergency Contact Phone Number",
  "kontak darurat": "Emergency Contact Phone Number",
  "email kontak darurat": "Email Address",
  "surel kontak darurat": "Email Address",
  "pekerjaan atau profesi": "Occupation or Profession",
  "pekerjaan / jabatan": "Occupation or Profession",
  "pekerjaan orang tua": "Occupation or Profession",
  "alamat orang tua": "Residential Address",
  "alamat orang tua atau wali": "Residential Address",
  "alamat orang tua / wali": "Residential Address",
};

/**
 * Membersihkan teks label pertanyaan dari karakter garis miring (/), frasa informal, dan kiasan.
 * Mengganti dengan padanan kata formal atau frasa profesional baku dalam Bahasa Inggris.
 */
export function cleanQuestionLabel(text?: string | null): string {
  if (!text) return "";
  let cleaned = text.trim();

  // Bersihkan teks bahasa Inggris dalam tanda kurung yang artinya sama
  cleaned = cleaned.replace(/\s*\(\s*Arrival\s*\)/gi, "");
  cleaned = cleaned.replace(/\s*\(\s*Departure\s*\)/gi, "");
  cleaned = cleaned.replace(/\s*\(\s*GPA\s*\)/gi, "");
  cleaned = cleaned.replace(/\s*\(\s*NIK\s*KTP\s*\)/gi, "");
  cleaned = cleaned.replace(/\s*\(\s*Jika Ada\s*\)/gi, "");

  const lookupKey = cleaned.toLowerCase().trim();
  if (QUESTION_LABEL_TRANSLATIONS[lookupKey]) {
    return QUESTION_LABEL_TRANSLATIONS[lookupKey];
  }

  // Jika belum ada dalam peta langsung, lakukan pencocokan frasa
  for (const [idKey, enVal] of Object.entries(QUESTION_LABEL_TRANSLATIONS)) {
    if (lookupKey === idKey || lookupKey.startsWith(idKey)) {
      return enVal;
    }
  }

  if (cleaned.includes("/")) {
    cleaned = cleaned.replace(/\s*\/\s*/g, " or ");
  }
  return cleaned.trim();
}

/**
 * Membersihkan label opsi jawaban dari terjemahan bahasa Inggris dalam tanda kurung yang maknanya sama.
 */
export function cleanOptionLabel(label?: string | null): string {
  if (!label) return "";
  let cleaned = label.trim();

  // Hapus terjemahan bahasa Inggris dalam tanda kurung yang artinya sama
  cleaned = cleaned.replace(/\s*\((?:Academic|Sports|Arts\s*&\s*Culture|Professional|Leadership\s*(?:\/|atau)\s*Community|Institutional|Regional|Provincial|National|International|Full-Time|Part-Time|Contract|Internship|Freelance|Still working here|No|High School|Diploma|Bachelor Degree|Master Degree|Doctoral Degree|English|Bilingual|Masih berlangsung|Sudah selesai|Father|Mother|Spouse|Sibling|Legal Guardian|Male|Female|Single|Married|Divorced|Widowed|Holiday\s*(?:\/|atau)\s*Tourism|Study\s*(?:\/|atau)\s*Education|Business\s*(?:\/|atau)\s*Work|Family Visit|Yes|WNI|WNA|D3\s*(?:\/|atau)\s*D4|S1|S2|S3)\)/gi, "");

  if (cleaned.includes("/")) {
    cleaned = cleaned.replace(/\s*\/\s*/g, " atau ");
  }
  if (cleaned.includes("&")) {
    cleaned = cleaned.replace(/\s*&\s*/g, " dan ");
  }
  return cleaned.trim();
}

/**
 * Membersihkan dan memformalkan teks petunjuk / help text pertanyaan.
 * Menghilangkan kiasan, ambiguitas, dan gaya bahasa non-formal (seperti "jujur", "demi kelancaran").
 */
export function cleanHelpText(helpText?: string | null): string {
  if (!helpText) return "";
  let cleaned = helpText.trim();

  // Riwayat visa & penolakan
  cleaned = cleaned.replace(/Wajib dijawab jujur demi kelancaran pengajuan visa resmi\.?/gi, "Wajib diisi sesuai dengan riwayat pengajuan visa resmi.");
  cleaned = cleaned.replace(/Isi jika Anda pernah mengalami penolakan visa sebelumnya\.?/gi, "Wajib diisi apabila memiliki riwayat penolakan visa.");
  cleaned = cleaned.replace(/dijawab jujur demi kelancaran/gi, "diisi secara akurat sesuai riwayat");

  // Kontak & orang tua
  cleaned = cleaned.replace(/Nomor darurat yang dapat dihubungi sewaktu-waktu\.?/gi, "Nomor kontak darurat yang dapat dihubungi.");
  cleaned = cleaned.replace(/Pekerjaan orang tua\s*\/\s*sponsor utama finansial Anda\.?/gi, "Profesi orang tua atau penjamin finansial.");

  // Identitas & paspor
  cleaned = cleaned.replace(/Pastikan ejaan nama sama persis dengan yang tercantum di paspor atau identitas resmi\.?/gi, "Pastikan ejaan nama sesuai dengan dokumen paspor atau kartu identitas resmi.");
  cleaned = cleaned.replace(/Pilih jenis kelamin sesuai identitas paspor\.?/gi, "Pilih jenis kelamin sesuai dokumen identitas resmi.");
  cleaned = cleaned.replace(/Format tanggal lahir sesuai dokumen resmi\.?/gi, "Tanggal lahir sesuai dokumen identitas resmi.");
  cleaned = cleaned.replace(/16 digit NIK yang tertera pada KTP resmi\.?/gi, "Nomor Induk Kependudukan 16 digit sesuai KTP.");
  cleaned = cleaned.replace(/Nomor paspor aktif yang akan digunakan untuk pengajuan visa\.?/gi, "Nomor paspor aktif untuk keperluan pengajuan visa.");
  cleaned = cleaned.replace(/Masa berlaku paspor minimal 6 bulan sebelum rencana keberangkatan\.?/gi, "Masa berlaku paspor minimal enam bulan sebelum keberangkatan.");
  cleaned = cleaned.replace(/Status perkawinan legal saat ini\.?/gi, "Status perkawinan sesuai dokumen resmi.");
  cleaned = cleaned.replace(/Sertakan kode negara\s*\(misal \+62\)\.?/gi, "Sertakan kode negara, contoh +62.");

  // Pendidikan & pelatihan
  cleaned = cleaned.replace(/Pilih jenjang pendidikan formal yang telah Anda tempuh\.?/gi, "Pilih jenjang pendidikan formal yang telah diselesaikan.");
  cleaned = cleaned.replace(/Tahun masuk pendidikan\.?/gi, "Tahun mulai masa studi.");
  cleaned = cleaned.replace(/Tahun resmi kelulusan\.?/gi, "Tahun penyelesaian masa studi.");
  cleaned = cleaned.replace(/Sertakan skala nilai bila ada\s*\(misal 3\.75\/4\.00\)\.?/gi, "Sertakan skala nilai, contoh 3.75 dari skala 4.00.");
  cleaned = cleaned.replace(/Kosongkan jika saat ini masih mengikuti pelatihan ini\.?/gi, "Kosongkan apabila pelatihan masih berlangsung.");
  cleaned = cleaned.replace(/Bila ada nomor sertifikat yang tertera\.?/gi, "Nomor registrasi yang tertera pada sertifikat.");
  cleaned = cleaned.replace(/Pilih Ya jika pelatihan masih aktif berjalan\.?/gi, "Pilih Ya apabila pelatihan masih berlangsung.");

  // Pekerjaan
  cleaned = cleaned.replace(/Kosongkan bila saat ini masih bekerja di posisi ini\.?/gi, "Kosongkan apabila masih aktif bekerja pada posisi ini.");
  cleaned = cleaned.replace(/Uraikan deskripsi pekerjaan Anda untuk keperluan verifikasi CV dan GTE\/GS visa\.?/gi, "Uraikan tugas pokok dan tanggung jawab pekerjaan secara rinci.");

  // Pembersihan karakter miring
  if (cleaned.includes("/")) {
    cleaned = cleaned.replace(/\s*\/\s*/g, " atau ");
  }

  return cleaned;
}

/**
 * Membersihkan teks placeholder dari pilihan majemuk bergaris miring (/) dan frasa non-formal
 * Menyisakan satu contoh representatif tunggal untuk menghemat ruang dan menjaga profesionalisme.
 */
export function cleanPlaceholder(placeholder?: string | null): string {
  if (!placeholder) return "";
  let trimmed = placeholder.trim();
  if (trimmed.startsWith("CONSTRAINT:")) return "";

  // Penggantian frasa informal pada placeholder
  trimmed = trimmed.replace(/Tulis alamat lengkap Anda di sini\.\.\.?/gi, "Masukkan alamat domisili lengkap");
  trimmed = trimmed.replace(/Tuliskan alamat lengkap orang tua\s*(\/|atau)\s*wali\.\.\.?/gi, "Masukkan alamat lengkap orang tua atau wali");
  trimmed = trimmed.replace(/Jelaskan ringkas keahlian utama yang Anda kuasai setelah pelatihan ini\.\.\.?/gi, "Masukkan ringkasan kompetensi yang dipelajari");
  trimmed = trimmed.replace(/Jelaskan tugas pokok dan pencapaian Anda\.\.\.?/gi, "Masukkan uraian tugas pokok dan tanggung jawab");
  trimmed = trimmed.replace(/Keterangan tambahan seputar kompetisi atau prestasi\.\.\.?/gi, "Masukkan keterangan tambahan prestasi");
  trimmed = trimmed.replace(/Sebutkan negara, tahun, dan alasan penolakan\.\.\.?/gi, "Sebutkan negara, tahun, dan alasan penolakan");

  if (!trimmed.includes("/")) return trimmed;

  // Lindungi format tanggal resmi (contoh: DD/MM/YYYY, MM/YYYY)
  if (/^(dd|mm|yyyy|d|m|y)(\/)(dd|mm|yyyy|d|m|y)/i.test(trimmed)) {
    return trimmed;
  }

  // Lindungi format protokol URL (contoh: https://...)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Tangani format "Contoh: A / B / C" -> ambil hanya contoh A
  const matchContoh = trimmed.match(/^(contoh:\s*)(.*)$/i);
  if (matchContoh) {
    const prefix = matchContoh[1];
    const choices = matchContoh[2].split("/").map((s) => s.trim()).filter(Boolean);
    return `${prefix}${choices[0] || ""}`;
  }

  // Tangani frasa khusus kalimat seperti "orang tua / wali"
  if (trimmed.toLowerCase().includes("orang tua / wali")) {
    return trimmed.replace(/orang tua \/ wali/gi, "orang tua atau wali");
  }

  // Tangani opsi majemuk tanpa prefix Contoh (misal "Australia / Singapore" -> "Australia")
  const parts = trimmed.split("/").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts[0];
  }

  return trimmed;
}

export function sanitizeQuestionPlaceholders<T extends { text?: string | null; placeholder?: string | null; help_text?: string | null }>(
  question: T,
): T {
  if (!question) return question;
  return {
    ...question,
    text: question.text ? cleanQuestionLabel(question.text) : question.text,
    placeholder: question.placeholder ? cleanPlaceholder(question.placeholder) : question.placeholder,
    help_text: question.help_text ? cleanHelpText(question.help_text) : question.help_text,
  };
}

const BADGE_ENGLISH_TRANSLATIONS: Record<string, string> = {
  // Employment Type
  "magang": "Internship",
  "internship": "Internship",
  "pekerja lepas": "Freelance",
  "freelance": "Freelance",
  "penuh waktu": "Full-Time",
  "full-time": "Full-Time",
  "full time": "Full-Time",
  "paruh waktu": "Part-Time",
  "part-time": "Part-Time",
  "part time": "Part-Time",
  "kontrak": "Contract",
  "contract": "Contract",
  "harian lepas": "Daily Worker",
  "pekerja harian": "Daily Worker",
  "sukarelawan": "Volunteer",
  "volunteer": "Volunteer",
  "wirausaha": "Self-Employed",
  "wiraswasta": "Self-Employed",

  // Education Level / Degree
  "sma / smk / sederajat": "High School",
  "sekolah menengah atas (sma / high school)": "High School",
  "sma": "High School",
  "smk": "Vocational High School",
  "diploma (d3 / d4)": "Diploma",
  "diploma": "Diploma",
  "d3": "Associate Degree",
  "d4": "Applied Bachelor",
  "sarjana (s1)": "Bachelor's Degree",
  "sarjana (s1 / bachelor degree)": "Bachelor's Degree",
  "sarjana": "Bachelor's Degree",
  "s1": "Bachelor's Degree",
  "bachelor": "Bachelor's Degree",
  "magister (s2)": "Master's Degree",
  "magister (s2 / master degree)": "Master's Degree",
  "magister": "Master's Degree",
  "s2": "Master's Degree",
  "master": "Master's Degree",
  "doktoral (s3)": "Doctoral Degree",
  "doktor (s3 / doctoral degree)": "Doctoral Degree",
  "doktor": "Doctoral Degree",
  "s3": "Doctoral Degree",
  "phd": "Doctoral Degree",

  // Achievement Level
  "sekolah / kampus (institutional)": "Institutional",
  "sekolah / kampus": "Institutional",
  "kota / kabupaten (regional)": "Regional",
  "kota / kabupaten": "Regional",
  "provinsi (provincial)": "Provincial",
  "provinsi": "Provincial",
  "nasional (national)": "National",
  "nasional": "National",
  "internasional (international)": "International",
  "internasional": "International",

  // Achievement Category
  "akademik (academic)": "Academic",
  "akademik": "Academic",
  "olahraga (sports)": "Sports",
  "olahraga": "Sports",
  "seni & budaya (arts & culture)": "Arts & Culture",
  "seni dan budaya": "Arts & Culture",
  "profesional / kerja (professional)": "Professional",
  "profesional": "Professional",
  "sosial & kepemimpinan (leadership / community)": "Leadership",
  "sosial dan kepemimpinan": "Leadership",

  // Relationship
  "ayah": "Father",
  "ibu": "Mother",
  "orang tua": "Parents",
  "wali": "Guardian",
  "saudara kandung": "Sibling",
  "suami": "Spouse",
  "istri": "Spouse",
};

/**
 * Mengubah teks label badge (seperti tipe pekerjaan, jenjang pendidikan, kategori prestasi)
 * ke dalam Bahasa Inggris formal ringkas untuk tampilan lencana eksekutif.
 */
export function formatBadgeEnglish(rawBadge?: string | null): string {
  if (!rawBadge) return "";
  const trimmed = rawBadge.trim();
  const lower = trimmed.toLowerCase();

  if (BADGE_ENGLISH_TRANSLATIONS[lower]) {
    return BADGE_ENGLISH_TRANSLATIONS[lower];
  }

  for (const [key, value] of Object.entries(BADGE_ENGLISH_TRANSLATIONS)) {
    if (lower === key || lower.includes(key)) {
      return value;
    }
  }

  // Jika terdapat teks dalam kurung seperti "(Internship)" atau "(High School)"
  const matchParen = trimmed.match(/\(([^)]+)\)/);
  if (matchParen) {
    const inside = matchParen[1].trim();
    if (/^[A-Za-z\s&-]+$/.test(inside)) {
      return inside;
    }
  }

  return trimmed;
}
