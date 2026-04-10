/**
 * Name: Standalone Build Script
 * Description: Generates a single-file version of the toddler keyboard fireworks game by inlining CSS and JavaScript modules. This version can be run directly via the `file://` protocol.
 */
import fs from 'node:fs';
import path from 'node:path';

async function build() {
  const root = process.cwd();
  
  // Read core files
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
  const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf-8');
  const mainJs = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf-8');
  const gameJs = fs.readFileSync(path.join(root, 'src', 'game.js'), 'utf-8');
  const effectsJs = fs.readFileSync(path.join(root, 'src', 'effects.js'), 'utf-8');
  const keyboardJs = fs.readFileSync(path.join(root, 'src', 'keyboard.js'), 'utf-8');

  // Simple "modularizer" - remove imports/exports and wrap in a scope
  // Since we know the structure, we can just concatenate or use a simple regex approach.
  // For a more robust way, we'd use a bundler, but we'll try a clean manual approach.

  const cleanJs = (content) => {
    return content
      .replace(/import\s+.*?\s+from\s+['"].*?['"];?/g, '')
      .replace(/export\s+/g, '');
  };

  const bundleJs = `
(function() {
  // keyboard.js
  ${cleanJs(keyboardJs)}
  
  // effects.js
  ${cleanJs(effectsJs)}
  
  // game.js
  ${cleanJs(gameJs)}
  
  // main.js
  ${cleanJs(mainJs)}
})();
  `;

  // Inline into HTML
  let output = html;
  
  // Replace CSS link
  output = output.replace(/<link rel="stylesheet".*?>/, `<style>${css}</style>`);
  
  // Replace module script with bundled script
  output = output.replace(/<script type="module".*?><\/script>/, `<script>${bundleJs}</script>`);

  fs.writeFileSync(path.join(root, 'dist', 'index.html'), output);
  console.log('Build complete: dist/index.html is now standalone.');
}

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
