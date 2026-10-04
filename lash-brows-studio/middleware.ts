/**
 * Puerta del panel de Génesis (`/manager`).
 *
 * El panel muestra nombres y teléfonos de clientas: no puede quedar público.
 * Se usa autenticación básica del navegador porque no hace falta más — es una
 * sola persona, sin cuentas ni sesiones que administrar — y porque el propio
 * navegador recuerda la contraseña.
 *
 * La contraseña vive en `MANAGER_PASSWORD` (variable de entorno del contenedor).
 * SIN esa variable el panel queda CERRADO, no abierto: si algún día se
 * despliega sin configurarla, el fallo es negar el acceso, nunca exponer los
 * datos de las clientas.
 */

import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/manager/:path*", "/api/manager/:path*"],
};

const USUARIO = "genesis";

/**
 * Comparación en tiempo constante. Comparar con `===` filtra información por
 * el tiempo que tarda en fallar; con una contraseña corta es un riesgo teórico,
 * pero cuesta cuatro líneas hacerlo bien.
 */
function igual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

function pedirClave() {
  return new NextResponse("Acceso restringido", {
    status: 401,
    /*
          El realm va SIN TILDE a proposito.
    
          Las cabeceras HTTP viajan en ASCII/ISO-8859-1. Con "Génesis" (con tilde),
          Safari en iPhone NO MUESTRA el cuadro de login: no puede interpretar la
          cabecera y descarta el desafio, asi que el panel simplemente no abre. En
          Chrome de escritorio si funcionaba, por eso paso desapercibido.
    
          El charset="UTF-8" se queda: eso aplica a la CONTRASENA que escribe el
          usuario, no al nombre del realm.
        */
        headers: { "WWW-Authenticate": 'Basic realm="Panel de Genesis", charset="UTF-8"' },
  });
}

export function middleware(request: NextRequest) {
  const esperada = process.env.MANAGER_PASSWORD ?? "";
  if (!esperada) return pedirClave();

  const cabecera = request.headers.get("authorization") ?? "";
  if (!cabecera.startsWith("Basic ")) return pedirClave();

  let usuario = "";
  let clave = "";
  try {
    const plano = atob(cabecera.slice(6));
    const corte = plano.indexOf(":");
    usuario = plano.slice(0, corte);
    clave = plano.slice(corte + 1);
  } catch {
    return pedirClave();
  }

  if (!igual(usuario, USUARIO) || !igual(clave, esperada)) return pedirClave();

  return NextResponse.next();
}
