# Chorus Pro API Integration Plan for e-nvoice

> **Status**: Draft  
> **Last Updated**: 2026-09-02  
> **Author**: Integration Planning  
> **Target**: Add direct Chorus Pro submission capability to e-nvoice

---

## 🎯 Executive Summary

This document outlines the plan to add **Chorus Pro API connectivity** to e-nvoice, enabling users to submit their Factur-X invoices directly to the French government's electronic invoicing platform without manual upload.

**Current State**: e-nvoice generates 100% Chorus Pro-compatible Factur-X invoices (PDF/A-3 with embedded UN/CEFACT XML) but requires manual upload via the Chorus Pro web portal.

**Target State**: Users can click "Submit to Chorus Pro" and have their invoices automatically transmitted via the Chorus Pro PISTE API.

---

## 🏗️ Architecture Overview

```mermaid
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  e-nvoice    │────▶│ Cloudflare   │────▶│ Chorus Pro  │
│  (Browser)   │     │  Worker      │     │  PISTE API   │
└─────────────┘     └──────────────┘     └─────────────┘
        ↑                    ↑                    ↑
        │                 API Key + Token        │
        │                 (cached in KV)         │
        └───────────────────────────────────────┘
           Factur-X File Upload
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         e-nvoice Application                            │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Frontend (React/Vite)                         │ │
│  │  • Invoice Generation UI                                      │ │
│  │  • "Submit to Chorus Pro" Button                              │ │
│  │  • Status Notifications                                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/chorus/submit
                              │ (Factur-X PDF + Metadata)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Cloudflare Worker Proxy                           │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  • Authenticate with Chorus Pro (OAuth2 + Client Credentials)   │ │
│  │  • Validate incoming requests                                  │ │
│  │  • Cache access tokens in KV                                   │ │
│  │  • Forward invoices to Chorus Pro PISTE API                     │ │
│  │  • Handle errors and retries                                   │ │
│  │  • (Future) Receive webhook status updates                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS POST
                              │ (Factur-X XML/PDF)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Chorus Pro PISTE API                            │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  • /oauth/token - Get access token                               │ │
│  │  • /api/v1/factures - Submit invoice                             │ │
│  │  • /api/v1/factures/{id} - Get invoice status                    │ │
│  │  • /api/v1/etats/{id} - Get processing state                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites Checklist

### ✅ Before Starting Development

- [ ] **Chorus Pro PISTE Access**
  - [ ] Register as "Déposant Technique" at [https://portail.chorus-pro.gouv.fr](https://portail.chorus-pro.gouv.fr)
  - [ ] Request PISTE API access (lead time: 1-2 weeks)
  - [ ] Obtain credentials:
    - [ ] `client_id`
    - [ ] `client_secret`
    - [ ] API scope (typically `piste-api`)
  - [ ] Access to sandbox environment for testing

- [ ] **Cloudflare Account**
  - [ ] Cloudflare account with Workers access
  - [ ] Domain configured (optional, can use `*.workers.dev`)
  - [ ] Wrangler CLI installed (`npm install -g wrangler`)

- [ ] **Project Setup**
  - [ ] Node.js v18+ installed
  - [ ] TypeScript configured
  - [ ] Existing e-nvoice codebase accessible

---

## 📁 Project Structure

```
e-nvoice/
├── src/
│   ├── utils/
│   │   ├── chorusProxyClient.ts      # NEW: Client for Worker API
│   │   └── ...
│   └── components/
│       └── ChorusSubmitButton.tsx     # NEW: UI component
│
├── chorus-worker/                     # NEW: Cloudflare Worker
│   ├── src/
│   │   ├── index.ts                 # Main Worker handler
│   │   ├── handlers/
│   │   │   ├── submit.ts             # Invoice submission logic
│   │   │   ├── auth.ts               # Chorus Pro authentication
│   │   │   └── status.ts             # Status checking
│   │   ├── types.ts                  # TypeScript interfaces
│   │   └── utils.ts                  # Helper functions
│   ├── wrangler.toml                 # Worker configuration
│   └── package.json
│
├── CHORUS_PRO_INTEGRATION_PLAN.md    # This document
├── README.md
└── ...
```

---

## 🚀 Phase 1: Chorus Pro Registration (Week 1-2)

### Objective
Obtain Chorus Pro PISTE API credentials and understand API requirements.

### Tasks

1. **Register for Chorus Pro Account**
   - Visit [https://portail.chorus-pro.gouv.fr](https://portail.chorus-pro.gouv.fr)
   - Create account as "Déposant Technique"
   - Select "Accès API PISTE" option

2. **Complete Business Verification**
   - Provide company information (SIRET, etc.)
   - Upload required documents
   - Wait for approval (typically 5-10 business days)

3. **Request Sandbox Access**
   - Request access to test environment
   - Obtain sandbox credentials

4. **Review Documentation**
   - Study [API G2B Documentation](https://portail.chorus-pro.gouv.fr/aife_documentation?id=kb_article_view&sysparm_article=KB0013510)
   - Note all required endpoints
   - Understand rate limits and quotas

5. **Test Sandbox Manually**
   - Use Postman or cURL to test sandbox API
   - Verify authentication flow
   - Submit test invoice

### Deliverables
- [ ] Chorus Pro PISTE production credentials
- [ ] Chorus Pro sandbox credentials
- [ ] API documentation notes
- [ ] Sandbox testing results

### Estimated Time
- **Registration & Approval**: 5-10 business days
- **Documentation Review**: 2-4 hours
- **Sandbox Testing**: 2-4 hours

---

## 🛠️ Phase 2: Cloudflare Worker Setup (Week 2-3)

### Objective
Create and deploy a Cloudflare Worker that acts as a secure proxy to Chorus Pro API.

### Tasks

#### 2.1 Create Cloudflare Worker Project
```bash
# Create new worker directory
mkdir chorus-worker
cd chorus-worker

