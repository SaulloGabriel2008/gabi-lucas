import { getAuthInstance, getDbInstance } from "./app.mjs";

function mapDoc(snapshot) {
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function loginAdmin(email, password) {
  const auth = getAuthInstance();
  const firebase = window.firebase;

  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  return auth.signInWithEmailAndPassword(String(email || "").trim(), String(password || ""));
}

export async function logoutAdmin() {
  return getAuthInstance().signOut();
}

export function observeAuthState(callback) {
  return getAuthInstance().onAuthStateChanged(callback);
}

export async function loadAdminProfile(user) {
  if (!user?.uid) {
    return null;
  }

  const snapshot = await getDbInstance().collection("admins").doc(user.uid).get();
  return mapDoc(snapshot);
}

export async function currentUserIsAdmin(user) {
  const adminProfile = await loadAdminProfile(user || getAuthInstance().currentUser);
  return Boolean(adminProfile?.active);
}
