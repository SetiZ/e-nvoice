# e-nvoice - Générateur Factur-X & EN 16931 (WebMCP & 100% Client-Side)

![Deploy to GitHub Pages](https://github.com/SetiZ/e-nvoice/actions/workflows/deploy.yml/badge.svg)
![Conforme EN 16931](https://img.shields.io/badge/Norme-EN%2016931%20%2F%20Factur--X-blue.svg)
![WebMCP Ready](https://img.shields.io/badge/WebMCP-IA%20Ready-60a5fa.svg)
![Client Side Only](https://img.shields.io/badge/Privacy-100%25%20C%C3%B4t%C3%A9%20Client-emerald.svg)

**e-nvoice** est un générateur gratuit, rapide et 100% sécurisé de factures électroniques au format **Factur-X / EN 16931** (PDF/A-3 hybride contenant le fichier XML structuré UN/CEFACT CrossIndustryInvoice).

Prêt pour la **réforme française 2026 de la facturation électronique B2B**, l'application fonctionne entièrement dans le navigateur sans envoyer aucune donnée financière sur un serveur distant.

🌐 **Demo en ligne** : [https://setiz.github.io/e-nvoice/](https://setiz.github.io/e-nvoice/)

---

## ✨ Fonctionnalités Clés

- 📄 **Conformité Factur-X / EN 16931** : Génère un document PDF/A-3 embarquant automatiquement le schéma XML obligatoire (`factur-x.xml`).
- 🔒 **Confidentialité Totale (100% Côté Client)** : La création du PDF et du XML s'effectue localement en JavaScript. Zéro serveur, zéro traqueur.
- ⚡ **Support WebMCP (Model Context Protocol)** : Intègre un serveur MCP natif au navigateur permettant aux agents IA (Claude, ChatGPT, Chrome AI) de pré-remplir, valider ou générer des factures via `window.mcp` et `postMessage`.
- 🌍 **Multilingue (FR / EN)** : Interface et factures générables en Français (par défaut) et en Anglais.
- 🔍 **Optimisé SEO / AEO / GEO** : Métadonnées structurées JSON-LD (`SoftwareApplication` & `FAQPage`), manifestes `llms.txt` et `/.well-known/mcp.json` pour le référencement par les moteurs de recherche génératifs (Perplexity, SearchGPT, Gemini).

---

## 🤖 WebMCP (Model Context Protocol)

**e-nvoice** expose une API **WebMCP** disponible directement dans la fenêtre du navigateur (`window.mcp`) ainsi qu'un écouteur JSON-RPC 2.0 via `window.postMessage`.

### Outils Disponibles pour les Agents IA :

| Outil | Description |
| :--- | :--- |
| `calculate_invoice_totals` | Calcule les sous-totaux HT, montants de TVA et total TTC à partir des lignes de facturation. |
| `validate_invoice_data` | Vérifie la présence des champs obligatoires (SIRET, TVA, dates, lignes) selon la norme EN 16931. |
| `generate_facturx_xml` | Génère le flux XML brut UN/CEFACT CrossIndustryInvoice v100. |
| `generate_facturx_invoice` | Déclenche la création et le téléchargement du fichier PDF/A-3 hybride Factur-X. |

---

## 🇫🇷 Compatibilité Chorus Pro

**e-nvoice génère des factures 100% compatibles avec [Chorus Pro](https://chorus-pro.gouv.fr/)** , la plateforme officielle française pour la facturation électronique B2G et B2B obligatoire à partir de **2026**.

### ✅ Ce qui fonctionne :
- Format **Factur-X / EN 16931** acceptés par Chorus Pro
- PDF/A-3 hybride avec XML UN/CEFACT CrossIndustryInvoice intégré
- Conforme au profil **CIUS** (Core Invoice Usage Specification) requis

### 📥 Comment déposer sur Chorus Pro :

**Méthode 1 : Dépôt manuel (Portail Web)**
1. Générez votre facture Factur-X avec e-nvoice
2. Connectez-vous à [https://portail.chorus-pro.gouv.fr](https://portail.chorus-pro.gouv.fr)
3. Sélectionnez **"Déposer une facture"** → **"Fichier structuré (Factur-X/UBL)"**
4. Téléchargez le fichier PDF généré par e-nvoice
5. Complétez les métadonnées et validez

**Méthode 2 : Transmission automatique (EDI/API)**
Les fichiers générés par e-nvoice peuvent être transmis via :
- L'API Chorus Pro (nécessite un compte Piste/Flux)
- Votre solution PDP (Plateforme de Dématérialisation Partenaire) existante
- Logiciels comptables compatibles (Sage, Ciel, QuickBooks, etc.)

### ⚠️ Points de vigilance :
- Vérifiez que le **SIRET** et le **numéro de TVA intracommunautaire** sont correctement renseignés
- Chorus Pro requiert un **numéro de facture unique** (champ obligatoire)
- Les factures doivent être signées électroniquement pour certains marchés publics (e-nvoice ne gère pas encore la signature)

---

## 🤖 WebMCP (Beta) - Intégration IA ⚠️

**e-nvoice** expose une API **WebMCP** (Model Context Protocol) **en version bêta** directement dans le navigateur.

> ⚠️ **Statut Beta**: Le support WebMCP/MCP par les plateformes IA évolue rapidement. Les fonctionnalités décrites ci-dessous reflètent l'état **août 2026** et peuvent changer. L'API `window.mcp` fonctionne de manière fiable **uniquement depuis la page e-nvoice elle-même**.

**e-nvoice** permet aux développeurs et scripts d'interagir avec l'application pour pré-remplir, valider ou générer des factures de manière programmatique.

### 🛠️ Outils Disponibles

| Outil | Description | Paramètres |
| :--- | :--- | :--- |
| `calculate_invoice_totals` | Calcule HT, TVA et TTC à partir des lignes | `items: Array<{quantity, unitPrice, vatRate}>` |
| `validate_invoice_data` | Vérifie les champs obligatoires EN 16931 | `number, date, sellerName, buyerName, itemCount` |
| `generate_facturx_xml` | Génère le XML UN/CEFACT brut | `invoice: Invoice` |
| `generate_facturx_invoice` | Génère et télécharge le PDF Factur-X | `invoice: Invoice, lang: 'fr'/'en'` |

### 🌐 Méthodes de Connexion

> ⚠️ **Important**: L'API WebMCP d'e-nvoice (`window.mcp`) **ne fonctionne que depuis la page e-nvoice elle-même** en raison des restrictions de sécurité des navigateurs. Les plateformes IA externes **ne peuvent pas y accéder directement**.

| Méthode | Description | Fonctionne avec |
|---------|-------------|-----------------|
| **Console Navigateur (DevTools)** | `window.mcp.callTool()` directement | ✅ Tous navigateurs |
| **Extensions Navigateur** | Scripts injectés dans la page | ✅ Extensions Chrome/Edge |
| **Bookmarklets** | JavaScript bookmark | ✅ Tous navigateurs |
| **Clients MCP locaux** | Connexion via `.well-known/mcp.json` | ✅ Claude Desktop, clients MCP |
| **ChatGPT Actions** | Import OpenAPI | ❌ **Non** (nécessite un serveur) |
| **Claude.ai (web)** | Accès direct | ❌ **Non** (restrictions cross-origin) |
| **Gemini.google.com** | Accès direct | ❌ **Non** (restrictions cross-origin) |
| **Mistral Le Chat** | Accès direct | ❌ **Non** (pas de support MCP) |

> ❓ **Pourquoi Chrome DevTools > Application > WebMCP ne montre pas les outils ?**
> Chrome's WebMCP viewer affiche uniquement les serveurs MCP **enregistrés avec Chrome** (via `chrome://settings/ai`). L'API `window.mcp` d'e-nvoice est une implémentation **custom** qui n'apparaît pas dans cette section. C'est normal en développement local.

### 📖 Méthodes Fonctionnelles

#### ✅ **1. Console Navigateur (Tous navigateurs)**
La méthode la plus simple et universelle :

```javascript
// Sur la page e-nvoice, ouvrez DevTools (F12) puis :
await window.mcp.callTool('generate_facturx_invoice', {
  invoice: {
    number: 'INV-2026-001',
    date: '2026-08-11',
    seller: { name: 'Mon Entreprise', siret: '12345678900012', vatNumber: 'FRXX123456789' },
    buyer: { name: 'Client SA', siret: '98765432100010' },
    items: [{ description: 'Service', quantity: 1, unitPrice: 1000, vatRate: 20 }]
  },
  lang: 'fr'
});
```

#### ✅ **2. JSON-RPC via postMessage (Extensions, iframes)**
Pour les intégrations qui ne peuvent pas accéder directement à `window.mcp` :

```javascript
// Envoyer une requête
window.postMessage({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'calculate_invoice_totals',
    arguments: { items: [{ quantity: 2, unitPrice: 500, vatRate: 20 }] }
  }
}, '*');

// Recevoir la réponse
window.addEventListener('message', (event) => {
  if (event.data?.jsonrpc === '2.0' && event.data.id === 1) {
    console.log('Résultat:', event.data.result);
  }
});
```

#### ⚠️ **3. Claude Desktop (MCP natif)**
Claude Desktop peut découvrir le manifest MCP, mais **ne peut pas accéder à `window.mcp`** de votre navigateur. Pour une intégration locale, vous auriez besoin d'un serveur MCP séparé (non inclus dans e-nvoice).

#### ❌ **4. ChatGPT Actions / Autres plateformes web**
Ces méthodes **ne fonctionnent PAS** avec e-nvoice car :
- ChatGPT Actions nécessite un **endpoint HTTP server-side** (e-nvoice est 100% client-side)
- Claude.ai, Gemini, Mistral Le Chat **ne peuvent pas accéder** au `window` d'autres onglets pour des raisons de sécurité

> 💡 **Solution alternative pour les plateformes web** : Guidez l'utilisateur pour qu'il exécute manuellement le code JavaScript dans la console de la page e-nvoice.

### 🔗 Ressources de Découverte
- **Manifest MCP** : `/.well-known/mcp.json`
- **Fichier LLM** : `/llms.txt` (pour Perplexity, SearchGPT)
- **OpenAPI** : `/openapi.json` (pour ChatGPT, Postman)

---

## 🚀 Développement Local

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- npm

### Installation & Lancement

```bash
# Cloner le dépôt
git clone https://github.com/SetiZ/e-nvoice.git
cd e-nvoice

# Installer les dépendances
npm install

# Lancer le serveur de développement Vite
npm run dev
```

### Build de Production

```bash
npm run build
```

---

## 🛠️ Stack Technique

- **Framework** : React 19 + TypeScript + Vite
- **Génération PDF & XML** : `jspdf`, `pdf-lib`
- **Icônes & UI** : `lucide-react`, Glassmorphism CSS avec police Google *Outfit*
- **Standards** : Factur-X 1.0.06 / EN 16931-1 / UN/CEFACT CII D16B

---

## 📜 Licence

Projet sous licence MIT - Libre d'utilisation et de modification.
