
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/style.css';
import App from './App.jsx'
import LanguageProvider from './context/LanguageProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
