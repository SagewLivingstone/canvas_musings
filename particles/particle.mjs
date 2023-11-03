import { drawCircle } from './canvasHelpers.mjs'

export class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.lut = 1;
    this.lum = 3;
  }

  step(delta) {
    this.x += this.vx * delta;
    this.y += this.vy * delta;
  }

  draw(ctx, debugLines=false) {
    ctx.fillStyle = "white";
    // let dmx = this.x - mx;
    // let dmy = this.y - my;
    // let dist = Math.sqrt(dmx*dmx + dmy*dmy);

    // let repulse = 500 / (Math.pow(dist, 0.4) + 10);

    for (let i = 1; i <= this.lum; i++) {
      // this doesn't work well, because the light layers stack :(
      ctx.globalAlpha = 0.5;
      drawCircle(
        ctx,
        this.x,
        this.y,
        // this.x + (dmx / dist * repulse),
        // this.y + (dmy / dist * repulse),
        i
      );
    }

    if (debugLines) {
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x, // + (dmx / dist * repulse),
        this.y, // + (dmy / dist * repulse)
      );
      ctx.stroke();
    }
  }
}