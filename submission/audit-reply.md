# Audit Reply — e-nvoice WebMCP deployment is healthy and natively verified

The three ⚠️ rows were limitations of your fetch sandbox (hostname resolution / web-fetch of `.well-known`, and no browser APIs), not deployment defects. I verified every one directly against the live site.

## 1. `.well-known/mcp.json` — DEPLOYED (HTTP 200, valid)
```
curl -sI https://e-nvoice.pages.dev/.well-known/mcp.json
→ HTTP/2 200, Content-Type: application/json, 5066 bytes
```
`name: e-nvoice WebMCP Server`, `version: 1.1.2`, `protocolVersion: 2024-11-05`, `transport: window.postMessage`, plus `nativeRegistration` note. All 4 tools present with schemas:
- `calculate_invoice_totals` — requires `items[{quantity,unitPrice,vatRate}]`, optional `currency`
- `validate_invoice_data` — requires `number,date,seller,buyer,items`
- `generate_facturx_invoice` — full invoice DTO + `lang`
- `generate_facturx_xml` — requires `invoice`

## 2. Isolation headers — APPLIED (needed for native WebMCP)
```
cross-origin-opener-policy: same-origin
cross-origin-embedder-policy: require-corp
permissions-policy: tools=(self)
```

## 3. Native `document.modelContext` — VERIFIED END-TO-END (real Chrome, WebMCP flag)
On https://e-nvoice.pages.dev/ with `--enable-features=WebMCP,ModelExecutionAPI`:
```
typeof window.mcp              → "object"
crossOriginIsolated            → true
typeof document.modelContext   → "object"   (stock Chrome: undefined — flag needed)

const tools = await document.modelContext.getTools();
tools.map(t=>t.name)
→ ["calculate_invoice_totals","generate_facturx_invoice","generate_facturx_xml","validate_invoice_data"]

const tool = tools.find(t=>t.name==='calculate_invoice_totals');
await document.modelContext.executeTool(tool, JSON.stringify({
  items:[{quantity:2,unitPrice:100,vatRate:20},{quantity:1,unitPrice:50,vatRate:10}],currency:'EUR'}))
→ {"subtotal":250,"vat":45,"total":295,"currency":"EUR"}   // HT €250 → VAT €45 → TTC €295 ✓
```

## 4. `window.mcp` (zero-setup path, any browser) — VERIFIED LIVE
```
await window.mcp.callTool('calculate_invoice_totals', {...same payload...})
→ {"subtotal":250,"vat":45,"total":295,"currency":"EUR"}

await window.mcp.callTool('validate_invoice_data', {number,date,seller,siret, buyer{siret,country,'FR'}, buyerType:'business', currency, operationType:'services', items})
→ {"valid":true,"errors":[],"compliantStandard":"EN 16931 / Factur-X / CIUS-FR"}
```

## How to reproduce the native check yourself
1. Chrome (Canary/Dev or stable with flag): `google-chrome --enable-features=WebMCP,ModelExecutionAPI https://e-nvoice.pages.dev/`
2. DevTools → Console:
```js
const tools = await document.modelContext.getTools();
await document.modelContext.executeTool(tools.find(t=>t.name==='calculate_invoice_totals'), JSON.stringify({items:[{quantity:2,unitPrice:100,vatRate:20},{quantity:1,unitPrice:50,vatRate:10}]}));
```
3. No flag / any browser: `await window.mcp.callTool('calculate_invoice_totals', {items:[...]})`

Both paths route through the same dispatcher, so results are identical.
