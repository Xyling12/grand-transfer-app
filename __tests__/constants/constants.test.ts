/**
 * constants.test.ts — Tests for constants/Colors.ts, Spacing, Radius, FontSize
 * Skill: javascript-testing-patterns
 * Patterns: data integrity, contract tests, structural validation
 */
import { describe, it, expect } from 'vitest';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';

// ─── Colors ───────────────────────────────────────────────────────────────────

describe('Colors', () => {
    const hexRegex = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

    it('exports a Colors object', () => {
        expect(Colors).toBeDefined();
        expect(typeof Colors).toBe('object');
    });

    it('all color values are valid hex strings', () => {
        for (const [key, value] of Object.entries(Colors)) {
            expect(typeof value, `Colors.${key} should be a string`).toBe('string');
            expect(value, `Colors.${key} should be a hex color`).toMatch(hexRegex);
        }
    });

    it('has required semantic color tokens', () => {
        expect(Colors.success).toBeDefined();
        expect(Colors.danger).toBeDefined();
        expect(Colors.warning).toBeDefined();
        expect(Colors.primary).toBeDefined();
        expect(Colors.text).toBeDefined();
    });

    it('success is green (#22c55e)', () => {
        expect(Colors.success).toBe('#22c55e');
    });

    it('danger is red (#ef4444)', () => {
        expect(Colors.danger).toBe('#ef4444');
    });

    it('warning is yellow (#eab308)', () => {
        expect(Colors.warning).toBe('#eab308');
    });

    it('primary is golden (#D4A843)', () => {
        expect(Colors.primary).toBe('#D4A843');
    });

    it('bg is very dark (luminance near black)', () => {
        // #0a0a0a — almost black
        const r = parseInt(Colors.bg.slice(1, 3), 16);
        const g = parseInt(Colors.bg.slice(3, 5), 16);
        const b = parseInt(Colors.bg.slice(5, 7), 16);
        const luminance = (r + g + b) / 3;
        expect(luminance).toBeLessThan(30); // very dark
    });

    // Contract: primaryDark should be darker than primary (lower hex values)
    it('primaryDark hex is darker than primary', () => {
        const primaryVal = parseInt(Colors.primary.slice(1), 16);
        const primaryDarkVal = parseInt(Colors.primaryDark.slice(1), 16);
        expect(primaryDarkVal).toBeLessThan(primaryVal);
    });

    // Contract: primaryLight should be lighter than primary
    it('primaryLight hex is lighter than primary', () => {
        const primaryVal = parseInt(Colors.primary.slice(1), 16);
        const primaryLightVal = parseInt(Colors.primaryLight.slice(1), 16);
        expect(primaryLightVal).toBeGreaterThan(primaryVal);
    });
});

// ─── Spacing ──────────────────────────────────────────────────────────────────

describe('Spacing', () => {
    it('exports a Spacing object', () => {
        expect(Spacing).toBeDefined();
    });

    it('all spacing values are positive numbers', () => {
        for (const [key, value] of Object.entries(Spacing)) {
            expect(typeof value, `Spacing.${key} should be a number`).toBe('number');
            expect(value, `Spacing.${key} should be > 0`).toBeGreaterThan(0);
        }
    });

    it('has xs, sm, md, lg, xl, xxl, xxxl tokens', () => {
        expect(Spacing.xs).toBeDefined();
        expect(Spacing.sm).toBeDefined();
        expect(Spacing.md).toBeDefined();
        expect(Spacing.lg).toBeDefined();
        expect(Spacing.xl).toBeDefined();
        expect(Spacing.xxl).toBeDefined();
        expect(Spacing.xxxl).toBeDefined();
    });

    // Contract: values must be strictly increasing
    it('spacing scale is strictly increasing (xs < sm < ... < xxxl)', () => {
        expect(Spacing.xs).toBeLessThan(Spacing.sm);
        expect(Spacing.sm).toBeLessThan(Spacing.md);
        expect(Spacing.md).toBeLessThan(Spacing.lg);
        expect(Spacing.lg).toBeLessThan(Spacing.xl);
        expect(Spacing.xl).toBeLessThan(Spacing.xxl);
        expect(Spacing.xxl).toBeLessThan(Spacing.xxxl);
    });

    it('xs=4, sm=8 (base unit is 4px)', () => {
        expect(Spacing.xs).toBe(4);
        expect(Spacing.sm).toBe(8);
    });
});

// ─── Radius ───────────────────────────────────────────────────────────────────

describe('Radius', () => {
    it('all radius values are positive numbers', () => {
        for (const [key, value] of Object.entries(Radius)) {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThan(0);
        }
    });

    it('radius scale is strictly increasing (sm < md < lg < xl)', () => {
        expect(Radius.sm).toBeLessThan(Radius.md);
        expect(Radius.md).toBeLessThan(Radius.lg);
        expect(Radius.lg).toBeLessThan(Radius.xl);
    });

    it('full radius is very large (for pill/circle shapes)', () => {
        expect(Radius.full).toBeGreaterThanOrEqual(999);
    });
});

// ─── FontSize ─────────────────────────────────────────────────────────────────

describe('FontSize', () => {
    it('all font sizes are positive numbers ≥ 10', () => {
        for (const [key, value] of Object.entries(FontSize)) {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThanOrEqual(10);
        }
    });

    it('font size scale is strictly increasing', () => {
        expect(FontSize.xs).toBeLessThan(FontSize.sm);
        expect(FontSize.sm).toBeLessThan(FontSize.md);
        expect(FontSize.md).toBeLessThan(FontSize.lg);
        expect(FontSize.lg).toBeLessThan(FontSize.xl);
        expect(FontSize.xl).toBeLessThan(FontSize.xxl);
        expect(FontSize.xxl).toBeLessThan(FontSize.xxxl);
    });

    it('xs=11, sm=13, md=15, lg=17 (readable body text starts at 15)', () => {
        expect(FontSize.xs).toBe(11);
        expect(FontSize.sm).toBe(13);
        expect(FontSize.md).toBe(15);
        expect(FontSize.lg).toBe(17);
    });

    it('xxxl ≥ 30 (large display text)', () => {
        expect(FontSize.xxxl).toBeGreaterThanOrEqual(30);
    });
});
