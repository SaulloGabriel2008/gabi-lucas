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
  adminStatsGrid: document.querySelector("#adminStatsGrid"),
  familyForm: document.querySelector("#familyForm"),
  familyId: document.querySelector("#familyId"),
  familyName: document.querySelector("#familyName"),
  displayName: document.querySelector("#displayName"),
  customMessage: document.querySelector("#customMessage"),
  familySlug: document.querySelector("#familySlug"),
  isActive: document.querySelector("#isActive"),
  generateSlugButton: document.querySelector("#generateSlugButton"),
  addMemberButton: document.querySelector("#addMemberButton"),
  memberEditorList: document.querySelector("#memberEditorList"),
  memberEditorHint: document.querySelector("#memberEditorHint"),
  familySubmitButton: document.querySelector("#familySubmitButton"),
  familyResetButton: document.querySelector("#familyResetButton"),
  familyFormFeedback: document.querySelector("#familyFormFeedback"),
  familyList: document.querySelector("#familyList"),
  siteSettingsForm: document.querySelector("#siteSettingsForm"),
  settingsDateText: document.querySelector("#settingsDateText"),
  settingsDateTime: document.querySelector("#settingsDateTime"),
  settingsSubtitle: document.querySelector("#settingsSubtitle"),
  settingsVenueName: document.querySelector("#settingsVenueName"),
  settingsVenueAddress: document.querySelector("#settingsVenueAddress"),
  settingsMapsLabel: document.querySelector("#settingsMapsLabel"),
  settingsMapsUrl: document.querySelector("#settingsMapsUrl"),
  settingsIntroKicker: document.querySelector("#settingsIntroKicker"),
  settingsIntroTitle: document.querySelector("#settingsIntroTitle"),
  settingsIntroBody: document.querySelector("#settingsIntroBody"),
  settingsStoryKicker: document.querySelector("#settingsStoryKicker"),
  settingsStoryTitle: document.querySelector("#settingsStoryTitle"),
  settingsStoryBody: document.querySelector("#settingsStoryBody"),
  settingsShowGifts: document.querySelector("#settingsShowGifts"),
  siteSettingsSubmitButton: document.querySelector("#siteSettingsSubmitButton"),
  siteSettingsFeedback: document.querySelector("#siteSettingsFeedback"),
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
  seatAssignmentList: document.querySelector("#seatAssignmentList"),
  seatAssignmentFeedback: document.querySelector("#seatAssignmentFeedback")
};

const state = {
  subscriptionsStarted: false,
  families: [],
  gifts: [],
  tables: [],
  mergedSiteConfig: buildRuntimeConfig(),
  logoutMessage: "",
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
    return "Informe um email vÃ¡lido para continuar.";
  }

  if (
    error.code === "auth/wrong-password"
    || error.code === "auth/invalid-credential"
    || error.code === "auth/invalid-login-credentials"
  ) {
    return "A senha informada estÃ¡ incorreta.";
  }

  if (error.code === "auth/user-not-found") {
    return "Esse usuÃ¡rio ainda nÃ£o foi criado no Firebase Authentication.";
  }

  if (error.code === "auth/operation-not-allowed") {
    return "O login por Email/Senha ainda nÃ£o foi habilitado no Firebase Authentication.";
  }

  if (error.code === "auth/unauthorized-domain") {
    return "Este domÃ­nio ainda nÃ£o foi autorizado no Firebase Authentication.";
  }

  if (error.code === "auth/network-request-failed") {
    return "NÃ£o foi possÃ­vel conectar ao Firebase agora. Verifique sua internet e tente novamente.";
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

function isValidUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch (error) {
    return false;
  }
}

function resolveTableName(tableId) {
  if (!tableId) {
    return "Sem mesa";
  }

  const table = state.tables.find((item) => item.id === tableId);
  return table ? table.name : "Mesa removida";
}

function createEmptyState(message) {
  const emptyState = createElement("article", "empty-state-card");
  emptyState.appendChild(createElement("p", "section-body", message));
  return emptyState;
}

