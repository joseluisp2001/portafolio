import { site } from '@/config/site';

/*
  NEXT_PUBLIC_* se hornea AL COMPILAR, no al arrancar el contenedor. Para que
  llegue al build hay que declararla como ARG y ENV en el Dockerfile; si no,
  Docker la ignora en silencio (solo tira un warning) y el sitio se publica con
  el respaldo. Eso es lo que hace hoy lash-brows-studio, que sale con el dominio
  de otro proyecto en el canonical.
*/
export const urlSitio = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || site.urlRespaldo;
