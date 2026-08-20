"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sider from "antd/es/layout/Sider";
import { Divider, Menu, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import Image from "next/image";
import { SidebarMainConsultant } from "@/app/data/consultant/sidebar-data";

const { Text } = Typography;

export const SiderConsultant = ({
  collapsed,
  onCollapsedChange,
  broken,
  onBrokenChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  broken: boolean;
  onBrokenChange: (broken: boolean) => void;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();

  const setCollapsed = onCollapsedChange;
  const setBroken = onBrokenChange;
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
    if (broken) setCollapsed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <>
      {broken && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 999,
          }}
        />
      )}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={broken ? 0 : 80}
        onBreakpoint={(brokenState) => {
          setBroken(brokenState);
          setCollapsed(brokenState);
        }}
        width={256}
        trigger={broken ? null : undefined}
        style={{
          background: "#fff",
          borderRight: `1px solid ${token.colorSplit}`,
          position: broken ? "fixed" : "sticky",
          insetInlineStart: 0,
          top: 0,
          height: "100vh",
          zIndex: 1000,
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
    </>
  );
};
