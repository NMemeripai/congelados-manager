// src/services/ventasService.js
import { createDoc, updateDocById, deleteDocById, listenToCollection } from "../firebase/database";

export const PATH = "ventas";

export const listen = (callback, onError) => listenToCollection(PATH, callback, onError);
export const crear = (data) => createDoc(PATH, data);
export const actualizar = (id, data) => updateDocById(PATH, id, data);
export const eliminar = (id) => deleteDocById(PATH, id);
