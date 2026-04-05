import { defaultSiteConfig } from "../config/site-config.mjs";
import {
  deleteGiftItem,
  deleteTable,
  loadAdminProfile,
  loadSiteSettings,
  loginAdmin,
  logoutAdmin,
  observeAuthState,
  saveFamily,
  saveGiftItem,
  saveGuestTableAssignments,
  saveSiteSettings,
  saveTable,
  subscribeFamilies,
  subscribeGiftItems,
  subscribeTables,
  toggleFamilyActive
} from "../firebase/client.mjs";
import {
  createElement,
  formatInviteStatus,
  mergeDeep,
  setText,
  setupRevealAnimations,
  slugify,
  generateReadableInviteSlug,
  summarizeGuests,
  toDateTimeLocalValue,
  localDateTimeToIso
} from "../ui/shared-ui.mjs";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const STEP_ORDER = ["families", "confirmations", "tables", "advanced"];
const STEP_INFO = {
  families: {
    index: 1,
    description: "Cadastre as famílias com poucos campos, gere o link automaticamente e copie quando salvar.",
    primaryLabel: "Novo convite"
  },
  confirmations: {
    index: 2,
    description: "Veja rapidamente quem confirmou, quem recusou e quem ainda precisa responder.",
    primaryLabel: "Ir para convites"
  },
  tables: {
    index: 3,
    description: "Cadastre as mesas, gere a distribuição automática e revise só as pendências.",
    primaryLabel: "Gerar distribuição"
  },
  advanced: {
    index: 4,
    description: "Presentes e conteúdo do site continuam acessíveis, mas fora do fluxo principal do painel.",
    primaryLabel: "Novo presente"
  }
};

const dom = {
  adminLoginSection: $("#adminLoginSection"),
  adminDashboardSection: $("#adminDashboardSection"),
  adminLoginTitle: $("#adminLoginTitle"),
  adminLoginBody: $("#adminLoginBody"),
  adminEmailLabel: $("#adminEmailLabel"),
  adminEmail: $("#adminEmail"),
  adminPasswordLabel: $("#adminPasswordLabel"),
  adminPassword: $("#adminPassword"),
  adminLoginForm: $("#adminLoginForm"),
  adminLoginButton: $("#adminLoginButton"),
  adminLoginFeedback: $("#adminLoginFeedback"),
  adminLogoutButton: $("#adminLogoutButton"),
  adminPreviewInviteButton: $("#adminPreviewInviteButton"),
  adminPrimaryActionButton: $("#adminPrimaryActionButton"),
  adminStepDescription: $("#adminStepDescription"),
  adminProgressLabel: $("#adminProgressLabel"),
  adminHeaderSummary: $("#adminHeaderSummary"),
  adminGlobalFeedback: $("#adminGlobalFeedback"),
  stepButtons: $$(".admin-flow-step"),
  stepPanels: $$("[data-step-panel]"),
  familySearchInput: $("#familySearchInput"),
  familyListSummary: $("#familyListSummary"),
  familyList: $("#familyList"),
  familyFormTitle: $("#familyFormTitle"),
  familyFormStatus: $("#familyFormStatus"),
  familyForm: $("#familyForm"),
  familyId: $("#familyId"),
  familyName: $("#familyName"),
  displayName: $("#displayName"),
  customMessage: $("#customMessage"),
  familyGuestsContainer: $("#familyGuestsContainer"),
  addGuestButton: $("#addGuestButton"),
  isActive: $("#isActive"),
  familyToggleSlugButton: $("#familyToggleSlugButton"),
  familySlugEditor: $("#familySlugEditor"),
  familySlug: $("#familySlug"),
  familyAutoLinkPreview: $("#familyAutoLinkPreview"),
  familyRemovalHint: $("#familyRemovalHint"),
  familySubmitButton: $("#familySubmitButton"),
  familyResetButton: $("#familyResetButton"),
  familyFormFeedback: $("#familyFormFeedback"),
  familySavedActions: $("#familySavedActions"),
  familySavedLink: $("#familySavedLink"),
  familyCopyLinkButton: $("#familyCopyLinkButton"),
  confirmationsSearchInput: $("#confirmationsSearchInput"),
  confirmationsListSummary: $("#confirmationsListSummary"),
  confirmationsList: $("#confirmationsList"),
  tableForm: $("#tableForm"),
  tableId: $("#tableId"),
  tableName: $("#tableName"),
  tableCapacity: $("#tableCapacity"),
  tableNotes: $("#tableNotes"),
  tableSubmitButton: $("#tableSubmitButton"),
  tableResetButton: $("#tableResetButton"),
  tableFormFeedback: $("#tableFormFeedback"),
  tableListSummary: $("#tableListSummary"),
  tableList: $("#tableList"),
  tableDistributionStats: $("#tableDistributionStats"),
  generateAssignmentsButton: $("#generateAssignmentsButton"),
  tableGenerationFeedback: $("#tableGenerationFeedback"),
  seatingSearchInput: $("#seatingSearchInput"),
  seatingFamilyList: $("#seatingFamilyList"),
  seatingFeedback: $("#seatingFeedback"),
  giftForm: $("#giftForm"),
  giftId: $("#giftId"),
  giftName: $("#giftName"),
  giftPurchaseUrl: $("#giftPurchaseUrl"),
  giftImageUrl: $("#giftImageUrl"),
  giftIsActive: $("#giftIsActive"),
  giftSubmitButton: $("#giftSubmitButton"),
  giftResetButton: $("#giftResetButton"),
  giftFormFeedback: $("#giftFormFeedback"),
  giftListSummary: $("#giftListSummary"),
  giftList: $("#giftList"),
  siteViewInviteButton: $("#siteViewInviteButton"),
  siteSettingsForm: $("#siteSettingsForm"),
  settingsCoupleNames: $("#settingsCoupleNames"),
  settingsMonogram: $("#settingsMonogram"),
  settingsDateText: $("#settingsDateText"),
  settingsDateTime: $("#settingsDateTime"),
  settingsVenueName: $("#settingsVenueName"),
  settingsVenueAddress: $("#settingsVenueAddress"),
  settingsMapsLabel: $("#settingsMapsLabel"),
  settingsMapsUrl: $("#settingsMapsUrl"),
  settingsHeroEyebrow: $("#settingsHeroEyebrow"),
  settingsSubtitle: $("#settingsSubtitle"),
  settingsIntroKicker: $("#settingsIntroKicker"),
  settingsIntroTitle: $("#settingsIntroTitle"),
  settingsIntroBody: $("#settingsIntroBody"),
  settingsStoryKicker: $("#settingsStoryKicker"),
  settingsStoryTitle: $("#settingsStoryTitle"),
  settingsStoryBody: $("#settingsStoryBody"),
  settingsShowGifts: $("#settingsShowGifts"),
  siteSettingsSubmitButton: $("#siteSettingsSubmitButton"),
  siteSettingsFeedback: $("#siteSettingsFeedback")
};

