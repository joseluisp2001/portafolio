# Veterinaria Patitas

Sitio de una clínica veterinaria, con página de emergencias.

## Qué resuelve
Nadie llega feliz a una veterinaria. El sitio tiene que **bajar el pulso**, no
subirlo: nada grita, nada apura, nada es rojo.

Estética **suave orgánica**: Nunito, radio 24, sombras blandas y blobs al fondo.

## Qué mirar
- **La paleta viene en pares.** El verde salvia da 2,7:1 y no se lee: un botón
  "Agendar" en ese color es ilegible con sol de mediodía, que es justo cuando
  alguien busca una veterinaria de urgencia. `--salvia` se ve, `--salvia-texto`
  se lee.
- **La carcasa es blanda pero el dato es estricto.** El esquema de vacunación va
  en tabla: radio 8, sin sombra, números tabulares. Sin ese contraste deja de
  leerse "clínica" y pasa a "guardería", y ahí adentro operan.
- **`/emergencias` pesa 141 B**: HTML plano, sin JavaScript propio. El acordeón
  es `<details>`. Alguien con un animal convulsionando a las 11 de la noche no
  navega, busca un número — y esa página abre aunque todo lo demás falle.

## Cómo correrlo

```bash
pnpm install
pnpm dev --port 3012
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
[ferreteria](../ferreteria) ·
[estampados](../estampados)
