import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Lazy load WebMCP server to defer heavy imports
const initWebMcp = async () => {
  const { getWebMcpServer } = await import('./utils/webMcp.ts');
  getWebMcpServer().init();
};

// Initialize WebMCP asynchronously after the app loads.
// init() imports no heavy PDF libs (those lazy-load on tool call), so this is near-synchronous.
void initWebMcp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
