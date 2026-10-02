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
 * @property {function(string, (string|null)=, function(string): boolean=): (string|null)} get - Obtiene un valor de forma segura
 * @property {function(string, any): boolean} set - Almacena un valor serializado
 * @property {function(string): boolean} remove - Elimina una clave de forma segura
 * @property {function(string, any=, function(any): boolean=): any} getJson - Obtiene y deserializa JSON con validación de predicado opcional
 * @property {function(string, any): boolean} setJson - Serializa a JSON y almacena de forma segura
 * @property {function(string, (number|null)=, function(number): boolean=): (number|null)} getNumber - Obtiene un número tipado y validado
 * @property {function(string, number): boolean} setNumber - Almacena un número de forma segura
 * @property {function(string, boolean=): boolean} getBoolean - Obtiene un valor booleano tipado
 * @property {function(string, boolean): boolean} setBoolean - Almacena un booleano de forma segura
 * @property {function(string): boolean} has - Comprueba si una clave existe
 * @property {function(): boolean} clear - Limpia el almacén de forma segura
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

// --- 1. MÓDULO DE ALMACENAMIENTO SEGURO Y PROFUNDO (StorageAdapter) ---
/**
 * Fábrica de pasarelas de almacenamiento con absorción de serialización JSON,
 * validación mediante predicados, soporte de primitivos tipados y almacén
 * en memoria resiliente frente a restricciones de cuota o seguridad (SecurityError).
 *
 * @param {'localStorage' | 'sessionStorage'} storageType
 * @returns {StorageGateway}
 */
function createStorageGateway(storageType) {
  /** @type {Map<string, string>} */
  const memoryStore = new Map();

  function getRawStorage() {
    try {
      if (typeof window !== 'undefined' && window && window[storageType]) {
        return window[storageType];
      }
    } catch (e) {}
    try {
      if (typeof globalThis !== 'undefined' && globalThis && globalThis[storageType]) {
        return globalThis[storageType];
      }
    } catch (e) {}
    return null;
  }

  const gateway = {
    /**
     * Obtiene una cadena de texto almacenada con valor de respaldo y validación opcional.
     * @param {string} key
     * @param {string|null} [fallback=null]
     * @param {function(string): boolean} [validator=null]
     * @returns {string|null}
     */
    get(key, fallback = null, validator = null) {
      if (typeof key !== 'string' || !key) return fallback;
      let val = null;
      let found = false;

      try {
        const storage = getRawStorage();
        if (storage) {
          val = storage.getItem(key);
          if (val !== null && val !== undefined) {
            found = true;
          }
        }
      } catch (e) {
        // Excepción de acceso WebStorage (SecurityError, cookies bloqueadas)
      }

      if (!found && memoryStore.has(key)) {
        val = memoryStore.get(key);
        found = true;
      }

      if (!found || val === null || val === undefined) return fallback;

      if (typeof validator === 'function') {
        try {
          if (!validator(val)) return fallback;
        } catch (e) {
          return fallback;
        }
      }

      return val;
    },

    /**
     * Almacena un valor serializado. Ante QuotaExceededError o SecurityError,
     * almacena en memoria para asegurar la continuidad de la sesión.
     * @param {string} key
     * @param {any} val
     * @returns {boolean}
     */
    set(key, val) {
      if (typeof key !== 'string' || !key || val === undefined) return false;
      let strVal;
      if (typeof val === 'object' && val !== null) {
        try {
          strVal = JSON.stringify(val);
        } catch (e) {
          return false;
        }
      } else {
        strVal = String(val);
      }

      try {
        const storage = getRawStorage();
        if (storage) {
          storage.setItem(key, strVal);
        }
      } catch (e) {
        // WebStorage lanzó QuotaExceededError o SecurityError
      }

      memoryStore.set(key, strVal);
      return true;
    },

    /**
     * Elimina una clave de WebStorage y del almacén en memoria.
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {
      if (typeof key !== 'string' || !key) return false;
      memoryStore.delete(key);
      try {
        const storage = getRawStorage();
        if (storage) {
          storage.removeItem(key);
        }
      } catch (e) {}
      return true;
    },

    /**
     * Obtiene y parsea un valor JSON con validación de predicado opcional.
     * Si el JSON es inválido o no supera el validador, devuelve el fallback sin lanzar error.
     * @template T
     * @param {string} key
     * @param {T} [fallback=null]
     * @param {function(any): boolean} [validator=null]
     * @returns {T|any}
     */
    getJson(key, fallback = null, validator = null) {
      if (typeof key !== 'string' || !key) return fallback;
      const raw = gateway.get(key);
      if (raw === null || raw === undefined || raw === '') return fallback;
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || parsed === undefined) return fallback;
        if (typeof validator === 'function') {
          try {
            if (!validator(parsed)) return fallback;
          } catch (err) {
            return fallback;
          }
        }
        return parsed;
      } catch (e) {
        return fallback;
      }
    },

    /**
     * Serializa un objeto o valor a JSON y lo persiste de forma segura.
     * @param {string} key
     * @param {any} val
     * @returns {boolean}
     */
    setJson(key, val) {
      if (typeof key !== 'string' || !key || val === undefined) return false;
      try {
        const serialized = JSON.stringify(val);
        return gateway.set(key, serialized);
      } catch (e) {
        return false;
      }
    },

    /**
     * Obtiene un valor numérico seguro y finito con validación opcional.
     * @param {string} key
     * @param {number|null} [fallback=null]
     * @param {function(number): boolean} [validator=null]
     * @returns {number|null}
     */
    getNumber(key, fallback = null, validator = null) {
      if (typeof key !== 'string' || !key) return fallback;
      const raw = gateway.get(key);
      if (raw === null || raw === undefined || raw === '') return fallback;
      const num = Number(raw);
      if (!Number.isFinite(num)) return fallback;
      if (typeof validator === 'function') {
        try {
          if (!validator(num)) return fallback;
        } catch (e) {
          return fallback;
        }
      }
      return num;
    },

    /**
     * Almacena un número finito en el almacén.
     * @param {string} key
     * @param {number} val
     * @returns {boolean}
     */
    setNumber(key, val) {
      if (typeof key !== 'string' || !key || typeof val !== 'number' || !Number.isFinite(val)) return false;
      return gateway.set(key, String(val));
    },

    /**
     * Obtiene un valor booleano tipado.
     * @param {string} key
     * @param {boolean} [fallback=false]
     * @returns {boolean}
     */
    getBoolean(key, fallback = false) {
      if (typeof key !== 'string' || !key) return fallback;
      const raw = gateway.get(key);
      if (raw === null || raw === undefined) return fallback;
      if (raw === 'true' || raw === true || raw === '1' || raw === 1) return true;
      if (raw === 'false' || raw === false || raw === '0' || raw === 0) return false;
      return fallback;
    },

    /**
     * Almacena un valor booleano tipado.
     * @param {string} key
     * @param {boolean} val
     * @returns {boolean}
     */
    setBoolean(key, val) {
      if (typeof key !== 'string' || !key) return false;
      return gateway.set(key, val ? 'true' : 'false');
    },

    /**
     * Comprueba si una clave existe en el almacén o memoria de respaldo.
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
      if (typeof key !== 'string' || !key) return false;
      try {
        const storage = getRawStorage();
        if (storage && storage.getItem(key) !== null) return true;
      } catch (e) {}
      return memoryStore.has(key);
    },

    /**
     * Limpia el almacén WebStorage y la memoria de respaldo.
     * @returns {boolean}
     */
    clear() {
      memoryStore.clear();
      try {
        const storage = getRawStorage();
        if (storage) storage.clear();
      } catch (e) {}
      return true;
    }
  };

  return gateway;
}

