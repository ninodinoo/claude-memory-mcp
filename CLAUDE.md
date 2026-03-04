# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projektbeschreibung

MCP Server der Context Rot in Claude Code bekämpft. Er legt in jedem Zielprojekt einen `.claude-memory/`-Ordner an und stellt 2 Tools bereit mit denen Claude Wissen persistiert und lädt. SessionStart Hook lädt automatisch den aktuellen Arbeitsstand.

## Commands

```bash
npm install          # Abhängigkeiten installieren
npm run build        # TypeScript kompilieren → dist/
npm run dev          # Watch-Mode (auto-recompile)
npm start            # Server starten (stdio)
```

## Architektur

```
src/
├── index.ts                  # MCP Server Bootstrap + Transport (v0.4.0)
├── hooks/
│   └── session-start.ts      # SessionStart Hook — lädt current-task + Topic-Liste
├── memory/
│   ├── store.ts              # Dateisystem-Abstraktion für .claude-memory/
│   └── initializer.ts        # Auto-Init: Projekterkennung + Standard-Einträge
└── tools/
    ├── memory-tools.ts       # memory (1 Tool: read/write/append/delete)
    └── session-tools.ts      # checkpoint (1 Tool)
```

## Tools (2 total)

| Tool | Beschreibung |
|------|-------------|
| `memory(topic?, content?, mode?, tags?)` | Ohne topic: Übersicht. Mit topic ohne content: lesen. Mit content: write/append/delete. Auto-Init beim ersten Schreiben |
| `checkpoint(summary, nextSteps?, blockers?)` | Arbeitsstand in current-task speichern (überschreibt, letzter Stand zählt) |

## SessionStart Hook

Registriert in `.claude/settings.json` als `UserPromptSubmit` Hook. Gibt beim Start automatisch aus:
- Aktueller Arbeitsstand (current-task)
- Liste aller Memory-Topics

## Datenformat

Jeder Memory-Eintrag ist eine `.md`-Datei mit JSON-Metadaten-Header:
```
<!-- META:{"created":"...","updated":"...","accessCount":0,"tags":[]} -->

Inhalt hier...
```

**Index:** `.claude-memory/index.json` — Mapping `topic → tags[]`

**Topic-Pfade:** Slashes werden zu Unterordnern — `"entities/UserService"` → `.claude-memory/entities/UserService.md`

**Auto-Init:** Beim ersten Schreiben wird `.claude-memory/` automatisch mit architecture, decisions und current-task initialisiert.

## In Claude Code einbinden (nach dem Build)

In `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "claude-memory": {
      "command": "node",
      "args": ["C:/Users/pnino/Documents/ClaudeWorkspace/projekte/claude-memory-mcp/dist/index.js"]
    }
  }
}
```

Der Server liest `process.cwd()` — er muss also aus dem Ziel-Projektordner heraus gestartet werden (Claude Code macht das automatisch).

## Empfohlene Nutzung in Zielprojekten (CLAUDE.md Snippet)

```markdown
## Memory-Plugin

- Session-Start: Hook lädt automatisch current-task + Topic-Liste
- Nach wichtigen Änderungen: `checkpoint` aufrufen
- Neue Entscheidungen: `memory("decisions", "...", "append")`
- Löschen: `memory("topic", "", "delete")`
```
