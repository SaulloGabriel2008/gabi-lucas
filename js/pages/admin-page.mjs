import { defaultSiteConfig } from "../config/site-config.mjs";
import {
  deleteFamily,
  deleteGiftItem,
  deleteTable,
  loadAdminProfile,
  loadSiteSettings,
  loginAdmin,
  logoutAdmin,
  normalizeAdminEmail,
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
  isLegacyRandomInviteSlug,
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
    description: "Cadastre as fam\u00EDlias com poucos campos, gere o link automaticamente e copie quando salvar.",
    primaryLabel: "Novo convite"
  },
  confirmations: {
    index: 2,
    description: "Veja rapidamente quem confirmou, quem recusou e quem ainda precisa responder.",
    primaryLabel: "Ir para convites"
  },
  tables: {
    index: 3,
    description: "Cadastre as mesas, gere a distribui\u00E7\u00E3o autom\u00E1tica e revise s\u00F3 as pend\u00EAncias.",
    primaryLabel: "Gerar distribui\u00E7\u00E3o"
  },
  advanced: {
    index: 4,
    description: "Presentes e conte\u00FAdo do site continuam acess\u00EDveis, mas fora do fluxo principal do painel.",
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
  adminLoginDiagnostic: $("#adminLoginDiagnostic"),
  adminLogoutButton: $("#adminLogoutButton"),
  adminPreviewInviteButton: $("#adminPreviewInviteButton"),
  adminPrimaryActionButton: $("#adminPrimaryActionButton"),
  adminStepDescription: $("#adminStepDescription"),
  adminProgressLabel: $("#adminProgressLabel"),
  adminHeaderSummary: $("#adminHeaderSummary"),
  adminGlobalFeedback: $("#adminGlobalFeedback"),
  adminStepTabs: $("#adminStepTabs"),
  stepButtons: $$(".admin-flow-step"),
  stepPanels: $$("[data-step-panel]"),
  familySearchInput: $("#familySearchInput"),
  familyListSummary: $("#familyListSummary"),
  familyCarousel: $("#familyCarousel"),
  familyCarouselPrev: $("#familyCarouselPrev"),
  familyCarouselNext: $("#familyCarouselNext"),
  familyListViewport: $("#familyListViewport"),
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
  familyDeleteButton: $("#familyDeleteButton"),
  familyResetButton: $("#familyResetButton"),
  familyIndividualButton: $("#familyIndividualButton"),
  adminIndividualGuestButton: $("#adminIndividualGuestButton"),
  familyFormFeedback: $("#familyFormFeedback"),
  familySavedActions: $("#familySavedActions"),
  familySavedLink: $("#familySavedLink"),
  familyCopyLinkButton: $("#familyCopyLinkButton"),
  confirmationsSearchInput: $("#confirmationsSearchInput"),
  confirmationsListSummary: $("#confirmationsListSummary"),
  confirmationsCarousel: $("#confirmationsCarousel"),
  confirmationsCarouselPrev: $("#confirmationsCarouselPrev"),
  confirmationsCarouselNext: $("#confirmationsCarouselNext"),
  confirmationsListViewport: $("#confirmationsListViewport"),
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
  tableCarousel: $("#tableCarousel"),
  tableCarouselPrev: $("#tableCarouselPrev"),
  tableCarouselNext: $("#tableCarouselNext"),
  tableListViewport: $("#tableListViewport"),
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
  giftDeleteButton: $("#giftDeleteButton"),
  giftResetButton: $("#giftResetButton"),
  giftFormFeedback: $("#giftFormFeedback"),
  giftListSummary: $("#giftListSummary"),
  giftCarousel: $("#giftCarousel"),
  giftCarouselPrev: $("#giftCarouselPrev"),
  giftCarouselNext: $("#giftCarouselNext"),
  giftListViewport: $("#giftListViewport"),
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
  isIndividualMode: false,
  lastSavedInviteUrl: "",
  subscriptionsStarted: false,
  unsubscribeFamilies: null,
  unsubscribeGifts: null,
  unsubscribeTables: null
};

const CAROUSEL_SCROLL_TOLERANCE = 10;
const cardCarousels = [];

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

function clearLoginDiagnostic() {
  if (!dom.adminLoginDiagnostic) {
    return;
  }

  dom.adminLoginDiagnostic.hidden = true;
  dom.adminLoginDiagnostic.innerHTML = "";
}

function renderLoginDiagnostic(details) {
  if (!dom.adminLoginDiagnostic) {
    return;
  }

  if (!details) {
    clearLoginDiagnostic();
    return;
  }

  const items = [
    details.email ? `Email autenticado: ${details.email}` : "",
    details.uid ? `UID autenticado: ${details.uid}` : "",
    details.uidPath
      ? `Cadastro por UID: ${details.uidPath}${details.uidFound ? details.uidActive ? " (ativo)" : " (encontrado, mas inativo)" : " (n\u00e3o encontrado)"}`
      : "",
    details.emailPath
      ? `Cadastro por e-mail: ${details.emailPath}${details.emailFound ? details.emailActive ? " (ativo)" : " (encontrado, mas inativo)" : " (n\u00e3o encontrado)"}`
      : "",
    details.uidLookupError ? `Erro ao consultar UID: ${details.uidLookupError}` : "",
    details.emailLookupError ? `Erro ao consultar e-mail: ${details.emailLookupError}` : "",
    details.help || ""
  ].filter(Boolean);

  dom.adminLoginDiagnostic.innerHTML = "";
  items.forEach((item) => {
    dom.adminLoginDiagnostic.appendChild(createElement("p", "", item));
  });
  dom.adminLoginDiagnostic.hidden = items.length === 0;
}

function showLoggedOutState(message = "", diagnostic = null) {
  dom.adminLoginSection.hidden = false;
  dom.adminDashboardSection.hidden = true;
  setFeedback(dom.adminLoginFeedback, message ? "error" : "", message);
  renderLoginDiagnostic(diagnostic);
}

