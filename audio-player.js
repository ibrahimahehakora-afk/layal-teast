// audio-player.js - نسخة محسّنة: دعم Modal أو مشغل ثابت، معالجة مسارات بها مسافات، وفحص عناصر مع رسائل Debug
// مضاف: ضبط أبعاد الغلاف ليتوافق مع أبعاد الصورة الحقيقية مع قيود الحاوية

// ====== تعريف قائمة الأغاني - عدّل المسارات والأسماء كما تريد ======
const tracks = [
  { src: "music/1.mp3", title: "دق دق", artist: "ليال عبود", cover: "images/Screenshot 2026-05-21 164904.png" },
  { src: "music/خشخش حديد المهرة(MP3_160K).mp3", title: "خش خش حديد المهرة", artist: "ليال عبود", cover: "images/اساسي.png" },
  { src: "music/مغنج(MP3_160K).mp3", title: "مغنج", artist: "ليال عبود", cover: "images/مغنج.png" },
  { src: "music/أحلى زفة(MP3_160K).mp3", title: "أحلى زفة", artist: "ليال عبود", cover: "images/احلى زفة.png" },
  { src: "music/حاضر يا مستر(MP3_160K).mp3", title: "حاضر يا مستر", artist: "ليال عبود", cover: "images/اساسي.png" },
  { src: "music/تحرق وقت(MP3_160K).mp3", title: "تحرق وقت", artist: "ليال عبود", cover: "images/اساسي.png" },
  { src: "music/دنية عجايب(MP3_160K).mp3", title: "دنية عجايب", artist: "ليال عبود", cover: "images/OIP.png" },
  { src: "music/يا أنا يا أنا.mp3", title: "يا أنا يا أنا", artist: "ليال عبود", cover: "images/اساسي.png" },
  { src: "music/ليال عبود - ورصاص(MP3_160K).mp3", title: "ورصاص", artist: "ليال عبود", cover: "images/اساسي.png" },
  { src: "music/يا ويلك(MP3_160K).mp3", title: "يا ويلك", artist: "ليال عبود", cover: "images/ياويلك.png" },
  { src: "music/أسمر(MP3_160K).mp3", title: "أسمر", artist: "ليال عبود", cover: "images/اساسي.png" },


];

// ====== مساعدة لتحويل المسارات التي تحتوي مسافات أو أحرف خاصة ======
function safeUrl(path) {
  try {
    return encodeURI(path);
  } catch (e) {
    console.warn("audio-player: فشل ترميز المسار", path, e);
    return path;
  }
}

