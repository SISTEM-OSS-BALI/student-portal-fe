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
  Flex,
  Form,
  Image,
  Input,
  Mentions,
  Modal,
  Popconfirm,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
  notification,
} from "antd";
import {
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SendOutlined,
  TagOutlined,
} from "@ant-design/icons";

import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteTicketMessageWithConversation,
  useTicketMessages,
  useUpdateStatusTicketMessage,
} from "@/app/hooks/use-ticket-message";
import styles from "../detail.module.css";
import {
  useChatMessages,
  useCreateChatConversation,
} from "@/app/hooks/use-chat";
import { useChatSocket } from "@/app/hooks/use-chat-socket";
import { useUser, useUsers } from "@/app/hooks/use-users";
import type { UserDataModel } from "@/app/models/user";
import type { ChatMessage } from "@/app/models/chat";
import type {
  TicketMessageDataModel,
  TicketMessagePayloadCreateModel,
} from "@/app/models/ticket-message";
import type { UploadedChatAttachment } from "@/app/vendor/chat-upload";
import { uploadChatFiles } from "@/app/vendor/chat-upload";
import { useAuth } from "@/app/utils/use-auth";
import {
  formatChatDateGroup,
  formatChatMessageTime,
  formatChatTimeOnly,
  getStudentAvatarUrl,
  isChatMessageEditable,
  isSameDay,
} from "@/app/utils/student-helpers";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type ChatComponentProps = {
  student_id: string;
  student_name?: string;
  consultant_name?: string | null;
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
    case "CONSULTANT":
      return "purple";
    case "STUDENT":
      return "green";
    default:
      return "default";
  }
};

const normalizeHandle = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "");
};

const getLegacyEmailHandle = (user: { name?: string | null; email?: string | null }) => {
  const email = user.email ?? "";
  return normalizeHandle(email.split("@")[0] ?? "");
};

const getUserHandle = (user: { name?: string | null; email?: string | null }) => {
  const fromName = normalizeHandle(user.name ?? "");
  if (fromName) return fromName;
  return getLegacyEmailHandle(user);
};

const isMatchingConsultant = (
  consultantUser: UserDataModel,
  targetName?: string | null,
) => {
  if (!targetName) return false;
  const cleanTarget = targetName.trim().toLowerCase();
  const cleanUser = (consultantUser.name ?? "").trim().toLowerCase();
  const cleanEmail = (consultantUser.email ?? "").trim().toLowerCase();

  return (
    cleanUser === cleanTarget ||
    cleanTarget.includes(cleanUser) ||
    cleanUser.includes(cleanTarget) ||
    (Boolean(cleanEmail) && cleanTarget.includes(cleanEmail.split("@")[0]))
  );
};

const getUserAvatarUrl = (user?: UserDataModel | null): string | undefined => {
  if (!user) return undefined;
  if (user.profile_picture_url && user.profile_picture_url.trim()) {
    return user.profile_picture_url.trim();
  }
  return getStudentAvatarUrl(user);
};

