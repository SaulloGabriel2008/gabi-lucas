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
  inviteIntroLead: document.querySelector("#inviteIntroLead"),
  inviteCustomMessage: document.querySelector("#inviteCustomMessage"),
  inviteNameList: document.querySelector("#inviteNameList"),
  inviteReservedSeats: document.querySelector("#inviteReservedSeats"),
  inviteStatusText: document.querySelector("#inviteStatusText"),
  inviteResponseSummary: document.querySelector("#inviteResponseSummary"),
  inviteRsvpTitle: document.querySelector("#inviteRsvpTitle"),
  inviteRsvpBody: document.querySelector("#inviteRsvpBody"),
  inviteGuestList: document.querySelector("#inviteGuestList"),
  inviteConfirmAllButton: document.querySelector("#inviteConfirmAllButton"),
  inviteDeclineAllButton: document.querySelector("#inviteDeclineAllButton"),
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
  inviteSuccessClose: document.querySelector("#inviteSuccessClose"),
  inviteSuccessBody: document.querySelector("#inviteSuccessBody")
};

let currentInvite = null;
let runtimeConfig = buildRuntimeConfig();
let draftResponses = {};

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

function guestSummary(invite) {
  return (invite?.guests || []).reduce((summary, guest) => {
    if (guest.responseStatus === "confirmed") {
      summary.confirmed += 1;
    } else if (guest.responseStatus === "declined") {
      summary.declined += 1;
    } else {
      summary.pending += 1;
    }

    return summary;
  }, { confirmed: 0, declined: 0, pending: 0 });
}

function draftGuestSummary(invite) {
  return (invite?.guests || []).reduce((summary, guest) => {
    const status = selectedOrCurrentStatus(guest);

    if (status === "confirmed") {
      summary.confirmed += 1;
    } else if (status === "declined") {
      summary.declined += 1;
    } else {
      summary.pending += 1;
    }

    return summary;
  }, { confirmed: 0, declined: 0, pending: 0 });
}

