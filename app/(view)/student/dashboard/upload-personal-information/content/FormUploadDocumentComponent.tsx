"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
  Button,
  Upload,
  notification,
} from "antd";
import { useAuth } from "@/app/utils/use-auth";
import { useQuestionBases } from "@/app/hooks/use-question-bases";
import { useQuestions } from "@/app/hooks/use-questions";
import { useUser } from "@/app/hooks/use-users";
import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import type {
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";

const { TextArea } = Input;
const { Text, Title } = Typography;

const renderQuestionField = (question: QuestionDataModel) => {
  const options =
    question.options?.map((option) => ({
      label: option.label,
      value: option.id ?? option.value,
    })) ?? [];

  switch (question.input_type) {
    case "TEXTAREA":
      return <TextArea rows={4} placeholder={question.placeholder ?? ""} />;
    case "NUMBER":
      return <InputNumber style={{ width: "100%" }} />;
    case "EMAIL":
      return <Input type="email" placeholder={question.placeholder ?? ""} />;
    case "PHONE":
      return <Input placeholder={question.placeholder ?? ""} />;
    case "DATE":
      return <DatePicker style={{ width: "100%" }} />;
    case "SELECT":
      return (
        <Select
          placeholder={question.placeholder ?? "Select option"}
          options={options}
        />
      );
    case "RADIO":
      return <Radio.Group options={options} />;
    case "CHECKBOX":
      return <Checkbox.Group options={options} />;
    case "FILE":
      return (
        <Upload beforeUpload={() => false}>
          <Input placeholder="Upload file" readOnly />
        </Upload>
      );
    case "TEXT":
    default:
      return <Input placeholder={question.placeholder ?? ""} />;
  }
};

export default function FormUploadDocumentComponent() {
  const [submittingSection, setSubmittingSection] = useState<string | null>(null);
  const { data: bases, fetchLoading: basesLoading } = useQuestionBases({});
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const { user_id } = useAuth();
  const { data: currentUser } = useUser({ id: user_id });
  const { data: answerQuestions } = useAnswerQuestions({
    queryString: currentUser?.id ? `applicant_id=${currentUser.id}` : undefined,
    enabled: Boolean(currentUser?.id),
    withNotification: false,
  });
  const {
    onCreate: createAnswerQuestion,
    onCreateLoading: creatingAnswerQuestion,
    onUpdate: updateAnswerQuestion,
    onUpdateLoading: updatingAnswerQuestion,
  } = useAnswerQuestions({ enabled: false, withNotification: false });

  useEffect(() => {
    if (!activeTab && bases?.length) {
      setActiveTab(bases[0].id);
    }
  }, [activeTab, bases]);

  const resolvedBaseId = useMemo(() => {
    if (!bases?.length) return undefined;
    const baseIds = new Set(bases.map((base) => base.id));
    return activeTab && baseIds.has(activeTab) ? activeTab : bases[0].id;
  }, [activeTab, bases]);

  const { data: questions, fetchLoading: questionsLoading } = useQuestions({
    queryString: resolvedBaseId ? `base_id=${resolvedBaseId}` : undefined,
  });

  const answerByQuestionId = useMemo(() => {
    const map = new Map<string, AnswerQuestionDataModel>();
    (answerQuestions ?? []).forEach((answer) => {
      if (!answer?.question_id) return;
      const existing = map.get(answer.question_id);
      if (!existing) {
        map.set(answer.question_id, answer);
        return;
      }
      const existingTime = Date.parse(existing.created_at);
      const nextTime = Date.parse(answer.created_at);
      if (Number.isNaN(existingTime) || nextTime > existingTime) {
        map.set(answer.question_id, answer);
      }
    });
    return map;
  }, [answerQuestions]);

  const normalizeAnswerText = (value: unknown) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "object") {
      const maybeDate = value as { toISOString?: () => string };
      if (typeof maybeDate.toISOString === "function") {
        return maybeDate.toISOString();
      }
    }
    return String(value);
  };

  const handleSubmitAnswers = async (
    baseId: string,
    baseQuestions: QuestionDataModel[],
    values: Record<string, unknown>,
  ) => {
    if (!currentUser?.id) {
      notification.error({
        message: "Pengguna tidak ditemukan",
        description: "Silakan login ulang sebelum mengirim jawaban.",
      });
      return;
    }

    setSubmittingSection(baseId);
    try {
      const tasks = baseQuestions.map(async (question) => {
        const rawValue = values?.[question.id];
        const isOptionType = ["SELECT", "RADIO", "CHECKBOX"].includes(
          question.input_type,
        );
        let payload: {
          answer_text?: string;
          selected_option_ids?: string[];
        } | null = null;

        if (isOptionType) {
          const selected = Array.isArray(rawValue)
            ? rawValue.filter(Boolean)
            : rawValue
              ? [rawValue]
              : [];
          const selectedIds = selected.map((value) => String(value));
          if (!selectedIds.length && !question.required) {
            return null;
          }
          payload = { selected_option_ids: selectedIds };
        } else {
          const answerText = normalizeAnswerText(rawValue);
          if (!answerText && !question.required) {
            return null;
          }
          payload = { answer_text: answerText ?? "" };
        }

        const existing = answerByQuestionId.get(question.id);
        if (existing) {
          return updateAnswerQuestion({
            id: existing.id,
            payload,
          });
        }
        return createAnswerQuestion({
          question_id: question.id,
          student_id: currentUser.id,
          ...payload,
        });
      });

      const results = await Promise.all(tasks);
      const submitted = results.filter(Boolean).length;

      notification.success({
        message: "Jawaban disubmit",
        description: submitted
          ? `Sebanyak ${submitted} jawaban berhasil dikirim.`
          : "Tidak ada jawaban yang dikirim.",
      });
    } catch (error) {
      notification.error({
        message: "Gagal submit jawaban",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      setSubmittingSection(null);
    }
  };

  const items = (bases ?? []).map((base) => ({
    key: base.id,
    label: base.name,
    children: (() => {
      const baseQuestions = (questions ?? []).filter(
        (question) => question.base_id === base.id,
      );
      return (
        <Form
          layout="vertical"
          onFinish={(values) => handleSubmitAnswers(base.id, baseQuestions, values)}
        >
          <Row gutter={[16, 16]}>
            {baseQuestions.map((question) => (
              <Col key={question.id} xs={24} md={12}>
                <Form.Item
                  label={question.text}
                  name={question.id}
                  rules={
                    question.required
                      ? [{ required: true, message: "Field is required" }]
                      : undefined
                  }
                >
                  {renderQuestionField(question)}
                </Form.Item>
              </Col>
            ))}
          </Row>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              loading={
                submittingSection === base.id &&
                (creatingAnswerQuestion || updatingAnswerQuestion)
              }
            >
              Submit Jawaban
            </Button>
          </div>
        </Form>
      );
    })(),
  }));

  return (
    <Card
      style={{ borderRadius: 20 }}
      loading={basesLoading || questionsLoading}
      bodyStyle={{ padding: 24 }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>
            Personal Information
          </Title>
          <Text type="secondary">
            Form pertanyaan personal information ditampilkan terpisah dari country
            document.
          </Text>
        </Space>

        {items.length ? (
          <Tabs
            activeKey={activeTab ?? resolvedBaseId}
            onChange={(key) => setActiveTab(key)}
            items={items}
          />
        ) : (
          <Text type="secondary">Belum ada base question yang tersedia.</Text>
        )}
      </Space>
    </Card>
  );
}
