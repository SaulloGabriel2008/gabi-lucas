import { defaultSiteConfig } from "../config/site-config.mjs";
import { fetchInviteBySlug, loadSiteSettings, submitInviteResponse } from "../firebase/client.mjs";
import {
  applyMediaPresentation,
  createElement,
  formatGuestStatus,
  formatInviteStatus,
  mergeDeep,
  setText,
  setupRevealAnimations,
  startCountdown,
  summarizeGuests
} from "../ui/shared-ui.mjs";

const dom = {
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

let currentInvite = null;
let runtimeConfig = buildRuntimeConfig();

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
  return new URL(window.location.href).searchParams.get("slug") || "";
}

function hydrateSharedContent() {
  applyMediaPresentation(dom.inviteHeroFrame, runtimeConfig.publicSite.hero.image, {
    imageElement: dom.inviteHeroImage
  });
  setText(dom.inviteEyebrow, `${runtimeConfig.inviteSite.eyebrow} - ${runtimeConfig.couple.dateText}`);
  setText(dom.inviteHeroTitle, runtimeConfig.couple.names);
  setText(dom.inviteHeroSubtitle, runtimeConfig.inviteSite.intro);
  setText(dom.inviteRsvpTitle, runtimeConfig.inviteSite.rsvpTitle);
  setText(dom.inviteRsvpBody, runtimeConfig.inviteSite.rsvpBody);
  setText(dom.inviteNoteLabel, runtimeConfig.inviteSite.fields.noteLabel);
  setText(dom.inviteSubmitButton, runtimeConfig.inviteSite.fields.submitLabel);
  setText(dom.inviteDateText, runtimeConfig.couple.dateText);
  setText(dom.inviteVenueText, `${runtimeConfig.event.venueName} - ${runtimeConfig.event.address}`);
  dom.inviteMapsLink.href = runtimeConfig.event.mapsUrl;
  setText(dom.inviteMapsLink, runtimeConfig.event.mapsLabel);
}

function renderGuestChoices(invite) {
  dom.inviteGuestList.innerHTML = "";

  if (!(invite.guests || []).length) {
    dom.inviteGuestList.appendChild(createElement(
      "p",
      "section-body",
      "Este convite ainda nÃ£o foi configurado com nomes. Fale com os noivos para ajustar o cadastro."
    ));
    return;
  }

  invite.guests.forEach((guest) => {
    const card = createElement("article", "invite-guest-card");
    const title = createElement("h4", "invite-guest-name", guest.name);
    const status = createElement("p", "section-body compact-body", `Status atual: ${formatGuestStatus(guest.responseStatus)}`);
    const choices = createElement("div", "invite-choice-row");

    [
      { value: "confirmed", label: "Confirmar presenÃ§a" },
      { value: "declined", label: "NÃ£o poderÃ¡ comparecer" }
    ].forEach((option) => {
      const choice = createElement("label", "choice-pill");
      const input = createElement("input");
      const span = createElement("span", "", option.label);
      input.type = "radio";
      input.name = `attendance_${guest.id}`;
      input.value = option.value;
      input.required = true;
      input.checked = guest.responseStatus === option.value;
      choice.append(input, span);
      choices.appendChild(choice);
    });

    card.append(title, status, choices);
    dom.inviteGuestList.appendChild(card);
  });
}

function renderInvite(invite) {
  currentInvite = invite;
  const summary = summarizeGuests(invite.guests || []);

  document.title = `${invite.displayName} | Convite | ${runtimeConfig.couple.names}`;
  setText(dom.inviteFamilyTitle, invite.displayName);
  setText(dom.inviteCustomMessage, invite.customMessage || "Preparamos esse convite com carinho para a sua famÃ­lia.");
  setText(dom.inviteReservedSeats, String(summary.invitedCount));
  setText(dom.inviteStatusText, formatInviteStatus(summary.responseStatus));
  dom.inviteNote.value = invite.attendanceNote || "";
  renderGuestChoices(invite);
}

async function loadInvite() {
  const slug = getInviteSlug();

  if (!slug) {
    setFeedback("error", runtimeConfig.inviteSite.messages.missingInvite);
    setText(dom.inviteFamilyTitle, "Convite nÃ£o localizado");
    return;
  }

  try {
    const invite = await fetchInviteBySlug(slug);

    if (!invite) {
      setFeedback("error", runtimeConfig.inviteSite.messages.missingInvite);
      setText(dom.inviteFamilyTitle, "Convite nÃ£o localizado");
      return;
    }

    renderInvite(invite);
  } catch (error) {
    setFeedback("error", runtimeConfig.inviteSite.messages.loadError);
    setText(dom.inviteFamilyTitle, "Convite indisponÃ­vel");
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
  dom.inviteRsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentInvite) {
      setFeedback("error", runtimeConfig.inviteSite.messages.missingInvite);
      return;
    }

    const formData = new FormData(dom.inviteRsvpForm);
    const guestsPayload = [];

    for (const guest of currentInvite.guests) {
      const responseStatus = String(formData.get(`attendance_${guest.id}`) || "").trim();

      if (!responseStatus) {
        setFeedback("error", "Selecione a presenÃ§a de todas as pessoas listadas no convite.");
        return;
      }

      guestsPayload.push({
        id: guest.id,
        responseStatus
      });
    }

    dom.inviteSubmitButton.disabled = true;
    setText(dom.inviteSubmitButton, "Salvando...");
    setFeedback("", "");

    try {
      await submitInviteResponse(currentInvite.id, {
        guests: guestsPayload,
        attendanceNote: String(dom.inviteNote.value || "").trim()
      });

      currentInvite.guests = currentInvite.guests.map((guest) => {
        const nextResponse = guestsPayload.find((item) => item.id === guest.id);

        return {
          ...guest,
          responseStatus: nextResponse ? nextResponse.responseStatus : guest.responseStatus
        };
      });
      currentInvite.attendanceNote = String(dom.inviteNote.value || "").trim();
      renderInvite(currentInvite);
      setFeedback("success", runtimeConfig.inviteSite.messages.success);
      openSuccessModal();
    } catch (error) {
      setFeedback("error", "NÃ£o foi possÃ­vel registrar sua resposta agora. Tente novamente.");
    } finally {
      dom.inviteSubmitButton.disabled = false;
      setText(dom.inviteSubmitButton, runtimeConfig.inviteSite.fields.submitLabel);
    }
  });
}

function setupModal() {
  dom.inviteSuccessClose.addEventListener("click", closeSuccessModal);
  dom.inviteSuccessModal.addEventListener("click", (event) => {
    if (event.target === dom.inviteSuccessModal) {
      closeSuccessModal();
    }
  });
}

async function initialize() {
  runtimeConfig = buildRuntimeConfig(await loadSiteSettings().catch(() => null));
  hydrateSharedContent();
  setupInviteForm();
  setupModal();
  setupRevealAnimations();
  startCountdown(runtimeConfig.couple.dateTime, {
    shell: dom.inviteCountdownShell,
    fallback: dom.inviteCountdownFallback,
    fallbackText: runtimeConfig.publicSite.countdown.fallbackText,
    days: dom.inviteDaysValue,
    hours: dom.inviteHoursValue,
    minutes: dom.inviteMinutesValue,
    seconds: dom.inviteSecondsValue
  });
  await loadInvite();
}

initialize().catch(() => {
  setFeedback("error", "Firebase nÃ£o foi carregado corretamente para esta pÃ¡gina.");
});
