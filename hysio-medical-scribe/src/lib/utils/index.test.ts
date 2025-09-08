import { cn, formatDuration, generateId, formatDate } from './index';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to MM:SS format', () => {
      expect(formatDuration(65)).toBe('01:05');
      expect(formatDuration(3661)).toBe('61:01');
      expect(formatDuration(30)).toBe('00:30');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(10);
    });
  });

  describe('formatDate', () => {
    it('should format date in Dutch locale', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).toContain('januari');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('10:30');
    });
  });
});