const state = {
  step: "families",
  families: [],
  gifts: [],
  tables: [],
  siteConfig: buildRuntimeConfig(),
  user: null,
  profile: null,
  familySlugEditorVisible: false,
  lastSavedInviteUrl: "",
  subscriptionsStarted: false,
  unsubscribeFamilies: null,
  unsubscribeGifts: null,
  unsubscribeTables: null
};

function buildRuntimeConfig(override) {
  const merged = mergeDeep(defaultSiteConfig, override || {});
  if (!merged.features) {
    merged.features = {};
  }
  if (typeof merged.features.showGifts !== "boolean") {
    merged.features.showGifts = true;
  }
  return merged;
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeGuestKey(value) {
  return normalizeString(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function inviteUrl(slug) {
  return new URL(`convite.html?slug=${encodeURIComponent(slug)}`, window.location.href).toString();
}

function emptyState(message) {
  return createElement("div", "empty-state-card", message);
}

function setFeedback(element, type, message) {
  if (!element) {
    return;
  }
  element.textContent = message || "";
  element.classList.remove("is-success", "is-error");
  if (type === "success") {
    element.classList.add("is-success");
  }
  if (type === "error") {
    element.classList.add("is-error");
  }
}

function setGlobalFeedback(type, message) {
  setFeedback(dom.adminGlobalFeedback, type, message);
}

function showLoggedOutState(message = "") {
  dom.adminLoginSection.hidden = false;
  dom.adminDashboardSection.hidden = true;
  setFeedback(dom.adminLoginFeedback, message ? "error" : "", message);
}

function showLoggedInState() {
  dom.adminLoginSection.hidden = true;
  dom.adminDashboardSection.hidden = false;
  setFeedback(dom.adminLoginFeedback, "", "");
}

function setLoginBusy(isBusy) {
  dom.adminEmail.disabled = isBusy;
  dom.adminPassword.disabled = isBusy;
  dom.adminLoginButton.disabled = isBusy;
  setText(
    dom.adminLoginButton,
    isBusy ? defaultSiteConfig.adminSite.login.loadingLabel : defaultSiteConfig.adminSite.login.submitLabel
  );
}

function hydrateLoginCopy() {
  setText(dom.adminLoginTitle, defaultSiteConfig.adminSite.login.title);
  setText(dom.adminLoginBody, `${defaultSiteConfig.adminSite.login.body} ${defaultSiteConfig.adminSite.setupHint}`);
  setText(dom.adminEmailLabel, defaultSiteConfig.adminSite.login.emailLabel);
  setText(dom.adminPasswordLabel, defaultSiteConfig.adminSite.login.passwordLabel);
  setText(dom.adminLoginButton, defaultSiteConfig.adminSite.login.submitLabel);
}

function getAdminLoginErrorMessage(error) {
  if (!error?.code) {
    return defaultSiteConfig.adminSite.login.errorMessage;
  }
  if (error.code === "auth/invalid-email") {
    return "Informe um e-mail válido para continuar.";
  }
  if (
    error.code === "auth/wrong-password"
    || error.code === "auth/invalid-credential"
    || error.code === "auth/invalid-login-credentials"
  ) {
    return "A senha informada está incorreta.";
  }
  if (error.code === "auth/user-not-found") {
    return "Esse usuário ainda não foi criado no Firebase Authentication.";
  }
  return defaultSiteConfig.adminSite.login.errorMessage;
}

function familyById(familyId) {
  return state.families.find((family) => family.id === familyId) || null;
}

function tableById(tableId) {
  return state.tables.find((table) => table.id === tableId) || null;
}

function giftById(giftId) {
  return state.gifts.find((gift) => gift.id === giftId) || null;
}

function familyLabel(family) {
  return family?.displayName || family?.familyName || "Família sem nome";
}

function copyText(value) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }

  const textarea = createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  return Promise.resolve();
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function currentStepInfo() {
  return STEP_INFO[state.step] || STEP_INFO.families;
}

function siteFormDataFromConfig(config) {
  return {
    settingsCoupleNames: config.couple?.names || "",
    settingsMonogram: config.couple?.monogram || "",
    settingsDateText: config.couple?.dateText || "",
    settingsDateTime: toDateTimeLocalValue(config.couple?.dateTime || ""),
    settingsVenueName: config.event?.venueName || "",
    settingsVenueAddress: config.event?.address || "",
    settingsMapsLabel: config.event?.mapsLabel || "",
    settingsMapsUrl: config.event?.mapsUrl || "",
    settingsHeroEyebrow: config.publicSite?.hero?.eyebrow || "",
    settingsSubtitle: config.couple?.subtitle || "",
    settingsIntroKicker: config.publicSite?.intro?.kicker || "",
    settingsIntroTitle: config.publicSite?.intro?.title || "",
    settingsIntroBody: config.publicSite?.intro?.body || "",
    settingsStoryKicker: config.publicSite?.story?.kicker || "",
    settingsStoryTitle: config.publicSite?.story?.title || "",
    settingsStoryBody: config.publicSite?.story?.body || "",
    settingsShowGifts: config.features?.showGifts !== false
  };
}

function applySiteFormData(data) {
  dom.settingsCoupleNames.value = data.settingsCoupleNames || "";
  dom.settingsMonogram.value = data.settingsMonogram || "";
  dom.settingsDateText.value = data.settingsDateText || "";
  dom.settingsDateTime.value = data.settingsDateTime || "";
  dom.settingsVenueName.value = data.settingsVenueName || "";
  dom.settingsVenueAddress.value = data.settingsVenueAddress || "";
  dom.settingsMapsLabel.value = data.settingsMapsLabel || "";
  dom.settingsMapsUrl.value = data.settingsMapsUrl || "";
  dom.settingsHeroEyebrow.value = data.settingsHeroEyebrow || "";
  dom.settingsSubtitle.value = data.settingsSubtitle || "";
  dom.settingsIntroKicker.value = data.settingsIntroKicker || "";
  dom.settingsIntroTitle.value = data.settingsIntroTitle || "";
  dom.settingsIntroBody.value = data.settingsIntroBody || "";
  dom.settingsStoryKicker.value = data.settingsStoryKicker || "";
  dom.settingsStoryTitle.value = data.settingsStoryTitle || "";
  dom.settingsStoryBody.value = data.settingsStoryBody || "";
  dom.settingsShowGifts.checked = data.settingsShowGifts !== false;
}

function openInvitePreview() {
  const selectedFamily = familyById(normalizeString(dom.familyId.value));
  const fallbackFamily = state.families.find((family) => family.slug && family.isActive !== false);
  const targetFamily = selectedFamily?.slug ? selectedFamily : fallbackFamily;

  if (!targetFamily?.slug) {
    setGlobalFeedback("error", "Salve ou selecione um convite ativo antes de abrir a prévia.");
    return;
  }

  window.open(inviteUrl(targetFamily.slug), "_blank", "noopener,noreferrer");
}

function renderChrome() {
  const step = currentStepInfo();
  setText(dom.adminProgressLabel, `Etapa ${step.index} de ${STEP_ORDER.length}`);
  setText(dom.adminStepDescription, step.description);
  setText(dom.adminPrimaryActionButton, step.primaryLabel);
  dom.stepButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.step === state.step);
  });
  dom.stepPanels.forEach((panel) => {
    panel.hidden = panel.dataset.stepPanel !== state.step;
  });

  const confirmedGuests = state.families.reduce((count, family) => {
    return count + (family.guests || []).filter((guest) => guest.responseStatus === "confirmed").length;
  }, 0);

  setText(
    dom.adminHeaderSummary,
    `${state.families.length} ${state.families.length === 1 ? "convite" : "convites"} • ${confirmedGuests} confirmados`
  );
}

