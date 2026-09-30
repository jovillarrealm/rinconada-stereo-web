// --- REPRODUCTOR CUSTOMIZADO Y SINCRONIZACIÓN ---
const audio = document.querySelector('#radio');
const status = document.querySelector('#audio-status');
const playBtn = document.querySelector('#play-btn');
const iconPlay = playBtn ? playBtn.querySelector('.icon-play') : null;
const iconPause = playBtn ? playBtn.querySelector('.icon-pause') : null;
const muteBtn = document.querySelector('#mute-btn');
const iconVolOn = muteBtn ? muteBtn.querySelector('.icon-vol-on') : null;
const iconVolMute = muteBtn ? muteBtn.querySelector('.icon-vol-mute') : null;
const volumeSlider = document.querySelector('#volume-slider');
const eqBars = document.querySelector('#eq-bars');

function updateMuteIcons() {
  if (!iconVolOn || !iconVolMute) return;
  const isMuted = audio.muted || audio.volume === 0;
  if (isMuted) {
    iconVolOn.style.display = 'none';
    iconVolMute.style.display = 'block';
  } else {
    iconVolOn.style.display = 'block';
    iconVolMute.style.display = 'none';
  }
  if (muteBtn) {
    muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar sonido');
    muteBtn.setAttribute('title', isMuted ? 'Activar sonido' : 'Silenciar sonido');
    muteBtn.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
  }
  if (volumeSlider) {
    const volPercent = Math.round(audio.volume * 100);
    volumeSlider.setAttribute('aria-valuenow', isMuted ? 0 : volPercent);
    volumeSlider.setAttribute('aria-valuetext', isMuted ? 'Silenciado' : `${volPercent} por ciento`);
  }
}

if (audio && playBtn) {
  // Inicializar volumen
  if (volumeSlider) {
    audio.volume = parseFloat(volumeSlider.value);
    updateMuteIcons();
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      if (status) {
        status.textContent = 'Conectando con la señal…';
        status.className = 'stream-status-tag is-connecting';
      }
      audio.play().catch(() => {
        if (status) {
          status.textContent = 'Error al conectar';
          status.className = 'stream-status-tag is-error';
        }
      });
    } else {
      audio.pause();
    }
  });

  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      audio.volume = parseFloat(volumeSlider.value);
      audio.muted = (audio.volume === 0);
      updateMuteIcons();
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      if (!audio.muted && audio.volume === 0) {
        audio.volume = 0.5;
        if (volumeSlider) volumeSlider.value = 0.5;
      }
      updateMuteIcons();
    });
  }

  audio.addEventListener('play', () => {
    if (iconPlay) iconPlay.style.display = 'none';
    if (iconPause) iconPause.style.display = 'block';
    if (eqBars) eqBars.classList.add('is-playing');
    if (playBtn) {
      playBtn.setAttribute('aria-label', 'Pausar señal en vivo');
      playBtn.setAttribute('title', 'Pausar señal en vivo');
    }
  });

  audio.addEventListener('playing', () => {
    if (iconPlay) iconPlay.style.display = 'none';
    if (iconPause) iconPause.style.display = 'block';
    if (eqBars) eqBars.classList.add('is-playing');
    if (playBtn) {
      playBtn.setAttribute('aria-label', 'Pausar señal en vivo');
      playBtn.setAttribute('title', 'Pausar señal en vivo');
    }
    if (status) {
      status.textContent = 'Conectado · Señal en directo';
      status.className = 'stream-status-tag is-playing';
    }
    if (typeof updatePollingSchedule === 'function') {
      fetchLiveTrack();
      updatePollingSchedule();
    }
  });

  audio.addEventListener('waiting', () => {
    if (status) {
      status.textContent = 'Conectando con la señal…';
      status.className = 'stream-status-tag is-connecting';
    }
  });

  audio.addEventListener('pause', () => {
    if (iconPlay) iconPlay.style.display = 'block';
    if (iconPause) iconPause.style.display = 'none';
    if (eqBars) eqBars.classList.remove('is-playing');
    if (playBtn) {
      playBtn.setAttribute('aria-label', 'Reproducir señal en vivo');
      playBtn.setAttribute('title', 'Reproducir señal en vivo');
    }
    if (status) {
      status.textContent = 'Señal en pausa';
      status.className = 'stream-status-tag';
    }
    if (typeof updatePollingSchedule === 'function') {
      updatePollingSchedule();
    }
  });

  audio.addEventListener('error', () => {
    if (iconPlay) iconPlay.style.display = 'block';
    if (iconPause) iconPause.style.display = 'none';
    if (eqBars) eqBars.classList.remove('is-playing');
    if (playBtn) {
      playBtn.setAttribute('aria-label', 'Reproducir señal en vivo');
      playBtn.setAttribute('title', 'Reproducir señal en vivo');
    }
    if (status) {
      status.textContent = 'Error al conectar';
      status.className = 'stream-status-tag is-error';
    }
  });

  // MediaSession API para controles del sistema operativo (móvil, teclado, pantalla de bloqueo)
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => { audio.play().catch(() => {}); });
    navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); });
  }
}

