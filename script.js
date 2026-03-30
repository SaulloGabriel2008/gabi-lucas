const siteConfig = {
  couple: {
    names: "Ana & Bruno",
    monogram: "A & B",
    dateText: "18 de setembro de 2027",
    dateTime: "2027-09-18T16:30:00-03:00",
    subtitle: "Um encontro celebrado com calma, afeto e a alegria de reunir quem sempre fez parte da nossa história."
  },
  navigation: {
    items: {
      story: "História",
      schedule: "Agenda",
      rsvp: "RSVP",
      gifts: "Presentes",
      location: "Local"
    },
    primaryCtaLabel: "Confirmar Presença",
    primaryCtaHref: "#rsvp",
    secondaryCtaLabel: "Ver Local",
    secondaryCtaHref: "#local"
  },
  hero: {
    eyebrow: "Save the date",
    image: {
      src: "assets/IMG_8758.JPG.jpeg",
      alt: "Foto de noivado em um enquadramento romântico ao ar livre"
    }
  },
  intro: {
    kicker: "Nosso capítulo",
    title: "Um começo suave, construído em detalhes que fizeram sentido desde o primeiro instante.",
    body: "Aqui entra uma breve apresentação do casal, do clima do dia e da emoção que queremos dividir com cada convidado. O texto pode ser trocado depois com facilidade, mantendo a composição já pronta.",
    photos: [
      {
        src: "assets/IMG_8748.JPG.jpeg",
        alt: "Retrato editorial do casal em um momento de carinho"
      },
      {
        src: "assets/IMG_8749.JPG.jpeg",
        alt: "Foto espontânea do casal caminhando junto"
      }
    ]
  },
  story: {
    kicker: "Mensagem",
    title: "Mais do que uma data, este é o cenário de uma memória que começa a ser vivida com todos vocês.",
    body: "Este espaço foi pensado para receber uma mensagem sensível sobre a trajetória do casal, o significado da celebração e a atmosfera esperada para o grande dia. Tudo aqui funciona como conteúdo de apoio até a versão final chegar.",
    buttonLabel: "Descobrir o local",
    buttonHref: "#local",
    image: {
      src: "assets/IMG_8755.JPG.jpeg",
      alt: "Foto de noivado com composição intimista e luz suave"
    }
  },
  schedule: {
    kicker: "Agenda do dia",
    title: "Cada momento com seu próprio ritmo, do encontro inicial ao último brinde.",
    intro: "Os horários abaixo são ilustrativos e podem ser ajustados depois sem alterar a estrutura visual da seção.",
    items: [
      {
        title: "Cerimônia",
        time: "16h30",
        description: "Recepção dos convidados e início da cerimônia em um ambiente sereno e cheio de significado."
      },
      {
        title: "Recepção",
        time: "18h00",
        description: "Boas-vindas, música e um primeiro encontro entre abraços, conversas e brindes."
      },
      {
        title: "Celebração",
        time: "19h30",
        description: "Jantar, pista e uma noite preparada para ser lembrada com leveza e alegria."
      }
    ]
  },
  rsvp: {
    kicker: "RSVP",
    title: "Sua presença completa o cenário que estamos sonhando.",
    body: "Preencha os dados abaixo para sinalizar sua resposta. Nesta etapa, o envio é somente visual e poderá ser conectado depois a Firebase, Google Sheets, Formspree ou outro serviço.",
    fields: {
      nameLabel: "Seu nome",
      attendanceLegend: "Você poderá estar presente?",
      attendanceYes: "Sim, com alegria",
      attendanceNo: "Não poderei comparecer",
      messageLabel: "Deixe uma mensagem opcional",
      submitLabel: "Enviar resposta"
    },
    messages: {
      success: "Resposta registrada com sucesso nesta prévia. Depois vamos conectar este envio ao serviço definitivo.",
      error: "Por favor, preencha seu nome e escolha se poderá comparecer."
    }
  },
  gifts: {
    kicker: "Lista de presentes",
    title: "Sugestões carinhosas para quem deseja fazer parte desse novo começo.",
    intro: "Os itens abaixo são apenas marcadores elegantes para a futura lista real. A coleção pode ser trocada diretamente no array do JavaScript.",
    items: [
      { name: "Jogo de taças para celebrações", description: "Uma peça pensada para encontros especiais à mesa." },
      { name: "Roupa de cama em linho leve", description: "Texturas suaves para o cotidiano da nova casa." },
      { name: "Aparelho de jantar atemporal", description: "Linhas clássicas para refeições com convidados." },
      { name: "Conjunto de velas aromáticas", description: "Atmosfera acolhedora para noites tranquilas." },
      { name: "Mesa lateral de madeira natural", description: "Um detalhe elegante para a sala ou o quarto." },
      { name: "Jarra de cerâmica artesanal", description: "Objeto decorativo com presença delicada." },
      { name: "Kit para café da manhã a dois", description: "Um gesto simples para começar dias especiais." },
      { name: "Álbum para memórias da viagem", description: "Espaço para guardar registros e pequenos instantes." }
    ]
  },
  gallery: {
    kicker: "Galeria",
    title: "Imagens que ajudam a contar a atmosfera desta celebração.",
    intro: "A estrutura abaixo já está pronta para receber novas fotos depois. Por enquanto, usamos imagens locais como preenchimento editorial.",
    items: [
      {
        src: "assets/IMG_8765.JPG.jpeg",
        alt: "Foto de noivado em composição elegante",
        caption: "Ensaio ao entardecer",
        emphasis: "tall"
      },
      {
        src: "assets/IMG_8770.JPG.jpeg",
        alt: "Foto espontânea do casal em momento descontraído",
        caption: "Leveza"
      },
      {
        src: "assets/IMG_8748.JPG.jpeg",
        alt: "Retrato delicado do casal em close",
        caption: "Detalhes"
      },
      {
        src: "assets/IMG_8758.JPG.jpeg",
        alt: "Imagem do casal com composição romântica",
        caption: "Memória"
      }
    ]
  },
  location: {
    kicker: "Local",
    title: "Um endereço pensado para acolher este dia com beleza, luz e tranquilidade.",
    venueName: "Villa Placeholder",
    address: "Rua das Acácias, 245, Jardim das Flores, Cidade Exemplo",
    mapsLabel: "Abrir no Google Maps",
    mapsUrl: "https://maps.google.com/?q=Rua%20das%20Ac%C3%A1cias%20245",
    mapPlaceholderLabel: "Área reservada para mapa incorporado ou visual do local"
  },
  countdown: {
    kicker: "Contagem regressiva",
    title: "Falta pouco para este encontro ganhar som, luz e presença.",
    intro: "O contador utiliza a data definida no objeto de configuração e se atualiza automaticamente em tempo real.",
    labels: {
      days: "Dias",
      hours: "Horas",
      minutes: "Minutos",
      seconds: "Segundos"
    },
    fallbackText: "O grande dia já chegou. Agora é tempo de celebrar."
  },
  footer: {
    signature: "Ana & Bruno",
    message: "Com carinho, esperamos viver este momento ao lado das pessoas que fazem nossa história florescer."
  }
};

