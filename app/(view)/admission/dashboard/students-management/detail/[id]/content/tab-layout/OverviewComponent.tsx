"use client";

import { useUsers } from "@/app/hooks/use-users";
import { useDocumentTranslations } from "@/app/hooks/use-document-translations";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useGeneratedCvAiDocuments } from "@/app/hooks/use-generated-cv-ai-documents";
import { useGeneratedStatementLetterAiDocuments } from "@/app/hooks/use-generated-statement-letter-ai-documents";
import { useGeneratedSponsorLetterAiDocuments } from "@/app/hooks/use-generated-sponsor-letter-ai-documents";
import { useAuth } from "@/app/utils/use-auth";
import {
  useChatMessages,
  useGetOrCreateContextConversation,
} from "@/app/hooks/use-chat";
import { useChatSocket } from "@/app/hooks/use-chat-socket";
import type { ChatMessage } from "@/app/models/chat";
import type { UserDataModel } from "@/app/models/user";
import {
  App,
  Avatar,
  Button,
  Card,
  Flex,
  Image,
  List,
  Mentions,
  Progress,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloseOutlined, PaperClipOutlined } from "@ant-design/icons";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { UploadedChatAttachment } from "@/app/vendor/chat-upload";
import { uploadChatFiles } from "@/app/vendor/chat-upload";
import { useRouter } from "next/navigation";

interface OverviewComponentProps {
  detailStudent: UserDataModel;
  student_id: string;
}

const isMentionableRole = (role?: string) => {
  const r = (role ?? "").toUpperCase();
  return r === "ADMISSION" || r === "DIRECTOR" || r === "CONSULTANT";
};

const normalizeHandle = (value?: string | null) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
};

const getLegacyEmailHandle = (user: UserDataModel) => {
  const email = user.email ?? "";
  return normalizeHandle(email.split("@")[0] ?? "");
};

