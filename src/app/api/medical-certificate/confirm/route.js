import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import {
  FILES_DIR,
  getRecord,
  requirePlayerSession,
  serialize,
  writeMetadata,
} from "@app/api/medical-certificate/utils";

export async function POST() {
  let session;
  try {
    session = await requirePlayerSession();
  } catch (error) {
    return error;
  }

  const { record, meta } = await getRecord(session.playerId);
  if (!record) {
    return NextResponse.json({ error: "Nessun certificato da confermare" }, { status: 400 });
  }

  if (record.locked) {
    return NextResponse.json(serialize(record));
  }

  // ensure file still exists before confirming
  if (record.storedFile) {
    const filePath = path.join(FILES_DIR, record.storedFile);
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json({ error: "File certificato non trovato" }, { status: 404 });
    }
  }

  meta[session.playerId] = {
    ...record,
    locked: true,
    lockedAt: new Date().toISOString(),
  };
  await writeMetadata(meta);

  return NextResponse.json(serialize(meta[session.playerId]));
}

