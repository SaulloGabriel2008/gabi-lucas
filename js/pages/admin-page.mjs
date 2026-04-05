import { defaultSiteConfig } from "../config/site-config.mjs";
import {
  assignGuestToTable,
  deleteGiftItem,
  deleteTable,
  loadAdminProfile,
  loadSiteSettings,
  loginAdmin,
  logoutAdmin,
  observeAuthState,
  saveFamily,
  saveGiftItem,
  saveSiteSettings,
  saveTable,
  subscribeFamilies,
  subscribeGiftItems,
  subscribeTables,
  toggleFamilyActive
} from "../firebase/client.mjs";
import {
  createElement,
  formatGuestStatus,
  formatInviteStatus,
  generateReadableInviteSlug,
  localDateTimeToIso,
  mergeDeep,
  setText,
  setupRevealAnimations,
  slugify,
  summarizeGuests,
  toDateTimeLocalValue
} from "../ui/shared-ui.mjs";

const STORAGE_KEYS = {
  ui: "gabielucas.admin.ui.v2",
  drafts: "gabielucas.admin.drafts.v2"
};

const TAB_LABELS = {
  families: "Convites",
  gifts: "Presentes",
  tables: "Mesas",
  site: "Site"
};

const DEFAULT_UI_STATE = {
  activeTab: "families",
  familySearch: "",
  familyFilter: "all",
  giftSearch: "",
  giftFilter: "all",
  tableSearch: "",
  tableFilter: "all",
  seatSearch: "",
  siteSearch: ""
};

const SITE_SECTION_FIELDS = {
  date: ["settingsCoupleNames", "settingsMonogram", "settingsDateText", "settingsDateTime"],
  location: ["settingsVenueName", "settingsVenueAddress", "settingsMapsLabel", "settingsMapsUrl"],
  hero: ["settingsHeroEyebrow", "settingsSubtitle", "settingsShowGifts"],
  intro: ["settingsIntroKicker", "settingsIntroTitle", "settingsIntroBody"],
  story: ["settingsStoryKicker", "settingsStoryTitle", "settingsStoryBody"]
};

const dom = {
  adminLoginSection: document.querySelector("#adminLoginSection"),
  adminDashboardSection: document.querySelector("#adminDashboardSection"),
  adminLoginTitle: document.querySelector("#adminLoginTitle"),
  adminLoginBody: document.querySelector("#adminLoginBody"),
  adminEmailLabel: document.querySelector("#adminEmailLabel"),
  adminEmail: document.querySelector("#adminEmail"),
  adminPasswordLabel: document.querySelector("#adminPasswordLabel"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminPassword: document.querySelector("#adminPassword"),
  adminLoginButton: document.querySelector("#adminLoginButton"),
  adminLoginFeedback: document.querySelector("#adminLoginFeedback"),
  adminLogoutButton: document.querySelector("#adminLogoutButton"),
  adminPreviewInviteButton: document.querySelector("#adminPreviewInviteButton"),
  adminActiveTabLabel: document.querySelector("#adminActiveTabLabel"),
  adminDraftIndicator: document.querySelector("#adminDraftIndicator"),
  adminGlobalFeedback: document.querySelector("#adminGlobalFeedback"),
  adminStatsGrid: document.querySelector("#adminStatsGrid"),
  tabButtons: Array.from(document.querySelectorAll(".admin-tab-button")),
  tabPanels: Array.from(document.querySelectorAll(".admin-tab-panel")),
  familyCreateNewButton: document.querySelector("#familyCreateNewButton"),
  familySearchInput: document.querySelector("#familySearchInput"),
  familyFilterButtons: Array.from(document.querySelectorAll("[data-family-filter]")),
  familyFormTitle: document.querySelector("#familyFormTitle"),
  familyFormStatus: document.querySelector("#familyFormStatus"),
  familyDiscardDraftButton: document.querySelector("#familyDiscardDraftButton"),
  familyListSummary: document.querySelector("#familyListSummary"),
  familyForm: document.querySelector("#familyForm"),
  familyId: document.querySelector("#familyId"),
  familyName: document.querySelector("#familyName"),
  displayName: document.querySelector("#displayName"),
  customMessage: document.querySelector("#customMessage"),
  familySlug: document.querySelector("#familySlug"),
  isActive: document.querySelector("#isActive"),
  generateSlugButton: document.querySelector("#generateSlugButton"),
  memberBulkInput: document.querySelector("#memberBulkInput"),
  memberBulkApplyButton: document.querySelector("#memberBulkApplyButton"),
  addMemberButton: document.querySelector("#addMemberButton"),
  memberEditorList: document.querySelector("#memberEditorList"),
  memberEditorHint: document.querySelector("#memberEditorHint"),
  familySubmitButton: document.querySelector("#familySubmitButton"),
  familyResetButton: document.querySelector("#familyResetButton"),
  familyFormFeedback: document.querySelector("#familyFormFeedback"),
  familyList: document.querySelector("#familyList"),
  giftCreateNewButton: document.querySelector("#giftCreateNewButton"),
  giftSearchInput: document.querySelector("#giftSearchInput"),
  giftFilterButtons: Array.from(document.querySelectorAll("[data-gift-filter]")),
  giftFormTitle: document.querySelector("#giftFormTitle"),
  giftFormStatus: document.querySelector("#giftFormStatus"),
  giftDiscardDraftButton: document.querySelector("#giftDiscardDraftButton"),
  giftListSummary: document.querySelector("#giftListSummary"),
  giftForm: document.querySelector("#giftForm"),
  giftId: document.querySelector("#giftId"),
  giftSortOrder: document.querySelector("#giftSortOrder"),
  giftName: document.querySelector("#giftName"),
  giftPurchaseUrl: document.querySelector("#giftPurchaseUrl"),
  giftImageUrl: document.querySelector("#giftImageUrl"),
  giftImagePreviewShell: document.querySelector("#giftImagePreviewShell"),
  giftImagePreview: document.querySelector("#giftImagePreview"),
  giftIsActive: document.querySelector("#giftIsActive"),
  giftSubmitButton: document.querySelector("#giftSubmitButton"),
  giftResetButton: document.querySelector("#giftResetButton"),
  giftFormFeedback: document.querySelector("#giftFormFeedback"),
  giftList: document.querySelector("#giftList"),
  tableCreateNewButton: document.querySelector("#tableCreateNewButton"),
  tableSearchInput: document.querySelector("#tableSearchInput"),
  tableFilterButtons: Array.from(document.querySelectorAll("[data-table-filter]")),
  tableFormTitle: document.querySelector("#tableFormTitle"),
  tableFormStatus: document.querySelector("#tableFormStatus"),
  tableDiscardDraftButton: document.querySelector("#tableDiscardDraftButton"),
  tableListSummary: document.querySelector("#tableListSummary"),
  tableForm: document.querySelector("#tableForm"),
  tableId: document.querySelector("#tableId"),
  tableSortOrder: document.querySelector("#tableSortOrder"),
  tableName: document.querySelector("#tableName"),
  tableCapacity: document.querySelector("#tableCapacity"),
  tableNotes: document.querySelector("#tableNotes"),
  tableSubmitButton: document.querySelector("#tableSubmitButton"),
  tableResetButton: document.querySelector("#tableResetButton"),
  tableFormFeedback: document.querySelector("#tableFormFeedback"),
  tablesBoard: document.querySelector("#tablesBoard"),
  unseatedGuestList: document.querySelector("#unseatedGuestList"),
  seatAssignmentSearchInput: document.querySelector("#seatAssignmentSearchInput"),
  seatAssignmentList: document.querySelector("#seatAssignmentList"),
  seatAssignmentFeedback: document.querySelector("#seatAssignmentFeedback"),
  siteViewLandingButton: document.querySelector("#siteViewLandingButton"),
  siteViewInviteButton: document.querySelector("#siteViewInviteButton"),
  siteDiscardDraftButton: document.querySelector("#siteDiscardDraftButton"),
  siteSearchInput: document.querySelector("#siteSearchInput"),
  siteSectionNavButtons: Array.from(document.querySelectorAll("[data-site-section-target]")),
  siteRestoreButtons: Array.from(document.querySelectorAll("[data-restore-section]")),
  siteBlocks: Array.from(document.querySelectorAll(".admin-settings-block")),
  siteSettingsForm: document.querySelector("#siteSettingsForm"),
  settingsCoupleNames: document.querySelector("#settingsCoupleNames"),
  settingsMonogram: document.querySelector("#settingsMonogram"),
  settingsDateText: document.querySelector("#settingsDateText"),
  settingsDateTime: document.querySelector("#settingsDateTime"),
  settingsVenueName: document.querySelector("#settingsVenueName"),
  settingsVenueAddress: document.querySelector("#settingsVenueAddress"),
  settingsMapsLabel: document.querySelector("#settingsMapsLabel"),
  settingsMapsUrl: document.querySelector("#settingsMapsUrl"),
  settingsHeroEyebrow: document.querySelector("#settingsHeroEyebrow"),
  settingsSubtitle: document.querySelector("#settingsSubtitle"),
  settingsIntroKicker: document.querySelector("#settingsIntroKicker"),
  settingsIntroTitle: document.querySelector("#settingsIntroTitle"),
  settingsIntroBody: document.querySelector("#settingsIntroBody"),
  settingsStoryKicker: document.querySelector("#settingsStoryKicker"),
  settingsStoryTitle: document.querySelector("#settingsStoryTitle"),
  settingsStoryBody: document.querySelector("#settingsStoryBody"),
  settingsShowGifts: document.querySelector("#settingsShowGifts"),
  siteSettingsSubmitButton: document.querySelector("#siteSettingsSubmitButton"),
  siteSettingsFeedback: document.querySelector("#siteSettingsFeedback"),
  siteSectionDateIndicator: document.querySelector("#siteSectionDateIndicator"),
  siteSectionLocationIndicator: document.querySelector("#siteSectionLocationIndicator"),
  siteSectionHeroIndicator: document.querySelector("#siteSectionHeroIndicator"),
  siteSectionIntroIndicator: document.querySelector("#siteSectionIntroIndicator"),
  siteSectionStoryIndicator: document.querySelector("#siteSectionStoryIndicator")
};

const state = {
  subscriptionsStarted: false,
  families: [],
  gifts: [],
  tables: [],
  loadedSiteConfig: buildRuntimeConfig(),
  mergedSiteConfig: buildRuntimeConfig(),
  logoutMessage: "",
  ui: loadStoredUiState(),
  drafts: loadStoredDrafts(),
  dirtyTabs: {
    families: false,
    gifts: false,
    tables: false,
    site: false
  },
  unsubscribeFamilies: null,
  unsubscribeGifts: null,
  unsubscribeTables: null
};

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function loadStoredUiState() {
  const storedState = safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.ui), {});
  return {
    ...DEFAULT_UI_STATE,
    ...storedState
  };
}

