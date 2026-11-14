"use client";

import React, { type ReactNode } from "react";
import { PlusOutlined } from "@ant-design/icons";
import AppButton from "../app-button";
import styles from "./page-header.module.css";

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  headerExtra?: ReactNode;
  onAddNew?: () => void;
  addNewText?: string;
  children?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  headerExtra,
  onAddNew,
  addNewText = "Tambah",
  children,
}: PageHeaderProps) {
  const cleanAddText = (addNewText || "Tambah").replace(/^\+\s*/, "");

  return (
    <div
      className={`${styles.headerCard} ${
        children ? styles.headerCardWithChildren : ""
      }`}
    >
      <div className={styles.headerTitleRow}>
        {icon && <div className={styles.headerIcon}>{icon}</div>}

        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <h1 className={styles.titleText}>{title}</h1>
          {subtitle && <div className={styles.subtitleText}>{subtitle}</div>}
        </div>

        {headerExtra && (
          <div className={styles.headerExtraWrapper}>{headerExtra}</div>
        )}
      </div>

      {(children || onAddNew) && (
        <div
          className={`${styles.headerActions} ${
            children ? styles.headerActionsWithChildren : ""
          }`}
        >
          {children}

          {onAddNew && (
            <AppButton
              variant="primary"
              onClick={onAddNew}
              icon={<PlusOutlined />}
            >
              <span className={styles.desktopBtnText}>{cleanAddText}</span>
              <span className={styles.mobileBtnText}>Tambah</span>
            </AppButton>
          )}
        </div>
      )}
    </div>
  );
}
