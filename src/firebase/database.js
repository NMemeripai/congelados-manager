// src/firebase/database.js
// Helpers genéricos de acceso a Realtime Database, con la misma "forma" de
// funciones que usaban los servicios cuando el proyecto usaba Firestore
// (createDoc, updateDocById, deleteDocById, getAllDocs, listenToCollection),
// para que el resto de la app no tenga que cambiar casi nada.

import {
  ref,
  push,
  set,
  update,
  remove,
  get,
  onValue,
  query,
  orderByChild,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";
import { db } from "./config";

function pathRef(path) {
  return ref(db, path);
}

function snapshotToArray(snapshot) {
  const val = snapshot.val();
  if (!val) return [];
  const arr = Object.entries(val).map(([id, data]) => ({ id, ...data }));
  // Orden por fecha de creación descendente (más reciente primero),
  // igual que se hacía antes con Firestore.
  return arr.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
}

export async function createDoc(path, data) {
  const listRef = pathRef(path);
  const newRef = push(listRef);
  await set(newRef, {
    ...data,
    creadoEn: rtdbServerTimestamp(),
    actualizadoEn: rtdbServerTimestamp(),
  });
  return newRef.key;
}

export async function updateDocById(path, id, data) {
  await update(pathRef(`${path}/${id}`), {
    ...data,
    actualizadoEn: rtdbServerTimestamp(),
  });
}

export async function deleteDocById(path, id) {
  await remove(pathRef(`${path}/${id}`));
}

export async function getDocById(path, id) {
  const snap = await get(pathRef(`${path}/${id}`));
  if (!snap.exists()) return null;
  return { id, ...snap.val() };
}

export async function getAllDocs(path) {
  const snap = await get(pathRef(path));
  return snapshotToArray(snap);
}

/**
 * Suscripción en tiempo real a un "path" (equivalente a colección).
 * Devuelve la función unsubscribe.
 */
export function listenToCollection(path, callback, onError) {
  const r = pathRef(path);
  const unsubscribe = onValue(
    r,
    (snapshot) => {
      callback(snapshotToArray(snapshot));
    },
    (error) => {
      console.error(`Error leyendo "${path}":`, error);
      if (onError) onError(error);
      else callback([]); // evita quedar "cargando" para siempre
    }
  );
  return unsubscribe;
}

export { ref, push, set, update, remove, get, query, orderByChild, rtdbServerTimestamp as serverTimestamp };
