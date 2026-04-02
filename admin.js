(function () {
  var defaultConfig = window.siteConfig;
  var ui = window.WeddingUI;
  var api = window.WeddingFirebase;

  var dom = {
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
    giftImageFile: document.querySelector("#giftImageFile"),
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

  var state = {
    authReady: false,
    subscriptionsStarted: false,
    families: [],
    gifts: [],
    tables: [],
    mergedSiteConfig: buildMergedSiteConfig(),
    currentGiftImageDataUrl: "",
    unsubscribeFamilies: null,
    unsubscribeGifts: null,
    unsubscribeTables: null
  };

  function buildMergedSiteConfig(override) {
    var merged = ui.mergeDeep(defaultConfig, override || {});

    if (!merged.features) {
      merged.features = {};
    }

    if (typeof merged.features.showGifts !== "boolean") {
      merged.features.showGifts = true;
    }

    return merged;
  }

  function getAdminEmail() {
    return String(defaultConfig.adminAuth && defaultConfig.adminAuth.email || "").trim();
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
    ui.setText(dom.adminLoginButton, isBusy
      ? defaultConfig.adminSite.login.loadingLabel
      : defaultConfig.adminSite.login.submitLabel);
  }

  function getAdminLoginErrorMessage(error) {
    if (!error || !error.code) {
      return defaultConfig.adminSite.login.errorMessage;
    }

    if (error.code === "auth/admin-email-missing") {
      return "O email do admin nao foi configurado corretamente no projeto.";
    }

    if (error.code === "auth/admin-email-not-allowed") {
      return "Apenas o email administrativo " + getAdminEmail() + " pode acessar este painel.";
    }

    if (error.code === "auth/invalid-email") {
      return "Informe um email valido para continuar.";
    }

    if (error.code === "auth/user-not-found") {
      return "O usuario admin ainda nao foi criado no Firebase Auth.";
    }

    if (
      error.code === "auth/wrong-password"
      || error.code === "auth/invalid-credential"
      || error.code === "auth/invalid-login-credentials"
    ) {
      return "A senha informada esta incorreta.";
    }

    if (error.code === "auth/operation-not-allowed") {
      return "O login por Email/Senha ainda nao foi habilitado no Firebase Auth.";
    }

    if (error.code === "auth/unauthorized-domain") {
      return "Este dominio ainda nao foi autorizado no Firebase Auth.";
    }

    if (error.code === "auth/network-request-failed") {
      return "Nao foi possivel conectar ao Firebase agora. Verifique sua internet e tente novamente.";
    }

    if (error.code === "auth/too-many-requests") {
      return "Muitas tentativas de acesso. Aguarde um instante e tente novamente.";
    }

    return defaultConfig.adminSite.login.errorMessage;
  }

  function hydrateLoginCopy() {
    document.title = "Admin | " + defaultConfig.couple.names;
    ui.setText(dom.adminLoginTitle, defaultConfig.adminSite.login.title);
    ui.setText(dom.adminLoginBody, defaultConfig.adminSite.login.body);
    ui.setText(dom.adminEmailLabel, defaultConfig.adminSite.login.emailLabel || "Email");
    ui.setText(dom.adminPasswordLabel, defaultConfig.adminSite.login.passwordLabel);
    ui.setText(dom.adminLoginButton, defaultConfig.adminSite.login.submitLabel);
    dom.adminEmail.value = getAdminEmail();
  }

  function showLoggedOutState() {
    dom.adminLoginSection.hidden = false;
    dom.adminDashboardSection.hidden = true;
  }

  function showLoggedInState() {
    dom.adminLoginSection.hidden = true;
    dom.adminDashboardSection.hidden = false;
    setFeedback(dom.adminLoginFeedback, "", "");
  }

  function buildInviteUrl(slug) {
    return new URL("convite.html?slug=" + encodeURIComponent(slug), window.location.href).href;
  }

  function summarizeFamily(family) {
    return ui.summarizeMembers(family.members || []);
  }

  function resolveTableName(tableId) {
    if (!tableId) {
      return "Sem mesa";
    }

    var table = state.tables.find(function (item) {
      return item.id === tableId;
    });

    return table ? table.name : "Mesa removida";
  }

  function createEmptyState(message) {
    var emptyState = ui.createElement("article", "empty-state-card");
    emptyState.appendChild(ui.createElement("p", "section-body", message));
    return emptyState;
  }

  function updateMemberEditorHint() {
    var total = dom.memberEditorList.querySelectorAll(".member-editor-item").length;
    ui.setText(dom.memberEditorHint, total
      ? total + " nome" + (total > 1 ? "s cadastrados." : " cadastrado.")
      : "Adicione uma linha para cada pessoa convidada. A quantidade total sera calculada automaticamente.");
  }

  function updateMemberEditorMeta(item) {
    var meta = item.querySelector(".member-editor-meta");
    var statusValue = item.querySelector(".member-status-input").value;
    var tableValue = item.querySelector(".member-table-input").value;
    meta.textContent = "Status: " + ui.formatMemberStatus(statusValue) + " | Mesa: " + resolveTableName(tableValue);
  }

  function createMemberEditorItem(member) {
    var item = ui.createElement("div", "member-editor-item");
    var hiddenId = ui.createElement("input");
    hiddenId.type = "hidden";
    hiddenId.className = "member-id-input";
    hiddenId.value = member && member.id ? member.id : "";

    var hiddenStatus = ui.createElement("input");
    hiddenStatus.type = "hidden";
    hiddenStatus.className = "member-status-input";
    hiddenStatus.value = member && member.responseStatus ? member.responseStatus : "pending";

    var hiddenTable = ui.createElement("input");
    hiddenTable.type = "hidden";
    hiddenTable.className = "member-table-input";
    hiddenTable.value = member && member.tableId ? member.tableId : "";

    var nameGroup = ui.createElement("div", "field-group");
    var nameLabel = ui.createElement("label", "", "Nome do convidado");
    var nameInput = ui.createElement("input");
    nameInput.type = "text";
    nameInput.className = "member-name-input";
    nameInput.required = true;
    nameInput.value = member && member.name ? member.name : "";
    nameGroup.append(nameLabel, nameInput);

    var meta = ui.createElement("p", "member-editor-meta");
    var removeButton = ui.createElement("button", "button button-secondary button-solid-light button-small", "Remover");
    removeButton.type = "button";
    removeButton.addEventListener("click", function () {
      item.remove();
      updateMemberEditorHint();
    });

    item.append(hiddenId, hiddenStatus, hiddenTable, nameGroup, meta, removeButton);
    dom.memberEditorList.appendChild(item);
    updateMemberEditorMeta(item);
    updateMemberEditorHint();
  }

  function collectMembersFromEditor() {
    return Array.from(dom.memberEditorList.querySelectorAll(".member-editor-item")).map(function (item) {
      return {
        id: item.querySelector(".member-id-input").value,
        name: String(item.querySelector(".member-name-input").value || "").trim(),
        responseStatus: item.querySelector(".member-status-input").value || "pending",
        tableId: item.querySelector(".member-table-input").value || ""
      };
    }).filter(function (member) {
      return member.name;
    });
  }

  function resetFamilyForm() {
    dom.familyForm.reset();
    dom.familyId.value = "";
    dom.familySlug.value = "";
    dom.isActive.checked = true;
    dom.memberEditorList.innerHTML = "";
    createMemberEditorItem();
    ui.setText(dom.familySubmitButton, "Salvar convite");
    setFeedback(dom.familyFormFeedback, "", "");
  }

  function populateFamilyForm(family) {
    dom.familyId.value = family.id;
    dom.familyName.value = family.familyName || "";
    dom.displayName.value = family.displayName || "";
    dom.customMessage.value = family.customMessage || "";
    dom.familySlug.value = family.slug || family.id;
    dom.isActive.checked = family.isActive !== false;
    dom.memberEditorList.innerHTML = "";

    (family.members || []).forEach(function (member) {
      createMemberEditorItem(member);
    });

    if (!(family.members || []).length) {
      createMemberEditorItem();
    }

    ui.setText(dom.familySubmitButton, "Atualizar convite");
    setFeedback(dom.familyFormFeedback, "", "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderStats() {
    var totals = {
      familiesInvited: state.families.length,
      familiesResponded: 0,
      peopleInvited: 0,
      peopleConfirmed: 0,
      peopleDeclined: 0,
      peoplePending: 0
    };

    state.families.forEach(function (family) {
      var summary = summarizeFamily(family);
      totals.peopleInvited += summary.invitedCount;
      totals.peopleConfirmed += summary.confirmedCount;
      totals.peopleDeclined += summary.declinedCount;
      totals.peoplePending += summary.pendingCount;

      if (summary.respondedCount > 0) {
        totals.familiesResponded += 1;
      }
    });

    var items = [
      { label: "Familias convidadas", value: totals.familiesInvited },
      { label: "Familias com resposta", value: totals.familiesResponded },
      { label: "Pessoas convidadas", value: totals.peopleInvited },
      { label: "Pessoas confirmadas", value: totals.peopleConfirmed },
      { label: "Pessoas recusadas", value: totals.peopleDeclined },
      { label: "Pessoas pendentes", value: totals.peoplePending }
    ];

    dom.adminStatsGrid.innerHTML = "";

    items.forEach(function (item) {
      var card = ui.createElement("article", "stat-card");
      card.append(
        ui.createElement("span", "stat-label", item.label),
        ui.createElement("strong", "stat-value", String(item.value))
      );
      dom.adminStatsGrid.appendChild(card);
    });
  }

  function renderFamilies() {
    dom.familyList.innerHTML = "";

    if (!state.families.length) {
      dom.familyList.appendChild(createEmptyState("Nenhuma familia cadastrada ainda."));
      return;
    }

    state.families.forEach(function (family) {
      var summary = summarizeFamily(family);
      var card = ui.createElement("article", "family-card");
      var header = ui.createElement("div", "family-card-header");
      var headerText = ui.createElement("div", "");
      var title = ui.createElement("h3", "family-card-title", family.familyName || family.displayName || "Familia sem nome");
      var subtitle = ui.createElement("p", "section-body compact-body", family.displayName || "");
      var badge = ui.createElement("span", "status-badge status-" + summary.responseStatus, ui.formatInviteStatus(summary.responseStatus));
      headerText.append(title, subtitle);
      header.append(headerText, badge);

      var stats = ui.createElement("div", "family-stats");
      [
        { label: "Convidados", value: summary.invitedCount },
        { label: "Confirmados", value: summary.confirmedCount },
        { label: "Recusados", value: summary.declinedCount }
      ].forEach(function (item) {
        var stat = ui.createElement("div", "family-stat");
        stat.append(
          ui.createElement("span", "", item.label),
          ui.createElement("strong", "", String(item.value))
        );
        stats.appendChild(stat);
      });

      var membersList = ui.createElement("div", "member-status-list");
      (family.members || []).forEach(function (member) {
        var chip = ui.createElement("div", "member-status-chip");
        chip.append(
          ui.createElement("strong", "", member.name),
          ui.createElement("span", "", ui.formatMemberStatus(member.responseStatus) + " | " + resolveTableName(member.tableId))
        );
        membersList.appendChild(chip);
      });

      if (!(family.members || []).length) {
        membersList.appendChild(ui.createElement("p", "section-body compact-body", "Este convite ainda nao possui nomes cadastrados."));
      }

      var linkRow = ui.createElement("div", "family-link-row");
      linkRow.append(
        ui.createElement("span", "family-link-label", "Link do microsite"),
        ui.createElement("div", "family-link-box", buildInviteUrl(family.slug || family.id))
      );

      if (family.attendanceNote) {
        linkRow.appendChild(ui.createElement("p", "section-body compact-body", "Observacao enviada: " + family.attendanceNote));
      }

      var actions = ui.createElement("div", "form-actions");
      var editButton = ui.createElement("button", "button button-secondary button-solid-light", "Editar");
      editButton.type = "button";
      editButton.addEventListener("click", function () {
        populateFamilyForm(family);
      });

      var copyButton = ui.createElement("button", "button button-secondary button-solid-light", "Copiar link");
      copyButton.type = "button";
      copyButton.addEventListener("click", async function () {
        try {
          await navigator.clipboard.writeText(buildInviteUrl(family.slug || family.id));
          setFeedback(dom.familyFormFeedback, "success", "Link copiado para a area de transferencia.");
        } catch (error) {
          setFeedback(dom.familyFormFeedback, "error", "Nao foi possivel copiar o link automaticamente.");
        }
      });

      var toggleButton = ui.createElement("button", "button button-secondary button-solid-light", family.isActive ? "Desativar" : "Ativar");
      toggleButton.type = "button";
      toggleButton.addEventListener("click", async function () {
        try {
          await api.toggleGuestFamily(family.id, !family.isActive);
          setFeedback(dom.familyFormFeedback, "success", "Status do convite atualizado.");
        } catch (error) {
          setFeedback(dom.familyFormFeedback, "error", "Nao foi possivel alterar este convite.");
        }
      });

      actions.append(editButton, copyButton, toggleButton);
      card.append(header, stats, membersList, linkRow, actions);
      dom.familyList.appendChild(card);
    });
  }

  function renderGiftPreview(dataUrl) {
    state.currentGiftImageDataUrl = dataUrl || "";
    dom.giftImagePreviewShell.hidden = !state.currentGiftImageDataUrl;
    dom.giftImagePreview.src = state.currentGiftImageDataUrl || "";
  }

  function resetGiftForm() {
    dom.giftForm.reset();
    dom.giftId.value = "";
    dom.giftSortOrder.value = "";
    dom.giftIsActive.checked = true;
    renderGiftPreview("");
    ui.setText(dom.giftSubmitButton, "Salvar presente");
    setFeedback(dom.giftFormFeedback, "", "");
  }

  function populateGiftForm(gift) {
    dom.giftId.value = gift.id;
    dom.giftSortOrder.value = String(gift.sortOrder || "");
    dom.giftName.value = gift.name || "";
    dom.giftPurchaseUrl.value = gift.purchaseUrl || "";
    dom.giftIsActive.checked = gift.isActive !== false;
    renderGiftPreview(gift.imageDataUrl || "");
    ui.setText(dom.giftSubmitButton, "Atualizar presente");
    setFeedback(dom.giftFormFeedback, "", "");
    window.scrollTo({ top: document.body.scrollHeight * 0.55, behavior: "smooth" });
  }

  function renderGiftList() {
    dom.giftList.innerHTML = "";

    if (!state.gifts.length) {
      dom.giftList.appendChild(createEmptyState("Nenhum presente cadastrado ainda."));
      return;
    }

    state.gifts.forEach(function (gift) {
      var card = ui.createElement("article", "gift-admin-card");

      if (gift.imageDataUrl) {
        var image = ui.createElement("img", "gift-admin-image");
        image.src = gift.imageDataUrl;
        image.alt = gift.name || "Presente";
        card.appendChild(image);
      }

      var body = ui.createElement("div", "gift-admin-body");
      var title = ui.createElement("h3", "panel-title", gift.name || "Presente sem nome");
      var meta = ui.createElement("p", "section-body compact-body", gift.purchaseUrl || "Sem link cadastrado.");
      var badge = ui.createElement(
        "span",
        "status-badge status-" + (gift.isActive !== false ? "confirmed" : "pending"),
        gift.isActive !== false ? "Visivel" : "Oculto"
      );
      body.append(title, meta, badge);

      var actions = ui.createElement("div", "form-actions");
      var editButton = ui.createElement("button", "button button-secondary button-solid-light", "Editar");
      editButton.type = "button";
      editButton.addEventListener("click", function () {
        populateGiftForm(gift);
      });

      var toggleButton = ui.createElement("button", "button button-secondary button-solid-light", gift.isActive !== false ? "Ocultar" : "Exibir");
      toggleButton.type = "button";
      toggleButton.addEventListener("click", async function () {
        try {
          await api.saveGiftItem({
            id: gift.id,
            sortOrder: gift.sortOrder,
            name: gift.name,
            purchaseUrl: gift.purchaseUrl,
            imageDataUrl: gift.imageDataUrl,
            isActive: gift.isActive === false
          });
          setFeedback(dom.giftFormFeedback, "success", "Visibilidade do presente atualizada.");
        } catch (error) {
          setFeedback(dom.giftFormFeedback, "error", "Nao foi possivel alterar a visibilidade deste presente.");
        }
      });

      var deleteButton = ui.createElement("button", "button button-secondary button-solid-light", "Excluir");
      deleteButton.type = "button";
      deleteButton.addEventListener("click", async function () {
        if (!window.confirm("Deseja excluir este presente?")) {
          return;
        }

        try {
          await api.deleteGiftItem(gift.id);
          setFeedback(dom.giftFormFeedback, "success", "Presente excluido.");
        } catch (error) {
          setFeedback(dom.giftFormFeedback, "error", "Nao foi possivel excluir este presente.");
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
    ui.setText(dom.tableSubmitButton, "Salvar mesa");
    setFeedback(dom.tableFormFeedback, "", "");
  }

  function populateTableForm(table) {
    dom.tableId.value = table.id;
    dom.tableSortOrder.value = String(table.sortOrder || "");
    dom.tableName.value = table.name || "";
    dom.tableCapacity.value = String(table.capacity || "");
    dom.tableNotes.value = table.notes || "";
    ui.setText(dom.tableSubmitButton, "Atualizar mesa");
    setFeedback(dom.tableFormFeedback, "", "");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function collectConfirmedGuests() {
    var guests = [];

    state.families.forEach(function (family) {
      (family.members || []).forEach(function (member) {
        if (member.responseStatus === "confirmed") {
          guests.push({
            familyId: family.id,
            familyName: family.displayName || family.familyName || "",
            memberId: member.id,
            memberName: member.name || "",
            tableId: member.tableId || ""
          });
        }
      });
    });

    return guests.sort(function (left, right) {
      var familyCompare = String(left.familyName || "").localeCompare(String(right.familyName || ""));
      return familyCompare !== 0
        ? familyCompare
        : String(left.memberName || "").localeCompare(String(right.memberName || ""));
    });
  }

  function renderTablesBoard() {
    dom.tablesBoard.innerHTML = "";
    var confirmedGuests = collectConfirmedGuests();

    if (!state.tables.length) {
      dom.tablesBoard.appendChild(createEmptyState("Cadastre as mesas para visualizar o mapa e a ocupacao."));
      return;
    }

    state.tables.forEach(function (table) {
      var assignedGuests = confirmedGuests.filter(function (guest) {
        return guest.tableId === table.id;
      });
      var capacity = Number(table.capacity || 0);
      var card = ui.createElement("article", "table-card" + (assignedGuests.length > capacity ? " is-over-capacity" : ""));
      var header = ui.createElement("div", "table-card-header");
      header.append(
        ui.createElement("h3", "panel-title", table.name || "Mesa"),
        ui.createElement("span", "occupancy-badge", assignedGuests.length + "/" + capacity)
      );

      card.appendChild(header);

      if (table.notes) {
        card.appendChild(ui.createElement("p", "section-body compact-body", table.notes));
      }

      var list = ui.createElement("div", "table-members-list");
      if (assignedGuests.length) {
        assignedGuests.forEach(function (guest) {
          list.appendChild(ui.createElement("div", "table-member-pill", guest.memberName + " | " + guest.familyName));
        });
      } else {
        list.appendChild(ui.createElement("p", "section-body compact-body", "Nenhum convidado confirmado nesta mesa ainda."));
      }

      var actions = ui.createElement("div", "form-actions");
      var editButton = ui.createElement("button", "button button-secondary button-solid-light", "Editar");
      editButton.type = "button";
      editButton.addEventListener("click", function () {
        populateTableForm(table);
      });

      var deleteButton = ui.createElement("button", "button button-secondary button-solid-light", "Excluir");
      deleteButton.type = "button";
      deleteButton.addEventListener("click", async function () {
        if (!window.confirm("Deseja excluir esta mesa?")) {
          return;
        }

        try {
          await api.deleteTable(table.id);
          setFeedback(dom.tableFormFeedback, "success", "Mesa excluida.");
        } catch (error) {
          setFeedback(dom.tableFormFeedback, "error", "Nao foi possivel excluir esta mesa.");
        }
      });

      actions.append(editButton, deleteButton);
      card.append(list, actions);
      dom.tablesBoard.appendChild(card);
    });

    var unassignedGuests = confirmedGuests.filter(function (guest) {
      return !guest.tableId;
    });

    if (unassignedGuests.length) {
      var pendingCard = ui.createElement("article", "table-card is-unassigned");
      pendingCard.append(
        ui.createElement("h3", "panel-title", "Confirmados sem mesa"),
        ui.createElement("span", "occupancy-badge", String(unassignedGuests.length))
      );

      var pendingList = ui.createElement("div", "table-members-list");
      unassignedGuests.forEach(function (guest) {
        pendingList.appendChild(ui.createElement("div", "table-member-pill", guest.memberName + " | " + guest.familyName));
      });

      pendingCard.appendChild(pendingList);
      dom.tablesBoard.appendChild(pendingCard);
    }
  }

  function renderSeatAssignmentList() {
    dom.seatAssignmentList.innerHTML = "";
    var confirmedGuests = collectConfirmedGuests();

    if (!confirmedGuests.length) {
      dom.seatAssignmentList.appendChild(createEmptyState("Quando os convidados confirmarem presenca, eles aparecerao aqui para serem alocados."));
      return;
    }

    confirmedGuests.forEach(function (guest) {
      var row = ui.createElement("div", "assignment-row");
      var text = ui.createElement("div", "assignment-copy");
      text.append(
        ui.createElement("strong", "", guest.memberName),
        ui.createElement("span", "", guest.familyName)
      );

      var select = ui.createElement("select", "assignment-select");
      var emptyOption = ui.createElement("option", "", "Sem mesa");
      emptyOption.value = "";
      select.appendChild(emptyOption);

      state.tables.forEach(function (table) {
        var option = ui.createElement("option", "", table.name);
        option.value = table.id;
        option.selected = table.id === guest.tableId;
        select.appendChild(option);
      });

      select.addEventListener("change", async function () {
        select.disabled = true;
        setFeedback(dom.seatAssignmentFeedback, "", "");

        try {
          await api.assignGuestToTable(guest.familyId, guest.memberId, select.value);
          setFeedback(dom.seatAssignmentFeedback, "success", "Mesa atualizada com sucesso.");
        } catch (error) {
          setFeedback(dom.seatAssignmentFeedback, "error", "Nao foi possivel alterar esta mesa.");
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
    var config = state.mergedSiteConfig;
    var intro = config.publicSite && config.publicSite.intro ? config.publicSite.intro : {};
    var story = config.publicSite && config.publicSite.story ? config.publicSite.story : {};
    var event = config.event || {};
    var couple = config.couple || {};

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

  function toDateTimeLocalValue(value) {
    if (!value) {
      return "";
    }

    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    var offset = date.getTimezoneOffset();
    var localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  function localDateTimeToIso(value) {
    if (!value) {
      return "";
    }

    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function compressImageFile(file) {
    if (!file) {
      return Promise.resolve("");
    }

    if (file.type === "image/svg+xml") {
      return readFileAsDataUrl(file);
    }

    return readFileAsDataUrl(file).then(function (dataUrl) {
      return new Promise(function (resolve, reject) {
        var image = new Image();
        image.onload = function () {
          var maxSize = 960;
          var ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));
          var context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        image.onerror = reject;
        image.src = dataUrl;
      });
    });
  }

  async function loadRemoteSiteSettings() {
    try {
      var remoteSettings = await api.loadSiteSettings();
      state.mergedSiteConfig = buildMergedSiteConfig(remoteSettings || {});
    } catch (error) {
      state.mergedSiteConfig = buildMergedSiteConfig();
      setFeedback(dom.siteSettingsFeedback, "error", "Nao foi possivel carregar as informacoes salvas do site. O formulario exibira os valores padrao.");
    }

    populateSiteSettingsForm();
  }

  function startSubscriptions() {
    if (state.subscriptionsStarted) {
      return;
    }

    state.subscriptionsStarted = true;

    state.unsubscribeFamilies = api.subscribeGuestFamilies(function (families) {
      state.families = families;
      renderAdminState();
    }, function () {
      setFeedback(dom.familyFormFeedback, "error", "Nao foi possivel carregar a lista de familias.");
    });

    state.unsubscribeGifts = api.subscribeGiftItems(function (gifts) {
      state.gifts = gifts;
      renderGiftList();
    }, function () {
      setFeedback(dom.giftFormFeedback, "error", "Nao foi possivel carregar a lista de presentes.");
    });

    state.unsubscribeTables = api.subscribeTables(function (tables) {
      state.tables = tables;
      renderAdminState();
      Array.from(dom.memberEditorList.querySelectorAll(".member-editor-item")).forEach(updateMemberEditorMeta);
    }, function () {
      setFeedback(dom.tableFormFeedback, "error", "Nao foi possivel carregar as mesas.");
    });
  }

  function stopSubscriptions() {
    if (state.unsubscribeFamilies) {
      state.unsubscribeFamilies();
      state.unsubscribeFamilies = null;
    }

    if (state.unsubscribeGifts) {
      state.unsubscribeGifts();
      state.unsubscribeGifts = null;
    }

    if (state.unsubscribeTables) {
      state.unsubscribeTables();
      state.unsubscribeTables = null;
    }

    state.subscriptionsStarted = false;
    state.families = [];
    state.gifts = [];
    state.tables = [];
    renderAdminState();
  }

  async function syncAdminState(user) {
    state.authReady = true;

    if (!user) {
      stopSubscriptions();
      showLoggedOutState();
      return;
    }

    var isAdmin = await api.currentUserIsAdmin(user);

    if (!isAdmin) {
      try {
        await api.logoutAdmin();
      } catch (error) {
        // Ignore logout cleanup failure here.
      }

      stopSubscriptions();
      showLoggedOutState();
      dom.adminPassword.value = "";
      dom.adminEmail.value = getAdminEmail();
      setFeedback(dom.adminLoginFeedback, "error", "Esta conta nao possui permissao administrativa.");
      return;
    }

    showLoggedInState();
    await loadRemoteSiteSettings();
    startSubscriptions();
  }

  function setupLoginForm() {
    dom.adminLoginForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      var email = String(dom.adminEmail.value || "").trim();
      var password = String(dom.adminPassword.value || "");

      if (!email || !password) {
        setFeedback(dom.adminLoginFeedback, "error", "Informe email e senha para continuar.");
        return;
      }

      setFeedback(dom.adminLoginFeedback, "", "");
      setLoginBusy(true);

      try {
        var credential = await api.loginAdmin(email, password);
        dom.adminPassword.value = "";
        await syncAdminState(credential.user);
      } catch (error) {
        setFeedback(dom.adminLoginFeedback, "error", getAdminLoginErrorMessage(error));
      } finally {
        setLoginBusy(false);
      }
    });

    dom.adminLogoutButton.addEventListener("click", async function () {
      try {
        await api.logoutAdmin();
      } catch (error) {
        setFeedback(dom.adminLoginFeedback, "error", "Nao foi possivel encerrar a sessao agora.");
      }
    });
  }

  function setupFamilyForm() {
    dom.generateSlugButton.addEventListener("click", function () {
      dom.familySlug.value = ui.generateReadableInviteId(dom.familyName.value || dom.displayName.value);
    });

    dom.addMemberButton.addEventListener("click", function () {
      createMemberEditorItem();
    });

    dom.familyResetButton.addEventListener("click", function () {
      resetFamilyForm();
    });

    dom.familyForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      var familyName = String(dom.familyName.value || "").trim();
      var displayName = String(dom.displayName.value || "").trim();
      var slug = String(dom.familySlug.value || "").trim() || ui.generateReadableInviteId(familyName || displayName);
      var members = collectMembersFromEditor();
      var existingFamily = state.families.find(function (family) {
        return family.id === dom.familyId.value;
      });

      if (!familyName || !displayName || !slug) {
        setFeedback(dom.familyFormFeedback, "error", "Preencha familia, nome exibido e o slug do convite.");
        return;
      }

      if (!members.length) {
        setFeedback(dom.familyFormFeedback, "error", "Adicione pelo menos um nome ao convite.");
        return;
      }

      dom.familySubmitButton.disabled = true;
      ui.setText(dom.familySubmitButton, "Salvando...");
      setFeedback(dom.familyFormFeedback, "", "");

      try {
        await api.saveGuestFamily({
          slug: slug,
          familyName: familyName,
          displayName: displayName,
          customMessage: String(dom.customMessage.value || "").trim(),
          isActive: dom.isActive.checked,
          attendanceNote: existingFamily ? existingFamily.attendanceNote || "" : ""
        }, members, dom.familyId.value);

        setFeedback(dom.familyFormFeedback, "success", "Convite salvo com sucesso.");
        resetFamilyForm();
      } catch (error) {
        if (error && error.code === "family/slug-already-exists") {
          setFeedback(dom.familyFormFeedback, "error", "Ja existe um convite com esse slug. Escolha outro.");
        } else {
          setFeedback(dom.familyFormFeedback, "error", "Nao foi possivel salvar este convite.");
        }
      } finally {
        dom.familySubmitButton.disabled = false;
        ui.setText(dom.familySubmitButton, "Salvar convite");
      }
    });
  }

  function setupSiteSettingsForm() {
    dom.siteSettingsForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      var payload = {
        couple: {
          dateText: String(dom.settingsDateText.value || "").trim(),
          dateTime: localDateTimeToIso(dom.settingsDateTime.value),
          subtitle: String(dom.settingsSubtitle.value || "").trim()
        },
        event: {
          venueName: String(dom.settingsVenueName.value || "").trim(),
          address: String(dom.settingsVenueAddress.value || "").trim(),
          mapsLabel: String(dom.settingsMapsLabel.value || "").trim(),
          mapsUrl: String(dom.settingsMapsUrl.value || "").trim()
        },
        publicSite: {
          intro: {
            kicker: String(dom.settingsIntroKicker.value || "").trim(),
            title: String(dom.settingsIntroTitle.value || "").trim(),
            body: String(dom.settingsIntroBody.value || "").trim()
          },
          story: {
            kicker: String(dom.settingsStoryKicker.value || "").trim(),
            title: String(dom.settingsStoryTitle.value || "").trim(),
            body: String(dom.settingsStoryBody.value || "").trim()
          }
        },
        features: {
          showGifts: dom.settingsShowGifts.checked
        }
      };

      if (!payload.couple.dateText || !payload.couple.dateTime || !payload.event.venueName || !payload.event.address || !payload.event.mapsLabel || !payload.event.mapsUrl) {
        setFeedback(dom.siteSettingsFeedback, "error", "Preencha data, horario, local, endereco e link do mapa.");
        return;
      }

      dom.siteSettingsSubmitButton.disabled = true;
      ui.setText(dom.siteSettingsSubmitButton, "Salvando...");
      setFeedback(dom.siteSettingsFeedback, "", "");

      try {
        await api.saveSiteSettings(payload);
        state.mergedSiteConfig = buildMergedSiteConfig(payload);
        setFeedback(dom.siteSettingsFeedback, "success", "Informacoes do site atualizadas.");
      } catch (error) {
        setFeedback(dom.siteSettingsFeedback, "error", "Nao foi possivel salvar as informacoes do site.");
      } finally {
        dom.siteSettingsSubmitButton.disabled = false;
        ui.setText(dom.siteSettingsSubmitButton, "Salvar informacoes do site");
      }
    });
  }

  function setupGiftForm() {
    dom.giftResetButton.addEventListener("click", function () {
      resetGiftForm();
    });

    dom.giftImageFile.addEventListener("change", async function () {
      var file = dom.giftImageFile.files && dom.giftImageFile.files[0];

      if (!file) {
        return;
      }

      try {
        renderGiftPreview(await compressImageFile(file));
      } catch (error) {
        setFeedback(dom.giftFormFeedback, "error", "Nao foi possivel processar essa imagem.");
      }
    });

    dom.giftForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      var name = String(dom.giftName.value || "").trim();
      var purchaseUrl = String(dom.giftPurchaseUrl.value || "").trim();

      if (!name) {
        setFeedback(dom.giftFormFeedback, "error", "Informe o nome do presente.");
        return;
      }

      if (!state.currentGiftImageDataUrl) {
        setFeedback(dom.giftFormFeedback, "error", "Adicione uma foto para o presente.");
        return;
      }

      dom.giftSubmitButton.disabled = true;
      ui.setText(dom.giftSubmitButton, "Salvando...");
      setFeedback(dom.giftFormFeedback, "", "");

      try {
        await api.saveGiftItem({
          id: dom.giftId.value,
          sortOrder: dom.giftSortOrder.value || Date.now(),
          name: name,
          purchaseUrl: purchaseUrl,
          imageDataUrl: state.currentGiftImageDataUrl,
          isActive: dom.giftIsActive.checked
        });

        setFeedback(dom.giftFormFeedback, "success", "Presente salvo com sucesso.");
        resetGiftForm();
      } catch (error) {
        setFeedback(dom.giftFormFeedback, "error", "Nao foi possivel salvar este presente.");
      } finally {
        dom.giftSubmitButton.disabled = false;
        ui.setText(dom.giftSubmitButton, "Salvar presente");
      }
    });
  }

  function setupTableForm() {
    dom.tableResetButton.addEventListener("click", function () {
      resetTableForm();
    });

    dom.tableForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      var name = String(dom.tableName.value || "").trim();
      var capacity = Number(dom.tableCapacity.value);

      if (!name || !Number.isInteger(capacity) || capacity < 1) {
        setFeedback(dom.tableFormFeedback, "error", "Informe nome e uma capacidade valida para a mesa.");
        return;
      }

      dom.tableSubmitButton.disabled = true;
      ui.setText(dom.tableSubmitButton, "Salvando...");
      setFeedback(dom.tableFormFeedback, "", "");

      try {
        await api.saveTable({
          id: dom.tableId.value,
          sortOrder: dom.tableSortOrder.value || Date.now(),
          name: name,
          capacity: capacity,
          notes: String(dom.tableNotes.value || "").trim()
        });

        setFeedback(dom.tableFormFeedback, "success", "Mesa salva com sucesso.");
        resetTableForm();
      } catch (error) {
        setFeedback(dom.tableFormFeedback, "error", "Nao foi possivel salvar esta mesa.");
      } finally {
        dom.tableSubmitButton.disabled = false;
        ui.setText(dom.tableSubmitButton, "Salvar mesa");
      }
    });
  }

  function initialize() {
    if (!api || !ui) {
      setFeedback(dom.adminLoginFeedback, "error", "Firebase nao foi carregado corretamente para o painel.");
      return;
    }

    if (typeof api.clearLegacyAdminSession === "function") {
      api.clearLegacyAdminSession();
    }

    hydrateLoginCopy();
    resetFamilyForm();
    resetGiftForm();
    resetTableForm();
    populateSiteSettingsForm();
    setupLoginForm();
    setupFamilyForm();
    setupSiteSettingsForm();
    setupGiftForm();
    setupTableForm();
    showLoggedOutState();
    ui.setupRevealAnimations();

    api.observeAuthState(function (user) {
      syncAdminState(user);
    });
  }

  initialize();
})();
