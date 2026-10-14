import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Resumen from "./pages/Resumen";
import Ventas from "./pages/Ventas";
import Gastos from "./pages/Gastos";
import Productos from "./pages/Productos";
import Insumos from "./pages/Insumos";

const privada = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={privada(<Resumen />)} />
          <Route path="/ventas" element={privada(<Ventas />)} />
          <Route path="/gastos" element={privada(<Gastos />)} />
          <Route path="/productos" element={privada(<Productos />)} />
          <Route path="/insumos" element={privada(<Insumos />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
