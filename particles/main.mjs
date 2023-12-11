import { Particle } from './particle.mjs'

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

let mx = 0;
let my = 0;

let objects = [];

let starttime = 0;
function render(delta) {
    window.requestAnimationFrame(render);
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    objects.forEach(o => o.step(ctx, delta - starttime));
    objects.forEach(o => o.draw(ctx, false));

    starttime = delta;
};

document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
});

/* Initialization */
let particles = [...Particle.spawnParticleGrid(20)];
objects.push(...particles);

/* Render Loop */
window.requestAnimationFrame(render);