# Initialize with wrangler
wrangler init chorus-proxy

# Select HTTP handler template
# Choose TypeScript
```

#### 2.2 Configure Worker Environment

**wrangler.toml**
```toml
name = "e-nvoice-chorus-proxy"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# KV namespace for token caching
kv_namespaces = [
  { binding = "TOKEN_KV", id = "YOUR_KV_NAMESPACE_ID", preview_id = "YOUR_PREVIEW_KV_ID" }
]

# Environment variables (set via dashboard or wrangler secret)
[vars]
ENVIRONMENT = "production"

# These will be set as secrets
# CHORUS_CLIENT_ID = "your_client_id"
# CHORUS_CLIENT_SECRET = "your_client_secret"
```

#### 2.3 Create KV Namespace
```bash
# Create KV namespace for production
wrangler kv:namespace create "TOKEN_KV"

# Note the ID and add to wrangler.toml
```

#### 2.4 Set Secrets
```bash
# Set production secrets
wrangler secret put CHORUS_CLIENT_ID
wrangler secret put CHORUS_CLIENT_SECRET
wrangler secret put CHORUS_TOKEN_URL
wrangler secret put CHORUS_API_URL
```

#### 2.5 Deploy Initial Worker
```bash
npm run deploy
# or
wrangler deploy
```

### Worker Code Structure

**src/index.ts** - Main Entry Point
```typescript
import { handleSubmit } from './handlers/submit';
import { handleStatus } from './handlers/status';
import { handleWebhook } from './handlers/webhook';

export interface Env {
  CHORUS_CLIENT_ID: string;
  CHORUS_CLIENT_SECRET: string;
  CHORUS_TOKEN_URL: string;
  CHORUS_API_URL: string;
  TOKEN_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = getCorsHeaders();

    // Handle OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (true) {
        case path === '/api/chorus/submit' && request.method === 'POST':
          return await handleSubmit(request, env, corsHeaders);

        case path.match(/^\/api\/chorus\/status\/.+$/):
          return await handleStatus(request, env, corsHeaders);

        case path === '/api/chorus/webhook' && request.method === 'POST':
          return await handleWebhook(request, env);

