import * as XLSX from 'xlsx';
import { z } from 'zod';

/**
 * Schema for validating budget line rows from Excel import
 */
export const budgetLineRowSchema = z.object({
  Company: z.string().min(1),
  Department: z.string().min(1),
  CostCenter: z.string().min(1),
  LineValue: z.string().min(1),
  Amount: z.number().positive(),
  Currency: z.string().length(3),
  Type: z.enum(['CAPEX', 'OPEX']),
  FiscalYear: z.number().int().min(2020).max(2100),
});

export type BudgetLineRow = z.infer<typeof budgetLineRowSchema>;

/**
 * Validates Excel file format by checking magic bytes
 */
export function validateExcelFile(buffer: Buffer): { valid: boolean; error?: string } {
  if (buffer.length < 4) {
    return { valid: false, error: 'File too small to be a valid Excel file' };
  }

  const magicBytes = buffer.toString('hex', 0, 4);

  // XLSX format (ZIP-based): 50 4B 03 04
  // XLS format (OLE2): D0 CF 11 E0
  if (magicBytes === '504b0304' || magicBytes === 'd0cf11e0') {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Invalid file format. Please upload a valid Excel file (.xls or .xlsx)',
  };
}

/**
 * Parses Excel buffer and returns raw row data
 */
export function parseExcelBuffer(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  return data;
}

/**
 * Validates budget line rows against schema
 */
export function validateBudgetLineRows(
  data: any[]
): { valid: BudgetLineRow[]; errors: Array<{ row: number; message: string }> } {
  const valid: BudgetLineRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  data.forEach((row, index) => {
    const result = budgetLineRowSchema.safeParse(row);
    if (result.success) {
      valid.push(result.data);
    } else {
      const errorMessages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      errors.push({
        row: index + 2, // +2 because Excel is 1-indexed and has header row
        message: errorMessages,
      });
    }
  });

  return { valid, errors };
}
