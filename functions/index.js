const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

// Keep the password on the server side only. In a future hardening pass,
// move this value to Secret Manager instead of storing it in code.
const ADMIN_PASSWORD = "gabi&lucas";
const ADMIN_UID = "admin-ana-lucas";

exports.adminLogin = onCall({ region: "southamerica-east1" }, async (request) => {
  const password = String((request.data && request.data.password) || "");

  if (password !== ADMIN_PASSWORD) {
    throw new HttpsError("permission-denied", "Senha invalida.");
  }

  const auth = getAuth();

  try {
    await auth.getUser(ADMIN_UID);
  } catch (error) {
    await auth.createUser({
      uid: ADMIN_UID,
      displayName: "Admin Ana e Lucas"
    });
  }

  await auth.setCustomUserClaims(ADMIN_UID, { admin: true });
  const token = await auth.createCustomToken(ADMIN_UID, { admin: true });

  return { token };
});
