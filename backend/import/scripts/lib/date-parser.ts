/**
 * Flexible date parser for Excel import data
 *
 * Handles multiple date formats:
 * - Excel serial date numbers (e.g., 44927 -> "2023-01-01")
 * - Quarter format: "Q1 2026" or "Q1-2026" -> "2026-01-01"
 * - Year only: "2026" -> "2026-01-01"
 * - Year-month: "2026-06" -> "2026-06-01"
 * - ISO date: "2026-06-15" -> "2026-06-15"
 * - Empty/null: return null
 */

// Excel epoch: January 1, 1900 (with adjustment for 1900 leap year bug)
const EXCEL_EPOCH = new Date(1899, 11, 30);

// Quarter to month mapping
const QUARTER_TO_MONTH: Record<string, string> = {
  'Q1': '01',
  'Q2': '04',
  'Q3': '07',
  'Q4': '10',
};

/**
 * Parse flexible date input into ISO date string (YYYY-MM-DD)
 *
 * @param value - Date value from Excel (string or number)
 * @returns ISO date string or null if empty/invalid
 */
export function parseFlexibleDate(value: string | number | null | undefined): string | null {
  // Handle empty values
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Handle Excel serial date numbers
  if (typeof value === 'number') {
    const date = new Date(EXCEL_EPOCH.getTime() + value * 24 * 60 * 60 * 1000);
    return formatDateISO(date);
  }

  const strValue = String(value).trim();

  // Handle empty string
  if (strValue === '') {
    return null;
  }

  // Handle quarter format: "Q1 2026", "Q1-2026", or "2026 Q1"
  let quarterMatch = strValue.match(/^Q([1-4])[\s-](\d{4})$/i);
  if (quarterMatch) {
    const quarter = `Q${quarterMatch[1]}`;
    const year = quarterMatch[2];
    const month = QUARTER_TO_MONTH[quarter];
    return `${year}-${month}-01`;
  }

  // Handle reversed format: "2026 Q1"
  quarterMatch = strValue.match(/^(\d{4})[\s-]Q([1-4])$/i);
  if (quarterMatch) {
    const year = quarterMatch[1];
    const quarter = `Q${quarterMatch[2]}`;
    const month = QUARTER_TO_MONTH[quarter];
    return `${year}-${month}-01`;
  }

  // Handle year only: "2026"
  if (/^\d{4}$/.test(strValue)) {
    return `${strValue}-01-01`;
  }

  // Handle year-month: "2026-06"
  if (/^\d{4}-\d{2}$/.test(strValue)) {
    return `${strValue}-01`;
  }

  // Handle ISO date: "2026-06-15" (passthrough with validation)
  if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
    // Validate it's a real date
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
      return strValue;
    }
  }

  // Unable to parse - return null
  console.warn(`Unable to parse date: "${value}"`);
  return null;
}

/**
 * Format Date object to ISO string (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
