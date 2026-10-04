# Enfermería a domicilio

Sitio de una enfermera que atiende en casa: servicios, duración, precio y
contacto por WhatsApp.

## Qué resuelve
Quien busca enfermería a domicilio suele estar cuidando a otra persona y tiene
poco tiempo. El sitio responde rápido tres preguntas: qué se hace, cuánto dura y
qué hay que tener listo antes de la visita.

Estética **clínico legible**: letra grande, contraste alto y nada decorativo que
compita con el dato.

## Qué mirar
- **`scripts/check-config.mjs` no deja compilar sin los datos legales.**
  Enfermería es una profesión regulada: sin nombre y número de incorporación al
  colegio profesional, el build falla.
- Con `demo: true` el sitio avisa arriba de todo que los datos son de ejemplo.
  Un número de incorporación inventado que se lee como real es justo lo que
  este proyecto existe para evitar.
- Cada servicio dice si **requiere receta**, en la tarjeta y no en letra chica.
- Cada servicio trae la lista de **qué preparar** antes de la visita: es lo que
  evita la visita perdida.

## Cómo correrlo

```bash
pnpm install
pnpm dev --port 3017
```

## Antes de publicar

```bash
pnpm check      # falla si falta un dato legal o el WhatsApp
pnpm lint
pnpm typecheck
pnpm build
```

En esta copia el WhatsApp está vacío a propósito, así que `pnpm build` se
detiene en `check`. `pnpm dev` funciona igual.
