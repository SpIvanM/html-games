/**
 * Name: Browser Entrypoint Tests
 * Description: Verifies that the browser entrypoint boots the toddler keyboard fireworks app and exposes the controller for debugging.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

function buildMarkup() {
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
  root.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  stage.focus = vi.fn();
  Object.defineProperty(stage, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ width: 900, height: 600, top: 0, left: 0, right: 900, bottom: 600 })
  });

  return { root, stage };
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
  vi.resetModules();
});

afterEach(() => {
  currentGame = window.toddlerFireworksGame ?? currentGame;
  if (currentGame) {
    detachGame(currentGame);
  }
  delete window.toddlerFireworksGame;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('main.js', () => {
  it('boots the game and exposes the controller on window', async () => {
    const { root } = buildMarkup();

    await import('../../../src/main.js');
    currentGame = window.toddlerFireworksGame;

    expect(currentGame).toBeTruthy();
    expect(root.dataset.armed).toBe('false');

    const event = new KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.querySelectorAll('[data-testid="effect"]').length).toBe(1);
  });

  it('throws a clear error when the required DOM nodes are missing', async () => {
    document.body.innerHTML = '';

    vi.resetModules();
    await expect(import('../../../src/main.js')).rejects.toThrow(
      'Toddler game boot failed: required DOM nodes are missing.'
    );
  });
});