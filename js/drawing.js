//------------------------------------------------------------
// Drawing functions
//------------------------------------------------------------
const FONT_FAMILY = "'Lucida Console', Monaco, 'DejaVu Sans Mono', Menlo, Consolas, monospace";

/**
 * Set font size.
 * @param {number} size - Size of font
 * @param {CanvasRenderingContext2D} [c] - context (defaults to the game canvas)
 */
function setFont(size, c) {
  (c || ctx).font = size + 'px ' + FONT_FAMILY;
}

/**
 * Draw a neon rectangle in the given color.
 * @see https://codepen.io/agar3s/pen/pJpoya?editors=0010#0
 * Don't use shadow blur as it is terrible for performance
 * @see https://stackoverflow.com/questions/15706856/how-to-improve-performance-when-context-shadow-canvas-html5-javascript
 *
 * @param {number} x - X position of the rectangle
 * @param {number} y - Y position of the rectangle
 * @param {number} w - Width of the rectangle
 * @param {number} h - Height of the rectangle
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 */
function neonRect(x, y, w, h, r, g, b) {
  ctx.save();
  ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.2)";
  ctx.lineWidth = 10.5;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 8;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 5.5;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/**
 * Line to each point.
 * @param {object[]} points - Object of x, y positions
 * @param {number} move - distance to move each point by
 */
function drawLines(points, move, c) {
  c = c || ctx;
  c.beginPath();
  c.moveTo(points[0].x - move, points[0].y);
  points.forEach(point => {
    c.lineTo(point.x - move, point.y);
  });
  c.stroke();
}

/**
 * Draw a neon line between points in the given color.
 * @param {object[]} points - Object of x, y positions
 * @param {number} move - Distance to move each point by
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 * @param {CanvasRenderingContext2D} [c] - context
 */
function neonLine(points, move, r, g, b, c) {
  if (!points.length) return;
  c = c || ctx;

  c.save();
  c.lineJoin = 'round';
  c.strokeStyle = "rgba(" + r + "," + g + "," + b + ",0.2)";

  c.lineWidth = 10.5;
  drawLines(points, move, c);

  c.lineWidth = 8;
  drawLines(points, move, c);

  c.lineWidth = 5.5;
  drawLines(points, move, c);

  c.lineWidth = 3;
  drawLines(points, move, c);

  c.strokeStyle = "#fff";
  c.lineWidth = 1.5;
  drawLines(points, move, c);

  c.restore();
}

/**
 * Draw neon text in the given color
 * @param {string} text - Text to render
 * @param {number} x - X position of the text
 * @param {number} y - Y position of the text
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 * @param {CanvasRenderingContext2D} [c] - context
 */
function neonText(text, x, y, r, g, b, c) {
  c = c || ctx;
  c.save();
  c.lineJoin = 'round';
  c.globalAlpha = 0.2;
  c.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
  c.lineWidth = 10.5;
  c.strokeText(text, x, y);
  c.lineWidth = 8;
  c.strokeText(text, x, y);
  c.lineWidth = 5.5;
  c.strokeText(text, x, y);
  c.lineWidth = 3;
  c.strokeText(text, x, y);
  c.globalAlpha = 1;
  c.strokeStyle = "#fff";
  c.lineWidth = 1.5;
  c.strokeText(text, x, y);
  c.restore();
}

/**
 * Draw the "AUDIO DASH / Play the Wave" title of the main menu on its own
 * canvas (same drawing as the original menu scene).
 */
function drawLogo() {
  let logo = document.getElementById('logo');
  if (!logo) return;
  let w = logo.clientWidth, h = logo.clientHeight;
  if (!w || !h) return;

  let dpr = Math.min(window.devicePixelRatio || 1, 3);
  logo.width = Math.round(w * dpr);
  logo.height = Math.round(h * dpr);

  let c = logo.getContext('2d');
  let k = dpr * w / 590;
  c.setTransform(k, 0, 0, k, -30 * k, -70 * k);

  let points = [
    {x: 50, y: 262},

    {x: 80, y: 262},
    {x: 88, y: 270},
    {x: 96, y: 278},

    {x: 104, y: 281},
    {x: 112, y: 279},
    {x: 120, y: 272},
    {x: 128, y: 264},

    {x: 136, y: 256},
    {x: 144, y: 249},
    {x: 152, y: 247},
    {x: 160, y: 250},

    {x: 168, y: 258},
    {x: 176, y: 266},
    {x: 206, y: 266}
  ];

  neonLine(points, 0, 0, 163, 220, c);
  setFont(150, c);
  neonText('AUDIO', 50, 200, 0, 163, 220, c);
  neonText('DASH', 231, 315, 255, 0, 0, c);

  c.fillStyle = '#fff';
  setFont(30, c);
  c.fillText('Play the Wave', 202, 360);
}