/** @type {StorageAdapterType} */
const StorageAdapter = {
  local: createStorageGateway('localStorage'),
  session: createStorageGateway('sessionStorage')
};
if (typeof window !== 'undefined') {
  window.StorageAdapter = StorageAdapter;
}

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

  function isValidTheme(theme) {
    return theme === 'light' || theme === 'dark';
  }

  function getSystemTheme() {
    return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
  }

  function detectInitialTheme() {
    const domTheme = document.documentElement.getAttribute('data-theme');
    if (isValidTheme(domTheme)) return domTheme;

    const savedTheme = StorageAdapter.local.get(STORAGE_KEY, null, isValidTheme);
    if (savedTheme) return savedTheme;

    return getSystemTheme();
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
        if (!StorageAdapter.local.get(STORAGE_KEY, null, isValidTheme)) {
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
/**
 * Subsistema profundo de reproducción de audio.
 * Encapsula el elemento HTML5 Audio, motor de desvanecimiento suave (fade),
 * temporizador de apagado integrado, reconexión con retroceso exponencial,
 * y emisión de estado reactivo mediante suscripciones.
 */
const AudioController = (function() {
  const audio = typeof document !== 'undefined' ? document.querySelector('#radio') : null;
  const statusEl = typeof document !== 'undefined' ? document.querySelector('#audio-status') : null;
  const stickyStatusTag = typeof document !== 'undefined' ? document.querySelector('#sticky-status-tag') : null;
  const stickyStatusLabel = typeof document !== 'undefined' ? document.querySelector('#sticky-status-label') : null;
  const stickyPlayer = typeof document !== 'undefined' ? document.querySelector('#sticky-player') : null;

  // Claves de persistencia
  const VOL_STORAGE_KEY = 'rinconada_volume';
  const MUTE_STORAGE_KEY = 'rinconada_muted';

  // Estado del streaming y reconexión
  let wasPlayingBeforeOffline = false;
  let retryTimeout = null;
  let isAutoRetrying = false;
  let retryAttempt = 0;
  const MAX_AUTO_RETRIES = 3;

  // Motor interno de desvanecimiento de volumen (Fading Engine)
  const fadeEngine = {
    isMidFade: false,
    originalVolume: null
  };

  // Temporizador de apagado interno (Sleep Timer Engine)
  let sleepTimerId = null;
  let sleepEndTime = null;

  // Suscriptores de estado
  const subscribers = [];

  const rawStreamSrc = (audio && (audio.getAttribute('src') || audio.src)) || 'https://play14.tikast.com:22012/stream';
  const baseStreamUrl = rawStreamSrc.split('?')[0];

  function getFreshStreamUrl() {
    return baseStreamUrl + '?t=' + Date.now();
  }

  function getSleepRemainingSec() {
    if (!sleepTimerId || !sleepEndTime) return null;
    return Math.max(0, Math.round((sleepEndTime - Date.now()) / 1000));
  }

  function getState() {
    const isPlaying = !!(audio && !audio.paused);
    let playbackState = 'idle';
    if (isAutoRetrying) {
      playbackState = 'loading';
    } else if (isPlaying) {
      playbackState = 'playing';
    } else if (statusEl && statusEl.classList.contains('is-error')) {
      playbackState = 'error';
    }

    return {
      playbackState,
      volume: audio ? audio.volume : 1,
      isMuted: audio ? (audio.muted || audio.volume === 0) : false,
      statusText: statusEl ? statusEl.textContent : '',
      sleepRemainingSec: getSleepRemainingSec()
    };
  }

  function notifySubscribers() {
    const state = getState();
    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i](state);
      } catch (e) {}
    }
  }

  function subscribe(fn) {
    if (typeof fn === 'function') {
      subscribers.push(fn);
      try { fn(getState()); } catch (e) {}
      return () => {
        const idx = subscribers.indexOf(fn);
        if (idx !== -1) subscribers.splice(idx, 1);
      };
    }
    return () => {};
  }

  function updateStickyStatus(type, label) {
    if (!stickyStatusTag) return;
    stickyStatusTag.className = 'sticky-status-tag ' + (type ? 'is-' + type : '');
    if (stickyStatusLabel) {
      stickyStatusLabel.textContent = label;
    }
  }

  function setStatus(mainType, mainText, stickyType, stickyLabel) {
    if (statusEl) {
      statusEl.textContent = mainText;
      statusEl.className = mainType ? 'stream-status-tag is-' + mainType : 'stream-status-tag';
    }
    if (stickyType !== undefined) {
      updateStickyStatus(stickyType, stickyLabel !== undefined ? stickyLabel : mainText);
    }
    notifySubscribers();
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

  // Métodos del motor de desvanecimiento (Fading Engine)
  function fadeVolume(factor) {
    if (!audio) return;
    if (!fadeEngine.isMidFade) {
      fadeEngine.originalVolume = (typeof audio.volume === 'number' && !isNaN(audio.volume)) ? audio.volume : 1;
      fadeEngine.isMidFade = true;
    }
    const target = Math.max(0, Math.min(1, fadeEngine.originalVolume * factor));
    audio.volume = target;
    notifySubscribers();
  }

  function restoreVolume() {
    if (fadeEngine.isMidFade && fadeEngine.originalVolume !== null && audio) {
      audio.volume = fadeEngine.originalVolume;
      notifySubscribers();
    }
    fadeEngine.isMidFade = false;
    fadeEngine.originalVolume = null;
  }

  function cancelSleepTimer() {
    if (sleepTimerId) {
      clearInterval(sleepTimerId);
      sleepTimerId = null;
    }
    sleepEndTime = null;
    restoreVolume();
    notifySubscribers();
  }

  function startSleepTimer(minutes) {
    cancelSleepTimer();
    if (!audio) return;
    const durationMs = minutes * 60 * 1000;
    sleepEndTime = Date.now() + durationMs;

    const updateCountdown = () => {
      const remainingMs = sleepEndTime - Date.now();
      const remainingSec = Math.round(remainingMs / 1000);

      if (remainingSec <= 0) {
        clearInterval(sleepTimerId);
        sleepTimerId = null;
        stopPlayback();
        restoreVolume();
        setStatus('', 'Temporizador finalizado · En pausa');
        notifySubscribers();
        return;
      }

      if (remainingSec <= 30) {
        const factor = Math.max(0, remainingSec / 30);
        fadeVolume(factor);
      }
      notifySubscribers();
    };

    updateCountdown();
    sleepTimerId = setInterval(updateCountdown, 1000);
    notifySubscribers();
  }

  function showFatalError() {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    isAutoRetrying = false;
    retryAttempt = 0;
    setStatus('error', 'Error al conectar', 'error', 'Error al conectar');
  }

  function stopPlayback() {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    isAutoRetrying = false;
    retryAttempt = 0;
    wasPlayingBeforeOffline = false;
    if (fadeEngine.isMidFade) {
      restoreVolume();
    }
    if (audio) {
      audio.pause();
    }
    notifySubscribers();
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
    if (typeof audio.load === 'function') {
      audio.load();
    }
    audio.volume = currentVol;
    audio.muted = currentMuted;
    setStatus('connecting', 'Conectando con la señal…');
    return audio.play();
  }

  function initVolume() {
    if (!audio) return;
    const defaultVol = 1;
    const savedVol = StorageAdapter.local.getNumber(VOL_STORAGE_KEY, defaultVol, (v) => v >= 0 && v <= 1);
    audio.volume = savedVol;

    if (StorageAdapter.local.getBoolean(MUTE_STORAGE_KEY, false)) {
      audio.muted = true;
    }
    notifySubscribers();
  }

  function setupNativeAudioEvents() {
    if (!audio) return;

    audio.addEventListener('play', () => {
      isAutoRetrying = false;
      retryAttempt = 0;
      setStatus('', 'En vivo', '', 'En vivo');
    });

    audio.addEventListener('playing', () => {
      isAutoRetrying = false;
      retryAttempt = 0;
      setStatus('', 'En vivo', '', 'En vivo');
    });

    audio.addEventListener('pause', () => {
      if (!isAutoRetrying) {
        setStatus('', 'En pausa', '', 'En pausa');
      }
    });

    audio.addEventListener('volumechange', () => {
      notifySubscribers();
    });

    audio.addEventListener('waiting', () => {
      if (!audio.paused && !isAutoRetrying) {
        setStatus('connecting', 'Cargando señal…');
      }
    });

    audio.addEventListener('error', () => {
      if (audio.paused && !isAutoRetrying) return;
      if (!NetworkMonitor.isOnline()) {
        setStatus('error', 'Sin señal · Conexión perdida', 'error', 'Sin señal');
        return;
      }
      if (retryAttempt < MAX_AUTO_RETRIES) {
        retryAttempt++;
        isAutoRetrying = true;
        const delay = Math.min(1000 * Math.pow(2, retryAttempt), 8000);
        setStatus('connecting', 'Reintentando señal (' + retryAttempt + '/' + MAX_AUTO_RETRIES + ')…');
        retryTimeout = setTimeout(() => {
          if (!audio.paused || isAutoRetrying) {
            playLiveStream().catch(() => {
              if (retryAttempt >= MAX_AUTO_RETRIES) showFatalError();
            });
          }
        }, delay);
      } else {
        showFatalError();
      }
    });

    // Manejo de desconexión y reconexión de red
    window.addEventListener('offline', () => {
      if (audio && !audio.paused) {
        wasPlayingBeforeOffline = true;
        audio.pause();
      }
      setStatus('error', 'Sin conexión a internet', 'error', 'Sin internet');
    });

    window.addEventListener('online', () => {
      if (wasPlayingBeforeOffline) {
        wasPlayingBeforeOffline = false;
        setStatus('connecting', 'Recuperando señal…');
        playLiveStream().catch(() => showFatalError());
      } else if (audio && audio.paused) {
        setStatus('', 'En pausa', '', 'En pausa');
      }
    });

    // Atajos de teclado accesibles
    window.addEventListener('keydown', (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
      if (e.code === 'Space' || e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (audio.paused) playLiveStream().catch(() => showFatalError());
        else {
          cancelSleepTimer();
          stopPlayback();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        audio.muted = !audio.muted;
        StorageAdapter.local.setBoolean(MUTE_STORAGE_KEY, audio.muted);
        notifySubscribers();
      }
    });
  }

  function init() {
    if (!audio) return;
    initVolume();
    setupNativeAudioEvents();

    if (!NetworkMonitor.isOnline() && statusEl) {
      statusEl.textContent = 'Sin conexión a internet';
      statusEl.className = 'stream-status-tag is-error';
    }
  }

  init();

  return {
    getAudioElement: () => audio,
    isPlaying: () => !!(audio && !audio.paused),
    playLiveStream,
    stopPlayback,
    setStickyVisible,
    syncVolumeUI: notifySubscribers,
    syncPlayPauseUI: notifySubscribers,
    updateStickyStatus,
    setStatus,
    fade: fadeVolume,
    fadeVolume,
    restoreFade: restoreVolume,
    restoreVolume,
    isFading: () => fadeEngine.isMidFade,
    handleFatalError: showFatalError,
    // Nuevas capacidades profundas
    subscribe,
    getState,
    startSleepTimer,
    cancelSleepTimer,
    getSleepRemainingSec,
    VOL_STORAGE_KEY,
    MUTE_STORAGE_KEY
  };
})();
if (typeof window !== 'undefined') {
  window.AudioController = AudioController;
}

// --- PRESENTADOR DE LA TARJETA PRINCIPAL (MainPlayerPresenter) ---
const MainPlayerPresenter = (function() {
  const playBtn = document.querySelector('#play-btn');
  const iconPlay = playBtn ? playBtn.querySelector('.icon-play') : null;
  const iconPause = playBtn ? playBtn.querySelector('.icon-pause') : null;
  const muteBtn = document.querySelector('#mute-btn');
  const iconVolOn = muteBtn ? muteBtn.querySelector('.icon-vol-on') : null;
  const iconVolMute = muteBtn ? muteBtn.querySelector('.icon-vol-mute') : null;
  const volumeSlider = document.querySelector('#volume-slider');
  const eqBars = document.querySelector('#eq-bars');

  function init() {
    const audio = AudioController.getAudioElement();
    if (!audio) return;

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (audio.paused) {
          if (!NetworkMonitor.isOnline()) {
            AudioController.setStatus('error', 'Sin conexión a internet');
            return;
          }
          AudioController.playLiveStream().catch((err) => {
            if (err && err.name === 'AbortError') return;
            AudioController.handleFatalError();
          });
        } else {
          AudioController.cancelSleepTimer();
          AudioController.stopPlayback();
        }
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (audio && !isNaN(val)) {
          audio.volume = val;
          audio.muted = false;
          StorageAdapter.local.setNumber(AudioController.VOL_STORAGE_KEY, val);
          StorageAdapter.local.setBoolean(AudioController.MUTE_STORAGE_KEY, false);
          AudioController.syncVolumeUI();
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (!audio) return;
        audio.muted = !audio.muted;
        StorageAdapter.local.setBoolean(AudioController.MUTE_STORAGE_KEY, audio.muted);
        AudioController.syncVolumeUI();
      });
    }

    // Suscripción reactiva para sincronizar la UI principal
    AudioController.subscribe((state) => {
      const isPlaying = state.playbackState === 'playing';
      if (iconPlay) iconPlay.style.display = isPlaying ? 'none' : 'block';
      if (iconPause) iconPause.style.display = isPlaying ? 'block' : 'none';
      if (playBtn) {
        playBtn.setAttribute('aria-label', isPlaying ? 'Pausar señal en vivo' : 'Reproducir señal en vivo');
        playBtn.setAttribute('title', isPlaying ? 'Pausar señal en vivo' : 'Reproducir señal en vivo');
      }
      if (eqBars) {
        if (isPlaying) eqBars.classList.add('is-playing');
        else eqBars.classList.remove('is-playing');
      }

      // Iconos de volumen y deslizador
      const isMuted = state.isMuted;
      if (iconVolOn && iconVolMute) {
        iconVolOn.style.display = isMuted ? 'none' : 'block';
        iconVolMute.style.display = isMuted ? 'block' : 'none';
      }
      if (muteBtn) {
        muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar sonido');
        muteBtn.setAttribute('title', isMuted ? 'Activar sonido' : 'Silenciar sonido');
        muteBtn.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
      }
      if (volumeSlider) {
        volumeSlider.value = isMuted ? 0 : state.volume;
        volumeSlider.setAttribute('aria-valuenow', volumeSlider.value);
        volumeSlider.setAttribute('aria-valuetext', isMuted ? 'Silenciado' : Math.round(state.volume * 100) + ' por ciento');
      }
    });
  }

  init();
  return { init };
})();

