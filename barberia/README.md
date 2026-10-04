# Barbería El Corte

Sitio de una barbería: precios, horario y reserva por WhatsApp.

## Qué resuelve
La barbería moderna se vende como oficio. El lenguaje visual de taller —rejilla,
monoespaciada, mayúsculas, un solo color de señalización— dice eso sin
escribirlo.

Estética **brutalista**: negro, Archivo Black, radio 0, celdas que se tocan
compartiendo bordes, y transiciones de 90 ms sin suavizado.

## Qué mirar
- **El paso de la grilla de horas depende de la duración del servicio**, no es
  fijo. Con un paso fijo de 3 h, un servicio de 15 min solo se puede reservar
  tres veces al día donde caben doce — y los cortos son los que llenan huecos.
- El anillo de foco va **por dentro** (`outline-offset` negativo): hacia afuera
  se monta sobre la celda vecina.
- Los párrafos largos no usan el blanco puro: 17,4:1 sobre negro produce
  halación y cansa.
- El error no agrega rojo. La estética tiene tres colores y se respeta.

## Cómo correrlo

```bash
pnpm install
pnpm dev --port 3011
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
propósito. Los otros: [soda](../soda) ·
[veterinaria](../veterinaria) ·
[ferreteria](../ferreteria) ·
[estampados](../estampados)
