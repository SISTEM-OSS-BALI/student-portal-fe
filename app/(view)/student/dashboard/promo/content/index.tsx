"use client";

import { Button, Card, Empty, Space, Tag, Tour, Typography } from "antd";
import type { TourProps } from "antd";
import { FireOutlined, GiftOutlined, QuestionCircleOutlined, ThunderboltOutlined } from "@ant-design/icons";

import { usePromos } from "@/app/hooks/use-promo";
import { usePageTour } from "@/app/hooks/use-page-tour";
import PageHeader from "@/app/components/common/page-header";

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

  const { open: tourOpen, close: closeTour, restart: restartTour } = usePageTour(
    "student_tour_promo_done",
  );

  const tourSteps: TourProps["steps"] = [
    {
      title: "Promo Eksklusif",
      description:
        "Halaman ini menampilkan semua promo dan penawaran spesial yang tersedia khusus untukmu.",
      target: null,
    },
    {
      title: "Banner Promo",
      description:
        "Informasi tentang promo eksklusif student ditampilkan di sini. Pantau terus untuk penawaran terbaru!",
      target: () => document.getElementById("promo-header")!,
      placement: "bottom",
    },
    {
      title: "Kartu Promo",
      description:
        "Setiap kartu berisi detail promo: kode, besaran diskon, deskripsi, dan periode berlaku. Gunakan kode promo saat kamu melakukan pembayaran.",
      target: () => document.getElementById("promo-list")!,
      placement: "top",
    },
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        <PageHeader
          title="Promo dan Penawaran"
          subtitle="Klaim voucer potongan biaya dan penawaran khusus mahasiswa"
          icon={<GiftOutlined />}
          headerExtra={
            <Button
              type="text"
              shape="circle"
              icon={<QuestionCircleOutlined style={{ fontSize: 18, color: "#94a3b8" }} />}
              onClick={restartTour}
              title="Panduan"
              aria-label="Panduan"
            />
          }
        />

        {promos.length === 0 && !fetchLoading ? (
          <Card
            style={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              background: "#ffffff",
            }}
          >
            <Empty description="Belum ada promo aktif." />
          </Card>
        ) : null}

        <div id="promo-list" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {promos.map((promo) => (
            <Card
              key={promo.id}
              loading={fetchLoading}
              style={{
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                background: "#ffffff",
              }}
              styles={{ body: { padding: "18px 20px" } }}
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
                        borderRadius: 10,
                        display: "grid",
                        placeItems: "center",
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontSize: 16,
                      }}
                    >
                      <GiftOutlined />
                    </div>
                    <div>
                      <Text
                        style={{
                          display: "block",
                          color: "#64748b",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        KODE PROMO
                      </Text>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        {promo.code}
                      </div>
                    </div>
                  </Space>

                  <Tag
                    style={{
                      margin: 0,
                      borderRadius: 999,
                      padding: "4px 10px",
                      border: "1px solid #bfdbfe",
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      fontWeight: 700,
                      fontSize: 11.5,
                    }}
                  >
                    <FireOutlined /> {promo.discount}% OFF
                  </Tag>
                </Space>

                <Paragraph style={{ margin: 0, color: "#334155", fontSize: 12.5, lineHeight: 1.55 }}>
                  {promo.description ||
                    "Promo khusus periode terbatas. Gunakan sekarang untuk mengurangi total biaya layanan Anda."}
                </Paragraph>

                <Text type="secondary" style={{ fontSize: 12 }}>
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
        </div>
      </div>

      <Tour
        open={tourOpen}
        onClose={closeTour}
        onFinish={closeTour}
        steps={tourSteps}
        zIndex={1200}
      />
    </>
  );
}
