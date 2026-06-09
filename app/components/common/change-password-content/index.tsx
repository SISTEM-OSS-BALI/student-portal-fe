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
};

export default function ChangePasswordContent({
  title = "Change Password",
  description = "Perbarui password akun Anda dengan memasukkan password saat ini.",
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
    } catch (error) {
      notification.error({
        message: "Gagal mengubah password",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ borderRadius: 20 }} styles={{ body: { padding: 24 } }}>
      <div style={{ maxWidth: 560 }}>
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          {description}
        </Typography.Paragraph>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="current_password"
            label="Password saat ini"
            rules={[
              { required: true, message: "Password saat ini wajib diisi" },
              { min: 8, message: "Minimal 8 karakter" },
            ]}
          >
            <Input.Password placeholder="Masukkan password saat ini" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="Password baru"
            rules={[
              { required: true, message: "Password baru wajib diisi" },
              { min: 8, message: "Minimal 8 karakter" },
            ]}
          >
            <Input.Password placeholder="Masukkan password baru" />
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
            <Input.Password placeholder="Ulangi password baru" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading}>
            Simpan Password
          </Button>
        </Form>
      </div>
    </Card>
  );
}
