"use client";

import React from "react";
import { resolveOptionIdOrValueToLabel } from "@/app/utils/personal-info-submissions";
import type { CvData } from "./types";

export default function TemplateFormalOffice({ cv }: { cv: CvData }) {
  // 1. Sinkronisasi dan filter Formal Education (buang baris kosong)
  const formalEduList =
    cv.formal_educations && cv.formal_educations.length > 0
      ? cv.formal_educations
      : (cv.educations || []).map((e) => ({
          id: e.id,
          level: e.degree || "Bachelor / Degree",
          school: e.school_name || "",
          commence: e.start_date || "",
          completed: e.end_date || "",
        }));

  const formalRows = formalEduList.filter(
    (edu) =>
      edu.school?.trim() ||
      edu.level?.trim() ||
      edu.commence?.trim() ||
      edu.completed?.trim(),
  );

  // 2. Filter Nonformal Education (buang baris kosong)
  const nonformalRows = (cv.nonformal_educations || []).filter(
    (non) =>
      non.school?.trim() ||
      non.level?.trim() ||
      non.commence?.trim() ||
      non.completed?.trim(),
  );

  // 3. Filter Employment History (buang baris kosong)
  const employmentList =
    cv.employment_history && cv.employment_history.length > 0
      ? cv.employment_history
      : (cv.experiences || []).map((exp) => ({
          id: exp.id,
          company: exp.company || "",
          type: "Full-Time",
          position: exp.job_title || "",
          from_date: exp.start_date || "",
          to_date: exp.end_date || "",
          contact_reference: "",
        }));

  const employmentRows = employmentList.filter(
    (emp) =>
      emp.company?.trim() ||
      emp.position?.trim() ||
      emp.from_date?.trim() ||
      emp.to_date?.trim(),
  );

  // 4. Filter Achievements (buang baris kosong)
  const achievementRows = (cv.achievements || []).filter(
    (ach) =>
      ach.company?.trim() ||
      ach.position?.trim() ||
      ach.type?.trim() ||
      ach.from_date?.trim() ||
      ach.to_date?.trim(),
  );

  // 5. Filter Travel History (buang baris kosong)
  const travelRows = (cv.travel_history || []).filter(
    (trv) =>
      trv.country?.trim() ||
      trv.purpose?.trim() ||
      trv.start_date?.trim() ||
      trv.end_date?.trim(),
  );

  // 6. Next of Kin
  const kin = cv.next_of_kin || {
    name: "",
    relationship: "Parent",
    address: "",
    city: cv.city || "",
    province: cv.province_state || "",
    postal_code: cv.postal_code || "",
    country: cv.country || "Indonesia",
    contact_no: "",
    email: "",
  };

  const hasKinData = Boolean(
    kin.name?.trim() ||
      kin.contact_no?.trim() ||
      kin.address?.trim() ||
      kin.city?.trim() ||
      kin.email?.trim(),
  );

  // Gaya visual tabel resmi
  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #1e293b",
    fontSize: "10px",
    fontFamily: "Arial, Helvetica, sans-serif",
    marginBottom: "10px",
    backgroundColor: "#ffffff",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: "#e2e8f0",
    border: "1px solid #1e293b",
    fontWeight: "bold",
    textAlign: "left",
    padding: "4px 8px",
    fontSize: "10.5px",
    color: "#0f172a",
  };

  const subHeaderStyle: React.CSSProperties = {
    backgroundColor: "#f8fafc",
    border: "1px solid #1e293b",
    fontWeight: "bold",
    textAlign: "center",
    padding: "3.5px 6px",
    fontSize: "9.5px",
    color: "#334155",
  };

  const cellStyle: React.CSSProperties = {
    border: "1px solid #1e293b",
    padding: "3.5px 6px",
    minHeight: "20px",
    height: "20px",
    color: "#0f172a",
    verticalAlign: "middle",
    fontSize: "10px",
  };

  const labelCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: "bold",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };

  const pageContainerStyle: React.CSSProperties = {
    padding: "16mm 16mm 14mm 16mm",
    minHeight: "297mm",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const pageFooterStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "8px",
    borderTop: "1px solid #cbd5e1",
    fontSize: "9px",
    color: "#64748b",
    marginTop: "auto",
  };

  // Komponen Bagian Dokumen
  const renderDocumentHeader = () => (
    <h1
      style={{
        textAlign: "center",
        fontSize: "17px",
        fontWeight: "bold",
        letterSpacing: "1px",
        margin: "0 0 12px 0",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#0f172a",
      }}
    >
      CURRICULUM VITAE
    </h1>
  );

  const renderPersonalDetails = () => (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th colSpan={5} style={headerStyle}>
            1. Personal Details
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ ...labelCellStyle, width: "22%" }}>First Name</td>
          <td colSpan={2} style={{ ...cellStyle, width: "28%" }}>
            {cv.first_name || ""}
          </td>
          <td style={{ ...labelCellStyle, width: "22%" }}>Last Name</td>
          <td style={{ ...cellStyle, width: "28%" }}>{cv.last_name || ""}</td>
        </tr>

        <tr>
          <td rowSpan={2} style={labelCellStyle}>
            Current Address
          </td>
          <td style={{ ...labelCellStyle, width: "12%", textAlign: "center" }}>
            City
          </td>
          <td style={cellStyle}>{cv.city || ""}</td>
          <td style={labelCellStyle}>Province/ State</td>
          <td style={cellStyle}>{cv.province_state || ""}</td>
        </tr>
        <tr>
          <td style={{ ...labelCellStyle, width: "12%", textAlign: "center" }}>
            Postal Code
          </td>
          <td style={cellStyle}>{cv.postal_code || ""}</td>
          <td style={labelCellStyle}>Country</td>
          <td style={cellStyle}>{cv.country || "Indonesia"}</td>
        </tr>

        <tr>
          <td style={labelCellStyle}>Date of Birth</td>
          <td colSpan={2} style={cellStyle}>
            {cv.date_of_birth || ""}
          </td>
          <td style={labelCellStyle}>Place of Birth</td>
          <td style={cellStyle}>{cv.place_of_birth || ""}</td>
        </tr>

        <tr>
          <td style={labelCellStyle}>Age</td>
          <td colSpan={2} style={cellStyle}>
            {cv.age || ""}
          </td>
          <td style={labelCellStyle}>Nationality</td>
          <td style={cellStyle}>{cv.nationality || "Indonesian"}</td>
        </tr>

        <tr>
          <td style={labelCellStyle}>Gender</td>
          <td colSpan={2} style={cellStyle}>
            {cv.gender || ""}
          </td>
          <td style={labelCellStyle}>Marital Status</td>
          <td style={cellStyle}>{cv.marital_status || "Single"}</td>
        </tr>

        {(cv.height || cv.weight) && (
          <tr>
            <td style={labelCellStyle}>Height</td>
            <td colSpan={2} style={cellStyle}>
              {cv.height ? `${cv.height} cm` : ""}
            </td>
            <td style={labelCellStyle}>Weight</td>
            <td style={cellStyle}>{cv.weight ? `${cv.weight} kg` : ""}</td>
          </tr>
        )}

        {cv.id_number && (
          <tr>
            <td style={labelCellStyle}>ID Number</td>
            <td colSpan={4} style={cellStyle}>
              {cv.id_number}
            </td>
          </tr>
        )}

        {cv.passport_number && (
          <tr>
            <td style={labelCellStyle}>Passport Number</td>
            <td colSpan={4} style={cellStyle}>
              {cv.passport_number}
            </td>
          </tr>
        )}

        <tr>
          <td style={labelCellStyle}>Contact Number</td>
          <td colSpan={4} style={cellStyle}>
            {cv.phone || ""}
          </td>
        </tr>

        <tr>
          <td style={labelCellStyle}>Email Address</td>
          <td colSpan={4} style={cellStyle}>
            {cv.email || ""}
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderFormalEducation = () => {
    if (formalRows.length === 0) return null;
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th colSpan={5} style={headerStyle}>
              2. Formal Education
            </th>
          </tr>
          <tr>
            <th style={{ ...subHeaderStyle, width: "6%" }}>No.</th>
            <th style={{ ...subHeaderStyle, width: "24%" }}>Level</th>
            <th style={{ ...subHeaderStyle, width: "40%" }}>School</th>
            <th style={{ ...subHeaderStyle, width: "15%" }}>Commence</th>
            <th style={{ ...subHeaderStyle, width: "15%" }}>Completed</th>
          </tr>
        </thead>
        <tbody>
          {formalRows.map((edu, idx) => (
            <tr key={edu.id || `formal-${idx}`}>
              <td style={{ ...cellStyle, textAlign: "center" }}>{idx + 1}.</td>
              <td style={cellStyle}>{edu.level}</td>
              <td style={cellStyle}>{edu.school}</td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {edu.commence}
              </td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {edu.completed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderNonformalEducation = () => {
    if (nonformalRows.length === 0) return null;
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th colSpan={5} style={headerStyle}>
              3. Nonformal Education
            </th>
          </tr>
          <tr>
            <th style={{ ...subHeaderStyle, width: "6%" }}>No.</th>
            <th style={{ ...subHeaderStyle, width: "24%" }}>Level</th>
            <th style={{ ...subHeaderStyle, width: "40%" }}>School</th>
            <th style={{ ...subHeaderStyle, width: "15%" }}>Commence</th>
            <th style={{ ...subHeaderStyle, width: "15%" }}>Completed</th>
          </tr>
        </thead>
        <tbody>
          {nonformalRows.map((non, idx) => (
            <tr key={non.id || `nonformal-${idx}`}>
              <td style={{ ...cellStyle, textAlign: "center" }}>{idx + 1}.</td>
              <td style={cellStyle}>{non.level}</td>
              <td style={cellStyle}>{non.school}</td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {non.commence}
              </td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {non.completed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderEmploymentHistory = () => {
    if (employmentRows.length === 0) return null;
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th colSpan={7} style={headerStyle}>
              4. Employment History
            </th>
          </tr>
          <tr>
            <th style={{ ...subHeaderStyle, width: "5%" }}>No.</th>
            <th style={{ ...subHeaderStyle, width: "25%" }}>Company</th>
            <th style={{ ...subHeaderStyle, width: "13%" }}>Type</th>
            <th style={{ ...subHeaderStyle, width: "22%" }}>Position</th>
            <th style={{ ...subHeaderStyle, width: "11%" }}>From</th>
            <th style={{ ...subHeaderStyle, width: "11%" }}>To</th>
            <th style={{ ...subHeaderStyle, width: "13%" }}>
              Contact Reference
            </th>
          </tr>
        </thead>
        <tbody>
          {employmentRows.map((emp, idx) => (
            <tr key={emp.id || `emp-${idx}`}>
              <td style={{ ...cellStyle, textAlign: "center" }}>{idx + 1}</td>
              <td style={cellStyle}>{emp.company}</td>
              <td style={cellStyle}>{emp.type}</td>
              <td style={cellStyle}>{emp.position}</td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {emp.from_date}
              </td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {emp.to_date}
              </td>
              <td style={cellStyle}>{emp.contact_reference || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderAchievement = () => {
    if (achievementRows.length === 0) return null;
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th colSpan={6} style={headerStyle}>
              5. Achievement
            </th>
          </tr>
          <tr>
            <th style={{ ...subHeaderStyle, width: "6%" }}>No.</th>
            <th style={{ ...subHeaderStyle, width: "30%" }}>
              Company / Issuer
            </th>
            <th style={{ ...subHeaderStyle, width: "16%" }}>Type</th>
            <th style={{ ...subHeaderStyle, width: "26%" }}>
              Position / Title
            </th>
            <th style={{ ...subHeaderStyle, width: "11%" }}>From</th>
            <th style={{ ...subHeaderStyle, width: "11%" }}>To</th>
          </tr>
        </thead>
        <tbody>
          {achievementRows.map((ach, idx) => (
            <tr key={ach.id || `ach-${idx}`}>
              <td style={{ ...cellStyle, textAlign: "center" }}>{idx + 1}</td>
              <td style={cellStyle}>{ach.company}</td>
              <td style={cellStyle}>{ach.type}</td>
              <td style={cellStyle}>{ach.position}</td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {ach.from_date}
              </td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {ach.to_date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderTravelHistory = () => {
    if (travelRows.length === 0) return null;
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th colSpan={5} style={headerStyle}>
              6. Travel History
            </th>
          </tr>
          <tr>
            <th style={{ ...subHeaderStyle, width: "6%" }}>No.</th>
            <th style={{ ...subHeaderStyle, width: "38%" }}>Country</th>
            <th style={{ ...subHeaderStyle, width: "32%" }}>Purpose</th>
            <th style={{ ...subHeaderStyle, width: "12%" }}>Start</th>
            <th style={{ ...subHeaderStyle, width: "12%" }}>End</th>
          </tr>
        </thead>
        <tbody>
          {travelRows.map((trv, idx) => (
            <tr key={trv.id || `trv-${idx}`}>
              <td style={{ ...cellStyle, textAlign: "center" }}>{idx + 1}.</td>
              <td style={cellStyle}>{trv.country}</td>
              <td style={cellStyle}>{trv.purpose}</td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {trv.start_date}
              </td>
              <td style={{ ...cellStyle, textAlign: "center" }}>
                {trv.end_date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderNextOfKin = () => {
    if (!hasKinData) return null;
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th colSpan={5} style={headerStyle}>
              7. Next of Kin/Parents
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...labelCellStyle, width: "20%" }}>Name</td>
            <td colSpan={2} style={{ ...cellStyle, width: "35%" }}>
              {kin.name || ""}
            </td>
            <td style={{ ...labelCellStyle, width: "20%" }}>Relationship</td>
            <td style={{ ...cellStyle, width: "25%" }}>
              {resolveOptionIdOrValueToLabel(kin.relationship) || kin.relationship || ""}
            </td>
          </tr>

          <tr>
            <td rowSpan={2} style={labelCellStyle}>
              Address
            </td>
            <td
              style={{
                ...labelCellStyle,
                width: "12%",
                textAlign: "center",
              }}
            >
              City
            </td>
            <td style={cellStyle}>{kin.city || ""}</td>
            <td style={labelCellStyle}>Province</td>
            <td style={cellStyle}>{kin.province || ""}</td>
          </tr>
          <tr>
            <td
              style={{
                ...labelCellStyle,
                width: "12%",
                textAlign: "center",
              }}
            >
              Postal Code
            </td>
            <td style={cellStyle}>{kin.postal_code || ""}</td>
            <td style={labelCellStyle}>Country</td>
            <td style={cellStyle}>{kin.country || "Indonesia"}</td>
          </tr>

          <tr>
            <td style={labelCellStyle}>Contact No.</td>
            <td colSpan={2} style={cellStyle}>
              {kin.contact_no || ""}
            </td>
            <td style={labelCellStyle}>Email</td>
            <td style={cellStyle}>{kin.email || ""}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderFooter = (page: number, total: number) => (
    <div style={pageFooterStyle} className="page-footer">
      <span>
        Curriculum Vitae • {cv.first_name} {cv.last_name}
      </span>
      <span>
        {total === 1 ? "Halaman 1 dari 1" : `Halaman ${page} dari ${total}`}
      </span>
    </div>
  );

  // Perhitungan tinggi perkiraan dalam satuan milimeter
  let hSec1 = 44;
  if (cv.height || cv.weight) hSec1 += 5.5;
  if (cv.id_number) hSec1 += 5.5;
  if (cv.passport_number) hSec1 += 5.5;

  const hSec2 = formalRows.length > 0 ? 11 + formalRows.length * 5.8 : 0;
  const hSec3 = nonformalRows.length > 0 ? 11 + nonformalRows.length * 5.8 : 0;
  const hSec4 =
    employmentRows.length > 0 ? 11 + employmentRows.length * 7.5 : 0;
  const hSec5 =
    achievementRows.length > 0 ? 11 + achievementRows.length * 5.8 : 0;
  const hSec6 = travelRows.length > 0 ? 11 + travelRows.length * 5.8 : 0;
  const hSec7 = hasKinData ? 28 : 0;

  const totalContentHeight =
    20 + hSec1 + hSec2 + hSec3 + hSec4 + hSec5 + hSec6 + hSec7;
  const isSinglePage = totalContentHeight <= 260;

  // Kasus A: Seluruh konten muat dalam 1 lembar A4 secara rapi tanpa kekosongan ruang
  if (isSinglePage) {
    return (
      <div style={{ backgroundColor: "#ffffff", color: "#000" }}>
        <div style={pageContainerStyle} className="formal-cv-page">
          <div>
            {renderDocumentHeader()}
            {renderPersonalDetails()}
            {renderFormalEducation()}
            {renderNonformalEducation()}
            {renderEmploymentHistory()}
            {renderAchievement()}
            {renderTravelHistory()}
            {renderNextOfKin()}
          </div>
          {renderFooter(1, 1)}
        </div>
      </div>
    );
  }

  // Kasus B: Konten panjang membutuhkan 2 halaman, dipartisi proporsional agar halaman 1 tetap padat
  const fitsSec4OnPage1 = 20 + hSec1 + hSec2 + hSec3 + hSec4 <= 255;

  return (
    <div style={{ backgroundColor: "#ffffff", color: "#000" }}>
      {/* ================= HALAMAN 1 ================= */}
      <div style={pageContainerStyle} className="formal-cv-page">
        <div>
          {renderDocumentHeader()}
          {renderPersonalDetails()}
          {renderFormalEducation()}
          {renderNonformalEducation()}
          {fitsSec4OnPage1 && renderEmploymentHistory()}
        </div>
        {renderFooter(1, 2)}
      </div>

      {/* PEMBATAS VISUAL ANTAR HALAMAN DI LAYAR */}
      <div
        style={{
          height: "1px",
          borderTop: "2px dashed #94a3b8",
          margin: "24px 0",
        }}
        className="no-print"
      />

      {/* ================= HALAMAN 2 ================= */}
      <div
        style={pageContainerStyle}
        className="formal-cv-page page-break-before"
      >
        <div>
          {!fitsSec4OnPage1 && renderEmploymentHistory()}
          {renderAchievement()}
          {renderTravelHistory()}
          {renderNextOfKin()}
        </div>
        {renderFooter(2, 2)}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          .formal-cv-page {
            padding: 0 !important;
            min-height: auto !important;
            box-shadow: none !important;
          }
          .page-footer {
            margin-top: 15px !important;
          }
        }
      `}</style>
    </div>
  );
}