function filteredFamilies(searchTerm) {
  const query = normalizeString(searchTerm).toLowerCase();

  return state.families
    .slice()
    .sort((left, right) => familyLabel(left).localeCompare(familyLabel(right), "pt-BR"))
    .filter((family) => {
      if (!query) {
        return true;
      }

      const blob = [
        family.familyName,
        family.displayName,
        family.slug,
        ...(family.guests || []).map((guest) => guest.name)
      ]
        .join(" ")
        .toLowerCase();

      return blob.includes(query);
    });
}

function familyBadge(family) {
  if (family?.isActive === false) {
    return {
      label: "Oculto",
      className: "status-badge status-hidden"
    };
  }

  const summary = summarizeGuests(family?.guests || []);
  const statusClass = summary.responseStatus === "confirmed"
    ? "status-confirmed"
    : summary.responseStatus === "declined"
      ? "status-declined"
      : summary.responseStatus === "partial"
        ? "status-partial"
        : "status-pending";

  return {
    label: formatInviteStatus(summary.responseStatus),
    className: `status-badge ${statusClass}`
  };
}

function setFamilySlugEditorVisible(isVisible) {
  state.familySlugEditorVisible = isVisible;
  dom.familySlugEditor.hidden = !isVisible;
  setText(dom.familyToggleSlugButton, isVisible ? "Ocultar edição do link" : "Editar link");
}

function addGuestInputLine(initialValue = "") {
  if (!dom.familyGuestsContainer) return;
  const wrapper = createElement("div", "admin-guest-input-line");
  const input = createElement("input", "");
  input.type = "text";
  input.placeholder = "Ex.: João Silva";
  input.value = initialValue;
  
  const removeBtn = createElement("button", "button button-small button-light-outline", "Remover");
  removeBtn.type = "button";
  removeBtn.onclick = () => wrapper.remove();
  
  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);
  dom.familyGuestsContainer.appendChild(wrapper);
}

function syncFamilyFormMode() {
  const isEditing = Boolean(normalizeString(dom.familyId.value));
  setText(dom.familyFormTitle, isEditing ? "Editar convite" : "Novo convite");
  setText(
    dom.familyFormStatus,
    isEditing
      ? "Revise os nomes, ajuste a mensagem e salve sem perder as respostas já registradas."
      : "Cadastre uma família por vez e cole os convidados em linhas separadas."
  );
}

function syncFamilyLinkPreview() {
  const slug = slugify(
    normalizeString(dom.familySlug.value)
      || normalizeString(dom.familyName.value)
      || normalizeString(dom.displayName.value)
  );

  if (!slug) {
    setText(dom.familyAutoLinkPreview, "O link será gerado automaticamente.");
    return;
  }

  setText(dom.familyAutoLinkPreview, inviteUrl(slug));
}

function readGuestNames() {
  return Array.from(dom.familyGuestsContainer.querySelectorAll("input"))
    .map((input) => normalizeString(input.value))
    .filter(Boolean);
}

function buildGuestPayload(existingFamily, guestNames) {
  const queuedGuests = new Map();
  const matchedIds = new Set();

  (existingFamily?.guests || []).forEach((guest) => {
    const key = normalizeGuestKey(guest.name);

    if (!queuedGuests.has(key)) {
      queuedGuests.set(key, []);
    }

    queuedGuests.get(key).push(guest);
  });

  const guests = guestNames.map((name) => {
    const key = normalizeGuestKey(name);
    const matchedGuest = queuedGuests.get(key)?.shift() || null;

    if (matchedGuest?.id) {
      matchedIds.add(matchedGuest.id);
      return {
        id: matchedGuest.id,
        name,
        responseStatus: matchedGuest.responseStatus || "pending",
        tableId: matchedGuest.tableId || ""
      };
    }

    return {
      name,
      responseStatus: "pending",
      tableId: ""
    };
  });

  return {
    guests,
    removedGuests: (existingFamily?.guests || []).filter((guest) => !matchedIds.has(guest.id))
  };
}

function renderFamilyRemovalHint() {
  const existingFamily = familyById(normalizeString(dom.familyId.value));

  if (!existingFamily) {
    setText(dom.familyRemovalHint, "");
    return;
  }

  const removedGuests = buildGuestPayload(existingFamily, readGuestNames()).removedGuests;

  if (!removedGuests.length) {
    setText(dom.familyRemovalHint, "");
    return;
  }

  const names = removedGuests.slice(0, 3).map((guest) => guest.name).join(", ");
  const suffix = removedGuests.length > 3 ? "..." : "";
  setText(
    dom.familyRemovalHint,
    `Se salvar agora, ${removedGuests.length} convidado(s) serão removidos: ${names}${suffix}`
  );
}

function renderSavedFamilyActions() {
  dom.familySavedActions.hidden = !state.lastSavedInviteUrl;
  setText(dom.familySavedLink, state.lastSavedInviteUrl || "");
}

function fillFamilyForm(family) {
  dom.familyId.value = family?.id || "";
  dom.familyName.value = family?.familyName || "";
  dom.displayName.value = family?.displayName || "";
  dom.customMessage.value = family?.customMessage || "";
  
  dom.familyGuestsContainer.innerHTML = "";
  const guests = family?.guests || [];
  if (guests.length === 0) {
    addGuestInputLine("");
  } else {
    guests.forEach((guest) => addGuestInputLine(guest.name));
  }

  dom.isActive.checked = family?.isActive !== false;
  dom.familySlug.value = family?.slug || "";
  state.lastSavedInviteUrl = family?.slug ? inviteUrl(family.slug) : "";
  setFamilySlugEditorVisible(false);
  syncFamilyFormMode();
  syncFamilyLinkPreview();
  renderSavedFamilyActions();
  renderFamilyRemovalHint();
  setFeedback(dom.familyFormFeedback, "", "");
}

function openNewFamilyEditor() {
  fillFamilyForm(null);
  state.lastSavedInviteUrl = "";
  renderSavedFamilyActions();
  setCurrentStep("families");
}

