document.addEventListener('DOMContentLoaded', () => {
  // ====== AUDIO PLAYER ======
  const audio = document.getElementById('audio');
  const btn   = document.querySelector('.play-btn');
  const bar   = document.querySelector('.bar');
  const cur   = document.getElementById('cur');
  const dur   = document.getElementById('dur');

  // Guards para evitar erros se algum elemento faltar
  if (!audio || !btn || !bar || !cur || !dur) {
    console.warn('Player: elementos em falta no DOM.');
  }

  // Altura da barra (se a tua CSS usa var(--h) e não definiu)
  if (bar && !getComputedStyle(bar).getPropertyValue('--h').trim()) {
    bar.style.setProperty('--h', '6px');
  }

  const fmt = s => {
    if (!isFinite(s)) return '0:00';
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
  };

  function setDurationIfReady() {
    if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
      dur.textContent = fmt(audio.duration);
    }
  }

  // Eventos de duração/metadata
  if (audio) {
    audio.addEventListener('loadedmetadata', setDurationIfReady);
    audio.addEventListener('durationchange', setDurationIfReady);
    audio.addEventListener('canplay', setDurationIfReady);
    if (audio.readyState >= 1) setDurationIfReady();

    // Atualização de tempo + barra
    function paintProgress(pct) {
      if (!bar) return;
      bar.style.background = `linear-gradient(#eee 0 0) 0/${pct}% 100% no-repeat, #333`;
    }

    audio.addEventListener('timeupdate', () => {
      cur.textContent = fmt(audio.currentTime);
      const p = (audio.currentTime / (audio.duration || 1)) * 100;
      if (bar) {
        bar.value = p;
        paintProgress(p);
      }
    });

    // Play/Pause
    function setBtnState(isPlaying) {
      btn.classList.toggle('is-playing', isPlaying);
      btn.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproduzir');
    }

    btn.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          await audio.play();
          setBtnState(true);
          // Qualquer clique no botão já é um gesto do utilizador:
          // aproveita para garantir que o vídeo de background arranca.
          tryPlayBg('from-audio-btn');
        } else {
          audio.pause();
          setBtnState(false);
        }
      } catch (err) {
        console.warn('Play de áudio falhou:', err);
      }
    });

    // Reset no fim da faixa
    audio.addEventListener('ended', () => {
      setBtnState(false);
      audio.currentTime = 0;
      cur.textContent = '0:00';
      if (bar) {
        bar.value = 0;
        paintProgress(0);
      }
    });

    // Seek na barra (input + change)
    function seekFromBar() {
      if (bar && isFinite(audio.duration)) {
        audio.currentTime = (bar.value / 100) * audio.duration;
      }
    }
    if (bar) {
      bar.addEventListener('input', seekFromBar);
      bar.addEventListener('change', seekFromBar);
      // pinta a 0% no início
      paintProgress(0);
    }

    // Tecla Espaço para play/pause (ignora se estiver num input/textarea)
    window.addEventListener('keydown', (e) => {
      const el = document.activeElement;
      const isTypingEl = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (isTypingEl) return;
      if (e.code === 'Space') { e.preventDefault(); btn.click(); }
    });
  }

  // ====== BACKGROUND VIDEO AUTOPLAY ROBUSTO ======
  const bgVideo = document.querySelector('.video-container video');

  function ensureVideoAttrs(v) {
    // Estes atributos têm de estar no elemento <video> para autoplay em iOS/Safari
    v.muted = true;
    v.playsInline = true;                 // JS
    v.setAttribute('playsinline', '');    // atributo para WebKit antigos
    v.autoplay = true;
    v.loop = true;
    try { v.preload = 'metadata'; } catch(_) {}
  }

  async function tryPlay(v, label = 'autoplay') {
    if (!v) return false;
    ensureVideoAttrs(v);
    try {
      const p = v.play();
      if (p && typeof p.then === 'function') await p;
      // ok
      return true;
    } catch (err) {
      console.warn(`[${label}] background video play falhou:`, err?.name || err);
      return false;
    }
  }

  function tryPlayBg(label) {
    if (!bgVideo) return;
    tryPlay(bgVideo, label);
  }

  // Tenta logo à entrada
  tryPlayBg('DOMContentLoaded');

  // Tenta de novo quando houver dados suficientes
  if (bgVideo) {
    bgVideo.addEventListener('canplay', () => tryPlayBg('canplay'), { once: true });

    // Fallback: primeira interação do utilizador (clique/tecla) destrava autoplay
    const onceUser = () => { tryPlayBg('user-gesture'); cleanup(); };
    const cleanup = () => {
      document.removeEventListener('pointerdown', onceUser, { capture: true });
      document.removeEventListener('keydown', onceUser, { capture: true });
    };
    document.addEventListener('pointerdown', onceUser, { capture: true });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') onceUser();
    }, { capture: true });

    // Se a aba voltar a ficar visível, tenta de novo
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && bgVideo.paused) {
        tryPlayBg('visibilitychange');
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // === AUTOPLAY ROBUSTO PARA O VÍDEO DE FUNDO ===
  const v = document.getElementById('bgv');

  function ensureAttrs(el){
    // garantir atributos críticos (Safari/iOS/Chrome)
    el.muted = true;
    el.autoplay = true;
    el.loop = true;
    el.playsInline = true;
    el.setAttribute('playsinline','');
    el.setAttribute('muted','');
    try { el.preload = 'metadata'; } catch(_) {}
  }

  ensureAttrs(v);

  // tenta tocar várias vezes em momentos “bons”
  let tries = 0;
  const MAX_TRIES = 6;

  async function tryPlay(label='autoplay'){
    if (!v) return;
    ensureAttrs(v);
    try {
      const p = v.play?.();
      if (p && typeof p.then === 'function') await p;
      // sucesso: remover listeners de fallback
      cleanup();
    } catch(e){
      // falhou: pode ser normal antes de canplay ou sem gesto do utilizador
      // tentamos de novo algumas vezes
      if (++tries <= MAX_TRIES) {
        setTimeout(tryPlay, 250);
      }
    }
  }

  // dispara já
  tryPlay('DOMContentLoaded');

  // quando estiver pronto para reproduzir, tenta de novo (ajuda no iOS)
  v.addEventListener('canplay', () => tryPlay('canplay'), { once:true });

  // se a aba voltar a ficar visível, tenta
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && v.paused) tryPlay('visibilitychange');
  });

  // 1ª interação do utilizador desbloqueia sempre
  const onFirstUserGesture = () => tryPlay('user-gesture');
  document.addEventListener('pointerdown', onFirstUserGesture, { capture:true, once:true });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') onFirstUserGesture();
  }, { capture:true, once:true });

  function cleanup(){
    document.removeEventListener('pointerdown', onFirstUserGesture, { capture:true });
    // o keydown foi registado com once:true, por isso auto-remove
  }

  // EXTRA: se tiveres algum botão (ex: do teu player), usa-o como gesto válido
  const audioBtn = document.querySelector('.play-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => tryPlay('audio-btn'), { once:true });
  }
});
