# Actuals API

The Actuals API handles receipts (project-level) and invoices (company-level) for financial tracking.

## Receipts

Receipts are linked to specific projects and represent actual costs incurred.

### List Receipts

```
GET /api/actuals/receipts
```

Query parameters:
- `projectId` - Filter by project ID (PRJ-YYYY-XXXXX format)
- `fromDate` - Filter receipts from date (ISO format)
- `toDate` - Filter receipts to date (ISO format)
- `currency` - Filter by currency code
- `reportCurrency` - Add converted amounts in this currency

Response:
```json
[
  {
    "id": 1,
    "projectId": "PRJ-2026-00001",
    "projectName": "Project Name",
    "receiptNumber": "REC-001",
    "company": "THIF",
    "purchaseOrder": "PO-2026-001",
    "amount": "5000.00",
    "currency": "EUR",
    "receiptDate": "2026-01-15",
    "description": "Office supplies",
    "importBatch": "uuid",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "convertedAmount": "4300.00"
  }
]
```

### Download Template

```
GET /api/actuals/receipts/template
```

Returns Excel template with columns:
- `ProjectId` - Project identifier (PRJ-YYYY-XXXXX)
- `ReceiptNumber` - Receipt reference number
- `Company` - Company code
- `PurchaseOrder` - PO reference
- `Amount` - Numeric amount
- `Currency` - 3-letter currency code
- `Date` - Receipt date
- `Description` - Optional description

### Upload Excel File

```
POST /api/actuals/receipts/upload
```

Content-Type: `multipart/form-data`

Validates:
- Excel file format
- Required fields
- Project existence (by ProjectId)
- Currency existence in currency_rates
- No duplicate receipts (same company + receiptNumber)

Response:
```json
{
  "imported": 45,
  "errors": [
    { "row": 5, "message": "Project PRJ-2026-00099 not found" },
    { "row": 12, "message": "Currency USD not found in currency_rates" }
  ],
  "importBatch": "uuid"
}
```

### Batch Import (JSON)

```
POST /api/actuals/receipts/import
```

Request:
```json
[
  {
    "projectId": "PRJ-2026-00001",
    "receiptNumber": "REC-001",
    "company": "THIF",
    "purchaseOrder": "PO-2026-001",
    "amount": 5000,
    "currency": "EUR",
    "receiptDate": "2026-01-15",
    "description": "Office supplies"
  }
]
```

Required fields:
- `projectId` - Must exist
- `receiptNumber`
- `company`
- `purchaseOrder`
- `amount` - Must be positive
- `currency` - Must exist in currency_rates
- `receiptDate`

Response same format as Excel upload.

### Delete Receipt

```
DELETE /api/actuals/receipts/:id
```

## Invoices

Invoices are company-level records (not project-specific). They track costs with competence month assignment.

### List Invoices

```
GET /api/actuals/invoices
```

Query parameters:
- `projectId` - Filter by project ID (if linked)
- `fromDate` - Filter from date
- `toDate` - Filter to date
- `extractionFailed` - If "true", show only invoices where competence month extraction failed
- `reportCurrency` - Add converted amounts

Response:
```json
[
  {
    "id": 1,
    "projectId": null,
    "projectName": null,
    "company": "THIF",
    "invoiceNumber": "INV-001",
    "purchaseOrder": "PO-2026-001",
    "amount": "15000.00",
    "currency": "EUR",
    "invoiceDate": "2026-01-20",
    "description": "Consulting services January 2026",
    "competenceMonth": "2026-01",
    "competenceMonthExtracted": true,
    "competenceMonthOverride": null,
    "importBatch": "uuid",
    "createdAt": "2026-01-20T14:00:00.000Z"
  }
]
```

### Download Template

```
GET /api/actuals/invoices/template
```

Returns Excel template with columns:
- `Company` - Company code
- `InvoiceNumber` - Invoice reference
- `PurchaseOrder` - PO reference
- `Amount` - Numeric amount
- `Currency` - 3-letter currency code
- `Date` - Invoice date
- `CompetenceMonth` - Optional, YYYY-MM format
- `Description` - Optional (used for competence month extraction)

### Upload Excel File

```
POST /api/actuals/invoices/upload
```

Content-Type: `multipart/form-data`

Competence month extraction:
- If `CompetenceMonth` column provided, uses that value
- Otherwise, attempts extraction from `Description` using configured patterns
- Patterns are company-specific (from competence_month_patterns table)

Response:
```json
{
  "imported": 30,
  "errors": [
    { "row": 8, "message": "Currency JPY not found in currency_rates" }
  ],
  "extractionWarnings": 5,
  "importBatch": "uuid"
}
```

`extractionWarnings` count indicates invoices where competence month could not be determined.

### Batch Import (JSON)

```
POST /api/actuals/invoices/import
```

Request:
```json
[
  {
    "company": "THIF",
    "invoiceNumber": "INV-001",
    "purchaseOrder": "PO-2026-001",
    "amount": 15000,
    "currency": "EUR",
    "invoiceDate": "2026-01-20",
    "competenceMonth": "2026-01",
    "description": "Consulting services"
  }
]
```

Required fields:
- `company`
- `invoiceNumber`
- `purchaseOrder`
- `amount` - Must be positive
- `currency` - Must exist in currency_rates
- `invoiceDate`

Optional:
- `competenceMonth` - YYYY-MM format, or extracted from description
- `description`

### Update Competence Month

```
PUT /api/actuals/invoices/:id/competence-month
```

Request:
```json
{
  "competenceMonth": "2026-02"
}
```

Sets `competenceMonthOverride` which takes precedence over extracted value.

Format must be `YYYY-MM`.

### Delete Invoice

```
DELETE /api/actuals/invoices/:id
```

## Currency Handling

### Storage

- Receipt amounts are stored in their original currency
- Project budgets are stored in EUR
- Invoice amounts are stored in their original currency

### Conversion

Currency conversion uses rates from the `currency_rates` table with date-based lookup:

1. **Receipts**: Convert using receipt date to find applicable rate
2. **Project budgets**: Convert using project start date
3. **Budget allocations**: Convert using fiscal year start (January 1st)

When `reportCurrency` query parameter is provided, response includes `convertedAmount` field.

If conversion fails (no rate available), `convertedAmount` is `null`.

### Supported Currencies

Currencies must exist in the `currency_rates` table. Import validation checks for currency existence.

## Import Patterns

### Batch Processing

Both Excel upload and JSON import endpoints:
- Generate a unique `importBatch` UUID for tracking
- Process all valid rows even if some have errors
- Return errors array with row numbers/indices

### Error Handling

Import errors include:
- Validation errors (missing required fields)
- Reference errors (project/currency not found)
- Duplicate errors (same company + receipt/invoice number)

Duplicate constraint violations return 400:
```json
{
  "error": "Duplicate receipt detected",
  "message": "One or more receipts with the same company and receiptNumber already exist"
}
```

### Competence Month Extraction

For invoices without explicit competence month:

1. Look up patterns for the invoice's company in `competence_month_patterns`
2. Apply regex patterns to description
3. Extract month in YYYY-MM format
4. Set `competenceMonthExtracted` to true if successful

Invoices with `competenceMonthExtracted: false` appear in the "needs attention" count for the project.
