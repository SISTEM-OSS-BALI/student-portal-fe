import type { ThemeConfig } from "antd";

const sehatiRed = "#4d4ae0"; // Merah utama (dari gambar/logo)
const sehatiRedLight = "#F7D7D7"; // Merah sangat muda, untuk hover

const antdTheme: ThemeConfig = {
  cssVar: true,
  token: {
    fontSize: 16,
    colorPrimary: sehatiRed,
    colorLink: sehatiRed,
    colorLinkHover: "#ba2424",
    colorText: "#222", // Hitam lebih soft
    colorTextSecondary: "#777", // Abu-abu lembut
    colorBgLayout: "#fff", // Background sidebar dan layout
    colorBgContainer: "#fff", // Container tetap putih
    borderRadius: 10, // Lebih membulat seperti card di gambar
    padding: 16,
  },
  components: {
    Layout: {
      headerHeight: 64,
      bodyBg: "#fff",
      siderBg: "#fff",
      footerBg: "#fff",
    },
    Menu: {
      itemBorderRadius: 12,
      itemSelectedBg: sehatiRed, // Aktif = merah
      itemSelectedColor: "#fff", // Teks menu aktif = putih
      itemColor: sehatiRed, // Teks menu biasa = merah
      itemHoverBg: sehatiRedLight, // Hover = merah muda
      itemHoverColor: sehatiRed, // Hover text = merah utama
      itemActiveBg: sehatiRed, // Aktif = merah
      // itemActiveColor: "#fff",
      iconSize: 28,
      // Custom shadow pada selected (bisa pakai CSS langsung untuk efek shadow)
    },
    // Sider: {
    //   footerBg: sehatiRed,
    //   backgroundColor: "#fff", // Sider background putih
    // },
    Button: {
      borderRadius: 8,
      colorPrimary: sehatiRed,
      colorPrimaryHover: "#ba2424",
    },
    Table: {
      headerBg: "#fff",
      headerColor: "black",
      rowHoverBg: "#fbe9e7", // soft red hover
      borderColor: "#eee",
    },
    Input: {
      borderRadius: 8,
      colorPrimary: sehatiRed,
    },
    Card: {
      borderRadius: 14,
      padding: 24,
      colorBgContainer: "#fff",
    },
  },
};

export default antdTheme;
