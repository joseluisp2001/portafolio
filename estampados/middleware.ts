import { NextResponse, type NextRequest } from 'next/server';

/*
  TODO el sitio esta detras de contrasena. No hay parte publica: este proyecto
  no comparte nada, solo deja los estampados cargados.

  Falla CERRADO: si falta ADMIN_PASSWORD devuelve 401 en vez de dejar entrar. Un
  panel que se abre solo porque falto una variable es peor que un panel caido.
*/

/*
  El usuario tambien sale del entorno.

  Tenerlo fijo en "admin" regala la mitad de la credencial: quien quiera entrar
  solo tiene que adivinar la contrasena. Con los dos en el .env, hay que acertar
  las dos cosas, y cambiar el usuario no cuesta un despliegue de codigo.
*/
const usuarioEsperado = () => process.env.ADMIN_USER;

/*
  El `realm` va en ASCII, SIN TILDES.

  Safari en iPhone rompe la ventana de contrasena si el realm trae caracteres no
  ASCII: no muestra el cuadro y el panel simplemente no abre, sin ningun error a
  la vista. Ya paso con el panel de Genesis, que decia "Panel de Génesis" y no
  se podia entrar desde el telefono.
*/
const REALM = 'Panel de estampados';

function pedirClave() {
  return new NextResponse('Necesita entrar', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

export function middleware(request: NextRequest) {
  const esperada = process.env.ADMIN_PASSWORD;
  const usuario_ = usuarioEsperado();

  // Falla cerrado si falta cualquiera de las dos.
  if (!esperada || !usuario_) {
    console.error('[estampados] FALTAN ADMIN_USER o ADMIN_PASSWORD: el panel queda cerrado');
    return pedirClave();
  }

  const cabecera = request.headers.get('authorization');
  if (!cabecera?.startsWith('Basic ')) return pedirClave();

  let usuario = '';
  let clave = '';
  try {
    const plano = atob(cabecera.slice(6));
    const corte = plano.indexOf(':');
    usuario = plano.slice(0, corte);
    clave = plano.slice(corte + 1);
  } catch {
    return pedirClave();
  }

  if (usuario !== usuario_ || clave !== esperada) return pedirClave();

  return NextResponse.next();
}

export const config = {
  /*
    Todo menos los archivos internos de Next.

    `/api/health` tambien queda protegido a proposito: no hay ninguna razon para
    que este panel responda algo desde afuera. El monitoreo puede usar el codigo
    401 como senal de que el proceso esta vivo, que es justo lo que se quiere
    saber.
  */
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
