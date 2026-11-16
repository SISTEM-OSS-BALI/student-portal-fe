import { NextRequest, NextResponse } from "next/server";

const defaultFileName = "document";

const sanitizeFileName = (value?: string | null) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return defaultFileName;
  return trimmed.replace(/[\r\n"]/g, "_");
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sourceUrl = searchParams.get("url");
  const fileName = sanitizeFileName(searchParams.get("file_name"));
  const fallbackContentType =
    searchParams.get("content_type") || "application/octet-stream";
  const responseMode = searchParams.get("mode") || "raw";

  if (!sourceUrl) {
    return NextResponse.json(
      { message: "url is required" },
      { status: 400 },
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return NextResponse.json(
      { message: "url is invalid" },
      { status: 400 },
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json(
      { message: "unsupported url protocol" },
      { status: 400 },
    );
  }

  if (responseMode !== "page" && responseMode !== "raw") {
    return NextResponse.json(
      { message: "unsupported mode" },
      { status: 400 },
    );
  }

  if (responseMode === "page") {
    const rawParams = new URLSearchParams(request.nextUrl.searchParams);
    rawParams.set("mode", "raw");
    const rawPreviewUrl = `${request.nextUrl.pathname}?${rawParams.toString()}`;
    const safeTitle = escapeHtml(fileName);
    const safeRawPreviewUrl = escapeHtml(rawPreviewUrl);

    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        background: #111827;
      }
      iframe {
        border: 0;
        width: 100%;
        height: 100%;
        display: block;
        background: #111827;
      }
    </style>
  </head>
  <body>
    <iframe src="${safeRawPreviewUrl}" title="${safeTitle}"></iframe>
  </body>
</html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const upstream = await fetch(parsedUrl.toString(), {
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { message: "failed to fetch upstream file" },
      { status: upstream.status },
    );
  }

  const rawContentType = upstream.headers.get("content-type");
  let contentType = rawContentType || fallbackContentType;

  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!contentType || contentType === "application/octet-stream" || contentType === "binary/octet-stream") {
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "webp") contentType = "image/webp";
    else if (ext === "gif") contentType = "image/gif";
    else if (ext === "svg") contentType = "image/svg+xml";
    else if (ext === "pdf") contentType = "application/pdf";
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
