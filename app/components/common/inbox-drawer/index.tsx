"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BellOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Drawer, Empty, Input, Segmented, Typography } from "antd";

import type { MentionMessage } from "@/app/models/chat";
import styles from "./inbox-drawer.module.css";

type InboxTab = "mentions" | "unread" | "all";

type InboxDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: MentionMessage[];
  onOpenItem: (item: MentionMessage) => Promise<void> | void;
  onMarkItemRead: (id: string) => Promise<unknown>;
  userNameMap?: Map<string, string>;
};

function getInitials(value: string): string {
  const parts = value
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "IN";
  }

  return parts.map((item) => item.charAt(0).toUpperCase()).join("");
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Baru saja";
  }

  const diff = Date.now() - timestamp;
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} days ago`;
  }

  return new Date(value).toLocaleDateString();
}

function buildInboxTitle(item: MentionMessage): string {
  if (item.text && item.text.trim()) {
    return item.type === "message" ? "New message" : "New mention in note";
  }

  return "Update Information";
}

function buildInboxDescription(item: MentionMessage, userNameMap?: Map<string, string>): ReactNode {
  const contextName =
    item.context_user_name ||
    (item.context_user_id ? userNameMap?.get(item.context_user_id) : undefined) ||
    "student";

  const senderName = item.sender_name || "Seseorang";
  const text = item.text?.trim();

  if (text) {
    return (
      <>
        <strong>{senderName}</strong> tagged you in case <strong>{contextName}</strong>
        : <span>“{text}”</span>
      </>
    );
  }

  return (
    <>
      <strong>{senderName}</strong> update information for <strong>{contextName}</strong>
    </>
  );
}

function getItemTone(item: MentionMessage): {
  icon: ReactNode;
  avatarClassName: string;
} {
  if (item.type === "message") {
    return {
      icon: <MessageOutlined />,
      avatarClassName: styles.avatarMessage,
    };
  }

  if (item.is_read) {
    return {
      icon: <CheckCircleOutlined />,
      avatarClassName: styles.avatarRead,
    };
  }

  return {
    icon: <BellOutlined />,
    avatarClassName: styles.avatarMention,
  };
}

export default function InboxDrawer({
  open,
  onClose,
  items,
  onOpenItem,
  onMarkItemRead,
  userNameMap,
}: InboxDrawerProps) {
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState<InboxTab>("mentions");
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items],
  );

  const filteredItems = useMemo(() => {
    const search = normalizeText(keyword);

    return items.filter((item) => {
      const matchesTab =
        tab === "unread" ? !item.is_read : true;

      const haystack = [
        item.sender_name,
        item.context_user_name,
        item.text,
        item.type,
      ]
        .map((value) => normalizeText(value))
        .join(" ");

      const matchesSearch = !search || haystack.includes(search);
      return matchesTab && matchesSearch;
    });
  }, [items, keyword, tab]);

  const handleMarkAllRead = async () => {
    const unreadItems = items.filter((item) => !item.is_read);
    if (!unreadItems.length) {
      return;
    }

    setMarkingAll(true);
    try {
      await Promise.all(unreadItems.map((item) => onMarkItemRead(item.id)));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      width={360}
      title={null}
      className={styles.drawer}
      rootClassName={styles.drawerRoot}
      styles={{ body: { padding: 0 } }}
    >
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div>
            <Typography.Title level={4} className={styles.heading}>
              Inbox
            </Typography.Title>
            <Typography.Text className={styles.subheading}>
              Notifikasi mention & update case terbaru
            </Typography.Text>
          </div>

          <Button
            type="link"
            className={styles.markReadButton}
            onClick={handleMarkAllRead}
            loading={markingAll}
            disabled={!unreadCount}
          >
            Mark all as read
          </Button>
        </div>

        <Input
          allowClear
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Cari notifikasi atau case..."
          prefix={<SearchOutlined className={styles.searchIcon} />}
          className={styles.search}
        />

        <Segmented
          value={tab}
          onChange={(value) => setTab(value as InboxTab)}
          options={[
            { label: `Mentions${items.length ? ` (${items.length})` : ""}`, value: "mentions" },
            { label: `Unread${unreadCount ? ` (${unreadCount})` : ""}`, value: "unread" },
            { label: "All", value: "all" },
          ]}
          className={styles.segmented}
        />

        <div className={styles.list}>
          {filteredItems.length ? (
            filteredItems.map((item) => {
              const title = buildInboxTitle(item);
              const tone = getItemTone(item);
              const contextName =
                item.context_user_name ||
                (item.context_user_id ? userNameMap?.get(item.context_user_id) : undefined) ||
                "Student";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className={`${styles.item} ${item.is_read ? styles.itemRead : styles.itemUnread}`}
                >
                  <Avatar className={`${styles.avatar} ${tone.avatarClassName}`}>
                    {item.sender_name ? getInitials(item.sender_name) : tone.icon}
                  </Avatar>

                  <div className={styles.itemBody}>
                    <div className={styles.itemHeader}>
                      <Typography.Text className={styles.itemTitle}>
                        {title}
                      </Typography.Text>
                      <Typography.Text className={styles.itemTime}>
                        {formatRelativeTime(item.created_at)}
                      </Typography.Text>
                    </div>

                    <Typography.Text className={styles.itemDescription}>
                      {buildInboxDescription(item, userNameMap)}
                    </Typography.Text>

                    <Typography.Text className={styles.itemCase}>
                      {contextName}
                    </Typography.Text>
                  </div>
                </button>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <Empty description="Belum ada notifikasi yang cocok." />
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
