/**
 * Name: Effect Engine
 * Description: Resolves keys into deterministic effect families and drives motion, particles, and DOM rendering for the toddler keyboard fireworks app. Usage: call `resolveEffectForKey`, `spawnEffect`, `updateEffect`, and `renderEffect` from the game loop.
 */
import { formatKeyLabel } from './keyboard.js';

export const EFFECT_TYPES = Object.freeze([
  'float-pop',
  'rabbit-hop',
  'spin-orbit',
  'wall-bounce',
  'pulse-burst'
]);

const PALETTES = Object.freeze([
  { main: '#ff7a59', glow: '#ffd166', accent: '#ff4d8d' },
  { main: '#3ed8d3', glow: '#a8fff6', accent: '#2f7ef7' },
  { main: '#ff5dc8', glow: '#ffd4fa', accent: '#8f61ff' },
  { main: '#7cf05a', glow: '#d9ff92', accent: '#ff9a1f' },
  { main: '#ffb703', glow: '#fff2a8', accent: '#ff4d6d' }
]);

const EFFECT_LIFETIMES = Object.freeze({
  'float-pop': 2800,
  'rabbit-hop': 2700,
  'spin-orbit': 3000,
  'wall-bounce': 3200,
  'pulse-burst': 2500
});

const DEFAULT_BOUNDS = Object.freeze({ width: 1280, height: 720 });
let effectSerial = 0;

