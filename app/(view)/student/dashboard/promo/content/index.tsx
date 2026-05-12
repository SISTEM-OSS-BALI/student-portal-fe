"use client";

import { Card, Empty, Space, Tag, Typography } from "antd";
import { FireOutlined, GiftOutlined, ThunderboltOutlined } from "@ant-design/icons";

import { usePromos } from "@/app/hooks/use-promo";

const { Title, Text, Paragraph } = Typography;

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PromoContent() {
  const { data: promos = [], fetchLoading } = usePromos({
    queryString: "active=true",
  });

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card
        style={{
          borderRadius: 20,
          border: "1px solid #dbeafe",
          background:
            "linear-gradient(135deg, #ffffff 0%, #eff6ff 45%, #dbeafe 100%)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Space direction="vertical" size={8}>
          <Tag
            style={{
              width: "fit-content",
              borderRadius: 999,
              padding: "4px 10px",
              border: "1px solid #bfdbfe",
              background: "#ffffff",
              color: "#1d4ed8",
              fontWeight: 700,
            }}
          >
            <ThunderboltOutlined /> Promo Eksklusif Student
          </Tag>

          <Title level={2} style={{ margin: 0 }}>
            Nikmati Promo Menarik yang diberikan Khusus untuk Kamu!
          </Title>

          <Text style={{ color: "#475569", fontSize: 16 }}>
            Pilih promo terbaik 
          </Text>
        </Space>
      </Card>

      {promos.length === 0 && !fetchLoading ? (
        <Card>
          <Empty description="Belum ada promo aktif." />
        </Card>
      ) : null}

      {promos.map((promo) => (
        <Card
          key={promo.id}
          loading={fetchLoading}
          style={{
            borderRadius: 18,
            border: "1px solid #e2e8f0",
            boxShadow: "0 14px 32px rgba(15, 23, 42, 0.06)",
          }}
          bodyStyle={{ padding: 22 }}
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Space
              align="start"
              style={{ width: "100%", justifyContent: "space-between" }}
            >
              <Space align="center" size={10}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontSize: 18,
                  }}
                >
                  <GiftOutlined />
                </div>
                <div>
                  <Text
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    KODE PROMO
                  </Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {promo.code}
                  </Title>
                </div>
              </Space>

              <Tag
                style={{
                  margin: 0,
                  borderRadius: 999,
                  padding: "6px 10px",
                  border: "1px solid #bfdbfe",
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  fontWeight: 700,
                }}
              >
                <FireOutlined /> {promo.discount}% OFF
              </Tag>
            </Space>

            <Paragraph style={{ margin: 0, color: "#334155" }}>
              {promo.description ||
                "Promo khusus periode terbatas. Gunakan sekarang untuk mengurangi total biaya layanan Anda."}
            </Paragraph>

            <Text type="secondary" style={{ fontSize: 13 }}>
              Berlaku {formatDate(promo.valid_from)} sampai{" "}
              {formatDate(promo.valid_to)}
            </Text>

            <div
              style={{
                borderRadius: 12,
                border: "1px dashed #cbd5e1",
                padding: "10px 12px",
                background: "#f8fafc",
              }}
            >
              <Text style={{ color: "#0f172a", fontWeight: 600 }}>
                Gunakan kode <span style={{ color: "#1d4ed8" }}>{promo.code}</span>{" "}
              </Text>
            </div>
          </Space>
        </Card>
      ))}
    </Space>
  );
}
