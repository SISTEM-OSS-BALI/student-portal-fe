"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Space,
  Tag,
  Typography,
  Flex,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { useQuestion, useQuestions } from "@/app/hooks/use-questions";
import type {
  QuestionDataModel,
  QuestionPayloadCreateModel,
  QuestionPayloadUpdateModel,
} from "@/app/models/question";
import ModalQuestionComponent from "./ModalQuestionComponent";
import SearchBarComponent from "@/app/components/common/search-bar";

const { Title, Text } = Typography;

export default function DetailQuestionComponent() {
  const [searchValue, setSearchValue] = useState("");
  const params = useParams();
  const base_id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { modal } = App.useApp();
  const [editingQuestion, setEditingQuestion] =
    useState<QuestionDataModel | null>(null);

  const {
    data: questions,
    onCreate: onCreateQuestion,
    onCreateLoading,
    fetchLoading,
    onDelete: onDeleteQuestion,
  } = useQuestions({
    queryString: base_id ? `base_id=${base_id}` : undefined,
  });

  const { onUpdate: onUpdateQuestion, onUpdateLoading } = useQuestion({
    id: editingQuestion?.id ?? "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredQuestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const items = questions ?? [];
    if (!query) return items;
    return items.filter((item) =>
      [item.text, item.help_text ?? "", item.input_type].some((text) =>
        String(text).toLowerCase().includes(query),
      ),
    );
  }, [questions, searchValue]);

  const handleDelete = (item: QuestionDataModel) => {
    modal.confirm({
      title: "Delete Question",
      content: `Hapus pertanyaan "${item.text}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => onDeleteQuestion(item.id), // return promise biar modal loading bener
    });
  };

  const handleSubmit = async (data: QuestionPayloadCreateModel) => {
    const resolvedBaseId =
      data.base_id ?? (base_id ? String(base_id) : undefined);

    if (editingQuestion) {
      const payload: QuestionPayloadUpdateModel = {
        ...data,
        base_id: resolvedBaseId,
      };
      await onUpdateQuestion({ id: editingQuestion.id, payload });
      setEditingQuestion(null);
      setIsModalOpen(false);
      return;
    }

    if (!resolvedBaseId) return;
    const payload: QuestionPayloadCreateModel = {
      ...data,
      base_id: resolvedBaseId,
    };
    await onCreateQuestion(payload);
    setIsModalOpen(false);
  };

  return (
    <div style={{ width: "100%" }}>
      <div>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          {/* Header + action */}
          <Flex justify="space-between" align="flex-start" gap={12} wrap>
            <Space direction="vertical" size={4}>
              <Title level={3} style={{ margin: 0 }}>
                Form Questions
              </Title>
              <Text type="secondary">
                Manage and organize your form questions
              </Text>
            </Space>

            <Button
              type="primary"
              shape="round"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingQuestion(null);
                setIsModalOpen(true);
              }}
            >
              Create Multiple
            </Button>
          </Flex>

          <SearchBarComponent
            placeholder="Search questions..."
            handleChange={setSearchValue}
          />

          {/* List */}
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {filteredQuestions.map((item) => (
              <Card
                key={item.id}
                loading={fetchLoading}
                style={{
                  borderRadius: 16,
                  borderColor: "#e5e7eb",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Flex justify="space-between" align="flex-start" gap={12}>
                    <Space direction="vertical" size={2} style={{ flex: 1 }}>
                      <Title level={5} style={{ margin: 0 }}>
                        {item.text}
                      </Title>
                      <Text type="secondary">
                        {item.help_text ?? item.placeholder ?? ""}
                      </Text>
                    </Space>

                    <Button icon={<CopyOutlined />} shape="circle" />
                  </Flex>

                  <Flex gap={8} wrap>
                    <Tag color="blue">{item.input_type}</Tag>
                    {item.required ? <Tag color="red">Required</Tag> : null}
                    <Tag>Order: {item.order}</Tag>
                  </Flex>

                  <Alert
                    type="info"
                    showIcon={false}
                    message={
                      item.options?.length
                        ? `Options: ${item.options
                            .map((o) => o.label)
                            .join(", ")}`
                        : "No options – Text input field"
                    }
                  />

                  <Flex justify="space-between" align="center" gap={12} wrap>
                    <Text type="secondary">
                      Updated:{" "}
                      {dayjs(item.updated_at).format("YYYY-MM-DD HH:mm:ss")}
                    </Text>

                    <Space>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingQuestion(item);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </Button>
                    </Space>
                  </Flex>
                </Space>
              </Card>
            ))}

            {!fetchLoading && filteredQuestions.length === 0 ? (
              <Text type="secondary">Belum ada pertanyaan.</Text>
            ) : null}
          </Space>
        </Space>
      </div>

      <ModalQuestionComponent
        visible={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleSubmit}
        base_id={base_id ? String(base_id) : undefined}
        initialValues={
          editingQuestion
            ? {
                base_id: editingQuestion.base_id,
                text: editingQuestion.text,
                input_type: editingQuestion.input_type,
                required: editingQuestion.required,
                order: editingQuestion.order,
                help_text: editingQuestion.help_text ?? undefined,
                placeholder: editingQuestion.placeholder ?? undefined,
                min_length: editingQuestion.min_length ?? undefined,
                max_length: editingQuestion.max_length ?? undefined,
                active: editingQuestion.active,
              }
            : undefined
        }
        title={editingQuestion ? "Edit Question" : "Create Question"}
        submitLabel={editingQuestion ? "Save Changes" : "Create"}
        loading={editingQuestion ? onUpdateLoading : onCreateLoading}
      />
    </div>
  );
}
