import type { Invoice, Party, BuyerType, OperationType } from '../types.ts';

type GenerateFacturXFn = (invoice: Invoice, lang?: 'en' | 'fr') => Promise<void>;
type GenerateFacturXXmlFn = (invoice: Invoice) => string;

// Lazy load PDF generator
let generateFacturXPromise: Promise<GenerateFacturXFn> | null = null;
const getGenerateFacturX = async (): Promise<GenerateFacturXFn> => {
  if (!generateFacturXPromise) {
    generateFacturXPromise = import('./pdfGenerator.ts').then(m => m.generateFacturX);
  }
  return generateFacturXPromise;
};

// Lazy load Factur-X XML generator
let generateFacturXXmlPromise: Promise<GenerateFacturXXmlFn> | null = null;
const getGenerateFacturXXml = async (): Promise<GenerateFacturXXmlFn> => {
  if (!generateFacturXXmlPromise) {
    generateFacturXXmlPromise = import('./facturx.ts').then(m => m.generateFacturXXml);
  }
  return generateFacturXXmlPromise;
};

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const WEBMCP_TOOLS: WebMcpTool[] = [
  {
    name: 'calculate_invoice_totals',
    description: 'Calculates HT subtotal, total VAT amount, and TTC total for invoice items.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
              vatRate: { type: 'number' }
            },
            required: ['quantity', 'unitPrice', 'vatRate']
          }
        }
      },
      required: ['items']
    }
  },
  {
    name: 'validate_invoice_data',
    description: 'Validates invoice fields against Factur-X / EN 16931 requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        number: { type: 'string' },
        date: { type: 'string' },
        seller: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            siret: { type: 'string' },
            vatNumber: { type: 'string' },
            iban: { type: 'string' },
            bic: { type: 'string' },
            bankName: { type: 'string' }
          },
          required: ['name']
        },
        buyer: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            siret: { type: 'string' },
            vatNumber: { type: 'string' },
            taxId: { type: 'string' }
          },
          required: ['name']
        },
        buyerType: { type: 'string', enum: ['business', 'individual'] },
        currency: { type: 'string', enum: ['EUR', 'USD', 'GBP', 'CHF'] },
        operationType: { type: 'string', enum: ['services', 'goods', 'mixed'] },
        items: { type: 'array' }
      },
      required: ['number', 'date', 'seller', 'buyer', 'items']
    }
  },
  {
    name: 'generate_facturx_xml',
    description: 'Generates raw Factur-X / EN 16931 XML string for an invoice.',
    inputSchema: {
      type: 'object',
      properties: {
        invoice: { type: 'object' }
      },
      required: ['invoice']
    }
  },
  {
    name: 'generate_facturx_invoice',
    description: 'Generates and downloads the complete Factur-X hybrid PDF file.',
    inputSchema: {
      type: 'object',
      properties: {
        number: { type: 'string' },
        date: { type: 'string' },
        dueDate: { type: 'string' },
        currency: { type: 'string', enum: ['EUR', 'USD', 'GBP', 'CHF'] },
        buyerType: { type: 'string', enum: ['business', 'individual'] },
        operationType: { type: 'string', enum: ['services', 'goods', 'mixed'] },
        seller: { type: 'object' },
        buyer: { type: 'object' },
        items: { type: 'array' },
        lang: { type: 'string', enum: ['fr', 'en'] }
      },
      required: ['number', 'date', 'seller', 'buyer', 'items']
    }
  }
];

export class WebMcpServer {
  private static instance: WebMcpServer | null = null;
  private isInitialized = false;

  public static getInstance(): WebMcpServer {
    if (!WebMcpServer.instance) {
      WebMcpServer.instance = new WebMcpServer();
    }
    return WebMcpServer.instance;
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Attach window.mcp API
    (window as unknown as { mcp: unknown }).mcp = {
      listTools: () => this.listTools(),
      callTool: (name: string, args: Record<string, unknown>) => this.callTool(name, args)
    };

    // Listen for postMessage JSON-RPC (MCP protocol compatible)
    window.addEventListener('message', this.handlePostMessage.bind(this));

    this.isInitialized = true;
    console.log('⚡ [WebMCP] Client-side MCP Server initialized. Available tools:', WEBMCP_TOOLS.map(t => t.name));

    // Best-effort native WebMCP registration (progressive enhancement).
    // No-ops when unavailable (non-Chrome, missing origin isolation / origin trial).
    void this.registerNativeTools();
  }

