import { firebaseConfig } from "../config/site-config.mjs";

function getFirebaseNamespace() {
  if (!window.firebase) {
    throw new Error("Firebase SDK não foi carregado.");
  }

  return window.firebase;
}

export function getFirebaseApp() {
  const firebase = getFirebaseNamespace();
  return firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
}

export function getAuthInstance() {
  const firebase = getFirebaseNamespace();
  return firebase.auth(getFirebaseApp());
}

export function getDbInstance() {
  const firebase = getFirebaseNamespace();
  return firebase.firestore(getFirebaseApp());
}

export function getStorageInstance() {
  const firebase = getFirebaseNamespace();
  return firebase.storage(getFirebaseApp());
}

export function getServerTimestamp() {
  const firebase = getFirebaseNamespace();
  return firebase.firestore.FieldValue.serverTimestamp();
}
