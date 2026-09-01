# e-nvoice — WebMCP Devpost Submission

**Project:** e-nvoice — Free client-side Factur-X / EN 16931 e-invoicing for the 2026 French mandate

**Repo:** https://github.com/SetiZ/e-nvoice

**License:** MIT

**Website:** https://e-nvoice.pages.dev

**Demo video:** https://youtu.be/ACmM6lG64Z0

---

## Inspiration

In September 2026, French businesses must start emitting electronic invoices (freelancers and small companies join in September 2027). As my wife is a freelancer, I wanted to first understand the rules and requirements. Then I looked what was available for freelancers to generate invoices. I found that most of the available tools were either too complex or too expensive. So I decided to build a free, client-side tool that could generate Factur-X / EN 16931 invoices.
Apart from creating a compliant invoice, the main part of the tool would be to connect it to a platform like Chorus Pro, but I didn't work on that, I only built the invoice generator and added a WebMCP API for it. So anyone can call my invoice generator through the WebMCP API and generate an invoice in a compliant way.

## What it does

e-nvoice is a free, 100% client-side app that generates Factur-X / EN 16931 invoices: a PDF/A-3 with embedded UN/CEFACT XML, ready for Chorus Pro. No server, no API key, no data leaving the machine. It covers B2B/B2C, four currencies, and French legal mentions — and exposes everything as four WebMCP tools agents can discover, validate with, compute, and generate with end to end.

## How we built it

I started from scratch with a prompt trying to understand the new legislation and what the steps are to create a compliant invoice. Then I started to build the application using React 19 + TypeScript + Vite. I delegated the PDF and XML development to the AI, then I started looking into WebMCP and how to use it. I also added SEO, llm.txt and openapi.json to make it discoverable by AI agents.

## Challenges I ran into

WebMCP is brand new: `document.modelContext` only exists in flag-enabled, origin-isolated Chrome. I just started the implementation thinking that it would be handled eventually. At first I deployed the website on github pages, but then entering this context, I realized that it was not the right move, so I moved it to cloudflare pages. Then I let the AI analyze what I needed to do to make it work. I verified it end to end in a flag-enabled Chrome; shipping without a fallback still feels risky.

## Accomplishments that I'm proud of

A complete, validated Factur-X generator that runs 100% offline in a browser tab, with nothing leaving the machine. That was my main goal. The WebMCP tools were a bonus to provide a different way to interact with the application and to make it discoverable by AI agents. The full loop works — validate against EN 16931 + CIUS-FR, compute HT → VAT → TTC, download the PDF/A-3 — and it's fully open source.

## What I learned

I first learned about this new legislation, what are the requirements to create a compliant invoice, how to validate an invoice,  and how to generate the PDF/A-3. Then, I started looking into WebMCP and how to use it. I also added SEO, llm.txt and openapi.json to make it discoverable by AI agents. In a compliance product, the regulation is the real work. And WebMCP is young — keep a fallback always on.

## What's next for E-nvoice

Right now no idea. I might find a way to integrate with Chorus Pro or other platforms. I am also interested in the WebMCP project and how to use it to create more tools and applications.
