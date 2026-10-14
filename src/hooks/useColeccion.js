import { useEffect, useState } from "react";
import { listenToCollection } from "../firebase/database";

/** Escucha en tiempo real un path de Realtime Database ("insumos", "ventas", etc.). */
export function useColeccion(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = listenToCollection(
      path,
      (items) => {
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, [path]);

  return { data, loading, error };
}

export const useInsumos = () => useColeccion("insumos");
export const useProductos = () => useColeccion("productos");
export const useVentas = () => useColeccion("ventas");
export const useGastos = () => useColeccion("gastos");
