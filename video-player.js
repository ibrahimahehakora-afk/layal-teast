// video-player.js
// مشغّل فيديو عصري — استخدم هذا الملف مع vid.css و HTML الذي يحتوي العناصر ذات الـ IDs المذكورة.

// ====== مكتبة الفيديوهات ======
const videoLibrary = [
  {
    title: "قلبك معي",
    description: "الفيديو الرسمي الجديد لليال عبود يتضمن إطلالة سينمائية وقصة حب درامية.",
    cover: "images/OIP.png",
    src: "VID/Screen Recording 2026-05-21 194628.mp4"
  },
  {
    title: "ليال لايف",
    description: "عرض حي من الحفلات الأخيرة، مع أجواء حماسية ومشاهد خلف الكواليس.",
    cover: "images/ياويلك.png",
    src: "VID/Screen Recording 2026-05-21 194628.mp4"
  },
  {
    title: "كواليس الإنتاج",
    description: "نظرة خلف الكواليس على تصوير كليب جديد والعمل مع فريق الإنتاج.",
    cover: "images/اساسي.png",
    src: "VID/Screen Recording 2026-05-21 194628.mp4"
  }
];

let currentVideoIndex = 0;
let currentSpeed = 1;

function safeUrl(path) {
  try { return encodeURI(path); } catch (e) { return path; }
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" + s : s}`;
}

function formatVideoCard(item, index, elements) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "video-card";
  card.innerHTML = `
    <img src="${safeUrl(item.cover)}" alt="${item.title}">
    <div class="card-body">
      <h4>${item.title}</h4>
      <p>${item.description}</p>
    </div>
  `;
  card.addEventListener("click", () => {
    showPlayer(elements);
    loadVideo(index, true, elements);
  });
  return card;
}

function updatePlayIcon(mainVideo, playBtn) {
  if (!playBtn || !mainVideo) return;
  playBtn.innerHTML = mainVideo.paused ? "▶" : "⏸";
}

function updateMuteIcon(mainVideo, muteBtn) {
  if (!muteBtn || !mainVideo) return;
  muteBtn.innerHTML = mainVideo.muted ? "🔇" : "🔊";
}

function updateProgressFill(progressBar, percent) {
  if (!progressBar) return;
  progressBar.style.setProperty("--progress", `${percent}%`);
}

function toggleCinemaMode(cinemaBtn) {
  document.body.classList.toggle("cinema-mode");
  if (cinemaBtn) cinemaBtn.classList.toggle("active");
}

function enterFullscreen(mainVideo) {
  if (!mainVideo) return;
  const container = mainVideo.closest(".video-frame") || mainVideo.parentElement;
  if (!container) return;
  if (!document.fullscreenElement) container.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
}

function showPlayer(elements) {
  if (!elements || !elements.videoPlayerCard) return;
  elements.videoPlayerCard.classList.remove("hidden");
}

function bindVideoEvents(elements) {
  const {
    mainVideo,
    playBtn,
    muteBtn,
    skipForward,
    skipBackward,
    speedBtn,
    cinemaBtn,
    fullscreenBtn,
    progressBar,
    currentTimeEl,
    durationEl
  } = elements;

  if (playBtn && mainVideo) {
    playBtn.addEventListener("click", () => {
      if (mainVideo.paused) mainVideo.play();
      else mainVideo.pause();
      updatePlayIcon(mainVideo, playBtn);
    });
  }

  if (muteBtn && mainVideo) {
    muteBtn.addEventListener("click", () => {
      mainVideo.muted = !mainVideo.muted;
      updateMuteIcon(mainVideo, muteBtn);
    });
  }

  if (skipForward && mainVideo) {
    skipForward.addEventListener("click", () => {
      if (!mainVideo.duration) return;
      mainVideo.currentTime = Math.min(mainVideo.duration, mainVideo.currentTime + 10);
    });
  }

  if (skipBackward && mainVideo) {
    skipBackward.addEventListener("click", () => {
      mainVideo.currentTime = Math.max(0, mainVideo.currentTime - 10);
    });
  }

  if (speedBtn && mainVideo) {
    const speeds = [1, 1.25, 1.5, 2];
    currentSpeed = mainVideo.playbackRate || 1;
    speedBtn.addEventListener("click", () => {
      currentSpeed = speeds[(speeds.indexOf(currentSpeed) + 1) % speeds.length];
      mainVideo.playbackRate = currentSpeed;
      speedBtn.textContent = currentSpeed + "x";
    });
  }

  if (cinemaBtn) {
    cinemaBtn.addEventListener("click", () => toggleCinemaMode(cinemaBtn));
  }

  if (fullscreenBtn && mainVideo) {
    fullscreenBtn.addEventListener("click", () => enterFullscreen(mainVideo));
  }

  if (progressBar && mainVideo) {
    progressBar.addEventListener("input", (event) => {
      const value = Number(event.target.value);
      const time = (value / 100) * mainVideo.duration;
      if (!Number.isNaN(time) && currentTimeEl) {
        currentTimeEl.textContent = formatTime(time);
      }
      updateProgressFill(progressBar, value);
    });

    progressBar.addEventListener("change", (event) => {
      const value = Number(event.target.value);
      const time = (value / 100) * mainVideo.duration;
      if (!Number.isNaN(time)) mainVideo.currentTime = time;
    });
  }

  if (mainVideo) {
    mainVideo.addEventListener("timeupdate", () => {
      if (!mainVideo.duration) return;
      const percent = (mainVideo.currentTime / mainVideo.duration) * 100;
      if (progressBar) {
        progressBar.value = percent;
        updateProgressFill(progressBar, percent);
      }
      if (currentTimeEl) currentTimeEl.textContent = formatTime(mainVideo.currentTime);
      if (durationEl) durationEl.textContent = formatTime(mainVideo.duration);
    });

    mainVideo.addEventListener("loadedmetadata", () => {
      if (durationEl && mainVideo.duration) durationEl.textContent = formatTime(mainVideo.duration);
    });

    mainVideo.addEventListener("play", () => updatePlayIcon(mainVideo, elements.playBtn));
    mainVideo.addEventListener("pause", () => updatePlayIcon(mainVideo, elements.playBtn));

    mainVideo.addEventListener("ended", () => {
      if (currentVideoIndex < videoLibrary.length - 1) loadVideo(currentVideoIndex + 1, false, elements);
      else {
        mainVideo.currentTime = 0;
        mainVideo.pause();
      }
      updatePlayIcon(mainVideo, elements.playBtn);
    });

    mainVideo.addEventListener("error", () => {
      console.error("حدث خطأ أثناء تحميل الفيديو:", mainVideo.currentSrc || mainVideo.src);
      alert("تعذر تحميل الفيديو. تحقق من المسار أو جرب فيديو آخر.");
    });
  }
}