        default:
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

function getCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
```

**src/handlers/submit.ts** - Invoice Submission
```typescript
import { Env } from '../index';
import { getChorusToken } from '../utils/auth';
import { validateInvoiceFile } from '../utils/validation';

export async function handleSubmit(
  request: Request,
  env: Env,
  corsHeaders: HeadersInit
): Promise<Response> {
  // 1. Parse multipart form data
  const formData = await request.formData();
  
  const invoiceFile = formData.get('invoice') as File | null;
  const userId = formData.get('userId') as string | null;
  const recipientSiret = formData.get('recipientSiret') as string | null;
  const invoiceNumber = formData.get('invoiceNumber') as string | null;
  const invoiceDate = formData.get('invoiceDate') as string | null;

  // 2. Validate required fields
  if (!invoiceFile) {
    return new Response(JSON.stringify({ error: 'Invoice file is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Validate file type and size
  const validation = validateInvoiceFile(invoiceFile);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 4. Get Chorus Pro access token
    const token = await getChorusToken(env);

    // 5. Prepare request to Chorus Pro
    const chorusFormData = new FormData();
    chorusFormData.append('fichier', new Blob([await invoiceFile.arrayBuffer()]), invoiceFile.name);
    
    // Add required metadata
    if (recipientSiret) {
      chorusFormData.append('identifiantDestination', recipientSiret);
    }
    if (invoiceNumber) {
      chorusFormData.append('numeroFacture', invoiceNumber);
    }
    if (invoiceDate) {
      chorusFormData.append('dateFacture', invoiceDate);
    }

    // 6. Submit to Chorus Pro
    const chorusResponse = await fetch(`${env.CHORUS_API_URL}/factures`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: chorusFormData,
    });

    if (!chorusResponse.ok) {
      const errorText = await chorusResponse.text();
      const errorData = tryParseJson(errorText);
      
      console.error('Chorus Pro API error:', {
        status: chorusResponse.status,
        error: errorData || errorText,
      });

      return new Response(
        JSON.stringify({
          error: 'Chorus Pro submission failed',
          details: errorData || errorText,
          status: chorusResponse.status,
        }),
        {
          status: chorusResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await chorusResponse.json();

    // 7. Store submission for tracking
    await env.TOKEN_KV.put(
      `submission:${userId}:${result.id}`,
      JSON.stringify({
        userId,
        chorusId: result.id,
        timestamp: new Date().toISOString(),
        status: result.status,
      }),
      { expirationTtl: 86400 * 30 } // 30 days
    );

    // 8. Return success
    return new Response(
      JSON.stringify({
        success: true,
        chorusId: result.id,
        status: result.status,
        message: 'Invoice submitted successfully to Chorus Pro',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit invoice: ' + String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

function tryParseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
```

**src/handlers/status.ts** - Submission Status Check
```typescript
import { Env } from '../index';
import { getChorusToken } from '../utils/auth';

export async function handleStatus(
  request: Request,
  env: Env,
  corsHeaders: HeadersInit
): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const chorusId = pathParts[pathParts.length - 1];

  if (!chorusId) {
    return new Response(JSON.stringify({ error: 'Chorus invoice ID is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const token = await getChorusToken(env);

    const response = await fetch(`${env.CHORUS_API_URL}/factures/${chorusId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
```

**src/utils/auth.ts** - Authentication Helper
```typescript
import { Env } from '../index';

const TOKEN_CACHE_KEY = 'chorus_access_token';
const TOKEN_EXPIRY_KEY = 'chorus_token_expiry';

export async function getChorusToken(env: Env): Promise<string> {
  // Check if we have a valid cached token
  const cachedToken = await env.TOKEN_KV.get(TOKEN_CACHE_KEY);
  const expiry = await env.TOKEN_KV.get(TOKEN_EXPIRY_KEY);

  if (cachedToken && expiry) {
    const expiryDate = new Date(expiry);
    const now = new Date();
    
    // Token is valid for at least 5 more minutes
    if (expiryDate.getTime() - now.getTime() > 5 * 60 * 1000) {
      return cachedToken;
    }
  }

  // Get new token
  const token = await fetchChorusToken(env);
  
  // Cache for 1 hour (tokens typically last 1-24 hours, but we refresh conservatively)
  const newExpiry = new Date(Date.now() + 3600 * 1000).toISOString();
  
  await env.TOKEN_KV.put(TOKEN_CACHE_KEY, token, { expirationTtl: 3600 });
  await env.TOKEN_KV.put(TOKEN_EXPIRY_KEY, newExpiry, { expirationTtl: 3600 });

  return token;
}

async function fetchChorusToken(env: Env): Promise<string> {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('scope', 'piste-api');

  const response = await fetch(env.CHORUS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${env.CHORUS_CLIENT_ID}:${env.CHORUS_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Chorus token: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  return data.access_token;
}
```

**src/utils/validation.ts** - File Validation
```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateInvoiceFile(file: File): ValidationResult {
  // Check file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  const validTypes = ['application/pdf', 'application/xml'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|xml)$/i)) {
    return { valid: false, error: 'File must be PDF or XML' };
  }

  // Check file name
  if (!file.name) {
    return { valid: false, error: 'File name is required' };
  }

  return { valid: true };
}
```

**src/types.ts** - TypeScript Types
```typescript
export interface ChorusSubmissionRequest {
  invoice: File;
  userId: string;
  recipientSiret?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
}

export interface ChorusSubmissionResponse {
  success: boolean;
  chorusId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface ChorusInvoiceStatus {
  id: string;
  status: 'DEPOSEE' | 'EN_COURS' | 'ACCEPTEE' | 'REJETEE' | 'ERREUR';
  dateDepot: string;
  dateTraitement?: string;
  motifRejet?: string;
}

export interface ChorusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}
```

### Deliverables
- [ ] Cloudflare Worker project with complete code
- [ ] KV namespace created and configured
- [ ] Environment secrets set
- [ ] Worker deployed to Cloudflare
- [ ] Health check endpoint (`/api/chorus/health`)

### Estimated Time
- **Worker Setup**: 2-4 hours
- **Code Implementation**: 6-8 hours
- **Testing & Debugging**: 2-4 hours

---

## 🎨 Phase 3: Frontend Integration (Week 3-4)

### Objective
Integrate the Cloudflare Worker proxy into the e-nvoice frontend, enabling users to submit invoices directly to Chorus Pro.

### Tasks

#### 3.1 Create Chorus Proxy Client

**src/utils/chorusProxyClient.ts**
```typescript
const WORKER_URL = import.meta.env.VITE_CHORUS_WORKER_URL || 'https://chorus-proxy.your-domain.workers.dev';

export interface SubmitInvoiceParams {
  invoiceFile: File;
  userId: string;
  recipientSiret?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
}

export interface SubmitInvoiceResponse {
  success: boolean;
  chorusId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface CheckStatusResponse {
  id: string;
  status: string;
  dateDepot?: string;
  dateTraitement?: string;
  motifRejet?: string;
}

export class ChorusProxyClient {
  private static instance: ChorusProxyClient;

  private constructor() {}

  public static getInstance(): ChorusProxyClient {
    if (!ChorusProxyClient.instance) {
      ChorusProxyClient.instance = new ChorusProxyClient();
    }
    return ChorusProxyClient.instance;
  }

  async submitInvoice(params: SubmitInvoiceParams): Promise<SubmitInvoiceResponse> {
    const formData = new FormData();
    formData.append('invoice', params.invoiceFile);
    formData.append('userId', params.userId);
    
    if (params.recipientSiret) {
      formData.append('recipientSiret', params.recipientSiret);
    }
    if (params.invoiceNumber) {
      formData.append('invoiceNumber', params.invoiceNumber);
    }
    if (params.invoiceDate) {
      formData.append('invoiceDate', params.invoiceDate);
    }

    const response = await fetch(`${WORKER_URL}/api/chorus/submit`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: error.error || 'Submission failed' };
    }

    return await response.json();
  }

  async checkStatus(chorusId: string): Promise<CheckStatusResponse> {
    const response = await fetch(`${WORKER_URL}/api/chorus/status/${chorusId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.status}`);
    }

    return await response.json();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${WORKER_URL}/api/chorus/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const chorusProxy = ChorusProxyClient.getInstance();
```

#### 3.2 Create Chorus Submit Button Component

**src/components/ChorusSubmitButton.tsx**
```tsx
import React, { useState } from 'react';
import { chorusProxy, type SubmitInvoiceParams } from '../utils/chorusProxyClient';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ChorusSubmitButtonProps {
  invoiceFile: File | null;
  userId: string;
  recipientSiret?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  className?: string;
  onSuccess?: (chorusId: string) => void;
  onError?: (error: string) => void;
}

export enum SubmissionStatus {
  IDLE = 'idle',
  SUBMITTING = 'submitting',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface StatusConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
}

const statusConfigs: Record<SubmissionStatus, StatusConfig> = {
  [SubmissionStatus.IDLE]: {
    icon: null,
    label: 'Submit to Chorus Pro',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  [SubmissionStatus.SUBMITTING]: {
    icon: <Loader2 className="animate-spin h-4 w-4" />,
    label: 'Submitting...',
    color: 'bg-blue-600',
  },
  [SubmissionStatus.SUCCESS]: {
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Submitted!',
    color: 'bg-green-600',
  },
  [SubmissionStatus.ERROR]: {
    icon: <XCircle className="h-4 w-4" />,
    label: 'Retry',
    color: 'bg-red-600 hover:bg-red-700',
  },
};

export const ChorusSubmitButton: React.FC<ChorusSubmitButtonProps> = ({
  invoiceFile,
  userId,
  recipientSiret,
  invoiceNumber,
  invoiceDate,
  className = '',
  onSuccess,
  onError,
}) => {
  const [status, setStatus] = useState<SubmissionStatus>(SubmissionStatus.IDLE);
  const [chorusId, setChorusId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!invoiceFile) {
      setErrorMessage('No invoice file available');
      setStatus(SubmissionStatus.ERROR);
      return;
    }

    setStatus(SubmissionStatus.SUBMITTING);
    setErrorMessage(null);

    try {
      const params: SubmitInvoiceParams = {
        invoiceFile,
        userId,
        recipientSiret,
        invoiceNumber,
        invoiceDate,
      };

      const result = await chorusProxy.submitInvoice(params);

      if (result.success && result.chorusId) {
        setChorusId(result.chorusId);
        setStatus(SubmissionStatus.SUCCESS);
        onSuccess?.(result.chorusId);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      setStatus(SubmissionStatus.ERROR);
      onError?.(message);
    }
  };

  const config = statusConfigs[status];

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSubmit}
        disabled={status === SubmissionStatus.SUBMITTING || !invoiceFile}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${config.color} ${className}`}
      >
        {config.icon}
        {config.label}
      </button>

      {status === SubmissionStatus.ERROR && errorMessage && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === SubmissionStatus.SUCCESS && chorusId && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Chorus ID: {chorusId}</span>
        </div>
      )}
    </div>
  );
};
```

#### 3.3 Integrate with Invoice Generation

Modify your existing invoice generation flow to include Chorus Pro submission:

**Example integration point (in your existing code):**
```tsx
// After successful invoice generation
const handleGenerateAndSubmit = async () => {
  // 1. Generate invoice (your existing logic)
  const invoiceFile = await generateFacturX(invoiceData);

  // 2. Show success + Chorus Pro option
  setGeneratedFile(invoiceFile);
  setShowChorusOption(true);
};

// In your JSX
{generatedFile && (
  <div className="mt-4 p-4 border rounded-lg">
    <p className="text-green-600 mb-4">✅ Invoice generated successfully!</p>
    
    <div className="flex gap-4">
      <button 
        onClick={() => downloadFile(generatedFile)}
        className="px-4 py-2 bg-gray-200 rounded-lg"
      >
        Download
      </button>
      
      <ChorusSubmitButton
        invoiceFile={generatedFile}
        userId={currentUser.id}
        recipientSiret={invoiceData.buyer.siret}
        invoiceNumber={invoiceData.number}
        invoiceDate={invoiceData.date}
        onSuccess={(chorusId) => {
          // Track successful submission
          analytics.track('Chorus Pro Submission', { chorusId });
        }}
        onError={(error) => {
          // Track error
          analytics.track('Chorus Pro Error', { error });
        }}
      />
    </div>
  </div>
)}
```

#### 3.4 Add Configuration to Vite

**vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_CHORUS_WORKER_URL': JSON.stringify(
      process.env.VITE_CHORUS_WORKER_URL || 'https://chorus-proxy.your-domain.workers.dev'
    ),
  },
});
```

**.env**
```
VITE_CHORUS_WORKER_URL=https://chorus-proxy.your-domain.workers.dev
```

### Deliverables
- [ ] Chorus proxy client library
- [ ] Chorus Submit Button component
- [ ] Integration with invoice generation flow
- [ ] Success/error handling UI
- [ ] Loading states

### Estimated Time
- **Client Library**: 2-3 hours
- **UI Component**: 3-4 hours
- **Integration**: 2-3 hours
- **Testing**: 2-4 hours

---

## 🧪 Phase 4: Testing (Week 4)

### Objective
Ensure the integration works correctly with Chorus Pro sandbox and production environments.

### Test Cases

#### 4.1 Unit Tests

**Worker Tests (using vitest or jest):**
```typescript
// tests/auth.test.ts
import { getChorusToken } from '../src/utils/auth';
import { Env } from '../src/index';

describe('Chorus Authentication', () => {
  it('should fetch and cache token', async () => {
    const mockEnv: Partial<Env> = {
      CHORUS_CLIENT_ID: 'test_client',
      CHORUS_CLIENT_SECRET: 'test_secret',
      CHORUS_TOKEN_URL: 'https://mock-chorus.gouv.fr/oauth/token',
      TOKEN_KV: {
        get: async () => null,
        put: async () => {},
      } as any,
    };

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'test_token' }),
    });

    const token = await getChorusToken(mockEnv as Env);
    expect(token).toBe('test_token');
  });
});
```

#### 4.2 Integration Tests

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Valid PDF submission | Submit valid Factur-X PDF | 200 OK, returns chorusId |
| Invalid file type | Submit non-PDF file | 400 Bad Request |
| Missing userId | Submit without userId | 400 Bad Request |
| Chorus API error | Chorus returns error | 500, error details |
| Token expiration | Token expired | Auto-refresh, success |
| Large file | Submit >10MB file | 400 Bad Request |

#### 4.3 End-to-End Tests

1. **Manual Testing with Sandbox**
   - Generate invoice in e-nvoice
   - Click "Submit to Chorus Pro"
   - Verify invoice appears in Chorus Pro sandbox
   - Check status updates

2. **Error Scenario Testing**
   - Invalid SIRET
   - Missing required fields
   - Network errors
   - Token expiration

3. **Performance Testing**
   - Measure submission time
   - Test concurrent submissions
   - Verify rate limiting

#### 4.4 User Acceptance Testing

- [ ] Test with 3-5 real users
- [ ] Collect feedback on UX
- [ ] Verify success rate
- [ ] Document any issues

### Deliverables
- [ ] Unit test suite for Worker
- [ ] Integration test results
- [ ] E2E test documentation
- [ ] Bug report (if any)

### Estimated Time
- **Test Setup**: 2 hours
- **Manual Testing**: 4-6 hours
- **Automated Tests**: 4-8 hours
- **Bug Fixes**: Variable

---

## 🚀 Phase 5: Deployment & Monitoring (Week 5)

### Objective
Deploy the integration to production and set up monitoring.

### Tasks

#### 5.1 Production Deployment

**Deploy Worker:**
```bash
# Deploy to production
npm run deploy

# Or via wrangler
wrangler deploy
```

**Deploy Frontend:**
```bash
npm run build
npm run preview  # Test build
# Deploy to your hosting (GitHub Pages, Vercel, etc.)
```

#### 5.2 Environment Configuration

| Environment | Worker URL | Chorus API |
|-------------|------------|-------------|
| Development | Local/Preview | Sandbox |
| Staging | staging-chorus-proxy.workers.dev | Sandbox |
| Production | chorus-proxy.your-domain.workers.dev | Production |

#### 5.3 Monitoring Setup

**Cloudflare Worker Analytics:**
- Enable Workers Analytics in Cloudflare dashboard
- Monitor:
  - Request volume
  - Error rates
  - Response times
  - KV read/write operations

**Custom Logging:**
```typescript
// Add to Worker handlers
console.log(JSON.stringify({
  event: 'invoice_submission',
  userId: userId,
  chorusId: result.id,
  status: result.status,
  timestamp: new Date().toISOString(),
}));
```

**Error Tracking:**
- Integrate with Sentry, Datadog, or similar
- Track:
  - Submission failures
  - Authentication errors
  - Chorus API errors

#### 5.4 Documentation Updates

**Update README.md:**
```markdown
## ✨ New Feature: Direct Chorus Pro Submission

Users can now submit their Factur-X invoices directly to Chorus Pro without manual upload!

### How to Use

1. Generate your invoice as usual
2. Click the "Submit to Chorus Pro" button
3. Your invoice is automatically sent to Chorus Pro
4. Track submission status with the provided Chorus ID

### Requirements

- Chorus Pro account with PISTE API access
- Valid SIRET for recipient
- Factur-X compatible invoice (automatically generated by e-nvoice)
```

**Add Feature Documentation:**
```markdown
# Chorus Pro Integration Guide

## Overview

e-nvoice now supports direct submission to Chorus Pro, the French government's electronic invoicing platform.

## Setup

No additional setup required for users. Simply generate an invoice and click "Submit to Chorus Pro".

## Requirements

- Recipient must have a valid SIRET
- Invoice must be in Factur-X format (automatically ensured by e-nvoice)
- Chorus Pro account for the recipient

## Status Codes

| Status | Description |
|--------|-------------|
| DEPOSEE | Invoice received by Chorus Pro |
| EN_COURS | Processing in progress |
| ACCEPTEE | Invoice accepted |
| REJETEE | Invoice rejected (check motifRejet) |
| ERREUR | Processing error |

## Troubleshooting

If submission fails:
1. Verify the recipient SIRET is correct
2. Check that all required fields are filled
3. Ensure your invoice number is unique
4. Contact support with your Chorus ID
```

#### 5.5 User Communication

- [ ] Blog post announcement
- [ ] In-app notification
- [ ] Email to existing users
- [ ] Social media announcement

### Deliverables
- [ ] Production deployment
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] User communication sent

### Estimated Time
- **Deployment**: 1-2 hours
- **Monitoring Setup**: 2 hours
- **Documentation**: 2-3 hours
- **Communication**: 1 hour

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Submission Success Rate | > 99% | Worker analytics |
| Average Submission Time | < 2 seconds | Monitoring |
| User Adoption Rate | > 50% of users | Analytics |
| Error Rate | < 1% | Error tracking |
| User Satisfaction | > 4.5/5 | Feedback survey |

---

## ⚠️ Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Chorus Pro API changes | Low | High | Subscribe to API updates, implement versioning |
| Rate limiting by Chorus Pro | Medium | Medium | Implement retry logic, respect rate limits |
| Worker outage | Low | High | Multi-region deployment, fallback to manual upload |
| Token expiration issues | Medium | Medium | Auto-refresh tokens, cache conservatively |
| User credential security | Medium | High | Never store user credentials, use OAuth delegation |
| File size limits | Low | Medium | Validate before upload, clear error messages |

---

## 💰 Cost Estimate

| Item | Cost | Notes |
|------|------|-------|
| Cloudflare Workers | $0-5/month | Free tier covers most use cases |
| KV Storage | $0-1/month | Minimal usage |
| Chorus Pro API | Free | Government service |
| Development | ~40-60 hours | Internal cost |
| **Total** | **$0-10/month** | Scales with usage |

---

## 📅 Timeline Summary

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| Phase 1: Registration | 1-2 weeks | Chorus Pro PISTE access |
| Phase 2: Worker Setup | 1 week | Cloudflare Worker development |
| Phase 3: Frontend Integration | 1 week | UI components, client library |
| Phase 4: Testing | 1 week | Unit, integration, E2E tests |
| Phase 5: Deployment | 1 week | Production, monitoring, docs |
| **Total** | **5-6 weeks** | End-to-end implementation |

---

## 🎓 Dependencies

### External Dependencies
- [ ] Chorus Pro PISTE API access (blocker for production)
- [ ] Cloudflare account with Workers
- [ ] Domain for Worker (optional)

### Internal Dependencies
- [ ] Existing e-nvoice codebase
- [ ] Factur-X generation working correctly
- [ ] User authentication system (for userId)

---

## 📞 Contacts & Resources

### Chorus Pro Resources
- **Portal**: [https://portail.chorus-pro.gouv.fr](https://portail.chorus-pro.gouv.fr)
- **API Documentation**: [https://portail.chorus-pro.gouv.fr/aife_documentation?id=kb_article_view&sysparm_article=KB0013510](https://portail.chorus-pro.gouv.fr/aife_documentation?id=kb_article_view&sysparm_article=KB0013510)
- **Support Email**: support.chorus-pro@finances.gouv.fr
- **Phone**: 0809 540 550 (France)

### Development Resources
- **Cloudflare Workers Docs**: [https://developers.cloudflare.com/workers/](https://developers.cloudflare.com/workers/)
- **Wrangler CLI**: [https://github.com/cloudflare/wrangler2](https://github.com/cloudflare/wrangler2)
- **Factur-X Specification**: [https://fnfe-mpe.org/factur-x](https://fnfe-mpe.org/factur-x)

---

## ✅ Acceptance Criteria

### Minimum Viable Product (MVP)
- [ ] Users can submit Factur-X invoices to Chorus Pro sandbox
- [ ] Worker authenticates with Chorus Pro using client credentials
- [ ] Basic error handling and user feedback
- [ ] Submission status returned to user

### Full Feature Set
- [ ] Production Chorus Pro integration
- [ ] Token caching and auto-refresh
- [ ] Status tracking endpoint
- [ ] Webhook support for status updates
- [ ] Comprehensive error handling
- [ ] Monitoring and analytics
- [ ] Documentation and user guide

---

## 📝 Appendix

### A. Chorus Pro API Endpoints Reference

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/oauth/token` | POST | Get access token | Basic Auth (client credentials) |
| `/api/v1/factures` | POST | Submit invoice | Bearer token |
| `/api/v1/factures/{id}` | GET | Get invoice details | Bearer token |
| `/api/v1/factures` | GET | List invoices | Bearer token |
| `/api/v1/etats/{id}` | GET | Get processing status | Bearer token |
| `/api/v1/etats` | GET | List processing states | Bearer token |

### B. Required Invoice Metadata

When submitting to Chorus Pro, ensure these fields are included:

```json
{
  "identifiantEmetteur": "YOUR_SIRET",
  "identifiantDestination": "RECIPIENT_SIRET",
  "numeroFacture": "INV-2026-001",
  "dateFacture": "2026-01-01",
  "fichier": "Factur-X PDF or XML"
}
```

### C. Error Codes Reference

| Code | Description | Action |
|------|-------------|--------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Refresh token, check credentials |
| 403 | Forbidden | Check API access rights |
| 404 | Not Found | Verify endpoint URL |
| 429 | Too Many Requests | Implement retry with backoff |
| 500 | Server Error | Retry later, contact support |

### D. Glossary

| Term | Definition |
|------|------------|
| **PISTE** | Plateforme d'Intermédiation, de Services et de Traitements Électroniques - Chorus Pro's API-first service |
| **Flux** | Traditional Chorus Pro service for manual processes |
| **Factur-X** | Hybrid PDF/A-3 format with embedded XML (UN/CEFACT CrossIndustryInvoice) |
| **EN 16931** | European standard for electronic invoicing |
| **SIRET** | French business identifier (14 digits) |
| **KV** | Cloudflare Key-Value storage |
| **Worker** | Cloudflare serverless function |

---

> **Note**: This plan assumes Chorus Pro PISTE API availability and may need adjustment based on actual API requirements and response times.

---

*Document generated for e-nvoice project - Chorus Pro Integration*