// --- PRESENTADOR DE LA BARRA FLOTANTE (StickyPlayerPresenter) ---
const StickyPlayerPresenter = (function() {
  const stickyPlayBtn = document.querySelector('#sticky-play-btn');
  const stickyIconPlay = stickyPlayBtn ? stickyPlayBtn.querySelector('.icon-play') : null;
  const stickyIconPause = stickyPlayBtn ? stickyPlayBtn.querySelector('.icon-pause') : null;
  const stickyMuteBtn = document.querySelector('#sticky-mute-btn');
  const stickyIconVolOn = stickyMuteBtn ? stickyMuteBtn.querySelector('.icon-vol-on') : null;
  const stickyIconVolMute = stickyMuteBtn ? stickyMuteBtn.querySelector('.icon-vol-mute') : null;
  const stickyVolumeSlider = document.querySelector('#sticky-volume-slider');
  const stickyTopBtn = document.querySelector('#sticky-top-btn');
  const playerCardEl = document.querySelector('#reproductor');

  function init() {
    const audio = AudioController.getAudioElement();
    if (!audio) return;

    if (stickyPlayBtn) {
      stickyPlayBtn.addEventListener('click', () => {
        const playBtn = document.querySelector('#play-btn');
        if (playBtn) playBtn.click();
      });
    }

    if (stickyVolumeSlider) {
      stickyVolumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (audio && !isNaN(val)) {
          audio.volume = val;
          audio.muted = false;
          StorageAdapter.local.setNumber(AudioController.VOL_STORAGE_KEY, val);
          StorageAdapter.local.setBoolean(AudioController.MUTE_STORAGE_KEY, false);
          AudioController.syncVolumeUI();
        }
      });
    }

    if (stickyMuteBtn) {
      stickyMuteBtn.addEventListener('click', () => {
        const muteBtn = document.querySelector('#mute-btn');
        if (muteBtn) muteBtn.click();
      });
    }

    if (stickyTopBtn) {
      stickyTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Observador de visibilidad para la barra sticky
    if (playerCardEl && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        for (let i = 0; i < entries.length; i++) {
          AudioController.setStickyVisible(!entries[i].isIntersecting);
        }
      }, { threshold: 0.1 });
      observer.observe(playerCardEl);
    }

    // Suscripción reactiva para sincronizar la barra sticky
    AudioController.subscribe((state) => {
      const isPlaying = state.playbackState === 'playing';
      if (stickyIconPlay) stickyIconPlay.style.display = isPlaying ? 'none' : 'block';
      if (stickyIconPause) stickyIconPause.style.display = isPlaying ? 'block' : 'none';
      if (stickyPlayBtn) {
        stickyPlayBtn.setAttribute('aria-label', isPlaying ? 'Pausar señal en vivo' : 'Reproducir señal en vivo');
        stickyPlayBtn.setAttribute('title', isPlaying ? 'Pausar señal en vivo' : 'Reproducir señal en vivo');
      }

      const isMuted = state.isMuted;
      if (stickyIconVolOn && stickyIconVolMute) {
        stickyIconVolOn.style.display = isMuted ? 'none' : 'block';
        stickyIconVolMute.style.display = isMuted ? 'block' : 'none';
      }
      if (stickyMuteBtn) {
        stickyMuteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar sonido');
        stickyMuteBtn.setAttribute('title', isMuted ? 'Activar sonido' : 'Silenciar sonido');
        stickyMuteBtn.setAttribute('aria-pressed', String(isMuted));
      }
      if (stickyVolumeSlider) {
        stickyVolumeSlider.value = isMuted ? 0 : state.volume;
        stickyVolumeSlider.setAttribute('aria-valuenow', stickyVolumeSlider.value);
        stickyVolumeSlider.setAttribute('aria-valuetext', isMuted ? 'Silenciado' : Math.round(state.volume * 100) + ' por ciento');
      }
    });
  }

  init();
  return { init };
})();

