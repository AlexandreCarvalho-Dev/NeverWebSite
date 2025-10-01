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

    function isPlaying() {
      return !audio.paused && !audio.ended;
    }

    function updateBtnIcon() {
      // Suporta <img> ou texto no botão
      if (playBtn.tagName.toLowerCase() === "img") {
        playBtn.src = isPlaying() ? icons.pause : icons.play;
        playBtn.alt = isPlaying() ? "Pause Button" : "Play Button";
      } else {
        playBtn.textContent = isPlaying() ? "⏸" : "▶";
        playBtn.setAttribute("aria-label", isPlaying() ? "Pausar" : "Reproduzir");
      }
    }

    audio.addEventListener("loadedmetadata", () => {
      duration.textContent = formatTime(audio.duration);
      seek.max = String(audio.duration || 0);
      seek.disabled = false;
    });

    audio.addEventListener("timeupdate", () => {
      if (isUserSeeking) return; 
      seek.value = String(audio.currentTime || 0);
      current.textContent = formatTime(audio.currentTime || 0);
    });

    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      current.textContent = "0:00";
      seek.value = "0";
      updateBtnIcon();
    });

    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
      updateBtnIcon();
    });

    seek.addEventListener("input", () => {
      isUserSeeking = true;
      current.textContent = formatTime(Number(seek.value));
    });
    seek.addEventListener("change", () => {
      audio.currentTime = Number(seek.value);
      isUserSeeking = false;
    });

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        if (document.activeElement === seek) return;
        e.preventDefault();
        playBtn.click();
      }
    });

    seek.disabled = true;
    current.textContent = "0:00";
    duration.textContent = "0:00";
    updateBtnIcon();
  }

  function $(sel) { return document.querySelector(sel); }

  window.addEventListener("DOMContentLoaded", () => {
    setupAudioPlayer({
      audio: $("#audio"),
      playBtn: document.querySelector('.body-third img[alt="Play Button"]') || $(".play-btn"),
      seek: $(".seek"),
      current: $(".time.current"),
      duration: $(".time.duration"),
      icons: { play: "Assets/play.png", pause: "Assets/pause.png" }
    });
  });
})();
