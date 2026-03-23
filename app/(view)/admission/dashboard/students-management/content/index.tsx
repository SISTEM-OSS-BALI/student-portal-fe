"use client";

import SearchBarComponent from "@/app/components/common/search-bar";
import { Button, Card, Select, Space, Tag, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import ModalStudentComponent from "./ModalStudentComponent";
import { useUserRoleStudents, useUsers } from "@/app/hooks/use-users";
import type { UserDataModel, UserPayloadCreateModel } from "@/app/models/user";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useRouter } from "next/navigation";

const filterStyle: CSSProperties = {
  minWidth: 180,
  borderRadius: 999,
};

export default function StudentsManagementContent() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserDataModel | null>(
    null,
  );

  const { onCreate, onCreateLoading, onDelete, onDeleteLoading } = useUsers({
    enabled: false,
  });
  const { data: studentsRoleData } = useUserRoleStudents();
  const { data: stagesData } = useStagesManagement({});

  const openCreateModal = useCallback(() => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: UserPayloadCreateModel) => {
      await onCreate(values);
      closeModal();
    },
    [closeModal, onCreate],
  );

  const handleDelete = useCallback(async () => {
    if (!selectedStudent) return;
    await onDelete(selectedStudent.id);
    closeModal();
  }, [closeModal, onDelete, selectedStudent]);

  const handleToDetailStudent = useCallback(
    (id: string | number) => {
      router.push(`/admission/dashboard/students-management/detail/${id}`);
    },
    [router],
  );

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <SearchBarComponent placeholder="Cari berdasarkan nama, email, atau nomor telepon" />

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Space size={12} wrap>
            <Select
              placeholder="Country"
              allowClear
              style={filterStyle}
              options={[
                { value: "indonesia", label: "Indonesia" },
                { value: "singapore", label: "Singapore" },
                { value: "malaysia", label: "Malaysia" },
              ]}
            />
            <Select
              placeholder="City"
              allowClear
              style={filterStyle}
              options={[
                { value: "jakarta", label: "Jakarta" },
                { value: "bandung", label: "Bandung" },
                { value: "surabaya", label: "Surabaya" },
              ]}
            />
            <Select
              placeholder="Degree"
              allowClear
              style={filterStyle}
              options={[
                { value: "d3", label: "D3" },
                { value: "s1", label: "S1" },
                { value: "s2", label: "S2" },
              ]}
            />
          </Space>

          <Button
            type="primary"
            style={{ borderRadius: 999, minWidth: 160 }}
            onClick={openCreateModal}
          >
            Add Student
          </Button>
        </div>

        <div>
          {studentsRoleData && (
            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              }}
            >
              {studentsRoleData.map((student) => {
                return (
                  <Card
                    key={student.id}
                    bodyStyle={{ padding: 16 }}
                    style={{
                      borderRadius: 18,
                      borderColor: "#e5e7eb",
                      background: "#fff",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <Typography.Text
                        strong
                        style={{ fontSize: 16, cursor: "pointer" }}
                        onClick={() => handleToDetailStudent(student.id)}
                      >
                        {student.name}
                      </Typography.Text>
                      <Tag
                        color="gold"
                        style={{
                          borderRadius: 999,
                          padding: "2px 12px",
                          marginRight: 0,
                        }}
                      >
                        On Going
                      </Tag>
                    </div>

                    <Space
                      direction="vertical"
                      size={4}
                      style={{ marginTop: 8 }}
                    >
                      <Typography.Text type="secondary">
                        {student.stage?.country?.name ?? "Negara belum dipilih"}
                      </Typography.Text>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 2,
                        }}
                      >
                        <Typography.Text type="secondary">
                          {student.degree
                            ? student.degree.charAt(0).toUpperCase() +
                              student.degree.slice(1)
                            : "Degree belum dipilih"}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          {student.name_campus
                            ? student.name_campus
                            : "Name Campus belum dipilih"}
                        </Typography.Text>
                      </div>
                    </Space>

                    <div style={{ marginTop: 10 }}>
                      <Tag
                        color="blue"
                        style={{
                          borderRadius: 999,
                          padding: "2px 12px",
                          marginRight: 0,
                        }}
                      >
                        {student.visa_type
                          ? student.visa_type.replace(/_/g, " ").toUpperCase()
                          : "Tipe visa belum dipilih"}
                      </Tag>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Space>

      <ModalStudentComponent
        open={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onCancel={closeModal}
        loading={onCreateLoading}
        deleteLoading={onDeleteLoading}
        selectedStudent={selectedStudent}
        stagesData={stagesData ?? []}
      />
    </div>
  );
}
