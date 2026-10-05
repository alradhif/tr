import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { brandAssets } from '@/assets'
import './i18n'
import './theme/tokens.css'
import './design/portal-layout.css'
import './design/ui.css'
import './design/trend-kpi-card.css'
import './index.css'
import './design/senior-project-detail.css'
import './design/senior-companies.css'
import './design/departments.css'
import './org-catalog/catalog-shell.css'
import './org-catalog/goals.css'
import './org-catalog/subpage-header.css'
import './org-catalog/project-detail.css'
import './org-catalog/catalog-form.css'
import './org-catalog/create-project.css'
import './org-catalog/add-goal.css'
import App from './App.tsx'

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
if (favicon) favicon.href = brandAssets.favicon

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
