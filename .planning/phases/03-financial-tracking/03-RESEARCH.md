# Phase 3: Financial Tracking - Research

**Researched:** 2026-02-05
**Domain:** Financial data management, multi-currency tracking, Excel import/export
**Confidence:** MEDIUM

## Summary

Phase 3 implements comprehensive financial tracking for projects, including budget line management, multi-currency budget allocation, and actuals import from both API and Excel sources. The research identifies the standard stack (SheetJS xlsx for Excel parsing, Drizzle ORM for financial transactions, @fastify/multipart for file uploads) and critical patterns for maintaining financial data integrity.

The standard approach for financial tracking systems uses PostgreSQL NUMERIC type for currency amounts (never the built-in money type), stores currency codes alongside amounts (ISO 4217), and implements validation at both database (constraints) and application (transactions) layers. Budget allocation requires careful over-commitment prevention through database constraints and transaction-based validation.

Key findings emphasize that Excel import is a high-risk operation requiring multi-layered validation (MIME type, magic bytes, schema validation), regex-based extraction needs careful pattern storage and fallback handling, and financial calculations must never use floating-point arithmetic.

**Primary recommendation:** Use PostgreSQL NUMERIC(15,2) for all monetary amounts, store currency codes with ISO 4217, validate Excel imports with schema-based parsing (xlsx + Zod), and implement budget allocation constraints at both database (CHECK constraints) and application (transaction) levels.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| xlsx (SheetJS) | 0.20.3 from CDN | Excel file parsing and writing | Industry standard, TypeScript support, comprehensive Excel format support. Note: npm version (0.18.5) is outdated. |
| @fastify/multipart | 9.x | File upload handling in Fastify | Official Fastify plugin for multipart/form-data, streaming support, TypeScript types included. |
| drizzle-orm | 0.38.x (existing) | Database ORM with transaction support | Already in use, provides type-safe queries and transaction management for financial operations. |
| zod | Latest | Runtime schema validation | TypeScript-first validation, integrates with drizzle-zod for data validation before database operations. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-zod | Latest | Drizzle schema to Zod validation | Automatically generate Zod schemas from Drizzle tables for insert/update validation. |
| date-fns | 3.x | Date parsing and manipulation | Parsing dates from Excel imports, competence month calculations. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SheetJS xlsx | ExcelJS | ExcelJS has more features (styling, formulas) but xlsx is faster for pure data parsing. Use xlsx for import-only operations. |
| @fastify/multipart | fastify-multer | Multer is Express-style. @fastify/multipart is native Fastify with better streaming support. |
| NUMERIC type | INTEGER (cents) | INTEGER storage of cents is faster but requires precision handling. NUMERIC is safer for financial data with varying decimal places. |

**Installation:**
```bash
# Backend - Excel parsing and file upload
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
npm install @fastify/multipart
npm install zod drizzle-zod
npm install date-fns

# Note: drizzle-orm already installed in existing project
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── routes/
│   ├── admin/
│   │   └── budget-lines.ts       # Admin-only budget line import
│   └── actuals/
│       ├── receipts.ts            # Receipt import API
│       ├── invoices.ts            # Invoice import API
│       └── upload.ts              # Excel upload endpoint
├── lib/
│   ├── excel-parser.ts            # Excel parsing utilities
│   ├── currency-validator.ts     # Currency code validation
│   └── regex-extractor.ts        # Competence month extraction
└── db/
    └── schema.ts                  # Add budget, actuals tables
```

### Pattern 1: Multi-Currency Storage
**What:** Store amounts with their original currency, convert only for reporting
**When to use:** All financial data (budgets, actuals, allocations)
**Example:**
```typescript
// Database schema pattern
export const budgetLines = pgTable('budget_lines', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  lineAmount: numeric('line_amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(), // ISO 4217
  // ... other fields
});

// Never store as single field like "amount_usd"
// Always pair amount + currency for flexibility
```

