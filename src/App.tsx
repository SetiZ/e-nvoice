import { useState } from 'react';
import { Plus, Trash2, Download, CheckCircle, Globe, Cpu, HelpCircle, Building2, User, Landmark, ShieldCheck } from 'lucide-react';
import type { Invoice, Party, LineItem } from './types.ts';
import { calculateSubtotal, calculateVat, calculateTotal } from './utils/calc.ts';
import { translations, type Language } from './i18n.ts';
import { WEBMCP_TOOLS } from './utils/webMcp.ts';
import './index.css';

// Lazy load PDF generator - libraries will be loaded only on demand
const loadPdfGenerator = async () => {
  const { generateFacturX } = await import('./utils/pdfGenerator.ts');
  return generateFacturX;
};

const initialParty: Party = {
  name: '',
  address: '',
  city: '',
  zip: '',
  country: 'FR',
  siret: '',
  vatNumber: '',
  taxId: '',
  iban: '',
  bic: '',
  bankName: ''
};

function App() {
  const [invoice, setInvoice] = useState<Invoice>(() => ({
    number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'EUR',
    buyerType: 'business',
    vatOnDebits: false,
    paymentTermsText: 'Paiement à 30 jours',
    latePenaltiesText: '3 fois le taux d\'intérêt légal',
    recoveryIndemnityText: 'Indemnité forfaitaire pour frais de recouvrement en cas de retard : 40 € (Art. D. 441-5 Code de commerce)',
    earlyDiscountText: 'Escompte pour paiement anticipé : néant',
    vatExemptionReason: '',
    seller: {
      ...initialParty,
      name: 'Ma Société',
      siret: '12345678900012',
      vatNumber: 'FR12123456789',
      iban: 'FR7630006000011234567890189',
      bic: 'BNPAFRPPXXX',
      bankName: 'BNP Paribas',
      country: 'FR'
    },
    buyer: { ...initialParty },
    items: [
      { id: crypto.randomUUID(), description: 'Services de conseil', quantity: 1, unitPrice: 1000, vatRate: 20, unitCode: 'C62' }
    ]
  }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [showWebMcpModal, setShowWebMcpModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showChorusProModal, setShowChorusProModal] = useState(false);
  const [activeWebMcpTab, setActiveWebMcpTab] = useState<'tools' | 'connect'>('tools');
  const [activePlatform, setActivePlatform] = useState<'universal' | 'postmessage' | 'chrome'>('universal');
  const [lang, setLang] = useState<Language>('fr');
  const t = translations[lang];

  const currSymbol = (() => {
    switch (invoice.currency || 'EUR') {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'CHF': return 'CHF';
      default: return invoice.currency || 'EUR';
    }
  })();

  const handleSellerChange = (field: keyof Party, value: string) => {
    setInvoice(prev => ({ ...prev, seller: { ...prev.seller, [field]: value } }));
  };

  const handleBuyerChange = (field: keyof Party, value: string) => {
    setInvoice(prev => ({ ...prev, buyer: { ...prev.buyer, [field]: value } }));
  };

  const handleInvoiceChange = <K extends keyof Invoice>(field: K, value: Invoice[K]) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, vatRate: 20, unitCode: 'C62' }]
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

  const hasZeroVat = invoice.items.some(item => item.vatRate === 0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Lazy load PDF libraries only when needed
      const generateFacturX = await loadPdfGenerator();
      await generateFacturX(invoice, lang);
    } catch (error) {
      console.error('Failed to generate Factur-X', error);
      alert('Failed to generate Factur-X. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <main className="app-container">
        {/* Form Section */}
        <div className="form-section">
        <div className="glass-card mb-4 header-card">
          <div className="header-title-area">
            <h1>{t.createInvoice}</h1>
            <p className="text-secondary">{t.fillDetails}</p>
          </div>
          <div className="header-actions">
            <div className="header-group tools-group" role="group" aria-label="Tools and Guides">
              <button
                className="btn btn-secondary header-tool-btn"
                onClick={() => setShowChorusProModal(!showChorusProModal)}
                title={t.chorusProGuide}
                aria-label={t.chorusProGuide}
              >
                <Landmark size={17} className="tool-icon-emerald" />
                <span className="btn-label">{t.chorusPro}</span>
              </button>
              <button
                className="btn btn-secondary header-tool-btn"
                onClick={() => setShowFaqModal(!showFaqModal)}
                title={lang === 'fr' ? 'Foire Aux Questions' : 'Frequently Asked Questions'}
                aria-label={lang === 'fr' ? 'Foire Aux Questions' : 'Frequently Asked Questions'}
              >
                <HelpCircle size={17} className="tool-icon-amber" />
                <span className="btn-label">FAQ</span>
              </button>
              <button
                className="btn btn-secondary header-tool-btn"
                onClick={() => setShowWebMcpModal(!showWebMcpModal)}
                title={t.webMcpTooltip}
                aria-label={t.webMcpTooltip}
              >
                <Cpu size={17} className="tool-icon-blue" />
                <span className="btn-label">WebMCP</span>
              </button>
            </div>

            <div className="header-group cta-group" role="group" aria-label="Actions">
              <button
                className="btn btn-secondary lang-toggle-btn"
                onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
                aria-label={lang === 'fr' ? 'Changer la langue en anglais' : 'Switch language to French'}
                title={lang === 'fr' ? 'Passer en anglais' : 'Switch to French'}
              >
                <Globe size={17} />
                <span>{lang.toUpperCase()}</span>
              </button>
              <button
                className="btn btn-primary generate-cta-btn"
                onClick={handleGenerate}
                disabled={isGenerating}
                aria-label={isGenerating ? t.generating : t.generateFacturX}
              >
                {isGenerating ? <div className="loader"></div> : <Download size={18} />}
                <span>{t.generateFacturX}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Details Card */}
        <div className="glass-card">
          <h2>{t.invoiceDetails}</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invoice-number">{t.invoiceNumber}</label>
              <input id="invoice-number" type="text" value={invoice.number} onChange={e => handleInvoiceChange('number', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="invoice-date">{t.date}</label>
              <input id="invoice-date" type="date" value={invoice.date} onChange={e => handleInvoiceChange('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="invoice-due-date">{t.dueDate}</label>
              <input id="invoice-due-date" type="date" value={invoice.dueDate} onChange={e => handleInvoiceChange('dueDate', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invoice-currency">{t.currency}</label>
              <select
                id="invoice-currency"
                value={invoice.currency || 'EUR'}
                onChange={e => handleInvoiceChange('currency', e.target.value)}
              >
                <option value="EUR">EUR (€) - Euro</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CHF">CHF - Swiss Franc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seller & Buyer Cards */}
        <div className="form-row">
          {/* Seller Details */}
          <div className="glass-card">
            <h2>{t.sellerTitle}</h2>
            <div className="form-group">
              <label htmlFor="seller-name">{t.name}</label>
              <input id="seller-name" type="text" value={invoice.seller.name} onChange={e => handleSellerChange('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="seller-address">{t.address}</label>
              <input id="seller-address" type="text" value={invoice.seller.address} onChange={e => handleSellerChange('address', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="seller-city">{t.city}</label>
              <input id="seller-city" type="text" value={invoice.seller.city} onChange={e => handleSellerChange('city', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="seller-zip">{t.zip}</label>
                <input id="seller-zip" type="text" value={invoice.seller.zip} onChange={e => handleSellerChange('zip', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="seller-country">{t.country}</label>
                <input id="seller-country" type="text" value={invoice.seller.country || 'FR'} onChange={e => handleSellerChange('country', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="seller-siret">{t.siret}</label>
              <input id="seller-siret" type="text" value={invoice.seller.siret || ''} onChange={e => handleSellerChange('siret', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="seller-vat">{t.vatNumber}</label>
              <input id="seller-vat" type="text" value={invoice.seller.vatNumber || ''} onChange={e => handleSellerChange('vatNumber', e.target.value)} />
            </div>

            {/* Bank Details */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#93c5fd', marginBottom: '0.75rem' }}>
                <Landmark size={16} /> {t.bankDetails}
              </h3>
              <div className="form-group">
                <label htmlFor="seller-bank">{t.bankName}</label>
                <input id="seller-bank" type="text" value={invoice.seller.bankName || ''} onChange={e => handleSellerChange('bankName', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="seller-iban">{t.iban}</label>
                <input id="seller-iban" type="text" value={invoice.seller.iban || ''} onChange={e => handleSellerChange('iban', e.target.value)} placeholder="FR76 3000 ..." />
              </div>
              <div className="form-group">
                <label htmlFor="seller-bic">{t.bic}</label>
                <input id="seller-bic" type="text" value={invoice.seller.bic || ''} onChange={e => handleSellerChange('bic', e.target.value)} placeholder="BNPAFRPPXXX" />
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="glass-card">
            <h2>{t.buyerTitle}</h2>
            <div className="segmented-control mb-4" role="group" aria-label="Buyer Type">
              <button
                type="button"
                className={invoice.buyerType === 'business' ? 'active' : ''}
                onClick={() => handleInvoiceChange('buyerType', 'business')}
              >
                <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} /> {t.b2b}
              </button>
              <button
                type="button"
                className={invoice.buyerType === 'individual' ? 'active' : ''}
                onClick={() => handleInvoiceChange('buyerType', 'individual')}
              >
                <User size={14} style={{ display: 'inline', marginRight: 4 }} /> {t.b2c}
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="buyer-name">{t.name}</label>
              <input id="buyer-name" type="text" value={invoice.buyer.name} onChange={e => handleBuyerChange('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="buyer-address">{t.address}</label>
              <input id="buyer-address" type="text" value={invoice.buyer.address} onChange={e => handleBuyerChange('address', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="buyer-city">{t.city}</label>
              <input id="buyer-city" type="text" value={invoice.buyer.city} onChange={e => handleBuyerChange('city', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="buyer-zip">{t.zip}</label>
                <input id="buyer-zip" type="text" value={invoice.buyer.zip} onChange={e => handleBuyerChange('zip', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="buyer-country">{t.country}</label>
                <input id="buyer-country" type="text" value={invoice.buyer.country || 'FR'} onChange={e => handleBuyerChange('country', e.target.value)} placeholder="FR, DE, US, GB..." />
              </div>
            </div>

            {/* B2B specific fields */}
            {invoice.buyerType === 'business' && (
              <>
                <div className="form-group">
                  <label htmlFor="buyer-siret">{t.siret}</label>
                  <input id="buyer-siret" type="text" value={invoice.buyer.siret || ''} onChange={e => handleBuyerChange('siret', e.target.value)} placeholder="French 14-digit SIRET" />
                </div>
                <div className="form-group">
                  <label htmlFor="buyer-vat">{t.vatNumber}</label>
                  <input id="buyer-vat" type="text" value={invoice.buyer.vatNumber || ''} onChange={e => handleBuyerChange('vatNumber', e.target.value)} placeholder="Intra-community VAT" />
                </div>
                {invoice.buyer.country && invoice.buyer.country !== 'FR' && (
                  <div className="form-group">
                    <label htmlFor="buyer-taxid">{t.taxId}</label>
                    <input id="buyer-taxid" type="text" value={invoice.buyer.taxId || ''} onChange={e => handleBuyerChange('taxId', e.target.value)} placeholder="Foreign Tax ID (e.g. US EIN, UK VAT)" />
                  </div>
                )}
              </>
            )}

            {/* Chorus Pro / B2G optional fields */}
            {invoice.buyerType === 'business' && (
              <details className="chorus-pro-details" style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', color: '#34d399', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Landmark size={16} /> {t.chorusProSection}
                </summary>
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label htmlFor="purchase-order">{t.purchaseOrder}</label>
                    <input id="purchase-order" type="text" value={invoice.purchaseOrder || ''} onChange={e => handleInvoiceChange('purchaseOrder', e.target.value)} placeholder={t.purchaseOrderPlaceholder} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="service-code">{t.serviceCode}</label>
                    <input id="service-code" type="text" value={invoice.serviceCode || ''} onChange={e => handleInvoiceChange('serviceCode', e.target.value)} placeholder={t.serviceCodePlaceholder} />
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="glass-card">
          <div className="flex-between mb-4">
            <h2 id="line-items-heading">{t.lineItems}</h2>
            <button className="btn btn-secondary" onClick={addItem} aria-label={t.addItem}>
              <Plus size={16} /> {t.addItem}
            </button>
          </div>

          <div className="line-item-header">
            <div>{t.description}</div>
            <div>{t.quantity}</div>
            <div>{t.price} ({currSymbol})</div>
            <div>{t.vatPercent}</div>
            <div style={{ width: 36 }}></div>
          </div>

          <div className="line-items-container" role="list" aria-label="Invoice line items">
            {invoice.items.map(item => (
              <div key={item.id} className="line-item" role="listitem">
                <div className="line-item-field line-item-desc">
                  <label htmlFor={`item-desc-${item.id}`} className="field-label-mobile">{t.description}</label>
                  <input
                    id={`item-desc-${item.id}`}
                    type="text"
                    placeholder={t.itemDescriptionPlaceholder}
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="line-item-field line-item-qty">
                  <label htmlFor={`item-qty-${item.id}`} className="field-label-mobile">{t.quantity}</label>
                  <input
                    id={`item-qty-${item.id}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="line-item-field line-item-price">
                  <label htmlFor={`item-price-${item.id}`} className="field-label-mobile">{t.price} ({currSymbol})</label>
                  <input
                    id={`item-price-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="line-item-field line-item-vat">
                  <label htmlFor={`item-vat-${item.id}`} className="field-label-mobile">{t.vatPercent}</label>
                  <select
                    id={`item-vat-${item.id}`}
                    value={item.vatRate}
                    onChange={e => updateItem(item.id, 'vatRate', parseFloat(e.target.value))}
                  >
                    <option value="20">20%</option>
                    <option value="10">10%</option>
                    <option value="5.5">5.5%</option>
                    <option value="2.1">2.1%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
                <div className="line-item-actions">
                  <button className="btn-icon btn-delete-item" onClick={() => removeItem(item.id)} aria-label={t.deleteItem}>
                    <Trash2 size={16} className="text-danger" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Mentions & Payment Conditions Card */}
        <div className="glass-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} className="text-primary" /> {t.legalMentions}
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="payment-terms">{t.paymentTerms}</label>
              <input
                id="payment-terms"
                type="text"
                value={invoice.paymentTermsText || ''}
                onChange={e => handleInvoiceChange('paymentTermsText', e.target.value)}
                placeholder={t.paymentTermsPlaceholder}
              />
            </div>
            <div className="form-group">
              <label htmlFor="early-discount">{t.earlyDiscount}</label>
              <input
                id="early-discount"
                type="text"
                value={invoice.earlyDiscountText || ''}
                onChange={e => handleInvoiceChange('earlyDiscountText', e.target.value)}
              />
            </div>
          </div>

          {invoice.buyerType === 'business' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="late-penalties">{t.latePenalties}</label>
                <input
                  id="late-penalties"
                  type="text"
                  value={invoice.latePenaltiesText || ''}
                  onChange={e => handleInvoiceChange('latePenaltiesText', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="recovery-indemnity">{t.recoveryIndemnity}</label>
                <input
                  id="recovery-indemnity"
                  type="text"
                  value={invoice.recoveryIndemnityText || ''}
                  onChange={e => handleInvoiceChange('recoveryIndemnityText', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* VAT on debits & Exemption mentions */}
          <div className="form-group">
            <div className="checkbox-group">
              <input
                id="vat-on-debits"
                type="checkbox"
                checked={!!invoice.vatOnDebits}
                onChange={e => handleInvoiceChange('vatOnDebits', e.target.checked)}
              />
              <label htmlFor="vat-on-debits">{t.vatOnDebits}</label>
            </div>
          </div>

          {(hasZeroVat || invoice.vatExemptionReason) && (
            <div className="form-group" style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <label htmlFor="vat-exemption" style={{ color: '#93c5fd', fontWeight: 600 }}>{t.vatExemptionReason}</label>
              <input
                id="vat-exemption"
                type="text"
                value={invoice.vatExemptionReason || ''}
                onChange={e => handleInvoiceChange('vatExemptionReason', e.target.value)}
                placeholder={t.vatExemptionPlaceholder}
                style={{ marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => handleInvoiceChange('vatExemptionReason', 'TVA non applicable, art. 293 B du CGI')}
                >
                  Franchise en base (Art. 293 B)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => handleInvoiceChange('vatExemptionReason', 'Autoliquidation de la TVA')}
                >
                  Autoliquidation (B2B Intracomm.)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => handleInvoiceChange('vatExemptionReason', 'Exonération de TVA, article 262-I du CGI')}
                >
                  Exportation hors UE (Art. 262-I)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* WebMCP Fixed Overlay Modal */}
        {showWebMcpModal && (
          <div className="modal-backdrop" onClick={() => setShowWebMcpModal(false)} role="dialog" aria-modal="true" aria-labelledby="webmcp-modal-title">
            <div className="modal-container" onClick={e => e.stopPropagation()}>
              <div className="flex-between mb-4">
                <h3 id="webmcp-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={18} className="text-primary" /> WebMCP IA API & Guide de Connexion
                </h3>
                <button className="btn-icon" onClick={() => setShowWebMcpModal(false)} aria-label="Close WebMCP modal">✕</button>
              </div>

              {/* Navigation Tabs */}
              <div className="webmcp-tabs">
                <button
                  className={`webmcp-tab-btn ${activeWebMcpTab === 'tools' ? 'active' : ''}`}
                  onClick={() => setActiveWebMcpTab('tools')}
                >
                  🛠️ Outils WebMCP ({WEBMCP_TOOLS.length})
                </button>
                <button
                  className={`webmcp-tab-btn ${activeWebMcpTab === 'connect' ? 'active' : ''}`}
                  onClick={() => setActiveWebMcpTab('connect')}
                >
                  🌐 Connexion Web & ChatGPT
                </button>
              </div>

              {/* Tab 1: Available Tools */}
              {activeWebMcpTab === 'tools' && (
                <div>
                  <p className="text-secondary mb-4" style={{ fontSize: '0.875rem' }}>
                    Le serveur WebMCP expose ces fonctions directement dans le navigateur pour valider, calculer et générer vos factures.
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

              {/* Tab 2: Platform-specific Integration Guides */}
              {activeWebMcpTab === 'connect' && (
                <div>
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      ⚠️ {lang === 'fr' ? 'WebMCP - Version Bêta' : 'WebMCP - Beta Version'}
                    </p>
                    <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {lang === 'fr' 
                        ? 'L\'API WebMCP fonctionne uniquement depuis la page e-nvoice elle-même. Les plateformes IA externes (Claude.ai, Gemini, Mistral) ne peuvent pas y accéder directement pour des raisons de sécurité navigateur. De plus, e-nvoice enregistre automatiquement ses outils via l\'API WebMCP native de Chrome (document.modelContext.registerTool) lorsque celle-ci est disponible (Chrome + isolation d\'origine).'
                        : 'The WebMCP API only works from the e-nvoice page itself. External AI platforms (Claude.ai, Gemini, Mistral) cannot access it directly due to browser security restrictions. Additionally, e-nvoice auto-registers its tools via Chrome\'s native WebMCP API (document.modelContext.registerTool) when available (Chrome + origin isolation).'
                      }
                    </p>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontWeight: 600, color: '#93c5fd', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      🎯 {t.selectMethod}:
                    </p>
                  </div>

                  {/* Platform Tabs */}
                  <div className="webmcp-platform-tabs">
                    <button
                      className={`webmcp-platform-tab ${activePlatform === 'universal' ? 'active' : ''}`}
                      onClick={() => setActivePlatform('universal')}
                    >
                      <span className="platform-icon">🌐</span> {lang === 'fr' ? 'Console Navigateur' : 'Browser Console'}
                    </button>
                    <button
                      className={`webmcp-platform-tab ${activePlatform === 'postmessage' ? 'active' : ''}`}
                      onClick={() => setActivePlatform('postmessage')}
                    >
                      <span className="platform-icon">🔄</span> {lang === 'fr' ? 'postMessage' : 'postMessage'}
                    </button>
                    <button
                      className={`webmcp-platform-tab ${activePlatform === 'chrome' ? 'active' : ''}`}
                      onClick={() => setActivePlatform('chrome')}
                    >
                      <span className="platform-icon">ℹ️</span> {lang === 'fr' ? 'Chrome DevTools' : 'Chrome DevTools'}
                    </button>
                  </div>

                  {/* Universal - Browser Console */}
                  {activePlatform === 'universal' && (
                    <div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <p style={{ fontWeight: 600, color: '#93c5fd', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                          {lang === 'fr' ? 'Méthode la plus simple : Console du navigateur' : 'Simplest method: Browser console'}
                        </p>
                        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                          {lang === 'fr' 
                            ? 'Ouvrez les outils de développement (F12 ou Ctrl+Shift+I), allez dans l\'onglet Console, puis exécutez :'
                            : 'Open DevTools (F12 or Ctrl+Shift+I), go to Console tab, then execute:'
                          }
                        </p>
                        <pre className="code-block">
{`// ${lang === 'fr' ? 'Générer une facture Factur-X' : 'Generate a Factur-X invoice'}
await window.mcp.callTool('generate_facturx_invoice', {
  invoice: {
    number: 'INV-2026-001',
    date: new Date().toISOString().split('T')[0],
    seller: { 
      name: '${lang === 'fr' ? 'Mon Entreprise' : 'My Company'}', 
      siret: '12345678900012', 
      vatNumber: 'FRXX123456789' 
    },
    buyer: { 
      name: '${lang === 'fr' ? 'Client SA' : 'Client Inc'}' 
    },
    items: [
      { description: '${lang === 'fr' ? 'Service' : 'Service'}', quantity: 1, unitPrice: 1000, vatRate: 20 }
    ]
  },
  lang: '${lang}'
});

// ${lang === 'fr' ? 'Le PDF sera téléchargé automatiquement' : 'PDF will be downloaded automatically'}`}
                        </pre>
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: '#93c5fd', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                          {lang === 'fr' ? 'Autres outils disponibles' : 'Other available tools'}
                        </p>
                        <ul style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                          <li><code>calculate_invoice_totals</code> - {lang === 'fr' ? 'Calculer montants HT/TVA/TTC' : 'Calculate HT/VAT/total'}</li>
                          <li><code>validate_invoice_data</code> - {lang === 'fr' ? 'Valider les champs obligatoires' : 'Validate required fields'}</li>
                          <li><code>generate_facturx_xml</code> - {lang === 'fr' ? 'Générer le XML UN/CEFACT' : 'Generate UN/CEFACT XML'}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* postMessage */}
                  {activePlatform === 'postmessage' && (
                    <div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <p style={{ fontWeight: 600, color: '#93c5fd', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                          {lang === 'fr' ? 'Pour les intégrations externes : JSON-RPC via postMessage' : 'For external integrations: JSON-RPC via postMessage'}
                        </p>
                        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                          {lang === 'fr' 
                            ? 'Utilisez postMessage pour communiquer avec e-nvoice depuis des iframes ou extensions. Ne fonctionne pas avec les plateformes IA externes.'
                            : 'Use postMessage to communicate with e-nvoice from iframes or extensions. Does not work with external AI platforms.'
                          }
                        </p>
                        <pre className="code-block">
{`// ${lang === 'fr' ? 'Envoyer une requête' : 'Send a request'}
window.postMessage({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'calculate_invoice_totals',
    arguments: {
      items: [
        { quantity: 2, unitPrice: 500, vatRate: 20 },
        { quantity: 1, unitPrice: 1000, vatRate: 10 }
      ]
    }
  }
}, '*');

// ${lang === 'fr' ? 'Écouter la réponse' : 'Listen for response'}
window.addEventListener('message', (event) => {
  if (event.data?.jsonrpc === '2.0' && event.data.id === 1) {
    console.log('${lang === 'fr' ? 'Résultat :' : 'Result:'} ', event.data.result);
  }
});`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Chrome DevTools */}
                  {activePlatform === 'chrome' && (
                    <div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <p style={{ fontWeight: 600, color: '#93c5fd', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                          {lang === 'fr' ? 'Pourquoi WebMCP n\'apparaît pas dans Chrome DevTools ?' : 'Why doesn\'t WebMCP appear in Chrome DevTools?'}
                        </p>
                        <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                          {lang === 'fr' 
                            ? 'Chrome DevTools > Application > WebMCP n\'affiche que les serveurs MCP enregistrés avec Chrome (via chrome://settings/ai). L\'API window.mcp d\'e-nvoice est une implémentation custom côté client qui ne s\'y affiche pas. C\'est normal, même en production.'
                            : 'Chrome DevTools > Application > WebMCP only shows MCP servers registered with Chrome (via chrome://settings/ai). e-nvoice\'s window.mcp API is a custom client-side implementation that does not appear there. This is normal, even in production.'
                          }
                        </p>
                        <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: 1.6, marginTop: '1rem' }}>
                          {lang === 'fr' 
                            ? 'Votre serveur WebMCP est bien actif ! Vous pouvez le vérifier en exécutant dans la console :'
                            : 'Your WebMCP server is active! You can verify it by executing in the console:'
                          }
                        </p>
                        <pre className="code-block">
{`// ${lang === 'fr' ? 'Vérifier que window.mcp existe' : 'Check that window.mcp exists'}
console.log(typeof window.mcp); // Should log: "object"

// ${lang === 'fr' ? 'Lister les outils disponibles' : 'List available tools'}
console.log(await window.mcp.listTools());

// ${lang === 'fr' ? 'Appeler un outil' : 'Call a tool'}
const result = await window.mcp.callTool('validate_invoice_data', {
  number: 'TEST-001',
  date: '2026-08-11',
  seller: { name: 'Test SARL', country: 'FR' },
  buyer: { name: 'Client SA', country: 'FR' },
  buyerType: 'business',
  items: [{ quantity: 1, unitPrice: 1000, vatRate: 20 }]
});
console.log(result);`}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(96, 165, 250, 0.2)' }}>
                    <p style={{ fontWeight: 600, color: '#93c5fd', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      📚 {lang === 'fr' ? 'Ressources de découverte' : 'Discovery Resources'}
                    </p>
                    <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                      • <strong>{lang === 'fr' ? 'Manifest MCP' : 'MCP Manifest'}</strong> : <code>https://setiz.github.io/e-nvoice/.well-known/mcp.json</code><br />
                      • <strong>{lang === 'fr' ? 'Fichier LLM' : 'LLM File'}</strong> : <code>https://setiz.github.io/e-nvoice/llms.txt</code> ({lang === 'fr' ? 'Perplexity, SearchGPT' : 'Perplexity, SearchGPT'})<br />
                      • <strong>OpenAPI</strong> : <code>https://setiz.github.io/e-nvoice/openapi.json</code> ({lang === 'fr' ? 'Postman, ChatGPT' : 'Postman, ChatGPT'})<br />
                      • <strong>{lang === 'fr' ? 'Découverte auto' : 'Auto-discovery'}</strong> : {lang === 'fr' ? 'Les agents IA peuvent lire /llms.txt pour comprendre les capacités' : 'AI agents can read /llms.txt to understand capabilities'}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* FAQ Modal */}
        {showFaqModal && (
          <div className="modal-backdrop" onClick={() => setShowFaqModal(false)} role="dialog" aria-modal="true" aria-labelledby="faq-modal-title">
            <div className="modal-container" onClick={e => e.stopPropagation()}>
              <div className="flex-between mb-4">
                <h3 id="faq-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={18} className="text-primary" /> {t.faqTitle}
                </h3>
                <button className="btn-icon" onClick={() => setShowFaqModal(false)} aria-label={lang === 'fr' ? 'Fermer les FAQ' : 'Close FAQ'}>✕</button>
              </div>
              <div className="faq-modal-content">
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
                <details className="faq-card">
                  <summary>{t.faq4Q}</summary>
                  <p>{t.faq4A}</p>
                </details>
                <details className="faq-card">
                  <summary>{t.faq5Q}</summary>
                  <p>{t.faq5A}</p>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Chorus Pro Modal */}
        {showChorusProModal && (
          <div className="modal-backdrop" onClick={() => setShowChorusProModal(false)} role="dialog" aria-modal="true" aria-labelledby="chorus-modal-title">
            <div className="modal-container chorus-modal-container" onClick={e => e.stopPropagation()}>
              <div className="flex-between mb-4">
                <h3 id="chorus-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                  <Landmark size={20} /> {t.chorusProModalTitle}
                </h3>
                <button className="btn-icon" onClick={() => setShowChorusProModal(false)} aria-label={lang === 'fr' ? 'Fermer le guide Chorus Pro' : 'Close Chorus Pro Guide'}>✕</button>
              </div>

              <div className="chorus-modal-content">
                <div className="chorus-steps-list">
                  <div className="chorus-step-item">
                    <div className="chorus-step-number">1</div>
                    <div className="chorus-step-body">
                      <h4>{t.chorusStep1Title}</h4>
                      <p>{t.chorusStep1Desc}</p>
                    </div>
                  </div>

                  <div className="chorus-step-item">
                    <div className="chorus-step-number">2</div>
                    <div className="chorus-step-body">
                      <h4>{t.chorusStep2Title}</h4>
                      <p>{t.chorusStep2Desc}</p>
                      <a
                        href="https://portail.chorus-pro.gouv.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chorus-portal-link"
                      >
                        portail.chorus-pro.gouv.fr ↗
                      </a>
                    </div>
                  </div>

                  <div className="chorus-step-item">
                    <div className="chorus-step-number">3</div>
                    <div className="chorus-step-body">
                      <h4>{t.chorusStep3Title}</h4>
                      <p>{t.chorusStep3Desc}</p>
                    </div>
                  </div>

                  <div className="chorus-step-item">
                    <div className="chorus-step-number">4</div>
                    <div className="chorus-step-body">
                      <h4>{t.chorusStep4Title}</h4>
                      <p>{t.chorusStep4Desc}</p>
                    </div>
                  </div>

                  <div className="chorus-step-item">
                    <div className="chorus-step-number">5</div>
                    <div className="chorus-step-body">
                      <h4>{t.chorusStep5Title}</h4>
                      <p>{t.chorusStep5Desc}</p>
                    </div>
                  </div>
                </div>

                <div className="chorus-tips-box">
                  <h4>
                    <ShieldCheck size={18} style={{ color: '#34d399', display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    {t.chorusTipsTitle}
                  </h4>
                  <ul>
                    <li>{t.chorusTip1}</li>
                    <li>{t.chorusTip2}</li>
                    <li>{t.chorusTip3}</li>
                  </ul>
                </div>

                <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
                  <button className="btn btn-primary" onClick={() => setShowChorusProModal(false)}>
                    {lang === 'fr' ? 'Compris !' : 'Got it!'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Preview Section */}
      <div className="preview-section" aria-label="Invoice preview">
        <div className="invoice-preview">
          <div className="invoice-preview-header">
            <div className="invoice-preview-title">
              <h2>{t.invoice}</h2>
              <div className="facturx-badge" aria-label={t.facturxCompliant}>
                <CheckCircle size={16} /> {t.facturxCompliant}
              </div>
            </div>
            <div className="invoice-preview-details">
              <div><strong>{t.invoiceNumber}:</strong> {invoice.number}</div>
              <div><strong>{t.date}:</strong> {invoice.date}</div>
              <div><strong>{t.dueDate}:</strong> {invoice.dueDate}</div>
              {invoice.purchaseOrder && (
                <div><strong>{t.purchaseOrder}:</strong> {invoice.purchaseOrder}</div>
              )}
            </div>
          </div>

          <div className="invoice-parties">
            <div className="party-box">
              <h3>{t.seller}</h3>
              <div className="party-info">
                <strong>{invoice.seller.name || t.yourCompanyPlaceholder}</strong><br />
                {invoice.seller.address}<br />
                {invoice.seller.zip} {invoice.seller.city} {invoice.seller.country || 'FR'}<br />
                <br />
                {invoice.seller.siret && <div>{t.siret}: {invoice.seller.siret}</div>}
                {invoice.seller.vatNumber && <div>{t.vatNumber}: {invoice.seller.vatNumber}</div>}
              </div>
            </div>
            <div className="party-box">
              <h3>{t.buyer} ({invoice.buyerType === 'individual' ? t.b2c : t.b2b})</h3>
              <div className="party-info">
                <strong>{invoice.buyer.name || t.clientNamePlaceholder}</strong><br />
                {invoice.buyer.address}<br />
                {invoice.buyer.zip} {invoice.buyer.city} {invoice.buyer.country || 'FR'}<br />
                <br />
                {invoice.buyerType === 'business' && invoice.buyer.siret && <div>{t.siret}: {invoice.buyer.siret}</div>}
                {invoice.buyerType === 'business' && invoice.buyer.vatNumber && <div>{t.vatNumber}: {invoice.buyer.vatNumber}</div>}
                {invoice.buyerType === 'business' && !invoice.buyer.vatNumber && invoice.buyer.taxId && <div>{t.taxId}: {invoice.buyer.taxId}</div>}
                {invoice.buyerType === 'business' && invoice.serviceCode && <div>{t.serviceCode}: {invoice.serviceCode}</div>}
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
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description || '-'}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.unitPrice.toFixed(2)} {currSymbol}</td>
                  <td className="text-right">{item.vatRate}%</td>
                  <td className="text-right">{(item.quantity * item.unitPrice).toFixed(2)} {currSymbol}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="total-row">
              <span>{t.subtotalExclVat}</span>
              <span>{calculateSubtotal(invoice.items).toFixed(2)} {currSymbol}</span>
            </div>
            <div className="total-row">
              <span>{t.vatAmount}</span>
              <span>{calculateVat(invoice.items).toFixed(2)} {currSymbol}</span>
            </div>
            <div className="total-row grand-total">
              <span>{t.totalAmountDue}</span>
              <span>{calculateTotal(invoice.items).toFixed(2)} {currSymbol}</span>
            </div>
          </div>

          {/* Bank details preview */}
          {(invoice.seller.iban || invoice.seller.bic || invoice.seller.bankName) && (
            <div className="preview-bank-box">
              <h4>{t.bankDetails}</h4>
              {invoice.seller.bankName && <div><strong>{t.bankName}:</strong> {invoice.seller.bankName}</div>}
              {invoice.seller.iban && <div><strong>{t.iban}:</strong> {invoice.seller.iban}</div>}
              {invoice.seller.bic && <div><strong>{t.bic}:</strong> {invoice.seller.bic}</div>}
            </div>
          )}

          {/* Legal Mentions Footer */}
          <div className="preview-legal-footer">
            {invoice.paymentTermsText && <p><strong>{t.paymentTerms}:</strong> {invoice.paymentTermsText}</p>}
            {invoice.buyerType === 'business' && invoice.latePenaltiesText && (
              <p><strong>{t.latePenalties}:</strong> {invoice.latePenaltiesText}</p>
            )}
            {invoice.buyerType === 'business' && invoice.recoveryIndemnityText && (
              <p>{invoice.recoveryIndemnityText}</p>
            )}
            {invoice.earlyDiscountText && <p>{invoice.earlyDiscountText}</p>}
            {invoice.vatOnDebits && <p>{t.vatOnDebits}</p>}
            {invoice.vatExemptionReason && <p><strong>{t.vatExemptionReason}:</strong> {invoice.vatExemptionReason}</p>}
          </div>

        </div>
      </div>
    </main>
      <footer className="app-footer">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <a href="https://github.com/SetiZ/e-nvoice" target="_blank" rel="noopener noreferrer">
            {t.footerAttribution}
          </a>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="/e-nvoice/sitemap.xml" target="_blank" rel="noopener noreferrer" title="Sitemap XML">
            Sitemap
          </a>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="/e-nvoice/llms.txt" target="_blank" rel="noopener noreferrer" title="AI & LLM Context Documentation">
            llms.txt
          </a>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="/e-nvoice/llms-full.txt" target="_blank" rel="noopener noreferrer" title="Full LLM Specification">
            llms-full.txt
          </a>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="/e-nvoice/openapi.json" target="_blank" rel="noopener noreferrer" title="OpenAPI Schema Specification">
            OpenAPI Spec
          </a>
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          Factur-X / EN 16931 (PDF/A-3 + UN/CEFACT CII) • Réforme 2026 • 100% Client-Side Privacy
        </div>
      </footer>
    </>
  );
}

export default App;
