import { ShoppingCart, Receipt, PackagePlus, Factory } from "lucide-react";

/** Acciones rápidas: abren el formulario correspondiente en su pantalla. */
export const ACCIONES = [
  { label: "Venta", desc: "Registrar lo que vendiste", icon: ShoppingCart, to: "/ventas?nuevo=1" },
  { label: "Gasto", desc: "Alquiler, luz, sueldos…", icon: Receipt, to: "/gastos?nuevo=1" },
  { label: "Compra de insumo", desc: "Suma stock y actualiza el costo", icon: PackagePlus, to: "/movimientos?compra=1" },
  { label: "Producción", desc: "Tandas hechas: suma stock", icon: Factory, to: "/movimientos?produccion=1" },
];
