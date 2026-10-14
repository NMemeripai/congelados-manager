# Producción Manager

Sistema para negocios que **producen y venden** (pastas, panificados, viandas, etc.): calcula cuánto te cuesta producir cada producto, te sugiere el precio con tu porcentaje de ganancia, registra ventas y gastos y te arma el resumen de cada mes.

Está construido sobre la misma base que Barber Manager IA (React + Vite + Tailwind + Firebase Realtime Database), pero es un proyecto y una base de datos aparte.

## Cómo se usa

1. **Insumos**: cargás lo que comprás y su costo (harina $X el kg, huevos $X la docena…).
2. **Productos**: armás la receta de una tanda (qué insumos lleva, cuánto rinde, otros costos como gas o packaging) y tu % de ganancia. El sistema calcula el **costo por kg** y el **precio sugerido**. Podés fijar un precio a mano; si queda por debajo de tu objetivo te avisa.
3. **Ventas**: registrás qué vendiste, cuánto y a qué precio. Cada venta **guarda el costo de ese día**, así la ganancia de meses anteriores no cambia cuando suben los insumos.
4. **Gastos**: alquiler, sueldos, impuestos, etc. (lo que no está en las recetas).
5. **Resumen**: ingresos, costo de lo vendido, gastos, ganancia neta y margen de cada mes, gráfico de 12 meses, tabla mes a mes y ranking de productos.

### Markup vs margen

- **Markup** (lo que se carga en la receta): cuánto le sumás al costo. Costo $10.000 + 40% = precio $14.000.
- **Margen**: qué parte del precio es ganancia. En ese mismo ejemplo, $4.000 / $14.000 = 28,6%.

El sistema muestra los dos para que no haya confusión.

### Cuentas del resumen

```
Ganancia bruta = Ingresos − Costo de producción de lo vendido
Ganancia neta  = Ganancia bruta − Gastos fijos del mes
Margen neto    = Ganancia neta / Ingresos
```

> La compra de insumos **no** se carga como gasto: ya está contada como costo de cada venta. Cargarla en los dos lados duplica el costo.

## Puesta en marcha

1. Creá un **proyecto nuevo** en [Firebase Console](https://console.firebase.google.com) (no uses el de la barbería).
2. Activá **Authentication → Email/contraseña** y creá un usuario.
3. Creá una **Realtime Database** y pegá las reglas de `database.rules.json` en la pestaña Reglas.
4. Registrá una app web, copiá `.env.example` a `.env` y completá los datos.
5. Instalá y levantá:

```bash
npm install
npm run dev
```

Para publicarlo, sirve el mismo deploy que Barber Manager (Render o Vercel): build `npm run build`, carpeta `dist`, y cargá las variables `VITE_FIREBASE_*` en el panel. Como es una SPA, configurá la regla de rewrite de todas las rutas a `/index.html`.

## Estructura

```
src/
  lib/costeo.js        ← toda la lógica de números (costeo, unidades, resumen mensual)
  pages/               ← Resumen, Ventas, Gastos, Productos, Insumos, Login
  services/            ← lectura/escritura en Firebase por colección
  hooks/useColeccion.js← escucha en tiempo real cada colección
  firebase/            ← config, auth y helpers (igual que Barber Manager)
  components/          ← UI y layout (sidebar en PC, barra inferior en celular)
```

### Datos en Firebase

| Path | Campos principales |
|---|---|
| `insumos` | nombre, unidad (kg/g/l/ml/u/docena), costo, proveedor, precioActualizado |
| `productos` | nombre, unidadVenta, rinde, ingredientes[{insumoId, cantidad, unidad}], costosExtra, markupObjetivo, precioVenta |
| `ventas` | fecha (YYYY-MM-DD), cliente, metodoPago, items[{productoId, nombre, unidad, cantidad, precioUnit, costoUnit}], total, costoTotal, ganancia |
| `gastos` | fecha, categoria, descripcion, monto |

## Próximo paso posible

Conectar WhatsApp con el mismo pipeline de n8n + Gemini de Barber Manager, para que un mensaje como *"vendí 3 kg de ravioles de verdura a 9000"* cree la venta en `ventas` con el formato de arriba.