function loadVideo(index, autoPlay = true, elements) {
  const video = videoLibrary[index];
  if (!video || !elements || !elements.mainVideo) return;

  const {
    mainVideo,
    videoTitle,
    videoDescription,
    videoOverlayTitle,
    progressBar,
    currentTimeEl,
    durationEl
  } = elements;

  currentVideoIndex = index;
  mainVideo.src = safeUrl(video.src);
  if (video.cover) mainVideo.poster = safeUrl(video.cover);
  if (videoTitle) videoTitle.textContent = video.title || "";
  if (videoDescription) videoDescription.textContent = video.description || "";
  if (videoOverlayTitle) videoOverlayTitle.textContent = video.title || "شاهد الآن";

  document.querySelectorAll(".video-card").forEach((card, cardIndex) => {
    card.classList.toggle("active", cardIndex === index);
  });

  if (progressBar) {
    progressBar.value = 0;
    updateProgressFill(progressBar, 0);
  }
  if (currentTimeEl) currentTimeEl.textContent = "0:00";
  if (durationEl) durationEl.textContent = "0:00";

  mainVideo.load();
  if (autoPlay) {
    const promise = mainVideo.play();
    if (promise && typeof promise.catch === "function") promise.catch(() => updatePlayIcon(mainVideo, elements.playBtn));
  }
}

function renderVideoLibrary(elements) {
  if (!elements || !elements.videoList) return;
  
  elements.videoList.innerHTML = "";
  videoLibrary.forEach((video, index) => {
    const card = formatVideoCard(video, index, elements);
    elements.videoList.appendChild(card);
  });

  // حمّل الفيديو الأول تلقائياً
  if (videoLibrary.length > 0) {
    loadVideo(0, false, elements);
  }
}

function initVideoPlayer() {
  const elements = {
    mainVideo: document.getElementById("mainVideo"),
    videoTitle: document.getElementById("videoTitle"),
    videoDescription: document.getElementById("videoDescription"),
    videoOverlayTitle: document.getElementById("videoOverlayTitle"),
    videoList: document.getElementById("videoList"),
    videoPlayerCard: document.getElementById("videoPlayerCard"),
    playBtn: document.getElementById("playBtn"),
    muteBtn: document.getElementById("muteBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    cinemaBtn: document.getElementById("cinemaBtn"),
    skipForward: document.getElementById("skipForward"),
    skipBackward: document.getElementById("skipBackward"),
    speedBtn: document.getElementById("speedBtn"),
    progressBar: document.getElementById("progressBar"),
    currentTimeEl: document.getElementById("currentTime"),
    durationEl: document.getElementById("duration")
  };

  if (!elements.mainVideo || !elements.videoList) {
    console.warn("مكونات المشغّل الأساسية مفقودة.");
    return;
  }

  bindVideoEvents(elements);
  renderVideoLibrary(elements);
  updateMuteIcon(elements.mainVideo, elements.muteBtn);
  updatePlayIcon(elements.mainVideo, elements.playBtn);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initVideoPlayer);
} else {
  initVideoPlayer();
}
