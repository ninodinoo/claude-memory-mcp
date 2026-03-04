import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  readEntry, writeEntry, touchEntry, listTopics,
  getMemoryRoot, ensureDir, appendEntry, deleteEntry,
  memoryExists,
} from "../memory/store.js";
import { initMemory } from "../memory/initializer.js";

export function registerMemoryTools(server: McpServer): void {

  server.registerTool(
    "memory",
    {
      title: "Memory verwalten",
      description:
        "Liest, schreibt, hängt an oder löscht Memory-Einträge. " +
        "Ohne topic: Übersicht aller Topics. Mit topic ohne content: Eintrag lesen. " +
        "Mit topic + content: Eintrag schreiben/anhängen/löschen.",
      inputSchema: z.object({
        topic: z.string().default("").describe(
          "Thema / Pfad, z.B. 'decisions', 'architecture', 'entities/auth'. Leer = Übersicht"
        ),
        content: z.string().default("").describe(
          "Markdown-Inhalt. Leer lassen zum Lesen."
        ),
        mode: z.enum(["write", "append", "delete"]).default("write").describe(
          "write: überschreiben, append: anhängen, delete: löschen. Nur relevant wenn content gesetzt."
        ),
        tags: z.array(z.string()).default([]).describe("Optionale Schlagwörter"),
      }),
    },
    async ({ topic, content, mode, tags }) => {
      // Auto-Init beim ersten Schreiben
      if (!(await memoryExists()) && content) {
        await initMemory();
      }
      await ensureDir(getMemoryRoot());

      // Ohne Topic: Übersicht
      if (!topic) {
        const topics = await listTopics();
        if (topics.length === 0) {
          return { content: [{ type: "text" as const, text: "Noch keine Memory-Einträge vorhanden." }] };
        }

        const results = await Promise.all(
          topics.map(async (t) => ({ topic: t, entry: await readEntry(t) }))
        );
        const entries = results
          .filter((r) => r.entry !== null)
          .map((r) => ({
            topic: r.topic,
            updated: r.entry!.meta.updated,
            chars: r.entry!.content.length,
          }));

        let text = `# Memory — ${entries.length} Einträge\n\n`;
        text += entries.map((e) => `- **${e.topic}** (${e.chars} Zeichen, ${e.updated.slice(0, 10)})`).join("\n");

        return { content: [{ type: "text" as const, text }] };
      }

      // Delete
      if (mode === "delete") {
        const existing = await readEntry(topic);
        if (!existing) {
          return { content: [{ type: "text" as const, text: `Memory '${topic}' nicht gefunden.` }] };
        }
        await deleteEntry(topic);
        return { content: [{ type: "text" as const, text: `Memory '${topic}' gelöscht.` }] };
      }

      // Read (topic gesetzt, kein content)
      if (!content) {
        const entry = await readEntry(topic);
        if (!entry) {
          return { content: [{ type: "text" as const, text: `Kein Memory-Eintrag für '${topic}' gefunden.` }] };
        }
        await touchEntry(topic);
        return {
          content: [{
            type: "text" as const,
            text: `# ${topic}\n\n_Aktualisiert: ${entry.meta.updated}_\n\n---\n\n${entry.content}`,
          }],
        };
      }

      // Append
      if (mode === "append") {
        await appendEntry(topic, content, tags);
        return { content: [{ type: "text" as const, text: `Inhalt an '${topic}' angehängt.` }] };
      }

      // Write (default)
      await writeEntry(topic, content, tags);
      return { content: [{ type: "text" as const, text: `Memory '${topic}' gespeichert.` }] };
    }
  );
}
