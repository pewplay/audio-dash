//------------------------------------------------------------
// Time functions
//------------------------------------------------------------

/**
 * Get the time in ss:hh format (seconds:hundredths).
 * @param {number} time
 * @returns {string}
 */
function getTime(time) {
  return (Math.floor((time || 0) * 100) / 100).toFixed(2).replace('.', ':');
}

/**
 * Get seconds from time.
 * @param {string} time
 * @returns {string}
 */
function getSeconds(time) {
  if (time.indexOf(':') !== -1) {
    return time.substr(0, time.indexOf(':'));
  }

  return '0';
}

/**
 * Get hundredths of a second from time.
 * @param {string} time
 * @returns {string}
 */
function getMilliseconds(time) {
  if (time.indexOf(':') !== -1) {
    return time.substr(time.indexOf(':') + 1);
  }

  return '00';
}

/**
 * Get the best time for the song.
 */
function getBestTime() {
  bestTimes = storeGet('best') || {};
  bestTime = bestTimes[songName] || '0:00';
}

/**
 * Set the best time for the song.
 * @returns {boolean} true if it was a new best time
 */
function setBestTime() {
  if (isBetterTime(songTime())) {
    bestTime = getTime(songTime());
    bestTimes[songName] = bestTime;
    storeSet('best', bestTimes);
    return true;
  }

  return false;
}

/**
 * Check to see if the time is better than the best time.
 * @param {number} time
 * @returns {boolean}
 */
function isBetterTime(time) {
  return getTime(time) !== getTime(0) &&
    parseFloat(getTime(time).replace(':', '.')) > parseFloat(bestTime.replace(':', '.'));
}

/**
 * Fill a result line (game over / win panel).
 */
function showResult(el, isBest) {
  let pct = Math.min(100, Math.floor(songTime() / songDuration() * 100));
  el.innerHTML = '';
  let line1 = document.createElement('div');
  line1.textContent = 'TIME ' + formatSeconds(getTime(songTime())) + '  ·  ' + pct + '% OF THE SONG';
  let line2 = document.createElement('div');
  if (isBest) {
    line2.className = 'new';
    line2.textContent = 'NEW BEST TIME!';
  }
  else {
    line2.textContent = 'BEST ' + formatSeconds(bestTime);
  }
  el.append(line1, line2);
}

/**
 * "18:34" (seconds:hundredths) -> "18.34s" for the result panels.
 */
function formatSeconds(time) {
  return time.replace(':', '.') + 's';
}
