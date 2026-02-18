import { describe, test, expect } from 'vitest';

describe('Backend test setup', () => {
  test('vitest is configured correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('environment variables loaded', () => {
    // Verify TEST_DATABASE_URL is set from test.env
    expect(process.env.TEST_DATABASE_URL).toBeDefined();
    expect(process.env.TEST_DATABASE_URL).toContain('eurostar_portfolio_test');
  });
});
