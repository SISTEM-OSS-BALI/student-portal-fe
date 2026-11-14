/**
 * Mesin Kebijakan Otorisasi & Hak Akses Berbasis Role (RBAC Engine)
 * Memastikan setiap peran (director, admission, student, consultant) memiliki batas akses yang aman.
 */

export type UserRole = "director" | "admission" | "student" | "consultant";

export type AppAction =
  | "document.approve"
  | "document.reject"
  | "document.reapprove"
  | "document.cancelApproval"
  | "document.upload"
  | "document.inspectOcr"
  | "student.viewGlobal"
  | "student.viewOwnOnly"
  | "student.editStage"
  | "student.dragPipeline"
  | "student.create"
  | "masterData.manage"
  | "notes.create"
  | "analytics.viewMacroKPI"
  | "notes.viewInternal";

export const DEFAULT_REJECTION_NOTE =
  "Dokumen belum memenuhi persyaratan. Mohon unggah ulang berkas yang sesuai.";

/**
 * Normalisasi string role agar tahan terhadap perbedaan huruf besar/kecil dan spasi.
 */
export function normalizeRole(role?: string | null): UserRole | "guest" {
  if (!role) return "guest";
  const clean = role.trim().toLowerCase();
  if (clean === "director" || clean === "direktur") return "director";
  if (clean === "admission" || clean === "admisi") return "admission";
  if (clean === "student" || clean === "siswa") return "student";
  if (clean === "consultant" || clean === "konsultan") return "consultant";
  return "guest";
}

/**
 * Memeriksa apakah role tertentu memiliki izin untuk melakukan aksi spesifik.
 */
export function hasPermission(
  role: string | null | undefined,
  action: AppAction,
  context?: {
    isVerifiedSignature?: boolean;
    isStudentOwner?: boolean;
    studentStatus?: string | null;
  }
): boolean {
  const normRole = normalizeRole(role);

  switch (action) {
    case "document.approve":
    case "document.reject":
    case "document.reapprove":
      // Hanya role admission yang memiliki wewenang persetujuan dokumen
      return normRole === "admission";

    case "document.cancelApproval":
      // Hanya admission yang boleh membatalkan, dan TIDAK BOLEH jika dokumen adalah tanda tangan terverifikasi
      if (normRole !== "admission") return false;
      if (context?.isVerifiedSignature === true) return false;
      return true;

    case "document.inspectOcr":
      // Fitur inspeksi OCR hanya diperuntukkan bagi tim verifikator (admission)
      return normRole === "admission";

    case "document.upload":
      // Siswa hanya boleh mengunggah berkasnya sendiri, dan status tidak boleh Batal/Cancel
      if (normRole === "student") {
        if (context?.isStudentOwner === false) return false;
        const status = String(context?.studentStatus ?? "").toLowerCase();
        if (status.includes("cancel") || status.includes("batal")) return false;
        return true;
      }
      // Admission boleh membantu unggah berkas
      if (normRole === "admission") return true;
      return false;

    case "student.viewGlobal":
      // Direktur dan Admission berhak melihat seluruh direktori siswa
      return normRole === "director" || normRole === "admission";

    case "student.viewOwnOnly":
      return normRole === "student";

    case "student.editStage":
    case "student.dragPipeline":
      // Hanya Admission yang boleh mengubah tahapan atau memindahkan status pipeline siswa
      return normRole === "admission";

    case "student.create":
      // Hanya Admission yang berhak mendaftarkan siswa baru ke dalam sistem
      return normRole === "admission";

    case "masterData.manage":
      // Admission dan Direktur memiliki wewenang mengelola data master
      return normRole === "admission" || normRole === "director";

    case "notes.create":
      // Admission dan Konsultan berhak menambahkan catatan bimbingan/evaluasi
      return normRole === "admission" || normRole === "consultant";

    case "analytics.viewMacroKPI":
      // Hanya Direktur yang melihat metrik strategis makro (durasi, tren 6 bulan)
      return normRole === "director";

    case "notes.viewInternal":
      // Siswa dilarang keras melihat catatan internal staf/konsultan
      return normRole === "director" || normRole === "admission" || normRole === "consultant";

    default:
      return false;
  }
}

/**
 * Membersihkan dan memastikan alasan penolakan dokumen aman dari tag HTML / script.
 */
export function sanitizeRejectionNote(note?: string | null): string {
  if (!note || !note.trim()) {
    return DEFAULT_REJECTION_NOTE;
  }

  // Bersihkan blok <script> dan <style> beserta seluruh isinya terlebih dahulu
  const sanitized = note
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || DEFAULT_REJECTION_NOTE;
}

/**
 * Validasi isolasi data multi-tenant siswa (Horizontal Authorization Guard).
 * Mencegah siswa A mengakses data siswa B.
 */
export function validateTenantAccess(
  currentUserId: string | number | undefined | null,
  currentRole: string | undefined | null,
  targetStudentId: string | number | undefined | null
): { allowed: boolean; reason?: string } {
  const normRole = normalizeRole(currentRole);

  if (normRole === "guest") {
    return { allowed: false, reason: "Sesi tidak valid atau belum terautentikasi." };
  }

  // Direktur dan Admisi memiliki izin lintas siswa (global scope)
  if (normRole === "director" || normRole === "admission") {
    return { allowed: true };
  }

  // Siswa HANYA boleh mengakses data jika ID pengguna cocok dengan target student_id
  if (normRole === "student") {
    if (!currentUserId || !targetStudentId) {
      return { allowed: false, reason: "Identitas pengguna tidak lengkap." };
    }
    const isOwner = String(currentUserId).trim() === String(targetStudentId).trim();
    if (!isOwner) {
      return {
        allowed: false,
        reason: "Pelanggaran Hak Akses: Siswa dilarang mengakses berkas siswa lain.",
      };
    }
    return { allowed: true };
  }

  // Konsultan memerlukan penugasan eksplisit (default izinkan jika konsultan aktif)
  if (normRole === "consultant") {
    return { allowed: true };
  }

  return { allowed: false, reason: "Role tidak memiliki izin akses." };
}

/**
 * Spesifikasi daftar kolom dokumen yang diizinkan untuk dirender berdasarkan role.
 */
export function getDocumentTableColumnsForRole(role: string | null | undefined): string[] {
  const normRole = normalizeRole(role);
  if (normRole === "director") {
    // Direktur bersifat read-only: tidak ada kolom tombol approval/rejection
    return ["name", "status", "upload_date", "preview"];
  }
  if (normRole === "admission") {
    // Admisi memiliki kontrol operasional penuh
    return ["name", "status", "upload_date", "preview", "ocr_status", "actions"];
  }
  if (normRole === "student") {
    // Siswa melihat status berkas, catatan jika ditolak, dan tombol unggah ulang
    return ["name", "status", "rejection_note", "upload_date", "reupload_action"];
  }
  return ["name", "status", "preview"];
}
