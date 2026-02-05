import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, lte, or, isNull, sql } from 'drizzle-orm';
import { currencyRates } from '../db/schema.js';

/**
 * Get the exchange rate between two currencies for a given date
 * @param db - Database connection
 * @param fromCurrency - Source currency code (ISO 4217)
 * @param toCurrency - Target currency code (ISO 4217)
 * @param date - Date for which to fetch the rate (defaults to today)
 * @returns Exchange rate or null if not found
 */
export async function getExchangeRate(
  db: NodePgDatabase<any>,
  fromCurrency: string,
  toCurrency: string,
  date?: Date
): Promise<string | null> {
  // If currencies are the same, rate is 1.0
  if (fromCurrency === toCurrency) {
    return '1.000000';
  }

  const targetDate = date || new Date();
  const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

  // Query for rate valid at the given date
  // Rate is valid if: validFrom <= targetDate AND (validTo IS NULL OR validTo >= targetDate)
  const [rate] = await db
    .select({ rate: currencyRates.rate })
    .from(currencyRates)
    .where(
      and(
        eq(currencyRates.fromCurrency, fromCurrency),
        eq(currencyRates.toCurrency, toCurrency),
        lte(currencyRates.validFrom, dateStr),
        or(
          isNull(currencyRates.validTo),
          sql`${currencyRates.validTo} >= ${dateStr}`
        )
      )
    )
    .orderBy(sql`${currencyRates.validFrom} DESC`)
    .limit(1);

  return rate?.rate || null;
}

/**
 * Convert an amount from one currency to another
 * @param db - Database connection
 * @param amount - Amount to convert (as string to avoid precision loss)
 * @param fromCurrency - Source currency code (ISO 4217)
 * @param toCurrency - Target currency code (ISO 4217)
 * @param date - Date for which to fetch the rate (defaults to today)
 * @returns Converted amount as string with 2 decimal places
 * @throws Error if exchange rate is not found
 */
export async function convertCurrency(
  db: NodePgDatabase<any>,
  amount: string,
  fromCurrency: string,
  toCurrency: string,
  date?: Date
): Promise<string> {
  // If currencies are the same, return amount unchanged
  if (fromCurrency === toCurrency) {
    const num = parseFloat(amount);
    return num.toFixed(2);
  }

  const rate = await getExchangeRate(db, fromCurrency, toCurrency, date);

  if (rate === null) {
    throw new Error(
      `Exchange rate not found for ${fromCurrency} to ${toCurrency}${
        date ? ` on ${date.toISOString().split('T')[0]}` : ''
      }`
    );
  }

  const amountNum = parseFloat(amount);
  const rateNum = parseFloat(rate);
  const converted = amountNum * rateNum;

  return converted.toFixed(2);
}
