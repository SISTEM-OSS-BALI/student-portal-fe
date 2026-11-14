"use client";

import api from "@/lib/api";
import { Button, Card, Form, Input, notification, Typography } from "antd";
import { useState } from "react";

type ChangePasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type ChangePasswordContentProps = {
  title?: string;
  description?: string;
  embedded?: boolean;
  onSuccess?: () => void;
};

export default function ChangePasswordContent({
  title = "Change Password",
  description = "Perbarui password akun Anda dengan memasukkan password saat ini.",
  embedded = false,
  onSuccess,
}: ChangePasswordContentProps) {
  const [form] = Form.useForm<ChangePasswordForm>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: ChangePasswordForm) => {
    setLoading(true);
    try {
      await api.post("/api/auth/change-password", values);
      notification.success({
        message: "Password berhasil diubah",
        description: "Password baru sudah tersimpan.",
      });
      form.resetFields();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.details ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error instanceof Error ? error.message : "Terjadi kesalahan.");
      notification.error({
        message: "Gagal mengubah password",
        description: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const formElement = (
    <div style={{ maxWidth: 560 }}>
      {title && (
        <Typography.Title level={embedded ? 4 : 3} style={{ marginTop: 0, marginBottom: 8 }}>
          {title}
        </Typography.Title>
      )}
      {description && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
          {description}
        </Typography.Paragraph>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="current_password"
          label="Password saat ini"
          rules={[
            { required: true, message: "Password saat ini wajib diisi" },
            { min: 8, message: "Minimal 8 karakter" },
          ]}
        >
          <Input.Password placeholder="Masukkan password saat ini" size="large" />
        </Form.Item>

        <Form.Item
          name="new_password"
          label="Password baru"
          rules={[
            { required: true, message: "Password baru wajib diisi" },
            { min: 8, message: "Minimal 8 karakter" },
          ]}
        >
          <Input.Password placeholder="Masukkan password baru" size="large" />
        </Form.Item>

        <Form.Item
          name="confirm_password"
          label="Konfirmasi password baru"
          dependencies={["new_password"]}
          rules={[
            { required: true, message: "Konfirmasi password wajib diisi" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("new_password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Konfirmasi password tidak sama"),
                );
              },
            }),
          ]}
        >
          <Input.Password placeholder="Ulangi password baru" size="large" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} size="large">
          Simpan Password
        </Button>
      </Form>
    </div>
  );

  if (embedded) {
    return formElement;
  }

  return (
    <Card style={{ borderRadius: 20 }} styles={{ body: { padding: 24 } }}>
      {formElement}
    </Card>
  );
}
