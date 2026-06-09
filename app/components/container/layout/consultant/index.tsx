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
  InboxOutlined,
  LockOutlined,
  LogoutOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import getInitials from "@/app/utils/initials-username";
import { useAuth } from "@/app/utils/use-auth";
import { useUserRoleStudents } from "@/app/hooks/use-users";
import { useChatMentions, useMarkMentionRead } from "@/app/hooks/use-chat";
import InboxDrawer from "@/app/components/common/inbox-drawer";
import GlobalSearchModal, {
  type GlobalSearchItem,
} from "@/app/components/common/global-search-modal";
import { MainBreadcrumb } from "@/app/components/common/breadscrumb";
import { normalizedRole } from "@/app/utils/normalized";
import type { UserDataModel } from "@/app/models/user";
import { SiderConsultant } from "../../sider/consultant";
import styles from "../director/layout.module.css";

const { Header, Content, Footer } = Layout;

function getStudentSearchStatus(student: UserDataModel): string {
  return String(
    student.student_status ?? student.status ?? student.visa_status ?? "On Going",
  );
}

export default function ConsultantLayout({
  children,
  username,
}: {
  children: React.ReactNode;
  username: string;
}) {
  const router = useRouter();
  const { role, logout, user_id } = useAuth();

  const [openInbox, setOpenInbox] = useState(false);
  const [openGlobalSearch, setOpenGlobalSearch] = useState(false);

  const { data: studentsData = [] } = useUserRoleStudents({
    enabled: Boolean(user_id),
  });
  const { data: mentionMessages, refetch: refetchMentions } = useChatMentions({
    enabled: Boolean(user_id),
    user_id,
  });
  const { onMarkRead } = useMarkMentionRead();

  const unreadCount = useMemo(
    () => (mentionMessages ?? []).filter((item) => !item.is_read).length,
    [mentionMessages],
  );

  const resolveStudentDetailPath = useCallback((studentId: string) => {
    return `/consultant/dashboard/students-management/detail/${studentId}`;
  }, []);

  const handleOpenMention = async (item: {
    id: string;
    context_user_id?: string | null;
  }) => {
    await onMarkRead(item.id);
    if (!item.context_user_id) return;
    router.push(`${resolveStudentDetailPath(item.context_user_id)}?tab=overview`);
    setOpenInbox(false);
  };

  const searchItems = useMemo<GlobalSearchItem[]>(() => {
    return studentsData.map((student) => ({
      id: `student-${student.id}`,
      type: "student" as const,
      title: student.name,
      subtitle: [
        student.stage?.country?.name,
        student.name_campus,
        student.visa_type ? student.visa_type.replace(/_/g, " ").toUpperCase() : undefined,
      ]
        .filter(Boolean)
        .join(" • "),
      description: student.email,
      meta: `Status: ${getStudentSearchStatus(student)}`,
      badge: "Student",
      badgeColor: "blue",
      href: resolveStudentDetailPath(String(student.id)),
      keywords: [
        student.name,
        student.email,
        student.no_phone,
        student.name_campus,
        student.degree,
        student.name_degree,
        student.visa_type,
        student.stage?.country?.name,
        student.student_status,
        student.status,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  }, [resolveStudentDetailPath, studentsData]);

  const handleOpenSearchItem = useCallback(
    (item: GlobalSearchItem) => {
      if (item.href) {
        router.push(item.href);
      }
      setOpenGlobalSearch(false);
    },
    [router],
  );

  const profileMenuItems = [
    {
      key: "change-password",
      icon: <LockOutlined />,
      label: "Change Password",
      onClick: () => {
        router.push("/consultant/dashboard/change-password");
      },
    },
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
        <SiderConsultant />
        <Layout className={styles.main}>
          <Header className={styles.header}>
            <div className={styles.headerLeft}>
              <MainBreadcrumb />
            </div>
            <div className={styles.headerRight}>
              <Input
                className={styles.search}
                readOnly
                placeholder="Cari mahasiswa, berkas, atau pipeline..."
                prefix={<SearchOutlined />}
                suffix={<span className={styles.searchHint}>Search</span>}
                onClick={() => setOpenGlobalSearch(true)}
                onFocus={(event) => {
                  event.target.blur();
                  setOpenGlobalSearch(true);
                }}
              />

              <Badge
                count={unreadCount}
                size="small"
                className={styles.badge}
                onClick={() => {
                  setOpenInbox(true);
                  refetchMentions();
                }}
              >
                <button
                  type="button"
                  className={styles.iconButton}
                >
                  <InboxOutlined />
                </button>
              </Badge>

              <Dropdown
                menu={{ items: profileMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <button type="button" className={styles.userTrigger}>
                  <Avatar size={48} className={styles.avatar}>
                    {getInitials(username || "Consultant")}
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
            OSS Student Portal • Consultant Dashboard
          </Footer>
        </Layout>
      </Layout>

      <InboxDrawer
        open={openInbox}
        onClose={() => setOpenInbox(false)}
        items={mentionMessages ?? []}
        onOpenItem={handleOpenMention}
        onMarkItemRead={onMarkRead}
      />

      <GlobalSearchModal
        open={openGlobalSearch}
        onClose={() => setOpenGlobalSearch(false)}
        items={searchItems}
        onOpenItem={handleOpenSearchItem}
        title="Consultant Search"
      />
    </div>
  );
}
