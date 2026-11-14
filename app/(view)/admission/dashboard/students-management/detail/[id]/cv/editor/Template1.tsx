"use client";

import React from "react";
import type { CvData } from "./types";

export default function Template1({ cv }: { cv: CvData }) {
  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: "13px",
        color: "#111827",
        lineHeight: 1.5,
        backgroundColor: "#ffffff",
        padding: "48px 56px",
        minHeight: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <h1
        style={{
          fontSize: "24px",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          margin: "0 0 6px 0",
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        {cv.first_name} {cv.last_name}
      </h1>

      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#475569",
          marginBottom: "28px",
          letterSpacing: "0.2px",
        }}
      >
        {[cv.city, cv.email, cv.phone].filter(Boolean).join(" • ")}
      </div>

      {/* PROFIL */}
      {cv.profile_description && (
        <div style={{ marginBottom: "22px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderBottom: "1.5px solid #0f172a",
              paddingBottom: "3px",
              marginTop: "18px",
              marginBottom: "10px",
              color: "#0f172a",
            }}
          >
            Profile
          </h2>
          <p
            style={{
              margin: 0,
              textAlign: "justify",
              color: "#334155",
              fontSize: "12.5px",
              lineHeight: 1.6,
            }}
          >
            {cv.profile_description}
          </p>
        </div>
      )}

      {/* EDUCATION */}
      {cv.educations && cv.educations.length > 0 && (
        <div style={{ marginBottom: "22px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderBottom: "1.5px solid #0f172a",
              paddingBottom: "3px",
              marginTop: "18px",
              marginBottom: "12px",
              color: "#0f172a",
            }}
          >
            Education
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {cv.educations.map((edu) => (
              <div key={edu.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "13.5px", color: "#0f172a" }}>
                    {edu.school_name}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontStyle: "italic" }}>
                    {[edu.start_date, edu.end_date].filter(Boolean).join(" – ")}
                  </span>
                </div>
                <div style={{ fontStyle: "italic", color: "#334155", fontSize: "12.5px" }}>
                  {edu.degree}
                  {edu.major ? `, ${edu.major}` : ""}
                </div>
                {edu.description && (
                  <p style={{ margin: "4px 0 0 0", color: "#475569", fontSize: "12px" }}>
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPERIENCE */}
      {cv.experiences && cv.experiences.length > 0 && (
        <div style={{ marginBottom: "22px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderBottom: "1.5px solid #0f172a",
              paddingBottom: "3px",
              marginTop: "18px",
              marginBottom: "12px",
              color: "#0f172a",
            }}
          >
            Experience
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {cv.experiences.map((exp) => (
              <div key={exp.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "13.5px", color: "#0f172a" }}>
                    {exp.company}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontStyle: "italic" }}>
                    {[exp.start_date, exp.end_date].filter(Boolean).join(" – ")}
                  </span>
                </div>
                <div style={{ fontStyle: "italic", color: "#334155", fontSize: "12.5px" }}>
                  {exp.job_title}
                </div>
                {exp.description && (
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      color: "#475569",
                      fontSize: "12px",
                      whiteSpace: "pre-line",
                      lineHeight: 1.5,
                    }}
                  >
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEADERSHIP & ACTIVITIES */}
      {((cv.leaderships && cv.leaderships.length > 0) ||
        (cv.activities && cv.activities.length > 0)) && (
        <div style={{ marginBottom: "22px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderBottom: "1.5px solid #0f172a",
              paddingBottom: "3px",
              marginTop: "18px",
              marginBottom: "12px",
              color: "#0f172a",
            }}
          >
            Leadership & Activities
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(cv.leaderships || []).map((lead) => (
              <div key={lead.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                    {lead.organization}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontStyle: "italic" }}>
                    {[lead.start_date, lead.end_date].filter(Boolean).join(" – ")}
                  </span>
                </div>
                <div style={{ fontStyle: "italic", color: "#334155", fontSize: "12px" }}>
                  {lead.role}
                </div>
                {lead.description && (
                  <p style={{ margin: "2px 0 0 0", color: "#475569", fontSize: "11.5px" }}>
                    {lead.description}
                  </p>
                )}
              </div>
            ))}

            {(cv.activities || []).map((act) => (
              <div key={act.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                    {act.name}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontStyle: "italic" }}>
                    {[act.start_date, act.end_date].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {act.description && (
                  <p style={{ margin: "2px 0 0 0", color: "#475569", fontSize: "11.5px" }}>
                    {act.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SKILLS & INTERESTS */}
      {((cv.skills && cv.skills.length > 0) ||
        (cv.languages && cv.languages.length > 0) ||
        (cv.interests && cv.interests.length > 0)) && (
        <div style={{ marginBottom: "22px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderBottom: "1.5px solid #0f172a",
              paddingBottom: "3px",
              marginTop: "18px",
              marginBottom: "12px",
              color: "#0f172a",
            }}
          >
            Skills & Interests
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
            {cv.skills && cv.skills.length > 0 && (
              <div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Technical Skills: </span>
                <span style={{ color: "#334155" }}>
                  {cv.skills.map((s) => s.name).join(", ")}
                </span>
              </div>
            )}
            {cv.languages && cv.languages.length > 0 && (
              <div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Languages: </span>
                <span style={{ color: "#334155" }}>
                  {cv.languages
                    .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
                    .join(", ")}
                </span>
              </div>
            )}
            {cv.interests && cv.interests.length > 0 && (
              <div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Interests: </span>
                <span style={{ color: "#334155" }}>
                  {cv.interests.map((i) => i.description).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
