"use client";

import { useMemo, useCallback } from "react";
import {
  Avatar,
  Card,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useUser } from "@/app/hooks/use-users";
import type { UserDataModel } from "@/app/models/user";
import LoadingSplash from "@/app/components/common/loading";
import OverviewComponent from "@/app/(view)/director/dashboard/students-management/detail/[id]/content/tab-layout/OverviewComponent";
import DocumentsComponent from "@/app/(view)/director/dashboard/students-management/detail/[id]/content/tab-layout/DocumentsComponent";
import TranslationComponent from "@/app/(view)/director/dashboard/students-management/detail/[id]/content/tab-layout/TranslationComponent";
import CVComponents from "@/app/(view)/director/dashboard/students-management/detail/[id]/content/tab-layout/CVComponents";

const allowedTabKeys = new Set([
  "overview",
  "documents",
  "translation",
  "data-cv",
]);

function formatDisplayDate(value?: string | null): string {
  if (!value || value === "0001-01-01T00:00:00Z") return "-";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "-";
  return parsed.format("DD MMM YYYY");
}

export default function ConsultantStudentDetailContentPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const requestedTab = searchParams.get("tab");

  const { data } = useUser({ id: studentId as string });
  const detailStudentData = (data ?? null) as UserDataModel | null;

  const activeTab = useMemo(() => {
    if (requestedTab && allowedTabKeys.has(requestedTab)) {
      return requestedTab;
    }
    return "overview";
  }, [requestedTab]);

  const handleTabChange = useCallback(
    (nextTab: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", nextTab);
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const initials = useMemo(() => {
    const parts = String(detailStudentData?.name ?? "Student")
      .split(" ")
      .filter(Boolean);
    if (!parts.length) return "ST";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [detailStudentData?.name]);

  const tabsItems = [
    {
      key: "overview",
      label: "Overview",
      children:
        detailStudentData && studentId ? (
          <OverviewComponent
            detailStudent={detailStudentData}
            student_id={studentId}
          />
        ) : (
          <LoadingSplash />
        ),
    },
    {
      key: "documents",
      label: "Documents",
      children: studentId ? (
        <DocumentsComponent student_id={studentId} />
      ) : null,
    },
    {
      key: "translation",
      label: "Translation",
      children: studentId ? (
        <TranslationComponent
          student_id={studentId}
          student_name={detailStudentData?.name ?? ""}
          student_country={detailStudentData?.stage?.country?.name ?? ""}
          translation_quota={detailStudentData?.translation_quota ?? 0}
        />
      ) : null,
    },
    {
      key: "data-cv",
      label: "Data & CV",
      children: studentId ? <CVComponents student_id={studentId} /> : null,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        Student Case Detail
      </Typography.Title>

      <Card
        styles={{ body: { padding: 16 } }}
        style={{
          borderRadius: 16,
          borderColor: "#60a5fa",
          background: "#f8fbff",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        }}
      >
        {detailStudentData ? (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              alignItems: "start",
            }}
          >
            <Space align="start" size={12}>
              <Avatar size={48} style={{ backgroundColor: "#f59e0b" }}>
                {initials}
              </Avatar>

              <Space direction="vertical" size={4}>
                <Typography.Text strong>{detailStudentData.name}</Typography.Text>
                <Typography.Text type="secondary">
                  {detailStudentData.email}
                </Typography.Text>
                <Typography.Text type="secondary">
                  No Phone: {detailStudentData.no_phone ?? "Belum ada nomor telepon"}
                </Typography.Text>
                <Typography.Text type="secondary">
                  Destination: {detailStudentData.stage?.country?.name ?? "Belum ada negara"}
                </Typography.Text>
                <Typography.Text type="secondary">
                  Campus: {detailStudentData.name_campus ?? "Belum ada kampus"}
                </Typography.Text>
                <Typography.Text type="secondary">
                  Degree: {detailStudentData.degree ?? detailStudentData.name_degree ?? "Belum ada degree"}
                </Typography.Text>
              </Space>
            </Space>

            <div
              style={{
                background: "#f1f5f9",
                padding: 12,
                borderRadius: 12,
              }}
            >
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                <div>
                  <Typography.Text strong>Visa Status</Typography.Text>
                  <div style={{ marginTop: 6 }}>
                    <Tag color="blue" style={{ marginRight: 0 }}>
                      {detailStudentData.visa_status ??
                        detailStudentData.student_status ??
                        detailStudentData.status ??
                        "ON GOING"}
                    </Tag>
                  </div>
                </div>

                <div>
                  <Typography.Text strong>Visa Type</Typography.Text>
                  <Typography.Text style={{ display: "block" }}>
                    {detailStudentData.visa_type_name ??
                      detailStudentData.visa_type ??
                      "-"}
                  </Typography.Text>
                </div>

                <div>
                  <Typography.Text strong>Joined At</Typography.Text>
                  <Typography.Text style={{ display: "block" }}>
                    {formatDisplayDate(
                      detailStudentData.joined_at || detailStudentData.created_at,
                    )}
                  </Typography.Text>
                </div>

                <div>
                  <Typography.Text strong>Consultant</Typography.Text>
                  <Typography.Text style={{ display: "block" }}>
                    {detailStudentData.name_consultant ?? "-"}
                  </Typography.Text>
                </div>
              </Space>
            </div>
          </div>
        ) : (
          <LoadingSplash />
        )}
      </Card>

      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabsItems} />
    </Space>
  );
}
