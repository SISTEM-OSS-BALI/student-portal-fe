"use client";

import {
  ClockCircleOutlined,
  MessageOutlined,
  PaperClipOutlined,
  SendOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Card, Col, Input, Row, Space, Tag, Typography } from "antd";
import { useMemo, useState } from "react";

const { Paragraph, Text, Title } = Typography;

type TicketMessage = {
  id: string;
  author: string;
  role: "student" | "admission";
  time: string;
  content: string;
  attachment?: string;
};

type TicketItem = {
  id: string;
  code: string;
  title: string;
  status: "On Going" | "Waiting Student" | "Resolved";
  pic: string;
  lastTime: string;
  preview: string;
  messages: TicketMessage[];
};

const ticketItems: TicketItem[] = [
  {
    id: "bank-statement",
    code: "TKT-ADMS-0248",
    title: "Bank Statement Review",
    status: "On Going",
    pic: "Kinfa",
    lastTime: "Updated 10 mins ago",
    preview:
      "Bank statement perlu versi scan yang lebih jelas pada halaman terakhir.",
    messages: [
      {
        id: "1",
        author: "Ngurah Manik Mahardika",
        role: "student",
        time: "09:12 · Today",
        content:
          "Hi Kak, aku baru saja upload bank statement. Bisa dicek apakah sudah sesuai atau perlu perbaikan?",
      },
      {
        id: "2",
        author: "Kinfa",
        role: "admission",
        time: "09:20 · Today",
        content:
          "Halo Manik, terima kasih ya sudah upload. Bank statement-nya sedikit blur di halaman terakhir, mohon di-scan ulang dengan resolusi yang lebih tinggi.",
        attachment: "Guideline_BankStatement.pdf",
      },
      {
        id: "3",
        author: "Ngurah Manik Mahardika",
        role: "student",
        time: "09:35 · Today",
        content:
          "Baik kak, nanti sore aku upload ulang versi yang lebih jelas. Untuk interview universitas tanggal 15 Desember aku juga sudah available ya.",
      },
      {
        id: "4",
        author: "Kinfa",
        role: "admission",
        time: "09:40 · Today",
        content:
          "Sip, noted ya. Nanti kami update jadwal interview di portal dan kirim summary ke email kamu juga.",
      },
    ],
  },
  {
    id: "interview-schedule",
    code: "TKT-ADMS-0251",
    title: "Interview Schedule Confirmation",
    status: "Waiting Student",
    pic: "Kinfa",
    lastTime: "Updated 1 hour ago",
    preview:
      "Konfirmasi ulang ketersediaan jadwal interview untuk intake berikutnya.",
    messages: [
      {
        id: "1",
        author: "Kinfa",
        role: "admission",
        time: "08:10 · Today",
        content:
          "Halo Manik, kami butuh konfirmasi final untuk slot interview tanggal 15 Desember pukul 10.00 WITA.",
      },
      {
        id: "2",
        author: "Ngurah Manik Mahardika",
        role: "student",
        time: "08:18 · Today",
        content:
          "Siap kak, untuk tanggal dan jam tersebut saya available.",
      },
    ],
  },
  {
    id: "statement-letter",
    code: "TKT-ADMS-0257",
    title: "Statement Letter Revision",
    status: "Resolved",
    pic: "Kinfa",
    lastTime: "Updated yesterday",
    preview:
      "Revisi minor pada paragraf pembuka statement letter sudah selesai diverifikasi.",
    messages: [
      {
        id: "1",
        author: "Kinfa",
        role: "admission",
        time: "14:02 · Yesterday",
        content:
          "Statement letter versi terbaru sudah baik. Kami hanya merapikan satu kalimat pembuka agar lebih formal.",
      },
      {
        id: "2",
        author: "Ngurah Manik Mahardika",
        role: "student",
        time: "14:15 · Yesterday",
        content:
          "Baik kak, terima kasih. Saya follow versi final yang di portal saja.",
      },
    ],
  },
];

function ChatBubble({
  author,
  role,
  time,
  content,
  attachment,
}: Omit<TicketMessage, "id">) {
  const isAdmission = role === "admission";
  const bubbleBg = isAdmission ? "#0f4c8a" : "#ffffff";
  const bubbleColor = isAdmission ? "#ffffff" : "#334155";
  const borderColor = isAdmission ? "#0f4c8a" : "#dbe4ee";
  const justify = isAdmission ? "flex-end" : "flex-start";
  const avatarBg = isAdmission ? "#f59e0b" : "#0f4c8a";
  const initials = isAdmission ? "MC" : "MM";

  return (
    <div style={{ display: "flex", justifyContent: justify }}>
      <Space
        align="end"
        size={10}
        direction={isAdmission ? "horizontal" : "horizontal"}
        style={{
          maxWidth: "88%",
          flexDirection: isAdmission ? "row-reverse" : "row",
        }}
      >
        <Avatar
          size={30}
          style={{
            background: avatarBg,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 6,
            }}
          >
            <Text strong style={{ fontSize: 12, color: "#334155" }}>
              {author}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {time}
            </Text>
          </div>

          <div
            style={{
              borderRadius: 18,
              border: `1px solid ${borderColor}`,
              background: bubbleBg,
              color: bubbleColor,
              padding: "12px 14px",
              boxShadow: isAdmission
                ? "0 10px 20px rgba(15, 76, 138, 0.18)"
                : "0 8px 20px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Paragraph
              style={{
                margin: 0,
                color: bubbleColor,
                lineHeight: 1.6,
                fontSize: 13,
              }}
            >
              {content}
            </Paragraph>

            {attachment ? (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: isAdmission
                    ? "1px solid rgba(255,255,255,0.16)"
                    : "1px solid #e2e8f0",
                }}
              >
                <Space size={8}>
                  <PaperClipOutlined
                    style={{ color: isAdmission ? "#bfdbfe" : "#2563eb" }}
                  />
                  <Text
                    style={{
                      color: isAdmission ? "#dbeafe" : "#2563eb",
                      fontSize: 12,
                    }}
                  >
                    {attachment}
                  </Text>
                </Space>
              </div>
            ) : null}
          </div>
        </div>
      </Space>
    </div>
  );
}

