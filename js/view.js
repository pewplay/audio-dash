//------------------------------------------------------------
// Responsive view
//------------------------------------------------------------
// The play field is 640x960 "world" units. It is scaled so the full height
// always fits; on wider screens the world simply shows more of the wave
// (ahead of and behind the ship), on narrower/taller screens the extra space
// above and below is filled by extending the top and bottom wave bars.
let view = {
  w: GEN_W,       // css pixels
  h: GEN_H,
  dpr: 1,
  s: 1,           // world units -> css pixels
  worldW: GEN_W,  // visible world width
  ext: 0,         // extra world units visible above (and below) the play field
  oy: 0,          // css pixel offset of the play field top
  hud: 1          // css pixels per HUD unit
};

function resize() {
  let canvas = kontra.canvas;
  let w = Math.max(1, canvas.clientWidth || window.innerWidth);
  let h = Math.max(1, canvas.clientHeight || window.innerHeight);
  let dpr = Math.min(window.devicePixelRatio || 1, 3);

  view.w = w;
  view.h = h;
  view.dpr = dpr;
  view.s = Math.min(w / GEN_W, h / GEN_H);
  view.worldW = w / view.s;
  view.oy = (h - GEN_H * view.s) / 2;
  view.ext = view.oy / view.s;
  view.hud = clamp(Math.min(w, h * 1.2) / 560, 0.75, 1.4) * options.uiScale;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  // keep the ship in the middle of the screen
  ship.x = view.worldW / 2 - waveWidth / 2;

  document.documentElement.style.setProperty('--ui', options.uiScale);

  if (typeof drawLogo === 'function') drawLogo();
}

/**
 * Draw in world units (the 640x960 play field).
 */
function setWorldTransform() {
  let k = view.dpr * view.s;
  ctx.setTransform(k, 0, 0, k, 0, view.dpr * view.oy);
}

/**
 * Draw in HUD units (css pixels scaled by the HUD scale), origin top left.
 */
function setHudTransform() {
  let k = view.dpr * view.hud;
  ctx.setTransform(k, 0, 0, k, 0, 0);
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}