// --- 5. MÓDULO TEMPORIZADOR DE APAGADO (SleepTimer - Adaptador UI) ---
const SleepTimer = (function() {
  const sleepTimerBtn = document.querySelector('#sleep-timer-btn');
  const sleepTimerMenu = document.querySelector('#sleep-timer-menu');
  const sleepTimerText = document.querySelector('#sleep-timer-text');
  const sleepCancelBtn = document.querySelector('#sleep-cancel-btn');
  const sleepMenuItems = document.querySelectorAll ? document.querySelectorAll('.sleep-menu-item[data-minutes]') : [];

  function updateUI(remainingSec) {
    if (remainingSec !== null && remainingSec > 0) {
      const mins = Math.floor(remainingSec / 60);
      const secs = remainingSec % 60;
      const label = mins > 0 ? mins + 'm' : secs + 's';
      if (sleepTimerText) sleepTimerText.textContent = label;
      if (sleepTimerBtn) {
        sleepTimerBtn.classList.add('is-active');
        sleepTimerBtn.setAttribute('title', 'Apagado programado en ' + label);
        sleepTimerBtn.setAttribute('aria-label', 'Dormir — ' + label + ' restantes para apagar la transmisión');
      }
      if (sleepCancelBtn) sleepCancelBtn.disabled = false;
    } else {
      if (sleepTimerText) sleepTimerText.textContent = 'Dormir';
      if (sleepTimerBtn) {
        sleepTimerBtn.classList.remove('is-active');
        sleepTimerBtn.setAttribute('title', 'Temporizador de apagado');
        sleepTimerBtn.setAttribute('aria-label', 'Dormir — Temporizador de apagado');
      }
      if (sleepCancelBtn) sleepCancelBtn.disabled = true;
      if (sleepMenuItems && sleepMenuItems.forEach) {
        sleepMenuItems.forEach(item => item.classList.remove('is-selected'));
      }
    }
  }

  function init() {
    AudioController.subscribe((state) => {
      updateUI(state.sleepRemainingSec);
    });

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

      if (sleepMenuItems && sleepMenuItems.forEach) {
        sleepMenuItems.forEach(item => {
          item.addEventListener('click', () => {
            const mins = parseInt(item.dataset && item.dataset.minutes, 10);
            if (mins > 0) {
              item.classList.add('is-selected');
              AudioController.startSleepTimer(mins);
            } else {
              AudioController.cancelSleepTimer();
            }
            sleepTimerMenu.setAttribute('hidden', '');
            sleepTimerBtn.setAttribute('aria-expanded', 'false');
          });
        });
      }

      if (sleepCancelBtn) {
        sleepCancelBtn.addEventListener('click', () => {
          AudioController.cancelSleepTimer();
          sleepTimerMenu.setAttribute('hidden', '');
          sleepTimerBtn.setAttribute('aria-expanded', 'false');
        });
      }
    }
  }

  init();

  return {
    start: (mins) => AudioController.startSleepTimer(mins),
    cancel: () => AudioController.cancelSleepTimer(),
    resetUI: () => updateUI(null),
    isActive: () => AudioController.getSleepRemainingSec() !== null
  };
})();
if (typeof window !== 'undefined') {
  window.SleepTimer = SleepTimer;
}

