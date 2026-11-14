"use client";

import {
  BankOutlined,
  FileTextOutlined,
  IdcardOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  RightOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Empty, Input, Modal, Tag, Typography } from "antd";
import type { InputRef } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./global-search-modal.module.css";

const { Text, Title } = Typography;

export type GlobalSearchItemType =
  | "student"
  | "update"
  | "mention"
  | "document";

export type GlobalSearchItem = {
  id: string;
  type: GlobalSearchItemType;
  title: string;
  subtitle?: string;
  description?: string;
  meta?: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
  keywords?: string;

  // Rich metadata fields for consistent portal presentation
  avatarUrl?: string | null;
  initials?: string | null;
  country?: string | null;
  countryCode?: string | null;
  countryColor?: string | null;
  countryBg?: string | null;
  countryBorder?: string | null;
  campus?: string | null;
  degree?: string | null;
  visaType?: string | null;
  phone?: string | null;
  email?: string | null;
  statusLabel?: string | null;
  statusTone?: {
    background: string;
    color: string;
    border: string;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: GlobalSearchItem[];
  onOpenItem: (item: GlobalSearchItem) => void;
  title?: string;
};

const filters: { key: "all" | GlobalSearchItemType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "student", label: "Students" },
  { key: "update", label: "Updates" },
  { key: "mention", label: "Inbox" },
  { key: "document", label: "Documents" },
];

