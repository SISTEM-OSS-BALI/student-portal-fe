"use client";

import { useStudentNotes } from "@/app/hooks/use-student-notes";
import { useUser } from "@/app/hooks/use-users";
import { NoteStudentDataModel } from "@/app/models/notes-student";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Flex,
  List,
  Space,
  Steps,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import ModalNotesComponent from "./ModalNotesComponent";
import OverviewComponent from "./tab-layout/OverviewComponent";
import LoadingSplash from "@/app/components/common/loading";
import DocumentsComponent from "./tab-layout/DocumentsComponent";
import TranslationComponent from "./tab-layout/TranslationComponent";
import CVComponents from "./tab-layout/CVComponents";

export default function StudentDetailContentPage() {
  const params = useParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data: detailStudentData } = useUser({ id: studentId as string });

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
  const [activeTab, setActiveTab] = useState("overview");
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

  const notesItems = useMemo(() => {
    return notesSource.map((note) => ({
      id: note.id,
      author: "Internal",
      note: note.content ?? "-",
      time: note.created_at ? new Date(note.created_at).toLocaleString() : "-",
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

  const progressSteps = stepsSource.map((step, index) => ({
    title: step.label,
    description:
      step.children?.map((child) => child.label).join(", ") ??
      "Belum ada detail",
    status: index === 0 ? ("process" as const) : ("wait" as const),
  }));

  const tabsItems = [
    {
      key: "overview",
      label: "Overview",
      children: detailStudentData && studentId ? (
        <OverviewComponent
          detailStudent={detailStudentData}
          student_id={studentId}
        />
      ) : (
        <LoadingSplash/>
      ),
    },
    {
      key: "documents",
      label: "Documents",
      children: studentId ? <DocumentsComponent student_id={studentId} /> : null,
    },
    {
      key: "translation",
      label: "Translation",
      children: studentId ? (
        <TranslationComponent
          student_id={studentId}
          student_name={studentName}
          student_country={detailStudentData?.stage?.country?.name}
          translation_quota={detailStudentData?.translation_quota}
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