function loadStoredDrafts() {
  const storedDrafts = safeJsonParse(window.localStorage.getItem(STORAGE_KEYS.drafts), {});
  return {
    families: storedDrafts?.families || null,
    gifts: storedDrafts?.gifts || null,
    tables: storedDrafts?.tables || null,
    site: storedDrafts?.site || null
  };
}

function persistUiState() {
  window.localStorage.setItem(STORAGE_KEYS.ui, JSON.stringify(state.ui));
}

function persistDrafts() {
  window.localStorage.setItem(STORAGE_KEYS.drafts, JSON.stringify(state.drafts));
}

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

function normalizeSortOrder(value, fallback = Date.now()) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value) {
  if (value === "confirmed" || value === "declined") {
    return value;
  }

  return "pending";
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

function setLoginBusy(isBusy) {
  dom.adminLoginButton.disabled = isBusy;
  dom.adminEmail.disabled = isBusy;
  dom.adminPassword.disabled = isBusy;
  setText(
    dom.adminLoginButton,
    isBusy ? defaultSiteConfig.adminSite.login.loadingLabel : defaultSiteConfig.adminSite.login.submitLabel
  );
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

  if (error.code === "auth/operation-not-allowed") {
    return "O login por e-mail e senha ainda não foi habilitado no Firebase Authentication.";
  }

  if (error.code === "auth/unauthorized-domain") {
    return "Este domínio ainda não foi autorizado no Firebase Authentication.";
  }

  if (error.code === "auth/network-request-failed") {
    return "Não foi possível conectar ao Firebase agora. Verifique sua internet e tente novamente.";
  }

  if (error.code === "auth/too-many-requests") {
    return "Muitas tentativas de acesso. Aguarde um instante e tente novamente.";
  }

  return defaultSiteConfig.adminSite.login.errorMessage;
}

function hydrateLoginCopy() {
  document.title = `Admin | ${defaultSiteConfig.couple.names}`;
  setText(dom.adminLoginTitle, defaultSiteConfig.adminSite.login.title);
  setText(dom.adminLoginBody, `${defaultSiteConfig.adminSite.login.body} ${defaultSiteConfig.adminSite.setupHint}`);
  setText(dom.adminEmailLabel, defaultSiteConfig.adminSite.login.emailLabel);
  setText(dom.adminPasswordLabel, defaultSiteConfig.adminSite.login.passwordLabel);
  setText(dom.adminLoginButton, defaultSiteConfig.adminSite.login.submitLabel);
}

function showLoggedOutState(message = "") {
  dom.adminLoginSection.hidden = false;
  dom.adminDashboardSection.hidden = true;
  dom.adminPassword.value = "";
  setFeedback(dom.adminLoginFeedback, message ? "error" : "", message);
}

function showLoggedInState() {
  dom.adminLoginSection.hidden = true;
  dom.adminDashboardSection.hidden = false;
  setFeedback(dom.adminLoginFeedback, "", "");
}

function buildInviteUrl(slug) {
  return new URL(`convite.html?slug=${encodeURIComponent(slug)}`, window.location.href).href;
}

function getPrimaryInviteUrl() {
  const activeFamily = state.families.find((family) => family.isActive !== false && family.slug);
  return activeFamily?.slug ? buildInviteUrl(activeFamily.slug) : "";
}

function openInvitePreview() {
  const inviteUrl = getPrimaryInviteUrl();

  if (!inviteUrl) {
    setGlobalFeedback("error", "Cadastre ao menos um convite ativo para abrir a página de convite.");
    return;
  }

  window.open(inviteUrl, "_blank", "noreferrer");
}

function isValidUrl(value) {
  try {
    const parsed = new URL(normalizeString(value));
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch (error) {
    return false;
  }
}

function createEmptyState(message) {
  const emptyState = createElement("article", "empty-state-card");
  emptyState.appendChild(createElement("p", "section-body", message));
  return emptyState;
}

function scrollToElement(element) {
  element?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function getDirtyTabs() {
  return Object.entries(state.dirtyTabs)
    .filter(([, isDirty]) => isDirty)
    .map(([tab]) => tab);
}

function updateDraftIndicator() {
  const activeLabel = TAB_LABELS[state.ui.activeTab] || TAB_LABELS.families;
  const dirtyTabs = getDirtyTabs();

  setText(dom.adminActiveTabLabel, `Aba ativa: ${activeLabel}`);

  if (!dirtyTabs.length) {
    setText(dom.adminDraftIndicator, "Sem alterações não salvas");
    return;
  }

  if (dirtyTabs.length === 1) {
    setText(dom.adminDraftIndicator, `Rascunho pendente em ${TAB_LABELS[dirtyTabs[0]]}`);
    return;
  }

  setText(dom.adminDraftIndicator, `${dirtyTabs.length} abas com alterações não salvas`);
}

function setFilterButtonsState(buttons, activeValue, attributeName) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset[attributeName] === activeValue);
  });
}

function syncUiControls() {
  dom.familySearchInput.value = state.ui.familySearch;
  dom.giftSearchInput.value = state.ui.giftSearch;
  dom.tableSearchInput.value = state.ui.tableSearch;
  dom.seatAssignmentSearchInput.value = state.ui.seatSearch;
  dom.siteSearchInput.value = state.ui.siteSearch;
  setFilterButtonsState(dom.familyFilterButtons, state.ui.familyFilter, "familyFilter");
  setFilterButtonsState(dom.giftFilterButtons, state.ui.giftFilter, "giftFilter");
  setFilterButtonsState(dom.tableFilterButtons, state.ui.tableFilter, "tableFilter");
}

function setActiveTab(nextTab, options = {}) {
  if (nextTab === state.ui.activeTab && !options.force) {
    return;
  }

  if (!options.skipConfirm && state.ui.activeTab !== nextTab && state.dirtyTabs[state.ui.activeTab]) {
    const shouldContinue = window.confirm(
      `A aba ${TAB_LABELS[state.ui.activeTab]} tem alterações não salvas. Deseja trocar de aba e manter o rascunho salvo no navegador?`
    );

    if (!shouldContinue) {
      return;
    }
  }

  state.ui.activeTab = nextTab;
  persistUiState();

  dom.tabButtons.forEach((button) => {
    const isActive = button.dataset.tabTarget === nextTab;
    button.classList.toggle("is-active", isActive);
  });

  dom.tabPanels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === nextTab;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  updateDraftIndicator();
  setGlobalFeedback("", "");
}

function handleBeforeUnload(event) {
  if (!getDirtyTabs().length) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
}

function confirmDiscardIfDirty(tabName, actionLabel) {
  if (!state.dirtyTabs[tabName]) {
    return true;
  }

  return window.confirm(
    `A aba ${TAB_LABELS[tabName]} tem alterações não salvas. Deseja ${actionLabel} e descartar este rascunho?`
  );
}

function createOptionList(selectElement, selectedValue) {
  selectElement.innerHTML = "";
  selectElement.appendChild(new Option("Sem mesa", ""));

  state.tables.forEach((table) => {
    selectElement.appendChild(new Option(table.name, table.id, false, table.id === selectedValue));
  });
}

function getBlankFamilyDraft() {
  return {
    id: "",
    familyName: "",
    displayName: "",
    customMessage: "",
    slug: "",
    isActive: true,
    memberBulkInput: "",
    guests: [{
      id: "",
      name: "",
      responseStatus: "pending",
      tableId: ""
    }]
  };
}

function normalizeFamilyDraft(draft) {
  return {
    id: normalizeString(draft?.id),
    familyName: normalizeString(draft?.familyName),
    displayName: normalizeString(draft?.displayName),
    customMessage: normalizeString(draft?.customMessage),
    slug: slugify(draft?.slug),
    isActive: draft?.isActive !== false,
    memberBulkInput: normalizeString(draft?.memberBulkInput),
    guests: (draft?.guests || [])
      .map((guest) => ({
        id: normalizeString(guest?.id),
        name: normalizeString(guest?.name),
        responseStatus: normalizeStatus(guest?.responseStatus),
        tableId: normalizeString(guest?.tableId)
      }))
      .filter((guest) => guest.id || guest.name || guest.tableId || guest.responseStatus !== "pending")
  };
}

function familyDraftsEqual(leftDraft, rightDraft) {
  return JSON.stringify(normalizeFamilyDraft(leftDraft)) === JSON.stringify(normalizeFamilyDraft(rightDraft));
}