function updateMemberEditorHint() {
  const total = dom.memberEditorList.querySelectorAll(".member-editor-item").length;
  setText(
    dom.memberEditorHint,
    total
      ? `${total} nome${total > 1 ? "s cadastrados." : " cadastrado."}`
      : "Adicione uma linha para cada pessoa convidada. A quantidade total serÃ¡ calculada automaticamente."
  );
}

function updateMemberEditorMeta(item) {
  const meta = item.querySelector(".member-editor-meta");
  const statusValue = item.querySelector(".member-status-input").value;
  const tableValue = item.querySelector(".member-table-input").value;
  meta.textContent = `Status: ${formatGuestStatus(statusValue)} | Mesa: ${resolveTableName(tableValue)}`;
}

function createMemberEditorItem(member = {}) {
  const item = createElement("div", "member-editor-item");
  const hiddenId = createElement("input");
  hiddenId.type = "hidden";
  hiddenId.className = "member-id-input";
  hiddenId.value = member.id || "";

  const hiddenStatus = createElement("input");
  hiddenStatus.type = "hidden";
  hiddenStatus.className = "member-status-input";
  hiddenStatus.value = member.responseStatus || "pending";

  const hiddenTable = createElement("input");
  hiddenTable.type = "hidden";
  hiddenTable.className = "member-table-input";
  hiddenTable.value = member.tableId || "";

  const nameGroup = createElement("div", "field-group");
  const nameLabel = createElement("label", "", "Nome do convidado");
  const nameInput = createElement("input");
  nameInput.type = "text";
  nameInput.className = "member-name-input";
  nameInput.value = member.name || "";
  nameInput.required = true;
  nameGroup.append(nameLabel, nameInput);

  const meta = createElement("p", "member-editor-meta");
  const removeButton = createElement("button", "button button-secondary button-solid-light button-small", "Remover");
  removeButton.type = "button";
  removeButton.addEventListener("click", () => {
    item.remove();
    updateMemberEditorHint();
  });

  item.append(hiddenId, hiddenStatus, hiddenTable, nameGroup, meta, removeButton);
  dom.memberEditorList.appendChild(item);
  updateMemberEditorMeta(item);
  updateMemberEditorHint();
}

function collectMembersFromEditor() {
  return Array.from(dom.memberEditorList.querySelectorAll(".member-editor-item"))
    .map((item) => ({
      id: String(item.querySelector(".member-id-input").value || "").trim(),
      name: String(item.querySelector(".member-name-input").value || "").trim(),
      responseStatus: item.querySelector(".member-status-input").value || "pending",
      tableId: item.querySelector(".member-table-input").value || ""
    }))
    .filter((member) => member.name);
}

function resetFamilyForm() {
  dom.familyForm.reset();
  dom.familyId.value = "";
  dom.familySlug.value = "";
  dom.isActive.checked = true;
  dom.memberEditorList.innerHTML = "";
  createMemberEditorItem();
  setText(dom.familySubmitButton, "Salvar convite");
  setFeedback(dom.familyFormFeedback, "", "");
}

