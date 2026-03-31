(function () {
  var baseConfig = window.siteConfig;
  var ui = window.WeddingUI;
  var api = window.WeddingFirebase;

  var dom = {
    headerMonogram: document.querySelector("#headerMonogram"),
    navLinks: document.querySelectorAll(".site-nav a[data-nav-key]"),
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
    var merged = ui.mergeDeep(baseConfig, settings || {});

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

    (config.publicSite.intro.photos || []).forEach(function (photo) {
      var frame = ui.createElement("figure", "media-frame");
      var image = ui.createElement("img");
      frame.appendChild(image);
      ui.applyMediaPresentation(frame, photo, { imageElement: image });
      dom.introPhotos.appendChild(frame);
    });
  }

  function renderSchedule(config) {
    dom.scheduleList.innerHTML = "";

    (config.publicSite.schedule.items || []).forEach(function (item) {
      var card = ui.createElement("article", "schedule-card reveal");
      var time = ui.createElement("span", "schedule-time", item.time);
      var title = ui.createElement("h3", "panel-title", item.title);
      var description = ui.createElement("p", "section-body section-body-light", item.description);
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

    var items = giftItems && giftItems.length
      ? giftItems
      : (config.publicSite.gifts.items || []).map(function (item, index) {
          return {
            id: "fallback-" + index,
            name: item.name,
            purchaseUrl: item.purchaseUrl || "",
            imageDataUrl: item.imageDataUrl || "",
            description: item.description || "",
            isActive: true
          };
        });

    if (!items.length) {
      dom.giftsList.appendChild(ui.createElement("p", "section-body", "A lista de presentes sera publicada em breve."));
      return;
    }

    items.forEach(function (item) {
      var article = ui.createElement("article", "gift-card reveal");

      if (item.imageDataUrl) {
        var media = ui.createElement("div", "gift-card-media");
        var image = ui.createElement("img");
        image.src = item.imageDataUrl;
        image.alt = item.name || "Presente";
        media.appendChild(image);
        article.appendChild(media);
      }

      var body = ui.createElement("div", "gift-card-body");
      body.appendChild(ui.createElement("h3", "panel-title", item.name));

      if (item.description) {
        body.appendChild(ui.createElement("p", "section-body compact-body", item.description));
      }

      if (item.purchaseUrl) {
        var link = ui.createElement("a", "button button-secondary button-solid-light gift-card-link", "Ver presente");
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

    (config.publicSite.gallery.items || []).forEach(function (item) {
      var figure = ui.createElement("figure", "media-frame reveal");
      var image = ui.createElement("img");
      var caption = ui.createElement("figcaption", "", item.caption);
      figure.append(image, caption);
      ui.applyMediaPresentation(figure, item, { imageElement: image });
      dom.galleryGrid.appendChild(figure);
    });
  }

  function hydrateStaticContent(config) {
    document.title = config.couple.names + " | Casamento";
    ui.setText(dom.headerMonogram, config.couple.monogram);

    dom.navLinks.forEach(function (link) {
      var key = link.dataset.navKey;
      ui.setText(link, config.navigation.items[key]);

      if (key === "gifts") {
        link.hidden = config.features.showGifts === false;
      }
    });

    ui.applyMediaPresentation(dom.heroFrame, config.publicSite.hero.image, { imageElement: dom.heroImage });
    ui.setText(dom.heroEyebrow, config.publicSite.hero.eyebrow + " - " + config.couple.dateText);
    ui.setText(dom.heroTitle, config.couple.names);
    ui.setText(dom.heroSubtitle, config.couple.subtitle);
    ui.setText(dom.heroPrimaryCta, "Ver local");
    dom.heroPrimaryCta.href = "#local";

    if (config.features.showGifts === false) {
      ui.setText(dom.heroSecondaryCta, "Ver agenda");
      dom.heroSecondaryCta.href = "#agenda";
    } else {
      ui.setText(dom.heroSecondaryCta, "Lista de presentes");
      dom.heroSecondaryCta.href = "#presentes";
    }

    ui.setText(dom.introKicker, config.publicSite.intro.kicker);
    ui.setText(dom.introTitle, config.publicSite.intro.title);
    ui.setText(dom.introBody, config.publicSite.intro.body);

    ui.applyMediaPresentation(dom.storyFrame, config.publicSite.story.image, { imageElement: dom.storyImage });
    ui.setText(dom.storyKicker, config.publicSite.story.kicker);
    ui.setText(dom.storyTitle, config.publicSite.story.title);
    ui.setText(dom.storyBody, config.publicSite.story.body);
    ui.setText(dom.storyButton, config.publicSite.story.buttonLabel);
    dom.storyButton.href = config.publicSite.story.buttonHref;

    ui.setText(dom.scheduleKicker, config.publicSite.schedule.kicker);
    ui.setText(dom.scheduleTitle, config.publicSite.schedule.title);
    ui.setText(dom.scheduleIntro, config.publicSite.schedule.intro);

    ui.setText(dom.giftsKicker, config.publicSite.gifts.kicker);
    ui.setText(dom.giftsTitle, config.publicSite.gifts.title);
    ui.setText(dom.giftsIntro, config.publicSite.gifts.intro);

    ui.setText(dom.galleryKicker, config.publicSite.gallery.kicker);
    ui.setText(dom.galleryTitle, config.publicSite.gallery.title);
    ui.setText(dom.galleryIntro, config.publicSite.gallery.intro);

    ui.setText(dom.venueName, config.event.venueName);
    ui.setText(dom.venueAddress, config.event.address);
    ui.setText(dom.mapsLink, config.event.mapsLabel);
    dom.mapsLink.href = config.event.mapsUrl;

    ui.setText(dom.countdownKicker, config.publicSite.countdown.kicker);
    ui.setText(dom.countdownTitle, config.publicSite.countdown.title);
    ui.setText(dom.countdownIntro, config.publicSite.countdown.intro);
    ui.setText(dom.daysLabel, config.publicSite.countdown.labels.days);
    ui.setText(dom.hoursLabel, config.publicSite.countdown.labels.hours);
    ui.setText(dom.minutesLabel, config.publicSite.countdown.labels.minutes);
    ui.setText(dom.secondsLabel, config.publicSite.countdown.labels.seconds);

    ui.setText(dom.footerSignature, config.publicSite.footer.signature);
    ui.setText(dom.footerMessage, config.publicSite.footer.message);
  }

  async function loadRuntimeData() {
    if (!api) {
      return {
        config: buildRuntimeConfig(),
        giftItems: []
      };
    }

    try {
      var publicData = await api.loadPublicSiteData();
      return {
        config: buildRuntimeConfig(publicData.settings || {}),
        giftItems: publicData.giftItems || []
      };
    } catch (error) {
      return {
        config: buildRuntimeConfig(),
        giftItems: []
      };
    }
  }

  async function initialize() {
    var runtimeData = await loadRuntimeData();
    var config = runtimeData.config;

    hydrateStaticContent(config);
    renderIntroPhotos(config);
    renderSchedule(config);
    renderGifts(config, runtimeData.giftItems);
    renderGallery(config);
    ui.setupSmoothScroll(document);
    ui.setupRevealAnimations();
    ui.startCountdown(config.couple.dateTime, {
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
})();
