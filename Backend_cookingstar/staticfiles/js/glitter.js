/* =============================================
   نجمة الطبخ — Glitter Stars | glitter.js
   Shared floating animation for all pages
   ============================================= */

(function () {
  const STARS = [
    '✦','✧','★','☆','✨','💫','⭐','🌟',
    '🥄','🍕','🍭','🍩','🍪','🍇','🍓','🍒',
    '🍫','🍴','🍧','🌶️'
  ];

  const COLORS = ['#ff5c8a','#ffd700','#ff007f','#ffb347','#ff99bb','#fff176'];

  const container = document.getElementById('glitter-container');
  if (!container) return;

  function spawnStar() {
    const el = document.createElement('div');
    el.className = 'glitter-star';
    el.textContent = STARS[Math.floor(Math.random() * STARS.length)];
    el.style.left             = Math.random() * 100 + 'vw';
    el.style.fontSize         = (0.6 + Math.random() * 1.4) + 'rem';
    el.style.animationDuration = (5 + Math.random() * 8) + 's';
    el.style.animationDelay   = (Math.random() * 3) + 's';
    el.style.color            = COLORS[Math.floor(Math.random() * COLORS.length)];
    container.appendChild(el);
    setTimeout(() => el.remove(), 14000);
  }

  // Initial burst
  for (let i = 0; i < 12; i++) {
    setTimeout(spawnStar, i * 200);
  }

  // Continuous stream
  setInterval(spawnStar, 600);
})();
