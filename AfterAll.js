document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('.music-list');
  const disc = document.querySelector('.global-vinil');
  const nowPlayingEl = document.querySelector('.now-playing');
  const seekEl = document.querySelector('.seek');
  const timeCurEl = document.querySelector('.current');
  const timeDurEl = document.querySelector('.duration');

  if (!list || !disc || !seekEl) return;

  const ICONS = { play: 'Assets/play.png', pause: 'Assets/pause.png' };
  let activeAudio = null;      // <audio> actualmente a tocar
  let isSeeking = false;       // bloqueia updates enquanto se arrasta

  // Util
  const fmt = (sec) => {
    if (!isFinite(sec)) return '0:00';
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  function updateAnyPlayingFlag() {
    const anyPlaying = Array.from(list.querySelectorAll('audio'))
      .some(a => !a.paused && !a.ended);
    disc.classList.toggle('is-rotating', anyPlaying);
  }

  function setBtnState(btn, mode /* 'play' | 'pause' */) {
    const img = btn.querySelector('img');
    if (img) {
      img.src = mode === 'pause' ? ICONS.pause : ICONS.play;
      img.alt = mode === 'pause' ? 'Pausar' : 'Reproduzir';
    } else {
      btn.textContent = mode === 'pause' ? '⏸' : '▶';
    }
    btn.setAttribute('aria-label', mode === 'pause' ? 'Pausar' : 'Reproduzir');
  }

  function getBtnForAudio(audioEl) {
    return audioEl.closest('.track')?.querySelector('.play-btn') || null;
  }

  function pauseAllExcept(exceptAudio) {
    list.querySelectorAll('audio').forEach(a => {
      if (a !== exceptAudio) {
        a.pause();
        a.currentTime = 0;
        const b = getBtnForAudio(a);
        if (b) setBtnState(b, 'play');
      }
    });
    updateAnyPlayingFlag();
  }

  function setNowPlaying(text) {
    nowPlayingEl.textContent = text || '—';
  }

  function wireProgressFor(audio) {
    // habilita a seekbar com a duração
    if (isFinite(audio.duration)) {
      seekEl.max = audio.duration;
      seekEl.disabled = false;
      timeDurEl.textContent = fmt(audio.duration);
    } else {
      // se a metadata ainda não carregou
      seekEl.max = 0;
      seekEl.value = 0;
      seekEl.disabled = true;
      timeDurEl.textContent = '0:00';
    }
  }

  function clearProgress() {
    seekEl.value = 0;
    seekEl.max = 0;
    seekEl.disabled = true;
    timeCurEl.textContent = '0:00';
    timeDurEl.textContent = '0:00';
  }

  // Clique no botão play/pause
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.play-btn');
    if (!btn || !list.contains(btn)) return;

    const track = btn.closest('.track');
    const audio = track?.querySelector('audio');
    const title = track?.querySelector('h3')?.textContent || '';

    if (!audio) return;

    if (audio.paused) {
      pauseAllExcept(audio);
      audio.play()
        .then(() => {
          activeAudio = audio;
          setBtnState(btn, 'pause');
          setNowPlaying(title.replace(/^\d+\.\s*/, '')); // remove "1. "
          wireProgressFor(audio);
          updateAnyPlayingFlag();
        })
        .catch(err => {
          console.error('Falha ao reproduzir áudio:', err);
          setBtnState(btn, 'play');
          setNowPlaying('—');
          clearProgress();
          updateAnyPlayingFlag();
        });
    } else {
      audio.pause();
      setBtnState(btn, 'play');
      updateAnyPlayingFlag();
    }
  });

  // Eventos dos <audio>
  list.querySelectorAll('audio').forEach(a => {
    a.addEventListener('loadedmetadata', () => {
      if (a === activeAudio) wireProgressFor(a);
    });

    a.addEventListener('timeupdate', () => {
      if (a !== activeAudio || isSeeking) return;
      if (!seekEl.disabled) {
        seekEl.value = a.currentTime;
      }
      timeCurEl.textContent = fmt(a.currentTime);
      if (isFinite(a.duration)) timeDurEl.textContent = fmt(a.duration);
    });

    a.addEventListener('play', () => {
      pauseAllExcept(a);
      const b = getBtnForAudio(a);
      if (b) setBtnState(b, 'pause');
      activeAudio = a;
      const title = a.closest('.track')?.querySelector('h3')?.textContent || '';
      setNowPlaying(title.replace(/^\d+\.\s*/, ''));
      wireProgressFor(a);
      updateAnyPlayingFlag();
    });

    a.addEventListener('pause', () => {
      const b = getBtnForAudio(a);
      if (b) setBtnState(b, 'play');
      updateAnyPlayingFlag();
    });

    a.addEventListener('ended', () => {
      const b = getBtnForAudio(a);
      if (b) setBtnState(b, 'play');
      a.currentTime = 0;
      if (a === activeAudio) {
        timeCurEl.textContent = '0:00';
        seekEl.value = 0;
      }
      updateAnyPlayingFlag();
    });
  });

  // Seek com o range
  seekEl.addEventListener('input', () => {
    // mostrar posição enquanto se arrasta
    if (activeAudio && !seekEl.disabled) {
      timeCurEl.textContent = fmt(Number(seekEl.value));
    }
  });

  seekEl.addEventListener('mousedown', () => { isSeeking = true; });
  seekEl.addEventListener('touchstart', () => { isSeeking = true; }, { passive: true });

  const finishSeek = () => {
    if (activeAudio && !seekEl.disabled) {
      activeAudio.currentTime = Number(seekEl.value);
    }
    isSeeking = false;
  };
  seekEl.addEventListener('mouseup', finishSeek);
  seekEl.addEventListener('touchend', finishSeek);

  // Estado inicial
  setNowPlaying('—');
  clearProgress();
  updateAnyPlayingFlag();
});
