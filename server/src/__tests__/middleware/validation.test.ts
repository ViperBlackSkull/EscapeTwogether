import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateRoomCode,
  validatePlayerName,
  validateChatMessage,
  validatePuzzleAction,
} from '../../middleware/validation.js';

describe('validation', () => {
  describe('sanitizeString', () => {
    it('strips HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
    });

    it('strips nested HTML tags', () => {
      expect(sanitizeString('<b><i>hello</i></b>')).toBe('hello');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('returns clean strings unchanged', () => {
      expect(sanitizeString('hello world')).toBe('hello world');
    });
  });

  describe('validateRoomCode', () => {
    it('accepts valid 4-char alphanumeric codes', () => {
      expect(validateRoomCode('ABCD').valid).toBe(true);
      expect(validateRoomCode('1234').valid).toBe(true);
      expect(validateRoomCode('A1B2').valid).toBe(true);
    });

    it('accepts lowercase codes', () => {
      expect(validateRoomCode('abcd').valid).toBe(true);
    });

    it('rejects empty code', () => {
      expect(validateRoomCode('').valid).toBe(false);
    });

    it('rejects wrong length', () => {
      expect(validateRoomCode('ABC').valid).toBe(false);
      expect(validateRoomCode('ABCDE').valid).toBe(false);
    });

    it('rejects special characters', () => {
      expect(validateRoomCode('AB!D').valid).toBe(false);
      expect(validateRoomCode('A C ').valid).toBe(false);
    });

    it('rejects non-string input', () => {
      expect(validateRoomCode(null as any).valid).toBe(false);
    });
  });

  describe('validatePlayerName', () => {
    it('accepts valid names', () => {
      const result = validatePlayerName('Alice');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Alice');
    });

    it('accepts names with spaces', () => {
      const result = validatePlayerName('Alice Bob');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Alice Bob');
    });

    it('strips HTML from names', () => {
      const result = validatePlayerName('<b>Alice</b>');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Alice');
    });

    it('rejects empty name', () => {
      expect(validatePlayerName('').valid).toBe(false);
    });

    it('rejects name that is only whitespace after sanitize', () => {
      expect(validatePlayerName('   ').valid).toBe(false);
    });

    it('rejects name exceeding 20 chars', () => {
      expect(validatePlayerName('A'.repeat(21)).valid).toBe(false);
    });

    it('accepts name at exactly 20 chars', () => {
      expect(validatePlayerName('A'.repeat(20)).valid).toBe(true);
    });

    it('rejects names with special characters', () => {
      expect(validatePlayerName('Alice!').valid).toBe(false);
      expect(validatePlayerName('Alice@Bob').valid).toBe(false);
    });

    it('rejects non-string input', () => {
      expect(validatePlayerName(null as any).valid).toBe(false);
    });
  });

  describe('validateChatMessage', () => {
    it('accepts valid messages', () => {
      const result = validateChatMessage('Hello partner!');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello partner!');
    });

    it('strips HTML from messages', () => {
      const result = validateChatMessage('Check this <img src=x onerror=alert(1)>');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Check this');
    });

    it('rejects empty message', () => {
      expect(validateChatMessage('').valid).toBe(false);
    });

    it('rejects message over 500 chars', () => {
      expect(validateChatMessage('A'.repeat(501)).valid).toBe(false);
    });

    it('accepts message at exactly 500 chars', () => {
      expect(validateChatMessage('A'.repeat(500)).valid).toBe(true);
    });

    it('rejects non-string input', () => {
      expect(validateChatMessage(null as any).valid).toBe(false);
    });
  });

  describe('validatePuzzleAction', () => {
    it('accepts valid puzzle action', () => {
      const result = validatePuzzleAction({
        roomId: 'ABCD',
        puzzleId: 'cipher-lock-1',
        action: 'submit',
        data: { code: '1234' },
      });
      expect(result.valid).toBe(true);
    });

    it('rejects missing puzzleId', () => {
      const result = validatePuzzleAction({
        roomId: 'ABCD',
        puzzleId: '',
        action: 'submit',
        data: {},
      });
      expect(result.valid).toBe(false);
    });

    it('rejects missing action', () => {
      const result = validatePuzzleAction({
        roomId: 'ABCD',
        puzzleId: 'cipher-lock-1',
        action: '',
        data: {},
      });
      expect(result.valid).toBe(false);
    });

    it('rejects action that is too long', () => {
      const result = validatePuzzleAction({
        roomId: 'ABCD',
        puzzleId: 'test',
        action: 'A'.repeat(51),
        data: {},
      });
      expect(result.valid).toBe(false);
    });

    it('rejects oversized data', () => {
      const result = validatePuzzleAction({
        roomId: 'ABCD',
        puzzleId: 'test',
        action: 'submit',
        data: { big: 'X'.repeat(600) },
      });
      expect(result.valid).toBe(false);
    });

    it('rejects non-object payload', () => {
      expect(validatePuzzleAction(null as any).valid).toBe(false);
      expect(validatePuzzleAction('string' as any).valid).toBe(false);
    });
  });
});
