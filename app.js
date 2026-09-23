const audio = document.querySelector('#radio');
const status = document.querySelector('#audio-status');
audio.addEventListener('playing', () => { status.textContent = 'Conectado a la señal en vivo.'; });
audio.addEventListener('waiting', () => { status.textContent = 'Conectando con la señal…'; });
audio.addEventListener('error', () => { status.textContent = 'No fue posible conectar. Prueba el reproductor alternativo.'; });

const alternate = document.querySelector('#alternate-player');
alternate.addEventListener('toggle', () => {
  if (alternate.open && !document.querySelector('#alternate-frame iframe')) {
    const frame = document.createElement('iframe');
    frame.src = 'https://virtualtronics.com/streaming/customers/rinconadastereo/player.php?type=big';
    frame.title = 'Reproductor alternativo de Rinconada Stereo';
    frame.loading = 'lazy';
    document.querySelector('#alternate-frame').append(frame);
    audio.pause();
  }
});

const weather = document.querySelector('.weatherwidget-io');
const loadWeather = () => {
  const script = document.createElement('script');
  script.src = 'https://weatherwidget.io/js/widget.min.js';
  script.async = true;
  document.head.append(script);
};
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      loadWeather();
      observer.disconnect();
    }
  }, { rootMargin: '300px' });
  observer.observe(weather);
} else {
  loadWeather();
}



