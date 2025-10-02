const audio = document.getElementById('audio');
const btn   = document.querySelector('.play-btn');
const bar   = document.querySelector('.bar');
const cur   = document.getElementById('cur');
const dur   = document.getElementById('dur');

const fmt = s => {
  if (!isFinite(s)) return '0:00';
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
};

// --- DURAÇÃO (robusto) ---
function setDurationIfReady() {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    dur.textContent = fmt(audio.duration);
  }
}

audio.addEventListener('loadedmetadata', setDurationIfReady);
audio.addEventListener('durationchange', setDurationIfReady);
audio.addEventListener('canplay', setDurationIfReady);

// Se o áudio já tiver metadata quando o JS correr:
if (audio.readyState >= 1) setDurationIfReady();


// Atualizar barra e tempo durante a reprodução
audio.addEventListener('timeupdate', () => {
  cur.textContent = fmt(audio.currentTime);
  const p = (audio.currentTime / audio.duration) * 100 || 0;
  bar.value = p;
  bar.style.background = `linear-gradient(#eee 0 0) 0/${p}% 100% no-repeat, #333`;
});

// Play/Pause
btn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    btn.classList.add('is-playing');
    btn.setAttribute('aria-label', 'Pausar');
  } else {
    audio.pause();
    btn.classList.remove('is-playing');
    btn.setAttribute('aria-label', 'Reproduzir');
  }
});

// Seek na barra
bar.addEventListener('input', () => {
  if (isFinite(audio.duration)) {
    audio.currentTime = (bar.value / 100) * audio.duration;
  }
});

// Teclado: Espaço para play/pause
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); btn.click(); }
});