function familyToDraft(family, options = {}) {
  if (!family) {
    return getBlankFamilyDraft();
  }

  const isDuplicate = options.duplicate === true;
  const draft = {
    id: isDuplicate ? "" : family.id,
    familyName: isDuplicate ? `${family.familyName || "Família"} (cópia)` : family.familyName || "",
    displayName: family.displayName || "",
    customMessage: family.customMessage || "",
    slug: isDuplicate
      ? generateReadableInviteSlug(family.familyName || family.displayName || "familia")
      : family.slug || "",
    isActive: family.isActive !== false,
    memberBulkInput: "",
    guests: (family.guests || []).map((guest) => ({
      id: isDuplicate ? "" : guest.id,
      name: guest.name || "",
      responseStatus: isDuplicate ? "pending" : normalizeStatus(guest.responseStatus),
      tableId: isDuplicate ? "" : guest.tableId || ""
    }))
  };

  return draft.guests.length ? draft : getBlankFamilyDraft();
}

function getCurrentFamilyBaseline() {
  const familyId = normalizeString(dom.familyId.value);
  const family = state.families.find((item) => item.id === familyId);
  return family ? familyToDraft(family) : getBlankFamilyDraft();
}

function setFamilyEditorMode(modeLabel, description, submitLabel) {
  setText(dom.familyFormTitle, modeLabel);
  setText(dom.familyFormStatus, description);
  setText(dom.familySubmitButton, submitLabel);
}

function createMemberEditorItem(member = {}) {
  const item = createElement("article", "member-editor-item");
  const hiddenId = createElement("input");
  hiddenId.type = "hidden";
  hiddenId.className = "member-id-input";
  hiddenId.value = member.id || "";

  const nameGroup = createElement("div", "field-group");
  const nameLabel = createElement("label", "", "Nome do convidado");
  const nameInput = createElement("input");
  nameInput.type = "text";
  nameInput.className = "member-name-input";
  nameInput.value = member.name || "";
  nameInput.required = true;
  nameGroup.append(nameLabel, nameInput);

  const statusGroup = createElement("div", "field-group");
  const statusLabel = createElement("label", "", "Status");
  const statusSelect = createElement("select", "member-status-input");
  [
    { value: "pending", label: "Sem resposta" },
    { value: "confirmed", label: "Confirmado" },
    { value: "declined", label: "Recusado" }
  ].forEach((option) => {
    statusSelect.appendChild(new Option(option.label, option.value, false, option.value === normalizeStatus(member.responseStatus)));
  });
  statusGroup.append(statusLabel, statusSelect);

  const tableGroup = createElement("div", "field-group");
  const tableLabel = createElement("label", "", "Mesa");
  const tableSelect = createElement("select", "member-table-input");
  createOptionList(tableSelect, member.tableId || "");
  tableGroup.append(tableLabel, tableSelect);

  const grid = createElement("div", "member-editor-grid");
  grid.append(nameGroup, statusGroup, tableGroup);

  const removeButton = createElement("button", "button button-secondary button-solid-light button-small", "Remover");
  removeButton.type = "button";
  removeButton.addEventListener("click", () => {
    item.remove();
    updateMemberEditorHint();
    syncFamilyDraftStateFromForm();
  });

  [nameInput, statusSelect, tableSelect].forEach((control) => {
    control.addEventListener("input", syncFamilyDraftStateFromForm);
    control.addEventListener("change", syncFamilyDraftStateFromForm);
  });

  item.append(hiddenId, grid, removeButton);
  dom.memberEditorList.appendChild(item);
}

function updateMemberEditorHint() {
  const total = dom.memberEditorList.querySelectorAll(".member-editor-item").length;
  setText(
    dom.memberEditorHint,
    total
      ? `${total} ${total === 1 ? "convidado cadastrado." : "convidados cadastrados."}`
      : "Adicione uma linha para cada pessoa convidada."
  );
}

function refreshMemberTableOptions() {
  Array.from(dom.memberEditorList.querySelectorAll(".member-table-input")).forEach((select) => {
    const selectedValue = normalizeString(select.value);
    createOptionList(select, selectedValue);
  });
}

function collectMembersFromEditor() {
  return Array.from(dom.memberEditorList.querySelectorAll(".member-editor-item"))
    .map((item) => ({
      id: normalizeString(item.querySelector(".member-id-input")?.value),
      name: normalizeString(item.querySelector(".member-name-input")?.value),
      responseStatus: normalizeStatus(item.querySelector(".member-status-input")?.value),
      tableId: normalizeString(item.querySelector(".member-table-input")?.value)
    }))
    .filter((guest) => guest.name);
}

function readFamilyDraftFromForm() {
  return {
    id: normalizeString(dom.familyId.value),
    familyName: normalizeString(dom.familyName.value),
    displayName: normalizeString(dom.displayName.value),
    customMessage: normalizeString(dom.customMessage.value),
    slug: slugify(dom.familySlug.value),
    isActive: dom.isActive.checked,
    memberBulkInput: normalizeString(dom.memberBulkInput.value),
    guests: collectMembersFromEditor()
  };
}

function applyFamilyDraftToForm(draft, options = {}) {
  const nextDraft = normalizeFamilyDraft(draft);

  dom.familyId.value = nextDraft.id;
  dom.familyName.value = nextDraft.familyName;
  dom.displayName.value = nextDraft.displayName;
  dom.customMessage.value = nextDraft.customMessage;
  dom.familySlug.value = nextDraft.slug;
  dom.isActive.checked = nextDraft.isActive;
  dom.memberBulkInput.value = options.preserveBulk ? dom.memberBulkInput.value : nextDraft.memberBulkInput;
  dom.memberEditorList.innerHTML = "";

  const guests = nextDraft.guests.length ? nextDraft.guests : getBlankFamilyDraft().guests;
  guests.forEach((guest) => createMemberEditorItem(guest));
  updateMemberEditorHint();
}

function syncFamilyDraftStateFromForm() {
  const currentDraft = readFamilyDraftFromForm();
  const baselineDraft = getCurrentFamilyBaseline();
  const isDirty = !familyDraftsEqual(currentDraft, baselineDraft);

  state.dirtyTabs.families = isDirty;
  state.drafts.families = isDirty ? currentDraft : null;
  persistDrafts();
  updateDraftIndicator();
}

function openNewFamilyEditor() {
  applyFamilyDraftToForm(getBlankFamilyDraft());
  setFamilyEditorMode("Novo convite", "Monte o convite, revise os convidados e salve quando terminar.", "Salvar convite");
  setFeedback(dom.familyFormFeedback, "", "");
  state.dirtyTabs.families = false;
  state.drafts.families = null;
  persistDrafts();
  updateDraftIndicator();
  scrollToElement(dom.familyFormTitle);
}

function editFamily(family) {
  applyFamilyDraftToForm(familyToDraft(family));
  setFamilyEditorMode("Editando convite", "Revise os dados atuais e salve quando concluir as alterações.", "Salvar convite");
  setFeedback(dom.familyFormFeedback, "", "");
  state.dirtyTabs.families = false;
  state.drafts.families = null;
  persistDrafts();
  updateDraftIndicator();
  setActiveTab("families", { skipConfirm: true });
  scrollToElement(dom.familyFormTitle);
}

function duplicateFamily(family) {
  applyFamilyDraftToForm(familyToDraft(family, { duplicate: true }));
  setFamilyEditorMode("Duplicando convite", "Os convidados foram copiados e o novo slug já foi gerado automaticamente.", "Salvar convite");
  syncFamilyDraftStateFromForm();
  setFeedback(dom.familyFormFeedback, "success", "Rascunho duplicado. Ajuste o que quiser antes de salvar.");
  setActiveTab("families", { skipConfirm: true });
  scrollToElement(dom.familyFormTitle);
}

function discardFamilyDraft() {
  const baseline = getCurrentFamilyBaseline();
  applyFamilyDraftToForm(baseline);
  setFamilyEditorMode(
    baseline.id ? "Editando convite" : "Novo convite",
    baseline.id
      ? "Os valores carregados deste convite foram restaurados."
      : "Monte o convite, revise os convidados e salve quando terminar.",
    baseline.id ? "Salvar convite" : "Salvar convite"
  );
  setFeedback(dom.familyFormFeedback, "", "");
  state.dirtyTabs.families = false;
  state.drafts.families = null;
  persistDrafts();
  updateDraftIndicator();
}

function applyBulkMembers() {
  const names = normalizeString(dom.memberBulkInput.value)
    .split(/\r?\n/)
    .map((line) => normalizeString(line))
    .filter(Boolean);

  if (!names.length) {
    setFeedback(dom.familyFormFeedback, "error", "Cole pelo menos um nome para usar o cadastro rápido.");
    return;
  }

  const existingNames = new Set(
    collectMembersFromEditor()
      .map((guest) => guest.name.toLocaleLowerCase("pt-BR"))
  );

  names.forEach((name) => {
    if (!existingNames.has(name.toLocaleLowerCase("pt-BR"))) {
      createMemberEditorItem({
        id: "",
        name,
        responseStatus: "pending",
        tableId: ""
      });
    }
  });

  dom.memberBulkInput.value = "";
  updateMemberEditorHint();
  syncFamilyDraftStateFromForm();
  setFeedback(dom.familyFormFeedback, "success", "Lista de convidados aplicada ao rascunho.");
}

