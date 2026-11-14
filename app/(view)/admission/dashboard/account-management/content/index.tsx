"use client";

import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  BarsOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUserRoleStudents,
  useUsers,
} from "@/app/hooks/use-users";
import type { UserDataModel, UserPayloadCreateModel } from "@/app/models/user";
import getInitials from "@/app/utils/initials-username";
import PageHeader from "@/app/components/common/page-header";
import ResponsiveToolbar from "@/app/components/common/responsive-toolbar";
import MetricCardsGroup, {
  type MetricCardItem,
} from "@/app/components/common/metric-cards";
import styles from "./account-management.module.css";

const { Title, Text } = Typography;

type RoleFilterKey = "ALL" | "CONSULTANT" | "ADMISSION" | "DIRECTOR";

interface AccountFormValues {
  name: string;
  email: string;
  role: "CONSULTANT" | "ADMISSION" | "DIRECTOR";
  no_phone?: string;
  password?: string;
}

function UserCardItem({
  user,
  consultantStudentCount,
  onEdit,
  onRequestDelete,
  onDeleteLoading,
  getRoleTag,
}: {
  user: UserDataModel;
  consultantStudentCount: number;
  onEdit: (user: UserDataModel) => void;
  onRequestDelete: (user: UserDataModel) => void;
  onDeleteLoading: boolean;
  getRoleTag: (role?: string) => React.ReactNode;
}) {
  const isConsultant = (user.role ?? "").toUpperCase() === "CONSULTANT";

  return (
    <div className={styles.userCard}>
      <Flex justify="space-between" align="flex-start" gap={10}>
        <Flex gap={12} align="center" style={{ minWidth: 0, flex: 1 }}>
          <Avatar
            src={user.profile_picture_url || undefined}
            className={styles.userAvatar}
          >
            {!user.profile_picture_url && getInitials(user.name || "U")}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 2,
              }}
              title={user.name}
            >
              {user.name || "Nama Pengguna"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={user.email}
            >
              {user.email || "-"}
            </div>
          </div>
        </Flex>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => onEdit(user)}
            title="Edit Akun"
          >
            <EditOutlined style={{ fontSize: 11, color: "#1b3d6d" }} />
          </button>
          {isConsultant && consultantStudentCount > 0 ? (
            <button
              type="button"
              className={`${styles.actionButton} ${styles.actionButtonDelete}`}
              onClick={() => onRequestDelete(user)}
              title="Hapus Akun & Pindahkan Siswa"
            >
              <DeleteOutlined style={{ fontSize: 11 }} />
            </button>
          ) : (
            <Popconfirm
              title="Hapus Akun Tim"
              description={`Apakah Anda yakin ingin menghapus akun ${user.name}?`}
              onConfirm={() => onRequestDelete(user)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true, loading: onDeleteLoading }}
            >
              <button
                type="button"
                className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                title="Hapus Akun"
              >
                <DeleteOutlined style={{ fontSize: 11 }} />
              </button>
            </Popconfirm>
          )}
        </div>
      </Flex>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {getRoleTag(user.role)}
        {isConsultant && (
          <Tag
            color={consultantStudentCount > 0 ? "cyan" : "default"}
            style={{
              margin: 0,
              borderRadius: 999,
              padding: "1px 8px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {consultantStudentCount} Siswa
          </Tag>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          paddingTop: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <PhoneOutlined style={{ fontSize: 11, color: "#94a3b8" }} />
          {user.no_phone || "Belum ada no. telepon"}
        </span>
      </div>
    </div>
  );
}

function matchesConsultant(
  consultant: UserDataModel,
  studentConsultantName?: string | null,
): boolean {
  const cName = String(studentConsultantName ?? "").trim().toLowerCase();
  if (!cName) return false;

  const targetName = String(consultant.name ?? "").trim().toLowerCase();
  const targetEmail = String(consultant.email ?? "").trim().toLowerCase();
  const targetEmailPrefix = targetEmail.split("@")[0] ?? "";
  const targetFirstName = targetName.split(/\s+/)[0] ?? "";
  const cFirstName = cName.split(/\s+/)[0] ?? "";

  // 1. Exact match (case-insensitive)
  if (cName === targetName) return true;

  // 2. Email username match (e.g. "ayu" matches "ayu@onestepsolutionbali.com")
  if (
    targetEmailPrefix &&
    (cName === targetEmailPrefix || targetEmailPrefix === cFirstName)
  ) {
    return true;
  }

  // 3. First name match (e.g. "Ayu" matches "Ayu Mahadewi", "Jani" matches "Jani Antari")
  if (targetFirstName && cFirstName && targetFirstName === cFirstName) {
    return true;
  }

  // 4. Substring contains (e.g. "Ayu Mahadewi" includes "Ayu", or vice versa)
  if (
    targetName &&
    cName &&
    (targetName.includes(cName) || cName.includes(targetName))
  ) {
    return true;
  }

  return false;
}

export default function AccountManagementContent() {
  const queryClient = useQueryClient();
  const { data: allUsers = [], fetchLoading: usersLoading } = useUsers({});
  const { data: studentsRoleData = [], fetchLoading: studentsLoading } =
    useUserRoleStudents({});
  const fetchLoading = usersLoading || studentsLoading;

  const { onCreate, onCreateLoading } = useCreateUser();
  const { onUpdate, onUpdateLoading } = useUpdateUser();
  const { onDelete, onDeleteLoading } = useDeleteUser();

  const [activeRoleFilter, setActiveRoleFilter] = useState<RoleFilterKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDataModel | null>(null);

  // State untuk modal pemindahan siswa saat hapus konsultan
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [targetConsultantForDelete, setTargetConsultantForDelete] =
    useState<UserDataModel | null>(null);
  const [selectedReplacementConsultant, setSelectedReplacementConsultant] =
    useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const [form] = Form.useForm<AccountFormValues>();

  // Kumpulan seluruh data siswa terpadu dari endpoint role-students dan allUsers
  const allStudents = useMemo(() => {
    const studentMap = new Map<string, UserDataModel>();
    (studentsRoleData ?? []).forEach((s) => {
      if (s?.id) studentMap.set(String(s.id), s);
    });
    (allUsers ?? []).forEach((u) => {
      if ((u.role ?? "").toUpperCase() === "STUDENT" && u?.id) {
        studentMap.set(String(u.id), {
          ...studentMap.get(String(u.id)),
          ...u,
        });
      }
    });
    return Array.from(studentMap.values());
  }, [allUsers, studentsRoleData]);

  // Filter hanya pengguna internal (bukan STUDENT)
  const teamUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const role = (u.role ?? "").toUpperCase();
      return role === "CONSULTANT" || role === "ADMISSION" || role === "DIRECTOR";
    });
  }, [allUsers]);

  // Hitung jumlah siswa yang ditangani oleh tiap konsultan secara terhubung & presisi
  const consultantStudentCounts = useMemo(() => {
    const counts = new Map<string, number>();

    teamUsers.forEach((consultant) => {
      let count = 0;
      allStudents.forEach((student) => {
        if (matchesConsultant(consultant, student.name_consultant)) {
          count += 1;
        }
      });

      counts.set(String(consultant.id), count);
      if (consultant.name) {
        counts.set(consultant.name.trim().toLowerCase(), count);
      }
    });

    return counts;
  }, [teamUsers, allStudents]);

  // Statistik akun
  const stats = useMemo(() => {
    let consultantCount = 0;
    let admissionCount = 0;
    let directorCount = 0;

    teamUsers.forEach((u) => {
      const role = (u.role ?? "").toUpperCase();
      if (role === "CONSULTANT") consultantCount += 1;
      else if (role === "ADMISSION") admissionCount += 1;
      else if (role === "DIRECTOR") directorCount += 1;
    });

    return {
      total: teamUsers.length,
      consultant: consultantCount,
      admission: admissionCount,
      director: directorCount,
    };
  }, [teamUsers]);

  const metricItems = useMemo<MetricCardItem[]>(() => {
    return [
      {
        key: "ALL",
        title: "Semua Akun Tim",
        count: stats.total,
        caption: "Total seluruh pengguna internal",
        color: "#1b3d6d",
        bgSoft: "#eff6ff",
        icon: <TeamOutlined />,
      },
      {
        key: "CONSULTANT",
        title: "Konsultan",
        count: stats.consultant,
        caption: "Pengelola siswa aktif",
        color: "#7e22ce",
        bgSoft: "#f3e8ff",
        icon: <UserOutlined />,
      },
      {
        key: "ADMISSION",
        title: "Admission",
        count: stats.admission,
        caption: "Verifikator dokumen & proses",
        color: "#15803d",
        bgSoft: "#dcfce7",
        icon: <CheckCircleOutlined />,
      },
      {
        key: "DIRECTOR",
        title: "Director",
        count: stats.director,
        caption: "Supervisi & pengawasan sistem",
        color: "#a16207",
        bgSoft: "#fef9c3",
        icon: <LockOutlined />,
      },
    ];
  }, [stats]);

  const handleMetricCardSelect = (key: string) => {
    if (key === activeRoleFilter) {
      setActiveRoleFilter("ALL");
    } else {
      setActiveRoleFilter(key as RoleFilterKey);
    }
  };

  // Data yang difilter untuk tabel
  const filteredUsers = useMemo(() => {
    return teamUsers.filter((u) => {
      const role = (u.role ?? "").toUpperCase();
      const matchRole =
        activeRoleFilter === "ALL" || role === activeRoleFilter;

      if (!matchRole) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const name = (u.name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const phone = (u.no_phone ?? "").toLowerCase();

      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [teamUsers, activeRoleFilter, searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: activeRoleFilter !== "ALL" ? activeRoleFilter : "CONSULTANT",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserDataModel) => {
    setEditingUser(user);
    const roleVal = ((user.role ?? "CONSULTANT").toUpperCase()) as
      | "CONSULTANT"
      | "ADMISSION"
      | "DIRECTOR";

    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: ["CONSULTANT", "ADMISSION", "DIRECTOR"].includes(roleVal)
        ? roleVal
        : "CONSULTANT",
      no_phone: user.no_phone ?? undefined,
      password: "", // Kosongkan saat edit, hanya diisi jika ingin ganti password
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async (values: AccountFormValues) => {
    try {
      const normalizedRole = (values.role ? values.role.toLowerCase() : "consultant");
      const normalizedEmail = values.email.trim().toLowerCase();
      const normalizedName = values.name.trim();
      const normalizedPhone = values.no_phone?.trim() ? values.no_phone.trim() : null;

      const isEmailDuplicate = allUsers.some((u) => {
        if (editingUser && String(u.id) === String(editingUser.id)) return false;
        return (u.email ?? "").trim().toLowerCase() === normalizedEmail;
      });

      if (isEmailDuplicate) {
        message.error("Email sudah terdaftar. Silakan gunakan alamat email lain.");
        return;
      }

      if (editingUser) {
        await onUpdate({
          id: editingUser.id,
          payload: {
            name: normalizedName,
            email: normalizedEmail,
            role: normalizedRole,
            no_phone: normalizedPhone,
            password: values.password?.trim() ? values.password.trim() : undefined,
          },
        });
        message.success("Akun tim berhasil diperbarui");
      } else {
        const payload: UserPayloadCreateModel = {
          name: normalizedName,
          email: normalizedEmail,
          password: values.password?.trim() ?? "",
          role: normalizedRole,
          no_phone: normalizedPhone,
        };
        await onCreate(payload);
        message.success("Akun tim baru berhasil dibuat");
      }
      handleCloseModal();
    } catch (err: any) {
      console.error("Gagal menyimpan akun:", err);
      const serverMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        (typeof err?.response?.data?.error === "string"
          ? err?.response?.data?.error
          : null) ||
        err?.message ||
        "Gagal menyimpan data akun. Pastikan email belum terdaftar dan format sudah sesuai.";

      const lower = String(serverMsg).toLowerCase();
      if (
        lower.includes("email") &&
        (lower.includes("already") ||
          lower.includes("unique") ||
          lower.includes("duplicate") ||
          lower.includes("exists") ||
          lower.includes("terdaftar"))
      ) {
        message.error("Email sudah terdaftar. Silakan gunakan alamat email lain.");
      } else {
        message.error(serverMsg);
      }
    }
  };

  const affectedStudentsForTarget = useMemo(() => {
    if (!targetConsultantForDelete) return [];
    return allStudents.filter((student) =>
      matchesConsultant(targetConsultantForDelete, student.name_consultant),
    );
  }, [targetConsultantForDelete, allStudents]);

  const availableReplacementConsultants = useMemo(() => {
    return teamUsers.filter((u) => {
      const isConsultant = (u.role ?? "").toUpperCase() === "CONSULTANT";
      const isNotTarget =
        String(u.id) !== String(targetConsultantForDelete?.id);
      return isConsultant && isNotTarget;
    });
  }, [teamUsers, targetConsultantForDelete]);

  const handleDelete = async (user: UserDataModel) => {
    await onDelete(user.id);
  };

  const handleRequestDelete = (user: UserDataModel) => {
    const isConsultant = (user.role ?? "").toUpperCase() === "CONSULTANT";
    const count =
      consultantStudentCounts.get(String(user.id)) ??
      consultantStudentCounts.get((user.name ?? "").trim().toLowerCase()) ??
      0;

    if (isConsultant && count > 0) {
      setTargetConsultantForDelete(user);
      setSelectedReplacementConsultant(null);
      setTransferModalOpen(true);
    } else {
      handleDelete(user);
    }
  };

  const handleConfirmTransferAndDelete = async () => {
    if (!targetConsultantForDelete) return;
    if (!selectedReplacementConsultant) {
      message.warning("Silakan pilih konsultan pengganti terlebih dahulu");
      return;
    }

    const replacementUser = availableReplacementConsultants.find(
      (c) =>
        String(c.id) === String(selectedReplacementConsultant) ||
        c.name === selectedReplacementConsultant,
    );
    const replacementName =
      replacementUser?.name || selectedReplacementConsultant;

    try {
      setIsTransferring(true);

      if (affectedStudentsForTarget.length > 0) {
        await Promise.all(
          affectedStudentsForTarget.map((student) =>
            api.put(`/api/users/${student.id}`, {
              name_consultant: replacementName,
            }),
          ),
        );
      }

      await onDelete(targetConsultantForDelete.id);

      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-role-students"] });

      message.success(
        `Berhasil mengalihkan ${affectedStudentsForTarget.length} siswa ke ${replacementName} dan menghapus akun ${targetConsultantForDelete.name}`,
      );
      setTransferModalOpen(false);
      setTargetConsultantForDelete(null);
      setSelectedReplacementConsultant(null);
    } catch (error: any) {
      console.error("Gagal memindahkan siswa dan menghapus konsultan:", error);
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Gagal memindahkan siswa dan menghapus akun konsultan.",
      );
    } finally {
      setIsTransferring(false);
    }
  };

  const getRoleTag = (role?: string) => {
    const r = (role ?? "").toUpperCase();
    switch (r) {
      case "CONSULTANT":
        return (
          <Tag
            color="purple"
            style={{
              borderRadius: 999,
              padding: "2px 10px",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            Konsultan
          </Tag>
        );
      case "ADMISSION":
        return (
          <Tag
            color="blue"
            style={{
              borderRadius: 999,
              padding: "2px 10px",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            Admission
          </Tag>
        );
      case "DIRECTOR":
        return (
          <Tag
            color="gold"
            style={{
              borderRadius: 999,
              padding: "2px 10px",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            Director
          </Tag>
        );
      default:
        return <Tag>{role || "-"}</Tag>;
    }
  };

  const columns: ColumnsType<UserDataModel> = [
    {
      title: "Nama Pengguna",
      key: "name",
      render: (_, record) => {
        return (
          <Flex align="center" gap={12}>
            <Avatar
              src={record.profile_picture_url || undefined}
              style={{
                backgroundColor: "#eff6ff",
                color: "#1b3d6d",
                fontWeight: 700,
                border: "1px solid #bfdbfe",
              }}
            >
              {!record.profile_picture_url && getInitials(record.name || "U")}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13.5 }}>
                {record.name || "-"}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {record.email}
              </div>
            </div>
          </Flex>
        );
      },
    },
    {
      title: "Kategori Akun",
      key: "role",
      width: 140,
      render: (_, record) => getRoleTag(record.role),
    },
    {
      title: "No. Handphone",
      key: "no_phone",
      width: 160,
      render: (_, record) => (
        <span style={{ fontSize: 12.5, color: "#475569" }}>
          {record.no_phone || "-"}
        </span>
      ),
    },
    {
      title: "Siswa Ditangani",
      key: "students_count",
      width: 150,
      render: (_, record) => {
        const isConsultant = (record.role ?? "").toUpperCase() === "CONSULTANT";
        if (!isConsultant) {
          return <span style={{ color: "#94a3b8", fontSize: 12 }}>-</span>;
        }
        const studentCount =
          consultantStudentCounts.get(String(record.id)) ??
          consultantStudentCounts.get(
            (record.name ?? "").trim().toLowerCase(),
          ) ??
          0;

        return (
          <Tag
            color={studentCount > 0 ? "cyan" : "default"}
            style={{
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 11,
              padding: "1px 8px",
            }}
          >
            {studentCount} Siswa
          </Tag>
        );
      },
    },
    {
      title: "Aksi",
      key: "actions",
      width: 110,
      align: "right",
      render: (_, record) => {
        const isConsultant = (record.role ?? "").toUpperCase() === "CONSULTANT";
        const studentCount =
          consultantStudentCounts.get(String(record.id)) ??
          consultantStudentCounts.get(
            (record.name ?? "").trim().toLowerCase(),
          ) ??
          0;

        return (
          <Space size={6}>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined style={{ color: "#2563eb" }} />}
              onClick={() => handleOpenEditModal(record)}
              title="Edit Akun"
            />
            {isConsultant && studentCount > 0 ? (
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                title="Hapus Akun & Pindahkan Siswa"
                onClick={() => handleRequestDelete(record)}
              />
            ) : (
              <Popconfirm
                title="Hapus Akun Tim"
                description={`Apakah Anda yakin ingin menghapus akun ${record.name}?`}
                onConfirm={() => handleDelete(record)}
                okText="Ya, Hapus"
                cancelText="Batal"
                okButtonProps={{ danger: true, loading: onDeleteLoading }}
              >
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  title="Hapus Akun"
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* Executive Header Banner */}
      <PageHeader
        title="Team Account Management"
        subtitle="Kelola akun internal dan akses tim"
        icon={<TeamOutlined />}
        onAddNew={handleOpenCreateModal}
        addNewText="Add Team Account"
      />

      {/* Main Container Card matching Pipeline */}
      <div className={styles.mainCard}>
        {/* Eye-catching Metric Cards ("kotak kotak kecil") */}
        <MetricCardsGroup
          items={metricItems}
          activeKey={activeRoleFilter}
          onSelect={handleMetricCardSelect}
        />

        {/* Toolbar Controls */}
        <ResponsiveToolbar
          searchProps={{
            placeholder: "Search by name, email, or phone...",
            value: searchQuery,
            handleChange: setSearchQuery,
          }}
          segmentedProps={{
            value: viewMode,
            onChange: (val) => setViewMode(val as "card" | "table"),
            options: [
              {
                value: "card",
                label: "Cards",
                icon: <AppstoreOutlined style={{ fontSize: 13 }} />,
              },
              {
                value: "table",
                label: "Table",
                icon: <BarsOutlined style={{ fontSize: 13 }} />,
              },
            ],
          }}
          summaryContent={
            <>
              Menampilkan <strong>{filteredUsers.length}</strong> akun tim
            </>
          }
        />

        {/* Content View: Card Grid or Table */}
        {fetchLoading ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              background: "#fafbfc",
              borderRadius: 14,
              border: "1px dashed #cbd5e1",
            }}
          >
            <Spin tip="Memuat data akun tim..." size="large" />
          </div>
        ) : viewMode === "card" ? (
          filteredUsers.length > 0 ? (
            <div className={styles.cardsGrid}>
              {filteredUsers.map((user) => {
                const count =
                  consultantStudentCounts.get(String(user.id)) ??
                  consultantStudentCounts.get(
                    (user.name ?? "").trim().toLowerCase(),
                  ) ??
                  0;
                return (
                  <UserCardItem
                    key={user.id}
                    user={user}
                    consultantStudentCount={count}
                    onEdit={handleOpenEditModal}
                    onRequestDelete={handleRequestDelete}
                    onDeleteLoading={onDeleteLoading}
                    getRoleTag={getRoleTag}
                  />
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                background: "#fafbfc",
                borderRadius: 14,
                border: "1px dashed #cbd5e1",
              }}
            >
              <Empty
                description={
                  searchQuery
                    ? "Tidak ada akun tim yang sesuai dengan pencarian."
                    : "Belum ada akun tim pada kategori ini."
                }
              />
            </div>
          )
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredUsers}
            loading={fetchLoading || onDeleteLoading}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: "Belum ada akun tim pada kategori ini." }}
          />
        )}
      </div>

      {/* Modal Tambah / Edit Akun */}
      <Modal
        open={isModalOpen}
        title={editingUser ? "Edit Akun Tim" : "Tambah Akun Tim Baru"}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Nama Lengkap"
            rules={[{ required: true, message: "Nama lengkap wajib diisi" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Contoh: Budi Santoso"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Akun"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email tidak valid" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "#94a3b8" }} />}
              placeholder="budi@oss.com"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Kategori Akun (Role)"
            rules={[{ required: true, message: "Kategori akun wajib dipilih" }]}
          >
            <Select placeholder="Pilih kategori akun">
              <Select.Option value="CONSULTANT">
                Konsultan (Menangani Leads & Siswa)
              </Select.Option>
              <Select.Option value="ADMISSION">
                Admission (Operasional & Dokumen)
              </Select.Option>
              <Select.Option value="DIRECTOR">
                Director (Pimpinan & Approval)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="no_phone"
            label="Nomor Handphone (Opsional)"
            rules={[
              {
                pattern: /^[0-9+()\-\s]*$/,
                message: "Nomor handphone hanya boleh angka dan simbol +()-",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Contoh: +62 812 3456 7890"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              editingUser
                ? "Password Baru (Kosongkan jika tidak ingin mengubah)"
                : "Password Akun"
            }
            rules={
              editingUser
                ? [{ min: 8, message: "Minimal 8 karakter" }]
                : [
                    { required: true, message: "Password wajib diisi" },
                    { min: 8, message: "Minimal 8 karakter" },
                  ]
            }
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Minimal 8 karakter"
            />
          </Form.Item>

          <Flex justify="flex-end" gap={10} style={{ marginTop: 24 }}>
            <Button onClick={handleCloseModal}>Batal</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={onCreateLoading || onUpdateLoading}
              style={{
                background: "#1b3d6d",
                borderColor: "#1b3d6d",
              }}
            >
              {editingUser ? "Simpan Perubahan" : "Buat Akun"}
            </Button>
          </Flex>
        </Form>
      </Modal>

      {/* Modal Pindahkan Siswa Sebelum Hapus Konsultan */}
      <Modal
        open={transferModalOpen}
        title={
          <Flex align="center" gap={8}>
            <ExclamationCircleOutlined
              style={{ color: "#d97706", fontSize: 18 }}
            />
            <span>Pindahkan Siswa Konsultan</span>
          </Flex>
        }
        onCancel={() => {
          if (!isTransferring) {
            setTransferModalOpen(false);
            setTargetConsultantForDelete(null);
            setSelectedReplacementConsultant(null);
          }
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setTransferModalOpen(false);
              setTargetConsultantForDelete(null);
              setSelectedReplacementConsultant(null);
            }}
            disabled={isTransferring}
          >
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={isTransferring}
            disabled={!selectedReplacementConsultant}
            onClick={handleConfirmTransferAndDelete}
          >
            Pindahkan Siswa & Hapus Akun
          </Button>,
        ]}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13.5, color: "#334155", marginBottom: 12 }}>
            Konsultan <strong>{targetConsultantForDelete?.name}</strong> saat ini
            sedang menangani{" "}
            <strong>{affectedStudentsForTarget.length} siswa</strong>. Sebelum
            akun konsultan ini dihapus, silakan tentukan konsultan pengganti
            untuk mengalihkan bimbingan siswa-siswa tersebut.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 6,
              }}
            >
              Pilih Konsultan Pengganti <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <Select
              style={{ width: "100%" }}
              placeholder="Pilih nama konsultan pengganti"
              value={selectedReplacementConsultant}
              onChange={(val) => setSelectedReplacementConsultant(val)}
              options={availableReplacementConsultants.map((c) => ({
                value: c.name,
                label: c.name,
              }))}
            />
          </div>

          {affectedStudentsForTarget.length > 0 && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "10px 12px",
                maxHeight: 140,
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                Daftar siswa yang akan dialihkan ({affectedStudentsForTarget.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {affectedStudentsForTarget.map((s) => (
                  <Tag
                    key={s.id}
                    color="blue"
                    style={{ margin: 0, fontSize: 11.5 }}
                  >
                    {s.name}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
