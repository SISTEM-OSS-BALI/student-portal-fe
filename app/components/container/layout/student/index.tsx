"use client";

import {
  Avatar,
  Badge,
  Drawer,
  Dropdown,
  Input,
  Layout,
  Menu,
  Tag,
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
import { MainBreadcrumb } from "@/app/components/common/breadscrumb";
import { normalizedRole } from "@/app/utils/normalized";
import styles from "./layout.module.css";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChatMentions, useMarkMentionRead } from "@/app/hooks/use-chat";
import { SiderStudent } from "../../sider/student";

const { Header, Content, Footer } = Layout;

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
  const { data: usersData } = useUsers({ enabled: Boolean(user_id) });
  const { data: mentionMessages, refetch: refetchMentions } = useChatMentions({
    enabled: Boolean(user_id),
    user_id: user_id,
  });
  const { onMarkRead } = useMarkMentionRead();

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (usersData ?? []).forEach((user) => {
      if (user.id) map.set(String(user.id), user.name);
    });
    return map;
  }, [usersData]);

  const unreadCount = useMemo(
    () => (mentionMessages ?? []).filter((item) => !item.is_read).length,
    [mentionMessages],
  );

  const openDrawerInbox = () => {
    setOpenInbox(true);
    refetchMentions();
  };

  const closeFrawerInbox = () => {
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
  }) => {
    await onMarkRead(item.id);
    if (!item.context_user_id) {
      return;
    }
    router.push(resolveStudentDetailPath(item.context_user_id));
    closeFrawerInbox();
  };

  const menu = (
    <Menu>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        onClick={() => {
          logout();
          router.push("/login");
        }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

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
                allowClear
                placeholder="Cari mahasiswa, berkas, atau pengumuman"
                prefix={<SearchOutlined />}
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
                overlay={menu}
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
            OSS Student Portal • Admission Dashboard
          </Footer>
        </Layout>
      </Layout>

      <Drawer
        title="Inbox"
        open={openInbox}
        onClose={() => closeFrawerInbox()}
        placement="left"
        width={600}
      >
        <div className={styles.inboxList}>
          {mentionMessages?.length ? (
            mentionMessages.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  handleOpenMention({
                    id: item.id,
                    context_user_id: item.context_user_id,
                  })
                }
                className={`${styles.inboxItem} ${
                  item.is_read ? styles.inboxItemRead : styles.inboxItemUnread
                }`}
              >
                <div className={styles.inboxHeader}>
                  <Typography.Text className={styles.inboxTitle}>
                    Student{" "}
                    {item.context_user_name ||
                      (item.context_user_id
                        ? userNameMap.get(item.context_user_id)
                        : undefined) ||
                      "Student"}
                  </Typography.Text>
                  {!item.is_read && (
                    <Tag color="gold" className={styles.inboxTag}>
                      Baru
                    </Tag>
                  )}
                </div>
                <Typography.Text className={styles.inboxMeta}>
                  {item.sender_name
                    ? `Dari ${item.sender_name}`
                    : "Mention baru"}
                </Typography.Text>
                <Typography.Text className={styles.inboxPreview}>
                  {item.text || "Lampiran baru"}
                </Typography.Text>
                <Typography.Text className={styles.inboxTime}>
                  {new Date(item.created_at).toLocaleString()}
                </Typography.Text>
              </button>
            ))
          ) : (
            <div className={styles.inboxEmpty}>
              <Typography.Text type="secondary">
                Belum ada mention.
              </Typography.Text>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