// --- CONSULTA EN VIVO DEL TEMA SONANDO (METADATA SHOUTCAST VÍA JSONP) ---
const trackTitleEl = document.querySelector('#track-title');
const trackBoxEl = document.querySelector('#now-playing-box');
let currentTrackTitle = '';
let metaPollInterval = null;

function updateNowPlaying(rawTitle) {
  if (!rawTitle) return;
  const cleaned = rawTitle.trim();
  if (!cleaned) return;

  if (cleaned !== currentTrackTitle) {
    currentTrackTitle = cleaned;
    if (trackTitleEl) {
      trackTitleEl.style.opacity = '0';
      setTimeout(() => {
        trackTitleEl.textContent = cleaned;
        trackTitleEl.setAttribute('title', cleaned);
        trackTitleEl.style.opacity = '1';
      }, 150);
    }
    if (trackBoxEl) {
      trackBoxEl.classList.add('is-live');
    }

    if ('mediaSession' in navigator) {
      try {
        const logoUrl = new URL('assets/logo-rinconada.png', window.location.href).href;
        const validScheme = /^(https?:|blob:|data:)/i.test(logoUrl);
        navigator.mediaSession.metadata = new MediaMetadata({
          title: cleaned,
          artist: 'Rinconada Stereo',
          album: 'Señal en directo · La Pacha',
          artwork: validScheme ? [
            { src: logoUrl, sizes: '512x512', type: 'image/png' }
          ] : []
        });
      } catch (e) {
        // En navegadores con soporte parcial de MediaSession
      }
    }
  }
}

function fetchLiveTrack() {
  const cbName = 'rs_meta_cb_' + Math.floor(Math.random() * 1000000);
  const script = document.createElement('script');
  
  const timer = setTimeout(() => {
    cleanup();
  }, 6000);

  function cleanup() {
    clearTimeout(timer);
    if (window[cbName]) {
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
    }
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }

  window[cbName] = function(data) {
    cleanup();
    if (data && data.songtitle) {
      updateNowPlaying(data.songtitle);
    }
  };

  script.onerror = function() {
    cleanup();
  };

  script.src = `https://play14.tikast.com:22012/stats?sid=1&json=1&callback=${cbName}&_t=${Date.now()}`;
  document.head.appendChild(script);
}

function updatePollingSchedule() {
  if (metaPollInterval) {
    clearInterval(metaPollInterval);
    metaPollInterval = null;
  }
  const isPlaying = audio && !audio.paused;
  const isHidden = document.hidden;

  let intervalMs;
  if (isHidden) {
    intervalMs = isPlaying ? 30000 : 60000;
  } else {
    intervalMs = isPlaying ? 8000 : 30000;
  }
  metaPollInterval = setInterval(fetchLiveTrack, intervalMs);
}

