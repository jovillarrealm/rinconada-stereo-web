// ==========================================================================
// RINCONADA STEREO — WEB APP
// Radio en línea desde La Pacha, Magdalena, Colombia · Un encuentro con tu región
// Arquitectura modular sin dependencias (Vanilla JS, 0 runtime overhead)
// Optimizado para conexiones móviles lentas (2G/3G), bajo consumo y resiliencia
// ==========================================================================

/**
 * @typedef {'light' | 'dark'} ThemeName
 *
 * @typedef {Object} StorageGateway
 * @property {function(string, (string|null)=): (string|null)} get - Obtiene un valor de forma segura
 * @property {function(string, (string|number|boolean)): boolean} set - Almacena un valor serializado
 * @property {function(string): boolean} remove - Elimina una clave de forma segura
 *
 * @typedef {Object} StorageAdapterType
 * @property {StorageGateway} local
 * @property {StorageGateway} session
 *
 * @typedef {Object} RecentTrack
 * @property {string} title - Título de la pista musical
 * @property {string} time - Hora formateada del registro
 *
 * @typedef {Object} WeatherCondition
 * @property {string} desc - Descripción textual del estado meteorológico
 * @property {string} icon - Cadena de marcado SVG del icono correspondiente
 *
 * @typedef {Object} WeatherCachedPayload
 * @property {number} timestamp - Epoch en milisegundos de la captura
 * @property {number} temp - Temperatura en grados Celsius
 * @property {string} desc - Descripción meteorológica
 * @property {string} icon - SVG del icono meteorológico
 * @property {number} humidity - Porcentaje de humedad relativa
 * @property {number} wind - Velocidad del viento en km/h
 *
 * @typedef {Object} LiveMetadataPayload
 * @property {string} [songtitle] - Título emitido por el encoder Shoutcast
 */

