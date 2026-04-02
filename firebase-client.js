(function () {
  var config = window.siteConfig;

  if (!window.firebase || !config || !config.firebase) {
    window.WeddingFirebase = null;
    return;
  }

  var app = firebase.apps.length
    ? firebase.app()
    : firebase.initializeApp({
        apiKey: config.firebase.apiKey,
        authDomain: config.firebase.authDomain,
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
        messagingSenderId: config.firebase.messagingSenderId,
        appId: config.firebase.appId
      });

  var auth = firebase.auth(app);
  var db = firebase.firestore(app);

  var guestFamiliesCollection = db.collection("guestFamilies");
  var tablesCollection = db.collection("tables");
  var giftItemsCollection = db.collection("giftItems");
  var siteSettingsCollection = db.collection("siteSettings");

  function mapDocument(snapshot) {
    return Object.assign({ id: snapshot.id }, snapshot.data());
  }

  function sortByName(list, fieldName) {
    return list.slice().sort(function (left, right) {
      return String(left[fieldName] || "").localeCompare(String(right[fieldName] || ""));
    });
  }

  function sortBySortOrder(list) {
    return list.slice().sort(function (left, right) {
      var leftOrder = Number(left.sortOrder || 0);
      var rightOrder = Number(right.sortOrder || 0);

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return String(left.name || left.familyName || "").localeCompare(String(right.name || right.familyName || ""));
    });
  }

  function normalizeMemberStatus(status) {
    if (status === "confirmed") {
      return "confirmed";
    }

    if (status === "declined" || status === "cancelled") {
      return "declined";
    }

    return "pending";
  }

  function clearLegacyAdminSession() {
    window.localStorage.removeItem("wedding-admin-session");
  }

  async function loginAdmin(email, password) {
    var adminEmail = String(config.adminAuth && config.adminAuth.email || "").trim().toLowerCase();
    var normalizedEmail = String(email || "").trim().toLowerCase();

    if (!adminEmail) {
      var missingEmailError = new Error("Admin email is not configured.");
      missingEmailError.code = "auth/admin-email-missing";
      throw missingEmailError;
    }

    if (normalizedEmail !== adminEmail) {
      var unauthorizedEmailError = new Error("Admin email is not allowed.");
      unauthorizedEmailError.code = "auth/admin-email-not-allowed";
      throw unauthorizedEmailError;
    }

    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    var credential = await auth.signInWithEmailAndPassword(normalizedEmail, password);

    if (!credential || !credential.user) {
      var missingUserError = new Error("Admin user could not be resolved.");
      missingUserError.code = "auth/user-not-found";
      throw missingUserError;
    }

    if (String(credential.user.email || "").trim().toLowerCase() !== adminEmail) {
      await auth.signOut();
      var blockedUserError = new Error("Admin email is not allowed.");
      blockedUserError.code = "auth/admin-email-not-allowed";
      throw blockedUserError;
    }

    return credential;
  }

  function observeAuthState(callback) {
    return auth.onAuthStateChanged(callback);
  }

  async function logoutAdmin() {
    await auth.signOut();
  }

  async function currentUserIsAdmin(user) {
    var adminEmail = String(config.adminAuth && config.adminAuth.email || "").trim().toLowerCase();
    var currentUser = user || auth.currentUser;

    if (!currentUser || !adminEmail) {
      return false;
    }

    return String(currentUser.email || "").trim().toLowerCase() === adminEmail;
  }

  async function loadFamilyMembers(familyId) {
    var membersSnapshot = await guestFamiliesCollection.doc(familyId).collection("members").get();
    return sortByName(membersSnapshot.docs.map(mapDocument), "name");
  }

  async function loadGuestFamily(familyId) {
    var familySnapshot = await guestFamiliesCollection.doc(familyId).get();

    if (!familySnapshot.exists) {
      return null;
    }

    var family = mapDocument(familySnapshot);
    family.members = await loadFamilyMembers(family.id);
    return family;
  }

  async function fetchInviteBySlug(slug) {
    if (!slug) {
      return null;
    }

    var invite = await loadGuestFamily(slug);

    if (!invite || !invite.isActive) {
      return null;
    }

    return invite;
  }

  async function saveGuestFamily(family, members, previousId) {
    var slug = String(family.slug || "").trim();
    var currentId = String(previousId || "").trim();
    var now = firebase.firestore.FieldValue.serverTimestamp();

    if (!slug) {
      throw new Error("Missing invite slug");
    }

    var nextFamilyRef = guestFamiliesCollection.doc(slug);
    var previousFamilyRef = currentId ? guestFamiliesCollection.doc(currentId) : null;
    var existingFamilySnapshot = previousFamilyRef
      ? await previousFamilyRef.get()
      : { exists: false };
    var targetFamilySnapshot = await nextFamilyRef.get();

    if ((!currentId && targetFamilySnapshot.exists) || (currentId && slug !== currentId && targetFamilySnapshot.exists)) {
      var slugError = new Error("Invite slug already exists.");
      slugError.code = "family/slug-already-exists";
      throw slugError;
    }

    var existingMembersSnapshot = existingFamilySnapshot.exists
      ? await previousFamilyRef.collection("members").get()
      : null;

    var batch = db.batch();
    var familyPayload = {
      slug: slug,
      familyName: String(family.familyName || "").trim(),
      displayName: String(family.displayName || "").trim(),
      customMessage: String(family.customMessage || "").trim(),
      isActive: Boolean(family.isActive),
      attendanceNote: String(family.attendanceNote || "").trim(),
      updatedAt: now
    };

    if (!existingFamilySnapshot.exists || slug !== currentId) {
      familyPayload.createdAt = existingFamilySnapshot.exists
        ? existingFamilySnapshot.data().createdAt || now
        : now;
    }

    batch.set(nextFamilyRef, familyPayload, { merge: true });

    var keptMemberIds = {};

    (members || []).forEach(function (member) {
      var memberId = String(member.id || "").trim();
      var memberRef = memberId
        ? nextFamilyRef.collection("members").doc(memberId)
        : nextFamilyRef.collection("members").doc();
      var memberPayload = {
        name: String(member.name || "").trim(),
        responseStatus: normalizeMemberStatus(member.responseStatus),
        tableId: String(member.tableId || "").trim(),
        updatedAt: now
      };

      if (!memberId) {
        memberPayload.createdAt = now;
      }

      keptMemberIds[memberRef.id] = true;
      batch.set(memberRef, memberPayload, { merge: true });
    });

    if (existingMembersSnapshot) {
      existingMembersSnapshot.forEach(function (memberSnapshot) {
        if (slug !== currentId || !keptMemberIds[memberSnapshot.id]) {
          batch.delete(memberSnapshot.ref);
        }
      });
    }

    if (currentId && slug !== currentId && existingFamilySnapshot.exists) {
      batch.delete(previousFamilyRef);
    }

    await batch.commit();
    return slug;
  }

  async function toggleGuestFamily(inviteId, isActive) {
    await guestFamiliesCollection.doc(inviteId).update({
      isActive: isActive,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function submitInviteResponse(inviteId, payload) {
    var inviteRef = guestFamiliesCollection.doc(inviteId);
    var inviteSnapshot = await inviteRef.get();

    if (!inviteSnapshot.exists || !inviteSnapshot.data().isActive) {
      throw new Error("Invite is unavailable.");
    }

    var batch = db.batch();
    var now = firebase.firestore.FieldValue.serverTimestamp();

    (payload.members || []).forEach(function (member) {
      if (!member || !member.id) {
        return;
      }

      batch.update(inviteRef.collection("members").doc(member.id), {
        responseStatus: normalizeMemberStatus(member.responseStatus),
        updatedAt: now
      });
    });

    batch.update(inviteRef, {
      attendanceNote: String(payload.attendanceNote || "").trim(),
      updatedAt: now
    });

    await batch.commit();
  }

  function subscribeGuestFamilies(callback, errorCallback) {
    return guestFamiliesCollection.onSnapshot(async function (snapshot) {
      try {
        var families = await Promise.all(snapshot.docs.map(async function (familySnapshot) {
          var family = mapDocument(familySnapshot);
          family.members = await loadFamilyMembers(family.id);
          return family;
        }));

        callback(sortByName(families, "familyName"));
      } catch (error) {
        if (errorCallback) {
          errorCallback(error);
        }
      }
    }, errorCallback);
  }

  async function saveTable(table) {
    var tableId = String(table.id || "").trim();
    var tableRef = tableId
      ? tablesCollection.doc(tableId)
      : tablesCollection.doc();
    var payload = {
      name: String(table.name || "").trim(),
      capacity: Number(table.capacity || 0),
      notes: String(table.notes || "").trim(),
      sortOrder: Number(table.sortOrder || Date.now()),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!tableId) {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    await tableRef.set(payload, { merge: true });
    return tableRef.id;
  }

  async function deleteTable(tableId) {
    var memberSnapshots = await db.collectionGroup("members").where("tableId", "==", tableId).get();
    var batch = db.batch();
    var now = firebase.firestore.FieldValue.serverTimestamp();
    var touchedFamilies = {};

    memberSnapshots.forEach(function (memberSnapshot) {
      batch.update(memberSnapshot.ref, {
        tableId: "",
        updatedAt: now
      });
      touchedFamilies[memberSnapshot.ref.parent.parent.id] = true;
    });

    Object.keys(touchedFamilies).forEach(function (familyId) {
      batch.set(guestFamiliesCollection.doc(familyId), {
        updatedAt: now
      }, { merge: true });
    });

    batch.delete(tablesCollection.doc(tableId));
    await batch.commit();
  }

  async function assignGuestToTable(familyId, memberId, tableId) {
    var now = firebase.firestore.FieldValue.serverTimestamp();

    await guestFamiliesCollection.doc(familyId).collection("members").doc(memberId).update({
      tableId: String(tableId || "").trim(),
      updatedAt: now
    });

    await guestFamiliesCollection.doc(familyId).set({
      updatedAt: now
    }, { merge: true });
  }

  function subscribeTables(callback, errorCallback) {
    return tablesCollection.onSnapshot(function (snapshot) {
      callback(sortBySortOrder(snapshot.docs.map(mapDocument)));
    }, errorCallback);
  }

  async function saveGiftItem(giftItem) {
    var giftId = String(giftItem.id || "").trim();
    var giftRef = giftId
      ? giftItemsCollection.doc(giftId)
      : giftItemsCollection.doc();
    var payload = {
      name: String(giftItem.name || "").trim(),
      purchaseUrl: String(giftItem.purchaseUrl || "").trim(),
      imageDataUrl: String(giftItem.imageDataUrl || "").trim(),
      isActive: Boolean(giftItem.isActive),
      sortOrder: Number(giftItem.sortOrder || Date.now()),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!giftId) {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    await giftRef.set(payload, { merge: true });
    return giftRef.id;
  }

  async function deleteGiftItem(giftId) {
    await giftItemsCollection.doc(giftId).delete();
  }

  function subscribeGiftItems(callback, errorCallback) {
    return giftItemsCollection.onSnapshot(function (snapshot) {
      callback(sortBySortOrder(snapshot.docs.map(mapDocument)));
    }, errorCallback);
  }

  async function listGiftItems(options) {
    var snapshot = await giftItemsCollection.get();
    var items = sortBySortOrder(snapshot.docs.map(mapDocument));

    if (options && options.activeOnly) {
      return items.filter(function (item) {
        return item.isActive !== false;
      });
    }

    return items;
  }

  async function loadSiteSettings() {
    var snapshot = await siteSettingsCollection.doc("main").get();
    return snapshot.exists ? snapshot.data() : null;
  }

  async function saveSiteSettings(settings) {
    await siteSettingsCollection.doc("main").set(Object.assign({}, settings, {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }), { merge: true });
  }

  async function loadPublicSiteData() {
    var results = await Promise.all([
      loadSiteSettings().catch(function () {
        return null;
      }),
      listGiftItems({ activeOnly: true }).catch(function () {
        return [];
      })
    ]);

    return {
      settings: results[0],
      giftItems: results[1]
    };
  }

  window.WeddingFirebase = {
    auth: auth,
    db: db,
    clearLegacyAdminSession: clearLegacyAdminSession,
    loginAdmin: loginAdmin,
    logoutAdmin: logoutAdmin,
    observeAuthState: observeAuthState,
    currentUserIsAdmin: currentUserIsAdmin,
    fetchInviteBySlug: fetchInviteBySlug,
    loadGuestFamily: loadGuestFamily,
    saveGuestFamily: saveGuestFamily,
    toggleGuestFamily: toggleGuestFamily,
    submitInviteResponse: submitInviteResponse,
    subscribeGuestFamilies: subscribeGuestFamilies,
    saveTable: saveTable,
    deleteTable: deleteTable,
    assignGuestToTable: assignGuestToTable,
    subscribeTables: subscribeTables,
    saveGiftItem: saveGiftItem,
    deleteGiftItem: deleteGiftItem,
    subscribeGiftItems: subscribeGiftItems,
    listGiftItems: listGiftItems,
    loadSiteSettings: loadSiteSettings,
    saveSiteSettings: saveSiteSettings,
    loadPublicSiteData: loadPublicSiteData
  };
})();
