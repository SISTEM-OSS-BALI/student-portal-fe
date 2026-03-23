"use client";

import antdTheme from "@/app/config-theme/antd-theme";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";

export default function GlobalProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();
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