function getFilteredFamilies() {
  const searchTerm = normalizeString(state.ui.familySearch).toLocaleLowerCase("pt-BR");

  return state.families.filter((family) => {
    const summary = summarizeGuests(family.guests || []);
    const searchBlob = [
      family.familyName,
      family.displayName,
      family.slug,
      family.customMessage,
      ...(family.guests || []).map((guest) => guest.name)
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR");

    const matchesSearch = !searchTerm || searchBlob.includes(searchTerm);

    if (!matchesSearch) {
      return false;
    }

    if (state.ui.familyFilter === "active") {
      return family.isActive !== false;
    }

    if (state.ui.familyFilter === "hidden") {
      return family.isActive === false;
    }

    if (state.ui.familyFilter === "pending") {
      return summary.responseStatus === "pending";
    }

    if (state.ui.familyFilter === "partial") {
      return summary.responseStatus === "partial";
    }

    if (state.ui.familyFilter === "confirmed") {
      return summary.responseStatus === "confirmed";
    }

    return true;
  });
}

function renderStats() {
  dom.adminStatsGrid.innerHTML = "";

  const allGuests = state.families.flatMap((family) => family.guests || []);
  const summary = summarizeGuests(allGuests);
  const pendingFamilies = state.families.filter((family) => {
    return summarizeGuests(family.guests || []).responseStatus === "pending";
  }).length;

  [
    { label: "Famílias", value: state.families.length },
    { label: "Convidados", value: summary.invitedCount },
    { label: "Confirmados", value: summary.confirmedCount },
    { label: "Pendentes", value: pendingFamilies },
    { label: "Presentes ativos", value: state.gifts.filter((gift) => gift.isActive !== false).length }
  ].forEach((stat) => {
    const card = createElement("article", "panel stat-card");
    card.append(
      createElement("p", "stat-label", stat.label),
      createElement("p", "stat-value", String(stat.value))
    );
    dom.adminStatsGrid.appendChild(card);
  });
}

function renderFamilies() {
  const filteredFamilies = getFilteredFamilies();
  dom.familyList.innerHTML = "";

  setText(
    dom.familyListSummary,
    `${filteredFamilies.length} ${filteredFamilies.length === 1 ? "convite encontrado" : "convites encontrados"}`
  );

  if (!filteredFamilies.length) {
    dom.familyList.appendChild(createEmptyState("Nenhum convite combina com a busca atual."));
    return;
  }

  filteredFamilies.forEach((family) => {
    const summary = summarizeGuests(family.guests || []);
    const card = createElement("article", "family-card");
    const header = createElement("div", "family-card-header");
    const headerText = createElement("div");
    const title = createElement("h3", "family-card-title", family.familyName || "Família sem nome");
    const subtitle = createElement("p", "section-body compact-body", family.displayName || "");
    const badge = createElement("span", `status-badge status-${summary.responseStatus}`, formatInviteStatus(summary.responseStatus));
    headerText.append(title, subtitle);
    header.append(headerText, badge);

    const stats = createElement("div", "family-stats");
    [
      { label: "Convidados", value: String(summary.invitedCount) },
      { label: "Confirmados", value: String(summary.confirmedCount) },
      { label: "Status", value: family.isActive !== false ? "Ativo" : "Oculto" }
    ].forEach((item) => {
      const stat = createElement("div", "family-stat");
      stat.append(
        createElement("strong", "", item.value),
        createElement("span", "", item.label)
      );
      stats.appendChild(stat);
    });

    const linkRow = createElement("div", "family-link-row");
    const linkLabel = createElement("span", "family-link-label", "Link do convite");
    const linkBox = createElement("div", "family-link-box");
    const linkValue = createElement("span", "family-link-value", family.slug ? buildInviteUrl(family.slug) : "Sem slug");
    linkBox.appendChild(linkValue);
    linkRow.append(linkLabel, linkBox);

    const extraInfo = createElement("div", "admin-info-stack");

    if (family.customMessage) {
      extraInfo.appendChild(createElement("p", "section-body compact-body", `Mensagem: ${family.customMessage}`));
    }

    if (family.attendanceNote) {
      extraInfo.appendChild(createElement("p", "section-body compact-body", `Observação recebida: ${family.attendanceNote}`));
    }

    const guestsList = createElement("div", "member-chip-list");
    (family.guests || []).forEach((guest) => {
      const chip = createElement("div", "member-chip");
      chip.append(
        createElement("strong", "", guest.name),
        createElement("span", "", `${formatGuestStatus(guest.responseStatus)} • ${guest.tableId ? "Mesa definida" : "Sem mesa"}`)
      );
      guestsList.appendChild(chip);
    });

    const actions = createElement("div", "inline-actions");

    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => editFamily(family));

    const copyButton = createElement("button", "button button-secondary button-solid-light", "Copiar link");
    copyButton.type = "button";
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(buildInviteUrl(family.slug));
        setFeedback(dom.familyFormFeedback, "success", "Link copiado para a área de transferência.");
      } catch (error) {
        setFeedback(dom.familyFormFeedback, "error", "Não foi possível copiar o link agora.");
      }
    });

    const previewButton = createElement("button", "button button-secondary button-solid-light", "Ver convite");
    previewButton.type = "button";
    previewButton.addEventListener("click", () => {
      window.open(buildInviteUrl(family.slug), "_blank", "noreferrer");
    });

    const duplicateButton = createElement("button", "button button-secondary button-solid-light", "Duplicar");
    duplicateButton.type = "button";
    duplicateButton.addEventListener("click", () => duplicateFamily(family));

    const toggleButton = createElement("button", "button button-primary", family.isActive !== false ? "Ocultar" : "Ativar");
    toggleButton.type = "button";
    toggleButton.addEventListener("click", async () => {
      try {
        await toggleFamilyActive(family.id, family.isActive === false);
        setFeedback(dom.familyFormFeedback, "success", "Status do convite atualizado.");
      } catch (error) {
        setFeedback(dom.familyFormFeedback, "error", "Não foi possível alterar este convite.");
      }
    });

    actions.append(editButton, copyButton, previewButton, duplicateButton, toggleButton);
    card.append(header, stats, linkRow, extraInfo, guestsList, actions);
    dom.familyList.appendChild(card);
  });
}

function getBlankGiftDraft() {
  return {
    id: "",
    sortOrder: "",
    name: "",
    purchaseUrl: "",
    imageUrl: "",
    isActive: true
  };
}

function normalizeGiftDraft(draft) {
  return {
    id: normalizeString(draft?.id),
    sortOrder: normalizeString(draft?.sortOrder),
    name: normalizeString(draft?.name),
    purchaseUrl: normalizeString(draft?.purchaseUrl),
    imageUrl: normalizeString(draft?.imageUrl),
    isActive: draft?.isActive !== false
  };
}

function giftDraftsEqual(leftDraft, rightDraft) {
  return JSON.stringify(normalizeGiftDraft(leftDraft)) === JSON.stringify(normalizeGiftDraft(rightDraft));
}

function giftToDraft(gift, options = {}) {
  if (!gift) {
    return getBlankGiftDraft();
  }

  return {
    id: options.duplicate ? "" : gift.id,
    sortOrder: String(options.duplicate ? Date.now() : gift.sortOrder || ""),
    name: options.duplicate ? `${gift.name || "Presente"} (cópia)` : gift.name || "",
    purchaseUrl: gift.purchaseUrl || "",
    imageUrl: gift.imageUrl || "",
    isActive: gift.isActive !== false
  };
}

function getCurrentGiftBaseline() {
  const giftId = normalizeString(dom.giftId.value);
  const gift = state.gifts.find((item) => item.id === giftId);
  return gift ? giftToDraft(gift) : getBlankGiftDraft();
}

function setGiftEditorMode(modeLabel, description, submitLabel) {
  setText(dom.giftFormTitle, modeLabel);
  setText(dom.giftFormStatus, description);
  setText(dom.giftSubmitButton, submitLabel);
}

function renderGiftPreview(imageUrl) {
  const normalizedUrl = normalizeString(imageUrl);
  dom.giftImagePreviewShell.hidden = !normalizedUrl;
  dom.giftImagePreview.src = normalizedUrl;
}

function applyGiftDraftToForm(draft) {
  const nextDraft = normalizeGiftDraft(draft);
  dom.giftId.value = nextDraft.id;
  dom.giftSortOrder.value = nextDraft.sortOrder;
  dom.giftName.value = nextDraft.name;
  dom.giftPurchaseUrl.value = nextDraft.purchaseUrl;
  dom.giftImageUrl.value = nextDraft.imageUrl;
  dom.giftIsActive.checked = nextDraft.isActive;
  renderGiftPreview(nextDraft.imageUrl);
}

function readGiftDraftFromForm() {
  return {
    id: normalizeString(dom.giftId.value),
    sortOrder: normalizeString(dom.giftSortOrder.value),
    name: normalizeString(dom.giftName.value),
    purchaseUrl: normalizeString(dom.giftPurchaseUrl.value),
    imageUrl: normalizeString(dom.giftImageUrl.value),
    isActive: dom.giftIsActive.checked
  };
}

function syncGiftDraftStateFromForm() {
  const currentDraft = readGiftDraftFromForm();
  const baselineDraft = getCurrentGiftBaseline();
  const isDirty = !giftDraftsEqual(currentDraft, baselineDraft);

  state.dirtyTabs.gifts = isDirty;
  state.drafts.gifts = isDirty ? currentDraft : null;
  persistDrafts();
  updateDraftIndicator();
}

function openNewGiftEditor() {
  applyGiftDraftToForm(getBlankGiftDraft());
  setGiftEditorMode("Novo presente", "Defina o nome, o link de compra, a imagem e a ordem de exibição.", "Salvar presente");
  setFeedback(dom.giftFormFeedback, "", "");
  state.dirtyTabs.gifts = false;
  state.drafts.gifts = null;
  persistDrafts();
  updateDraftIndicator();
  scrollToElement(dom.giftFormTitle);
}

function editGift(gift) {
  applyGiftDraftToForm(giftToDraft(gift));
  setGiftEditorMode("Editando presente", "Revise os dados e salve quando terminar as alterações.", "Salvar presente");
  setFeedback(dom.giftFormFeedback, "", "");
  state.dirtyTabs.gifts = false;
  state.drafts.gifts = null;
  persistDrafts();
  updateDraftIndicator();
  setActiveTab("gifts", { skipConfirm: true });
  scrollToElement(dom.giftFormTitle);
}

