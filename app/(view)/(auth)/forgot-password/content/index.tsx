"use client";

import api from "@/lib/api";
import { Button, Form, Input, Typography, notification } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../../login/auth.module.css";

type ForgotPasswordForm = {
  email: string;
};

export default function ForgotPasswordContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [debugResetOtp, setDebugResetOtp] = useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/forgot-password", values);
      const payload = response.data?.result ?? response.data;
      const otp = typeof payload?.reset_otp === "string" ? payload.reset_otp : null;
      setDebugResetOtp(otp);
      notification.success({
        message: "Permintaan diproses",
        description:
          payload?.message ??
          "Jika email student terdaftar, instruksi reset password sudah diproses.",
      });
      router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      notification.error({
        message: "Gagal memproses",
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
            <h1 className={styles.title}>Reset kata sandi student</h1>
            <p className={styles.subtitle}>
              Masukkan email student untuk memulai proses reset password.
            </p>
          </div>
          <div>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <p className={styles.formHeaderTitle}>Lupa kata sandi</p>
              </div>

              <Form layout="vertical" onFinish={handleSubmit}>
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
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Kirim instruksi reset
                </Button>
              </Form>

              {debugResetOtp ? (
                <div style={{ marginTop: 16 }}>
                  <Typography.Text type="secondary">
                    Mode development: OTP yang dihasilkan.
                  </Typography.Text>
                  <div style={{ marginTop: 8 }}>{debugResetOtp}</div>
                </div>
              ) : null}

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
