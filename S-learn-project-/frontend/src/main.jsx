import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import { InstallProvider } from './context/InstallContext.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration skipped:', error);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <InstallProvider>
        <App />
      </InstallProvider>
    </SettingsProvider>
  </StrictMode>,
)
