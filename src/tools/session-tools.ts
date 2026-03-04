import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeEntry, readEntry, getMemoryRoot, ensureDir } from "../memory/store.js";

export function registerSessionTools(server: McpServer): void {

  server.registerTool(
    "checkpoint",
    {
      title: "Checkpoint setzen",
      description:
        "Speichert den aktuellen Arbeitsstand unter 'current-task'. " +
        "Rufe dies nach jedem bedeutenden Schritt auf. " +
        "Wird automatisch bei der nächsten Session geladen.",
      inputSchema: z.object({
        summary: z.string().describe("Kurze Beschreibung was gemacht wurde"),
        nextSteps: z.array(z.string()).optional().describe("Geplante nächste Schritte"),
        blockers: z.array(z.string()).optional().describe("Aktuelle Blocker oder offene Fragen"),
      }),
    },
    async ({ summary, nextSteps, blockers }) => {
      await ensureDir(getMemoryRoot());

      const lines: string[] = [
        `## Stand`,
        "",
        summary,
      ];

      if (nextSteps?.length) {
        lines.push("", "## Nächste Schritte");
        nextSteps.forEach((s) => lines.push(`- ${s}`));
      }

      if (blockers?.length) {
        lines.push("", "## Blocker");
        blockers.forEach((b) => lines.push(`- ${b}`));
      }

      // Immer überschreiben — letzter Stand zählt
      await writeEntry("current-task", lines.join("\n"), ["session", "checkpoint"]);

      return {
        content: [{ type: "text" as const, text: `Checkpoint gespeichert.` }],
      };
    }
  );
}
