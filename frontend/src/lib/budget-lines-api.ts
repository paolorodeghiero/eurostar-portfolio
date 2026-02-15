import { apiClient, getAuthorizationHeader } from './api-client';

export interface BudgetLine {
  id: number;
  company: string;
  departmentId: number;
  departmentName: string;
  costCenterId: number;
  costCenterCode: string;
  lineValue: string;
  lineAmount: string;
  currency: string;
  type: 'CAPEX' | 'OPEX';
  fiscalYear: number;
  allocatedAmount: string;
  availableAmount: string;
}

export interface BudgetLineFilters {
  fiscalYear?: number;
  company?: string;
  type?: 'CAPEX' | 'OPEX';
}

export interface ImportResult {
  imported: number;
  errors: Array<{ row: number; message: string }>;
}

export async function fetchBudgetLines(filters?: BudgetLineFilters): Promise<BudgetLine[]> {
  const params = new URLSearchParams();
  if (filters?.fiscalYear) params.append('fiscalYear', filters.fiscalYear.toString());
  if (filters?.company) params.append('company', filters.company);
  if (filters?.type) params.append('type', filters.type);

  const queryString = params.toString();
  const endpoint = `/api/admin/budget-lines${queryString ? `?${queryString}` : ''}`;

  return apiClient<BudgetLine[]>(endpoint);
}

export async function importBudgetLines(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const authHeaders = await getAuthorizationHeader();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const res = await fetch(`${API_BASE}/api/admin/budget-lines/import`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Import failed' }));
    throw new Error(error.message || 'Failed to import budget lines');
  }

  return res.json();
}

export async function deleteBudgetLine(id: number): Promise<void> {
  await apiClient(`/api/admin/budget-lines/${id}`, {
    method: 'DELETE',
  });
}
