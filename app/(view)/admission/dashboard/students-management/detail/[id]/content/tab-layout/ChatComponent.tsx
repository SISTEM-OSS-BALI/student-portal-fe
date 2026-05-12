"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
  notification,
} from "antd";
import {
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  PlusOutlined,
  TagOutlined,
} from "@ant-design/icons";

import api from "@/lib/api";
import {
  useDeleteTicketMessageWithConversation,
  useTicketMessages,
  useUpdateStatusTicketMessage,
} from "@/app/hooks/use-ticket-message";
import {
  useChatMessages,
  useCreateChatConversation,
} from "@/app/hooks/use-chat";
import { useChatSocket } from "@/app/hooks/use-chat-socket";
import { useUser, useUsers } from "@/app/hooks/use-users";
import type { ChatMessage } from "@/app/models/chat";
import type {
  TicketMessageDataModel,
  TicketMessagePayloadCreateModel,
} from "@/app/models/ticket-message";
import type { UploadedChatAttachment } from "@/app/vendor/chat-upload";
import { uploadChatFiles } from "@/app/vendor/chat-upload";
import { useAuth } from "@/app/utils/use-auth";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type ChatComponentProps = {
  student_id: string;
  student_name?: string;
  initialConversationId?: string;
};

const ticketFormStyle: CSSProperties = { marginBottom: 14 };

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

const normalizeTicketStatus = (value?: string | null) => {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  return status === "completed" ? "completed" : "ongoing";
};

const getTicketStatusLabel = (value?: string | null) => {
  return normalizeTicketStatus(value) === "completed"
    ? "Completed"
    : "On Going";
};

const getTicketStatusStyle = (value?: string | null): CSSProperties => {
  const status = normalizeTicketStatus(value);

  return {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: status === "completed" ? "#15803d" : "#2563eb",
    background: status === "completed" ? "#dcfce7" : "#eff6ff",
  };
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
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })} · ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
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

function TicketStatusPill({ status }: { status?: string | null }) {
  return (
    <span style={getTicketStatusStyle(status)}>
      {getTicketStatusLabel(status)}
    </span>
  );
}

function TicketListItem({
  ticket,
  isActive,
  onClick,
  buildTicketSummary,
}: {
  ticket: TicketMessageDataModel;
  isActive: boolean;
  onClick: () => void;
  buildTicketSummary: (ticket: TicketMessageDataModel) => string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 16,
        border: isActive ? "1px solid #3b82f6" : "1px solid #dbe4ee",
        background: isActive ? "#eff6ff" : "#ffffff",
        padding: 14,
        cursor: "pointer",
        boxShadow: isActive ? "0 12px 24px rgba(59, 130, 246, 0.14)" : "none",
      }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
          }}
        >
          <TicketStatusPill status={ticket.status} />

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
              color: "#0f172a",
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
}

