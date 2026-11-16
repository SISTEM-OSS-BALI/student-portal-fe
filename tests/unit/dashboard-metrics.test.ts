import { describe, it } from "node:test";
import assert from "node:assert";
import type { UserDataModel } from "@/app/models/user";

// Fungsi kalkulator KPI sesuai logika di Dashboard Direktur & Admission
function calculateVisaSuccessRate(students: UserDataModel[]): {
  granted: number;
  processing: number;
  refused: number;
  total: number;
  successRate: number;
} {
  let granted = 0;
  let processing = 0;
  let refused = 0;

  for (const s of students) {
    const raw = String(s.visa_status ?? "").toLowerCase().trim();
    if (raw.includes("grant") || raw.includes("approved")) {
      granted += 1;
    } else if (raw.includes("refus") || raw.includes("reject") || raw.includes("cancel")) {
      refused += 1;
    } else {
      processing += 1;
    }
  }

  const total = granted + processing + refused;
  // Edge Case: Bila total 0, UI menggunakan fallback default 92%
  const successRate = total > 0 ? Math.round((granted / total) * 100) : 92;

  return { granted, processing, refused, total, successRate };
}

function calculateLodgementStats(
  students: UserDataModel[],
  mockNow: number = Date.now()
): { avg: number | null; trend: number | null } {
  const durations: number[] = [];
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  students.forEach((s) => {
    const start = s.created_at ? new Date(s.created_at).getTime() : NaN;
    if (Number.isNaN(start)) return;

    const candidates = [s.student_status_updated_at, s.visa_granted_at, s.updated_at]
      .map((v) => (v ? new Date(v).getTime() : NaN))
      .filter((t) => !Number.isNaN(t));

    const end = candidates.length > 0 ? Math.max(...candidates) : mockNow;
    const days = (end - start) / MS_PER_DAY;
    // Anomali: Jika tanggal end sebelum start (durasi negatif), data diabaikan
    if (days > 0) durations.push(days);
  });

  if (durations.length === 0) return { avg: null, trend: null };

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const TARGET_DAYS = 30;
  const trendPct = Math.round(((TARGET_DAYS - avg) / TARGET_DAYS) * 100);
  return { avg: Math.round(avg * 10) / 10, trend: trendPct };
}

describe("Dashboard KPI & Metrics Math Unit Tests", () => {
  describe("Kalkulasi Visa Success Rate", () => {
    it("harus menangani kasus array siswa kosong (Division by Zero) dengan fallback terprediksi", () => {
      const result = calculateVisaSuccessRate([]);
      assert.strictEqual(result.total, 0);
      assert.strictEqual(result.granted, 0);
      // Fallback default pada dashboard saat belum ada data visa
      assert.strictEqual(result.successRate, 92);
    });

    it("harus menghitung 100% jika semua visa berstatus granted", () => {
      const students: UserDataModel[] = [
        { visa_status: "Granted" } as UserDataModel,
        { visa_status: "Approved" } as UserDataModel,
      ];
      const result = calculateVisaSuccessRate(students);
      assert.strictEqual(result.total, 2);
      assert.strictEqual(result.granted, 2);
      assert.strictEqual(result.successRate, 100);
    });

    it("harus menghitung 0% jika semua visa berstatus refused / reject", () => {
      const students: UserDataModel[] = [
        { visa_status: "Refused" } as UserDataModel,
        { visa_status: "Rejected by embassy" } as UserDataModel,
      ];
      const result = calculateVisaSuccessRate(students);
      assert.strictEqual(result.total, 2);
      assert.strictEqual(result.granted, 0);
      assert.strictEqual(result.refused, 2);
      assert.strictEqual(result.successRate, 0);
    });

    it("harus memperlakukan status anomali atau kosong sebagai 'processing'", () => {
      const students: UserDataModel[] = [
        { visa_status: null } as unknown as UserDataModel,
        { visa_status: "" } as unknown as UserDataModel,
        { visa_status: "Awaiting Biometrics" } as UserDataModel,
      ];
      const result = calculateVisaSuccessRate(students);
      assert.strictEqual(result.total, 3);
      assert.strictEqual(result.processing, 3);
      assert.strictEqual(result.successRate, 0);
    });
  });

  describe("Kalkulasi Rata-rata Durasi Lodgement", () => {
    it("harus mengabaikan data anomali di mana tanggal penyelesaian lebih awal dari tanggal pendaftaran", () => {
      const corruptedStudents: UserDataModel[] = [
        {
          created_at: "2026-03-15T00:00:00Z",
          visa_granted_at: "2026-03-01T00:00:00Z", // 14 hari sebelum pendaftaran (anomali)
        } as unknown as UserDataModel,
      ];

      const stats = calculateLodgementStats(corruptedStudents);
      // Karena durasi negatif, tidak boleh masuk hitungan rata-rata
      assert.strictEqual(stats.avg, null);
      assert.strictEqual(stats.trend, null);
    });

    it("harus menghitung rata-rata dan tren performa terhadap target 30 hari", () => {
      const mockNow = new Date("2026-04-01T00:00:00Z").getTime();
      const students: UserDataModel[] = [
        {
          // 20 hari proses
          created_at: "2026-03-01T00:00:00Z",
          visa_granted_at: "2026-03-21T00:00:00Z",
        } as unknown as UserDataModel,
        {
          // 40 hari proses
          created_at: "2026-02-10T00:00:00Z",
          visa_granted_at: "2026-03-22T00:00:00Z",
        } as unknown as UserDataModel,
      ];

      const stats = calculateLodgementStats(students, mockNow);
      // Rata-rata: (20 + 40) / 2 = 30 hari
      assert.strictEqual(stats.avg, 30);
      // Tren terhadap target 30 hari: (30 - 30) / 30 = 0%
      assert.strictEqual(stats.trend, 0);
    });

    it("harus menghasilkan tren positif jika proses lebih cepat dari target 30 hari", () => {
      const students: UserDataModel[] = [
        {
          // 15 hari proses (50% lebih cepat dari target 30 hari)
          created_at: "2026-03-01T00:00:00Z",
          visa_granted_at: "2026-03-16T00:00:00Z",
        } as unknown as UserDataModel,
      ];

      const stats = calculateLodgementStats(students);
      assert.strictEqual(stats.avg, 15);
      assert.strictEqual(stats.trend, 50); // +50% lebih cepat
    });

    it("harus menghasilkan tren negatif jika proses melewati target 30 hari", () => {
      const students: UserDataModel[] = [
        {
          // 60 hari proses (100% lebih lambat dari target 30 hari)
          created_at: "2026-01-01T00:00:00Z",
          visa_granted_at: "2026-03-02T00:00:00Z",
        } as unknown as UserDataModel,
      ];

      const stats = calculateLodgementStats(students);
      assert.strictEqual(stats.avg, 60);
      assert.strictEqual(stats.trend, -100); // -100% lebih lambat
    });
  });
});