// --- 6. MÓDULO INTEGRAL DE PISTA EN VIVO E HISTORIAL (LiveTrackModule) ---
/**
 * Módulo unificado y profundo para la gestión integral de metadatos en vivo:
 * - Sondeo adaptativo Shoutcast JSONP con resiliencia de red y modo ahorro de datos.
 * - Saneamiento y validación estricta de títulos de temas musicales.
 * - Formateo y enlace dinámico de mensajes de dedicatoria por WhatsApp (#track-share-wa y #sticky-wa-btn).
 * - Historial seguro de canciones en sessionStorage (máximo 5) inmune a inyecciones XSS.
 * - Sincronización con MediaSession API nativa del navegador y sistema operativo.
 * - Presentación de UI con transiciones fluidas de opacidad y estado en vivo.
 */
const LiveTrackModule = (function() {
  const STORAGE_KEY = 'rinconada_recent_tracks';
  const MAX_HISTORY_ITEMS = 5;
  const SCRIPT_TIMEOUT_MS = 6000;
  const WA_BASE_URL = 'https://wa.me/573052430933';

  // Referencias cacheadas a elementos del DOM
  let trackTitleEl = null;
  let trackBoxEl = null;
  let stickyTrackTitleEl = null;
  let trackShareWaEl = null;
  let stickyWaBtnEl = null;
  let recentTracksToggleEl = null;
  let recentTracksPanelEl = null;
  let recentTracksListEl = null;
  let recentBadgeEl = null;

  // Estado interno del módulo
  let currentTrackTitle = '';
  let metaPollInterval = null;
  let pendingMetaScript = null;
  let metaTimeoutId = null;
  const subscribers = [];

  // Carga inicial y saneamiento estricto del historial de temas desde almacenamiento seguro de sesión
  const recentTracks = (function loadInitialHistory() {
    const raw = StorageAdapter.session.getJson(STORAGE_KEY, [], Array.isArray);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(item => item && typeof item.title === 'string' && typeof item.time === 'string')
      .slice(0, MAX_HISTORY_ITEMS);
  })();

  function resolveElements() {
    trackTitleEl = document.querySelector('#track-title');
    trackBoxEl = document.querySelector('#now-playing-box');
    stickyTrackTitleEl = (typeof stickyTrackTitle !== 'undefined' && stickyTrackTitle) || document.querySelector('#sticky-track-title');
    trackShareWaEl = document.querySelector('#track-share-wa');
    stickyWaBtnEl = (typeof stickyWaBtn !== 'undefined' && stickyWaBtn) || document.querySelector('#sticky-wa-btn');
    recentTracksToggleEl = document.querySelector('#recent-tracks-toggle');
    recentTracksPanelEl = document.querySelector('#recent-tracks-panel');
    recentTracksListEl = document.querySelector('#recent-tracks-list');
    recentBadgeEl = document.querySelector('#recent-badge');
  }

  /**
   * Construye el enlace de dedicatoria de WhatsApp preformateado para el tema en reproducción.
   * @param {string} trackName
   * @returns {string} URL de WhatsApp con mensaje codificado
   */
  function buildWhatsAppDedicationUrl(trackName) {
    if (!trackName || typeof trackName !== 'string') return WA_BASE_URL;
    const trimmed = trackName.trim();
    if (!trimmed) return WA_BASE_URL;
    const msg = `¡Hola Rinconada Stereo! Estoy escuchando "${trimmed}" desde la web y quiero pedir una dedicatoria / saludo en cabina 📻🎶`;
    return `${WA_BASE_URL}?text=${encodeURIComponent(msg)}`;
  }

  /**
   * Actualiza los enlaces de dedicatoria en el reproductor principal y sticky player.
   * @param {string} trackName
   */
  function updateDedicationLinks(trackName) {
    const url = buildWhatsAppDedicationUrl(trackName);
    if (trackShareWaEl) trackShareWaEl.href = url;
    if (stickyWaBtnEl) stickyWaBtnEl.href = url;
  }

  /**
   * Actualiza los metadatos de MediaSession nativos del sistema operativo.
   * @param {string} trackName
   */
  function updateMediaSession(trackName) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      let logoUrl = 'assets/logo-rinconada.png';
      if (typeof window !== 'undefined' && window.location && window.location.href) {
        logoUrl = new URL('assets/logo-rinconada.png', window.location.href).href;
      }
      const validScheme = /^(https?:|blob:|data:)/i.test(logoUrl);
      if (typeof MediaMetadata === 'function') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: trackName,
          artist: 'Rinconada Stereo',
          album: 'Señal en directo · La Pacha',
          artwork: validScheme ? [{ src: logoUrl, sizes: '512x512', type: 'image/png' }] : []
        });
      }
    } catch (e) {
      // Ignora errores si la API MediaSession no está completamente implementada en el entorno
    }
  }

  /**
   * Renderiza la lista visual de pistas reproducidas recientemente de forma segura (sin riesgo XSS).
   * @returns {void}
   */
  function renderRecentTracks() {
    if (!recentTracksListEl) return;
    if (!recentTracks || recentTracks.length === 0) {
      recentTracksListEl.innerHTML = '<li class="recent-track-empty">Aún no hay canciones anteriores registradas.</li>';
      if (recentBadgeEl) recentBadgeEl.textContent = '0';
      return;
    }
    if (recentBadgeEl) recentBadgeEl.textContent = String(recentTracks.length);
    recentTracksListEl.replaceChildren(...recentTracks.map(item => {
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
   * Agrega una pista al historial de sesión (máximo 5 registros) previniendo duplicados y promocionales.
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
    if (recentTracks.length > MAX_HISTORY_ITEMS) recentTracks.pop();

    StorageAdapter.session.setJson(STORAGE_KEY, recentTracks);
    renderRecentTracks();
  }

  /**
   * Actualiza el tema en reproducción, dedicatoria de WhatsApp, MediaSession,
   * historial de canciones y presentación en la interfaz.
   * Acepta un título en cadena de texto o un objeto de carga útil Shoutcast ({ songtitle: ... }).
   * @param {string|{ songtitle?: any }} payloadOrTitle
   * @returns {string|null} Título normalizado aplicado o null si no hubo cambio/inválido
   */
  function updateNowPlaying(payloadOrTitle) {
    let rawTitle = '';
    if (typeof payloadOrTitle === 'string') {
      rawTitle = payloadOrTitle;
    } else if (payloadOrTitle && typeof payloadOrTitle === 'object' && typeof payloadOrTitle.songtitle === 'string') {
      rawTitle = payloadOrTitle.songtitle;
    } else {
      return null;
    }

    const cleaned = rawTitle.trim();
    if (!cleaned) return null;

    if (cleaned !== currentTrackTitle) {
      currentTrackTitle = cleaned;

      if (trackTitleEl) {
        trackTitleEl.style.opacity = '0';
        setTimeout(() => {
          if (trackTitleEl) {
            trackTitleEl.textContent = cleaned;
            trackTitleEl.setAttribute('title', cleaned);
            trackTitleEl.style.opacity = '1';
          }
        }, 150);
      }
      if (stickyTrackTitleEl) {
        stickyTrackTitleEl.textContent = cleaned;
        stickyTrackTitleEl.setAttribute('title', cleaned);
      }
      if (trackBoxEl) {
        trackBoxEl.classList.add('is-live');
      }

      updateDedicationLinks(cleaned);
      addRecentTrack(cleaned);
      updateMediaSession(cleaned);

      for (let i = 0; i < subscribers.length; i++) {
        try {
          subscribers[i]({ title: cleaned, raw: rawTitle });
        } catch (err) {}
      }
    }
    return cleaned;
  }

  /**
   * Manejador de la respuesta JSONP del encoder Shoutcast.
   * @param {Object} data
   */
  function handleMetadataResponse(data) {
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
  }

  /**
   * Realiza una petición JSONP del metadato actual de la emisora vía Shoutcast.
   * Protegido estrictamente ante estado offline para no inyectar scripts innecesarios.
   * @returns {void}
   */
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
    }, SCRIPT_TIMEOUT_MS);

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
    if (document.head && typeof document.head.appendChild === 'function') {
      document.head.appendChild(script);
    }
  }

  /**
   * Actualiza el intervalo adaptativo de sondeo de metadatos según estado de reproducción,
   * visibilidad de pestaña y modo de ahorro de datos (Save-Data).
   * @returns {void}
   */
  function updatePollingSchedule() {
    if (metaPollInterval) {
      clearInterval(metaPollInterval);
      metaPollInterval = null;
    }

    if (!NetworkMonitor.isOnline()) return;

    const isPlaying = typeof AudioController !== 'undefined' && typeof AudioController.isPlaying === 'function'
      ? AudioController.isPlaying()
      : (typeof audio !== 'undefined' && audio && !audio.paused);
    const isHidden = !!(document && document.hidden);
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

  /**
   * Inicializa el módulo, vincula eventos de UI e inicia el ciclo de sondeo.
   */
  function init() {
    resolveElements();

    if (recentTracksToggleEl && recentTracksPanelEl) {
      recentTracksToggleEl.addEventListener('click', () => {
        const isHidden = recentTracksPanelEl.hasAttribute('hidden');
        if (isHidden) {
          recentTracksPanelEl.removeAttribute('hidden');
          recentTracksToggleEl.setAttribute('aria-expanded', 'true');
        } else {
          recentTracksPanelEl.setAttribute('hidden', '');
          recentTracksToggleEl.setAttribute('aria-expanded', 'false');
        }
      });
    }

    renderRecentTracks();
    fetchLiveTrack();
    updatePollingSchedule();

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && NetworkMonitor.isOnline()) {
        fetchLiveTrack();
      }
      updatePollingSchedule();
    });
  }

  init();

  return {
    init,
    subscribe: (fn) => {
      if (typeof fn === 'function') {
        subscribers.push(fn);
        return () => {
          const idx = subscribers.indexOf(fn);
          if (idx !== -1) subscribers.splice(idx, 1);
        };
      }
      return () => {};
    },
    updateNowPlaying,
    fetchLiveTrack,
    updatePollingSchedule,
    addRecentTrack,
    renderRecentTracks,
    buildWhatsAppDedicationUrl,
    updateDedicationLinks,
    updateMediaSession,
    handleMetadataResponse,
    getRecentTracks: () => recentTracks,
    getCurrentTrack: () => currentTrackTitle,
    getPendingScript: () => pendingMetaScript
  };
})();

