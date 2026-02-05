import { apiClient } from './api-client';
import * as XLSX from 'xlsx';

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

export interface Receipt {
  id: number;
  projectId: string;
  projectName: string | null;
  receiptNumber: string | null;
  amount: string;
  currency: string;
  receiptDate: string;
  description: string | null;
  importBatch: string | null;
  createdAt: string;
}

export interface Invoice {
  id: number;
  projectId: string;
  projectName: string | null;
  invoiceNumber: string;
  amount: string;
  currency: string;
  invoiceDate: string;
  description: string;
  competenceMonth: string | null;
  competenceMonthExtracted: boolean;
  competenceMonthOverride: string | null;
  importBatch: string | null;
  createdAt: string;
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

export async function fetchProjectReceipts(projectId: string): Promise<Receipt[]> {
  return apiClient<Receipt[]>(`/api/actuals/receipts?projectId=${encodeURIComponent(projectId)}`);
}

export async function fetchProjectInvoices(projectId: string): Promise<Invoice[]> {
  return apiClient<Invoice[]>(`/api/actuals/invoices?projectId=${encodeURIComponent(projectId)}`);
}

export async function deleteReceipt(id: number): Promise<void> {
  return apiClient<void>(`/api/actuals/receipts/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteInvoice(id: number): Promise<void> {
  return apiClient<void>(`/api/actuals/invoices/${id}`, {
    method: 'DELETE',
  });
}

export function exportActualsExcel(receipts: Receipt[], invoices: Invoice[], projectId: string): void {
  const workbook = XLSX.utils.book_new();

  // Create Receipts sheet
  const receiptsData = receipts.map(r => ({
    'Project ID': r.projectId,
    'Project Name': r.projectName,
    'Receipt Number': r.receiptNumber || '',
    'Amount': parseFloat(r.amount),
    'Currency': r.currency,
    'Date': r.receiptDate,
    'Description': r.description || '',
    'Import Batch': r.importBatch || '',
    'Created': new Date(r.createdAt).toLocaleString()
  }));
  const receiptsSheet = XLSX.utils.json_to_sheet(receiptsData);
  XLSX.utils.book_append_sheet(workbook, receiptsSheet, 'Receipts');

  // Create Invoices sheet
  const invoicesData = invoices.map(i => ({
    'Project ID': i.projectId,
    'Project Name': i.projectName,
    'Invoice Number': i.invoiceNumber,
    'Amount': parseFloat(i.amount),
    'Currency': i.currency,
    'Date': i.invoiceDate,
    'Description': i.description,
    'Competence Month': i.competenceMonthOverride || i.competenceMonth || '',
    'Month Extracted': i.competenceMonthExtracted ? 'Yes' : 'No',
    'Import Batch': i.importBatch || '',
    'Created': new Date(i.createdAt).toLocaleString()
  }));
  const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Invoices');

  // Download file
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectId}-actuals.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