function openFamilyEditor(familyId) {
  const family = familyById(familyId);

  if (!family) {
    return;
  }

  fillFamilyForm(family);
  setCurrentStep("families");
}

async function handleFamilySave(event) {
  event.preventDefault();

  const familyName = normalizeString(dom.familyName.value);
  const displayName = normalizeString(dom.displayName.value);
  const guestNames = readGuestNames();
  const existingFamily = familyById(normalizeString(dom.familyId.value));
  let slug = "";
  const inputSlug = normalizeString(dom.familySlug.value);
  if (inputSlug) {
    slug = slugify(inputSlug);
  } else if (existingFamily?.slug) {
    slug = existingFamily.slug;
  } else {
    slug = generateReadableInviteSlug(familyName || displayName);
  }

  if (!familyName || !displayName) {
    setFeedback(dom.familyFormFeedback, "error", "Preencha o nome da família e o nome exibido.");
    return;
  }

  if (!guestNames.length) {
    setFeedback(dom.familyFormFeedback, "error", "Adicione pelo menos um convidado em linhas separadas.");
    return;
  }

  if (!slug) {
    setFeedback(dom.familyFormFeedback, "error", "Não foi possível gerar o link do convite. Revise o nome da família.");
    return;
  }

  const { guests, removedGuests } = buildGuestPayload(existingFamily, guestNames);

  if (removedGuests.length) {
    const names = removedGuests.slice(0, 5).map((guest) => guest.name).join(", ");
    const suffix = removedGuests.length > 5 ? "..." : "";
    const confirmed = window.confirm(
      `Ao salvar, estes convidados serão removidos e podem perder resposta e mesa: ${names}${suffix}\n\nDeseja continuar?`
    );

    if (!confirmed) {
      return;
    }
  }

  dom.familySubmitButton.disabled = true;
  setText(dom.familySubmitButton, "Salvando...");
  setFeedback(dom.familyFormFeedback, "", "");

  try {
    const familyId = await saveFamily({
      id: normalizeString(dom.familyId.value),
      familyName,
      displayName,
      customMessage: normalizeString(dom.customMessage.value),
      attendanceNote: existingFamily?.attendanceNote || "",
      slug,
      isActive: dom.isActive.checked,
      guests
    });

    dom.familyId.value = familyId;
    dom.familySlug.value = slug;
    state.lastSavedInviteUrl = inviteUrl(slug);
    syncFamilyFormMode();
    syncFamilyLinkPreview();
    renderSavedFamilyActions();
    renderFamilyRemovalHint();
    setFeedback(dom.familyFormFeedback, "success", "Convite salvo com sucesso.");
    setGlobalFeedback("success", "Convite salvo. Você já pode copiar o link e enviar.");
  } catch (error) {
    console.error("Erro ao salvar convite:", error);
    if (error?.code === "family/slug-already-exists") {
      setFeedback(dom.familyFormFeedback, "error", "Já existe um convite com esse link. Clique em 'Editar link' e escolha outro.");
    } else {
      const message = error?.message || "Não foi possível salvar este convite agora.";
      setFeedback(dom.familyFormFeedback, "error", message);
    }
  } finally {
    dom.familySubmitButton.disabled = false;
    setText(dom.familySubmitButton, "Salvar convite");
  }
}

function familyStats(items) {
  const shell = createElement("div", "family-stats");

  items.forEach((item) => {
    const stat = createElement("div", "family-stat");
    stat.append(createElement("strong", "", item.value), createElement("span", "", item.label));
    shell.appendChild(stat);
  });

  return shell;
}

function renderFamilyCard(family, options = {}) {
  const summary = summarizeGuests(family.guests || []);
  const badge = familyBadge(family);
  const card = createElement("article", "family-card admin-record-card");
  const header = createElement("div", "family-card-header");
  const titleWrap = createElement("div", "admin-info-stack");

  titleWrap.append(
    createElement("h3", "family-card-title", familyLabel(family)),
    createElement("p", "section-body compact-body", family.familyName || "")
  );
  header.append(titleWrap, createElement("span", badge.className, badge.label));

  const actions = createElement("div", "inline-actions");
  const editButton = createElement(
    "button",
    "button button-secondary button-solid-light",
    options.editLabel || "Editar"
  );
  editButton.type = "button";
  editButton.addEventListener("click", () => openFamilyEditor(family.id));
  actions.appendChild(editButton);

  if (options.showCopy !== false) {
    const copyButton = createElement("button", "button button-secondary button-solid-light", "Copiar link");
    copyButton.type = "button";
    copyButton.disabled = !family.slug;
    copyButton.addEventListener("click", async () => {
      try {
        await copyText(inviteUrl(family.slug));
        setGlobalFeedback("success", "Link do convite copiado.");
      } catch {
        setGlobalFeedback("error", "Não foi possível copiar o link agora.");
      }
    });
    actions.appendChild(copyButton);
  }

  if (options.showToggle !== false) {
    const toggleButton = createElement(
      "button",
      "button button-secondary button-solid-light",
      family.isActive === false ? "Ativar" : "Ocultar"
    );
    toggleButton.type = "button";
    toggleButton.addEventListener("click", async () => {
      toggleButton.disabled = true;
      try {
        await toggleFamilyActive(family.id, family.isActive === false);
        setGlobalFeedback("success", family.isActive === false ? "Convite ativado." : "Convite ocultado.");
      } catch {
        setGlobalFeedback("error", "Não foi possível alterar esse convite agora.");
      } finally {
        toggleButton.disabled = false;
      }
    });
    actions.appendChild(toggleButton);
  }

  const linkRow = createElement("div", "family-link-row");
  linkRow.append(
    createElement("span", "family-link-label", "Link do convite"),
    createElement("div", "family-link-box", family.slug ? inviteUrl(family.slug) : "Esse convite ainda não tem link.")
  );

  const stats = options.confirmationMode
    ? familyStats([
        { label: "Confirmados", value: String(summary.confirmedCount) },
        { label: "Pendentes", value: String(summary.pendingCount) },
        { label: "Recusados", value: String(summary.declinedCount) }
      ])
    : familyStats([
        { label: "Convidados", value: String(summary.invitedCount) },
        { label: "Confirmados", value: String(summary.confirmedCount) },
        { label: "Pendentes", value: String(summary.pendingCount) }
      ]);

  card.append(header, stats, linkRow, actions);
  return card;
}

function renderFamilies() {
  const families = filteredFamilies(dom.familySearchInput.value);
  dom.familyList.innerHTML = "";
  setText(
    dom.familyListSummary,
    `${families.length} ${families.length === 1 ? "família encontrada" : "famílias encontradas"}`
  );

  if (!families.length) {
    dom.familyList.appendChild(emptyState("Nenhum convite combina com a busca atual."));
    return;
  }

  families.forEach((family) => {
    dom.familyList.appendChild(renderFamilyCard(family));
  });
}

