/**
 * Name: Effect Engine Tests
 * Description: Verifies deterministic effect mapping and lifecycle updates for the toddler keyboard fireworks app.
 */
import { describe, expect, it } from 'vitest';
import {
  EFFECT_TYPES,
  renderEffect,
  resolveEffectForKey,
  spawnEffect,
  updateEffect
} from '../../src/effects.js';

const BOUNDS = { width: 1280, height: 720 };
const KEY_POOL = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
  'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
  'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3',
  '4', '5', '6', '7', '8', '9', 'Space', 'Enter', 'Shift',
  'Control', 'Alt', 'Meta', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
];

function sequenceRandom(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

function findKeyForEffect(effectType) {
  return KEY_POOL.find((key) => resolveEffectForKey(key).effectType === effectType);
}

function createStyleHost() {
  return {
    setProperty(name, value) {
      this[name] = value;
    }
  };
}

function createRenderElements(effect) {
  return {
    root: { style: createStyleHost() },
    aura: { style: createStyleHost() },
    burst: { style: createStyleHost() },
    label: { style: createStyleHost(), dataset: {}, textContent: '' },
    particles: effect.particles.map(() => ({ style: createStyleHost() }))
  };
}

describe('resolveEffectForKey', () => {
  it('returns a stable effect and palette for the same key', () => {
    const first = resolveEffectForKey('a');
    const second = resolveEffectForKey('a');

    expect(second).toEqual(first);
  });

  it('falls back to a safe unknown descriptor for invalid keys', () => {
    const descriptor = resolveEffectForKey(null);

    expect(descriptor.key).toBe('unknown');
    expect(descriptor.label).toBe('UNKNOWN');
  });

  it('spreads sample keys across the supported effect families', () => {
    const seenEffects = new Set(KEY_POOL.map((key) => resolveEffectForKey(key).effectType));

    expect([...seenEffects].every((effectType) => EFFECT_TYPES.includes(effectType))).toBe(true);
    expect(seenEffects.size).toBeGreaterThanOrEqual(4);
  });
});

describe('spawnEffect', () => {
  it('creates a fully-populated effect instance with particles', () => {
    const effect = spawnEffect('a', 1_000, BOUNDS, sequenceRandom([0.35, 0.6, 0.15, 0.85]));

    expect(effect.key).toBe('a');
    expect(effect.label).toBe('A');
    expect(effect.age).toBe(0);
    expect(effect.particles.length).toBeGreaterThanOrEqual(14);
    expect(effect.opacity).toBe(1);
  });

  it('uses specialized motion seeds for each non-bounce family', () => {
    const rabbitKey = findKeyForEffect('rabbit-hop');
    const spinKey = findKeyForEffect('spin-orbit');
    const pulseKey = findKeyForEffect('pulse-burst');

    expect(rabbitKey).toBeTruthy();
    expect(spinKey).toBeTruthy();
    expect(pulseKey).toBeTruthy();

    const rabbit = spawnEffect(rabbitKey, 0, BOUNDS, sequenceRandom([0.25, 0.45, 0.65, 0.85]));
    const spin = spawnEffect(spinKey, 0, BOUNDS, sequenceRandom([0.2, 0.4, 0.6, 0.8]));
    const pulse = spawnEffect(pulseKey, 0, BOUNDS, sequenceRandom([0.3, 0.5, 0.7, 0.9]));

    expect(rabbit.vx).toBeGreaterThanOrEqual(-110);
    expect(rabbit.vx).toBeLessThanOrEqual(110);
    expect(spin.vx).toBe(0);
    expect(pulse.vx).toBeGreaterThanOrEqual(-35);
    expect(pulse.vx).toBeLessThanOrEqual(35);
  });
});

describe('updateEffect', () => {
  it('advances motion and fades the effect over time', () => {
    const key = findKeyForEffect('float-pop') ?? 'a';
    const effect = spawnEffect(key, 0, BOUNDS, sequenceRandom([0.45, 0.25, 0.75, 0.35]));
    const startX = effect.x;
    const startY = effect.y;

    updateEffect(effect, 200, BOUNDS);

    expect(effect.age).toBe(200);
    expect(effect.opacity).toBeLessThan(1);
    expect(effect.x !== startX || effect.y !== startY).toBe(true);
  });

  it('reflects wall-bounce effects back into bounds', () => {
    const key = findKeyForEffect('wall-bounce');
    expect(key).toBeTruthy();

    const effect = spawnEffect(key, 0, BOUNDS, sequenceRandom([0.5, 0.5, 0.5, 0.5]));
    effect.x = 50;
    effect.y = 60;
    effect.vx = -240;
    effect.vy = -180;

    updateEffect(effect, 250, BOUNDS);

    expect(effect.vx).toBeGreaterThan(0);
    expect(effect.vy).toBeGreaterThan(0);
  });

  it('reflects wall-bounce effects off the far edges too', () => {
    const key = findKeyForEffect('wall-bounce');
    const effect = spawnEffect(key, 0, BOUNDS, sequenceRandom([0.5, 0.5, 0.5, 0.5]));
    effect.x = BOUNDS.width - 40;
    effect.y = BOUNDS.height - 40;
    effect.vx = 240;
    effect.vy = 180;

    updateEffect(effect, 250, BOUNDS);

    expect(effect.vx).toBeLessThan(0);
    expect(effect.vy).toBeLessThan(0);
  });

  it('force-expires remaining particles after a long overrun', () => {
    const effect = spawnEffect('space', 0, BOUNDS, sequenceRandom([0.2, 0.4, 0.6, 0.8]));

    updateEffect(effect, effect.lifetime + 1300, BOUNDS);

    expect(effect.particles.every((particle) => particle.expired)).toBe(true);
    expect(effect.expired).toBe(true);
  });

  it('returns immediately when the effect is already expired', () => {
    const effect = spawnEffect('a', 0, BOUNDS, sequenceRandom([0.4, 0.4, 0.4, 0.4]));
    effect.expired = true;

    updateEffect(effect, 500, BOUNDS);

    expect(effect.age).toBe(0);
  });

  it('updates pulse-burst effects through the default motion branch', () => {
    const key = findKeyForEffect('pulse-burst');
    const effect = spawnEffect(key, 0, BOUNDS, sequenceRandom([0.3, 0.5, 0.7, 0.9]));
    const startY = effect.y;

    updateEffect(effect, 180, BOUNDS);

    expect(effect.y).toBeLessThan(startY);
    expect(effect.scale).not.toBe(1);
  });

  it('expires effects and their particles after the lifetime elapses', () => {
    const effect = spawnEffect('z', 0, BOUNDS, sequenceRandom([0.2, 0.4, 0.6, 0.8]));

    for (let index = 0; index < 30; index += 1) {
      updateEffect(effect, 180, BOUNDS);
    }

    expect(effect.expired).toBe(true);
    expect(effect.particles.every((particle) => particle.expired)).toBe(true);
  });
});

describe('renderEffect', () => {
  it('writes computed motion and particle styles into DOM-like nodes', () => {
    const effect = spawnEffect('a', 0, BOUNDS, sequenceRandom([0.25, 0.5, 0.75, 0.1]));
    updateEffect(effect, 120, BOUNDS);
    const elements = createRenderElements(effect);

    renderEffect(effect, elements);

    expect(elements.root.style.transform).toContain('translate3d(');
    expect(elements.root.style['--effect-main']).toBe(effect.palette.main);
    expect(elements.label.textContent).toBe(effect.label);
    expect(elements.label.dataset.shadow).toBe(effect.label);
    expect(elements.particles[0].style.transform).toContain('translate3d(');
    expect(elements.particles[0].style['--particle-glow']).toBeTruthy();
  });
});