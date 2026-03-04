import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { getMemoryRoot, readEntry, listTopics } from "../memory/store.js";

export function registerSearchTools(server: McpServer): void {

  server.registerTool(
    "memory_search",
    {
      title: "Memory durchsuchen",
      description:
        "Durchsucht alle Memory-Einträge nach einem Begriff. " +
        "Gibt passende Einträge mit Kontext-Ausschnitt zurück.",
      inputSchema: z.object({
        query: z.string().describe("Suchbegriff (case-insensitive)"),
        maxResults: z.number().optional().default(5).describe("Maximale Anzahl Ergebnisse"),
      }),
    },
    async ({ query, maxResults }) => {
      const topics = await listTopics();
      if (topics.length === 0) {
        return { content: [{ type: "text", text: "Keine Memory-Einträge vorhanden." }] };
      }

      const lowerQuery = query.toLowerCase();
      const results: { topic: string; excerpt: string; score: number }[] = [];

      for (const topic of topics) {
        const entry = await readEntry(topic);
        if (!entry) continue;

        const lowerContent = entry.content.toLowerCase();
        if (!lowerContent.includes(lowerQuery)) continue;

        // Einfaches Scoring: Häufigkeit des Treffers
        const occurrences = (lowerContent.match(new RegExp(lowerQuery, "g")) ?? []).length;

        // Kontext-Ausschnitt rund um ersten Treffer
        const idx = lowerContent.indexOf(lowerQuery);
        const start = Math.max(0, idx - 80);
        const end = Math.min(entry.content.length, idx + query.length + 80);
        const excerpt = (start > 0 ? "…" : "") + entry.content.slice(start, end) + (end < entry.content.length ? "…" : "");

        results.push({ topic, excerpt, score: occurrences + entry.meta.accessCount * 0.1 });
      }

      if (results.length === 0) {
        return { content: [{ type: "text", text: `Keine Ergebnisse für '${query}' gefunden.` }] };
      }

      results.sort((a, b) => b.score - a.score);
      const top = results.slice(0, maxResults);

      const output = top
        .map((r) => `### ${r.topic}\n\`\`\`\n${r.excerpt}\n\`\`\``)
        .join("\n\n");

      return {
        content: [{ type: "text", text: `Suchergebnisse für '${query}':\n\n${output}` }],
      };
    }
  );
}