function populateFamilyForm(family) {
  dom.familyId.value = family.id;
  dom.familyName.value = family.familyName || "";
  dom.displayName.value = family.displayName || "";
  dom.customMessage.value = family.customMessage || "";
  dom.familySlug.value = family.slug || "";
  dom.isActive.checked = family.isActive !== false;
  dom.memberEditorList.innerHTML = "";

  (family.guests || []).forEach((member) => createMemberEditorItem(member));

  if (!(family.guests || []).length) {
    createMemberEditorItem();
  }

  setText(dom.familySubmitButton, "Atualizar convite");
  setFeedback(dom.familyFormFeedback, "", "");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStats() {
  dom.adminStatsGrid.innerHTML = "";

  const allGuests = state.families.flatMap((family) => family.guests || []);
  const summary = summarizeGuests(allGuests);
  const activeGifts = state.gifts.filter((gift) => gift.isActive !== false).length;

  [
    { label: "FamÃ­lias", value: state.families.length },
    { label: "Convidados", value: summary.invitedCount },
    { label: "Confirmados", value: summary.confirmedCount },
    { label: "Presentes ativos", value: activeGifts }
  ].forEach((stat) => {
    const card = createElement("article", "panel stat-card");
    card.append(
      createElement("p", "section-kicker", stat.label),
      createElement("p", "stat-value", String(stat.value))
    );
    dom.adminStatsGrid.appendChild(card);
  });
}

function renderFamilies() {
  dom.familyList.innerHTML = "";

  if (!state.families.length) {
    dom.familyList.appendChild(createEmptyState("Nenhuma famÃ­lia cadastrada ainda."));
    return;
  }

  state.families.forEach((family) => {
    const isActive = family.isActive !== false;
    const summary = summarizeGuests(family.guests || []);
    const card = createElement("article", "panel family-card");
    const header = createElement("div", "family-card-header");
    const headerText = createElement("div");
    const title = createElement("h3", "panel-title", family.familyName || "FamÃ­lia sem nome");
    const subtitle = createElement("p", "section-body compact-body", family.displayName || "");
    const badge = createElement("span", `status-badge status-${summary.responseStatus}`, formatInviteStatus(summary.responseStatus));
    headerText.append(title, subtitle);
    header.append(headerText, badge);

    const info = createElement("div", "family-card-info");
    info.append(
      createElement("p", "section-body compact-body", `Link: ${family.slug ? buildInviteUrl(family.slug) : "Sem slug"}`),
      createElement("p", "section-body compact-body", `${summary.confirmedCount}/${summary.invitedCount} confirmados`),
      createElement("p", "section-body compact-body", isActive ? "Convite ativo" : "Convite oculto")
    );

    if (family.customMessage) {
      info.appendChild(createElement("p", "section-body compact-body", `Mensagem: ${family.customMessage}`));
    }

    if (family.attendanceNote) {
      info.appendChild(createElement("p", "section-body compact-body", `ObservaÃ§Ã£o enviada: ${family.attendanceNote}`));
    }

    const guestsList = createElement("div", "member-chip-list");
    (family.guests || []).forEach((member) => {
      const chip = createElement("div", "member-chip");
      chip.append(
        createElement("strong", "", member.name),
        createElement("span", "", `${formatGuestStatus(member.responseStatus)} | ${resolveTableName(member.tableId)}`)
      );
      guestsList.appendChild(chip);
    });

    const actions = createElement("div", "inline-actions");
    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => populateFamilyForm(family));

    const copyButton = createElement("button", "button button-secondary button-solid-light", "Copiar link");
    copyButton.type = "button";
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(buildInviteUrl(family.slug));
        setFeedback(dom.familyFormFeedback, "success", "Link copiado para a Ã¡rea de transferÃªncia.");
      } catch (error) {
        setFeedback(dom.familyFormFeedback, "error", "NÃ£o foi possÃ­vel copiar o link agora.");
      }
    });

    const toggleButton = createElement("button", "button button-primary", isActive ? "Ocultar" : "Ativar");
    toggleButton.type = "button";
    toggleButton.addEventListener("click", async () => {
      try {
        await toggleFamilyActive(family.id, !isActive);
        setFeedback(dom.familyFormFeedback, "success", "Status do convite atualizado.");
      } catch (error) {
        setFeedback(dom.familyFormFeedback, "error", "NÃ£o foi possÃ­vel alterar este convite.");
      }
    });

    actions.append(editButton, copyButton, toggleButton);
    card.append(header, info, guestsList, actions);
    dom.familyList.appendChild(card);
  });
}

function renderGiftPreview(imageUrl) {
  const normalizedUrl = String(imageUrl || "").trim();
  dom.giftImagePreviewShell.hidden = !normalizedUrl;
  dom.giftImagePreview.src = normalizedUrl || "";
}