export default function ChatComponent() {
  const [activeTicketId, setActiveTicketId] = useState(ticketItems[0]?.id);

  const activeTicket = useMemo(
    () => ticketItems.find((ticket) => ticket.id === activeTicketId) ?? ticketItems[0],
    [activeTicketId],
  );

  const statusColor =
    activeTicket.status === "Resolved"
      ? "green"
      : activeTicket.status === "Waiting Student"
        ? "gold"
        : "blue";

  return (
    <Card
      bodyStyle={{ padding: 16 }}
      style={{
        borderRadius: 18,
        borderColor: "#60a5fa",
        boxShadow: "0 14px 36px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8} xl={7}>
            <div
              style={{
                borderRadius: 18,
                border: "1px solid #dbe4ee",
                background: "#ffffff",
                padding: 14,
                height: "100%",
              }}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    Ticket List
                  </Title>
                  <Text type="secondary">
                    Pilih tiket untuk membuka percakapannya.
                  </Text>
                </div>

                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {ticketItems.map((ticket) => {
                    const isActive = ticket.id === activeTicket.id;
                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => setActiveTicketId(ticket.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          borderRadius: 16,
                          border: isActive
                            ? "1px solid #3b82f6"
                            : "1px solid #dbe4ee",
                          background: isActive ? "#eff6ff" : "#ffffff",
                          padding: 14,
                          cursor: "pointer",
                          boxShadow: isActive
                            ? "0 12px 24px rgba(59, 130, 246, 0.14)"
                            : "none",
                        }}
                      >
                        <Space
                          direction="vertical"
                          size={8}
                          style={{ width: "100%" }}
                        >
                          <Space
                            align="center"
                            style={{ justifyContent: "space-between", width: "100%" }}
                          >
                            <Tag
                              color={
                                ticket.status === "Resolved"
                                  ? "green"
                                  : ticket.status === "Waiting Student"
                                    ? "gold"
                                    : "blue"
                              }
                              style={{ margin: 0, borderRadius: 999 }}
                            >
                              {ticket.status}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {ticket.code}
                            </Text>
                          </Space>

                          <Text strong style={{ color: "#0f172a" }}>
                            {ticket.title}
                          </Text>

                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {ticket.preview}
                          </Text>

                          <Space size={8}>
                            <ClockCircleOutlined style={{ color: "#94a3b8" }} />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {ticket.lastTime}
                            </Text>
                          </Space>
                        </Space>
                      </button>
                    );
                  })}
                </Space>
              </Space>
            </div>
          </Col>

          <Col xs={24} lg={16} xl={17}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Row gutter={[16, 16]} align="middle" justify="space-between">
                <Col xs={24} lg={15}>
                  <Space direction="vertical" size={8}>
                    <Tag
                      color={statusColor}
                      style={{
                        width: "fit-content",
                        margin: 0,
                        borderRadius: 999,
                        paddingInline: 10,
                        fontWeight: 600,
                      }}
                    >
                      {activeTicket.status}
                    </Tag>
                    <Title level={4} style={{ margin: 0 }}>
                      {activeTicket.title}
                    </Title>
                    <Text type="secondary">
                      Komunikasi per tiket untuk revisi dokumen, jadwal interview,
                      dan tindak lanjut admission.
                    </Text>
                  </Space>
                </Col>

                <Col xs={24} lg={9}>
                  <div
                    style={{
                      borderRadius: 16,
                      border: "1px solid #dbe4ee",
                      background: "#f8fafc",
                      padding: 14,
                    }}
                  >
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Space size={8}>
                        <TagsOutlined style={{ color: "#2563eb" }} />
                        <Text strong>Ticket</Text>
                      </Space>
                      <Text type="secondary">{activeTicket.code}</Text>
                      <Text strong style={{ color: "#0f172a" }}>
                        {activeTicket.title}
                      </Text>
                      <Text type="secondary">PIC: {activeTicket.pic}</Text>
                    </Space>
                  </div>
                </Col>
              </Row>

              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid #dbe4ee",
                  background: "#ffffff",
                  padding: 14,
                }}
              >
                <Space direction="vertical" size={18} style={{ width: "100%" }}>
                  {activeTicket.messages.map((message) => (
                    <ChatBubble key={message.id} {...message} />
                  ))}
                </Space>
              </div>

              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid #dbe4ee",
                  background: "#ffffff",
                  padding: 14,
                }}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space.Compact style={{ width: "100%" }}>
                    <Button
                      icon={<MessageOutlined />}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        marginRight: 8,
                      }}
                    />
                    <Input
                      placeholder={`Tulis pesan untuk tiket ${activeTicket.code}`}
                      style={{
                        height: 44,
                        borderRadius: 999,
                      }}
                    />
                    <Button
                      icon={<PaperClipOutlined />}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        marginLeft: 8,
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      style={{
                        height: 44,
                        borderRadius: 999,
                        marginLeft: 8,
                        paddingInline: 18,
                        background: "#0f4c8a",
                        borderColor: "#0f4c8a",
                      }}
                    >
                      Send
                    </Button>
                  </Space.Compact>

                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Catatan: pesan ini akan tersimpan di activity log case student
                    dan dikelompokkan berdasarkan nomor tiket.
                  </Text>
                </Space>
              </div>
            </Space>
          </Col>
        </Row>
      </Space>
    </Card>
  );
}
