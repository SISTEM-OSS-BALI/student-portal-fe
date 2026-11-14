"use client";

import React, { Suspense, useState, useEffect } from "react";
import {
  Avatar,
  Spin,
  Typography,
  Upload,
  message,
  Tabs,
  Modal,
  Form,
  Input,
  Button,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  PhoneOutlined,
  LoadingOutlined,
  CameraOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  EditOutlined,
  SafetyOutlined,
  KeyOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/common/page-header";
import { useAuth } from "@/app/utils/use-auth";
import { useUser, useUpdateUser } from "@/app/hooks/use-users";
import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { isAllowedUploadSize, buildUploadSizeErrorMessage } from "@/app/utils/upload";
import ChangePasswordContent from "../change-password-content";
import styles from "./profile-content.module.css";

const { Text } = Typography;

export type ProfileContentProps = {
  defaultTab?: "profile" | "security";
};

function ProfileContentInner({ defaultTab = "profile" }: ProfileContentProps) {
  const { user_id, loading: authLoading } = useAuth();
  const { data: user, fetchLoading: userLoading } = useUser({ id: user_id });
  const { uploadDocument, uploading } = useDocumentUpload();
  const { onUpdate, onUpdateLoading } = useUpdateUser();
  const {
    data: studentAnswers = [],
    onCreate: createAnswerQuestion,
    onUpdate: updateAnswerQuestion,
  } = useAnswerQuestions({
    queryString: user_id ? `student_id=${user_id}` : undefined,
    enabled: Boolean(user_id),
    withNotification: false,
  });
  const searchParams = useSearchParams();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  const tabQuery = searchParams?.get("tab");
  const initialTab =
    tabQuery === "password" || tabQuery === "security" || defaultTab === "security"
      ? "security"
      : "profile";

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (tabQuery === "password" || tabQuery === "security") {
      setActiveTab("security");
    } else if (tabQuery === "profile") {
      setActiveTab("profile");
    }
  }, [tabQuery]);

  if (authLoading || userLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Text type="danger">Data profil tidak ditemukan.</Text>
      </div>
    );
  }

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      if (!isAllowedUploadSize(file as File)) {
        message.error(buildUploadSizeErrorMessage((file as File).name));
        onError(new Error("File too large"));
        return;
      }
      const timestamp = new Date().getTime();
      const ext = (file as File).name.split(".").pop();
      const result = await uploadDocument({
        file: file as File,
        path: `profiles/${user_id}_${timestamp}.${ext}`,
        content_type: (file as File).type,
      });

      await onUpdate({
        id: user_id as string,
        payload: { profile_picture_url: result.url },
      });
      message.success("Foto profil berhasil diperbarui!");
      onSuccess("ok");
    } catch (error) {
      console.error(error);
      message.error("Gagal mengunggah foto profil");
      onError(error);
    }
  };

  const handleOpenEditModal = () => {
    editForm.setFieldsValue({
      name: user.name || "",
      no_phone: user.no_phone || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (values: { name: string; no_phone?: string }) => {
    try {
      await onUpdate({
        id: user_id as string,
        payload: {
          name: values.name,
          no_phone: values.no_phone || null,
        },
      });

      // Sinkronkan ke formulir KTP (q_pd_01) jika nama diperbarui
      if (values.name && values.name.trim()) {
        const trimmedName = values.name.trim();
        const ktpAnswer = (studentAnswers ?? []).find(
          (ans) => String(ans.question_id) === "q_pd_01",
        );
        if (ktpAnswer?.id) {
          try {
            await updateAnswerQuestion({
              id: ktpAnswer.id,
              payload: {
                answer_text: trimmedName,
              },
            });
          } catch (syncErr) {
            console.error("Gagal sinkron nama ke kuesioner KTP:", syncErr);
          }
        } else if (user_id) {
          try {
            await createAnswerQuestion({
              question_id: "q_pd_01",
              student_id: String(user_id),
              answer_text: trimmedName,
            });
          } catch (syncErr) {
            console.error("Gagal buat kuesioner KTP baru:", syncErr);
          }
        }
      }

      // Sinkronkan ke formulir Nomor Telepon (q_pd_12) jika nomor HP diperbarui
      if (values.no_phone && values.no_phone.trim()) {
        const trimmedPhone = values.no_phone.trim();
        const phoneAnswer = (studentAnswers ?? []).find(
          (ans) => String(ans.question_id) === "q_pd_12",
        );
        if (phoneAnswer?.id) {
          try {
            await updateAnswerQuestion({
              id: phoneAnswer.id,
              payload: {
                answer_text: trimmedPhone,
              },
            });
          } catch (syncErr) {
            console.error("Gagal sinkron nomor telepon ke kuesioner:", syncErr);
          }
        } else if (user_id) {
          try {
            await createAnswerQuestion({
              question_id: "q_pd_12",
              student_id: String(user_id),
              answer_text: trimmedPhone,
            });
          } catch (syncErr) {
            console.error("Gagal buat kuesioner telepon baru:", syncErr);
          }
        }
      }

      message.success("Biodata profil berhasil diperbarui!");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
      message.error("Gagal memperbarui data profil");
    }
  };

  const tabItems = [
    {
      key: "profile",
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14.5, fontWeight: 600 }}>
          <UserOutlined />
          Informasi Profil
        </span>
      ),
      children: (
        <div className={styles.contentGrid}>
          {/* Kolom Kiri: Detail Informasi Pribadi */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Data Identitas Pribadi</h3>
                  <p className={styles.cardSubtitle}>
                    Informasi akun Anda yang terdaftar pada sistem OSS Bali Portal.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.editProfileBtn}
                  onClick={handleOpenEditModal}
                >
                  <EditOutlined />
                  <span>Ubah Data</span>
                </button>
              </div>

              <div className={styles.infoGrid}>
                {/* Tile 1: Nama Lengkap */}
                <div className={styles.infoTile}>
                  <div className={styles.infoIconBox} style={{ background: "#eff6ff", color: "#2563eb" }}>
                    <UserOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Nama Lengkap</div>
                    <div className={styles.infoValue}>{user.name || "-"}</div>
                  </div>
                </div>

                {/* Tile 2: Alamat Email */}
                <div className={styles.infoTile}>
                  <div className={styles.infoIconBox} style={{ background: "#eef2ff", color: "#4f46e5" }}>
                    <MailOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Alamat Email</div>
                    <div className={styles.infoValue}>{user.email || "-"}</div>
                  </div>
                </div>

                {/* Tile 3: Role Akses */}
                <div className={styles.infoTile}>
                  <div className={styles.infoIconBox} style={{ background: "#fdf4ff", color: "#c026d3" }}>
                    <IdcardOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Role Akses</div>
                    <div className={styles.infoValue} style={{ textTransform: "uppercase" }}>
                      {user.role || "-"}
                    </div>
                  </div>
                </div>

                {/* Tile 4: Nomor Telepon */}
                <div className={styles.infoTile}>
                  <div className={styles.infoIconBox} style={{ background: "#ecfdf5", color: "#059669" }}>
                    <PhoneOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Nomor Telepon</div>
                    <div className={styles.infoValue}>{user.no_phone || "Belum diatur"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tile Card Tambahan: Status Sistem */}
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Status Akun & Sistem</h3>
                  <p className={styles.cardSubtitle}>
                    Detail status keamanan dan verifikasi sesi aktif Anda.
                  </p>
                </div>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoTile}>
                  <div className={styles.infoIconBox} style={{ background: "#f0fdf4", color: "#16a34a" }}>
                    <CheckCircleFilled />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Status Keanggotaan</div>
                    <div className={styles.infoValue} style={{ color: "#16a34a" }}>
                      Akun Aktif & Terverifikasi
                    </div>
                  </div>
                </div>

                <div className={styles.infoTile}>
                  <div className={styles.infoIconBox} style={{ background: "#fff7ed", color: "#ea580c" }}>
                    <CalendarOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Terdaftar Sejak</div>
                    <div className={styles.infoValue}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Sistem OSS Bali"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Side Security Panel */}
          <div className={styles.sidePanel}>
            <div className={styles.sideHeader}>
              <div className={styles.sideHeaderIcon}>
                <SafetyOutlined />
              </div>
              <h4 className={styles.sideTitle}>Keamanan Akun</h4>
            </div>

            <div className={styles.secCard}>
              <div className={styles.secRow}>
                <span className={styles.secLabel}>Kata Sandi:</span>
                <span className={styles.secValue}>••••••••••••</span>
              </div>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Kata sandi Anda terlindungi enkripsi. Ganti kata sandi secara berkala untuk menjaga akun tetap aman.
              </p>
              <button
                type="button"
                className={styles.primaryActionBtn}
                onClick={() => setActiveTab("security")}
              >
                <KeyOutlined />
                <span>Ganti Password</span>
              </button>
            </div>

            <div className={styles.secCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                <SafetyCertificateOutlined style={{ color: "#2563eb" }} />
                <span>Tips Keamanan</span>
              </div>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Jangan pernah membagikan kredensial atau password login Anda kepada siapa pun demi keamanan data portal.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "security",
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14.5, fontWeight: 600 }}>
          <LockOutlined />
          Keamanan & Password
        </span>
      ),
      children: (
        <div className={styles.contentGrid}>
          {/* Kolom Kiri: Form Ubah Password */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>Perbarui Kata Sandi</h3>
                <p className={styles.cardSubtitle}>
                  Pastikan kata sandi baru Anda memenuhi standar keamanan sistem.
                </p>
              </div>
            </div>

            <ChangePasswordContent
              embedded={true}
              title=""
              description=""
              onSuccess={() => {
                setActiveTab("profile");
              }}
            />
          </div>

          {/* Kolom Kanan: Panduan Keamanan Password */}
          <div className={styles.sidePanel}>
            <div className={styles.sideHeader}>
              <div className={styles.sideHeaderIcon}>
                <SafetyCertificateOutlined />
              </div>
              <h4 className={styles.sideTitle}>Ketentuan Kata Sandi</h4>
            </div>

            <div className={styles.guidelineList}>
              <div className={styles.guidelineItem}>
                <CheckCircleFilled className={styles.guidelineIcon} />
                <span>Panjang kata sandi minimal 8 karakter.</span>
              </div>
              <div className={styles.guidelineItem}>
                <CheckCircleFilled className={styles.guidelineIcon} />
                <span>Gunakan kombinasi huruf besar dan huruf kecil.</span>
              </div>
              <div className={styles.guidelineItem}>
                <CheckCircleFilled className={styles.guidelineIcon} />
                <span>Sertakan angka (0-9) dan karakter simbol unik.</span>
              </div>
              <div className={styles.guidelineItem}>
                <CheckCircleFilled className={styles.guidelineIcon} />
                <span>Hindari penggunaan tanggal lahir atau nama depan.</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Standard Top PageHeader */}
      <PageHeader
        title="Pengaturan Profil & Akun"
        subtitle="Kelola identitas diri, foto profil, informasi kontak, dan keamanan kata sandi Anda."
        icon={<UserOutlined />}
        headerExtra={
          <div className={styles.statusBadge}>
            <span className={styles.statusDot} />
            <span>Akun Aktif</span>
          </div>
        }
      />

      {/* 2. Hero Profile Banner Card */}
      <div className={styles.heroCard}>
        <div className={styles.coverBanner} />

        <div className={styles.heroBody}>
          <div className={styles.heroLeft}>
            {/* Avatar with Upload Ring */}
            <div className={styles.avatarWrapper}>
              <Upload
                customRequest={handleUpload}
                showUploadList={false}
                accept="image/*"
              >
                <div className={styles.avatarRing}>
                  <Avatar
                    size={88}
                    icon={
                      uploading || onUpdateLoading ? (
                        <LoadingOutlined />
                      ) : (
                        <UserOutlined />
                      )
                    }
                    src={user.profile_picture_url || undefined}
                    style={{ backgroundColor: "#1b3d6d", width: "100%", height: "100%" }}
                  />
                  <div className={styles.avatarHoverOverlay}>
                    <CameraOutlined style={{ fontSize: 18 }} />
                    <span>Ubah Foto</span>
                  </div>
                </div>
              </Upload>
            </div>

            {/* Profile Info */}
            <div className={styles.heroInfo}>
              <div className={styles.userNameRow}>
                <h2 className={styles.userName}>{user.name || "User Name"}</h2>
                <span className={styles.roleBadge}>{user.role || "Member"}</span>
              </div>

              <div className={styles.userMetaRow}>
                <span className={styles.metaItem}>
                  <MailOutlined style={{ color: "#94a3b8" }} />
                  <span>{user.email}</span>
                </span>
                <span className={styles.statusBadge}>
                  <CheckCircleFilled style={{ color: "#10b981", fontSize: 12 }} />
                  <span>Terverifikasi</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action on Hero */}
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.editProfileBtn}
              onClick={handleOpenEditModal}
            >
              <EditOutlined />
              <span>Edit Biodata</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs Card */}
      <div className={styles.tabsCard}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="middle"
        />
      </div>

      {/* 4. Modal Edit Biodata Profil */}
      <Modal
        title="Ubah Data Profil"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSaveProfile}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Nama Lengkap"
            rules={[{ required: true, message: "Nama lengkap wajib diisi" }]}
          >
            <Input size="large" placeholder="Masukkan nama lengkap Anda" />
          </Form.Item>

          <Form.Item
            name="no_phone"
            label="Nomor Telepon WhatsApp"
            rules={[
              {
                pattern: /^[0-9+-\s]*$/,
                message: "Format nomor telepon tidak valid",
              },
            ]}
          >
            <Input size="large" placeholder="Contoh: 08123456789" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
            <Button onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={onUpdateLoading}
              style={{ background: "#1b3d6d" }}
            >
              Simpan Perubahan
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default function ProfileContent(props: ProfileContentProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <Spin size="large" />
        </div>
      }
    >
      <ProfileContentInner {...props} />
    </Suspense>
  );
}
