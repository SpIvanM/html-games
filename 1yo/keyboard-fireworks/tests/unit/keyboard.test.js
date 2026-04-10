/**
 * Name: Keyboard Helper Tests
 * Description: Verifies key normalization, label formatting, and browser-default passthrough rules for the toddler keyboard fireworks app.
 */
import { describe, expect, it } from 'vitest';
import {
  formatKeyLabel,
  normalizeKey,
  shouldAllowBrowserDefault,
  shouldPreventDefault
} from '../../src/keyboard.js';

describe('normalizeKey', () => {
  it('normalizes printable letters and digits into stable keys', () => {
    expect(normalizeKey({ key: 'A' })).toBe('a');
    expect(normalizeKey({ key: 'я' })).toBe('я');
    expect(normalizeKey({ key: '7' })).toBe('7');
  });

  it('maps browser aliases for control keys', () => {
    expect(normalizeKey({ key: ' ' })).toBe('Space');
    expect(normalizeKey({ key: 'Spacebar' })).toBe('Space');
    expect(normalizeKey({ key: 'OS' })).toBe('Meta');
    expect(normalizeKey({ key: 'Esc' })).toBe('Escape');
  });

  it('keeps named control keys readable', () => {
    expect(normalizeKey({ key: 'Shift' })).toBe('Shift');
    expect(normalizeKey({ key: 'Control' })).toBe('Control');
    expect(normalizeKey({ key: 'ArrowLeft' })).toBe('ArrowLeft');
    expect(normalizeKey({ key: 'Enter' })).toBe('Enter');
  });

  it('returns null for missing or unidentified keys', () => {
    expect(normalizeKey(null)).toBeNull();
    expect(normalizeKey({ key: '' })).toBeNull();
    expect(normalizeKey({ key: 'Unidentified' })).toBeNull();
  });
});

describe('formatKeyLabel', () => {
  it('formats printable and non-printable keys for large on-screen labels', () => {
    expect(formatKeyLabel('a')).toBe('A');
    expect(formatKeyLabel('я')).toBe('Я');
    expect(formatKeyLabel('Space')).toBe('SPACE');
    expect(formatKeyLabel('Meta')).toBe('WIN');
    expect(formatKeyLabel('ArrowRight')).toBe('RIGHT');
  });

  it('falls back safely for empty or uncommon keys', () => {
    expect(formatKeyLabel(null)).toBe('?');
    expect(formatKeyLabel('Pause')).toBe('PAUSE');
  });
});

describe('browser default rules', () => {
  it('lets F11 pass through and captures other keys', () => {
    expect(shouldAllowBrowserDefault({ key: 'F11' })).toBe(true);
    expect(shouldAllowBrowserDefault({ key: 'F12' })).toBe(false);
    expect(shouldAllowBrowserDefault({ key: 'a' })).toBe(false);
  });

  it('prevents defaults only for supported captured keys', () => {
    expect(shouldPreventDefault({ key: 'a' })).toBe(true);
    expect(shouldPreventDefault({ key: 'F11' })).toBe(false);
    expect(shouldPreventDefault({ key: 'Unidentified' })).toBe(false);
  });
});