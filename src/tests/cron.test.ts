import { cronToBackend, cronFromBackend } from '../lib/cron';

// Mock timezone offset for consistent testing
const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

describe('cron.ts utility functions', () => {
  beforeEach(() => {
    // Mock timezone offset to be UTC+0 (returns 0)
    Date.prototype.getTimezoneOffset = jest.fn(() => 0);
  });

  afterEach(() => {
    Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
  });

  describe('cronToBackend', () => {
    it('should convert L to $ in cron expression', () => {
      const expression = '0 10 L * *'; // Last day of month
      const result = cronToBackend(expression);
      expect(result).toContain('$');
      expect(result).not.toContain('L');
    });

    it('should handle standard cron expression with UTC timezone', () => {
      const expression = '0 10 * * 1'; // Every Monday at 10:00
      const result = cronToBackend(expression);
      expect(result).toBe('0 10 * * 1');
    });

    it('should handle daily cron expression', () => {
      const expression = '30 14 * * *'; // Every day at 14:30
      const result = cronToBackend(expression);
      expect(result).toContain('30');
      expect(result).toContain('14');
    });

    it('should handle cron with timezone offset', () => {
      // Simulate being in UTC+2 (offset = -120)
      Date.prototype.getTimezoneOffset = jest.fn(() => -120);
      
      const expression = '0 10 * * *'; // 10:00 local time
      const result = cronToBackend(expression);
      
      // Should convert to UTC (subtract 2 hours)
      expect(result).toContain('8'); // 10:00 - 2 hours = 08:00 UTC
    });

    it('should handle midnight edge case', () => {
      Date.prototype.getTimezoneOffset = jest.fn(() => 60); // UTC-1
      
      const expression = '0 0 * * *'; // Midnight
      const result = cronToBackend(expression);
      
      // Should handle day boundary correctly
      expect(result).toBeTruthy();
    });
  });

  describe('cronFromBackend', () => {
    it('should handle standard cron expression with UTC timezone', () => {
      const expression = '0 10 * * 1'; // Every Monday at 10:00
      const result = cronFromBackend(expression);
      expect(result).toBe('0 10 * * 1');
    });

    it('should reverse timezone conversion', () => {
      // Simulate being in UTC+2 (offset = -120)
      Date.prototype.getTimezoneOffset = jest.fn(() => -120);
      
      const expression = '0 8 * * *'; // 08:00 UTC from backend
      const result = cronFromBackend(expression);
      
      // Should convert to local time (add 2 hours)
      expect(result).toContain('10'); // 08:00 + 2 hours = 10:00 local
    });

    it('should handle round-trip conversion', () => {
      const original = '0 15 * * 3'; // Every Wednesday at 15:00
      const toBackend = cronToBackend(original);
      const backToFront = cronFromBackend(toBackend);
      
      expect(backToFront).toBe(original);
    });
  });

  describe('edge cases and timezone handling', () => {
    it('should handle negative timezone offset (east of UTC)', () => {
      Date.prototype.getTimezoneOffset = jest.fn(() => -480); // UTC+8
      
      const expression = '0 18 * * *'; // 18:00 local
      const result = cronToBackend(expression);
      
      // Should convert to UTC (subtract 8 hours)
      expect(result).toContain('10'); // 18:00 - 8 = 10:00 UTC
    });

    it('should handle positive timezone offset (west of UTC)', () => {
      Date.prototype.getTimezoneOffset = jest.fn(() => 300); // UTC-5
      
      const expression = '0 10 * * *'; // 10:00 local
      const result = cronToBackend(expression);
      
      // Should convert to UTC (add 5 hours)
      expect(result).toContain('15'); // 10:00 + 5 = 15:00 UTC
    });

    it('should handle complex cron expression', () => {
      const expression = '15 10 1,15 * *'; // 1st and 15th of month at 10:15
      const result = cronToBackend(expression);
      
      expect(result).toBeTruthy();
      expect(result).toContain('15'); // minutes
    });

    it('should handle weekly cron expression', () => {
      const expression = '0 9 * * 1-5'; // Weekdays at 9:00
      const result = cronToBackend(expression);
      
      expect(result).toBeTruthy();
      expect(result).toContain('9');
    });
  });
});
