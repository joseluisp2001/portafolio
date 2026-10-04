# Portafolio — José Luis Prado

Nueve proyectos web hechos con **Next.js 15, React 19, TypeScript y Tailwind v4**, y un programa de escritorio en **C# / WinForms / SQL Server**.
Cada sitio tiene su propia identidad visual. El objetivo era que cada diseño
respondiera al negocio y no saliera de una plantilla.

Todos están en línea en un VPS propio (Docker detrás de Traefik).

| Proyecto | Qué es | Estética | En línea |
| --- | --- | --- | --- |
| [soda](soda) | Carta, menú del día y pedido por WhatsApp | Editorial cálido | [soda.desamparadostech.com](https://soda.desamparadostech.com) |
| [barberia](barberia) | Precios, horario y reserva por WhatsApp | Brutalista | [barberia.desamparadostech.com](https://barberia.desamparadostech.com) |
| [veterinaria](veterinaria) | Clínica con página de emergencias sin JavaScript | Suave orgánica | [veterinaria.desamparadostech.com](https://veterinaria.desamparadostech.com) |
| [ferreteria](ferreteria) | Catálogo denso con búsqueda, filtros y cotización | Catálogo denso | [ferreteria.desamparadostech.com](https://ferreteria.desamparadostech.com) |
| [enfermeria](enfermeria) | Enfermería a domicilio, con validación de datos legales | Clínico legible | [enfermeria.desamparadostech.com](https://enfermeria.desamparadostech.com) |
| [estampados](estampados) | Panel privado para subir y ordenar estampados de tela | Muestrario | privado (con contraseña) |
| [curriculum](curriculum) | Currículum web que se imprime en A4 sin desarmarse | Documento | [cv.desamparadostech.com](https://cv.desamparadostech.com) |
| [tech-services](tech-services) | Servicio técnico con una escena animada por servicio | Técnico oscuro | [desamparadostech.com](https://desamparadostech.com) |
| [lash-brows-studio](lash-brows-studio) | Estudio de cejas y pestañas: reservas, panel y reseñas | Seda | [lash.desamparadostech.com](https://lash.desamparadostech.com) |

## Escritorio

| Proyecto | Qué es | Stack |
| --- | --- | --- |
| [planillavanguard](planillavanguard) | Control del personal de seguridad, con licencias firmadas ECDSA P-256 y su generador | C# · .NET 10 · WinForms · SQL Server |

Cada carpeta tiene su propio `README.md` con lo que resuelve, lo que conviene
mirar en el código y cómo correrlo.

## Cómo correr cualquiera

Requiere Node 20 o superior y pnpm.

```bash
cd soda
pnpm install
pnpm dev
```

## Decisiones comunes a todos

- **`config/site.ts` es la única fuente de verdad** de los datos del negocio.
  En este repositorio esos datos están vacíos o son de ejemplo.
- **Lo que no tiene dato real se oculta en vez de rellenarse.** Un enlace roto
  o un teléfono inventado hacen más daño que un hueco.
- **`pnpm build` corre primero un chequeo** (`scripts/check-config.mjs`) que
  frena la publicación si queda un dato de relleno. Por eso aquí el build se
  detiene a propósito; `pnpm dev` funciona sin datos.
- Contrastes verificados contra WCAG AA, `prefers-reduced-motion` respetado,
  páginas de error en español y `/api/health` para el monitoreo.

## Sobre esta copia

Es una copia para mostrar el código, publicada en un solo commit. Antes de
subirla se revisó con
[`curriculum/scripts/revisar-publico.mjs`](curriculum/scripts/revisar-publico.mjs),
un script propio que falla si encuentra claves, archivos `.env`, teléfonos,
correos o direcciones IP.
