import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator } from "lucide-react";
import Card from "../components/ui/Card";
import { Input } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Aviso from "../components/ui/Aviso";
import { login } from "../firebase/auth";

const MENSAJES = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/wrong-password": "Email o contraseña incorrectos.",
  "auth/user-not-found": "No existe un usuario con ese email.",
  "auth/invalid-email": "El email no es válido.",
  "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos y probá de nuevo.",
  "auth/network-request-failed": "Sin conexión. Revisá internet y probá de nuevo.",
  "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase (Authentication → Dominios autorizados).",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(MENSAJES[err?.code] || `No se pudo ingresar (${err?.code || "error"}).`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-surface-subtle p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Calculator size={22} aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Producción Manager</h1>
          <p className="text-sm text-ink-500">Ingresá para ver tus números</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contraseña" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && (
            <Aviso tipo="error" role="alert">
              {error}
            </Aviso>
          )}
          <Button type="submit" loading={loading} className="mt-1 w-full">
            Ingresar
          </Button>
        </form>
      </Card>
    </main>
  );
}
