/**
 * Utilitas untuk memvalidasi dan mencocokkan nama hasil OCR berkas
 * dengan nama akun siswa yang terdaftar di portal.
 */

const HONORIFICS = new RegExp(
  "\\b(s\\.kom|s\\.e|s\\.pd|s\\.h|s\\.t|b\\.a|b\\.sc|m\\.sc|m\\.ba|drs|dra|dr|prof|mr|ms|mrs)\\b",
  "gi",
);

export function cleanNameString(name?: string | null): string {
  if (!name) return "";

  return name
    .toLowerCase()
    .replace(HONORIFICS, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Menghitung Levenshtein distance sederhana untuk toleransi salah baca OCR
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i += 1) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j += 1) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return d[m][n];
}

function wordSimilarity(w1: string, w2: string): number {
  if (w1 === w2) return 1;
  // Jika salah satu adalah inisial 1 huruf
  if ((w1.length === 1 && w2.startsWith(w1)) || (w2.length === 1 && w1.startsWith(w2))) {
    return 0.85;
  }
  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(w1, w2);
  return Math.max(0, (maxLen - dist) / maxLen);
}

export type NameMatchResult = {
  status: "MATCH" | "PARTIAL" | "MISMATCH" | "UNREADABLE";
  score: number; // 0 - 100
  isAcceptable: boolean;
  ocrName: string;
  accountName: string;
  message: string;
  detail: string;
};

/**
 * Membandingkan nama yang terbaca oleh OCR dengan nama akun siswa di portal.
 */
export function compareStudentNameWithOCR(
  rawOcrName?: string | null,
  rawAccountName?: string | null,
): NameMatchResult {
  const ocrClean = cleanNameString(rawOcrName);
  const accountClean = cleanNameString(rawAccountName);

  const displayOcr = (rawOcrName ?? "").trim() || "Tidak terdeteksi";
  const displayAccount = (rawAccountName ?? "").trim() || "Nama Siswa";

  // Kasus 1: OCR tidak berhasil menemukan nama pada berkas
  if (!ocrClean || ocrClean.length < 3) {
    return {
      status: "UNREADABLE",
      score: 0,
      isAcceptable: false,
      ocrName: displayOcr,
      accountName: displayAccount,
      message: "Nama belum terdeteksi dari scan berkas.",
      detail:
        "Teks nama tidak terbaca otomatis oleh OCR. Pastikan dokumen tidak buram, terpotong, atau silau.",
    };
  }

  // Kasus 2: Sama persis secara teks
  if (ocrClean === accountClean) {
    return {
      status: "MATCH",
      score: 100,
      isAcceptable: true,
      ocrName: displayOcr,
      accountName: displayAccount,
      message: "Nama pada dokumen sesuai dengan akun siswa.",
      detail: `Nama di dokumen "${displayOcr}" cocok 100% dengan profil "${displayAccount}".`,
    };
  }

  // Kasus 3: Pencocokan berbasis kumpulan kata (Token Overlap)
  const ocrWords = ocrClean.split(" ").filter((w) => w.length > 0);
  const accountWords = accountClean.split(" ").filter((w) => w.length > 0);

  if (accountWords.length === 0) {
    return {
      status: "UNREADABLE",
      score: 0,
      isAcceptable: false,
      ocrName: displayOcr,
      accountName: displayAccount,
      message: "Nama akun tidak valid.",
      detail: "Profil siswa tidak memiliki nama yang dapat dibandingkan.",
    };
  }

  let totalMatchScore = 0;

  for (const accWord of accountWords) {
    let bestWordMatch = 0;
    for (const ocrWord of ocrWords) {
      const sim = wordSimilarity(accWord, ocrWord);
      if (sim > bestWordMatch) {
        bestWordMatch = sim;
      }
    }
    totalMatchScore += bestWordMatch;
  }

  const finalScore = Math.round((totalMatchScore / accountWords.length) * 100);

  // Evaluasi batas kecocokan (Thresholds)
  if (finalScore >= 80) {
    return {
      status: "MATCH",
      score: finalScore,
      isAcceptable: true,
      ocrName: displayOcr,
      accountName: displayAccount,
      message: `Nama terverifikasi cocok (${finalScore}%).`,
      detail: `Nama di dokumen "${displayOcr}" terverifikasi sesuai dengan profil siswa "${displayAccount}".`,
    };
  }

  if (finalScore >= 55) {
    return {
      status: "PARTIAL",
      score: finalScore,
      isAcceptable: true,
      ocrName: displayOcr,
      accountName: displayAccount,
      message: `Nama memiliki kemiripan (${finalScore}%).`,
      detail: `Terdeteksi singkatan atau sedikit perbedaan antara "${displayOcr}" dan "${displayAccount}". Mohon verifikasi kembali.`,
    };
  }

  return {
    status: "MISMATCH",
    score: finalScore,
    isAcceptable: false,
    ocrName: displayOcr,
    accountName: displayAccount,
    message: "Peringatan: Nama di dokumen berbeda dari akun siswa.",
    detail: `Nama pada berkas "${displayOcr}" tidak cocok dengan akun Anda "${displayAccount}". Pastikan Anda mengunggah berkas pribadi Anda.`,
  };
}