/**
 * Draw the top (time) and bottom (best time) HUD bars.
 */
function drawTimeUi() {
  ctx.save();
  setHudTransform();
  let H = view.h / view.hud;

  ctx.fillStyle = '#222';

  // top bar
  ctx.beginPath();
  ctx.moveTo(0, 43);
  ctx.lineTo(80, 43);
  for (let i = 1; i <= 10; i++) {
    ctx.lineTo(80 + i*2, 43 - i*2);
    ctx.lineTo(80 + i*2+2, 43 - i*2);
  }
  ctx.lineTo(170, 23);
  for (let i = 1; i <= 10; i++) {
    ctx.lineTo(170 + i*2, 23 - i*2);
    ctx.lineTo(170 + i*2+2, 23 - i*2);
  }
  ctx.lineTo(192, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  // bottom bar
  ctx.beginPath();
  let y = H - 25;
  ctx.moveTo(0, y);
  ctx.lineTo(125, y);
  for (let i = 1; i <= 10; i++) {
    ctx.lineTo(125 + i*2, y + i*2);
    ctx.lineTo(125 + i*2+2, y + i*2);
  }
  ctx.lineTo(147, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fdfdfd';
  let time = getTime(songTime());

  setFont(40);
  ctx.fillText(getSeconds(time).padStart(3, ' '), 5, 35);
  setFont(18);
  ctx.fillText(':' + getMilliseconds(time) + ' TIME', 80, 17);
  ctx.fillText(bestTime.padStart(6, ' ') + ' BEST', 5, H - 5);
  ctx.restore();
}

/**
 * Draw the tutorial hint above the ship.
 */
function drawTutorialText(alpha) {
  ctx.save();
  setHudTransform();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';

  let W = view.w / view.hud;
  let y = (view.oy + (mid - 200) * view.s) / view.hud;
  let text = 'TAP OR HOLD';

  if (lastUsedInput === 'keyboard') {
    text = 'HOLD [SPACEBAR]';
  }
  else if (lastUsedInput === 'mouse') {
    text = 'CLICK OR HOLD';
  }

  // dark backdrop so the hint stays readable over the wave
  setFont(19);
  let boxW = Math.max(ctx.measureText('Hold to rise, let go to fall').width, 240) + 40;
  ctx.fillStyle = 'rgba(34, 34, 34, 0.85)';
  ctx.fillRect(W / 2 - boxW / 2, y - 34, boxW, 80);
  ctx.fillStyle = '#fff';

  setFont(25);
  if (lastUsedInput === 'gamepad') {
    let tw = ctx.measureText(text).width;
    drawAButton(W / 2 - tw / 2 - 26, y - 8);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    setFont(25);
  }
  ctx.fillText(text, W / 2, y);

  setFont(19);
  ctx.fillStyle = '#cfd8dc';
  ctx.fillText('Hold to rise, let go to fall', W / 2, y + 32);
  ctx.restore();
}

/**
 * Draw the XBOX A button.
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function drawAButton(x, y) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'green';
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  setFont(25);
  ctx.fillText('A', x, y + 8);
  ctx.restore();
}

/**
 * Show help text in bottom left corner of screen based on input.
 */
function showHelpText() {
  if (lastUsedInput !== 'keyboard' && lastUsedInput !== 'gamepad') return;

  ctx.save();
  setHudTransform();
  let H = view.h / view.hud;
  ctx.fillStyle = 'white';
  setFont(18);

  if (lastUsedInput === 'keyboard') {
    ctx.fillText('[Arrows] Move  [Space] Select', 20, H - 20);
  }
  else {
    drawAButton(35, H - 26);
    setFont(18);
    ctx.fillStyle = 'white';
    ctx.fillText('Select', 60, H - 20);
  }

  ctx.restore();
}