const dom = {
  headerMonogram: document.querySelector("#headerMonogram"),
  heroEyebrow: document.querySelector("#heroEyebrow"),
  heroTitle: document.querySelector("#heroTitle"),
  heroSubtitle: document.querySelector("#heroSubtitle"),
  heroImage: document.querySelector("#heroImage"),
  heroPrimaryCta: document.querySelector("#heroPrimaryCta"),
  heroSecondaryCta: document.querySelector("#heroSecondaryCta"),
  navLinks: document.querySelectorAll(".site-nav a[data-nav-key]"),
  introKicker: document.querySelector("#introKicker"),
  introTitle: document.querySelector("#introTitle"),
  introBody: document.querySelector("#introBody"),
  introPhotos: document.querySelector("#introPhotos"),
  storyKicker: document.querySelector("#storyKicker"),
  storyTitle: document.querySelector("#storyTitle"),
  storyBody: document.querySelector("#storyBody"),
  storyImage: document.querySelector("#storyImage"),
  storyButton: document.querySelector("#storyButton"),
  scheduleKicker: document.querySelector("#scheduleKicker"),
  scheduleTitle: document.querySelector("#scheduleTitle"),
  scheduleIntro: document.querySelector("#scheduleIntro"),
  scheduleList: document.querySelector("#scheduleList"),
  rsvpKicker: document.querySelector("#rsvpKicker"),
  rsvpTitle: document.querySelector("#rsvpTitle"),
  rsvpBody: document.querySelector("#rsvpBody"),
  labelGuestName: document.querySelector("#labelGuestName"),
  attendanceLegend: document.querySelector("#attendanceLegend"),
  attendanceYes: document.querySelector("#attendanceYes"),
  attendanceNo: document.querySelector("#attendanceNo"),
  labelGuestMessage: document.querySelector("#labelGuestMessage"),
  rsvpSubmit: document.querySelector("#rsvpSubmit"),
  rsvpForm: document.querySelector("#rsvpForm"),
  rsvpFeedback: document.querySelector("#rsvpFeedback"),
  giftsKicker: document.querySelector("#giftsKicker"),
  giftsTitle: document.querySelector("#giftsTitle"),
  giftsIntro: document.querySelector("#giftsIntro"),
  giftsList: document.querySelector("#giftsList"),
  galleryKicker: document.querySelector("#galleryKicker"),
  galleryTitle: document.querySelector("#galleryTitle"),
  galleryIntro: document.querySelector("#galleryIntro"),
  galleryGrid: document.querySelector("#galleryGrid"),
  locationKicker: document.querySelector("#locationKicker"),
  locationTitle: document.querySelector("#locationTitle"),
  venueName: document.querySelector("#venueName"),
  venueAddress: document.querySelector("#venueAddress"),
  mapsLink: document.querySelector("#mapsLink"),
  mapPlaceholderLabel: document.querySelector("#mapPlaceholderLabel"),
  countdownKicker: document.querySelector("#countdownKicker"),
  countdownTitle: document.querySelector("#countdownTitle"),
  countdownIntro: document.querySelector("#countdownIntro"),
  countdownShell: document.querySelector("#countdownShell"),
  countdownFallback: document.querySelector("#countdownFallback"),
  daysValue: document.querySelector("#daysValue"),
  daysLabel: document.querySelector("#daysLabel"),
  hoursValue: document.querySelector("#hoursValue"),
  hoursLabel: document.querySelector("#hoursLabel"),
  minutesValue: document.querySelector("#minutesValue"),
  minutesLabel: document.querySelector("#minutesLabel"),
  secondsValue: document.querySelector("#secondsValue"),
  secondsLabel: document.querySelector("#secondsLabel"),
  footerSignature: document.querySelector("#footerSignature"),
  footerMessage: document.querySelector("#footerMessage")
};

