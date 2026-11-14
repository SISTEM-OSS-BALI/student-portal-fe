import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildFallbackProfileSummary,
  generateProfileSummaryText,
} from "../../app/utils/ai-profile-summary";

describe("Unit Testing Modul ai-profile-summary.ts", () => {
  it("Menghasilkan ringkasan profil untuk kandidat dengan latar pendidikan dan pengalaman kerja", () => {
    const summary = buildFallbackProfileSummary({
      fullName: "Budi Santoso",
      educations: [
        {
          id: "edu_1",
          school_name: "Universitas Udayana",
          degree: "Bachelor of Tourism",
          major: "Hospitality Management",
        },
      ],
      experiences: [
        {
          id: "exp_1",
          company: "Grand Hyatt Bali",
          job_title: "Front Office Supervisor",
          start_date: "2021",
          end_date: "Present",
        },
      ],
    });

    assert.ok(summary.includes("Hospitality Management"));
    assert.ok(summary.includes("Front Office Supervisor"));
    assert.ok(summary.includes("Grand Hyatt Bali"));
    assert.ok(summary.includes("international environment"));
  });

  it("Menghasilkan ringkasan profil untuk lulusan baru (hanya pendidikan formal)", () => {
    const summary = buildFallbackProfileSummary({
      fullName: "Ni Putu Ayu",
      educations: [
        {
          id: "edu_2",
          school_name: "Politeknik Negeri Bali",
          degree: "Diploma",
          major: "Accounting",
        },
      ],
      experiences: [],
    });

    assert.ok(summary.includes("Accounting"));
    assert.ok(summary.includes("Politeknik Negeri Bali"));
    assert.ok(summary.includes("graduate"));
  });

  it("Menghasilkan ringkasan profil untuk profesional berorientasi kerja (tanpa detail universitas)", () => {
    const summary = buildFallbackProfileSummary({
      fullName: "I Made Wirawan",
      educations: [],
      experiences: [
        {
          id: "exp_2",
          company: "Black Sand Brewery",
          job_title: "Lead Barista",
        },
      ],
    });

    assert.ok(summary.includes("Lead Barista"));
    assert.ok(summary.includes("Black Sand Brewery"));
    assert.ok(summary.includes("Results-oriented"));
  });

  it("Menghasilkan fallback profesional umum ketika tidak ada riwayat yang tercatat", () => {
    const summary = buildFallbackProfileSummary({});
    assert.ok(summary.length > 20);
    assert.ok(summary.includes("Motivated"));
  });

  it("generateProfileSummaryText mengembalikan teks bahasa Inggris yang valid", async () => {
    const res = await generateProfileSummaryText({
      fullName: "Siti Rahma",
      educations: [
        {
          id: "edu_3",
          school_name: "Universitas Indonesia",
          major: "Computer Science",
        },
      ],
    });

    assert.ok(typeof res === "string");
    assert.ok(res.length > 30);
    assert.ok(res.includes("Computer Science"));
  });
});
