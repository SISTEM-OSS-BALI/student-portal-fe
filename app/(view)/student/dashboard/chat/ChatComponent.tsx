"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Tour,
  Typography,
  Upload,
  notification,
} from "antd";
import type { TourProps } from "antd";
import {
  ClockCircleOutlined,
  CloseOutlined,
  EditOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  TagOutlined,
  PaperClipOutlined as AttachmentIcon,
} from "@ant-design/icons";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useTicketMessages } from "@/app/hooks/use-ticket-message";
import {
  useChatMessages,
  useCreateChatConversation,
} from "@/app/hooks/use-chat";
import { useChatSocket } from "@/app/hooks/use-chat-socket";
import PageHeader from "@/app/components/common/page-header";
import type { ChatMessage } from "@/app/models/chat";
import type {
  TicketMessageDataModel,
  TicketMessagePayloadCreateModel,
} from "@/app/models/ticket-message";
import { useAuth } from "@/app/utils/use-auth";
import { usePageTour } from "@/app/hooks/use-page-tour";
import { useUser, useUsers } from "@/app/hooks/use-users";
import type { UserDataModel } from "@/app/models/user";
import {
  formatChatDateGroup,
  formatChatMessageTime,
  formatChatTimeOnly,
  getStudentAvatarUrl,
  isChatMessageEditable,
  isSameDay,
} from "@/app/utils/student-helpers";
import type { UploadedChatAttachment } from "@/app/vendor/chat-upload";
import { uploadChatFiles } from "@/app/vendor/chat-upload";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const getUserAvatarUrl = (user?: UserDataModel | null): string | undefined => {
  if (!user) return undefined;
  if (user.profile_picture_url && user.profile_picture_url.trim()) {
    return user.profile_picture_url.trim();
  }
  return getStudentAvatarUrl(user);
};

const ticketFormStyle = { marginBottom: 14 } satisfies React.CSSProperties;

const getTicketCode = (ticket: TicketMessageDataModel) => {
  const raw = String(ticket.id ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  return `TKT-ADMS-${raw.slice(-4).padStart(4, "0")}`;
};

const getInitials = (value?: string | null) => {
  const text = (value ?? "").trim();

  if (!text) return "TK";

  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((item) => item[0]?.toUpperCase() ?? "").join("");
};

const formatRoleLabel = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  return raw ? raw.replace(/_/g, " ").toUpperCase() : "UNKNOWN";
};

const getRoleTagColor = (value?: string | null) => {
  switch (formatRoleLabel(value)) {
    case "DIRECTOR":
      return "gold";
    case "ADMISSION":
      return "blue";
    case "STUDENT":
      return "green";
    default:
      return "default";
  }
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "Updated recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated recently";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Updated just now";
  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) return "Updated yesterday";

  return `Updated ${days} days ago`;
};

const formatMessageTime = (value?: string) => {
  return formatChatMessageTime(value);
};

const buildTicketSummary = (ticket: TicketMessageDataModel) => {
  return `Percakapan untuk ${ticket.name.toLowerCase()} dan tindak lanjut admission.`;
};

const extractConversationId = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined;

  const response = payload as {
    id?: unknown;
    data?: { id?: unknown; result?: { id?: unknown } };
    result?: { id?: unknown };
  };

  if (typeof response.data?.result?.id === "string") {
    return response.data.result.id;
  }
  if (typeof response.data?.id === "string") {
    return response.data.id;
  }
  if (typeof response.result?.id === "string") {
    return response.result.id;
  }
  if (typeof response.id === "string") {
    return response.id;
  }

  return undefined;
};

const isImageAttachment = (mimeType?: string) => {
  return mimeType?.startsWith("image/") ?? false;
};

const mergeChatMessages = (messages: ChatMessage[]) => {
  const map = new Map<string, ChatMessage>();

  messages.forEach((message) => {
    map.set(message.id, message);
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeA = Date.parse(a.created_at);
    const timeB = Date.parse(b.created_at);
    return timeA - timeB;
  });
};