function showLoggedInState() {
  setFeedback(dom.adminLoginFeedback, "success", "Login feito com sucesso.");
  clearLoginDiagnostic();
}

function revealAdminDashboard() {
  dom.adminLoginSection.hidden = true;
  dom.adminDashboardSection.hidden = false;
  setFeedback(dom.adminLoginFeedback, "", "");
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
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
    return "Email ou senha estao errados.";
  }
  if (
    error.code === "auth/wrong-password"
    || error.code === "auth/invalid-credential"
    || error.code === "auth/invalid-login-credentials"
  ) {
    return "Email ou senha estao errados.";
  }
  if (error.code === "auth/user-not-found") {
    return "Email ou senha estao errados.";
  }
  if (error.code === "auth/too-many-requests") {
    return "Email ou senha estao errados.";
  }
  return defaultSiteConfig.adminSite.login.errorMessage;
}

function adminAccessDiagnostic(user, lookup = {}, help = "") {
  return {
    email: normalizeAdminEmail(user?.email),
    uid: normalizeString(user?.uid),
    uidPath: lookup.uidPath || (user?.uid ? `admins/${normalizeString(user.uid)}` : ""),
    emailPath: lookup.emailPath || (user?.email ? `adminEmails/${normalizeAdminEmail(user.email)}` : ""),
    uidFound: Boolean(lookup.uidFound),
    emailFound: Boolean(lookup.emailFound),
    uidActive: Boolean(lookup.uidActive),
    emailActive: Boolean(lookup.emailActive),
    uidLookupError: lookup.uidLookupError || "",
    emailLookupError: lookup.emailLookupError || "",
    help
  };
}

function logAdminEvent(level, message, details = {}) {
  const payload = {
    at: new Date().toISOString(),
    step: state.step,
    userUid: state.user?.uid || normalizeString(details?.uid),
    userEmail: state.user?.email || normalizeAdminEmail(details?.email),
    ...details
  };

  if (level === "error") {
    console.error(`[admin] ${message}`, payload);
    return;
  }

  if (level === "warn") {
    console.warn(`[admin] ${message}`, payload);
    return;
  }

  console.info(`[admin] ${message}`, payload);
}

function friendlyAdminErrorMessage(error, fallbackMessage) {
  if (error?.code === "permission-denied") {
    return "O Firestore recusou esta a\u00E7\u00E3o por permiss\u00E3o. Confira o cadastro admin e as regras publicadas.";
  }

  return error?.message || fallbackMessage;
}

function hasActiveAdminSession() {
  return Boolean(
    state.user?.uid
    && state.profile
    && (state.profile.active === true || state.profile.active === "true")
  );
}

function requireActiveAdminSession(feedbackElement) {
  if (hasActiveAdminSession()) {
    return true;
  }

  logAdminEvent("warn", "Acao bloqueada porque nao existe sessao admin ativa.", {});
  setFeedback(
    feedbackElement,
    "error",
    "Seu login existe, mas o painel ainda nao reconheceu uma permissao admin ativa para este usuario."
  );
  return false;
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
  return family?.displayName || family?.familyName || "Fam\u00EDlia sem nome";
}

function familySlugList(family) {
  return Array.isArray(family?.slugAliases) && family.slugAliases.length
    ? family.slugAliases.filter(Boolean)
    : [family?.slug].filter(Boolean);
}

function reservedInviteSlugs(excludeFamilyId = "") {
  return state.families.flatMap((family) => {
    if (excludeFamilyId && family.id === excludeFamilyId) {
      return [];
    }

    return familySlugList(family);
  });
}

function suggestedAutoFamilySlug(existingFamily = null) {
  const label = normalizeString(dom.familyName.value)
    || normalizeString(dom.displayName.value)
    || existingFamily?.familyName
    || existingFamily?.displayName;

  if (!label) {
    return "";
  }

  return generateReadableInviteSlug(label, reservedInviteSlugs(existingFamily?.id));
}

function resolvedFamilySlug(existingFamily = null) {
  const manualSlug = slugify(normalizeString(dom.familySlug.value));

  if (state.familySlugEditorVisible) {
    if (manualSlug) {
      return manualSlug;
    }

    if (existingFamily?.slug && !isLegacyRandomInviteSlug(existingFamily.slug)) {
      return existingFamily.slug;
    }

    return suggestedAutoFamilySlug(existingFamily);
  }

  if (existingFamily?.slug && !isLegacyRandomInviteSlug(existingFamily.slug)) {
    return existingFamily.slug;
  }

  return suggestedAutoFamilySlug(existingFamily);
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
    setGlobalFeedback("error", "Salve ou selecione um convite ativo antes de abrir a pr\u00E9via.");
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
    const isActive = button.dataset.step === state.step;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.setAttribute("aria-current", isActive ? "step" : "false");
  });
  dom.stepPanels.forEach((panel) => {
    panel.hidden = panel.dataset.stepPanel !== state.step;
  });

  const confirmedGuests = state.families.reduce((count, family) => {
    return count + (family.guests || []).filter((guest) => guest.responseStatus === "confirmed").length;
  }, 0);

  setText(
    dom.adminHeaderSummary,
    `${state.families.length} ${state.families.length === 1 ? "convite" : "convites"} \u2022 ${confirmedGuests} confirmados`
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
  setText(dom.familyToggleSlugButton, isVisible ? "Ocultar edi\u00E7\u00E3o do link" : "Editar link");
}

function addGuestInputLine(initialValue = "") {
  if (!dom.familyGuestsContainer) return;
  const wrapper = createElement("div", "admin-guest-input-line");
  const input = createElement("input", "");
  input.type = "text";
  input.placeholder = "Ex.: João Silva";
  input.value = initialValue;
  
  if (state.isIndividualMode && dom.familyGuestsContainer.children.length === 0) {
    input.addEventListener("input", (e) => {
      if (state.isIndividualMode) {
        const val = e.target.value;
        dom.familyName.value = val;
        dom.displayName.value = val;
        syncFamilyLinkPreview();
      }
    });
  }
  
  const removeBtn = createElement("button", "button button-small button-light-outline", "Remover");
  removeBtn.type = "button";
  removeBtn.onclick = () => wrapper.remove();
  
  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);
  dom.familyGuestsContainer.appendChild(wrapper);
  
  if (state.isIndividualMode && dom.familyGuestsContainer.children.length === 1) {
    input.focus();
  }
}

