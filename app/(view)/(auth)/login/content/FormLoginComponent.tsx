import { UserFormModel } from "@/app/models/user";
import { primaryColor } from "@/app/utils/color";

import { Button, Form, Input } from "antd";

export default function FormLogin({
  onFinish,
  loading,
}: {
  onFinish: (values: UserFormModel) => Promise<void>;
  loading?: boolean;
}) {
  return (
    <div>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, message: "Email is required." }]}
        >
          <Input placeholder="Enter your email" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Password is required." }]}
        >
          <Input.Password placeholder="Enter your password" size="large" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            style={{
              width: "100%",
              backgroundColor: primaryColor,
              borderColor: primaryColor,
            }}
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