function renderConfirmations() {
  const families = filteredFamilies(dom.confirmationsSearchInput.value);
  dom.confirmationsList.innerHTML = "";
  setText(
    dom.confirmationsListSummary,
    `${families.length} ${families.length === 1 ? "família listada" : "famílias listadas"}`
  );

  if (!families.length) {
    dom.confirmationsList.appendChild(emptyState("Nenhuma família combina com a busca atual."));
    return;
  }

  families.forEach((family) => {
    dom.confirmationsList.appendChild(
      renderFamilyCard(family, {
        confirmationMode: true,
        editLabel: "Editar cadastro",
        showToggle: false
      })
    );
  });
}

function confirmedFamilyRows() {
  return state.families
    .map((family) => {
      const confirmedGuests = (family.guests || []).filter((guest) => guest.responseStatus === "confirmed");
      const tableIds = Array.from(new Set(
        confirmedGuests
          .map((guest) => normalizeString(guest.tableId))
          .filter(Boolean)
      ));

      return {
        id: family.id,
        familyName: family.familyName || "",
        displayName: familyLabel(family),
        confirmedGuests,
        confirmedCount: confirmedGuests.length,
        currentTableId: tableIds.length === 1 ? tableIds[0] : "",
        currentTableIds: tableIds,
        isSplit: tableIds.length > 1
      };
    })
    .filter((row) => row.confirmedCount > 0)
    .sort((left, right) => {
      if (right.confirmedCount !== left.confirmedCount) {
        return right.confirmedCount - left.confirmedCount;
      }
      return left.displayName.localeCompare(right.displayName, "pt-BR");
    });
}

function confirmedTableUsage(excludedFamilyId = "") {
  const usage = new Map();

  state.families.forEach((family) => {
    if (family.id === excludedFamilyId) {
      return;
    }

    (family.guests || []).forEach((guest) => {
      if (guest.responseStatus === "confirmed" && guest.tableId) {
        usage.set(guest.tableId, (usage.get(guest.tableId) || 0) + 1);
      }
    });
  });

  return usage;
}

function availableSeatsForFamily(row, tableId) {
  const table = tableById(tableId);

  if (!table) {
    return 0;
  }

  const occupiedByOthers = confirmedTableUsage(row.id).get(tableId) || 0;
  return Number(table.capacity || 0) - occupiedByOthers;
}

function openNewTableEditor() {
  dom.tableId.value = "";
  dom.tableName.value = "";
  dom.tableCapacity.value = "";
  dom.tableNotes.value = "";
  setFeedback(dom.tableFormFeedback, "", "");
}

function openTableEditor(tableId) {
  const table = tableById(tableId);

  if (!table) {
    return;
  }

  dom.tableId.value = table.id;
  dom.tableName.value = table.name || "";
  dom.tableCapacity.value = String(table.capacity || "");
  dom.tableNotes.value = table.notes || "";
  setFeedback(dom.tableFormFeedback, "", "");
  setCurrentStep("tables");
}

async function handleTableSave(event) {
  event.preventDefault();

  const name = normalizeString(dom.tableName.value);
  const capacity = Number(dom.tableCapacity.value || 0);
  const existingTable = tableById(normalizeString(dom.tableId.value));

  if (!name || !capacity) {
    setFeedback(dom.tableFormFeedback, "error", "Informe o nome da mesa e uma capacidade válida.");
    return;
  }

  dom.tableSubmitButton.disabled = true;
  setText(dom.tableSubmitButton, "Salvando...");
  setFeedback(dom.tableFormFeedback, "", "");

  try {
    await saveTable({
      id: normalizeString(dom.tableId.value),
      name,
      capacity,
      notes: normalizeString(dom.tableNotes.value),
      sortOrder: existingTable?.sortOrder || Date.now()
    });

    setFeedback(dom.tableFormFeedback, "success", "Mesa salva com sucesso.");
    setGlobalFeedback("success", "Mesa salva.");
    openNewTableEditor();
  } catch (error) {
    console.error("Erro ao salvar mesa:", error);
    const message = error?.message || "Não foi possível salvar esta mesa agora.";
    setFeedback(dom.tableFormFeedback, "error", message);
  } finally {
    dom.tableSubmitButton.disabled = false;
    setText(dom.tableSubmitButton, "Salvar mesa");
  }
}

function renderTableStats() {
  const rows = confirmedFamilyRows();
  const assignedFamilies = rows.filter((row) => row.currentTableId && !row.isSplit).length;
  const pendingFamilies = rows.filter((row) => !row.currentTableId || row.isSplit).length;
  const confirmedGuests = rows.reduce((count, row) => count + row.confirmedCount, 0);
  dom.tableDistributionStats.innerHTML = "";

  [
    { label: "Mesas", value: String(state.tables.length) },
    { label: "Confirmados", value: String(confirmedGuests) },
    { label: "Famílias alocadas", value: String(assignedFamilies) },
    { label: "Pendências", value: String(pendingFamilies) }
  ].forEach((item) => {
    const stat = createElement("div", "family-stat");
    stat.append(createElement("strong", "", item.value), createElement("span", "", item.label));
    dom.tableDistributionStats.appendChild(stat);
  });
}

function renderTables() {
  const usage = confirmedTableUsage();
  dom.tableList.innerHTML = "";
  setText(
    dom.tableListSummary,
    `${state.tables.length} ${state.tables.length === 1 ? "mesa cadastrada" : "mesas cadastradas"}`
  );

  if (!state.tables.length) {
    dom.tableList.appendChild(emptyState("Cadastre pelo menos uma mesa para começar a distribuição."));
    return;
  }

  state.tables.forEach((table) => {
    const card = createElement("article", "table-card");
    const header = createElement("div", "table-card-header");
    header.append(
      createElement("h3", "panel-title", table.name || "Mesa sem nome"),
      createElement("span", "occupancy-badge", `${usage.get(table.id) || 0}/${Number(table.capacity || 0)}`)
    );

    const notes = createElement("p", "section-body compact-body", table.notes || "Sem observações.");
    const actions = createElement("div", "inline-actions");
    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => openTableEditor(table.id));

    const deleteButton = createElement("button", "button button-secondary button-solid-light", "Excluir");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", async () => {
      const occupiedSeats = usage.get(table.id) || 0;
      const confirmed = window.confirm(
        occupiedSeats
          ? `Essa mesa tem ${occupiedSeats} confirmado(s). Excluir vai limpar essas alocações. Deseja continuar?`
          : "Deseja excluir esta mesa?"
      );

      if (!confirmed) {
        return;
      }

      try {
        await deleteTable(table.id);
        setGlobalFeedback("success", "Mesa excluída.");
      } catch {
        setGlobalFeedback("error", "Não foi possível excluir essa mesa agora.");
      }
    });

    actions.append(editButton, deleteButton);
    card.append(header, notes, actions);
    dom.tableList.appendChild(card);
  });
}