function syncFamilyFormMode() {
  const isEditing = Boolean(normalizeString(dom.familyId.value));
  setText(dom.familyFormTitle, isEditing ? "Editar convite" : "Novo convite");
  setText(
    dom.familyFormStatus,
    isEditing
      ? "Revise os nomes, ajuste a mensagem e salve sem perder as respostas j\u00E1 registradas."
      : "Cadastre uma fam\u00EDlia por vez e cole os convidados em linhas separadas."
  );
  if (dom.familyDeleteButton) {
    dom.familyDeleteButton.hidden = !isEditing;
  }
}

function syncFamilyLinkPreview() {
  const existingFamily = familyById(normalizeString(dom.familyId.value));
  const slug = resolvedFamilySlug(existingFamily);

  if (!state.familySlugEditorVisible && (!existingFamily?.slug || isLegacyRandomInviteSlug(existingFamily.slug))) {
    dom.familySlug.value = slug;
  }

  if (!slug) {
    setText(dom.familyAutoLinkPreview, "O link ser\u00E1 gerado automaticamente.");
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
    `Se salvar agora, ${removedGuests.length} convidado(s) ser\u00E3o removidos: ${names}${suffix}`
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
  dom.familySlug.value = family
    ? (family.slug && !isLegacyRandomInviteSlug(family.slug)
      ? family.slug
      : generateReadableInviteSlug(
        family.familyName || family.displayName,
        reservedInviteSlugs(family.id)
      ))
    : "";
  state.lastSavedInviteUrl = family?.slug ? inviteUrl(family.slug) : "";
  setFamilySlugEditorVisible(false);
  syncFamilyFormMode();
  syncFamilyLinkPreview();
  renderSavedFamilyActions();
  renderFamilyRemovalHint();
  setFeedback(dom.familyFormFeedback, "", "");
}

function openNewFamilyEditor() {
  state.isIndividualMode = false;
  fillFamilyForm(null);
  state.lastSavedInviteUrl = "";
  renderSavedFamilyActions();
  setCurrentStep("families");
}

function openIndividualGuestEditor() {
  state.isIndividualMode = true;
  fillFamilyForm(null);
  state.lastSavedInviteUrl = "";
  renderSavedFamilyActions();
  setCurrentStep("families");
  
  // Set focus to the guest name input
  const firstInput = dom.familyGuestsContainer.querySelector("input");
  if (firstInput) firstInput.focus();
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

  if (!requireActiveAdminSession(dom.familyFormFeedback)) {
    return;
  }

  const familyName = normalizeString(dom.familyName.value);
  const displayName = normalizeString(dom.displayName.value);
  const guestNames = readGuestNames();
  const existingFamily = familyById(normalizeString(dom.familyId.value));
  const slug = resolvedFamilySlug(existingFamily);

  if (!familyName || !displayName) {
    setFeedback(dom.familyFormFeedback, "error", "Preencha o nome da fam\u00EDlia e o nome exibido.");
    return;
  }

  if (!guestNames.length) {
    setFeedback(dom.familyFormFeedback, "error", "Adicione pelo menos um convidado em linhas separadas.");
    return;
  }

  if (!slug) {
    setFeedback(dom.familyFormFeedback, "error", "N\u00E3o foi poss\u00EDvel gerar o link do convite. Revise o nome da fam\u00EDlia.");
    return;
  }

  const { guests, removedGuests } = buildGuestPayload(existingFamily, guestNames);

  if (removedGuests.length) {
    const names = removedGuests.slice(0, 5).map((guest) => guest.name).join(", ");
    const suffix = removedGuests.length > 5 ? "..." : "";
    const confirmed = window.confirm(
      `Ao salvar, estes convidados ser\u00E3o removidos e podem perder resposta e mesa: ${names}${suffix}\n\nDeseja continuar?`
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
    setGlobalFeedback("success", "Convite salvo. Voc\u00EA j\u00E1 pode copiar o link e enviar.");
  } catch (error) {
    console.error("Erro ao salvar convite:", error);
    logAdminEvent("error", "Falha ao salvar convite.", {
      code: error?.code || "",
      errorMessage: error?.message || "",
      familyId: normalizeString(dom.familyId.value),
      slug
    });
    if (error?.code === "family/slug-already-exists") {
      setFeedback(dom.familyFormFeedback, "error", "J\u00E1 existe um convite com esse link. Clique em \"Editar link\" e escolha outro.");
    } else {
      const message = friendlyAdminErrorMessage(error, "N\u00E3o foi poss\u00EDvel salvar este convite agora.");
      setFeedback(dom.familyFormFeedback, "error", message);
    }
  } finally {
    dom.familySubmitButton.disabled = false;
    setText(dom.familySubmitButton, "Salvar convite");
  }
}

function confirmFamilyDeletion(family) {
  const summary = summarizeGuests(family?.guests || []);
  const guestLabel = summary.invitedCount === 1 ? "convidado" : "convidados";
  const responseLabel = summary.confirmedCount === 1 ? "resposta confirmada" : "respostas confirmadas";

  return window.confirm(
    `Excluir o convite de ${familyLabel(family)}?\n\nIsso vai apagar o link, ${summary.invitedCount} ${guestLabel} e ${summary.confirmedCount} ${responseLabel}.`
  );
}

async function handleFamilyDelete(familyId, options = {}) {
  const targetFamilyId = normalizeString(familyId);
  const family = familyById(targetFamilyId);
  const feedbackElement = options.feedbackElement || dom.adminGlobalFeedback;

  if (!requireActiveAdminSession(feedbackElement)) {
    return;
  }

  if (!family) {
    setFeedback(feedbackElement, "error", "Esse convite n\u00E3o foi encontrado para exclus\u00E3o.");
    return;
  }

  if (!confirmFamilyDeletion(family)) {
    return;
  }

  const triggerButton = options.triggerButton || null;
  const wasEditingCurrentFamily = normalizeString(dom.familyId.value) === family.id;

  if (triggerButton) {
    triggerButton.disabled = true;
  }

  if (wasEditingCurrentFamily) {
    dom.familySubmitButton.disabled = true;
    dom.familyResetButton.disabled = true;
    if (dom.familyDeleteButton) {
      dom.familyDeleteButton.disabled = true;
    }
    setFeedback(dom.familyFormFeedback, "", "");
  }

  try {
    await deleteFamily(family.id);

    if (wasEditingCurrentFamily) {
      openNewFamilyEditor();
      setFeedback(dom.familyFormFeedback, "success", "Convite exclu\u00EDdo com sucesso.");
    }

    setGlobalFeedback("success", "Convite exclu\u00EDdo.");
  } catch (error) {
    console.error("Erro ao excluir convite:", error);
    logAdminEvent("error", "Falha ao excluir convite.", {
      code: error?.code || "",
      errorMessage: error?.message || "",
      familyId: family.id,
      slug: family.slug || ""
    });
    const message = friendlyAdminErrorMessage(error, "N\u00E3o foi poss\u00EDvel excluir este convite agora.");
    setFeedback(feedbackElement, "error", message);
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
    }

    if (wasEditingCurrentFamily) {
      dom.familySubmitButton.disabled = false;
      dom.familyResetButton.disabled = false;
      if (dom.familyDeleteButton) {
        dom.familyDeleteButton.disabled = false;
      }
    }
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

function updateCarouselControls(config) {
  const { shell, viewport, track, prevButton, nextButton } = config;

  if (!viewport || !track || !prevButton || !nextButton) {
    return;
  }

  const cardCount = track.querySelectorAll(".family-card").length;
  const maxScroll = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
  const hasOverflow = cardCount > 1 && maxScroll > CAROUSEL_SCROLL_TOLERANCE;

  if (viewport.scrollLeft > maxScroll) {
    viewport.scrollLeft = maxScroll;
  }

  shell?.classList.toggle("is-static", !hasOverflow);
  prevButton.disabled = !hasOverflow || viewport.scrollLeft <= CAROUSEL_SCROLL_TOLERANCE;
  nextButton.disabled = !hasOverflow || viewport.scrollLeft >= maxScroll - CAROUSEL_SCROLL_TOLERANCE;
}

function scrollCarousel(viewport, direction) {
  if (!viewport) {
    return;
  }

  viewport.scrollBy({
    left: direction * viewport.clientWidth,
    behavior: "smooth"
  });
}

function registerCarousel(shell, viewport, track, prevButton, nextButton) {
  if (!shell || !viewport || !track || !prevButton || !nextButton) {
    return;
  }

  const config = { shell, viewport, track, prevButton, nextButton };
  const refresh = () => {
    window.requestAnimationFrame(() => updateCarouselControls(config));
  };

  viewport.addEventListener("scroll", refresh, { passive: true });
  window.addEventListener("resize", refresh);
  prevButton.addEventListener("click", () => scrollCarousel(viewport, -1));
  nextButton.addEventListener("click", () => scrollCarousel(viewport, 1));

  config.refresh = refresh;
  cardCarousels.push(config);
  refresh();
}

function refreshCardCarousels() {
  cardCarousels.forEach((config) => config.refresh?.());
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
        setGlobalFeedback("error", "N\u00E3o foi poss\u00EDvel copiar o link agora.");
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
        setGlobalFeedback("error", "N\u00E3o foi poss\u00EDvel alterar esse convite agora.");
      } finally {
        toggleButton.disabled = false;
      }
    });
    actions.appendChild(toggleButton);
  }

  if (options.showDelete !== false) {
    const deleteButton = createElement("button", "button button-danger-soft", "Excluir");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
      handleFamilyDelete(family.id, {
        triggerButton: deleteButton,
        feedbackElement: dom.adminGlobalFeedback
      });
    });
    actions.appendChild(deleteButton);
  }

  const linkRow = createElement("div", "family-link-row");
  linkRow.append(
    createElement("span", "family-link-label", "Link do convite"),
    createElement("div", "family-link-box", family.slug ? inviteUrl(family.slug) : "Esse convite ainda n\u00E3o tem link.")
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
    `${families.length} ${families.length === 1 ? "fam\u00EDlia encontrada" : "fam\u00EDlias encontradas"}`
  );

  if (!families.length) {
    dom.familyList.appendChild(emptyState("Nenhum convite combina com a busca atual."));
    refreshCardCarousels();
    return;
  }

  families.forEach((family) => {
    dom.familyList.appendChild(renderFamilyCard(family));
  });

  refreshCardCarousels();
}

