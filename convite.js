(function () {
  var config = window.siteConfig;
  var ui = window.WeddingUI;
  var api = window.WeddingFirebase;

  var dom = {
    inviteHeroFrame: document.querySelector("#inviteHeroFrame"),
    inviteHeroImage: document.querySelector("#inviteHeroImage"),
    inviteEyebrow: document.querySelector("#inviteEyebrow"),
    inviteHeroTitle: document.querySelector("#inviteHeroTitle"),
    inviteHeroSubtitle: document.querySelector("#inviteHeroSubtitle"),
    inviteFamilyTitle: document.querySelector("#inviteFamilyTitle"),
    inviteCustomMessage: document.querySelector("#inviteCustomMessage"),
    inviteReservedSeats: document.querySelector("#inviteReservedSeats"),
    inviteStatusText: document.querySelector("#inviteStatusText"),
    inviteRsvpTitle: document.querySelector("#inviteRsvpTitle"),
    inviteRsvpBody: document.querySelector("#inviteRsvpBody"),
    inviteSeatsLabel: document.querySelector("#inviteSeatsLabel"),
    inviteSeats: document.querySelector("#inviteSeats"),
    inviteNoteLabel: document.querySelector("#inviteNoteLabel"),
    inviteNote: document.querySelector("#inviteNote"),
    inviteSubmitButton: document.querySelector("#inviteSubmitButton"),
    inviteFormFeedback: document.querySelector("#inviteFormFeedback"),
    inviteRsvpForm: document.querySelector("#inviteRsvpForm"),
    inviteDateText: document.querySelector("#inviteDateText"),
    inviteVenueText: document.querySelector("#inviteVenueText"),
    inviteMapsLink: document.querySelector("#inviteMapsLink"),
    inviteCountdownShell: document.querySelector("#inviteCountdownShell"),
    inviteCountdownFallback: document.querySelector("#inviteCountdownFallback"),
    inviteDaysValue: document.querySelector("#inviteDaysValue"),
    inviteHoursValue: document.querySelector("#inviteHoursValue"),
    inviteMinutesValue: document.querySelector("#inviteMinutesValue"),
    inviteSecondsValue: document.querySelector("#inviteSecondsValue")
  };

  var currentInvite = null;

  function setFeedback(type, message) {
    dom.inviteFormFeedback.textContent = message || "";
    dom.inviteFormFeedback.classList.remove("is-success", "is-error");

    if (type === "success") {
      dom.inviteFormFeedback.classList.add("is-success");
    }

    if (type === "error") {
      dom.inviteFormFeedback.classList.add("is-error");
    }
  }

  function getInviteSlug() {
    var url = new URL(window.location.href);
    return url.searchParams.get("slug") || "";
  }

  function hydrateSharedContent() {
    ui.applyMediaPresentation(dom.inviteHeroFrame, config.publicSite.hero.image, { imageElement: dom.inviteHeroImage });
    ui.setText(dom.inviteEyebrow, config.inviteSite.eyebrow + " - " + config.couple.dateText);
    ui.setText(dom.inviteHeroTitle, config.couple.names);
    ui.setText(dom.inviteHeroSubtitle, config.inviteSite.intro);
    ui.setText(dom.inviteRsvpTitle, config.inviteSite.rsvpTitle);
    ui.setText(dom.inviteRsvpBody, config.inviteSite.rsvpBody);
    ui.setText(dom.inviteSeatsLabel, config.inviteSite.fields.seatsLabel);
    ui.setText(dom.inviteNoteLabel, config.inviteSite.fields.noteLabel);
    ui.setText(dom.inviteSubmitButton, config.inviteSite.fields.submitLabel);
    ui.setText(dom.inviteDateText, config.couple.dateText);
    ui.setText(dom.inviteVenueText, config.event.venueName + " - " + config.event.address);
    dom.inviteMapsLink.href = config.event.mapsUrl;
  }

  function renderInvite(invite) {
    currentInvite = invite;
    document.title = invite.displayName + " | Convite | " + config.couple.names;
    ui.setText(dom.inviteFamilyTitle, invite.displayName);
    ui.setText(dom.inviteCustomMessage, invite.customMessage || "Preparamos esse convite com carinho para a sua familia.");
    ui.setText(dom.inviteReservedSeats, String(invite.reservedSeats));
    ui.setText(dom.inviteStatusText, ui.formatInviteStatus(invite.responseStatus));

    dom.inviteSeats.max = String(invite.reservedSeats);
    dom.inviteSeats.value = String(invite.confirmedSeats || 0);
    dom.inviteNote.value = invite.attendanceNote || "";
  }

  async function loadInvite() {
    var slug = getInviteSlug();

    if (!slug) {
      setFeedback("error", config.inviteSite.messages.missingInvite);
      ui.setText(dom.inviteFamilyTitle, "Convite nao localizado");
      return;
    }

    try {
      var invite = await api.fetchInviteBySlug(slug);

      if (!invite) {
        setFeedback("error", config.inviteSite.messages.missingInvite);
        ui.setText(dom.inviteFamilyTitle, "Convite nao localizado");
        return;
      }

      renderInvite(invite);
    } catch (error) {
      setFeedback("error", config.inviteSite.messages.loadError);
      ui.setText(dom.inviteFamilyTitle, "Convite indisponivel");
    }
  }

  function setupInviteForm() {
    dom.inviteRsvpForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!currentInvite) {
        setFeedback("error", config.inviteSite.messages.missingInvite);
        return;
      }

      var seats = Number(dom.inviteSeats.value);
      var note = String(dom.inviteNote.value || "").trim();

      if (!Number.isInteger(seats) || seats < 0 || seats > Number(currentInvite.reservedSeats)) {
        setFeedback("error", config.inviteSite.messages.invalidSeats);
        return;
      }

      dom.inviteSubmitButton.disabled = true;
      ui.setText(dom.inviteSubmitButton, "Salvando...");
      setFeedback("", "");

      try {
        await api.submitInviteResponse(currentInvite.id, {
          confirmedSeats: seats,
          responseStatus: seats > 0 ? "confirmed" : "cancelled",
          attendanceNote: note
        });

        currentInvite.confirmedSeats = seats;
        currentInvite.responseStatus = seats > 0 ? "confirmed" : "cancelled";
        currentInvite.attendanceNote = note;
        renderInvite(currentInvite);
        setFeedback("success", config.inviteSite.messages.success);
      } catch (error) {
        setFeedback("error", "Nao foi possivel registrar sua resposta agora. Tente novamente.");
      } finally {
        dom.inviteSubmitButton.disabled = false;
        ui.setText(dom.inviteSubmitButton, config.inviteSite.fields.submitLabel);
      }
    });
  }

  function initialize() {
    if (!api) {
      setFeedback("error", "Firebase nao foi carregado corretamente para esta pagina.");
      return;
    }

    hydrateSharedContent();
    setupInviteForm();
    ui.setupRevealAnimations();
    ui.startCountdown(config.couple.dateTime, {
      shell: dom.inviteCountdownShell,
      fallback: dom.inviteCountdownFallback,
      fallbackText: config.publicSite.countdown.fallbackText,
      days: dom.inviteDaysValue,
      hours: dom.inviteHoursValue,
      minutes: dom.inviteMinutesValue,
      seconds: dom.inviteSecondsValue
    });
    loadInvite();
  }

  initialize();
})();
