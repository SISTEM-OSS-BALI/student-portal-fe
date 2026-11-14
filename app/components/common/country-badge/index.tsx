"use client";

import React from "react";
import { GlobalOutlined } from "@ant-design/icons";
import { getCountryBadgeMeta } from "@/app/utils/student-helpers";

export interface CountryBadgeProps {
  countryName?: string | null;
  showIcon?: boolean;
  codeOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function CountryBadge({
  countryName,
  showIcon = true,
  codeOnly = false,
  className,
  style,
}: CountryBadgeProps) {
  if (!countryName || countryName === "-" || countryName === "Unknown") {
    return null;
  }

  const meta = getCountryBadgeMeta(countryName);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        height: 22,
        lineHeight: "20px",
        padding: "0 7px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {showIcon && <GlobalOutlined style={{ fontSize: 11 }} />}
      <span>{codeOnly ? meta.code : countryName}</span>
    </span>
  );
}