function resetGiftForm() {
  dom.giftForm.reset();
  dom.giftId.value = "";
  dom.giftSortOrder.value = "";
  dom.giftIsActive.checked = true;
  renderGiftPreview("");
  setText(dom.giftSubmitButton, "Salvar presente");
  setFeedback(dom.giftFormFeedback, "", "");
}

function populateGiftForm(gift) {
  dom.giftId.value = gift.id;
  dom.giftSortOrder.value = String(gift.sortOrder || "");
  dom.giftName.value = gift.name || "";
  dom.giftPurchaseUrl.value = gift.purchaseUrl || "";
  dom.giftImageUrl.value = gift.imageUrl || "";
  dom.giftIsActive.checked = gift.isActive !== false;
  renderGiftPreview(gift.imageUrl || "");
  setText(dom.giftSubmitButton, "Atualizar presente");
  setFeedback(dom.giftFormFeedback, "", "");
}

function renderGiftList() {
  dom.giftList.innerHTML = "";

  if (!state.gifts.length) {
    dom.giftList.appendChild(createEmptyState("Nenhum presente cadastrado ainda."));
    return;
  }

  state.gifts.forEach((gift) => {
    const card = createElement("article", "panel gift-admin-card");

    if (gift.imageUrl) {
      const image = createElement("img", "gift-admin-image");
      image.src = gift.imageUrl;
      image.alt = gift.name || "Presente";
      card.appendChild(image);
    }

    const body = createElement("div");
    body.append(
      createElement("h3", "panel-title", gift.name),
      createElement("p", "section-body compact-body", gift.purchaseUrl || "Sem link de compra"),
      createElement("p", "section-body compact-body", gift.isActive !== false ? "VisÃ­vel no site" : "Oculto no site")
    );

    const actions = createElement("div", "inline-actions");
    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => populateGiftForm(gift));

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
        setFeedback(dom.giftFormFeedback, "error", "NÃ£o foi possÃ­vel atualizar esse presente.");
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
        setFeedback(dom.giftFormFeedback, "success", "Presente excluÃ­do.");
      } catch (error) {
        setFeedback(dom.giftFormFeedback, "error", "NÃ£o foi possÃ­vel excluir este presente.");
      }
    });

    actions.append(editButton, toggleButton, deleteButton);
    card.append(body, actions);
    dom.giftList.appendChild(card);
  });
}

function resetTableForm() {
  dom.tableForm.reset();
  dom.tableId.value = "";
  dom.tableSortOrder.value = "";
  setText(dom.tableSubmitButton, "Salvar mesa");
  setFeedback(dom.tableFormFeedback, "", "");
}

function populateTableForm(table) {
  dom.tableId.value = table.id;
  dom.tableSortOrder.value = String(table.sortOrder || "");
  dom.tableName.value = table.name || "";
  dom.tableCapacity.value = String(table.capacity || "");
  dom.tableNotes.value = table.notes || "";
  setText(dom.tableSubmitButton, "Atualizar mesa");
  setFeedback(dom.tableFormFeedback, "", "");
}

function collectConfirmedGuests() {
  const guests = [];

  state.families.forEach((family) => {
    (family.guests || []).forEach((guest) => {
      if (guest.responseStatus === "confirmed") {
        guests.push({
          familyId: family.id,
          familyName: family.familyName || "",
          guestId: guest.id,
          guestName: guest.name || "",
          tableId: guest.tableId || ""
        });
      }
    });
  });

  return guests.sort((left, right) => left.guestName.localeCompare(right.guestName));
}

