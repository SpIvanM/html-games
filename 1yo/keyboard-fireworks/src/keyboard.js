/**
 * Name: Keyboard Input Helpers
 * Description: Normalizes browser keyboard events for the toddler keyboard fireworks app. Usage: import the helpers from event handlers to turn raw `KeyboardEvent.key` values into stable effect keys, readable labels, and passthrough decisions.
 */
const KEY_ALIASES = new Map([
  [' ', 'Space'],
  ['Spacebar', 'Space'],
  ['Esc', 'Escape'],
  ['OS', 'Meta'],
  ['Win', 'Meta'],
  ['Left', 'ArrowLeft'],
  ['Right', 'ArrowRight'],
  ['Up', 'ArrowUp'],
  ['Down', 'ArrowDown'],
  ['Apps', 'ContextMenu']
]);

const DISPLAY_LABELS = new Map([
  ['Alt', 'ALT'],
  ['ArrowDown', 'DOWN'],
  ['ArrowLeft', 'LEFT'],
  ['ArrowRight', 'RIGHT'],
  ['ArrowUp', 'UP'],
  ['Backspace', 'BACKSPACE'],
  ['CapsLock', 'CAPS'],
  ['ContextMenu', 'MENU'],
  ['Control', 'CTRL'],
  ['Delete', 'DELETE'],
  ['End', 'END'],
  ['Enter', 'ENTER'],
  ['Escape', 'ESC'],
  ['Home', 'HOME'],
  ['Insert', 'INSERT'],
  ['Meta', 'WIN'],
  ['PageDown', 'PAGE DOWN'],
  ['PageUp', 'PAGE UP'],
  ['Shift', 'SHIFT'],
  ['Space', 'SPACE'],
  ['Tab', 'TAB']
]);

export function normalizeKey(event) {
  if (!event || typeof event.key !== 'string' || event.key.length === 0) {
    return null;
  }

  const aliasedKey = KEY_ALIASES.get(event.key) ?? event.key;
  if (aliasedKey === 'Unidentified') {
    return null;
  }

  if (aliasedKey.length === 1) {
    if (/\s/u.test(aliasedKey)) {
      return 'Space';
    }
    return aliasedKey.toLocaleLowerCase();
  }

  return aliasedKey;
}

export function formatKeyLabel(key) {
  if (!key) {
    return '?';
  }

  const mappedLabel = DISPLAY_LABELS.get(key);
  if (mappedLabel) {
    return mappedLabel;
  }

  if (key.length === 1) {
    return key.toLocaleUpperCase();
  }

  return key.toUpperCase();
}

export function shouldAllowBrowserDefault(event) {
  return normalizeKey(event) === 'F11';
}

export function shouldPreventDefault(event) {
  const normalizedKey = normalizeKey(event);
  return normalizedKey !== null && normalizedKey !== 'F11';
}