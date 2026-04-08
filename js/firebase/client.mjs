import { firebaseConfig } from "../config/site-config.mjs";

function getFirebaseNamespace() {
  if (!window.firebase) {
    throw new Error("Firebase SDK não foi carregado.");
  }

  return window.firebase;
}

function getApp() {
  const firebase = getFirebaseNamespace();
  return firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
}

export function getAuth() {
  return getApp().auth();
}

export function getDb() {
  return getApp().firestore();
}

export function getServerTimestamp() {
  return getFirebaseNamespace().firestore.FieldValue.serverTimestamp();
}

function mapDoc(snapshot) {
  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

function sortByText(list, fieldName) {
  return list.slice().sort((left, right) => {
    return String(left?.[fieldName] || "").localeCompare(String(right?.[fieldName] || ""));
  });
}

function sortBySortOrder(list) {
  return list.slice().sort((left, right) => {
    const leftOrder = Number(left?.sortOrder || 0);
    const rightOrder = Number(right?.sortOrder || 0);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return String(left?.name || left?.familyName || "").localeCompare(String(right?.name || right?.familyName || ""));
  });
}

function normalizeGuestStatus(status) {
  if (status === "confirmed") {
    return "confirmed";
  }

  if (status === "declined") {
    return "declined";
  }

  return "pending";
}

export function normalizeAdminEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function mapAdminProfile(snapshot, source, key) {
  return {
    id: snapshot.id,
    ...snapshot.data(),
    source,
    lookupKey: key || snapshot.id
  };
}

async function loadGuestsForFamily(familyId) {
  const snapshot = await getDb()
    .collection("families")
    .doc(familyId)
    .collection("guests")
    .get();

  return sortByText(snapshot.docs.map(mapDoc), "name");
}

async function ensureInviteSlugAvailable(slug, familyId) {
  const snapshot = await getDb().collection("inviteLinks").doc(slug).get();

  if (snapshot.exists && snapshot.data().familyId !== familyId) {
    const error = new Error("Já existe um convite com esse slug.");
    error.code = "family/slug-already-exists";
    throw error;
  }
}

export async function loginAdmin(email, password) {
  const auth = getAuth();
  const firebase = getFirebaseNamespace();

  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  return auth.signInWithEmailAndPassword(normalizeAdminEmail(email), String(password || ""));
}

export async function logoutAdmin() {
  return getAuth().signOut();
}

export function observeAuthState(callback) {
  return getAuth().onAuthStateChanged(callback);
}

export async function loadAdminProfile(user) {
  if (!user?.uid && !user?.email) {
    return null;
  }

  const uid = String(user?.uid || "").trim();
  const email = normalizeAdminEmail(user?.email);
  const uidRef = uid ? getDb().collection("admins").doc(uid) : null;
  const emailRef = email ? getDb().collection("adminEmails").doc(email) : null;
  const [uidResult, emailResult] = await Promise.allSettled([
    uidRef ? uidRef.get() : Promise.resolve(null),
    emailRef ? emailRef.get() : Promise.resolve(null)
  ]);

  const uidSnapshot = uidResult.status === "fulfilled" ? uidResult.value : null;
  const emailSnapshot = emailResult.status === "fulfilled" ? emailResult.value : null;

  const uidProfile = uidSnapshot?.exists ? mapAdminProfile(uidSnapshot, "uid", uid) : null;
  const emailProfile = emailSnapshot?.exists ? mapAdminProfile(emailSnapshot, "email", email) : null;
  const activeProfile = [uidProfile, emailProfile].find((profile) => profile?.active === true || profile?.active === "true") || null;
  const inactiveProfile = uidProfile || emailProfile || null;

  return {
    active: Boolean(activeProfile),
    profile: activeProfile || inactiveProfile,
    source: activeProfile?.source || inactiveProfile?.source || null,
    lookedUp: {
      uid,
      email,
      uidPath: uid ? `admins/${uid}` : "",
      emailPath: email ? `adminEmails/${email}` : "",
      uidFound: Boolean(uidProfile),
      emailFound: Boolean(emailProfile),
      uidActive: Boolean(uidProfile && (uidProfile.active === true || uidProfile.active === "true")),
      emailActive: Boolean(emailProfile && (emailProfile.active === true || emailProfile.active === "true")),
      uidLookupError: uidResult.status === "rejected" ? uidResult.reason?.code || uidResult.reason?.message || "lookup-failed" : "",
      emailLookupError: emailResult.status === "rejected" ? emailResult.reason?.code || emailResult.reason?.message || "lookup-failed" : ""
    },
    profiles: {
      uid: uidProfile,
      email: emailProfile
    }
  };
}

export async function loadSiteSettings() {
  const snapshot = await getDb().collection("siteSettings").doc("main").get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function saveSiteSettings(settings) {
  await getDb().collection("siteSettings").doc("main").set({
    ...settings,
    updatedAt: getServerTimestamp()
  }, { merge: true });
}

export async function saveFamily(familyInput) {
  const db = getDb();
  const familyId = String(familyInput?.id || "").trim();
  const familyRef = familyId
    ? db.collection("families").doc(familyId)
    : db.collection("families").doc();
  const existingSnapshot = familyId ? await familyRef.get() : null;
  const existingFamily = existingSnapshot?.exists ? existingSnapshot.data() : null;
  const slug = String(familyInput?.slug || "").trim().toLowerCase();

  if (!slug) {
    throw new Error("Slug do convite é obrigatório.");
  }

  await ensureInviteSlugAvailable(slug, familyRef.id);

  const existingGuestsSnapshot = existingSnapshot?.exists
    ? await familyRef.collection("guests").get()
    : null;
  const batch = db.batch();
  const now = getServerTimestamp();
  const previousSlug = String(existingFamily?.slug || "").trim().toLowerCase();

  batch.set(familyRef, {
    familyName: String(familyInput?.familyName || "").trim(),
    displayName: String(familyInput?.displayName || "").trim(),
    customMessage: String(familyInput?.customMessage || "").trim(),
    attendanceNote: String(familyInput?.attendanceNote || "").trim(),
    slug,
    isActive: Boolean(familyInput?.isActive),
    updatedAt: now,
    ...(existingSnapshot?.exists ? {} : { createdAt: now })
  }, { merge: true });

  batch.set(db.collection("inviteLinks").doc(slug), {
    familyId: familyRef.id,
    isActive: Boolean(familyInput?.isActive),
    updatedAt: now
  }, { merge: true });

  if (previousSlug && previousSlug !== slug) {
    batch.delete(db.collection("inviteLinks").doc(previousSlug));
  }

  const nextGuestIds = new Set();

  (familyInput?.guests || []).forEach((guest) => {
    const guestId = String(guest?.id || "").trim();
    const guestRef = guestId
      ? familyRef.collection("guests").doc(guestId)
      : familyRef.collection("guests").doc();

    nextGuestIds.add(guestRef.id);

    batch.set(guestRef, {
      name: String(guest?.name || "").trim(),
      responseStatus: normalizeGuestStatus(guest?.responseStatus),
      tableId: String(guest?.tableId || "").trim(),
      updatedAt: now,
      ...(guestId ? {} : { createdAt: now })
    }, { merge: true });
  });

  existingGuestsSnapshot?.forEach((guestSnapshot) => {
    if (!nextGuestIds.has(guestSnapshot.id)) {
      batch.delete(guestSnapshot.ref);
    }
  });

  await batch.commit();
  return familyRef.id;
}

export async function toggleFamilyActive(familyId, isActive) {
  const db = getDb();
  const familyRef = db.collection("families").doc(familyId);
  const snapshot = await familyRef.get();

  if (!snapshot.exists) {
    throw new Error("Família não encontrada.");
  }

  const slug = String(snapshot.data().slug || "").trim().toLowerCase();
  const now = getServerTimestamp();
  const batch = db.batch();

  batch.set(familyRef, {
    isActive: Boolean(isActive),
    updatedAt: now
  }, { merge: true });

  if (slug) {
    batch.set(db.collection("inviteLinks").doc(slug), {
      familyId,
      isActive: Boolean(isActive),
      updatedAt: now
    }, { merge: true });
  }

  await batch.commit();
}

export function subscribeFamilies(callback, errorCallback) {
  return getDb().collection("families").onSnapshot(async (snapshot) => {
    try {
      const families = await Promise.all(snapshot.docs.map(async (familySnapshot) => {
        const family = mapDoc(familySnapshot);
        family.guests = await loadGuestsForFamily(family.id);
        return family;
      }));

      callback(sortByText(families, "familyName"));
    } catch (error) {
      errorCallback?.(error);
    }
  }, errorCallback);
}

export async function saveTable(tableInput) {
  const tableId = String(tableInput?.id || "").trim();
  const tableRef = tableId
    ? getDb().collection("tables").doc(tableId)
    : getDb().collection("tables").doc();

  await tableRef.set({
    name: String(tableInput?.name || "").trim(),
    capacity: Number(tableInput?.capacity || 0),
    notes: String(tableInput?.notes || "").trim(),
    sortOrder: Number(tableInput?.sortOrder || Date.now()),
    updatedAt: getServerTimestamp(),
    ...(tableId ? {} : { createdAt: getServerTimestamp() })
  }, { merge: true });

  return tableRef.id;
}

export async function deleteTable(tableId) {
  const db = getDb();
  const guestSnapshots = await db.collectionGroup("guests").where("tableId", "==", tableId).get();
  const batch = db.batch();
  const now = getServerTimestamp();
  const touchedFamilies = new Set();

  guestSnapshots.forEach((guestSnapshot) => {
    batch.set(guestSnapshot.ref, {
      tableId: "",
      updatedAt: now
    }, { merge: true });

    const familyId = guestSnapshot.ref.parent?.parent?.id;

    if (familyId) {
      touchedFamilies.add(familyId);
    }
  });

  touchedFamilies.forEach((familyId) => {
    batch.set(db.collection("families").doc(familyId), {
      updatedAt: now
    }, { merge: true });
  });

  batch.delete(db.collection("tables").doc(tableId));
  await batch.commit();
}

export async function assignGuestToTable(familyId, guestId, tableId) {
  const now = getServerTimestamp();

  await getDb().collection("families").doc(familyId).collection("guests").doc(guestId).update({
    tableId: String(tableId || "").trim(),
    updatedAt: now
  });

  await getDb().collection("families").doc(familyId).set({
    updatedAt: now
  }, { merge: true });
}

export async function saveGuestTableAssignments(changes) {
  const normalizedChanges = Array.isArray(changes)
    ? changes
        .map((change) => ({
          familyId: String(change?.familyId || "").trim(),
          guestId: String(change?.guestId || "").trim(),
          tableId: String(change?.tableId || "").trim()
        }))
        .filter((change) => change.familyId && change.guestId)
    : [];

  if (!normalizedChanges.length) {
    return;
  }

  const db = getDb();
  const chunkSize = 180;

  for (let index = 0; index < normalizedChanges.length; index += chunkSize) {
    const chunk = normalizedChanges.slice(index, index + chunkSize);
    const batch = db.batch();
    const familiesTouched = new Set();

    chunk.forEach((change) => {
      const guestRef = db.collection("families").doc(change.familyId).collection("guests").doc(change.guestId);
      batch.set(guestRef, {
        tableId: change.tableId,
        updatedAt: getServerTimestamp()
      }, { merge: true });
      familiesTouched.add(change.familyId);
    });

    familiesTouched.forEach((familyId) => {
      batch.set(db.collection("families").doc(familyId), {
        updatedAt: getServerTimestamp()
      }, { merge: true });
    });

    await batch.commit();
  }
}

export function subscribeTables(callback, errorCallback) {
  return getDb().collection("tables").onSnapshot((snapshot) => {
    callback(sortBySortOrder(snapshot.docs.map(mapDoc)));
  }, errorCallback);
}

export async function saveGiftItem(giftInput) {
  const giftId = String(giftInput?.id || "").trim();
  const giftRef = giftId
    ? getDb().collection("gifts").doc(giftId)
    : getDb().collection("gifts").doc();
  const imageUrl = String(giftInput?.imageUrl || "").trim();

  if (!imageUrl) {
    const error = new Error("A URL da imagem do presente é obrigatória.");
    error.code = "gift/image-required";
    throw error;
  }

  await giftRef.set({
    name: String(giftInput?.name || "").trim(),
    purchaseUrl: String(giftInput?.purchaseUrl || "").trim(),
    imageUrl,
    isActive: Boolean(giftInput?.isActive),
    sortOrder: Number(giftInput?.sortOrder || Date.now()),
    updatedAt: getServerTimestamp(),
    ...(giftId ? {} : { createdAt: getServerTimestamp() })
  }, { merge: true });

  return giftRef.id;
}

export async function deleteGiftItem(giftId) {
  if (!giftId) {
    return;
  }

  await getDb().collection("gifts").doc(giftId).delete();
}

export function subscribeGiftItems(callback, errorCallback) {
  return getDb().collection("gifts").onSnapshot((snapshot) => {
    callback(sortBySortOrder(snapshot.docs.map(mapDoc)));
  }, errorCallback);
}

export async function listGiftItems(options = {}) {
  let query = getDb().collection("gifts");

  if (options.activeOnly) {
    query = query.where("isActive", "==", true);
  }

  const snapshot = await query.get();
  return sortBySortOrder(snapshot.docs.map(mapDoc));
}

export async function fetchInviteBySlug(slugInput) {
  const slug = String(slugInput || "").trim().toLowerCase();

  if (!slug) {
    return null;
  }

  const inviteLinkSnapshot = await getDb().collection("inviteLinks").doc(slug).get();

  if (!inviteLinkSnapshot.exists || inviteLinkSnapshot.data().isActive !== true) {
    return null;
  }

  const familyId = String(inviteLinkSnapshot.data().familyId || "").trim();

  if (!familyId) {
    return null;
  }

  const familySnapshot = await getDb().collection("families").doc(familyId).get();

  if (!familySnapshot.exists || familySnapshot.data().isActive !== true) {
    return null;
  }

  const family = mapDoc(familySnapshot);
  family.guests = await loadGuestsForFamily(family.id);
  return family;
}

export async function submitInviteResponse(familyId, payload) {
  const familyRef = getDb().collection("families").doc(familyId);
  const familySnapshot = await familyRef.get();

  if (!familySnapshot.exists || familySnapshot.data().isActive !== true) {
    throw new Error("Convite indisponível.");
  }

  const batch = getDb().batch();
  const now = getServerTimestamp();

  (payload?.guests || []).forEach((guest) => {
    if (!guest?.id) {
      return;
    }

    batch.update(familyRef.collection("guests").doc(guest.id), {
      responseStatus: normalizeGuestStatus(guest.responseStatus),
      updatedAt: now
    });
  });

  batch.set(familyRef, {
    attendanceNote: String(payload?.attendanceNote || "").trim(),
    updatedAt: now
  }, { merge: true });

  await batch.commit();
}

export async function loadPublicSiteData() {
  const [settings, giftItems] = await Promise.all([
    loadSiteSettings().catch(() => null),
    listGiftItems({ activeOnly: true }).catch(() => [])
  ]);

  return {
    settings,
    giftItems
  };
}
