import { getDbInstance, getServerTimestamp, getStorageInstance } from "./app.mjs";

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

function sanitizeStorageName(value) {
  return String(value || "imagem")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "imagem";
}

async function loadGuestsForFamily(familyId) {
  const guestsSnapshot = await getDbInstance()
    .collection("families")
    .doc(familyId)
    .collection("guests")
    .get();

  return sortByText(guestsSnapshot.docs.map(mapDoc), "name");
}

async function ensureInviteSlugAvailable(slug, familyId) {
  const snapshot = await getDbInstance().collection("inviteLinks").doc(slug).get();

  if (snapshot.exists && snapshot.data().familyId !== familyId) {
    const error = new Error("Já existe um convite com esse slug.");
    error.code = "family/slug-already-exists";
    throw error;
  }
}

async function uploadGiftImage(giftId, file) {
  const storage = getStorageInstance();
  const extension = String(file?.name || "imagem.jpg").split(".").pop();
  const safeFileName = sanitizeStorageName(file?.name || `gift.${extension}`);
  const fullPath = `gift-images/${giftId}/${Date.now()}-${safeFileName}`;
  const snapshot = await storage.ref(fullPath).put(file);
  const imageUrl = await snapshot.ref.getDownloadURL();

  return {
    imagePath: snapshot.ref.fullPath,
    imageUrl
  };
}

async function deleteStoragePath(imagePath) {
  if (!imagePath) {
    return;
  }

  try {
    await getStorageInstance().ref(imagePath).delete();
  } catch (error) {
    if (error?.code !== "storage/object-not-found") {
      throw error;
    }
  }
}