function automaticPlan() {
  const tableSlots = state.tables
    .map((table) => ({
      id: table.id,
      name: table.name || "",
      capacity: Number(table.capacity || 0),
      remaining: Number(table.capacity || 0),
      sortOrder: Number(table.sortOrder || 0)
    }))
    .filter((table) => table.capacity > 0)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return left.name.localeCompare(right.name, "pt-BR");
    });

  const familyAssignments = new Map();
  const unresolvedFamilies = [];

  confirmedFamilyRows().forEach((row) => {
    const targetTable = tableSlots.find((table) => table.remaining >= row.confirmedCount);

    if (!targetTable) {
      unresolvedFamilies.push(row);
      return;
    }

    familyAssignments.set(row.id, targetTable.id);
    targetTable.remaining -= row.confirmedCount;
  });

  return {
    familyAssignments,
    unresolvedFamilies
  };
}

async function handleGenerateAssignments() {
  const rows = confirmedFamilyRows();

  if (!state.tables.length) {
    setFeedback(dom.tableGenerationFeedback, "error", "Cadastre pelo menos uma mesa antes de gerar a distribuição.");
    setCurrentStep("tables");
    return;
  }

  if (!rows.length) {
    setFeedback(dom.tableGenerationFeedback, "error", "Ainda não há convidados confirmados para distribuir.");
    setCurrentStep("tables");
    return;
  }

  const assignedGuests = rows.reduce((count, row) => {
    return count + row.confirmedGuests.filter((guest) => guest.tableId).length;
  }, 0);

  if (assignedGuests > 0) {
    const confirmed = window.confirm(
      "Gerar a distribuição vai substituir as alocações atuais dos convidados confirmados. Deseja continuar?"
    );

    if (!confirmed) {
      return;
    }
  }

  const plan = automaticPlan();
  const changes = rows.flatMap((row) => {
    const tableId = plan.familyAssignments.get(row.id) || "";
    return row.confirmedGuests.map((guest) => ({
      familyId: row.id,
      guestId: guest.id,
      tableId
    }));
  });

  dom.generateAssignmentsButton.disabled = true;
  setText(dom.generateAssignmentsButton, "Gerando...");
  setFeedback(dom.tableGenerationFeedback, "", "");

  try {
    await saveGuestTableAssignments(changes);
    const allocatedFamilies = rows.length - plan.unresolvedFamilies.length;
    const pendingMessage = plan.unresolvedFamilies.length
      ? ` ${plan.unresolvedFamilies.length} família(s) ficaram pendentes para revisão manual.`
      : "";
    setFeedback(
      dom.tableGenerationFeedback,
      "success",
      `${allocatedFamilies} família(s) foram distribuídas automaticamente.${pendingMessage}`
    );
    setGlobalFeedback("success", "Distribuição de mesas atualizada.");
    setCurrentStep("tables");
  } catch {
    setFeedback(dom.tableGenerationFeedback, "error", "Não foi possível gerar a distribuição agora.");
  } finally {
    dom.generateAssignmentsButton.disabled = false;
    setText(dom.generateAssignmentsButton, "Gerar distribuição");
  }
}

async function handleManualFamilyAssignment(row, nextTableId) {
  if (nextTableId) {
    const availableSeats = availableSeatsForFamily(row, nextTableId);

    if (availableSeats < row.confirmedCount) {
      setFeedback(dom.seatingFeedback, "error", "Essa mesa não tem lugares suficientes para manter a família junta.");
      renderSeatingAssignments();
      return;
    }
  }

  try {
    await saveGuestTableAssignments(row.confirmedGuests.map((guest) => ({
      familyId: row.id,
      guestId: guest.id,
      tableId: nextTableId
    })));
    setFeedback(dom.seatingFeedback, "success", "Mesa da família atualizada com sucesso.");
  } catch {
    setFeedback(dom.seatingFeedback, "error", "Não foi possível atualizar essa família agora.");
  }
}

function renderSeatingAssignments() {
  const query = normalizeString(dom.seatingSearchInput.value).toLowerCase();
  const rows = confirmedFamilyRows().filter((row) => {
    if (!query) {
      return true;
    }
    return `${row.displayName} ${row.familyName}`.toLowerCase().includes(query);
  });

  dom.seatingFamilyList.innerHTML = "";

  if (!rows.length) {
    dom.seatingFamilyList.appendChild(emptyState("Nenhuma família confirmada combina com a busca atual."));
    return;
  }

  rows.forEach((row) => {
    const shell = createElement("div", "assignment-row admin-family-seat-row");
    const copy = createElement("div", "assignment-copy");
    const currentTableText = row.isSplit
      ? "Família dividida entre mesas"
      : row.currentTableId
        ? `Mesa atual: ${tableById(row.currentTableId)?.name || "Mesa removida"}`
        : "Sem mesa definida";
    copy.append(
      createElement("strong", "", row.displayName),
      createElement("span", "", `${row.confirmedCount} confirmado(s) • ${currentTableText}`)
    );

    const select = createElement("select", "assignment-select");
    select.appendChild(new Option("Sem mesa", ""));

    state.tables.forEach((table) => {
      const freeSeats = availableSeatsForFamily(row, table.id);
      const option = new Option(
        `${table.name} (${Math.max(freeSeats, 0)} vaga(s))`,
        table.id,
        false,
        table.id === row.currentTableId
      );
      option.disabled = freeSeats < row.confirmedCount;
      select.appendChild(option);
    });

    select.value = row.currentTableId || "";
    select.addEventListener("change", async () => {
      select.disabled = true;
      await handleManualFamilyAssignment(row, normalizeString(select.value));
      select.disabled = false;
    });

    shell.append(copy, select);
    dom.seatingFamilyList.appendChild(shell);
  });
}

function sitePayloadFromForm() {
  return {
    couple: {
      names: normalizeString(dom.settingsCoupleNames.value),
      monogram: normalizeString(dom.settingsMonogram.value),
      dateText: normalizeString(dom.settingsDateText.value),
      dateTime: localDateTimeToIso(normalizeString(dom.settingsDateTime.value)),
      subtitle: normalizeString(dom.settingsSubtitle.value)
    },
    event: {
      venueName: normalizeString(dom.settingsVenueName.value),
      address: normalizeString(dom.settingsVenueAddress.value),
      mapsLabel: normalizeString(dom.settingsMapsLabel.value),
      mapsUrl: normalizeString(dom.settingsMapsUrl.value)
    },
    features: {
      showGifts: Boolean(dom.settingsShowGifts.checked)
    },
    publicSite: {
      hero: {
        eyebrow: normalizeString(dom.settingsHeroEyebrow.value)
      },
      intro: {
        kicker: normalizeString(dom.settingsIntroKicker.value),
        title: normalizeString(dom.settingsIntroTitle.value),
        body: normalizeString(dom.settingsIntroBody.value)
      },
      story: {
        kicker: normalizeString(dom.settingsStoryKicker.value),
        title: normalizeString(dom.settingsStoryTitle.value),
        body: normalizeString(dom.settingsStoryBody.value)
      }
    }
  };
}