// --- 1. MÓDULO DE ALMACENAMIENTO SEGURO (StorageAdapter) ---
/** @type {StorageAdapterType} */
const StorageAdapter = {
  local: {
    /**
     * @param {string} key
     * @param {string|null} [fallback=null]
     * @returns {string|null}
     */
    get(key, fallback = null) {
      if (typeof key !== 'string' || !key) return fallback;
      try {
        const val = localStorage.getItem(key);
        return val !== null ? val : fallback;
      } catch (e) {
        return fallback;
      }
    },
    /**
     * @param {string} key
     * @param {string|number|boolean} val
     * @returns {boolean}
     */
    set(key, val) {
      if (typeof key !== 'string' || !key || val === undefined) return false;
      try {
        localStorage.setItem(key, String(val));
        return true;
      } catch (e) {
        return false;
      }
    },
    /**
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {
      if (typeof key !== 'string' || !key) return false;
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        return false;
      }
    }
  },
  session: {
    /**
     * @param {string} key
     * @param {string|null} [fallback=null]
     * @returns {string|null}
     */
    get(key, fallback = null) {
      if (typeof key !== 'string' || !key) return fallback;
      try {
        const val = sessionStorage.getItem(key);
        return val !== null ? val : fallback;
      } catch (e) {
        return fallback;
      }
    },
    /**
     * @param {string} key
     * @param {string|number|boolean} val
     * @returns {boolean}
     */
    set(key, val) {
      if (typeof key !== 'string' || !key || val === undefined) return false;
      try {
        sessionStorage.setItem(key, String(val));
        return true;
      } catch (e) {
        return false;
      }
    },
    /**
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {
      if (typeof key !== 'string' || !key) return false;
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
};

// --- 2. MÓDULO DE CONECTIVIDAD Y MODO AHORRO (NetworkMonitor) ---
const NetworkMonitor = {
  isSaveDataEnabled() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !!(conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g'));
  },
  isOnline() {
    return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
  }
};

// --- 3. MÓDULO DE GESTIÓN DE TEMA (ThemeManager) ---
const ThemeManager = (function() {
  const STORAGE_KEY = 'rinconada_theme';
  const toggleBtn = document.querySelector('#theme-toggle');
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const subscribers = [];
  let currentTheme = 'light';

  function getSystemTheme() {
    return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
  }

  function detectInitialTheme() {
    return document.documentElement.getAttribute('data-theme') ||
      StorageAdapter.local.get(STORAGE_KEY) ||
      getSystemTheme();
  }

  function apply(theme, isUserAction = false) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    if (isUserAction) {
      StorageAdapter.local.set(STORAGE_KEY, theme);
    }

    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#071526' : '#0d62d9');
    }

    if (toggleBtn) {
      const isDark = theme === 'dark';
      const targetLabel = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
      toggleBtn.setAttribute('aria-label', targetLabel);
      toggleBtn.setAttribute('title', targetLabel);
      toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');

      const sunIcon = toggleBtn.querySelector('.theme-toggle-sun');
      const moonIcon = toggleBtn.querySelector('.theme-toggle-moon');
      if (sunIcon && moonIcon) {
        sunIcon.style.display = isDark ? 'inline-flex' : 'none';
        moonIcon.style.display = isDark ? 'none' : 'inline-flex';
      }
    }

    for (let i = 0; i < subscribers.length; i++) {
      try { subscribers[i](theme); } catch (e) {}
    }
  }

  function init() {
    apply(detectInitialTheme(), false);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        apply(currentTheme === 'dark' ? 'light' : 'dark', true);
      });
    }

    if (mediaQuery) {
      const onSystemChange = (e) => {
        if (!StorageAdapter.local.get(STORAGE_KEY)) {
          apply(e.matches ? 'dark' : 'light', false);
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', onSystemChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(onSystemChange);
      }
    }
  }

  return {
    init,
    apply,
    get: () => currentTheme,
    isDark: () => currentTheme === 'dark',
    subscribe: (fn) => subscribers.push(fn)
  };
})();

// Inicialización de tema inmediata o en DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ThemeManager.init);
} else {
  ThemeManager.init();
}

// --- 4. MÓDULO DEL REPRODUCTOR DE AUDIO (AudioController) ---
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

// Mini-reproductor flotante (Sticky Bottom Player)
const stickyPlayer = document.querySelector('#sticky-player');
const stickyPlayBtn = document.querySelector('#sticky-play-btn');
const stickyIconPlay = stickyPlayBtn ? stickyPlayBtn.querySelector('.icon-play') : null;
const stickyIconPause = stickyPlayBtn ? stickyPlayBtn.querySelector('.icon-pause') : null;
const stickyMuteBtn = document.querySelector('#sticky-mute-btn');
const stickyIconVolOn = stickyMuteBtn ? stickyMuteBtn.querySelector('.icon-vol-on') : null;
const stickyIconVolMute = stickyMuteBtn ? stickyMuteBtn.querySelector('.icon-vol-mute') : null;
const stickyVolumeSlider = document.querySelector('#sticky-volume-slider');
const stickyTrackTitle = document.querySelector('#sticky-track-title');
const stickyStatusTag = document.querySelector('#sticky-status-tag');
const stickyStatusLabel = document.querySelector('#sticky-status-label');
const stickyWaBtn = document.querySelector('#sticky-wa-btn');
const stickyTopBtn = document.querySelector('#sticky-top-btn');
const playerCardEl = document.querySelector('#reproductor');

const VOL_STORAGE_KEY = 'rinconada_volume';
const MUTE_STORAGE_KEY = 'rinconada_muted';

function updateStickyStatus(type, label) {
  if (!stickyStatusTag) return;
  stickyStatusTag.className = `sticky-status-tag ${type ? 'is-' + type : ''}`;
  if (stickyStatusLabel) {
    stickyStatusLabel.textContent = label;
  }
}

function updateMuteIcons() {
  if (!audio) return;
  const isMuted = audio.muted || audio.volume === 0;

  // Iconos reproductor principal
  if (iconVolOn && iconVolMute) {
    iconVolOn.style.display = isMuted ? 'none' : 'block';
    iconVolMute.style.display = isMuted ? 'block' : 'none';
  }
  if (muteBtn) {
    muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar sonido');
    muteBtn.setAttribute('title', isMuted ? 'Activar sonido' : 'Silenciar sonido');
    muteBtn.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
  }

  // Iconos sticky player
  if (stickyIconVolOn && stickyIconVolMute) {
    stickyIconVolOn.style.display = isMuted ? 'none' : 'block';
    stickyIconVolMute.style.display = isMuted ? 'block' : 'none';
  }
  if (stickyMuteBtn) {
    stickyMuteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar sonido');
    stickyMuteBtn.setAttribute('title', isMuted ? 'Activar sonido' : 'Silenciar sonido');
    stickyMuteBtn.setAttribute('aria-pressed', String(isMuted));
  }

  for (const slider of [volumeSlider, stickyVolumeSlider]) {
    if (!slider) continue;
    slider.value = isMuted ? 0 : audio.volume;
    slider.setAttribute('aria-valuenow', slider.value);
    slider.setAttribute('aria-valuetext', isMuted ? 'Silenciado' : `${Math.round(audio.volume * 100)} por ciento`);
  }
}

function updatePlayPauseIcons(isPlaying) {
  if (iconPlay) iconPlay.style.display = isPlaying ? 'none' : 'block';
  if (iconPause) iconPause.style.display = isPlaying ? 'block' : 'none';
  if (playBtn) {
    playBtn.setAttribute('aria-label', isPlaying ? 'Pausar señal en vivo' : 'Reproducir señal en vivo');
    playBtn.setAttribute('title', isPlaying ? 'Pausar señal en vivo' : 'Reproducir señal en vivo');
  }
  if (stickyIconPlay) stickyIconPlay.style.display = isPlaying ? 'none' : 'block';
  if (stickyIconPause) stickyIconPause.style.display = isPlaying ? 'block' : 'none';
  if (stickyPlayBtn) {
    stickyPlayBtn.setAttribute('aria-label', isPlaying ? 'Pausar señal en vivo' : 'Reproducir señal en vivo');
    stickyPlayBtn.setAttribute('title', isPlaying ? 'Pausar señal en vivo' : 'Reproducir señal en vivo');
  }
  if (eqBars) {
    if (isPlaying) eqBars.classList.add('is-playing');
    else eqBars.classList.remove('is-playing');
  }
}

function setStickyVisible(isVisible) {
  if (!stickyPlayer) return;
  if (isVisible) {
    stickyPlayer.classList.add('is-visible');
    stickyPlayer.removeAttribute('aria-hidden');
    stickyPlayer.removeAttribute('inert');
    try { stickyPlayer.inert = false; } catch (e) {}
  } else {
    stickyPlayer.classList.remove('is-visible');
    stickyPlayer.setAttribute('aria-hidden', 'true');
    stickyPlayer.setAttribute('inert', '');
    try { stickyPlayer.inert = true; } catch (e) {}
  }
}

// Variables de estado del streaming
let wasPlayingBeforeOffline = false;
let retryTimeout = null;
let isAutoRetrying = false;
let retryAttempt = 0;
const MAX_AUTO_RETRIES = 3;

const rawStreamSrc = (audio && (audio.getAttribute('src') || audio.src)) || 'https://play14.tikast.com:22012/stream';
const baseStreamUrl = rawStreamSrc.split('?')[0];

function getFreshStreamUrl() {
  return `${baseStreamUrl}?t=${Date.now()}`;
}

function showFatalError() {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  isAutoRetrying = false;
  retryAttempt = 0;
  updatePlayPauseIcons(false);
  updateStickyStatus('error', 'Error al conectar');
  if (status) {
    status.textContent = 'Error al conectar';
    status.className = 'stream-status-tag is-error';
  }
}

function stopPlayback() {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  isAutoRetrying = false;
  retryAttempt = 0;
  wasPlayingBeforeOffline = false;
  if (audio) {
    audio.pause();
  }
}

function playLiveStream() {
  if (!audio) return Promise.reject(new Error('No audio element'));
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  const currentVol = audio.volume;
  const currentMuted = audio.muted;
  audio.src = getFreshStreamUrl();
  audio.load();
  audio.volume = currentVol;
  audio.muted = currentMuted;
  if (status) {
    status.textContent = 'Conectando con la señal…';
    status.className = 'stream-status-tag is-connecting';
  }
  return audio.play();
}

// Inicialización de volumen y listeners de audio
if (audio && playBtn) {
  if (volumeSlider) {
    const savedVol = StorageAdapter.local.get(VOL_STORAGE_KEY);
    const savedMute = StorageAdapter.local.get(MUTE_STORAGE_KEY);
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        audio.volume = parsed;
        volumeSlider.value = parsed;
      } else {
        audio.volume = parseFloat(volumeSlider.value);
      }
    } else {
      audio.volume = parseFloat(volumeSlider.value);
    }
    if (savedMute === 'true') {
      audio.muted = true;
    }
    updateMuteIcons();
  }

  // Estado inicial de conectividad
  if (!NetworkMonitor.isOnline() && status) {
    status.textContent = 'Sin conexión a internet';
    status.className = 'stream-status-tag is-error';
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      if (!NetworkMonitor.isOnline()) {
        if (status) {
          status.textContent = 'Sin conexión a internet';
          status.className = 'stream-status-tag is-error';
        }
        return;
      }
      isAutoRetrying = false;
      retryAttempt = 0;
      playLiveStream().catch((err) => {
        if (err && err.name === 'AbortError') return;
        showFatalError();
      });
    } else {
      if (typeof cancelSleepTimer === 'function') {
        cancelSleepTimer();
      }
      stopPlayback();
    }
  });

  if (stickyPlayBtn) {
    stickyPlayBtn.addEventListener('click', () => {
      playBtn.click();
    });
  }

  // Sincronización de volumen y guardado en almacenamiento local
  audio.addEventListener('volumechange', updateMuteIcons);
  for (const slider of [volumeSlider, stickyVolumeSlider]) {
    if (!slider) continue;
    slider.addEventListener('input', () => {
      audio.volume = Number(slider.value);
      audio.muted = (audio.volume === 0);
      StorageAdapter.local.set(VOL_STORAGE_KEY, audio.volume);
      StorageAdapter.local.set(MUTE_STORAGE_KEY, audio.muted ? 'true' : 'false');
      updateMuteIcons();
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      if (!audio.muted && audio.volume === 0) {
        audio.volume = 0.5;
        if (volumeSlider) volumeSlider.value = 0.5;
        if (stickyVolumeSlider) stickyVolumeSlider.value = 0.5;
      }
      StorageAdapter.local.set(MUTE_STORAGE_KEY, audio.muted ? 'true' : 'false');
      StorageAdapter.local.set(VOL_STORAGE_KEY, audio.volume);
      updateMuteIcons();
    });
  }

  if (stickyMuteBtn) {
    stickyMuteBtn.addEventListener('click', () => {
      if (muteBtn) muteBtn.click();
    });
  }

  // Desplazamiento suave al reproductor principal desde el sticky player
  if (stickyTopBtn && playerCardEl) {
    stickyTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const cardRect = playerCardEl.getBoundingClientRect();
      const targetY = Math.max(0, window.pageYOffset + cardRect.top - 80);
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      if (playBtn) {
        setTimeout(() => playBtn.focus(), 350);
      }
    });
  }

  // Visibilidad del Sticky Player con limitación por requestAnimationFrame (cero layout thrashing)
  if (stickyPlayer && playerCardEl) {
    let isScrollTicking = false;

    const updateStickyVisibility = () => {
      if (typeof playerCardEl.getBoundingClientRect !== 'function') return;
      const rect = playerCardEl.getBoundingClientRect();
      const isPastControls = (rect.top < -100);
      const isPastCard = (rect.bottom < 200);
      const isScrolledDown = window.scrollY > 240;

      if ((isPastControls || isPastCard) && isScrolledDown) {
        setStickyVisible(true);
      } else if (rect.top >= -60 || window.scrollY < 180) {
        setStickyVisible(false);
      }
    };

    const onScrollOrResizeThrottled = () => {
      if (!isScrollTicking) {
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => {
            updateStickyVisibility();
            isScrollTicking = false;
          });
        } else {
          updateStickyVisibility();
          isScrollTicking = false;
        }
        isScrollTicking = true;
      }
    };

    if ('IntersectionObserver' in window) {
      const stickyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect;
          if (!entry.isIntersecting && rect.top < 0 && window.scrollY > 240) {
            setStickyVisible(true);
          } else if (entry.isIntersecting && rect.top > -60) {
            setStickyVisible(false);
          }
        });
      }, { threshold: 0.1 });
      stickyObserver.observe(playerCardEl);
    }

    window.addEventListener('scroll', onScrollOrResizeThrottled, { passive: true });
    window.addEventListener('resize', onScrollOrResizeThrottled, { passive: true });
    updateStickyVisibility();
  }

  // Eventos nativos del elemento de audio
  audio.addEventListener('play', () => {
    updatePlayPauseIcons(true);
    updateStickyStatus('connecting', 'Conectando…');
  });

  audio.addEventListener('playing', () => {
    isAutoRetrying = false;
    retryAttempt = 0;
    updatePlayPauseIcons(true);
    updateStickyStatus('playing', 'En directo');
    if (status) {
      status.textContent = 'Conectado · Señal en directo';
      status.className = 'stream-status-tag is-playing';
    }
    if (typeof fetchLiveTrack === 'function') {
      fetchLiveTrack();
    }
    if (typeof updatePollingSchedule === 'function') {
      updatePollingSchedule();
    }
  });

  audio.addEventListener('waiting', () => {
    updateStickyStatus('connecting', 'Conectando…');
    if (status) {
      status.textContent = 'Conectando con la señal…';
      status.className = 'stream-status-tag is-connecting';
    }
  });

  audio.addEventListener('stalled', () => {
    if (audio && !audio.paused && NetworkMonitor.isOnline()) {
      updateStickyStatus('connecting', 'Buffering…');
      if (status) {
        status.textContent = 'Almacenando búfer de señal…';
        status.className = 'stream-status-tag is-connecting';
      }
    }
  });

  audio.addEventListener('pause', () => {
    if (isAutoRetrying) return;
    updatePlayPauseIcons(false);
    updateStickyStatus('paused', 'En pausa');
    if (status) {
      if (!NetworkMonitor.isOnline() || wasPlayingBeforeOffline) {
        status.textContent = 'Sin conexión a internet';
        status.className = 'stream-status-tag is-error';
        updateStickyStatus('error', 'Sin internet');
      } else {
        status.textContent = 'Señal en pausa';
        status.className = 'stream-status-tag';
      }
    }
    if (typeof updatePollingSchedule === 'function') {
      updatePollingSchedule();
    }
  });

  // Reintento con backoff exponencial para redes celulares intermitentes (2G/3G rural)
  audio.addEventListener('error', () => {
    if (!NetworkMonitor.isOnline()) {
      if (status) {
        status.textContent = 'Sin conexión a internet';
        status.className = 'stream-status-tag is-error';
      }
      return;
    }

    if (retryAttempt >= MAX_AUTO_RETRIES) {
      showFatalError();
    } else {
      retryAttempt++;
      isAutoRetrying = true;
      const backoffDelay = retryAttempt === 1 ? 2500 : (retryAttempt === 2 ? 5000 : 10000);

      if (status) {
        status.textContent = `Reconectando señal (${retryAttempt}/${MAX_AUTO_RETRIES})…`;
        status.className = 'stream-status-tag is-connecting';
      }
      updateStickyStatus('connecting', 'Reconectando…');

      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => {
        retryTimeout = null;
        playLiveStream().catch((err) => {
          if (err && err.name === 'AbortError') return;
          if (retryAttempt >= MAX_AUTO_RETRIES) {
            showFatalError();
          }
        });
      }, backoffDelay);
    }
  });

  // Eventos de conectividad del navegador
  window.addEventListener('offline', () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
      isAutoRetrying = false;
      retryAttempt = 0;
    }
    const isAudioPlaying = audio && !audio.paused;
    if (isAudioPlaying) {
      wasPlayingBeforeOffline = true;
      audio.pause();
    }
    if (status) {
      status.textContent = 'Sin conexión a internet';
      status.className = 'stream-status-tag is-error';
    }
    updateStickyStatus('error', 'Sin internet');
  });

  window.addEventListener('online', () => {
    if (wasPlayingBeforeOffline) {
      wasPlayingBeforeOffline = false;
      if (status) {
        status.textContent = 'Conectando con la señal…';
        status.className = 'stream-status-tag is-connecting';
      }
      isAutoRetrying = false;
      retryAttempt = 0;
      playLiveStream().catch((err) => {
        if (err && err.name === 'AbortError') return;
        showFatalError();
      });
    } else if (status && audio && audio.paused) {
      status.textContent = 'Señal en pausa';
      status.className = 'stream-status-tag';
    }
  });

  // MediaSession API para controles del sistema
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
      if (!NetworkMonitor.isOnline()) {
        if (status) {
          status.textContent = 'Sin conexión a internet';
          status.className = 'stream-status-tag is-error';
        }
        return;
      }
      isAutoRetrying = false;
      retryAttempt = 0;
      playLiveStream().catch((err) => {
        if (err && err.name === 'AbortError') return;
        showFatalError();
      });
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (typeof cancelSleepTimer === 'function') {
        cancelSleepTimer();
      }
      stopPlayback();
    });
  }

  // Atajos globales de teclado (Espacio, K, M) respetando accesibilidad
  window.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;

    const active = document.activeElement;
    if (active) {
      const tagName = active.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || active.isContentEditable) {
        return;
      }
    }

    const isSpace = (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space');
    const isKeyK = (e.key === 'k' || e.key === 'K');
    const isKeyM = (e.key === 'm' || e.key === 'M');

    if (isSpace) {
      const isInteractive = active && (
        active.tagName === 'BUTTON' ||
        active.tagName === 'A' ||
        active.tagName === 'SUMMARY' ||
        active.tagName === 'CANVAS' ||
        active.tagName === 'IFRAME' ||
        active.id === 'fish-canvas' ||
        (typeof active.getAttribute === 'function' && (
          active.getAttribute('role') === 'button' ||
          active.getAttribute('role') === 'application'
        ))
      );

      if (isInteractive) return;

      e.preventDefault();
      if (playBtn) playBtn.click();
      return;
    }

    if (isKeyK) {
      e.preventDefault();
      if (playBtn) playBtn.click();
      return;
    }

    if (isKeyM) {
      e.preventDefault();
      if (muteBtn) muteBtn.click();
      return;
    }
  });
}

// --- 5. MÓDULO TEMPORIZADOR DE APAGADO (SleepTimer) ---
const sleepTimerBtn = document.querySelector('#sleep-timer-btn');
const sleepTimerMenu = document.querySelector('#sleep-timer-menu');
const sleepTimerText = document.querySelector('#sleep-timer-text');
const sleepCancelBtn = document.querySelector('#sleep-cancel-btn');
const sleepMenuItems = document.querySelectorAll('.sleep-menu-item[data-minutes]');

let sleepTimerId = null;
let sleepEndTime = null;
let originalVolumeBeforeFade = null;
let isMidFade = false;

function resetSleepTimerUI() {
  if (sleepTimerText) sleepTimerText.textContent = 'Dormir';
  if (sleepTimerBtn) {
    sleepTimerBtn.classList.remove('is-active');
    sleepTimerBtn.setAttribute('title', 'Temporizador de apagado');
    sleepTimerBtn.setAttribute('aria-label', 'Dormir — Temporizador de apagado');
  }
  if (sleepCancelBtn) sleepCancelBtn.disabled = true;
  sleepMenuItems.forEach(item => item.classList.remove('is-selected'));
}

function cancelSleepTimer() {
  if (sleepTimerId) {
    clearInterval(sleepTimerId);
    sleepTimerId = null;
  }
  sleepEndTime = null;
  if (isMidFade && originalVolumeBeforeFade !== null && audio) {
    audio.volume = originalVolumeBeforeFade;
    if (volumeSlider) volumeSlider.value = originalVolumeBeforeFade;
    updateMuteIcons();
  }
  isMidFade = false;
  originalVolumeBeforeFade = null;
  resetSleepTimerUI();
}

function startSleepTimer(minutes) {
  cancelSleepTimer();
  if (!audio) return;
  const durationMs = minutes * 60 * 1000;
  sleepEndTime = Date.now() + durationMs;
  originalVolumeBeforeFade = audio.volume;
  isMidFade = false;

  if (sleepTimerBtn) sleepTimerBtn.classList.add('is-active');
  if (sleepCancelBtn) sleepCancelBtn.disabled = false;

  sleepMenuItems.forEach(item => {
    if (parseInt(item.dataset.minutes, 10) === minutes) {
      item.classList.add('is-selected');
    } else {
      item.classList.remove('is-selected');
    }
  });

  const updateCountdown = () => {
    const remainingMs = sleepEndTime - Date.now();
    const remainingSec = Math.round(remainingMs / 1000);

    if (remainingSec <= 0) {
      clearInterval(sleepTimerId);
      sleepTimerId = null;
      isMidFade = false;
      stopPlayback();
      if (originalVolumeBeforeFade !== null) {
        audio.volume = originalVolumeBeforeFade;
        if (volumeSlider) volumeSlider.value = originalVolumeBeforeFade;
        updateMuteIcons();
      }
      resetSleepTimerUI();
      if (status) {
        status.textContent = 'Temporizador finalizado · En pausa';
        status.className = 'stream-status-tag';
      }
      return;
    }

    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    const label = mins > 0 ? `${mins}m` : `${secs}s`;
    if (sleepTimerText) sleepTimerText.textContent = label;
    if (sleepTimerBtn) {
      sleepTimerBtn.setAttribute('title', `Apagado programado en ${label}`);
      sleepTimerBtn.setAttribute('aria-label', `Dormir — ${label} restantes para apagar la transmisión`);
    }

    // Desvanecimiento suave en los últimos 30 segundos
    if (remainingSec <= 30) {
      isMidFade = true;
      const factor = Math.max(0, remainingSec / 30);
      const faded = originalVolumeBeforeFade * factor;
      audio.volume = faded;
      if (volumeSlider) volumeSlider.value = faded;
      updateMuteIcons();
    }
  };

  updateCountdown();
  sleepTimerId = setInterval(updateCountdown, 1000);
}

if (sleepTimerBtn && sleepTimerMenu) {
  sleepTimerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = sleepTimerMenu.hasAttribute('hidden');
    if (isHidden) {
      sleepTimerMenu.removeAttribute('hidden');
      sleepTimerBtn.setAttribute('aria-expanded', 'true');
    } else {
      sleepTimerMenu.setAttribute('hidden', '');
      sleepTimerBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('click', (e) => {
    if (!sleepTimerMenu.contains(e.target) && e.target !== sleepTimerBtn) {
      sleepTimerMenu.setAttribute('hidden', '');
      sleepTimerBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sleepTimerMenu.hasAttribute('hidden')) {
      sleepTimerMenu.setAttribute('hidden', '');
      sleepTimerBtn.setAttribute('aria-expanded', 'false');
      sleepTimerBtn.focus();
    }
  });

  sleepMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const mins = parseInt(item.dataset.minutes, 10);
      if (mins > 0) startSleepTimer(mins);
      else cancelSleepTimer();
      sleepTimerMenu.setAttribute('hidden', '');
      sleepTimerBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// --- 6. MÓDULO HISTORIAL DE TEMAS RECIENTES (TrackHistory) ---
const trackShareWa = document.querySelector('#track-share-wa');
const recentTracksToggle = document.querySelector('#recent-tracks-toggle');
const recentTracksPanel = document.querySelector('#recent-tracks-panel');
const recentTracksList = document.querySelector('#recent-tracks-list');
const recentBadge = document.querySelector('#recent-badge');

let recentTracks = [];
try {
  const stored = StorageAdapter.session.get('rinconada_recent_tracks');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      recentTracks = parsed.filter(item => item && typeof item.title === 'string' && typeof item.time === 'string').slice(0, 5);
    }
  }
} catch (e) {}

/**
 * Renderiza la lista visual de pistas reproducidas recientemente.
 * @returns {void}
 */
function renderRecentTracks() {
  if (!recentTracksList) return;
  if (!recentTracks || recentTracks.length === 0) {
    recentTracksList.innerHTML = '<li class="recent-track-empty">Aún no hay canciones anteriores registradas.</li>';
    if (recentBadge) recentBadge.textContent = '0';
    return;
  }
  if (recentBadge) recentBadge.textContent = recentTracks.length;
  recentTracksList.replaceChildren(...recentTracks.map(item => {
    const row = document.createElement('li');
    row.className = 'recent-track-item';
    const name = document.createElement('span');
    name.className = 'recent-track-name';
    name.title = item.title;
    name.textContent = item.title;
    const time = document.createElement('span');
    time.className = 'recent-track-time';
    time.textContent = item.time;
    row.append(name, time);
    return row;
  }));
}

/**
 * Agrega una pista al historial de sesión (máximo 5 registros).
 * @param {string} title - Título de la pista recibida
 * @returns {void}
 */
function addRecentTrack(title) {
  if (!title || typeof title !== 'string') return;
  const lower = title.toLowerCase();
  if (lower.includes('sintonizando') || lower.includes('rinconada stereo') || lower.includes('transmisión')) return;
  if (recentTracks.length > 0 && recentTracks[0].title.toLowerCase() === lower) return;

  const now = new Date();
  const timeFormatted = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  recentTracks.unshift({ title, time: timeFormatted });
  if (recentTracks.length > 5) recentTracks.pop();

  StorageAdapter.session.set('rinconada_recent_tracks', JSON.stringify(recentTracks));
  renderRecentTracks();
}

if (recentTracksToggle && recentTracksPanel) {
  recentTracksToggle.addEventListener('click', () => {
    const isHidden = recentTracksPanel.hasAttribute('hidden');
    if (isHidden) {
      recentTracksPanel.removeAttribute('hidden');
      recentTracksToggle.setAttribute('aria-expanded', 'true');
    } else {
      recentTracksPanel.setAttribute('hidden', '');
      recentTracksToggle.setAttribute('aria-expanded', 'false');
    }
  });
}
renderRecentTracks();

// --- 7. MÓDULO DE METADATOS EN VIVO (MetadataService) ---
const trackTitleEl = document.querySelector('#track-title');
const trackBoxEl = document.querySelector('#now-playing-box');
let currentTrackTitle = '';
let metaPollInterval = null;
let pendingMetaScript = null;
let metaTimeoutId = null;

/**
 * Actualiza el título y metadatos en vivo en UI, MediaSession y enlaces de dedicatoria.
 * @param {string} rawTitle - Título crudo emitido por el streaming
 * @returns {void}
 */
function updateNowPlaying(rawTitle) {
  if (typeof rawTitle !== 'string') return;
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
    if (stickyTrackTitle) {
      stickyTrackTitle.textContent = cleaned;
      stickyTrackTitle.setAttribute('title', cleaned);
    }
    if (trackBoxEl) {
      trackBoxEl.classList.add('is-live');
    }

    const waDedicationMsg = encodeURIComponent(`¡Hola Rinconada Stereo! Estoy escuchando "${cleaned}" desde la web y quiero pedir una dedicatoria / saludo en cabina 📻🎶`);
    const waUrl = `https://wa.me/573052430933?text=${waDedicationMsg}`;
    if (trackShareWa) trackShareWa.href = waUrl;
    if (stickyWaBtn) stickyWaBtn.href = waUrl;

    addRecentTrack(cleaned);

    if ('mediaSession' in navigator) {
      try {
        const logoUrl = new URL('assets/logo-rinconada.png', window.location.href).href;
        const validScheme = /^(https?:|blob:|data:)/i.test(logoUrl);
        navigator.mediaSession.metadata = new MediaMetadata({
          title: cleaned,
          artist: 'Rinconada Stereo',
          album: 'Señal en directo · La Pacha',
          artwork: validScheme ? [{ src: logoUrl, sizes: '512x512', type: 'image/png' }] : []
        });
      } catch (e) {}
    }
  }
}

// Handler estático para JSONP sin polución global ni desoptimizaciones V8
window.__rsMetadataHandler = function(data) {
  if (metaTimeoutId) {
    clearTimeout(metaTimeoutId);
    metaTimeoutId = null;
  }
  if (pendingMetaScript && pendingMetaScript.parentNode) {
    pendingMetaScript.parentNode.removeChild(pendingMetaScript);
    pendingMetaScript = null;
  }
  if (data && data.songtitle) {
    updateNowPlaying(data.songtitle);
  }
};

function fetchLiveTrack() {
  if (!NetworkMonitor.isOnline()) return;

  if (pendingMetaScript && pendingMetaScript.parentNode) {
    pendingMetaScript.parentNode.removeChild(pendingMetaScript);
    pendingMetaScript = null;
  }
  if (metaTimeoutId) {
    clearTimeout(metaTimeoutId);
    metaTimeoutId = null;
  }

  const script = document.createElement('script');
  pendingMetaScript = script;

  metaTimeoutId = setTimeout(() => {
    if (pendingMetaScript && pendingMetaScript.parentNode) {
      pendingMetaScript.parentNode.removeChild(pendingMetaScript);
      pendingMetaScript = null;
    }
    metaTimeoutId = null;
  }, 6000);

  script.onerror = function() {
    if (metaTimeoutId) {
      clearTimeout(metaTimeoutId);
      metaTimeoutId = null;
    }
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    pendingMetaScript = null;
  };

  script.src = `https://play14.tikast.com:22012/stats?sid=1&json=1&callback=__rsMetadataHandler&_t=${Date.now()}`;
  document.head.appendChild(script);
}

function updatePollingSchedule() {
  if (metaPollInterval) {
    clearInterval(metaPollInterval);
    metaPollInterval = null;
  }

  if (!NetworkMonitor.isOnline()) return;

  const isPlaying = audio && !audio.paused;
  const isHidden = document.hidden;
  const isSaveData = NetworkMonitor.isSaveDataEnabled();

  let intervalMs;
  if (isPlaying) {
    if (isHidden) {
      intervalMs = 30000;
    } else {
      intervalMs = isSaveData ? 16000 : 8000;
    }
  } else {
    if (isHidden) {
      intervalMs = 90000;
    } else {
      intervalMs = isSaveData ? 60000 : 30000;
    }
  }

  metaPollInterval = setInterval(fetchLiveTrack, intervalMs);
}

fetchLiveTrack();
updatePollingSchedule();

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && NetworkMonitor.isOnline()) {
    fetchLiveTrack();
  }
  updatePollingSchedule();
});

