(function () {
  var config = window.siteConfig;
  var ui = window.WeddingUI;
  var api = window.WeddingFirebase;

  var dom = {
    adminLoginSection: document.querySelector("#adminLoginSection"),
    adminDashboardSection: document.querySelector("#adminDashboardSection"),
    adminLoginTitle: document.querySelector("#adminLoginTitle"),
    adminLoginBody: document.querySelector("#adminLoginBody"),
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
    reservedSeats: document.querySelector("#reservedSeats"),
    familySlug: document.querySelector("#familySlug"),
    isActive: document.querySelector("#isActive"),
    generateSlugButton: document.querySelector("#generateSlugButton"),
    familySubmitButton: document.querySelector("#familySubmitButton"),
    familyResetButton: document.querySelector("#familyResetButton"),
    familyFormFeedback: document.querySelector("#familyFormFeedback"),
    familyList: document.querySelector("#familyList")
  };

  var familiesCache = [];
  var unsubscribeFamilies = null;

  function setFeedback(element, type, message) {
    element.textContent = message || "";
    element.classList.remove("is-success", "is-error");

    if (type === "success") {
      element.classList.add("is-success");
    }

    if (type === "error") {
      element.classList.add("is-error");
    }
  }

  function getAdminLoginErrorMessage(error) {
    if (!error || !error.code) {
      return config.adminSite.login.errorMessage;
    }

    if (error.code === "auth/admin-email-missing") {
      return "O email do admin nao foi configurado corretamente no site.";
    }

    if (error.code === "auth/user-not-found") {
      return "O usuario admin ainda nao foi criado no Firebase Auth.";
    }

    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential" || error.code === "auth/invalid-login-credentials") {
      return "A senha informada esta incorreta.";
    }

    if (error.code === "auth/unauthorized-domain") {
      return "Este dominio ainda nao foi autorizado no Firebase Auth.";
    }

    if (error.code === "auth/operation-not-allowed") {
      return "O login por Email/Senha ainda nao foi habilitado no Firebase Auth.";
    }

    return config.adminSite.login.errorMessage;
  }

  function resetFamilyForm() {
    dom.familyForm.reset();
    dom.familyId.value = "";
    dom.familySlug.value = "";
    dom.isActive.checked = true;
    setFeedback(dom.familyFormFeedback, "", "");
    ui.setText(dom.familySubmitButton, "Salvar convite");
  }

  function hydrateLoginCopy() {
    document.title = "Admin | " + config.couple.names;
    ui.setText(dom.adminLoginTitle, config.adminSite.login.title);
    ui.setText(dom.adminLoginBody, config.adminSite.login.body);
    ui.setText(dom.adminPasswordLabel, config.adminSite.login.passwordLabel);
    ui.setText(dom.adminLoginButton, config.adminSite.login.submitLabel);
  }

  function renderStats(families) {
    var totalFamilies = families.length;
    var totalReserved = 0;
    var totalConfirmed = 0;
    var totalPending = 0;

    families.forEach(function (family) {
      totalReserved += Number(family.reservedSeats || 0);
      totalConfirmed += Number(family.confirmedSeats || 0);
      if (family.responseStatus === "pending") {
        totalPending += 1;
      }
    });

    var stats = [
      { label: "Familias", value: totalFamilies },
      { label: "Reservados", value: totalReserved },
      { label: "Confirmados", value: totalConfirmed },
      { label: "Sem resposta", value: totalPending }
    ];

    dom.adminStatsGrid.innerHTML = "";

    stats.forEach(function (item) {
      var card = ui.createElement("article", "stat-card");
      var label = ui.createElement("span", "stat-label", item.label);
      var value = ui.createElement("strong", "stat-value", String(item.value));
      card.append(label, value);
      dom.adminStatsGrid.appendChild(card);
    });
  }

  function buildInviteUrl(slug) {
    return new URL("convite.html?slug=" + encodeURIComponent(slug), window.location.href).href;
  }

  function renderFamilies(families) {
    dom.familyList.innerHTML = "";

    if (!families.length) {
      var emptyState = ui.createElement("article", "family-card");
      emptyState.appendChild(ui.createElement("p", "section-body", "Nenhuma familia cadastrada ainda."));
      dom.familyList.appendChild(emptyState);
      return;
    }

    families.forEach(function (family) {
      var cancelledSeats = family.responseStatus === "pending"
        ? 0
        : Math.max(Number(family.reservedSeats || 0) - Number(family.confirmedSeats || 0), 0);
      var card = ui.createElement("article", "family-card");
      var header = ui.createElement("div", "family-card-header");
      var headerText = ui.createElement("div", "");
      var title = ui.createElement("h3", "family-card-title", family.familyName);
      var subtitle = ui.createElement("p", "section-body", family.displayName);
      subtitle.style.margin = "0.45rem 0 0";
      headerText.append(title, subtitle);
      var badge = ui.createElement("span", "status-badge status-" + family.responseStatus, ui.formatInviteStatus(family.responseStatus));
      header.append(headerText, badge);

      var stats = ui.createElement("div", "family-stats");
      [
        { label: "Reservados", value: family.reservedSeats || 0 },
        { label: "Confirmados", value: family.confirmedSeats || 0 },
        { label: "Cancelados", value: cancelledSeats }
      ].forEach(function (item) {
        var stat = ui.createElement("div", "family-stat");
        stat.append(
          ui.createElement("span", "", item.label),
          ui.createElement("strong", "", String(item.value))
        );
        stats.appendChild(stat);
      });

      var linkRow = ui.createElement("div", "family-link-row");
      linkRow.append(
        ui.createElement("span", "family-link-label", "Link do convite"),
        ui.createElement("div", "family-link-box", buildInviteUrl(family.slug))
      );

      var actions = ui.createElement("div", "form-actions");
      var editButton = ui.createElement("button", "button button-secondary button-solid-light", "Editar");
      editButton.type = "button";
      editButton.addEventListener("click", function () {
        dom.familyId.value = family.id;
        dom.familyName.value = family.familyName || "";
        dom.displayName.value = family.displayName || "";
        dom.customMessage.value = family.customMessage || "";
        dom.reservedSeats.value = String(family.reservedSeats || 1);
        dom.familySlug.value = family.slug || family.id;
        dom.isActive.checked = Boolean(family.isActive);
        ui.setText(dom.familySubmitButton, "Atualizar convite");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      var copyButton = ui.createElement("button", "button button-secondary button-solid-light", "Copiar link");
      copyButton.type = "button";
      copyButton.addEventListener("click", async function () {
        try {
          await navigator.clipboard.writeText(buildInviteUrl(family.slug));
          setFeedback(dom.familyFormFeedback, "success", "Link copiado para a area de transferencia.");
        } catch (error) {
          setFeedback(dom.familyFormFeedback, "error", "Nao foi possivel copiar o link automaticamente.");
        }
      });

      var toggleButton = ui.createElement(
        "button",
        "button button-secondary button-solid-light",
        family.isActive ? "Desativar" : "Ativar"
      );
      toggleButton.type = "button";
      toggleButton.addEventListener("click", async function () {
        try {
          await api.toggleGuestFamily(family.id, !family.isActive);
          setFeedback(dom.familyFormFeedback, "success", "Status do convite atualizado.");
        } catch (error) {
          setFeedback(dom.familyFormFeedback, "error", "Nao foi possivel alterar o status desse convite.");
        }
      });

      actions.append(editButton, copyButton, toggleButton);
      card.append(header, stats, linkRow, actions);
      dom.familyList.appendChild(card);
    });
  }

  function subscribeFamilies() {
    if (unsubscribeFamilies) {
      unsubscribeFamilies();
    }

    unsubscribeFamilies = api.subscribeGuestFamilies(function (families) {
      familiesCache = families.slice().sort(function (a, b) {
        return String(a.familyName || "").localeCompare(String(b.familyName || ""));
      });
      renderStats(familiesCache);
      renderFamilies(familiesCache);
    }, function () {
      setFeedback(dom.familyFormFeedback, "error", "Nao foi possivel carregar a lista de familias.");
    });
  }

  function setupFamilyForm() {
    dom.generateSlugButton.addEventListener("click", function () {
      dom.familySlug.value = ui.generateReadableInviteId(dom.familyName.value || dom.displayName.value);
    });

    dom.familyResetButton.addEventListener("click", function () {
      resetFamilyForm();
    });

    dom.familyForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      var familyName = String(dom.familyName.value || "").trim();
      var displayName = String(dom.displayName.value || "").trim();
      var reservedSeats = Number(dom.reservedSeats.value);
      var slug = String(dom.familySlug.value || "").trim() || ui.generateReadableInviteId(familyName || displayName);
      var existing = familiesCache.find(function (family) {
        return family.id === dom.familyId.value;
      });

      if (!familyName || !displayName || !Number.isInteger(reservedSeats) || reservedSeats < 1) {
        setFeedback(dom.familyFormFeedback, "error", "Preencha familia, nome exibido e uma quantidade valida de convites.");
        return;
      }

      ui.setText(dom.familySubmitButton, "Salvando...");
      dom.familySubmitButton.disabled = true;

      try {
        await api.saveGuestFamily({
          id: dom.familyId.value || slug,
          slug: slug,
          familyName: familyName,
          displayName: displayName,
          customMessage: String(dom.customMessage.value || "").trim(),
          reservedSeats: reservedSeats,
          confirmedSeats: existing ? Number(existing.confirmedSeats || 0) : 0,
          responseStatus: existing ? existing.responseStatus || "pending" : "pending",
          attendanceNote: existing ? existing.attendanceNote || "" : "",
          isActive: dom.isActive.checked,
          createdAt: existing ? existing.createdAt || null : null
        });

        setFeedback(dom.familyFormFeedback, "success", "Convite salvo com sucesso.");
        resetFamilyForm();
      } catch (error) {
        setFeedback(dom.familyFormFeedback, "error", "Nao foi possivel salvar esse convite.");
      } finally {
        dom.familySubmitButton.disabled = false;
        ui.setText(dom.familySubmitButton, "Salvar convite");
      }
    });
  }

  function setupLogin() {
    dom.adminLoginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var password = String(dom.adminPassword.value || "");

      if (!password) {
        setFeedback(dom.adminLoginFeedback, "error", "Informe a senha para continuar.");
        return;
      }

      ui.setText(dom.adminLoginButton, config.adminSite.login.loadingLabel);
      dom.adminLoginButton.disabled = true;
      setFeedback(dom.adminLoginFeedback, "", "");

      try {
        await api.loginAdmin(password);
        dom.adminLoginForm.reset();
      } catch (error) {
        setFeedback(dom.adminLoginFeedback, "error", getAdminLoginErrorMessage(error));
      } finally {
        dom.adminLoginButton.disabled = false;
        ui.setText(dom.adminLoginButton, config.adminSite.login.submitLabel);
      }
    });

    dom.adminLogoutButton.addEventListener("click", async function () {
      await api.logoutAdmin();
    });
  }

  async function syncAdminState(user) {
    if (!user) {
      dom.adminLoginSection.hidden = false;
      dom.adminDashboardSection.hidden = true;
      if (unsubscribeFamilies) {
        unsubscribeFamilies();
        unsubscribeFamilies = null;
      }
      return;
    }

    var isAdmin = await api.currentUserIsAdmin();

    if (!isAdmin) {
      dom.adminLoginSection.hidden = false;
      dom.adminDashboardSection.hidden = true;
      setFeedback(dom.adminLoginFeedback, "error", "Esta conta nao possui permissao administrativa.");
      return;
    }

    dom.adminLoginSection.hidden = true;
    dom.adminDashboardSection.hidden = false;
    subscribeFamilies();
  }

  function initialize() {
    if (!api) {
      setFeedback(dom.adminLoginFeedback, "error", "Firebase nao foi carregado corretamente para o painel.");
      return;
    }

    hydrateLoginCopy();
    setupLogin();
    setupFamilyForm();
    ui.setupRevealAnimations();
    api.observeAuthState(function (user) {
      syncAdminState(user);
    });
  }

  initialize();
})();
