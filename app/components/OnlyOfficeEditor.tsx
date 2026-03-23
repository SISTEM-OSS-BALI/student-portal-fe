"use client";

import { Alert, Spin } from "antd";
import { useEffect, useId, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (
        elementId: string,
        config: Record<string, unknown>,
      ) => {
        destroyEditor?: () => void;
      };
    };
  }
}

type OnlyOfficeEditorProps = {
  documentUrl: string;
  documentTitle: string;
  callbackUrl: string;
  editorUrl: string;
};

const loadOnlyOfficeScript = (editorUrl: string) =>
  new Promise<void>((resolve, reject) => {
    const scriptSrc = `${editorUrl.replace(/\/+$/, "")}/web-apps/apps/api/documents/api.js`;
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptSrc}"]`,
    );
    if (existing) {
      if (window.DocsAPI) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Gagal memuat script OnlyOffice.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Gagal memuat script OnlyOffice."));
    document.body.appendChild(script);
  });

export default function OnlyOfficeEditor({
  documentUrl,
  documentTitle,
  callbackUrl,
  editorUrl,
}: OnlyOfficeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<{ destroyEditor?: () => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerId = useId().replace(/:/g, "_");

  const documentKey = useMemo(() => {
    const raw = `${documentTitle}:${documentUrl}`;
    return (
      btoa(unescape(encodeURIComponent(raw)))
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 120) || "cvdoc"
    );
  }, [documentTitle, documentUrl]);

  useEffect(() => {
    let mounted = true;

    const bootEditor = async () => {
      setLoading(true);
      setError(null);

      try {
        await loadOnlyOfficeScript(editorUrl);
        if (!mounted || !containerRef.current || !window.DocsAPI?.DocEditor) {
          return;
        }

        editorInstanceRef.current?.destroyEditor?.();
        editorInstanceRef.current = new window.DocsAPI.DocEditor(containerId, {
          document: {
            fileType: "docx",
            key: documentKey,
            title: documentTitle,
            url: documentUrl,
          },
          documentType: "word",
          editorConfig: {
            callbackUrl,
            customization: {
              autosave: true,
            },
            mode: "edit",
          },
          height: "100%",
          width: "100%",
          type: "desktop",
        });

        if (mounted) {
          setLoading(false);
        }
      } catch (bootError) {
        if (mounted) {
          setError(
            bootError instanceof Error
              ? bootError.message
              : "Editor OnlyOffice gagal diinisialisasi.",
          );
          setLoading(false);
        }
      }
    };

    bootEditor();

    return () => {
      mounted = false;
      editorInstanceRef.current?.destroyEditor?.();
      editorInstanceRef.current = null;
    };
  }, [callbackUrl, containerId, documentKey, documentTitle, documentUrl, editorUrl]);

  if (error) {
    return <Alert showIcon type="error" message={error} />;
  }

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 640 }}>
      {loading ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            zIndex: 1,
          }}
        >
          <Spin size="large" />
        </div>
      ) : null}
      <div id={containerId} ref={containerRef} style={{ height: "100%" }} />
    </div>
  );
}
