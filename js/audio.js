//------------------------------------------------------------
// Audio functions
//------------------------------------------------------------
uploadFile.addEventListener('change', uploadAudio);

const THEME_URL = 'audio/theme.mp3';
const THEME_DURATION = 80;  // seconds (length of the original synthesized song)

/**
 * Prepare the built-in song. Its level data (THEME_PEAKS) is pre-computed, so
 * the game is ready as soon as the audio element exists.
 * @returns {{audio: HTMLAudioElement, peaks: number[], duration: number}}
 */
function loadDefaultSong() {
  let audioEl = createAudio(THEME_URL);
  return { audio: audioEl, peaks: THEME_PEAKS, duration: THEME_DURATION };
}

/**
 * Create an audio element for playback. It does not wait for the file to be
 * loaded (mobile Safari only loads audio after a user gesture); the game
 * waits for playback to actually start instead.
 * @param {string} url - URL of the audio file
 * @returns {HTMLAudioElement}
 */
function createAudio(url) {
  let audioEl = document.createElement('audio');
  audioEl.preload = 'auto';
  audioEl.src = url;
  audioEl.load();
  return audioEl;
}

/**
 * Duration of the current song in seconds.
 */
function songDuration() {
  return isFinite(audio.duration) && audio.duration > 0 ? audio.duration : currentSongDuration;
}

/**
 * Current playback position in seconds (the full length once the song ended).
 */
function songTime() {
  return audio.ended ? songDuration() : audio.currentTime;
}

/**
 * Decode an audio file to raw channel data without needing a running
 * AudioContext (so it works before any user gesture).
 * @param {ArrayBuffer} data
 * @returns {Promise<AudioBuffer>}
 */
function decodeAudio(data) {
  let Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  let offline = new Offline(2, 44100, 44100);

  return new Promise((resolve, reject) => {
    let result = offline.decodeAudioData(data, resolve, reject);
    if (result && result.catch) result.catch(reject);
  });
}

/**
 * Upload an audio file from the user's device.
 * @param {Event} e - File change event
 */
async function uploadAudio(e) {
  let file = e.currentTarget.files[0];
  uploadFile.value = '';
  if (!file) return;

  setMenuMessage('');
  menuScene.hide();
  loadingNote.textContent = 'Reading ' + file.name + '…';
  loadingScene.show();

  let newUrl = URL.createObjectURL(file);

  try {
    let decoded = await file.arrayBuffer().then(decodeAudio);
    if (!decoded || !decoded.length || decoded.duration < 5) {
      throw new Error('Song too short');
    }

    if (audio) audio.pause();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = newUrl;

    buffer = decoded;
    audio = createAudio(newUrl);
    currentSongDuration = decoded.duration;
    applyAudioOptions();
    songName = file.name;
    songTitle = file.name;

    // numPeaks determines the speed of the game, the less peaks per duration,
    // the slower the game plays
    let numPeaks = Math.max(1, decoded.duration / 8 | 0);
    peaks = exportPCM(1024 * numPeaks);  // change this by increments of 1024 to get more peaks
    generateWaveData();
    getBestTime();
    updateSongInfo();

    loadingScene.hide(() => start());
  }
  catch (err) {
    URL.revokeObjectURL(newUrl);
    setMenuMessage("Sorry, that file couldn't be used. Try an MP3, OGG or WAV song longer than a few seconds.");
    loadingScene.hide(() => {
      menuScene.show(() => focusFirst(menuScene));
    });
  }
}

/**
 * Switch back to the built-in song.
 */
function useDefaultSong() {
  if (!defaultSong) return;
  if (audio) audio.pause();
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  audio = defaultSong.audio;
  buffer = null;
  peaks = defaultSong.peaks;
  currentSongDuration = defaultSong.duration;
  applyAudioOptions();
  songName = DEFAULT_SONG;
  songTitle = 'Built-in theme';
  generateWaveData();
  getBestTime();
  updateSongInfo();
}

function generateWaveData() {
  // uses the global peaks (from exportPCM for uploaded songs, pre-computed
  // for the built-in theme)
  startBuffer = new Array(maxLength / 2 | 0).fill(0);

  // remove all negative peaks
  let waves = peaks
    .map((peak, index) => peak >= 0 ? peak : peaks[index-1]);

  let pos = mid;  // position of next turn
  let lastPos = 0;  // position of the last turn
  let gapDistance = maxLength;  // how long to get to the next turn
  let step = 0;  // increment of each peak to pos
  let offset = 0;  // offset the wave data position to create curves

  let minBarDistance = 270;  // min distance between top and bottom wave bars
  let heightDt = minBarDistance - waveHeight + 10;  // distance between max height and wave height
  let heightStep = heightDt / (startBuffer.length + waves.length);  // game should reach the max bar height by end of the song
  let counter = 0;

  let yPos = 0;
  let lastYPos = 0;
  let yGapDistance = maxLength;
  let yStep = 0;
  let yOffset = 0;
  let yCounter = 0;

  let isIntroSong = songName === DEFAULT_SONG;

  Random.setValues(peaks);

  waveData = startBuffer
    .concat(waves)
    .map((peak, index, waves) => {
      let maxPos = (190 - heightStep * index) / 2;

      // for the intro song give the player some time to get use to the controls
      // before adding curves (numbers are tailored to points in the song)
      let firstCurveIndex = maxLength * (isIntroSong ? 4 : 1);
      if (index >= firstCurveIndex) {
        offset += step;

        // the steeper the slope the less drastic position changes we should have
        yOffset += Math.abs(step) > 1
          ? yStep / (Math.abs(step) * 1.25)
          : yStep;

        if (yPos < 0 && yOffset < yPos ||
            yPos > 0 && yOffset > yPos) {
          yOffset = yPos;
        }

        // all calculations are based on the peaks data so that the path is the
        // same every time
        let peakIndex = index - startBuffer.length;
        Random.seed(peakIndex);

        if (++counter >= gapDistance) {
          counter = 0;
          lastPos = pos;
          pos = mid + Random.getNext(200);
          gapDistance = 300 + Random.getNext(100);
          step = (pos - lastPos) / gapDistance;
        }

        if (++yCounter >= yGapDistance) {
          yCounter = 0;
          lastYPos = yPos;
          yGapDistance = 110 + Random.getNext(23);
          yPos = Random.getNext(maxPos);
          yStep = (yPos - lastYPos) / yGapDistance;
        }
      }

      // a song is more or less "intense" based on how much it switches between
      // high and low peaks. a song like "Through the Fire and the Flames" has
      // a high rate of switching so is more intense. need to look a few peaks
      // before to ensure we find the low peaks
      let peakThreshold = 0.38; // increase or decrease to get less or more obstacles
      let lowPeak = 1;
      for (let i = index - 5; i < index; i++) {
        if (waves[i] < lowPeak) {
          lowPeak = waves[i];
        }
      }

      // for the intro song give the player some time to get use to the controls
      // before adding obstacles (numbers are tailored to points in the song)
      let firstObstacleIndex = maxLength * (isIntroSong ? 15 : 3);

      // don't create obstacles when the slope of the offset is too large
      let addObstacle = index > firstObstacleIndex && peak - lowPeak >= peakThreshold && Math.abs(step) < 1.35;
      let height = addObstacle
        ? GEN_H / 2 - Math.max(65, 35 * (1 / peak))
        : 160 + peak * waveHeight + heightStep * index;

      return {
        x: index * waveWidth,
        y: 0,
        width: waveWidth,
        height: height,
        offset: offset,
        yOffset: addObstacle && index > firstObstacleIndex ? yOffset : 0,
        yPos: yPos
      };
    });
}
