import { jsPDF } from 'jspdf';
import type { Invoice } from '../types.ts';
import { generateFacturXXml } from './facturx.ts';
import { translations, type Language } from '../i18n.ts';

export async function generateFacturX(invoice: Invoice, lang: Language = 'en') {
  const t = translations[lang];
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
    `${invoice.seller.zip} ${invoice.seller.city} ${invoice.seller.country}`,
    invoice.seller.siret ? `${t.siret}: ${invoice.seller.siret}` : '',
    invoice.seller.vatNumber ? `${t.vatNumber}: ${invoice.seller.vatNumber}` : ''
  ].filter(Boolean);

  // Buyer details
  const buyerLines = [
    invoice.buyer.name || t.clientNamePlaceholder,
    invoice.buyer.address,
    `${invoice.buyer.zip} ${invoice.buyer.city} ${invoice.buyer.country}`,
    invoice.buyer.siret ? `${t.siret}: ${invoice.buyer.siret}` : '',
    invoice.buyer.vatNumber ? `${t.vatNumber}: ${invoice.buyer.vatNumber}` : ''
  ].filter(Boolean);

  const maxLines = Math.max(sellerLines.length, buyerLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (sellerLines[i]) doc.text(sellerLines[i], margin, yPos + (i * 5));
    if (buyerLines[i]) doc.text(buyerLines[i], 120, yPos + (i * 5));
  }

  yPos += (maxLines * 5) + 20;

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

  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(100, yPos, 190, yPos);
  yPos += 8;

  // Totals
  doc.text(`${t.subtotalExclVat}:`, 150, yPos, { align: 'right' });
  doc.text(`${calculateSubtotal().toFixed(2)} EUR`, 185, yPos, { align: 'right' });
  yPos += 6;
  
  doc.text(`${t.vatAmount}:`, 150, yPos, { align: 'right' });
  doc.text(`${calculateVat().toFixed(2)} EUR`, 185, yPos, { align: 'right' });
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${t.totalAmountDue}:`, 150, yPos, { align: 'right' });
  doc.text(`${calculateTotal().toFixed(2)} EUR`, 185, yPos, { align: 'right' });

  // Add Factur-X note
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(50, 150, 100);
  doc.text(t.facturxNote, margin, 280);

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
  const xmpString = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
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
            <pdfaSchema:property>
              <rdf:Seq>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>name of the embedded XML invoice file</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>DocumentType</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>INVOICE</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>Version</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The actual version of the ZUGFeRD data</pdfaProperty:description>
                </rdf:li>
                <rdf:li rdf:parseType="Resource">
                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>
                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                  <pdfaProperty:category>external</pdfaProperty:category>
                  <pdfaProperty:description>The conformance level of the ZUGFeRD data</pdfaProperty:description>
                </rdf:li>
              </rdf:Seq>
            </pdfaSchema:property>
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
  const modifiedPdfBlob = new Blob([modifiedPdfBytes as any], { type: 'application/pdf' });

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