if (typeof window !== 'undefined') {
  window.LiveTrackModule = LiveTrackModule;
  window.MetadataService = LiveTrackModule;
}

const MetadataService = LiveTrackModule;

if (typeof window !== 'undefined') {
  window.__rsMetadataHandler = (data) => LiveTrackModule.handleMetadataResponse(data);
}

// --- 8. MÓDULO CARGA DIFERIDA DE CHAT (ChatLoader) ---
const ChatLoader = (() => {
  const chatCard = document.querySelector('#chat');
  const chatToggleBtn = document.querySelector('#chat-toggle-btn');
  const chatDrawer = document.querySelector('#chat-drawer');

  const getChatIframe = () => {
    return document.querySelector('#chat iframe[data-src]') ||
           document.querySelector('#chat-drawer iframe[data-src]') ||
           document.querySelector('#chat-drawer iframe') ||
           document.querySelector('#chat iframe');
  };

  let chatLoaded = false;

  const loadChat = () => {
    if (chatLoaded) return;
    const iframe = getChatIframe();
    if (!iframe) return;
    const realSrc = iframe.getAttribute('data-src');
    if (realSrc) {
      iframe.src = realSrc;
      iframe.setAttribute('src', realSrc);
      iframe.removeAttribute('data-src');
      chatLoaded = true;
    }
  };

  const isWideScreen = () => {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(min-width: 901px)').matches;
    }
    return typeof window.innerWidth === 'number' ? window.innerWidth > 900 : false;
  };

  const toggleChat = (forceOpen) => {
    if (!chatCard || !chatToggleBtn) return;
    const isCurrentlyOpen = chatCard.classList.contains('is-open');
    const willOpen = typeof forceOpen === 'boolean' ? forceOpen : !isCurrentlyOpen;

    chatCard.classList.toggle('is-open', willOpen);
    chatToggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    chatToggleBtn.setAttribute('title', willOpen ? 'Cerrar chat en vivo' : 'Abrir chat en vivo');

    const toggleText = chatToggleBtn.querySelector ? chatToggleBtn.querySelector('.chat-toggle-text') : null;
    if (toggleText) {
      toggleText.textContent = willOpen ? 'Cerrar Chat' : 'Abrir Chat en vivo';
    }

    const toggleArrow = chatToggleBtn.querySelector ? chatToggleBtn.querySelector('.chat-toggle-arrow') : null;
    if (toggleArrow) {
      toggleArrow.textContent = willOpen ? '▲' : '▼';
    }

    if (willOpen) {
      loadChat();
    }
  };

  if (chatToggleBtn) {
    chatToggleBtn.addEventListener('click', () => toggleChat());
  }

  if (chatCard) {
    // En escritorio, la interacción directa con la tarjeta carga el chat
    ['pointerenter', 'focusin'].forEach(evt => {
      chatCard.addEventListener(evt, () => {
        if (isWideScreen()) {
          loadChat();
        }
      }, { once: true, passive: true });
    });

    const setupDesktopLazyLoad = () => {
      if (typeof NetworkMonitor !== 'undefined' && NetworkMonitor.isSaveDataEnabled && NetworkMonitor.isSaveDataEnabled()) {
        return;
      }
      if ('IntersectionObserver' in window) {
        const chatObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              loadChat();
              observer.disconnect();
            }
          });
        }, { rootMargin: '250px 0px' });
        chatObserver.observe(chatCard);
      } else if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => setTimeout(loadChat, 1500), { timeout: 4000 });
      } else {
        window.addEventListener('load', () => setTimeout(loadChat, 2000), { once: true });
      }
    };

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const desktopQuery = window.matchMedia('(min-width: 901px)');
      if (desktopQuery.matches) {
        setupDesktopLazyLoad();
      } else if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener('change', (e) => {
          if (e.matches) {
            setupDesktopLazyLoad();
          }
        }, { once: true });
      }
    } else if (isWideScreen()) {
      setupDesktopLazyLoad();
    }
  }

  return {
    loadChat,
    toggleChat
  };
})();

