import { describe, test, expect } from 'vitest';

describe('Frontend test setup', () => {
  test('vitest is configured correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('jsdom environment is working', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello';
    expect(div.textContent).toBe('Hello');
  });
});
