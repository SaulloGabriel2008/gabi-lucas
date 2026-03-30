(function () {
  var config = window.siteConfig.publicSite;
  var appConfig = window.siteConfig;
  var ui = window.WeddingUI;

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
    publicRsvpForm: document.querySelector("#publicRsvpForm"),
    publicNameLabel: document.querySelector("#publicNameLabel"),
    publicAttendanceLegend: document.querySelector("#publicAttendanceLegend"),
    publicAttendanceYes: document.querySelector("#publicAttendanceYes"),
    publicAttendanceNo: document.querySelector("#publicAttendanceNo"),
    publicMessageLabel: document.querySelector("#publicMessageLabel"),
    publicSubmitButton: document.querySelector("#publicSubmitButton"),
    publicFormFeedback: document.querySelector("#publicFormFeedback"),
    rsvpKicker: document.querySelector("#rsvpKicker"),
    rsvpTitle: document.querySelector("#rsvpTitle"),
    rsvpBody: document.querySelector("#rsvpBody"),
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

  function renderIntroPhotos() {
    dom.introPhotos.innerHTML = "";

    config.intro.photos.forEach(function (photo) {
      var frame = ui.createElement("figure", "media-frame");
      var image = ui.createElement("img");
      frame.appendChild(image);
      ui.applyMediaPresentation(frame, photo, { imageElement: image });
      dom.introPhotos.appendChild(frame);
    });
  }

  function renderSchedule() {
    dom.scheduleList.innerHTML = "";

    config.schedule.items.forEach(function (item) {
      var card = ui.createElement("article", "schedule-card reveal");
      var time = ui.createElement("span", "schedule-time", item.time);
      var title = ui.createElement("h3", "panel-title", item.title);
      var description = ui.createElement("p", "section-body section-body-light", item.description);
      description.style.margin = "0";
      card.append(time, title, description);
      dom.scheduleList.appendChild(card);
    });
  }

  function renderGifts() {
    dom.giftsList.innerHTML = "";

    config.gifts.items.forEach(function (item) {
      var article = ui.createElement("article", "gift-item reveal");
      var title = ui.createElement("h3", "panel-title", item.name);
      var description = ui.createElement("p", "section-body", item.description);
      description.style.margin = "0";
      article.append(title, description);
      dom.giftsList.appendChild(article);
    });
  }

  function renderGallery() {
    dom.galleryGrid.innerHTML = "";

    config.gallery.items.forEach(function (item) {
      var figure = ui.createElement("figure", "media-frame reveal");
      var image = ui.createElement("img");
      var caption = ui.createElement("figcaption", "", item.caption);
      figure.append(image, caption);
      ui.applyMediaPresentation(figure, item, { imageElement: image });
      dom.galleryGrid.appendChild(figure);
    });
  }

  function setFormFeedback(type, message) {
    dom.publicFormFeedback.textContent = message || "";
    dom.publicFormFeedback.classList.remove("is-success", "is-error");

    if (type === "success") {
      dom.publicFormFeedback.classList.add("is-success");
    }

    if (type === "error") {
      dom.publicFormFeedback.classList.add("is-error");
    }
  }

  function setupPublicRsvp() {
    dom.publicRsvpForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var formData = new FormData(dom.publicRsvpForm);
      var name = String(formData.get("guestName") || "").trim();
      var attendance = String(formData.get("attendance") || "").trim();

      if (!name || !attendance) {
        setFormFeedback("error", "Preencha seu nome e escolha se podera comparecer.");
        return;
      }

      dom.publicRsvpForm.reset();
      setFormFeedback("success", "Resposta registrada nesta versao inicial. Depois o envio publico pode ser ligado ao painel de convites.");
    });
  }

  function hydrateStaticContent() {
    document.title = appConfig.couple.names + " | Casamento";

    ui.setText(dom.headerMonogram, appConfig.couple.monogram);

    dom.navLinks.forEach(function (link) {
      var key = link.dataset.navKey;
      ui.setText(link, appConfig.navigation.items[key]);
    });

    ui.applyMediaPresentation(dom.heroFrame, config.hero.image, { imageElement: dom.heroImage });
    ui.setText(dom.heroEyebrow, config.hero.eyebrow + " - " + appConfig.couple.dateText);
    ui.setText(dom.heroTitle, appConfig.couple.names);
    ui.setText(dom.heroSubtitle, appConfig.couple.subtitle);
    ui.setText(dom.heroPrimaryCta, appConfig.navigation.primaryCtaLabel);
    ui.setText(dom.heroSecondaryCta, appConfig.navigation.secondaryCtaLabel);
    dom.heroPrimaryCta.href = appConfig.navigation.primaryCtaHref;
    dom.heroSecondaryCta.href = appConfig.navigation.secondaryCtaHref;

    ui.setText(dom.introKicker, config.intro.kicker);
    ui.setText(dom.introTitle, config.intro.title);
    ui.setText(dom.introBody, config.intro.body);

    ui.applyMediaPresentation(dom.storyFrame, config.story.image, { imageElement: dom.storyImage });
    ui.setText(dom.storyKicker, config.story.kicker);
    ui.setText(dom.storyTitle, config.story.title);
    ui.setText(dom.storyBody, config.story.body);
    ui.setText(dom.storyButton, config.story.buttonLabel);
    dom.storyButton.href = config.story.buttonHref;

    ui.setText(dom.scheduleKicker, config.schedule.kicker);
    ui.setText(dom.scheduleTitle, config.schedule.title);
    ui.setText(dom.scheduleIntro, config.schedule.intro);

    ui.setText(dom.rsvpKicker, "RSVP");
    ui.setText(dom.rsvpTitle, "Sua presenca completa o cenario que estamos sonhando.");
    ui.setText(dom.rsvpBody, "Aqui fica o ponto de entrada geral para convidados. Os convites personalizados passam a existir em uma pagina separada, criada pelo admin.");
    ui.setText(dom.publicNameLabel, "Seu nome");
    ui.setText(dom.publicAttendanceLegend, "Voce podera estar presente?");
    ui.setText(dom.publicAttendanceYes, "Sim, com alegria");
    ui.setText(dom.publicAttendanceNo, "Nao poderei comparecer");
    ui.setText(dom.publicMessageLabel, "Mensagem opcional");
    ui.setText(dom.publicSubmitButton, "Enviar resposta");

    ui.setText(dom.giftsKicker, config.gifts.kicker);
    ui.setText(dom.giftsTitle, config.gifts.title);
    ui.setText(dom.giftsIntro, config.gifts.intro);

    ui.setText(dom.galleryKicker, config.gallery.kicker);
    ui.setText(dom.galleryTitle, config.gallery.title);
    ui.setText(dom.galleryIntro, config.gallery.intro);

    ui.setText(dom.venueName, appConfig.event.venueName);
    ui.setText(dom.venueAddress, appConfig.event.address);
    ui.setText(dom.mapsLink, appConfig.event.mapsLabel);
    dom.mapsLink.href = appConfig.event.mapsUrl;

    ui.setText(dom.countdownKicker, config.countdown.kicker);
    ui.setText(dom.countdownTitle, config.countdown.title);
    ui.setText(dom.countdownIntro, config.countdown.intro);
    ui.setText(dom.daysLabel, config.countdown.labels.days);
    ui.setText(dom.hoursLabel, config.countdown.labels.hours);
    ui.setText(dom.minutesLabel, config.countdown.labels.minutes);
    ui.setText(dom.secondsLabel, config.countdown.labels.seconds);

    ui.setText(dom.footerSignature, config.footer.signature);
    ui.setText(dom.footerMessage, config.footer.message);
  }

  function initialize() {
    hydrateStaticContent();
    renderIntroPhotos();
    renderSchedule();
    renderGifts();
    renderGallery();
    setupPublicRsvp();
    ui.setupSmoothScroll(document);
    ui.setupRevealAnimations();
    ui.startCountdown(appConfig.couple.dateTime, {
      shell: dom.countdownShell,
      fallback: dom.countdownFallback,
      fallbackText: config.countdown.fallbackText,
      days: dom.daysValue,
      hours: dom.hoursValue,
      minutes: dom.minutesValue,
      seconds: dom.secondsValue
    });
  }

  initialize();
})();
