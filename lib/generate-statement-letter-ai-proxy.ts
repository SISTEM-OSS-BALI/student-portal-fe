import { NextRequest, NextResponse } from "next/server";

function resolveUpstreamUrl() {
  const direct =
    process.env.GENERATE_STATEMENT_LETTER_AI_URL?.trim() || "";
  if (direct) return direct;

  const base = process.env.GENERATE_STATEMENT_LETTER_AI_SERVICE_BASE_URL?.trim();
  if (base) {
    return `${base.replace(/\/+$/, "")}/api/generate-statement-letter-ai`;
  }

  return null;
}

function resolveTimeoutMs() {
  const raw = process.env.AI_GENERATE_TIMEOUT_MS?.trim();
  const parsed = Number(raw);

  if (!raw || !Number.isFinite(parsed) || parsed <= 0) {
    return 180_000;
  }

  return parsed;
}

export async function proxyGenerateStatementLetterAi(req: NextRequest) {
  const upstreamUrl = resolveUpstreamUrl();
  if (!upstreamUrl) {
    return NextResponse.json(
      {
        success: false,
        message: "Generate Statement Letter AI upstream belum dikonfigurasi.",
      },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, message: "Payload JSON tidak valid." },
      { status: 400 },
    );
  }

  const authHeader = req.headers.get("authorization")?.trim();
  const cookieHeader = req.headers.get("cookie")?.trim();
  const serviceToken = process.env.AI_SERVICE_TOKEN?.trim();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  } else if (!cookieHeader && serviceToken) {
    headers.Authorization = `Bearer ${serviceToken}`;
  }

  if (serviceToken) {
    headers["X-Service-Token"] = serviceToken;
  }

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(resolveTimeoutMs()),
    });

    const text = await upstreamRes.text();

    return new NextResponse(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Generate Statement Letter AI service tidak dapat dihubungi.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
