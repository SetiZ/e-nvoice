# e-nvoice — WebMCP Devpost Submission

**Project:** e-nvoice — Free client-side Factur-X / EN 16931 e-invoicing for the 2026 French mandate
**Repo:** https://github.com/SetiZ/e-nvoice
**License:** MIT
**Languages:**
- en: https://e-nvoice.pages.dev
- fr: https://e-nvoice.pages.dev?lang=fr
**Demo video:** https://youtu.be/ACmM6lG64Z0

---

## Inspiration

In 2026 every French business must emit electronic invoices, but "compliant" means getting EN 16931, CIUS-FR, French legal mentions, and VAT edge cases right — the kind of tedious work tools force a human to do. We wanted an instant, private generator, and with WebMCP we could let an *agent* do it inside the user's own tab.

## What it does

e-nvoice is a free, 100% client-side app that generates Factur-X / EN 16931 invoices: a PDF/A-3 with embedded UN/CEFACT XML, ready for Chorus Pro. No server, no API key, no data leaving the machine. It covers B2B/B2C, four currencies, and French legal mentions — and exposes everything as four WebMCP tools agents can discover, validate with, compute, and generate with end to end.

## How we built it

React 19 + TypeScript + Vite; PDF via `jspdf`/`pdf-lib`, XML via a custom CII D16B builder. A single WebMCP dispatcher (`src/utils/webMcp.ts`) registers tools both natively (`document.modelContext.registerTool`) and via a `window.mcp`/postMessage fallback. Hosted on Cloudflare Pages with the origin-isolation headers native WebMCP requires, plus `mcp.json`, `openapi.json`, `llms.txt` for discoverability. MIT-licensed, open source.

## Challenges we ran into

WebMCP is brand new: `document.modelContext` only exists in flag-enabled, origin-isolated Chrome, so we had to set COOP/COEP headers exactly right and verify everything in a real flag-enabled browser. Serverless also means ChatGPT Actions, Claude.ai, and Gemini can't reach us cross-origin — so we documented honest workarounds instead of overpromising. And compliance itself was depth work: the French legal mentions and CIUS rules, not the PDF, took most of the effort.

## Accomplishments that we're proud of

A complete, validated Factur-X generator that runs 100% offline in a browser tab, with nothing leaving the machine. Four WebMCP tools verified end to end: native `getTools()` lists all four and `executeTool()` returns correct totals in real Chrome. The full loop works — validate against EN 16931 + CIUS-FR, compute HT → VAT → TTC, download the PDF/A-3 — and it's fully open source.

## What we learned

Client-side agent integration flips the architecture: the agent comes to the page, not the page to the agent, so building a robust `window.mcp` layer with native registration as a progressive enhancement is what makes this work today. In a compliance product, the regulation is the real work. And WebMCP is young — keep a fallback always on.

## What's next for E-nvoice

The gaps we deliberately left open: PAdES e-signature for public-market invoices Chorus Pro requires, UBL and full EN 16931 profiles, a local MCP server for desktop clients, direct Chorus Pro / PDP submission, and CSV/scan import into validated invoices. The four WebMCP tools stay identical, so agent workflows built today keep working.