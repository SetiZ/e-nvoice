export interface Party {
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  siret: string;
  vatNumber: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface Invoice {
  number: string;
  date: string;
  dueDate: string;
  seller: Party;
  buyer: Party;
  items: LineItem[];
}
