import type { Invoice } from '../types.ts';
import { generateFacturXXml } from './facturx.ts';
import { generateFacturX } from './pdfGenerator.ts';

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
        sellerName: { type: 'string' },
        buyerName: { type: 'string' },
        itemCount: { type: 'number' }
      },
      required: ['number', 'date', 'sellerName', 'buyerName']
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
        invoice: { type: 'object' },
        lang: { type: 'string', enum: ['fr', 'en'] }
      },
      required: ['invoice']
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
  }

  public listTools(): WebMcpTool[] {
    return WEBMCP_TOOLS;
  }

  public async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'calculate_invoice_totals': {
        const items = (args.items || []) as Array<{ quantity: number; unitPrice: number; vatRate: number }>;
        const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
        const vat = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (i.vatRate / 100)), 0);
        const total = subtotal + vat;
        return { subtotal, vat, total, currency: 'EUR' };
      }

      case 'validate_invoice_data': {
        const errors: string[] = [];
        if (!args.number) errors.push('Invoice number is missing.');
        if (!args.date) errors.push('Invoice issue date is missing.');
        if (!args.sellerName) errors.push('Seller company name is required.');
        if (!args.buyerName) errors.push('Buyer company/client name is required.');
        if (typeof args.itemCount === 'number' && args.itemCount <= 0) {
          errors.push('At least one line item is required.');
        }
        return {
          valid: errors.length === 0,
          errors,
          compliantStandard: 'EN 16931 / Factur-X'
        };
      }

      case 'generate_facturx_xml': {
        const invoice = args.invoice as Invoice;
        const xml = generateFacturXXml(invoice);
        return { xml, format: 'CrossIndustryInvoice D16B / EN 16931' };
      }

      case 'generate_facturx_invoice': {
        const invoice = args.invoice as Invoice;
        const lang = (args.lang || 'fr') as 'fr' | 'en';
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
    }
  }
}
