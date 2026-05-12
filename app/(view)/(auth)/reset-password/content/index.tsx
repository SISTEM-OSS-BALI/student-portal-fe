"use client";

import api from "@/lib/api";
import { Button, Form, Input, notification } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import styles from "../../login/auth.module.css";

type ResetPasswordForm = {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
};

export default function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: ResetPasswordForm) => {
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        email: values.email.trim(),
        otp: values.otp.trim(),
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      notification.success({
        message: "Password berhasil diubah",
        description: "Silakan login dengan password baru.",
      });
      router.push("/login");
    } catch (error) {
      notification.error({
        message: "Gagal reset password",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.leftPane}>
            <span className={styles.badge}>OSS Student Portal</span>
            <h1 className={styles.title}>Atur kata sandi baru</h1>
            <p className={styles.subtitle}>
              Masukkan email, kode OTP, dan kata sandi baru untuk akun student.
            </p>
          </div>
          <div>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <p className={styles.formHeaderTitle}>Reset password</p>
              </div>

              <Form
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ email: initialEmail }}
              >
                <Form.Item
                  name="email"
                  label="Email student"
                  rules={[
                    { required: true, message: "Email wajib diisi" },
                    { type: "email", message: "Format email tidak valid" },
                  ]}
                >
                  <Input placeholder="student@email.com" />
                </Form.Item>

                <Form.Item
                  name="otp"
                  label="Kode OTP"
                  rules={[{ required: true, message: "Kode OTP wajib diisi" }]}
                >
                  <Input placeholder="Masukkan 6 digit kode OTP" />
                </Form.Item>

                <Form.Item
                  name="new_password"
                  label="Password baru"
                  rules={[
                    { required: true, message: "Password baru wajib diisi" },
                    { min: 8, message: "Minimal 8 karakter" },
                  ]}
                >
                  <Input.Password placeholder="Minimal 8 karakter" />
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

                <Button type="primary" htmlType="submit" loading={loading} block>
                  Simpan password baru
                </Button>
              </Form>

              <div className={styles.formFooter} style={{ marginTop: 16 }}>
                <Link href="/login">Kembali ke login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
