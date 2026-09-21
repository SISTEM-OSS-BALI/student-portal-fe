import { UserFormModel } from "@/app/models/user";

import { Button, Form, Input } from "antd";
import Link from "next/link";
import styles from "../login.module.css";

export default function FormLogin({
  onFinish,
  loading,
}: {
  onFinish: (values: UserFormModel) => Promise<void>;
  loading?: boolean;
}) {
  return (
    <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, message: "Email wajib diisi." }]}
      >
        <Input placeholder="nama@email.com" size="large" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Kata sandi"
        rules={[{ required: true, message: "Kata sandi wajib diisi." }]}
      >
        <Input.Password placeholder="Kata sandi" size="large" />
      </Form.Item>

      <div className={styles.forgotRow}>
        <Link href="/forgot-password" className={styles.forgotLink}>
          Lupa kata sandi?
        </Link>
      </div>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
          block
          className={styles.submitButton}
        >
          Masuk
        </Button>
      </Form.Item>
    </Form>
  );
}
