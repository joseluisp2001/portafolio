# Desamparados Tech

Sitio de un servicio técnico de computadoras en Desamparados: formateo,
limpieza, rescate de datos, armado de equipos, redes, cámaras, bots de WhatsApp
y desarrollo web. Cada servicio lleva una escena animada propia en vez de una
foto.

**Next.js 15 · React 19 · TypeScript · Tailwind v4.** En línea en
[desamparadostech.com](https://desamparadostech.com).

## Qué mirar en el código

- `config/site.ts`: única fuente de verdad del negocio. En esta copia el
  WhatsApp y el correo están vacíos o son de ejemplo.
- `components/escenas/`: las trece escenas animadas de los servicios.
- `sql/` y `lib/productos.ts`: catálogo de productos con datos de ejemplo.

## Cómo correrlo

Requiere Node 20 o superior y pnpm.

```bash
pnpm install
```

```bash
pnpm dev
```
