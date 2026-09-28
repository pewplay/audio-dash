//------------------------------------------------------------
// Scene
//------------------------------------------------------------
// Menus are HTML overlays (crisp, readable and touch friendly at any size),
// the tutorial and the game itself are drawn on the canvas. Every scene fades
// in and out like in the original game.
let scenes = [];
function Scene(name, el) {
  let scene = {
    name: name,
    el: el,
    alpha: 0,
    active: false,
    children: [],
    inc: 0.05,
    isHidding: false,

    // create a fade in/out transitions when hiding and showing scenes
    hide(cb) {
      if (el && el.contains(document.activeElement)) document.activeElement.blur();

      this.isHidding = true;
      this.alpha = 1;
      this.inc = -0.05;
      if (el) el.classList.remove('visible');
      setTimeout(() => {
        this.isHidding = false;
        this.active = false;
        let index = activeScenes.indexOf(this);
        if (index !== -1) activeScenes.splice(index, 1);
        if (el) el.hidden = true;
        cb && cb();
      }, fadeTime);
    },
    show(cb) {
      this.active = true;
      this.isHidding = false;
      activeScenes.push(this);
      this.alpha = 0;
      this.inc = 0.05;
      if (el) {
        el.hidden = false;
        el.getBoundingClientRect();  // force layout so the fade runs
        el.classList.add('visible');
      }
      if (this.onShow) this.onShow();
      setTimeout(() => {
        cb && cb();
      }, fadeTime);
    },
    add() {
      Array.from(arguments).forEach(child => {
        child.parent = this;
        this.children.push(child);
      });
    },
    update() {
      this.children.forEach(child => {
        if (child.update) {
          child.update();
        }
      });
    },
    render() {
      this.alpha = clamp(this.alpha + this.inc, 0, 1);

      ctx.save();
      ctx.globalAlpha = this.alpha;

      this.children.forEach(child => child.render && child.render());

      ctx.restore();
    }
  };

  scenes.push(scene);
  return scene;
}

/**
 * Wire an HTML button to an action. The action only runs while its scene is
 * fully usable (not while fading out), so double taps can't trigger twice.
 */
function onButton(btn, scene, action) {
  btn.addEventListener('click', e => {
    if (scene && (!scene.active || scene.isHidding)) return;
    action(e);
  });
}

/**
 * Buttons of a scene that can currently receive focus.
 */
function sceneButtons(scene) {
  if (!scene || !scene.el) return [];
  return Array.from(scene.el.querySelectorAll('button'))
    .filter(btn => !btn.disabled && !btn.hidden);
}

/**
 * Focus the first button of a scene (keyboard / gamepad navigation).
 */
function focusFirst(scene) {
  if (!scene.active || scene.isHidding) return;
  let btn = sceneButtons(scene)[0];
  if (btn) btn.focus({ preventScroll: true });
}

/**
 * Show or hide the in-game pause button.
 */
function setHudButtons(inGame) {
  pauseBtn.hidden = !inGame;
}

function setMenuMessage(text) {
  menuMsg.textContent = text;
}

function updateSongInfo() {
  let text = 'Song: ' + songTitle;
  if (bestTime && bestTime !== '0:00') {
    text += '  ·  Best ' + formatSeconds(bestTime);
  }
  songInfo.textContent = text;
  defaultSongBtn.hidden = songName === DEFAULT_SONG;
}





//------------------------------------------------------------
// Menu Scene
//------------------------------------------------------------
let menuScene = Scene('menu', document.getElementById('menuScene'));
menuScene.onShow = () => {
  updateSongInfo();
  drawLogo();
};

onButton(startBtn, menuScene, () => {
  setMenuMessage('');

  // unlock audio playback on mobile browsers during the user gesture
  let p = audio.play();
  if (p && p.catch) p.catch(() => {});
  audio.pause();

  menuScene.hide(() => {
    start();
  });
});
onButton(uploadBtn, menuScene, () => {
  uploadFile.click();
});
onButton(defaultSongBtn, menuScene, () => {
  useDefaultSong();
  setMenuMessage('');
  startBtn.focus({ preventScroll: true });
});
onButton(optionsBtn, menuScene, () => {
  setMenuMessage('');
  menuScene.hide(() => {
    optionsScene.show(() => focusFirst(optionsScene));
  });
});





//------------------------------------------------------------
// Loading Scene
//------------------------------------------------------------
let loadingScene = Scene('loading', document.getElementById('loadingScene'));
let loadingTimer;
loadingScene.onShow = () => {
  let count = 0;
  clearInterval(loadingTimer);
  loadingDots.textContent = '';
  loadingTimer = setInterval(() => {
    count = (count + 1) % 4;
    loadingDots.textContent = '.'.repeat(count);
    if (!loadingScene.active) clearInterval(loadingTimer);
  }, 330);
};





