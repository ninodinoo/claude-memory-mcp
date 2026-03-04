import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { writeEntry, readEntry, listTopics, getMemoryRoot, ensureDir } from "../memory/store.js";

export function registerSessionTools(server: McpServer): void {

  server.registerTool(
    "checkpoint",
    {
      title: "Checkpoint setzen",
      description:
        "Speichert den aktuellen Arbeitsstand. Rufe dies nach jedem bedeutenden Schritt auf " +
        "(Feature fertig, Refactoring abgeschlossen, Bug gefixt). " +
        "Wird unter 'current-task' gespeichert und bei der nächsten Session geladen.",
      inputSchema: z.object({
        summary: z.string().describe("Kurze Beschreibung was gemacht wurde"),
        nextSteps: z.array(z.string()).optional().describe("Geplante nächste Schritte"),
        blockers: z.array(z.string()).optional().describe("Aktuelle Blocker oder offene Fragen"),
      }),
    },
    async ({ summary, nextSteps, blockers }) => {
      await ensureDir(getMemoryRoot());
      const now = new Date().toISOString();

      const lines: string[] = [
        `## Checkpoint — ${now}`,
        "",
        `### Stand`,
        summary,
      ];

      if (nextSteps?.length) {
        lines.push("", "### Nächste Schritte");
        nextSteps.forEach((s) => lines.push(`- ${s}`));
      }

      if (blockers?.length) {
        lines.push("", "### Blocker / Offene Fragen");
        blockers.forEach((b) => lines.push(`- ${b}`));
      }

      const existing = await readEntry("current-task");
      const newContent = existing
        ? `${existing.content}\n\n---\n\n${lines.join("\n")}`
        : lines.join("\n");

      await writeEntry("current-task", newContent, ["session", "checkpoint"]);

      return {
        content: [{ type: "text" as const, text: `Checkpoint gespeichert (${now}).` }],
      };
    }
  );

  server.registerTool(
    "session_end",
    {
      title: "Session beenden",
      description:
        "Erstellt eine komprimierte Zusammenfassung der Session und archiviert sie. " +
        "Komprimiert automatisch Sessions älter als 7 Tage. " +
        "Rufe dies am Ende einer Arbeitssession auf, bevor der Context voll wird.",
      inputSchema: z.object({
        accomplishments: z.array(z.string()).describe("Was wurde erreicht"),
        decisions: z.array(z.string()).optional().describe("Getroffene Entscheidungen"),
        nextSession: z.string().optional().describe("Womit soll die nächste Session beginnen"),
      }),
    },
    async ({ accomplishments, decisions, nextSession }) => {
      await ensureDir(getMemoryRoot());
      const now = new Date().toISOString();
      const dateStr = now.slice(0, 10);

      const lines: string[] = [
        `## Session ${dateStr}`,
        "",
        "### Erreicht",
        ...accomplishments.map((a) => `- ${a}`),
      ];

      if (decisions?.length) {
        lines.push("", "### Entscheidungen");
        decisions.forEach((d) => lines.push(`- ${d}`));
      }

      if (nextSession) {
        lines.push("", "### Start nächste Session", nextSession);
      }

      const summaryContent = lines.join("\n");

      // Session archivieren
      const timeStr = now.slice(11, 19).replace(/:/g, "-");
      const sessionKey = `sessions/${dateStr}-${timeStr}`;
      await writeEntry(sessionKey, summaryContent, ["session", "summary"]);

      // current-task resetten
      if (nextSession) {
        await writeEntry("current-task", `## Nächster Start\n\n${nextSession}`, ["session", "next"]);
      }

      // Auto-Compress: Sessions älter als 7 Tage komprimieren
      let compressInfo = "";
      try {
        const compressed = await compressOldSessions(7);
        if (compressed > 0) {
          compressInfo = `\n${compressed} alte Session(s) automatisch komprimiert.`;
        }
      } catch {
        // Compress-Fehler nicht propagieren
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Session zusammengefasst und unter '${sessionKey}' gespeichert.${compressInfo}`,
          },
        ],
      };
    }
  );
}

async function compressOldSessions(olderThanDays: number): Promise<number> {
  const topics = await listTopics();
  const sessionTopics = topics.filter((t) => t.startsWith("sessions/") && !t.includes("archive"));

  if (sessionTopics.length === 0) return 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const oldSessions: { topic: string; content: string; updated: string }[] = [];

  for (const topic of sessionTopics) {
    const entry = await readEntry(topic);
    if (!entry) continue;
    if (new Date(entry.meta.updated) < cutoff) {
      oldSessions.push({ topic, content: entry.content, updated: entry.meta.updated });
    }
  }

  if (oldSessions.length === 0) return 0;

  // Zusammenführen
  oldSessions.sort((a, b) => a.updated.localeCompare(b.updated));
  const archiveContent = oldSessions
    .map((s) => `## ${s.updated.slice(0, 10)} — ${s.topic}\n\n${s.content}`)
    .join("\n\n---\n\n");

  const now = new Date().toISOString();
  const archiveDateStr = now.slice(0, 10);
  const archiveTimeStr = now.slice(11, 19).replace(/:/g, "-");
  const archiveKey = `sessions/archive-${archiveDateStr}-${archiveTimeStr}`;
  await writeEntry(archiveKey, archiveContent, ["archive", "compressed"]);

  // Alte Sessions löschen
  const root = getMemoryRoot();
  const indexFile = path.join(root, "index.json");
  let index: Record<string, string[]> = {};
  try {
    const raw = await fs.readFile(indexFile, "utf-8");
    index = JSON.parse(raw);
  } catch {
    // index nicht vorhanden
  }

  for (const s of oldSessions) {
    const parts = s.topic.split("/");
    const filePath = path.join(root, ...parts) + ".md";
    try {
      await fs.unlink(filePath);
    } catch {
      // Datei existiert nicht
    }
    delete index[s.topic];
  }

  await fs.writeFile(indexFile, JSON.stringify(index, null, 2), "utf-8");

  return oldSessions.length;
}