function duplicateGift(gift) {
  applyGiftDraftToForm(giftToDraft(gift, { duplicate: true }));
  setGiftEditorMode("Duplicando presente", "O rascunho foi preparado com uma nova ordem de exibição.", "Salvar presente");
  syncGiftDraftStateFromForm();
  setFeedback(dom.giftFormFeedback, "success", "Rascunho duplicado. Ajuste o que quiser antes de salvar.");
  setActiveTab("gifts", { skipConfirm: true });
  scrollToElement(dom.giftFormTitle);
}

function discardGiftDraft() {
  const baseline = getCurrentGiftBaseline();
  applyGiftDraftToForm(baseline);
  setGiftEditorMode(
    baseline.id ? "Editando presente" : "Novo presente",
    baseline.id
      ? "Os valores carregados deste presente foram restaurados."
      : "Defina o nome, o link de compra, a imagem e a ordem de exibição.",
    "Salvar presente"
  );
  setFeedback(dom.giftFormFeedback, "", "");
  state.dirtyTabs.gifts = false;
  state.drafts.gifts = null;
  persistDrafts();
  updateDraftIndicator();
}

function getFilteredGifts() {
  const searchTerm = normalizeString(state.ui.giftSearch).toLocaleLowerCase("pt-BR");

  return state.gifts.filter((gift) => {
    const searchBlob = [gift.name, gift.purchaseUrl, gift.imageUrl].join(" ").toLocaleLowerCase("pt-BR");
    const matchesSearch = !searchTerm || searchBlob.includes(searchTerm);

    if (!matchesSearch) {
      return false;
    }

    if (state.ui.giftFilter === "active") {
      return gift.isActive !== false;
    }

    if (state.ui.giftFilter === "hidden") {
      return gift.isActive === false;
    }

    if (state.ui.giftFilter === "with-link") {
      return Boolean(normalizeString(gift.purchaseUrl));
    }

    if (state.ui.giftFilter === "without-link") {
      return !normalizeString(gift.purchaseUrl);
    }

    if (state.ui.giftFilter === "without-image") {
      return !normalizeString(gift.imageUrl);
    }

    return true;
  });
}

function renderGiftList() {
  const filteredGifts = getFilteredGifts();
  dom.giftList.innerHTML = "";
  setText(dom.giftListSummary, `${filteredGifts.length} ${filteredGifts.length === 1 ? "presente encontrado" : "presentes encontrados"}`);

  if (!filteredGifts.length) {
    dom.giftList.appendChild(createEmptyState("Nenhum presente combina com a busca atual."));
    return;
  }

  filteredGifts.forEach((gift) => {
    const card = createElement("article", "gift-admin-card");

    if (gift.imageUrl) {
      const image = createElement("img", "gift-admin-image");
      image.src = gift.imageUrl;
      image.alt = gift.name || "Presente";
      card.appendChild(image);
    }

    const body = createElement("div", "gift-admin-body");
    body.append(
      createElement("h3", "panel-title", gift.name || "Presente sem nome"),
      createElement("p", "section-body compact-body", `Ordem: ${gift.sortOrder || "automática"}`),
      createElement("p", "section-body compact-body", gift.purchaseUrl || "Sem link de compra"),
      createElement("p", "section-body compact-body", gift.isActive !== false ? "Visível no site" : "Oculto no site")
    );

    const actions = createElement("div", "inline-actions");

    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => editGift(gift));

    const duplicateButton = createElement("button", "button button-secondary button-solid-light", "Duplicar");
    duplicateButton.type = "button";
    duplicateButton.addEventListener("click", () => duplicateGift(gift));

    if (gift.purchaseUrl) {
      const openButton = createElement("a", "button button-secondary button-solid-light", "Abrir link");
      openButton.href = gift.purchaseUrl;
      openButton.target = "_blank";
      openButton.rel = "noreferrer";
      actions.appendChild(openButton);
    }

    const toggleButton = createElement("button", "button button-primary", gift.isActive !== false ? "Ocultar" : "Ativar");
    toggleButton.type = "button";
    toggleButton.addEventListener("click", async () => {
      try {
        await saveGiftItem({
          id: gift.id,
          sortOrder: gift.sortOrder,
          name: gift.name,
          purchaseUrl: gift.purchaseUrl,
          imageUrl: gift.imageUrl,
          isActive: gift.isActive === false
        });
        setFeedback(dom.giftFormFeedback, "success", "Visibilidade do presente atualizada.");
      } catch (error) {
        setFeedback(dom.giftFormFeedback, "error", "Não foi possível atualizar este presente.");
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
        setFeedback(dom.giftFormFeedback, "success", "Presente excluído.");
      } catch (error) {
        setFeedback(dom.giftFormFeedback, "error", "Não foi possível excluir este presente.");
      }
    });

    actions.prepend(editButton, duplicateButton);
    actions.append(toggleButton, deleteButton);
    body.appendChild(actions);
    card.appendChild(body);
    dom.giftList.appendChild(card);
  });
}

function getBlankTableDraft() {
  return {
    id: "",
    sortOrder: "",
    name: "",
    capacity: "",
    notes: ""
  };
}

function normalizeTableDraft(draft) {
  return {
    id: normalizeString(draft?.id),
    sortOrder: normalizeString(draft?.sortOrder),
    name: normalizeString(draft?.name),
    capacity: normalizeString(draft?.capacity),
    notes: normalizeString(draft?.notes)
  };
}

function tableDraftsEqual(leftDraft, rightDraft) {
  return JSON.stringify(normalizeTableDraft(leftDraft)) === JSON.stringify(normalizeTableDraft(rightDraft));
}

function tableToDraft(table, options = {}) {
  if (!table) {
    return getBlankTableDraft();
  }

  return {
    id: options.duplicate ? "" : table.id,
    sortOrder: String(options.duplicate ? Date.now() : table.sortOrder || ""),
    name: options.duplicate ? `${table.name || "Mesa"} (cópia)` : table.name || "",
    capacity: String(table.capacity || ""),
    notes: table.notes || ""
  };
}

function getCurrentTableBaseline() {
  const tableId = normalizeString(dom.tableId.value);
  const table = state.tables.find((item) => item.id === tableId);
  return table ? tableToDraft(table) : getBlankTableDraft();
}

function setTableEditorMode(modeLabel, description, submitLabel) {
  setText(dom.tableFormTitle, modeLabel);
  setText(dom.tableFormStatus, description);
  setText(dom.tableSubmitButton, submitLabel);
}

function applyTableDraftToForm(draft) {
  const nextDraft = normalizeTableDraft(draft);
  dom.tableId.value = nextDraft.id;
  dom.tableSortOrder.value = nextDraft.sortOrder;
  dom.tableName.value = nextDraft.name;
  dom.tableCapacity.value = nextDraft.capacity;
  dom.tableNotes.value = nextDraft.notes;
}

function readTableDraftFromForm() {
  return {
    id: normalizeString(dom.tableId.value),
    sortOrder: normalizeString(dom.tableSortOrder.value),
    name: normalizeString(dom.tableName.value),
    capacity: normalizeString(dom.tableCapacity.value),
    notes: normalizeString(dom.tableNotes.value)
  };
}

function syncTableDraftStateFromForm() {
  const currentDraft = readTableDraftFromForm();
  const baselineDraft = getCurrentTableBaseline();
  const isDirty = !tableDraftsEqual(currentDraft, baselineDraft);

  state.dirtyTabs.tables = isDirty;
  state.drafts.tables = isDirty ? currentDraft : null;
  persistDrafts();
  updateDraftIndicator();
}

function openNewTableEditor() {
  applyTableDraftToForm(getBlankTableDraft());
  setTableEditorMode("Nova mesa", "Crie, duplique ou ajuste a lotação antes de salvar.", "Salvar mesa");
  setFeedback(dom.tableFormFeedback, "", "");
  state.dirtyTabs.tables = false;
  state.drafts.tables = null;
  persistDrafts();
  updateDraftIndicator();
  scrollToElement(dom.tableFormTitle);
}

function editTable(table) {
  applyTableDraftToForm(tableToDraft(table));
  setTableEditorMode("Editando mesa", "Revise os dados e salve quando concluir as alterações.", "Salvar mesa");
  setFeedback(dom.tableFormFeedback, "", "");
  state.dirtyTabs.tables = false;
  state.drafts.tables = null;
  persistDrafts();
  updateDraftIndicator();
  setActiveTab("tables", { skipConfirm: true });
  scrollToElement(dom.tableFormTitle);
}

function duplicateTable(table) {
  applyTableDraftToForm(tableToDraft(table, { duplicate: true }));
  setTableEditorMode("Duplicando mesa", "O rascunho foi preparado com nova ordem e sem convidados alocados.", "Salvar mesa");
  syncTableDraftStateFromForm();
  setFeedback(dom.tableFormFeedback, "success", "Rascunho duplicado. Ajuste o que quiser antes de salvar.");
  setActiveTab("tables", { skipConfirm: true });
  scrollToElement(dom.tableFormTitle);
}

function discardTableDraft() {
  const baseline = getCurrentTableBaseline();
  applyTableDraftToForm(baseline);
  setTableEditorMode(
    baseline.id ? "Editando mesa" : "Nova mesa",
    baseline.id
      ? "Os valores carregados desta mesa foram restaurados."
      : "Crie, duplique ou ajuste a lotação antes de salvar.",
    "Salvar mesa"
  );
  setFeedback(dom.tableFormFeedback, "", "");
  state.dirtyTabs.tables = false;
  state.drafts.tables = null;
  persistDrafts();
  updateDraftIndicator();
}

function collectAssignedGuests() {
  const assignedGuests = [];

  state.families.forEach((family) => {
    (family.guests || []).forEach((guest) => {
      if (guest.tableId) {
        assignedGuests.push({
          familyId: family.id,
          familyName: family.familyName || "",
          guestId: guest.id,
          guestName: guest.name || "",
          responseStatus: normalizeStatus(guest.responseStatus),
          tableId: guest.tableId
        });
      }
    });
  });

  return assignedGuests;
}

