"use client";

import {
  Avatar,
  Badge,
  Drawer,
  Dropdown,
  Layout,
} from "antd";
import Image from "next/image";
import {
  AppstoreOutlined,
  BellOutlined,
  DownOutlined,
  GlobalOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import getInitials from "@/app/utils/initials-username";

import { useAuth } from "@/app/utils/use-auth";
import { useUserRoleStudents, useUsers } from "@/app/hooks/use-users";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import styles from "../admission/layout.module.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChatMentions, useMarkMentionRead } from "@/app/hooks/use-chat";
import { useTicketMessages } from "@/app/hooks/use-ticket-message";
import InboxDrawer from "@/app/components/common/inbox-drawer";
import GlobalSearchModal, {
  type GlobalSearchItem,
} from "@/app/components/common/global-search-modal";
import type { UserDataModel } from "@/app/models/user";
import {
  getCountryBadgeMeta,
  getCountryName,
  getStudentAvatarUrl,
  getStudentInitials,
  getStudentPipelineStatus,
} from "@/app/utils/student-helpers";

const { Header, Content } = Layout;

function formatVisaTypeLabel(value?: string | null): string | undefined {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;

  if (trimmed.includes(" ") && !trimmed.includes("_")) {
    return trimmed;
  }

  return trimmed.replace(/_/g, " ").toUpperCase();
}

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

function getStudentSearchStatus(student: UserDataModel): string {
  return String(
    student.student_status ?? student.status ?? student.visa_status ?? "On Going",
  );
}

export default function DirectorLayout({
  children,
  username,
  userProfilePic,
}: {
  children: React.ReactNode;
  username: string;
  userProfilePic?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, logout, user_id } = useAuth();

  const [openInbox, setOpenInbox] = useState(false);
  const [openGlobalSearch, setOpenGlobalSearch] = useState(false);
  const [openMobileNav, setOpenMobileNav] = useState(false);

  const navigateFromMobile = (path: string) => {
    setOpenMobileNav(false);
    router.push(path);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenGlobalSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: usersData } = useUsers({ enabled: Boolean(user_id) });
  const { data: studentsData = [] } = useUserRoleStudents({
    enabled: Boolean(user_id),
  });
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

  const displayUserName = useMemo(() => {
    if (!username) return "Director";
    const cleaned = username.replace(/^(admin|director)\s+/i, "").trim();
    return cleaned || "Director";
  }, [username]);

  const openDrawerInbox = () => {
    setOpenInbox(true);
    refetchMentions();
  };

  const closeDrawerInbox = () => {
    setOpenInbox(false);
  };

  const resolveStudentDetailPath = useCallback(
    (studentId: string) => {
      return `/director/dashboard/students-management/detail/${studentId}`;
    },
    [],
  );

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
    const params = new URLSearchParams();
    if (item.conversation_id) {
      params.set("tab", "chat");
      params.set("conversation_id", item.conversation_id);
    } else {
      params.set("tab", "overview");
    }

    router.push(`${targetPath}?${params.toString()}`);
    closeDrawerInbox();
  };

  const searchItems = useMemo<GlobalSearchItem[]>(() => {
    const studentItems = studentsData.map((student) => {
      const country = getCountryName(student);
      const countryMeta = getCountryBadgeMeta(country);
      const pipelineStatus = getStudentPipelineStatus(student);
      const avatarUrl = getStudentAvatarUrl(student);
      const initials = getStudentInitials(student);

      return {
        id: `student-${student.id}`,
        type: "student" as const,
        title: student.name,
        subtitle: [
          country !== "-" ? country : null,
          student.name_campus,
          formatVisaTypeLabel(student.visa_type_name ?? student.visa_type),
        ]
          .filter(Boolean)
          .join(" • "),
        description: student.email,
        meta: `Status: ${pipelineStatus.label}`,
        badge: "Mahasiswa",
        badgeColor: "blue",
        href: resolveStudentDetailPath(String(student.id)),
        avatarUrl,
        initials,
        country: country !== "-" ? country : undefined,
        countryCode: countryMeta.code,
        countryColor: countryMeta.color,
        countryBg: countryMeta.bg,
        countryBorder: countryMeta.border,
        campus: student.name_campus,
        degree: student.name_degree || student.degree,
        visaType: formatVisaTypeLabel(
          student.visa_type_name ?? student.visa_type,
        ),
        phone: student.no_phone,
        email: student.email,
        statusLabel: pipelineStatus.label,
        statusTone: pipelineStatus.tone,
        keywords: [
          student.name,
          student.email,
          student.no_phone,
          student.name_campus,
          student.degree,
          student.name_degree,
          student.visa_type_name ?? student.visa_type,
          country,
          student.student_status,
          student.status,
        ]
          .filter(Boolean)
          .join(" "),
      };
    });

    const infoItems = informationData.map((item) => ({
      id: `update-${item.id}`,
      type: "update" as const,
      title: item.title,
      subtitle: [item.country?.name, item.slug].filter(Boolean).join(" • "),
      description: item.description ?? "Tidak ada deskripsi",
      meta: `Updated ${formatSearchDate(item.updated_at)}`,
      badge: formatPriorityLabel(item.priority),
      badgeColor: getPriorityColor(item.priority),
      href: "/director/dashboard/information-country-management",
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
      keywords: [
        item.sender_name,
        item.context_user_name,
        item.text,
        userNameMap.get(String(item.sender_id)),
      ]
        .filter(Boolean)
        .join(" "),
    }));

    return [...studentItems, ...infoItems, ...mentionItems];
  }, [informationData, mentionMessages, resolveStudentDetailPath, studentsData, userNameMap]);

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
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
      onClick: () => {
        router.push("/director/dashboard/profile");
      },
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
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
        <Layout className={styles.main}>
          <Header className={styles.topNavbar}>
            <div className={styles.brandWrapper}>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setOpenMobileNav(true)}
                aria-label="Menu Navigasi"
              >
                <MenuOutlined />
              </button>
              <div
                className={styles.brand}
                onClick={() => router.push("/director/dashboard/home")}
              >
                <Image
                  src="/assets/images/icon.png"
                  alt="OSS Bali"
                  width={36}
                  height={36}
                  className={styles.brandLogoImg}
                  priority
                  unoptimized
                />
                <span className={styles.brandTitle}>OSS Bali Student Portal</span>
              </div>
            </div>

            <nav className={styles.navCenter}>
              <button
                type="button"
                className={`${styles.navButton} ${
                  pathname?.includes("/students-management")
                    ? styles.navButtonActive
                    : ""
                }`}
                onClick={() =>
                  router.push("/director/dashboard/students-management")
                }
              >
                <AppstoreOutlined style={{ fontSize: 14 }} />
                <span>Pipeline</span>
              </button>

              <button
                type="button"
                className={`${styles.navButton} ${
                  pathname?.includes("/information-country-management")
                    ? styles.navButtonActive
                    : ""
                }`}
                onClick={() =>
                  router.push(
                    "/director/dashboard/information-country-management",
                  )
                }
              >
                <GlobalOutlined style={{ fontSize: 14 }} />
                <span>Country Information</span>
              </button>
            </nav>

            <div className={styles.topNavRight}>
              <div
                className={styles.searchTrigger}
                onClick={() => setOpenGlobalSearch(true)}
                role="button"
                tabIndex={0}
                title="Cari data siswa, ID, atau dokumen (⌘K)"
              >
                <SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />
                <span className={styles.searchPlaceholder}>
                  Cari siswa, dokumen...
                </span>
                <span className={styles.searchKbd}>⌘K</span>
              </div>

              <Badge
                dot={unreadCount > 0}
                count={unreadCount}
                size="small"
                offset={[-2, 2]}
              >
                <button
                  className={styles.navIconBtn}
                  type="button"
                  aria-label="Notifications"
                  title="Notifikasi Mention & Chat"
                  onClick={() => openDrawerInbox()}
                >
                  <BellOutlined />
                </button>
              </Badge>

              <div className={styles.verticalDivider} />

              <Dropdown
                menu={{ items: menuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <div className={styles.userContainer}>
                  <Avatar
                    size={30}
                    src={userProfilePic || undefined}
                    className={styles.userAvatar}
                  >
                    {!userProfilePic && getInitials(displayUserName)}
                  </Avatar>
                  <span className={styles.userNameLabel}>
                    {displayUserName}
                  </span>
                  <DownOutlined style={{ fontSize: 9, color: "#94a3b8" }} />
                </div>
              </Dropdown>
            </div>
          </Header>

          <Content style={{ background: "#f8fafc", minHeight: "calc(100vh - 64px)" }}>
            <div className={styles.mainContent}>{children}</div>
          </Content>
        </Layout>
      </Layout>

      <GlobalSearchModal
        open={openGlobalSearch}
        onClose={() => setOpenGlobalSearch(false)}
        items={searchItems}
        onOpenItem={handleOpenSearchItem}
        title="Director Search"
      />

      <InboxDrawer
        open={openInbox}
        onClose={() => closeDrawerInbox()}
        items={mentionMessages ?? []}
        userNameMap={userNameMap}
        onMarkItemRead={onMarkRead}
        onOpenItem={handleOpenMention}
      />

      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image
              src="/assets/images/icon.png"
              alt="OSS Bali"
              width={28}
              height={28}
              unoptimized
            />
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                OSS Bali Portal
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Director Workspace
              </div>
            </div>
          </div>
        }
        placement="left"
        open={openMobileNav}
        onClose={() => setOpenMobileNav(false)}
        width={300}
        styles={{
          body: {
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          },
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            overflowY: "auto",
          }}
        >
          <button
            type="button"
            className={`${styles.mobileDrawerItem} ${
              pathname === "/director/dashboard/home"
                ? styles.mobileDrawerItemActive
                : ""
            }`}
            onClick={() => navigateFromMobile("/director/dashboard/home")}
          >
            <HomeOutlined style={{ fontSize: 16 }} />
            <span>Executive Overview</span>
          </button>

          <button
            type="button"
            className={`${styles.mobileDrawerItem} ${
              pathname?.includes("/students-management")
                ? styles.mobileDrawerItemActive
                : ""
            }`}
            onClick={() =>
              navigateFromMobile("/director/dashboard/students-management")
            }
          >
            <AppstoreOutlined style={{ fontSize: 16 }} />
            <span>Student Pipeline</span>
          </button>

          <button
            type="button"
            className={`${styles.mobileDrawerItem} ${
              pathname?.includes("/information-country-management")
                ? styles.mobileDrawerItemActive
                : ""
            }`}
            onClick={() =>
              navigateFromMobile(
                "/director/dashboard/information-country-management",
              )
            }
          >
            <GlobalOutlined style={{ fontSize: 16 }} />
            <span>Country Information</span>
          </button>
        </div>

        <div className={styles.mobileDrawerFooter}>
          <div className={styles.mobileDrawerUser}>
            <Avatar
              size={36}
              src={userProfilePic || undefined}
              className={styles.userAvatar}
            >
              {!userProfilePic && getInitials(displayUserName)}
            </Avatar>
            <div className={styles.mobileDrawerUserText}>
              <span className={styles.mobileDrawerUserName}>
                {displayUserName}
              </span>
              <span className={styles.mobileDrawerUserRole}>
                {role || "Director"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.mobileDrawerItem}
            onClick={() => navigateFromMobile("/director/dashboard/profile")}
          >
            <UserOutlined style={{ fontSize: 15 }} />
            <span>My Profile</span>
          </button>

          <button
            type="button"
            className={styles.mobileDrawerLogoutBtn}
            onClick={() => {
              setOpenMobileNav(false);
              logout();
              router.push("/login");
            }}
          >
            <LogoutOutlined style={{ fontSize: 14 }} />
            <span>Logout</span>
          </button>
        </div>
      </Drawer>
    </div>
  );
}
