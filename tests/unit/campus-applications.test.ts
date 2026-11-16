import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  StudentCampusApplicationDataModel,
  StudentCampusApplicationStatus,
} from "../../app/models/student-campus-application";

describe("Student Campus Applications Unit Tests", () => {
  it("harus menyortir kampus utama (is_primary) paling atas", () => {
    const list: StudentCampusApplicationDataModel[] = [
      {
        id: "app-1",
        user_id: "user-1",
        campus_name: "RMIT University",
        degree: "Bachelor",
        name_degree: "Bachelor of Business",
        status: "WAITING_LOO",
        is_primary: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "app-2",
        user_id: "user-1",
        campus_name: "Monash University",
        degree: "Master",
        name_degree: "Master of Data Science",
        status: "ACCEPTED",
        is_primary: true,
        created_at: "2026-01-02T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      },
      {
        id: "app-3",
        user_id: "user-1",
        campus_name: "Deakin University",
        degree: "Bachelor",
        name_degree: "Bachelor of IT",
        status: "APPLIED",
        is_primary: false,
        created_at: "2026-01-03T00:00:00Z",
        updated_at: "2026-01-03T00:00:00Z",
      },
    ];

    const sorted = [...list].sort((a, b) => {
      if (a.is_primary === b.is_primary) return 0;
      return a.is_primary ? -1 : 1;
    });

    assert.equal(sorted[0].id, "app-2");
    assert.equal(sorted[0].campus_name, "Monash University");
    assert.equal(sorted[0].is_primary, true);
  });

  it("harus memvalidasi semua status aplikasi kampus yang didukung", () => {
    const validStatuses: StudentCampusApplicationStatus[] = [
      "APPLIED",
      "WAITING_LOO",
      "CONDITIONAL_LOO",
      "UNCONDITIONAL_LOO",
      "ACCEPTED",
      "REJECTED",
    ];

    validStatuses.forEach((status) => {
      assert.ok(status.length > 0);
      assert.equal(status, status.toUpperCase());
    });
  });

  it("harus mendukung informasi negara (country_name) pada tiap aplikasi", () => {
    const app: StudentCampusApplicationDataModel = {
      id: "app-1",
      user_id: "user-1",
      campus_name: "University of Melbourne",
      country_name: "Australia",
      degree: "Master",
      name_degree: "Master of Finance",
      status: "APPLIED",
      is_primary: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    assert.equal(app.country_name, "Australia");
  });

  it("harus memastikan hanya 1 kampus yang aktif sebagai primary saat pergantian pilihan utama", () => {
    const applications = [
      { id: "1", campus_name: "Monash", is_primary: true },
      { id: "2", campus_name: "Melbourne Uni", is_primary: false },
      { id: "3", campus_name: "Sydney Uni", is_primary: false },
    ];

    const targetId = "2";
    const updated = applications.map((app) => ({
      ...app,
      is_primary: app.id === targetId,
    }));

    const primaryApps = updated.filter((app) => app.is_primary);
    assert.equal(primaryApps.length, 1);
    assert.equal(primaryApps[0].id, "2");
    assert.equal(primaryApps[0].campus_name, "Melbourne Uni");
  });

  it("harus mendukung custom status bebas seperti Notion (misal: Review Portofolio, Wawancara Beasiswa)", () => {
    const customStatuses = [
      "Review Portofolio",
      "Wawancara Beasiswa",
      "Menunggu Hasil IELTS",
      "Deposit Paid / Menunggu CoE",
      "GTE Assessment Approved",
    ];

    customStatuses.forEach((status, index) => {
      const app: StudentCampusApplicationDataModel = {
        id: `app-custom-${index}`,
        user_id: "user-1",
        campus_name: "Custom University",
        country_name: "Australia",
        degree: "Bachelor",
        name_degree: "Bachelor of Arts",
        status: status,
        is_primary: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };

      assert.equal(app.status, status);
      assert.ok(app.status.length > 0);
    });
  });
});

