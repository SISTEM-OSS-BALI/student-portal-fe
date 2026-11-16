"use client";

import { useState } from "react";
import antdTheme from "@/app/config-theme/antd-theme";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";

if (typeof window !== "undefined" && typeof console !== "undefined") {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string") {
      const msg = args[0];
      if (
        msg.includes("Warning: [antd:") ||
        msg.includes("[Ant Design CSS-in-JS]") ||
        msg.includes("cleanup function after unmount") ||
        msg.includes("Instance created by `useForm` is not connected") ||
        msg.includes("Warning: findDOMNode is deprecated") ||
        msg.includes("circular references")
      ) {
        return; // Abaikan warning agar tidak men-trigger layar merah Next.js
      }
    }
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string") {
      const msg = args[0];
      if (
        msg.includes("Warning: [antd:") ||
        msg.includes("[Ant Design CSS-in-JS]") ||
        msg.includes("cleanup function after unmount") ||
        msg.includes("circular references")
      ) {
        return;
      }
    }
    originalWarn(...args);
  };
}

export default function GlobalProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <AntdRegistry>
      <ConfigProvider theme={antdTheme}>
        <App>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
