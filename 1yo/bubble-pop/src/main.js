import { initGame } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  if (container) {
    initGame(container);
  }
  
  // Disable context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());
});
