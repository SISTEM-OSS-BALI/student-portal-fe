"use client";

import {
  NoteStudentDataModel,
  NoteStudentFormModel,
} from "@/app/models/notes-student";
import { Button, Form, Input, Space, Typography } from "antd";
import { useEffect } from "react";

type FormNotesComponentProps = {
  user_id?: string;
  selectedNote?: NoteStudentDataModel | null;
  loading?: boolean;
  onSubmit?: (values: NoteStudentFormModel) => void;
  onCancel?: () => void;
};

export default function FormNotesComponent({
  user_id,
  selectedNote,
  loading,
  onSubmit,
  onCancel,
}: FormNotesComponentProps) {
  const [form] = Form.useForm<NoteStudentFormModel>();

  useEffect(() => {
    if (selectedNote?.id) {
      form.setFieldsValue({
        user_id: selectedNote.user_id ?? user_id ?? "",
        content: selectedNote.content ?? "",
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      user_id: user_id ?? "",
      content: "",
    });
  }, [form, selectedNote, user_id]);

  const handleFinish = (values: NoteStudentFormModel) => {
    onSubmit?.({
      ...values,
      content: values.content!.trim(),
    });
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item name="user_id" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label="Catatan Student"
        name="content"
        rules={[
          { required: true, message: "Catatan wajib diisi" },
          { min: 3, message: "Minimal 3 karakter" },
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Tulis catatan untuk student ini..."
        />
      </Form.Item>

      <Space style={{ width: "100%", justifyContent: "flex-end" }}>
        <Button onClick={onCancel}>Batal</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {selectedNote ? "Simpan Perubahan" : "Simpan Catatan"}
        </Button>
      </Space>
    </Form>
  );
}
