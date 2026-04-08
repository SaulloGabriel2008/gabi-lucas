import { defaultSiteConfig } from "../config/site-config.mjs";
import { loadPublicSiteData } from "../firebase/client.mjs";
import {
  applyMediaPresentation,
  createElement,
  mergeDeep,
  setText,
  setupMobileDrawer,
  setupRevealAnimations,
  setupSmoothScroll,
  startCountdown
} from "../ui/shared-ui.mjs";

const dom = {
  headerMonogram: document.querySelector("#headerMonogram"),
  navLinks: document.querySelectorAll(".site-nav a[data-nav-key], .site-drawer-nav a[data-nav-key]"),
  siteNavToggle: document.querySelector("#siteNavToggle"),
  siteDrawerShell: document.querySelector("#siteDrawerShell"),
  siteDrawer: document.querySelector("#siteDrawer"),
  siteDrawerBackdrop: document.querySelector("#siteDrawerBackdrop"),
  siteDrawerClose: document.querySelector("#siteDrawerClose"),
  siteDrawerPrimaryCta: document.querySelector("#siteDrawerPrimaryCta"),
  siteDrawerSecondaryCta: document.querySelector("#siteDrawerSecondaryCta"),
  heroFrame: document.querySelector("#heroFrame"),
  heroImage: document.querySelector("#heroImage"),
  heroEyebrow: document.querySelector("#heroEyebrow"),
  heroTitle: document.querySelector("#heroTitle"),
  heroSubtitle: document.querySelector("#heroSubtitle"),
  heroPrimaryCta: document.querySelector("#heroPrimaryCta"),
  heroSecondaryCta: document.querySelector("#heroSecondaryCta"),
  introKicker: document.querySelector("#introKicker"),
  introTitle: document.querySelector("#introTitle"),
  introBody: document.querySelector("#introBody"),
  introPhotos: document.querySelector("#introPhotos"),
  storyFrame: document.querySelector("#storyFrame"),
  storyImage: document.querySelector("#storyImage"),
  storyKicker: document.querySelector("#storyKicker"),
  storyTitle: document.querySelector("#storyTitle"),
  storyBody: document.querySelector("#storyBody"),
  storyButton: document.querySelector("#storyButton"),
  scheduleKicker: document.querySelector("#scheduleKicker"),
  scheduleTitle: document.querySelector("#scheduleTitle"),
  scheduleIntro: document.querySelector("#scheduleIntro"),
  scheduleList: document.querySelector("#scheduleList"),
  giftsSection: document.querySelector("#presentes"),
  giftsKicker: document.querySelector("#giftsKicker"),
  giftsTitle: document.querySelector("#giftsTitle"),
  giftsIntro: document.querySelector("#giftsIntro"),
  giftsList: document.querySelector("#giftsList"),
  galleryKicker: document.querySelector("#galleryKicker"),
  galleryTitle: document.querySelector("#galleryTitle"),
  galleryIntro: document.querySelector("#galleryIntro"),
  galleryGrid: document.querySelector("#galleryGrid"),
  venueName: document.querySelector("#venueName"),
  venueAddress: document.querySelector("#venueAddress"),
  mapsLink: document.querySelector("#mapsLink"),
  countdownKicker: document.querySelector("#countdownKicker"),
  countdownTitle: document.querySelector("#countdownTitle"),
  countdownIntro: document.querySelector("#countdownIntro"),
  countdownShell: document.querySelector("#countdownShell"),
  countdownFallback: document.querySelector("#countdownFallback"),
  daysValue: document.querySelector("#daysValue"),
  hoursValue: document.querySelector("#hoursValue"),
  minutesValue: document.querySelector("#minutesValue"),
  secondsValue: document.querySelector("#secondsValue"),
  daysLabel: document.querySelector("#daysLabel"),
  hoursLabel: document.querySelector("#hoursLabel"),
  minutesLabel: document.querySelector("#minutesLabel"),
  secondsLabel: document.querySelector("#secondsLabel"),
  footerSignature: document.querySelector("#footerSignature"),
  footerMessage: document.querySelector("#footerMessage")
};

