# =============================================================================
#  Imagen del sitio de Génesis Roca — Next.js standalone
#
#  Multi-stage: se instala y compila en una etapa, y la imagen final sólo copia
#  el resultado standalone. Corre como usuario sin privilegios.
#
#  Build:  docker build -t genesis-site .
#  Run:    docker run -d --name genesis_site -p 3001:3000 genesis-site
# =============================================================================

FROM node:22-alpine AS deps
WORKDIR /app
# libc6-compat: algunas dependencias nativas (sharp) lo piden en Alpine.
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# El server standalone escucha en 0.0.0.0:3000 dentro del contenedor.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# El standalone trae su propio server.js y el subconjunto de node_modules.
# `static` y `public` no van dentro del standalone: se copian al lado.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Next escribe acá el cache de imágenes optimizadas. Los COPY de arriba dejan
# todo como root, así que sin este chown el usuario `nextjs` no puede crear el
# directorio: el optimizador lanza EACCES como unhandledRejection y, en Node 22,
# eso TUMBA EL PROCESO. Es decir, la página se caía sola la primera vez que
# alguien cargaba una imagen que todavía no estaba cacheada.
#
# `uploads/resenas` es exactamente el mismo problema, y por eso va acá al lado.
# `lib/resenas.ts` escribe en process.cwd()/uploads/resenas — o sea /app/uploads/
# resenas— y hace `mkdir` al arrancar. Sin este `mkdir` + `chown`, el usuario
# `nextjs` no puede crear esa carpeta dentro de un /app que es de root.
#
# Y no fallarían solo las reseñas: `app/page.tsx` llama a `listar()`, que crea la
# carpeta, así que el EACCES revienta el render de la PORTADA. El sitio entero
# saldría 500. Se creó y se dio permiso ANTES del `USER nextjs`, que es el único
# momento en que todavía somos root.
RUN mkdir -p .next/cache/images uploads/resenas \
  && chown -R nextjs:nodejs .next uploads

# El volumen se monta acá. Declararlo deja constancia de que esta carpeta es la
# única con datos que NO se pueden perder: las reseñas que escribieron las
# clientas. Sin el volumen, cada despliegue las borra — lo mismo que ya pasó una
# vez con las fotos de shein.
VOLUME ["/app/uploads"]

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
