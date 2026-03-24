import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

type FinalizePdfRequest = {
  student_id?: string;
  source_file_url?: string;
  source_file_path?: string;
  source_file_name?: string;
  source_file_type?: string;
  word_file_url?: string | null;
  word_file_path?: string | null;
  word_file_name?: string | null;
  word_file_type?: string | null;
};

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function buildPdfPath(sourceFilePath: string) {
  if (/\.(docx|doc)$/i.test(sourceFilePath)) {
    return sourceFilePath.replace(/\.(docx|doc)$/i, ".pdf");
  }
  return `${sourceFilePath}.pdf`;
}

function buildPdfName(sourceFileName?: string) {
  const name = String(sourceFileName ?? "cv.docx");
  if (/\.(docx|doc)$/i.test(name)) {
    return name.replace(/\.(docx|doc)$/i, ".pdf");
  }
  return `${name}.pdf`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as FinalizePdfRequest | null;
  if (!body?.student_id || !body.source_file_url || !body.source_file_path) {
    return NextResponse.json(
      { message: "student_id, source_file_url, dan source_file_path wajib diisi." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase service role belum dikonfigurasi." },
      { status: 500 },
    );
  }

  const response = await fetch(body.source_file_url, { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json(
      { message: "Gagal mengunduh file Word sumber." },
      { status: 502 },
    );
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "generated-cv-"));
  const sourceFileName = body.source_file_name || "cv.docx";
  const inputPath = path.join(tempDir, sourceFileName);
  const pdfFileName = buildPdfName(body.source_file_name);
  const outputPath = path.join(tempDir, pdfFileName);
  const sofficeBin = process.env.SOFFICE_BIN?.trim() || "soffice";

  try {
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    await execFileAsync(sofficeBin, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      tempDir,
      inputPath,
    ]);

    const pdfBuffer = await fs.readFile(outputPath);
    const pdfPath = buildPdfPath(body.source_file_path);
    const { error } = await supabase.storage
      .from("student-portal")
      .upload(pdfPath, pdfBuffer, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("student-portal").getPublicUrl(pdfPath);

    return NextResponse.json({
      result: {
        student_id: body.student_id,
        file_url: data?.publicUrl ?? "",
        file_path: pdfPath,
        file_name: pdfFileName,
        file_type: "application/pdf",
        word_file_url: body.word_file_url || body.source_file_url,
        word_file_path: body.word_file_path || body.source_file_path,
        word_file_name: body.word_file_name || body.source_file_name,
        word_file_type:
          body.word_file_type ||
          body.source_file_type ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        status: "finalized_pdf",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Konversi ke PDF gagal.",
      },
      { status: 500 },
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
