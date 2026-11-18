import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildConsultantOptions, isAssignableConsultantRole } from "../../app/utils/consultant-options";

const team = [
  { name: "Agung OSS", role: "CONSULTANT" },
  { name: "Jani Antari", role: "CONSULTANT" },
  { name: "Ayu OSS", role: "DIRECTOR" },
  { name: "Approval", role: "director" },
  { name: "Mita - Admission", role: "ADMISSION" },
  { name: "Budi Siswa", role: "STUDENT" },
];

describe("Pilihan Consultant Name", () => {
  it("menyertakan akun Consultant dan Director, tidak Admission atau Student", () => {
    assert.deepEqual(
      buildConsultantOptions(team).map((o) => o.label),
      ["Agung OSS", "Approval", "Ayu OSS", "Jani Antari"],
    );
  });

  it("nilai pilihan sama dengan namanya (siswa terhubung lewat nama akun)", () => {
    assert.deepEqual(buildConsultantOptions([{ name: "  Ayu OSS ", role: "DIRECTOR" }]), [{ label: "Ayu OSS", value: "Ayu OSS" }]);
  });

  it("satu pilihan per nama (huruf besar-kecil diabaikan) dan akun tanpa nama dilewati", () => {
    const options = buildConsultantOptions([
      { name: "Ayu OSS", role: "DIRECTOR" },
      { name: "ayu oss", role: "CONSULTANT" },
      { name: "   ", role: "CONSULTANT" },
      { name: null, role: "CONSULTANT" },
    ]);
    assert.deepEqual(options, [{ label: "Ayu OSS", value: "Ayu OSS" }]);
  });

  it("daftar kosong atau belum dimuat menghasilkan daftar kosong", () => {
    assert.deepEqual(buildConsultantOptions([]), []);
    assert.deepEqual(buildConsultantOptions(undefined), []);
    assert.deepEqual(buildConsultantOptions(null), []);
  });

  it("peran dibaca tanpa membedakan huruf besar-kecil", () => {
    assert.equal(isAssignableConsultantRole("Director"), true);
    assert.equal(isAssignableConsultantRole(" consultant "), true);
    assert.equal(isAssignableConsultantRole("ADMISSION"), false);
    assert.equal(isAssignableConsultantRole(undefined), false);
  });
});
