// --- AUDIO Y REPRODUCTOR ALTERNATIVO ---
const audio = document.querySelector('#radio');
const status = document.querySelector('#audio-status');

if (audio && status) {
  audio.addEventListener('playing', () => { status.textContent = 'Conectado a la señal en vivo.'; });
  audio.addEventListener('waiting', () => { status.textContent = 'Conectando con la señal…'; });
  audio.addEventListener('error', () => { status.textContent = 'No fue posible conectar. Prueba el reproductor alternativo.'; });
}

const alternate = document.querySelector('#alternate-player');
if (alternate) {
  alternate.addEventListener('toggle', () => {
    if (alternate.open && !document.querySelector('#alternate-frame iframe')) {
      const frame = document.createElement('iframe');
      frame.src = 'https://virtualtronics.com/streaming/customers/rinconadastereo/player.php?type=big';
      frame.title = 'Reproductor alternativo de Rinconada Stereo';
      frame.loading = 'lazy';
      document.querySelector('#alternate-frame').append(frame);
      if (audio) audio.pause();
    }
  });
}

// --- CLIMA NATIVO REGIONAL CON OPEN-METEO ---
const weatherCard = document.querySelector('#weather-card');

function getWeatherInterpretation(code) {
  // Mapeo WMO de códigos meteorológicos a descripción e icono SVG
  if (code === 0) {
    return {
      desc: 'Cielo despejado',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#f2ce6c" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
    };
  } else if (code <= 3) {
    return {
      desc: code === 1 ? 'Mayormente despejado' : (code === 2 ? 'Parcialmente nublado' : 'Nublado'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#3676ce" stroke-width="2" stroke-linecap="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>'
    };
  } else if (code <= 48) {
    return {
      desc: 'Niebla o neblina',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#5c728e" stroke-width="2" stroke-linecap="round"><line x1="3" y1="10" x2="21" y2="10"></line><line x1="3" y1="14" x2="21" y2="14"></line><line x1="5" y1="18" x2="19" y2="18"></line></svg>'
    };
  } else if (code <= 67) {
    return {
      desc: code <= 55 ? 'Llovizna' : 'Lluvia regional',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#3676ce" stroke-width="2" stroke-linecap="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path><line x1="8" y1="19" x2="8" y2="21"></line><line x1="12" y1="19" x2="12" y2="21"></line><line x1="16" y1="19" x2="16" y2="21"></line></svg>'
    };
  } else if (code <= 82) {
    return {
      desc: 'Chubascos',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#3676ce" stroke-width="2" stroke-linecap="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path><line x1="8" y1="19" x2="8" y2="22"></line><line x1="12" y1="19" x2="12" y2="22"></line><line x1="16" y1="19" x2="16" y2="22"></line></svg>'
    };
  } else {
    return {
      desc: 'Tormenta eléctrica',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef704f" stroke-width="2" stroke-linecap="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="13 11 9 17 15 17 11 23"></polyline></svg>'
    };
  }
}

async function loadOpenMeteoWeather() {
  if (!weatherCard) return;
  try {
    const lat = 9.2579;
    const lon = -74.2599;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FBogota`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Respuesta no exitosa de la API');
    const data = await res.json();
    const current = data.current;
    const info = getWeatherInterpretation(current.weather_code);

    weatherCard.innerHTML = `
      <div class="weather-main">
        <div>
          <div class="weather-temp">${Math.round(current.temperature_2m)}°C</div>
          <div class="weather-desc">${info.desc}</div>
        </div>
        <div class="weather-icon-box" aria-hidden="true">${info.icon}</div>
      </div>
      <div class="weather-sub">
        <span>💧 Humedad: <strong>${current.relative_humidity_2m}%</strong></span>
        <span>💨 Viento: <strong>${Math.round(current.wind_speed_10m)} km/h</strong></span>
      </div>
    `;
  } catch (err) {
    weatherCard.innerHTML = `
      <div class="weather-error">
        <p>Pronóstico no disponible temporalmente.</p>
      </div>
    `;
  }
}

const weatherSection = document.querySelector('#clima-regional');
if (weatherSection && 'IntersectionObserver' in window) {
  const weatherObserver = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      loadOpenMeteoWeather();
      weatherObserver.disconnect();
    }
  }, { rootMargin: '200px' });
  weatherObserver.observe(weatherSection);
} else {
  loadOpenMeteoWeather();
}

// --- LA CIÉNAGA INTERACTIVA: PECES EN CANVAS 2D ---
(function initFishPond() {
  const canvas = document.querySelector('#fish-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dpr = window.devicePixelRatio || 1;
  let width = 0;
  let height = 0;
  let animationId = null;
  let isRunning = false;

  const fishCount = 8;
  const fishPalette = ['#163c68', '#26548d', '#3676ce', '#d89e34', '#1f4879'];

  const fishList = [];
  const ripples = [];
  let pointer = { x: -1000, y: -1000, active: false };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createFish() {
    return {
      x: Math.random() * (width || 600),
      y: Math.random() * (height || 160),
      vx: (Math.random() - 0.5) * 1.6,
      vy: (Math.random() - 0.5) * 0.8,
      speed: 1.1 + Math.random() * 0.9,
      size: 20 + Math.random() * 18,
      color: fishPalette[Math.floor(Math.random() * fishPalette.length)],
      wagPhase: Math.random() * Math.PI * 2,
      wagSpeed: 0.12 + Math.random() * 0.08,
      targetAngle: 0,
      angle: 0
    };
  }

  function initFish() {
    fishList.length = 0;
    for (let i = 0; i < fishCount; i++) {
      fishList.push(createFish());
    }
  }

  function update() {
    const pad = 40;
    for (const f of fishList) {
      f.wagPhase += f.wagSpeed;

      // Reacción al cursor / touch
      if (pointer.active) {
        const dx = f.x - pointer.x;
        const dy = f.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 90 && dist > 1) {
          const force = (90 - dist) / 90 * 0.5;
          f.vx += (dx / dist) * force;
          f.vy += (dy / dist) * force;
        }
      }

      // Suave fricción y control de velocidad máxima
      const curSpeed = Math.hypot(f.vx, f.vy);
      if (curSpeed > f.speed * 2.2) {
        f.vx *= 0.95;
        f.vy *= 0.95;
      } else if (curSpeed < 0.6) {
        f.vx += (Math.random() - 0.5) * 0.2;
        f.vy += (Math.random() - 0.5) * 0.1;
      }

      f.x += f.vx;
      f.y += f.vy;

      // Mantener dentro del estanque con rebote suave
      if (f.x < pad) { f.vx += 0.08; }
      else if (f.x > width - pad) { f.vx -= 0.08; }
      if (f.y < 20) { f.vy += 0.05; }
      else if (f.y > height - 20) { f.vy -= 0.05; }

      // Orientación gradual
      const moveAngle = Math.atan2(f.vy, f.vx);
      let diff = moveAngle - f.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      f.angle += diff * 0.08;
    }

    // Ondas en el agua
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += 1.4;
      r.alpha -= 0.02;
      if (r.alpha <= 0) ripples.splice(i, 1);
    }
  }

  function drawFish(f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);

    const s = f.size;
    const wag = Math.sin(f.wagPhase) * (s * 0.22);

    ctx.fillStyle = f.color;
    ctx.beginPath();
    // Cuerpo hidrodinámico
    ctx.moveTo(s * 0.6, 0);
    ctx.quadraticCurveTo(0, -s * 0.28, -s * 0.5, 0);
    ctx.quadraticCurveTo(0, s * 0.28, s * 0.6, 0);
    ctx.fill();

    // Aleta caudal que oscila
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, 0);
    ctx.lineTo(-s * 0.85, -s * 0.25 + wag);
    ctx.lineTo(-s * 0.7, wag * 0.5);
    ctx.lineTo(-s * 0.85, s * 0.25 + wag);
    ctx.closePath();
    ctx.fill();

    // Pequeño brillo dorsal
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(s * 0.1, -s * 0.05, s * 0.2, -0.4, 0.8);
    ctx.stroke();

    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Ondas en el agua
    for (const r of ripples) {
      ctx.strokeStyle = `rgba(54, 118, 206, ${r.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dibujar cada pez
    for (const f of fishList) {
      drawFish(f);
    }
  }

  function loop() {
    if (!isRunning) return;
    update();
    render();
    animationId = requestAnimationFrame(loop);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    loop();
  }

  function stop() {
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // Interacción
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pointer.x = px;
    pointer.y = py;
    pointer.active = true;
    ripples.push({ x: px, y: py, radius: 4, alpha: 0.6 });
  });

  canvas.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  window.addEventListener('resize', () => {
    resize();
    if (reducedMotion) {
      render();
    }
  });

  resize();
  initFish();

  if (reducedMotion) {
    render();
    return;
  }

  // Pausa inteligente cuando el canvas no está en pantalla
  if ('IntersectionObserver' in window) {
    const pondObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        start();
      } else {
        stop();
      }
    }, { threshold: 0.05 });
    pondObserver.observe(canvas);
  } else {
    start();
  }
})();