function renderConfirmations() {
  const families = filteredFamilies(dom.confirmationsSearchInput.value);
  dom.confirmationsList.innerHTML = "";
  setText(
    dom.confirmationsListSummary,
    `${families.length} ${families.length === 1 ? "fam\u00EDlia listada" : "fam\u00EDlias listadas"}`
  );

  if (!families.length) {
    dom.confirmationsList.appendChild(emptyState("Nenhuma fam\u00EDlia combina com a busca atual."));
    refreshCardCarousels();
    return;
  }

  families.forEach((family) => {
    dom.confirmationsList.appendChild(
      renderFamilyCard(family, {
        confirmationMode: true,
        editLabel: "Editar cadastro",
        showToggle: false,
        showDelete: false
      })
    );
  });

  refreshCardCarousels();
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
  setText(dom.tableResetButton, "Nova mesa");
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
  setText(dom.tableResetButton, "Cancelar edição");
  setFeedback(dom.tableFormFeedback, "", "");
  setCurrentStep("tables");
}

async function handleTableSave(event) {
  event.preventDefault();

  if (!requireActiveAdminSession(dom.tableFormFeedback)) {
    return;
  }

  const name = normalizeString(dom.tableName.value);
  const capacity = Number(dom.tableCapacity.value || 0);
  const existingTable = tableById(normalizeString(dom.tableId.value));

  if (!name || !capacity) {
    setFeedback(dom.tableFormFeedback, "error", "Informe o nome da mesa e uma capacidade v\u00E1lida.");
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
    logAdminEvent("error", "Falha ao salvar mesa.", {
      code: error?.code || "",
      errorMessage: error?.message || "",
      tableId: normalizeString(dom.tableId.value),
      name
    });
    const message = friendlyAdminErrorMessage(error, "N\u00E3o foi poss\u00EDvel salvar esta mesa agora.");
    setFeedback(dom.tableFormFeedback, "error", message);
  } finally {
    dom.tableSubmitButton.disabled = false;
    setText(dom.tableSubmitButton, "Salvar mesa");
  }
}