// Reproductor alternativo en iframe bajo demanda
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

// --- 8. MÓDULO CARGA DIFERIDA DE CHAT (ChatLoader) ---
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

  const chatCard = document.querySelector('#chat');
  if (chatCard) {
    ['pointerenter', 'touchstart', 'focusin', 'click'].forEach(evt => {
      chatCard.addEventListener(evt, loadChat, { once: true, passive: true });
    });
  }

  // En conexiones lentas o Save-Data, solo cargar el chat si el usuario interactúa explícitamente
  if (!NetworkMonitor.isSaveDataEnabled()) {
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
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => setTimeout(loadChat, 1500), { timeout: 4000 });
      } else {
        window.addEventListener('load', () => setTimeout(loadChat, 2000), { once: true });
      }
    }
  }
}

// --- 9. MÓDULO DE PRONÓSTICO REGIONAL CON CACHÉ (WeatherService) ---
const weatherCard = document.querySelector('#weather-card');
const WEATHER_CACHE_KEY = 'rinconada_weather_cache';
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 minutos de validez en caché de sesión

/**
 * Traduce el código meteorológico WMO de Open-Meteo a texto e icono SVG.
 * @param {number} code - Código WMO numérico
 * @returns {WeatherCondition}
 */
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

/**
 * Renderiza el bloque HTML del pronóstico meteorológico regional.
 * @param {number|string} temp - Temperatura en grados Celsius
 * @param {string} desc - Descripción de la condición
 * @param {string} icon - Cadena SVG del icono
 * @param {number|string} humidity - Porcentaje de humedad
 * @param {number|string} wind - Velocidad del viento
 * @returns {void}
 */
