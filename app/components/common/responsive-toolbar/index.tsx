"use client";

import React, { type ReactNode } from "react";
import { Segmented } from "antd";
import SearchBarComponent, { type SearchBarComponentProps } from "../search-bar";
import styles from "./responsive-toolbar.module.css";

export interface ResponsiveToolbarProps {
  searchProps?: SearchBarComponentProps;
  segmentedProps?: {
    value: string;
    onChange: (val: string) => void;
    options: { label: ReactNode; value: string; icon?: ReactNode }[];
  };
  filterContent?: ReactNode;
  summaryContent?: ReactNode;
  actionContent?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function ResponsiveToolbar({
  searchProps,
  segmentedProps,
  filterContent,
  summaryContent,
  actionContent,
  className = "",
  style,
}: ResponsiveToolbarProps) {
  return (
    <div className={`${styles.toolbarRow} ${className}`.trim()} style={style}>
      <div className={styles.toolbarLeft}>
        {searchProps && <SearchBarComponent {...searchProps} />}

        {filterContent}

        {segmentedProps && (
          <Segmented
            value={segmentedProps.value}
            onChange={(val) => segmentedProps.onChange(val as string)}
            options={segmentedProps.options}
            className={styles.segmentedControl}
          />
        )}
      </div>

      {(summaryContent || actionContent) && (
        <div className={styles.toolbarRight}>
          {summaryContent && (
            <span className={styles.summaryText}>{summaryContent}</span>
          )}
          {actionContent}
        </div>
      )}
    </div>
  );
}
