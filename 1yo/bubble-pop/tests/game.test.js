import { describe, it, expect, beforeEach } from 'vitest';
import { initGame, createBubble } from '../src/game.js';

describe('Game Initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="game-container"></div>';
  });

  it('should initialize the game and ensure container is ready', () => {
    const container = document.getElementById('game-container');
    initGame(container);
    expect(container.dataset.initialized).toBe("true");
  });

  it('should create a bubble with a letter and random position', () => {
    const container = document.getElementById('game-container');
    const bubble = createBubble(container);
    
    expect(bubble).toBeTruthy();
    expect(bubble.classList.contains('bubble')).toBe(true);
    expect(bubble.textContent.length).toBe(1);
    expect(container.children.length).toBe(1);
    expect(bubble.style.left).toBeDefined();
    expect(bubble.style.top).toBeDefined();
  });

  it('should dodge the bubble slightly when mouse moves close', () => {
    const container = document.getElementById('game-container');
    initGame(container);
    const bubble = createBubble(container);
    
    // Default transform might be empty
    const initialTransform = bubble.style.transform;
    
    // Simulate mouse move
    const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
    container.dispatchEvent(event);
    
    // In our logic, we might just update an internal property or the style directly
    // Let's assume it changes transform or custom data attribute
    // Note: since JSDOM doesn't compute layout, we might just check if event listener triggers an update
    // We'll test that the transform was changed from its initial value
    // Actually, let's just make it simpler: the game should attach a mousemove listener
    // and process bubbles.
    // We can mock or just check if a property changes.
    // For TDD, let's say the bubble gets a `data-dodged` attribute when mouse moves over container.
    // This is easier to test in JSDOM.
    
    bubble.style.left = '90px';
    bubble.style.top = '90px';
    
    container.dispatchEvent(event);
    expect(bubble.style.transform).not.toBe(initialTransform);
  });

  it('should pop a bubble on Left Click (LKM)', () => {
    const container = document.getElementById('game-container');
    initGame(container);
    const bubble = createBubble(container);
    
    expect(container.contains(bubble)).toBe(true);
    
    // Simulate Left Click
    const event = new MouseEvent('mousedown', { button: 0, buttons: 1, bubbles: true });
    bubble.dispatchEvent(event);
    
    // Bubble should be removed
    expect(container.contains(bubble)).toBe(false);
    
    // An explosion element should be created
    const explosion = container.querySelector('.explosion');
    expect(explosion).toBeTruthy();
    expect(explosion.dataset.type).toBe('left');
  });

  it('should pop a bubble on Right Click (PKM)', () => {
    const container = document.getElementById('game-container');
    initGame(container);
    const bubble = createBubble(container);
    
    // Simulate Right Click
    const event = new MouseEvent('mousedown', { button: 2, buttons: 2, bubbles: true });
    bubble.dispatchEvent(event);
    
    expect(container.contains(bubble)).toBe(false);
    
    // Should have right-click specific explosion
    const explosion = container.querySelector('.explosion[data-type="right"]');
    expect(explosion).toBeTruthy();
  });

  it('should generate new bubbles on mouse wheel scroll', () => {
    const container = document.getElementById('game-container');
    initGame(container);
    
    const initialCount = container.querySelectorAll('.bubble').length;
    
    // Simulate mouse wheel
    const event = new WheelEvent('wheel', { deltaY: 100 });
    container.dispatchEvent(event);
    
    const newCount = container.querySelectorAll('.bubble').length;
    expect(newCount).toBeGreaterThan(initialCount);
  });

  it('should pop a matching bubble on keydown', () => {
    const container = document.getElementById('game-container');
    initGame(container);
    
    // Create a bubble with a specific letter
    const bubble = createBubble(container);
    bubble.textContent = 'А';
    
    // Simulate keydown on document
    const event = new KeyboardEvent('keydown', { key: 'а' }); // lower case
    document.dispatchEvent(event);
    
    // Bubble should be popped
    expect(container.contains(bubble)).toBe(false);
  });
});

