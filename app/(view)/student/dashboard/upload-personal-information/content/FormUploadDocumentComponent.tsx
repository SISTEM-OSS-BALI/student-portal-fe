"use client";

import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
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
  Upload,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
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
        <Upload beforeUpload={() => false} maxCount={1}>
          <Input placeholder="Upload file" readOnly />
        </Upload>
      );

    case "TEXT":
    default:
      return <Input placeholder={question.placeholder ?? ""} />;
  }
};

function buildFieldValue(
  question: QuestionDataModel,
  answer?: AnswerQuestionDataModel,
) {
  if (!answer) {
    return undefined;
  }

  const selectedOptionIds = (answer.selected_option_ids ?? []).map(String);
  const answerText = answer.answer_text ?? "";

  switch (question.input_type) {
    case "CHECKBOX":
      return selectedOptionIds;

    case "SELECT":
    case "RADIO":
      return selectedOptionIds[0] ?? undefined;

    case "DATE": {
      if (!answerText) {
        return undefined;
      }

      const parsed = dayjs(answerText);
      return parsed.isValid() ? parsed : undefined;
    }

    case "NUMBER":
      return answerText !== "" && !Number.isNaN(Number(answerText))
        ? Number(answerText)
        : undefined;

    default:
      return answerText || undefined;
  }
}

function buildInitialFormValues(
  baseQuestions: QuestionDataModel[],
  answerByQuestionId: Map<string, AnswerQuestionDataModel>,
) {
  const values: Record<string, unknown> = {};

  baseQuestions.forEach((question) => {
    const answer = answerByQuestionId.get(String(question.id));
    const fieldValue = buildFieldValue(question, answer);

    if (fieldValue !== undefined) {
      values[String(question.id)] = fieldValue;
    }
  });

  return values;
}