function setTextContent(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setImageContent(element, image) {
  if (!element || !image) {
    return;
  }

  element.src = image.src;
  element.alt = image.alt;
}

function createElement(tagName, className, content) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (typeof content === "string") {
    element.textContent = content;
  }

  return element;
}

function renderIntroPhotos(photos) {
  dom.introPhotos.innerHTML = "";

  photos.forEach((photo, index) => {
    const figure = createElement("figure", "editorial-photo");
    const image = createElement("img");
    image.src = photo.src;
    image.alt = photo.alt;
    image.loading = index === 0 ? "eager" : "lazy";
    figure.appendChild(image);
    dom.introPhotos.appendChild(figure);
  });
}

function renderSchedule(items) {
  dom.scheduleList.innerHTML = "";

  items.forEach((item, index) => {
    const article = createElement("article", "schedule-card reveal");
    const time = createElement("span", "schedule-time", item.time);
    const title = createElement("h3", "", item.title);
    const description = createElement("p", "", item.description);

    article.append(time, title, description);
    dom.scheduleList.appendChild(article);
    article.style.transitionDelay = `${index * 90}ms`;
  });
}

function renderGifts(items) {
  dom.giftsList.innerHTML = "";

  items.forEach((item) => {
    const article = createElement("article", "gift-item reveal");
    const title = createElement("h3", "", item.name);
    const description = createElement("p", "", item.description);
    article.append(title, description);
    dom.giftsList.appendChild(article);
  });
}

