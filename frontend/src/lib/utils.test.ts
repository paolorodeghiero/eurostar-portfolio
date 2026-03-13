import { describe, test, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  test('combines class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  test('handles conditional classes', () => {
    const shouldInclude = true;
    const shouldExclude = false;
    expect(cn('base', shouldInclude && 'included', shouldExclude && 'excluded')).toBe(
      'base included'
    );
  });

  test('merges Tailwind classes correctly', () => {
    // tailwind-merge resolves conflicts
    expect(cn('px-4', 'px-6')).toBe('px-6');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  test('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  test('handles empty strings', () => {
    expect(cn('base', '', 'end')).toBe('base end');
  });
});