function renderTablesBoard() {
  dom.tablesBoard.innerHTML = "";
  const confirmedGuests = collectConfirmedGuests();

  if (!state.tables.length) {
    dom.tablesBoard.appendChild(createEmptyState("Cadastre as mesas para visualizar o mapa e a ocupaÃ§Ã£o."));
    return;
  }

  state.tables.forEach((table) => {
    const assignedGuests = confirmedGuests.filter((guest) => guest.tableId === table.id);
    const card = createElement("article", "panel table-board-card");
    const title = createElement("h3", "panel-title", table.name);
    const subtitle = createElement(
      "p",
      "section-body compact-body",
      `${assignedGuests.length}/${Number(table.capacity || 0)} lugares preenchidos`
    );
    const notes = createElement("p", "section-body compact-body", table.notes || "Sem observaÃ§Ãµes.");
    const list = createElement("div", "member-chip-list");

    if (!assignedGuests.length) {
      list.appendChild(createElement("p", "section-body compact-body", "Nenhum convidado confirmado nesta mesa."));
    } else {
      assignedGuests.forEach((guest) => {
        const chip = createElement("div", "member-chip");
        chip.append(
          createElement("strong", "", guest.guestName),
          createElement("span", "", guest.familyName)
        );
        list.appendChild(chip);
      });
    }

    const actions = createElement("div", "inline-actions");
    const editButton = createElement("button", "button button-secondary button-solid-light", "Editar");
    editButton.type = "button";
    editButton.addEventListener("click", () => populateTableForm(table));

    const deleteButton = createElement("button", "button button-secondary button-solid-light", "Excluir");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", async () => {
      if (!window.confirm("Deseja excluir esta mesa?")) {
        return;
      }

      try {
        await deleteTable(table.id);
        setFeedback(dom.tableFormFeedback, "success", "Mesa excluÃ­da.");
      } catch (error) {
        setFeedback(dom.tableFormFeedback, "error", "NÃ£o foi possÃ­vel excluir esta mesa.");
      }
    });

    actions.append(editButton, deleteButton);
    card.append(title, subtitle, notes, list, actions);
    dom.tablesBoard.appendChild(card);
  });
}

function renderSeatAssignmentList() {
  dom.seatAssignmentList.innerHTML = "";
  const confirmedGuests = collectConfirmedGuests();

  if (!confirmedGuests.length) {
    dom.seatAssignmentList.appendChild(createEmptyState("As confirmaÃ§Ãµes aparecerÃ£o aqui assim que chegarem."));
    return;
  }

  confirmedGuests.forEach((guest) => {
    const row = createElement("div", "assignment-row");
    const text = createElement("div");
    text.append(
      createElement("strong", "", guest.guestName),
      createElement("p", "section-body compact-body", guest.familyName)
    );

    const select = createElement("select");
    select.className = "assignment-select";
    select.appendChild(new Option("Sem mesa", ""));

    state.tables.forEach((table) => {
      select.appendChild(new Option(table.name, table.id, false, table.id === guest.tableId));
    });

    select.addEventListener("change", async () => {
      select.disabled = true;

      try {
        await assignGuestToTable(guest.familyId, guest.guestId, select.value);
        setFeedback(dom.seatAssignmentFeedback, "success", "Mesa atualizada com sucesso.");
      } catch (error) {
        setFeedback(dom.seatAssignmentFeedback, "error", "NÃ£o foi possÃ­vel alterar esta mesa.");
        select.value = guest.tableId || "";
      } finally {
        select.disabled = false;
      }
    });

    row.append(text, select);
    dom.seatAssignmentList.appendChild(row);
  });
}

function renderAdminState() {
  renderStats();
  renderFamilies();
  renderGiftList();
  renderTablesBoard();
  renderSeatAssignmentList();
}

