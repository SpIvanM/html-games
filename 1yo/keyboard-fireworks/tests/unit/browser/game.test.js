/**
 * Name: Browser Game Controller Tests
 * Description: Verifies DOM wiring, keyboard capture, overlay state changes, and animation cleanup for the toddler keyboard fireworks app.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToddlerFireworksGame } from '../../../src/game.js';

let currentGame;
let frameQueue;

function installAnimationQueue() {
  frameQueue = [];
  const requestAnimationFrame = vi.fn((callback) => {
    frameQueue.push(callback);
    return frameQueue.length;
  });

  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: requestAnimationFrame,
    writable: true
  });
}

function stepFrames(count, startTime = 16, delta = 160) {
  let frameTime = startTime;
  for (let index = 0; index < count; index += 1) {
    const callback = frameQueue.shift();
    if (!callback) {
      break;
    }
    callback(frameTime);
    frameTime += delta;
  }
}

function buildGameMarkup() {
  document.body.innerHTML = `
    <main data-testid="game-root" data-armed="false" data-focused="true" data-active-effects="0">
      <section id="stage" tabindex="0"></section>
      <div id="effects-layer"></div>
      <section id="launch-overlay">
        <h1 id="overlay-title"></h1>
        <p id="overlay-copy"></p>
      </section>
    </main>
  `;

  const root = document.querySelector('[data-testid="game-root"]');
  const stage = document.querySelector('#stage');
  const effectsLayer = document.querySelector('#effects-layer');
  const overlay = document.querySelector('#launch-overlay');
  const overlayTitle = document.querySelector('#overlay-title');
  const overlayCopy = document.querySelector('#overlay-copy');

  root.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  stage.focus = vi.fn();
  Object.defineProperty(stage, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ width: 900, height: 600, top: 0, left: 0, right: 900, bottom: 600 })
  });

  return { root, stage, effectsLayer, overlay, overlayTitle, overlayCopy };
}

function createGame() {
  const elements = buildGameMarkup();
  currentGame = new ToddlerFireworksGame(elements);
  return { ...elements, game: currentGame };
}

function detachGame(game) {
  game.stage.removeEventListener('pointerdown', game.handlePointerStart);
  game.overlay.removeEventListener('pointerdown', game.handlePointerStart);
  window.removeEventListener('keydown', game.handleKeyDown, true);
  window.removeEventListener('resize', game.handleResize);
  window.removeEventListener('blur', game.handleWindowBlur);
  window.removeEventListener('focus', game.handleWindowFocus);
  document.removeEventListener('visibilitychange', game.handleVisibilityChange);
}

beforeEach(() => {
  currentGame = null;
  installAnimationQueue();
});

afterEach(() => {
  if (currentGame) {
    detachGame(currentGame);
  }
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('ToddlerFireworksGame', () => {
  it('arms on pointer interaction and requests fullscreen once', async () => {
    const { game, root, stage, overlay } = createGame();
    game.attach();

    stage.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await Promise.resolve();

    expect(root.dataset.armed).toBe('true');
    expect(overlay.hidden).toBe(true);
    expect(root.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('captures regular keys, prevents default, and creates effects', () => {
    const { game, root } = createGame();
    game.attach();

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(root.dataset.armed).toBe('true');
    expect(root.dataset.activeEffects).toBe('1');
    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(1);
  });

  it('lets F11 pass through without creating an effect', () => {
    const { game } = createGame();
    game.attach();

    const event = new KeyboardEvent('keydown', { key: 'F11', bubbles: true, cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(0);
  });

  it('shows the refocus overlay after blur and hides it again on focus', () => {
    const { game, overlay, overlayTitle } = createGame();
    game.attach();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true, cancelable: true }));

    window.dispatchEvent(new Event('blur'));
    expect(overlay.hidden).toBe(false);
    expect(overlayTitle.textContent).toContain('Коснитесь');

    window.dispatchEvent(new Event('focus'));
    expect(overlay.hidden).toBe(true);
  });

  it('tracks visibility changes and updates focus state', () => {
    const { game, root, overlay } = createGame();
    game.attach();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true }));

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(root.dataset.focused).toBe('false');
    expect(overlay.hidden).toBe(false);

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(root.dataset.focused).toBe('true');
    expect(overlay.hidden).toBe(true);
  });

  it('removes expired effects as animation frames advance', () => {
    const { game, root } = createGame();
    game.attach();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true }));

    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(1);
    stepFrames(120);

    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(0);
    expect(root.dataset.activeEffects).toBe('0');
  });

  it('limits the number of active effects to 12', () => {
    const { game, root } = createGame();
    game.attach();

    for (let i = 0; i < 15; i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Key' + i, bubbles: true, cancelable: true }));
    }

    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(12);
    expect(root.dataset.activeEffects).toBe('12');
  });

  it('ignores consecutive identical key presses', () => {
    const { game, root } = createGame();
    game.attach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));

    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(1);
  });

  it('replaces old effect for a key if pressed non-consecutively', () => {
    const { game, root } = createGame();
    game.attach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true }));

    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(2);
    expect(root.dataset.activeEffects).toBe('2');
  });

  it('allows spawning the same key again after it has expired', () => {
    const { game } = createGame();
    game.attach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(1);

    // Immediate second press should be ignored
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(1);

    // Wait for it to expire
    stepFrames(150);
    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(0);

    // Pressing again should now work
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(1);
  });
});