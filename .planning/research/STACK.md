# Stack Research

**Domain:** IT Portfolio Management Tool
**Researched:** 2026-02-03
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.9+ | Type-safe development | Industry standard for enterprise apps. Version 5.9 is latest stable (as of Feb 2025), with 5.7+ bringing improved error reporting and V8 compile caching. Essential for full-stack type safety. |
| Node.js | 20 LTS (20.19+) | Backend runtime | Vite 6 and Fastify 5 both target Node 20+. Provides native ESM support, TypeScript type stripping (22+), and stable LTS support through April 2026. |
| Fastify | 5.x | Backend framework | Fast and low-overhead framework with first-class TypeScript support. Version 5 GA released in 2025, targets Node 20+, removes deprecated APIs. Better performance than Express, excellent for low-volume business apps with potential to scale. |
| React | 19.2+ | Frontend framework | Latest stable version (19.2.1 released Dec 2025) with improved TypeScript support, concurrent rendering, and better hooks API. Industry standard with massive ecosystem. useRef improvements simplify type signatures. |
| Vite | 6.x | Frontend build tool | Latest version with native ESM and TypeScript support. Requires Node 20.19+. Fast HMR, optimized production builds. Standard for React projects in 2025. |
| PostgreSQL | 16+ | Relational database | Robust, proven database for enterprise apps. Version 16 recommended for new projects. Excellent TypeScript ORM support. |
| Drizzle ORM | 0.45.1 (stable) | Database ORM | Lightweight (~7.4kb), code-first ORM with excellent TypeScript support. Better for serverless/Azure Container Apps than Prisma due to minimal cold start overhead. No code generation, SQL-like query builder. Current stable: 0.45.1, Beta: 1.0.0-beta.2 (use stable for production). |

### Frontend Stack

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest | UI component library | Pre-built components with Tailwind v4 support. Gives you full code ownership (copy-paste components). Perfect for Linear/Notion-like modern UIs. Updated for React 19 (forwardRefs removed). |
| Tailwind CSS | 4.x | Styling framework | shadcn/ui now uses Tailwind v4 with OKLCH colors and @theme directive. Utility-first CSS, minimal bundle size, excellent for custom UIs. |
| TanStack Query | 5.90+ | Server state management | De facto standard for API data fetching/caching. v5 requires React 18+. Handles loading/error states, caching, background refetching. Essential for REST API integration. |
| Zustand | 5.x | Client state management | Lightweight (~2KB) state management for UI state. Simpler than Redux Toolkit for low-volume business apps. Use for: form state, UI toggles, local preferences. Let TanStack Query handle server state. |
| React Hook Form | 7.x | Form management | TypeScript-first form library with excellent DX. Minimal re-renders. Perfect for complex forms (project scoring, budget allocation). Pairs well with Zod for validation. |
| Zod | 3.x | Schema validation | Zero-dependency TypeScript-first validation. Share schemas between frontend/backend. Generate TypeScript types from schemas (single source of truth). Integrates with React Hook Form, Fastify, and OpenAPI. |
| date-fns | 3.x | Date manipulation | Lightweight, tree-shakable, functional date utilities. Better bundle size than Luxon. Sufficient for business app date handling (no complex timezone scenarios). Use date-fns-tz if timezone support needed. |
| Recharts | 2.x | Charts/visualization | React-based charts for dashboards. Simpler than D3, sufficient for portfolio metrics. |

### Backend Stack

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fastify/swagger | 9.x | OpenAPI/Swagger docs | Auto-generate API documentation from route schemas. Use with Zod schemas for type-safe API definitions. Supports OpenAPI 3.0.3. |
| @fastify/cors | 10.x | CORS handling | Enable CORS for frontend-backend communication during development and production. |
| @azure/msal-node | 2.x | Azure EntraID auth | Official Microsoft library for EntraID authentication in Node.js. Handle token acquisition, validation. Latest stable with continuous 2025 updates. |
| Pino | 10.x | Structured logging | Fastest JSON logger for Node.js (10.2.0 latest). Requires Node 20+. Asynchronous, non-blocking. Gold standard for production logging. Use pino-http for request logging. |
| drizzle-kit | 0.45+ | Database migrations | Transparent SQL migration generator. Generates migration files you can review/edit. Less "magic" than Prisma Migrate but requires manual validation. |
| @fastify/type-provider-zod | 2.x | Type-safe routes | Connect Zod schemas to Fastify for runtime validation + TypeScript types + OpenAPI docs from single definition. |

### Infrastructure & DevOps

