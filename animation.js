const canvas = document.getElementById('particlesCanvas');
const ctx = canvas.getContext('2d');

const containerLogin = document.getElementsByClassName('container-login')[0];
console.log(containerLogin.offsetWidth)

canvas.width = window.innerWidth - containerLogin.offsetWidth;
canvas.height = window.innerHeight;

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 2 - 1; 
    this.speedY = Math.random() * 2 - 1; 
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
    ctx.fill();
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x + this.size > canvas.width || this.x - this.size < 0) {
      this.speedX *= -1;
    }

    if (this.y + this.size > canvas.height || this.y - this.size < 0) {
      this.speedY *= -1;
    }

    this.draw();
  }
}

const particlesArray = [];
const numParticles = 100;

for (let i = 0; i < numParticles; i++) {
  particlesArray.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particlesArray.forEach(particle => particle.update());

  connectParticles();
  requestAnimationFrame(animate);
}

function connectParticles() {
  for (let i = 0; i < particlesArray.length; i++) {
    for (let j = i + 1; j < particlesArray.length; j++) {
      const dx = particlesArray[i].x - particlesArray[j].x;
      const dy = particlesArray[i].y - particlesArray[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        ctx.beginPath();
        ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
        ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 100})`;
        ctx.stroke();
      }
    }
  }
}

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth - containerLogin.offsetWidth;
  canvas.height = window.innerHeight;
  animate();
});

animate();
