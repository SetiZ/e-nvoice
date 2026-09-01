# e-nvoice — Demo Video Script (AI-narrated, English, ~2:30)

**Target link:** https://youtu.be/ACmM6lG64Z0
**Recorded against:** https://e-nvoice.pages.dev/ (Cloudflare Pages — origin-isolated WebMCP)
**Tool:** local Node/Playwright + ffmpeg screenshot→MP4 pipeline (AI TTS narration)

---

## Shot list

| # | Time | Visual | Narration (AI voice) |
|---|------|--------|----------------------|
| 1 | 0:00–0:08 | Title card: e-nvoice logo, tagline "Factur-X e-invoicing, in your browser, for your AI agents" | "In 2026, French businesses must emit electronic invoices. Meet e-nvoice — a free, private, in-browser generator that produces compliant Factur-X invoices and hands them to AI agents through the WebMCP protocol." |
| 2 | 0:08–0:25 | The app's invoice form, top of page. Cursor highlights a pre-filled line item (quantity, unit price, VAT). | "No server, no API key, no upload. Everything runs locally. Here's an invoice for consulting services — quantities, prices, VAT — ready in the browser." |
| 3 | 0:25–0:50 | The WebMCP "Tools" panel opens; four tools flash: calculate_invoice_totals, validate_invoice_data, generate_facturx_xml, generate_facturx_invoice. | "e-nvoice exposes its invoice engine as four WebMCP tools. Any agent running in this page can discover them, call them, and build a complete invoice on your behalf." |
| 4 | 0:50–1:12 | An agent terminal/panel shows a `validate_invoice_data` call returning "valid", then `calculate_invoice_totals` returning HT / VAT / TTC. | "Watch the agent work. First — validate the invoice against EN 16931 and CIUS-FR. Compliant. Then — calculate the totals: subtotal, VAT, and the total due, in euros." |
| 5 | 1:12–1:40 | Agent calls `generate_facturx_invoice`; the browser downloads the PDF. A zoom shows the hybrid PDF/A-3 with embedded XML. | "Now the payoff. The agent calls generate_facturx_invoice, and the browser hands back a hybrid PDF/A-3 file with the Factur-X XML embedded — ready for the French Chorus Pro portal." |
| 6 | 1:40–2:05 | Recap card: Privacy (client-side) / Compliance (Factur-X + EN 16931) / Agents (WebMCP native) / Free + Open Source (MIT). | "Privacy-first, fully compliant, agent-ready, and 100% open source under the MIT license." |
| 7 | 2:05–2:30 | Closing: e-nvoice + WebMCP logo, repo URL github.com/SetiZ/e-nvoice | "Build your own agent workflow on e-nvoice today. Try it live, read the open source, and bring AI into the 2026 invoicing mandate." |

**Total:** ~2:30 (under the 3-minute limit)
