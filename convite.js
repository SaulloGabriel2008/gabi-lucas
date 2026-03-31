(function () {
  var baseConfig = window.siteConfig;
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
    inviteGuestList: document.querySelector("#inviteGuestList"),
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
    inviteSecondsValue: document.querySelector("#inviteSecondsValue"),
    inviteSuccessModal: document.querySelector("#inviteSuccessModal"),
    inviteSuccessClose: document.querySelector("#inviteSuccessClose")
  };

  var currentInvite = null;
  var runtimeConfig = buildRuntimeConfig();

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
    ui.applyMediaPresentation(dom.inviteHeroFrame, runtimeConfig.publicSite.hero.image, { imageElement: dom.inviteHeroImage });
    ui.setText(dom.inviteEyebrow, runtimeConfig.inviteSite.eyebrow + " - " + runtimeConfig.couple.dateText);
    ui.setText(dom.inviteHeroTitle, runtimeConfig.couple.names);
    ui.setText(dom.inviteHeroSubtitle, runtimeConfig.inviteSite.intro);
    ui.setText(dom.inviteRsvpTitle, runtimeConfig.inviteSite.rsvpTitle);
    ui.setText(dom.inviteRsvpBody, "Escolha para cada pessoa convidada se ela podera estar presente.");
    ui.setText(dom.inviteNoteLabel, runtimeConfig.inviteSite.fields.noteLabel);
    ui.setText(dom.inviteSubmitButton, runtimeConfig.inviteSite.fields.submitLabel);
    ui.setText(dom.inviteDateText, runtimeConfig.couple.dateText);
    ui.setText(dom.inviteVenueText, runtimeConfig.event.venueName + " - " + runtimeConfig.event.address);
    dom.inviteMapsLink.href = runtimeConfig.event.mapsUrl;
    ui.setText(dom.inviteMapsLink, runtimeConfig.event.mapsLabel);
  }

  function renderGuestChoices(invite) {
    dom.inviteGuestList.innerHTML = "";

    if (!(invite.members || []).length) {
      dom.inviteGuestList.appendChild(ui.createElement("p", "section-body", "Este convite ainda nao foi configurado com nomes. Fale com os noivos para ajustar o cadastro."));
      return;
    }

    invite.members.forEach(function (member) {
      var card = ui.createElement("article", "invite-guest-card");
      var title = ui.createElement("h4", "invite-guest-name", member.name);
      var status = ui.createElement("p", "section-body compact-body", "Status atual: " + ui.formatMemberStatus(member.responseStatus));
      var choices = ui.createElement("div", "invite-choice-row");

      [
        { value: "confirmed", label: "Confirmar presenca" },
        { value: "declined", label: "Nao podera comparecer" }
      ].forEach(function (option) {
        var choice = ui.createElement("label", "choice-pill");
        var input = ui.createElement("input");
        var span = ui.createElement("span", "", option.label);
        input.type = "radio";
        input.name = "attendance_" + member.id;
        input.value = option.value;
        input.required = true;
        input.checked = member.responseStatus === option.value;
        choice.append(input, span);
        choices.appendChild(choice);
      });

      card.append(title, status, choices);
      dom.inviteGuestList.appendChild(card);
    });
  }

  function renderInvite(invite) {
    currentInvite = invite;
    var summary = ui.summarizeMembers(invite.members || []);

    document.title = invite.displayName + " | Convite | " + runtimeConfig.couple.names;
    ui.setText(dom.inviteFamilyTitle, invite.displayName);
    ui.setText(dom.inviteCustomMessage, invite.customMessage || "Preparamos esse convite com carinho para a sua familia.");
    ui.setText(dom.inviteReservedSeats, String(summary.invitedCount));
    ui.setText(dom.inviteStatusText, ui.formatInviteStatus(summary.responseStatus));
    dom.inviteNote.value = invite.attendanceNote || "";
    renderGuestChoices(invite);
  }

  async function loadInvite() {
    var slug = getInviteSlug();

    if (!slug) {
      setFeedback("error", runtimeConfig.inviteSite.messages.missingInvite);
      ui.setText(dom.inviteFamilyTitle, "Convite nao localizado");
      return;
    }

    try {
      var invite = await api.fetchInviteBySlug(slug);

      if (!invite) {
        setFeedback("error", runtimeConfig.inviteSite.messages.missingInvite);
        ui.setText(dom.inviteFamilyTitle, "Convite nao localizado");
        return;
      }

      renderInvite(invite);
    } catch (error) {
      setFeedback("error", runtimeConfig.inviteSite.messages.loadError);
      ui.setText(dom.inviteFamilyTitle, "Convite indisponivel");
    }
  }

  function openSuccessModal() {
    dom.inviteSuccessModal.hidden = false;
    document.body.classList.add("has-modal-open");
  }

  function closeSuccessModal() {
    dom.inviteSuccessModal.hidden = true;
    document.body.classList.remove("has-modal-open");
  }

  function setupInviteForm() {
    dom.inviteRsvpForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!currentInvite) {
        setFeedback("error", runtimeConfig.inviteSite.messages.missingInvite);
        return;
      }

      var formData = new FormData(dom.inviteRsvpForm);
      var membersPayload = [];

      for (var index = 0; index < currentInvite.members.length; index += 1) {
        var member = currentInvite.members[index];
        var responseStatus = String(formData.get("attendance_" + member.id) || "").trim();

        if (!responseStatus) {
          setFeedback("error", "Selecione a presenca de todas as pessoas listadas no convite.");
          return;
        }

        membersPayload.push({
          id: member.id,
          responseStatus: responseStatus
        });
      }

      dom.inviteSubmitButton.disabled = true;
      ui.setText(dom.inviteSubmitButton, "Salvando...");
      setFeedback("", "");

      try {
        await api.submitInviteResponse(currentInvite.id, {
          members: membersPayload,
          attendanceNote: String(dom.inviteNote.value || "").trim()
        });

        currentInvite.members = currentInvite.members.map(function (member) {
          var nextStatus = membersPayload.find(function (item) {
            return item.id === member.id;
          });

          return Object.assign({}, member, {
            responseStatus: nextStatus ? nextStatus.responseStatus : member.responseStatus
          });
        });
        currentInvite.attendanceNote = String(dom.inviteNote.value || "").trim();
        renderInvite(currentInvite);
        setFeedback("success", runtimeConfig.inviteSite.messages.success);
        openSuccessModal();
      } catch (error) {
        setFeedback("error", "Nao foi possivel registrar sua resposta agora. Tente novamente.");
      } finally {
        dom.inviteSubmitButton.disabled = false;
        ui.setText(dom.inviteSubmitButton, runtimeConfig.inviteSite.fields.submitLabel);
      }
    });
  }

  function setupModal() {
    dom.inviteSuccessClose.addEventListener("click", closeSuccessModal);
    dom.inviteSuccessModal.addEventListener("click", function (event) {
      if (event.target === dom.inviteSuccessModal) {
        closeSuccessModal();
      }
    });
  }

  async function loadRuntimeSettings() {
    if (!api) {
      return;
    }

    try {
      runtimeConfig = buildRuntimeConfig(await api.loadSiteSettings() || {});
    } catch (error) {
      runtimeConfig = buildRuntimeConfig();
    }
  }

  async function initialize() {
    if (!api) {
      setFeedback("error", "Firebase nao foi carregado corretamente para esta pagina.");
      return;
    }

    await loadRuntimeSettings();
    hydrateSharedContent();
    setupInviteForm();
    setupModal();
    ui.setupRevealAnimations();
    ui.startCountdown(runtimeConfig.couple.dateTime, {
      shell: dom.inviteCountdownShell,
      fallback: dom.inviteCountdownFallback,
      fallbackText: runtimeConfig.publicSite.countdown.fallbackText,
      days: dom.inviteDaysValue,
      hours: dom.inviteHoursValue,
      minutes: dom.inviteMinutesValue,
      seconds: dom.inviteSecondsValue
    });
    loadInvite();
  }

  initialize();
})();
