/**
 * Utilitas untuk standarisasi dan penamaan otomatis dokumen persyaratan siswa.
 * Format penamaan seragam memudahkan arsip dan pencarian di sistem serta Google Drive.
 */

export function sanitizeNameToken(name?: string | null): string {
  if (!name) return "Student";

  // Hapus karakter non-alfanumerik kecuali spasi
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_");

  return cleaned || "Student";
}

export function sanitizeCodeToken(code?: string | null): string {
  if (!code) return "DOC";

  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
}

export function getFileExtension(fileName?: string | null): string {
  if (!fileName) return "pdf";

  const parts = fileName.split(".");
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase();
    return ext ? ext.replace(/[^a-z0-9]/g, "") : "pdf";
  }

  return "pdf";
}

interface GenerateFileNameParams {
  pattern?: string | null;
  studentName?: string | null;
  documentCode?: string | null;
  originalFileName?: string | null;
}

/**
 * Menghasilkan nama file standar berdasarkan pattern master dokumen dan identitas siswa.
 * Contoh output: "Ngurah_Manik_Mahardika_PASSPORT.pdf"
 */
export function generateStandardFileName({
  pattern,
  studentName,
  documentCode,
  originalFileName,
}: GenerateFileNameParams): string {
  const safeStudentName = sanitizeNameToken(studentName);
  const safeDocCode = sanitizeCodeToken(documentCode);
  const ext = getFileExtension(originalFileName);

  const rawPattern = String(pattern ?? "").trim();
  const upperPattern = rawPattern.toUpperCase();

  // Jika pattern eksplisit diatur untuk mempertahankan nama asli
  if (upperPattern === "NONE") {
    const baseSafe = (originalFileName || "document")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    return baseSafe;
  }

  // Jika ada template pattern seperti "{studentName}_PASSPORT.pdf" atau "[STUDENT_NAME]_PASSPORT"
  if (rawPattern && (rawPattern.includes("{") || rawPattern.includes("["))) {
    let result = rawPattern
      .replace(/\{studentName\}/gi, safeStudentName)
      .replace(/\{student_name\}/gi, safeStudentName)
      .replace(/\[STUDENT_NAME\]/gi, safeStudentName)
      .replace(/\[STUDENTNAME\]/gi, safeStudentName)
      .replace(/\{documentCode\}/gi, safeDocCode)
      .replace(/\{document_code\}/gi, safeDocCode)
      .replace(/\[DOCUMENT_CODE\]/gi, safeDocCode);

    // Pastikan ekstensi sesuai dengan file fisik asli (misal .jpg tidak dipaksa jadi .pdf)
    const patternExtMatch = result.match(/\.([a-zA-Z0-9]+)$/);
    if (patternExtMatch) {
      result = result.replace(/\.[a-zA-Z0-9]+$/, `.${ext}`);
    } else {
      result = `${result}.${ext}`;
    }

    return result.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  // Format Standar Rekomendasi: [Nama_Siswa]_[KODE_DOKUMEN].[ext]
  return `${safeStudentName}_${safeDocCode}.${ext}`;
}
