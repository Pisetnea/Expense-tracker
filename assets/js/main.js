// ================================================
// Particle background animation
// ================================================
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

let w, h;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', resize);

const particles = [];
for (let i = 0; i < 90; i++) {
    particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + 0.8,
        speed: Math.random() * 0.6 + 0.15
    });
}

function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.35)';
        ctx.fill();

        p.y -= p.speed;
        if (p.y < -20) p.y = h + 20;
    });
    requestAnimationFrame(animate);
}

animate();

// ================================================
// Auto redirect if already logged in
// ================================================
if (localStorage.getItem('currentUser')) {
    window.location.replace('dashboard.html');
}