function openNewGiftEditor() {
  resetGiftForm();
  setCurrentStep("advanced");
}

function resetGiftForm() {
  dom.giftId.value = "";
  dom.giftName.value = "";
  dom.giftPurchaseUrl.value = "";
  dom.giftImageUrl.value = "";
  dom.giftIsActive.checked = true;
  setFeedback(dom.giftFormFeedback, "", "");
}

function openGiftEditor(giftId) {
  const gift = giftById(giftId);

  if (!gift) {
    return;
  }

  dom.giftId.value = gift.id;
  dom.giftName.value = gift.name || "";
  dom.giftPurchaseUrl.value = gift.purchaseUrl || "";
  dom.giftImageUrl.value = gift.imageUrl || "";
  dom.giftIsActive.checked = gift.isActive !== false;
  setFeedback(dom.giftFormFeedback, "", "");
  setCurrentStep("advanced");
}

async function handleGiftSave(event) {
  event.preventDefault();

  const name = normalizeString(dom.giftName.value);
  const purchaseUrl = normalizeString(dom.giftPurchaseUrl.value);
  const imageUrl = normalizeString(dom.giftImageUrl.value);
  const existingGift = giftById(normalizeString(dom.giftId.value));

  if (!name) {
    setFeedback(dom.giftFormFeedback, "error", "Informe o nome do presente.");
    return;
  }

  if (!imageUrl || !isValidUrl(imageUrl)) {
    setFeedback(dom.giftFormFeedback, "error", "Informe uma URL de imagem válida.");
    return;
  }

  if (purchaseUrl && !isValidUrl(purchaseUrl)) {
    setFeedback(dom.giftFormFeedback, "error", "Informe um link de compra válido.");
    return;
  }

  dom.giftSubmitButton.disabled = true;
  setText(dom.giftSubmitButton, "Salvando...");
  setFeedback(dom.giftFormFeedback, "", "");

  try {
    await saveGiftItem({
      id: normalizeString(dom.giftId.value),
      sortOrder: existingGift?.sortOrder || Date.now(),
      name,
      purchaseUrl,
      imageUrl,
      isActive: dom.giftIsActive.checked
    });
    setFeedback(dom.giftFormFeedback, "success", "Presente salvo com sucesso.");
    setGlobalFeedback("success", "Presente salvo.");
    openNewGiftEditor();
  } catch (error) {
    console.error("Erro ao salvar presente:", error);
    const message = error?.message || "Não foi possível salvar esse presente agora.";
    setFeedback(dom.giftFormFeedback, "error", message);
  } finally {
    dom.giftSubmitButton.disabled = false;
    setText(dom.giftSubmitButton, "Salvar presente");
  }
}

function renderGifts() {
  dom.giftList.innerHTML = "";
  setText(
    dom.giftListSummary,
    `${state.gifts.length} ${state.gifts.length === 1 ? "presente cadastrado" : "presentes cadastrados"}`
  );

  if (!state.gifts.length) {
    dom.giftList.appendChild(emptyState("Nenhum presente cadastrado ainda."));
    return;
  }

  state.gifts.forEach((gift) => {
    const card = createElement("article", "gift-admin-card");
    const imageShell = createElement("div", "gift-admin-image");
    const image = createElement("img");
    image.src = gift.imageUrl || "";
    image.alt = gift.name || "Presente";
    imageShell.appendChild(image);

    const body = createElement("div", "gift-admin-body");
    body.append(
      createElement("h3", "panel-subtitle", gift.name || "Presente sem nome"),
      createElement("p", "section-body compact-body", gift.isActive === false ? "Oculto na landing" : "Visível na landing")
    );

    const actions = createElement("div", "inline-actions");
    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => openGiftEditor(gift.id));

    const toggleButton = createElement(
      "button",
      "button button-secondary button-solid-light",
      gift.isActive === false ? "Mostrar" : "Ocultar"
    );
    toggleButton.type = "button";
    toggleButton.addEventListener("click", async () => {
      try {
        await saveGiftItem({
          id: gift.id,
          sortOrder: gift.sortOrder || Date.now(),
          name: gift.name || "",
          purchaseUrl: gift.purchaseUrl || "",
          imageUrl: gift.imageUrl || "",
          isActive: gift.isActive === false
        });
        setGlobalFeedback("success", "Visibilidade do presente atualizada.");
      } catch {
        setGlobalFeedback("error", "Não foi possível atualizar esse presente agora.");
      }
    });

    const deleteButton = createElement("button", "button button-secondary button-solid-light", "Excluir");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", async () => {
      if (!window.confirm("Deseja excluir este presente?")) {
        return;
      }

      try {
        await deleteGiftItem(gift.id);
        setGlobalFeedback("success", "Presente excluído.");
      } catch {
        setGlobalFeedback("error", "Não foi possível excluir esse presente agora.");
      }
    });

    actions.append(editButton, toggleButton, deleteButton);
    body.appendChild(actions);
    card.append(imageShell, body);
    dom.giftList.appendChild(card);
  });
}

async function loadRemoteSiteSettings() {
  try {
    const remoteSettings = await loadSiteSettings();
    state.siteConfig = buildRuntimeConfig(remoteSettings || {});
    applySiteFormData(siteFormDataFromConfig(state.siteConfig));
  } catch {
    state.siteConfig = buildRuntimeConfig();
    applySiteFormData(siteFormDataFromConfig(state.siteConfig));
    setFeedback(
      dom.siteSettingsFeedback,
      "error",
      "Não foi possível carregar as informações do site agora. Os valores padrão foram mantidos na tela."
    );
  }
}

async function handleSiteSave(event) {
  event.preventDefault();

  const payload = sitePayloadFromForm();

  if (!payload.couple.names || !payload.couple.dateText || !payload.couple.dateTime) {
    setFeedback(dom.siteSettingsFeedback, "error", "Preencha o nome do casal, a data exibida e o horário do evento.");
    return;
  }

  if (!payload.event.venueName || !payload.event.address || !payload.event.mapsLabel || !payload.event.mapsUrl) {
    setFeedback(dom.siteSettingsFeedback, "error", "Preencha as informações de local e o link do mapa.");
    return;
  }

  if (!isValidUrl(payload.event.mapsUrl)) {
    setFeedback(dom.siteSettingsFeedback, "error", "Informe um link de mapa válido.");
    return;
  }

  dom.siteSettingsSubmitButton.disabled = true;
  setText(dom.siteSettingsSubmitButton, "Salvando...");
  setFeedback(dom.siteSettingsFeedback, "", "");

  try {
    await saveSiteSettings(payload);
    state.siteConfig = buildRuntimeConfig(mergeDeep(state.siteConfig, payload));
    setFeedback(dom.siteSettingsFeedback, "success", "Informações do site salvas com sucesso.");
    setGlobalFeedback("success", "Conteúdo do site atualizado.");
  } catch (error) {
    console.error("Erro ao salvar configurações do site:", error);
    const message = error?.message || "Não foi possível salvar as informações do site agora.";
    setFeedback(dom.siteSettingsFeedback, "error", message);
  } finally {
    dom.siteSettingsSubmitButton.disabled = false;
    setText(dom.siteSettingsSubmitButton, "Salvar informações do site");
  }
}

