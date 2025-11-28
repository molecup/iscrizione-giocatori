import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { verifySession } from "@app/lib/sessions";

export const STORAGE_ROOT = path.join(process.cwd(), "tmp", "medical-certificates");
export const FILES_DIR = path.join(STORAGE_ROOT, "files");
export const META_FILE = path.join(STORAGE_ROOT, "metadata.json");
export const MAX_FILE_SIZE = Number(process.env.MEDICAL_CERTIFICATE_MAX_BYTES || 5 * 1024 * 1024);

export async function ensureDirs() {
  await fs.mkdir(FILES_DIR, { recursive: true });
}

export async function readMetadata() {
  try {
    const raw = await fs.readFile(META_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

export async function writeMetadata(meta) {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
  await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), "utf-8");
}

export function serialize(record) {
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

export async function requirePlayerSession() {
  const session = await verifySession();
  if (!session?.playerId) {
    throw new NextResponse(JSON.stringify({ error: "Non autorizzato" }), { status: 401 });
  }
  return session;
}

export async function getRecord(playerId) {
  const meta = await readMetadata();
  return { record: meta[playerId], meta };
}

export function sanitizeFileName(name = "certificato.pdf") {
  return name.replace(/[^a-z0-9_\-. ]/gi, "_");
}