document.addEventListener("DOMContentLoaded", () => {

  // محاولة العثور على عناصر المشغل داخل Modal أولاً ثم الرجوع للمشغل الثابت
  const coversGrid = document.getElementById("coversGrid");
  const playerModal = document.getElementById("playerModal");
  const closeModal = document.getElementById("closeModal");
  const isMusicPage = window.location.pathname.split("/").pop().toLowerCase() === "music.html";
  const hasAudioUI = !!playerModal || !!coversGrid || !!document.getElementById("playlist");
  const storageKey = "audioPlayerState";

  function loadPlayerState() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("audio-player: خطأ في قراءة حالة التخزين المحلي", e);
      return null;
    }
  }

  function savePlayerState() {
    try {
      const state = {
        currentIndex,
        currentTime: audio?.currentTime || 0,
        isPlaying,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn("audio-player: خطأ في حفظ حالة المشغل", e);
    }
  }

  const savedPlayerState = loadPlayerState();
  const modalCover = hasAudioUI ? document.getElementById("modalCover") : null;
  const playerCover = hasAudioUI ? document.getElementById("playerCover") : null;
  const coverEl = modalCover || playerCover || null;

  const modalTitle = hasAudioUI ? document.getElementById("modalTitle") : null;
  const trackTitle = hasAudioUI ? (document.getElementById("track-title") || modalTitle) : null;

  const modalArtist = hasAudioUI ? document.getElementById("modalArtist") : null;
  const trackArtist = hasAudioUI ? (document.getElementById("track-artist") || modalArtist) : null;

  const playBtn = hasAudioUI ? document.getElementById("playBtn") : null;
  const prevBtn = hasAudioUI ? document.getElementById("prevBtn") : null;
  const restartBtn = hasAudioUI ? document.getElementById("restartBtn") : null;
  const nextBtn = hasAudioUI ? document.getElementById("nextBtn") : null;
  const progress = hasAudioUI ? document.getElementById("progress") : null;
  const currentTimeEl = hasAudioUI ? document.getElementById("currentTime") : null;
  const durationEl = hasAudioUI ? document.getElementById("duration") : null;
  const volumeEl = hasAudioUI ? document.getElementById("volume") : null;
  const playlistEl = hasAudioUI ? document.getElementById("playlist") : null;
  const upNextList = hasAudioUI ? document.getElementById("upNextList") : null;
  const shuffleBtn = hasAudioUI ? document.getElementById("shuffleBtn") : null;
  const repeatBtn = hasAudioUI ? document.getElementById("repeatBtn") : null;


  // Debug: تحقق من العناصر الأساسية
  const pageHasPlayerUI = !!playerModal || !!coversGrid || !!playlistEl;
  if (pageHasPlayerUI) {
    const required = { playBtn, prevBtn, nextBtn, restartBtn, progress, currentTimeEl, durationEl, volumeEl };
    Object.entries(required).forEach(([k, v]) => {
      if (!v) console.warn(`audio-player: العنصر مفقود -> ${k}`);
      else console.log(`audio-player: وجدنا العنصر -> ${k}`);
    });
    if (!coverEl) console.warn("audio-player: لا يوجد عنصر غلاف (modalCover أو playerCover).");
  } else {
    console.log("audio-player: لا توجد واجهة مشغل كاملة في هذه الصفحة؛ يعمل المشغل الطافي فقط.");
  }

  // كائن الصوت والحالة
  const audio = new Audio();
  let currentIndex = savedPlayerState?.currentIndex ?? 0;
  let isPlaying = savedPlayerState?.isPlaying || false;
  let isShuffle = false;
  let isRepeat = false;
  let shuffleQueue = [];
  let shufflePosition = 0;

  // بناء شبكة الأغلفة إن وُجدت
  if (coversGrid) {
    tracks.forEach((t, i) => {
      const el = document.createElement("div");
      el.className = "cover-item";
      el.dataset.index = i;
      const img = document.createElement("img");
      img.src = safeUrl(t.cover || "images/اساسي.png");
      img.alt = t.title || "cover";
      img.loading = "lazy";
      const title = document.createElement("div");
      title.className = "title";
      title.textContent = t.title || "";
      el.appendChild(img);
      el.appendChild(title);
      el.addEventListener("click", () => openPlayerWith(i));
      coversGrid.appendChild(el);
    });
  }

  // بناء قائمة التشغيل الجانبية (إذا وُجدت)
  if (playlistEl) {
    playlistEl.innerHTML = "";
    tracks.forEach((t, i) => {
      const div = document.createElement("div");
      div.className = "item";
      div.dataset.index = i;
      div.innerHTML = `<span>${t.title}</span><small>${t.artist}</small>`;
      div.addEventListener("click", () => {
        loadTrack(i);
        playTrack();
        if (playerModal) openModal();
      });
      playlistEl.appendChild(div);
    });
  }

  // تحديث حالة الواجهة لقائمة التشغيل و upNext
  function updatePlaylistUI() {
    const list = playlistEl ? playlistEl.querySelectorAll(".item") : [];
    list.forEach(el => el.classList.toggle("active", Number(el.dataset.index) === currentIndex));
    if (upNextList) {
      upNextList.innerHTML = "";
      const order = generateQueue(currentIndex, isShuffle);
      order.slice(1).forEach((idx, pos) => {
        const t = tracks[idx];
        const row = document.createElement("div");
        row.className = "upnext-item";
        row.dataset.idx = pos + 1;
        row.innerHTML = `<span>${t.title}</span><small>${t.artist}</small>`;
        row.addEventListener("click", () => {
          currentIndex = idx;
          loadTrack(currentIndex);
          playTrack();
        });
        upNextList.appendChild(row);
      });
      // تمييز العنصر التالي (إن وُجد)
      const first = upNextList.querySelector(".upnext-item");
      if (first) first.classList.add("active");
    }
  }


  function minimizePlayer() {
    if (!playerModal) return;
    playerModal.classList.remove("showing");
    playerModal.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", escCloseHandler);
    setTimeout(() => {
      if (playerModal) playerModal.classList.add("hidden");
    }, 420);
  }

  // ====== دالة ضبط الغلاف مع قياس الأبعاد الحقيقية وتطبيق قيود الحاوية ======
  function setCoverSmooth(newSrc) {
    if (!coverEl) return;
    const encoded = safeUrl(newSrc);

    // عنصر مؤقت لتحميل الصورة ومعرفة أبعادها الحقيقية
    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // تحديد الحاوية المتاحة (نستخدم الحاوية الأب للمؤشر أو body كاحتياط)
      const container = coverEl.parentElement || document.body;
      const containerStyle = window.getComputedStyle(container);
      const paddingLeft = parseFloat(containerStyle.paddingLeft || 0);
      const paddingRight = parseFloat(containerStyle.paddingRight || 0);
      const containerWidth = Math.min(container.clientWidth - (paddingLeft + paddingRight), window.innerWidth * 0.95);

      // قيود CSS إضافية (تتوافق مع max-width/max-height في CSS)
      const cssMaxHeight = parseFloat(window.getComputedStyle(coverEl).maxHeight) || (window.innerHeight * 0.6);
      const cssMaxWidth = parseFloat(window.getComputedStyle(coverEl).maxWidth) || containerWidth;

      // حساب الأبعاد النهائية مع الحفاظ على النسبة
      let finalW = naturalW;
      let finalH = naturalH;
      // قيود العرض
      if (finalW > cssMaxWidth) {
        const ratio = cssMaxWidth / finalW;
        finalW = Math.floor(finalW * ratio);
        finalH = Math.floor(finalH * ratio);
      }
      // قيود الارتفاع
      if (finalH > cssMaxHeight) {
        const ratio = cssMaxHeight / finalH;
        finalW = Math.floor(finalW * ratio);
        finalH = Math.floor(finalH * ratio);
      }

      // تطبيق الفايد ثم تبديل المصدر وضبط الأبعاد inline
      coverEl.classList.add("fade-out");
      setTimeout(() => {
        coverEl.src = encoded;
        // نطبق الأبعاد النهائية بصيغة CSS inline لتظهر بالحجم الطبيعي أو المصغّر
        coverEl.style.width = finalW + "px";
        coverEl.style.height = finalH + "px";
        coverEl.style.maxWidth = "100%";
        coverEl.style.objectFit = "contain";
        coverEl.classList.remove("fade-out");
      }, 180);
    };

    img.onerror = () => {
      console.warn("audio-player: فشل تحميل غلاف:", newSrc);
      // إذا فشل التحميل، نعيد إلى المصدر مباشرة ونمسح الأبعاد inline لترك CSS يتولى العرض
      coverEl.src = encoded;
      coverEl.style.width = "";
      coverEl.style.height = "";
    };

    img.src = encoded;
  }

  // تحميل تراك محدد
  function loadTrack(index, startTime = 0) {
    if (!tracks[index]) {
      console.error("audio-player: محاولة تحميل تراك غير موجود index=", index);
      return;
    }
    currentIndex = index;
    audio.src = safeUrl(tracks[index].src);
    if (startTime) {
      audio.currentTime = startTime;
    }
    if (trackTitle) trackTitle.textContent = tracks[index].title || "بدون عنوان";
    if (trackArtist) trackArtist.textContent = tracks[index].artist || "";
    const coverPath = tracks[index].cover && tracks[index].cover.trim() !== "" ? tracks[index].cover : "images/اساسي.png";
    setCoverSmooth(coverPath);
    if (isShuffle) resetShuffleQueue();
    updatePlaylistUI();
    console.log(`audio-player: تم تحميل التراك ${index} -> ${tracks[index].src}`);
  }

  function resetShuffleQueue() {
    shuffleQueue = generateQueue(currentIndex, true);
    shufflePosition = shuffleQueue.indexOf(currentIndex);
    if (shufflePosition === -1) shufflePosition = 0;
  }

  function getNextIndex() {
    if (!isShuffle) {
      return (currentIndex + 1) % tracks.length;
    }

    if (!shuffleQueue.length || shuffleQueue[shufflePosition] !== currentIndex) {
      resetShuffleQueue();
    }

    shufflePosition = (shufflePosition + 1) % shuffleQueue.length;
    return shuffleQueue[shufflePosition];
  }

  // تشغيل / إيقاف
  function playTrack() {
    if (!audio.src) loadTrack(currentIndex);
    audio.play().then(() => {
      isPlaying = true;
      if (playBtn) playBtn.textContent = "⏸";
    }).catch(err => {
      console.warn("audio-player: لم يتم تشغيل الصوت تلقائياً (مطلوب تفاعل المستخدم).", err);
      if (playBtn) playBtn.textContent = "▶";
    });
  }

  function pauseTrack() {
    audio.pause();
    isPlaying = false;
    if (playBtn) playBtn.textContent = "▶";
  }

  // أحداث الأزرار
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (!audio.src) loadTrack(currentIndex);
      if (isPlaying) pauseTrack(); else playTrack();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (audio.currentTime > 3) {
        audio.currentTime = 0;
      } else {
        currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentIndex);
        playTrack();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentIndex = getNextIndex();
      loadTrack(currentIndex);
      playTrack();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      audio.currentTime = 0;
      playTrack();
    });
  }

  // تحديث الوقت وشريط التقدم
  audio.addEventListener("timeupdate", () => {
    if (audio.duration && progress) {
      const percent = (audio.currentTime / audio.duration) * 100;
      progress.value = percent;
      if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
      if (durationEl) durationEl.textContent = formatTime(audio.duration);
    }
  });

  if (progress) {
    progress.addEventListener("input", (e) => {
      if (audio.duration) {
        const seekTime = (e.target.value / 100) * audio.duration;
        audio.currentTime = seekTime;
      }
    });
  }

  // مستوى الصوت
  if (volumeEl) {
    audio.volume = parseFloat(volumeEl.value) || 0.9;
    volumeEl.addEventListener("input", (e) => {
      audio.volume = parseFloat(e.target.value);
    });
  } else {
    audio.volume = 0.9;
  }

  // عند انتهاء التراك
  audio.addEventListener("ended", () => {
    if (isRepeat) {
      audio.currentTime = 0;
      playTrack();
    } else if (isShuffle) {
      currentIndex = getNextIndex();
      loadTrack(currentIndex);
      playTrack();
    } else {
      if (nextBtn) nextBtn.click();
    }
  });

  // شفل وريبِت
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      isShuffle = !isShuffle;
      shuffleBtn.style.opacity = isShuffle ? "1" : "0.6";
      shuffleBtn.classList.toggle("active", isShuffle);
      if (isShuffle) {
        resetShuffleQueue();
      } else {
        shuffleQueue = [];
        shufflePosition = 0;
      }
      updatePlaylistUI();
      console.log("audio-player: shuffle =", isShuffle);
    });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      isRepeat = !isRepeat;
      repeatBtn.style.opacity = isRepeat ? "1" : "0.6";
      repeatBtn.classList.toggle("active", isRepeat);
      console.log("audio-player: repeat =", isRepeat);
    });
  }

  // تنسيق الوقت
  function formatTime(sec) {
    const m = Math.floor(sec / 60) || 0;
    const s = Math.floor(sec % 60) || 0;
    return `${m}:${s < 10 ? "0" + s : s}`;
  }

  // فتح الـModal وبناء قائمة التشغيل التالية عشوائياً عند الطلب
  function openPlayerWith(index) {
    if (playerModal) {
      const rest = tracks.map((_, i) => i).filter(i => i !== index);
      shuffleArray(rest);
      currentIndex = index;
      loadTrack(currentIndex);
      updatePlaylistUI();
      openModal();
      playTrack();
    } else {
      currentIndex = index;
      loadTrack(currentIndex);
      playTrack();
    }
  }

  function openModal() {
    if (!playerModal) return;
    playerModal.classList.remove("hidden");
    void playerModal.offsetWidth;
    playerModal.classList.add("showing");
    playerModal.setAttribute("aria-hidden", "false");
    document.addEventListener("keydown", escCloseHandler);
  }

  function closeModalHandler() {
    if (!playerModal) return;
    pauseTrack();
    playerModal.classList.remove("showing");
    playerModal.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", escCloseHandler);
    setTimeout(() => {
      if (playerModal) playerModal.classList.add("hidden");
    }, 420);
  }

  function escCloseHandler(e) {
    if (e.key === "Escape") closeModalHandler();
  }

  if (closeModal) closeModal.addEventListener("click", closeModalHandler);

  // دالة مساعدة لتوليد ترتيب (queue)
  function generateQueue(startIndex, shuffle) {
    const indices = tracks.map((_, i) => i);
    if (!shuffle) {
      const ordered = indices.slice(startIndex).concat(indices.slice(0, startIndex));
      return ordered;
    }
    const rest = indices.filter(i => i !== startIndex);
    shuffleArray(rest);
    return [startIndex, ...rest];
  }

  // دالة مساعدة لخلط المصفوفة
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // تحميل أول تراك بدون تشغيل تلقائي
  if (tracks.length > 0) {
    loadTrack(currentIndex, savedPlayerState?.currentTime || 0);
  } else {
    if (tracks.length === 0) {
      console.warn("audio-player: لا توجد تراكات في المصفوفة tracks.");
    }
  }

  // فحص HEAD لمسار التراك الأول (يعمل فقط عبر سيرفر HTTP/HTTPS)
  (function headCheck() {
    if (!tracks[0] || !tracks[0].src) return;
    try {
      fetch(safeUrl(tracks[0].src), { method: 'HEAD' })
        .then(res => {
          console.log("audio-player: فحص HEAD", tracks[0].src, "status:", res.status);
          if (!res.ok) console.warn("audio-player: الملف قد يكون مفقوداً أو المسار غير صحيح.");
        })
        .catch(err => console.warn("audio-player: خطأ أثناء فحص المسار (HEAD):", err));
    } catch (e) {
      console.warn("audio-player: فحص HEAD غير متاح في هذه البيئة.", e);
    }
  })();

}); // نهاية DOMContentLoaded