async function handleTableDeleteSimple(tableId, options = {}) {
  const targetTableId = normalizeString(tableId);
  const table = tableById(targetTableId);
  const triggerButton = options.triggerButton || null;
  const occupiedSeats = confirmedTableUsage().get(targetTableId) || 0;
  const isEditingCurrentTable = normalizeString(dom.tableId.value) === targetTableId;

  if (!requireActiveAdminSession(dom.tableFormFeedback)) {
    return;
  }

  if (!table) {
    setGlobalFeedback("error", "Essa mesa não foi encontrada.");
    return;
  }

  const confirmed = window.confirm(
    occupiedSeats
      ? `Essa mesa tem ${occupiedSeats} confirmado(s). Excluir vai limpar essas alocações. Deseja continuar?`
      : `Excluir a mesa "${table.name || "sem nome"}"?`
  );

  if (!confirmed) {
    return;
  }

  if (triggerButton) {
    triggerButton.disabled = true;
  }

  dom.tableSubmitButton.disabled = true;
  dom.tableResetButton.disabled = true;
  setFeedback(dom.tableFormFeedback, "", "");
  setGlobalFeedback("", "");

  try {
    await deleteTable(table.id);

    if (isEditingCurrentTable) {
      openNewTableEditor();
      setFeedback(dom.tableFormFeedback, "success", "Mesa excluída com sucesso.");
    }

    setGlobalFeedback("success", `Mesa "${table.name || "sem nome"}" excluída.`);
  } catch (error) {
    console.error("Erro ao excluir mesa:", error);
    logAdminEvent("error", "Falha ao excluir mesa.", {
      code: error?.code || "",
      errorMessage: error?.message || "",
      tableId: table.id,
      name: table.name || ""
    });
    const message = friendlyAdminErrorMessage(error, "Não foi possível excluir essa mesa agora.");
    setGlobalFeedback("error", message);
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
    }

    dom.tableSubmitButton.disabled = false;
    dom.tableResetButton.disabled = false;
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
    { label: "Fam\u00EDlias alocadas", value: String(assignedFamilies) },
    { label: "Pend\u00EAncias", value: String(pendingFamilies) }
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
    dom.tableList.appendChild(emptyState("Cadastre pelo menos uma mesa para come\u00E7ar a distribui\u00E7\u00E3o."));
    refreshCardCarousels();
    return;
  }

  state.tables.forEach((table) => {
    const occupiedSeats = usage.get(table.id) || 0;
    const capacity = Number(table.capacity || 0);
    const card = createElement(
      "article",
      `table-card admin-record-card${occupiedSeats > capacity ? " is-over-capacity" : ""}`
    );
    const header = createElement("div", "table-card-header");
    const titleWrap = createElement("div", "admin-info-stack");
    titleWrap.append(
      createElement("h3", "panel-title", table.name || "Mesa sem nome"),
      createElement("p", "section-body compact-body", table.notes || "Sem observações.")
    );
    header.append(
      titleWrap,
      createElement("span", "occupancy-badge", `${occupiedSeats}/${capacity}`)
    );

    const stats = createStatGrid([
      { label: "Capacidade", value: String(capacity) },
      { label: "Confirmados", value: String(occupiedSeats) }
    ]);

    const actions = createElement("div", "table-card-actions");
    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => openTableEditor(table.id));

    const deleteButton = createElement("button", "button button-danger-soft", "Excluir");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
      handleTableDeleteSimple(table.id, {
        triggerButton: deleteButton
      });
    });

    actions.append(editButton, deleteButton);
    card.append(header, stats, actions);
    dom.tableList.appendChild(card);
  });

  refreshCardCarousels();
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
    setFeedback(dom.tableGenerationFeedback, "error", "Cadastre pelo menos uma mesa antes de gerar a distribui\u00E7\u00E3o.");
    setCurrentStep("tables");
    return;
  }

  if (!rows.length) {
    setFeedback(dom.tableGenerationFeedback, "error", "Ainda n\u00E3o h\u00E1 convidados confirmados para distribuir.");
    setCurrentStep("tables");
    return;
  }

  const assignedGuests = rows.reduce((count, row) => {
    return count + row.confirmedGuests.filter((guest) => guest.tableId).length;
  }, 0);

  if (assignedGuests > 0) {
    const confirmed = window.confirm(
      "Gerar a distribui\u00E7\u00E3o vai substituir as aloca\u00E7\u00F5es atuais dos convidados confirmados. Deseja continuar?"
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
      ? ` ${plan.unresolvedFamilies.length} fam\u00EDlia(s) ficaram pendentes para revis\u00E3o manual.`
      : "";
    setFeedback(
      dom.tableGenerationFeedback,
      "success",
      `${allocatedFamilies} fam\u00EDlia(s) foram distribu\u00EDdas automaticamente.${pendingMessage}`
    );
    setGlobalFeedback("success", "Distribui\u00E7\u00E3o de mesas atualizada.");
    setCurrentStep("tables");
  } catch {
    setFeedback(dom.tableGenerationFeedback, "error", "N\u00E3o foi poss\u00EDvel gerar a distribui\u00E7\u00E3o agora.");
  } finally {
    dom.generateAssignmentsButton.disabled = false;
    setText(dom.generateAssignmentsButton, "Gerar distribui\u00E7\u00E3o");
  }
}

