"use client";

import {
  useUpdateUser,
  useUpdateVisaStatusUser,
  useUser,
} from "@/app/hooks/use-users";
import { useStudentNotes } from "@/app/hooks/use-student-notes";
import { NoteStudentDataModel } from "@/app/models/notes-student";
import type { UserDataModel } from "@/app/models/user";
import {
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Flex,
  List,
  Modal,
  Select,
  Space,
  Steps,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import ModalNotesComponent from "./ModalNotesComponent";
import OverviewComponent from "./tab-layout/OverviewComponent";
import LoadingSplash from "@/app/components/common/loading";
import DocumentsComponent from "./tab-layout/DocumentsComponent";
import CVComponents from "./tab-layout/CVComponents";
import LetterComponent from "./tab-layout/LetterComponent";
import ChatComponent from "./tab-layout/ChatComponent";
import ActivityLogComponent from "./tab-layout/ActivityLogComponent";
import TranslationComponent from "./tab-layout/TranslationComponent";

const allowedTabKeys = new Set([
  "overview",
  "documents",
  "translation",
  "data-cv",
  "letter",
  "chat",
  "activity-log",
]);

const visaStatusOptions = [
  { value: "Grant", label: "Grant" },
  { value: "On Going", label: "On Going" },
  { value: "Refused", label: "Refused" },
];

type StudentDetailExtraFields = {
  student_status?: string | null;
  visa_granted_at?: string | null;
  visa_grant_duration_days?: number | null;
  visa_grant_duration_label?: string | null;
  joined_at?: string | null;
  student_status_updated_by_id?: string | number | null;
  student_status_updated_by_name?: string | null;
  student_status_updated_at?: string | null;
  student_status_updated_at_label?: string | null;
};

type StudentDetailData = UserDataModel & StudentDetailExtraFields;

function formatDisplayDate(value?: string | null): string {
  if (!value || value === "0001-01-01T00:00:00Z") return "-";

  const parsed = dayjs(value);
  if (!parsed.isValid()) return "-";

  return parsed.format("DD MMM YYYY");
}

function formatDisplayDateTime(value?: string | null): string {
  if (!value || value === "0001-01-01T00:00:00Z") return "-";

  const parsed = dayjs(value);
  if (!parsed.isValid()) return "-";

  return parsed.format("DD MMM YYYY HH:mm");
}

function getStudentProcessDuration(student?: StudentDetailData | null): string {
  if (!student) return "-";

  if (student.visa_grant_duration_label) {
    return student.visa_grant_duration_label;
  }

  const startDate = student.joined_at || student.created_at;
  const endDate = student.visa_granted_at;

  if (!startDate || !endDate) return "Belum bisa dihitung";

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) return "Belum bisa dihitung";

  const totalDays = end.diff(start, "day");
  if (totalDays < 0) return "Belum bisa dihitung";

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  if (months > 0 && days > 0) return `${months} bulan ${days} hari`;
  if (months > 0) return `${months} bulan`;
  return `${days} hari`;
}

function getStudentStatusChangedInfo(
  student?: StudentDetailData | null,
): string {
  if (!student) return "Belum ada riwayat perubahan status";

  if (
    student.student_status_updated_by_name &&
    student.student_status_updated_at_label
  ) {
    return `Diubah oleh ${student.student_status_updated_by_name} pada ${student.student_status_updated_at_label}`;
  }

  if (
    student.student_status_updated_by_name &&
    student.student_status_updated_at
  ) {
    return `Diubah oleh ${student.student_status_updated_by_name} pada ${formatDisplayDateTime(student.student_status_updated_at)}`;
  }

  if (student.student_status_updated_at_label) {
    return `Status diperbarui pada ${student.student_status_updated_at_label}`;
  }

  if (student.student_status_updated_at) {
    return `Status diperbarui pada ${formatDisplayDateTime(student.student_status_updated_at)}`;
  }

  return "Belum ada riwayat perubahan status";
}

