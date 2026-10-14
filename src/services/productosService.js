// src/services/productosService.js
import { createDoc, updateDocById, deleteDocById, listenToCollection } from "../firebase/database";

export const PATH = "productos";

export const listen = (callback, onError) => listenToCollection(PATH, callback, onError);
export const crear = (data) => createDoc(PATH, data);
export const actualizar = (id, data) => updateDocById(PATH, id, data);
export const eliminar = (id) => deleteDocById(PATH, id);