function renderGallery(items) {
  dom.galleryGrid.innerHTML = "";

  // Future Google Drive integration can replace this direct array rendering with
  // an async loader that fetches dynamic image URLs before calling renderGallery.
  items.forEach((item, index) => {
    const figure = createElement(
      "figure",
      `gallery-item reveal${item.emphasis === "tall" ? " gallery-item--tall" : ""}`
    );
    const image = createElement("img");
    const caption = createElement("figcaption", "gallery-caption", item.caption);

    image.src = item.src;
    image.alt = item.alt;
    image.loading = index === 0 ? "eager" : "lazy";

    figure.append(image, caption);
    dom.galleryGrid.appendChild(figure);
  });
}

function updateCountdown() {
  const targetDate = new Date(siteConfig.couple.dateTime);
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    dom.countdownShell.hidden = true;
    dom.countdownFallback.hidden = false;
    dom.countdownFallback.textContent = siteConfig.countdown.fallbackText;
    return;
  }

  dom.countdownShell.hidden = false;
  dom.countdownFallback.hidden = true;

  const seconds = Math.floor(difference / 1000);
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const remainingSeconds = seconds % 60;

  dom.daysValue.textContent = String(days).padStart(2, "0");
  dom.hoursValue.textContent = String(hours).padStart(2, "0");
  dom.minutesValue.textContent = String(minutes).padStart(2, "0");
  dom.secondsValue.textContent = String(remainingSeconds).padStart(2, "0");
}

async function submitRsvp(data) {
  // Future persistence integration goes here.
  // Example adapters:
  // - send to Firebase Firestore
  // - POST to a backend endpoint
  // - send to Google Sheets / Formspree / Zapier webhook
  // Keep this function returning a Promise so the UI flow stays the same later.
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { ok: true, payload: data };
}

function validateRsvpForm(formData) {
  const guestName = formData.get("guestName")?.toString().trim();
  const attendance = formData.get("attendance")?.toString();

  if (!guestName || !attendance) {
    return {
      isValid: false,
      message: siteConfig.rsvp.messages.error
    };
  }

  return {
    isValid: true,
    message: ""
  };
}

function setFeedbackState(type, message) {
  dom.rsvpFeedback.textContent = message;
  dom.rsvpFeedback.classList.remove("is-success", "is-error");

  if (type === "success") {
    dom.rsvpFeedback.classList.add("is-success");
  }

  if (type === "error") {
    dom.rsvpFeedback.classList.add("is-error");
  }
}

function setupRsvpForm() {
  dom.rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(dom.rsvpForm);
    const validation = validateRsvpForm(formData);

    if (!validation.isValid) {
      setFeedbackState("error", validation.message);
      return;
    }

    dom.rsvpSubmit.disabled = true;
    dom.rsvpSubmit.textContent = "Enviando...";
    setFeedbackState("", "");

    try {
      const payload = {
        guestName: formData.get("guestName")?.toString().trim(),
        attendance: formData.get("attendance")?.toString(),
        guestMessage: formData.get("guestMessage")?.toString().trim() || "",
        submittedAt: new Date().toISOString()
      };

      const result = await submitRsvp(payload);

      if (!result.ok) {
        throw new Error("Falha ao registrar RSVP");
      }

      dom.rsvpForm.reset();
      setFeedbackState("success", siteConfig.rsvp.messages.success);
    } catch (error) {
      setFeedbackState("error", "Não foi possível registrar sua resposta nesta prévia. Tente novamente.");
    } finally {
      dom.rsvpSubmit.disabled = false;
      dom.rsvpSubmit.textContent = siteConfig.rsvp.fields.submitLabel;
    }
  });
}

