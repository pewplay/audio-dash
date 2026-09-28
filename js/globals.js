kontra.init(document.getElementById('game'));

//------------------------------------------------------------
// Global variables
//------------------------------------------------------------
const ctx = kontra.context;

// The level is generated in the original 640x960 play field. The view adapts
// to the window (see view.js) but the level layout never changes.
const GEN_W = 640;
const GEN_H = 960;
const mid = GEN_H / 2;  // midpoint of the play field
const waveWidth = 2;
const waveHeight = 215;
const maxLength = GEN_W / waveWidth + 2 | 0; // number of peaks in the original 640px view
const STORE_PREFIX = 'audio-dash:';
const DEFAULT_SONG = 'AudioDashDefault';
const defaultOptions = {
  volume: 1,
  uiScale: 1,
  gameSpeed: 1
};

let audio;  // audio element for playing/pausing
let buffer;  // decoded channel data of the song
let peaks;  // peak data of the audio file
let waveData;  // array of wave audio objects based on peak data
let startBuffer;  // duplicated wave data added to the front of waveData to let the game start in the middle of the screen
let loop;  // game loop
let songName = DEFAULT_SONG;  // name of the song (used for best times)
let songTitle = 'Built-in theme';  // name shown in the menu
let bestTimes;  // object of best times for all songs
let bestTime;  // best time for a single song
let activeScenes = [];  // currently active scenes
let gamepad;  // gamepad state
let lastUsedInput;  // keep track of last used input device
let objectUrl;  // in-memory url of an uploaded audio file
let defaultSong;  // {audio, peaks, duration} of the built-in song, kept for switching back
let currentSongDuration = 80;  // duration of the current song in seconds
let fadeTime = 450;  // how long a scene takes to fade
let paused = false;  // game paused (pause button, Esc or tab hidden)
let resumeHold = false;  // after a pause the game waits for the player's first press
let musicStarted = false;  // audio.play() has been called for the current run
let muted = storeGet('muted') === true;
let options = Object.assign({}, defaultOptions, storeGet('options'));





//------------------------------------------------------------
// Helper functions
//------------------------------------------------------------

/**
 * Read a JSON value from localStorage (keys are prefixed with the game id).
 */
function storeGet(key) {
  try {
    return JSON.parse(localStorage.getItem(STORE_PREFIX + key));
  }
  catch (e) {
    return null;
  }
}

/**
 * Write a JSON value to localStorage (keys are prefixed with the game id).
 */
function storeSet(key, value) {
  try {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
  }
  catch (e) {
    // storage may be unavailable (private mode); the game still works
  }
}

/**
 * Clamp a value between min and max values.
 * @param {number} value - Value to clamp.
 * @param {number} min - Min value.
 * @param {number} max - Max value.
 */
function clamp(value, min, max) {
  return Math.min( Math.max(min, value), max);
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function collidesWithShip(y, height) {
  return ship.y < y + height && ship.y + ship.height > y;
}

/**
 * Apply volume, mute and speed options to the audio element.
 */
function applyAudioOptions() {
  if (!audio) return;
  audio.volume = options.volume;
  audio.muted = muted;
  audio.playbackRate = options.gameSpeed;
}





//------------------------------------------------------------
// Main functions
//------------------------------------------------------------

/**
 * Start the game.
 */
function start() {
  startMove = -GEN_W / 2 | 0;
  startCount = 0;
  paused = false;
  resumeHold = false;
  musicStarted = false;

  audio.pause();
  audio.currentTime = 0;
  applyAudioOptions();

  ship.points = [];
  ship.y = mid;
  ship.dy = 0;
  tutorialMove = 0;

  showTutorialBars = true;
  isTutorial = true;
  tutorialScene.show();
  setHudButtons(true);
}

/**
 * Show game over scene.
 */
function gameOver() {
  audio.pause();
  let isBest = setBestTime();
  showResult(gameOverResult, isBest);
  setHudButtons(false);
  gameOverScene.show(() => focusFirst(gameOverScene));
}

/**
 * Show win scene.
 */
function win() {
  audio.pause();
  let isBest = setBestTime();
  showResult(winResult, isBest);
  setHudButtons(false);
  winScene.show(() => focusFirst(winScene));
}
