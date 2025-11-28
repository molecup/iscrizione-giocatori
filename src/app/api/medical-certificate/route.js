import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  ensureDirs,
  getRecord,
  requirePlayerSession,
  sanitizeFileName,
  serialize,
  writeMetadata,
  FILES_DIR,
} from "@app/api/medical-certificate/utils";

const MAX_FILE_SIZE = Number(process.env.MEDICAL_CERTIFICATE_MAX_BYTES || 5 * 1024 * 1024);

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
    locked: false,
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

  if (record?.locked) {
    return NextResponse.json({ error: "Certificato già confermato" }, { status: 400 });
  }

  if (record.storedFile) {
    const filePath = path.join(FILES_DIR, record.storedFile);
    await fs.unlink(filePath).catch(() => null);
  }

  delete meta[session.playerId];
  await writeMetadata(meta);

  return NextResponse.json({ status: "missing" }, { status: 200 });
}
