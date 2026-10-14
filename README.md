# Producción Manager

Sistema para negocios que **producen y venden** (pastas, panificados, viandas, etc.): calcula cuánto te cuesta producir cada producto, te sugiere el precio con tu porcentaje de ganancia, registra ventas y gastos y te arma el resumen de cada mes.

Está construido sobre la misma base que Barber Manager IA (React + Vite + Tailwind + Firebase Realtime Database), pero es un proyecto y una base de datos aparte.

## Cómo se usa

> Diseñado **mobile first**: en el celular hay barra inferior con un botón **+** para cargar rápido (venta, gasto, compra de insumo o producción). En la PC, barra lateral.

1. **Insumos**: cargás lo que comprás y su costo (harina $X el kg, huevos $X la docena…).
2. **Productos**: armás la receta de una tanda (qué insumos lleva, cuánto rinde, otros costos como gas o packaging) y tu % de ganancia. El sistema calcula el **costo por kg** y el **precio sugerido**. Podés fijar un precio a mano; si queda por debajo de tu objetivo te avisa.
3. **Ventas**: registrás qué vendiste, cuánto y a qué precio. Cada venta **guarda el costo de ese día**, así la ganancia de meses anteriores no cambia cuando suben los insumos.
4. **Gastos**: alquiler, sueldos, impuestos, etc. (lo que no está en las recetas).
5. **Inventario**: cada **compra de insumo** suma stock y actualiza el costo; cada **producción** suma stock al producto y descuenta los insumos de la receta; cada **venta** descuenta stock (y lo devuelve si se borra). Todo en escrituras atómicas. Podés poner un stock mínimo para recibir alertas.
6. **Resumen**: ingresos, costo de lo vendido, gastos, ganancia neta y margen de cada mes, gráfico de 12 meses, tabla mes a mes y ranking de productos.

### Markup vs margen

- **Markup** (lo que se carga en la receta): cuánto le sumás al costo. Costo $10.000 + 40% = precio $14.000.
- **Margen**: qué parte del precio es ganancia. En ese mismo ejemplo, $4.000 / $14.000 = 28,6%.

El sistema muestra los dos para que no haya confusión.

### Dashboard

Filtra por **día, semana, mes, año o rango personalizado** (el período elegido se comparte entre Resumen, Ventas, Gastos y Movimientos). Muestra ingresos, gastos operativos, costo de lo vendido, ganancia bruta y neta, margen, valor del inventario y fiado por cobrar; responde si estás ganando o perdiendo, los productos más rentables, los gastos a controlar (con variación contra el período anterior), alertas de stock y precios desactualizados, y el resumen mes a mes.

### Accesibilidad

Referencia WCAG 2.2 AA: etiquetas visibles asociadas, errores por campo, foco visible y atrapado en los diálogos (Escape cierra), objetivos táctiles de 44 px, “saltar al contenido”, gráfico con vista de tabla, respeto por *reducir movimiento*. Auditado con axe-core en 360 px y 1366 px: 0 problemas.

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
| `compras` | fecha, insumoId, nombre, unidad, cantidad, costoUnit, total, proveedor |
| `producciones` | fecha, productoId, nombre, unidad, tandas, cantidad, costoUnit, costoTotal, consumos[{insumoId, nombre, unidad, cantidad}] |

`insumos` y `productos` además tienen `stock` y `stockMinimo`. Las ventas en cuenta corriente llevan `cobrada`.

## Carga por voz

En **Nueva venta** y **Nuevo gasto** hay un botón 🎤. Dictás *"vendí 2 kilos de ravioles de verdura a 9000, pagó con transferencia"* y el formulario se completa solo; revisás y guardás. También se puede escribir la frase.

- El dictado lo hace el navegador (gratis). Funciona en Chrome/Edge, en PC y Android. En Firefox solo se puede escribir.
- **Sin configurar nada** usa un intérprete básico que entiende frases típicas (cantidades, "kilo y medio", "9 mil", "ayer", forma de pago, cliente).
- **Con IA (recomendado)**: importá `n8n/carga-por-voz.json` en n8n, pegá tu API key de Gemini en el nodo *Gemini*, activá el workflow y cargá la URL *Production* del webhook en la variable `VITE_VOZ_WEBHOOK_URL` (Render → Environment) y redeployá. Si n8n no responde, la app vuelve sola al modo básico.

## Próximo paso posible

Conectar WhatsApp con el mismo pipeline de n8n + Gemini de Barber Manager, para que un mensaje como *"vendí 3 kg de ravioles de verdura a 9000"* cree la venta en `ventas` con el formato de arriba.
