// src/firebase/auth.js
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "./config";

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getUsuarioData(uid) {
  const snap = await get(ref(db, `usuarios/${uid}`));
  return snap.exists() ? snap.val() : null;
}
