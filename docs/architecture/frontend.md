# Frontend Architecture

Single-page application for portfolio operations and admin management.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| React 19 | Component framework |
| TypeScript 5.7 | Type safety |
| Vite 6.1 | Build tool and dev server |
| Tailwind CSS 4.1 | Styling with Eurostar brand colors |
| Radix UI | Accessible component primitives |
| TanStack Table 8.21 | Data table with sorting, filtering |
| React Router 7.13 | Client-side routing |
| Recharts 3.7 | Data visualization |
| MSAL | Microsoft Entra ID authentication |

## Directory Structure

```
frontend/src/
├── App.tsx                 # Root router with dev mode detection
├── main.tsx               # Entry point
├── index.css              # Global styles and Tailwind config
├── pages/
│   ├── portfolio/         # Main portfolio view
│   └── admin/             # Admin referential management
├── components/
│   ├── portfolio/         # Portfolio table components
│   │   └── columns/       # Cell renderers (BudgetHealth, Impact, etc.)
│   ├── projects/          # Project detail sidebar
│   │   └── tabs/          # Sidebar tab panels
│   ├── admin/             # Admin CRUD components
│   └── ui/                # Reusable UI primitives
├── hooks/                 # Custom React hooks
└── lib/                   # Utilities and API clients
    ├── api-client.ts      # Axios-based API wrapper
    ├── auth-config.ts     # MSAL configuration
    └── effort-utils.ts    # Effort scoring helpers
```

## Component Hierarchy

```
App
├── AuthProvider (MSAL wrapper)
├── Router
│   ├── /portfolio → PortfolioPage
│   │   ├── DataTable (TanStack)
│   │   │   └── Column renderers (BudgetHealth, Status, Teams, etc.)
│   │   └── ProjectSidebar (detail view)
│   │       └── Tabs (Info, Value, Budget, Actuals, History)
│   └── /admin → AdminPage
│       └── Referential tables (Departments, Teams, Statuses, etc.)
└── ToastProvider (notifications)
```

## Data Flow

1. **API Client** (`lib/api-client.ts`) wraps Axios with:
   - Base URL configuration
   - JWT token injection from MSAL
   - Error response handling

2. **Page components** fetch data on mount:
   - Portfolio loads projects list
   - Admin loads referential data

3. **TanStack Table** handles:
   - Sorting state
   - Filter state
   - Column visibility

4. **Sidebar** receives selected project and makes detail API calls

## Authentication Flow

```
1. App loads → Check MSAL session
2. No session → Redirect to Entra ID login
3. Login success → Store tokens
4. API calls → Inject Bearer token
5. Dev mode (DEV_MODE=true) → Skip auth, use mock user
```

## Styling Approach

- Tailwind with custom Eurostar colors (`teal-700: #006B6B`)
- Radix UI for accessible primitives (Dialog, Dropdown, Tooltip)
- Component-level styles via Tailwind classes
- No CSS modules or styled-components
