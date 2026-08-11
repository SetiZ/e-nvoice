import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Lazy load WebMCP server to defer heavy imports
const initWebMcp = async () => {
  const { WebMcpServer } = await import('./utils/webMcp.ts');
  WebMcpServer.getInstance().init();
};

// Initialize WebMCP asynchronously after the app loads
// This prevents it from blocking the main thread during initial render
setTimeout(initWebMcp, 0);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