function populateSiteSettingsForm() {
  const config = state.mergedSiteConfig;
  const intro = config.publicSite?.intro || {};
  const story = config.publicSite?.story || {};
  const event = config.event || {};
  const couple = config.couple || {};

  dom.settingsDateText.value = couple.dateText || "";
  dom.settingsDateTime.value = toDateTimeLocalValue(couple.dateTime || "");
  dom.settingsSubtitle.value = couple.subtitle || "";
  dom.settingsVenueName.value = event.venueName || "";
  dom.settingsVenueAddress.value = event.address || "";
  dom.settingsMapsLabel.value = event.mapsLabel || "";
  dom.settingsMapsUrl.value = event.mapsUrl || "";
  dom.settingsIntroKicker.value = intro.kicker || "";
  dom.settingsIntroTitle.value = intro.title || "";
  dom.settingsIntroBody.value = intro.body || "";
  dom.settingsStoryKicker.value = story.kicker || "";
  dom.settingsStoryTitle.value = story.title || "";
  dom.settingsStoryBody.value = story.body || "";
  dom.settingsShowGifts.checked = config.features.showGifts !== false;
}

async function loadRemoteSiteSettings() {
  try {
    const remoteSettings = await loadSiteSettings();
    state.mergedSiteConfig = buildRuntimeConfig(remoteSettings || {});
  } catch (error) {
    state.mergedSiteConfig = buildRuntimeConfig();
    setFeedback(
      dom.siteSettingsFeedback,
      "error",
      "NÃ£o foi possÃ­vel carregar as informaÃ§Ãµes salvas do site. O formulÃ¡rio exibirÃ¡ os valores padrÃ£o."
    );
  }

  populateSiteSettingsForm();
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
    setFeedback(dom.familyFormFeedback, "error", "NÃ£o foi possÃ­vel carregar a lista de famÃ­lias.");
  });

  state.unsubscribeGifts = subscribeGiftItems((gifts) => {
    state.gifts = gifts;
    renderStats();
    renderGiftList();
  }, () => {
    setFeedback(dom.giftFormFeedback, "error", "NÃ£o foi possÃ­vel carregar a lista de presentes.");
  });

  state.unsubscribeTables = subscribeTables((tables) => {
    state.tables = tables;
    renderAdminState();
    Array.from(dom.memberEditorList.querySelectorAll(".member-editor-item")).forEach(updateMemberEditorMeta);
  }, () => {
    setFeedback(dom.tableFormFeedback, "error", "NÃ£o foi possÃ­vel carregar as mesas.");
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
      state.logoutMessage = "Esta conta nÃ£o possui permissÃ£o administrativa. Cadastre o UID em admins/{uid} com active = true.";
      await logoutAdmin();
      return;
    }

    state.logoutMessage = "";
    showLoggedInState();
    await loadRemoteSiteSettings();
    startSubscriptions();
  } catch (error) {
    state.logoutMessage = "NÃ£o foi possÃ­vel validar as permissÃµes do admin agora.";
    stopSubscriptions();

    try {
      await logoutAdmin();
    } catch (logoutError) {
      // Ignora a falha de limpeza.
    }

    showLoggedOutState(state.logoutMessage);
  }
}

function setupLoginForm() {
  dom.adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = String(dom.adminEmail.value || "").trim();
    const password = String(dom.adminPassword.value || "");

    if (!email || !password) {
      setFeedback(dom.adminLoginFeedback, "error", "Informe email e senha para continuar.");
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
      setFeedback(dom.adminLoginFeedback, "error", "NÃ£o foi possÃ­vel encerrar a sessÃ£o agora.");
    }
  });
}

