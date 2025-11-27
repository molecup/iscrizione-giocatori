import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import { verifySession } from "@app/lib/sessions";

const STORAGE_ROOT = path.join(process.cwd(), "tmp", "medical-certificates");
const FILES_DIR = path.join(STORAGE_ROOT, "files");
const META_FILE = path.join(STORAGE_ROOT, "metadata.json");
const MAX_FILE_SIZE = Number(process.env.MEDICAL_CERTIFICATE_MAX_BYTES || 5 * 1024 * 1024);

async function ensureDirs() {
  await fs.mkdir(FILES_DIR, { recursive: true });
}

async function readMetadata() {
  try {
    const raw = await fs.readFile(META_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

async function writeMetadata(meta) {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
  await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), "utf-8");
}

function serialize(record) {
  if (!record) {
    return { status: "missing" };
  }
  return {
    status: record.status || "uploaded",
    fileName: record.originalName,
    uploadedAt: record.uploadedAt,
    size: record.size,
    downloadUrl: record.storedFile ? `/api/medical-certificate?file=${record.storedFile}` : null,
  };
}

async function requirePlayerSession() {
  const session = await verifySession();
  if (!session?.playerId) {
    throw new NextResponse(JSON.stringify({ error: "Non autorizzato" }), { status: 401 });
  }
  return session;
}

async function getRecord(playerId) {
  const meta = await readMetadata();
  return { record: meta[playerId], meta };
}

function sanitizeFileName(name = "certificato.pdf") {
  return name.replace(/[^a-z0-9_\-. ]/gi, "_");
}

export async function GET(request) {
  let session;
  try {
    session = await requirePlayerSession();
  } catch (error) {
    return error;
  }

  const url = new URL(request.url);
  const requestedFile = url.searchParams.get("file");
  const { record } = await getRecord(session.playerId);

  if (requestedFile && record?.storedFile === requestedFile) {
    try {
      const filePath = path.join(FILES_DIR, record.storedFile);
      const file = await fs.readFile(filePath);
      const safeName = sanitizeFileName(record.originalName);
      return new NextResponse(file, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${safeName}"`,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: "File non disponibile" }, { status: 404 });
    }
  }

  return NextResponse.json(serialize(record));
}

export async function POST(request) {
  let session;
  try {
    session = await requirePlayerSession();
  } catch (error) {
    return error;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File non fornito" }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Sono accettati solo file PDF" }, { status: 415 });
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMb = Math.round((MAX_FILE_SIZE / (1024 * 1024)) * 10) / 10;
    return NextResponse.json({ error: `File troppo grande. Limite ${maxMb} MB` }, { status: 413 });
  }

  await ensureDirs();

  const buffer = Buffer.from(await file.arrayBuffer());
  const storedFile = `${session.playerId}-${randomUUID()}.pdf`;
  const targetPath = path.join(FILES_DIR, storedFile);

  await fs.writeFile(targetPath, buffer);

  const { record, meta } = await getRecord(session.playerId);
  if (record?.storedFile) {
    const oldPath = path.join(FILES_DIR, record.storedFile);
    await fs.unlink(oldPath).catch(() => null);
  }

  meta[session.playerId] = {
    storedFile,
    originalName: file.name,
    uploadedAt: new Date().toISOString(),
    size: file.size,
    status: "uploaded",
  };
  await writeMetadata(meta);

  return NextResponse.json(serialize(meta[session.playerId]), { status: 201 });
}

export async function DELETE() {
  let session;
  try {
    session = await requirePlayerSession();
  } catch (error) {
    return error;
  }

  const { record, meta } = await getRecord(session.playerId);
  if (!record) {
    return NextResponse.json({ status: "missing" });
  }

  if (record.storedFile) {
    const filePath = path.join(FILES_DIR, record.storedFile);
    await fs.unlink(filePath).catch(() => null);
  }

  delete meta[session.playerId];
  await writeMetadata(meta);

  return NextResponse.json({ status: "missing" }, { status: 200 });
}