function buildRuntimeConfig(settings) {
  const merged = mergeDeep(defaultSiteConfig, settings || {});

  if (!merged.features) {
    merged.features = {};
  }

  if (typeof merged.features.showGifts !== "boolean") {
    merged.features.showGifts = true;
  }

  return merged;
}

function renderIntroPhotos(config) {
  dom.introPhotos.innerHTML = "";

  (config.publicSite.intro.photos || []).forEach((photo) => {
    const frame = createElement("figure", "media-frame");
    const image = createElement("img");
    frame.appendChild(image);
    applyMediaPresentation(frame, photo, { imageElement: image });
    dom.introPhotos.appendChild(frame);
  });
}

function renderSchedule(config) {
  dom.scheduleList.innerHTML = "";

  (config.publicSite.schedule.items || []).forEach((item) => {
    const card = createElement("article", "schedule-card reveal");
    const time = createElement("span", "schedule-time", item.time);
    const title = createElement("h3", "panel-title", item.title);
    const description = createElement("p", "section-body section-body-light", item.description);
    description.style.margin = "0";
    card.append(time, title, description);
    dom.scheduleList.appendChild(card);
  });
}

function renderGifts(config, giftItems) {
  dom.giftsList.innerHTML = "";

  if (config.features.showGifts === false) {
    dom.giftsSection.hidden = true;
    return;
  }

  dom.giftsSection.hidden = false;

  const items = giftItems?.length
    ? giftItems
    : (config.publicSite.gifts.items || []).map((item, index) => ({
        id: `fallback-${index}`,
        name: item.name,
        purchaseUrl: item.purchaseUrl || "",
        imageUrl: item.imageUrl || "",
        description: item.description || "",
        isActive: true
      }));

  if (!items.length) {
    dom.giftsList.appendChild(createElement("p", "section-body", "A lista de presentes será publicada em breve."));
    return;
  }

  items.forEach((item) => {
    const article = createElement("article", "gift-card reveal");

    if (item.imageUrl) {
      const media = createElement("div", "gift-card-media");
      const image = createElement("img");
      image.src = item.imageUrl;
      image.alt = item.name || "Presente";
      media.appendChild(image);
      article.appendChild(media);
    }

    const body = createElement("div", "gift-card-body");
    body.appendChild(createElement("h3", "panel-title", item.name));

    if (item.description) {
      body.appendChild(createElement("p", "section-body compact-body", item.description));
    }

    if (item.purchaseUrl) {
      const link = createElement("a", "button button-secondary button-solid-light gift-card-link", "Ver presente");
      link.href = item.purchaseUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      body.appendChild(link);
    }

    article.appendChild(body);
    dom.giftsList.appendChild(article);
  });
}

function renderGallery(config) {
  dom.galleryGrid.innerHTML = "";

  (config.publicSite.gallery.items || []).forEach((item) => {
    const figure = createElement("figure", "media-frame reveal");
    const image = createElement("img");
    const caption = createElement("figcaption", "", item.caption);
    figure.append(image, caption);
    applyMediaPresentation(figure, item, { imageElement: image });
    dom.galleryGrid.appendChild(figure);
  });
}