function setupFamilyForm() {
  dom.generateSlugButton.addEventListener("click", () => {
    const source = dom.familySlug.value || dom.familyName.value || dom.displayName.value;
    dom.familySlug.value = source ? slugify(source) : generateReadableInviteSlug(source);
  });

  dom.addMemberButton.addEventListener("click", () => {
    createMemberEditorItem();
  });

  dom.familyResetButton.addEventListener("click", () => {
    resetFamilyForm();
  });

  dom.familyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const familyName = String(dom.familyName.value || "").trim();
    const displayName = String(dom.displayName.value || "").trim();
    const slug = slugify(dom.familySlug.value || "") || generateReadableInviteSlug(familyName || displayName);
    const guests = collectMembersFromEditor();
    const existingFamily = state.families.find((family) => family.id === dom.familyId.value);

    if (!familyName || !displayName || !slug) {
      setFeedback(dom.familyFormFeedback, "error", "Preencha famÃ­lia, nome exibido e o slug do convite.");
      return;
    }

    if (!guests.length) {
      setFeedback(dom.familyFormFeedback, "error", "Adicione pelo menos um nome ao convite.");
      return;
    }

    dom.familySubmitButton.disabled = true;
    setText(dom.familySubmitButton, "Salvando...");
    setFeedback(dom.familyFormFeedback, "", "");

    try {
      await saveFamily({
        id: dom.familyId.value,
        familyName,
        displayName,
        customMessage: String(dom.customMessage.value || "").trim(),
        attendanceNote: existingFamily?.attendanceNote || "",
        slug,
        isActive: dom.isActive.checked,
        guests
      });

      setFeedback(dom.familyFormFeedback, "success", "Convite salvo com sucesso.");
      resetFamilyForm();
    } catch (error) {
      if (error?.code === "family/slug-already-exists") {
        setFeedback(dom.familyFormFeedback, "error", "JÃ¡ existe um convite com esse slug. Escolha outro.");
      } else {
        setFeedback(dom.familyFormFeedback, "error", "NÃ£o foi possÃ­vel salvar este convite.");
      }
    } finally {
      dom.familySubmitButton.disabled = false;
      setText(dom.familySubmitButton, "Salvar convite");
    }
  });
}

function setupSiteSettingsForm() {
  dom.siteSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dateText = String(dom.settingsDateText.value || "").trim();
    const dateTime = localDateTimeToIso(dom.settingsDateTime.value);
    const venueName = String(dom.settingsVenueName.value || "").trim();
    const venueAddress = String(dom.settingsVenueAddress.value || "").trim();
    const mapsLabel = String(dom.settingsMapsLabel.value || "").trim();
    const mapsUrl = String(dom.settingsMapsUrl.value || "").trim();

    if (!dateText || !dateTime || !venueName || !venueAddress || !mapsLabel || !mapsUrl) {
      setFeedback(dom.siteSettingsFeedback, "error", "Preencha data, horÃ¡rio, local, endereÃ§o e link do mapa.");
      return;
    }

    const payload = {
      couple: {
        ...state.mergedSiteConfig.couple,
        dateText,
        dateTime,
        subtitle: String(dom.settingsSubtitle.value || "").trim()
      },
      event: {
        ...state.mergedSiteConfig.event,
        venueName,
        address: venueAddress,
        mapsLabel,
        mapsUrl
      },
      publicSite: {
        ...state.mergedSiteConfig.publicSite,
        intro: {
          ...state.mergedSiteConfig.publicSite.intro,
          kicker: String(dom.settingsIntroKicker.value || "").trim(),
          title: String(dom.settingsIntroTitle.value || "").trim(),
          body: String(dom.settingsIntroBody.value || "").trim()
        },
        story: {
          ...state.mergedSiteConfig.publicSite.story,
          kicker: String(dom.settingsStoryKicker.value || "").trim(),
          title: String(dom.settingsStoryTitle.value || "").trim(),
          body: String(dom.settingsStoryBody.value || "").trim()
        }
      },
      features: {
        ...state.mergedSiteConfig.features,
        showGifts: dom.settingsShowGifts.checked
      }
    };

    dom.siteSettingsSubmitButton.disabled = true;
    setText(dom.siteSettingsSubmitButton, "Salvando...");
    setFeedback(dom.siteSettingsFeedback, "", "");

    try {
      await saveSiteSettings(payload);
      state.mergedSiteConfig = buildRuntimeConfig(payload);
      setFeedback(dom.siteSettingsFeedback, "success", "InformaÃ§Ãµes do site atualizadas.");
    } catch (error) {
      setFeedback(dom.siteSettingsFeedback, "error", "NÃ£o foi possÃ­vel salvar as informaÃ§Ãµes do site.");
    } finally {
      dom.siteSettingsSubmitButton.disabled = false;
      setText(dom.siteSettingsSubmitButton, "Salvar informaÃ§Ãµes do site");
    }
  });
}