export default function FormUploadDocumentComponent() {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [submittingSection, setSubmittingSection] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const { user_id } = useAuth();
  const { data: currentUser } = useUser({ id: user_id });
  const { data: bases, fetchLoading: basesLoading } = useQuestionBases({});

  useEffect(() => {
    if (!activeTab && bases?.length) {
      setActiveTab(String(bases[0].id));
    }
  }, [activeTab, bases]);

  const resolvedBaseId = useMemo(() => {
    if (!bases?.length) {
      return undefined;
    }

    const baseIds = new Set(bases.map((base) => String(base.id)));
    return activeTab && baseIds.has(activeTab)
      ? activeTab
      : String(bases[0].id);
  }, [activeTab, bases]);

  const { data: questions, fetchLoading: questionsLoading } = useQuestions({
    queryString: resolvedBaseId ? `base_id=${resolvedBaseId}` : undefined,
  });

  const { data: answerQuestions } = useAnswerQuestions({
    queryString: currentUser?.id ? `student_id=${currentUser.id}` : undefined,
    enabled: Boolean(currentUser?.id),
    withNotification: false,
  });

  const {
    onCreate: createAnswerQuestion,
    onCreateLoading: creatingAnswerQuestion,
    onUpdate: updateAnswerQuestion,
    onUpdateLoading: updatingAnswerQuestion,
  } = useAnswerQuestions({
    enabled: false,
    withNotification: false,
  });

  const answerByQuestionId = useMemo(() => {
    const map = new Map<string, AnswerQuestionDataModel>();

    (answerQuestions ?? []).forEach((answer) => {
      if (!answer?.question_id) {
        return;
      }

      const key = String(answer.question_id);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, answer);
        return;
      }

      const existingTime = Date.parse(existing.created_at ?? "");
      const nextTime = Date.parse(answer.created_at ?? "");

      if (Number.isNaN(existingTime) || nextTime > existingTime) {
        map.set(key, answer);
      }
    });

    return map;
  }, [answerQuestions]);

  const normalizeAnswerText = (value: unknown) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (dayjs.isDayjs(value)) {
      return (value as Dayjs).toISOString();
    }

    if (typeof value === "string") {
      return value.trim();
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    return String(value);
  };

  const questionsByBaseId = useMemo(() => {
    const grouped = new Map<string, QuestionDataModel[]>();

    (questions ?? []).forEach((question) => {
      const key = String(question.base_id);
      const existing = grouped.get(key) ?? [];
      existing.push(question);
      grouped.set(key, existing);
    });

    return grouped;
  }, [questions]);

  const activeBaseQuestions = useMemo(() => {
    if (!resolvedBaseId) {
      return [];
    }

    return questionsByBaseId.get(String(resolvedBaseId)) ?? [];
  }, [questionsByBaseId, resolvedBaseId]);

  useEffect(() => {
    if (!resolvedBaseId || !activeBaseQuestions.length) {
      form.resetFields();
      return;
    }

    const values = buildInitialFormValues(
      activeBaseQuestions,
      answerByQuestionId,
    );
    form.setFieldsValue(values);
  }, [activeBaseQuestions, answerByQuestionId, form, resolvedBaseId]);

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
        const rawValue = values?.[String(question.id)];
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

          payload = {
            selected_option_ids: selectedIds,
          };
        } else {
          const answerText = normalizeAnswerText(rawValue);

          if (!answerText && !question.required) {
            return null;
          }

          payload = {
            answer_text: answerText ?? "",
          };
        }

        const existing = answerByQuestionId.get(String(question.id));

        if (existing) {
          return updateAnswerQuestion({
            id: existing.id,
            payload,
          });
        }

        return createAnswerQuestion({
          question_id: String(question.id),
          student_id: String(currentUser.id),
          ...payload,
        });
      });

      const results = await Promise.all(tasks);
      const submitted = results.filter(Boolean).length;

      const refreshedValues = buildInitialFormValues(
        baseQuestions,
        new Map(
          baseQuestions.map((question) => {
            const existing = answerByQuestionId.get(String(question.id));
            const rawValue = values?.[String(question.id)];

            const fakeAnswer: AnswerQuestionDataModel = {
              id: existing?.id ?? "",
              question_id: String(question.id),
              answer_text: ["SELECT", "RADIO", "CHECKBOX"].includes(
                question.input_type,
              )
                ? undefined
                : normalizeAnswerText(rawValue),
              selected_option_ids: ["CHECKBOX"].includes(question.input_type)
                ? Array.isArray(rawValue)
                  ? rawValue.map(String)
                  : []
                : ["SELECT", "RADIO"].includes(question.input_type) && rawValue
                  ? [String(rawValue)]
                  : [],
              created_at: existing?.created_at ?? new Date().toISOString(),
            };

            return [String(question.id), fakeAnswer];
          }),
        ),
      );

      form.setFieldsValue(refreshedValues);

      notification.success({
        message: "Jawaban berhasil disimpan",
        description: submitted
          ? `${submitted} jawaban berhasil disubmit dan field tetap terisi.`
          : "Tidak ada perubahan jawaban yang dikirim.",
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

  const items = (bases ?? []).map((base) => {
    const baseQuestions = questionsByBaseId.get(String(base.id)) ?? [];

    return {
      key: String(base.id),
      label: base.name,
      children: (
        <Form
          form={form}
          key={base.id}
          layout="vertical"
          onFinish={(values) =>
            handleSubmitAnswers(String(base.id), baseQuestions, values)
          }
        >
          <Row gutter={[16, 16]}>
            {baseQuestions.map((question) => (
              <Col key={question.id} xs={24} md={12}>
                <Form.Item
                  label={question.text}
                  name={String(question.id)}
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
                submittingSection === String(base.id) &&
                (creatingAnswerQuestion || updatingAnswerQuestion)
              }
            >
              Submit Jawaban
            </Button>
          </div>
        </Form>
      ),
    };
  });

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
            Form pertanyaan personal information ditampilkan terpisah dari
            country document.
          </Text>
        </Space>

        {items.length ? (
          <Tabs
            activeKey={activeTab ?? resolvedBaseId}
            onChange={(key) => {
              setActiveTab(key);
              form.resetFields();
            }}
            items={items}
          />
        ) : (
          <Text type="secondary">Belum ada base question yang tersedia.</Text>
        )}
      </Space>
    </Card>
  );
}
