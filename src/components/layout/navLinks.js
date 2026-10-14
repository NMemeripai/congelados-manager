import { LayoutDashboard, ShoppingCart, Receipt, ChefHat, Wheat } from "lucide-react";

export const LINKS = [
  { to: "/", label: "Resumen", icon: LayoutDashboard },
  { to: "/ventas", label: "Ventas", icon: ShoppingCart },
  { to: "/gastos", label: "Gastos", icon: Receipt },
  { to: "/productos", label: "Productos", icon: ChefHat },
  { to: "/insumos", label: "Insumos", icon: Wheat },
];