//------------------------------------------------------------
// Options Scene
//------------------------------------------------------------
let opts = [{
  name: 'volume',
  label: 'VOLUME',
  minValue: 0,
  maxValue: 1,
  inc: 0.05
},
{
  name: 'uiScale',
  label: 'UI SCALE',
  minValue: 1,
  maxValue: 1.5,
  inc: 0.05
},
{
  name: 'gameSpeed',
  label: 'GAME SPEED',
  minValue: 0.1,
  maxValue: 2,
  inc: 0.05
}];
let beforeOptions;
let optionsScene = Scene('options', document.getElementById('optionsScene'));
let optionUpdaters = [];

opts.forEach(opt => {
  let label = document.createElement('span');
  label.className = 'label';
  label.textContent = opt.label;

  let decBtn = document.createElement('button');
  decBtn.type = 'button';
  decBtn.className = 'neon';
  decBtn.textContent = '−';
  decBtn.setAttribute('aria-label', 'Decrease ' + opt.label.toLowerCase());

  let value = document.createElement('span');
  value.className = 'value';
  value.setAttribute('aria-live', 'polite');

  let incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.className = 'neon';
  incBtn.textContent = '+';
  incBtn.setAttribute('aria-label', 'Increase ' + opt.label.toLowerCase());

  function refresh() {
    value.textContent = (''+Math.round(options[opt.name] * 100)).padStart(3, ' ') + '%';
    decBtn.disabled = options[opt.name] <= opt.minValue;
    incBtn.disabled = options[opt.name] >= opt.maxValue;
  }

  function changeValue(inc, btn) {
    let v = clamp(options[opt.name] + inc, opt.minValue, opt.maxValue);
    options[opt.name] = Math.round(v * 100) / 100;
    refresh();
    optionsChanged();

    // keep keyboard focus usable when a button becomes disabled
    if (btn.disabled) {
      (btn === decBtn ? incBtn : decBtn).focus({ preventScroll: true });
    }
  }

  onButton(decBtn, optionsScene, () => changeValue(-opt.inc, decBtn));
  onButton(incBtn, optionsScene, () => changeValue(opt.inc, incBtn));

  optionRows.append(label, decBtn, value, incBtn);
  optionUpdaters.push(refresh);
});

function optionsChanged() {
  applyAudioOptions();
  resize();
}

optionsScene.onShow = () => {
  beforeOptions = Object.assign({}, options);
  optionUpdaters.forEach(refresh => refresh());
};

onButton(saveBtn, optionsScene, () => {
  storeSet('options', options);

  optionsScene.hide(() => {
    menuScene.show(() => focusFirst(menuScene));
  });
});
onButton(cancelBtn, optionsScene, () => {
  options = beforeOptions;
  optionsChanged();
  optionsScene.hide(() => {
    menuScene.show(() => focusFirst(menuScene));
  });
});





//------------------------------------------------------------
// Tutorial Scene
//------------------------------------------------------------
let isTutorial = true;
let tutorialMove = 0;
let tutorialMoveInc = 5;
let showTutorialBars = false;

let tutorialScene = Scene('tutorial');
tutorialScene.add({
  render() {
    drawTutorialText(tutorialScene.alpha);
  }
});





//------------------------------------------------------------
// Game Scene
//------------------------------------------------------------
let startMove;
let startCount;
let gameScene = Scene('game');
let shipIndex;
const fillerWave = { height: 160, offset: 0, yOffset: 0, width: waveWidth, y: 0 };

