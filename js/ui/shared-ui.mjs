function isPlainObject(value) {
  return Boolean(value) && Object.prototype.toString.call(value) === "[object Object]";
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (isPlainObject(value)) {
    return Object.keys(value).reduce((result, key) => {
      result[key] = cloneValue(value[key]);
      return result;
    }, {});
  }

  return value;
}

export function mergeDeep(baseValue, overrideValue) {
  if (Array.isArray(overrideValue)) {
    return overrideValue.map(cloneValue);
  }

  if (!isPlainObject(baseValue) || !isPlainObject(overrideValue)) {
    return overrideValue === undefined ? cloneValue(baseValue) : cloneValue(overrideValue);
  }

  const merged = cloneValue(baseValue);

  Object.keys(overrideValue).forEach((key) => {
    merged[key] = mergeDeep(baseValue?.[key], overrideValue[key]);
  });

  return merged;
}

export function setText(element, value) {
  if (element) {
    element.textContent = value ?? "";
  }
}

export function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (typeof textContent === "string") {
    element.textContent = textContent;
  }

  return element;
}

export function applyMediaPresentation(frameElement, media, options = {}) {
  if (!frameElement || !media) {
    return;
  }

  const imageElement = options.imageElement || frameElement.querySelector("img");

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

export function setupSmoothScroll(root = document) {
  root.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
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

export function setupRevealAnimations() {
  const revealElements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px"
  });

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}

export function startCountdown(targetDateValue, elements) {
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

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function generateReadableInviteSlug(label) {
  const base = slugify(label) || "familia";
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${base}-${randomPart}`;
}

export function formatInviteStatus(status) {
  if (status === "confirmed") {
    return "Confirmado";
  }

  if (status === "declined") {
    return "Recusado";
  }

  if (status === "partial") {
    return "Parcial";
  }

  return "Sem resposta";
}

export function formatGuestStatus(status) {
  if (status === "confirmed") {
    return "Vai";
  }

  if (status === "declined") {
    return "NÃ£o vai";
  }

  return "Sem resposta";
}

export function summarizeGuests(guests) {
  const summary = {
    invitedCount: Array.isArray(guests) ? guests.length : 0,
    confirmedCount: 0,
    declinedCount: 0,
    pendingCount: 0,
    respondedCount: 0,
    responseStatus: "pending"
  };

  (guests || []).forEach((guest) => {
    if (guest?.responseStatus === "confirmed") {
      summary.confirmedCount += 1;
      return;
    }

    if (guest?.responseStatus === "declined") {
      summary.declinedCount += 1;
      return;
    }

    summary.pendingCount += 1;
  });

  summary.respondedCount = summary.confirmedCount + summary.declinedCount;

  if (!summary.invitedCount || summary.respondedCount === 0) {
    summary.responseStatus = "pending";
  } else if (summary.confirmedCount === summary.invitedCount) {
    summary.responseStatus = "confirmed";
  } else if (summary.declinedCount === summary.invitedCount) {
    summary.responseStatus = "declined";
  } else {
    summary.responseStatus = "partial";
  }

  return summary;
}

export function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function localDateTimeToIso(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
