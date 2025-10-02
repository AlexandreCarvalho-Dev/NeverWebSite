(() => {
  function formatTime(sec) {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  // procura o primeiro elemento que existir entre várias opções
  const pick = (arr) => arr.map(s => document.querySelector(s)).find(Boolean);

  function setupAudioPlayer({ audio, playBtn, seek, current, duration, icons }) {
    if (!audio || !playBtn || !seek || !current || !duration) {
      console.warn("Player: elemento(s) em falta", { audio, playBtn, seek, current, duration });
      return;
    }

    let isUserSeeking = false;

    const getBtnImg = () =>
      playBtn.tagName.toLowerCase() === "img" ? playBtn : playBtn.querySelector("img");

    const isPlaying = () => !audio.paused && !audio.ended;

    function updateBtnIcon() {
      const img = getBtnImg();
      if (img) {
        img.src = isPlaying() ? icons.pause : icons.play;
      }
      // acessibilidade + fallback para botões “CSS-only”
      playBtn.setAttribute("aria-label", isPlaying() ? "Pausar" : "Reproduzir");
      playBtn.classList.toggle("is-playing", isPlaying());
    }

    // Metadados
    function setDurationIfReady() {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        duration.textContent = formatTime(audio.duration);
        seek.max = String(audio.duration);
        seek.disabled = false;
      }
    }
    audio.addEventListener("loadedmetadata", setDurationIfReady);
    audio.addEventListener("durationchange", setDurationIfReady);
    if (audio.readyState >= 1) setDurationIfReady();

    // Progresso
    audio.addEventListener("timeupdate", () => {
      if (isUserSeeking) return;
      const t = audio.currentTime || 0;
      seek.value = String(t);
      current.textContent = formatTime(t);
    });

    // Estado → ícone
    audio.addEventListener("play", updateBtnIcon);
    audio.addEventListener("pause", updateBtnIcon);
    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      current.textContent = "0:00";
      seek.value = "0";
      updateBtnIcon();
    });

    // Play/Pause
    playBtn.addEventListener("click", async () => {
      try {
        if (audio.paused) await audio.play();
        else audio.pause();
      } catch (e) {
        console.warn("Erro ao reproduzir áudio:", e);
      }
    });

    // Seek
    seek.addEventListener("input", () => {
      isUserSeeking = true;
      current.textContent = formatTime(Number(seek.value));
    });
    seek.addEventListener("change", () => {
      audio.currentTime = Number(seek.value);
      isUserSeeking = false;
    });

    // Tecla espaço (ignora quando o foco está no range)
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

  window.addEventListener("DOMContentLoaded", () => {
    setupAudioPlayer({
      // aceita várias convenções de IDs/classes
      audio:   pick(["#audio", "audio"]),
      playBtn: pick(["#playBtn", ".play-btn", 'button[aria-label="Reproduzir"]']),
      seek:    pick([".seek", "#seek", ".bar", 'input[type="range"]']),
      current: pick([".time.current", "#cur"]),
      duration:pick([".time.duration", "#dur"]),
      icons: { play: "Assets/play.png", pause: "Assets/pause.png" }
    });
  });
})();