export default function StudentDetailContentPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;

  const requestedTab = searchParams.get("tab");
  const requestedConversationId =
    searchParams.get("conversation_id") ?? undefined;

  const {
    onUpdate: onUpdateVisaStatus,
    onUpdateLoading: onUpdateVisaStatusLoading,
  } = useUpdateVisaStatusUser();

  const { data } = useUser({ id: studentId as string });
  const detailStudentData = (data ?? null) as StudentDetailData | null;

  const { onUpdate: onUpdateUser, onUpdateLoading } = useUpdateUser();

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

  const [isModalNotesOpen, setIsModalNotesOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteStudentDataModel | null>(
    null,
  );
  const [manualActiveTab, setManualActiveTab] = useState("overview");
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);
  const [visaStatusModalOpen, setVisaStatusModalOpen] = useState(false);
  const [selectedVisaStatus, setSelectedVisaStatus] = useState<string>();

  const studentName = detailStudentData?.name ?? "Student";
  const studentEmail = detailStudentData?.email ?? "student@email.com";
  const studentCountry =
    detailStudentData?.stage?.country?.name ?? "Belum ada negara";
  const studentCampus = detailStudentData?.name_campus ?? "Belum ada kampus";
  const studentDegree =
    detailStudentData?.degree ??
    detailStudentData?.name_degree ??
    "Belum ada degree";

  const visaTypeLabel = detailStudentData?.visa_type
    ? detailStudentData.visa_type.replace(/_/g, " ").toUpperCase()
    : "Belum dipilih";

  const statusLabel =
    detailStudentData?.visa_status ??
    detailStudentData?.student_status ??
    detailStudentData?.status ??
    "ON GOING";

  const joinedAtLabel = formatDisplayDate(
    detailStudentData?.joined_at || detailStudentData?.created_at,
  );
  const visaGrantedAtLabel = formatDisplayDate(
    detailStudentData?.visa_granted_at,
  );
  const processDuration = getStudentProcessDuration(detailStudentData);
  const statusChangedInfo = getStudentStatusChangedInfo(detailStudentData);

  const notesSource = useMemo(
    () => (notesData?.length ? notesData : (detailStudentData?.notes ?? [])),
    [detailStudentData?.notes, notesData],
  );

  const handleEditNote = (note: NoteStudentDataModel) => {
    setSelectedNote(note);
    setIsModalNotesOpen(true);
  };

  const handleDeleteNote = async (note: NoteStudentDataModel) => {
    if (!note.id) return;
    await onDeleteNote(note.id);
  };

  const handleOpenModalNotes = () => {
    setSelectedNote(null);
    setIsModalNotesOpen(true);
  };

  const handleCloseModalNotes = () => {
    setSelectedNote(null);
    setIsModalNotesOpen(false);
  };

  const handleOpenVisaStatusModal = () => {
    setSelectedVisaStatus(
      detailStudentData?.visa_status ??
        detailStudentData?.student_status ??
        detailStudentData?.status ??
        "ON GOING",
    );
    setVisaStatusModalOpen(true);
  };

  const handleCloseVisaStatusModal = () => {
    setVisaStatusModalOpen(false);
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

  const handleSubmitVisaStatus = async () => {
    if (!studentId || !selectedVisaStatus) return;

    await onUpdateVisaStatus({
      id: studentId,
      visa_status: selectedVisaStatus,
    });

    setVisaStatusModalOpen(false);
  };

  const notesItems = useMemo(() => {
    return notesSource.map((note) => ({
      id: note.id,
      author: "Internal",
      note: note.content ?? "-",
      time: note.created_at ? formatDisplayDateTime(note.created_at) : "-",
      raw: note,
    }));
  }, [notesSource]);

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

  const currentStageIndex = useMemo(() => {
    if (!detailStudentData?.current_step_id) return 0;
    const foundIndex = stepsSource.findIndex(
      (step) => String(step.id) === String(detailStudentData.current_step_id),
    );
    return foundIndex >= 0 ? foundIndex : 0;
  }, [detailStudentData?.current_step_id, stepsSource]);

  const handleSelectStage = useCallback(
    async (index: number) => {
      if (!studentId) return;
      const currentStep = stepsSource[index];
      if (!currentStep?.id) return;

      const nextStep = stepsSource[index + 1];
      const targetStepId =
        index === currentStageIndex && nextStep?.id
          ? nextStep.id
          : currentStep.id;

      setUpdatingStageId(targetStepId);

      try {
        await onUpdateUser({
          id: studentId,
          payload: {
            current_step_id: targetStepId,
          },
        });
      } finally {
        setUpdatingStageId(null);
      }
    },
    [currentStageIndex, onUpdateUser, stepsSource, studentId],
  );

  const progressPercent = useMemo(() => {
    if (!stepsSource.length) return 0;
    return Math.round(((currentStageIndex + 1) / stepsSource.length) * 100);
  }, [currentStageIndex, stepsSource.length]);

  const progressSteps = useMemo(
    () =>
      stepsSource.map((step, index) => {
        const isDone = index < currentStageIndex;
        const isCurrent = index === currentStageIndex;
        const canSelect = Boolean(step?.id);

        return {
          title: (
            <Flex align="center" justify="space-between" gap={12}>
              <div>
                <Typography.Text
                  strong={isCurrent}
                  style={{
                    textDecoration: isDone ? "line-through" : "none",
                    color: isDone ? "#94a3b8" : undefined,
                  }}
                >
                  {step.label}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  style={{
                    display: "block",
                    marginTop: 2,
                    textDecoration: isDone ? "line-through" : "none",
                  }}
                >
                  {step.children?.map((child) => child.label).join(", ") ??
                    "Belum ada detail"}
                </Typography.Text>
              </div>
            </Flex>
          ),
          status: isDone
            ? ("finish" as const)
            : isCurrent
              ? ("process" as const)
              : ("wait" as const),
        };
      }),
    [
      currentStageIndex,
      handleSelectStage,
      onUpdateLoading,
      stepsSource,
      updatingStageId,
    ],
  );

  const tabsItems = [
    {
      key: "overview",
      label: "Overview",
      children:
        detailStudentData && studentId ? (
          <OverviewComponent
            detailStudent={detailStudentData}
            student_id={studentId}
          />
        ) : (
          <LoadingSplash />
        ),
    },
    {
      key: "documents",
      label: "Documents",
      children: studentId ? (
        <DocumentsComponent student_id={studentId} />
      ) : null,
    },
    {
      key: "translation",
      label: "Translation",
      children: studentId ? (
        <TranslationComponent
          student_id={studentId}
          student_name={studentName}
          student_country={detailStudentData?.stage?.country?.name || ""}
          translation_quota={detailStudentData?.translation_quota || 0}
        />
      ) : null,
    },
    {
      key: "data-cv",
      label: "Data & CV",
      children: studentId ? <CVComponents student_id={studentId} /> : null,
    },
    {
      key: "letter",
      label: "Letter",
      children: <LetterComponent />,
    },
    {
      key: "chat",
      label: "Chat",
      children: studentId ? (
        <ChatComponent
          student_id={studentId}
          student_name={detailStudentData?.name}
          initialConversationId={requestedConversationId}
        />
      ) : null,
    },
    {
      key: "activity-log",
      label: "Activity Log",
      children: <ActivityLogComponent />,
    },
  ];

  const activeTab = useMemo(() => {
    if (requestedTab && allowedTabKeys.has(requestedTab)) {
      return requestedTab;
    }
    return manualActiveTab;
  }, [manualActiveTab, requestedTab]);

  const handleTabChange = useCallback(
    (nextTab: string) => {
      setManualActiveTab(nextTab);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", nextTab);

      if (nextTab !== "chat") {
        nextParams.delete("conversation_id");
      }

      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        Student Case Detail
      </Typography.Title>

      <Card
        styles={{ body: { padding: 16 } }}
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
                No Phone:{" "}
                {detailStudentData?.no_phone ?? "Belum ada nomor telepon"}
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
                <Flex align="center" justify="space-between" gap={8} wrap>
                  <Typography.Text strong>Note</Typography.Text>
                  <Button size="small" onClick={handleOpenModalNotes}>
                    +
                  </Button>
                </Flex>

                <List
                  dataSource={notesItems}
                  locale={{ emptyText: "Belum ada catatan" }}
                  renderItem={(item) => (
                    <List.Item style={{ paddingInline: 0 }}>
                      <Flex
                        align="start"
                        justify="space-between"
                        style={{ width: "100%" }}
                        gap={10}
                      >
                        <div style={{ flex: 1 }}>
                          <Typography.Text>{item.note}</Typography.Text>
                          <Typography.Text
                            type="secondary"
                            style={{ display: "block", fontSize: 12 }}
                          >
                            {item.time}
                          </Typography.Text>
                        </div>

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
              </div>
            </Space>
          </Space>

          <Space direction="vertical" size={8}>
            <Typography.Text strong>
              {stepsSource.length || 0}-Step Progress
            </Typography.Text>
            <Steps direction="vertical" size="small" items={progressSteps} />
            <Typography.Text type="secondary">
              {progressPercent}% Complete
            </Typography.Text>
          </Space>

          <div
            style={{
              background: "#f1f5f9",
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
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
                  {visaTypeLabel}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text strong>Status Last Updated</Typography.Text>
                <Typography.Text style={{ display: "block" }}>
                  {statusChangedInfo}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text strong>Joined At</Typography.Text>
                <Typography.Text style={{ display: "block" }}>
                  {joinedAtLabel}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text strong>Visa Granted At</Typography.Text>
                <Typography.Text style={{ display: "block" }}>
                  {visaGrantedAtLabel}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text strong>Lama Proses Student</Typography.Text>
                <Typography.Text style={{ display: "block" }}>
                  {processDuration}
                </Typography.Text>
              </div>

              <div>
                <Typography.Text strong>PIC Admission</Typography.Text>
                <Typography.Text style={{ display: "block" }}>
                  {detailStudentData?.student_status_updated_by_name || "-"}
                </Typography.Text>
              </div>

              <Button
                type="primary"
                block
                onClick={handleOpenVisaStatusModal}
                loading={onUpdateVisaStatusLoading}
              >
                Update Status
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabsItems}
      />

      <ModalNotesComponent
        open={isModalNotesOpen}
        onClose={handleCloseModalNotes}
        user_id={studentId ? String(studentId) : undefined}
        loading={onCreateNoteLoading || onUpdateNoteLoading}
        selectedNote={selectedNote}
        onSubmit={handleSubmitNote}
      />

      <Modal
        open={visaStatusModalOpen}
        title="Update Visa Status"
        onCancel={handleCloseVisaStatusModal}
        onOk={() => void handleSubmitVisaStatus()}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={onUpdateVisaStatusLoading}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Pilih status visa terbaru untuk student ini.
          </Typography.Text>
          <Select
            value={selectedVisaStatus}
            onChange={setSelectedVisaStatus}
            options={visaStatusOptions}
            placeholder="Pilih status visa"
            style={{ width: "100%" }}
          />
        </Space>
      </Modal>
    </Space>
  );
}
