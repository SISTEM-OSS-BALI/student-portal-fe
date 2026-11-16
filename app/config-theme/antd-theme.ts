import type { ThemeConfig } from "antd";

const sehatiRed = "#4d4ae0"; // Merah utama (dari gambar/logo)
const sehatiRedLight = "#F7D7D7"; // Merah sangat muda, untuk hover

const antdTheme: ThemeConfig = {
  cssVar: true,
  token: {
    fontSize: 13.5,
    colorPrimary: sehatiRed,
    colorLink: sehatiRed,
    colorLinkHover: "#ba2424",
    colorText: "#1e293b",
    colorTextSecondary: "#64748b",
    colorBgLayout: "#f8fafc",
    colorBgContainer: "#fff",
    borderRadius: 8,
    padding: 14,
  },
  components: {
    Layout: {
      headerHeight: 60,
      bodyBg: "#f8fafc",
      siderBg: "#fff",
      footerBg: "#fff",
    },
    Dropdown: {
      fontSize: 12.5,
      paddingBlock: 4,
      controlItemBgHover: "#f1f5f9",
      borderRadiusSM: 8,
    },
    Menu: {
      itemBorderRadius: 7,
      itemSelectedBg: "#eff6ff",
      itemSelectedColor: "#1b3d6d",
      itemColor: "#334155",
      itemHoverBg: "#f1f5f9",
      itemHoverColor: "#0f172a",
      itemActiveBg: "#eff6ff",
      fontSize: 12.5,
      groupTitleFontSize: 11,
      iconSize: 13,
      itemHeight: 32,
    },
    Select: {
      fontSize: 13,
      optionFontSize: 12.5,
      optionPadding: "5px 10px",
      borderRadius: 8,
    },
    Button: {
      borderRadius: 8,
      colorPrimary: sehatiRed,
      colorPrimaryHover: "#ba2424",
      contentFontSize: 13,
      contentFontSizeSM: 12,
      contentFontSizeLG: 14,
    },
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#475569",
      rowHoverBg: "transparent",
      borderColor: "#f1f5f9",
      fontSize: 12.5,
    },
    Input: {
      borderRadius: 8,
      colorPrimary: sehatiRed,
      fontSize: 13,
    },
    Card: {
      borderRadius: 12,
      padding: 20,
      colorBgContainer: "#fff",
    },
    Modal: {
      titleFontSize: 15,
      borderRadiusLG: 12,
    },
    Tabs: {
      titleFontSize: 13,
    },
  },
};

export default antdTheme;
