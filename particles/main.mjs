import { Particle } from './particle.mjs'

const PARTICLE_GAP = 20;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

let mx = 0;
let my = 0;

let objects = [];

function falloff(x, dist) {
  return (1 - (x/dist)**2)**3;
}


function spawnParticleGrid() {
  for (let i = PARTICLE_GAP; i < window.innerWidth; i += PARTICLE_GAP)
    for (let j = PARTICLE_GAP; j < window.innerHeight; j += PARTICLE_GAP)
      objects.push(new Particle(
        i + (Math.random()-0.5) * PARTICLE_GAP,
        j + (Math.random()-0.5) * PARTICLE_GAP
      ));
}

function draw() {
  window.requestAnimationFrame(draw);
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  objects.forEach(o => o.step());
  objects.forEach(o => o.draw(ctx));
};

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
});

spawnParticleGrid();

draw();