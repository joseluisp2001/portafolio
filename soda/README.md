# Soda La Esquina

Sitio de una soda: carta, menú del día y pedido por WhatsApp.

## Qué resuelve
Una soda compite con la de la esquina, y no por precio: por **antojo y
confianza**. El sitio pone el peso visual en lo único que cambia todos los días
—el menú del día— y arma el pedido para que la clienta no tenga que escribirlo.

La estética es **editorial cálido**: papel crema, Fraunces + Inter, radio de 2 px
y cero sombras. La línea de plato lleva puntos guía del nombre al precio, como
una carta impresa.

## Qué mirar
- **El carrito guarda solo `{id, cantidad}`** y reconstruye el precio desde la
  carta al cargar. Guardar el precio congelado hace que un pedido viejo llegue
  con el total de la semana pasada.
- Las acciones del carrito usan la forma funcional de `setState`: sin eso, tres
  toques rápidos en "+" guardan uno solo.
- Los colones se formatean a mano. `toLocaleString('es-CR')` separa los miles
  con **espacio** y muestra `₡2 500`, que se lee como dos números.
- Hoja de estilos de impresión: la carta se imprime y se pega en la pared.

## Cómo correrlo

```bash
pnpm install
pnpm dev --port 3010
```

## Antes de publicar

```bash
pnpm check      # falla si quedó algún dato de relleno
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm build` corre `check` primero, así que un dato de relleno no puede llegar a
producción por descuido.

## Cómo está armado

- **Next.js 15 + TypeScript + Tailwind v4.** Sin dependencias más allá de React y
  Next, salvo donde se indique.
- **`config/site.ts` es la única fuente de verdad** de los datos del negocio.
  Lo que no tenga dato real **se apaga, no se rellena**.
- Todo lo que va a WhatsApp pasa por `lib/whatsapp.ts`. Ningún componente
  escribe `wa.me` a mano.
- `not-found.tsx` y `error.tsx` en español, con camino de vuelta.
- `/api/health` para el monitoreo.
- `prefers-reduced-motion` respetado.
- Contrastes verificados contra WCAG AA **antes** de escribir el código.

---

Parte de una serie de cinco sitios con identidades visuales distintas a
propósito. Los otros: [barberia](../barberia) ·
[veterinaria](../veterinaria) ·
[ferreteria](../ferreteria) ·
[estampados](../estampados)