export async function loadSiteSettings() {
  const snapshot = await getDbInstance().collection("siteSettings").doc("main").get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function saveSiteSettings(settings) {
  await getDbInstance().collection("siteSettings").doc("main").set({
    ...settings,
    updatedAt: getServerTimestamp()
  }, { merge: true });
}

export async function saveFamily(familyInput) {
  const db = getDbInstance();
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

  const familyPayload = {
    familyName: String(familyInput?.familyName || "").trim(),
    displayName: String(familyInput?.displayName || "").trim(),
    customMessage: String(familyInput?.customMessage || "").trim(),
    attendanceNote: String(familyInput?.attendanceNote || "").trim(),
    slug,
    isActive: Boolean(familyInput?.isActive),
    updatedAt: now
  };

  if (!existingSnapshot?.exists) {
    familyPayload.createdAt = now;
  }

  batch.set(familyRef, familyPayload, { merge: true });
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

    const guestPayload = {
      name: String(guest?.name || "").trim(),
      responseStatus: normalizeGuestStatus(guest?.responseStatus),
      tableId: String(guest?.tableId || "").trim(),
      updatedAt: now
    };

    if (!guestId) {
      guestPayload.createdAt = now;
    }

    batch.set(guestRef, guestPayload, { merge: true });
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
  const db = getDbInstance();
  const familyRef = db.collection("families").doc(familyId);
  const snapshot = await familyRef.get();

  if (!snapshot.exists) {
    throw new Error("Família não encontrada.");
  }

  const family = snapshot.data();
  const slug = String(family.slug || "").trim().toLowerCase();
  const batch = db.batch();
  const now = getServerTimestamp();

  batch.set(familyRef, {
    isActive: Boolean(isActive),
    updatedAt: now
  }, { merge: true });

  if (slug) {
    batch.set(db.collection("inviteLinks").doc(slug), {
      familyId: familyRef.id,
      isActive: Boolean(isActive),
      updatedAt: now
    }, { merge: true });
  }

  await batch.commit();
}

export function subscribeFamilies(callback, errorCallback) {
  return getDbInstance().collection("families").onSnapshot(async (snapshot) => {
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
  const db = getDbInstance();
  const tableId = String(tableInput?.id || "").trim();
  const tableRef = tableId
    ? db.collection("tables").doc(tableId)
    : db.collection("tables").doc();
  const payload = {
    name: String(tableInput?.name || "").trim(),
    capacity: Number(tableInput?.capacity || 0),
    notes: String(tableInput?.notes || "").trim(),
    sortOrder: Number(tableInput?.sortOrder || Date.now()),
    updatedAt: getServerTimestamp()
  };

  if (!tableId) {
    payload.createdAt = getServerTimestamp();
  }

  await tableRef.set(payload, { merge: true });
  return tableRef.id;
}

export async function deleteTable(tableId) {
  const db = getDbInstance();
  const guestSnapshots = await db.collectionGroup("guests").where("tableId", "==", tableId).get();
  const batch = db.batch();
  const now = getServerTimestamp();
  const touchedFamilies = new Set();

  guestSnapshots.forEach((guestSnapshot) => {
    batch.set(guestSnapshot.ref, {
      tableId: "",
      updatedAt: now
    }, { merge: true });

    if (guestSnapshot.ref.parent?.parent?.id) {
      touchedFamilies.add(guestSnapshot.ref.parent.parent.id);
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
  const db = getDbInstance();
  const now = getServerTimestamp();

  await db.collection("families").doc(familyId).collection("guests").doc(guestId).set({
    tableId: String(tableId || "").trim(),
    updatedAt: now
  }, { merge: true });

  await db.collection("families").doc(familyId).set({
    updatedAt: now
  }, { merge: true });
}

export function subscribeTables(callback, errorCallback) {
  return getDbInstance().collection("tables").onSnapshot((snapshot) => {
    callback(sortBySortOrder(snapshot.docs.map(mapDoc)));
  }, errorCallback);
}

export async function saveGiftItem(giftInput) {
  const db = getDbInstance();
  const giftId = String(giftInput?.id || "").trim();
  const giftRef = giftId
    ? db.collection("gifts").doc(giftId)
    : db.collection("gifts").doc();
  const existingSnapshot = giftId ? await giftRef.get() : null;
  const existingGift = existingSnapshot?.exists ? existingSnapshot.data() : null;
  let imagePath = String(existingGift?.imagePath || giftInput?.existingImagePath || "").trim();
  let imageUrl = String(existingGift?.imageUrl || giftInput?.existingImageUrl || "").trim();

  if (giftInput?.imageFile) {
    const uploadResult = await uploadGiftImage(giftRef.id, giftInput.imageFile);
    imagePath = uploadResult.imagePath;
    imageUrl = uploadResult.imageUrl;
  }

  if (!imagePath || !imageUrl) {
    const error = new Error("A imagem do presente é obrigatória.");
    error.code = "gift/image-required";
    throw error;
  }

  const payload = {
    name: String(giftInput?.name || "").trim(),
    purchaseUrl: String(giftInput?.purchaseUrl || "").trim(),
    imagePath,
    imageUrl,
    isActive: Boolean(giftInput?.isActive),
    sortOrder: Number(giftInput?.sortOrder || Date.now()),
    updatedAt: getServerTimestamp()
  };

  if (!existingSnapshot?.exists) {
    payload.createdAt = getServerTimestamp();
  }

  await giftRef.set(payload, { merge: true });

  if (giftInput?.imageFile && existingGift?.imagePath && existingGift.imagePath !== imagePath) {
    await deleteStoragePath(existingGift.imagePath);
  }

  return giftRef.id;
}

export async function deleteGiftItem(gift) {
  const giftId = typeof gift === "string" ? gift : gift?.id;

  if (!giftId) {
    return;
  }

  const snapshot = await getDbInstance().collection("gifts").doc(giftId).get();
  const imagePath = typeof gift === "object"
    ? gift?.imagePath || snapshot.data()?.imagePath
    : snapshot.data()?.imagePath;

  await getDbInstance().collection("gifts").doc(giftId).delete();
  await deleteStoragePath(imagePath);
}

export function subscribeGiftItems(callback, errorCallback) {
  return getDbInstance().collection("gifts").onSnapshot((snapshot) => {
    callback(sortBySortOrder(snapshot.docs.map(mapDoc)));
  }, errorCallback);
}

export async function listGiftItems(options = {}) {
  let query = getDbInstance().collection("gifts");

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

  const inviteLinkSnapshot = await getDbInstance().collection("inviteLinks").doc(slug).get();

  if (!inviteLinkSnapshot.exists || inviteLinkSnapshot.data().isActive !== true) {
    return null;
  }

  const familyId = String(inviteLinkSnapshot.data().familyId || "").trim();

  if (!familyId) {
    return null;
  }

  const familySnapshot = await getDbInstance().collection("families").doc(familyId).get();

  if (!familySnapshot.exists || familySnapshot.data().isActive !== true) {
    return null;
  }

  const family = mapDoc(familySnapshot);
  family.guests = await loadGuestsForFamily(family.id);
  return family;
}

export async function submitInviteResponse(familyId, payload) {
  const db = getDbInstance();
  const familyRef = db.collection("families").doc(familyId);
  const familySnapshot = await familyRef.get();

  if (!familySnapshot.exists || familySnapshot.data().isActive !== true) {
    throw new Error("Convite indisponível.");
  }

  const batch = db.batch();
  const now = getServerTimestamp();

  (payload?.guests || []).forEach((guest) => {
    if (!guest?.id) {
      return;
    }

    batch.set(familyRef.collection("guests").doc(guest.id), {
      responseStatus: normalizeGuestStatus(guest.responseStatus),
      updatedAt: now
    }, { merge: true });
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