function setupRevealAnimations() {
  const revealElements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function setupSmoothScroll() {
  const navLinks = document.querySelectorAll('a[href^="#"]');

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = targetId ? document.querySelector(targetId) : null;

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

function hydrateStaticContent() {
  document.title = `${siteConfig.couple.names} | Casamento`;

  setTextContent(dom.headerMonogram, siteConfig.couple.monogram);
  dom.navLinks.forEach((link) => {
    const key = link.dataset.navKey;
    link.textContent = siteConfig.navigation.items[key] || "";
  });
  setTextContent(dom.heroEyebrow, `${siteConfig.hero.eyebrow} • ${siteConfig.couple.dateText}`);
  setTextContent(dom.heroTitle, siteConfig.couple.names);
  setTextContent(dom.heroSubtitle, siteConfig.couple.subtitle);
  setImageContent(dom.heroImage, siteConfig.hero.image);

  dom.heroPrimaryCta.textContent = siteConfig.navigation.primaryCtaLabel;
  dom.heroPrimaryCta.href = siteConfig.navigation.primaryCtaHref;
  dom.heroSecondaryCta.textContent = siteConfig.navigation.secondaryCtaLabel;
  dom.heroSecondaryCta.href = siteConfig.navigation.secondaryCtaHref;

  setTextContent(dom.introKicker, siteConfig.intro.kicker);
  setTextContent(dom.introTitle, siteConfig.intro.title);
  setTextContent(dom.introBody, siteConfig.intro.body);

  setTextContent(dom.storyKicker, siteConfig.story.kicker);
  setTextContent(dom.storyTitle, siteConfig.story.title);
  setTextContent(dom.storyBody, siteConfig.story.body);
  setTextContent(dom.storyButton, siteConfig.story.buttonLabel);
  dom.storyButton.href = siteConfig.story.buttonHref;
  setImageContent(dom.storyImage, siteConfig.story.image);

  setTextContent(dom.scheduleKicker, siteConfig.schedule.kicker);
  setTextContent(dom.scheduleTitle, siteConfig.schedule.title);
  setTextContent(dom.scheduleIntro, siteConfig.schedule.intro);

  setTextContent(dom.rsvpKicker, siteConfig.rsvp.kicker);
  setTextContent(dom.rsvpTitle, siteConfig.rsvp.title);
  setTextContent(dom.rsvpBody, siteConfig.rsvp.body);
  setTextContent(dom.labelGuestName, siteConfig.rsvp.fields.nameLabel);
  setTextContent(dom.attendanceLegend, siteConfig.rsvp.fields.attendanceLegend);
  setTextContent(dom.attendanceYes, siteConfig.rsvp.fields.attendanceYes);
  setTextContent(dom.attendanceNo, siteConfig.rsvp.fields.attendanceNo);
  setTextContent(dom.labelGuestMessage, siteConfig.rsvp.fields.messageLabel);
  setTextContent(dom.rsvpSubmit, siteConfig.rsvp.fields.submitLabel);

  setTextContent(dom.giftsKicker, siteConfig.gifts.kicker);
  setTextContent(dom.giftsTitle, siteConfig.gifts.title);
  setTextContent(dom.giftsIntro, siteConfig.gifts.intro);

  setTextContent(dom.galleryKicker, siteConfig.gallery.kicker);
  setTextContent(dom.galleryTitle, siteConfig.gallery.title);
  setTextContent(dom.galleryIntro, siteConfig.gallery.intro);

  setTextContent(dom.locationKicker, siteConfig.location.kicker);
  setTextContent(dom.locationTitle, siteConfig.location.title);
  setTextContent(dom.venueName, siteConfig.location.venueName);
  setTextContent(dom.venueAddress, siteConfig.location.address);
  setTextContent(dom.mapsLink, siteConfig.location.mapsLabel);
  dom.mapsLink.href = siteConfig.location.mapsUrl;
  setTextContent(dom.mapPlaceholderLabel, siteConfig.location.mapPlaceholderLabel);

  setTextContent(dom.countdownKicker, siteConfig.countdown.kicker);
  setTextContent(dom.countdownTitle, siteConfig.countdown.title);
  setTextContent(dom.countdownIntro, siteConfig.countdown.intro);
  setTextContent(dom.daysLabel, siteConfig.countdown.labels.days);
  setTextContent(dom.hoursLabel, siteConfig.countdown.labels.hours);
  setTextContent(dom.minutesLabel, siteConfig.countdown.labels.minutes);
  setTextContent(dom.secondsLabel, siteConfig.countdown.labels.seconds);

  setTextContent(dom.footerSignature, siteConfig.footer.signature);
  setTextContent(dom.footerMessage, siteConfig.footer.message);
}

function initializePage() {
  hydrateStaticContent();
  renderIntroPhotos(siteConfig.intro.photos);
  renderSchedule(siteConfig.schedule.items);
  renderGifts(siteConfig.gifts.items);
  renderGallery(siteConfig.gallery.items);
  updateCountdown();
  setupRsvpForm();
  setupSmoothScroll();
  setupRevealAnimations();
  window.setInterval(updateCountdown, 1000);
}

initializePage();