function collectConfirmedGuests() {
  return collectAssignedGuests()
    .concat(state.families.flatMap((family) => {
      return (family.guests || [])
        .filter((guest) => guest.responseStatus === "confirmed" && !guest.tableId)
        .map((guest) => ({
          familyId: family.id,
          familyName: family.familyName || "",
          guestId: guest.id,
          guestName: guest.name || "",
          responseStatus: "confirmed",
          tableId: ""
        }));
    }))
    .filter((guest, index, list) => {
      return list.findIndex((item) => `${item.familyId}:${item.guestId}` === `${guest.familyId}:${guest.guestId}`) === index;
    })
    .filter((guest) => guest.responseStatus === "confirmed")
    .sort((left, right) => left.guestName.localeCompare(right.guestName, "pt-BR"));
}

function getFilteredTables() {
  const searchTerm = normalizeString(state.ui.tableSearch).toLocaleLowerCase("pt-BR");
  const assignedGuests = collectAssignedGuests();

  return state.tables.filter((table) => {
    const confirmedCount = assignedGuests.filter((guest) => guest.tableId === table.id && guest.responseStatus === "confirmed").length;
    const guestNames = assignedGuests.filter((guest) => guest.tableId === table.id).map((guest) => guest.guestName).join(" ");
    const searchBlob = `${table.name} ${table.notes || ""} ${guestNames}`.toLocaleLowerCase("pt-BR");
    const matchesSearch = !searchTerm || searchBlob.includes(searchTerm);

    if (!matchesSearch) {
      return false;
    }

    const capacity = Number(table.capacity || 0);

    if (state.ui.tableFilter === "empty") {
      return confirmedCount === 0;
    }

    if (state.ui.tableFilter === "partial") {
      return confirmedCount > 0 && confirmedCount < capacity;
    }

    if (state.ui.tableFilter === "full") {
      return capacity > 0 && confirmedCount === capacity;
    }

    if (state.ui.tableFilter === "over") {
      return confirmedCount > capacity;
    }

    return true;
  });
}

async function clearTableAssignments(tableId) {
  const assignedGuests = collectAssignedGuests().filter((guest) => guest.tableId === tableId);

  if (!assignedGuests.length) {
    setFeedback(dom.tableFormFeedback, "success", "Esta mesa já está sem convidados alocados.");
    return;
  }

  await Promise.all(assignedGuests.map((guest) => assignGuestToTable(guest.familyId, guest.guestId, "")));
}

function renderTablesBoard() {
  const filteredTables = getFilteredTables();
  const assignedGuests = collectAssignedGuests();
  dom.tablesBoard.innerHTML = "";
  setText(dom.tableListSummary, `${filteredTables.length} ${filteredTables.length === 1 ? "mesa encontrada" : "mesas encontradas"}`);

  if (!filteredTables.length) {
    dom.tablesBoard.appendChild(createEmptyState("Nenhuma mesa combina com a busca atual."));
    return;
  }

  filteredTables.forEach((table) => {
    const confirmedGuests = assignedGuests.filter((guest) => guest.tableId === table.id && guest.responseStatus === "confirmed");
    const allGuests = assignedGuests.filter((guest) => guest.tableId === table.id);
    const capacity = Number(table.capacity || 0);
    const isOverCapacity = confirmedGuests.length > capacity;
    const card = createElement("article", `table-card${isOverCapacity ? " is-over-capacity" : ""}`);
    const header = createElement("div", "table-card-header");
    const title = createElement("h3", "panel-title", table.name || "Mesa sem nome");
    const occupancy = createElement("span", "occupancy-badge", `${confirmedGuests.length}/${capacity || 0}`);
    header.append(title, occupancy);

    const notes = createElement("p", "section-body compact-body", table.notes || "Sem observações.");
    const members = createElement("div", "table-members-list");

    if (!allGuests.length) {
      members.appendChild(createElement("span", "table-member-pill", "Nenhum convidado alocado"));
    } else {
      allGuests.forEach((guest) => {
        members.appendChild(createElement("span", "table-member-pill", `${guest.guestName} • ${formatGuestStatus(guest.responseStatus)}`));
      });
    }

    const actions = createElement("div", "inline-actions");
    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => editTable(table));

    const duplicateButton = createElement("button", "button button-secondary button-solid-light", "Duplicar");
    duplicateButton.type = "button";
    duplicateButton.addEventListener("click", () => duplicateTable(table));

    const clearButton = createElement("button", "button button-secondary button-solid-light", "Limpar lugares");
    clearButton.type = "button";
    clearButton.addEventListener("click", async () => {
      if (!window.confirm("Deseja limpar todas as alocações desta mesa?")) {
        return;
      }

      try {
        await clearTableAssignments(table.id);
        setFeedback(dom.tableFormFeedback, "success", "As alocações desta mesa foram limpas.");
      } catch (error) {
        setFeedback(dom.tableFormFeedback, "error", "Não foi possível limpar as alocações desta mesa.");
      }
    });

    const deleteButton = createElement("button", "button button-secondary button-solid-light", "Excluir");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", async () => {
      if (!window.confirm("Deseja excluir esta mesa?")) {
        return;
      }

      try {
        await deleteTable(table.id);
        setFeedback(dom.tableFormFeedback, "success", "Mesa excluída.");
      } catch (error) {
        setFeedback(dom.tableFormFeedback, "error", "Não foi possível excluir esta mesa.");
      }
    });

    actions.append(editButton, duplicateButton, clearButton, deleteButton);
    card.append(header, notes, members, actions);
    dom.tablesBoard.appendChild(card);
  });
}

function renderUnseatedGuests() {
  dom.unseatedGuestList.innerHTML = "";
  const guests = collectConfirmedGuests().filter((guest) => !guest.tableId);

  if (!guests.length) {
    dom.unseatedGuestList.appendChild(createEmptyState("Todos os convidados confirmados já têm mesa definida."));
    return;
  }

  guests.forEach((guest) => {
    const row = createElement("div", "assignment-row");
    const copy = createElement("div", "assignment-copy");
    copy.append(
      createElement("strong", "", guest.guestName),
      createElement("span", "", guest.familyName)
    );

    const select = createElement("select", "assignment-select");
    createOptionList(select, "");
    select.addEventListener("change", async () => {
      select.disabled = true;

      try {
        await assignGuestToTable(guest.familyId, guest.guestId, select.value);
        setFeedback(dom.seatAssignmentFeedback, "success", "Mesa atualizada com sucesso.");
      } catch (error) {
        setFeedback(dom.seatAssignmentFeedback, "error", "Não foi possível alterar esta mesa.");
      } finally {
        select.disabled = false;
      }
    });

    row.append(copy, select);
    dom.unseatedGuestList.appendChild(row);
  });
}

function renderSeatAssignmentList() {
  dom.seatAssignmentList.innerHTML = "";
  const searchTerm = normalizeString(state.ui.seatSearch).toLocaleLowerCase("pt-BR");
  const guests = collectConfirmedGuests().filter((guest) => {
    const searchBlob = `${guest.guestName} ${guest.familyName}`.toLocaleLowerCase("pt-BR");
    return !searchTerm || searchBlob.includes(searchTerm);
  });

  if (!guests.length) {
    dom.seatAssignmentList.appendChild(createEmptyState("Nenhum convidado confirmado combina com a busca atual."));
    return;
  }

  guests.forEach((guest) => {
    const row = createElement("div", "assignment-row");
    const copy = createElement("div", "assignment-copy");
    copy.append(
      createElement("strong", "", guest.guestName),
      createElement("span", "", `${guest.familyName} • ${guest.tableId ? "Mesa definida" : "Sem mesa"}`)
    );

    const select = createElement("select", "assignment-select");
    createOptionList(select, guest.tableId);

    select.addEventListener("change", async () => {
      select.disabled = true;

      try {
        await assignGuestToTable(guest.familyId, guest.guestId, select.value);
        setFeedback(dom.seatAssignmentFeedback, "success", "Mesa atualizada com sucesso.");
      } catch (error) {
        setFeedback(dom.seatAssignmentFeedback, "error", "Não foi possível alterar esta mesa.");
        createOptionList(select, guest.tableId);
      } finally {
        select.disabled = false;
      }
    });

    row.append(copy, select);
    dom.seatAssignmentList.appendChild(row);
  });
}

