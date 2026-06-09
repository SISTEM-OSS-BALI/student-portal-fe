"use client";

import { Card, Col, Empty, Row, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import type { UserDataModel } from "@/app/models/user";

type ConsultantOverviewComponentProps = {
  student: UserDataModel | null;
};

const formatDisplayDate = (value?: string | null) => {
  if (!value || value === "0001-01-01T00:00:00Z") return "-";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "-";
  return parsed.format("DD MMM YYYY");
};

const getStatusLabel = (student: UserDataModel | null) => {
  return (
    student?.visa_status ??
    student?.student_status ??
    student?.status ??
    "ON GOING"
  );
};

export default function ConsultantOverviewComponent({
  student,
}: ConsultantOverviewComponentProps) {
  const notes = student?.notes ?? [];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 18 }}>
            <Typography.Text type="secondary">Visa Status</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{getStatusLabel(student)}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 18 }}>
            <Typography.Text type="secondary">Visa Type</Typography.Text>
            <Typography.Title level={5} style={{ margin: "8px 0 0" }}>
              {student?.visa_type_name ?? student?.visa_type ?? "-"}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 18 }}>
            <Typography.Text type="secondary">Joined At</Typography.Text>
            <Typography.Title level={5} style={{ margin: "8px 0 0" }}>
              {formatDisplayDate(student?.joined_at || student?.created_at)}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card
        title="Student Summary"
        style={{ borderRadius: 18 }}
        styles={{ body: { paddingTop: 12 } }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Typography.Text type="secondary">Destination</Typography.Text>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {student?.stage?.country?.name ?? "-"}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Typography.Text type="secondary">Campus</Typography.Text>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {student?.name_campus ?? "-"}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Typography.Text type="secondary">Degree</Typography.Text>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {student?.degree ?? student?.name_degree ?? "-"}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Typography.Text type="secondary">Consultant</Typography.Text>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {student?.name_consultant ?? "-"}
            </Typography.Paragraph>
          </Col>
        </Row>
      </Card>

      <Card title="Internal Notes" style={{ borderRadius: 18 }}>
        {notes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada catatan"
          />
        ) : (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {notes.map((note) => (
              <Card
                key={note.id}
                size="small"
                style={{ borderRadius: 14, background: "#fafcff" }}
              >
                <Typography.Paragraph style={{ marginBottom: 8 }}>
                  {note.content ?? "-"}
                </Typography.Paragraph>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDisplayDate(note.created_at)}
                </Typography.Text>
              </Card>
            ))}
          </Space>
        )}
      </Card>
    </Space>
  );
}
