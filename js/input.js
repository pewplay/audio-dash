//------------------------------------------------------------
// Input Handlers
//------------------------------------------------------------
// Pointer Events cover mouse, touch and pen. Pressing anywhere on the game
// (outside of the HTML buttons) makes the ship rise.
let touchPressed = false;
let pressLatched = false;  // a very quick tap still counts for one update
let activePointers = new Set();
let stage = document.getElementById('stage');

lastUsedInput = window.matchMedia && matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse';

function setLastUsedInput(type) {
  lastUsedInput = type;
  document.body.classList.toggle('kbd', type === 'keyboard' || type === 'gamepad');
}

// keyboard: remember quick Space taps too
let spaceDownTarget = null;
window.addEventListener('keydown', e => {
  if (e.code === 'Space' && !e.repeat) {
    pressLatched = true;
    spaceDownTarget = document.activeElement;
  }
});

// a Space press that started during the game (before a button got focus)
// must not click that button when it is released
window.addEventListener('keyup', e => {
  if (e.code === 'Space' && document.activeElement !== spaceDownTarget) {
    e.preventDefault();
  }
}, true);

kontra.canvas.addEventListener('pointerdown', e => {
  setLastUsedInput(e.pointerType === 'mouse' ? 'mouse' : 'touch');
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  activePointers.add(e.pointerId);
  touchPressed = true;
  pressLatched = true;
  try { kontra.canvas.setPointerCapture(e.pointerId); } catch (err) {}
  e.preventDefault();
});

function releasePointer(e) {
  activePointers.delete(e.pointerId);
  touchPressed = activePointers.size > 0;
}
kontra.canvas.addEventListener('pointerup', releasePointer);
kontra.canvas.addEventListener('pointercancel', releasePointer);
kontra.canvas.addEventListener('lostpointercapture', releasePointer);

// menu buttons remember which kind of input was used
stage.addEventListener('pointerdown', e => {
  if (e.target !== kontra.canvas) {
    setLastUsedInput(e.pointerType === 'mouse' ? 'mouse' : 'touch');
  }
}, true);

window.addEventListener('blur', () => {
  activePointers.clear();
  touchPressed = false;
});

window.addEventListener('beforeunload', () => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

// no context menu (holding a tap on mobile opens it)
window.addEventListener('contextmenu', e => {
  e.preventDefault();
});

// pause when the page is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    activePointers.clear();
    touchPressed = false;
    pauseGame();
  }
});

/**
 * Move the focused button up or down.
 * @param {number} inc - Direction to move the focus button (1 = down, -1 = up).
 */
function handleArrowDownUp(inc) {
  let activeScene = null;
  for (let i = activeScenes.length - 1; i >= 0; i--) {
    if (activeScenes[i].el && !activeScenes[i].isHidding) {
      activeScene = activeScenes[i];
      break;
    }
  }
  if (!activeScene) return;

  let buttons = sceneButtons(activeScene);
  if (!buttons.length) return;

  let index = buttons.indexOf(document.activeElement);
  if (index === -1) {
    buttons[0].focus({ preventScroll: true });
    return;
  }

  index = clamp(index + inc, 0, buttons.length - 1);
  buttons[index].focus({ preventScroll: true });
}

window.addEventListener('keydown', e => {
  let key = e.key;
  let isSelect = key === ' ' || key === 'Enter' || e.code === 'Space';

  if (isSelect || key.startsWith('Arrow')) {
    setLastUsedInput('keyboard');
  }

  // Space is the "rise" key while playing: never let it press a button
  if (isPlaying() && !paused && (key === ' ' || e.code === 'Space')) {
    e.preventDefault();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    return;
  }

  // a held key must not activate the next focused button (e.g. restart)
  if (isSelect && e.repeat) {
    e.preventDefault();
    return;
  }

  if (key === 'Escape' || key === 'p' || key === 'P') {
    if (paused && pauseScene.active && !pauseScene.isHidding) {
      resumeGame();
    }
    else {
      pauseGame();
    }
    return;
  }

  if (key === 'ArrowUp' || key === 'ArrowLeft') {
    e.preventDefault();
    handleArrowDownUp(-1);
  }
  else if (key === 'ArrowDown' || key === 'ArrowRight') {
    e.preventDefault();
    handleArrowDownUp(1);
  }
  else if (isSelect && !(document.activeElement instanceof HTMLButtonElement)) {
    // nothing focused yet: focus the first button of the current menu
    e.preventDefault();
    handleArrowDownUp(0);
  }
}, true);

/**
 * Don't active controller sticks unless it passes a threshold.
 * @see https://www.smashingmagazine.com/2015/11/gamepad-api-in-web-games/
 * @param {number} number - Thumbstick axes
 * @param {number} threshold
 */
function applyDeadzone(number, threshold){
  let percentage = (Math.abs(number) - threshold) / (1 - threshold);

  if(percentage < 0) {
    percentage = 0;
  }

  return percentage * (number > 0 ? 1 : -1);
}

/**
 * Track gamepad use every frame.
 */
let aDt = 1;
let aDuration = 0;
let axesDt = 1;
let axesDuration = 0;
let startWasPressed = false;
function updateGamepad() {
  if (!navigator.getGamepads) return;
  try {
    gamepad = navigator.getGamepads()[0];
  }
  catch (e) {
    gamepad = null;
  }

  if (!gamepad) return;

  // Start button: pause / resume
  let startPressed = gamepad.buttons[9] && gamepad.buttons[9].pressed;
  if (startPressed && !startWasPressed) {
    setLastUsedInput('gamepad');
    if (paused) resumeGame();
    else pauseGame();
  }
  startWasPressed = startPressed;

  // A button press
  if (gamepad.buttons[0].pressed) {
    setLastUsedInput('gamepad');
    aDuration += 1/60;
    aDt += 1/60;
  }
  else {
    aDuration = 0;
    aDt = 1;
  }

  // run the first time immediately then hold for a bit before letting the user
  // continue to press the button down
  let focused = document.activeElement;
  if ((aDt > 0.30 || (aDuration > 0.3 && aDt > 0.10)) &&
      gamepad.buttons[0].pressed && !isPlaying() &&
      focused instanceof HTMLButtonElement && focused !== uploadBtn) {
    aDt = 0;
    focused.click();
  }

  let axes = applyDeadzone(gamepad.axes[1], 0.5);
  let upPressed = axes < 0 || (gamepad.buttons[12] && gamepad.buttons[12].pressed);
  let downPressed = axes > 0 || (gamepad.buttons[13] && gamepad.buttons[13].pressed);

  if (upPressed || downPressed) {
    setLastUsedInput('gamepad');
    axesDuration += 1/60;
    axesDt += 1/60;
  }
  else {
    axesDuration = 0;
    axesDt = 1;
  }

  if (axesDt > 0.30 || (axesDuration > 0.3 && axesDt > 0.10)) {
    if (upPressed) {
      axesDt = 0;
      handleArrowDownUp(-1);
    }
    else if (downPressed) {
      axesDt = 0;
      handleArrowDownUp(1);
    }
  }
}