function MessageBubble({
  message,
  isMine,
  currentUserName,
  currentUserRole,
  studentName,
}: {
  message: ChatMessage;
  isMine: boolean;
  currentUserName?: string | null;
  currentUserRole?: string | null;
  studentName?: string;
}) {
  const attachments = message.attachments ?? [];
  const bubbleBg = isMine ? "#0f4c8a" : "#ffffff";
  const bubbleColor = isMine ? "#ffffff" : "#334155";
  const borderColor = isMine ? "#0f4c8a" : "#dbe4ee";
  const justify = isMine ? "flex-end" : "flex-start";

  const senderName =
    message.sender_name ??
    (isMine ? (currentUserName ?? "Admission") : (studentName ?? "Student"));

  const senderRole =
    message.sender_role ??
    (isMine ? (currentUserRole ?? "ADMISSION") : "STUDENT");

  const senderRoleLabel = formatRoleLabel(senderRole);
  const avatarBg = isMine ? "#f59e0b" : "#0f4c8a";

  return (
    <div style={{ display: "flex", justifyContent: justify }}>
      <Space
        align="end"
        size={10}
        style={{
          maxWidth: "90%",
          flexDirection: isMine ? "row-reverse" : "row",
        }}
      >
        <Avatar
          size={30}
          style={{
            background: avatarBg,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {getInitials(senderName)}
        </Avatar>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 6,
            }}
          >
            <Space size={8} align="center" wrap>
              <Text strong style={{ fontSize: 12, color: "#334155" }}>
                {senderName}
              </Text>

              <Tag
                color={getRoleTagColor(senderRole)}
                style={{ margin: 0, fontSize: 10 }}
              >
                {senderRoleLabel}
              </Tag>
            </Space>

            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatMessageTime(message.created_at)}
            </Text>
          </div>

          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${borderColor}`,
              background: bubbleBg,
              color: bubbleColor,
              padding: "12px 14px",
              boxShadow: isMine
                ? "0 10px 20px rgba(15, 76, 138, 0.18)"
                : "0 8px 20px rgba(15, 23, 42, 0.04)",
            }}
          >
            {message.text ? (
              <Paragraph
                style={{
                  margin: 0,
                  color: bubbleColor,
                  lineHeight: 1.6,
                  fontSize: 13,
                }}
              >
                {message.text}
              </Paragraph>
            ) : null}

            {attachments.length ? (
              <div
                style={{
                  marginTop: message.text ? 10 : 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
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
                        borderRadius: 12,
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
                        color: isMine ? "#dbeafe" : "#2563eb",
                        display: "inline-flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <PaperClipOutlined />
                      {attachment.name}
                    </a>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Space>
    </div>
  );
}

function PendingAttachments({
  attachments,
  onRemove,
}: {
  attachments: UploadedChatAttachment[];
  onRemove: (index: number) => void;
}) {
  if (!attachments.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {attachments.map((attachment, index) => (
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
            onClick={() => onRemove(index)}
          />
        </div>
      ))}
    </div>
  );
}

function ChatComposer({
  chatText,
  pendingAttachments,
  selectedTicket,
  sendingMessage,
  uploadingAttachments,
  onTextChange,
  onSend,
  onUpload,
}: {
  chatText: string;
  pendingAttachments: UploadedChatAttachment[];
  selectedTicket?: TicketMessageDataModel;
  sendingMessage: boolean;
  uploadingAttachments: boolean;
  onTextChange: (value: string) => void;
  onSend: () => void;
  onUpload: (file: File) => Promise<boolean>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        border: "1px solid #d9d9d9",
        borderRadius: 18,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <Upload
        multiple
        beforeUpload={onUpload}
        showUploadList={false}
        accept="image/*,.pdf,.doc,.docx"
      >
        <Button
          type="text"
          icon={<PaperClipOutlined />}
          loading={uploadingAttachments}
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
          placeholder="Tulis pesan atau unggah gambar..."
          value={chatText}
          onChange={(event) => onTextChange(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 4 }}
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault();
              onSend();
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

      <Button
        type="primary"
        onClick={onSend}
        loading={sendingMessage}
        disabled={
          (!chatText.trim() && pendingAttachments.length === 0) ||
          !selectedTicket
        }
        style={{
          width: 108,
          minHeight: 88,
          height: "100%",
          borderRadius: 0,
          boxShadow: "none",
        }}
      >
        Send
      </Button>
    </div>
  );
}

function CreateTicketModal({
  open,
  form,
  loading,
  onCancel,
  onFinish,
}: {
  open: boolean;
  form: ReturnType<typeof Form.useForm<TicketMessagePayloadCreateModel>>[0];
  loading: boolean;
  onCancel: () => void;
  onFinish: (values: TicketMessagePayloadCreateModel) => void;
}) {
  return (
    <Modal
      title="Create New Ticket"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label="Ticket Name"
          rules={[{ required: true, message: "Ticket name is required" }]}
          style={ticketFormStyle}
        >
          <Input
            placeholder="Contoh: Follow up dokumen visa"
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
          <Button onClick={onCancel}>Cancel</Button>

          <Button type="primary" htmlType="submit" loading={loading}>
            Create Ticket
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function ChatComponent({
  student_id,
  student_name,
  initialConversationId,
}: ChatComponentProps) {
  const { user_id } = useAuth();
  const [form] = Form.useForm<TicketMessagePayloadCreateModel>();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    UploadedChatAttachment[]
  >([]);
  const [localMessagesByConversation, setLocalMessagesByConversation] =
    useState<Record<string, ChatMessage[]>>({});
  const [conversationOverrides, setConversationOverrides] = useState<
    Record<string, string>
  >({});

  const {
    onDelete: deleteTicketWithConversation,
    onDeleteLoading: deletingTicket,
  } = useDeleteTicketMessageWithConversation({
    withNotification: false,
  });

  const { onUpdate: updateStatus, onUpdateLoading } =
    useUpdateStatusTicketMessage({});

  const { data: currentUser } = useUser({ id: user_id });

  const {
    onCreate: createConversation,
    onCreateLoading: creatingConversation,
  } = useCreateChatConversation();

  const { data: allUsers = [] } = useUsers({
    enabled: Boolean(user_id),
  });

  const {
    data: tickets = [],
    fetchLoading,
    onCreate: createTicket,
    onCreateLoading,
    onUpdate: updateTicket,
  } = useTicketMessages({
    queryString: student_id ? `user_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
    withNotification: false,
  });

  const admissionUsers = useMemo(() => {
    return allUsers.filter(
      (user) =>
        Boolean(user.id) &&
        String(user.role).trim().toUpperCase() === "ADMISSION",
    );
  }, [allUsers]);

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const timeA = Date.parse(a.updated_at);
      const timeB = Date.parse(b.updated_at);

      return timeB - timeA;
    });
  }, [tickets]);

  useEffect(() => {
    if (!initialConversationId) return;

    const matchedTicket = sortedTickets.find(
      (ticket) => ticket.conversation_id === initialConversationId,
    );

    if (matchedTicket && matchedTicket.id !== selectedTicketId) {
      setSelectedTicketId(matchedTicket.id);
      setChatText("");
      setPendingAttachments([]);
    }
  }, [initialConversationId, selectedTicketId, sortedTickets]);

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

  const selectedPicName = currentUser?.name ?? "Admission Team";

  const selectedTicketStatus = normalizeTicketStatus(selectedTicket?.status);
  const nextTicketStatus =
    selectedTicketStatus === "completed" ? "ongoing" : "completed";

  const buildTicketSummary = useCallback((ticket: TicketMessageDataModel) => {
    return `Komunikasi per tiket untuk ${ticket.name.toLowerCase()} dan tindak lanjut admission.`;
  }, []);

  const handleOpenModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    form.resetFields();
    setModalVisible(false);
  }, [form]);

  const handleSelectTicket = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    setChatText("");
    setPendingAttachments([]);
  }, []);

  const buildConversationMembers = useCallback(() => {
    const memberIds = Array.from(
      new Set([
        String(student_id),
        ...admissionUsers.map((user) => String(user.id)),
        String(user_id),
      ]),
    );

    return memberIds.filter(Boolean);
  }, [admissionUsers, student_id, user_id]);

  const createConversationForTicket = useCallback(
    async (ticket: TicketMessageDataModel) => {
      if (!user_id) {
        throw new Error("User admission tidak ditemukan.");
      }

      if (!student_id) {
        throw new Error("Student tidak ditemukan.");
      }

      const existingConversationId =
        conversationOverrides[ticket.id] ?? ticket.conversation_id;

      if (existingConversationId) {
        return existingConversationId;
      }

      const memberIds = buildConversationMembers();

      const response = await createConversation({
        type: memberIds.length > 2 ? "group" : "direct",
        title: ticket.name,
        member_ids: memberIds,
      });

      const conversationId = extractConversationId(response);

      if (!conversationId) {
        throw new Error("Conversation chat tidak mengembalikan id yang valid.");
      }

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
    [
      buildConversationMembers,
      conversationOverrides,
      createConversation,
      student_id,
      updateTicket,
      user_id,
    ],
  );

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
          mention_user_ids: options?.mention_user_ids,
          context_user_id:
            options?.context_user_id ??
            (student_id ? String(student_id) : undefined),
          context_type: options?.context_type ?? "student",
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
    [student_id],
  );

  const handleCreateTicket = useCallback(
    async (values: TicketMessagePayloadCreateModel) => {
      if (!student_id) {
        notification.error({
          message: "Student tidak ditemukan",
          description: "Ticket harus dibuat untuk student tertentu.",
        });
        return;
      }

      if (!user_id) {
        notification.error({
          message: "User admission tidak ditemukan",
          description: "Silakan login ulang lalu coba lagi.",
        });
        return;
      }

      const ticketName = values.name?.trim();

      if (!ticketName) {
        notification.warning({
          message: "Nama ticket wajib diisi",
          description: "Masukkan nama ticket terlebih dahulu.",
        });
        return;
      }

      try {
        const memberIds = buildConversationMembers();

        const response = await createConversation({
          type: memberIds.length > 2 ? "group" : "direct",
          title: ticketName,
          member_ids: memberIds,
        });

        const conversationId = extractConversationId(response);

        if (!conversationId) {
          throw new Error(
            "Conversation chat tidak mengembalikan id yang valid.",
          );
        }

        const ticketResponse = await createTicket({
          name: ticketName,
          user_id: student_id,
          conversation_id: conversationId,
        });

        const createdTicket =
          ticketResponse?.data?.result ??
          ticketResponse?.data ??
          ticketResponse;

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
            `Halo ${student_name ?? "Student"}, tim admission membuat ticket "${ticketName}". Silakan lanjutkan percakapan pada ticket ini jika ada pertanyaan atau dokumen tambahan.`,
            [],
            {
              mention_user_ids: [String(student_id)],
              context_user_id: String(student_id),
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
                ? `Ticket sudah dibuat, tetapi pesan awal gagal dikirim: ${error.message}`
                : "Ticket sudah dibuat, tetapi pesan awal gagal dikirim.",
          });
        }

        notification.success({
          message: "Ticket berhasil dibuat",
          description:
            "Ticket baru sudah dibuat dan conversation chat terhubung.",
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
    },
    [
      buildConversationMembers,
      createConversation,
      createTicket,
      handleCloseModal,
      sendMessageViaApi,
      student_id,
      student_name,
      user_id,
    ],
  );

  const handleUpdateStatus = useCallback(
    async (status: string) => {
      if (!selectedTicket?.id) {
        notification.warning({
          message: "Ticket belum dipilih",
          description: "Pilih ticket terlebih dahulu sebelum mengubah status.",
        });
        return;
      }

      try {
        await updateStatus({
          id: selectedTicket.id,
          status,
        });
      } catch (error) {
        notification.error({
          message: "Gagal mengubah status ticket",
          description:
            error instanceof Error ? error.message : "Coba lagi beberapa saat.",
        });
      }
    },
    [selectedTicket, updateStatus],
  );

  const handleDeleteTicket = useCallback(async () => {
    if (!selectedTicket?.id) {
      notification.warning({
        message: "Ticket belum dipilih",
        description: "Pilih ticket terlebih dahulu sebelum menghapus ticket.",
      });
      return;
    }

    try {
      await deleteTicketWithConversation(selectedTicket.id);

      setConversationOverrides((prev) => {
        const next = { ...prev };
        delete next[selectedTicket.id];

        return next;
      });

      if (selectedConversationId) {
        setLocalMessagesByConversation((prev) => {
          const next = { ...prev };
          delete next[selectedConversationId];

          return next;
        });
      }

      setSelectedTicketId(null);
      setChatText("");
      setPendingAttachments([]);

      notification.success({
        message: "Ticket berhasil dihapus",
        description: "Ticket dan conversation chat sudah dihapus.",
      });
    } catch (error) {
      notification.error({
        message: "Gagal menghapus ticket",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    }
  }, [deleteTicketWithConversation, selectedConversationId, selectedTicket]);

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

      const conversationId = await createConversationForTicket(selectedTicket);

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
    createConversationForTicket,
    pendingAttachments,
    selectedTicket,
    sendMessageViaApi,
  ]);

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 18,
        borderColor: "#60a5fa",
        boxShadow: "0 14px 36px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8} xl={7}>
            <div
              style={{
                borderRadius: 18,
                border: "1px solid #dbe4ee",
                background: "#ffffff",
                padding: 14,
                height: "100%",
              }}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      Subject
                    </Title>

                    <Text type="secondary">
                      Pilih tiket untuk membuka percakapannya.
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenModal}
                    style={{ borderRadius: 999 }}
                  >
                    New Ticket
                  </Button>
                </div>

                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {sortedTickets.length ? (
                    sortedTickets.map((ticket) => (
                      <TicketListItem
                        key={ticket.id}
                        ticket={ticket}
                        isActive={ticket.id === selectedTicket?.id}
                        onClick={() => handleSelectTicket(ticket.id)}
                        buildTicketSummary={buildTicketSummary}
                      />
                    ))
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
                        description="Belum ada ticket untuk student ini."
                      />
                    </Card>
                  )}
                </Space>
              </Space>
            </div>
          </Col>

          <Col xs={24} lg={16} xl={17}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 20,
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 280,
                  }}
                >
                  <Space
                    direction="vertical"
                    size={10}
                    style={{ width: "100%" }}
                  >
                    <TicketStatusPill status={selectedTicket?.status} />

                    <Title level={2} style={{ margin: 0 }}>
                      {selectedTicket?.name ?? "Pilih ticket"}
                    </Title>

                    <Text type="secondary" style={{ fontSize: 16 }}>
                      {selectedTicket
                        ? buildTicketSummary(selectedTicket)
                        : "Belum ada ticket yang dipilih."}
                    </Text>
                  </Space>
                </div>

                {selectedTicket ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 12,
                      minWidth: 280,
                      maxWidth: 340,
                      width: "100%",
                    }}
                  >
                    <Button
                      type="primary"
                      loading={onUpdateLoading}
                      onClick={() => void handleUpdateStatus(nextTicketStatus)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        width: "fit-content",
                        borderRadius: 999,
                        padding: "4px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        boxShadow: "none",
                      }}
                    >
                      {selectedTicketStatus === "completed"
                        ? "Tandai On Going"
                        : "Tandai Completed"}
                    </Button>

                    <Popconfirm
                      title="Hapus ticket ini?"
                      description="Ticket dan seluruh conversation chat akan dihapus."
                      okText="Hapus"
                      cancelText="Batal"
                      okButtonProps={{
                        danger: true,
                        loading: deletingTicket,
                      }}
                      onConfirm={() => void handleDeleteTicket()}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingTicket}
                        disabled={
                          !selectedTicket || selectedTicketStatus === "ongoing"
                        }
                        style={{
                          borderRadius: 999,
                        }}
                      >
                        Delete Ticket
                      </Button>
                    </Popconfirm>

                    <Card
                      style={{
                        width: "100%",
                        borderRadius: 18,
                        borderColor: "#dbe5ff",
                        background: "#f8fbff",
                      }}
                      styles={{ body: { padding: 18 } }}
                    >
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ width: "100%" }}
                      >
                        <Space size={8} align="center">
                          <TagOutlined style={{ color: "#2563eb" }} />
                          <Text strong>Ticket</Text>
                        </Space>

                        <Text type="secondary" style={{ fontSize: 14 }}>
                          {getTicketCode(selectedTicket)}
                        </Text>

                        <Text strong style={{ fontSize: 16 }}>
                          {selectedTicket.name}
                        </Text>

                        <Text type="secondary">PIC: {selectedPicName}</Text>
                      </Space>
                    </Card>
                  </div>
                ) : null}
              </div>

              <Card
                loading={fetchLoading || messagesLoading}
                style={{
                  borderRadius: 22,
                  borderColor: "#dbe5ff",
                  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.04)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                {selectedTicket ? (
                  <Space
                    direction="vertical"
                    size={18}
                    style={{ width: "100%" }}
                  >
                    {mergedMessages.length ? (
                      mergedMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isMine={String(message.sender_id) === String(user_id)}
                          currentUserName={currentUser?.name}
                          currentUserRole={currentUser?.role}
                          studentName={student_name}
                        />
                      ))
                    ) : (
                      <div
                        style={{
                          minHeight: 320,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            selectedConversationId
                              ? "Belum ada pesan pada percakapan ini."
                              : "Ticket ini belum terhubung ke conversation chat."
                          }
                        />
                      </div>
                    )}

                    <Divider style={{ margin: "4px 0" }} />

                    <PendingAttachments
                      attachments={pendingAttachments}
                      onRemove={handleRemoveAttachment}
                    />

                    <ChatComposer
                      chatText={chatText}
                      pendingAttachments={pendingAttachments}
                      selectedTicket={selectedTicket}
                      sendingMessage={sendingMessage}
                      uploadingAttachments={uploadingAttachments}
                      onTextChange={setChatText}
                      onSend={() => void handleSendMessage()}
                      onUpload={handleAttachmentUpload}
                    />
                  </Space>
                ) : (
                  <div
                    style={{
                      minHeight: 360,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Belum ada ticket untuk student ini."
                    />
                  </div>
                )}
              </Card>
            </Space>
          </Col>
        </Row>

        <CreateTicketModal
          open={modalVisible}
          form={form}
          loading={onCreateLoading || creatingConversation}
          onCancel={handleCloseModal}
          onFinish={handleCreateTicket}
        />
      </Space>
    </Card>
  );
}
