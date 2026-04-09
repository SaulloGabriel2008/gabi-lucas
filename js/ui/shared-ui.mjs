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

export function buildMapsEmbedUrl(mapsUrl, fallbackQuery = "") {
  const normalizedUrl = String(mapsUrl || "").trim();
  const fallback = String(fallbackQuery || "").trim();

  try {
    if (normalizedUrl) {
      const parsed = new URL(normalizedUrl);
      const query = parsed.searchParams.get("q")
        || parsed.searchParams.get("query")
        || parsed.searchParams.get("destination")
        || fallback;

      if (query) {
        return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
      }
    }
  } catch {
    // Fall back to the address/title query when the configured URL is not a valid absolute URL.
  }

  if (!fallback) {
    return "";
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(fallback)}&z=15&output=embed`;
}

export function setupMobileDrawer({
  shell,
  drawer,
  toggleButton,
  closeButton,
  backdrop,
  desktopQuery = "(min-width: 48rem)",
  transitionMs = 240
} = {}) {
  if (!shell || !drawer || !toggleButton) {
    return {
      open() {},
      close() {},
      toggle() {}
    };
  }

  const desktopMedia = window.matchMedia(desktopQuery);
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(", ");
  let isOpen = false;
  let closeTimer = null;
  let lastFocusedElement = null;

  function clearCloseTimer() {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function syncExpandedState() {
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  }

  function focusDrawerContent() {
    const preferredTarget = closeButton || drawer.querySelector(focusableSelector) || drawer;
    preferredTarget.focus();
  }

  function finalizeClose(restoreFocus = true) {
    shell.hidden = true;
    shell.classList.remove("is-open");
    document.body.classList.remove("has-drawer-open");

    if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  }

  function open() {
    if (isOpen) {
      return;
    }

    clearCloseTimer();
    isOpen = true;
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    shell.hidden = false;
    document.body.classList.add("has-drawer-open");
    syncExpandedState();

    window.requestAnimationFrame(() => {
      shell.classList.add("is-open");
      focusDrawerContent();
    });
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen) {
      return;
    }

    clearCloseTimer();
    isOpen = false;
    syncExpandedState();
    shell.classList.remove("is-open");
    document.body.classList.remove("has-drawer-open");
    closeTimer = window.setTimeout(() => finalizeClose(restoreFocus), transitionMs);
  }

  function toggle() {
    if (isOpen) {
      close();
      return;
    }

    open();
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      close();
    }
  }

  function handleLinkClick(event) {
    const target = event.target instanceof Element ? event.target.closest("a[href]") : null;

    if (target) {
      close({ restoreFocus: false });
    }
  }

  function handleDesktopChange(event) {
    if (event.matches) {
      close({ restoreFocus: false });
    }
  }

  toggleButton.addEventListener("click", toggle);
  closeButton?.addEventListener("click", () => close());
  backdrop?.addEventListener("click", () => close({ restoreFocus: false }));
  drawer.addEventListener("click", handleLinkClick);
  document.addEventListener("keydown", handleKeydown);

  if (typeof desktopMedia.addEventListener === "function") {
    desktopMedia.addEventListener("change", handleDesktopChange);
  } else if (typeof desktopMedia.addListener === "function") {
    desktopMedia.addListener(handleDesktopChange);
  }

  syncExpandedState();

  return {
    open,
    close,
    toggle
  };
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

function normalizeReservedSlugs(values) {
  return new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => slugify(value))
      .filter(Boolean)
  );
}

export function isLegacyRandomInviteSlug(value) {
  return /-[a-z0-9]{6}$/.test(slugify(value));
}

export function generateReadableInviteSlug(label, reservedSlugs = []) {
  const base = slugify(label) || "familia";
  const reserved = normalizeReservedSlugs(reservedSlugs);

  if (!reserved.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;

  while (reserved.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
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
    return "Não vai";
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
