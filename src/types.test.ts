import { describe, it, expect } from 'vitest';
import { riskLevel, RISK_MATRIX } from './types';

describe('riskLevel', () => {
  it('memetakan seluruh matriks severity x likelihood', () => {
    for (const [k, v] of Object.entries(RISK_MATRIX)) {
      const [s, l] = k.split('-').map(Number);
      expect(riskLevel(s, l)).toBe(v);
    }
  });
  it('fallback MEDIUM untuk kunci tak dikenal', () => {
    expect(riskLevel(0, 0)).toBe('MEDIUM');
    expect(riskLevel(9, 9)).toBe('MEDIUM');
  });
});
