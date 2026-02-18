import { describe, test, expect } from 'vitest';
import { canTransition, getAllowedTransitions, determineCommitteeLevel, isValidCommitteeState } from './committee.js';

describe('Committee State Machine', () => {
  describe('canTransition', () => {
    test('allows null to draft transition (initial state entry)', () => {
      expect(canTransition(null, 'draft')).toBe(true);
    });

    test('blocks null to non-draft transitions', () => {
      expect(canTransition(null, 'presented')).toBe(false);
      expect(canTransition(null, 'discussion')).toBe(false);
      expect(canTransition(null, 'approved')).toBe(false);
      expect(canTransition(null, 'rejected')).toBe(false);
    });

    test('allows draft to presented', () => {
      expect(canTransition('draft', 'presented')).toBe(true);
    });

    test('blocks draft to other states', () => {
      expect(canTransition('draft', 'draft')).toBe(false);
      expect(canTransition('draft', 'discussion')).toBe(false);
      expect(canTransition('draft', 'approved')).toBe(false);
      expect(canTransition('draft', 'rejected')).toBe(false);
    });

    test('allows presented to discussion or rejected', () => {
      expect(canTransition('presented', 'discussion')).toBe(true);
      expect(canTransition('presented', 'rejected')).toBe(true);
    });

    test('blocks presented to other states', () => {
      expect(canTransition('presented', 'draft')).toBe(false);
      expect(canTransition('presented', 'presented')).toBe(false);
      expect(canTransition('presented', 'approved')).toBe(false);
    });

    test('allows discussion to approved, rejected, or back to presented', () => {
      expect(canTransition('discussion', 'approved')).toBe(true);
      expect(canTransition('discussion', 'rejected')).toBe(true);
      expect(canTransition('discussion', 'presented')).toBe(true);
    });

    test('blocks discussion to draft', () => {
      expect(canTransition('discussion', 'draft')).toBe(false);
      expect(canTransition('discussion', 'discussion')).toBe(false);
    });

    test('blocks approved to any state (terminal)', () => {
      expect(canTransition('approved', 'draft')).toBe(false);
      expect(canTransition('approved', 'presented')).toBe(false);
      expect(canTransition('approved', 'discussion')).toBe(false);
      expect(canTransition('approved', 'approved')).toBe(false);
      expect(canTransition('approved', 'rejected')).toBe(false);
    });

    test('blocks rejected to any state (terminal)', () => {
      expect(canTransition('rejected', 'draft')).toBe(false);
      expect(canTransition('rejected', 'presented')).toBe(false);
      expect(canTransition('rejected', 'discussion')).toBe(false);
      expect(canTransition('rejected', 'approved')).toBe(false);
      expect(canTransition('rejected', 'rejected')).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    test('returns [draft] for null state', () => {
      expect(getAllowedTransitions(null)).toEqual(['draft']);
    });

    test('returns [presented] for draft state', () => {
      expect(getAllowedTransitions('draft')).toEqual(['presented']);
    });

    test('returns [discussion, rejected] for presented state', () => {
      expect(getAllowedTransitions('presented')).toEqual(['discussion', 'rejected']);
    });

    test('returns [approved, rejected, presented] for discussion state', () => {
      expect(getAllowedTransitions('discussion')).toEqual(['approved', 'rejected', 'presented']);
    });

    test('returns [] for approved state (terminal)', () => {
      expect(getAllowedTransitions('approved')).toEqual([]);
    });

    test('returns [] for rejected state (terminal)', () => {
      expect(getAllowedTransitions('rejected')).toEqual([]);
    });
  });

  describe('determineCommitteeLevel', () => {
    // Mock database with EUR thresholds
    const mockDb = {
      select: () => ({
        from: () => ({
          innerJoin: () => ({
            orderBy: async () => [
              { id: 1, levelId: 1, levelName: 'not_necessary', maxAmount: '50000.00' },
              { id: 2, levelId: 2, levelName: 'optional', maxAmount: '250000.00' },
              { id: 3, levelId: 3, levelName: 'mandatory', maxAmount: null }, // Unlimited
            ],
          }),
        }),
      }),
    };

    test('returns not_necessary for budget below 50k EUR', async () => {
      expect(await determineCommitteeLevel(mockDb, 10000)).toBe('not_necessary');
      expect(await determineCommitteeLevel(mockDb, 49999.99)).toBe('not_necessary');
      expect(await determineCommitteeLevel(mockDb, 50000)).toBe('not_necessary');
    });

    test('returns optional for budget between 50k and 250k EUR', async () => {
      expect(await determineCommitteeLevel(mockDb, 50000.01)).toBe('optional');
      expect(await determineCommitteeLevel(mockDb, 100000)).toBe('optional');
      expect(await determineCommitteeLevel(mockDb, 250000)).toBe('optional');
    });

    test('returns mandatory for budget above 250k EUR', async () => {
      expect(await determineCommitteeLevel(mockDb, 250000.01)).toBe('mandatory');
      expect(await determineCommitteeLevel(mockDb, 500000)).toBe('mandatory');
      expect(await determineCommitteeLevel(mockDb, 1000000)).toBe('mandatory');
    });

    test('handles zero budget', async () => {
      expect(await determineCommitteeLevel(mockDb, 0)).toBe('not_necessary');
    });

    test('handles exact threshold boundaries', async () => {
      expect(await determineCommitteeLevel(mockDb, 50000.00)).toBe('not_necessary');
      expect(await determineCommitteeLevel(mockDb, 250000.00)).toBe('optional');
    });
  });

  describe('isValidCommitteeState', () => {
    test('validates correct committee states', () => {
      expect(isValidCommitteeState('draft')).toBe(true);
      expect(isValidCommitteeState('presented')).toBe(true);
      expect(isValidCommitteeState('discussion')).toBe(true);
      expect(isValidCommitteeState('approved')).toBe(true);
      expect(isValidCommitteeState('rejected')).toBe(true);
    });

    test('rejects invalid committee states', () => {
      expect(isValidCommitteeState('invalid')).toBe(false);
      expect(isValidCommitteeState('pending')).toBe(false);
      expect(isValidCommitteeState('active')).toBe(false);
      expect(isValidCommitteeState('')).toBe(false);
      expect(isValidCommitteeState('DRAFT')).toBe(false); // Case sensitive
    });
  });
});