const useMentionHelpers = (
  usersData: UserDataModel[] | undefined,
  currentUserId: string | undefined,
  currentStudent?: { id: string; name?: string; role?: string } | null,
  assignedConsultantName?: string | null,
) => {
  const mentionableUsers = useMemo(() => {
    // 1. Ambil staf Director & Admission
    const list = (usersData ?? []).filter((user) => {
      const role = String(user.role ?? "").toUpperCase();
      return role === "DIRECTOR" || role === "ADMISSION";
    });

    // 2. Ambil HANYA 1 konsultan yang bertanggung jawab mendampingi siswa ini (pantauan 1 konsultan)
    // Konsultan lain yang tidak mengurus anak ini TIDAK BOLEH muncul
    const consultants = (usersData ?? []).filter((user) => {
      const role = String(user.role ?? "").toUpperCase();
      return role === "CONSULTANT";
    });

    if (assignedConsultantName) {
      const matched = consultants.filter((c) =>
        isMatchingConsultant(c, assignedConsultantName),
      );
      if (matched.length > 0) {
        list.push(...matched);
      } else {
        // Fallback pencarian bagian kata (misal: "Jani" dalam "Jani Antari")
        const fallback = consultants.find(
          (c) =>
            assignedConsultantName
              .toLowerCase()
              .includes((c.name || "").toLowerCase()) ||
            (c.name || "")
              .toLowerCase()
              .includes(assignedConsultantName.toLowerCase()),
        );
        if (fallback) list.push(fallback);
      }
    }

    // 3. Masukkan HANYA 1 siswa yang bersangkutan dengan tiket/halaman ini
    // Mencegah kebocoran data siswa lain ke dalam menu mention
    if (
      currentStudent?.id &&
      !list.some((u) => String(u.id) === String(currentStudent.id))
    ) {
      list.push({
        id: currentStudent.id,
        name: currentStudent.name || "Student",
        role: "STUDENT",
      } as UserDataModel);
    }

    return list;
  }, [usersData, currentStudent, assignedConsultantName]);

  const mentionMap = useMemo(() => {
    const map = new Map<string, UserDataModel>();
    mentionableUsers.forEach((user) => {
      const preferredHandle = getUserHandle(user);
      const legacyHandle = getLegacyEmailHandle(user);
      const rawName = normalizeHandle(user.name ?? "");
      if (preferredHandle) map.set(preferredHandle, user);
      if (legacyHandle) map.set(legacyHandle, user);
      if (rawName) map.set(rawName, user);
    });
    return map;
  }, [mentionableUsers]);

  const mentionOptions = useMemo(() => {
    const options = mentionableUsers
      .filter((user) => String(user.id) !== String(currentUserId))
      .map((user) => {
        const handle = getUserHandle(user);
        const initials = getInitials(user.name);
        const roleLabel = formatRoleLabel(user.role);
        const roleColor = getRoleTagColor(user.role);
        const isPicConsultant =
          roleLabel === "CONSULTANT" &&
          Boolean(assignedConsultantName) &&
          isMatchingConsultant(user, assignedConsultantName);

        return {
          key: String(user.id),
          value: handle,
          isPic: isPicConsultant,
          label: (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "4px 8px",
              }}
            >
              <Avatar
                size={26}
                src={getUserAvatarUrl(user)}
                style={{
                  background:
                    roleLabel === "DIRECTOR"
                      ? "#f59e0b"
                      : roleLabel === "ADMISSION"
                        ? "#2563eb"
                        : roleLabel === "CONSULTANT"
                          ? "#7c3aed"
                          : "#10b981",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  border: "1px solid #e2e8f0",
                }}
              >
                {initials}
              </Avatar>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Text strong style={{ fontSize: 13, lineHeight: 1.2 }}>
                    {user.name}
                  </Text>
                  <Tag
                    color={isPicConsultant ? "purple" : roleColor}
                    style={{ margin: 0, fontSize: 10, padding: "0 4px" }}
                  >
                    {isPicConsultant ? "PIC KONSULTAN" : roleLabel}
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 11, marginTop: 2 }}>
                  @{handle} {user.email ? `• ${user.email}` : ""}
                </Text>
              </div>
            </div>
          ),
        };
      });

    // PIC Konsultan selalu di urutan paling atas
    return options.sort((a, b) => (b.isPic ? 1 : 0) - (a.isPic ? 1 : 0));
  }, [mentionableUsers, currentUserId, assignedConsultantName]);

  const extractMentionUserIds = useCallback(
    (text: string) => {
      const matches = text.match(/@([a-zA-Z0-9._-]+)/g) ?? [];
      const ids = new Set<string>();

      matches.forEach((raw) => {
        const handle = raw.slice(1).toLowerCase();
        const user = mentionMap.get(handle);
        if (user) {
          ids.add(String(user.id));
        }
      });

      return Array.from(ids);
    },
    [mentionMap],
  );

  const renderMessageText = useCallback(
    (text?: string | null) => {
      if (!text) return null;

      const parts = text.split(/(@[a-zA-Z0-9._-]+)/g);

      return parts.map((part, index) => {
        if (part.startsWith("@")) {
          const handle = part.slice(1).toLowerCase();
          const user = mentionMap.get(handle);
          const label = user
            ? `${user.name} • ${formatRoleLabel(user.role)}`
            : undefined;

          const content = (
            <span
              style={{
                color: "#1d4ed8",
                fontWeight: 600,
                background: "#dbeafe",
                padding: "2px 6px",
                borderRadius: 4,
                margin: "0 2px",
              }}
            >
              {part}
            </span>
          );

          if (!label) {
            return <span key={index}>{content}</span>;
          }

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
    extractMentionUserIds,
    renderMessageText,
  };
};

const normalizeTicketStatus = (value?: string | null) => {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  return status === "completed" ? "completed" : "ongoing";
};

const getTicketStatusLabel = (value?: string | null) => {
  return normalizeTicketStatus(value) === "completed"
    ? "Selesai"
    : "Sedang Berjalan";
};

const getTicketStatusStyle = (value?: string | null): CSSProperties => {
  const status = normalizeTicketStatus(value);

  return {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    color: status === "completed" ? "#15803d" : "#1d4ed8",
    background: status === "completed" ? "#dcfce7" : "#eff6ff",
    border: status === "completed" ? "1px solid #bbf7d0" : "1px solid #bfdbfe",
  };
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "Baru saja";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Baru saja";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) {
    return `${minutes} menit lalu`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} jam lalu`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) return "Kemarin";

  return `${days} hari lalu`;
};

const formatMessageTime = (value?: string) => {
  return formatChatMessageTime(value);
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
        borderRadius: 12,
        border: isActive ? "1px solid #1b3d6d" : "1px solid #e2e8f0",
        background: isActive ? "#f0f4f9" : "#ffffff",
        padding: "12px 14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isActive ? "0 4px 12px rgba(27, 61, 109, 0.08)" : "none",
      }}
    >
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "center",
          }}
        >
          <TicketStatusPill status={ticket.status} />

          <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
            {getTicketCode(ticket)}
          </Text>
        </div>

        <div>
          <Text
            strong
            style={{
              display: "block",
              fontSize: 14,
              color: isActive ? "#1b3d6d" : "#0f172a",
              lineHeight: 1.3,
            }}
          >
            {ticket.name}
          </Text>

          <Paragraph
            type="secondary"
            ellipsis={{ rows: 2 }}
            style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.4 }}
          >
            {buildTicketSummary(ticket)}
          </Paragraph>
        </div>

        <Space size={6} align="center" style={{ marginTop: 2 }}>
          <ClockCircleOutlined style={{ color: "#94a3b8", fontSize: 11 }} />

          <Text type="secondary" style={{ fontSize: 11 }}>
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
  senderAvatarUrl,
  renderText,
  onStartEdit,
}: {
  message: ChatMessage;
  isMine: boolean;
  currentUserName?: string | null;
  currentUserRole?: string | null;
  studentName?: string;
  senderAvatarUrl?: string | null;
  renderText?: (text?: string | null) => React.ReactNode;
  onStartEdit?: (message: ChatMessage) => void;
}) {
  const attachments = message.attachments ?? [];
  const bubbleBg = isMine ? "#dcf8c6" : "#ffffff";
  const bubbleColor = "#334155";
  const borderColor = isMine ? "#b8e6a0" : "#e5e7eb";
  const justify = isMine ? "flex-end" : "flex-start";

  const senderName =
    message.sender_name ??
    (isMine ? (currentUserName ?? "Admission") : (studentName ?? "Student"));

  const senderRole =
    message.sender_role ??
    (isMine ? (currentUserRole ?? "ADMISSION") : "STUDENT");

  const senderRoleLabel = formatRoleLabel(senderRole);
  const avatarBg = isMine ? "#f59e0b" : "#0f4c8a";
  const avatarSrc =
    message.sender_profile_picture || senderAvatarUrl || undefined;

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
          size={32}
          src={avatarSrc}
          style={{
            background: avatarBg,
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
            border: "1px solid #e2e8f0",
          }}
        >
          {getInitials(senderName)}
        </Avatar>

        <div style={{ minWidth: 0 }}>
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
              <Text strong style={{ fontSize: 12, color: "#334155" }}>
                {senderName}
              </Text>

              <Tag
                color={getRoleTagColor(senderRole)}
                style={{ margin: 0, fontSize: 10 }}
              >
                {senderRoleLabel}
              </Tag>
            </div>
          )}

          <div style={{ position: "relative" }}>
            <div
              style={{
                borderRadius: isMine
                  ? "16px 6px 16px 16px"
                  : "6px 16px 16px 16px",
                border: `1px solid ${borderColor}`,
                background: bubbleBg,
                color: bubbleColor,
                padding: "12px 14px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
              }}
            >
            {message.text ? (
              <Paragraph
                style={{
                  margin: 0,
                  color: bubbleColor,
                  lineHeight: 1.6,
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderText ? renderText(message.text) : message.text}
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
                        color: "#2563eb",
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
                {formatChatTimeOnly(message.created_at)}
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
                borderBottom: `1px solid ${borderColor}`,
                borderRight: isMine ? `1px solid ${borderColor}` : "none",
                borderLeft: !isMine ? `1px solid ${borderColor}` : "none",
                transform: isMine ? "rotate(-35deg)" : "rotate(35deg)",
              }}
            />
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
  mentionOptions,
  onTextChange,
  onSend,
  onUpload,
  editingMessageId,
  editingText,
  savingEditMessage,
  onEditingTextChange,
  onSaveEdit,
  onCancelEdit,
}: {
  chatText: string;
  pendingAttachments: UploadedChatAttachment[];
  selectedTicket?: TicketMessageDataModel;
  sendingMessage: boolean;
  uploadingAttachments: boolean;
  mentionOptions?: Array<{ key: string; value: string; label: React.ReactNode }>;
  onTextChange: (value: string) => void;
  onSend: () => void;
  onUpload: (file: File) => Promise<boolean>;
  editingMessageId?: string | null;
  editingText?: string;
  savingEditMessage?: boolean;
  onEditingTextChange?: (value: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isEditing = Boolean(editingMessageId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        border: isEditing
          ? "1.5px solid #16a34a"
          : isFocused
            ? "1.5px solid #1b3d6d"
            : "1px solid #cbd5e1",
        borderRadius: 14,
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: isEditing
          ? "0 0 0 3px rgba(22, 163, 74, 0.1)"
          : isFocused
            ? "0 0 0 3px rgba(27, 61, 109, 0.08)"
            : "0 1px 3px rgba(15, 23, 42, 0.04)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {isEditing && (
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
            onClick={onCancelEdit}
            title="Batal edit"
          />
        </div>
      )}

      <div style={{ width: "100%", padding: "10px 14px 4px 14px" }}>
        <Mentions
          placeholder={
            isEditing
              ? "Edit teks pesan Anda..."
              : "Tulis pesan... Ketik @ untuk mention tim (Admission, Director, Consultant)"
          }
          value={isEditing ? (editingText ?? "") : chatText}
          onChange={isEditing ? (onEditingTextChange ?? (() => {})) : onTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoSize={{ minRows: 2, maxRows: 6 }}
          options={mentionOptions}
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault();
              if (isEditing) {
                onSaveEdit?.();
              } else {
                onSend();
              }
            }
          }}
          variant="borderless"
          style={{
            width: "100%",
            padding: 0,
            boxShadow: "none",
            fontSize: 13.5,
            lineHeight: 1.5,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 10px 8px 10px",
          borderTop: "1px solid #f1f5f9",
          background: "#fafafa",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Upload
            multiple
            beforeUpload={onUpload}
            showUploadList={false}
            accept="image/*,.pdf,.doc,.docx"
            disabled={isEditing}
          >
            <Tooltip title={isEditing ? "Lampiran tidak dapat diubah saat edit teks" : "Lampirkan berkas (gambar, PDF, DOCX)"}>
              <Button
                type="text"
                shape="circle"
                icon={<PaperClipOutlined style={{ fontSize: 16 }} />}
                loading={uploadingAttachments}
                disabled={isEditing}
                style={{
                  color: isEditing ? "#cbd5e1" : "#64748b",
                  width: 32,
                  height: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </Tooltip>
          </Upload>

          {!isEditing && (
            <Tooltip title="Tag / Mention Anggota Tim (@)">
              <Button
                type="text"
                shape="circle"
                icon={<TagOutlined style={{ fontSize: 15 }} />}
                onClick={() => {
                  if (!chatText.endsWith("@")) {
                    const newText = chatText ? `${chatText} @` : "@";
                    onTextChange(newText);
                  }
                }}
                style={{
                  color: "#1b3d6d",
                  width: 32,
                  height: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </Tooltip>
          )}
        </div>

        <Space size={8}>
          {isEditing && (
            <Button
              onClick={onCancelEdit}
              style={{
                borderRadius: 8,
                height: 34,
                padding: "0 12px",
                fontSize: 13,
              }}
            >
              Batal
            </Button>
          )}

          <Button
            type="primary"
            icon={isEditing ? undefined : <SendOutlined style={{ fontSize: 13 }} />}
            onClick={isEditing ? onSaveEdit : onSend}
            loading={isEditing ? savingEditMessage : sendingMessage}
            disabled={
              isEditing
                ? !editingText?.trim()
                : (!chatText.trim() && pendingAttachments.length === 0) || !selectedTicket
            }
            style={{
              borderRadius: 8,
              height: 34,
              padding: "0 14px",
              background: isEditing ? "#16a34a" : "#1b3d6d",
              borderColor: isEditing ? "#16a34a" : "#1b3d6d",
              fontWeight: 600,
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isEditing ? "Simpan" : "Kirim"}
          </Button>
        </Space>
      </div>
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
      title="Buat Tiket Baru"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label="Nama / Subjek Tiket"
          rules={[{ required: true, message: "Nama tiket wajib diisi" }]}
          style={ticketFormStyle}
        >
          <Input
            placeholder="Contoh: Follow up dokumen visa"
            style={{ borderRadius: 10, height: 40 }}
          />
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 20,
          }}
        >
          <Button onClick={onCancel} style={{ borderRadius: 8, height: 38 }}>
            Batal
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              borderRadius: 8,
              height: 38,
              fontWeight: 600,
              background: "#1b3d6d",
              borderColor: "#1b3d6d",
            }}
          >
            Buat Tiket
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function ChatComponent({
  student_id,
  student_name,
  consultant_name,
  initialConversationId,
}: ChatComponentProps) {
  const { user_id } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<TicketMessagePayloadCreateModel>();

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
    onDelete: deleteTicketWithConversation,
    onDeleteLoading: deletingTicket,
  } = useDeleteTicketMessageWithConversation({
    withNotification: false,
  });

  const { onUpdate: updateStatus, onUpdateLoading } =
    useUpdateStatusTicketMessage({});

  const { data: currentUser } = useUser({ id: user_id });
  const { data: studentUser } = useUser({ id: student_id });

  const effectiveConsultantName =
    consultant_name || studentUser?.name_consultant;

  const {
    onCreate: createConversation,
    onCreateLoading: creatingConversation,
  } = useCreateChatConversation();

  const { data: allUsers = [] } = useUsers({
    enabled: Boolean(user_id),
  });

  const { mentionOptions, extractMentionUserIds, renderMessageText } =
    useMentionHelpers(
      allUsers,
      user_id ? String(user_id) : undefined,
      student_id
        ? {
            id: String(student_id),
            name: student_name || studentUser?.name || "Student",
            role: "STUDENT",
          }
        : null,
      effectiveConsultantName,
    );

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

  const relevantStaffUsers = useMemo(() => {
    return allUsers.filter((user) => {
      if (!user.id) return false;
      const role = String(user.role ?? "").trim().toUpperCase();
      if (role === "ADMISSION" || role === "DIRECTOR") return true;
      if (role === "CONSULTANT") {
        if (!effectiveConsultantName) return true;
        return isMatchingConsultant(user, effectiveConsultantName);
      }
      return false;
    });
  }, [allUsers, effectiveConsultantName]);

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const timeA = Date.parse(a.updated_at);
      const timeB = Date.parse(b.updated_at);

      return timeB - timeA;
    });
  }, [tickets]);

  const { userAvatarMap, userAvatarByNameMap } = useMemo(() => {
    const idMap = new Map<string, string>();
    const nameMap = new Map<string, string>();

    const registerUser = (u?: UserDataModel | null, fallbackName?: string) => {
      if (!u && !fallbackName) return;
      const url =
        getUserAvatarUrl(u) ||
        (fallbackName
          ? getStudentAvatarUrl({ name: fallbackName } as UserDataModel)
          : undefined);
      if (!url) return;
      if (u?.id) idMap.set(String(u.id), url);
      const name = u?.name || fallbackName;
      if (name) nameMap.set(name.trim().toLowerCase(), url);
    };

    registerUser(studentUser, student_name);
    registerUser(currentUser);
    allUsers.forEach((u) => registerUser(u));

    return { userAvatarMap: idMap, userAvatarByNameMap: nameMap };
  }, [allUsers, currentUser, studentUser, student_name]);

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
    setEditingMessageId(null);
    setEditingText("");
  }, []);

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

    const mention_user_ids = extractMentionUserIds(text);
    setSavingEditMessage(true);

    try {
      const result = await api.put(`/api/chats/messages/${editingMessageId}`, {
        text,
        mention_user_ids,
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
        queryClient.invalidateQueries({ queryKey: ["chat-mentions"] });
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
  }, [editingMessageId, editingText, extractMentionUserIds, mergedMessages, queryClient]);

  const buildConversationMembers = useCallback(() => {
    const memberIds = Array.from(
      new Set([
        String(student_id),
        ...relevantStaffUsers.map((user) => String(user.id)),
        String(user_id),
      ]),
    );

    return memberIds.filter(Boolean);
  }, [relevantStaffUsers, student_id, user_id]);

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

      const mentionUserIds = extractMentionUserIds(text);

      const message = await sendMessageViaApi(
        conversationId,
        text,
        attachments,
        {
          mention_user_ids:
            mentionUserIds.length > 0 ? mentionUserIds : undefined,
        },
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
    extractMentionUserIds,
    pendingAttachments,
    selectedTicket,
    sendMessageViaApi,
  ]);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* 1. Header Card Tab Percakapan */}
      <Card
        style={{
          borderRadius: 16,
          borderColor: "#e2e8f0",
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
        }}
        styles={{ body: { padding: "18px 20px" } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Flex align="center" gap={12} style={{ minWidth: 0, flex: "1 1 auto" }}>
            <div className={styles.sectionHeaderIcon}>
              <MessageOutlined />
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <div className={styles.sectionHeaderTitle}>
                Consultation Chat
              </div>
              <div className={styles.sectionHeaderSubtitle}>
                Komunikasi dan konsultasi pendaftaran siswa
              </div>
            </div>
          </Flex>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
            style={{
              borderRadius: 10,
              height: 40,
              fontWeight: 600,
              background: "#1b3d6d",
              borderColor: "#1b3d6d",
            }}
          >
            Tiket Baru
          </Button>
        </Flex>
      </Card>

      {/* 2. Main Content Card (Two-column layout) */}
      <Card
        styles={{ body: { padding: 16 } }}
        style={{
          borderRadius: 16,
          borderColor: "#e2e8f0",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
        }}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Row gutter={[16, 16]}>
            {/* Left Column: Daftar Tiket */}
            <Col xs={24} lg={8} xl={7}>
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  padding: 16,
                  height: "100%",
                }}
              >
                <Space direction="vertical" size={14} style={{ width: "100%" }}>
                  <div>
                    <Title level={4} style={{ margin: 0, fontSize: 16, color: "#0f172a", fontWeight: 700 }}>
                      Daftar Tiket
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Pilih tiket untuk membuka percakapan.
                    </Text>
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
                      <div
                        style={{
                          padding: "36px 16px",
                          textAlign: "center",
                          background: "#ffffff",
                          borderRadius: 12,
                          border: "1px dashed #cbd5e1",
                        }}
                      >
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <Typography.Text strong style={{ display: "block", color: "#334155", fontSize: 13 }}>
                                Belum Ada Tiket
                              </Typography.Text>
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Belum ada tiket percakapan untuk mahasiswa ini.
                              </Typography.Text>
                            </div>
                          }
                        />
                      </div>
                    )}
                  </Space>
                </Space>
              </div>
            </Col>

            {/* Right Column: Active Conversation */}
            <Col xs={24} lg={16} xl={17}>
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                {/* Header Percakapan */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    flexWrap: "wrap",
                    width: "100%",
                    padding: "16px 20px",
                    background: "#f8fafc",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <Space direction="vertical" size={6} style={{ width: "100%" }}>
                      <Space size={8} align="center" wrap>
                        <TicketStatusPill status={selectedTicket?.status} />
                        {selectedTicket ? (
                          <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
                            {getTicketCode(selectedTicket)}
                          </Text>
                        ) : null}
                      </Space>

                      <Title level={4} style={{ margin: 0, fontSize: 18, color: "#0f172a", fontWeight: 700 }}>
                        {selectedTicket?.name ?? "Pilih Tiket Percakapan"}
                      </Title>

                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {selectedTicket
                          ? buildTicketSummary(selectedTicket)
                          : "Pilih salah satu tiket di sebelah kiri untuk melihat riwayat pesan dan mengirim tanggapan."}
                      </Text>
                    </Space>
                  </div>

                  {selectedTicket ? (
                    <Space size={10} wrap align="center">
                      <Button
                        loading={onUpdateLoading}
                        onClick={() => void handleUpdateStatus(nextTicketStatus)}
                        style={{
                          borderRadius: 8,
                          height: 36,
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        {selectedTicketStatus === "completed"
                          ? "Tandai Sedang Berjalan"
                          : "Tandai Selesai"}
                      </Button>

                      <Popconfirm
                        title="Hapus tiket ini?"
                        description="Tiket dan seluruh percakapan di dalamnya akan dihapus."
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
                            borderRadius: 8,
                            height: 36,
                            fontSize: 12.5,
                            fontWeight: 600,
                          }}
                        >
                          Hapus Tiket
                        </Button>
                      </Popconfirm>
                    </Space>
                  ) : null}
                </div>

                {/* Box Pesan Percakapan */}
                <Card
                  loading={fetchLoading || messagesLoading}
                  style={{
                    borderRadius: 14,
                    borderColor: "#e2e8f0",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                    background: "#ffffff",
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
                        mergedMessages.map((message, index) => {
                          const isNewDateGroup =
                            index === 0 ||
                            !isSameDay(
                              mergedMessages[index - 1]?.created_at,
                              message.created_at,
                            );

                          const isMine =
                            String(message.sender_id) === String(user_id);
                          const senderIdKey = String(message.sender_id ?? "");
                          const senderNameKey = (message.sender_name ?? "")
                            .trim()
                            .toLowerCase();

                          const resolvedAvatar =
                            userAvatarMap.get(senderIdKey) ||
                            (senderNameKey
                              ? userAvatarByNameMap.get(senderNameKey)
                              : undefined) ||
                            (isMine
                              ? getUserAvatarUrl(currentUser)
                              : undefined) ||
                            (message.sender_role?.toUpperCase() === "STUDENT"
                              ? getUserAvatarUrl(studentUser) ||
                                getStudentAvatarUrl({
                                  name: student_name,
                                } as UserDataModel)
                              : undefined);

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

                              <MessageBubble
                                message={message}
                                isMine={isMine}
                                currentUserName={currentUser?.name}
                                currentUserRole={currentUser?.role}
                                studentName={student_name}
                                senderAvatarUrl={resolvedAvatar}
                                renderText={renderMessageText}
                                onStartEdit={handleStartEditMessage}
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            minHeight: 280,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            padding: 24,
                          }}
                        >
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              background: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 22,
                              color: "#94a3b8",
                              marginBottom: 12,
                            }}
                          >
                            <MessageOutlined />
                          </div>
                          <Typography.Text strong style={{ fontSize: 14, color: "#334155", marginBottom: 4 }}>
                            Belum Ada Pesan
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                            {selectedConversationId
                              ? "Mulai percakapan dengan mengetik pesan di bawah ini."
                              : "Tiket ini belum terhubung ke percakapan."}
                          </Typography.Text>
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
                        mentionOptions={mentionOptions}
                        onTextChange={setChatText}
                        onSend={() => void handleSendMessage()}
                        onUpload={handleAttachmentUpload}
                        editingMessageId={editingMessageId}
                        editingText={editingText}
                        savingEditMessage={savingEditMessage}
                        onEditingTextChange={setEditingText}
                        onSaveEdit={handleSaveEditMessage}
                        onCancelEdit={handleCancelEditMessage}
                      />
                    </Space>
                  ) : (
                    <div
                      style={{
                        minHeight: 340,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: 32,
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          background: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          color: "#94a3b8",
                          marginBottom: 12,
                        }}
                      >
                        <MessageOutlined />
                      </div>
                      <Typography.Text strong style={{ fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
                        Belum Ada Tiket yang Dipilih
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 13, maxWidth: 360 }}>
                        Pilih salah satu tiket di sebelah kiri untuk membuka riwayat obrolan atau buat tiket baru.
                      </Typography.Text>
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
    </Space>
  );
}
