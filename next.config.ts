import type { NextConfig } from "next";

const rawApiBase =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";
const apiBase = rawApiBase.replace(/\/$/, "");
const apiBaseWithApi = apiBase.endsWith("/api")
  ? apiBase
  : `${apiBase}/api`;

const readAllowedDevOrigins = () => {
  const values = [
    process.env.NEXT_ALLOWED_DEV_ORIGINS,
    process.env.NEXT_PUBLIC_ONLYOFFICE_CALLBACK_BASE_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  const normalized = values.map((value) => {
    if (value.startsWith("*.")) {
      return value;
    }

    try {
      return new URL(value).hostname;
    } catch {
      return value
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .trim();
    }
  });

  return Array.from(new Set(normalized));
};

const allowedDevOrigins = readAllowedDevOrigins();

const nextConfig: NextConfig = {
  allowedDevOrigins,
  async rewrites() {
    return [
      {
        source: "/api/socket.io/:path*",
        destination: `${apiBaseWithApi}/socket.io/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiBaseWithApi}/:path*`,
      },
    ];
  },
};

export default nextConfig;
