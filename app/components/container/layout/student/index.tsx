"use client";

import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Image,
  Layout,
  Modal,
  Typography,
  message,
} from "antd";
import {
  FileTextOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  MessageOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import getInitials from "@/app/utils/initials-username";
import { useAuth } from "@/app/utils/use-auth";
import {
  usePatchDocumentConsent,
  useUser,
  useUsers,
} from "@/app/hooks/use-users";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import { useChatMentions, useMarkMentionRead } from "@/app/hooks/use-chat";
import { useTicketMessages } from "@/app/hooks/use-ticket-message";
import InboxDrawer from "@/app/components/common/inbox-drawer";
import GlobalSearchModal, {
  type GlobalSearchItem,
} from "@/app/components/common/global-search-modal";
import { normalizedRole } from "@/app/utils/normalized";
import { supabase } from "@/app/vendor/supabase-client";
import styles from "./layout.module.css";

const { Header, Content, Footer } = Layout;

type CanvasPointerEvent =
  | React.MouseEvent<HTMLCanvasElement>
  | React.TouchEvent<HTMLCanvasElement>;

const DOCUMENT_CONSENT_BUCKET = "student-portal";
const DOCUMENT_CONSENT_FOLDER = "document-consent-signatures";
const SIGNATURE_CANVAS_HEIGHT = 220;
const SEARCH_REDIRECT_PATH = "/student/dashboard/home";

function formatSearchDate(value?: string | null): string {
  if (!value) {
    return "Tanpa tanggal";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tanpa tanggal";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPriorityLabel(priority?: string | null): string {
  const value = String(priority ?? "normal")
    .trim()
    .toLowerCase();

  if (!value) {
    return "Normal Priority";
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)} Priority`;
}

function getPriorityColor(priority?: string | null): string {
  const value = String(priority ?? "normal")
    .trim()
    .toLowerCase();

  if (value === "high") {
    return "red";
  }

  if (value === "medium") {
    return "orange";
  }

  if (value === "low") {
    return "blue";
  }

  return "default";
}

function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  return fetch(dataUrl)
    .then((response) => response.blob())
    .then((blob) => new File([blob], filename, { type: "image/png" }));
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
  const pathname = usePathname();
  const { role, logout, user_id } = useAuth();

  const [openInbox, setOpenInbox] = useState(false);
  const [openGlobalSearch, setOpenGlobalSearch] = useState(false);
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureError, setSignatureError] = useState("");
  const [isDocumentConsentModalOpen, setIsDocumentConsentModalOpen] =
    useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasSignatureRef = useRef(false);

  const { data: usersData } = useUsers({ enabled: Boolean(user_id) });
  const { data: informationData = [] } = useInformationCountries({
    enabled: Boolean(user_id),
  });
  const { data: mentionMessages, refetch: refetchMentions } = useChatMentions({
    enabled: Boolean(user_id),
    user_id,
  });
  const { data: detailUser } = useUser({
    id: user_id,
  });
  const { onMarkRead } = useMarkMentionRead();
  const { data: ticketMessages = [] } = useTicketMessages({
    enabled: Boolean(user_id),
    withNotification: false,
  });
  const { onUpdate, onUpdateLoading } = usePatchDocumentConsent();

  const shouldShowDocumentConsentModal =
    detailUser?.document_consent_signed === false;

  useEffect(() => {
    setIsDocumentConsentModalOpen(shouldShowDocumentConsentModal);
  }, [shouldShowDocumentConsentModal]);

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();

    (usersData ?? []).forEach((user) => {
      if (user.id) {
        map.set(String(user.id), user.name);
      }
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

  const unreadCount = useMemo(() => {
    return (mentionMessages ?? []).filter((item) => !item.is_read).length;
  }, [mentionMessages]);

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
      href: SEARCH_REDIRECT_PATH,
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
      title: item.sender_name
        ? `Mention from ${item.sender_name}`
        : "Mention inbox",
      subtitle: item.context_user_name
        ? `Student case • ${item.context_user_name}`
        : "Inbox notification",
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

  const menuItems = useMemo(
    () => [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        onClick: () => {
          logout();
          router.push("/login");
        },
      },
    ],
    [logout, router],
  );

  const navigationItems = useMemo(
    () => [
      {
        key: "/student/dashboard/home",
        label: "Home",
        icon: <HomeOutlined />,
      },
      {
        key: "/student/dashboard/upload-personal-information",
        label: "Personal Info",
        icon: <UserOutlined />,
      },
      {
        key: "/student/dashboard/upload-country-document",
        label: "Documents",
        icon: <FileTextOutlined />,
      },
      {
        key: "/student/dashboard/chat",
        label: "Chat",
        icon: <MessageOutlined />,
      },
    ],
    [],
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

  const initSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const parentWidth = canvas.parentElement?.clientWidth ?? 680;
    const width = Math.max(parentWidth, 320);
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = width * ratio;
    canvas.height = SIGNATURE_CANVAS_HEIGHT * ratio;
    canvas.style.width = "100%";
    canvas.style.height = `${SIGNATURE_CANVAS_HEIGHT}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(ratio, ratio);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, SIGNATURE_CANVAS_HEIGHT);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2;
    context.strokeStyle = "#111827";

    hasSignatureRef.current = false;
    setSignatureError("");
  };

  const getCanvasPoint = (event: CanvasPointerEvent) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];

      if (!touch) {
        return { x: 0, y: 0 };
      }

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: CanvasPointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const point = getCanvasPoint(event);

    context.beginPath();
    context.moveTo(point.x, point.y);

    setIsDrawing(true);
    setSignatureError("");
  };

  const drawSignature = (event: CanvasPointerEvent) => {
    if (!isDrawing) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const point = getCanvasPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
    hasSignatureRef.current = true;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    initSignatureCanvas();
  };

  const uploadSignatureToSupabase = async (dataUrl: string) => {
    if (!user_id) {
      throw new Error("User tidak ditemukan.");
    }

    const timestamp = Date.now();
    const fileName = `document-consent-signature-${user_id}-${timestamp}.png`;
    const filePath = `${DOCUMENT_CONSENT_FOLDER}/${user_id}/${fileName}`;
    const file = await dataUrlToFile(dataUrl, fileName);

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_CONSENT_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from(DOCUMENT_CONSENT_BUCKET)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Gagal mendapatkan URL tanda tangan.");
    }

    return data.publicUrl;
  };

  const resetDocumentConsentForm = () => {
    setIsConsentChecked(false);
    setSignatureError("");
    setIsDrawing(false);
    hasSignatureRef.current = false;
  };

  const handleSubmitDocumentConsent = async () => {
    if (!user_id) {
      message.error("User tidak ditemukan.");
      return;
    }

    if (!isConsentChecked) {
      message.error("Anda harus menyetujui term and condition.");
      return;
    }

    if (!hasSignatureRef.current) {
      setSignatureError("Tanda tangan wajib diisi.");
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      message.error("Canvas tanda tangan tidak tersedia.");
      return;
    }

    try {
      const signatureDataUrl = canvas.toDataURL("image/png");
      const signatureUrl = await uploadSignatureToSupabase(signatureDataUrl);

      await onUpdate({
        id: user_id,
        payload: {
          document_consent_signature_url: signatureUrl,
          document_consent_signed_at: new Date().toISOString(),
          document_consent_signed: true,
        },
      });

      message.success("Persetujuan dokumen berhasil disimpan.");
      resetDocumentConsentForm();
      setIsDocumentConsentModalOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal menyimpan persetujuan dokumen.";

      message.error(errorMessage);
    }
  };

  useEffect(() => {
    if (!isDocumentConsentModalOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      initSignatureCanvas();
    }, 100);

    const handleResize = () => {
      if (!hasSignatureRef.current) {
        initSignatureCanvas();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [isDocumentConsentModalOpen]);

  return (
    <>
      <Layout className={styles.root}>
        <Header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.brandBlock}>
              <div className={styles.brandLogo}>
                <Image
                  src="/assets/images/icon.png"
                  alt="logo"
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <Typography.Title level={4} className={styles.brandTitle}>
                  Bali Student Portal
                </Typography.Title>
                <Typography.Text className={styles.brandSubtitle}>
                  Student Dashboard
                </Typography.Text>
              </div>
            </div>

            <div className={styles.headerTools}>
              <div className={styles.navList}>
                {navigationItems.map((item) => {
                  const isActive = pathname === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => router.push(item.key)}
                      className={`${styles.navButton} ${
                        isActive ? styles.navButtonActive : ""
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <Badge count={unreadCount} size="small">
                <button
                  className={styles.iconButton}
                  type="button"
                  onClick={openDrawerInbox}
                >
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
                    size={42}
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
          </div>
        </Header>

        <Content className={styles.content}>
          <div className={styles.container}>
            <div className={styles.pageShell}>{children}</div>
          </div>
        </Content>

        <Footer className={styles.footer}>
          OSS Student Portal • Student Dashboard
        </Footer>
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
        onClose={closeDrawerInbox}
        items={mentionMessages ?? []}
        userNameMap={userNameMap}
        onMarkItemRead={onMarkRead}
        onOpenItem={handleOpenMention}
      />

      <Modal
        title="Persetujuan Penyerahan Dokumen"
        open={isDocumentConsentModalOpen}
        footer={null}
        closable={false}
        maskClosable={false}
        keyboard={false}
        width={760}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <Typography.Paragraph style={{ marginBottom: 0, color: "#4b5563" }}>
            Mohon baca dan setujui ketentuan berikut sebelum melanjutkan proses
            penyerahan dokumen.
          </Typography.Paragraph>

          <div
            style={{
              maxHeight: 240,
              overflowY: "auto",
              padding: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "#f9fafb",
            }}
          >
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Terms and Conditions
            </Typography.Title>

            <ol
              style={{
                margin: 0,
                paddingLeft: 18,
                color: "#374151",
                lineHeight: 1.8,
              }}
            >
              <li>
                Saya menyatakan bahwa seluruh dokumen yang saya serahkan adalah
                benar, valid, dan sesuai dengan identitas saya.
              </li>
              <li>
                Saya memahami bahwa dokumen yang tidak valid, tidak lengkap,
                atau tidak terbaca dapat menyebabkan keterlambatan proses
                aplikasi.
              </li>
              <li>
                Saya memberikan persetujuan kepada pihak terkait untuk melakukan
                verifikasi terhadap dokumen yang saya unggah.
              </li>
              <li>
                Saya memahami bahwa tanda tangan digital pada halaman ini
                merupakan bentuk persetujuan resmi atas penyerahan dokumen.
              </li>
              <li>
                Saya bersedia melengkapi dokumen tambahan apabila diminta pada
                tahap verifikasi berikutnya.
              </li>
            </ol>
          </div>

          <Checkbox
            checked={isConsentChecked}
            onChange={(event) => setIsConsentChecked(event.target.checked)}
          >
            Saya telah membaca, memahami, dan menyetujui seluruh ketentuan di
            atas.
          </Checkbox>

          <div>
            <Typography.Text strong>Tanda Tangan</Typography.Text>

            <div
              style={{
                marginTop: 8,
                border: `1px solid ${signatureError ? "#ff4d4f" : "#d9d9d9"}`,
                borderRadius: 12,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  height: SIGNATURE_CANVAS_HEIGHT,
                  display: "block",
                  touchAction: "none",
                  cursor: "crosshair",
                  background: "#ffffff",
                }}
                onMouseDown={startDrawing}
                onMouseMove={drawSignature}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={drawSignature}
                onTouchEnd={stopDrawing}
              />
            </div>

            {signatureError ? (
              <Typography.Text style={{ color: "#ff4d4f", fontSize: 12 }}>
                {signatureError}
              </Typography.Text>
            ) : (
              <Typography.Text style={{ color: "#6b7280", fontSize: 12 }}>
                Silakan tanda tangan pada area di atas menggunakan mouse atau
                layar sentuh.
              </Typography.Text>
            )}
          </div>

          <Divider style={{ margin: 0 }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Button onClick={clearSignature}>Clear Signature</Button>

            <Button
              type="primary"
              loading={onUpdateLoading}
              onClick={handleSubmitDocumentConsent}
              disabled={!isConsentChecked}
            >
              Saya Setuju dan Lanjutkan
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
