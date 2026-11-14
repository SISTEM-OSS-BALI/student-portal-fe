"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Empty, Tag, Tooltip, Typography } from "antd";
import type { UserDataModel } from "@/app/models/user";
import {
  formatShortDate,
  getCountryBadgeMeta,
  getCountryName,
  getCurrentStepLabel,
  getStepTone,
  getStudentAvatarUrl,
  getStudentInitials,
  getStudentPipelineStatus,
  getStudentVisaName,
} from "@/app/utils/student-helpers";
import styles from "./student-pipeline-table.module.css";

const { Text } = Typography;

export interface StudentPipelineTableProps {
  /** List of student data models to display */
  students: UserDataModel[];
  /** Role context for default navigation: director | admission | consultant */
  role?: "director" | "admission" | "consultant";
  /** Pre-calculated map of student ID to latest timestamp */
  lastActivityMap?: Record<string, number>;
  /** Optional lookup map of visa type ID to human-readable name */
  visaTypeNameById?: Map<string, string>;
  /** Limit the number of rows displayed */
  maxRows?: number;
  /** Empty state message */
  emptyText?: string;
  /** Custom row click handler overriding default router navigation */
  onRowClick?: (student: UserDataModel) => void;
  /** Custom CSS class for table outer wrapper */
  className?: string;
}

export default function StudentPipelineTable({
  students,
  role = "admission",
  lastActivityMap = {},
  visaTypeNameById,
  maxRows,
  emptyText = "Tidak ada siswa yang cocok dengan filter yang dipilih.",
  onRowClick,
  className,
}: StudentPipelineTableProps) {
  const router = useRouter();

  const displayedStudents = useMemo(() => {
    if (typeof maxRows === "number" && maxRows > 0) {
      return students.slice(0, maxRows);
    }
    return students;
  }, [students, maxRows]);

  const getVisaLabel = (student: UserDataModel): string => {
    const helperName = getStudentVisaName(student);
    if (helperName && helperName !== "-") return helperName;

    const visaTypeName = String(student.visa_type_name ?? "").trim();
    if (visaTypeName) return visaTypeName;

    const visaTypeValue = String(student.visa_type ?? "").trim();
    if (!visaTypeValue) return "Student Visa";

    if (visaTypeNameById) {
      const mapped = visaTypeNameById.get(visaTypeValue);
      if (mapped) return mapped;
    }

    return visaTypeValue.replace(/_/g, " ");
  };

  const handleRowClick = (student: UserDataModel) => {
    if (onRowClick) {
      onRowClick(student);
      return;
    }
    if (role === "director") {
      router.push(`/director/dashboard/students-management/detail/${student.id}`);
    } else if (role === "admission") {
      router.push(`/admission/dashboard/students-management/detail/${student.id}`);
    } else if (role === "consultant") {
      router.push(`/consultant/dashboard/students-management/detail/${student.id}`);
    }
  };

  return (
    <div
      className={`${styles.tableWrapper} ${className || ""}`.trim()}
      role="region"
      aria-label="Tabel Pipeline Siswa"
      tabIndex={0}
    >
      <table className={styles.pipelineTable}>
        <thead>
          <tr className={styles.headerRow}>
            <th scope="col" className={`${styles.thCell} ${styles.thCellFirst} ${styles.colStudent}`}>
              Nama Siswa
            </th>
            <th scope="col" className={`${styles.thCell} ${styles.colCountry}`}>
              Negara Tujuan
            </th>
            <th scope="col" className={`${styles.thCell} ${styles.colVisa}`}>
              Tipe Visa
            </th>
            <th scope="col" className={`${styles.thCell} ${styles.colConsultant}`}>
              Konsultan
            </th>
            <th scope="col" className={`${styles.thCell} ${styles.colStep}`}>
              Tahapan
            </th>
            <th scope="col" className={`${styles.thCell} ${styles.colStatus}`}>
              Status
            </th>
            <th scope="col" className={`${styles.thCell} ${styles.thCellLast} ${styles.colUpdate}`}>
              Pembaruan
            </th>
          </tr>
        </thead>
        <tbody>
          {displayedStudents.map((student) => {
            const country = getCountryName(student);
            const badge = getCountryBadgeMeta(country);
            const stepLabel = getCurrentStepLabel(student);
            const stepTone = getStepTone(stepLabel);
            const status = getStudentPipelineStatus(student);
            const visaLabel = getVisaLabel(student);
            const studentId = String(student.id);
            const lastActivityAt =
              lastActivityMap[studentId] ||
              (student.updated_at ? new Date(student.updated_at).getTime() : 0) ||
              (student.created_at ? new Date(student.created_at).getTime() : 0);

            return (
              <tr
                key={studentId}
                onClick={() => handleRowClick(student)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(student);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Lihat detail siswa ${student.name}`}
                className={styles.tableRow}
              >
                {/* 1. Nama Siswa */}
                <td className={`${styles.cell} ${styles.cellFirst} ${styles.colStudent}`}>
                  <div className={styles.studentWrapper}>
                    <Avatar
                      size={32}
                      src={getStudentAvatarUrl(student)}
                      className={styles.studentAvatar}
                    >
                      {!getStudentAvatarUrl(student) && getStudentInitials(student)}
                    </Avatar>
                    <div className={styles.studentInfo}>
                      <Text strong className={styles.studentName}>
                        {student.name}
                      </Text>
                      <Text type="secondary" className={styles.studentContact}>
                        {student.email || student.no_phone || "Belum ada kontak"}
                      </Text>
                    </div>
                  </div>
                </td>

                {/* 2. Negara Tujuan (Abbreviation Badge Only) */}
                <td className={`${styles.cell} ${styles.colCountry}`}>
                  <div className={styles.countryWrapper}>
                    <Tooltip title={country} placement="top">
                      <span
                        className={styles.isoBadge}
                        style={{
                          color: badge.color,
                          backgroundColor: badge.bg,
                          borderColor: badge.border,
                        }}
                      >
                        {badge.code}
                      </span>
                    </Tooltip>
                  </div>
                </td>

                {/* 3. Tipe Visa */}
                <td className={`${styles.cell} ${styles.colVisa}`}>
                  <Tag className={styles.visaTag} title={visaLabel}>
                    {visaLabel}
                  </Tag>
                </td>

                {/* 4. Konsultan */}
                <td className={`${styles.cell} ${styles.colConsultant}`}>
                  <Text className={styles.consultantText}>
                    {student.name_consultant || "-"}
                  </Text>
                </td>

                {/* 5. Tahapan */}
                <td className={`${styles.cell} ${styles.colStep}`}>
                  <Tag
                    className={styles.stepTag}
                    style={{
                      background: stepTone.background,
                      color: stepTone.color,
                    }}
                  >
                    {stepLabel}
                  </Tag>
                </td>

                {/* 6. Status */}
                <td className={`${styles.cell} ${styles.colStatus}`}>
                  <Tag
                    className={styles.statusTag}
                    style={{
                      background: status.tone.background,
                      color: status.tone.color,
                      borderColor: status.tone.border,
                    }}
                  >
                    {status.label}
                  </Tag>
                </td>

                {/* 7. Pembaruan */}
                <td className={`${styles.cell} ${styles.cellLast} ${styles.colUpdate}`}>
                  <Text type="secondary" className={styles.updateText}>
                    {lastActivityAt ? formatShortDate(new Date(lastActivityAt).toISOString()) : "-"}
                  </Text>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!displayedStudents.length && (
        <div className={styles.emptyWrapper}>
          <Empty description={emptyText} />
        </div>
      )}
    </div>
  );
}
