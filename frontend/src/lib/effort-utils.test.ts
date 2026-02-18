import { describe, test, expect } from 'vitest'
import { deriveGlobalEffort, deriveGlobalImpact, TSHIRT_COLORS } from './effort-utils'

describe('effort utilities', () => {
  describe('deriveGlobalEffort', () => {
    test('returns MAX of team sizes', () => {
      const teams = [
        { effortSize: 'S' },
        { effortSize: 'L' },
        { effortSize: 'M' }
      ]
      expect(deriveGlobalEffort(teams)).toBe('L')
    })

    test('handles empty array', () => {
      expect(deriveGlobalEffort([])).toBeNull()
    })

    test('handles single team', () => {
      expect(deriveGlobalEffort([{ effortSize: 'M' }])).toBe('M')
    })

    test('returns largest size from multiple teams', () => {
      const teams = [
        { effortSize: 'XS' },
        { effortSize: 'XXL' },
        { effortSize: 'M' }
      ]
      expect(deriveGlobalEffort(teams)).toBe('XXL')
    })
  })

  describe('deriveGlobalImpact', () => {
    test('returns MAX of impact sizes', () => {
      const teams = [
        { impactSize: 'S' },
        { impactSize: 'L' },
        { impactSize: 'M' }
      ]
      expect(deriveGlobalImpact(teams)).toBe('L')
    })

    test('handles empty array', () => {
      expect(deriveGlobalImpact([])).toBeNull()
    })

    test('handles single team', () => {
      expect(deriveGlobalImpact([{ impactSize: 'XL' }])).toBe('XL')
    })
  })

  describe('TSHIRT_COLORS', () => {
    test('has color for each T-shirt size', () => {
      expect(TSHIRT_COLORS['XS']).toBeDefined()
      expect(TSHIRT_COLORS['S']).toBeDefined()
      expect(TSHIRT_COLORS['M']).toBeDefined()
      expect(TSHIRT_COLORS['L']).toBeDefined()
      expect(TSHIRT_COLORS['XL']).toBeDefined()
      expect(TSHIRT_COLORS['XXL']).toBeDefined()
    })

    test('colors contain Tailwind classes', () => {
      expect(TSHIRT_COLORS['XS']).toContain('bg-')
      expect(TSHIRT_COLORS['M']).toContain('text-')
    })
  })
})
