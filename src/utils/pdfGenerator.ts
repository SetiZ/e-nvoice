import { jsPDF } from 'jspdf';
import type { Invoice } from '../types.ts';
import { generateFacturXXml } from './facturx.ts';
import { translations, type Language } from '../i18n.ts';

export async function generateFacturX(invoice: Invoice, lang: Language = 'en') {
  const t = translations[lang];
  const currency = invoice.currency || 'EUR';
  const currencySymbol = currency === 'EUR' ? 'EUR' : currency;

  const calculateSubtotal = () => invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const calculateVat = () => invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);
  const calculateTotal = () => calculateSubtotal() + calculateVat();

  // 1. Generate PDF
  const doc = new jsPDF();
  
  // Styling constants
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(t.invoice, margin, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${t.invoiceNumber}: ${invoice.number}`, 140, yPos - 5);
  doc.text(`${t.date}: ${invoice.date}`, 140, yPos);
  doc.text(`${t.dueDate}: ${invoice.dueDate}`, 140, yPos + 5);

  yPos += 30;

  // Parties
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t.seller, margin, yPos);
  doc.text(t.buyer, 120, yPos);
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Seller details
  const sellerLines = [
    invoice.seller.name || t.yourCompanyPlaceholder,
    invoice.seller.address,
    `${invoice.seller.zip} ${invoice.seller.city} ${invoice.seller.country || 'FR'}`,
    invoice.seller.siret ? `${t.siret}: ${invoice.seller.siret}` : '',
    invoice.seller.vatNumber ? `${t.vatNumber}: ${invoice.seller.vatNumber}` : ''
  ].filter(Boolean);

  // Buyer details
  const isIndividual = invoice.buyerType === 'individual';
  const buyerLines = [
    invoice.buyer.name || t.clientNamePlaceholder,
    invoice.buyer.address,
    `${invoice.buyer.zip} ${invoice.buyer.city} ${invoice.buyer.country || 'FR'}`,
    !isIndividual && invoice.buyer.siret ? `${t.siret}: ${invoice.buyer.siret}` : '',
    !isIndividual && invoice.buyer.vatNumber ? `${t.vatNumber}: ${invoice.buyer.vatNumber}` : '',
    !isIndividual && !invoice.buyer.vatNumber && invoice.buyer.taxId ? `${t.taxId}: ${invoice.buyer.taxId}` : ''
  ].filter(Boolean);

  const maxLines = Math.max(sellerLines.length, buyerLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (sellerLines[i]) doc.text(sellerLines[i], margin, yPos + (i * 5));
    if (buyerLines[i]) doc.text(buyerLines[i], 120, yPos + (i * 5));
  }

  yPos += (maxLines * 5) + 15;

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(t.description, margin + 2, yPos);
  doc.text(t.qty, 110, yPos, { align: 'right' });
  doc.text(t.price, 135, yPos, { align: 'right' });
  doc.text(t.vat, 155, yPos, { align: 'right' });
  doc.text(t.totalExclVat, 185, yPos, { align: 'right' });

  yPos += 10;
  doc.setFont('helvetica', 'normal');

  // Table Items
  invoice.items.forEach(item => {
    const total = (item.quantity * item.unitPrice).toFixed(2);
    doc.text(item.description || '-', margin + 2, yPos);
    doc.text(item.quantity.toString(), 110, yPos, { align: 'right' });
    doc.text(`${item.unitPrice.toFixed(2)}`, 135, yPos, { align: 'right' });
    doc.text(`${item.vatRate}%`, 155, yPos, { align: 'right' });
    doc.text(total, 185, yPos, { align: 'right' });
    yPos += 8;
  });

  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(100, yPos, 190, yPos);
  yPos += 7;

  // Totals
  doc.text(`${t.subtotalExclVat}:`, 150, yPos, { align: 'right' });
  doc.text(`${calculateSubtotal().toFixed(2)} ${currencySymbol}`, 185, yPos, { align: 'right' });
  yPos += 6;
  
  doc.text(`${t.vatAmount}:`, 150, yPos, { align: 'right' });
  doc.text(`${calculateVat().toFixed(2)} ${currencySymbol}`, 185, yPos, { align: 'right' });
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${t.totalAmountDue}:`, 150, yPos, { align: 'right' });
  doc.text(`${calculateTotal().toFixed(2)} ${currencySymbol}`, 185, yPos, { align: 'right' });

  yPos += 16;

  // Bank & Payment Details
  if (invoice.seller.iban || invoice.seller.bic || invoice.seller.bankName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(t.bankDetails, margin, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (invoice.seller.bankName) {
      doc.text(`${t.bankName}: ${invoice.seller.bankName}`, margin, yPos);
      yPos += 4.5;
    }
    if (invoice.seller.iban) {
      doc.text(`${t.iban}: ${invoice.seller.iban}`, margin, yPos);
      yPos += 4.5;
    }
    if (invoice.seller.bic) {
      doc.text(`${t.bic}: ${invoice.seller.bic}`, margin, yPos);
      yPos += 4.5;
    }
    yPos += 4;
  }

  // Legal Mentions & Conditions
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.setFont('helvetica', 'normal');

  const legalNotes: string[] = [];
  if (invoice.paymentTermsText) legalNotes.push(`${t.paymentTerms}: ${invoice.paymentTermsText}`);
  if (invoice.buyerType === 'business') {
    if (invoice.latePenaltiesText) legalNotes.push(`${t.latePenalties}: ${invoice.latePenaltiesText}`);
    if (invoice.recoveryIndemnityText) legalNotes.push(invoice.recoveryIndemnityText);
  }
  if (invoice.earlyDiscountText) legalNotes.push(invoice.earlyDiscountText);
  if (invoice.vatOnDebits) legalNotes.push(t.vatOnDebits);
  if (invoice.vatExemptionReason) legalNotes.push(invoice.vatExemptionReason);

  const startLegalY = Math.max(yPos + 4, 255);
  let currentLegalY = startLegalY;
  legalNotes.forEach(note => {
    if (currentLegalY < 282) {
      const splitLines = doc.splitTextToSize(note, 170);
      doc.text(splitLines, margin, currentLegalY);
      currentLegalY += (splitLines.length * 3.5);
    }
  });

  // Factur-X standard note
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(40, 140, 90);
  doc.text(t.facturxNote, margin, 287);

  // 2. Generate XML
  const xmlString = generateFacturXXml(invoice);
  const encoder = new TextEncoder();
  const xmlBytes = encoder.encode(xmlString);

  // 3. Embed XML into PDF using pdf-lib
  const pdfBytes = doc.output('arraybuffer');
  
  // Dynamic import of pdf-lib to avoid breaking the Vite build
  const { PDFDocument, PDFName, AFRelationship } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.load(pdfBytes);

  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'text/xml',
    description: 'Factur-X invoice data',
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Data,
  });

  // 4. Inject strict PDF/A-3 and Factur-X XMP Metadata
  const xmpString = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Factur-X Invoice</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>e-nvoice generator</rdf:li></rdf:Seq></dc:creator>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas>
        <rdf:Bag>
          <rdf:li rdf:parseType="Resource">
            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
            <pdfaSchema:prefix>fx</pdfaSchema:prefix>
            <pdfaProperty:property>
              <rdf:Bag>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:description>The name of the embedded XML document</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:description>The type of the hybrid document in accordance with Factur-X standard</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:description>The version of the Factur-X XML schema</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:description>The conformance level of the Factur-X XML data</pdfaProperty:description>
                </rdf:li>
              </rdf:Bag>
            </pdfaProperty:property>
          </rdf:li>
        </rdf:Bag>
      </pdfaExtension:schemas>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const metadataStream = pdfDoc.context.flateStream(xmpString, {
    Type: 'Metadata',
    Subtype: 'XML',
  });
  
  const metadataStreamRef = pdfDoc.context.register(metadataStream);
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataStreamRef);

  // Save the hybrid PDF
  const modifiedPdfBytes = await pdfDoc.save();
  const modifiedPdfBlob = new Blob([modifiedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });

  // 5. Trigger Download
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  downloadFile(modifiedPdfBlob, `${invoice.number}_factur-x.pdf`);
}