async function handleManualFamilyAssignment(row, nextTableId) {
  if (nextTableId) {
    const availableSeats = availableSeatsForFamily(row, nextTableId);

    if (availableSeats < row.confirmedCount) {
      setFeedback(dom.seatingFeedback, "error", "Essa mesa n\u00E3o tem lugares suficientes para manter a fam\u00EDlia junta.");
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
    setFeedback(dom.seatingFeedback, "success", "Mesa da fam\u00EDlia atualizada com sucesso.");
  } catch {
    setFeedback(dom.seatingFeedback, "error", "N\u00E3o foi poss\u00EDvel atualizar essa fam\u00EDlia agora.");
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
    dom.seatingFamilyList.appendChild(emptyState("Nenhuma fam\u00EDlia confirmada combina com a busca atual."));
    return;
  }

  rows.forEach((row) => {
    const shell = createElement("div", "assignment-row admin-family-seat-row");
    const copy = createElement("div", "assignment-copy");
    const currentTableText = row.isSplit
      ? "Fam\u00EDlia dividida entre mesas"
      : row.currentTableId
        ? `Mesa atual: ${tableById(row.currentTableId)?.name || "Mesa removida"}`
        : "Sem mesa definida";
    copy.append(
      createElement("strong", "", row.displayName),
      createElement("span", "", `${row.confirmedCount} confirmado(s) \u2022 ${currentTableText}`)
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

function syncGiftFormActions() {
  const isEditing = Boolean(normalizeString(dom.giftId.value));

  if (dom.giftDeleteButton) {
    dom.giftDeleteButton.hidden = !isEditing;
    dom.giftDeleteButton.disabled = false;
    setText(dom.giftDeleteButton, "Excluir este presente");
  }

  if (dom.giftResetButton) {
    setText(dom.giftResetButton, isEditing ? "Cancelar edição" : "Novo presente");
  }
}

function resetGiftForm() {
  dom.giftId.value = "";
  dom.giftName.value = "";
  dom.giftPurchaseUrl.value = "";
  dom.giftImageUrl.value = "";
  dom.giftIsActive.checked = true;
  syncGiftFormActions();
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
  syncGiftFormActions();
  setFeedback(dom.giftFormFeedback, "", "");
  setCurrentStep("advanced");
}

async function handleGiftDelete(giftId, options = {}) {
  const targetGiftId = normalizeString(giftId);
  const gift = giftById(targetGiftId);
  const feedbackElement = options.feedbackElement || dom.giftFormFeedback;
  const triggerButton = options.triggerButton || null;

  if (!requireActiveAdminSession(feedbackElement)) {
    return;
  }

  if (!gift) {
    setFeedback(feedbackElement, "error", "Esse presente não foi encontrado para exclusão.");
    return;
  }

  const confirmed = window.confirm(`Deseja excluir o presente "${gift.name || "sem nome"}"?`);

  if (!confirmed) {
    return;
  }

  if (triggerButton) {
    triggerButton.disabled = true;
  }

  dom.giftSubmitButton.disabled = true;
  dom.giftResetButton.disabled = true;
  setFeedback(dom.giftFormFeedback, "", "");

  try {
    await deleteGiftItem(gift.id);
    resetGiftForm();
    setFeedback(dom.giftFormFeedback, "success", "Presente excluído com sucesso.");
    setGlobalFeedback("success", "Presente excluído.");
  } catch (error) {
    console.error("Erro ao excluir presente:", error);
    logAdminEvent("error", "Falha ao excluir presente.", {
      code: error?.code || "",
      errorMessage: error?.message || "",
      giftId: gift.id,
      name: gift.name || ""
    });
    const message = friendlyAdminErrorMessage(error, "Não foi possível excluir esse presente agora.");
    setFeedback(feedbackElement, "error", message);
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
    }
    dom.giftSubmitButton.disabled = false;
    dom.giftResetButton.disabled = false;
  }
}

async function handleGiftDeleteSimple(giftId, options = {}) {
  const targetGiftId = normalizeString(giftId);
  const gift = giftById(targetGiftId);
  const feedbackElement = options.feedbackElement || dom.giftFormFeedback;
  const triggerButton = options.triggerButton || null;
  const isEditingCurrentGift = normalizeString(dom.giftId.value) === targetGiftId;

  if (!requireActiveAdminSession(feedbackElement)) {
    return;
  }

  if (!gift) {
    setFeedback(feedbackElement, "error", "Esse presente não foi encontrado.");
    return;
  }

  const confirmed = window.confirm(`Excluir o presente "${gift.name || "sem nome"}"?`);

  if (!confirmed) {
    return;
  }

  if (triggerButton) {
    triggerButton.disabled = true;
  }

  dom.giftSubmitButton.disabled = true;
  dom.giftResetButton.disabled = true;

  if (dom.giftDeleteButton) {
    dom.giftDeleteButton.disabled = true;
  }

  setFeedback(dom.giftFormFeedback, "", "");
  setFeedback(feedbackElement, "", "");

  try {
    await deleteGiftItem(gift.id);

    if (isEditingCurrentGift) {
      resetGiftForm();
      setFeedback(dom.giftFormFeedback, "success", "Presente excluído com sucesso.");
    }

    setGlobalFeedback("success", `Presente "${gift.name || "sem nome"}" excluído.`);
  } catch (error) {
    console.error("Erro ao excluir presente:", error);
    logAdminEvent("error", "Falha ao excluir presente.", {
      code: error?.code || "",
      errorMessage: error?.message || "",
      giftId: gift.id,
      name: gift.name || ""
    });
    const message = friendlyAdminErrorMessage(error, "Não foi possível excluir esse presente agora.");
    setFeedback(feedbackElement, "error", message);
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
    }

    dom.giftSubmitButton.disabled = false;
    dom.giftResetButton.disabled = false;
    syncGiftFormActions();
  }
}

async function handleGiftSave(event) {
  event.preventDefault();

  if (!requireActiveAdminSession(dom.giftFormFeedback)) {
    return;
  }

  const name = normalizeString(dom.giftName.value);
  const purchaseUrl = normalizeString(dom.giftPurchaseUrl.value);
  const imageUrl = normalizeString(dom.giftImageUrl.value);
  const existingGift = giftById(normalizeString(dom.giftId.value));

  if (!name) {
    setFeedback(dom.giftFormFeedback, "error", "Informe o nome do presente.");
    return;
  }

  if (!imageUrl || !isValidUrl(imageUrl)) {
    setFeedback(dom.giftFormFeedback, "error", "Informe uma URL de imagem v\u00E1lida.");
    return;
  }

  if (purchaseUrl && !isValidUrl(purchaseUrl)) {
    setFeedback(dom.giftFormFeedback, "error", "Informe um link de compra v\u00E1lido.");
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
    logAdminEvent("error", "Falha ao salvar presente.", {
      code: error?.code || "",
      errorMessage: error?.message || "",
      giftId: normalizeString(dom.giftId.value),
      name
    });
    const message = friendlyAdminErrorMessage(error, "N\u00E3o foi poss\u00EDvel salvar esse presente agora.");
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
    refreshCardCarousels();
    return;
  }

  state.gifts.forEach((gift) => {
    const card = createElement("article", "gift-admin-card admin-record-card");
    const imageShell = createElement("div", "gift-admin-image");
    const image = createElement("img");
    image.src = gift.imageUrl || "";
    image.alt = gift.name || "Presente";
    imageShell.appendChild(image);

    const body = createElement("div", "gift-admin-body");
    body.append(
      createElement("h3", "panel-subtitle", gift.name || "Presente sem nome"),
      createElement("p", "section-body compact-body", gift.isActive === false ? "Oculto na landing" : "Vis\u00EDvel na landing")
    );

    const actions = createElement("div", "gift-admin-actions");
    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => openGiftEditor(gift.id));

    const deleteButton = createElement("button", "button button-danger-soft", "Excluir");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
      handleGiftDeleteSimple(gift.id, {
        triggerButton: deleteButton,
        feedbackElement: dom.adminGlobalFeedback
      });
    });

    actions.append(editButton, deleteButton);
    body.appendChild(actions);
    card.append(imageShell, body);
    dom.giftList.appendChild(card);
  });

  refreshCardCarousels();
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
      "N\u00E3o foi poss\u00EDvel carregar as informa\u00E7\u00F5es do site agora. Os valores padr\u00E3o foram mantidos na tela."
    );
  }
}

