# =============================================================================
#  Imagen del sitio de Desamparados Tech — Next.js standalone
#
#  Multi-stage: se instala y compila en una etapa, y la imagen final sólo copia
#  el resultado standalone. Corre como usuario sin privilegios.
#
#  Build:  docker build -t desamparados-tech .
#  Run:    docker run -d --name desamparados_tech -p 3001:3000 desamparados-tech
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
RUN mkdir -p .next/cache/images && chown -R nextjs:nodejs .next

# Las fotos de producto que sube AdminSQlito se guardan acá. Con la carpeta de
# root, la API devolvía 500 con EACCES y NINGUNA foto se podía subir.
# Ojo: en el servidor esta ruta va montada a /root/datos/tech-productos, porque
# lo que quede dentro del contenedor se pierde al reconstruir la imagen.
RUN mkdir -p public/productos && chown -R nextjs:nodejs public/productos

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