function getSiteFormDataFromConfig(config) {
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

function getSiteFormDataFromDom() {
  return {
    settingsCoupleNames: normalizeString(dom.settingsCoupleNames.value),
    settingsMonogram: normalizeString(dom.settingsMonogram.value),
    settingsDateText: normalizeString(dom.settingsDateText.value),
    settingsDateTime: normalizeString(dom.settingsDateTime.value),
    settingsVenueName: normalizeString(dom.settingsVenueName.value),
    settingsVenueAddress: normalizeString(dom.settingsVenueAddress.value),
    settingsMapsLabel: normalizeString(dom.settingsMapsLabel.value),
    settingsMapsUrl: normalizeString(dom.settingsMapsUrl.value),
    settingsHeroEyebrow: normalizeString(dom.settingsHeroEyebrow.value),
    settingsSubtitle: normalizeString(dom.settingsSubtitle.value),
    settingsIntroKicker: normalizeString(dom.settingsIntroKicker.value),
    settingsIntroTitle: normalizeString(dom.settingsIntroTitle.value),
    settingsIntroBody: normalizeString(dom.settingsIntroBody.value),
    settingsStoryKicker: normalizeString(dom.settingsStoryKicker.value),
    settingsStoryTitle: normalizeString(dom.settingsStoryTitle.value),
    settingsStoryBody: normalizeString(dom.settingsStoryBody.value),
    settingsShowGifts: dom.settingsShowGifts.checked
  };
}

function siteDraftsEqual(leftDraft, rightDraft) {
  return JSON.stringify(leftDraft || {}) === JSON.stringify(rightDraft || {});
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

function getSiteBaselineData() {
  return getSiteFormDataFromConfig(state.loadedSiteConfig);
}

function updateSiteSectionIndicators() {
  const currentData = getSiteFormDataFromDom();
  const baselineData = getSiteBaselineData();

  Object.entries(SITE_SECTION_FIELDS).forEach(([sectionKey, fieldIds]) => {
    const isDirty = fieldIds.some((fieldId) => {
      return JSON.stringify(currentData[fieldId]) !== JSON.stringify(baselineData[fieldId]);
    });

    const indicator = dom[`siteSection${sectionKey[0].toUpperCase()}${sectionKey.slice(1)}Indicator`];
    if (indicator) {
      setText(indicator, isDirty ? "Rascunho pendente" : "Sem alterações");
      indicator.classList.toggle("is-dirty", isDirty);
    }
  });
}

function syncSiteDraftStateFromForm() {
  const currentDraft = getSiteFormDataFromDom();
  const baselineDraft = getSiteBaselineData();
  const isDirty = !siteDraftsEqual(currentDraft, baselineDraft);

  state.dirtyTabs.site = isDirty;
  state.drafts.site = isDirty ? currentDraft : null;
  persistDrafts();
  updateSiteSectionIndicators();
  updateDraftIndicator();
}

function restoreSiteSection(sectionKey) {
  const baselineDraft = getSiteBaselineData();

  SITE_SECTION_FIELDS[sectionKey].forEach((fieldId) => {
    const element = dom[fieldId];

    if (!element) {
      return;
    }

    if (element.type === "checkbox") {
      element.checked = baselineDraft[fieldId] !== false;
      return;
    }

    element.value = baselineDraft[fieldId] || "";
  });

  syncSiteDraftStateFromForm();
}

function applySiteSearchFilter() {
  const query = normalizeString(state.ui.siteSearch).toLocaleLowerCase("pt-BR");

  dom.siteBlocks.forEach((block) => {
    const haystack = `${block.dataset.siteSearch || ""} ${block.textContent || ""}`.toLocaleLowerCase("pt-BR");
    block.hidden = Boolean(query) && !haystack.includes(query);
  });
}

function renderAdminState() {
  renderStats();
  renderFamilies();
  renderGiftList();
  renderTablesBoard();
  renderUnseatedGuests();
  renderSeatAssignmentList();
  refreshMemberTableOptions();
}

async function loadRemoteSiteSettings() {
  try {
    const remoteSettings = await loadSiteSettings();
    state.loadedSiteConfig = buildRuntimeConfig(remoteSettings || {});
    state.mergedSiteConfig = state.loadedSiteConfig;
  } catch (error) {
    state.loadedSiteConfig = buildRuntimeConfig();
    state.mergedSiteConfig = state.loadedSiteConfig;
    setFeedback(
      dom.siteSettingsFeedback,
      "error",
      "Não foi possível carregar as informações salvas do site. O formulário exibirá os valores padrão."
    );
  }

  const initialData = state.drafts.site || getSiteFormDataFromConfig(state.loadedSiteConfig);
  applySiteFormData(initialData);
  state.dirtyTabs.site = Boolean(state.drafts.site);
  updateSiteSectionIndicators();
  updateDraftIndicator();
  applySiteSearchFilter();
}

function startSubscriptions() {
  if (state.subscriptionsStarted) {
    return;
  }

  state.subscriptionsStarted = true;

  state.unsubscribeFamilies = subscribeFamilies((families) => {
    state.families = families;
    renderAdminState();
  }, () => {
    setFeedback(dom.familyFormFeedback, "error", "Não foi possível carregar a lista de famílias.");
  });

  state.unsubscribeGifts = subscribeGiftItems((gifts) => {
    state.gifts = gifts;
    renderStats();
    renderGiftList();
  }, () => {
    setFeedback(dom.giftFormFeedback, "error", "Não foi possível carregar a lista de presentes.");
  });

  state.unsubscribeTables = subscribeTables((tables) => {
    state.tables = tables;
    renderAdminState();
  }, () => {
    setFeedback(dom.tableFormFeedback, "error", "Não foi possível carregar as mesas.");
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
  renderAdminState();
}

async function syncAdminState(user) {
  if (!user) {
    const message = state.logoutMessage;
    state.logoutMessage = "";
    stopSubscriptions();
    showLoggedOutState(message);
    return;
  }

  try {
    const adminProfile = await loadAdminProfile(user);

    if (!adminProfile?.active) {
      state.logoutMessage = "Esta conta não possui permissão administrativa. Cadastre o UID em admins/{uid} com active = true.";
      await logoutAdmin();
      return;
    }

    state.logoutMessage = "";
    showLoggedInState();
    await loadRemoteSiteSettings();
    startSubscriptions();
  } catch (error) {
    state.logoutMessage = "Não foi possível validar as permissões do admin agora.";
    stopSubscriptions();

    try {
      await logoutAdmin();
    } catch (logoutError) {
      // Ignora falha de limpeza.
    }

    showLoggedOutState(state.logoutMessage);
  }
}

function setupLoginForm() {
  dom.adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = normalizeString(dom.adminEmail.value);
    const password = String(dom.adminPassword.value || "");

    if (!email || !password) {
      setFeedback(dom.adminLoginFeedback, "error", "Informe e-mail e senha para continuar.");
      return;
    }

    setFeedback(dom.adminLoginFeedback, "", "");
    setLoginBusy(true);

    try {
      await loginAdmin(email, password);
      setFeedback(dom.adminLoginFeedback, "success", "Acesso confirmado. Carregando painel...");
      dom.adminPassword.value = "";
    } catch (error) {
      setFeedback(dom.adminLoginFeedback, "error", getAdminLoginErrorMessage(error));
    } finally {
      setLoginBusy(false);
    }
  });

  dom.adminLogoutButton.addEventListener("click", async () => {
    try {
      await logoutAdmin();
    } catch (error) {
      setFeedback(dom.adminLoginFeedback, "error", "Não foi possível encerrar a sessão agora.");
    }
  });
}

function setupTabs() {
  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tabTarget);
    });
  });
}

function setupFamilyForm() {
  dom.familyCreateNewButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("families", "abrir um novo convite")) {
      return;
    }

    openNewFamilyEditor();
  });
  dom.familyDiscardDraftButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("families", "restaurar os valores carregados")) {
      return;
    }

    discardFamilyDraft();
  });
  dom.familyResetButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("families", "limpar o formulário")) {
      return;
    }

    openNewFamilyEditor();
  });
  dom.generateSlugButton.addEventListener("click", () => {
    const source = dom.familySlug.value || dom.familyName.value || dom.displayName.value;
    dom.familySlug.value = source ? slugify(source) : generateReadableInviteSlug("familia");
    syncFamilyDraftStateFromForm();
  });
  dom.addMemberButton.addEventListener("click", () => {
    createMemberEditorItem();
    updateMemberEditorHint();
    syncFamilyDraftStateFromForm();
  });
  dom.memberBulkApplyButton.addEventListener("click", applyBulkMembers);
  dom.familySearchInput.addEventListener("input", () => {
    state.ui.familySearch = normalizeString(dom.familySearchInput.value);
    persistUiState();
    renderFamilies();
  });
  dom.familyFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.familyFilter = button.dataset.familyFilter || "all";
      persistUiState();
      setFilterButtonsState(dom.familyFilterButtons, state.ui.familyFilter, "familyFilter");
      renderFamilies();
    });
  });
  dom.familyForm.addEventListener("input", syncFamilyDraftStateFromForm);
  dom.familyForm.addEventListener("change", syncFamilyDraftStateFromForm);
  dom.familyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const familyName = normalizeString(dom.familyName.value);
    const displayName = normalizeString(dom.displayName.value);
    const slug = slugify(dom.familySlug.value) || generateReadableInviteSlug(familyName || displayName);
    const guests = collectMembersFromEditor();
    const existingFamily = state.families.find((family) => family.id === normalizeString(dom.familyId.value));

    if (!familyName || !displayName || !slug) {
      setFeedback(dom.familyFormFeedback, "error", "Preencha a família, o nome exibido e o slug do convite.");
      return;
    }

    if (!guests.length) {
      setFeedback(dom.familyFormFeedback, "error", "Adicione pelo menos um convidado ao convite.");
      return;
    }

    dom.familySubmitButton.disabled = true;
    setText(dom.familySubmitButton, "Salvando...");
    setFeedback(dom.familyFormFeedback, "", "");

    try {
      await saveFamily({
        id: normalizeString(dom.familyId.value),
        familyName,
        displayName,
        customMessage: normalizeString(dom.customMessage.value),
        attendanceNote: existingFamily?.attendanceNote || "",
        slug,
        isActive: dom.isActive.checked,
        guests
      });

      setFeedback(dom.familyFormFeedback, "success", "Convite salvo com sucesso.");
      openNewFamilyEditor();
    } catch (error) {
      if (error?.code === "family/slug-already-exists") {
        setFeedback(dom.familyFormFeedback, "error", "Já existe um convite com esse slug. Escolha outro.");
      } else {
        setFeedback(dom.familyFormFeedback, "error", "Não foi possível salvar este convite.");
      }
    } finally {
      dom.familySubmitButton.disabled = false;
      setText(dom.familySubmitButton, "Salvar convite");
    }
  });
}