function setupGiftForm() {
  dom.giftResetButton.addEventListener("click", () => {
    resetGiftForm();
  });

  dom.giftImageUrl.addEventListener("input", () => {
    renderGiftPreview(dom.giftImageUrl.value);
  });

  dom.giftForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = String(dom.giftName.value || "").trim();
    const purchaseUrl = String(dom.giftPurchaseUrl.value || "").trim();
    const imageUrl = String(dom.giftImageUrl.value || "").trim();

    if (!name) {
      setFeedback(dom.giftFormFeedback, "error", "Informe o nome do presente.");
      return;
    }

    if (!imageUrl) {
      setFeedback(dom.giftFormFeedback, "error", "Informe a URL da imagem do presente.");
      return;
    }

    if (!isValidUrl(imageUrl)) {
      setFeedback(dom.giftFormFeedback, "error", "Informe uma URL de imagem vÃ¡lida.");
      return;
    }

    if (purchaseUrl && !isValidUrl(purchaseUrl)) {
      setFeedback(dom.giftFormFeedback, "error", "Informe um link de compra vÃ¡lido.");
      return;
    }

    dom.giftSubmitButton.disabled = true;
    setText(dom.giftSubmitButton, "Salvando...");
    setFeedback(dom.giftFormFeedback, "", "");

    try {
      await saveGiftItem({
        id: dom.giftId.value,
        sortOrder: dom.giftSortOrder.value || Date.now(),
        name,
        purchaseUrl,
        imageUrl,
        isActive: dom.giftIsActive.checked
      });

      setFeedback(dom.giftFormFeedback, "success", "Presente salvo com sucesso.");
      resetGiftForm();
    } catch (error) {
      if (error?.code === "gift/image-required") {
        setFeedback(dom.giftFormFeedback, "error", "A URL da imagem do presente Ã© obrigatÃ³ria.");
      } else {
        setFeedback(dom.giftFormFeedback, "error", "NÃ£o foi possÃ­vel salvar este presente.");
      }
    } finally {
      dom.giftSubmitButton.disabled = false;
      setText(dom.giftSubmitButton, "Salvar presente");
    }
  });
}

function setupTableForm() {
  dom.tableResetButton.addEventListener("click", () => {
    resetTableForm();
  });

  dom.tableForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = String(dom.tableName.value || "").trim();
    const capacity = Number(dom.tableCapacity.value || 0);

    if (!name || !capacity) {
      setFeedback(dom.tableFormFeedback, "error", "Informe o nome da mesa e uma capacidade vÃ¡lida.");
      return;
    }

    dom.tableSubmitButton.disabled = true;
    setText(dom.tableSubmitButton, "Salvando...");
    setFeedback(dom.tableFormFeedback, "", "");

    try {
      await saveTable({
        id: dom.tableId.value,
        sortOrder: dom.tableSortOrder.value || Date.now(),
        name,
        capacity,
        notes: String(dom.tableNotes.value || "").trim()
      });

      setFeedback(dom.tableFormFeedback, "success", "Mesa salva com sucesso.");
      resetTableForm();
    } catch (error) {
      setFeedback(dom.tableFormFeedback, "error", "NÃ£o foi possÃ­vel salvar esta mesa.");
    } finally {
      dom.tableSubmitButton.disabled = false;
      setText(dom.tableSubmitButton, "Salvar mesa");
    }
  });
}

function initialize() {
  hydrateLoginCopy();
  populateSiteSettingsForm();
  setupLoginForm();
  setupFamilyForm();
  setupSiteSettingsForm();
  setupGiftForm();
  setupTableForm();
  resetFamilyForm();
  resetGiftForm();
  resetTableForm();
  showLoggedOutState();
  setupRevealAnimations();

  observeAuthState((user) => {
    syncAdminState(user);
  });
}

initialize();
