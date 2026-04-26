const LETTERS = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6C5CE7', '#FF8ED4', '#A8E6CF'];
import { playSound } from './audio.js';

export function initGame(container) {
  if (!container) return;
  
  container.dataset.initialized = "true";
  
  // Game loop for generating bubbles (to be used later or started here)
  // setInterval(() => createBubble(container), 2000);

  // Mouse move interaction
  container.addEventListener('mousemove', (e) => {
    const bubbles = container.querySelectorAll('.bubble');
    bubbles.forEach(bubble => {
      const jitterX = (Math.random() - 0.5) * 20;
      const jitterY = (Math.random() - 0.5) * 20;
      bubble.style.transform = `translate(${jitterX}px, ${jitterY}px)`;
    });
  });

  // Mouse click interaction
  container.addEventListener('mousedown', (e) => {
    let targetBubble = null;
    if (e.target.classList.contains('bubble')) {
      targetBubble = e.target;
    } else {
      const bubbles = Array.from(container.querySelectorAll('.bubble'));
      if (bubbles.length > 0) {
        targetBubble = bubbles[Math.floor(Math.random() * bubbles.length)];
      }
    }

    if (targetBubble) {
      let clickType = 'left';
      if (e.buttons === 3) clickType = 'both';
      else if (e.button === 2) clickType = 'right';
      else if (e.button === 1) clickType = 'middle';

      const explosion = document.createElement('div');
      explosion.className = 'explosion';
      explosion.dataset.type = clickType;
      explosion.style.left = targetBubble.style.left;
      explosion.style.top = targetBubble.style.top;
      explosion.style.width = targetBubble.style.width;
      explosion.style.height = targetBubble.style.height;
      explosion.style.position = 'absolute';
      
      targetBubble.remove();
      container.appendChild(explosion);
      
      playSound(clickType);

      setTimeout(() => explosion.remove(), 500);
    }
  });

  // Mouse wheel interaction
  container.addEventListener('wheel', (e) => {
    playSound('keyboard');
    const count = 3;
    for (let i = 0; i < count; i++) {
      createBubble(container);
    }
  });

  // Keyboard interaction
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const bubbles = Array.from(container.querySelectorAll('.bubble'));
    const matchingBubble = bubbles.find(b => b.textContent.toLowerCase() === key);
    
    playSound('keyboard');

    if (matchingBubble) {
      const explosion = document.createElement('div');
      explosion.className = 'explosion';
      explosion.dataset.type = 'keyboard';
      explosion.style.left = matchingBubble.style.left;
      explosion.style.top = matchingBubble.style.top;
      explosion.style.width = matchingBubble.style.width;
      explosion.style.height = matchingBubble.style.height;
      explosion.style.position = 'absolute';
      
      matchingBubble.remove();
      container.appendChild(explosion);
      
      setTimeout(() => explosion.remove(), 500);
    } else {
      createBubble(container);
    }
  });
}

export function createBubble(container) {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  bubble.textContent = letter;
  
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  bubble.style.backgroundColor = color;
  
  const size = Math.floor(Math.random() * 40) + 60; // 60px to 100px
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.fontSize = `${size / 2}px`;
  
  // Assuming a default window size for tests, we use 800x600 if container has no size
  const containerWidth = container.clientWidth || 800;
  const containerHeight = container.clientHeight || 600;
  
  const left = Math.random() * (containerWidth - size);
  const top = Math.random() * (containerHeight - size);
  
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
  
  container.appendChild(bubble);
  return bubble;
}
