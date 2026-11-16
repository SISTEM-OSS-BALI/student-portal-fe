"use client";

import React from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import styles from "./search-bar.module.css";

export interface SearchBarComponentProps {
  placeholder?: string;
  handleSearch?: (value: string) => void;
  handleChange?: (value: string) => void;
  value?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SearchBarComponent({
  placeholder = "Cari data...",
  handleSearch,
  handleChange,
  value,
  className = "",
  style,
}: SearchBarComponentProps) {
  return (
    <div className={styles.searchWrapper}>
      <Input
        placeholder={placeholder}
        allowClear
        value={value}
        prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
        onChange={(event) => handleChange?.(event.target.value)}
        onPressEnter={(event) =>
          handleSearch?.((event.target as HTMLInputElement).value)
        }
        className={`${styles.searchInput} ${className}`.trim()}
        style={style}
      />
    </div>
  );
}
