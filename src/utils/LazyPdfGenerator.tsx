import { generateFacturX } from './pdfGenerator';
import type { Invoice } from '../types';

export const lazyGenerateFacturX = async (invoice: Invoice, lang: 'fr' | 'en') => {
  return await generateFacturX(invoice, lang);
};
