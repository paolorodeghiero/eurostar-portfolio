# Frontend Overview

The frontend is a React single-page application built with Vite and TypeScript, implementing a portfolio management interface for IT projects.

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI framework |
| TypeScript | 5.7.3 | Type safety |
| Vite | 6.1.0 | Build tool and dev server |
| Tailwind CSS | 4.1.18 | Utility-first styling |
| TanStack Table | 8.21.3 | Data table with sorting, filtering, virtual scroll |
| TanStack Virtual | 3.13.18 | Virtual scrolling for large lists |
| React Router DOM | 7.13.0 | Client-side routing |
| MSAL React | 5.0.3 | Azure AD authentication |
| Radix UI | Various | Accessible UI primitives |
| Recharts | 3.7.0 | Charts and visualizations |
| Tiptap | 3.19.0 | Rich text editor |
| date-fns | 4.1.0 | Date formatting |
| lucide-react | 0.563.0 | Icon library |
| dnd-kit | 6.3.1 | Drag and drop |

### Development Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.0.18 | Unit testing |
| Testing Library | 16.3.2 | React component testing |
| Playwright | 1.58.2 | E2E testing |
| MSW | 2.12.10 | API mocking |

## Directory Structure

```
frontend/src/
  main.tsx              # Application bootstrap
  App.tsx               # Root component with routing
  index.css             # Global styles
  vite-env.d.ts         # Vite type declarations
  components/           # Reusable UI components
    ui/                 # Primitive components (Button, Input, Dialog, etc.)
    portfolio/          # Portfolio table and related components
    projects/           # Project detail sidebar and tabs
    admin/              # Admin CRUD components
    AuthProvider.tsx    # MSAL provider wrapper
    DevAuthProvider.tsx # Development mode authentication
    LoginButton.tsx     # Sign-in button
    UserMenu.tsx        # User dropdown menu
  pages/                # Route-level components
    portfolio/          # Main portfolio view
    admin/              # Admin pages for referential data
  hooks/                # Custom React hooks
  lib/                  # API clients and utilities
```

## Entry Points

### main.tsx
Bootstrap sequence:
1. Waits for MSAL initialization
2. Handles redirect response from Azure AD login
3. Sets active account if available
4. Renders App component in StrictMode

### App.tsx
Root component responsibilities:
- Wraps application in `BrowserRouter`
- Provides `DevAuthProvider` for development mode detection
- Conditionally renders:
  - Dev mode: Routes directly (no MSAL)
  - Production: `AuthProvider` with `AuthenticatedTemplate`/`UnauthenticatedTemplate`

### Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | PortfolioPage | Main portfolio table view |
| `/admin` | AdminLayout | Admin panel wrapper |
| `/admin/departments` | DepartmentsPage | Manage departments |
| `/admin/teams` | TeamsPage | Manage teams |
| `/admin/statuses` | StatusesPage | Manage project statuses |
| `/admin/outcomes` | OutcomesPage | Manage value outcomes |
| `/admin/cost-centers` | CostCentersPage | Manage cost centers |
| `/admin/budget-lines` | BudgetLinesPage | Manage budget lines |
| `/admin/currency-rates` | CurrencyRatesPage | Manage exchange rates |
| `/admin/committee-levels` | CommitteeLevelsPage | Manage committee levels |
| `/admin/committee-thresholds` | CommitteeThresholdsPage | Manage committee thresholds |
| `/admin/cost-tshirt-thresholds` | CostTshirtThresholdsPage | Manage t-shirt size thresholds |
| `/admin/competence-month-patterns` | CompetenceMonthPatternsPage | Manage competence patterns |
| `/admin/audit-log` | AuditLogPage | View audit log |

## Build Commands

```bash
npm run dev          # Start development server
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build
npm run test         # Run Vitest
npm run test:ui      # Vitest with UI
npm run e2e          # Run Playwright tests
npm run e2e:headed   # Playwright with browser visible
```

## Path Aliases

The project uses `@/` as an alias for the `src/` directory, configured in Vite.

```typescript
// Example imports
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
```
