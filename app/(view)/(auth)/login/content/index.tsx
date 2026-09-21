"use client";

import { Image as AntdImage, notification } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

import styles from "../login.module.css";

import { UserFormModel } from "@/app/models/user";
import FormLogin from "./FormLoginComponent";
import { useLogin } from "@/app/hooks/use-users";

const steps = [
  "Pantau progres dokumen dan status visa kamu",
  "Chat langsung dengan tim admission & consultant",
  "Dapatkan notifikasi setiap ada update penting",
];

const partners = [
  {
    src: "/assets/images/pte-badge.png",
    alt: "PTE Partner 2026",
    title: "PTE Partner 2026",
    subtitle: "Pearson Test of English",
  },
  {
    src: "/assets/images/pte-badge-2.png",
    alt: "PTE Registration Center",
    title: "PTE Registration Center",
    subtitle: "Pearson Test of English",
  },
  {
    src: "/assets/images/trained-british-council.png",
    alt: "British Council UK Knowledge-Trained Counsellor",
    title: "British Council",
    subtitle: "UK Knowledge-Trained Agent & Counsellor — Code 100273",
  },
];

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
        case "CONSULTANT":
          router.push("/consultant/dashboard/students-management");
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

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandPane}>
          <div className={styles.brandHeader}>
            <div className={styles.brandLogo}>
              <Image
                src="/assets/images/icon.png"
                alt="OSS Student Portal"
                width={40}
                height={40}
                priority
                unoptimized
              />
            </div>
            <div className={styles.brandTitleGroup}>
              <span className={styles.brandTitle}>OSS Student Portal</span>
              <span className={styles.brandSubtitle}>
                One Step Solution Bali
              </span>
            </div>
          </div>

          <h1 className={styles.heading}>
            Perjalanan studimu, <span>lebih terarah.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Dokumen, progres visa, dan komunikasi dengan tim OSS Bali ada di satu
            tempat.
          </p>

          <ol className={styles.stepList}>
            {steps.map((step, index) => (
              <li key={step} className={styles.stepItem}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

        </div>

        <div className={styles.formPane}>
          <div className={styles.formInner}>
            <h2 className={styles.formTitle}>Masuk ke OSS Student Portal</h2>
            <p className={styles.formSubtitle}>
              Gunakan email dan kata sandi akun Anda yang terdaftar di sistem
              OSS Bali.
            </p>

            <FormLogin onFinish={handleLogin} loading={onLoginLoading} />
          </div>
        </div>

        <div className={styles.partnersSection}>
          <div className={styles.divider} />
          <span className={styles.partnersLabel}>Partner</span>
          <div className={styles.partners}>
            {partners.map((partner) => (
              <div key={partner.title} className={styles.partnerItem}>
                <div className={styles.partnerBadge}>
                  <AntdImage
                    src={partner.src}
                    alt={partner.alt}
                    height={68}
                    preview
                  />
                </div>
                <div>
                  <span className={styles.partnerTitle}>{partner.title}</span>
                  <span className={styles.partnerSubtitle}>
                    {partner.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className={styles.pageFooter}>
        © {new Date().getFullYear()} One Step Solution Bali
      </span>
    </div>
  );
}
