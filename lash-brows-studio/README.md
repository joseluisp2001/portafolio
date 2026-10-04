# Lash & Brows Studio

> **Sobre esta copia.** Es el sitio en línea en [lash.desamparadostech.com](https://lash.desamparadostech.com).  Se sacaron el WhatsApp del negocio, las fotos reales, los flujos de n8n (`n8n/`), la infraestructura del servidor (`infra/`) y los scripts de prueba del bot. Las referencias a esas carpetas que siguen abajo quedan como documentación.

Sitio oficial de **Lash & Brows Studio**, estudio de extensiones de pestañas pelo a pelo
y diseño de cejas. Reemplaza al Linktree del negocio: mantiene el "un tap para
actuar" pero con la presencia de una landing de salón.

**La métrica única de éxito es: conversaciones iniciadas por WhatsApp.** Galería,
precios y FAQ existen para bajar la fricción antes de ese tap. El sitio **no**
tiene motor de reservas propio: empuja a WhatsApp con el contexto ya escrito, y
un bot en n8n atiende esa conversación y crea el evento en Google Calendar.

---

## Cómo correrlo

Requiere **Node 20+**.

```bash
pnpm install
```

```bash
cp .env.example .env.local
```

```bash
pnpm dev
```

Queda en <http://localhost:3000>. Funciona sin llenar ninguna variable: el
formulario y la disponibilidad degradan solos (ver más abajo).

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con Turbopack |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint (debe salir sin errores **ni warnings**) |
| `pnpm typecheck` | `tsc --noEmit` |
| `node scripts/check-contrast.mjs` | Verifica la paleta contra WCAG. Corré esto si tocás un color. |
| `node scripts/fetch-images.mjs --blur` | Regenera los previews borrosos tras cambiar una foto |
| `node --experimental-strip-types scripts/sync-bot-prompt.mjs` | **Vuelca precios, duraciones y horario al prompt del bot.** Corré esto cada vez que toques un precio. |
| `node --experimental-strip-types scripts/sync-bot-prompt.mjs --check` | Falla si el prompt del bot quedó desincronizado del config |
| `node scripts/check-n8n.mjs` | Valida la estructura de los cuatro flujos de n8n |
| `node scripts/test-n8n-code.mjs` | Corre el JavaScript de los nodos Code con datos falsos |

---

## Lo que el dueño tiene que reemplazar

Todo el negocio vive en **un solo archivo**: `config/site.ts`. Ningún componente
tiene hardcodeado un teléfono, precio, dirección ni handle. Abrí ese archivo,
buscá `TODO:` con Ctrl+F y vas a encontrar exactamente esto:

> Esta tabla tenía un número de línea por fila. Se quitaron el 6-9-2026: cada
> edición del config los corría, y a esa altura **los quince estaban mal** —
> `testimonials` decía línea 359 cuando estaba en la 550. Una tabla que manda a
> la línea equivocada es peor que no tenerla, porque uno llega, ve otra cosa y
> deja de creerle al documento. Con Ctrl+F sobre el nombre de la clave no hay
> nada que mantener.

| Qué | Por qué importa |
|---|---|
| `whatsappNumber` | **Lo más urgente.** Sin esto, ningún botón del sitio sirve. Formato internacional sin `+` ni espacios: `50688887777`. |
| `brand.logo` | Hoy es un SVG provisional dibujado a mano. |
| `brand.ownerName` | Nombre de la artista. |
| `hero.headline` | El titular que abre el sitio. |
| `hero.socialProof` | "+300 clientas felices" — confirmar la cifra real. |
| `contact.email` | **Vacío a propósito** desde el 8-9-2026: tenía `correo@ejemplo.example`, que no existe, y estuvo publicado. Poner el real hace que el enlace vuelva al pie (ver `Footer.tsx`). |
| `contact.address` | Dirección real. Sale en el bloque de ubicación y en el JSON-LD de Google. |
| `contact.coords`, `wazeUrl`, `googleMapsUrl` | Coordenadas reales. Alimentan el mapa embebido, Waze y Google Maps. |
| `social.instagram` / `facebook` / `tiktok` | Dejar en `""` el que no exista: no se renderiza. |
| `loyalty.url` | **Apagada desde el 9-9-2026.** Tenía `winstamp.com/TODO`, que es un 404, y se publicaba en dos lugares. Para prenderla: poner el enlace real y `loyalty.enabled: true`. |
| ~~`hours`~~ | **Ya no se edita acá.** Desde el 9-9-2026 el horario y el intervalo entre citas se ponen en `/manager`, y se guardan en `uploads/horario.json`. Lo que queda en el config es sólo el valor inicial, el que se usa mientras nadie haya tocado el panel. |
| `services` | **Los precios de las fibras tecnológicas** (hoy provisionales) y **todas las duraciones**, que son estimaciones. El bot las usa para calcular la hora de fin del evento. |
| `about.paragraphs` | La historia real de la artista. |
| `about.stats` | Las tres cifras. |
| `gallery` | Fotos reales. Ver `docs/fotos.md`. |
| `calendar.calendarId` | Correo del calendario de Google del estudio. |
| `faq` | Revisar que cada respuesta coincida con la política real. |
| ~~`testimonials`~~ | **Ya no está en el config.** Hubo seis testimonios de relleno; se borraron el 30-8-2026 y desde el 6-9-2026 las reseñas las escriben las clientas en la propia página (`#resenas`) y Génesis las aprueba en `/manager`. No hay nada que reemplazar acá. |

Las fotos van aparte, en **`docs/fotos.md`**, con la relación de aspecto de
cada archivo.

---

## Desplegar

**Este sitio NO usa Vercel.** Corre en un contenedor Docker sobre un VPS propio
(Ubuntu, Hostinger), detrás de Traefik, en <https://desamparadostech.com>.

Acá había un instructivo de Vercel que sobró de la primera versión del proyecto.
Documentaba un despliegue que nunca existió, que es peor que no documentar
ninguno: quien lo siguiera terminaba con un segundo sitio en otro lado mientras
el de verdad seguía sin actualizarse.

### El procedimiento real

```bash
ssh -i ~/.ssh/aura_hostinger root@IP_DEL_SERVIDOR
```

```bash
cd /root/genesis-site && docker build -t genesis-site .
```

```bash
/root/deploy-site-tls.sh
```

El código llega a `/root/genesis-site` copiándolo desde la laptop (no hay `git
pull` en el servidor). El script recrea el contenedor con sus variables, el
volumen y las etiquetas de Traefik, y al final comprueba solo que el dominio
responda.

| Cosa | Dónde |
| --- | --- |
| Código en el servidor | `/root/genesis-site` (no es un repo git) |
| Script de despliegue | `/root/deploy-site-tls.sh` |
| Variables (incluida `MANAGER_PASSWORD`) | dentro de ese mismo script, como `-e` |
| Reseñas de clientas | `/root/datos/genesis-uploads` → `/app/uploads` |
| Contenedor | `genesis_site`, red `easypanel`, puerto 3001 sólo en localhost |

> [!WARNING]
> **Antes de editar `deploy-site-tls.sh`, leé la nota del vault.** Ese script se
> rompió tres veces por lo mismo: un backslash de continuación que se pierde al
> pasar por capas de escapado. `bash -n` **no** lo detecta — un `docker run`
> cortado a la mitad sigue siendo sintaxis válida. Se detecta con `cat -A`, que
> marca el fin de línea real con `$`.

### Volver atrás

Cada despliegue deja etiquetada la imagen anterior:

```bash
docker tag genesis-site:antes-pie-20260908 genesis-site && /root/deploy-site-tls.sh
```

`/root/datos/genesis-uploads` no se toca al volver: las reseñas se quedan.

> **Ojo con la zona horaria.** El contenedor corre en UTC. Todo cálculo de
> fechas y horas del sitio pasa por `Intl.DateTimeFormat` con
> `timeZone: "America/Costa_Rica"` explícito (ver `lib/hours.ts`). No lo cambies
> por `Date.getHours()` ni por `getDay()`: en el servidor darían seis horas de
> diferencia y el badge "Abierto ahora" mentiría.

---

## El marcador `[ref:...]` — cómo lo lee el bot

Cada mensaje que el sitio genera termina con una línea así:

```
¡Hola! Vengo de la página web y me interesa el servicio de Mega Volumen. ¿Qué disponibilidad tienen?

[ref:svc-mega-volumen]
```

Ese marcador dice **de dónde salió la clienta**. Se genera en
`lib/whatsapp.ts`, es la única forma en que el sitio arma URLs de `wa.me`, y
siempre queda al final, separado por dos saltos de línea.

| `[ref:...]` | Vino de |
|---|---|
| `hero` | El botón principal del hero |
| `header` | El botón del encabezado |
| `menu-movil` | El menú hamburguesa |
| `svc-<slug>` | La tarjeta de un servicio (`svc-mega-volumen`, `svc-rimel`…) |
| `form` | El formulario de reserva |
| `fab` | El botón flotante |
| `linktree` | El bloque de enlaces rápidos |

**El bot debe:**

1. Leer el marcador del **primer mensaje** con `/\[ref:([a-z0-9-]+)\]/`.
2. Usar ese contexto. Si llega `svc-mega-volumen`, ya sabe qué servicio quiere y
   **no debe volver a preguntarlo**. Preguntar algo que la clienta ya eligió en
   la web es la forma más rápida de que se sienta un formulario y no una persona.
3. **Ignorarlo en la conversación visible.** Nunca mencionarlo, nunca repetirlo,
   nunca preguntar qué significa.

---

## Los cuatro flujos de n8n

> **Ya están hechos.** Los cuatro JSON listos para importar están en
> [`n8n/`](n8n/), con su propia guía de montaje en [`n8n/README.md`](n8n/README.md):
> credenciales, variables de entorno, cómo conectar Evolution API y qué vigilar.
> Lo de abajo es la arquitectura; esa guía es el paso a paso.

El sitio sólo **lee** disponibilidad. Quien **crea** el evento en Google Calendar
es siempre n8n. Ninguna credencial de Google toca el frontend.

### Flujo A — Consulta de disponibilidad

Lo llama la web, vía `N8N_AVAILABILITY_URL`.

```
Webhook (GET)
  └─ Google Calendar: Get Many / FreeBusy   (sobre `calendarId`, rango del día pedido)
      └─ Code                                (resta ocupados de las franjas de site.hours,
      │                                       aplicando bufferMinutes y durationMinutes)
          └─ Respond to Webhook              (JSON de slots)
```

La web le manda por query string: `date`, `serviceSlug`, `durationMinutes`,
`bufferMinutes`, `timezone` y **`candidates`** — las horas que el horario del
estudio permite, ya calculadas desde `site.hours`. Gracias a eso n8n no necesita
conocer el horario: sólo tacha las candidatas que chocan con un evento del
calendario. Sin `candidates` habría dos copias del horario y se desincronizarían.

Tiene que responder en **menos de 3 segundos** o el sitio lo da por perdido.

### Flujo B — Captura de leads

Lo llama la web, vía `N8N_WEBHOOK_URL`.

```
Webhook (POST)
  └─ Guardar el lead      (Sheets / Airtable / Notion)
      └─ Notificar al estudio
```

**Este flujo no crea el evento.** Sólo registra la intención, porque la
conversación real sigue en WhatsApp y ahí puede cambiar todo.

### Flujo C — Agendamiento por WhatsApp (el bot)

```
WhatsApp Trigger
  └─ AI Agent   (modelo de chat + memoria por número de teléfono)
       ├─ Google Calendar: Get Many        → herramienta `consultar_disponibilidad`
       ├─ Google Calendar: Create Event    → herramienta `agendar_cita`
       ├─ Google Calendar: Update Event    → herramienta `reprogramar_cita`
       └─ Google Calendar: Delete Event    → herramienta `cancelar_cita`
```

El **System Prompt** del agente debe:

- Hablar como una recepcionista tica real: cálida, frases cortas, máximo un emoji.
- Seguir el usted/vos que use la clienta.
- **Nunca decir que es un bot ni un asistente de IA.**
- Confirmar siempre **servicio + fecha + hora** antes de crear el evento.
- No ofrecer horas fuera de `site.hours`.
- No agendar con menos de `minNoticeHours` (4 h) de anticipación.
- Pedir el nombre completo si no lo tiene.
- Cerrar repitiendo la cita confirmada.
- Si detecta `[ref:...]` en el primer mensaje, usar ese contexto y no volver a
  preguntar lo que la web ya sabe.

### Flujo D — Recordatorio

```
Schedule Trigger (diario)
  └─ Google Calendar: Get Many   (eventos de mañana)
      └─ WhatsApp: mensaje de recordatorio   (con opción de confirmar o reprogramar)
```

---

## Contrato de los dos endpoints

### `GET /api/availability`

**Petición**

```
GET /api/availability?date=2026-09-12&serviceSlug=mega-volumen
```

**Respuesta — siempre `200`**

```json
{
  "date": "2026-09-12",
  "slots": [
    { "start": "09:00", "available": true },
    { "start": "11:30", "available": false }
  ],
  "degraded": false,
  "source": "calendar"
}
```

| Campo | Qué significa |
|---|---|
| `slots[].start` | Hora de inicio en 24 h, zona `America/Costa_Rica` |
| `slots[].available` | `false` = ya hay una cita ahí |
| `degraded` | `true` = los datos **no** vienen del calendario real |
| `source` | `"calendar"` si contestó n8n, `"local"` si salieron de `site.hours` |

**Este endpoint nunca devuelve 500.** Si n8n falla, tarda más de 3 s o la
variable no está configurada, responde `200` con `degraded: true` y el
formulario sigue usable. La disponibilidad es una ayuda, no un requisito.

Sin `N8N_AVAILABILITY_URL` configurada devuelve los espacios que permite el
horario del config, todos disponibles y marcados `degraded: true`, para poder
ver y probar la UI sin backend.

Cachea con `s-maxage=60, stale-while-revalidate=300`. Las respuestas degradadas
van con `no-store`, para que un hipo de red no quede cacheado un minuto.

### `POST /api/lead`

**Petición** (lo que manda el formulario)

```json
{
  "name": "Ana Rodríguez",
  "phone": "88887777",
  "serviceSlug": "mega-volumen",
  "preferredDate": "2026-09-12",
  "preferredTime": "14:00",
  "notes": "Es mi primera vez"
}
```

**Lo que el servidor reenvía a n8n** (enriquecido)

```json
{
  "source": "website",
  "ref": "form",
  "name": "Ana Rodríguez",
  "phone": "50688887777",
  "service": "Mega Volumen",
  "serviceSlug": "mega-volumen",
  "durationMinutes": 150,
  "preferredDate": "2026-09-12",
  "preferredTime": "14:00",
  "timezone": "America/Costa_Rica",
  "notes": "Es mi primera vez",
  "userAgent": "...",
  "submittedAt": "2026-09-01T14:32:00.000Z"
}
```

`durationMinutes` sale de `site.services[].durationMinutes` y viaja a propósito:
es lo que le permite a n8n calcular la hora de fin del evento sin adivinar.
El código de país lo antepone el servidor, no el navegador.

**Respuesta**

```json
{ "ok": true, "forwarded": true }
```

`forwarded: false` significa que el webhook no estaba configurado o no
respondió. Sigue siendo `200`: **el navegador redirige a WhatsApp pase lo que
pase.** Un webhook caído no puede costar una clienta. Lo único que devuelve
`400` es un cuerpo mal formado, que sería un bug del propio sitio.

---

## Cómo está armado

```
app/
  layout.tsx            fuentes, metadata, JSON-LD base
  page.tsx              la única ruta — Server Component, arma las 13 secciones
  globals.css           TODOS los tokens de diseño (Tailwind v4 @theme)
  opengraph-image.tsx   tarjeta social generada con ImageResponse
  api/availability/     lee disponibilidad de n8n
  api/lead/             registra el lead en n8n
components/             un componente por archivo
config/site.ts          ÚNICA fuente de verdad del negocio
lib/                    utilidades puras (whatsapp, hours, format, motion…)
hooks/                  useReducedMotion
scripts/                herramientas de mantenimiento, no corren en el build
```

### Decisiones que conviene conocer antes de tocar nada

**La paleta tiene dos colores que el brief no pedía.** `rose` (#C98B87) da
2.59:1 sobre `cream` y `gold` (#C9A227) da 2.25:1: ninguno de los dos puede
cargar texto sin romper WCAG AA. Se agregaron `rose-ink` (#9A524C) y `gold-ink`
(#9A7818) — el mismo tono, oscurecido lo justo — para eyebrows, estrellas y el
anillo de foco. `rose` y `gold` quedaron sólo como relleno decorativo.
`node scripts/check-contrast.mjs` verifica los 15 pares y falla si alguno no
llega a su umbral.

**`hours` es más rico que en el brief.** Además del texto que ve la clienta
(`display`), cada regla trae `weekdays` y `open`/`close` en 24 h. Sin eso no se
puede calcular "Abierto ahora", ni generar espacios, ni armar el
`openingHoursSpecification` del JSON-LD, ni bloquear los domingos.

**Las fechas no pasan por `new Date("2026-09-12")`.** Eso se interpreta como
medianoche UTC y en Costa Rica saldría el día anterior. `lib/format.ts` las
ancla al mediodía UTC; `lib/hours.ts` es el único que consulta la zona real.

**El acordeón del FAQ sí anima `height`.** La regla de "no animar height" es
para el scroll. En un acordeón disparado por click es el único camino razonable,
y Motion lo resuelve con `ResizeObserver`, no recalculando layout por cuadro.

**Los previews borrosos están precalculados.** `next/image` sólo genera el blur
solo cuando la imagen se importa como módulo, y acá las rutas viven en el config
como strings. `lib/blur-data.ts` es **generado** — no lo edites a mano.

### Accesibilidad

Está verificado, no asumido: navegación completa por teclado (header, menú
móvil, formulario, visor de galería y acordeón), focus trap con devolución del
foco en el menú y el visor, un solo `<h1>`, áreas táctiles de 44px, `alt`
descriptivo en toda imagen y contraste AA en los 15 pares de la paleta. Con
`prefers-reduced-motion: reduce` no hay parallax ni marquee en movimiento:
quedan sólo fades de 150 ms.

### Lo que el sitio no hace, a propósito

No tiene motor de reservas, ni pagos, ni login, ni base de datos. No escribe
contra la API de Google Calendar. Sólo **lee** disponibilidad a través de n8n.
Quien crea el evento es n8n, por el formulario o por el bot de WhatsApp.
