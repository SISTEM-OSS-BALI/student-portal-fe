"use client";

import {
  ArrowUpOutlined,
  FileTextOutlined,
  MailOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import { Card, Space, Tag, Typography } from "antd";
import type { ReactNode } from "react";

const { Text, Title } = Typography;

type ActivityItem = {
  id: string;
  section: string;
  badge: string;
  title: string;
  by: string;
  byColor?: string;
  timeAgo: string;
  icon: ReactNode;
  iconBg: string;
};

const activityItems: ActivityItem[] = [
  {
    id: "1",
    section: "Step 1 · Documents",
    badge: "Student upload",
    title: "Student uploaded passport",
    by: "Ngurah Manik Mahardika",
    byColor: "#2563eb",
    timeAgo: "2 hours ago",
    icon: <ArrowUpOutlined />,
    iconBg: "#e8f1ff",
  },
  {
    id: "2",
    section: "Step 2 · Translation",
    badge: "Admission upload",
    title: "Admission uploaded translated transcript",
    by: "Kimfa",
    byColor: "#2563eb",
    timeAgo: "5 hours ago",
    icon: <FileTextOutlined />,
    iconBg: "#eef6ff",
  },
  {
    id: "3",
    section: "Internal note",
    badge: "Admission",
    title: "Bank statement perlu scan ulang",
    by: "Catatan internal: minta student upload ulang bank statement dengan resolusi yang lebih tinggi.",
    timeAgo: "1 day ago",
    icon: <PushpinOutlined />,
    iconBg: "#fff4db",
  },
  {
    id: "4",
    section: "Step 3 · Data & CV",
    badge: "Sent to Director",
    title: "CV sent to Director for approval",
    by: "Kimfa",
    byColor: "#2563eb",
    timeAgo: "2 days ago",
    icon: <MailOutlined />,
    iconBg: "#e9fbf0",
  },
];

export default function ActivityLogComponent() {
  return (
    <Card
      bodyStyle={{ padding: 20 }}
      style={{
        borderRadius: 20,
        borderColor: "#dbe4ee",
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
              Activity Log
            </Title>
            <Text type="secondary">
              Timeline semua aktivitas terbaru untuk case student ini
            </Text>
          </div>

          <button
            type="button"
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              color: "#2563eb",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View all
          </button>
        </div>

        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          {activityItems.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: item.iconBg,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  marginTop: 2,
                  position: "relative",
                }}
              >
                {item.icon}
                {index < activityItems.length - 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 28,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 1,
                      height: 42,
                      background: "#e2e8f0",
                    }}
                  />
                ) : null}
              </div>

              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Space wrap size={8}>
                  <Text type="secondary">{item.section}</Text>
                  <Tag
                    color="blue"
                    style={{
                      margin: 0,
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {item.badge}
                  </Tag>
                </Space>

                <Text strong style={{ fontSize: 16, color: "#0f172a" }}>
                  {item.title}
                </Text>

                <Text style={{ color: item.byColor ?? "#64748b" }}>
                  {item.byColor ? (
                    <>
                      by <span style={{ fontWeight: 600 }}>{item.by}</span>
                    </>
                  ) : (
                    item.by
                  )}
                </Text>
              </Space>

              <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
                {item.timeAgo}
              </Text>
            </div>
          ))}
        </Space>
      </Space>
    </Card>
  );
}
