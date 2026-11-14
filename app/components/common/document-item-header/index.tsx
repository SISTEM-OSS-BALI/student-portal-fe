"use client";

import React, { forwardRef } from "react";
import { Tag } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import styles from "./document-item-header.module.css";

export interface DocumentItemHeaderProps {
  required?: boolean;
  category?: string | null;
  categoryLabel?: string;
  translationNeeded?: boolean | string;
  rejected?: boolean;
  uploaded?: boolean;
  title: React.ReactNode;
  notes?: string | null;
  fileName?: string | null;
  customBadges?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DocumentItemHeader = forwardRef<HTMLDivElement, DocumentItemHeaderProps>(
  (
    {
      required,
      category,
      categoryLabel,
      translationNeeded,
      rejected,
      uploaded,
      title,
      notes,
      fileName,
      customBadges,
      className = "",
      style,
    },
    ref,
  ) => {
    const isTranslationNeeded =
      typeof translationNeeded === "boolean"
        ? translationNeeded
        : String(translationNeeded ?? "").toUpperCase() === "YES";

    return (
      <div
        ref={ref}
        className={`${styles.container} ${className}`.trim()}
        style={style}
      >
        {/* Baris 1: Kumpulan Badge / Lencana Dokumen */}
        <div className={styles.badgeRow}>
          {customBadges ? (
            customBadges
          ) : (
            <>
              {required !== undefined ? (
                required ? (
                  <Tag color="error">Required</Tag>
                ) : (
                  <Tag color="default">Optional</Tag>
                )
              ) : null}

              {categoryLabel || category ? (
                <Tag color="blue">{categoryLabel || category}</Tag>
              ) : null}

              {isTranslationNeeded ? (
                <Tag color="purple">Sworn</Tag>
              ) : null}

              {rejected ? (
                <Tag color="error" style={{ borderRadius: 999 }}>
                  Needs Revision
                </Tag>
              ) : null}
            </>
          )}
        </div>

        {/* Baris 2: Judul Dokumen */}
        <h4 className={styles.title}>{title}</h4>

        {/* Baris 3: Paragraf Keterangan Dokumen atau Status Tersimpan */}
        {uploaded ? (
          <div className={styles.savedStatus}>
            <CheckCircleOutlined className={styles.savedIcon} />
            <span className={styles.savedFileName}>
              <b style={{ color: "#166534" }}>Tersimpan:</b>{" "}
              {fileName || "Dokumen berhasil disimpan"}
            </span>
          </div>
        ) : notes ? (
          <p className={styles.description}>{notes}</p>
        ) : null}
      </div>
    );
  },
);

DocumentItemHeader.displayName = "DocumentItemHeader";

export default DocumentItemHeader;
