"use client";

import React, { useState } from "react";
import { resolveCountryCode } from "@/app/utils/country-directory";

interface CountryFlagProps {
  countryName?: string | null;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
  borderRadius?: number;
}

export default function CountryFlag({
  countryName,
  width = 56,
  height = 36,
  style,
  className,
  borderRadius = 8,
}: CountryFlagProps) {
  const info = resolveCountryCode(countryName);

  const [hasError, setHasError] = useState(false);

  const localSvg = info.code === "au" ? "/assets/flags/au.svg" : null;
  const primarySrc = localSvg || `https://flagcdn.com/w160/${info.code}.png`;
  const fallbackSrc = `/assets/flags/${info.code}.svg`;

  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(15, 23, 42, 0.1)",
        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
        backgroundColor: "#00008b",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={hasError ? fallbackSrc : primarySrc}
        alt={`Bendera ${countryName || info.label}`}
        width={width}
        height={height}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}
