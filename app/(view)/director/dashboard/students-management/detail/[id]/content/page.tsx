"use client";

import { useUser, useUsers } from "@/app/hooks/use-users";
import { useAuth } from "@/app/utils/use-auth";
import {
  useChatConversations,
  useChatMessages,
  useCreateChatConversation,
} from "@/app/hooks/use-chat";
import { useChatSocket } from "@/app/hooks/use-chat-socket";
import type { ChatMessage } from "@/app/models/chat";
import type { UserDataModel } from "@/app/models/user";
import type { NoteStudentDataModel } from "@/app/models/notes-student";
import {
  App,
  Avatar,
  Button,
  Card,
  Flex,
  List,
  Mentions,
  Progress,
  Space,
  Steps,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ModalNotesComponent from "./ModalNotesComponent";
import { useStudentNotes } from "@/app/hooks/use-student-notes";
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { UploadedChatAttachment } from "@/app/vendor/chat-upload";
import { uploadChatFiles } from "@/app/vendor/chat-upload";

const isMentionableRole = (role?: string) => {
  const r = (role ?? "").toUpperCase();
  return r === "ADMISSION" || r === "DIRECTOR";
};

const getUserHandle = (user: UserDataModel) => {
  const email = user.email ?? "";
  const local = email.split("@")[0];
  if (local) return local.toLowerCase();
  return user.name.toLowerCase().replace(/\s+/g, "");
};

const extractConversationId = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") return undefined;
  const payload = data as { result?: unknown; id?: unknown };
  if (payload.result && typeof payload.result === "object") {
    const result = payload.result as { id?: unknown };
    if (typeof result.id === "string") return result.id;
  }
  if (typeof payload.id === "string") return payload.id;
  return undefined;
};

const useMentionHelpers = (
  usersData: UserDataModel[] | undefined,
  currentUserId: string | undefined,
) => {
  const mentionableUsers = useMemo(
    () => (usersData ?? []).filter((user) => isMentionableRole(user.role)),
    [usersData],
  );

  const mentionMap = useMemo(() => {
    const map = new Map<string, UserDataModel>();
    mentionableUsers.forEach((user) => {
      map.set(getUserHandle(user), user);
    });
    return map;
  }, [mentionableUsers]);

  const mentionOptions = useMemo(() => {
    return mentionableUsers
      .filter((user) => String(user.id) !== currentUserId)
      .map((user) => ({
        value: getUserHandle(user),
        label: user.name,
      }));
  }, [mentionableUsers, currentUserId]);

  const mentionOptionNodes = useMemo(() => {
    return mentionOptions.map((option) => {
      const handle = option.value;
      const user = mentionMap.get(handle);
      const fallbackInitials = handle.slice(0, 2).toUpperCase();

      if (!user) {
        return (
          <Mentions.Option key={handle} value={handle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 10px",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "linear-gradient(180deg, #fff, #f8fafc)",
              }}
            >
              <Avatar
                size={32}
                style={{
                  background: "linear-gradient(135deg, #94a3b8, #64748b)",
                  border: "2px solid #e2e8f0",
                }}
              >
                {fallbackInitials}
              </Avatar>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Typography.Text style={{ fontSize: 13, fontWeight: 600 }}>
                  {option.label}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  @{handle}
                </Typography.Text>
              </div>
            </div>
          </Mentions.Option>
        );
      }

      const initials = user.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const roleLabel = (user.role ?? "staff").toUpperCase();
      const roleColor = roleLabel === "DIRECTOR" ? "gold" : "blue";

      return (
        <Mentions.Option key={handle} value={handle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "6px 10px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(180deg, #fff, #f8fafc)",
            }}
          >
            <Avatar
              size={32}
              style={{
                background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                border: "2px solid #e2e8f0",
              }}
            >
              {initials || fallbackInitials}
            </Avatar>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Typography.Text style={{ fontSize: 13, fontWeight: 600 }}>
                  {user.name}
                </Typography.Text>
                <Tag
                  color={roleColor}
                  style={{ marginInline: 0, fontSize: 10 }}
                >
                  {roleLabel}
                </Tag>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Typography.Text
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    background: "#e2e8f0",
                    borderRadius: 999,
                    padding: "1px 6px",
                  }}
                >
                  @{handle}
                </Typography.Text>
              </div>
            </div>
          </div>
        </Mentions.Option>
      );
    });
  }, [mentionOptions, mentionMap]);

  const extractMentionUserIds = useCallback(
    (text: string) => {
      const matches = text.match(/@([a-zA-Z0-9._-]+)/g) ?? [];
      const ids = new Set<string>();
      matches.forEach((raw) => {
        const handle = raw.slice(1);
        const user = mentionMap.get(handle);
        if (user) ids.add(String(user.id));
      });
      return Array.from(ids);
    },
    [mentionMap],
  );

  const renderMessageText = useCallback(
    (text?: string | null) => {
      if (!text) return "-";
      const parts = text.split(/(@[a-zA-Z0-9._-]+)/g);
      return parts.map((part, index) => {
        if (part.startsWith("@")) {
          const handle = part.slice(1);
          const user = mentionMap.get(handle);
          const label = user
            ? `${user.name} • ${(user.role ?? "").toUpperCase()}`
            : undefined;
          const content = (
            <span style={{ color: "#2563eb", fontWeight: 600 }}>{part}</span>
          );
          if (!label) return <span key={index}>{content}</span>;
          return (
            <Tooltip key={index} title={label}>
              {content}
            </Tooltip>
          );
        }
        return <span key={index}>{part}</span>;
      });
    },
    [mentionMap],
  );

  return {
    mentionOptions,
    mentionOptionNodes,
    extractMentionUserIds,
    renderMessageText,
  };
};

