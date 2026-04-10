/**
 * Name: Browser Game Controller
 * Description: Wires the toddler keyboard fireworks app to the DOM and browser events. Usage: create `ToddlerFireworksGame` with page elements, call `attach()`, and let the animation loop manage effects.
 */
import { spawnEffect, updateEffect, renderEffect } from './effects.js';
import { normalizeKey, shouldAllowBrowserDefault, shouldPreventDefault } from './keyboard.js';

export class ToddlerFireworksGame {
  constructor({ root, stage, effectsLayer, overlay, overlayTitle, overlayCopy }) {
    this.root = root;
    this.stage = stage;
    this.effectsLayer = effectsLayer;
    this.overlay = overlay;
    this.overlayTitle = overlayTitle;
    this.overlayCopy = overlayCopy;
    this.effects = new Map();
    this.bounds = { width: window.innerWidth, height: window.innerHeight };
    this.isArmed = false;
    this.isFocused = document.hasFocus();
    this.fullscreenAttempted = false;
    this.lastFrameTime = 0;

    this.handlePointerStart = this.handlePointerStart.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.animationFrame = this.animationFrame.bind(this);
  }

  attach() {
    this.handleResize();
    this.updateShellState();
    this.updateOverlay('start');
    this.focusStage();

    this.stage.addEventListener('pointerdown', this.handlePointerStart);
    this.overlay.addEventListener('pointerdown', this.handlePointerStart);
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.requestAnimationFrame(this.animationFrame);
  }

  handlePointerStart() {
    void this.arm();
  }

  handleResize() {
    const rect = this.stage.getBoundingClientRect();
    this.bounds = {
      width: Math.max(Math.round(rect.width || window.innerWidth), 320),
      height: Math.max(Math.round(rect.height || window.innerHeight), 240)
    };
  }

  handleWindowBlur() {
    this.isFocused = false;
    this.updateShellState();
    if (this.isArmed) {
      this.updateOverlay('refocus');
    }
  }

  handleWindowFocus() {
    this.isFocused = true;
    this.focusStage();
    this.updateShellState();
    if (this.isArmed) {
      this.overlay.hidden = true;
    }
  }

  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.handleWindowFocus();
      return;
    }

    this.handleWindowBlur();
  }

  handleKeyDown(event) {
    const key = normalizeKey(event);
    if (!key) {
      return;
    }

    if (shouldPreventDefault(event) && event.cancelable) {
      event.preventDefault();
    }

    if (shouldAllowBrowserDefault(event)) {
      return;
    }

    void this.arm();
    this.spawnKeyEffect(key, performance.now());
    this.focusStage();
  }

  async arm() {
    if (!this.isArmed) {
      this.isArmed = true;
    }

    this.overlay.hidden = true;
    this.updateShellState();
    this.focusStage();

    if (!document.fullscreenElement) {
      await this.requestFullscreen();
    }
  }

  async requestFullscreen() {
    if (document.fullscreenElement || typeof this.root.requestFullscreen !== 'function') {
      return;
    }

    try {
      await this.root.requestFullscreen();
    } catch (error) {
      // Browsers may reject fullscreen in automation or on unsupported platforms.
    }
  }

  focusStage() {
    if (typeof this.stage.focus === 'function') {
      this.stage.focus({ preventScroll: true });
    }
  }

  updateShellState() {
    const armed = String(this.isArmed);
    const focused = String(this.isFocused);
    const count = String(this.effects.size);

    if (this.root.dataset.armed !== armed) {
      this.root.dataset.armed = armed;
    }
    if (this.root.dataset.focused !== focused) {
      this.root.dataset.focused = focused;
    }
    if (this.root.dataset.activeEffects !== count) {
      this.root.dataset.activeEffects = count;
    }
  }

  updateOverlay(mode) {
    this.overlay.hidden = false;
    if (mode === 'refocus') {
      this.overlayTitle.textContent = 'Коснитесь экрана, чтобы продолжить';
      this.overlayCopy.textContent = 'Игра удерживает фокус настолько, насколько это позволяет браузер. Любая следующая клавиша снова запустит вспышки.';
      return;
    }

    this.overlayTitle.textContent = 'Нажмите любую клавишу';
    this.overlayCopy.textContent = 'Все клавиши превращаются в яркие вспышки и буквы. F11 оставлена для выхода из полноэкранного режима.';
  }

  spawnKeyEffect(key, timestamp) {
    if (this.effects.size >= 9) {
      const firstId = this.effects.keys().next().value;
      if (firstId !== undefined) {
        const record = this.effects.get(firstId);
        record.elements.root.remove();
        this.effects.delete(firstId);
      }
    }

    const effect = spawnEffect(key, timestamp, this.bounds);
    const elements = this.createEffectElements(effect);
    this.effects.set(effect.id, { effect, elements });
    this.effectsLayer.append(elements.root);
    this.updateShellState();
  }

  createEffectElements(effect) {
    const root = document.createElement('article');
    root.className = `effect effect--${effect.effectType}`;
    root.dataset.testid = 'effect';
    root.dataset.effect = effect.effectType;
    root.style.setProperty('--effect-main', effect.palette.main);
    root.style.setProperty('--effect-glow', effect.palette.glow);
    root.style.setProperty('--effect-accent', effect.palette.accent);

    const aura = document.createElement('div');
    aura.className = 'effect__aura';

    const burst = document.createElement('div');
    burst.className = 'effect__burst';

    const label = document.createElement('div');
    label.className = 'effect__label';
    label.textContent = effect.label;
    label.dataset.shadow = effect.label;

    const particleLayer = document.createElement('div');
    particleLayer.className = 'effect__particles';

    const particles = effect.particles.map(() => {
      const particle = document.createElement('span');
      particle.className = 'effect__particle';
      particleLayer.append(particle);
      return particle;
    });

    root.append(aura, burst, label, particleLayer);
    return { root, aura, burst, label, particles };
  }

  animationFrame(frameTime) {
    const dtMilliseconds = this.lastFrameTime === 0 ? 16 : Math.min(48, frameTime - this.lastFrameTime);
    this.lastFrameTime = frameTime;

    let expired = false;
    for (const [id, record] of this.effects.entries()) {
      updateEffect(record.effect, dtMilliseconds, this.bounds);
      if (record.effect.expired) {
        record.elements.root.remove();
        this.effects.delete(id);
        expired = true;
        continue;
      }
      renderEffect(record.effect, record.elements);
    }

    if (expired) {
      this.updateShellState();
    }
    window.requestAnimationFrame(this.animationFrame);
  }
}