function renderWeatherHTML(temp, desc, icon, humidity, wind) {
  if (!weatherCard) return;
  weatherCard.innerHTML = `
    <div class="weather-main">
      <div class="weather-temp-group">
        <div class="weather-temp">${temp}°C</div>
        <div class="weather-location-highlight">La Pacha, <span>Magdalena</span></div>
        <div class="weather-desc">${desc}</div>
      </div>
      <div class="weather-icon-box" aria-hidden="true">${icon}</div>
    </div>
    <div class="weather-sub">
      <span>💧 Humedad: <strong>${humidity}%</strong></span>
      <span>💨 Viento: <strong>${wind} km/h</strong></span>
    </div>
  `;
}

async function loadOpenMeteoWeather() {
  if (!weatherCard) return;

  // 1. Verificación previa en caché de sesión (0 ms de espera y 0 datos transferidos)
  try {
    const cachedRaw = StorageAdapter.session.get(WEATHER_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (cached && typeof cached.timestamp === 'number' && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
        renderWeatherHTML(cached.temp, cached.desc, cached.icon, cached.humidity, cached.wind);
        return;
      }
    }
  } catch (e) {}

  const lat = 9.2579;
  const lon = -74.2599;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FBogota`;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

  try {
    const res = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (!res.ok) throw new Error('Respuesta no exitosa');
    const data = await res.json();
    const current = data && data.current;
    if (
      !current ||
      typeof current.temperature_2m !== 'number' || !Number.isFinite(current.temperature_2m) ||
      typeof current.relative_humidity_2m !== 'number' || !Number.isFinite(current.relative_humidity_2m) ||
      typeof current.weather_code !== 'number' || !Number.isFinite(current.weather_code) ||
      typeof current.wind_speed_10m !== 'number' || !Number.isFinite(current.wind_speed_10m)
    ) {
      throw new Error('Datos incompletos');
    }

    const info = getWeatherInterpretation(current.weather_code);
    const temp = Math.round(current.temperature_2m);
    const humidity = Math.round(current.relative_humidity_2m);
    const wind = Math.round(current.wind_speed_10m);

    // Guardar en caché para visitas posteriores
    try {
      StorageAdapter.session.set(WEATHER_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        temp,
        humidity,
        wind,
        desc: info.desc,
        icon: info.icon
      }));
    } catch (e) {}

    renderWeatherHTML(temp, info.desc, info.icon, humidity, wind);
  } catch (err) {
    // Si la red falla pero hay un pronóstico previo en caché, preservarlo
    try {
      const cachedRaw = StorageAdapter.session.get(WEATHER_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && typeof cached.temp === 'number') {
          renderWeatherHTML(cached.temp, cached.desc, cached.icon, cached.humidity, cached.wind);
          return;
        }
      }
    } catch (e) {}

    weatherCard.innerHTML = `
      <div class="weather-error">
        <p>Pronóstico no disponible temporalmente.</p>
      </div>
    `;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
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

// --- 10. MÓDULO CIÉNAGA INTERACTIVA (FishPond) ---
// Simulación Canvas 2D optimizada para GPU móvil (DPR limitado a 2, sin lecturas de DOM en bucle)
(function initFishPond() {
  const canvas = document.querySelector('#fish-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  const isDataSaver = NetworkMonitor.isSaveDataEnabled();
  // Limitar DPR a 2 para evitar saturación de memoria y calor en pantallas móviles 3x/4x
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let width = 0;
  let height = 0;
  let animationId = null;
  let isRunning = false;
  let burstTimer = null;
  let isDarkTheme = ThemeManager.isDark();

  ThemeManager.subscribe((theme) => {
    isDarkTheme = (theme === 'dark');
    if ((reducedMotion || isDataSaver) && isPondInView) render();
  });

  const fishCount = 14;

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

  function update(dt = 1) {
    const pad = 35;

    for (let i = foodCrumbs.length - 1; i >= 0; i--) {
      const c = foodCrumbs[i];
      c.y += c.vy * dt;
      c.life -= 0.003 * dt;
      if (c.life <= 0 || c.y > height - 10) {
        foodCrumbs.splice(i, 1);
      }
    }

    for (const f of fishList) {
      f.wagPhase += f.wagSpeed * dt;

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
          f.vx += (dx / dist) * 0.35 * dt;
          f.vy += (dy / dist) * 0.35 * dt;
          f.wagSpeed = 0.22;
        } else {
          foodCrumbs.splice(targetCrumb.index, 1);
          ripples.push({ x: f.x, y: f.y, radius: 2, alpha: 0.4 });
          f.vx *= 0.5;
          f.vy *= 0.5;
        }
      } else if (pointer.active) {
        const dx = pointer.x - f.x;
        const dy = pointer.y - f.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 28 && dist < 240) {
          const pull = 0.22;
          f.vx += (dx / dist) * pull * dt;
          f.vy += (dy / dist) * pull * dt;
          f.wagSpeed = 0.17;
        } else if (dist <= 28) {
          f.vx += (-dy / (dist || 1)) * 0.4 * dt;
          f.vy += (dx / (dist || 1)) * 0.4 * dt;
          f.wagSpeed = 0.14;
        }
      } else {
        f.wagSpeed = 0.11;
      }

      const curSpeed = Math.hypot(f.vx, f.vy);
      const maxSpeed = (foodCrumbs.length > 0 || pointer.active) ? f.speed * 2.3 : f.speed * 1.5;
      if (curSpeed > maxSpeed) {
        const damp = Math.pow(0.94, dt);
        f.vx *= damp;
        f.vy *= damp;
      } else if (curSpeed < 0.5) {
        f.vx += (Math.random() - 0.5) * 0.2 * dt;
        f.vy += (Math.random() - 0.5) * 0.1 * dt;
      }

      f.x += f.vx * dt;
      f.y += f.vy * dt;

      if (f.x < pad) f.vx += 0.1 * dt;
      else if (f.x > width - pad) f.vx -= 0.1 * dt;
      if (f.y < 18) f.vy += 0.08 * dt;
      else if (f.y > height - 18) f.vy -= 0.08 * dt;

      const moveAngle = Math.atan2(f.vy, f.vx);
      let diff = moveAngle - f.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      f.angle += diff * (1 - Math.pow(1 - 0.09, dt));
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += 1.4 * dt;
      r.alpha -= 0.02 * dt;
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
      ctx.moveTo(-s * 0.45, 0);
      ctx.lineTo(-s * 0.95, -s * 0.32 + wag);
      ctx.lineTo(-s * 0.65, wag * 0.5);
      ctx.lineTo(-s * 0.95, s * 0.32 + wag);
      ctx.closePath();
    } else if (f.tailType === 'fan') {
      ctx.moveTo(-s * 0.45, 0);
      ctx.quadraticCurveTo(-s * 0.88, -s * 0.38 + wag, -s * 0.82, wag);
      ctx.quadraticCurveTo(-s * 0.88, s * 0.38 + wag, -s * 0.45, 0);
    } else if (f.tailType === 'rounded') {
      ctx.moveTo(-s * 0.45, -s * 0.12);
      ctx.lineTo(-s * 0.85, -s * 0.3 + wag);
      ctx.quadraticCurveTo(-s * 0.92, wag, -s * 0.85, s * 0.3 + wag);
      ctx.lineTo(-s * 0.45, s * 0.12);
      ctx.closePath();
    } else {
      ctx.moveTo(-s * 0.45, 0);
      ctx.lineTo(-s * 0.82, -s * 0.22 + wag);
      ctx.lineTo(-s * 0.68, wag * 0.4);
      ctx.lineTo(-s * 0.82, s * 0.22 + wag);
      ctx.closePath();
    }
    ctx.fill();

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

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.38, -s * (aspect * 0.35), s * 0.065, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f1f33';
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * (aspect * 0.35), s * 0.038, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(s * 0.1, -s * (aspect * 0.15), s * 0.22, -0.4, 0.8);
    ctx.stroke();

    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Ondas en agua con color basado en la variable de tema en memoria (sin consultar el DOM a 60fps)
    const rippleRgb = isDarkTheme ? '77, 147, 247' : '54, 118, 206';
    for (const r of ripples) {
      ctx.strokeStyle = `rgba(${rippleRgb}, ${r.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const c of foodCrumbs) {
      ctx.fillStyle = `rgba(226, 165, 50, ${c.life})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(160, 95, 15, ${c.life * 0.7})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    for (const f of fishList) {
      drawFish(f);
    }
  }

  let lastFrameTime = 0;
  let isPondInView = false;

  function loop(now = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
    if (!isRunning) return;
    const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 16.667, 2.5) : 1;
    lastFrameTime = now;
    update(dt);
    render();
    animationId = requestAnimationFrame(loop);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    lastFrameTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    animationId = requestAnimationFrame(loop);
  }

  function stop() {
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    lastFrameTime = 0;
  }

  function triggerBurst(durationMs = 2600) {
    if (reducedMotion) {
      render();
      return;
    }
    if (isDataSaver) {
      start();
      if (burstTimer) clearTimeout(burstTimer);
      burstTimer = setTimeout(() => {
        burstTimer = null;
        if (isDataSaver && !reducedMotion) {
          stop();
        }
      }, durationMs);
    }
  }

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
    dropFood(px, py);
    if (reducedMotion) render();
    else if (isDataSaver) triggerBurst();
  });

  canvas.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

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
      else if (isDataSaver) triggerBurst();
    }
  });

  window.addEventListener('resize', () => {
    if (!initialized) return;
    resize();
    if (reducedMotion || isDataSaver) render();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
      if (burstTimer) clearTimeout(burstTimer);
    } else if (isPondInView && !reducedMotion && !isDataSaver) {
      start();
    }
  });

  let initialized = false;
  function ensurePondReady() {
    if (initialized) return;
    initialized = true;
    resize();
    initFish();
    if (reducedMotion || isDataSaver) render();
  }

  if ('IntersectionObserver' in window) {
    const pondObserver = new IntersectionObserver((entries) => {
      isPondInView = entries.some(e => e.isIntersecting);
      if (isPondInView) {
        ensurePondReady();
        if (!reducedMotion && !isDataSaver && !document.hidden) start();
      } else {
        stop();
        if (burstTimer) clearTimeout(burstTimer);
      }
    }, { rootMargin: '150px', threshold: 0.02 });
    pondObserver.observe(canvas);
  } else {
    isPondInView = true;
    ensurePondReady();
    if (!reducedMotion && !isDataSaver && !document.hidden) start();
  }
})();

// --- 11. REGISTRO DE SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