gameScene.add({
  render() {
    // context.currentTime would be as long as the audio took to load, so was
    // always off. seems it's not meant for large files. better to use audio
    // element and play it right on time
    // @see https://stackoverflow.com/questions/33006650/web-audio-api-and-real-current-time-when-playing-an-audio-file

    // calculate speed of the audio wave based on the current time
    let move, ampBar, ampX;
    let time = songTime();
    if (time) {
      move = Math.round((time / songDuration()) * (peaks.length * waveWidth));
    }
    else {
      move = startMove + tutorialMoveInc * startCount;

      if (!gameOverScene.active && !paused && !resumeHold && !musicStarted) {
        startCount++;

        if (move >= 0) {
          showTutorialBars = false;
          musicStarted = true;
          applyAudioOptions();
          let p = audio.play();
          if (p && p.catch) p.catch(() => {});
        }
      }
    }

    // the level was designed for a 640 wide view with the ship at x = 319;
    // shift everything so the ship stays in the middle of any screen
    let dx = ship.x - (GEN_W / 2 - waveWidth / 2);
    let ext = view.ext + 2;
    let firstIndex = Math.floor((move - dx) / waveWidth) - 1;
    let lastIndex = Math.ceil((move - dx + view.worldW) / waveWidth) + 1;

    shipIndex = (move / waveWidth | 0) + maxLength / 2;

    ctx.fillStyle = '#00a3dc';
    for (let i = firstIndex; i <= lastIndex; i++) {
      let wave = waveData[i] || (i < 0 ? fillerWave : null);
      if (!wave) break;

      let x = i * waveWidth - move + dx;

      let topY = wave.y;
      let botY = GEN_H - wave.height - wave.offset + wave.yOffset;
      let topHeight = wave.height - wave.offset + wave.yOffset;
      let botHeight = wave.height + wave.offset - wave.yOffset;

      // keep track of the amp bar (the bar at the ship's position)
      let ox = x - dx;
      if (ox > waveWidth * (maxLength / 2 - 1) && ox < waveWidth * (maxLength / 2 + 1)) {
        ampBar = wave;
        ampX = x;

        // collision detection
        if (!gameOverScene.active && !paused) {
          if (collidesWithShip(topY, topHeight) ||
              collidesWithShip(botY, botHeight) ||
              ship.y < -50 ||
              ship.y > GEN_H + 50) {
            return gameOver();
          }
        }
      }
      else {
        // bars extend past the play field on tall screens
        ctx.fillRect(x, topY - ext, wave.width, topHeight + ext);  // top bar
        ctx.fillRect(x, botY, wave.width, botHeight + ext);  // bottom bar
      }
    }

    // draw amp bar
    if (ampBar) {
      let x = ampX - waveWidth;
      let width = ampBar.width + waveWidth * 2;
      let topY = ampBar.y - ext;
      let botY = GEN_H - ampBar.height - ampBar.offset + ampBar.yOffset;
      let topHeight = ampBar.height - ampBar.offset + ampBar.yOffset + ext;
      let botHeight = ampBar.height + ampBar.offset - ampBar.yOffset + ext;

      neonRect(x, topY, width, topHeight, 255, 0, 0);
      neonRect(x, botY, width, botHeight, 255, 0, 0);
      ctx.fillStyle = '#00a3dc';
    }

    ship.render(move);

    while (ship.points.length && ship.points[0].x - move + ship.x < 0 - ship.width) {
      ship.points.shift();
    }

    drawTimeUi();

    if (resumeHold) {
      drawTutorialText(1);
    }

    if (!winScene.active && !gameOverScene.active &&
        waveData[waveData.length - 1].x - move <= GEN_W / 2) {
      win();
    }
  }
});





//------------------------------------------------------------
// Back to the main menu from the game (game over, win, pause)
//------------------------------------------------------------
function backToMenu(fromScene) {
  audio.pause();
  paused = false;
  resumeHold = false;
  setHudButtons(false);
  if (tutorialScene.active && !tutorialScene.isHidding) tutorialScene.hide();
  if (gameScene.active && !gameScene.isHidding) {
    gameScene.hide(() => {
      showTutorialBars = false;
    });
  }
  else {
    showTutorialBars = false;
  }
  fromScene.hide(() => {
    menuScene.show(() => focusFirst(menuScene));
  });
}

function restartGame(fromScene) {
  audio.pause();
  showTutorialBars = true;
  fromScene.hide();
  gameScene.hide(() => start());
}





//------------------------------------------------------------
// Game Over Scene
//------------------------------------------------------------
let gameOverScene = Scene('gameOver', document.getElementById('gameOverScene'));
onButton(restartBtn, gameOverScene, () => restartGame(gameOverScene));
onButton(menuBtn, gameOverScene, () => backToMenu(gameOverScene));





//------------------------------------------------------------
// Win Scene
//------------------------------------------------------------
let winScene = Scene('win', document.getElementById('winScene'));
onButton(winRestartBtn, winScene, () => restartGame(winScene));
onButton(winMenuBtn, winScene, () => backToMenu(winScene));





//------------------------------------------------------------
// Pause Scene
//------------------------------------------------------------
let pauseScene = Scene('pause', document.getElementById('pauseScene'));

function isPlaying() {
  return (tutorialScene.active || gameScene.active) &&
    !tutorialScene.isHidding && !gameScene.isHidding &&
    !gameOverScene.active && !winScene.active;
}

function pauseGame() {
  if (paused || !isPlaying()) return;
  resumeHold = false;
  paused = true;
  audio.pause();
  setHudButtons(false);
  pauseScene.show(() => focusFirst(pauseScene));
}

function resumeGame() {
  pauseScene.hide(() => {
    paused = false;
    touchPressed = false;
    pressLatched = false;
    // freeze until the player presses again, so nobody crashes on resume
    if (gameScene.active && !gameOverScene.active && !winScene.active) {
      resumeHold = true;
      ship.dy = 0;
    }
    setHudButtons(true);
  });
}

function endResumeHold() {
  resumeHold = false;
  if (musicStarted) {
    let p = audio.play();
    if (p && p.catch) p.catch(() => {});
  }
}

onButton(resumeBtn, pauseScene, resumeGame);
onButton(pauseMenuBtn, pauseScene, () => backToMenu(pauseScene));

pauseBtn.addEventListener('click', e => {
  pauseBtn.blur();
  pauseGame();
});

function setMuted(value) {
  muted = value;
  storeSet('muted', muted);
  muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  muteBtn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
  applyAudioOptions();
}
muteBtn.addEventListener('click', e => {
  muteBtn.blur();
  setMuted(!muted);
});
setMuted(muted);
