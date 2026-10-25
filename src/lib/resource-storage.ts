import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export const MAX_RESOURCE_BYTES = 100 * 1024 * 1024;

function storageDirectory() {
  const directory = path.resolve(/*turbopackIgnore: true*/ process.env.RESOURCE_STORAGE_DIR || path.join(process.cwd(), "storage", "resources"));
  const publicDirectory = path.resolve(process.cwd(), "public").toLowerCase();
  if (directory.toLowerCase() === publicDirectory || directory.toLowerCase().startsWith(publicDirectory + path.sep)) {
    throw new Error("RESOURCE_STORAGE_DIR must be outside the public directory");
  }
  return directory;
}

function resourcePath(key: string) {
  if (!/^[0-9a-f-]{36}$/.test(key)) throw new Error("Invalid resource key");
  return path.join(/*turbopackIgnore: true*/ storageDirectory(), key);
}

export async function saveResourceFile(bytes: Uint8Array) {
  const key = randomUUID();
  await mkdir(storageDirectory(), { recursive: true });
  await writeFile(resourcePath(key), bytes, { flag: "wx" });
  return key;
}

export async function readResourceFile(key: string) {
  return readFile(/*turbopackIgnore: true*/ resourcePath(key));
}

export async function removeResourceFile(key: string) {
  await unlink(resourcePath(key)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
