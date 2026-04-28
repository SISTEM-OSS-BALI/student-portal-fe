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
  Typography,
  Upload,
  notification,
} from "antd";
import {
  ClockCircleOutlined,
  CloseOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PlusOutlined,
  TagOutlined,
} from "@ant-design/icons";
import api from "@/lib/api";
import { useTicketMessages } from "@/app/hooks/use-ticket-message";
import {
  useChatMessages,
  useCreateChatConversation,
} from "@/app/hooks/use-chat";
import { useChatSocket } from "@/app/hooks/use-chat-socket";
import type { ChatMessage } from "@/app/models/chat";
import type {
  TicketMessageDataModel,
  TicketMessagePayloadCreateModel,
} from "@/app/models/ticket-message";
import { useAuth } from "@/app/utils/use-auth";
import { useUsers } from "@/app/hooks/use-users";
import type { UploadedChatAttachment } from "@/app/vendor/chat-upload";
import { uploadChatFiles } from "@/app/vendor/chat-upload";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
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
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function ChatComponent() {
  const [form] = Form.useForm<TicketMessagePayloadCreateModel>();
  const { user_id } = useAuth();

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

  const { data: users = [], fetchLoading: usersLoading } = useUsers({
    enabled: Boolean(user_id),
  });

  const currentUser = useMemo(() => {
    if (!user_id) return undefined;
    return users.find((user) => String(user.id) === String(user_id));
  }, [users, user_id]);

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
  };

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
    <div
      style={{
        minHeight: "100%",
        padding: 24,
        borderRadius: 28,
      }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={9} xl={8}>
          <Card
            loading={fetchLoading}
            style={{
              height: "100%",
              borderRadius: 24,
              borderColor: "#dbe5ff",
              boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
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
                  <Title level={3} style={{ margin: 0 }}>
                    Ticket List
                  </Title>
                  <Text type="secondary">
                    Pilih tiket untuk membuka percakapannya.
                  </Text>
                </Space>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenModal}
                  style={{ borderRadius: 999 }}
                >
                  New Ticket
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
                          borderRadius: 20,
                          cursor: "pointer",
                          border: isSelected
                            ? "1.5px solid #4f7cff"
                            : "1px solid #dbe5ff",
                          background: isSelected ? "#eff5ff" : "#ffffff",
                          boxShadow: isSelected
                            ? "0 12px 24px rgba(79, 124, 255, 0.12)"
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
                      description="Belum ada ticket yang pernah dibuat."
                    />
                  </Card>
                )}
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={15} xl={16}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Card
              style={{
                borderRadius: 24,
                borderColor: "#dbe5ff",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
              }}
              styles={{ body: { padding: 20 } }}
            >
              {selectedTicket ? (
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

                    <Title level={2} style={{ margin: 0 }}>
                      {selectedTicket.name}
                    </Title>

                    <Text type="secondary" style={{ fontSize: 16 }}>
                      {buildTicketSummary(selectedTicket)}
                    </Text>
                  </Space>

                  <Card
                    style={{
                      minWidth: 280,
                      borderRadius: 18,
                      borderColor: "#dbe5ff",
                      background: "#f8fbff",
                    }}
                    styles={{ body: { padding: 18 } }}
                  >
                    <Space direction="vertical" size={8}>
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
                      <Text type="secondary">PIC: Admission Team</Text>
                    </Space>
                  </Card>
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Pilih ticket dari sisi kiri untuk melihat percakapan."
                />
              )}
            </Card>

            <Card
              loading={messagesLoading}
              style={{
                borderRadius: 24,
                borderColor: "#dbe5ff",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
              }}
              styles={{ body: { padding: 16 } }}
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {selectedTicket ? (
                  mergedMessages.length ? (
                    <Space
                      direction="vertical"
                      size={18}
                      style={{ width: "100%" }}
                    >
                      {mergedMessages.map((message) => {
                        const isMine =
                          String(message.sender_id) === String(user_id);
                        const bubbleBg = isMine ? "#ffffff" : "#174f93";
                        const bubbleColor = isMine ? "#1f2937" : "#ffffff";
                        const alignItems = isMine ? "flex-start" : "flex-end";
                        const alignSelf = isMine ? "flex-start" : "flex-end";

                        const senderName =
                          message.sender_name ??
                          (isMine
                            ? (currentUser?.name ?? "Student")
                            : "Admission Team");

                        const senderRole =
                          message.sender_role ??
                          (isMine
                            ? (currentUser?.role ?? "STUDENT")
                            : "ADMISSION");

                        const attachments = message.attachments ?? [];

                        return (
                          <div
                            key={message.id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems,
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                width: "100%",
                                marginBottom: 8,
                              }}
                            >
                              <Space size={8} align="center" wrap>
                                <Avatar
                                  size={30}
                                  style={{
                                    background: isMine ? "#1d4f91" : "#f59e0b",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                  }}
                                >
                                  {getInitials(senderName)}
                                </Avatar>

                                <Text strong>{senderName}</Text>

                                <Tag
                                  color={getRoleTagColor(senderRole)}
                                  style={{ margin: 0, fontSize: 10 }}
                                >
                                  {formatRoleLabel(senderRole)}
                                </Tag>
                              </Space>

                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {formatMessageTime(message.created_at)}
                              </Text>
                            </div>

                            <div
                              style={{
                                alignSelf,
                                maxWidth: "86%",
                                borderRadius: 22,
                                padding: "14px 16px",
                                background: bubbleBg,
                                color: bubbleColor,
                                border: isMine ? "1px solid #dbe5ff" : "none",
                                boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                              }}
                            >
                              {message.text ? (
                                <Text
                                  style={{ color: bubbleColor, fontSize: 15 }}
                                >
                                  {message.text}
                                </Text>
                              ) : null}

                              {attachments.length ? (
                                <div
                                  style={{
                                    marginTop: message.text ? 12 : 0,
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
                                          border:
                                            "1px solid rgba(226,232,240,0.7)",
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
                                          color: bubbleColor,
                                          display: "inline-flex",
                                          gap: 8,
                                          alignItems: "center",
                                        }}
                                      >
                                        <MessageOutlined />
                                        {attachment.name}
                                      </a>
                                    ),
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </Space>
                  ) : (
                    <div
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
                  )
                ) : (
                  <div
                    style={{
                      minHeight: 260,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Pilih ticket dari daftar di kiri."
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
                    beforeUpload={handleAttachmentUpload}
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
                      onChange={(event) => setChatText(event.target.value)}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      onPressEnter={(event) => {
                        if (!event.shiftKey) {
                          event.preventDefault();
                          void handleSendMessage();
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
                    onClick={() => void handleSendMessage()}
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
              </Space>
            </Card>
          </Space>
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
    </div>
  );
}
