import { LayoutDashboard, ShoppingCart, Receipt, ChefHat, Wheat, ArrowLeftRight, Boxes } from "lucide-react";

/** Escritorio: todas las secciones en la barra lateral. */
export const LINKS = [
  { to: "/", label: "Resumen", icon: LayoutDashboard },
  { to: "/ventas", label: "Ventas", icon: ShoppingCart },
  { to: "/gastos", label: "Gastos", icon: Receipt },
  { to: "/productos", label: "Productos", icon: ChefHat },
  { to: "/insumos", label: "Insumos", icon: Wheat },
  { to: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
];

/** Celular: 4 secciones + botón de acción rápida en el medio. */
export const LINKS_MOVIL = [
  { to: "/", label: "Resumen", icon: LayoutDashboard },
  { to: "/ventas", label: "Ventas", icon: ShoppingCart },
  { to: "/productos", label: "Inventario", icon: Boxes, match: ["/productos", "/insumos", "/movimientos"] },
  { to: "/gastos", label: "Gastos", icon: Receipt },
];

export const INVENTARIO_TABS = [
  { to: "/productos", label: "Productos" },
  { to: "/insumos", label: "Insumos" },
  { to: "/movimientos", label: "Movimientos" },
];
