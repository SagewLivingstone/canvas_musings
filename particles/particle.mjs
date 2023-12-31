import { drawCircle } from './canvasHelpers.mjs'

export class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
    }

    step(ctx, delta) {
        this.x += this.vx * delta / 1000;
        this.y += this.vy * delta / 1000;

        // x wall collision
        if (this.x > ctx.canvas.width || this.x < 0) {
            let extrax = this.x > 0 ? this.x - ctx.canvas.width : this.x;
            this.x -= extrax;
            this.vx *= -1;
        }

        // y wall collision
        if (this.y > ctx.canvas.height || this.y < 0) {
            let extray = this.y > 0 ? this.y - ctx.canvas.height : this.y;
            this.y -= extray;
            this.vy *= -1;
        }
    }

    draw(ctx, debugLines = false) {
        ctx.fillStyle = "white";

        drawCircle(ctx, this.x, this.y, 2);

        if (debugLines) {
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + this.vx,
                this.y + this.vy,
            );
            ctx.stroke();
        }
    }


    static spawnParticleGrid(gap) {
        let objects = [];

        for (let i = gap; i < window.innerWidth; i += gap)
            for (let j = gap; j < window.innerHeight; j += gap)
                objects.push(new Particle(
                    i + (Math.random() - 0.5) * gap,
                    j + (Math.random() - 0.5) * gap
                ));

        return objects;
    }
}