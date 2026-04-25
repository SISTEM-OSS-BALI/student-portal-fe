"use client";

import {
  FileTextOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  RightOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Empty, Input, Modal, Tag, Typography } from "antd";
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
      destroyOnClose={false}
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
          >
            Search
          </Button>
        </div>

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

        <div className={styles.content}>
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
                      onClick={() => setSelectedId(item.id)}
                      onDoubleClick={() => onOpenItem(item)}
                    >
                      <div className={styles.resultIcon}>
                        {getItemIcon(item.type)}
                      </div>

                      <div className={styles.resultBody}>
                        <div className={styles.resultHead}>
                          <Text className={styles.resultTitle}>
                            {item.title}
                          </Text>

                          {item.badge ? (
                            <Tag
                              color={item.badgeColor ?? "blue"}
                              className={styles.resultBadge}
                            >
                              {item.badge}
                            </Tag>
                          ) : null}
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

                        {item.meta ? (
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

          <div className={styles.previewPane}>
            {selectedItem ? (
              <div className={styles.previewCard}>
                <div className={styles.previewActions}>
                  <Button
                    type="default"
                    icon={<RightOutlined />}
                    onClick={handleOpenSelected}
                  >
                    Open
                  </Button>
                </div>

                <div className={styles.previewIcon}>
                  {getItemIcon(selectedItem.type)}
                </div>

                <Text className={styles.previewType}>
                  {selectedItem.type.toUpperCase()}
                </Text>

                <Title level={2} className={styles.previewTitle}>
                  {selectedItem.title}
                </Title>

                {selectedItem.subtitle ? (
                  <Text className={styles.previewSubtitle}>
                    {selectedItem.subtitle}
                  </Text>
                ) : null}

                {selectedItem.description ? (
                  <Text className={styles.previewDescription}>
                    {selectedItem.description}
                  </Text>
                ) : null}

                <div className={styles.previewMetaBox}>
                  {selectedItem.badge ? (
                    <Tag color={selectedItem.badgeColor ?? "blue"}>
                      {selectedItem.badge}
                    </Tag>
                  ) : null}

                  {selectedItem.meta ? (
                    <Text className={styles.previewMeta}>
                      {selectedItem.meta}
                    </Text>
                  ) : null}

                  {selectedItem.href ? (
                    <Text className={styles.previewHref}>
                      {selectedItem.href}
                    </Text>
                  ) : null}
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

        <div className={styles.footer}>
          <Text className={styles.footerText}>
            Enter untuk membuka hasil terpilih • Double click pada hasil untuk
            buka cepat
          </Text>
        </div>
      </div>
    </Modal>
  );
}