  /**
   * Registers tools via the native WebMCP Imperative API (document.modelContext.registerTool).
   * This is a progressive enhancement on top of the custom window.mcp / JSON-RPC layer and is
   * only active where the browser exposes document.modelContext (Chrome origin trial + origin
   * isolation). Both paths route through the same callTool() dispatcher, so there is no behavior drift.
   * @returns true when native registration succeeded, false when it was skipped.
   */
  public async registerNativeTools(): Promise<boolean> {
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool || typeof modelContext.registerTool !== 'function') {
      return false;
    }
    for (const tool of WEBMCP_TOOLS) {
      await modelContext.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: args => this.callTool(tool.name, args as Record<string, unknown>),
        annotations: { readOnlyHint: false, untrustedContentHint: true }
      });
    }
    console.log('⚡ [WebMCP] Registered', WEBMCP_TOOLS.length, 'native tools via document.modelContext.registerTool');
    return true;
  }

  public listTools(): WebMcpTool[] {
    return WEBMCP_TOOLS;
  }

  public async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'calculate_invoice_totals': {
        const items = (args.items || []) as Array<{ quantity: number; unitPrice: number; vatRate: number }>;
        const currency = (args.currency as string) || 'EUR';
        const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
        const vat = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (i.vatRate / 100)), 0);
        const total = subtotal + vat;
        return { subtotal, vat, total, currency };
      }

      case 'validate_invoice_data': {
        const errors: string[] = [];
        const seller = (args.seller || {}) as Record<string, unknown>;
        const buyer = (args.buyer || {}) as Record<string, unknown>;
        if (!args.number) errors.push('Invoice number is missing.');
        if (!args.date) errors.push('Invoice issue date is missing.');
        if (!seller.name) errors.push('Seller company name is required.');
        if (!buyer.name) errors.push('Buyer company/client name is required.');
        if (args.buyerType === 'business' && !buyer.siret) {
          errors.push('Buyer SIREN/SIRET is required for B2B invoices.');
        }
        if (Array.isArray(args.items) && args.items.length === 0) {
          errors.push('At least one line item is required.');
        }
        return {
          valid: errors.length === 0,
          errors,
          compliantStandard: 'EN 16931 / Factur-X / CIUS-FR'
        };
      }

      case 'generate_facturx_xml': {
        const invoice = args.invoice as Invoice;
        const generateFacturXXml = await getGenerateFacturXXml();
        const xml = generateFacturXXml(invoice);
        return { xml, format: 'CrossIndustryInvoice D16B / EN 16931' };
      }

      case 'generate_facturx_invoice': {
        let invoice: Invoice;
        if (args.invoice) {
          invoice = args.invoice as Invoice;
        } else {
          invoice = {
            number: args.number as string,
            date: args.date as string,
            dueDate: (args.dueDate as string) || (args.date as string),
            currency: (args.currency as string) || 'EUR',
            buyerType: (args.buyerType as BuyerType) || 'business',
            operationType: (args.operationType as OperationType) || 'services',
            seller: args.seller as Party,
            buyer: args.buyer as Party,
            items: ((args.items as Array<Record<string, unknown>>) || []).map((item, i) => ({
              id: String(i + 1),
              description: String(item.description || ''),
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              vatRate: Number(item.vatRate) || 0,
              unitCode: item.unitCode as string | undefined
            }))
          };
        }
        const lang = (args.lang || 'fr') as 'fr' | 'en';
        const generateFacturX = await getGenerateFacturX();
        await generateFacturX(invoice, lang);
        return { success: true, message: 'Factur-X PDF generated and download triggered.' };
      }

      default:
        throw new Error(`Unknown WebMCP tool: ${name}`);
    }
  }

  private async handlePostMessage(event: MessageEvent) {
    if (!event.data || typeof event.data !== 'object') return;
    const { jsonrpc, id, method, params } = event.data;

    if (jsonrpc !== '2.0') return;

    if (method === 'tools/list' || method === 'mcp.list_tools') {
      const tools = this.listTools();
      event.source?.postMessage({
        jsonrpc: '2.0',
        id,
        result: { tools }
      }, { targetOrigin: event.origin === 'null' ? '*' : event.origin });
    } else if (method === 'tools/call' || method === 'mcp.call_tool') {
      try {
        const toolName = params?.name || params?.tool;
        const toolArgs = params?.arguments || params?.args || {};
        const result = await this.callTool(toolName, toolArgs);
        event.source?.postMessage({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(result) }] }
        }, { targetOrigin: event.origin === 'null' ? '*' : event.origin });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        event.source?.postMessage({
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message }
        }, { targetOrigin: event.origin === 'null' ? '*' : event.origin });
      }
    } else {
      event.source?.postMessage({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      }, { targetOrigin: event.origin === 'null' ? '*' : event.origin });
    }
  }
}