async function handleSiteSave(event) {
  event.preventDefault();

  if (!requireActiveAdminSession(dom.siteSettingsFeedback)) {
    return;
  }

  const payload = sitePayloadFromForm();

  if (!payload.couple.names || !payload.couple.dateText || !payload.couple.dateTime) {
    setFeedback(dom.siteSettingsFeedback, "error", "Preencha o nome do casal, a data exibida e o hor\u00E1rio do evento.");
    return;
  }

  if (!payload.event.venueName || !payload.event.address || !payload.event.mapsLabel || !payload.event.mapsUrl) {
    setFeedback(dom.siteSettingsFeedback, "error", "Preencha as informa\u00E7\u00F5es de local e o link do mapa.");
    return;
  }

  if (!isValidUrl(payload.event.mapsUrl)) {
    setFeedback(dom.siteSettingsFeedback, "error", "Informe um link de mapa v\u00E1lido.");
    return;
  }

  dom.siteSettingsSubmitButton.disabled = true;
  setText(dom.siteSettingsSubmitButton, "Salvando...");
  setFeedback(dom.siteSettingsFeedback, "", "");

  try {
    await saveSiteSettings(payload);
    state.siteConfig = buildRuntimeConfig(mergeDeep(state.siteConfig, payload));
    setFeedback(dom.siteSettingsFeedback, "success", "Informa\u00E7\u00F5es do site salvas com sucesso.");
    setGlobalFeedback("success", "Conte\u00FAdo do site atualizado.");
  } catch (error) {
    console.error("Erro ao salvar configura\u00E7\u00F5es do site:", error);
    logAdminEvent("error", "Falha ao salvar configuracoes do site.", {
      code: error?.code || "",
      errorMessage: error?.message || ""
    });
    const message = friendlyAdminErrorMessage(error, "N\u00E3o foi poss\u00EDvel salvar as informa\u00E7\u00F5es do site agora.");
    setFeedback(dom.siteSettingsFeedback, "error", message);
  } finally {
    dom.siteSettingsSubmitButton.disabled = false;
    setText(dom.siteSettingsSubmitButton, "Salvar informa\u00E7\u00F5es do site");
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
    setGlobalFeedback("error", "N\u00E3o foi poss\u00EDvel carregar os convites agora.");
  });

  state.unsubscribeGifts = subscribeGiftItems((gifts) => {
    state.gifts = gifts;
    renderAll();
  }, () => {
    setGlobalFeedback("error", "N\u00E3o foi poss\u00EDvel carregar os presentes agora.");
  });

  state.unsubscribeTables = subscribeTables((tables) => {
    state.tables = tables;
    renderAll();
  }, () => {
    setGlobalFeedback("error", "N\u00E3o foi poss\u00EDvel carregar as mesas agora.");
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
    const adminState = await loadAdminProfile(user);
    const lookup = adminState?.lookedUp || {};
    logAdminEvent("info", "Autenticacao reconhecida, validando acesso admin.", {
      uid: user?.uid,
      email: user?.email,
      lookup
    });

    if (!adminState?.active || !adminState?.profile) {
      const hasInactiveRegistration = lookup.uidFound || lookup.emailFound;
      const help = hasInactiveRegistration
        ? "Ative o cadastro encontrado no Firestore definindo active = true."
        : "Cadastre este acesso em admins/{uid} ou em adminEmails/{email_normalizado} com active = true.";
      state.user = null;
      state.profile = null;
      stopSubscriptions();
      logAdminEvent("warn", "Usuario autenticado sem permissao admin ativa.", {
        uid: user?.uid,
        email: user?.email,
        lookup,
        help
      });
      showLoggedOutState(
        hasInactiveRegistration
          ? "Seu acesso existe, mas ainda nao esta ativo no cadastro de admins."
          : "Seu usuario autenticou, mas ainda nao possui permissao de admin.",
        adminAccessDiagnostic(user, lookup, help)
      );
      return;
    }

    state.user = user;
    state.profile = adminState.profile;
    logAdminEvent("info", "Acesso admin liberado.", {
      uid: user?.uid,
      email: user?.email,
      source: adminState.source,
      lookup
    });
    showLoggedInState();
    await wait(900);
    revealAdminDashboard();
    await loadRemoteSiteSettings();
    startSubscriptions();
    renderAll();
  } catch (error) {
    state.user = null;
    state.profile = null;
    stopSubscriptions();
    const permissionDenied = error?.code === "permission-denied" || String(error?.message || "").toLowerCase().includes("permission");
    logAdminEvent("error", "Falha ao validar permissoes do admin.", {
      uid: user?.uid,
      email: user?.email,
      code: error?.code || "",
      errorMessage: error?.message || ""
    });
    showLoggedOutState(
      permissionDenied
        ? "O login funcionou, mas o Firestore ainda esta bloqueando este acesso."
        : "Nao foi possivel validar as permissoes do painel agora.",
      adminAccessDiagnostic(
        user,
        {},
        permissionDenied
          ? "Publique as regras atualizadas do Firestore e confira se existe admins/{uid} ou adminEmails/{email_normalizado} ativo."
          : "Confira a conexao com o Firebase e tente novamente."
      )
    );
  }
}

