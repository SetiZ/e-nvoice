import { validateInvoiceData } from '../src/utils/invoiceValidation.ts';
import assert from 'node:assert';

const base = {
  number: 'INV-1',
  date: '2026-08-31',
  seller: { name: 'Acme SAS', siret: '123456789' },
  buyer: { name: 'Client SARL' },
  buyerType: 'business',
  items: [{ quantity: 1, unitPrice: 10, vatRate: 20 }]
};

// French B2B with SIRET -> valid
assert.equal(
  validateInvoiceData({ ...base, buyer: { name: 'Client SARL', siret: '987654321' } }).valid,
  true,
  'FR B2B with siret should be valid'
);

// Foreign B2B with taxId, no siret -> valid (the bug fix)
assert.equal(
  validateInvoiceData({ ...base, buyer: { name: 'Ltd UK', taxId: 'GB123' } }).valid,
  true,
  'foreign B2B with taxId should be valid'
);

// B2B with neither siret nor taxId -> invalid
const missing = validateInvoiceData({ ...base, buyer: { name: 'Mystery Ltd' } });
assert.equal(missing.valid, false, 'B2B with no siret/taxId should be invalid');
assert.ok(missing.errors.some(e => e.includes('tax ID')), 'error should mention tax ID option');

// B2C with no siret -> valid (individual doesn't need siret)
assert.equal(validateInvoiceData({ ...base, buyerType: 'individual' }).valid, true, 'B2C should be valid without siret');

console.log('validateInvoiceData self-check passed (5/5)');
