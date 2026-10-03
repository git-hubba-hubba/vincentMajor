import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SiteTextProvider from './components/SiteTextProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteTextProvider><App /></SiteTextProvider>
  </StrictMode>,
)
