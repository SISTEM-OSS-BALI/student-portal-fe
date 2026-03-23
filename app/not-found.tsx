import Link from "next/link";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import styles from "./not-found.module.css";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function NotFound() {
  return (
    <div className={`${styles.page} ${bodyFont.className}`}>
      <div className={styles.glow} />
      <div className={styles.grid}>
        <div className={styles.copy}>
          <span className={styles.badge}>Error 404</span>
          <h1 className={`${styles.title} ${displayFont.className}`}>
            Halaman yang kamu cari tidak ditemukan
          </h1>
          <p className={styles.subtitle}>
            Link ini mungkin sudah dipindahkan, dihapus, atau kamu belum punya
            akses. Coba kembali ke beranda atau gunakan navigasi utama.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/">
              Kembali ke Beranda
            </Link>
            <Link className={styles.secondary} href="/admission/dashboard/home">
              Ke Dashboard
            </Link>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.card}>
            <div className={styles.code}>404</div>
            <div className={styles.lines}>
              <span />
              <span />
              <span />
            </div>
            <p className={styles.help}>
              Coba periksa kembali URL yang kamu masukkan.
            </p>
          </div>
          <div className={styles.orbit} />
          <div className={styles.orbitSmall} />
        </div>
      </div>
    </div>
  );
}
