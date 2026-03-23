import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type OnlyOfficeCallbackBody = {
  status?: number;
  url?: string;
};

const resolvableStatuses = new Set([2, 6]);

function getSupabaseServerClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path")?.trim();
  const bucket = req.nextUrl.searchParams.get("bucket")?.trim() || "student-portal";

  if (!path) {
    return NextResponse.json({ error: 1, message: "Missing file path." }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as OnlyOfficeCallbackBody | null;
  if (!body) {
    return NextResponse.json({ error: 1, message: "Invalid callback payload." }, { status: 400 });
  }

  if (!resolvableStatuses.has(body.status ?? 0) || !body.url) {
    return NextResponse.json({ error: 0 });
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 1, message: "Supabase service role belum dikonfigurasi." },
      { status: 500 },
    );
  }

  const fileResponse = await fetch(body.url);
  if (!fileResponse.ok) {
    return NextResponse.json(
      { error: 1, message: "Failed to download edited document." },
      { status: 502 },
    );
  }

  const fileBuffer = await fileResponse.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
    upsert: true,
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  if (error) {
    return NextResponse.json(
      { error: 1, message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: 0 });
}
