"use client";

import {
  Avatar,
  Badge,
  Dropdown,
  Input,
  Layout,
  Typography,
} from "antd";
import {
  BellOutlined,
  InboxOutlined,
  LogoutOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import getInitials from "@/app/utils/initials-username";

import { useAuth } from "@/app/utils/use-auth";
import { useUsers } from "@/app/hooks/use-users";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import { MainBreadcrumb } from "@/app/components/common/breadscrumb";
import { normalizedRole } from "@/app/utils/normalized";
import styles from "./layout.module.css";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChatMentions, useMarkMentionRead } from "@/app/hooks/use-chat";
import { useTicketMessages } from "@/app/hooks/use-ticket-message";
import InboxDrawer from "@/app/components/common/inbox-drawer";
import { SiderStudent } from "../../sider/student";
import GlobalSearchModal, {
  type GlobalSearchItem,
} from "@/app/components/common/global-search-modal";

const { Header, Content, Footer } = Layout;

function formatSearchDate(value?: string | null): string {
  if (!value) return "Tanpa tanggal";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanpa tanggal";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPriorityLabel(priority?: string | null): string {
  const value = String(priority ?? "normal").trim().toLowerCase();
  if (!value) return "Normal Priority";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} Priority`;
}

function getPriorityColor(priority?: string | null): string {
  const value = String(priority ?? "normal").trim().toLowerCase();
  if (value === "high") return "red";
  if (value === "medium") return "orange";
  if (value === "low") return "blue";
  return "default";
}

export default function StudentLayout({
  children,
  username,
  userProfilePic,
}: {
  children: React.ReactNode;
  username: string;
  userProfilePic?: string;
}) {
  const router = useRouter();
  const { role, logout, user_id } = useAuth();

  const [openInbox, setOpenInbox] = useState(false);
  const [openGlobalSearch, setOpenGlobalSearch] = useState(false);

  const { data: usersData } = useUsers({ enabled: Boolean(user_id) });
  const { data: informationData = [] } = useInformationCountries({
    enabled: Boolean(user_id),
  });
  const { data: mentionMessages, refetch: refetchMentions } = useChatMentions({
    enabled: Boolean(user_id),
    user_id: user_id,
  });
  const { onMarkRead } = useMarkMentionRead();
  const { data: ticketMessages = [] } = useTicketMessages({
    enabled: Boolean(user_id),
    withNotification: false,
  });

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (usersData ?? []).forEach((user) => {
      if (user.id) map.set(String(user.id), user.name);
    });
    return map;
  }, [usersData]);

  const ticketConversationIds = useMemo(() => {
    return new Set(
      ticketMessages
        .map((item) => item.conversation_id)
        .filter((value): value is string => Boolean(value)),
    );
  }, [ticketMessages]);

  const unreadCount = useMemo(
    () => (mentionMessages ?? []).filter((item) => !item.is_read).length,
    [mentionMessages],
  );

  const openDrawerInbox = () => {
    setOpenInbox(true);
    refetchMentions();
  };

  const closeDrawerInbox = () => {
    setOpenInbox(false);
  };

  const resolveStudentDetailPath = (studentId: string) => {
    if ((role ?? "").toUpperCase() === "DIRECTOR") {
      return `/director/dashboard/students-management/detail/${studentId}`;
    }
    return `/admission/dashboard/students-management/detail/${studentId}`;
  };

  const handleOpenMention = async (item: {
    id: string;
    context_user_id?: string | null;
    conversation_id?: string | null;
  }) => {
    await onMarkRead(item.id);
    if (!item.context_user_id) {
      return;
    }

    const targetPath = resolveStudentDetailPath(item.context_user_id);
    const fromTicketStudent = Boolean(
      item.conversation_id && ticketConversationIds.has(item.conversation_id),
    );
    const params = new URLSearchParams();

    if (fromTicketStudent) {
      params.set("tab", "chat");
      if (item.conversation_id) {
        params.set("conversation_id", item.conversation_id);
      }
    } else {
      params.set("tab", "overview");
    }

    router.push(`${targetPath}?${params.toString()}`);
    closeDrawerInbox();
  };

  const searchItems = useMemo<GlobalSearchItem[]>(() => {
    const infoItems = informationData.map((item) => ({
      id: `update-${item.id}`,
      type: "update" as const,
      title: item.title,
      subtitle: [item.country?.name, item.slug].filter(Boolean).join(" • "),
      description: item.description ?? "Tidak ada deskripsi",
      meta: `Updated ${formatSearchDate(item.updated_at)}`,
      badge: formatPriorityLabel(item.priority),
      badgeColor: getPriorityColor(item.priority),
      href: "/student/dashboard/home",
      keywords: [
        item.title,
        item.slug,
        item.description,
        item.country?.name,
        item.priority,
      ]
        .filter(Boolean)
        .join(" "),
    }));

    const mentionItems = (mentionMessages ?? []).map((item) => ({
      id: `mention-${item.id}`,
      type: "mention" as const,
      title: item.sender_name ? `Mention from ${item.sender_name}` : "Mention inbox",
      subtitle: item.context_user_name ? `Student case • ${item.context_user_name}` : "Inbox notification",
      description: item.text ?? "Tidak ada preview pesan",
      meta: formatSearchDate(item.created_at),
      badge: item.is_read ? "Read" : "Unread",
      badgeColor: item.is_read ? "default" : "gold",
      keywords: [item.sender_name, item.context_user_name, item.text]
        .filter(Boolean)
        .join(" "),
    }));

    return [...infoItems, ...mentionItems];
  }, [informationData, mentionMessages]);

  const handleOpenSearchItem = async (item: GlobalSearchItem) => {
    setOpenGlobalSearch(false);

    if (item.type === "mention") {
      const source = (mentionMessages ?? []).find(
        (mention) => `mention-${mention.id}` === item.id,
      );
      if (source) {
        await handleOpenMention(source);
        return;
      }
    }

    if (item.href) {
      router.push(item.href);
    }
  };

  const menuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: () => {
        logout();
        router.push("/login");
      },
    },
  ];

  return (
    <div>
      <Layout className={styles.root}>
        <SiderStudent />
        <Layout className={styles.main}>
          <Header className={styles.header}>
            <div className={styles.headerLeft}>
              <MainBreadcrumb />
            </div>
            <div className={styles.headerRight}>
              <Input
                className={styles.search}
                readOnly
                placeholder="Cari mahasiswa, berkas, atau pengumuman"
                prefix={<SearchOutlined />}
                suffix={<span className={styles.searchHint}>Search</span>}
                onClick={() => setOpenGlobalSearch(true)}
                onFocus={(event) => {
                  event.target.blur();
                  setOpenGlobalSearch(true);
                }}
              />
              <Badge count={3} size="small" className={styles.badge}>
                <button className={styles.iconButton} type="button">
                  <BellOutlined />
                </button>
              </Badge>
              <Badge
                count={unreadCount}
                size="small"
                className={styles.badge}
                onClick={() => openDrawerInbox()}
              >
                <button className={styles.iconButton} type="button">
                  <InboxOutlined />
                </button>
              </Badge>
              <Dropdown
                menu={{ items: menuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <button className={styles.userTrigger} type="button">
                  <Avatar
                    size={48}
                    src={userProfilePic || undefined}
                    className={styles.avatar}
                  >
                    {!userProfilePic && getInitials(username)}
                  </Avatar>
                  <div className={styles.userMeta}>
                    <Typography.Text strong className={styles.userName}>
                      {username}
                    </Typography.Text>
                    <Typography.Text className={styles.userRole}>
                      {normalizedRole(role || "")}
                    </Typography.Text>
                  </div>
                </button>
              </Dropdown>
            </div>
          </Header>
          <Content className={styles.content}>
            <div className={styles.pageShell}>{children}</div>
          </Content>
          <Footer className={styles.footer}>
            OSS Student Portal • Student Dashboard
          </Footer>
        </Layout>
      </Layout>

      <GlobalSearchModal
        open={openGlobalSearch}
        onClose={() => setOpenGlobalSearch(false)}
        items={searchItems}
        onOpenItem={handleOpenSearchItem}
        title="Student Search"
      />

      <InboxDrawer
        open={openInbox}
        onClose={() => closeDrawerInbox()}
        items={mentionMessages ?? []}
        userNameMap={userNameMap}
        onMarkItemRead={onMarkRead}
        onOpenItem={handleOpenMention}
      />
    </div>
  );
}
