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
  onDocumentStateChange?: (isDirty: boolean) => void;
};

const buildStableDocumentKey = (value: string) => {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return `doc_${(hash >>> 0).toString(16)}`;
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
  onDocumentStateChange,
}: OnlyOfficeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<{ destroyEditor?: () => void } | null>(null);
  const onDocumentStateChangeRef = useRef(onDocumentStateChange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerId = useId().replace(/:/g, "_");

  useEffect(() => {
    onDocumentStateChangeRef.current = onDocumentStateChange;
  }, [onDocumentStateChange]);

  const documentKey = useMemo(() => {
    const raw = `${documentTitle}:${documentUrl}:${callbackUrl}`;
    return buildStableDocumentKey(raw);
  }, [callbackUrl, documentTitle, documentUrl]);

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
          events: {
            onDocumentStateChange: (event: { data?: boolean }) => {
              onDocumentStateChangeRef.current?.(Boolean(event?.data));
            },
          },
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
  }, [
    callbackUrl,
    containerId,
    documentKey,
    documentTitle,
    documentUrl,
    editorUrl,
  ]);

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
