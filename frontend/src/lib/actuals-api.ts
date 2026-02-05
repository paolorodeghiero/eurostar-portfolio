import { apiClient } from './api-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ProjectActualsSummary {
  totalReceipts: string;
  totalInvoices: string;
  totalActuals: string;
  currency: string;
  budgetTotal: string;
  budgetRemaining: string;
  percentUsed: string;
  invoicesNeedingAttention: number; // competenceMonthExtracted = false
}

export interface ImportResult {
  imported: number;
  errors: Array<{ row?: number; index?: number; message: string }>;
  extractionWarnings?: number;
  importBatch?: string;
}

export interface ReceiptInput {
  projectId: string;
  receiptNumber?: string;
  amount: number;
  currency: string;
  receiptDate: string;
  description?: string;
}

export interface InvoiceInput {
  projectId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  description: string;
  company?: string;
}

export async function fetchProjectActualsSummary(projectId: number): Promise<ProjectActualsSummary> {
  return apiClient<ProjectActualsSummary>(`/api/projects/${projectId}/actuals/summary`);
}

export async function uploadReceiptsExcel(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/actuals/receipts/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function uploadInvoicesExcel(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/actuals/invoices/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function uploadReceiptsJson(data: Array<ReceiptInput>): Promise<ImportResult> {
  return apiClient<ImportResult>('/api/actuals/receipts/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadInvoicesJson(data: Array<InvoiceInput>): Promise<ImportResult> {
  return apiClient<ImportResult>('/api/actuals/invoices/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
