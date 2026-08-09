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
