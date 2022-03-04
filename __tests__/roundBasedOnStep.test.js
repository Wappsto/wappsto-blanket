import { roundBasedOnStep } from '../src';

describe('roundBasedOnStep', () => {
  it('can round', () => {
    expect(roundBasedOnStep(10, 1, 1)).toBe('10');
    expect(roundBasedOnStep('bla', 1, 1)).toBe('bla');
    expect(roundBasedOnStep(10, 0, 1)).toBe(10);
    expect(roundBasedOnStep(10.1, 0.5, 1)).toBe('10.0');
    expect(roundBasedOnStep(10.7, 0.5, 1)).toBe('10.5');
    expect(roundBasedOnStep(10.7, 0.5, 20)).toBe('10.5');
    expect(roundBasedOnStep(1e-7, 0.5, 20)).toBe('0.0');
    expect(roundBasedOnStep(1.11111111, 1e-10, 20)).toBe('1.1111111100');
    expect(roundBasedOnStep(-1.11111111, 1e-10, 20)).toBe('-1.1111111100');
  });
});
