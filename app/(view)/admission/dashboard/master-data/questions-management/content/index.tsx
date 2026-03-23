"use client";

import { useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Input,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import ModalCreateBaseQuestion from "./ModalCreateBaseQuestion";
import {
  useQuestionBase,
  useQuestionBases,
} from "@/app/hooks/use-question-bases";
import {
  QuestionBaseDataModel,
  QuestionBasePayloadCreateModel,
  QuestionBasePayloadUpdateModel,
} from "@/app/models/question";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function QuestionManagementContent() {
  const [searchValue, setSearchValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [editingBase, setEditingBase] = useState<QuestionBaseDataModel | null>(
    null,
  );

  const router = useRouter();
  const { modal } = App.useApp();

  const {
    data: questionBases,
    fetchLoading,
    onCreate: onCreateQuestionBase,
    onCreateLoading,
    onDelete: onDeleteQuestionBase,
  } = useQuestionBases({});

  const { onUpdate: onUpdateQuestionBase, onUpdateLoading } = useQuestionBase({
    id: editingBase?.id ?? "",
  });

  const filteredBases = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const bases = questionBases ?? [];
    if (!query) return bases;
    return bases.filter((base) =>
      [base.name, base.desc ?? ""].some((text) =>
        String(text).toLowerCase().includes(query),
      ),
    );
  }, [questionBases, searchValue]);

  const handleCreateQuestionBase = async (
    payload: QuestionBasePayloadCreateModel,
  ) => {
    await onCreateQuestionBase(payload);
    setVisible(false);
    setEditingBase(null);
  };

  const handleUpdateQuestionBase = async (
    payload: QuestionBasePayloadUpdateModel,
  ) => {
    if (!editingBase) return;
    await onUpdateQuestionBase({ id: editingBase.id, payload });
    setVisible(false);
    setEditingBase(null);
  };

  const handleSubmit = async (payload: QuestionBasePayloadCreateModel) => {
    if (editingBase) return handleUpdateQuestionBase(payload);
    return handleCreateQuestionBase(payload);
  };

  const handleDeleteQuestionBase = (base: QuestionBaseDataModel) => {
    modal.confirm({
      title: "Delete Question Base",
      content: `Hapus question base "${base.name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => onDeleteQuestionBase(base.id),
    });
  };

  const modalInitialValues = useMemo<QuestionBasePayloadCreateModel>(
    () =>
      editingBase
        ? {
            name: editingBase.name,
            desc: editingBase.desc ?? undefined,
            type_country: editingBase.type_country,
            country_id: editingBase.country_id ?? undefined,
            allow_multiple_submissions: editingBase.allow_multiple_submissions,
            active: editingBase.active,
            version: editingBase.version,
          }
        : {
            active: true,
            allow_multiple_submissions: false,
            version: 1,
            name: "",
            type_country: "",
          },
    [editingBase],
  );

  const goToDetail = (id: string) => {
    router.push(
      `/admission/dashboard/master-data/questions-management/detail/${id}`,
    );
  };

  return (
    <div style={{ width: "100%" }}>
      <div>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {/* Header + actions: satu baris, search fleksibel */}
          <Flex justify="space-between" align="center" gap={12} wrap>
            <Space direction="vertical" size={0}>
              <Title level={3} style={{ margin: 0 }}>
                Question Base
              </Title>
              <Text type="secondary">
                Manage base question for each country
              </Text>
            </Space>

            <Flex
              gap={12}
              align="center"
              wrap
              style={{ flex: 1, justifyContent: "flex-end" }}
            >
              <Input
                allowClear
                placeholder="Search question base..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ maxWidth: 360, width: "100%" }}
              />
              <Button
                type="primary"
                shape="round"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingBase(null);
                  setVisible(true);
                }}
              >
                Create Base
              </Button>
            </Flex>
          </Flex>

          {/* Grid cards: tetap rapi satu area */}
          <Row gutter={[16, 16]}>
            {filteredBases.map((base) => {
              const statusLabel = base.active ? "Active" : "Draft";

              return (
                <Col key={base.id} xs={24} sm={12} lg={8}>
                  <Card
                    loading={fetchLoading}
                    style={{
                      borderRadius: 16,
                      borderColor: "#e5e7eb",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      <Flex justify="space-between" align="flex-start" gap={10}>
                        <Title
                          level={5}
                          onClick={() => goToDetail(base.id)}
                          style={{ cursor: "pointer", margin: 0, flex: 1 }}
                        >
                          {base.name}
                        </Title>
                        <Tag color={base.active ? "green" : "default"}>
                          {statusLabel}
                        </Tag>
                      </Flex>

                      <Text type="secondary" style={{ minHeight: 40 }}>
                        {base.desc ?? "Tidak ada deskripsi"}
                      </Text>

                      <Text type="secondary">Negara: {base.type_country}</Text>

                      <Divider style={{ margin: "8px 0" }} />

                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          Created:{" "}
                          {dayjs(base.created_at).format("YYYY-MM-DD HH:mm:ss")}
                        </Text>
                        <Text type="secondary">
                          Updated:{" "}
                          {dayjs(base.updated_at).format("YYYY-MM-DD HH:mm:ss")}
                        </Text>
                      </Space>

                      <Flex justify="space-between" align="center">
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditingBase(base);
                            setVisible(true);
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteQuestionBase(base)}
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <ModalCreateBaseQuestion
            visible={visible}
            onCancel={() => {
              setVisible(false);
              setEditingBase(null);
            }}
            onSubmit={handleSubmit}
            initialValues={modalInitialValues}
            title={editingBase ? "Edit Base Question" : "Create Base Question"}
            submitLabel={editingBase ? "Save Changes" : "Create"}
            loading={editingBase ? onUpdateLoading : onCreateLoading}
          />
        </Space>
      </div>
    </div>
  );
}
