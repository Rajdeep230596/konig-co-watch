(() => {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const searchPanel = document.querySelector("[data-search-panel]");
  const story = document.querySelector("[data-story]");
  const video = document.getElementById("story-video");
  const progressBar = document.querySelector("[data-progress-bar]");
  const veil = document.querySelector("[data-veil]");
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const year = document.querySelector("[data-year]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (year) year.textContent = new Date().getFullYear();

  const setHeaderState = () => {
    header.classList.toggle("is-solid", window.scrollY > 80);
  };

  menuToggle?.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelector("[data-search-open]")?.addEventListener("click", () => {
    searchPanel.hidden = !searchPanel.hidden;
    if (!searchPanel.hidden) searchPanel.querySelector("input")?.focus();
  });

  document.querySelector("[data-search-close]")?.addEventListener("click", () => {
    searchPanel.hidden = true;
  });

  document.querySelector("[data-newsletter]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.querySelector("button").textContent = "Joined";
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-selected", String(item === button));
      });
      document.querySelectorAll("[data-product-grid] .product").forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.cat !== filter;
      });
    });
  });

  const storyProgress = () => {
    const rect = story.getBoundingClientRect();
    const scrollable = Math.max(story.offsetHeight - window.innerHeight, 1);
    return Math.min(1, Math.max(0, -rect.top / scrollable));
  };

  const BANNER_WINDOWS = [
    { start: 0, peak: 0.06, end: 0.4 },
    { start: 0.28, peak: 0.5, end: 0.74 },
    { start: 0.62, peak: 0.84, end: 1 },
  ];

  const bannerWeight = (progress, { start, peak, end }) => {
    if (progress <= start || progress >= end) return 0;
    if (progress < peak) return (progress - start) / Math.max(peak - start, 0.001);
    return (end - progress) / Math.max(end - peak, 0.001);
  };

  const setChapter = (index) => {
    chapters.forEach((chapter, i) => {
      chapter.classList.toggle("is-active", i === index);
    });
  };

  let duration = 0;
  let targetTime = 0;
  let displayTime = 0;
  let seeking = false;
  let lastChapter = -1;
  let lastProgress = -1;

  const sizeStoryToVideo = () => {
    if (!duration) return;
    const screens = 1 + duration * 90;
    story.style.height = `${screens}vh`;
  };

  const applyVisuals = (progress) => {
    if (Math.abs(progress - lastProgress) < 0.0004) return;
    lastProgress = progress;

    if (progressBar) progressBar.style.width = `${progress * 100}%`;
    if (veil) veil.style.opacity = String(0.55 + progress * 0.2);

    const weights = BANNER_WINDOWS.map((window) => bannerWeight(progress, window));
    const strongest = weights.indexOf(Math.max(...weights));
    if (strongest !== lastChapter) {
      lastChapter = strongest;
      setChapter(strongest);
    }
  };

  const frame = () => {
    const progress = storyProgress();
    applyVisuals(progress);
    setHeaderState();

    if (duration && !reduceMotion) {
      targetTime = progress * duration;
      const catchUp = progress <= 0.002 || progress >= 0.998 ? 1 : 0.32;
      displayTime += (targetTime - displayTime) * catchUp;
      displayTime = Math.min(duration, Math.max(0, displayTime));

      if (!seeking && Math.abs(video.currentTime - displayTime) > 0.02) {
        seeking = true;
        video.currentTime = displayTime;
      }
    }

    requestAnimationFrame(frame);
  };

  const armVideo = async () => {
    duration = video.duration || 0;
    sizeStoryToVideo();
    video.pause();
    try {
      await video.play();
      video.pause();
    } catch {
      /* Autoplay can be blocked until a gesture; scrubbing still works. */
    }
    video.currentTime = 0;
    displayTime = 0;
  };

  if (video) {
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.addEventListener("loadedmetadata", armVideo);
    if (video.readyState >= 1) armVideo();
    video.addEventListener("seeked", () => {
      seeking = false;
    });

    if (reduceMotion) {
      video.loop = true;
      video.play().catch(() => {});
    }
  }

  requestAnimationFrame(frame);
  setChapter(0);
})();
