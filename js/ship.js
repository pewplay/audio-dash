//------------------------------------------------------------
// Ship
//------------------------------------------------------------
let ship = kontra.sprite({
  x: GEN_W / 2 - waveWidth / 2,
  y: GEN_H / 2 - waveWidth / 2,
  width: waveWidth,
  height: waveWidth,
  gravity: 5,
  points: [],
  maxAcc: 8,
  update() {
    let pressed = kontra.keys.pressed('space') || touchPressed || pressLatched ||
      (gamepad && gamepad.buttons[0].pressed);
    pressLatched = false;

    if (pressed) {
      this.ddy = -this.gravity;

      isTutorial = false;
      if (resumeHold) endResumeHold();
    }
    else {
      this.ddy = this.gravity;
    }

    if (isTutorial || resumeHold) return;

    this.y += this.dy;
    this.dy += this.ddy;

    let maxAcc = this.maxAcc;
    if (Math.abs(this.dy) > maxAcc) {
      this.dy = this.dy < 0 ? -maxAcc : maxAcc;
    }
  },
  /**
   * Trail points are stored in "move" space (independent of the ship's
   * screen position) so the trail stays correct when the window is resized.
   * @param {number} move - how far the world has scrolled
   */
  render(move) {
    if (numUpdates >= 1 && !gameOverScene.active && !winScene.active && !paused && !resumeHold) {
      this.points.push({x: move, y: this.y + 1});
    }

    neonRect(this.x, this.y, this.width, this.height, 0, 163, 220);
    neonLine(this.points, move - this.x, 0, 163, 220);
  }
});