// Iniciar sondeo de metadatos (inmediato y adaptativo según estado)
fetchLiveTrack();
updatePollingSchedule();

// Ahorro de recursos si la pestaña pasa a segundo plano o vuelve al frente
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    fetchLiveTrack();
  }
  updatePollingSchedule();
});

// Respaldo de iframe virtualtronics en details
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

// --- CARGA DIFERIDA INTELIGENTE DEL CHAT (CBOX) ---
const chatIframe = document.querySelector('#chat iframe[data-src]');
if (chatIframe) {
  let chatLoaded = false;
  const loadChat = () => {
    if (chatLoaded) return;
    chatLoaded = true;
    const realSrc = chatIframe.getAttribute('data-src');
    if (realSrc) {
      chatIframe.src = realSrc;
      chatIframe.removeAttribute('data-src');
    }
  };

  // Carga inmediata si el usuario interactúa o enfoca la tarjeta del chat
  const chatCard = document.querySelector('#chat');
  if (chatCard) {
    ['pointerenter', 'touchstart', 'focusin'].forEach(evt => {
      chatCard.addEventListener(evt, loadChat, { once: true, passive: true });
    });
  }

  // Carga inteligente por visibilidad (IntersectionObserver):
  // En escritorio (hero) se activa de inmediato sin bloquear; en móvil espera a que el usuario se acerque a la sección.
  if ('IntersectionObserver' in window && chatCard) {
    const chatObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadChat();
          observer.disconnect();
        }
      });
    }, { rootMargin: '250px 0px' });
    chatObserver.observe(chatCard);
  } else {
    // Respaldo para navegadores sin IntersectionObserver
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        setTimeout(loadChat, 1500);
      }, { timeout: 4000 });
    } else {
      window.addEventListener('load', () => {
        setTimeout(loadChat, 2000);
      }, { once: true });
    }
  }
}

// --- CLIMA NATIVO REGIONAL CON OPEN-METEO (LA PACHA PROMINENTE) ---
const weatherCard = document.querySelector('#weather-card');

