"use client";

import { notification } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import styles from "../auth.module.css";

import { UserFormModel } from "@/app/models/user";
import FormLogin from "./FormLoginComponent";
import { useLogin } from "@/app/hooks/use-users";

export default function LoginContent() {
  const router = useRouter();
  const { onLogin, onLoginLoading } = useLogin();

  const handleLogin = async (values: UserFormModel) => {
    try {
      const result = await onLogin(values);
      notification.success({ message: "Signed in successfully" });
      const role = (result?.user?.role ?? result?.role ?? "").toUpperCase();
      switch (role) {
        case "ADMISSION":
          router.push("/admission/dashboard/home");
          return;
        case "DIRECTOR":
          router.push("/director/dashboard/home");
          return;
        case "STUDENT":
          router.push("/student/dashboard/home");
          return;
        default:
          router.push("/");
          return;
      }
    } catch (error) {
      notification.error({
        message: "Sign in failed",
        description:
          error instanceof Error ? error.message : "Unexpected error occurred.",
      });
    }
  };

  const highlightStats = [
    { value: "180+", label: "Mata kuliah aktif tiap semester" },
    { value: "12K+", label: "Mahasiswa terdaftar di OSS" },
    { value: "24/7", label: "Layanan bantuan akademik" },
  ];

  return (
    <div className={styles.wrapper}>
      <span className={`${styles.glow} ${styles.glowPrimary}`} />
      <span className={`${styles.glow} ${styles.glowSecondary}`} />

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.leftPane}>
            <span className={styles.badge}>OSS Student Portal</span>
            <h1 className={styles.title}>
              Atur perjalanan kampusmu lewat <span>OSS Bali</span> portal
            </h1>
            <p className={styles.subtitle}>
              Pantau progress mu tanpa pindah aplikasi
            </p>

            <ul className={styles.highlights}>
              {highlightStats.map((item) => (
                <li key={item.label} className={styles.highlightItem}>
                  <span className={styles.statValue}>{item.value}</span>
                  <span className={styles.statLabel}>{item.label}</span>
                </li>
              ))}
            </ul>

            <div className={styles.infoCard}>
              <div className={styles.infoCardImage}>
                <Image
                  src="/assets/images/icon.png"
                  alt="OSS Student Portal"
                  width={64}
                  height={64}
                  priority
                  unoptimized
                />
              </div>
              <div className={styles.infoCardText}>
                <span className={styles.infoTitle}>
                  Portal mahasiswa terintegrasi OSS
                </span>
                <span className={styles.infoSubtitle}>
                  Akses akademik, finansial, dan layanan kampus dari satu akun
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <p className={styles.formHeaderTitle}>Selamat datang kembali</p>
                <p className={styles.formHeaderSubtitle}>
                  Masuk untuk melanjutkan aktivitas kuliahmu.
                </p>
              </div>

              <p className={styles.formHelper}>
                Gunakan email kampus dan kata sandi yang terdaftar di sistem
                OSS.
              </p>

              <FormLogin onFinish={handleLogin} loading={onLoginLoading} />

              <div className={styles.formFooter} style={{ marginTop: 12 }}>
                <Link href="/forgot-password">Lupa kata sandi?</Link>
              </div>

              <div className={styles.formFooter}>
                <span>Belum punya akun?</span>
                <Link href="/register">Daftar sekarang</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
