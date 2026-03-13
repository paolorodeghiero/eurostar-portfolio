# Services and Business Logic

Business logic is organized in `lib/` modules. These are pure functions that can be imported by route handlers.

## JWT Validator (`lib/jwt-validator.ts`)

Validates EntraID JWT tokens using JWKS.

```typescript
import { validateToken, JwtPayload } from './lib/jwt-validator.js';

const payload = await validateToken(bearerToken);
// payload.oid - User ID
// payload.email - User email
// payload.name - Display name
// payload.groups - Array of group IDs
```

JWKS client configuration:
- Keys cached
- Rate limited to 10 requests/minute
- Validates RS256 algorithm

## Project ID Generator (`lib/project-id-generator.ts`)

Generates unique project IDs in format `PRJ-YYYY-NNNNN`.

```typescript
import { generateProjectId } from './lib/project-id-generator.js';

const projectId = await generateProjectId();
// Returns: "PRJ-2026-00001"
```

Uses atomic upsert on `project_id_counters` table to ensure uniqueness under concurrent access. Counter resets each calendar year.

## Currency Converter (`lib/currency-converter.ts`)

Converts amounts between currencies using rates from the database.

### Get Exchange Rate

```typescript
import { getExchangeRate } from './lib/currency-converter.js';

const rate = await getExchangeRate(db, 'GBP', 'EUR', new Date('2026-01-15'));
// Returns rate string or null if not found
```

Looks up rate valid for the given date (within `validFrom` and `validTo` range).

### Convert Currency

```typescript
import { convertCurrency } from './lib/currency-converter.js';

const eurAmount = await convertCurrency(
  db,
  '1000.00',  // amount
  'GBP',      // from
  'EUR',      // to
  new Date()  // date for rate lookup
);
// Returns converted amount as string with 2 decimal places
// Throws if rate not found
```

### Batch Conversion

```typescript
import { convertBatchCurrency } from './lib/currency-converter.js';

const results = await convertBatchCurrency(
  db,
  [
    { amount: '100.00', currency: 'GBP' },
    { amount: '200.00', currency: 'EUR' },
  ],
  'EUR',      // target currency
  new Date()
);
// Returns array of converted amounts
// Falls back to original amount if conversion fails
```

## Competence Month Extractor (`lib/competence-month.ts`)

Extracts competence month from invoice descriptions using regex patterns stored in the database.

### Normalize Month Format

```typescript
import { normalizeMonthFormat } from './lib/competence-month.js';

normalizeMonthFormat('2024/01');    // "2024-01"
normalizeMonthFormat('01/2024');    // "2024-01"
normalizeMonthFormat('Jan 2024');   // "2024-01"
normalizeMonthFormat('invalid');    // null
```

### Extract From Description

```typescript
import { extractCompetenceMonth } from './lib/competence-month.js';

const result = await extractCompetenceMonth(
  db,
  'Invoice for January 2026 services',
  'THIF'  // company
);
// result.month - "2026-01" or null
// result.extracted - true if pattern matched
```

Patterns are stored in `competence_month_patterns` table per company. Each pattern uses a named capture group `(?<month>...)`.

## Cost T-shirt Deriver (`lib/cost-tshirt.ts`)

Derives cost T-shirt size (XS, S, M, L, XL, XXL) from total budget.

```typescript
import { deriveCostTshirt } from './lib/cost-tshirt.js';

const size = await deriveCostTshirt(db, '150000.00', 'EUR');
// Returns size string or null if no thresholds for currency
```

Queries `cost_tshirt_thresholds` table for the currency, ordered by `maxAmount`. Returns the first size where budget <= threshold.

## Committee Level Logic (`lib/committee.ts`)

Manages committee workflow states and level determination.

### State Transitions

```typescript
import { canTransition, getAllowedTransitions, CommitteeState } from './lib/committee.js';

canTransition('draft', 'presented');     // true
canTransition('approved', 'draft');      // false (terminal state)

getAllowedTransitions('draft');          // ['presented']
getAllowedTransitions('discussion');     // ['approved', 'rejected', 'presented']
getAllowedTransitions(null);             // ['draft']
```

State machine:
```
null -> draft -> presented -> discussion -> approved
                     |             |
                     +-> rejected  +-> rejected
                                   |
                                   +-> presented (back)
```

### Level Determination

```typescript
import { determineCommitteeLevel } from './lib/committee.js';

const level = await determineCommitteeLevel(db, 150000);
// Returns: 'mandatory' | 'optional' | 'not_necessary'
```

Queries `committee_thresholds` joined with `committee_levels`. Returns level name where budget <= maxAmount (null maxAmount = unlimited).

## Excel Parser (`lib/excel-parser.ts`)

Validates and parses Excel imports.

### File Validation

```typescript
import { validateExcelFile } from './lib/excel-parser.js';

const result = validateExcelFile(buffer);
// result.valid - boolean
// result.error - string if invalid
```

Checks magic bytes for XLSX (ZIP) or XLS (OLE2) format.

### Row Validation Schemas

Zod schemas for each import type:

**Budget Lines:**
```typescript
{
  Company: string,
  Department: string,
  CostCenter: string,
  LineValue: string,
  Amount: number (positive),
  Currency: string (3 chars),
  Type: 'CAPEX' | 'OPEX',
  FiscalYear: number (2020-2100)
}
```

**Receipts:**
```typescript
{
  ProjectId: string (PRJ-YYYY-XXXXX format),
  ReceiptNumber: string,
  Company: string,
  PurchaseOrder: string,
  Amount: number (positive),
  Currency: string (3 chars),
  Date: string,
  Description?: string
}
```

**Invoices:**
```typescript
{
  Company: string,
  InvoiceNumber: string,
  PurchaseOrder: string,
  Amount: number (positive),
  Currency: string (3 chars),
  Date: string,
  CompetenceMonth?: string (YYYY-MM),
  Description?: string
}
```

### Validation Functions

```typescript
import {
  parseExcelBuffer,
  validateBudgetLineRows,
  validateReceiptRows,
  validateInvoiceRows
} from './lib/excel-parser.js';

const rawData = parseExcelBuffer(buffer);
const { valid, errors } = validateBudgetLineRows(rawData);
// valid - array of typed rows
// errors - array of { row: number, message: string }
```

## Plugins

### Database Plugin (`plugins/db.ts`)

Decorates Fastify instance with Drizzle database:

```typescript
fastify.db // NodePgDatabase instance
```

Also sets PostgreSQL session variable for audit triggers:

```typescript
// In preHandler hook
await fastify.db.execute(
  sql`SELECT set_config('app.current_user_email', ${userEmail}, false)`
);
```

### Auth Plugin (`plugins/auth.ts`)

Adds `preValidation` hook that:
1. Skips `/health` and `/docs/*`
2. In dev mode: sets mock admin user
3. In production: validates JWT and extracts user claims

### Dev Mode (`plugins/dev-mode.ts`)

Returns mock user for local development:

```typescript
{
  id: 'dev-user',
  email: 'dev@eurostar.com',
  name: 'Development User',
  role: 'admin'
}
```

### Swagger Plugin (`plugins/swagger.ts`)

Configures OpenAPI 3.0.3 documentation:
- Available at `/docs`
- Auto-tags routes based on URL path
- Bearer JWT security scheme
- Eurostar teal theme
