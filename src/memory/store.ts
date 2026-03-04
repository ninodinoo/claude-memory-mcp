import fs from "fs/promises";
import path from "path";

export interface MemoryMeta {
  created: string;
  updated: string;
  accessCount: number;
  tags: string[];
}

export interface MemoryEntry {
  meta: MemoryMeta;
  content: string;
}

// Gibt den .claude-memory Ordner relativ zum cwd zurück
export function getMemoryRoot(): string {
  return path.join(process.cwd(), ".claude-memory");
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readEntry(topic: string): Promise<MemoryEntry | null> {
  const file = topicToPath(topic);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return parseEntry(raw);
  } catch {
    return null;
  }
}

export async function writeEntry(topic: string, content: string, tags: string[] = []): Promise<void> {
  const root = getMemoryRoot();
  const file = topicToPath(topic);
  await ensureDir(path.dirname(file));

  const existing = await readEntry(topic);
  const now = new Date().toISOString();

  const meta: MemoryMeta = {
    created: existing?.meta.created ?? now,
    updated: now,
    accessCount: (existing?.meta.accessCount ?? 0),
    tags,
  };

  const serialized = serializeEntry({ meta, content });
  await fs.writeFile(file, serialized, "utf-8");
  await updateIndex(topic, tags);
}

export async function touchEntry(topic: string): Promise<void> {
  const entry = await readEntry(topic);
  if (!entry) return;
  entry.meta.accessCount += 1;
  entry.meta.updated = new Date().toISOString();
  const file = topicToPath(topic);
  await fs.writeFile(file, serializeEntry(entry), "utf-8");
}

export async function listTopics(): Promise<string[]> {
  const indexFile = path.join(getMemoryRoot(), "index.json");
  try {
    const raw = await fs.readFile(indexFile, "utf-8");
    const index = JSON.parse(raw) as Record<string, string[]>;
    return Object.keys(index);
  } catch {
    return [];
  }
}

// --- Internes ---

function topicToPath(topic: string): string {
  // "architecture/decisions" -> .claude-memory/architecture/decisions.md
  const parts = topic.split("/");
  const root = getMemoryRoot();
  return path.join(root, ...parts) + ".md";
}

function serializeEntry(entry: MemoryEntry): string {
  const metaJson = JSON.stringify(entry.meta);
  return `<!-- META:${metaJson} -->\n\n${entry.content}`;
}

function parseEntry(raw: string): MemoryEntry {
  const metaMatch = raw.match(/^<!-- META:(.+?) -->/);
  if (!metaMatch) {
    return {
      meta: { created: "", updated: "", accessCount: 0, tags: [] },
      content: raw,
    };
  }
  const meta: MemoryMeta = JSON.parse(metaMatch[1]);
  const content = raw.slice(metaMatch[0].length).trimStart();
  return { meta, content };
}

async function updateIndex(topic: string, tags: string[]): Promise<void> {
  const indexFile = path.join(getMemoryRoot(), "index.json");
  let index: Record<string, string[]> = {};
  try {
    const raw = await fs.readFile(indexFile, "utf-8");
    index = JSON.parse(raw);
  } catch {}
  index[topic] = tags;
  await fs.writeFile(indexFile, JSON.stringify(index, null, 2), "utf-8");
}
