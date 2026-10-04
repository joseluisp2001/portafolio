'use client';

import { useId, useMemo, useState } from 'react';

/*
  DEMOSTRACION de un formulario de registro / ingreso.

  ---------------------------------------------------------------------------
  ESTO NO AUTENTICA NADA, Y ESTA HECHO PARA QUE ESO SE NOTE.

  Un formulario de ingreso que se ve real y no valida contra nada es un
  formulario que recoge contrasenas bajo falsa apariencia. La gente reusa
  contrasenas: si alguien escribe acá la de su correo, ese dato existio en una
  pagina que no deberia haberlo pedido nunca.

  Por eso:
    · lo dice arriba, en la propia tarjeta, antes de que se escriba nada
    · nada se manda a ningun lado: no hay fetch, no hay action, no hay backend
    · nada se guarda: ni localStorage, ni cookies, ni estado que sobreviva
    · autoComplete="off" y nombres de campo raros, para que el gestor de
      contrasenas NO ofrezca guardar ni rellenar una credencial real
    · el campo se vacia al terminar

  Lo que si demuestra: transiciones entre estados, validacion en vivo, medidor de
  fuerza, estados de carga y de exito. Que es lo que se estaba pidiendo.
  ---------------------------------------------------------------------------
*/

type Modo = 'entrar' | 'registro';
type Estado = 'quieto' | 'enviando' | 'listo';

/** Fuerza de la contrasena, 0 a 4. Sin biblioteca: cinco reglas alcanzan. */
function fuerza(clave: string): number {
  if (!clave) return 0;
  let puntos = 0;
  if (clave.length >= 8) puntos++;
  if (clave.length >= 12) puntos++;
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) puntos++;
  if (/\d/.test(clave)) puntos++;
  if (/[^\w\s]/.test(clave)) puntos++;
  return Math.min(puntos, 4);
}

const ETIQUETA_FUERZA = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];

