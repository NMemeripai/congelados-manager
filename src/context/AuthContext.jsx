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
        const datos = await getUsuarioData(firebaseUser.uid);
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
