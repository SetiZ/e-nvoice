import type { Invoice } from '../types.ts';

export function generateFacturXXml(invoice: Invoice): string {
  const currency = invoice.currency || 'EUR';
  const calculateSubtotal = () => invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const calculateVat = () => invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);
  const calculateTotal = () => calculateSubtotal() + calculateVat();

  const formattedDate = invoice.date.replace(/-/g, '');
  const formattedDueDate = invoice.dueDate.replace(/-/g, '');

  const termsParts = [
    invoice.paymentTermsText,
    invoice.buyerType === 'business' ? invoice.latePenaltiesText : '',
    invoice.buyerType === 'business' ? invoice.recoveryIndemnityText : '',
    invoice.earlyDiscountText,
    invoice.vatOnDebits ? 'Option pour le paiement de la taxe d\'après les débits' : '',
    invoice.vatExemptionReason ? `Exonération TVA : ${invoice.vatExemptionReason}` : ''
  ].filter(Boolean);

  const termsDescription = termsParts.join(' | ');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931:1p0</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${invoice.number}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formattedDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${invoice.seller.name}</ram:Name>
        ${invoice.seller.siret ? `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${invoice.seller.siret.replace(/\s+/g, '')}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ''}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${invoice.seller.zip}</ram:PostcodeCode>
          <ram:LineOne>${invoice.seller.address}</ram:LineOne>
          <ram:CityName>${invoice.seller.city}</ram:CityName>
          <ram:CountryID>${invoice.seller.country || 'FR'}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${invoice.seller.vatNumber ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${invoice.seller.vatNumber.replace(/\s+/g, '')}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${invoice.buyer.name}</ram:Name>
        ${invoice.buyerType === 'business' && invoice.buyer.siret ? `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${invoice.buyer.siret.replace(/\s+/g, '')}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ''}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${invoice.buyer.zip}</ram:PostcodeCode>
          <ram:LineOne>${invoice.buyer.address}</ram:LineOne>
          <ram:CityName>${invoice.buyer.city}</ram:CityName>
          <ram:CountryID>${invoice.buyer.country || 'FR'}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${invoice.buyerType === 'business' && invoice.buyer.vatNumber ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${invoice.buyer.vatNumber.replace(/\s+/g, '')}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
        ${invoice.buyerType === 'business' && !invoice.buyer.vatNumber && invoice.buyer.taxId ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">${invoice.buyer.taxId.replace(/\s+/g, '')}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${formattedDate}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        ${invoice.seller.iban ? `
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${invoice.seller.iban.replace(/\s+/g, '')}</ram:IBANID>
          <ram:AccountName>${invoice.seller.name}</ram:AccountName>
        </ram:PayeePartyCreditorFinancialAccount>` : ''}
        ${invoice.seller.bic ? `
        <ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${invoice.seller.bic.replace(/\s+/g, '')}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}
      </ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:SpecifiedTradePaymentTerms>
        ${termsDescription ? `<ram:Description>${termsDescription}</ram:Description>` : ''}
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formattedDueDate}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${calculateSubtotal().toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${calculateSubtotal().toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currency}">${calculateVat().toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${calculateTotal().toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${calculateTotal().toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
    ${invoice.items.map((item, index) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${item.description || 'Article'}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${item.unitPrice.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${item.unitCode || 'C62'}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${item.vatRate === 0 ? 'E' : 'S'}</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.vatRate}</ram:RateApplicablePercent>
          ${item.vatRate === 0 && invoice.vatExemptionReason ? `<ram:ExemptionReason>${invoice.vatExemptionReason}</ram:ExemptionReason>` : ''}
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${(item.quantity * item.unitPrice).toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('')}
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  return xml;
}
