import { useState } from 'react';
import { Plus, Trash2, Download, CheckCircle, Globe, Cpu, HelpCircle } from 'lucide-react';
import type { Invoice, Party, LineItem } from './types.ts';
import { generateFacturX } from './utils/pdfGenerator.ts';
import { translations, type Language } from './i18n.ts';
import { WEBMCP_TOOLS } from './utils/webMcp.ts';
import './index.css';

const initialParty: Party = {
  name: '',
  address: '',
  city: '',
  zip: '',
  country: 'FR',
  siret: '',
  vatNumber: ''
};

function App() {
  const [invoice, setInvoice] = useState<Invoice>(() => ({
    number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    seller: { ...initialParty, name: 'Ma Société', siret: '12345678900012', vatNumber: 'FR12123456789' },
    buyer: { ...initialParty },
    items: [
      { id: crypto.randomUUID(), description: 'Services de conseil', quantity: 1, unitPrice: 1000, vatRate: 20 }
    ]
  }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [showWebMcpModal, setShowWebMcpModal] = useState(false);
  const [lang, setLang] = useState<Language>('fr');
  const t = translations[lang];

  const handleSellerChange = (field: keyof Party, value: string) => {
    setInvoice(prev => ({ ...prev, seller: { ...prev.seller, [field]: value } }));
  };

  const handleBuyerChange = (field: keyof Party, value: string) => {
    setInvoice(prev => ({ ...prev, buyer: { ...prev.buyer, [field]: value } }));
  };

  const handleInvoiceChange = (field: keyof Invoice, value: string) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, vatRate: 20 }]
    }));
  };

  const removeItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const calculateSubtotal = () => invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const calculateVat = () => invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);

  const calculateTotal = () => calculateSubtotal() + calculateVat();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateFacturX(invoice, lang);
    } catch (error) {
      console.error('Failed to generate Factur-X', error);
      alert('Failed to generate Factur-X. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      {/* Form Section */}
      <div className="form-section">
        <div className="glass-card mb-4 flex-between">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1>{t.createInvoice}</h1>
              <button
                className="webmcp-badge"
                onClick={() => setShowWebMcpModal(!showWebMcpModal)}
                title={t.webMcpTooltip}
              >
                <Cpu size={14} /> {t.webMcpActive}
              </button>
            </div>
            <p className="text-secondary">{t.fillDetails}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            >
              <Globe size={18} /> {lang.toUpperCase()}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? <div className="loader"></div> : <Download size={18} />}
              {t.generateFacturX}
            </button>
          </div>
        </div>

        <div className="glass-card">
          <h2>{t.invoiceDetails}</h2>
          <div className="form-row">
            <div className="form-group">
              <label>{t.invoiceNumber}</label>
              <input type="text" value={invoice.number} onChange={e => handleInvoiceChange('number', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.date}</label>
              <input type="date" value={invoice.date} onChange={e => handleInvoiceChange('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.dueDate}</label>
              <input type="date" value={invoice.dueDate} onChange={e => handleInvoiceChange('dueDate', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-row">
          {/* Seller Details */}
          <div className="glass-card">
            <h2>{t.sellerTitle}</h2>
            <div className="form-group">
              <label>{t.name}</label>
              <input type="text" value={invoice.seller.name} onChange={e => handleSellerChange('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.address}</label>
              <input type="text" value={invoice.seller.address} onChange={e => handleSellerChange('address', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t.city}</label>
                <input type="text" value={invoice.seller.city} onChange={e => handleSellerChange('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t.zip}</label>
                <input type="text" value={invoice.seller.zip} onChange={e => handleSellerChange('zip', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>{t.siret}</label>
              <input type="text" value={invoice.seller.siret} onChange={e => handleSellerChange('siret', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.vatNumber}</label>
              <input type="text" value={invoice.seller.vatNumber} onChange={e => handleSellerChange('vatNumber', e.target.value)} />
            </div>
          </div>

          {/* Buyer Details */}
          <div className="glass-card">
            <h2>{t.buyerTitle}</h2>
            <div className="form-group">
              <label>{t.name}</label>
              <input type="text" value={invoice.buyer.name} onChange={e => handleBuyerChange('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.address}</label>
              <input type="text" value={invoice.buyer.address} onChange={e => handleBuyerChange('address', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t.city}</label>
                <input type="text" value={invoice.buyer.city} onChange={e => handleBuyerChange('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t.zip}</label>
                <input type="text" value={invoice.buyer.zip} onChange={e => handleBuyerChange('zip', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>{t.siret}</label>
              <input type="text" value={invoice.buyer.siret} onChange={e => handleBuyerChange('siret', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.vatNumber}</label>
              <input type="text" value={invoice.buyer.vatNumber} onChange={e => handleBuyerChange('vatNumber', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex-between mb-4">
            <h2>{t.lineItems}</h2>
            <button className="btn btn-secondary" onClick={addItem}>
              <Plus size={16} /> {t.addItem}
            </button>
          </div>

          <div className="line-item-header">
            <div>{t.description}</div>
            <div>{t.quantity}</div>
            <div>{t.price}</div>
            <div>{t.vatPercent}</div>
            <div style={{ width: 36 }}></div>
          </div>

          <div className="line-items-container">
            {invoice.items.map(item => (
              <div key={item.id} className="line-item">
                <input
                  type="text"
                  placeholder={t.itemDescriptionPlaceholder}
                  value={item.description}
                  onChange={e => updateItem(item.id, 'description', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                />
                <select
                  value={item.vatRate}
                  onChange={e => updateItem(item.id, 'vatRate', parseFloat(e.target.value))}
                >
                  <option value="20">20%</option>
                  <option value="10">10%</option>
                  <option value="5.5">5.5%</option>
                  <option value="2.1">2.1%</option>
                  <option value="0">0%</option>
                </select>
                <button className="btn-icon" onClick={() => removeItem(item.id)}>
                  <Trash2 size={16} className="text-danger" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* WebMCP Tool Inspector Modal */}
        {showWebMcpModal && (
          <div className="glass-card mb-4">
            <div className="flex-between mb-4">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={18} className="text-primary" /> WebMCP IA API (Browser-Native)
              </h3>
              <button className="btn-icon" onClick={() => setShowWebMcpModal(false)}>✕</button>
            </div>
            <p className="text-secondary mb-4" style={{ fontSize: '0.875rem' }}>
              e-nvoice est équipé d'un serveur WebMCP (Model Context Protocol) actif dans le navigateur. Les agents IA et extensions peuvent interagir en direct via <code>window.mcp</code> ou <code>postMessage</code> JSON-RPC.
            </p>
            <div className="webmcp-tools-list">
              {WEBMCP_TOOLS.map(tool => (
                <div key={tool.name} className="webmcp-tool-card">
                  <code>{tool.name}</code>
                  <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AEO / FAQ Section */}
        <section className="faq-section">
          <div className="glass-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <HelpCircle size={20} className="text-primary" /> {t.faqTitle}
            </h2>
            <details className="faq-card" open>
              <summary>{t.faq1Q}</summary>
              <p>{t.faq1A}</p>
            </details>
            <details className="faq-card">
              <summary>{t.faq2Q}</summary>
              <p>{t.faq2A}</p>
            </details>
            <details className="faq-card">
              <summary>{t.faq3Q}</summary>
              <p>{t.faq3A}</p>
            </details>
          </div>
        </section>

      </div>

      {/* Preview Section */}
      <div className="preview-section">
        <div className="invoice-preview">
          <div className="invoice-preview-header">
            <div className="invoice-preview-title">
              <h1>{t.invoice}</h1>
              <div className="facturx-badge">
                <CheckCircle size={16} /> {t.facturxCompliant}
              </div>
            </div>
            <div className="invoice-preview-details">
              <div><strong>{t.invoiceNumber}:</strong> {invoice.number}</div>
              <div><strong>{t.date}:</strong> {invoice.date}</div>
              <div><strong>{t.dueDate}:</strong> {invoice.dueDate}</div>
            </div>
          </div>

          <div className="invoice-parties">
            <div className="party-box">
              <h3>{t.seller}</h3>
              <div className="party-info">
                <strong>{invoice.seller.name || t.yourCompanyPlaceholder}</strong><br />
                {invoice.seller.address}<br />
                {invoice.seller.zip} {invoice.seller.city} {invoice.seller.country}<br />
                <br />
                {invoice.seller.siret && <div>{t.siret}: {invoice.seller.siret}</div>}
                {invoice.seller.vatNumber && <div>{t.vatNumber}: {invoice.seller.vatNumber}</div>}
              </div>
            </div>
            <div className="party-box">
              <h3>{t.buyer}</h3>
              <div className="party-info">
                <strong>{invoice.buyer.name || t.clientNamePlaceholder}</strong><br />
                {invoice.buyer.address}<br />
                {invoice.buyer.zip} {invoice.buyer.city} {invoice.buyer.country}<br />
                <br />
                {invoice.buyer.siret && <div>{t.siret}: {invoice.buyer.siret}</div>}
                {invoice.buyer.vatNumber && <div>{t.vatNumber}: {invoice.buyer.vatNumber}</div>}
              </div>
            </div>
          </div>

          <table className="invoice-table-preview">
            <thead>
              <tr>
                <th>{t.description}</th>
                <th className="text-right">{t.qty}</th>
                <th className="text-right">{t.unitPrice}</th>
                <th className="text-right">{t.vat}</th>
                <th className="text-right">{t.totalExclVat}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{item.description || '-'}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.unitPrice.toFixed(2)} €</td>
                  <td className="text-right">{item.vatRate}%</td>
                  <td className="text-right">{(item.quantity * item.unitPrice).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="total-row">
              <span>{t.subtotalExclVat}</span>
              <span>{calculateSubtotal().toFixed(2)} €</span>
            </div>
            <div className="total-row">
              <span>{t.vatAmount}</span>
              <span>{calculateVat().toFixed(2)} €</span>
            </div>
            <div className="total-row grand-total">
              <span>{t.totalAmountDue}</span>
              <span>{calculateTotal().toFixed(2)} €</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
