# API Overview

The Portfolio GSD API is a RESTful API built with Fastify that provides endpoints for managing projects, referential data, and financial actuals.

## Base URL

```
/api
```

All API routes are prefixed with `/api`. Admin routes use `/api/admin`.

## Authentication

The API uses Entra ID (Azure AD) with JWT bearer tokens.

### Token Format

All authenticated requests require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### User Object

After authentication, `request.user` contains:

```typescript
{
  id: string;       // Entra ID object ID (oid)
  email: string;    // User email or preferred_username
  name: string;     // Display name
  role: 'admin' | 'user';
}
```

### Role Determination

- Admin role is granted if the user's group claims include the configured `adminGroupId`
- Admin role is required for all `/api/admin/*` endpoints
- Non-admin users receive 403 Forbidden on admin endpoints

### Unauthenticated Endpoints

- `GET /health` - Health check
- `GET /docs/*` - Swagger documentation

## Response Formats

### Success Response

Single entity:
```json
{
  "id": 1,
  "name": "Example",
  "createdAt": "2026-01-15T10:30:00.000Z"
}
```

List of entities:
```json
[
  { "id": 1, "name": "Example 1" },
  { "id": 2, "name": "Example 2" }
]
```

Paginated list:
```json
{
  "entries": [...],
  "total": 150,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request - validation error or invalid input |
| 401  | Unauthorized - missing or invalid token |
| 403  | Forbidden - insufficient permissions |
| 404  | Not Found - resource does not exist |
| 409  | Conflict - version mismatch or resource in use |
| 500  | Internal Server Error |

### Validation Errors

```json
{
  "error": "Validation failed",
  "errors": [
    "Row 2: Name is required",
    "Row 3: Invalid date format"
  ]
}
```

### Version Conflict (Optimistic Locking)

Projects use optimistic locking via `version` field:

```json
{
  "error": "Version conflict",
  "message": "The project has been modified by another user. Please refresh and try again.",
  "currentVersion": 5,
  "expectedVersion": 4,
  "currentData": { ... }
}
```

### In-Use Conflict

When trying to delete a referential that is in use:

```json
{
  "error": "Cannot delete",
  "message": "Department is used by 3 team(s)",
  "usageCount": 3
}
```

## Common Patterns

### T-shirt Sizes

Several endpoints use T-shirt sizing with these valid values:

```
XS, S, M, L, XL, XXL
```

### Currencies

Supported currencies depend on configured exchange rates. Common values:

```
EUR, GBP
```

Budget values are stored in EUR and converted to report currency on read.

### Date Formats

- Dates: ISO 8601 date string (`2026-01-15`)
- Timestamps: ISO 8601 with timezone (`2026-01-15T10:30:00.000Z`)
- Competence months: `YYYY-MM` format (`2026-01`)

### File Uploads

File upload endpoints accept `multipart/form-data` with:
- Maximum file size: 10MB
- Single file per request

Excel templates are provided for bulk imports.
