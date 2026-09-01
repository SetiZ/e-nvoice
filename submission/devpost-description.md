# e-nvoice — WebMCP Devpost Submission

**Project:** e-nvoice — Free client-side Factur-X / EN 16931 e-invoicing for the 2026 French mandate
**Repo:** https://github.com/SetiZ/e-nvoice
**License:** MIT
**Languages:**
- en: https://{PAGES_URL}/
- fr: https://{PAGES_URL}/?lang=fr
**Demo video:** <Paste public YouTube link here>

---

## 1. What are you and your app most proud of? (Strongest fit / better UX)

e-nvoice is a **free, privacy-first, 100% client-side** web application that generates
**Factur-X PDF/A-3 invoices with embedded UN/CEFACT XML** — compliant with the French
2026/2027 electronic-invoicing mandate (Factur-X MINIMUM, BASIC, BASIC WL, EN 16931)
and ready for the government's Chorus Pro portal.

Its strongest fit is that it turns compliance into a **browser-native agent workflow**.
We expose four MCP tools so any AI agent can drive the whole invoicing pipeline from
inside the user's own tab — no API key, no backend, no data ever leaving the machine:

- `calculate_invoice_totals` — HT subtotal, VAT, and TTC totals in EUR/USD/GBP/CHF
- `validate_invoice_data` — mandatory-field checks against EN 16931 + CIUS-FR
- `generate_facturx_xml` — raw UN/CEFACT CrossIndustryInvoice (D16B) XML
- `generate_facturx_invoice` — the complete hybrid PDF/A-3 + XML file, ready to download

The better UX is the point: invoices are produced exactly where the data lives, are
instantly valid, and never touch a server.

## 2. What's new and what's now possible?

Before e-nvoice, producing a compliant electronic invoice meant paid desktop software or
a server round-trip with an API key. WebMCP makes the agent experience native and
serverless:

- An agent can now **discover our tools** (`getTools`), **call them** (`executeTool`) to
  validate and build an invoice, and hand the user a ready-to-download PDF/A-3 — all in
  the browser tab, offline-capable.
- e-nvoice is **Chorus Pro ready**: the generated file uploads straight to the French
  government portal.
- Full multi-currency (EUR, USD, GBP, CHF), B2B/B2C/B2G and international VAT-exemption
  handling (art. 262 ter, reverse charge).
- What used to be a tedious, error-prone human workflow is now a repeatable agent
  routine with validation built in at every step.

## 3. How is the app built?

A single-page React/Vite app with no backend:

- **WebMCP layer** (`src/utils/webMcp.ts`): we register our four tools through the native
  `document.modelContext.registerTool` API where the browser supports it (Chrome with
  WebMCP + origin isolation), and fall back to a `window.mcp` / `postMessage` JSON-RPC
  layer everywhere else — so the same tools work on any host.
- **Manifest & discoverability:** `.well-known/mcp.json` (tools + schemas), `openapi.json`,
  and `llms.txt` / `llms-full.txt` for AI agents.
- **PDF generation:** lazy-loaded `pdfGenerator.ts` (PDF/A-3 hybrid) + `facturx.ts`
  (UN/CEFACT CII D16B XML), all rendered client-side.
- **Validation:** `invoiceValidation.ts` enforces EN 16931 + CIUS-FR mandatory fields.
- Open source under MIT with a public repo and full `registerTool` source snippet.

## 4. Additional info and external links

- Source: https://github.com/SetiZ/e-nvoice
- License: MIT
- WebMCP manifest: https://{PAGES_URL}/.well-known/mcp.json
- OpenAPI: https://{PAGES_URL}/openapi.json
- Website: https://{PAGES_URL}/
