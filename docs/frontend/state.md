# State Management

The frontend uses a combination of local component state, custom hooks, and localStorage persistence. There is no global state management library.

## API Client Pattern

All API calls go through the centralized `apiClient` function in `lib/api-client.ts`.

### Core Function

```typescript
async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { _retried?: boolean } = {}
): Promise<T>
```

**Behavior:**
1. Acquires access token via `getAccessToken()`
2. Sets `Content-Type: application/json` for POST/PUT/PATCH
3. Adds `Authorization: Bearer <token>` header if token exists
4. Makes fetch request to `${VITE_API_URL}${endpoint}`
5. On 401: forces token refresh and retries once
6. Throws error with server message on non-2xx responses
7. Parses JSON response (handles empty body for 204)

### Token Acquisition

```typescript
async function getAccessToken(forceRefresh = false): Promise<string | null>
```

**Flow:**
1. Checks for dev mode (returns null if backend is in dev mode)
2. Gets active MSAL account or first available account
3. Calls `msalInstance.acquireTokenSilent()`
4. Checks token expiry, refreshes if within 5 minutes
5. On `InteractionRequiredAuthError`: redirects to login
6. Returns `idToken` (not access token) for API authorization

### Helper Functions

```typescript
// Get headers for custom fetch calls
async function getAuthHeaders(): Promise<Record<string, string>>

// Get just Authorization header (for FormData uploads)
async function getAuthorizationHeader(): Promise<Record<string, string>>
```

## API Modules

Domain-specific API functions are organized into modules:

| Module | Endpoints |
|--------|-----------|
| `lib/project-api.ts` | Projects, teams, values, change impact, lifecycle |
| `lib/project-budget-api.ts` | Budget CRUD operations |
| `lib/project-committee-api.ts` | Committee state management |
| `lib/project-history-api.ts` | Activity history |
| `lib/actuals-api.ts` | Actuals upload and management |
| `lib/alerts-api.ts` | Project alerts |
| `lib/budget-lines-api.ts` | Budget lines referential data |

### Example API Function

```typescript
// From project-api.ts
export async function fetchProject(id: number): Promise<Project> {
  return apiClient<Project>(`/api/projects/${id}`);
}

export async function updateProject(
  id: number,
  data: Partial<Project> & { expectedVersion: number }
): Promise<Project> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  // Handle 409 conflict specially
  if (response.status === 409) {
    const conflict = await response.json();
    const error = new Error('Conflict') as Error & ConflictError;
    error.statusCode = 409;
    error.serverData = conflict.serverData;
    throw error;
  }
  // ...
}
```

## Data Flow Patterns

### Portfolio Page Data Flow

```
PortfolioPage
  |-- [state] projects: PortfolioProject[]
  |-- [state] loading: boolean
  |-- [effect] loadProjects() on mount
  |       |
  |       v
  |     fetchPortfolioProjects(reportCurrency)
  |       |
  |       v
  |     apiClient('/api/projects?reportCurrency=EUR')
  |
  |-- Passes to:
        PortfolioToolbar (table instance, filter state)
        PortfolioTable (data, loading)
        ProjectSidebar (projectId, callbacks)
```

### Project Sidebar Data Flow

```
ProjectSidebar (receives projectId)
  |-- [state] project: Project | null
  |-- [state] formData: Partial<Project>
  |-- [effect] fetchProject(projectId) on projectId change
  |
  |-- useAutoSave hook
  |       |
  |       |-- Watches formData changes
  |       |-- Debounces (2500ms)
  |       |-- Calls handleSave(formData)
  |             |
  |             v
  |           updateProject(id, { ...data, expectedVersion })
  |
  |-- ProjectTabs
        |-- GeneralTab, PeopleTab, etc.
        |-- Each tab receives:
        |     project (read-only source of truth)
        |     formData (editable state)
        |     onChange (update formData)
        |
        |-- Tab components:
              |-- Call onChange({ ...formData, fieldName: newValue })
              |-- Some tabs fetch additional data (outcomes, teams list)
```

