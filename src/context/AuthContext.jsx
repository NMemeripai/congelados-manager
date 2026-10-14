import { createContext, useContext, useEffect, useState } from "react";
import { watchAuthState, getUsuarioData, logout as firebaseLogout } from "../firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        // Si la base no deja leer (reglas sin publicar), igual entramos: los datos extra son opcionales.
        const datos = await getUsuarioData(firebaseUser.uid).catch((e) => {
          console.warn("No se pudieron leer los datos del usuario:", e);
          return null;
        });
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...datos });
        setRol(datos?.rol || null);
      } else {
        setUser(null);
        setRol(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function logout() {
    await firebaseLogout();
  }

  return (
    <AuthContext.Provider value={{ user, rol, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
