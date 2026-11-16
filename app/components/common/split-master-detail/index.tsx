"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Space, Tag, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import PageHeader from "../page-header";
import styles from "./split-master-detail.module.css";

const { Title, Text } = Typography;

export interface SplitMasterDetailLayoutProps {
  // Top Header Card
  pageTitle: string;
  pageSubtitle?: string;
  pageIcon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  onAddNew?: () => void;
  addNewText?: string;

  // Left List Panel
  listTitle: string;
  listCount?: number;
  listExtra?: React.ReactNode;
  listFilter?: React.ReactNode;
  listContent: React.ReactNode;

  // Right Form Panel
  formTitle: string;
  formSubtitle?: string;
  formTag?: React.ReactNode;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onAddNewFromForm?: () => void;
  formContent: React.ReactNode;
}

export default function SplitMasterDetailLayout({
  pageTitle,
  pageSubtitle,
  pageIcon,
  headerExtra,
  onAddNew,
  addNewText = "Tambah Baru",
  listTitle,
  listCount,
  listExtra,
  listFilter,
  listContent,
  formTitle,
  formSubtitle,
  formTag,
  isEditing = false,
  onCancelEdit,
  onAddNewFromForm,
  formContent,
}: SplitMasterDetailLayoutProps) {
  const cleanAddText = (addNewText || "Tambah Baru").replace(/^\+\s*/, "");
  const [mobileView, setMobileView] = useState<"list" | "form">("list");
  const prevIsEditingRef = useRef(isEditing);

  // Otomatis beralih ke panel form saat data dipilih untuk diedit pada layar mobile
  useEffect(() => {
    if (isEditing && !prevIsEditingRef.current) {
      setMobileView("form");
    }
    prevIsEditingRef.current = isEditing;
  }, [isEditing]);

  const handleAddNew = () => {
    setMobileView("form");
    onAddNew?.();
  };

  const handleAddNewFromForm = () => {
    setMobileView("form");
    onAddNewFromForm?.();
  };

  const handleCancelEdit = () => {
    setMobileView("list");
    onCancelEdit?.();
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Top Header Card (Disembunyikan saat sedang membuka form di layar mobile agar hemat tempat) */}
      <div className={mobileView === "form" ? styles.hideHeaderOnMobile : ""}>
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          icon={pageIcon}
          headerExtra={headerExtra}
          onAddNew={onAddNew ? handleAddNew : undefined}
          addNewText={cleanAddText}
        />
      </div>

      {/* Split Screen 2-Column Grid */}
      <div
        className={`${styles.splitLayout} ${
          mobileView === "list" ? styles.mobileShowList : styles.mobileShowForm
        }`}
      >
        {/* Kolom Kiri: Daftar Items */}
        <div className={styles.listPanel}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 className={styles.sectionHeaderTitle}>
                {listTitle}
              </h2>
              {listCount !== undefined && (
                <Tag color="blue" className={styles.listCountTag}>
                  {listCount} Data
                </Tag>
              )}
            </div>

            {listExtra && <div>{listExtra}</div>}
          </div>

          {listFilter}

          <div className={styles.listScrollArea}>{listContent}</div>
        </div>

        {/* Kolom Kanan: Form Editor (Sticky pada Desktop, Tampilan Penuh pada Mobile) */}
        <div className={styles.formPanel}>
          {/* Tombol kembali ke daftar untuk navigasi mobile */}
          <div className={styles.mobileBackRow}>
            <button
              type="button"
              className={styles.mobileBackBtn}
              onClick={handleBackToList}
            >
              <ArrowLeftOutlined />
              <span>Kembali ke {listTitle || "Daftar Data"}</span>
            </button>
          </div>

          <div className={styles.formHeader}>
            <div className={styles.formHeaderTitleGroup}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <h2 className={styles.sectionHeaderTitle}>
                  {formTitle}
                </h2>
                {formTag}
              </div>
              {formSubtitle && (
                <p className={styles.sectionHeaderSubtitle}>
                  {formSubtitle}
                </p>
              )}
            </div>

            {isEditing && onCancelEdit && (
              <div className={styles.formHeaderActions}>
                <Button
                  onClick={handleCancelEdit}
                  style={{ borderRadius: 8, fontSize: 12, fontWeight: 500 }}
                >
                  Batal Edit
                </Button>
              </div>
            )}
          </div>

          {formContent}
        </div>
      </div>
    </div>
  );
}

export { styles as splitMasterDetailStyles };
