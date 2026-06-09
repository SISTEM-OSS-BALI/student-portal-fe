"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sider from "antd/es/layout/Sider";
import { Divider, Menu, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import Image from "next/image";
import { SidebarMainConsultant } from "@/app/data/consultant/sidebar-data";

const { Text } = Typography;

export const SiderConsultant = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState("/");
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const items = useMemo(() => SidebarMainConsultant(), []);

  useEffect(() => {
    const key = (pathname ?? "")
      .split("/")
      .filter((_, i) => i < 4)
      .join("/");
    setActiveKey(key || "/");
    const parent = key.split("/").slice(0, 4).join("/");
    if (parent) {
      setOpenKeys((prev) => (prev.includes(parent) ? prev : [...prev, parent]));
    }
  }, [pathname]);

  const onClick: MenuProps["onClick"] = ({ key }) => {
    if (key && key !== activeKey) router.push(String(key));
  };

  const SectionLabel = ({ children }: { children: string }) =>
    collapsed ? null : (
      <Text
        style={{
          display: "block",
          padding: "6px 14px",
          color: token.colorTextSecondary,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.6,
        }}
      >
        {children}
      </Text>
    );

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={256}
      style={{
        background: "#fff",
        borderRight: `1px solid ${token.colorSplit}`,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <div
        onClick={() => router.push("/consultant/dashboard/students-management")}
        style={{
          height: 64,
          margin: 16,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
          cursor: "pointer",
          background:
            "linear-gradient(180deg, rgba(35,112,255,0.08), rgba(35,112,255,0.02))",
          border: `1px solid ${token.colorSplit}`,
          transition: "all .2s ease",
        }}
      >
        <Image
          src="/assets/images/icon.png"
          alt="OSS"
          width={32}
          height={32}
          style={{ objectFit: "contain" }}
          priority
          unoptimized
        />
        {!collapsed && (
          <div style={{ lineHeight: 1 }}>
            <Text strong style={{ fontSize: 14, color: token.colorText }}>
              OSS Bali Student Portal
            </Text>
            <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
              Consultant Console
            </div>
          </div>
        )}
      </div>

      <Divider style={{ margin: "0 0 8px 0" }} />

      <div
        style={{
          height: "calc(100vh - 64px - 16px - 8px - 48px)",
          overflowY: "auto",
          paddingBottom: 12,
        }}
      >
        <SectionLabel>MAIN MENU</SectionLabel>
        <Menu
          mode="inline"
          items={items}
          onClick={onClick}
          selectedKeys={[activeKey]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={setOpenKeys}
          style={{ borderRight: 0, background: "#fff", paddingInline: 8 }}
          inlineIndent={16}
        />
      </div>

      <div
        style={{
          padding: collapsed ? 8 : "8px 12px 14px",
          borderTop: `1px solid ${token.colorSplit}`,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          {collapsed ? "v1.0.0" : "v1.0.0 · © OSS"}
        </Text>
      </div>
    </Sider>
  );
};
