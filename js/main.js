//------------------------------------------------------------
// Start up
//------------------------------------------------------------
function main() {
  resize();
  getBestTime();
  loop.start();

  // the built-in soundtrack is kept around so the player can switch back to
  // it after uploading their own song
  defaultSong = loadDefaultSong();
  audio = defaultSong.audio;
  peaks = defaultSong.peaks;
  currentSongDuration = defaultSong.duration;
  applyAudioOptions();
  generateWaveData();
  updateSongInfo();

  menuScene.show(() => focusFirst(menuScene));
}

main();
