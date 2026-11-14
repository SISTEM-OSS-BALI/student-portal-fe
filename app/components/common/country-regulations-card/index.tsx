"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Empty, Input, Select, Space, Tag, Typography } from "antd";
import {
  DownOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import type { InformationCountryDataModel } from "@/app/models/information-country-management";
import { formatShortDate } from "@/app/utils/student-helpers";

const { Text } = Typography;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

const priorityOrder: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

function formatPriorityLabel(value?: string | null): string {
  switch (normalizeText(value)) {
    case "high":
      return "Prioritas Tinggi";
    case "medium":
      return "Prioritas Sedang";
    case "low":
      return "Prioritas Rendah";
    default:
      return "Prioritas Normal";
  }
}

function getPriorityTone(value?: string | null): {
  background: string;
  color: string;
  border: string;
} {
  switch (normalizeText(value)) {
    case "high":
      return {
        background: "#fff1f2",
        color: "#ef4444",
        border: "#fecdd3",
      };
    case "medium":
      return {
        background: "#fff7ed",
        color: "#d97706",
        border: "#fed7aa",
      };
    case "low":
      return {
        background: "#eff6ff",
        color: "#2563eb",
        border: "#bfdbfe",
      };
    default:
      return {
        background: "#f1f5f9",
        color: "#64748b",
        border: "#e2e8f0",
      };
  }
}

export interface CountryRegulationsCardProps {
  countryName?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  title?: string;
  subtitle?: string;
  style?: CSSProperties;
  limit?: number;
  showFilters?: boolean;
}

export default function CountryRegulationsCard({
  countryName,
  collapsible = false,
  defaultCollapsed = false,
  title = "Country Regulations",
  subtitle = "Pengumuman penting dan regulasi visa per negara",
  style,
  limit,
  showFilters = false,
}: CountryRegulationsCardProps) {
  const { data: informationUpdates = [], fetchLoading } =
    useInformationCountries({});

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [keyword, setKeyword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | "ALL">(
    countryName || "ALL"
  );
  const [selectedPriority, setSelectedPriority] = useState<string | "ALL">(
    "ALL"
  );

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    informationUpdates.forEach((item) => {
      if (item.country?.name) {
        set.add(item.country.name);
      }
    });
    return Array.from(set).sort();
  }, [informationUpdates]);

  const sortedAndFilteredUpdates = useMemo(() => {
    let list = [...informationUpdates];

    // Filter by specific country if provided via prop
    if (countryName && countryName !== "ALL") {
      list = list.filter(
        (item) =>
          !item.country?.name ||
          normalizeText(item.country.name) === normalizeText(countryName)
      );
    }

    // Filter by country from internal select
    if (selectedCountry && selectedCountry !== "ALL") {
      list = list.filter(
        (item) =>
          item.country?.name &&
          normalizeText(item.country.name) === normalizeText(selectedCountry)
      );
    }

    // Filter by priority
    if (selectedPriority && selectedPriority !== "ALL") {
      list = list.filter(
        (item) => normalizeText(item.priority) === normalizeText(selectedPriority)
      );
    }

    // Filter by keyword
    if (keyword.trim()) {
      const q = normalizeText(keyword);
      list = list.filter((item) => {
        const titleMatch = normalizeText(item.title).includes(q);
        const descMatch = normalizeText(item.description).includes(q);
        const countryMatch = normalizeText(item.country?.name).includes(q);
        return titleMatch || descMatch || countryMatch;
      });
    }

    // Sort by priority (high -> medium -> low) then newest
    list.sort((a, b) => {
      const pA = priorityOrder[normalizeText(a.priority)] ?? 99;
      const pB = priorityOrder[normalizeText(b.priority)] ?? 99;
      if (pA !== pB) return pA - pB;

      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    });

    if (limit && limit > 0) {
      return list.slice(0, limit);
    }

    return list;
  }, [
    informationUpdates,
    countryName,
    selectedCountry,
    selectedPriority,
    keyword,
    limit,
  ]);

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
        background: "#ffffff",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        ...style,
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 3px",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
            {subtitle}
          </p>
        </div>

        {collapsible && (
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            <span>{isCollapsed ? "Lihat Pengumuman" : "Tutup"}</span>
            {isCollapsed ? (
              <DownOutlined style={{ fontSize: 10 }} />
            ) : (
              <UpOutlined style={{ fontSize: 10 }} />
            )}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {showFilters && (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Input
                allowClear
                placeholder="Cari pengumuman..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                style={{ width: 220, borderRadius: 8 }}
                size="small"
              />

              <Select
                value={selectedCountry}
                onChange={setSelectedCountry}
                style={{ width: 160 }}
                size="small"
                options={[
                  { value: "ALL", label: "Semua Negara" },
                  ...availableCountries.map((c) => ({ value: c, label: c })),
                ]}
              />

              <Select
                value={selectedPriority}
                onChange={setSelectedPriority}
                style={{ width: 150 }}
                size="small"
                options={[
                  { value: "ALL", label: "Semua Prioritas" },
                  { value: "high", label: "Prioritas Tinggi" },
                  { value: "medium", label: "Prioritas Sedang" },
                  { value: "low", label: "Prioritas Rendah" },
                ]}
              />
            </div>
          )}

          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {sortedAndFilteredUpdates.length > 0 ? (
              sortedAndFilteredUpdates.map(
                (item: InformationCountryDataModel) => {
                  const tone = getPriorityTone(item.priority);

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 14,
                        background: "#ffffff",
                        transition: "box-shadow 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 17,
                            flexShrink: 0,
                          }}
                        >
                          <InfoCircleOutlined />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "flex-start",
                            }}
                          >
                            <Text
                              strong
                              style={{
                                fontSize: 13.5,
                                color: "#0f172a",
                                lineHeight: 1.3,
                              }}
                            >
                              {item.title}
                            </Text>

                            <Tag
                              style={{
                                margin: 0,
                                borderRadius: 999,
                                padding: "2px 8px",
                                background: tone.background,
                                color: tone.color,
                                borderColor: tone.border,
                                whiteSpace: "nowrap",
                                fontSize: 10.5,
                                fontWeight: 600,
                              }}
                            >
                              {formatPriorityLabel(item.priority)}
                            </Tag>
                          </div>

                          <Text
                            type="secondary"
                            style={{
                              display: "block",
                              marginTop: 2,
                              fontSize: 11.5,
                            }}
                          >
                            {item.country?.name || "Semua Negara"}
                          </Text>

                          <Text
                            style={{
                              display: "block",
                              marginTop: 6,
                              color: "#475569",
                              fontSize: 12,
                              lineHeight: 1.45,
                            }}
                          >
                            {item.description ||
                              "Tidak ada deskripsi tambahan."}
                          </Text>

                          <Text
                            type="secondary"
                            style={{
                              display: "block",
                              marginTop: 8,
                              fontSize: 11,
                            }}
                          >
                            {formatShortDate(
                              item.updated_at || item.created_at
                            )}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <Empty
                description={
                  fetchLoading
                    ? "Memuat regulasi negara..."
                    : "Belum ada pengumuman regulasi negara."
                }
              />
            )}
          </Space>
        </>
      )}
    </div>
  );
}
