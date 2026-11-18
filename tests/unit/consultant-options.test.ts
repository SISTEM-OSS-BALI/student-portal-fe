import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  UNMAPPED_CONSULTANT,
  UNMAPPED_CONSULTANT_LABEL,
  buildConsultantFilterOptions,
  buildConsultantOptions,
  consultantFilterLabel,
  isAssignableConsultantRole,
  matchesConsultantFilter,
  resolveConsultantAccount,
} from "../../app/utils/consultant-options";

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

const accounts = ["Agung OSS", "Astina Putra", "Ayu OSS", "Dessi Natalia", "Jani Antari", "Jesse Jovian", "Nadya Ananda", "Timothy Adam"];

describe("Filter konsultan mengikuti Team Account", () => {
  it("memetakan variasi nama lama ke satu akun (nama persis, atau kata pertama yang hanya dimiliki satu akun)", () => {
    assert.equal(resolveConsultantAccount("Jani Antari", accounts), "Jani Antari");
    assert.equal(resolveConsultantAccount("  jani   antari ", accounts), "Jani Antari");
    assert.equal(resolveConsultantAccount("Jani", accounts), "Jani Antari");
    assert.equal(resolveConsultantAccount("Jani OSS", accounts), "Jani Antari");
    assert.equal(resolveConsultantAccount("Nadya", accounts), "Nadya Ananda");
    assert.equal(resolveConsultantAccount("Astina", accounts), "Astina Putra");
    assert.equal(resolveConsultantAccount("Ayu Mahadewi", accounts), "Ayu OSS");
  });

  it("tidak menebak: nama asing, kosong, atau kata pertama yang dimiliki dua akun", () => {
    assert.equal(resolveConsultantAccount("Rafli Prayanto", accounts), null);
    assert.equal(resolveConsultantAccount("", accounts), null);
    assert.equal(resolveConsultantAccount(null, accounts), null);
    const twoAyu = ["Ayu OSS", "Ayu Mahadewi"];
    assert.equal(resolveConsultantAccount("Ayu", twoAyu), null);
    assert.equal(resolveConsultantAccount("Ayu Mahadewi", twoAyu), "Ayu Mahadewi");
    // awalan huruf saja tidak cukup: "An" bukan "Ananda"
    assert.equal(resolveConsultantAccount("An", accounts), null);
  });

  it("memilih satu konsultan hanya menjaring siswa konsultan itu (tidak lagi ambigu)", () => {
    for (const stored of ["Ayu OSS", "Ayu Mahadewi"]) assert.equal(matchesConsultantFilter(stored, "Ayu OSS", accounts), true);
    for (const stored of ["Jani", "Jani OSS", "Jani Antari"]) assert.equal(matchesConsultantFilter(stored, "Jani Antari", accounts), true);
    for (const stored of ["Nadya", "Astina Putra", "Rafli", ""]) assert.equal(matchesConsultantFilter(stored, "Jani Antari", accounts), false);
    assert.equal(matchesConsultantFilter("Jani", "Nadya Ananda", accounts), false);
  });

  it("tanpa filter semua lolos; 'Lainnya' hanya untuk siswa bernama konsultan yang tidak cocok dengan akun mana pun", () => {
    assert.equal(matchesConsultantFilter("apa saja", undefined, accounts), true);
    assert.equal(matchesConsultantFilter("apa saja", "", accounts), true);
    assert.equal(matchesConsultantFilter("Rafli Prayanto", UNMAPPED_CONSULTANT, accounts), true);
    assert.equal(matchesConsultantFilter("Jani", UNMAPPED_CONSULTANT, accounts), false);
    assert.equal(matchesConsultantFilter("", UNMAPPED_CONSULTANT, accounts), false);
  });

  const users = [
    { name: "Jani Antari", role: "CONSULTANT" },
    { name: "Ayu OSS", role: "DIRECTOR" },
    { name: "Mita - Admission", role: "ADMISSION" },
  ];

  it("pilihan filter = akun Team Account saja, satu per orang, tanpa variasi dari data siswa", () => {
    const options = buildConsultantFilterOptions(users, ["Jani", "Jani OSS", "Jani Antari", "Ayu Mahadewi", "Ayu OSS", ""]);
    assert.deepEqual(options.map((o) => o.label), ["Ayu OSS", "Jani Antari"]);
  });

  it("'Lainnya' muncul hanya bila ada siswa yang tidak cocok, dan di akhir daftar", () => {
    const options = buildConsultantFilterOptions(users, ["Jani", "Rafli Prayanto"]);
    assert.deepEqual(options.map((o) => o.label), ["Ayu OSS", "Jani Antari", UNMAPPED_CONSULTANT_LABEL]);
    assert.equal(options.at(-1)?.value, UNMAPPED_CONSULTANT);
  });

  it("kosong selama daftar akun belum dimuat (tidak menampilkan 'Lainnya' sesaat)", () => {
    assert.deepEqual(buildConsultantFilterOptions(undefined, ["Jani"]), []);
    assert.deepEqual(buildConsultantFilterOptions([], ["Jani"]), []);
  });

  it("label ringkasan filter", () => {
    assert.equal(consultantFilterLabel(undefined), undefined);
    assert.equal(consultantFilterLabel("Jani Antari"), "Jani Antari");
    assert.equal(consultantFilterLabel(UNMAPPED_CONSULTANT), UNMAPPED_CONSULTANT_LABEL);
  });
});
