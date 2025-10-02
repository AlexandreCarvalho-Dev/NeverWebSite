(() => {
  function formatTime(sec) {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  function setupAudioPlayer({ audio, playBtn, seek, current, duration, icons }) {
    if (!audio || !playBtn || !seek || !current || !duration) return;

    let isUserSeeking = false;

    const getBtnImg = () =>
      playBtn.tagName.toLowerCase() === "img" ? playBtn : playBtn.querySelector("img");

    function isPlaying() {
      return !audio.paused && !audio.ended;
    }

    function updateBtnIcon() {
      const img = getBtnImg();
      if (img) {
        img.src = isPlaying() ? icons.pause : icons.play;
      } else {
        playBtn.textContent = isPlaying() ? "⏸" : "▶";
        playBtn.setAttribute("aria-label", isPlaying() ? "Pausar" : "Reproduzir");
      }
    }

    // Metadados carregados: define duração e ativa seek
    audio.addEventListener("loadedmetadata", () => {
      duration.textContent = formatTime(audio.duration);
      seek.max = String(audio.duration || 0);
      seek.disabled = false;
    });

    // Atualiza a barra/tempo corrente
    audio.addEventListener("timeupdate", () => {
      if (isUserSeeking) return;
      seek.value = String(audio.currentTime || 0);
      current.textContent = formatTime(audio.currentTime || 0);
    });

    // Atualiza ícone quando o estado real muda
    audio.addEventListener("play", updateBtnIcon);
    audio.addEventListener("pause", updateBtnIcon);

    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      current.textContent = "0:00";
      seek.value = "0";
      updateBtnIcon();
    });

    // Click Play/Pause
    playBtn.addEventListener("click", async () => {
      try {
        if (audio.paused) await audio.play();
        else audio.pause();
      } catch (e) {
        console.warn("Erro ao reproduzir áudio:", e);
      }
    });

    // Interação com o seek
    seek.addEventListener("input", () => {
      isUserSeeking = true;
      current.textContent = formatTime(Number(seek.value));
    });
    seek.addEventListener("change", () => {
      audio.currentTime = Number(seek.value);
      isUserSeeking = false;
    });

    // Tecla Espaço (evita conflito quando o foco está no range)
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        if (document.activeElement === seek) return;
        e.preventDefault();
        playBtn.click();
      }
    });

    // Estado inicial
    seek.disabled = true;
    current.textContent = "0:00";
    duration.textContent = "0:00";
    updateBtnIcon();
  }

  function $(sel) { return document.querySelector(sel); }

  window.addEventListener("DOMContentLoaded", () => {
    setupAudioPlayer({
      audio: $("#audio"),
      playBtn: $("#playBtn"),
      seek: $(".seek"),
      current: $(".time.current"),
      duration: $(".time.duration"),
      icons: { play: "Assets/play.png", pause: "Assets/pause.png" }
    });
  });
})();