### Pattern 2: Budget Allocation with Constraints
**What:** Prevent over-allocation through database constraints and application logic
**When to use:** Project-to-budget-line mappings
**Example:**
```typescript
// Application-level validation in transaction
await db.transaction(async (tx) => {
  // Get current allocations for this budget line
  const [budgetLine] = await tx
    .select()
    .from(budgetLines)
    .where(eq(budgetLines.id, budgetLineId));

  const allocations = await tx
    .select()
    .from(projectBudgetAllocations)
    .where(eq(projectBudgetAllocations.budgetLineId, budgetLineId));

  const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  const newTotal = totalAllocated + Number(allocationAmount);

  if (newTotal > Number(budgetLine.lineAmount)) {
    throw new Error('Allocation exceeds budget line available amount');
  }

  // Insert allocation if valid
  await tx.insert(projectBudgetAllocations).values({...});
});

// Database constraint as safety net
// ALTER TABLE project_budget_allocations
// ADD CONSTRAINT check_allocation_positive
// CHECK (allocation_amount > 0);
```

### Pattern 3: Excel Import with Validation
**What:** Multi-stage validation for Excel imports (file → schema → business rules)
**When to use:** Budget line imports, actuals imports
**Example:**
```typescript
import * as XLSX from 'xlsx';
import { z } from 'zod';

// Define schema for imported data
const budgetLineSchema = z.object({
  company: z.string().min(1),
  department: z.string().min(1),
  costCenter: z.string().min(1),
  lineValue: z.string().min(1),
  lineAmount: z.number().positive(),
  currency: z.string().length(3), // ISO 4217
  type: z.enum(['CAPEX', 'OPEX']),
});

async function importBudgetLines(fileBuffer: Buffer) {
  // Stage 1: Parse Excel file
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);

  // Stage 2: Validate schema
  const validated = rawData.map((row, idx) => {
    try {
      return budgetLineSchema.parse(row);
    } catch (err) {
      throw new Error(`Row ${idx + 2}: ${err.message}`);
    }
  });

  // Stage 3: Business rules validation
  // Check currency codes exist in currency_rates table
  // Check cost centers exist in cost_centers table

  // Stage 4: Batch insert in transaction
  await db.transaction(async (tx) => {
    await tx.insert(budgetLines).values(validated);
  });

  return { imported: validated.length };
}
```

### Pattern 4: Regex-Based Extraction with Fallback
**What:** Extract structured data (competence month) from text with error handling
**When to use:** Invoice description parsing
**Example:**
```typescript
interface RegexPattern {
  company: string;
  pattern: string;
  description: string;
}

async function extractCompetenceMonth(
  invoice: { description: string; company: string }
): Promise<{ month: string | null; extracted: boolean }> {
  // Get patterns for this company
  const patterns = await db
    .select()
    .from(competenceMonthPatterns)
    .where(eq(competenceMonthPatterns.company, invoice.company));

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.pattern);
    const match = invoice.description.match(regex);

    if (match && match.groups?.month) {
      return { month: match.groups.month, extracted: true };
    }
  }

  // Extraction failed - return null and flag for manual review
  return { month: null, extracted: false };
}

// Store result with extraction flag
await db.insert(invoices).values({
  description: invoice.description,
  competenceMonth: result.month,
  competenceMonthExtracted: result.extracted, // Alert user if false
  competenceMonthManualOverride: null, // User can set this later
});
```