export default function DetailStudentPage() {
  const params = useParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data: detailStudentData } = useUser({ id: studentId as string });
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalNotesOpen, setIsModalNotesOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteStudentDataModel | null>(
    null,
  );
  const {
    data: notesData,
    onCreate: onCreateNote,
    onCreateLoading: onCreateNoteLoading,
    onDelete: onDeleteNote,
    onDeleteLoading: onDeleteNoteLoading,
    onUpdate: onUpdateNote,
    onUpdateLoading: onUpdateNoteLoading,
  } = useStudentNotes({
    queryString: studentId ? `user_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
  });

  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const { user_id: currentUserId } = useAuth();
  const { data: usersData } = useUsers({ enabled: Boolean(currentUserId) });
  const { data: chatConversations } = useChatConversations();
  const { onCreate: onCreateConversation } = useCreateChatConversation();
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >();
  const creatingConversationRef = useRef(false);
  const [localMessagesByConversation, setLocalMessagesByConversation] =
    useState<Record<string, ChatMessage[]>>({});
  const [chatText, setChatText] = useState("");
  const [selectedPeerId, setSelectedPeerId] = useState<string | undefined>();
  const [pendingAttachments, setPendingAttachments] = useState<
    UploadedChatAttachment[]
  >([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  const { mentionOptionNodes, extractMentionUserIds, renderMessageText } =
    useMentionHelpers(usersData, currentUserId);

  const currentUser = useMemo(() => {
    if (!currentUserId) return undefined;
    return (usersData ?? []).find((user) => String(user.id) === currentUserId);
  }, [usersData, currentUserId]);

  const currentUserHandle = useMemo(() => {
    if (!currentUser) return "";
    return getUserHandle(currentUser);
  }, [currentUser]);

  const studentName = detailStudentData?.name ?? "Student";
  const studentEmail = detailStudentData?.email ?? "student@email.com";
  const studentCountry =
    detailStudentData?.stage?.country?.name ?? "Belum ada negara";
  const studentCampus = detailStudentData?.name_campus ?? "Belum ada kampus";
  const studentDegree = detailStudentData?.degree ?? "Belum ada degree";
  const visa_typeLabel = detailStudentData?.visa_type
    ? detailStudentData.visa_type.replace(/_/g, " ").toUpperCase()
    : "Belum dipilih";
  const statusLabel = detailStudentData?.status ?? "ON GOING";

  const notesSource = useMemo(
    () => (notesData?.length ? notesData : (detailStudentData?.notes ?? [])),
    [detailStudentData?.notes, notesData],
  );

  const notesItems = useMemo(() => {
    return notesSource.map((note) => ({
      id: note.id,
      author: "Internal",
      note: note.content ?? "-",
      time: note.created_at ? new Date(note.created_at).toLocaleString() : "-",
      raw: note,
    }));
  }, [notesSource]);

  const chatPeerId = selectedPeerId;

  const directConversation = useMemo(() => {
    if (!chatConversations || !chatPeerId || !currentUserId) return undefined;
    const peerKey = String(chatPeerId);
    return chatConversations.find(
      (conversation) =>
        conversation.type === "direct" &&
        conversation.member_ids?.includes(peerKey) &&
        conversation.member_ids?.includes(currentUserId),
    );
  }, [chatConversations, chatPeerId, currentUserId]);

  const fallbackConversationId = useMemo(() => {
    if (!chatConversations || !currentUserId) return undefined;
    const mine = chatConversations.filter((conversation) =>
      conversation.member_ids?.includes(currentUserId),
    );
    if (!mine.length) return undefined;
    const sorted = [...mine].sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return timeB - timeA;
    });
    return sorted[0]?.id;
  }, [chatConversations, currentUserId]);

  const conversation_id = activeConversationId ?? fallbackConversationId;
  const { data: chatMessagesData } = useChatMessages({ conversation_id });

  const mergeChatMessages = useCallback(
    (base: ChatMessage[], extra: ChatMessage[]) => {
      const map = new Map<string, ChatMessage>();
      base.forEach((item) => map.set(item.id, item));
      extra.forEach((item) => map.set(item.id, item));
      return Array.from(map.values()).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
    },
    [],
  );

  const mergedChatMessages = useMemo(
    () =>
      mergeChatMessages(
        chatMessagesData ?? [],
        (conversation_id && localMessagesByConversation[conversation_id]) || [],
      ),
    [chatMessagesData, conversation_id, localMessagesByConversation, mergeChatMessages],
  );

  const handleIncomingMessage = useCallback(
    (message: ChatMessage) => {
      const key = message.conversation_id;
      if (!key) return;
      setLocalMessagesByConversation((prev) => ({
        ...prev,
        [key]: mergeChatMessages(prev[key] ?? [], [message]),
      }));
      const mentionIds = message.mention_user_ids ?? [];
      const text = message.text ?? "";
      const hasMentionByText = currentUserHandle
        ? text.includes(`@${currentUserHandle}`)
        : false;
      const mentioned =
        (currentUserId && mentionIds.includes(currentUserId)) ||
        hasMentionByText;
      if (mentioned && message.sender_id !== currentUserId) {
        notification.info({
          message: "You were mentioned",
          description: message.text?.slice(0, 120) ?? "You have a new mention.",
        });
      }
    },
    [mergeChatMessages, currentUserHandle, currentUserId, notification],
  );

  const { connected, lastError } = useChatSocket({
    conversation_id,
    onMessage: handleIncomingMessage,
  });

  const sendMessageViaApi = useCallback(
    async (
      targetConversationId: string,
      content: string,
      mention_user_ids: string[],
      attachments: UploadedChatAttachment[],
    ) => {
      const result = await api.post(
        `/api/chats/conversations/${targetConversationId}/messages`,
        {
          type: content ? "text" : "file",
          text: content || undefined,
          mention_user_ids: mention_user_ids,
          context_user_id: studentId ? String(studentId) : undefined,
          context_type: "student",
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

  const handleChatTextChange = useCallback(
    (value: string) => {
      setChatText(value);
      const ids = extractMentionUserIds(value);
      setSelectedPeerId(ids[0]);
    },
    [extractMentionUserIds],
  );

  const handleAttachmentUpload = useCallback(
    async (file: File) => {
      setUploadingAttachments(true);
      try {
        const uploads = await uploadChatFiles([file], {
          folder: "attcahment-chat",
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
    },
    [notification],
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  }, []);

  const handleSendChat = async () => {
    const content = chatText.trim();
    const hasAttachments = pendingAttachments.length > 0;
    if (!content && !hasAttachments) return;
    const mention_user_ids = extractMentionUserIds(content);
    const peerId = mention_user_ids[0];
    let targetConversationId = conversation_id;
    if (!targetConversationId) {
      if (!peerId) {
        notification.warning({
          message: "Pilih pengguna",
          description: "Gunakan @ untuk memilih siapa yang akan di-mention.",
        });
        return;
      }
      if (directConversation?.id) {
        setActiveConversationId(directConversation.id);
        targetConversationId = directConversation.id;
      }
    }
    if (!targetConversationId) {
      try {
        if (creatingConversationRef.current) {
          notification.info({
            message: "Menyiapkan chat",
            description: "Tunggu sebentar, ruang chat sedang dibuat.",
          });
          return;
        }
        creatingConversationRef.current = true;
        const res = await onCreateConversation({
          type: "direct",
          member_ids: [String(peerId)],
        });
        const id = extractConversationId(res.data);
        if (id) {
          setActiveConversationId(id);
          targetConversationId = id;
        }
      } catch {
        notification.error({
          message: "Gagal membuat chat",
          description: "Coba lagi beberapa saat.",
        });
        return;
      } finally {
        creatingConversationRef.current = false;
      }
    }
    try {
      setChatText("");
      setPendingAttachments([]);
      const message = await sendMessageViaApi(
        targetConversationId!,
        content,
        mention_user_ids,
        pendingAttachments,
      );
      const key = message.conversation_id;
      if (key) {
        setLocalMessagesByConversation((prev) => ({
          ...prev,
          [key]: mergeChatMessages(prev[key] ?? [], [message]),
        }));
      }
    } catch {
      notification.error({
        message: "Gagal mengirim pesan",
        description: "Coba lagi beberapa saat.",
      });
      setChatText(content);
      setPendingAttachments(pendingAttachments);
    }
  };

  useEffect(() => {
    if (!conversation_id) return;
    if (connected && !lastError) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", conversation_id],
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [conversation_id, connected, lastError, queryClient]);

  const handleOpenModalNotes = () => {
    setSelectedNote(null);
    setIsModalNotesOpen(true);
  };

  const handleCloseModalNotes = () => {
    setSelectedNote(null);
    setIsModalNotesOpen(false);
  };

  const handleSubmitNote = (values: { content?: string }) => {
    const content = values.content?.trim();
    if (!content) return;

    if (selectedNote?.id) {
      onUpdateNote({
        id: selectedNote.id,
        payload: { content },
      });
    } else if (studentId) {
      onCreateNote({
        user_id: String(studentId),
        content,
      });
    }
    setIsModalNotesOpen(false);
    setSelectedNote(null);
  };

  const handleEditNote = (note: NoteStudentDataModel) => {
    setSelectedNote(note);
    setIsModalNotesOpen(true);
  };

  const handleDeleteNote = async (note: NoteStudentDataModel) => {
    if (!note.id) return;
    await onDeleteNote(note.id);
  };

  const initials = useMemo(() => {
    const parts = studentName.split(" ").filter(Boolean);
    if (parts.length === 0) return "ST";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [studentName]);

  const stepsSource = useMemo(() => {
    const raw = detailStudentData?.stage?.country?.steps ?? [];
    return [...raw].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });
  }, [detailStudentData?.stage?.country?.steps]);

  const progressSteps = stepsSource.map((step, index) => ({
    title: step.label,
    description:
      step.children?.map((child) => child.label).join(", ") ??
      "Belum ada detail",
    status: index === 0 ? ("process" as const) : ("wait" as const),
  }));

  const activityItems = [
    {
      title: "Student uploaded passport",
      meta: "Step 1 • Ngurah Manik Mahardika",
      time: "2 hours ago",
    },
    {
      title: "Admission uploaded translated transcript",
      meta: "Step 2 • Kimfa",
      time: "5 hours ago",
    },
    {
      title: "CV sent to Director for approval",
      meta: "Step 3 • Kimfa",
      time: "1 day ago",
    },
  ];

  const overviewContent = (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <Card
          bodyStyle={{ padding: 16 }}
          style={{
            borderRadius: 16,
            borderColor: "#e5e7eb",
            background: "#fff",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div>
              <Typography.Text strong>Progress Ringkasan</Typography.Text>
              <Typography.Text type="secondary" style={{ display: "block" }}>
                3 dari 6 tugas selesai
              </Typography.Text>
              <Progress percent={50} showInfo={false} />
              <Typography.Text type="secondary">50% Complete</Typography.Text>
            </div>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              {stepsSource.length ? (
                stepsSource.map((step) => (
                  <div key={step.id}>
                    <Typography.Text strong>{step.label}</Typography.Text>
                    <Typography.Text
                      type="secondary"
                      style={{ display: "block" }}
                    >
                      {step.children?.length
                        ? step.children.map((child) => child.label).join(", ")
                        : "Belum ada detail"}
                    </Typography.Text>
                  </div>
                ))
              ) : (
                <Typography.Text type="secondary">
                  Belum ada langkah untuk negara ini.
                </Typography.Text>
              )}
            </Space>
          </Space>
        </Card>

        <Card
          bodyStyle={{ padding: 16 }}
          style={{
            borderRadius: 16,
            borderColor: "#e5e7eb",
            background: "#fff",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography.Text strong>Recent Activity Summary</Typography.Text>
              <Typography.Link>View all</Typography.Link>
            </div>
            <List
              dataSource={activityItems}
              renderItem={(item) => (
                <List.Item style={{ paddingInline: 0 }}>
                  <Space
                    direction="vertical"
                    size={0}
                    style={{ width: "100%" }}
                  >
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.meta}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {item.time}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Space>
        </Card>
      </div>

      <Card
        bodyStyle={{ padding: 16 }}
        style={{
          borderRadius: 16,
          borderColor: "#e5e7eb",
          background: "#fff",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>Notes for This Student</Typography.Text>
            <Typography.Text type="secondary" style={{ display: "block" }}>
              Internal notes and communication log
            </Typography.Text>
          </div>
          {!conversation_id && !chatPeerId && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Gunakan @ untuk memilih siapa yang akan di-mention.
            </Typography.Text>
          )}
          <div style={{ maxHeight: 260, overflow: "auto" }}>
            <List
              dataSource={mergedChatMessages}
              locale={{ emptyText: "Belum ada pesan" }}
              renderItem={(message) => {
                const isMine = message.sender_id === currentUserId;
                const timeLabel = message.created_at
                  ? new Date(message.created_at).toLocaleString()
                  : "-";
                const mentionIds = message.mention_user_ids ?? [];
                const isMentioned =
                  (currentUserId && mentionIds.includes(currentUserId)) ||
                  (currentUserHandle &&
                    (message.text ?? "").includes(`@${currentUserHandle}`));
                const attachments = message.attachments ?? [];
                return (
                  <List.Item style={{ paddingInline: 0, border: "none" }}>
                    <Flex
                      style={{ width: "100%" }}
                      justify={isMine ? "flex-end" : "flex-start"}
                    >
                      <Space
                        direction="vertical"
                        size={4}
                        style={{
                          maxWidth: "70%",
                          background: isMine
                            ? "#e0f2fe"
                            : isMentioned
                              ? "#fef9c3"
                              : "#f8fafc",
                          border: "1px solid #e2e8f0",
                          padding: "8px 12px",
                          borderRadius: 12,
                        }}
                      >
                        {isMentioned && !isMine && (
                          <Tag color="gold" style={{ margin: 0 }}>
                            Mentioned you
                          </Tag>
                        )}
                        {message.text && (
                          <Typography.Text style={{ fontSize: 13 }}>
                            {renderMessageText(message.text)}
                          </Typography.Text>
                        )}
                        {attachments.length > 0 && (
                          <Space direction="vertical" size={6}>
                            {attachments.map((attachment) => {
                              const isImage =
                                attachment.mime_type?.startsWith("image/") ??
                                false;
                              if (isImage) {
                                return (
                                  <img
                                    key={attachment.url}
                                    src={attachment.url}
                                    alt={attachment.name}
                                    style={{
                                      maxWidth: 220,
                                      borderRadius: 8,
                                      border: "1px solid #e2e8f0",
                                    }}
                                  />
                                );
                              }
                              return (
                                <a
                                  key={attachment.url}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize: 12,
                                    color: "#2563eb",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {attachment.name || "Download file"}
                                </a>
                              );
                            })}
                          </Space>
                        )}
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          {timeLabel}
                        </Typography.Text>
                      </Space>
                    </Flex>
                  </List.Item>
                );
              }}
            />
          </div>
          {pendingAttachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pendingAttachments.map((attachment, index) => (
                <div
                  key={`${attachment.url}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  <Typography.Text style={{ fontSize: 12 }}>
                    {attachment.name}
                  </Typography.Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleRemoveAttachment(index)}
                  />
                </div>
              ))}
            </div>
          )}
          <Space.Compact style={{ width: "100%" }}>
            <Upload
              multiple
              beforeUpload={handleAttachmentUpload}
              showUploadList={false}
            >
              <Button
                icon={<PaperClipOutlined />}
                loading={uploadingAttachments}
              />
            </Upload>
            <Mentions
              placeholder="Tulis catatan atau pesan... (gunakan @ untuk tag)"
              value={chatText}
              onChange={handleChatTextChange}
              onPressEnter={(event) => {
                event.preventDefault();
                handleSendChat();
              }}
              disabled={!currentUserId}
              dropdownStyle={{
                padding: 8,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                boxShadow: "0 16px 30px rgba(15, 23, 42, 0.12)",
                background: "#fff",
              }}
              style={{ width: "100%" }}
            >
              {mentionOptionNodes}
            </Mentions>
            <Button
              type="primary"
              onClick={handleSendChat}
              disabled={
                (!chatText.trim() && pendingAttachments.length === 0) ||
                (!conversation_id && !chatPeerId)
              }
            >
              Send
            </Button>
          </Space.Compact>
        </Space>
      </Card>
    </Space>
  );

  const tabsItems = [
    { key: "overview", label: "Overview", children: overviewContent },
    {
      key: "documents",
      label: "Documents",
      children: <div>Documents content will appear here.</div>,
    },
    {
      key: "translation",
      label: "Translation",
      children: <div>Translation content will appear here.</div>,
    },
    {
      key: "data-cv",
      label: "Data & CV",
      children: <div>Data & CV content will appear here.</div>,
    },
    {
      key: "letter",
      label: "Letter",
      children: <div>Letter content will appear here.</div>,
    },
    {
      key: "chat",
      label: "Chat",
      children: <div>Chat content will appear here.</div>,
    },
    {
      key: "activity-log",
      label: "Activity Log",
      children: <div>Activity log content will appear here.</div>,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        Student Case Detail
      </Typography.Title>

      <Card
        bodyStyle={{ padding: 16 }}
        style={{
          borderRadius: 16,
          borderColor: "#60a5fa",
          background: "#f8fbff",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            alignItems: "start",
          }}
        >
          <Space align="start" size={12}>
            <Avatar size={48} style={{ backgroundColor: "#f59e0b" }}>
              {initials}
            </Avatar>
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{studentName}</Typography.Text>
              <Typography.Text type="secondary">{studentEmail}</Typography.Text>
              <Typography.Text type="secondary">
                No Phone: {detailStudentData?.phone ?? "Belum ada nomor telepon"}
              </Typography.Text>
              <Typography.Text type="secondary">
                Destination: {studentCountry}
              </Typography.Text>
              <Typography.Text type="secondary">
                Campus: {studentCampus}
              </Typography.Text>
              <Typography.Text type="secondary">
                Degree: {studentDegree}
              </Typography.Text>
              <div style={{ marginTop: 10 }}>
                <Flex align="space-between" gap={4} wrap>
                  <Typography.Text strong>Note</Typography.Text>
                  <Button size="small" onClick={() => handleOpenModalNotes()}>
                    {" "}
                    +{" "}
                  </Button>
                </Flex>
                <Typography.Text type="secondary" style={{ display: "block" }}>
                  <List
                    dataSource={notesItems}
                    renderItem={(item) => (
                      <List.Item style={{ paddingInline: 0 }}>
                        <Flex
                          align="start"
                          justify="space-between"
                          style={{ width: "100%" }}
                        >
                          <Typography.Text>{item.note}</Typography.Text>
                          <Space size={8}>
                            <Button
                              size="small"
                              type="link"
                              icon={<EditOutlined />}
                              onClick={() => handleEditNote(item.raw)}
                            />
                              
                            
                            <Button
                              size="small"
                              type="link"
                              danger
                              icon={<DeleteOutlined />}
                              loading={onDeleteNoteLoading}
                              onClick={() => handleDeleteNote(item.raw)}
                            />
                             
                          </Space>
                        </Flex>
                      </List.Item>
                    )}
                  />
                </Typography.Text>
              </div>
            </Space>
          </Space>

          <Space direction="vertical" size={8}>
            <Typography.Text strong>4-Step Progress</Typography.Text>
            <Steps direction="vertical" size="small" items={progressSteps} />
            <Typography.Text type="secondary">50% Complete</Typography.Text>
          </Space>

          <div
            style={{
              background: "#f1f5f9",
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <div>
                <Typography.Text strong>Visa Status</Typography.Text>
                <div style={{ marginTop: 6 }}>
                  <Tag color="blue" style={{ marginRight: 0 }}>
                    {statusLabel}
                  </Tag>
                </div>
              </div>
              <div>
                <Typography.Text strong>Visa Type</Typography.Text>
                <Typography.Text style={{ display: "block" }}>
                  {visa_typeLabel}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text strong>PIC Admission</Typography.Text>
                <Typography.Text style={{ display: "block" }}>
                  Kimfa
                </Typography.Text>
              </div>
              <div>
                <Typography.Text strong>Joined at</Typography.Text>
                <Typography.Text style={{ display: "block" }}>
                  Dec 1, 2025
                </Typography.Text>
              </div>
              <Button type="primary" block>
                Update Status
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabsItems} />
      <ModalNotesComponent
        open={isModalNotesOpen}
        onClose={handleCloseModalNotes}
        user_id={studentId ? String(studentId) : undefined}
        loading={onCreateNoteLoading || onUpdateNoteLoading}
        selectedNote={selectedNote}
        onSubmit={handleSubmitNote}
      />
    </Space>
  );
}
