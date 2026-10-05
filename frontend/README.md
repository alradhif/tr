TrackPlus:
A multi-tenant project analytics and management dashboard built with React 19, TypeScript, and Vite. TrackPlus supports four distinct user roles — Admin, Superadmin, Senior Management, and Data Entry — each with its own layout, navigation, and set of pages, backed by a shared component and data layer.
Live demo: track-plus-omega.vercel.app
Features
Configurable dashboard grid — drag-and-drop repositioning and live resizing of widgets via `react-grid-layout`, with a widget library panel to add/remove from a registry of 18 widgets (KPI cards, donut charts, trend charts, and list views) rendered with Recharts.
Full authentication flow — login, two-factor verification (OTP), forgot-password, and set-new-password screens.
Role-based application shells — Admin/Superadmin dashboards, a Senior Management view (departments, company drill-downs, project tracking), and a Data Entry workspace (projects, risks, change requests, stage tracking, timeline, "what-if" scenario view).
Bilingual AI assistant panel — an in-app chat panel answering natural-language questions about goals, risks, and project status, with full Arabic RTL support alongside English.
Company, tenant, and subscription management — list/detail views for companies and tenants, subscription tracking, and a full audit log page.
PPTX export — a dedicated data-entry view for generating PowerPoint-style output from project data.
RTL-first UI — layouts, navigation, and the assistant panel are all built to support right-to-left (Arabic) rendering natively, not as an afterthought.
Tech Stack
Framework: React 19, TypeScript, Vite
Styling: Tailwind CSS
Data visualization: Recharts
Dashboard layout engine: react-grid-layout
Icons: lucide-react
Linting: oxlint
Project Structure
```
src/
├── components/
│   ├── app/           # App shell, banners, logo
│   ├── auth/           # Login, 2FA, password recovery flow
│   ├── assistant/       # AI assistant chat panel
│   ├── audit/           # Audit log page
│   ├── companies/       # Company management
│   ├── dashboard/        # Widget grid, widget library, widget components
│   ├── dataentry/        # Data-entry role pages and workflows
│   ├── goals/           # Strategic goals tracking
│   ├── landing/          # Marketing/landing page
│   ├── layout/           # Shared shell, header, sidebar
│   ├── projectDetails/     # Project detail views
│   ├── senior/           # Senior management role pages
│   ├── subscriptions/       # Subscription tracking
│   ├── tenants/          # Tenant management
│   └── ui/              # Shared UI primitives
├── config/             # Widget registry and theme config
├── context/             # Tenant and package context providers
├── data/               # Mock datasets
├── lib/                # Data stores (companies, departments)
└── types/              # Shared TypeScript types
```
Getting Started
```bash
npm install
npm run dev
```
a```bash
npm run build
```
Status
This is a front-end prototype built around realistic mock data to demonstrate the full application flow end-to-end — dashboard analytics, role-based navigation, authentication, and data-entry workflows — rather than a production system connected to a live backend.
