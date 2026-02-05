import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { competenceMonthPatterns } from '../db/schema.js';

/**
 * Normalize month format to YYYY-MM
 * Handles formats: 2024/01, 01/2024, 2024-01, Jan 2024, January 2024
 */
export function normalizeMonthFormat(monthString: string): string | null {
  if (!monthString || typeof monthString !== 'string') {
    return null;
  }

  const trimmed = monthString.trim();

  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // YYYY/MM format
  if (/^\d{4}\/\d{2}$/.test(trimmed)) {
    return trimmed.replace('/', '-');
  }

  // MM/YYYY format
  const mmYyyyMatch = trimmed.match(/^(\d{2})\/(\d{4})$/);
  if (mmYyyyMatch) {
    return `${mmYyyyMatch[2]}-${mmYyyyMatch[1]}`;
  }

  // Month name formats: "Jan 2024", "January 2024"
  const monthNames: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  const monthNameMatch = trimmed.match(/^([a-z]+)\s+(\d{4})$/i);
  if (monthNameMatch) {
    const monthName = monthNameMatch[1].toLowerCase();
    const year = monthNameMatch[2];
    const monthNum = monthNames[monthName];
    if (monthNum) {
      return `${year}-${monthNum}`;
    }
  }

  // Unrecognized format
  return null;
}

/**
 * Extract competence month from invoice description using patterns from database
 * Returns { month: string | null, extracted: boolean }
 */
export async function extractCompetenceMonth(
  db: NodePgDatabase<any>,
  description: string,
  company: string
): Promise<{ month: string | null; extracted: boolean }> {
  if (!description || typeof description !== 'string') {
    console.log('[competence-month] No description provided');
    return { month: null, extracted: false };
  }

  if (!company || typeof company !== 'string') {
    console.log('[competence-month] No company provided');
    return { month: null, extracted: false };
  }

  // Query patterns for this company
  const patterns = await db
    .select()
    .from(competenceMonthPatterns)
    .where(eq(competenceMonthPatterns.company, company));

  if (patterns.length === 0) {
    console.log(`[competence-month] No patterns found for company: ${company}`);
    return { month: null, extracted: false };
  }

  console.log(`[competence-month] Testing ${patterns.length} pattern(s) for company: ${company}`);

  // Try each pattern
  for (const patternRow of patterns) {
    try {
      const regex = new RegExp(patternRow.pattern, 'i');
      const match = description.match(regex);

      if (match && match.groups?.month) {
        const extractedMonth = match.groups.month;
        console.log(`[competence-month] Pattern matched: "${patternRow.description}" extracted: "${extractedMonth}"`);

        // Normalize to YYYY-MM format
        const normalized = normalizeMonthFormat(extractedMonth);

        if (normalized) {
          console.log(`[competence-month] Normalized to: ${normalized}`);
          return { month: normalized, extracted: true };
        } else {
          console.log(`[competence-month] Failed to normalize: "${extractedMonth}"`);
        }
      }
    } catch (error) {
      console.error(`[competence-month] Invalid regex pattern: ${patternRow.pattern}`, error);
      // Skip invalid patterns, don't crash
      continue;
    }
  }

  console.log(`[competence-month] No pattern matched for description: "${description.substring(0, 100)}..."`);
  return { month: null, extracted: false };
}
