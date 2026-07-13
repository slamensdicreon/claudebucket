<p align="center">
  <img src="src/renderer/src/assets/logo-mark.png" alt="Crowdmind logo" width="96" />
</p>

<h1 align="center">Crowdmind</h1>

<p align="center">
  Build synthetic research panels, test ideas with AI personas, run follow-up roundtables, and export stakeholder-ready reports.
</p>

<p align="center">
  <a href="https://github.com/Brokenwatch24/crowdmind/releases/latest"><strong>Download for Windows</strong></a>
  ·
  <a href="#features">Features</a>
  ·
  <a href="#marketplace-templates">Templates</a>
  ·
  <a href="#mcp-for-agentic-workflows">MCP</a>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/github/v/release/Brokenwatch24/crowdmind?label=release" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green" />
  <img alt="Local first" src="https://img.shields.io/badge/local--first-SQLite-blue" />
  <img alt="Electron" src="https://img.shields.io/badge/Electron-React%20%2B%20TypeScript-9cf" />
</p>

## Why Crowdmind?

Crowdmind is a local-first desktop app for fast qualitative research before you spend money on real panels, ads, prototypes, or customer interviews.

Create a panel of synthetic personas, show them a product, message, landing page, pricing proposal, image, PDF, or multi-step funnel, and get structured reactions: scores, objections, positive signals, recurring themes, confidence indicators, and follow-up answers.

It is built for founders, product marketers, researchers, agencies, and product teams who want directional signal in minutes while keeping their research data on their own machine.

## What It Does

- **Create realistic persona panels** manually, from CSV, from marketplace templates, or with AI.
- **Run stimulus tests** with text, multiple images, PDFs, or full funnel sequences.
- **Continue any test** with follow-up questions, selected-persona follow-ups, or full-panel roundtables.
- **See the swarm** directly inside the test results page, with sentiment-colored nodes and drag selection.
- **Chat 1:1 with any persona** from their profile or directly from a test response.
- **Use multiple LLM providers**: OpenAI, Anthropic, Gemini, OpenRouter, or the built-in offline local provider.
- **Export reports** as JSON, Markdown, summary PDF, or a full investor/client-style PDF report.
- **Run locally with SQLite**. Your workspaces, panels, tests, notes, and chat history stay on your machine.
- **Connect agentic workflows** through the included CrowdMind MCP server.

## Reports

Crowdmind turns raw synthetic feedback into shareable research artifacts.

PDF export supports:

- **Summary report**: concise methodology, findings, recommendations, and limitations.
- **Full report**: stimulus, sentiment, scorecard, recurring themes, objections, positive signals, panel voices, persona-by-persona detail, and recommendations.

Markdown and raw JSON exports are also available for Notion, docs, PRs, and custom analysis workflows.

## Features

### Research Panels

- Workspaces and panels for organizing client, product, or market research.
- AI-generated personas from a professional research brief.
- Manual persona creation and “improve with AI”.
- CSV import from survey/customer data.
- Persona version history, so historical results stay tied to the persona version that produced them.
- Persona avatars from deterministic seeds, uploads, or AI image generation.

### Testing

- Single stimulus tests: text, image, PDF, or multimodal.
- Multi-attachment tests with multiple images and PDFs.
- Funnel tests with ordered stages, drag-and-drop stage editing, and funnel templates.
- Individual mode for fast parallel responses.
- Focus-group mode where personas see a rotating summary of peer reactions.
- Scorecards for custom criteria like clarity, trust, purchase intent, pricing fit, or usability.

### Analysis

- Executive summary.
- Confidence and diversity badge.
- Recurring themes with representative quotes.
- Objections and positive signals.
- Benchmarking against previous tests in the same panel.
- Audience comparisons and panel timeline.
- Notes with Markdown for custom analysis.

### Continuation

- Ask more questions after a test.
- Select a subset of personas from the swarm.
- Ask the full panel as a roundtable.
- Use quick prompts for improving message, pricing, trust, or conversion.
- Jump from any answer to the persona profile or 1:1 chat.

### Providers

- OpenAI
- Anthropic
- Google Gemini
- OpenRouter
- Local deterministic provider, no API key required

API keys are stored locally. When available, Crowdmind uses the OS keychain through Electron `safeStorage`; if OS encryption is unavailable, the Settings page makes that clear.

## Getting Started

### Use the App

Download the latest Windows installer:

https://github.com/Brokenwatch24/crowdmind/releases/latest

No API key is required to try Crowdmind. Use the Local provider and load the demo workspace from the welcome screen.

### Run From Source

Requirements:

- Node.js 20+
- npm
- Windows users compiling native modules need Python and Visual Studio Build Tools with Desktop C++ workload.

```bash
git clone https://github.com/Brokenwatch24/crowdmind.git
cd crowdmind
npm install
npm run dev
```

## Useful Commands

```bash
npm run dev         # launch the Electron app in development
npm run typecheck   # TypeScript checks
npm run smoke-test  # end-to-end smoke test with the local provider
npm run build       # production build
npm run dist:win    # Windows installer in release/
npm run mcp         # build and run the CrowdMind MCP server
```

## MCP For Agentic Workflows

Crowdmind includes an MCP server for tools like Codex and other MCP-compatible agents.

```bash
npm run mcp -- --db "C:\path\to\crowdmind.sqlite"
```

The MCP server can list workspaces, panels, personas, generate local persona previews, save personas, run simple local tests, and fetch compact test results.

## Marketplace Templates

Crowdmind ships with panel templates for:

- B2B SaaS buyers
- Consumer LatAm segments
- Families and middle-class households
- Gen Z social shoppers
- Restaurant and hotel operators in Colombia
- SaaS founders and operators in LatAm

You can export any panel as a `.json` template and share it. The app can also pull new templates directly from this repository without waiting for an app update.

To contribute one, see:

[docs/MARKETPLACE_TEMPLATES.md](docs/MARKETPLACE_TEMPLATES.md)

## Architecture

- **Desktop shell**: Electron + electron-vite
- **Renderer**: React 18 + TypeScript + Tailwind + Radix primitives
- **State**: Zustand
- **Database**: SQLite with `better-sqlite3` and Drizzle schema definitions
- **LLM layer**: provider adapters with schema validation and retry/backoff
- **Reports**: self-contained HTML rendered to PDF through Electron
- **MCP**: stdio server for local agentic workflows

All database, filesystem, API key, and provider calls run in the Electron main process. The renderer talks through a typed `window.crowdmind` API exposed by the preload script.

## Auto-Update

Packaged builds check GitHub Releases through `electron-updater`. Updates are never installed silently:

1. Crowdmind shows an update banner.
2. You click download.
3. After download, you choose when to restart and install.

Release assets must include the installer, blockmap, and `latest.yml`.

## Status

Current release: [v0.2.4](https://github.com/Brokenwatch24/crowdmind/releases/tag/v0.2.4)

Verified locally with:

```bash
npm run typecheck
npm run smoke-test
npm run dist:win
```

macOS and Linux packaging are configured but not yet release-tested from their native platforms.

## License

MIT