function normalize(value: string | undefined | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getItemIcon(type: GlobalSearchItemType) {
  switch (type) {
    case "student":
      return <UserOutlined />;
    case "mention":
      return <InboxOutlined />;
    case "document":
      return <FileTextOutlined />;
    case "update":
    default:
      return <InfoCircleOutlined />;
  }
}

export default function GlobalSearchModal({
  open,
  onClose,
  items,
  onOpenItem,
  title = "Global Search",
}: Props) {
  const inputRef = useRef<InputRef>(null);

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | GlobalSearchItemType
  >("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ cursor: "all" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    return items.filter((item) => {
      if (activeFilter !== "all" && item.type !== activeFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = normalize(
        [
          item.title,
          item.subtitle,
          item.description,
          item.meta,
          item.badge,
          item.country,
          item.countryCode,
          item.campus,
          item.degree,
          item.visaType,
          item.email,
          item.phone,
          item.statusLabel,
          item.keywords,
        ].join(" "),
      );

      return haystack.includes(normalizedQuery);
    });
  }, [activeFilter, items, query]);

  const selectedItem = useMemo(() => {
    if (!filteredItems.length) {
      return null;
    }

    const itemBySelectedId = filteredItems.find(
      (item) => item.id === selectedId,
    );

    return itemBySelectedId ?? filteredItems[0];
  }, [filteredItems, selectedId]);

  const handleOpenSelected = () => {
    if (!selectedItem) return;
    onOpenItem(selectedItem);
  };

  const handleReset = () => {
    setQuery("");
    setActiveFilter("all");
    setSelectedId(null);
  };

  const handleChangeFilter = (filterKey: "all" | GlobalSearchItemType) => {
    setActiveFilter(filterKey);
    setSelectedId(null);
  };

  const handleChangeQuery = (value: string) => {
    setQuery(value);
    setSelectedId(null);
  };

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      width="min(1240px, 94vw)"
      className={styles.modal}
      centered
      destroyOnHidden={false}
      closable={false}
      styles={{
        body: {
          padding: 0,
          overflow: "hidden",
        },
        mask: {
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <div className={styles.shell}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.modalHeading}>
            <Text className={styles.modalTitle}>{title}</Text>
          </div>

          <div className={styles.searchRow}>
            <SearchOutlined className={styles.searchIcon} />

            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => handleChangeQuery(event.target.value)}
              onPressEnter={handleOpenSelected}
              variant="borderless"
              placeholder="Cari mahasiswa, berkas, pengumuman, atau inbox..."
              className={styles.searchInput}
            />
          </div>

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleOpenSelected}
            disabled={!selectedItem}
            className={styles.searchBtn}
          >
            Search
          </Button>
        </div>

        {/* Filter Chips Bar */}
        <div className={styles.filterRow}>
          {filters.map((filter) => {
            const active = activeFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                className={`${styles.filterChip} ${
                  active ? styles.filterChipActive : ""
                }`.trim()}
                onClick={() => handleChangeFilter(filter.key)}
              >
                {filter.label}
              </button>
            );
          })}

          <button
            type="button"
            className={styles.resetButton}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        {/* Main Content Pane */}
        <div className={styles.content}>
          {/* Left: Results List */}
          <div className={styles.resultsPane}>
            <div className={styles.resultsHeader}>
              <Title level={4} className={styles.resultsTitle}>
                Search results ({filteredItems.length})
              </Title>

              <Text className={styles.resultsMeta}>Best matches</Text>
            </div>

            <div className={styles.resultsList}>
              {filteredItems.length ? (
                filteredItems.map((item) => {
                  const active = item.id === selectedItem?.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.resultCard} ${
                        active ? styles.resultCardActive : ""
                      }`.trim()}
                      onClick={() => {
                        setSelectedId(item.id);
                      }}
                      onDoubleClick={() => {
                        setSelectedId(item.id);
                        onOpenItem(item);
                      }}
                    >
                      {/* Avatar or Icon */}
                      <div className={styles.resultItemLeft}>
                        {item.type === "student" ? (
                          <Avatar
                            src={item.avatarUrl || undefined}
                            size={44}
                            style={{
                              borderRadius: 12,
                              background: "#eff6ff",
                              color: "#1b3d6d",
                              border: "1.5px solid #bfdbfe",
                              fontWeight: 700,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {item.initials ||
                              item.title.slice(0, 2).toUpperCase()}
                          </Avatar>
                        ) : (
                          <div className={styles.resultIcon}>
                            {getItemIcon(item.type)}
                          </div>
                        )}
                      </div>

                      {/* Result Body */}
                      <div className={styles.resultBody}>
                        <div className={styles.resultHead}>
                          <Text className={styles.resultTitle}>
                            {item.title}
                          </Text>

                          <div
                            style={{
                              marginLeft: "auto",
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {item.countryCode ? (
                              <Tag
                                style={{
                                  margin: 0,
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  fontSize: 10.5,
                                  padding: "1px 7px",
                                  background: item.countryBg || "#eff6ff",
                                  color: item.countryColor || "#1b3d6d",
                                  borderColor:
                                    item.countryBorder || "#bfdbfe",
                                }}
                              >
                                {item.countryCode}
                              </Tag>
                            ) : null}

                            {item.statusLabel ? (
                              <Tag
                                style={{
                                  margin: 0,
                                  borderRadius: 999,
                                  fontWeight: 700,
                                  fontSize: 10.5,
                                  padding: "1px 8px",
                                  background:
                                    item.statusTone?.background || "#f1f5f9",
                                  color:
                                    item.statusTone?.color || "#475569",
                                  borderColor:
                                    item.statusTone?.border || "#cbd5e1",
                                }}
                              >
                                {item.statusLabel}
                              </Tag>
                            ) : item.badge ? (
                              <Tag
                                color={item.badgeColor ?? "blue"}
                                className={styles.resultBadge}
                              >
                                {item.badge}
                              </Tag>
                            ) : null}
                          </div>
                        </div>

                        {item.subtitle ? (
                          <Text className={styles.resultSubtitle}>
                            {item.subtitle}
                          </Text>
                        ) : null}

                        {item.description ? (
                          <Text className={styles.resultDescription}>
                            {item.description}
                          </Text>
                        ) : null}

                        {item.meta && !item.statusLabel ? (
                          <Text className={styles.resultMeta}>{item.meta}</Text>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Tidak ada hasil yang cocok"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Rich Preview Pane */}
          <div className={styles.previewPane}>
            {selectedItem ? (
              <div className={styles.previewCard}>
                {/* Header Row */}
                <div className={styles.previewHeaderRow}>
                  {selectedItem.type === "student" ? (
                    <Avatar
                      src={selectedItem.avatarUrl || undefined}
                      size={68}
                      style={{
                        borderRadius: 18,
                        background: "#eff6ff",
                        color: "#1b3d6d",
                        border: "2px solid #bfdbfe",
                        fontSize: 22,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {selectedItem.initials ||
                        selectedItem.title.slice(0, 2).toUpperCase()}
                    </Avatar>
                  ) : (
                    <div className={styles.previewIcon}>
                      {getItemIcon(selectedItem.type)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: 11,
                          padding: "2px 10px",
                          background: "#eff6ff",
                          color: "#1b3d6d",
                          borderColor: "#bfdbfe",
                        }}
                      >
                        {selectedItem.type === "student"
                          ? "Mahasiswa"
                          : selectedItem.badge ||
                            selectedItem.type.toUpperCase()}
                      </Tag>

                      {selectedItem.countryCode ? (
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 11,
                            padding: "2px 8px",
                            background: selectedItem.countryBg || "#eff6ff",
                            color: selectedItem.countryColor || "#1b3d6d",
                            borderColor:
                              selectedItem.countryBorder || "#bfdbfe",
                          }}
                        >
                          {selectedItem.countryCode}
                          {selectedItem.country
                            ? ` • ${selectedItem.country}`
                            : ""}
                        </Tag>
                      ) : null}

                      {selectedItem.statusLabel ? (
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: 11,
                            padding: "2px 10px",
                            background:
                              selectedItem.statusTone?.background || "#f1f5f9",
                            color:
                              selectedItem.statusTone?.color || "#475569",
                            borderColor:
                              selectedItem.statusTone?.border || "#cbd5e1",
                          }}
                        >
                          {selectedItem.statusLabel}
                        </Tag>
                      ) : null}
                    </div>

                    <Title level={3} className={styles.previewTitle}>
                      {selectedItem.title}
                    </Title>

                    {selectedItem.subtitle ? (
                      <Text className={styles.previewSubtitle}>
                        {selectedItem.subtitle}
                      </Text>
                    ) : null}
                  </div>
                </div>

                {/* Structured Student Details */}
                {selectedItem.type === "student" ? (
                  <div className={styles.previewDetailsCard}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>
                        <MailOutlined
                          style={{ marginRight: 8, color: "#64748b" }}
                        />
                        Email
                      </span>
                      <span className={styles.detailValue}>
                        {selectedItem.email || "-"}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>
                        <PhoneOutlined
                          style={{ marginRight: 8, color: "#64748b" }}
                        />
                        Telepon
                      </span>
                      <span className={styles.detailValue}>
                        {selectedItem.phone || "-"}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>
                        <BankOutlined
                          style={{ marginRight: 8, color: "#64748b" }}
                        />
                        Kampus Tujuan
                      </span>
                      <span className={styles.detailValue}>
                        {selectedItem.campus || "-"}
                      </span>
                    </div>

                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>
                        <IdcardOutlined
                          style={{ marginRight: 8, color: "#64748b" }}
                        />
                        Jenis Visa
                      </span>
                      <span className={styles.detailValue}>
                        {selectedItem.visaType || "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.previewDescriptionBox}>
                    {selectedItem.description && (
                      <Text className={styles.previewDescription}>
                        {selectedItem.description}
                      </Text>
                    )}
                    {selectedItem.meta && (
                      <Text
                        type="secondary"
                        style={{ fontSize: 13, display: "block", marginTop: 8 }}
                      >
                        {selectedItem.meta}
                      </Text>
                    )}
                  </div>
                )}

                {/* Primary Action Button */}
                <div style={{ marginTop: "auto", paddingTop: 18 }}>
                  <Button
                    type="primary"
                    block
                    icon={<RightOutlined />}
                    onClick={handleOpenSelected}
                    style={{
                      height: 44,
                      borderRadius: 12,
                      fontWeight: 700,
                      background: "#1b3d6d",
                      borderColor: "#1b3d6d",
                      fontSize: 14,
                      boxShadow: "0 4px 14px rgba(27, 61, 109, 0.22)",
                    }}
                  >
                    Buka Detail{" "}
                    {selectedItem.type === "student" ? "Mahasiswa" : "Item"} →
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.previewEmpty}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Pilih hasil pencarian untuk melihat detail"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Text className={styles.footerText}>
            Enter untuk membuka hasil terpilih • Klik pada hasil untuk melihat
            preview detail
          </Text>
        </div>
      </div>
    </Modal>
  );
}
