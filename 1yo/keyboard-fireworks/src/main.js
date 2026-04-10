/**
 * Name: Toddler Game Entrypoint
 * Description: Boots the toddler keyboard fireworks app in the browser by locating page elements and attaching the main game controller.
 */
import { ToddlerFireworksGame } from './game.js';

const root = document.querySelector('[data-testid="game-root"]');
const stage = document.querySelector('#stage');
const effectsLayer = document.querySelector('#effects-layer');
const overlay = document.querySelector('#launch-overlay');
const overlayTitle = document.querySelector('#overlay-title');
const overlayCopy = document.querySelector('#overlay-copy');

if (!root || !stage || !effectsLayer || !overlay || !overlayTitle || !overlayCopy) {
  throw new Error('Toddler game boot failed: required DOM nodes are missing.');
}

const game = new ToddlerFireworksGame({
  root,
  stage,
  effectsLayer,
  overlay,
  overlayTitle,
  overlayCopy
});

game.attach();
window.toddlerFireworksGame = game;