function ChatBubbleItem({
  message,
  isMine,
  currentUserName,
  currentUserRole,
  senderAvatarUrl,
  onStartEdit,
}: {
  message: ChatMessage;
  isMine: boolean;
  currentUserName?: string;
  currentUserRole?: string;
  senderAvatarUrl?: string | null;
  onStartEdit?: (message: ChatMessage) => void;
}) {
  const senderName =
    message.sender_name ??
    (isMine ? (currentUserName ?? "Student") : "Admission Team");

  const senderRole =
    message.sender_role ??
    (isMine ? (currentUserRole ?? "STUDENT") : "ADMISSION");

  const avatarSrc =
    message.sender_profile_picture?.trim() ||
    senderAvatarUrl?.trim() ||
    undefined;

  const attachments = message.attachments ?? [];
  const time = formatChatTimeOnly(message.created_at);

  const avatarBg = isMine ? "#0f4f95" : "#f59e0b";
  const bubbleBg = isMine ? "#dcf8c6" : "#ffffff";
  const bubbleText = "#334155";
  const bubbleBorder = isMine ? "1px solid #b8e6a0" : "1px solid #e5e7eb";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMine ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: 12,
          maxWidth: "80%",
        }}
      >
        <Avatar
          size={40}
          src={avatarSrc}
          style={{
            background: avatarBg,
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
            border: "1px solid #e2e8f0",
          }}
        >
          {getInitials(senderName)}
        </Avatar>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isMine ? "flex-end" : "flex-start",
            minWidth: 0,
          }}
        >
          {!isMine && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
                paddingLeft: 2,
              }}
            >
              <Text
                strong
                style={{
                  fontSize: 13,
                  color: "#334155",
                  lineHeight: 1.2,
                }}
              >
                {senderName}
              </Text>

              <Tag
                color={getRoleTagColor(senderRole)}
                style={{
                  margin: 0,
                  borderRadius: 12,
                  paddingInline: 8,
                  height: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {formatRoleLabel(senderRole)}
              </Tag>
            </div>
          )}

          <div style={{ maxWidth: "100%", position: "relative" }}>
            <div
              style={{
                minWidth: attachments.length && !message.text ? 180 : 140,
                background: bubbleBg,
                color: bubbleText,
                border: bubbleBorder,
                borderRadius: isMine
                  ? "16px 6px 16px 16px"
                  : "6px 16px 16px 16px",
                padding:
                  attachments.length && !message.text
                    ? "12px 16px 8px"
                    : "12px 18px 8px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
              }}
            >
            {message.text ? (
              <Text
                style={{
                  color: bubbleText,
                  fontSize: 14,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {message.text}
                {message.edited_at && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      fontStyle: "italic",
                      marginLeft: 4,
                    }}
                  >
                    (diedit)
                  </Text>
                )}
              </Text>
            ) : null}

            {attachments.length ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: message.text ? 10 : 0,
                }}
              >
                {attachments.map((attachment) =>
                  isImageAttachment(attachment.mime_type) ? (
                    <Image
                      key={attachment.url}
                      src={attachment.url}
                      alt={attachment.name}
                      width={220}
                      style={{
                        borderRadius: 14,
                        border: isMine
                          ? "1px solid #dbe2ea"
                          : "1px solid rgba(255,255,255,0.22)",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <a
                      key={attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#2563eb",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 14,
                        lineHeight: 1.5,
                        wordBreak: "break-all",
                      }}
                    >
                      <AttachmentIcon
                        style={{
                          fontSize: 18,
                          color: bubbleText,
                          flexShrink: 0,
                        }}
                      />
                      <span>{attachment.name}</span>
                    </a>
                  ),
                )}
              </div>
            ) : null}

            {/* Jam di pojok kanan bawah bubble chat ala WhatsApp */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
                userSelect: "none",
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  color: isMine ? "#166534" : "#94a3b8",
                  lineHeight: 1,
                  fontWeight: 500,
                }}
              >
                {time}
              </span>
              {isMine && message.text && isChatMessageEditable(message.created_at, 15) && (
                <Button
                  type="text"
                  size="small"
                  icon={
                    <EditOutlined
                      style={{
                        fontSize: 11,
                        color: isMine ? "#166534" : "#64748b",
                      }}
                    />
                  }
                  onClick={() => onStartEdit?.(message)}
                  style={{
                    height: 18,
                    width: 18,
                    padding: 0,
                    minWidth: 18,
                  }}
                  title="Edit pesan (maks. 15 menit)"
                />
              )}
            </div>
            </div>
            <div
              style={{
                position: "absolute",
                top: 10,
                ...(isMine ? { right: -6 } : { left: -6 }),
                width: 12,
                height: 12,
                background: bubbleBg,
                borderBottom: bubbleBorder,
                borderRight: isMine ? bubbleBorder : "none",
                borderLeft: !isMine ? bubbleBorder : "none",
                transform: isMine ? "rotate(-35deg)" : "rotate(35deg)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatComponent() {
  const [form] = Form.useForm<TicketMessagePayloadCreateModel>();
  const { user_id } = useAuth();

  const { open: tourOpen, close: closeTour, restart: restartTour } = usePageTour(
    "student_tour_chat_done",
  );

  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    UploadedChatAttachment[]
  >([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEditMessage, setSavingEditMessage] = useState(false);
  const [localMessagesByConversation, setLocalMessagesByConversation] =
    useState<Record<string, ChatMessage[]>>({});
  const [conversationOverrides, setConversationOverrides] = useState<
    Record<string, string>
  >({});

  const {
    onCreate: createConversation,
    onCreateLoading: creatingConversation,
  } = useCreateChatConversation();

  const {
    data: tickets = [],
    fetchLoading,
    onCreate: createTicket,
    onCreateLoading,
    onUpdate: updateTicket,
  } = useTicketMessages({
    queryString: user_id ? `user_id=${user_id}` : undefined,
    enabled: Boolean(user_id),
  });

  const { data: currentAuthUser } = useUser({ id: user_id });
  const { data: users = [], fetchLoading: usersLoading } = useUsers({
    enabled: Boolean(user_id),
  });

  const currentUser = useMemo(() => {
    if (!user_id) return undefined;
    return users.find((user) => String(user.id) === String(user_id));
  }, [users, user_id]);

  const effectiveCurrentUser = currentAuthUser ?? currentUser;

  const effectiveConsultantName =
    effectiveCurrentUser?.name_consultant?.trim() || undefined;

  const { userAvatarMap, userAvatarByNameMap } = useMemo(() => {
    const idMap = new Map<string, string>();
    const nameMap = new Map<string, string>();

    const registerUser = (u?: UserDataModel | null) => {
      if (!u) return;
      const url = getUserAvatarUrl(u);
      if (!url) return;
      if (u.id) idMap.set(String(u.id), url);
      if (u.name) nameMap.set(u.name.trim().toLowerCase(), url);
    };

    registerUser(effectiveCurrentUser);
    users.forEach((u) => registerUser(u));

    return { userAvatarMap: idMap, userAvatarByNameMap: nameMap };
  }, [effectiveCurrentUser, users]);

  const admissionUsers = useMemo(() => {
    return users.filter(
      (user) =>
        Boolean(user.id) &&
        String(user.role).trim().toUpperCase() === "ADMISSION",
    );
  }, [users]);

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const timeA = Date.parse(a.updated_at);
      const timeB = Date.parse(b.updated_at);
      return timeB - timeA;
    });
  }, [tickets]);

  const selectedTicket =
    sortedTickets.find((ticket) => ticket.id === selectedTicketId) ??
    sortedTickets[0];

  const selectedConversationId = selectedTicket
    ? (conversationOverrides[selectedTicket.id] ??
      selectedTicket.conversation_id)
    : undefined;

  const { data: fetchedMessages = [], fetchLoading: messagesLoading } =
    useChatMessages({
      conversation_id: selectedConversationId,
    });

  const handleIncomingMessage = useCallback((message: ChatMessage) => {
    const key = message.conversation_id;
    if (!key) return;

    setLocalMessagesByConversation((prev) => ({
      ...prev,
      [key]: mergeChatMessages([...(prev[key] ?? []), message]),
    }));
  }, []);

  useChatSocket({
    conversation_id: selectedConversationId,
    onMessage: handleIncomingMessage,
  });

  const mergedMessages = useMemo(() => {
    if (!selectedConversationId) return [] as ChatMessage[];

    return mergeChatMessages([
      ...fetchedMessages,
      ...(localMessagesByConversation[selectedConversationId] ?? []),
    ]);
  }, [fetchedMessages, localMessagesByConversation, selectedConversationId]);

  const tourSteps: TourProps["steps"] = useMemo(() => {
    return [
      {
        title: "Chat dengan Tim Admission",
        description:
          "Gunakan fitur chat ini untuk berkomunikasi langsung dengan tim admission kamu.",
        target: null,
      },
      {
        title: "Daftar Subject / Ticket",
        description:
          "Semua ticket percakapan kamu tampil di sini. Klik salah satu untuk membuka riwayat chat.",
        target: () => document.getElementById("chat-ticket-list")!,
        placement: "right",
      },
      {
        title: "Buat Ticket Baru",
        description:
          "Klik tombol ini untuk membuat ticket percakapan baru dengan tim admission.",
        target: () => document.getElementById("chat-new-ticket-btn")!,
        placement: "bottom",
      },
      ...(selectedTicket
        ? [
            {
              title: "Area Pesan",
              description:
                "Riwayat pesan dengan tim admission ditampilkan di sini. Pesan kamu muncul di kanan, pesan dari admission di kiri.",
              target: () => document.getElementById("chat-messages-area")!,
              placement: "top" as const,
            },
            {
              title: "Kirim Pesan",
              description:
                "Ketik pesanmu di sini. Tekan Enter untuk mengirim, atau Shift+Enter untuk baris baru. Kamu juga bisa melampirkan file.",
              target: () => document.getElementById("chat-input-area")!,
              placement: "top" as const,
            },
          ]
        : []),
    ];
  }, [selectedTicket]);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    form.resetFields();
    setModalVisible(false);
  };

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setChatText("");
    setPendingAttachments([]);
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleStartEditMessage = useCallback((message: ChatMessage) => {
    if (!isChatMessageEditable(message.created_at, 15)) {
      notification.warning({
        message: "Waktu edit telah habis",
        description:
          "Pesan pada chat student hanya dapat diedit maksimal 15 menit setelah dikirim.",
      });
      return;
    }
    setEditingMessageId(message.id);
    setEditingText(message.text ?? "");
  }, []);

  const handleCancelEditMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditingText("");
  }, []);

  const handleSaveEditMessage = useCallback(async () => {
    if (!editingMessageId) return;
    const targetMsg = mergedMessages.find((m) => m.id === editingMessageId);
    if (targetMsg && !isChatMessageEditable(targetMsg.created_at, 15)) {
      notification.error({
        message: "Waktu edit telah habis",
        description:
          "Pesan pada chat student hanya dapat diedit maksimal 15 menit setelah dikirim.",
      });
      setEditingMessageId(null);
      setEditingText("");
      return;
    }

    const text = editingText.trim();
    if (!text) return;

    setSavingEditMessage(true);

    try {
      const result = await api.put(`/api/chats/messages/${editingMessageId}`, {
        text,
      });
      const updated = (result.data?.result ?? result.data) as ChatMessage;
      const key = updated.conversation_id;

      if (key) {
        setLocalMessagesByConversation((prev) => ({
          ...prev,
          [key]: mergeChatMessages([...(prev[key] ?? []), updated]),
        }));
        queryClient.invalidateQueries({
          queryKey: ["chat-messages", key],
        });
      }

      notification.success({
        message: "Pesan berhasil diedit",
      });
      setEditingMessageId(null);
      setEditingText("");
    } catch (error) {
      notification.error({
        message: "Gagal menyimpan perubahan",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      setSavingEditMessage(false);
    }
  }, [editingMessageId, editingText, mergedMessages, queryClient]);

  const sendMessageViaApi = useCallback(
    async (
      targetConversationId: string,
      text: string,
      attachments: UploadedChatAttachment[],
      options?: {
        mention_user_ids?: string[];
        context_user_id?: string;
        context_type?: string;
      },
    ) => {
      const result = await api.post(
        `/api/chats/conversations/${targetConversationId}/messages`,
        {
          type: text ? "text" : "file",
          text: text || undefined,
          mention_user_ids: options?.mention_user_ids ?? [],
          context_user_id: options?.context_user_id,
          context_type: options?.context_type,
          attachments: attachments.map((item) => ({
            url: item.url,
            name: item.name,
            mime_type: item.mime_type,
            size: item.size,
          })),
        },
      );

      return (result.data?.result ?? result.data) as ChatMessage;
    },
    [],
  );

  const createAdmissionConversation = useCallback(
    async (title: string) => {
      if (!user_id) {
        throw new Error("User login tidak ditemukan.");
      }

      if (!admissionUsers.length) {
        throw new Error("Belum ada user admission yang tersedia.");
      }

      const memberIds = Array.from(
        new Set([
          String(user_id),
          ...admissionUsers.map((user) => String(user.id)),
        ]),
      );

      const response = await createConversation({
        type: memberIds.length > 2 ? "group" : "direct",
        title,
        member_ids: memberIds,
      });

      const conversationId = extractConversationId(response);
      if (!conversationId) {
        throw new Error("Conversation chat tidak mengembalikan id yang valid.");
      }

      return conversationId;
    },
    [admissionUsers, createConversation, user_id],
  );

  const ensureConversationForTicket = useCallback(
    async (ticket: TicketMessageDataModel) => {
      const existingConversationId =
        conversationOverrides[ticket.id] ?? ticket.conversation_id;

      if (existingConversationId) {
        return existingConversationId;
      }

      const conversationId = await createAdmissionConversation(ticket.name);

      setConversationOverrides((prev) => ({
        ...prev,
        [ticket.id]: conversationId,
      }));

      await updateTicket({
        id: ticket.id,
        payload: {
          conversation_id: conversationId,
        },
      });

      return conversationId;
    },
    [conversationOverrides, createAdmissionConversation, updateTicket],
  );

  const handleCreateTicket = async (
    values: TicketMessagePayloadCreateModel,
  ) => {
    if (!user_id) return;

    if (usersLoading) {
      notification.info({
        message: "Memuat data admission",
        description: "Tunggu sebentar lalu coba lagi.",
      });
      return;
    }

    if (!admissionUsers.length) {
      notification.error({
        message: "Admission tidak ditemukan",
        description:
          "Belum ada user dengan role admission untuk dihubungkan ke chat.",
      });
      return;
    }

    try {
      const conversationId = await createAdmissionConversation(values.name);

      const ticketResponse = await createTicket({
        name: values.name,
        user_id,
        conversation_id: conversationId,
      });

      const createdTicket =
        ticketResponse?.data?.result ?? ticketResponse?.data ?? ticketResponse;

      if (createdTicket?.id) {
        setSelectedTicketId(String(createdTicket.id));
        setConversationOverrides((prev) => ({
          ...prev,
          [String(createdTicket.id)]: conversationId,
        }));
      }

      try {
        const initialMessage = await sendMessageViaApi(
          conversationId,
          `Halo tim admission, saya baru membuat ticket untuk ${values.name}. Mohon ditindaklanjuti.`,
          [],
          {
            mention_user_ids: admissionUsers.map((user) => String(user.id)),
            context_user_id: user_id,
            context_type: "student",
          },
        );

        setLocalMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: mergeChatMessages([
            ...(prev[conversationId] ?? []),
            initialMessage,
          ]),
        }));
      } catch (error) {
        notification.warning({
          message: "Ticket berhasil dibuat",
          description:
            error instanceof Error
              ? `Ticket sudah dibuat, tetapi notifikasi inbox admission gagal dikirim: ${error.message}`
              : "Ticket sudah dibuat, tetapi notifikasi inbox admission gagal dikirim.",
        });
      }

      notification.success({
        message: "Ticket berhasil dibuat",
        description:
          "Conversation sudah langsung terhubung ke tim admission dan notifikasi inbox telah dikirim.",
      });

      handleCloseModal();
    } catch (error) {
      notification.error({
        message: "Gagal membuat ticket",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat ticket.",
      });
    }
  };

  const handleAttachmentUpload = useCallback(async (file: File) => {
    setUploadingAttachments(true);

    try {
      const uploads = await uploadChatFiles([file], {
        folder: "attachment-chat",
      });

      setPendingAttachments((prev) => [...prev, ...uploads]);
    } catch (error) {
      notification.error({
        message: "Gagal mengunggah file",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      setUploadingAttachments(false);
    }

    return false;
  }, []);

  const handleRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!selectedTicket) {
      notification.warning({
        message: "Pilih ticket",
        description: "Pilih ticket dari daftar di kiri terlebih dahulu.",
      });
      return;
    }

    const text = chatText.trim();
    const attachments = [...pendingAttachments];

    if (!text && !attachments.length) return;

    try {
      setSendingMessage(true);

      const conversationId = await ensureConversationForTicket(selectedTicket);
      const message = await sendMessageViaApi(
        conversationId,
        text,
        attachments,
      );

      setLocalMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: mergeChatMessages([
          ...(prev[conversationId] ?? []),
          message,
        ]),
      }));

      setChatText("");
      setPendingAttachments([]);
    } catch (error) {
      notification.error({
        message: "Gagal mengirim pesan",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      setSendingMessage(false);
    }
  }, [
    chatText,
    ensureConversationForTicket,
    pendingAttachments,
    selectedTicket,
    sendMessageViaApi,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <PageHeader
        title="Pesan dan Bantuan"
        subtitle="Komunikasi langsung dengan staf admisi dan konsultan pendidikan"
        icon={<MessageOutlined />}
        headerExtra={
          <Button
            type="text"
            shape="circle"
            icon={<QuestionCircleOutlined style={{ fontSize: 18, color: "#94a3b8" }} />}
            onClick={restartTour}
            title="Panduan"
            aria-label="Panduan"
          />
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={9} xl={8}>
          <Card
            id="chat-ticket-list"
            loading={fetchLoading}
            style={{
              height: "100%",
              borderRadius: 20,
              borderColor: "#e2e8f0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              background: "#ffffff",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Space direction="vertical" size={18} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <Space direction="vertical" size={2}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}>
                    Subject
                  </span>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Pilih subject untuk membuka percakapannya.
                  </Text>
                </Space>

                <Button
                  id="chat-new-ticket-btn"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenModal}
                  style={{
                    height: 32,
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    paddingInline: 12,
                  }}
                >
                  Tiket Baru
                </Button>
              </div>

              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {sortedTickets.length ? (
                  sortedTickets.map((ticket) => {
                    const isSelected = ticket.id === selectedTicket?.id;

                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => handleSelectTicket(ticket.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: 16,
                          borderRadius: 14,
                          cursor: "pointer",
                          border: isSelected
                            ? "1.5px solid #2563eb"
                            : "1px solid #e2e8f0",
                          background: isSelected ? "#eff6ff" : "#ffffff",
                          boxShadow: isSelected
                            ? "0 4px 12px rgba(37, 99, 235, 0.08)"
                            : "none",
                        }}
                      >
                        <Space
                          direction="vertical"
                          size={12}
                          style={{ width: "100%" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                borderRadius: 999,
                                padding: "4px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#2563eb",
                                background: "#eff6ff",
                              }}
                            >
                              On Going
                            </span>

                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {getTicketCode(ticket)}
                            </Text>
                          </div>

                          <div>
                            <Text
                              strong
                              style={{
                                display: "block",
                                fontSize: 18,
                                lineHeight: 1.3,
                                color: "#111827",
                              }}
                            >
                              {ticket.name}
                            </Text>

                            <Paragraph
                              type="secondary"
                              style={{ margin: "8px 0 0", fontSize: 14 }}
                            >
                              {buildTicketSummary(ticket)}
                            </Paragraph>
                          </div>

                          <Space size={8} align="center">
                            <ClockCircleOutlined style={{ color: "#94a3b8" }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {formatRelativeTime(ticket.updated_at)}
                            </Text>
                          </Space>
                        </Space>
                      </button>
                    );
                  })
                ) : (
                  <Card
                    style={{
                      borderRadius: 18,
                      borderColor: "#e5e7eb",
                      background: "#fafcff",
                    }}
                  >
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Belum ada tiket percakapan."
                    />
                  </Card>
                )}
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={15} xl={16}>
          {selectedTicket ? (
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              <Card
                style={{
                  borderRadius: 20,
                  borderColor: "#e2e8f0",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                  background: "#ffffff",
                }}
                styles={{ body: { padding: 20 } }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <Space direction="vertical" size={8}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        width: "fit-content",
                        borderRadius: 999,
                        padding: "4px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#2563eb",
                        background: "#eff6ff",
                      }}
                    >
                      On Going
                    </span>

                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                      {selectedTicket.name}
                    </div>

                    <Text type="secondary" style={{ fontSize: 12.5 }}>
                      {buildTicketSummary(selectedTicket)}
                    </Text>
                  </Space>

                  <Card
                    style={{
                      minWidth: 280,
                      borderRadius: 12,
                      borderColor: "#e2e8f0",
                      background: "#f8fafc",
                    }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <Space direction="vertical" size={6}>
                      <Space size={8} align="center">
                        <TagOutlined style={{ color: "#2563eb", fontSize: 12 }} />
                        <Text strong style={{ fontSize: 12.5 }}>Ticket</Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {getTicketCode(selectedTicket)}
                      </Text>
                      <Text strong style={{ fontSize: 13.5, color: "#0f172a" }}>
                        {selectedTicket.name}
                      </Text>
                    </Space>
                  </Card>
                </div>
              </Card>

              <Card
                loading={messagesLoading}
                style={{
                  borderRadius: 14,
                  borderColor: "#e2e8f0",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                  background: "#ffffff",
                }}
                styles={{ body: { padding: 20 } }}
              >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {mergedMessages.length ? (
                    <div
                      id="chat-messages-area"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 26,
                        width: "100%",
                        paddingTop: 4,
                        paddingBottom: 4,
                      }}
                    >
                      {mergedMessages.map((message, index) => {
                        const isNewDateGroup =
                          index === 0 ||
                          !isSameDay(
                            mergedMessages[index - 1]?.created_at,
                            message.created_at,
                          );

                        const isMine =
                          String(message.sender_id) === String(user_id);
                        const senderIdKey = String(message.sender_id ?? "");
                        const senderNameKey = (message.sender_name ?? "").trim().toLowerCase();

                        const senderAvatar =
                          userAvatarMap.get(senderIdKey) ||
                          (senderNameKey ? userAvatarByNameMap.get(senderNameKey) : undefined) ||
                          (isMine ? getUserAvatarUrl(effectiveCurrentUser) : undefined);

                        return (
                          <div key={message.id} style={{ width: "100%" }}>
                            {isNewDateGroup && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  margin: "8px 0 16px",
                                }}
                              >
                                <span
                                  style={{
                                    background: "#f1f5f9",
                                    color: "#64748b",
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    padding: "4px 14px",
                                    borderRadius: 14,
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                                    letterSpacing: "0.2px",
                                    userSelect: "none",
                                  }}
                                >
                                  {formatChatDateGroup(message.created_at)}
                                </span>
                              </div>
                            )}

                            <ChatBubbleItem
                              message={message}
                              isMine={isMine}
                              currentUserName={effectiveCurrentUser?.name ?? currentUser?.name}
                              currentUserRole={effectiveCurrentUser?.role ?? currentUser?.role}
                              senderAvatarUrl={senderAvatar}
                              onStartEdit={handleStartEditMessage}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      id="chat-messages-area"
                      style={{
                        minHeight: 260,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          selectedConversationId
                            ? "Belum ada pesan pada percakapan ini."
                            : "Belum ada conversation. Kirim pesan pertama untuk memulai."
                        }
                      />
                    </div>
                  )}

                  <Divider style={{ margin: "4px 0" }} />

                  {pendingAttachments.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {pendingAttachments.map((attachment, index) => (
                        <div
                          key={`${attachment.url}-${index}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                          }}
                        >
                          <Text style={{ fontSize: 12 }}>{attachment.name}</Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => handleRemoveAttachment(index)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div
                    id="chat-input-area"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      border: editingMessageId
                        ? "1.5px solid #16a34a"
                        : "1px solid #e2e8f0",
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "#ffffff",
                      boxShadow: editingMessageId
                        ? "0 0 0 3px rgba(22, 163, 74, 0.1)"
                        : "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {editingMessageId && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 14px",
                          borderBottom: "1px solid #bbf7d0",
                          background: "#f0fdf4",
                        }}
                      >
                        <Space size={8} align="center">
                          <EditOutlined style={{ color: "#16a34a" }} />
                          <Text style={{ color: "#166534", fontWeight: 600, fontSize: 13 }}>
                            Edit pesan
                          </Text>
                        </Space>
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={handleCancelEditMessage}
                          title="Batal edit"
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "stretch", width: "100%" }}>
                      <Upload
                        multiple
                        beforeUpload={handleAttachmentUpload}
                        showUploadList={false}
                        accept="image/*,.pdf,.doc,.docx"
                        disabled={Boolean(editingMessageId)}
                      >
                        <Button
                          type="text"
                          icon={<PaperClipOutlined />}
                          loading={uploadingAttachments}
                          disabled={Boolean(editingMessageId)}
                          style={{
                            width: 64,
                            height: "100%",
                            minHeight: 88,
                            border: "none",
                            borderRight: "1px solid #e5e7eb",
                            borderRadius: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      </Upload>

                      <div
                        style={{
                          flex: 1,
                          minHeight: 88,
                          display: "flex",
                          alignItems: "stretch",
                        }}
                      >
                        <TextArea
                          placeholder={
                            editingMessageId
                              ? "Edit teks pesan Anda..."
                              : "Tulis pesan atau unggah gambar..."
                          }
                          value={editingMessageId ? editingText : chatText}
                          onChange={(event) => {
                            if (editingMessageId) {
                              setEditingText(event.target.value);
                            } else {
                              setChatText(event.target.value);
                            }
                          }}
                          autoSize={{ minRows: 2, maxRows: 4 }}
                          onPressEnter={(event) => {
                            if (!event.shiftKey) {
                              event.preventDefault();
                              if (editingMessageId) {
                                void handleSaveEditMessage();
                              } else {
                                void handleSendMessage();
                              }
                            }
                          }}
                          variant="borderless"
                          style={{
                            flex: 1,
                            height: "100%",
                            minHeight: 88,
                            padding: "16px 18px",
                            resize: "none",
                            boxShadow: "none",
                          }}
                        />
                      </div>

                      {editingMessageId && (
                        <Button
                          onClick={handleCancelEditMessage}
                          style={{
                            height: "100%",
                            minHeight: 88,
                            borderRadius: 0,
                            border: "none",
                            borderLeft: "1px solid #e5e7eb",
                            padding: "0 16px",
                          }}
                        >
                          Batal
                        </Button>
                      )}

                      <Button
                        type="primary"
                        onClick={() => {
                          if (editingMessageId) {
                            void handleSaveEditMessage();
                          } else {
                            void handleSendMessage();
                          }
                        }}
                        loading={editingMessageId ? savingEditMessage : sendingMessage}
                        disabled={
                          editingMessageId
                            ? !editingText.trim()
                            : (!chatText.trim() && pendingAttachments.length === 0) || !selectedTicket
                        }
                        style={{
                          width: 108,
                          minHeight: 88,
                          height: "100%",
                          borderRadius: 0,
                          boxShadow: "none",
                          background: editingMessageId ? "#16a34a" : undefined,
                          borderColor: editingMessageId ? "#16a34a" : undefined,
                        }}
                      >
                        {editingMessageId ? "Simpan" : "Send"}
                      </Button>
                    </div>
                  </div>
                </Space>
              </Card>
            </Space>
          ) : (
            <Card
              style={{
                borderRadius: 20,
                borderColor: "#e2e8f0",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                background: "#ffffff",
                minHeight: 520,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
              styles={{
                body: {
                  padding: "48px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                },
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <MessageOutlined style={{ fontSize: 32, color: "#2563eb" }} />
              </div>
              <Title level={4} style={{ marginBottom: 8, color: "#0f172a" }}>
                Belum Ada Tiket Percakapan
              </Title>
              <Paragraph
                type="secondary"
                style={{
                  maxWidth: 460,
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Untuk memulai percakapan dengan tim Admission, Anda perlu membuat tiket terlebih dahulu. Setiap percakapan dikelompokkan berdasarkan tiket.
              </Paragraph>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleOpenModal}
                style={{
                  borderRadius: 10,
                  height: 44,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontWeight: 600,
                  backgroundColor: "#1e3a8a",
                }}
              >
                Buat Tiket Baru
              </Button>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="Create New Ticket"
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
          <Form.Item
            name="name"
            label="Ticket Name"
            rules={[{ required: true, message: "Ticket name is required" }]}
            style={ticketFormStyle}
          >
            <Input
              placeholder="Contoh: Bank Statement Review"
              style={{ borderRadius: 12, height: 42 }}
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={onCreateLoading || creatingConversation}
              disabled={usersLoading}
            >
              Create Ticket
            </Button>
          </div>
        </Form>
      </Modal>

      <Tour
        open={tourOpen}
        onClose={closeTour}
        onFinish={closeTour}
        steps={tourSteps}
        zIndex={1200}
      />
    </div>
  );
}
