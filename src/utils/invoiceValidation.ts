export interface ValidateInvoiceResult {
  valid: boolean;
  errors: string[];
  compliantStandard: string;
}

export function validateInvoiceData(args: Record<string, unknown>): ValidateInvoiceResult {
  const errors: string[] = [];
  const seller = (args.seller || {}) as Record<string, unknown>;
  const buyer = (args.buyer || {}) as Record<string, unknown>;
  if (!args.number) errors.push('Invoice number is missing.');
  if (!args.date) errors.push('Invoice issue date is missing.');
  if (!seller.name) errors.push('Seller company name is required.');
  if (!buyer.name) errors.push('Buyer company/client name is required.');
  if (args.buyerType === 'business' && !buyer.siret && !buyer.taxId) {
    errors.push('Buyer SIREN/SIRET (or tax ID for foreign buyers) is required for B2B invoices.');
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