function primaryStepAction() {
  if (state.step === "families") {
    openNewFamilyEditor();
    return;
  }

  if (state.step === "confirmations") {
    setCurrentStep("families");
    return;
  }

  if (state.step === "tables") {
    handleGenerateAssignments();
    return;
  }

  openNewGiftEditor();
}

function renderAll() {
  if (dom.familyId.value && !familyById(dom.familyId.value)) {
    fillFamilyForm(null);
    state.lastSavedInviteUrl = "";
    renderSavedFamilyActions();
  }

  if (dom.tableId.value && !tableById(dom.tableId.value)) {
    openNewTableEditor();
  }

  if (dom.giftId.value && !giftById(dom.giftId.value)) {
    resetGiftForm();
  }

  renderChrome();
  renderFamilies();
  renderConfirmations();
  renderTableStats();
  renderTables();
  renderSeatingAssignments();
  renderGifts();
}

function startSubscriptions() {
  if (state.subscriptionsStarted) {
    return;
  }

  state.subscriptionsStarted = true;

  state.unsubscribeFamilies = subscribeFamilies((families) => {
    state.families = families;
    renderAll();
  }, () => {
    setGlobalFeedback("error", "Não foi possível carregar os convites agora.");
  });

  state.unsubscribeGifts = subscribeGiftItems((gifts) => {
    state.gifts = gifts;
    renderAll();
  }, () => {
    setGlobalFeedback("error", "Não foi possível carregar os presentes agora.");
  });

  state.unsubscribeTables = subscribeTables((tables) => {
    state.tables = tables;
    renderAll();
  }, () => {
    setGlobalFeedback("error", "Não foi possível carregar as mesas agora.");
  });
}

function stopSubscriptions() {
  state.unsubscribeFamilies?.();
  state.unsubscribeGifts?.();
  state.unsubscribeTables?.();
  state.unsubscribeFamilies = null;
  state.unsubscribeGifts = null;
  state.unsubscribeTables = null;
  state.subscriptionsStarted = false;
  state.families = [];
  state.gifts = [];
  state.tables = [];
}

async function syncAdminState(user) {
  if (!user) {
    state.user = null;
    state.profile = null;
    stopSubscriptions();
    showLoggedOutState();
    return;
  }

  try {
    const profile = await loadAdminProfile(user);

    if (!profile?.active) {
      await logoutAdmin();
      showLoggedOutState("Seu acesso ainda não está ativo no cadastro de admins.");
      return;
    }

    state.user = user;
    state.profile = profile;
    showLoggedInState();
    await loadRemoteSiteSettings();
    startSubscriptions();
    renderAll();
  } catch {
    try {
      await logoutAdmin();
    } catch {
      // Sem ação adicional.
    }

    showLoggedOutState("Não foi possível validar as permissões do painel agora.");
  }
}

function setCurrentStep(step) {
  if (!STEP_INFO[step]) {
    return;
  }
  state.step = step;
  renderChrome();
}

function initialize() {
  hydrateLoginCopy();
  openNewFamilyEditor();
  openNewTableEditor();
  resetGiftForm();
  applySiteFormData(siteFormDataFromConfig(state.siteConfig));
  dom.adminPrimaryActionButton.addEventListener("click", primaryStepAction);
  dom.adminPreviewInviteButton.addEventListener("click", openInvitePreview);
  dom.siteViewInviteButton.addEventListener("click", openInvitePreview);
  dom.stepButtons.forEach((button) => {
    button.addEventListener("click", () => setCurrentStep(button.dataset.step));
  });
  dom.adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginBusy(true);
    setFeedback(dom.adminLoginFeedback, "", "");

    try {
      await loginAdmin(dom.adminEmail.value, dom.adminPassword.value);
    } catch (error) {
      setFeedback(dom.adminLoginFeedback, "error", getAdminLoginErrorMessage(error));
    } finally {
      setLoginBusy(false);
    }
  });
  dom.adminLogoutButton.addEventListener("click", async () => {
    try {
      await logoutAdmin();
      stopSubscriptions();
      openNewFamilyEditor();
      openNewTableEditor();
      resetGiftForm();
      setCurrentStep("families");
      setGlobalFeedback("", "");
      showLoggedOutState();
    } catch {
      setGlobalFeedback("error", "Não foi possível encerrar a sessão agora.");
    }
  });
  dom.familyForm.addEventListener("submit", handleFamilySave);
  dom.familyResetButton.addEventListener("click", openNewFamilyEditor);
  dom.familySearchInput.addEventListener("input", renderFamilies);
  dom.confirmationsSearchInput.addEventListener("input", renderConfirmations);
  dom.familyToggleSlugButton.addEventListener("click", () => {
    setFamilySlugEditorVisible(!state.familySlugEditorVisible);
  });
  [dom.familyName, dom.displayName, dom.familySlug].forEach((field) => {
    field.addEventListener("input", syncFamilyLinkPreview);
  });
  dom.addGuestButton?.addEventListener("click", () => addGuestInputLine(""));
  dom.familyGuestsContainer?.addEventListener("input", renderFamilyRemovalHint);
  dom.familyCopyLinkButton.addEventListener("click", async () => {
    if (!state.lastSavedInviteUrl) {
      return;
    }

    try {
      await copyText(state.lastSavedInviteUrl);
      setGlobalFeedback("success", "Link do convite copiado.");
    } catch {
      setGlobalFeedback("error", "Não foi possível copiar o link agora.");
    }
  });
  dom.tableForm.addEventListener("submit", handleTableSave);
  dom.tableResetButton.addEventListener("click", openNewTableEditor);
  dom.generateAssignmentsButton.addEventListener("click", handleGenerateAssignments);
  dom.seatingSearchInput.addEventListener("input", renderSeatingAssignments);
  dom.giftForm.addEventListener("submit", handleGiftSave);
  dom.giftResetButton.addEventListener("click", openNewGiftEditor);
  dom.siteSettingsForm.addEventListener("submit", handleSiteSave);
  setCurrentStep("families");
  showLoggedOutState();
  setupRevealAnimations();
  renderAll();
  observeAuthState((user) => {
    syncAdminState(user);
  });
}

initialize();
