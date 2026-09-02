import type { LineItem } from '../types.ts';

export const calculateSubtotal = (items: LineItem[]) =>
  items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

export const calculateVat = (items: LineItem[]) =>
  items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);

export const calculateTotal = (items: LineItem[]) => calculateSubtotal(items) + calculateVat(items);