function setupGiftForm() {
  dom.giftCreateNewButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("gifts", "abrir um novo presente")) {
      return;
    }

    openNewGiftEditor();
  });
  dom.giftDiscardDraftButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("gifts", "restaurar os valores carregados")) {
      return;
    }

    discardGiftDraft();
  });
  dom.giftResetButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("gifts", "limpar o formulário")) {
      return;
    }

    openNewGiftEditor();
  });
  dom.giftSearchInput.addEventListener("input", () => {
    state.ui.giftSearch = normalizeString(dom.giftSearchInput.value);
    persistUiState();
    renderGiftList();
  });
  dom.giftFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.giftFilter = button.dataset.giftFilter || "all";
      persistUiState();
      setFilterButtonsState(dom.giftFilterButtons, state.ui.giftFilter, "giftFilter");
      renderGiftList();
    });
  });
  dom.giftImageUrl.addEventListener("input", () => {
    renderGiftPreview(dom.giftImageUrl.value);
  });
  dom.giftForm.addEventListener("input", syncGiftDraftStateFromForm);
  dom.giftForm.addEventListener("change", syncGiftDraftStateFromForm);
  dom.giftForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = normalizeString(dom.giftName.value);
    const purchaseUrl = normalizeString(dom.giftPurchaseUrl.value);
    const imageUrl = normalizeString(dom.giftImageUrl.value);

    if (!name) {
      setFeedback(dom.giftFormFeedback, "error", "Informe o nome do presente.");
      return;
    }

    if (!imageUrl) {
      setFeedback(dom.giftFormFeedback, "error", "Informe a URL da imagem do presente.");
      return;
    }

    if (!isValidUrl(imageUrl)) {
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
        sortOrder: normalizeSortOrder(dom.giftSortOrder.value),
        name,
        purchaseUrl,
        imageUrl,
        isActive: dom.giftIsActive.checked
      });

      setFeedback(dom.giftFormFeedback, "success", "Presente salvo com sucesso.");
      openNewGiftEditor();
    } catch (error) {
      setFeedback(dom.giftFormFeedback, "error", "Não foi possível salvar este presente.");
    } finally {
      dom.giftSubmitButton.disabled = false;
      setText(dom.giftSubmitButton, "Salvar presente");
    }
  });
}

function setupTableForm() {
  dom.tableCreateNewButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("tables", "abrir uma nova mesa")) {
      return;
    }

    openNewTableEditor();
  });
  dom.tableDiscardDraftButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("tables", "restaurar os valores carregados")) {
      return;
    }

    discardTableDraft();
  });
  dom.tableResetButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("tables", "limpar o formulário")) {
      return;
    }

    openNewTableEditor();
  });
  dom.tableSearchInput.addEventListener("input", () => {
    state.ui.tableSearch = normalizeString(dom.tableSearchInput.value);
    persistUiState();
    renderTablesBoard();
  });
  dom.tableFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.tableFilter = button.dataset.tableFilter || "all";
      persistUiState();
      setFilterButtonsState(dom.tableFilterButtons, state.ui.tableFilter, "tableFilter");
      renderTablesBoard();
    });
  });
  dom.seatAssignmentSearchInput.addEventListener("input", () => {
    state.ui.seatSearch = normalizeString(dom.seatAssignmentSearchInput.value);
    persistUiState();
    renderSeatAssignmentList();
  });
  dom.tableForm.addEventListener("input", syncTableDraftStateFromForm);
  dom.tableForm.addEventListener("change", syncTableDraftStateFromForm);
  dom.tableForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = normalizeString(dom.tableName.value);
    const capacity = Number(dom.tableCapacity.value || 0);

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
        sortOrder: normalizeSortOrder(dom.tableSortOrder.value),
        name,
        capacity,
        notes: normalizeString(dom.tableNotes.value)
      });

      setFeedback(dom.tableFormFeedback, "success", "Mesa salva com sucesso.");
      openNewTableEditor();
    } catch (error) {
      setFeedback(dom.tableFormFeedback, "error", "Não foi possível salvar esta mesa.");
    } finally {
      dom.tableSubmitButton.disabled = false;
      setText(dom.tableSubmitButton, "Salvar mesa");
    }
  });
}

function setupSiteForm() {
  dom.adminPreviewInviteButton.addEventListener("click", openInvitePreview);
  dom.siteViewInviteButton.addEventListener("click", openInvitePreview);
  dom.siteSearchInput.addEventListener("input", () => {
    state.ui.siteSearch = normalizeString(dom.siteSearchInput.value);
    persistUiState();
    applySiteSearchFilter();
  });
  dom.siteSectionNavButtons.forEach((button) => {
    button.addEventListener("click", () => {
      dom.siteSectionNavButtons.forEach((navButton) => {
        navButton.classList.toggle("is-active", navButton === button);
      });
      const target = document.querySelector(`#${button.dataset.siteSectionTarget}`);
      scrollToElement(target);
    });
  });
  dom.siteRestoreButtons.forEach((button) => {
    button.addEventListener("click", () => {
      restoreSiteSection(button.dataset.restoreSection);
    });
  });
  dom.siteDiscardDraftButton.addEventListener("click", () => {
    if (!confirmDiscardIfDirty("site", "restaurar os valores carregados")) {
      return;
    }

    applySiteFormData(getSiteBaselineData());
    state.dirtyTabs.site = false;
    state.drafts.site = null;
    persistDrafts();
    updateSiteSectionIndicators();
    updateDraftIndicator();
    setFeedback(dom.siteSettingsFeedback, "", "");
  });
  dom.siteSettingsForm.addEventListener("input", syncSiteDraftStateFromForm);
  dom.siteSettingsForm.addEventListener("change", syncSiteDraftStateFromForm);
  dom.siteSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = getSiteFormDataFromDom();
    const dateTime = localDateTimeToIso(data.settingsDateTime);

    if (
      !data.settingsCoupleNames
      || !data.settingsDateText
      || !dateTime
      || !data.settingsVenueName
      || !data.settingsVenueAddress
      || !data.settingsMapsLabel
      || !data.settingsMapsUrl
    ) {
      setFeedback(dom.siteSettingsFeedback, "error", "Preencha nome do casal, data, horário, local, endereço e link do mapa.");
      return;
    }

    dom.siteSettingsSubmitButton.disabled = true;
    setText(dom.siteSettingsSubmitButton, "Salvando...");
    setFeedback(dom.siteSettingsFeedback, "", "");

    try {
      const payload = {
        couple: {
          ...state.loadedSiteConfig.couple,
          names: data.settingsCoupleNames,
          monogram: data.settingsMonogram,
          dateText: data.settingsDateText,
          dateTime,
          subtitle: data.settingsSubtitle
        },
        event: {
          ...state.loadedSiteConfig.event,
          venueName: data.settingsVenueName,
          address: data.settingsVenueAddress,
          mapsLabel: data.settingsMapsLabel,
          mapsUrl: data.settingsMapsUrl
        },
        publicSite: {
          ...state.loadedSiteConfig.publicSite,
          hero: {
            ...state.loadedSiteConfig.publicSite.hero,
            eyebrow: data.settingsHeroEyebrow
          },
          intro: {
            ...state.loadedSiteConfig.publicSite.intro,
            kicker: data.settingsIntroKicker,
            title: data.settingsIntroTitle,
            body: data.settingsIntroBody
          },
          story: {
            ...state.loadedSiteConfig.publicSite.story,
            kicker: data.settingsStoryKicker,
            title: data.settingsStoryTitle,
            body: data.settingsStoryBody
          }
        },
        features: {
          ...state.loadedSiteConfig.features,
          showGifts: data.settingsShowGifts
        }
      };

      await saveSiteSettings(payload);
      state.loadedSiteConfig = buildRuntimeConfig(payload);
      state.mergedSiteConfig = state.loadedSiteConfig;
      state.dirtyTabs.site = false;
      state.drafts.site = null;
      persistDrafts();
      updateSiteSectionIndicators();
      updateDraftIndicator();
      setFeedback(dom.siteSettingsFeedback, "success", "Informações do site atualizadas.");
    } catch (error) {
      setFeedback(dom.siteSettingsFeedback, "error", "Não foi possível salvar as informações do site.");
    } finally {
      dom.siteSettingsSubmitButton.disabled = false;
      setText(dom.siteSettingsSubmitButton, "Salvar informações do site");
    }
  });
}

function hydrateDraftEditors() {
  if (state.drafts.families) {
    applyFamilyDraftToForm(state.drafts.families);
    setFamilyEditorMode("Rascunho de convite", "Há alterações não salvas neste convite. Revise e salve quando quiser.", "Salvar convite");
    state.dirtyTabs.families = true;
  } else {
    openNewFamilyEditor();
  }

  if (state.drafts.gifts) {
    applyGiftDraftToForm(state.drafts.gifts);
    setGiftEditorMode("Rascunho de presente", "Há alterações não salvas neste presente. Revise e salve quando quiser.", "Salvar presente");
    state.dirtyTabs.gifts = true;
  } else {
    openNewGiftEditor();
  }

  if (state.drafts.tables) {
    applyTableDraftToForm(state.drafts.tables);
    setTableEditorMode("Rascunho de mesa", "Há alterações não salvas nesta mesa. Revise e salve quando quiser.", "Salvar mesa");
    state.dirtyTabs.tables = true;
  } else {
    openNewTableEditor();
  }
}

function initialize() {
  hydrateLoginCopy();
  syncUiControls();
  hydrateDraftEditors();
  setupLoginForm();
  setupTabs();
  setupFamilyForm();
  setupGiftForm();
  setupTableForm();
  setupSiteForm();
  applySiteSearchFilter();
  showLoggedOutState();
  updateDraftIndicator();
  setupRevealAnimations();
  window.addEventListener("beforeunload", handleBeforeUnload);

  observeAuthState((user) => {
    syncAdminState(user);
  });

  setActiveTab(state.ui.activeTab, { skipConfirm: true, force: true });
}

initialize();
