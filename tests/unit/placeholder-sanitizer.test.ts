import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cleanPlaceholder,
  formatBadgeEnglish,
  sanitizeQuestionPlaceholders,
} from "../../app/utils/placeholder-sanitizer";

describe("Unit Testing Modul placeholder-sanitizer.ts", () => {
  it("Menyederhanakan contoh negara dengan garis miring menjadi 1 contoh tunggal", () => {
    const raw = "Contoh: Australia / Singapura / Malaysia";
    const cleaned = cleanPlaceholder(raw);
    assert.equal(cleaned, "Contoh: Australia");
  });

  it("Menyederhanakan contoh jenis visa dengan garis miring menjadi 1 contoh tunggal", () => {
    const raw = "Contoh: Tourist Visa / Subclass 600 / Bebas Visa";
    const cleaned = cleanPlaceholder(raw);
    assert.equal(cleaned, "Contoh: Tourist Visa");
  });

  it("Menyederhanakan contoh kursus pelatihan menjadi 1 contoh tunggal", () => {
    const raw = "Contoh: IELTS Preparation Course / Barista Training";
    const cleaned = cleanPlaceholder(raw);
    assert.equal(cleaned, "Contoh: IELTS Preparation Course");
  });

  it("Menyederhanakan contoh lembaga penyelenggara menjadi 1 contoh tunggal", () => {
    const raw = "Contoh: British Council / IALF Bali";
    const cleaned = cleanPlaceholder(raw);
    assert.equal(cleaned, "Contoh: British Council");
  });

  it("Menyederhanakan contoh nilai IPK menjadi 1 contoh tunggal", () => {
    const raw = "Contoh: 3.75 / 4.00";
    const cleaned = cleanPlaceholder(raw);
    assert.equal(cleaned, "Contoh: 3.75");
  });

  it("Melindungi format tanggal resmi seperti DD/MM/YYYY", () => {
    const raw = "DD/MM/YYYY";
    const cleaned = cleanPlaceholder(raw);
    assert.equal(cleaned, "DD/MM/YYYY");
  });

  it("Melindungi format tautan URL seperti https://...", () => {
    const raw = "https://...";
    const cleaned = cleanPlaceholder(raw);
    assert.equal(cleaned, "https://...");
  });

  it("Menyederhanakan opsi tanpa prefix Contoh seperti Single / Married", () => {
    const raw = "Single / Married";
    const cleaned = cleanPlaceholder(raw);
    assert.equal(cleaned, "Single");
  });

  it("Menyaring objek pertanyaan secara menyeluruh dengan sanitizeQuestionPlaceholders", () => {
    const question = {
      id: "q_th_01",
      text: "Negara Tujuan Kunjungan",
      placeholder: "Contoh: Australia / Singapura / Malaysia",
    };
    const sanitized = sanitizeQuestionPlaceholders(question);
    assert.equal(sanitized.placeholder, "Contoh: Australia");
  });

  it("Menerjemahkan label badge tipe pekerjaan dan jenjang ke Bahasa Inggris formal ringkas", () => {
    assert.equal(formatBadgeEnglish("Magang"), "Internship");
    assert.equal(formatBadgeEnglish("Pekerja Lepas"), "Freelance");
    assert.equal(formatBadgeEnglish("Penuh Waktu"), "Full-Time");
    assert.equal(formatBadgeEnglish("Paruh Waktu"), "Part-Time");
    assert.equal(formatBadgeEnglish("Kontrak"), "Contract");
    assert.equal(formatBadgeEnglish("Sarjana (S1)"), "Bachelor's Degree");
    assert.equal(formatBadgeEnglish("SMA / SMK / Sederajat"), "High School");
    assert.equal(formatBadgeEnglish("Nasional"), "National");
  });
});