if (typeof window !== 'undefined') {
  window.ChatLoader = ChatLoader;
}

// --- 9. MÓDULO PROFUNDO DE TELEMETRÍA TERRITORIAL (TerritoryTelemetry) ---
/**
 * Módulo unificado para los indicadores ambientales y temporales del territorio:
 * - Pronóstico regional con caché de 30 minutos (Open-Meteo) y traducción de códigos WMO.
 * - Reloj local sincronizado de La Pacha (America/Bogota, UTC-5) con alineación al segundo :00.
 * - Observación de intersección única y gestión de ciclo de vida con visibilidad de pestaña.
 */
const TerritoryTelemetry = (function() {
  const WEATHER_CACHE_KEY = 'rinconada_weather_cache';
  const WEATHER_CACHE_TTL = 30 * 60 * 1000;
  const weatherCard = typeof document !== 'undefined' ? document.querySelector('#weather-card') : null;
  const weatherSection = typeof document !== 'undefined' ? document.querySelector('#clima-regional') : null;
  let clockEl = null;
  let timerId = null;
  let intervalId = null;
  let weatherObserver = null;

  // --- MÉTODOS DE RELOJ LOCAL DE LA PACHA ---
  function getClockElement() {
    if (!clockEl && typeof document !== 'undefined') {
      clockEl = document.querySelector('#pacha-clock');
    }
    return clockEl;
  }

  function getBogotaTimeParts(date = new Date()) {
    const hours24 = (date.getUTCHours() - 5 + 24) % 24;
    const minutes = date.getUTCMinutes();
    return { hours24, minutes };
  }

  function formatBogotaTime(date = new Date()) {
    try {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        return new Intl.DateTimeFormat('es-CO', {
          timeZone: 'America/Bogota',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(date);
      }
    } catch (e) {}
    const { hours24, minutes } = getBogotaTimeParts(date);
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 < 12 ? 'a. m.' : 'p. m.';
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  function getBogotaTimeString24(date = new Date()) {
    const { hours24, minutes } = getBogotaTimeParts(date);
    return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  function updateClock() {
    const el = getClockElement();
    if (!el) return;
    const now = new Date();
    el.textContent = formatBogotaTime(now);
    el.setAttribute('datetime', getBogotaTimeString24(now));
  }

  function clearClockTimers() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startClock() {
    clearClockTimers();
    updateClock();
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    const now = new Date();
    const delay = Math.max(50, (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50);
    timerId = setTimeout(() => {
      updateClock();
      intervalId = setInterval(updateClock, 60000);
    }, delay);
  }

  // --- MÉTODOS DE PRONÓSTICO REGIONAL ---
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

  function isWeatherPayloadValid(data) {
    return Boolean(
      data &&
      typeof data.temp === 'number' &&
      typeof data.desc === 'string' &&
      typeof data.icon === 'string' &&
      typeof data.humidity === 'number' &&
      typeof data.wind === 'number' &&
      typeof data.timestamp === 'number'
    );
  }

  async function loadWeather() {
    if (!weatherCard) return;
    const cached = StorageAdapter.session.getJson(WEATHER_CACHE_KEY, null, (data) =>
      isWeatherPayloadValid(data) && (Date.now() - data.timestamp) < WEATHER_CACHE_TTL
    );

    if (cached) {
      renderWeatherHTML(cached.temp, cached.desc, cached.icon, cached.humidity, cached.wind);
      return;
    }

    const lat = 9.2579;
    const lon = -74.2599;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FBogota`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

    try {
      const res = await fetch(url, controller ? { signal: controller.signal } : undefined);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const current = data && data.current;
      if (!current) throw new Error('Respuesta inválida de Open-Meteo');

      const info = getWeatherInterpretation(current.weather_code);
      const temp = Math.round(current.temperature_2m);
      const humidity = Math.round(current.relative_humidity_2m);
      const wind = Math.round(current.wind_speed_10m);

      renderWeatherHTML(temp, info.desc, info.icon, humidity, wind);

      StorageAdapter.session.setJson(WEATHER_CACHE_KEY, {
        temp, desc: info.desc, icon: info.icon, humidity, wind,
        timestamp: Date.now()
      });
    } catch (e) {
      const cachedStale = StorageAdapter.session.getJson(WEATHER_CACHE_KEY, null, isWeatherPayloadValid);
      if (cachedStale) {
        renderWeatherHTML(cachedStale.temp, cachedStale.desc, cachedStale.icon, cachedStale.humidity, cachedStale.wind);
        return;
      }
      weatherCard.innerHTML = `
        <div class="weather-error">
          <p>Pronóstico no disponible temporalmente.</p>
        </div>
      `;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  function setupWeatherObserver() {
    if (weatherSection && typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      weatherObserver = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
          loadWeather();
          if (weatherObserver) weatherObserver.disconnect();
        }
      }, { rootMargin: '200px' });
      weatherObserver.observe(weatherSection);
    } else {
      loadWeather();
    }
  }

  function init() {
    startClock();
    setupWeatherObserver();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          startClock();
        } else {
          clearClockTimers();
        }
      });
    }
  }

  return {
    init,
    updateClock,
    getBogotaTime: formatBogotaTime,
    formatBogotaTime,
    getBogotaTimeString24,
    getCachedWeather: () => StorageAdapter.session.getJson(WEATHER_CACHE_KEY, null, isWeatherPayloadValid),
    fetchWeather: loadWeather
  };
})();

// Alias de retrocompatibilidad
const WeatherService = { loadOpenMeteoWeather: TerritoryTelemetry.fetchWeather };
const PachaClock = TerritoryTelemetry;
const formatBogotaTime = TerritoryTelemetry.getBogotaTime;

if (typeof window !== 'undefined') {
  window.TerritoryTelemetry = TerritoryTelemetry;
  window.PachaClock = TerritoryTelemetry;
  window.WeatherService = WeatherService;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TerritoryTelemetry.init());
  } else {
    TerritoryTelemetry.init();
  }
}

// --- 10. REGISTRO DE SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
