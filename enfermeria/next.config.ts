import type { NextConfig } from 'next';

/*
  Dos cosas que NO estan aca a proposito, y que ya costaron caro en otros
  proyectos de esta maquina:

  1. images.localPatterns. Es una LISTA BLANCA: todo lo que no calce devuelve un
     400 seco, sin log. En tech-services eso dejo el hero vacio y parecia que el
     sitio estaba roto. Si no se declara, las imagenes locales funcionan todas.
     No agregarlo salvo que haya una razon concreta.

  2. Fotos subidas por el admin dentro de public/. Next arma el indice de
     public/ AL ARRANCAR, asi que un archivo escrito despues devuelve 404; y el
     contenedor se recrea en cada despliegue, asi que ademas se pierden. Cuando
     este sitio tenga subida de imagenes, van a /app/uploads y se sirven desde
     una ruta propia.
*/
const nextConfig: NextConfig = {
  /*
    El modo "standalone" es lo que hace que la imagen de Docker pese decenas de
    MB en vez de cientos, y es como se despliega en el VPS.

    Pero en Windows ese modo intenta crear symlinks dentro de .next/standalone
    para los paquetes de pnpm, y Windows no lo permite sin modo desarrollador ni
    permisos de administrador: el build compila entero y recien al final muere
    con EPERM, que se lee como si el codigo estuviera roto y no lo esta.

    Se decide por PLATAFORMA y no por una variable de entorno: la primera version
    dependia de que el Dockerfile pusiera DOCKER_BUILD=1, y como estos proyectos
    todavia no tienen Dockerfile, standalone no se habria activado nunca al
    desplegar. Con la plataforma, el servidor (Linux) lo genera siempre y la
    laptop (Windows) nunca, sin que nadie tenga que acordarse de nada.
  */
  output: process.platform === 'win32' ? undefined : 'standalone',
};

export default nextConfig;
