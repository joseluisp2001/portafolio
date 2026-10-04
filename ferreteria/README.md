# Ferretería El Tornillo

Catálogo denso de ferretería con búsqueda, filtros y cotización.

## Qué resuelve
Quien entra a una ferretería en línea **ya sabe qué quiere** y muchas veces está
apurado. No hay antojo que provocar: hay una búsqueda que resolver, y cada píxel
de decoración aleja el resultado.

Estética **catálogo denso**: el buscador ocupa el lugar donde los otros ponen la
foto grande. Filas de 56 px, precios en columna, cero animación.

## Qué mirar
- **Todo el estado vive en la URL.** Atrás vuelve a la búsqueda con sus
  resultados, y el enlace se puede pegar en un chat. Sin eso, en celular "atrás"
  saca del sitio y se pierde todo lo cargado.
- **Un artículo = una URL = una página estática.** 58 páginas generadas al
  compilar, para que alguien que busca una medida concreta caiga en el artículo
  y no en la portada.
- Cada filtro dice cuántos resultados deja, y los que darían cero se
  deshabilitan en vez de desaparecer.
- Los campos van a 16 px **sin excepción**: Safari en iPhone hace zoom automático
  por debajo de eso, y acá el elemento principal del sitio es un campo.
- El naranja nunca es letra (2,6:1). Es píldora con texto oscuro encima.

## Cómo correrlo

```bash
pnpm install
pnpm dev --port 3013
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
[barberia](../barberia) ·
[veterinaria](../veterinaria) ·
[estampados](../estampados)