function setCurrentStep(step) {
  if (!STEP_INFO[step]) {
    return;
  }
  state.step = step;
  renderChrome();
}

function handleStepTabClick(event) {
  const button = event.target instanceof Element ? event.target.closest(".admin-flow-step") : null;

  if (!button) {
    return;
  }

  event.preventDefault();
  setCurrentStep(button.dataset.step);
}

function initialize() {
  hydrateLoginCopy();
  openNewFamilyEditor();
  openNewTableEditor();
  resetGiftForm();
  applySiteFormData(siteFormDataFromConfig(state.siteConfig));
  registerCarousel(
    dom.familyCarousel,
    dom.familyListViewport,
    dom.familyList,
    dom.familyCarouselPrev,
    dom.familyCarouselNext
  );
  registerCarousel(
    dom.confirmationsCarousel,
    dom.confirmationsListViewport,
    dom.confirmationsList,
    dom.confirmationsCarouselPrev,
    dom.confirmationsCarouselNext
  );
  registerCarousel(
    dom.tableCarousel,
    dom.tableListViewport,
    dom.tableList,
    dom.tableCarouselPrev,
    dom.tableCarouselNext
  );
  registerCarousel(
    dom.giftCarousel,
    dom.giftListViewport,
    dom.giftList,
    dom.giftCarouselPrev,
    dom.giftCarouselNext
  );
  dom.adminPrimaryActionButton.addEventListener("click", primaryStepAction);
  dom.adminPreviewInviteButton.addEventListener("click", openInvitePreview);
  dom.siteViewInviteButton.addEventListener("click", openInvitePreview);
  dom.adminStepTabs?.addEventListener("click", handleStepTabClick);
  dom.adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginBusy(true);
    setFeedback(dom.adminLoginFeedback, "", "");
    clearLoginDiagnostic();
    logAdminEvent("info", "Tentativa de login iniciada.", {
      email: dom.adminEmail.value
    });

    try {
      const credential = await loginAdmin(dom.adminEmail.value, dom.adminPassword.value);
      logAdminEvent("info", "Credenciais aceitas pelo Firebase Auth.", {
        email: dom.adminEmail.value
      });
      await syncAdminState(credential?.user || null);
    } catch (error) {
      logAdminEvent("error", "Falha no login via Firebase Auth.", {
        email: dom.adminEmail.value,
        code: error?.code || "",
        errorMessage: error?.message || ""
      });
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
      setGlobalFeedback("error", "N\u00E3o foi poss\u00EDvel encerrar a sess\u00E3o agora.");
    }
  });
  dom.familyForm.addEventListener("submit", handleFamilySave);
  dom.familyDeleteButton?.addEventListener("click", () => {
    handleFamilyDelete(dom.familyId.value, {
      triggerButton: dom.familyDeleteButton,
      feedbackElement: dom.familyFormFeedback
    });
  });
  dom.familyResetButton.addEventListener("click", openNewFamilyEditor);
  dom.familyIndividualButton.addEventListener("click", openIndividualGuestEditor);
  dom.adminIndividualGuestButton.addEventListener("click", openIndividualGuestEditor);
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
      setGlobalFeedback("error", "N\u00E3o foi poss\u00EDvel copiar o link agora.");
    }
  });
  dom.tableForm.addEventListener("submit", handleTableSave);
  dom.tableResetButton.addEventListener("click", openNewTableEditor);
  dom.generateAssignmentsButton.addEventListener("click", handleGenerateAssignments);
  dom.seatingSearchInput.addEventListener("input", renderSeatingAssignments);
  dom.giftForm.addEventListener("submit", handleGiftSave);
  dom.giftResetButton.addEventListener("click", openNewGiftEditor);
  dom.siteSettingsForm.addEventListener("submit", handleSiteSave);
  syncGiftFormActions();
  setCurrentStep("families");
  showLoggedOutState();
  setupRevealAnimations();
  renderAll();
  observeAuthState((user) => {
    syncAdminState(user);
  });
}

initialize();
