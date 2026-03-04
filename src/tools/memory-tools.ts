import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readEntry, writeEntry, touchEntry, listTopics, getMemoryRoot, ensureDir } from "../memory/store.js";

export function registerMemoryTools(server: McpServer): void {

  server.registerTool(
    "memory_load",
    {
      title: "Memory laden",
      description:
        "Lädt den gespeicherten Wissensstand zu einem Thema. " +
        "Rufe dies am Anfang einer Session oder vor einer neuen Aufgabe auf. " +
        "topic-Beispiele: 'architecture', 'decisions', 'current-task', 'entities/auth'",
      inputSchema: z.object({
        topic: z.string().describe("Thema / Pfad des Memory-Eintrags"),
      }),
    },
    async ({ topic }) => {
      await ensureDir(getMemoryRoot());
      const entry = await readEntry(topic);
      if (!entry) {
        return {
          content: [{ type: "text", text: `Kein Memory-Eintrag für '${topic}' gefunden.` }],
        };
      }
      await touchEntry(topic);
      return {
        content: [
          {
            type: "text",
            text: `# Memory: ${topic}\n\nZuletzt aktualisiert: ${entry.meta.updated}\nAbrufe: ${entry.meta.accessCount}\n\n---\n\n${entry.content}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "memory_save",
    {
      title: "Memory speichern",
      description:
        "Speichert oder überschreibt Wissen zu einem Thema. " +
        "Nutze dies nach Entscheidungen, Architekturänderungen oder wichtigen Erkenntnissen.",
      inputSchema: z.object({
        topic: z.string().describe("Thema / Pfad, z.B. 'decisions', 'architecture', 'entities/UserService'"),
        content: z.string().describe("Der zu speichernde Markdown-Inhalt"),
        tags: z.array(z.string()).optional().describe("Optionale Schlagwörter zur Kategorisierung"),
      }),
    },
    async ({ topic, content, tags }) => {
      await ensureDir(getMemoryRoot());
      await writeEntry(topic, content, tags ?? []);
      return {
        content: [{ type: "text", text: `Memory '${topic}' erfolgreich gespeichert.` }],
      };
    }
  );

  server.registerTool(
    "memory_list",
    {
      title: "Memory-Einträge auflisten",
      description: "Listet alle vorhandenen Memory-Themen auf. Nützlich zu Beginn einer Session für den Überblick.",
      inputSchema: z.object({}),
    },
    async () => {
      await ensureDir(getMemoryRoot());
      const topics = await listTopics();
      if (topics.length === 0) {
        return { content: [{ type: "text", text: "Noch keine Memory-Einträge vorhanden." }] };
      }
      const list = topics.map((t) => `- ${t}`).join("\n");
      return { content: [{ type: "text", text: `Vorhandene Memory-Einträge:\n\n${list}` }] };
    }
  );
}