function inviteLeadText(invite) {
  return `Estamos convidando voce e sua familia para celebrar o nosso casamento com a gente. Abaixo estao os nomes reservados neste convite.`;
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

function updateGuestCardState(card, status) {
  card.classList.remove("is-pending", "is-confirmed", "is-declined");
  if (status === "confirmed") {
    card.classList.add("is-confirmed");
    return;
  }
  if (status === "declined") {
    card.classList.add("is-declined");
    return;
  }
  card.classList.add("is-pending");
}

function updateSummaryUI(invite, useDraft = false) {
  const summary = useDraft ? draftGuestSummary(invite) : guestSummary(invite);
  setText(dom.inviteResponseSummary, `${summary.confirmed} confirmados, ${summary.declined} nao vao e ${summary.pending} pendentes`);
}

function renderInvitedNames(invite) {
  dom.inviteNameList.innerHTML = "";
  (invite.guests || []).forEach((guest) => {
    dom.inviteNameList.appendChild(createElement("span", "invite-name-pill", guest.name));
  });
}

function selectedOrCurrentStatus(guest) {
  return draftResponses[guest.id] || guest.responseStatus || "pending";
}

function renderGuestChoices(invite) {
  dom.inviteGuestList.innerHTML = "";

  if (!(invite.guests || []).length) {
    dom.inviteGuestList.appendChild(createElement(
      "p",
      "section-body",
      "Este convite ainda não foi configurado com nomes. Fale com os noivos para ajustar o cadastro."
    ));
    return;
  }

  invite.guests.forEach((guest) => {
    const card = createElement("article", "invite-guest-card");
    updateGuestCardState(card, selectedOrCurrentStatus(guest));
    const title = createElement("h4", "invite-guest-name", guest.name);
    const status = createElement("p", "section-body compact-body invite-guest-status", `Status atual: ${formatGuestStatus(selectedOrCurrentStatus(guest))}`);
    const choices = createElement("div", "invite-choice-row");

    [
      { value: "confirmed", label: "Vai" },
      { value: "declined", label: "Nao vai" }
    ].forEach((option) => {
      const choice = createElement("label", "choice-pill");
      const input = createElement("input");
      const span = createElement("span", "", option.label);
      input.type = "radio";
      input.name = `attendance_${guest.id}`;
      input.value = option.value;
      input.checked = selectedOrCurrentStatus(guest) === option.value;
      input.addEventListener("change", () => {
        draftResponses[guest.id] = option.value;
        status.textContent = `Status atual: ${formatGuestStatus(option.value)}`;
        updateGuestCardState(card, option.value);
        updateSummaryUI(invite, true);
      });
      choice.append(input, span);
      choices.appendChild(choice);
    });

    card.append(title, status, choices);
    dom.inviteGuestList.appendChild(card);
  });
}

function renderInvite(invite) {
  currentInvite = invite;
  draftResponses = Object.fromEntries((invite.guests || []).map((guest) => [guest.id, guest.responseStatus || "pending"]));
  const summary = summarizeGuests(invite.guests || []);

  document.title = `${invite.displayName} | Convite | ${runtimeConfig.couple.names}`;
  setText(dom.inviteFamilyTitle, invite.displayName);
  setText(dom.inviteIntroLead, inviteLeadText(invite));
  setText(dom.inviteCustomMessage, invite.customMessage || "Preparamos esse convite com carinho para sua familia e vamos amar celebrar esse momento com voces.");
  setText(dom.inviteReservedSeats, String(summary.invitedCount));
  setText(dom.inviteStatusText, formatInviteStatus(summary.responseStatus));
  renderInvitedNames(invite);
  updateSummaryUI(invite, true);
  dom.inviteNote.value = invite.attendanceNote || "";
  renderGuestChoices(invite);
}

async function loadInvite() {
  const slug = getInviteSlug();

  if (!slug) {
    setFeedback("error", runtimeConfig.inviteSite.messages.missingInvite);
    setText(dom.inviteFamilyTitle, "Convite não localizado");
    return;
  }

  try {
    const invite = await fetchInviteBySlug(slug);

    if (!invite) {
      setFeedback("error", runtimeConfig.inviteSite.messages.missingInvite);
      setText(dom.inviteFamilyTitle, "Convite não localizado");
      return;
    }

    renderInvite(invite);
  } catch (error) {
    setFeedback("error", runtimeConfig.inviteSite.messages.loadError);
    setText(dom.inviteFamilyTitle, "Convite indisponível");
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
  dom.inviteConfirmAllButton.addEventListener("click", () => {
    if (!currentInvite) {
      return;
    }
    currentInvite.guests.forEach((guest) => {
      draftResponses[guest.id] = "confirmed";
    });
    renderGuestChoices(currentInvite);
    updateSummaryUI(currentInvite, true);
  });

  dom.inviteDeclineAllButton.addEventListener("click", () => {
    if (!currentInvite) {
      return;
    }
    currentInvite.guests.forEach((guest) => {
      draftResponses[guest.id] = "declined";
    });
    renderGuestChoices(currentInvite);
    updateSummaryUI(currentInvite, true);
  });

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
        continue;
      }

      guestsPayload.push({
        id: guest.id,
        responseStatus
      });
    }

    if (!guestsPayload.length) {
      setFeedback("error", runtimeConfig.inviteSite.messages.chooseSomeone);
      return;
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
      const pendingCount = guestSummary(currentInvite).pending;
      setFeedback(
        "success",
        pendingCount > 0 ? runtimeConfig.inviteSite.messages.partialSuccess : runtimeConfig.inviteSite.messages.success
      );
      setText(
        dom.inviteSuccessBody,
        pendingCount > 0
          ? "Registramos as respostas marcadas. Se quiser, voce pode voltar depois para concluir os nomes que ainda ficaram pendentes."
          : "Registramos todas as respostas deste convite. Se quiser, voce pode continuar navegando pelo site principal para ver mais detalhes da celebracao."
      );
      openSuccessModal();
    } catch (error) {
      setFeedback("error", "Não foi possível registrar sua resposta agora. Tente novamente.");
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
  setFeedback("error", "Firebase não foi carregado corretamente para esta página.");
});
