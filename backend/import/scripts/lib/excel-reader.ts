import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

export interface ExcelRow {
  [key: string]: string | number | boolean | null;
}

/**
 * Read a specific sheet from an Excel file
 * @param filePath Path to Excel file
 * @param sheetName Name of sheet to read (default: first sheet)
 * @returns Array of row objects
 */
export function readExcelSheet(filePath: string, sheetName?: string): ExcelRow[] {
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const targetSheet = sheetName ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheet];

  if (!worksheet) {
    throw new Error(`Sheet "${targetSheet}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
  }

  // Get raw array of arrays (preserves column order)
  const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    raw: false,  // Convert dates to strings
    defval: '',  // Empty cells = empty string
  });

  if (rawData.length < 2) {
    return [];  // No data rows
  }

  // First row is headers
  const headers = rawData[0] as string[];
  const dataRows = rawData.slice(1);

  // Convert to array of objects
  return dataRows.map((row) => {
    const obj: ExcelRow = {};
    headers.forEach((header, index) => {
      if (header && header.trim()) {
        obj[header.trim()] = row[index] ?? '';
      }
    });
    return obj;
  });
}

/**
 * Get column value by index (0-based)
 * Useful when column names are not reliable
 */
export function readExcelByIndex(filePath: string, sheetName?: string): any[][] {
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const targetSheet = sheetName ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheet];

  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: '',
  });
}

/**
 * List all sheet names in workbook
 */
export function listSheets(filePath: string): string[] {
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames;
}
