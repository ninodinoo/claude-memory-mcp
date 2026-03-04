# claude-memory-mcp

An MCP (Model Context Protocol) server for Claude Code that fights **context rot** — the gradual loss of project knowledge as conversations grow longer.

## How it works

The plugin creates a `.claude-memory/` folder in your project and gives Claude tools to persist, retrieve and search knowledge across sessions. Only what's relevant to the current task gets loaded, keeping context usage minimal.

## Tools

| Tool | Description |
|------|-------------|
| `memory_load` | Load stored knowledge for a topic |
| `memory_save` | Save or update knowledge for a topic |
| `memory_list` | List all existing memory entries |
| `memory_search` | Full-text search across all entries |
| `checkpoint` | Save current progress and next steps |
| `session_summary` | Compress and archive the current session |

## Installation

```bash
git clone https://github.com/etwsentwNino/claude-memory-mcp.git
cd claude-memory-mcp
npm install
npm run build
```

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "claude-memory": {
      "command": "node",
      "args": ["/absolute/path/to/claude-memory-mcp/dist/index.js"]
    }
  }
}
```

## Recommended usage

Add this to your project's `CLAUDE.md`:

```markdown
## Memory

- Session start: call `memory_list`, then `memory_load("current-task")`
- After significant changes: call `checkpoint`
- New decisions: append via `memory_save("decisions", ...)`
- Session end: call `session_summary`
```

## Memory structure

Each memory entry is a Markdown file with a JSON metadata header tracking creation date, last update, access count and tags. Topics with slashes map to subfolders (e.g. `"entities/UserService"` → `.claude-memory/entities/UserService.md`).

## License

MIT
