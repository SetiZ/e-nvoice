# e-nvoice — Testing Instructions

No credentials needed — everything runs client-side on the public site: https://e-nvoice.pages.dev

## Quick check (any browser)

Open https://e-nvoice.pages.dev → DevTools console:

```js
await window.mcp.callTool('calculate_invoice_totals', {
  items: [{ quantity: 2, unitPrice: 100, vatRate: 20 }, { quantity: 1, unitPrice: 50, vatRate: 10 }]
})
// → { subtotal: 250, vat: 45, total: 295, currency: "EUR" }
```

## Native WebMCP (real Chrome, flag needed)

Launch with:

```
google-chrome --enable-features=WebMCP,ModelExecutionAPI https://e-nvoice.pages.dev
```

```js
const tools = await document.modelContext.getTools();   // lists all 4 tools
await document.modelContext.executeTool(
  tools.find(t => t.name === 'calculate_invoice_totals'),
  JSON.stringify({ items: [{ quantity: 2, unitPrice: 100, vatRate: 20 }] })
)
```

Note: `document.modelContext` is `undefined` without the flag — that's expected; the `window.mcp` path works with zero setup.