const getUserHandle = (user: UserDataModel) => {
  const fromName = normalizeHandle(user.name);
  if (fromName) return fromName;
  return getLegacyEmailHandle(user);
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
      const preferredHandle = getUserHandle(user);
      const legacyHandle = getLegacyEmailHandle(user);
      if (preferredHandle) map.set(preferredHandle, user);
      if (legacyHandle) map.set(legacyHandle, user);
    });
    return map;
  }, [mentionableUsers]);

  const mentionOptions = useMemo(() => {
    return mentionableUsers
      .filter((user) => String(user.id) !== String(currentUserId))
      .map((user) => {
        const handle = getUserHandle(user);
        const initials = user.name
          .split(" ")
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        const roleLabel = (user.role ?? "STAFF").toUpperCase();
        const roleColor = roleLabel === "DIRECTOR" ? "gold" : "blue";

        return {
          value: handle,
          label: (
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
                  flexShrink: 0,
                }}
              >
                {initials || handle.slice(0, 2).toUpperCase()}
              </Avatar>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography.Text
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {user.name}
                  </Typography.Text>

                  <Tag
                    color={roleColor}
                    style={{ marginInline: 0, fontSize: 10 }}
                  >
                    {roleLabel}
                  </Tag>
                </div>

                <Typography.Text
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    background: "#e2e8f0",
                    borderRadius: 999,
                    padding: "1px 6px",
                    width: "fit-content",
                    marginTop: 4,
                  }}
                >
                  @{handle}
                </Typography.Text>
              </div>
            </div>
          ),
        };
      });
  }, [mentionableUsers, currentUserId]);

  const extractMentionUserIds = useCallback(
    (text: string) => {
      const matches = text.match(/@([a-zA-Z0-9._-]+)/g) ?? [];
      const ids = new Set<string>();

      matches.forEach((raw) => {
        const handle = raw.slice(1);
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

export default function OverviewComponent({
  ...props
}: OverviewComponentProps) {
  const rawId = props.student_id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const detailStudentData = props.detailStudent;

  const { notification } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user_id: currentUserId } = useAuth();
  const { data: usersData } = useUsers({ enabled: Boolean(currentUserId) });
  const { getOrCreate: getOrCreateContextConversation } =
    useGetOrCreateContextConversation();

  const [studentConversationId, setStudentConversationId] = useState<
    string | undefined
  >();
  const [conversationError, setConversationError] = useState(false);
  const fetchingConversationRef = useRef(false);
  const [localMessagesByConversation, setLocalMessagesByConversation] =
    useState<Record<string, ChatMessage[]>>({});
  const [chatText, setChatText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    UploadedChatAttachment[]
  >([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  const { data: translationItems = [] } = useDocumentTranslations({
    queryString: studentId ? `student_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
  });
  const { data: answerApprovalItems = [] } = useAnswerApprovals({
    queryString: studentId ? `student_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
  });
  const { data: cvDocuments = [] } = useGeneratedCvAiDocuments({
    studentId,
    enabled: Boolean(studentId),
  });
  const { data: statementDocuments = [] } =
    useGeneratedStatementLetterAiDocuments({
      studentId,
      enabled: Boolean(studentId),
    });
  const { data: sponsorDocuments = [] } = useGeneratedSponsorLetterAiDocuments({
    studentId,
    enabled: Boolean(studentId),
  });

  const { mentionOptions, extractMentionUserIds, renderMessageText } =
    useMentionHelpers(usersData, currentUserId);

  const currentUser = useMemo(() => {
    if (!currentUserId) return undefined;
    return (usersData ?? []).find((user) => String(user.id) === currentUserId);
  }, [usersData, currentUserId]);

  const currentUserHandle = useMemo(() => {
    if (!currentUser) return "";
    return getUserHandle(currentUser);
  }, [currentUser]);

  const conversation_id = studentConversationId;

  useEffect(() => {
    if (!studentId || !currentUserId) return;
    if (studentConversationId) return;
    if (fetchingConversationRef.current) return;

    fetchingConversationRef.current = true;
    getOrCreateContextConversation({
      context_type: "student",
      context_user_id: String(studentId),
    })
      .then((res) => {
        const id = extractConversationId(res.data);
        if (id) {
          setStudentConversationId(id);
        } else {
          setConversationError(true);
        }
      })
      .catch(() => setConversationError(true))
      .finally(() => {
        fetchingConversationRef.current = false;
      });
  }, [studentId, currentUserId, studentConversationId, getOrCreateContextConversation]);

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

  const mergedChatMessages = useMemo(() => {
    return mergeChatMessages(
      chatMessagesData ?? [],
      (conversation_id && localMessagesByConversation[conversation_id]) || [],
    );
  }, [
    chatMessagesData,
    conversation_id,
    localMessagesByConversation,
    mergeChatMessages,
  ]);

  const internalChatMessages = useMemo(() => {
    return mergedChatMessages.filter((message) => {
      const senderRole = String(
        message.sender_role ??
          (String(message.sender_id) === String(currentUserId)
            ? currentUser?.role
            : String(message.sender_id) === String(studentId)
              ? "STUDENT"
              : ""),
      ).toUpperCase();

      if (senderRole === "STUDENT") {
        return false;
      }

      return String(message.sender_id) !== String(studentId);
    });
  }, [mergedChatMessages, currentUserId, currentUser?.role, studentId]);

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
          mention_user_ids,
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
    [studentId],
  );

  const handleChatTextChange = useCallback((value: string) => {
    setChatText(value);
  }, []);

  const handleAttachmentUpload = useCallback(
    async (file: File) => {
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
    },
    [notification],
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  }, []);

  const handleSendChat = useCallback(async () => {
    const content = chatText.trim();
    const attachmentsToSend = [...pendingAttachments];
    const hasAttachments = attachmentsToSend.length > 0;

    if (!content && !hasAttachments) return;

    if (!conversation_id) {
      notification.warning({
        message: "Menyiapkan ruang catatan",
        description: "Tunggu sebentar, ruang catatan untuk student ini sedang disiapkan.",
      });
      return;
    }

    const mention_user_ids = extractMentionUserIds(content);

    try {
      setChatText("");
      setPendingAttachments([]);

      const message = await sendMessageViaApi(
        conversation_id,
        content,
        mention_user_ids,
        attachmentsToSend,
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
      setPendingAttachments(attachmentsToSend);
    }
  }, [
    chatText,
    pendingAttachments,
    extractMentionUserIds,
    conversation_id,
    notification,
    sendMessageViaApi,
    mergeChatMessages,
  ]);

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

  const formatRelativeTime = useCallback((value?: string | null) => {
    if (!value) return "Updated recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Updated recently";

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }, []);

  const stepsSource = useMemo(() => {
    const raw = detailStudentData?.stage?.country?.steps ?? [];

    return [...raw].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });
  }, [detailStudentData?.stage?.country?.steps]);

  const currentStepIndex = useMemo(() => {
    const currentStepId = String(detailStudentData?.current_step_id ?? "");
    if (!currentStepId) return -1;
    return stepsSource.findIndex((step) => step.id === currentStepId);
  }, [detailStudentData?.current_step_id, stepsSource]);

  const progressSummary = useMemo(() => {
    const totalSteps = stepsSource.length;
    const visaGranted = String(detailStudentData?.visa_status ?? "")
      .toLowerCase()
      .includes("grant");

    const completedSteps = visaGranted
      ? totalSteps
      : currentStepIndex >= 0
        ? currentStepIndex
        : 0;

    const percent = totalSteps
      ? Math.round((completedSteps / totalSteps) * 100)
      : 0;

    return {
      totalSteps,
      completedSteps,
      percent,
    };
  }, [currentStepIndex, detailStudentData?.visa_status, stepsSource.length]);

  const currentStepLabel = useMemo(() => {
    if (!detailStudentData?.current_step_id) return "Step";
    return (
      stepsSource.find((step) => step.id === detailStudentData.current_step_id)
        ?.label ?? "Step"
    );
  }, [detailStudentData?.current_step_id, stepsSource]);

  const activityItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      meta: string;
      time: string;
      sortTime: number;
    }> = [];

    translationItems.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      items.push({
        id: `translation-${item.id}`,
        title: item.file_name
          ? `Admission uploaded translated ${item.file_name}`
          : "Admission uploaded translated document",
        meta: `${currentStepLabel} • Admission`,
        time: formatRelativeTime(rawTime),
        sortTime: new Date(rawTime).getTime(),
      });
    });

    answerApprovalItems.forEach((item) => {
      const rawTime = item.reviewed_at ?? item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();

      items.push({
        id: `approval-${item.id}`,
        title:
          status === "approved"
            ? "Document approved by Director"
            : "Document waiting director review",
        meta: `${currentStepLabel} • Director`,
        time: formatRelativeTime(rawTime),
        sortTime: new Date(rawTime).getTime(),
      });
    });

    cvDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      items.push({
        id: `cv-${item.id}`,
        title:
          String(item.status ?? "").toLowerCase() === "submitted_to_director"
            ? "CV sent to Director for approval"
            : "CV updated",
        meta: `${currentStepLabel} • Admission`,
        time: formatRelativeTime(rawTime),
        sortTime: new Date(rawTime).getTime(),
      });
    });

    statementDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();

      items.push({
        id: `statement-${item.id}`,
        title:
          status === "submitted_to_director"
            ? "Statement letter sent to Director for approval"
            : "Statement letter updated",
        meta: `${currentStepLabel} • Admission`,
        time: formatRelativeTime(rawTime),
        sortTime: new Date(rawTime).getTime(),
      });
    });

    sponsorDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();

      items.push({
        id: `sponsor-${item.id}`,
        title:
          status === "submitted_to_director"
            ? "Sponsor letter sent to Director for approval"
            : "Sponsor letter updated",
        meta: `${currentStepLabel} • Admission`,
        time: formatRelativeTime(rawTime),
        sortTime: new Date(rawTime).getTime(),
      });
    });

    if (detailStudentData?.student_status_updated_at) {
      items.push({
        id: `student-status-${detailStudentData.id}`,
        title: `Student status updated to ${detailStudentData.student_status ?? "On Going"}`,
        meta: `${detailStudentData.student_status_updated_by_name ?? "Admission"} • Student case`,
        time: formatRelativeTime(detailStudentData.student_status_updated_at),
        sortTime: new Date(
          detailStudentData.student_status_updated_at,
        ).getTime(),
      });
    }

    if (detailStudentData?.visa_granted_at) {
      items.push({
        id: `visa-${detailStudentData.id}`,
        title: `Visa status updated to ${detailStudentData.visa_status ?? "Grant"}`,
        meta: `${stepsSource.at(-1)?.label ?? "Final Step"} • System`,
        time: formatRelativeTime(detailStudentData.visa_granted_at),
        sortTime: new Date(detailStudentData.visa_granted_at).getTime(),
      });
    }

    return items
      .filter((item) => !Number.isNaN(item.sortTime))
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 6);
  }, [
    answerApprovalItems,
    currentStepLabel,
    cvDocuments,
    detailStudentData?.id,
    detailStudentData?.student_status,
    detailStudentData?.student_status_updated_at,
    detailStudentData?.student_status_updated_by_name,
    detailStudentData?.visa_granted_at,
    detailStudentData?.visa_status,
    formatRelativeTime,
    sponsorDocuments,
    statementDocuments,
    stepsSource,
    translationItems,
  ]);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <Card
          styles={{ body: { padding: 16 } }}
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
                {`${progressSummary.completedSteps} dari ${progressSummary.totalSteps || 0} tugas selesai`}
              </Typography.Text>
              <Progress percent={progressSummary.percent} showInfo={false} />
              <Typography.Text type="secondary">
                {progressSummary.percent}% Complete
              </Typography.Text>
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
          styles={{ body: { padding: 16 } }}
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
              <Typography.Link
                onClick={() =>
                  router.push(
                    `/admission/dashboard/students-management/detail/${studentId}?tab=activity-log`,
                  )
                }
              >
                View all
              </Typography.Link>
            </div>

            <List
              dataSource={activityItems}
              locale={{ emptyText: "Belum ada aktivitas" }}
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
        styles={{ body: { padding: 20 } }}
        style={{
          borderRadius: 20,
          borderColor: "#dbe4ee",
          background:
            "linear-gradient(180deg, #ffffff 0%, #fbfdff 45%, #f8fbff 100%)",
          boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <Typography.Text strong style={{ fontSize: 20, color: "#0f172a" }}>
              Notes for This Student
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 14 }}>
              Internal notes and communication log
            </Typography.Text>
          </div>

          {!conversation_id && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {conversationError
                ? "Gagal menyiapkan ruang catatan. Coba muat ulang halaman."
                : "Menyiapkan ruang catatan untuk student ini..."}
            </Typography.Text>
          )}

          <div
            style={{
              maxHeight: 340,
              overflowY: "auto",
              overflowX: "hidden",
              padding: 8,
              borderRadius: 16,
              border: "1px solid #e6edf5",
              background: "rgba(255,255,255,0.78)",
            }}
          >
            <List
              dataSource={internalChatMessages}
              locale={{ emptyText: "Belum ada pesan" }}
              renderItem={(message) => {
                const isMine =
                  String(message.sender_id) === String(currentUserId);
                const timeLabel = message.created_at
                  ? new Date(message.created_at).toLocaleString()
                  : "-";
                const mentionIds = message.mention_user_ids ?? [];
                const isMentioned =
                  (currentUserId && mentionIds.includes(currentUserId)) ||
                  (currentUserHandle &&
                    (message.text ?? "").includes(`@${currentUserHandle}`));
                const attachments = message.attachments ?? [];
                const senderName =
                  message.sender_name ??
                  (isMine
                    ? (currentUser?.name ?? "You")
                    : (props.detailStudent?.name ?? "Student"));
                const senderRole =
                  message.sender_role ??
                  (isMine ? (currentUser?.role ?? "ADMISSION") : "STUDENT");

                return (
                  <List.Item style={{ paddingInline: 0, border: "none" }}>
                    <Flex
                      style={{ width: "100%" }}
                      justify={isMine ? "flex-end" : "flex-start"}
                    >
                      <div style={{ maxWidth: "76%", position: "relative" }}>
                        <Space
                          direction="vertical"
                          size={6}
                          style={{
                            width: "100%",
                            background: isMine
                              ? "#dcf8c6"
                              : isMentioned
                                ? "#fff4c7"
                                : "#ffffff",
                            border: isMine
                              ? "1px solid #b8e6a0"
                              : isMentioned
                                ? "1px solid #f3dc8d"
                                : "1px solid #e5e7eb",
                            padding: "10px 14px",
                            borderRadius: isMine
                              ? "16px 6px 16px 16px"
                              : "6px 16px 16px 16px",
                            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
                          }}
                        >
                        <Flex
                          align="center"
                          justify="space-between"
                          gap={10}
                          wrap
                        >
                          <Space size={8} align="center" wrap>
                            <Typography.Text strong style={{ fontSize: 12 }}>
                              {senderName}
                            </Typography.Text>

                            <Tag
                              color={getRoleTagColor(senderRole)}
                              style={{ margin: 0, fontSize: 10 }}
                            >
                              {formatRoleLabel(senderRole)}
                            </Tag>

                            {isMentioned && !isMine && (
                              <Tag color="gold" style={{ margin: 0 }}>
                                Mentioned you
                              </Tag>
                            )}
                          </Space>
                        </Flex>

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
                                  <Image
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
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            ...(isMine ? { right: -6 } : { left: -6 }),
                            width: 12,
                            height: 12,
                            background: isMine
                              ? "#dcf8c6"
                              : isMentioned
                                ? "#fff4c7"
                                : "#ffffff",
                            borderBottom: isMine
                              ? "1px solid #b8e6a0"
                              : isMentioned
                                ? "1px solid #f3dc8d"
                                : "1px solid #e5e7eb",
                            borderRight: isMine
                              ? "1px solid #b8e6a0"
                              : "none",
                            borderLeft: !isMine
                              ? isMentioned
                                ? "1px solid #f3dc8d"
                                : "1px solid #e5e7eb"
                              : "none",
                            transform: isMine
                              ? "rotate(-35deg)"
                              : "rotate(35deg)",
                          }}
                        />
                      </div>
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

          <Space.Compact
            style={{
              width: "100%",
              border: "1px solid #dbe4ee",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)",
              background: "#ffffff",
            }}
          >
            <Upload
              multiple
              beforeUpload={handleAttachmentUpload}
              showUploadList={false}
            >
              <Button
                icon={<PaperClipOutlined />}
                loading={uploadingAttachments}
                style={{
                  border: "none",
                  borderRight: "1px solid #e2e8f0",
                  height: 48,
                  width: 52,
                  borderRadius: 0,
                }}
              />
            </Upload>

            <Mentions
              placeholder="Tulis catatan atau pesan... (gunakan @ untuk tag)"
              value={chatText}
              onChange={handleChatTextChange}
              onPressEnter={(event) => {
                event.preventDefault();
                void handleSendChat();
              }}
              disabled={!currentUserId}
              style={{ width: "100%" }}
              options={mentionOptions}
              styles={{
                textarea: {
                  borderRadius: 0,
                  minHeight: 48,
                  paddingTop: 12,
                  paddingBottom: 12,
                },
              }}
            />

            <Button
              type="primary"
              onClick={() => void handleSendChat()}
              disabled={
                (!chatText.trim() && pendingAttachments.length === 0) ||
                !currentUserId ||
                !conversation_id
              }
              style={{
                border: "none",
                borderLeft: "1px solid #e2e8f0",
                height: 48,
                minWidth: 88,
                borderRadius: 0,
              }}
            >
              Send
            </Button>
          </Space.Compact>
        </Space>
      </Card>
    </Space>
  );
}
