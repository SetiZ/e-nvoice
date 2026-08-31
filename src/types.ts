export interface Party {
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  siret?: string;
  vatNumber?: string;
  taxId?: string; // For foreign buyers without French SIRET or EU VAT
  iban?: string;
  bic?: string;
  bankName?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  unitCode?: string; // C62 (Unit), HUR (Hour), DAY (Day), etc.
}

export type BuyerType = 'business' | 'individual';
export type OperationType = 'services' | 'goods' | 'mixed';

export interface Invoice {
  number: string;
  date: string;
  dueDate: string;
  currency: string; // EUR, USD, GBP, CHF
  buyerType: BuyerType; // B2B vs B2C (particulier)
  operationType: OperationType; // Prestation de services / Vente de biens / Mixte
  vatOnDebits?: boolean; // Option pour le paiement de la taxe d'après les débits
  paymentTermsText?: string; // E.g., 'Paiement à 30 jours'
  latePenaltiesText?: string; // E.g., 'Taux des pénalités : 3 fois le taux légal'
  recoveryIndemnityText?: string; // E.g., 'Indemnité forfaitaire de recouvrement : 40 €'
  earlyDiscountText?: string; // E.g., 'Escompte pour paiement anticipé : néant'
  vatExemptionReason?: string; // E.g., 'TVA non applicable, art. 293 B du CGI' or 'Autoliquidation'
  seller: Party;
  buyer: Party;
  items: LineItem[];
}
