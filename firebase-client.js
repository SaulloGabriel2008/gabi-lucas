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

  function mapFamilyDocument(documentSnapshot) {
    return Object.assign({ id: documentSnapshot.id }, documentSnapshot.data());
  }

  async function loginAdmin(password) {
    var adminEmail = config.adminAuth && config.adminAuth.email;

    if (!adminEmail) {
      var missingEmailError = new Error("Admin email is not configured.");
      missingEmailError.code = "auth/admin-email-missing";
      throw missingEmailError;
    }

    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    var credential = await auth.signInWithEmailAndPassword(adminEmail, password);
    return credential.user;
  }

  function observeAuthState(callback) {
    return auth.onAuthStateChanged(callback);
  }

  async function logoutAdmin() {
    await auth.signOut();
  }

  async function currentUserIsAdmin() {
    if (!auth.currentUser) {
      return false;
    }

    return auth.currentUser.email === config.adminAuth.email;
  }

  async function fetchInviteBySlug(slug) {
    if (!slug) {
      return null;
    }

    var inviteReference = db.collection("guestFamilies").doc(slug);
    var inviteSnapshot = await inviteReference.get();

    if (!inviteSnapshot.exists) {
      return null;
    }

    var invite = mapFamilyDocument(inviteSnapshot);

    if (!invite.isActive) {
      return null;
    }

    return invite;
  }

  async function submitInviteResponse(inviteId, payload) {
    var inviteReference = db.collection("guestFamilies").doc(inviteId);

    await inviteReference.update({
      confirmedSeats: payload.confirmedSeats,
      responseStatus: payload.responseStatus,
      attendanceNote: payload.attendanceNote || "",
      respondedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function subscribeGuestFamilies(callback, errorCallback) {
    return db.collection("guestFamilies")
      .orderBy("familyName")
      .onSnapshot(function (snapshot) {
        var families = snapshot.docs.map(mapFamilyDocument);
        callback(families);
      }, errorCallback);
  }

  async function saveGuestFamily(family) {
    var now = firebase.firestore.FieldValue.serverTimestamp();
    var collectionReference = db.collection("guestFamilies");
    var inviteId = family.id || family.slug;

    if (!inviteId) {
      throw new Error("Missing invite id");
    }

    await collectionReference.doc(inviteId).set({
      slug: inviteId,
      familyName: family.familyName,
      displayName: family.displayName,
      customMessage: family.customMessage,
      reservedSeats: family.reservedSeats,
      confirmedSeats: family.confirmedSeats,
      responseStatus: family.responseStatus,
      attendanceNote: family.attendanceNote || "",
      isActive: family.isActive,
      updatedAt: now,
      createdAt: family.createdAt || now
    }, { merge: true });

    return inviteId;
  }

  async function toggleGuestFamily(inviteId, isActive) {
    await db.collection("guestFamilies").doc(inviteId).update({
      isActive: isActive,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  window.WeddingFirebase = {
    auth: auth,
    db: db,
    loginAdmin: loginAdmin,
    logoutAdmin: logoutAdmin,
    observeAuthState: observeAuthState,
    currentUserIsAdmin: currentUserIsAdmin,
    fetchInviteBySlug: fetchInviteBySlug,
    submitInviteResponse: submitInviteResponse,
    subscribeGuestFamilies: subscribeGuestFamilies,
    saveGuestFamily: saveGuestFamily,
    toggleGuestFamily: toggleGuestFamily
  };
})();
