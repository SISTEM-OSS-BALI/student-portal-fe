import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STANDARD_DOCUMENT_NAMES,
  normalizeDocumentLabel,
  getStandardDocumentRequired,
  getStandardDocumentOrder,
} from "../../app/utils/document-standards";

describe("Unit Testing Modul document-standards.ts", () => {
  it("Harus memiliki tepat 26 dokumen resmi sesuai checklist referensi", () => {
    assert.equal(STANDARD_DOCUMENT_NAMES.length, 26);
  });

  it("Harus memetakan 26 dokumen resmi ke nama standar Title Case bahasa Inggris yang tepat", () => {
    const expectedDocs = [
      { id: "doc_plane_ticket", code: "PLANE_TICKET", label: "Plane Ticket", req: false },
      { id: "doc_invitation_letter", code: "INVITATION_LETTER", label: "Invitation Letter", req: false },
      { id: "doc_prev_visa", code: "PREV_VISA", label: "Previous Visa Grant/Refusal", req: false },
      { id: "doc_old_passport", code: "OLD_PASSPORT", label: "Old Passport", req: false },
      { id: "doc_proof_business", code: "PROOF_BUSINESS", label: "Proof of Business", req: false },
      { id: "doc_sponsor_sign", code: "SPONSOR_SIGN", label: "Sponsor Sign", req: true },
      { id: "doc_sponsor_bank_ref", code: "SPONSOR_BANK_REF", label: "Sponsor Bank Reference", req: true },
      { id: "doc_sponsor_bank_stmt", code: "SPONSOR_BANK_STMT", label: "Sponsor Bank Statement", req: true },
      { id: "doc_sponsor_land_asset", code: "SPONSOR_LAND_ASSET", label: "Sponsor Land Asset", req: false },
      { id: "doc_sponsor_siup", code: "SPONSOR_SIUP", label: "Sponsor SIUP", req: false },
      { id: "doc_sponsor_nib", code: "SPONSOR_NIB", label: "Sponsor NIB", req: false },
      { id: "doc_sponsor_work_ref", code: "SPONSOR_WORK_REF", label: "Sponsor Work Reference Letter", req: false },
      { id: "doc_sponsor_npwp", code: "SPONSOR_NPWP", label: "Sponsor NPWP", req: true },
      { id: "doc_sponsor_id", code: "SPONSOR_ID", label: "Sponsor ID Card", req: true },
      { id: "doc_sign", code: "STUDENT_SIGN", label: "Sign", req: true },
      { id: "doc_npwp", code: "NPWP", label: "NPWP", req: false },
      { id: "doc_det", code: "DET_CERT", label: "DET", req: false },
      { id: "doc_ielts", code: "ENG_CERT", label: "IELTS", req: true },
      { id: "doc_photo", code: "PROFILE_PHOTO", label: "Photo 4x6", req: true },
      { id: "doc_ijzh_s1", code: "BACHELOR_CERT", label: "Bachelor Certificate", req: false },
      { id: "doc_ijzh_d3", code: "DIPLOMA_CERT", label: "Diploma Certificate", req: false },
      { id: "doc_ijzh_sma", code: "HIGH_SCHOOL_CERT", label: "High School Certificate", req: true },
      { id: "doc_family_card", code: "FAMILY_CARD", label: "Family Card", req: true },
      { id: "doc_birth_cert", code: "BIRTH_CERTIFICATE", label: "Birth Certificate", req: true },
      { id: "doc_ktp", code: "NATIONAL_ID", label: "ID Card", req: true },
      { id: "doc_pass", code: "PASSPORT", label: "Passport", req: true },
    ];

    expectedDocs.forEach((expected, idx) => {
      const normalized = normalizeDocumentLabel({
        id: expected.id,
        internal_code: expected.code,
      });
      assert.equal(normalized, expected.label, `Dokumen ${expected.id} tidak cocok`);

      const req = getStandardDocumentRequired({
        id: expected.id,
        internal_code: expected.code,
      });
      assert.equal(req, expected.req, `Status required ${expected.id} tidak cocok`);

      const order = getStandardDocumentOrder({
        id: expected.id,
        internal_code: expected.code,
      });
      assert.equal(order, idx + 1, `Urutan ${expected.id} tidak cocok`);
    });
  });

  it("Harus menormalisasi nama bahasa Indonesia deskriptif ke nama resmi Title Case bahasa Inggris", () => {
    assert.equal(
      normalizeDocumentLabel({ label: "Paspor (Halaman Identitas)" }),
      "Passport"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "KTP (Kartu Tanda Penduduk)" }),
      "ID Card"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Kartu Keluarga (KK)" }),
      "Family Card"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Akta Kelahiran" }),
      "Birth Certificate"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Pasfoto Formal (Latar Putih)" }),
      "Photo 4x6"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Ijazah SMA / Sederajat (High School Certificate)" }),
      "High School Certificate"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Ijazah S1 / Sarjana (Bachelor Certificate)" }),
      "Bachelor Certificate"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Ijazah D3 / Diploma (Diploma Certificate)" }),
      "Diploma Certificate"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Sertifikat Bahasa Inggris (IELTS / PTE / TOEFL)" }),
      "IELTS"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Duolingo English Test (DET) Certificate" }),
      "DET"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Tanda Tangan Student" }),
      "Sign"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "KTP Sponsor (Sponsor ID Card)" }),
      "Sponsor ID Card"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "NPWP Sponsor" }),
      "Sponsor NPWP"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Sponsor Work Reference Letter" }),
      "Sponsor Work Reference Letter"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Tiket Pesawat (Plane Ticket)" }),
      "Plane Ticket"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Surat Undangan (Invitation Letter)" }),
      "Invitation Letter"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Visa Grant" }),
      "Visa Grant"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Visa Refusal" }),
      "Visa Refusal"
    );
    assert.equal(
      normalizeDocumentLabel({ label: "Previous Visa Grant/Refusal" }),
      "Previous Visa Grant/Refusal"
    );
  });
});
