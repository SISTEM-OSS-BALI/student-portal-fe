"use client";

import React from "react";
import type { CvData } from "./types";

export default function Template7({ cv }: { cv: CvData }) {
  return (
    <div
      style={{
        fontFamily: "'Arial', sans-serif",
        fontSize: "12px",
        color: "#333",
        backgroundColor: "#f5f3f0",
        lineHeight: 1.4,
        display: "flex",
        minHeight: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* LEFT SIDEBAR (35%) */}
      <div
        style={{
          width: "35%",
          backgroundColor: "#d4c4a8",
          padding: "45px 20px 35px 20px",
          color: "#2c2c2c",
          boxSizing: "border-box",
        }}
      >
        {/* Photo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          {cv.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cv.photo_url}
              alt="Profile Photo"
              style={{
                width: "115px",
                height: "115px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid #b8a082",
                boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
                display: "inline-block",
              }}
            />
          ) : (
            <div
              style={{
                width: "115px",
                height: "115px",
                borderRadius: "50%",
                backgroundColor: "#b8a082",
                border: "4px solid #9f8668",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "26px",
                fontWeight: 700,
                boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
              }}
            >
              {(cv.first_name[0] || "S") + (cv.last_name[0] || "")}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div
          style={{
            marginBottom: "24px",
            paddingBottom: "14px",
            borderBottom: "2px solid #8b7355",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#2c2c2c",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Contact
          </div>
          {cv.email && (
            <div style={{ marginBottom: "8px", fontSize: "11px", wordBreak: "break-all", display: "flex", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", flexShrink: 0 }}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>{cv.email}</span>
            </div>
          )}
          {cv.phone && (
            <div style={{ marginBottom: "8px", fontSize: "11px", display: "flex", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>{cv.phone}</span>
            </div>
          )}
          {cv.city && (
            <div style={{ marginBottom: "8px", fontSize: "11px", display: "flex", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", flexShrink: 0 }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{cv.city}</span>
            </div>
          )}
        </div>

        {/* Skills Section */}
        {cv.skills && cv.skills.length > 0 && (
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "14px",
              borderBottom: "2px solid #8b7355",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#2c2c2c",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Skills
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cv.skills.map((skill) => (
                <div
                  key={skill.id}
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.3,
                    position: "relative",
                    paddingLeft: "14px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      color: "#8b7355",
                      fontSize: "10px",
                    }}
                  >
                    ●
                  </span>
                  {skill.name}
                  {skill.level ? ` - ${skill.level}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages Section */}
        {cv.languages && cv.languages.length > 0 && (
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "14px",
              borderBottom: "2px solid #8b7355",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#2c2c2c",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Languages
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cv.languages.map((lang) => (
                <div
                  key={lang.id}
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.3,
                    position: "relative",
                    paddingLeft: "14px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      color: "#8b7355",
                      fontSize: "10px",
                    }}
                  >
                    ●
                  </span>
                  <strong>{lang.name}</strong>
                  {lang.proficiency ? ` - ${lang.proficiency}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests Section */}
        {cv.interests && cv.interests.length > 0 && (
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#2c2c2c",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Interests
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cv.interests.map((interest) => (
                <div
                  key={interest.id}
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.3,
                    position: "relative",
                    paddingLeft: "14px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      color: "#8b7355",
                      fontSize: "10px",
                    }}
                  >
                    ●
                  </span>
                  {interest.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT CONTENT (65%) */}
      <div
        style={{
          width: "65%",
          padding: "45px 30px 35px 30px",
          backgroundColor: "#f5f3f0",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "26px" }}>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#2c2c2c",
              margin: "0 0 6px 0",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              lineHeight: 1.1,
            }}
          >
            {cv.first_name} {cv.last_name}
          </h1>
          {cv.job_title && (
            <div
              style={{
                fontSize: "13px",
                color: "#8b7355",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: 700,
              }}
            >
              {cv.job_title}
            </div>
          )}
          {cv.profile_description && (
            <div
              style={{
                fontSize: "11.5px",
                lineHeight: 1.5,
                color: "#4a4a4a",
                textAlign: "justify",
              }}
            >
              {cv.profile_description}
            </div>
          )}
        </div>

        {/* Education Section */}
        {cv.educations && cv.educations.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#2c2c2c",
                margin: "0 0 14px 0",
                textTransform: "uppercase",
                letterSpacing: "1px",
                borderBottom: "2px solid #8b7355",
                paddingBottom: "4px",
              }}
            >
              Education
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {cv.educations.map((edu) => (
                <div
                  key={edu.id}
                  style={{
                    position: "relative",
                    paddingLeft: "18px",
                  }}
                >
                  {/* Timeline bullet */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "5px",
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#8b7355",
                      borderRadius: "50%",
                      border: "2px solid #f5f3f0",
                      boxShadow: "0 0 0 1px #8b7355",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#2c2c2c", flex: 1 }}>
                      {edu.degree || edu.school_name}
                    </div>
                    {(edu.start_date || edu.end_date) && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#8b7355",
                          fontWeight: 600,
                          backgroundColor: "#e8dcc6",
                          padding: "2px 7px",
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {[edu.start_date, edu.end_date].filter(Boolean).join(" - ")}
                      </div>
                    )}
                  </div>
                  {edu.school_name && edu.degree && (
                    <div style={{ fontSize: "11px", color: "#8b7355", fontStyle: "italic", margin: "2px 0" }}>
                      {edu.school_name}
                    </div>
                  )}
                  {edu.major && (
                    <div style={{ fontSize: "11px", color: "#4a4a4a", lineHeight: 1.4 }}>
                      {edu.major}
                    </div>
                  )}
                  {edu.description && (
                    <div style={{ fontSize: "10.5px", color: "#666", marginTop: "2px", lineHeight: 1.35 }}>
                      {edu.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Section */}
        {cv.experiences && cv.experiences.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#2c2c2c",
                margin: "0 0 14px 0",
                textTransform: "uppercase",
                letterSpacing: "1px",
                borderBottom: "2px solid #8b7355",
                paddingBottom: "4px",
              }}
            >
              Experience
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {cv.experiences.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    position: "relative",
                    paddingLeft: "18px",
                  }}
                >
                  {/* Timeline bullet */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "5px",
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#8b7355",
                      borderRadius: "50%",
                      border: "2px solid #f5f3f0",
                      boxShadow: "0 0 0 1px #8b7355",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#2c2c2c", flex: 1 }}>
                      {exp.job_title}
                    </div>
                    {(exp.start_date || exp.end_date) && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#8b7355",
                          fontWeight: 600,
                          backgroundColor: "#e8dcc6",
                          padding: "2px 7px",
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {[exp.start_date, exp.end_date].filter(Boolean).join(" - ")}
                      </div>
                    )}
                  </div>
                  {exp.company && (
                    <div style={{ fontSize: "11px", color: "#8b7355", fontStyle: "italic", margin: "2px 0" }}>
                      {exp.company}
                    </div>
                  )}
                  {exp.description && (
                    <div style={{ fontSize: "11px", color: "#4a4a4a", lineHeight: 1.4, marginTop: "2px" }}>
                      {exp.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leadership & Activities */}
        {((cv.leaderships && cv.leaderships.length > 0) ||
          (cv.activities && cv.activities.length > 0)) && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#2c2c2c",
                margin: "0 0 14px 0",
                textTransform: "uppercase",
                letterSpacing: "1px",
                borderBottom: "2px solid #8b7355",
                paddingBottom: "4px",
              }}
            >
              Leadership & Activities
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(cv.leaderships || []).map((lead) => (
                <div key={lead.id} style={{ position: "relative", paddingLeft: "18px" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "5px",
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#8b7355",
                      borderRadius: "50%",
                      border: "2px solid #f5f3f0",
                      boxShadow: "0 0 0 1px #8b7355",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#2c2c2c" }}>{lead.role}</div>
                    {(lead.start_date || lead.end_date) && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#8b7355",
                          backgroundColor: "#e8dcc6",
                          padding: "2px 6px",
                          borderRadius: "8px",
                        }}
                      >
                        {[lead.start_date, lead.end_date].filter(Boolean).join(" - ")}
                      </div>
                    )}
                  </div>
                  {lead.organization && (
                    <div style={{ fontSize: "11px", color: "#8b7355", fontStyle: "italic" }}>
                      {lead.organization}
                    </div>
                  )}
                  {lead.description && (
                    <div style={{ fontSize: "10.5px", color: "#4a4a4a", marginTop: "2px" }}>
                      {lead.description}
                    </div>
                  )}
                </div>
              ))}

              {(cv.activities || []).map((act) => (
                <div key={act.id} style={{ position: "relative", paddingLeft: "18px" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "5px",
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#8b7355",
                      borderRadius: "50%",
                      border: "2px solid #f5f3f0",
                      boxShadow: "0 0 0 1px #8b7355",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#2c2c2c" }}>{act.name}</div>
                    {(act.start_date || act.end_date) && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#8b7355",
                          backgroundColor: "#e8dcc6",
                          padding: "2px 6px",
                          borderRadius: "8px",
                        }}
                      >
                        {[act.start_date, act.end_date].filter(Boolean).join(" - ")}
                      </div>
                    )}
                  </div>
                  {act.description && (
                    <div style={{ fontSize: "10.5px", color: "#4a4a4a", marginTop: "2px" }}>
                      {act.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
