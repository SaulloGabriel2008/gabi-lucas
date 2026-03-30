(function () {
  function setText(element, value) {
    if (element) {
      element.textContent = value || "";
    }
  }

  function createElement(tagName, className, textContent) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (typeof textContent === "string") {
      element.textContent = textContent;
    }

    return element;
  }

  function applyMediaPresentation(frameElement, media, options) {
    if (!frameElement || !media) {
      return;
    }

    const imageElement = options && options.imageElement
      ? options.imageElement
      : frameElement.querySelector("img");

    if (!imageElement) {
      return;
    }

    imageElement.src = media.src;
    imageElement.alt = media.alt || "";
    imageElement.loading = media.loading || "lazy";

    frameElement.style.setProperty("--media-fit", media.fit || "cover");
    frameElement.style.setProperty("--media-bg", media.background || "var(--color-ivory)");
    frameElement.style.setProperty("--media-ratio-mobile", media.ratios?.mobile || media.ratio || "4 / 5");
    frameElement.style.setProperty("--media-ratio-tablet", media.ratios?.tablet || media.ratios?.mobile || media.ratio || "4 / 5");
    frameElement.style.setProperty("--media-ratio-desktop", media.ratios?.desktop || media.ratios?.tablet || media.ratios?.mobile || media.ratio || "4 / 5");
    frameElement.style.setProperty("--media-position-mobile", media.positions?.mobile || "center center");
    frameElement.style.setProperty("--media-position-tablet", media.positions?.tablet || media.positions?.mobile || "center center");
    frameElement.style.setProperty("--media-position-desktop", media.positions?.desktop || media.positions?.tablet || media.positions?.mobile || "center center");
  }

  function setupSmoothScroll(root) {
    const links = (root || document).querySelectorAll('a[href^="#"]');

    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        const targetId = link.getAttribute("href");

        if (!targetId || targetId === "#") {
          return;
        }

        const target = document.querySelector(targetId);

        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    });
  }

  function setupRevealAnimations() {
    const revealElements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      revealElements.forEach(function (element) {
        element.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    });

    revealElements.forEach(function (element) {
      observer.observe(element);
    });
  }

  function startCountdown(targetDateValue, elements) {
    const targetDate = new Date(targetDateValue);

    function update() {
      const difference = targetDate.getTime() - Date.now();

      if (difference <= 0) {
        if (elements.shell) {
          elements.shell.hidden = true;
        }

        if (elements.fallback) {
          elements.fallback.hidden = false;
          elements.fallback.textContent = elements.fallbackText || "";
        }

        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (elements.shell) {
        elements.shell.hidden = false;
      }

      if (elements.fallback) {
        elements.fallback.hidden = true;
      }

      setText(elements.days, String(days).padStart(2, "0"));
      setText(elements.hours, String(hours).padStart(2, "0"));
      setText(elements.minutes, String(minutes).padStart(2, "0"));
      setText(elements.seconds, String(seconds).padStart(2, "0"));
    }

    update();
    return window.setInterval(update, 1000);
  }

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  function generateReadableInviteId(familyName) {
    const base = slugify(familyName) || "familia";
    const randomPart = Math.random().toString(36).slice(2, 8);
    return base + "-" + randomPart;
  }

  function formatInviteStatus(status) {
    if (status === "confirmed") {
      return "Confirmado";
    }

    if (status === "cancelled") {
      return "Cancelado";
    }

    return "Sem resposta";
  }

  window.WeddingUI = {
    setText: setText,
    createElement: createElement,
    applyMediaPresentation: applyMediaPresentation,
    setupSmoothScroll: setupSmoothScroll,
    setupRevealAnimations: setupRevealAnimations,
    startCountdown: startCountdown,
    slugify: slugify,
    generateReadableInviteId: generateReadableInviteId,
    formatInviteStatus: formatInviteStatus
  };
})();