function hydrateStaticContent(config) {
  document.title = `${config.couple.names} | Casamento`;
  setText(dom.headerMonogram, config.couple.monogram);

  dom.navLinks.forEach((link) => {
    const key = link.dataset.navKey;
    setText(link, config.navigation.items[key]);

    if (key === "gifts") {
      link.hidden = config.features.showGifts === false;
    }
  });

  applyMediaPresentation(dom.heroFrame, config.publicSite.hero.image, { imageElement: dom.heroImage });
  setText(dom.heroEyebrow, `${config.publicSite.hero.eyebrow} - ${config.couple.dateText}`);
  setText(dom.heroTitle, config.couple.names);
  setText(dom.heroSubtitle, config.couple.subtitle);
  setText(dom.heroPrimaryCta, config.navigation.secondaryCtaLabel || "Ver local");
  dom.heroPrimaryCta.href = config.navigation.secondaryCtaHref || "#local";
  setText(dom.siteDrawerPrimaryCta, config.navigation.secondaryCtaLabel || "Ver local");
  dom.siteDrawerPrimaryCta.href = config.navigation.secondaryCtaHref || "#local";

  if (config.features.showGifts === false) {
    setText(dom.heroSecondaryCta, "Ver agenda");
    dom.heroSecondaryCta.href = "#agenda";
    setText(dom.siteDrawerSecondaryCta, "Ver agenda");
    dom.siteDrawerSecondaryCta.href = "#agenda";
  } else {
    setText(dom.heroSecondaryCta, config.navigation.items.gifts || "Presentes");
    dom.heroSecondaryCta.href = "#presentes";
    setText(dom.siteDrawerSecondaryCta, config.navigation.items.gifts || "Presentes");
    dom.siteDrawerSecondaryCta.href = "#presentes";
  }

  setText(dom.introKicker, config.publicSite.intro.kicker);
  setText(dom.introTitle, config.publicSite.intro.title);
  setText(dom.introBody, config.publicSite.intro.body);

  applyMediaPresentation(dom.storyFrame, config.publicSite.story.image, { imageElement: dom.storyImage });
  setText(dom.storyKicker, config.publicSite.story.kicker);
  setText(dom.storyTitle, config.publicSite.story.title);
  setText(dom.storyBody, config.publicSite.story.body);
  setText(dom.storyButton, config.publicSite.story.buttonLabel);
  dom.storyButton.href = config.publicSite.story.buttonHref;

  setText(dom.scheduleKicker, config.publicSite.schedule.kicker);
  setText(dom.scheduleTitle, config.publicSite.schedule.title);
  setText(dom.scheduleIntro, config.publicSite.schedule.intro);

  setText(dom.giftsKicker, config.publicSite.gifts.kicker);
  setText(dom.giftsTitle, config.publicSite.gifts.title);
  setText(dom.giftsIntro, config.publicSite.gifts.intro);

  setText(dom.galleryKicker, config.publicSite.gallery.kicker);
  setText(dom.galleryTitle, config.publicSite.gallery.title);
  setText(dom.galleryIntro, config.publicSite.gallery.intro);

  setText(dom.venueName, config.event.venueName);
  setText(dom.venueAddress, config.event.address);
  setText(dom.mapsLink, config.event.mapsLabel);
  dom.mapsLink.href = config.event.mapsUrl;

  setText(dom.countdownKicker, config.publicSite.countdown.kicker);
  setText(dom.countdownTitle, config.publicSite.countdown.title);
  setText(dom.countdownIntro, config.publicSite.countdown.intro);
  setText(dom.daysLabel, config.publicSite.countdown.labels.days);
  setText(dom.hoursLabel, config.publicSite.countdown.labels.hours);
  setText(dom.minutesLabel, config.publicSite.countdown.labels.minutes);
  setText(dom.secondsLabel, config.publicSite.countdown.labels.seconds);

  setText(dom.footerSignature, config.publicSite.footer.signature);
  setText(dom.footerMessage, config.publicSite.footer.message);
}

async function initialize() {
  const runtimeData = await loadPublicSiteData().catch(() => ({
    settings: null,
    giftItems: []
  }));
  const config = buildRuntimeConfig(runtimeData.settings);

  hydrateStaticContent(config);
  renderIntroPhotos(config);
  renderSchedule(config);
  renderGifts(config, runtimeData.giftItems || []);
  renderGallery(config);
  setupSmoothScroll(document);
  setupMobileDrawer({
    shell: dom.siteDrawerShell,
    drawer: dom.siteDrawer,
    toggleButton: dom.siteNavToggle,
    closeButton: dom.siteDrawerClose,
    backdrop: dom.siteDrawerBackdrop
  });
  setupRevealAnimations();
  startCountdown(config.couple.dateTime, {
    shell: dom.countdownShell,
    fallback: dom.countdownFallback,
    fallbackText: config.publicSite.countdown.fallbackText,
    days: dom.daysValue,
    hours: dom.hoursValue,
    minutes: dom.minutesValue,
    seconds: dom.secondsValue
  });
}

initialize();