| Tool | Purpose | Notes |
|------|---------|-------|
| Docker | Containerization | Multi-stage builds: compile TypeScript in build stage, copy compiled output to lean runtime image. Reduces cold start times. |
| Docker Compose | Local development | Orchestrate PostgreSQL + backend + frontend locally. Use bitnami/postgresql:16 or postgres:16 for database. |
| Azure Container Apps | Production hosting | Managed Kubernetes with autoscaling. Supports Docker containers. Integrates with Azure Database for PostgreSQL. |
| Azure Database for PostgreSQL | Managed database | Fully managed PostgreSQL with EntraID authentication support. Reduces operational burden. Better than containerized PostgreSQL for production. |

### Development Tools

| Tool | Purpose | Configuration Notes |
|------|---------|---------------------|
| Vitest | Testing framework | Latest: 4.0.17. Next-gen test runner powered by Vite. Out-of-box TypeScript, ESM, JSX support. Use for both frontend and backend tests. |
| ESLint | Code linting | ESLint 9 with flat config format. Use @typescript-eslint/parser and @typescript-eslint/eslint-plugin. |
| Prettier | Code formatting | Use eslint-config-prettier to prevent conflicts. Separate concerns: ESLint for code quality, Prettier for formatting. |
| tsx | TypeScript execution | Run TypeScript directly in Node.js without separate compilation step. Useful for scripts and development. |

## Installation

### Backend
```bash
# Core framework
npm install fastify@5 @fastify/cors @fastify/swagger

# Database
npm install drizzle-orm@0.45 postgres
npm install -D drizzle-kit@0.45

# Authentication
npm install @azure/msal-node

# Validation & type safety
npm install zod @fastify/type-provider-zod

# Logging
npm install pino pino-http

# Utilities
npm install date-fns

# Dev dependencies
npm install -D @types/node typescript@5.9 tsx vitest
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### Frontend
```bash
# Create Vite project with React + TypeScript
npm create vite@latest frontend -- --template react-ts

# Core libraries
npm install @tanstack/react-query zustand react-hook-form zod

# UI & styling (install shadcn/ui via CLI after project setup)
npm install tailwindcss@4 @tailwindcss/postcss
npx shadcn@latest init

