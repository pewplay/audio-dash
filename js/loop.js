//------------------------------------------------------------
// Game loop
//------------------------------------------------------------
let updateCounter = 0;
let numUpdates = 0;
loop = kontra.gameLoop({
  clearCanvas: false,
  update() {
    updateGamepad();

    activeScenes.forEach(scene => scene.update());

    numUpdates = 0;
    if ((tutorialScene.active || gameScene.active) && !gameOverScene.active && !winScene.active && !paused) {
      updateCounter += audio.playbackRate;

      while (updateCounter >= 1) {
        numUpdates++;
        updateCounter--;
        ship.update();
      }
    }

    if (tutorialScene.active && !isTutorial && !tutorialScene.isHidding) {
      tutorialScene.hide(() => {

        // reset ship points to line up with gameScene move (which starts at startMove)
        for (let count = 0, i = ship.points.length - 1, point; point = ship.points[i]; i--) {
          point.x = startMove - tutorialMoveInc * count++;
        }
        gameScene.show();
      });
    }
  },
  render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, kontra.canvas.width, kontra.canvas.height);

    setWorldTransform();

    if (showTutorialBars) {
      let ext = view.ext + 2;
      ctx.fillStyle = '#00a3dc';
      ctx.fillRect(-2, -ext, view.worldW + 4, 160 + ext);
      ctx.fillRect(-2, GEN_H - 160, view.worldW + 4, 160 + ext);
    }

    activeScenes.forEach(scene => scene.render());

    if (tutorialScene.active) {
      setWorldTransform();
      if (!paused) tutorialMove += tutorialMoveInc;
      ship.render(tutorialMove);

      while (ship.points.length && ship.points[0].x - tutorialMove + ship.x < 0 - ship.width) {
        ship.points.shift();
      }
    }

    if (menuScene.active || optionsScene.active) {
      showHelpText();
    }
  }
});
