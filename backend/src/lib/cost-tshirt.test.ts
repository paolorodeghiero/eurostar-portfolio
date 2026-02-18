import { describe, test, expect } from 'vitest';
import { deriveCostTshirt } from './cost-tshirt.js';

describe('deriveCostTshirt', () => {
  // Mock database with EUR thresholds
  const mockDbEur = {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => [
            { size: 'XS', maxAmount: '10000.00' },
            { size: 'S', maxAmount: '50000.00' },
            { size: 'M', maxAmount: '100000.00' },
            { size: 'L', maxAmount: '250000.00' },
            { size: 'XL', maxAmount: '500000.00' },
            { size: 'XXL', maxAmount: '999999999.00' },
          ],
        }),
      }),
    }),
  };

  // Mock database with GBP thresholds
  const mockDbGbp = {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => [
            { size: 'XS', maxAmount: '8500.00' },
            { size: 'S', maxAmount: '42500.00' },
            { size: 'M', maxAmount: '85000.00' },
            { size: 'L', maxAmount: '212500.00' },
            { size: 'XL', maxAmount: '425000.00' },
            { size: 'XXL', maxAmount: '999999999.00' },
          ],
        }),
      }),
    }),
  };

  // Mock database with no thresholds
  const mockDbEmpty = {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => [],
        }),
      }),
    }),
  };

  describe('EUR thresholds', () => {
    test('returns XS for budget below 10k', async () => {
      const result = await deriveCostTshirt(mockDbEur, '5000.00', 'EUR');
      expect(result).toBe('XS');
    });

    test('returns S for budget in S range (10k-50k)', async () => {
      const result = await deriveCostTshirt(mockDbEur, '30000.00', 'EUR');
      expect(result).toBe('S');
    });

    test('returns M for budget in M range (50k-100k)', async () => {
      const result = await deriveCostTshirt(mockDbEur, '75000.00', 'EUR');
      expect(result).toBe('M');
    });

    test('returns L for budget in L range (100k-250k)', async () => {
      const result = await deriveCostTshirt(mockDbEur, '150000.00', 'EUR');
      expect(result).toBe('L');
    });

    test('returns XL for budget in XL range (250k-500k)', async () => {
      const result = await deriveCostTshirt(mockDbEur, '350000.00', 'EUR');
      expect(result).toBe('XL');
    });

    test('returns XXL for budget above 500k', async () => {
      const result = await deriveCostTshirt(mockDbEur, '750000.00', 'EUR');
      expect(result).toBe('XXL');
    });

    test('handles exact threshold boundaries (at maxAmount)', async () => {
      expect(await deriveCostTshirt(mockDbEur, '10000.00', 'EUR')).toBe('XS');
      expect(await deriveCostTshirt(mockDbEur, '50000.00', 'EUR')).toBe('S');
      expect(await deriveCostTshirt(mockDbEur, '100000.00', 'EUR')).toBe('M');
      expect(await deriveCostTshirt(mockDbEur, '250000.00', 'EUR')).toBe('L');
      expect(await deriveCostTshirt(mockDbEur, '500000.00', 'EUR')).toBe('XL');
    });

    test('handles edge case just above threshold', async () => {
      expect(await deriveCostTshirt(mockDbEur, '10000.01', 'EUR')).toBe('S');
      expect(await deriveCostTshirt(mockDbEur, '50000.01', 'EUR')).toBe('M');
    });

    test('handles very small budgets', async () => {
      expect(await deriveCostTshirt(mockDbEur, '0.01', 'EUR')).toBe('XS');
      expect(await deriveCostTshirt(mockDbEur, '1.00', 'EUR')).toBe('XS');
    });

    test('handles very large budgets', async () => {
      expect(await deriveCostTshirt(mockDbEur, '1000000.00', 'EUR')).toBe('XXL');
      expect(await deriveCostTshirt(mockDbEur, '10000000.00', 'EUR')).toBe('XXL');
    });
  });

  describe('GBP thresholds', () => {
    test('returns XS for budget below 8.5k GBP', async () => {
      const result = await deriveCostTshirt(mockDbGbp, '5000.00', 'GBP');
      expect(result).toBe('XS');
    });

    test('returns S for budget in S range GBP', async () => {
      const result = await deriveCostTshirt(mockDbGbp, '30000.00', 'GBP');
      expect(result).toBe('S');
    });

    test('returns M for budget in M range GBP', async () => {
      const result = await deriveCostTshirt(mockDbGbp, '70000.00', 'GBP');
      expect(result).toBe('M');
    });
  });

  describe('Edge cases', () => {
    test('returns null when no thresholds exist for currency', async () => {
      const result = await deriveCostTshirt(mockDbEmpty, '100000.00', 'USD');
      expect(result).toBeNull();
    });

    test('returns last size for budget exceeding all thresholds', async () => {
      const result = await deriveCostTshirt(mockDbEur, '999999999999.00', 'EUR');
      expect(result).toBe('XXL');
    });
  });
});
