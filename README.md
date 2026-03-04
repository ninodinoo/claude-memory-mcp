<div align="center">

# 🧠 ninos-claude-memory-mcp

**Stop losing your mind. Give Claude one.**

An MCP server for [Claude Code](https://claude.ai/code) that fights **context rot** — the silent degradation of project knowledge as conversations grow longer.

[![License: MIT + Attribution](https://img.shields.io/badge/License-MIT%20%2B%20Attribution-yellow.svg)](https://github.com/ninodinoo/ninos-claude-memory-mcp/blob/master/LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![GitHub](https://img.shields.io/badge/GitHub-ninodinoo%2Fninos--claude--memory--mcp-181717?logo=github)](https://github.com/ninodinoo/ninos-claude-memory-mcp)
[![Author](https://img.shields.io/badge/by-ninodinoo-orange)](https://github.com/ninodinoo)

</div>

---

## The Problem

Claude Code is powerful — but every session starts from zero. Over time, or as context fills up, critical knowledge fades:

- Architectural decisions get forgotten mid-project
- Earlier context contradicts later responses
- You repeat yourself across sessions
- Claude loses the "why" behind code choices

This is **context rot**. And it gets worse the larger your project becomes.

---

## The Solution

`claude-memory-mcp` gives Claude a **persistent memory layer** that lives inside your project. Claude can save, retrieve, and search knowledge across sessions — loading only what's relevant to the current task, never bloating the context window.

```
Your project/
└── .claude-memory/        ← managed automatically by the plugin
    ├── architecture.md    ← how the system is built
    ├── decisions.md       ← why things are the way they are
    ├── current-task.md    ← where we left off
    ├── entities/          ← key components and modules
    └── sessions/          ← archived session summaries
```

---

## Features

| | Feature | Description |
|--|---------|-------------|
| 🔁 | **Persistent memory** | Knowledge survives session resets and context limits |
| 🎯 | **Smart loading** | `context_suggest` ranks topics by relevance to your current task |
| 💾 | **Session checkpoints** | Save progress mid-session — nothing gets lost |
| 📦 | **Session archiving** | Compress and archive sessions automatically |
| 🔍 | **Full-text search** | Find anything across all memory entries |
| 📊 | **Memory stats** | Track usage, size, and health of your memory store |
| 🚀 | **Project detection** | `memory_init` auto-detects Node, Rust, Go, Python and bootstraps a sensible structure |
| 📁 | **Human-readable files** | Plain Markdown — edit manually anytime, commit to share with your team |
| 🔒 | **100% local** | No external services, no cloud, no accounts required |

---

## Installation

### ⚡ One-line setup (recommended)

No clone. No build step. Just add this to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "claude-memory": {
      "command": "npx",
      "args": ["-y", "github:ninodinoo/ninos-claude-memory-mcp"]
    }
  }
}
```

Claude Code will download, build, and run the server automatically on first use. Restart Claude Code after saving.

---

### 🔧 Manual install (for development or offline use)

```bash
git clone https://github.com/ninodinoo/ninos-claude-memory-mcp.git
cd claude-memory-mcp
npm install && npm run build
```

Then add to `~/.claude/settings.json`:

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

<details>
<summary>Platform-specific path examples</summary>

**Windows:**
```json
"args": ["C:/Users/yourname/claude-memory-mcp/dist/index.js"]
```

**macOS / Linux:**
```json
"args": ["/home/yourname/claude-memory-mcp/dist/index.js"]
```

</details>

---

## Project setup

Add this snippet to your project's `CLAUDE.md` so Claude follows the memory workflow automatically:

```markdown
## Memory

At the start of every session:
1. Call `memory_list` to see what exists
2. Call `context_suggest` with your current task to find relevant topics
3. Call `memory_load` on the suggested topics

During work:
- Call `checkpoint` after every significant change
- Call `memory_save("decisions", ...)` for architectural or design choices

At the end of every session:
- Call `session_summary` to archive before context fills up
```

---

## Available Tools

### Core memory

| Tool | Description |
|------|-------------|
| `memory_init` | Auto-detect project type and bootstrap memory structure |
| `memory_load(topic)` | Load a memory entry by topic |
| `memory_save(topic, content, tags?)` | Save or overwrite a memory entry |
| `memory_append(topic, content)` | Append to an entry without overwriting |
| `memory_delete(topic)` | Delete a memory entry |
| `memory_list` | List all existing topics |

### Search & discovery

| Tool | Description |
|------|-------------|
| `memory_search(query, maxResults?)` | Full-text search across all entries |
| `context_suggest(task, maxTopics?)` | AI-ranked topic suggestions for your current task |

### Session management

| Tool | Description |
|------|-------------|
| `checkpoint(summary, nextSteps?, blockers?)` | Save a progress snapshot |
| `session_summary(accomplishments, decisions?, nextSession?)` | Archive the current session |
| `memory_diff(since?)` | Show what changed since a point in time |

### Maintenance

| Tool | Description |
|------|-------------|
| `memory_stats` | Show entry count, size, most accessed, recently changed |
| `memory_compress(olderThanDays?)` | Compress old session archives to save space |

---

## Topic naming

Topics map to Markdown files inside `.claude-memory/`. Slashes create subfolders:

| Topic | File |
|-------|------|
| `current-task` | `.claude-memory/current-task.md` |
| `architecture` | `.claude-memory/architecture.md` |
| `decisions` | `.claude-memory/decisions.md` |
| `entities/AuthService` | `.claude-memory/entities/AuthService.md` |
| `sessions/2025-01-15` | `.claude-memory/sessions/2025-01-15.md` |

---

## Memory file format

Every entry is plain Markdown with a small metadata header:

```
<!-- META:{"created":"2025-01-01T10:00:00Z","updated":"2025-01-15T14:30:00Z","accessCount":12,"tags":["architecture"]} -->

## Architecture Overview

We use a monorepo structured around domain boundaries...
```

Files are fully human-readable and can be edited, committed, or deleted at any time.

**Team usage:** Commit `.claude-memory/` to share project memory with your team. Add it to `.gitignore` to keep it personal.

---

## Requirements

- **Node.js** 18 or higher
- **Claude Code** with MCP support ([claude.ai/code](https://claude.ai/code))

---

## Disclaimer

This project is provided **as-is**, without warranty of any kind. The author is not responsible for:

- Loss of data stored in `.claude-memory/`
- Incorrect or outdated information loaded into Claude's context
- Any decisions made based on memory content generated or stored by this tool
- Unexpected behavior resulting from MCP protocol changes in Claude Code

**Always review memory content before relying on it for critical decisions.** Memory entries are generated by Claude itself — treat them as helpful notes, not ground truth.

This software is in active development. Breaking changes may occur between versions.

---

## Contributing

Issues and pull requests are welcome at [github.com/ninodinoo/ninos-claude-memory-mcp](https://github.com/ninodinoo/ninos-claude-memory-mcp).

---

## License

**MIT with Attribution** — free to use, modify, and distribute, with one condition:

Any public fork, derivative work, or project that builds on this code must include a visible credit to the original author in its README or documentation:

> Originally created by [ninodinoo](https://github.com/ninodinoo) — [ninos-claude-memory-mcp](https://github.com/ninodinoo/ninos-claude-memory-mcp)

See the full [LICENSE](https://github.com/ninodinoo/ninos-claude-memory-mcp/blob/master/LICENSE) for details.
