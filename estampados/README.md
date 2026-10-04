# Muestrario de Estampados

Panel privado para cargar y ordenar estampados de tela.

## Qué resuelve
No es un sitio público: es una herramienta de trabajo. Subir la imagen, ponerle
código, motivo, colores y el tamaño del repetido, y que quede ordenado y
buscable.

Estética **muestrario**: el sitio **no tiene color propio** —papel, tinta y
gris— porque cualquier color de la interfaz compite con la tela. Los recuadros se
tocan sin separación, como un muestrario real.

## Qué mirar
- **Todo detrás de contraseña, fallando cerrado**: sin `ADMIN_USER` o
  `ADMIN_PASSWORD` devuelve 401 en vez de dejar entrar.
- **Las imágenes van fuera de `public/`.** Next indexa esa carpeta al arrancar,
  así que un archivo escrito después da 404 hasta reiniciar; y el contenedor se
  recrea en cada despliegue.
- **Un JSON por estampado, no un índice único.** Con un índice, dos subidas
  simultáneas se pisan y se pierde un registro.
- Se validan los *magic bytes*, no la extensión: un `.txt` renombrado a `.jpg`
  se rechaza.
- El `DELETE` borra el registro **y las dos imágenes**, para que el volumen no
  se llene de archivos huérfanos.
- El campo "repetido en cm" existe porque sin él una foto de estampado no dice
  nada: no se sabe si la flor mide 2 cm o 20.

Usa `sharp` para generar la miniatura.

## Cómo correrlo

```bash
pnpm install
pnpm dev --port 3014
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
[ferreteria](../ferreteria) ·
[estampados](../estampados)