export default function DemoAcceso() {
  const id = useId();
  const [modo, setModo] = useState<Modo>('entrar');
  const [estado, setEstado] = useState<Estado>('quieto');
  const [verClave, setVerClave] = useState(false);

  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [tocado, setTocado] = useState({ correo: false, clave: false });

  const errores = useMemo(() => {
    const e: { correo?: string; clave?: string } = {};

    if (tocado.correo) {
      if (!correo) e.correo = 'Falta el correo';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) e.correo = 'Ese correo no se ve completo';
    }

    if (tocado.clave) {
      if (!clave) e.clave = 'Falta la contraseña';
      else if (modo === 'registro' && clave.length < 8) e.clave = 'Al menos 8 caracteres';
    }

    return e;
  }, [correo, clave, tocado, modo]);

  const valido = correo !== '' && clave !== '' && Object.keys(errores).length === 0;
  const nivel = fuerza(clave);

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setTocado({ correo: true, clave: true });
    if (!valido) return;

    setEstado('enviando');

    /* La espera es fingida a proposito: es lo que hace visible la transicion
       entre "enviando" y "listo", que es lo que esta demo muestra. */
    setTimeout(() => {
      setEstado('listo');
      // La contrasena se borra de la memoria del componente apenas termina.
      setClave('');
    }, 900);
  }

  function reiniciar() {
    setEstado('quieto');
    setCorreo('');
    setClave('');
    setTocado({ correo: false, clave: false });
  }

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo);
    setTocado({ correo: false, clave: false });
  };

  return (
    <div className="no-imprimir border border-regla bg-papel">
      {/* El aviso va ARRIBA, antes de cualquier campo. Ponerlo abajo seria
          ponerlo despues de que alguien ya escribio. */}
      <p className="border-b border-regla bg-mesa px-4 py-2 text-gris">
        <strong className="text-tinta">Demostración.</strong> No valida contra nada, no manda
        ni guarda nada. <strong className="text-tinta">No escriba una contraseña real.</strong>
      </p>

      <div className="p-5">
        {/* --- Las dos pestanas ---------------------------------------------- */}
        <div
          role="tablist"
          aria-label="Registro o ingreso"
          className="relative flex border-b border-regla"
        >
          {(['entrar', 'registro'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={modo === m}
              onClick={() => cambiarModo(m)}
              disabled={estado === 'enviando'}
              className={[
                'flex-1 py-2 transition-colors duration-300',
                modo === m ? 'text-acento' : 'text-gris hover:text-tinta',
              ].join(' ')}
            >
              {m === 'entrar' ? 'Entrar' : 'Crear cuenta'}
            </button>
          ))}

          {/* La barrita que se desliza entre las dos pestanas. Es transform y no
              `left`, para que la anime el compositor y no el layout. */}
          <span
            aria-hidden
            className="absolute bottom-0 h-0.5 w-1/2 bg-acento transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${modo === 'entrar' ? '0%' : '100%'})` }}
          />
        </div>

        {/* --- El formulario, o el mensaje de listo -------------------------- */}
        <div className="relative mt-5">
          {estado === 'listo' ? (
            <div className="animate-[aparecer_400ms_ease-out] text-center">
              <p className="text-puesto font-semibold">
                {modo === 'entrar' ? 'Entró' : 'Cuenta creada'}
              </p>
              <p className="mt-1 text-gris">
                Mentira: no pasó nada. Esta pantalla existe para mostrar la transición.
              </p>
              <button
                type="button"
                onClick={reiniciar}
                className="pulsable mt-4 border border-tinta px-4 py-2 hover:bg-tinta hover:text-papel"
              >
                Probar de nuevo
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate>
              {/* --- Correo --- */}
              <label htmlFor={`${id}-correo`} className="block text-gris">
                Correo
              </label>
              <input
                id={`${id}-correo`}
                /* Nombre raro y autoComplete apagado: el gestor de contrasenas
                   no debe ofrecer rellenar ni guardar una credencial real. */
                name="demo-correo-no-real"
                type="text"
                inputMode="email"
                autoComplete="off"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                onBlur={() => setTocado((t) => ({ ...t, correo: true }))}
                aria-invalid={Boolean(errores.correo)}
                aria-describedby={errores.correo ? `${id}-correo-error` : undefined}
                className={[
                  'mt-1 w-full border px-3 py-2 transition-colors duration-200 outline-none',
                  errores.correo ? 'border-[#b3261e]' : 'border-regla focus:border-acento',
                ].join(' ')}
              />
              <Aviso id={`${id}-correo-error`} texto={errores.correo} />

              {/* --- Contrasena --- */}
              <label htmlFor={`${id}-clave`} className="mt-4 block text-gris">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id={`${id}-clave`}
                  name="demo-clave-no-real"
                  type={verClave ? 'text' : 'password'}
                  autoComplete="off"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  onBlur={() => setTocado((t) => ({ ...t, clave: true }))}
                  aria-invalid={Boolean(errores.clave)}
                  aria-describedby={errores.clave ? `${id}-clave-error` : undefined}
                  className={[
                    'mt-1 w-full border py-2 pr-20 pl-3 transition-colors duration-200 outline-none',
                    errores.clave ? 'border-[#b3261e]' : 'border-regla focus:border-acento',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  className="absolute top-1 right-0 px-3 py-2 text-gris hover:text-tinta"
                >
                  {verClave ? 'ocultar' : 'ver'}
                </button>
              </div>
              <Aviso id={`${id}-clave-error`} texto={errores.clave} />

              {/* --- Medidor de fuerza, solo al crear cuenta ---------------- */}
              <div
                className={[
                  'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                  modo === 'registro' && clave ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                ].join(' ')}
              >
                <div className="overflow-hidden">
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <span
                          key={n}
                          className={[
                            'h-1 flex-1 transition-colors duration-300',
                            n <= nivel ? 'bg-acento' : 'bg-regla',
                          ].join(' ')}
                        />
                      ))}
                    </div>
                    <span className="w-16 text-right text-gris">{ETIQUETA_FUERZA[nivel]}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={estado === 'enviando'}
                // Con borde, como "Guardar como PDF": relleno negro era la masa
                // mas oscura de toda la hoja, mas que el nombre.
                className="pulsable mt-5 w-full border border-tinta py-2.5 text-tinta hover:bg-tinta hover:text-papel disabled:opacity-60"
              >
                {estado === 'enviando'
                  ? 'Un momento…'
                  : modo === 'entrar'
                    ? 'Entrar'
                    : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/*
  El aviso de error crece en vez de aparecer de golpe.

  Se anima grid-template-rows: es la unica forma de que la transicion funcione
  sin saber cuanto mide el texto, y sin medirlo con JavaScript en cada tecla.
*/
function Aviso({ id, texto }: { id: string; texto?: string }) {
  return (
    <div
      className={[
        'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
        texto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      ].join(' ')}
    >
      <p id={id} role="alert" className="overflow-hidden text-[#b3261e]">
        {texto ?? ''}
      </p>
    </div>
  );
}
