import { describe, it } from "node:test";
import assert from "node:assert";
import {
  cleanNameString,
  compareStudentNameWithOCR,
} from "@/app/utils/ocr-name-matcher";
import {
  generateStandardFileName,
  getFileExtension,
  sanitizeCodeToken,
  sanitizeNameToken,
} from "@/app/utils/document-auto-rename";

describe("ocr-name-matcher unit tests", () => {
  describe("cleanNameString", () => {
    it("harus membersihkan gelar akademik dan honorifik", () => {
      assert.strictEqual(cleanNameString("Budi Santoso, S.Kom"), "budi santoso");
      assert.strictEqual(cleanNameString("Dr. Citra Kirana, M.Sc"), "citra kirana");
      assert.strictEqual(cleanNameString("Prof. Hendra Wijaya"), "hendra wijaya");
    });

    it("harus membersihkan tanda baca dan spasi berlebih", () => {
      assert.strictEqual(cleanNameString("  Eka  Safitri  --  Wardani  "), "eka safitri wardani");
      assert.strictEqual(cleanNameString(""), "");
      assert.strictEqual(cleanNameString(null), "");
      assert.strictEqual(cleanNameString(undefined), "");
    });
  });

  describe("compareStudentNameWithOCR", () => {
    it("harus mengembalikan MATCH jika nama persis sama", () => {
      const res = compareStudentNameWithOCR("Budi Pratama", "Budi Pratama");
      assert.strictEqual(res.status, "MATCH");
      assert.strictEqual(res.score, 100);
      assert.strictEqual(res.isAcceptable, true);
    });

    it("harus mengembalikan UNREADABLE jika hasil OCR kosong atau terlalu pendek", () => {
      const res = compareStudentNameWithOCR("ab", "Citra Kirana Dewi");
      assert.strictEqual(res.status, "UNREADABLE");
      assert.strictEqual(res.isAcceptable, false);

      const resEmpty = compareStudentNameWithOCR("", "Citra Kirana Dewi");
      assert.strictEqual(resEmpty.status, "UNREADABLE");
    });

    it("harus memberikan status MATCH atau PARTIAL pada variasi ejaan atau inisial", () => {
      const res = compareStudentNameWithOCR("B. Pratama Santoso", "Budi Pratama Santoso");
      assert.ok(["MATCH", "PARTIAL"].includes(res.status));
      assert.ok(res.isAcceptable);
      assert.ok(res.score >= 55);
    });

    it("harus mengembalikan MISMATCH untuk nama yang jauh berbeda", () => {
      const res = compareStudentNameWithOCR("Michael Johnson", "Budi Pratama");
      assert.strictEqual(res.status, "MISMATCH");
      assert.strictEqual(res.isAcceptable, false);
      assert.ok(res.score < 55);
    });
  });
});

describe("document-auto-rename unit tests", () => {
  describe("sanitizeNameToken", () => {
    it("harus mengganti spasi dengan underscore dan menghapus karakter ilegal", () => {
      assert.strictEqual(sanitizeNameToken("Citra Kirana Dewi"), "Citra_Kirana_Dewi");
      assert.strictEqual(sanitizeNameToken("John O'Connor / Smith"), "John_OConnor_Smith");
    });

    it("harus fallback ke Student jika kosong", () => {
      assert.strictEqual(sanitizeNameToken(""), "Student");
      assert.strictEqual(sanitizeNameToken(null), "Student");
    });
  });

  describe("sanitizeCodeToken", () => {
    it("harus menghasilkan kode uppercase yang aman", () => {
      assert.strictEqual(sanitizeCodeToken("passport"), "PASSPORT");
      assert.strictEqual(sanitizeCodeToken("ielts-score"), "IELTS_SCORE");
    });

    it("harus fallback ke DOC jika kosong", () => {
      assert.strictEqual(sanitizeCodeToken(null), "DOC");
      assert.strictEqual(sanitizeCodeToken(""), "DOC");
    });
  });

  describe("getFileExtension", () => {
    it("harus mengekstrak ekstensi file dengan benar", () => {
      assert.strictEqual(getFileExtension("scan_ktp.PDF"), "pdf");
      assert.strictEqual(getFileExtension("photo.jpeg"), "jpeg");
      assert.strictEqual(getFileExtension("noextfile"), "pdf");
      assert.strictEqual(getFileExtension(null), "pdf");
    });
  });

  describe("generateStandardFileName", () => {
    it("harus menghasilkan format default Nama_KODE.ext", () => {
      const result = generateStandardFileName({
        studentName: "Budi Pratama",
        documentCode: "PASSPORT",
        originalFileName: "my_scan_001.pdf",
      });
      assert.strictEqual(result, "Budi_Pratama_PASSPORT.pdf");
    });

    it("harus mendukung pola kustom placeholder", () => {
      const result = generateStandardFileName({
        pattern: "{studentName}_OFFICIAL_{documentCode}.pdf",
        studentName: "Citra Kirana",
        documentCode: "IELTS",
        originalFileName: "document.jpg",
      });
      assert.strictEqual(result, "Citra_Kirana_OFFICIAL_IELTS.jpg");
    });

    it("harus mempertahankan nama asli jika pattern NONE", () => {
      const result = generateStandardFileName({
        pattern: "NONE",
        studentName: "Budi Pratama",
        documentCode: "PASSPORT",
        originalFileName: "berkas asli scan (final).pdf",
      });
      assert.strictEqual(result, "berkas_asli_scan__final_.pdf");
    });
  });
});
