/**
 * translations.test.ts — Deep tests for utils/translations.ts
 * Skill: javascript-testing-patterns
 * Patterns: test.each, exhaustive coverage, edge cases, contract tests
 */
import { describe, it, expect } from 'vitest';
import {
    translateTariff,
    translateStatus,
    translateRole,
    statusColor,
    statusEmoji,
} from '../../utils/translations';

// ─── translateTariff ──────────────────────────────────────────────────────────

describe('translateTariff', () => {
    // --- Happy path: all known tariffs
    it.each([
        ['standart', 'Стандарт'],
        ['econom', 'Эконом'],
        ['comfort', 'Комфорт'],
        ['minivan', 'Минивэн'],
        ['business', 'Бизнес'],
    ])('translates "%s" → "%s"', (input, expected) => {
        expect(translateTariff(input)).toBe(expected);
    });

    // --- Case insensitive (switch uses toLowerCase)
    it.each([
        ['STANDART', 'Стандарт'],
        ['ECONOM', 'Эконом'],
        ['COMFORT', 'Комфорт'],
        ['MINIVAN', 'Минивэн'],
        ['BUSINESS', 'Бизнес'],
        ['Standart', 'Стандарт'],
    ])('is case-insensitive: "%s" → "%s"', (input, expected) => {
        expect(translateTariff(input)).toBe(expected);
    });

    // --- Unknown values returned as-is
    it.each([
        ['vip'],
        ['premium'],
        [''],
        ['UNKNOWN'],
    ])('returns unknown tariff "%s" as-is', (input) => {
        expect(translateTariff(input)).toBe(input);
    });

    // --- Null/undefined guard
    it('handles null gracefully (returns null)', () => {
        expect(translateTariff(null as any)).toBeNull();
    });

    it('handles undefined gracefully (returns undefined)', () => {
        expect(translateTariff(undefined as any)).toBeUndefined();
    });
});

// ─── translateStatus ──────────────────────────────────────────────────────────

describe('translateStatus', () => {
    const STATUS_MAP = [
        ['NEW', 'Новая'],
        ['PROCESSING', 'В обработке'],
        ['DISPATCHED', 'Поиск водителя'],
        ['TAKEN', 'Взят в работу'],
        ['COMPLETED', 'Выполнена'],
        ['CANCELLED', 'Отменена'],
    ] as const;

    it.each(STATUS_MAP)('translates status "%s" → "%s"', (status, expected) => {
        expect(translateStatus(status)).toBe(expected);
    });

    // All statuses covered — no gaps
    it('covers all 6 known statuses', () => {
        expect(STATUS_MAP).toHaveLength(6);
    });

    it('returns unknown status as-is', () => {
        expect(translateStatus('PENDING')).toBe('PENDING');
        expect(translateStatus('')).toBe('');
        expect(translateStatus('WEIRD')).toBe('WEIRD');
    });

    // Status is case-sensitive (no toLowerCase in this impl)
    it('is case-sensitive: "new" is not translated', () => {
        expect(translateStatus('new')).toBe('new'); // lowercase not matched
    });
});

// ─── translateRole ────────────────────────────────────────────────────────────

describe('translateRole', () => {
    it.each([
        ['ADMIN', 'Админ'],
        ['DISPATCHER', 'Диспетчер'],
        ['DRIVER', 'Водитель'],
        ['USER', 'Пользователь'],
    ])('translates role "%s" → "%s"', (role, expected) => {
        expect(translateRole(role)).toBe(expected);
    });

    it('returns unknown role as-is', () => {
        expect(translateRole('SUPERADMIN')).toBe('SUPERADMIN');
        expect(translateRole('')).toBe('');
    });
});

// ─── statusColor ──────────────────────────────────────────────────────────────

describe('statusColor', () => {
    it.each([
        ['NEW', '#3b82f6'],        // blue
        ['PROCESSING', '#a78bfa'], // purple
        ['DISPATCHED', '#eab308'], // yellow
        ['TAKEN', '#22c55e'],      // green
        ['COMPLETED', '#22c55e'],  // green (same as TAKEN)
        ['CANCELLED', '#ef4444'],  // red
    ])('color for status "%s" is "%s"', (status, color) => {
        expect(statusColor(status)).toBe(color);
    });

    it('returns grey #9ca3af for unknown status', () => {
        expect(statusColor('UNKNOWN')).toBe('#9ca3af');
        expect(statusColor('')).toBe('#9ca3af');
    });

    it('all returned colors are valid hex codes', () => {
        const statuses = ['NEW', 'PROCESSING', 'DISPATCHED', 'TAKEN', 'COMPLETED', 'CANCELLED', 'UNKNOWN'];
        const hexRegex = /^#[0-9a-f]{6}$/i;
        for (const s of statuses) {
            expect(statusColor(s)).toMatch(hexRegex);
        }
    });

    // Contract test: TAKEN and COMPLETED should have the SAME color (both in progress/success)
    it('TAKEN and COMPLETED have the same color (both success green)', () => {
        expect(statusColor('TAKEN')).toBe(statusColor('COMPLETED'));
    });
});

// ─── statusEmoji ──────────────────────────────────────────────────────────────

describe('statusEmoji', () => {
    it.each([
        ['NEW', '🔵'],
        ['PROCESSING', '🟣'],
        ['DISPATCHED', '🟡'],
        ['TAKEN', '🟢'],
        ['COMPLETED', '✅'],
        ['CANCELLED', '❌'],
    ])('emoji for status "%s" is "%s"', (status, emoji) => {
        expect(statusEmoji(status)).toBe(emoji);
    });

    it('returns ⚪ for unknown status', () => {
        expect(statusEmoji('UNKNOWN')).toBe('⚪');
        expect(statusEmoji('')).toBe('⚪');
    });

    // Consistency: statusColor and statusEmoji should both cover same statuses
    it('all statuses with non-grey color have a non-white emoji', () => {
        const knownStatuses = ['NEW', 'PROCESSING', 'DISPATCHED', 'TAKEN', 'COMPLETED', 'CANCELLED'];
        for (const s of knownStatuses) {
            expect(statusColor(s)).not.toBe('#9ca3af');
            expect(statusEmoji(s)).not.toBe('⚪');
        }
    });
});