## Custom Hooks

### useAutoSave

Debounced auto-save with status tracking.

```typescript
interface UseAutoSaveOptions<T> {
  data: T;                        // Data to watch for changes
  onSave: (data: T) => Promise<void>;  // Save function
  delay?: number;                 // Debounce delay (default: 2500ms)
  enabled?: boolean;              // Enable/disable auto-save
}

function useAutoSave<T>(options): {
  status: 'idle' | 'saving' | 'saved' | 'error';
  statusText: string;
  error: string | null;
  saveNow: () => void;  // Trigger immediate save
}
```

**Usage in ProjectSidebar:**
```typescript
const { status, statusText, saveNow } = useAutoSave({
  data: formData,
  onSave: handleSave,
  enabled: !!project && !loading && !isReadOnly,
});
```

### useTableState

localStorage-persisted state for table preferences.

```typescript
function useTableState<T>(
  key: string,
  initialState: T
): [T, (state: T | ((prev: T) => T)) => void]
```

**Usage:**
```typescript
const [sorting, setSorting] = useTableState<SortingState>(
  'portfolio-sorting',
  [{ id: 'projectId', desc: true }]
);

const [columnVisibility, setColumnVisibility] = useTableState<VisibilityState>(
  'portfolio-visibility',
  defaultColumnVisibility
);

const [density, setDensity] = useTableState<Density>(
  'portfolio-density',
  'comfortable'
);
```

**Persisted Keys:**
- `portfolio-sorting` - Column sort configuration
- `portfolio-visibility` - Which columns are visible
- `portfolio-order` - Column order for drag-and-drop
- `portfolio-density` - Row height (comfortable/compact)

## Authentication State

### MSAL Configuration (lib/auth-config.ts)

```typescript
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${VITE_ENTRA_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",  // Persists across page refresh
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
export const msalInitPromise = msalInstance.initialize();
export const loginRequest = {
  scopes: VITE_API_SCOPE.split(' '),
};
```

### AuthProvider (components/AuthProvider.tsx)

Wraps app with MSAL context and validates session on load:

1. Checks if accounts exist in MSAL cache
2. Attempts silent token acquisition to validate session
3. On `InteractionRequiredAuthError`: allows re-auth via interaction
4. On other errors: clears stale cache and reloads

### DevAuthProvider (components/DevAuthProvider.tsx)

Provides dev mode context:

```typescript
interface DevAuthContextType {
  isDevMode: boolean;
  isLoading: boolean;
  devUser: DevUser | null;
}
```

Detection flow:
1. Calls `checkDevMode()` from `lib/dev-auth.ts`
2. Makes unauthenticated request to `/api/me`
3. If response contains `id: 'dev-user'`, sets dev mode
4. In dev mode, `apiClient` skips token acquisition

### Login Flow

1. User clicks `LoginButton`
2. Calls `msalInstance.loginRedirect(loginRequest)`
3. Redirects to Azure AD login
4. Returns to app with auth code
5. `main.tsx` calls `handleRedirectPromise()` to complete flow
6. `setActiveAccount()` stores logged-in user
7. App renders `AuthenticatedTemplate` content

### Token Usage

The frontend uses `idToken` (not access token) for API authorization:
- Backend validates ID token signature and claims
- Token refresh happens silently via MSAL
- On 401 from API, `apiClient` forces token refresh and retries

## Component State Patterns

### Loading States

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  setLoading(true);
  fetchData()
    .then(setData)
    .finally(() => setLoading(false));
}, [dependency]);
```

### Error Handling

Errors from API calls are typically:
- Logged to console
- Shown via auto-save status indicator
- Or surfaced via try/catch in event handlers

### Optimistic Concurrency

Projects use version-based optimistic locking:

```typescript
interface Project {
  version: number;
  // ...
}

// Update requires expected version
await updateProject(id, {
  ...changes,
  expectedVersion: project.version,
});
```

On 409 conflict:
- `ConflictDialog` shows local vs server versions
- User chooses "Keep Local" (overwrite) or "Keep Server" (discard local)