function hashKey(key) {
  let hash = 2166136261;
  for (const character of key) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(randomSource, min, max) {
  return min + (max - min) * randomSource();
}

function createParticleState(palette, randomSource) {
  const angle = randomBetween(randomSource, 0, Math.PI * 2);
  const speed = randomBetween(randomSource, 70, 250);
  return {
    x: 0,
    y: 0,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - randomBetween(randomSource, 10, 70),
    age: 0,
    duration: randomBetween(randomSource, 900, 1600),
    size: randomBetween(randomSource, 0.7, 1.35),
    opacity: 1,
    glow: randomSource() > 0.5 ? palette.glow : palette.accent,
    expired: false
  };
}

function updateParticle(particle, dtMilliseconds) {
  if (particle.expired) {
    return;
  }

  particle.age += dtMilliseconds;
  if (particle.age >= particle.duration) {
    particle.opacity = 0;
    particle.expired = true;
    return;
  }

  const dtSeconds = dtMilliseconds / 1000;
  particle.x += particle.vx * dtSeconds;
  particle.y += particle.vy * dtSeconds;
  particle.vy += 110 * dtSeconds;
  particle.opacity = Math.max(0, 1 - particle.age / particle.duration);
}

export function resolveEffectForKey(key) {
  const stableKey = typeof key === 'string' && key.length > 0 ? key : 'unknown';
  const hash = hashKey(stableKey);
  const effectType = EFFECT_TYPES[hash % EFFECT_TYPES.length];
  const palette = PALETTES[Math.floor(hash / EFFECT_TYPES.length) % PALETTES.length];

  return {
    key: stableKey,
    label: formatKeyLabel(stableKey),
    effectType,
    palette,
    hash
  };
}

export function spawnEffect(key, timestamp, bounds = DEFAULT_BOUNDS, randomSource = Math.random) {
  const descriptor = resolveEffectForKey(key);
  const width = Math.max(bounds.width ?? DEFAULT_BOUNDS.width, 320);
  const height = Math.max(bounds.height ?? DEFAULT_BOUNDS.height, 240);
  const marginX = Math.min(140, width * 0.18);
  const marginY = Math.min(120, height * 0.18);
  const x = randomBetween(randomSource, marginX, width - marginX);
  const y = randomBetween(randomSource, marginY, height - marginY);
  const particleCount = 14 + Math.floor(randomSource() * 7);
  const effectType = descriptor.effectType;

  const effect = {
    id: `effect-${timestamp}-${effectSerial}`,
    key: descriptor.key,
    label: descriptor.label,
    effectType,
    palette: descriptor.palette,
    hash: descriptor.hash,
    x,
    y,
    startX: x,
    startY: y,
    age: 0,
    lifetime: EFFECT_LIFETIMES[effectType],
    opacity: 1,
    scale: 1,
    rotation: 0,
    blur: 0,
    glowOpacity: 1,
    ringScale: 0.92,
    expired: false,
    phase: randomBetween(randomSource, 0, Math.PI * 2),
    swayAmplitude: randomBetween(randomSource, 18, 40),
    orbitRadius: randomBetween(randomSource, 26, 54),
    orbitSpeed: randomBetween(randomSource, 1.1, 2.3),
    hopHeight: randomBetween(randomSource, 34, 70),
    pulseAmplitude: randomBetween(randomSource, 0.12, 0.3),
    vx: randomBetween(randomSource, -90, 90),
    vy: randomBetween(randomSource, -120, -45),
    particles: Array.from({ length: particleCount }, () => createParticleState(descriptor.palette, randomSource))
  };

  if (effectType === 'wall-bounce') {
    effect.vx = randomBetween(randomSource, 170, 280) * (randomSource() > 0.5 ? 1 : -1);
    effect.vy = randomBetween(randomSource, 150, 240) * (randomSource() > 0.5 ? 1 : -1);
  } else if (effectType === 'rabbit-hop') {
    effect.vx = randomBetween(randomSource, -110, 110);
    effect.vy = randomBetween(randomSource, -40, 10);
  } else if (effectType === 'pulse-burst') {
    effect.vx = randomBetween(randomSource, -35, 35);
    effect.vy = randomBetween(randomSource, -35, 5);
  } else if (effectType === 'spin-orbit') {
    effect.vx = 0;
    effect.vy = randomBetween(randomSource, -35, -10);
  }

  effectSerial += 1;
  return effect;
}

export function updateEffect(effect, dtMilliseconds, bounds = DEFAULT_BOUNDS) {
  if (effect.expired) {
    return;
  }

  const width = Math.max(bounds.width ?? DEFAULT_BOUNDS.width, 320);
  const height = Math.max(bounds.height ?? DEFAULT_BOUNDS.height, 240);
  const dtSeconds = dtMilliseconds / 1000;

  effect.age += dtMilliseconds;
  const progress = clamp(effect.age / effect.lifetime, 0, 1);
  const remaining = 1 - progress;

  switch (effect.effectType) {
    case 'float-pop': {
      effect.x = effect.startX + Math.sin(effect.phase + effect.age * 0.006) * effect.swayAmplitude;
      effect.y -= (90 + effect.swayAmplitude * 0.4) * dtSeconds;
      effect.rotation = Math.sin(effect.phase + effect.age * 0.004) * 9;
      effect.scale = 1.1 + Math.sin(effect.age * 0.014) * 0.08 - progress * 0.18;
      break;
    }
    case 'rabbit-hop': {
      effect.x += effect.vx * dtSeconds;
      effect.y = effect.startY - Math.abs(Math.sin(effect.age * 0.011 + effect.phase)) * effect.hopHeight - progress * 72;
      effect.rotation = Math.sin(effect.age * 0.018 + effect.phase) * 12;
      effect.scale = 1.03 + Math.abs(Math.sin(effect.age * 0.013)) * 0.18 - progress * 0.1;
      break;
    }
    case 'spin-orbit': {
      const orbitAngle = effect.phase + (effect.age / 1000) * effect.orbitSpeed * Math.PI;
      const orbitRadius = effect.orbitRadius * (1 - progress * 0.25);
      effect.x = effect.startX + Math.cos(orbitAngle) * orbitRadius;
      effect.y = effect.startY + Math.sin(orbitAngle) * orbitRadius * 0.6 - progress * 96;
      effect.rotation += dtMilliseconds * 0.18;
      effect.scale = 0.96 + Math.sin(effect.age * 0.016) * 0.12 + remaining * 0.14;
      break;
    }
    case 'wall-bounce': {
      const margin = 52;
      effect.x += effect.vx * dtSeconds;
      effect.y += effect.vy * dtSeconds;

      if (effect.x <= margin) {
        effect.x = margin;
        effect.vx = Math.abs(effect.vx);
      } else if (effect.x >= width - margin) {
        effect.x = width - margin;
        effect.vx = -Math.abs(effect.vx);
      }

      if (effect.y <= margin) {
        effect.y = margin;
        effect.vy = Math.abs(effect.vy);
      } else if (effect.y >= height - margin) {
        effect.y = height - margin;
        effect.vy = -Math.abs(effect.vy);
      }

      effect.rotation += dtMilliseconds * 0.11;
      effect.scale = 1 + Math.sin(effect.age * 0.015) * 0.08 - progress * 0.14;
      break;
    }
    case 'pulse-burst':
    default: {
      effect.x += effect.vx * dtSeconds;
      effect.y += effect.vy * dtSeconds - 26 * dtSeconds;
      effect.rotation = Math.sin(effect.phase + effect.age * 0.015) * 5;
      effect.scale = 1.02 + Math.sin(effect.age * 0.02) * effect.pulseAmplitude + remaining * 0.18;
      break;
    }
  }

  effect.opacity = Math.max(0, Math.pow(remaining, 1.45));
  effect.glowOpacity = Math.max(0, Math.pow(remaining, 0.8));
  effect.ringScale = 0.88 + progress * 1.25;
  effect.blur = progress * 4;

  for (const particle of effect.particles) {
    updateParticle(particle, dtMilliseconds);
  }

  if (effect.age >= effect.lifetime + 1200) {
    for (const particle of effect.particles) {
      particle.opacity = 0;
      particle.expired = true;
    }
  }

  effect.expired = effect.age >= effect.lifetime && effect.particles.every((particle) => particle.expired);
}

export function renderEffect(effect, elements) {
  const { aura, burst, label, particles, root } = elements;
  root.style.transform = `translate3d(${effect.x}px, ${effect.y}px, 0) translate(-50%, -50%) rotate(${effect.rotation.toFixed(2)}deg) scale(${effect.scale.toFixed(3)})`;
  root.style.opacity = effect.opacity.toFixed(3);
  root.style.filter = `drop-shadow(0 0 ${24 + effect.glowOpacity * 30}px ${effect.palette.glow}) blur(${effect.blur.toFixed(2)}px)`;
  root.style.setProperty('--effect-main', effect.palette.main);
  root.style.setProperty('--effect-glow', effect.palette.glow);
  root.style.setProperty('--effect-accent', effect.palette.accent);
  aura.style.opacity = effect.glowOpacity.toFixed(3);
  aura.style.transform = `translate(-50%, -50%) scale(${effect.ringScale.toFixed(3)})`;
  burst.style.opacity = Math.max(0, effect.opacity * 0.55).toFixed(3);
  burst.style.transform = `translate(-50%, -50%) scale(${(0.72 + effect.ringScale * 0.55).toFixed(3)}) rotate(${(-effect.rotation).toFixed(2)}deg)`;
  label.textContent = effect.label;
  label.dataset.shadow = effect.label;

  for (let index = 0; index < particles.length; index += 1) {
    const particleElement = particles[index];
    const particle = effect.particles[index];
    particleElement.style.transform = `translate3d(${particle.x.toFixed(1)}px, ${particle.y.toFixed(1)}px, 0) scale(${particle.size.toFixed(2)})`;
    particleElement.style.opacity = particle.opacity.toFixed(3);
    particleElement.style.setProperty('--particle-color', particle.expired ? 'transparent' : effect.palette.main);
    particleElement.style.setProperty('--particle-glow', particle.glow);
  }
}