function getWeatherInterpretation(code) {
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
        <div class="weather-temp-group">
          <div class="weather-temp">${Math.round(current.temperature_2m)}°C</div>
          <div class="weather-location-highlight">La Pacha, <span>Magdalena</span></div>
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

// --- LA CIÉNAGA INTERACTIVA: ALIMENTAR A LOS PECES EN CANVAS 2D ---
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

  const fishCount = 14; // 15%+ más peces (antes 12)
  
  // Catálogo ampliado a 8 especies autóctonas con gran variedad morfológica y cromática
  const fishSpecies = [
    {
      name: 'bocachico',
      colors: ['#1c4575', '#285e9e', '#3676ce'],
      sizeRange: [28, 44],
      bodyAspect: 0.27,
      tailType: 'swallow',
      speedMult: 1.0,
      wagMult: 1.0
    },
    {
      name: 'dorada',
      colors: ['#d48b1c', '#e8a531', '#f5bf4e'],
      sizeRange: [30, 46],
      bodyAspect: 0.32,
      tailType: 'fan',
      speedMult: 1.08,
      wagMult: 1.15
    },
    {
      name: 'tilapia_roja',
      colors: ['#d64627', '#e86548', '#f28a6f'],
      sizeRange: [28, 44],
      bodyAspect: 0.36,
      tailType: 'fan',
      speedMult: 1.12,
      wagMult: 1.2
    },
    {
      name: 'sardina',
      colors: ['#4a82bf', '#6ea4e2', '#8fc3fa'],
      sizeRange: [15, 23],
      bodyAspect: 0.19,
      tailType: 'swift',
      speedMult: 1.38,
      wagMult: 1.45
    },
    {
      name: 'mojarra',
      colors: ['#193a61', '#245084', '#326ba8'],
      sizeRange: [32, 50],
      bodyAspect: 0.39,
      tailType: 'rounded',
      speedMult: 0.85,
      wagMult: 0.9
    },
    {
      name: 'pacora',
      colors: ['#425e30', '#5c8042', '#7fa35e'],
      sizeRange: [27, 42],
      bodyAspect: 0.28,
      tailType: 'rounded',
      speedMult: 0.95,
      wagMult: 1.02
    },
    {
      name: 'arenca',
      colors: ['#6e92b8', '#9bbbdc', '#cae0f5'],
      sizeRange: [20, 32],
      bodyAspect: 0.21,
      tailType: 'swallow',
      speedMult: 1.25,
      wagMult: 1.3
    },
    {
      name: 'bagrecito',
      colors: ['#15263a', '#1d3654', '#2a4a6e'],
      sizeRange: [32, 48],
      bodyAspect: 0.23,
      tailType: 'tapered',
      hasBarbels: true,
      speedMult: 0.9,
      wagMult: 0.95
    }
  ];

  const fishList = [];
  const ripples = [];
  const foodCrumbs = [];
  let pointer = { x: -1000, y: -1000, active: false };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createFish(index) {
    const sp = fishSpecies[index % fishSpecies.length];
    const baseSize = sp.sizeRange[0] + Math.random() * (sp.sizeRange[1] - sp.sizeRange[0]);
    const color = sp.colors[Math.floor(Math.random() * sp.colors.length)];

    return {
      name: sp.name,
      x: Math.random() * (width || 600),
      y: Math.random() * (height || 280),
      vx: (Math.random() - 0.5) * 1.5 * sp.speedMult,
      vy: (Math.random() - 0.5) * 0.8 * sp.speedMult,
      speed: (1.1 + Math.random() * 0.8) * sp.speedMult,
      size: baseSize,
      bodyAspect: sp.bodyAspect,
      tailType: sp.tailType,
      hasBarbels: !!sp.hasBarbels,
      color: color,
      wagPhase: Math.random() * Math.PI * 2,
      wagSpeed: (0.12 + Math.random() * 0.08) * sp.wagMult,
      angle: 0
    };
  }

  function initFish() {
    fishList.length = 0;
    for (let i = 0; i < fishCount; i++) {
      fishList.push(createFish(i));
    }
  }

  function dropFood(x, y) {
    // Al hacer clic, se lanzan 3 a 5 partículas de alimento
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      foodCrumbs.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y + (Math.random() - 0.5) * 18,
        r: 2 + Math.random() * 1.2,
        life: 1.0,
        vy: 0.12 + Math.random() * 0.1
      });
    }
    ripples.push({ x: x, y: y, radius: 4, alpha: 0.6 });
  }

  function update() {
    const pad = 35;

    // Actualizar migajas de alimento
    for (let i = foodCrumbs.length - 1; i >= 0; i--) {
      const c = foodCrumbs[i];
      c.y += c.vy;
      c.life -= 0.003;
      if (c.life <= 0 || c.y > height - 10) {
        foodCrumbs.splice(i, 1);
      }
    }

    // Actualizar peces
    for (const f of fishList) {
      f.wagPhase += f.wagSpeed;

      // 1. Si hay comida en el agua, los peces van directamente hacia la migaja más cercana
      let targetCrumb = null;
      let minCrumbDist = 9999;
      for (let i = 0; i < foodCrumbs.length; i++) {
        const c = foodCrumbs[i];
        const d = Math.hypot(c.x - f.x, c.y - f.y);
        if (d < minCrumbDist) {
          minCrumbDist = d;
          targetCrumb = { crumb: c, index: i, dist: d };
        }
      }

      if (targetCrumb) {
        const dx = targetCrumb.crumb.x - f.x;
        const dy = targetCrumb.crumb.y - f.y;
        const dist = targetCrumb.dist;

        if (dist > 10) {
          f.vx += (dx / dist) * 0.35;
          f.vy += (dy / dist) * 0.35;
          f.wagSpeed = 0.22; // Nado emocionado hacia el alimento
        } else {
          // El pez se come la migaja
          foodCrumbs.splice(targetCrumb.index, 1);
          ripples.push({ x: f.x, y: f.y, radius: 2, alpha: 0.4 });
          f.vx *= 0.5;
          f.vy *= 0.5;
        }
      } 
      // 2. Si no hay comida pero el cursor está en el estanque, los peces se acercan al cursor como esperando comida
      else if (pointer.active) {
        const dx = pointer.x - f.x;
        const dy = pointer.y - f.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 28 && dist < 240) {
          // Atracción suave hacia la mano / cursor
          const pull = 0.22;
          f.vx += (dx / dist) * pull;
          f.vy += (dy / dist) * pull;
          f.wagSpeed = 0.17;
        } else if (dist <= 28) {
          // Dan vueltas alrededor del cursor esperando alimento
          f.vx += (-dy / (dist || 1)) * 0.4;
          f.vy += (dx / (dist || 1)) * 0.4;
          f.wagSpeed = 0.14;
        }
      } else {
        f.wagSpeed = 0.11;
      }

      // Fricción y límite de velocidad
      const curSpeed = Math.hypot(f.vx, f.vy);
      const maxSpeed = (foodCrumbs.length > 0 || pointer.active) ? f.speed * 2.3 : f.speed * 1.5;
      if (curSpeed > maxSpeed) {
        f.vx *= 0.94;
        f.vy *= 0.94;
      } else if (curSpeed < 0.5) {
        f.vx += (Math.random() - 0.5) * 0.2;
        f.vy += (Math.random() - 0.5) * 0.1;
      }

      f.x += f.vx;
      f.y += f.vy;

      // Mantener dentro de los bordes con giro suave
      if (f.x < pad) f.vx += 0.1;
      else if (f.x > width - pad) f.vx -= 0.1;
      if (f.y < 18) f.vy += 0.08;
      else if (f.y > height - 18) f.vy -= 0.08;

      // Orientación del pez hacia el movimiento
      const moveAngle = Math.atan2(f.vy, f.vx);
      let diff = moveAngle - f.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      f.angle += diff * 0.09;
    }

    // Actualizar ondas
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
    const aspect = f.bodyAspect || 0.28;
    const wag = Math.sin(f.wagPhase) * (s * 0.22);

    ctx.fillStyle = f.color;

    // Aleta dorsal superior
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * aspect * 0.9);
    ctx.lineTo(-s * 0.2, -s * (aspect * 1.55));
    ctx.lineTo(-s * 0.35, -s * aspect * 0.8);
    ctx.closePath();
    ctx.fill();

    // Aleta pectoral lateral
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * aspect * 0.6);
    ctx.lineTo(s * 0.05, s * (aspect * 1.45));
    ctx.lineTo(0, s * aspect * 0.7);
    ctx.closePath();
    ctx.fill();

    // Cuerpo adaptado a la especie
    ctx.beginPath();
    ctx.moveTo(s * 0.6, 0);
    ctx.quadraticCurveTo(0, -s * aspect, -s * 0.5, 0);
    ctx.quadraticCurveTo(0, s * aspect, s * 0.6, 0);
    ctx.fill();

    // Aleta caudal diferenciada por especie
    ctx.beginPath();
    if (f.tailType === 'swallow') {
      // Cola ahorquillada en V profunda (Bocachico)
      ctx.moveTo(-s * 0.45, 0);
      ctx.lineTo(-s * 0.95, -s * 0.32 + wag);
      ctx.lineTo(-s * 0.65, wag * 0.5);
      ctx.lineTo(-s * 0.95, s * 0.32 + wag);
      ctx.closePath();
    } else if (f.tailType === 'fan') {
      // Cola en abanico amplio redondeado (Dorada)
      ctx.moveTo(-s * 0.45, 0);
      ctx.quadraticCurveTo(-s * 0.88, -s * 0.38 + wag, -s * 0.82, wag);
      ctx.quadraticCurveTo(-s * 0.88, s * 0.38 + wag, -s * 0.45, 0);
    } else if (f.tailType === 'rounded') {
      // Cola ancha de paleta (Mojarra)
      ctx.moveTo(-s * 0.45, -s * 0.12);
      ctx.lineTo(-s * 0.85, -s * 0.3 + wag);
      ctx.quadraticCurveTo(-s * 0.92, wag, -s * 0.85, s * 0.3 + wag);
      ctx.lineTo(-s * 0.45, s * 0.12);
      ctx.closePath();
    } else {
      // Cola veloz / ahusada (Sardina / Bagrecito)
      ctx.moveTo(-s * 0.45, 0);
      ctx.lineTo(-s * 0.82, -s * 0.22 + wag);
      ctx.lineTo(-s * 0.68, wag * 0.4);
      ctx.lineTo(-s * 0.82, s * 0.22 + wag);
      ctx.closePath();
    }
    ctx.fill();

    // Barbillones / bigotes si es bagrecito
    if (f.hasBarbels) {
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s * 0.55, -s * 0.04);
      ctx.quadraticCurveTo(s * 0.75, -s * 0.14, s * 0.86, -s * 0.08);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s * 0.55, s * 0.04);
      ctx.quadraticCurveTo(s * 0.75, s * 0.14, s * 0.86, s * 0.08);
      ctx.stroke();
    }

    // Ojo con brillo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.38, -s * (aspect * 0.35), s * 0.065, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f1f33';
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * (aspect * 0.35), s * 0.038, 0, Math.PI * 2);
    ctx.fill();

    // Reflejo dorsal plateado / dorado
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(s * 0.1, -s * (aspect * 0.15), s * 0.22, -0.4, 0.8);
    ctx.stroke();

    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Dibujar ondas en el agua
    for (const r of ripples) {
      ctx.strokeStyle = `rgba(54, 118, 206, ${r.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dibujar alimento
    for (const c of foodCrumbs) {
      ctx.fillStyle = `rgba(226, 165, 50, ${c.life})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(160, 95, 15, ${c.life * 0.7})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // Dibujar peces
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

  // Interacción: Mover cursor (atraer peces)
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  });

  // Interacción: Clic / Tap (soltar alimento)
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pointer.x = px;
    pointer.y = py;
    pointer.active = true;
    dropFood(px, py);
  });

  canvas.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  // Interacción por teclado (WCAG 2.1.1 Operable por teclado)
  canvas.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const rx = (width / 2) + (Math.random() * 120 - 60);
      const ry = (height / 2) + (Math.random() * 80 - 40);
      pointer.x = rx;
      pointer.y = ry;
      pointer.active = true;
      dropFood(rx, ry);
      if (reducedMotion) render();
    }
  });

  window.addEventListener('resize', () => {
    if (!initialized) return;
    resize();
    if (reducedMotion) render();
  });

  let initialized = false;
  function ensurePondReady() {
    if (initialized) return;
    initialized = true;
    resize();
    initFish();
    if (reducedMotion) render();
  }

  if ('IntersectionObserver' in window) {
    const pondObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        ensurePondReady();
        if (!reducedMotion) start();
      } else {
        stop();
      }
    }, { rootMargin: '150px', threshold: 0.02 });
    pondObserver.observe(canvas);
  } else {
    ensurePondReady();
    if (!reducedMotion) start();
  }

  // En caso de que el navegador quede inactivo, pre-inicializar en segundo plano sin bloquear
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      ensurePondReady();
    }, { timeout: 5000 });
  }
})();

// --- REGISTRO DE SERVICE WORKER (PWA & 0 MS REPEAT VISITS) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      // Registro fallido o entorno sin soporte HTTPS
    });
  });
}

