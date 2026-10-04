/*
  NEXT_PUBLIC_* se hornea AL COMPILAR, no al arrancar el contenedor: hay que
  declararla como ARG y ENV en el Dockerfile, o Docker la ignora en silencio
  (solo tira un warning) y el sitio se publica con el respaldo.
*/
const RESPALDO = 'http://localhost:3016';

export const urlSitio = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || RESPALDO;