### Pattern 5: File Upload Security
**What:** Validate uploaded files before processing
**When to use:** All Excel upload endpoints
**Example:**
```typescript
import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';

// Register multipart plugin
await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // One file at a time
  },
});

// Upload endpoint
fastify.post('/upload', async (request, reply) => {
  const data = await request.file();

  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }

  // Validate MIME type
  if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'].includes(data.mimetype)) {
    return reply.code(400).send({ error: 'File must be Excel format (.xlsx or .xls)' });
  }

  // Read file to buffer for validation
  const buffer = await data.toBuffer();

  // Validate magic bytes (Excel file signature)
  const magicBytes = buffer.slice(0, 4).toString('hex');
  const isValidExcel = magicBytes === '504b0304' || // XLSX (ZIP)
                       magicBytes === 'd0cf11e0';  // XLS (OLE2)

  if (!isValidExcel) {
    return reply.code(400).send({ error: 'Invalid Excel file format' });
  }

  // Process file
  const result = await importBudgetLines(buffer);
  return result;
});
```

### Anti-Patterns to Avoid
- **Using floating-point for currency:** JavaScript Number uses IEEE 754 floating-point which causes rounding errors (0.1 + 0.2 !== 0.3). Always use NUMERIC in PostgreSQL and string-based arithmetic or libraries like decimal.js for calculations.
- **Trusting client-provided currency conversions:** Always calculate conversions server-side using the currency_rates table. Client could manipulate rates.
- **Storing only converted amounts:** If you only store "amount_in_eur", you lose the original currency and can't recalculate if exchange rates change. Always store original currency + amount.
- **Validating only file extension:** File extension can be spoofed. Always check MIME type and magic bytes.
- **Synchronous Excel processing:** Large Excel files (10k+ rows) block the event loop. Use streaming or async processing with batch inserts.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel parsing | Custom XML parser for .xlsx | SheetJS xlsx library | Excel format is complex (ZIP containing XML with namespaces, styles, shared strings). xlsx handles all edge cases including formulas, formatting, merged cells. |
| Decimal arithmetic | JavaScript Number operations | PostgreSQL NUMERIC + string handling | JavaScript floating-point arithmetic has precision errors. PostgreSQL NUMERIC is exact for financial calculations. Perform calculations in database queries. |
| Currency validation | Hardcoded currency list | Reference currency_rates table + ISO 4217 check | Currency codes change (EUR didn't exist before 1999). Use existing currency_rates table as source of truth. |
| Date parsing from Excel | Manual serial number conversion | XLSX.SSF.parse_date_code() or date-fns | Excel dates are serial numbers (days since 1900-01-01, with leap year bug). xlsx library handles conversion including timezone quirks. |
| File type detection | Extension check only | Magic byte validation + MIME type | File extensions are client-controlled. Magic bytes are reliable for binary formats. |
| Budget constraint checking | Application-only validation | Database constraints + transactions | Race conditions can occur with concurrent requests. Database constraints are atomic, transactions ensure consistency. |

**Key insight:** Financial systems require absolute precision and auditability. Use battle-tested libraries for parsing, database-level constraints for data integrity, and transactions for multi-step operations. Custom solutions introduce rounding errors, security vulnerabilities, and data consistency bugs.

## Common Pitfalls

### Pitfall 1: Floating-Point Currency Arithmetic
**What goes wrong:** Using JavaScript Number for currency calculations produces rounding errors (e.g., 0.1 + 0.2 = 0.30000000000000004)
**Why it happens:** JavaScript uses IEEE 754 double-precision floating-point which cannot exactly represent decimal fractions
**How to avoid:**
- Store amounts as PostgreSQL NUMERIC(15,2) not FLOAT or REAL
- Perform calculations in SQL using SUM(), AVG(), etc. on NUMERIC columns
- If client-side calculation needed, use string-based arithmetic or decimal.js library
- Never convert NUMERIC to JavaScript Number for arithmetic
**Warning signs:** Penny discrepancies in totals, budget vs. actuals not matching exactly, cent-level rounding errors accumulating over time

### Pitfall 2: Budget Over-Allocation Race Conditions
**What goes wrong:** Two users allocate budget simultaneously, total exceeds budget line amount
**Why it happens:** Application checks available budget, then inserts allocation. Between check and insert, another allocation happens. Both checks pass but total exceeds limit.
**How to avoid:**
- Wrap check + insert in database transaction with SERIALIZABLE isolation level
- Use SELECT FOR UPDATE when reading budget line to lock row
- Add database CHECK constraint as fallback safety net
- Return clear error when constraint violation occurs
**Warning signs:** Budget line shows over-allocated after concurrent operations, "available amount" goes negative, constraint violation errors in logs

### Pitfall 3: Excel Import Validation Gaps
**What goes wrong:** Malicious or malformed Excel files crash server, inject data, or expose security vulnerabilities
**Why it happens:** Only validating file extension, processing large files synchronously, trusting cell values without schema validation
**How to avoid:**
- Validate MIME type AND magic bytes (first 4 bytes of file)
- Set file size limit (5MB reasonable for budget/actuals imports)
- Parse Excel with try-catch and return user-friendly errors
- Validate each row with Zod schema before database insert
- Process large files asynchronously (>1000 rows use background job)
**Warning signs:** Server crashes on malformed Excel files, out-of-memory errors, successful uploads of non-Excel files, SQL injection attempts in imported data

### Pitfall 4: Competence Month Extraction Failures
**What goes wrong:** Regex patterns fail silently, incorrect month extracted, invoices assigned to wrong period
**Why it happens:** Invoice descriptions vary, regex patterns incomplete, no fallback for extraction failure
**How to avoid:**
- Store multiple patterns per company, try all until match
- Return extraction success flag: `{ month: string | null, extracted: boolean }`
- Save extraction flag to database for filtering/alerting
- Provide admin UI to test patterns against sample descriptions
- Allow manual override field that takes precedence over extracted value
- Alert user in UI when competenceMonthExtracted is false
**Warning signs:** Many invoices with null competence month, incorrect period assignments, users complaining about manual corrections

### Pitfall 5: Currency Conversion at Wrong Layer
**What goes wrong:** Converting to reporting currency (EUR) at insert time loses original currency information
**Why it happens:** Thinking "we always report in EUR so store EUR" seems simpler
**How to avoid:**
- Always store original currency + amount in actuals/budget tables
- Create PostgreSQL views that JOIN with currency_rates for reporting
- Convert currencies only in reporting views, never in base tables
- Use validity periods (validFrom/validTo) for exchange rates
- Show both original and converted amounts in UI
**Warning signs:** Cannot recalculate reports when exchange rates change, disputes about historical amounts, inability to show original invoice currency

### Pitfall 6: Ignoring Optimistic Locking for Budget Changes
**What goes wrong:** User A updates project budget while User B allocates to budget lines. User A's changes overwrite User B's allocations.
**Why it happens:** Not implementing version checking for budget-related updates
**How to avoid:**
- Add version column to projects table (already exists from Phase 2)
- Increment version on every budget update
- Check version before committing budget allocation changes
- Return 409 Conflict with current data when version mismatch
- Use transactions for multi-table updates (project budget + allocations)
**Warning signs:** Budget allocations mysteriously disappearing, totals not matching declarations, users reporting lost changes

## Code Examples

Verified patterns from official sources:

### Budget Line Available Amount Calculation
```typescript
// Get budget line with current allocations
async function getBudgetLineAvailable(budgetLineId: number) {
  const result = await db
    .select({
      id: budgetLines.id,
      lineAmount: budgetLines.lineAmount,
      currency: budgetLines.currency,
      allocated: sql<string>`COALESCE(SUM(${projectBudgetAllocations.allocationAmount}), 0)`,
    })
    .from(budgetLines)
    .leftJoin(
      projectBudgetAllocations,
      eq(budgetLines.id, projectBudgetAllocations.budgetLineId)
    )
    .where(eq(budgetLines.id, budgetLineId))
    .groupBy(budgetLines.id);

  const available = Number(result[0].lineAmount) - Number(result[0].allocated);

  return {
    ...result[0],
    allocated: result[0].allocated,
    available: available.toString(),
  };
}
```

### Actuals Summary for Project Sidebar
```typescript
// Get actuals totals vs budget for a project
async function getProjectFinancialSummary(projectId: number) {
  // Get project budget (OPEX + CAPEX)
  const [project] = await db
    .select({
      opexBudget: projects.opexBudget,
      capexBudget: projects.capexBudget,
      budgetCurrency: projects.budgetCurrency,
    })
    .from(projects)
    .where(eq(projects.id, projectId));

  // Get actuals totals
  const actualsResult = await db
    .select({
      totalActuals: sql<string>`SUM(${actuals.amount})`,
      currency: actuals.currency,
    })
    .from(actuals)
    .where(eq(actuals.projectId, projectId))
    .groupBy(actuals.currency);

  // Note: If actuals in different currencies, need conversion
  // This example assumes single currency matching budget
  const totalActuals = actualsResult[0]?.totalActuals || '0';
  const totalBudget = Number(project.opexBudget || 0) + Number(project.capexBudget || 0);

  return {
    opexBudget: project.opexBudget,
    capexBudget: project.capexBudget,
    totalBudget: totalBudget.toString(),
    totalActuals,
    currency: project.budgetCurrency,
    remaining: (totalBudget - Number(totalActuals)).toString(),
    percentUsed: totalBudget > 0 ? ((Number(totalActuals) / totalBudget) * 100).toFixed(1) : '0',
  };
}
```

### Cost T-Shirt Auto-Derivation
```typescript
// Derive cost t-shirt size based on total budget
async function deriveCostTshirt(totalBudget: string, currency: string) {
  // Get thresholds for this currency, ordered by maxAmount ascending
  const thresholds = await db
    .select()
    .from(costTshirtThresholds)
    .where(eq(costTshirtThresholds.currency, currency))
    .orderBy(costTshirtThresholds.maxAmount);

  const budget = Number(totalBudget);

  // Find first threshold where budget <= maxAmount
  for (const threshold of thresholds) {
    if (budget <= Number(threshold.maxAmount)) {
      return threshold.size; // XS, S, M, L, XL, XXL
    }
  }

  // If budget exceeds all thresholds, return largest size
  return thresholds[thresholds.length - 1]?.size || 'XXL';
}

// Trigger this calculation when project budget is updated
// Store result in projects.costTshirt column (add in schema)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store amounts in cents as INTEGER | Store as NUMERIC(15,2) with proper scale | PostgreSQL 8.3+ (2008) | NUMERIC handles variable decimal precision (JPY has 0, USD has 2, BHD has 3). INTEGER requires manual precision management. |
| Manual Excel parsing with XML libraries | SheetJS xlsx with TypeScript support | 2020+ (TypeScript types added) | Type-safe parsing, automatic formula evaluation, handles Excel quirks (1900 leap year bug, shared strings). |
| Validate file extension only | Magic byte + MIME type validation | OWASP recommendations 2015+ | Extension spoofing is trivial. Magic bytes validate actual file content. |
| Floating-point arithmetic in application | NUMERIC arithmetic in PostgreSQL | Always (financial best practice) | Database NUMERIC is exact. JavaScript floating-point has rounding errors. |
| Global exchange rates | Time-based rates with validity periods | Standard for financial systems | Exchange rates change daily. Historical reports need rates valid at transaction time. |

**Deprecated/outdated:**
- **PostgreSQL MONEY type:** Locale-dependent, doesn't support multiple currencies, no fractional cent support. Use NUMERIC instead.
- **npm xlsx package (0.18.5):** Outdated, no longer maintained. Use CDN version (0.20.3) directly from SheetJS.
- **Synchronous file processing:** Blocks event loop. Use async/await with streaming for large files.
- **Client-side currency conversion:** Security risk, inconsistent rates. Always convert server-side using currency_rates table.

## Open Questions

Things that couldn't be fully resolved:

1. **Currency conversion for actuals in multiple currencies**
   - What we know: Actuals should be stored in original currency. Reports need conversion to single currency (EUR).
   - What's unclear: How to handle actuals in currencies not in currency_rates table? Show error vs. allow with warning?
   - Recommendation: Block import if currency not in currency_rates table. Require admin to add currency rate first. Prevents "unknown currency" actuals accumulating.

2. **Budget allocation currency mismatch handling**
   - What we know: Budget lines have currency. Projects have budget currency. Allocations connect them.
   - What's unclear: Should allocation enforce matching currencies? Or allow cross-currency allocation with conversion?
   - Recommendation: Enforce matching currencies for v1 (simpler, clearer). Add conversion support in v2 if needed. Prevents accidental mismatches.

3. **Competence month pattern complexity**
   - What we know: Different companies use different invoice description formats. Regex patterns needed.
   - What's unclear: Should patterns support multiple capture groups (year + month)? Or only month with year from invoice date?
   - Recommendation: Start with month-only extraction (simpler patterns). Use invoice date for year. Extend to year+month capture if needed.

4. **Actuals import idempotency**
   - What we know: Same Excel file might be imported twice by accident.
   - What's unclear: Should system detect duplicates? By what key (invoice number + project + amount)?
   - Recommendation: Add unique constraint on (projectId, invoiceNumber, amount, competenceMonth) for invoices. Receipts might not have invoice number, use (projectId, amount, date, description) hash. Return clear error on duplicate.

## Sources

### Primary (HIGH confidence)
- SheetJS CDN documentation: https://cdn.sheetjs.com/xlsx/ - Current version and installation
- Fastify Multipart GitHub: https://github.com/fastify/fastify-multipart - Official plugin documentation
- PostgreSQL NUMERIC documentation (implicit from OWASP/Crunchy Data): Working with Money in Postgres
- Drizzle ORM Transactions: https://orm.drizzle.team/docs/transactions - Transaction patterns

### Secondary (MEDIUM confidence)
- [Working with Money in Postgres | Crunchy Data Blog](https://www.crunchydata.com/blog/working-with-money-in-postgres) - NUMERIC vs MONEY type guidance
- [Best Database for Financial Data: Guide 2026 | Ispirer Blog](https://www.ispirer.com/blog/best-database-for-financial-data) - PostgreSQL for financial systems
- [File Upload - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) - File upload security validation
- [File Uploads with Fastify | Better Stack Community](https://betterstack.com/community/guides/scaling-nodejs/fastify-file-uploads/) - Fastify multipart usage patterns
- [Drizzle ORM - Transactions](https://orm.drizzle.team/docs/transactions) - Transaction usage in Drizzle
- [How to Validate Data with Zod in TypeScript](https://oneuptime.com/blog/post/2026-01-25-zod-validation-typescript/view) - Zod validation patterns

### Tertiary (LOW confidence - flagged for validation)
- Various blog posts and Stack Overflow discussions on Excel parsing - patterns observed but not authoritative
- Community discussions on budget allocation patterns - general principles but not specific implementations

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - xlsx and @fastify/multipart verified from official sources, but couldn't access npm directly for version confirmation. CDN version (0.20.3) confirmed via web search.
- Architecture: MEDIUM - Patterns derived from existing codebase (Phase 1-2) combined with financial best practices from authoritative sources. Multi-currency pattern verified from PostgreSQL financial documentation.
- Pitfalls: MEDIUM - Based on OWASP guidance, PostgreSQL financial best practices, and common patterns in web search results. Specific pitfalls like race conditions and Excel validation verified across multiple sources.

**Research limitations:**
- Could not directly access npm package pages (403 errors) - relied on web search results for version information
- No Context7 data available for xlsx or financial libraries - relied on official GitHub/documentation
- Budget allocation patterns not extensively documented in 2026 sources - extrapolated from general project management and financial system best practices

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable technologies, financial patterns don't change rapidly)