# Utilities
npm install date-fns recharts

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### Power BI Integration
```bash
# Power BI embedding (frontend only)
npm install powerbi-client
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Backend framework | Fastify 5 | NestJS | If you prefer opinionated MVC structure, dependency injection, decorators. NestJS adds significant complexity; overkill for low-volume business app. |
| Backend framework | Fastify 5 | Express.js | Never for new projects. Express lacks native TypeScript support, slower than Fastify, ecosystem fragmented. |
| ORM | Drizzle | Prisma | If team prefers schema-first approach and heavy tooling. Prisma Migrate is easier but requires Prisma Engine binary (larger cold starts). Trade DX for performance. |
| Frontend framework | React 19 | Vue 3 / Svelte 5 | If team has strong preference. React has larger ecosystem, more enterprise adoption, better Azure/Power BI integration examples. |
| Build tool | Vite 6 | Webpack | Never for new React projects. Vite is faster, simpler config, better DX. Webpack is legacy. |
| State management | Zustand + TanStack Query | Redux Toolkit | For complex apps with many collaborators needing strict patterns. RTK adds boilerplate; unnecessary for low-volume business app. Hybrid approach: Zustand for UI state, TanStack Query for server state is modern standard. |
| UI library | shadcn/ui | Ant Design / MUI | If you want pre-built enterprise components without customization. shadcn/ui gives code ownership, easier to customize for Linear/Notion aesthetic. |
| Validation | Zod | Yup / Joi | Yup lacks first-class TypeScript inference. Joi doesn't support browser (backend-only). Zod is TypeScript-native and isomorphic. |
| Date library | date-fns | Luxon | If you need complex timezone handling and internationalization. Luxon is slower (built on Intl API) and not tree-shakable. For business app with mostly user-local dates, date-fns is sufficient. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Moment.js | Deprecated, huge bundle size, mutable API. Official docs recommend alternatives. | date-fns or Luxon |
| TypeORM | Poor TypeScript inference, overly complex decorators, slower than Drizzle/Prisma. Limited serverless support. | Drizzle ORM |
| Express.js | Lacks native TypeScript support, slower than Fastify, no built-in schema validation, community fragmented. | Fastify 5 |
| Create React App | Deprecated, uses Webpack, slow builds, no longer maintained. | Vite (npm create vite) |
| Redux (without Toolkit) | Extreme boilerplate, error-prone. Even Redux team recommends Redux Toolkit. | Redux Toolkit or Zustand |
| @azure/msal-browser on backend | Browser-only library. Will cause errors in Node.js. | @azure/msal-node |
| PowerBI-Node | Deprecated. GitHub repo archived. | Direct REST API calls or powerbi-client (frontend) |
| ts-node | Slow, bloated. Not actively maintained. | tsx |
| webpack-dev-server | Slow HMR, complex config. | Vite dev server |

## Stack Patterns by Variant

**If using Azure Container Apps with managed PostgreSQL:**
- Use Azure Database for PostgreSQL Flexible Server (not containerized PostgreSQL)
- Enable managed identity for passwordless authentication
- Configure connection pooling in Drizzle (Azure Database has connection limits)
- Use Azure Key Vault for secrets (not environment files)

**If using Docker Compose for local development:**
- Use bitnami/postgresql:16 or postgres:16 image
- Mount volumes for database persistence
- Use separate compose profiles for frontend/backend/database
- Configure health checks for PostgreSQL before starting backend

**If using EntraID single sign-on (SSO):**
- Use @azure/msal-node for backend token validation
- Use @azure/msal-react (wrapper for @azure/msal-browser) for frontend
- Implement PKCE flow (authorization code with proof key)
- Store tokens in httpOnly cookies (not localStorage)
- Use on-behalf-of flow if backend needs to call Microsoft Graph

**If Power BI embedding is required:**
- Use powerbi-client library in frontend (2.x latest)
- Embed using "User Owns Data" model (requires EntraID user authentication)
- Generate embed tokens on backend using Power BI REST API
- Configure RLS (Row Level Security) in Power BI for multi-tenant data isolation
- Create snowflake schema views in PostgreSQL for Power BI DirectQuery

**If audit history is required:**
- Use Drizzle triggers or application-level tracking
- Store audit logs in separate PostgreSQL table (not in main tables)
- Include: user ID, timestamp, operation type, before/after state
- Use JSONB columns for flexible schema
- Consider Temporal Tables (PostgreSQL doesn't have native support; use application logic)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Fastify 5.x | Node.js 20.19+ | Dropped Node 18 support |
| Vite 6.x | Node.js 20.19+, 22.12+ | Requires modern Node |
| Vitest 4.x | Vite 6.x | First version supporting Vite 6 |
| React 19.x | TypeScript 5.2+ | Requires modern TS for type inference |
| TanStack Query 5.x | React 18+ | Uses useSyncExternalStore |
| Drizzle 0.45.x | PostgreSQL 12+ | Prefers identity columns over serial (PG 10+) |
| @azure/msal-node 2.x | Node.js 18+ | Active maintenance, 2025 updates |
| Pino 10.x | Node.js 20+ | Dropped Node 18 support |
| Tailwind CSS 4.x | PostCSS 8+ | Uses new @theme directive |

## Architecture Recommendations

### Monorepo vs Multi-repo
**Recommendation:** Monorepo (single repository with frontend/ and backend/ directories)

**Why:**
- Shared TypeScript types between frontend and backend
- Single source of truth for API schemas (Zod schemas)
- Simplified deployment (single Docker image or separate images from one repo)
- Easier to maintain for small team

**Structure:**
```
eurostar-portfolio-gsd/
├── frontend/           # Vite + React + TypeScript
├── backend/            # Fastify + TypeScript
├── shared/             # Shared TypeScript types, Zod schemas
├── docker-compose.yml  # Local development
└── .github/workflows/  # CI/CD
```

### API Design
**Recommendation:** RESTful API with OpenAPI 3.0 documentation

**Why:**
- Power BI integration works with REST APIs (no GraphQL support)
- OpenAPI docs auto-generated from Zod schemas via @fastify/swagger
- Simpler than GraphQL for CRUD operations
- Better caching with HTTP verbs and status codes

### Database Schema
**Recommendation:** Snowflake schema for Power BI, normalized tables for OLTP

**Why:**
- Power BI performs best with star/snowflake schemas
- Create views for Power BI reporting (don't expose raw tables)
- Keep normalized tables for transactional operations
- Use PostgreSQL materialized views for complex aggregations

### Authentication Flow
**Recommendation:** Token-based API authentication with EntraID

**Why:**
- EntraID provides JWT tokens (access tokens + ID tokens)
- Frontend: Use @azure/msal-react for authentication, store tokens in memory
- Backend: Validate JWT tokens using @azure/msal-node
- API routes: Extract user from validated token, enforce RBAC

## Power BI Integration Strategy

### Approach: Embed Power BI reports in React frontend

**Libraries:**
- Frontend: powerbi-client (2.x)
- Backend: Direct REST API calls to Power BI REST API (no SDK needed)

**Authentication:**
- Use "User Owns Data" model (requires EntraID authentication)
- Generate embed tokens on backend using user's access token (on-behalf-of flow)
- Pass embed token to frontend for powerbi-client

**Data Source:**
- Power BI connects to Azure Database for PostgreSQL via DirectQuery
- Create dedicated database views with snowflake schema
- Configure RLS (Row Level Security) in Power BI based on EntraID user attributes

**Alternative (if embedding not required):**
- Export Power BI reports as images/PDFs via REST API
- Display static reports in frontend
- Simpler but less interactive

## Sources

### Context7 & Official Documentation (HIGH confidence)
- TypeScript: [Official Releases](https://github.com/microsoft/typescript/releases) - v5.9.3 latest stable
- Node.js: LTS schedule, Fastify and Vite compatibility requirements
- React: [React 19.2 Official Docs](https://react.dev/blog/2025/10/01/react-19-2)
- Fastify: [v5 GA Release](https://openjsf.org/blog/fastifys-growth-and-success), [TypeScript Support](https://fastify.dev/docs/latest/Reference/TypeScript/)
- Drizzle ORM: [Latest Releases](https://orm.drizzle.team/docs/latest-releases), [npm package](https://www.npmjs.com/package/drizzle-orm)
- Vite: [Releases Page](https://vite.dev/releases), v6 requires Node 20.19+
- TanStack Query: [npm package](https://www.npmjs.com/package/@tanstack/react-query) - v5.90.19 latest
- Vitest: [Official Site](https://vitest.dev/), v4.0.17 latest
- shadcn/ui: [Tailwind v4 Support](https://ui.shadcn.com/docs/tailwind-v4), [React 19 Updates](https://ui.shadcn.com/docs/changelog)
- Pino: [GitHub Releases](https://github.com/pinojs/pino/releases), v10.2.0 latest
- Zod: [Official Docs](https://zod.dev/), TypeScript 5.5+ tested

### Web Search - Verified (MEDIUM confidence)
- [Modern Node.js + TypeScript Setup 2025](https://dev.to/woovi/a-modern-nodejs-typescript-setup-for-2025-nlk)
- [Drizzle vs Prisma 2025](https://www.bytebase.com/blog/drizzle-vs-prisma/)
- [TypeScript ORM Battle 2025](https://thedataguy.pro/blog/2025/12/nodejs-orm-comparison-2025/)
- [Best React UI Frameworks 2025](https://www.arkasoftwares.com/blog/best-react-ui-framework-you-should-know-in-2025/)
- [Fastify TypeScript Guide](https://www.xjavascript.com/blog/fastify-generate-typescript/)
- [Azure Container Apps + PostgreSQL](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-dev-services-postgresql)
- [MSAL Authentication Flows](https://learn.microsoft.com/en-us/entra/identity-platform/msal-authentication-flows)
- [Power BI REST API Docs](https://learn.microsoft.com/en-us/rest/api/power-bi/)
- [PowerBI-JavaScript GitHub](https://github.com/microsoft/PowerBI-JavaScript)
- [date-fns vs Luxon Comparison](https://www.dhiwise.com/post/luxon-vs-date-fns-whats-the-best-for-managing-dates)
- [Zustand vs Redux Toolkit 2025](https://medium.com/@vishalthakur2463/redux-toolkit-vs-react-query-vs-zustand-which-one-should-you-use-in-2025-048c1d3915f4)
- [ESLint + Prettier 2025 Setup](https://medium.com/@leobarri2013/setting-up-prettier-eslint-and-typescript-in-express-2025-6d59f384f00c)

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Backend framework (Fastify) | HIGH | Official v5 release notes, TypeScript docs, npm version verified |
| Frontend framework (React) | HIGH | Official React 19.2 blog post, npm package verified |
| ORM (Drizzle) | HIGH | Official docs, npm package, GitHub releases verified |
| Build tool (Vite) | HIGH | Official releases page, version requirements verified |
| Authentication (MSAL) | HIGH | Official Microsoft Learn docs, npm packages verified |
| State management | MEDIUM | Community consensus from multiple sources, not official guidance |
| UI library (shadcn/ui) | HIGH | Official docs showing Tailwind v4 and React 19 support |
| Power BI integration | MEDIUM | Official REST API docs, but GitHub SDK deprecated (requires custom implementation) |

---
*Stack research for: Eurostar IT Portfolio Management Tool*
*Researched: 2026-02-03*
*Next: Review with project lead before roadmap creation*
