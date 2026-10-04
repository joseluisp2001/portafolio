#!/usr/bin/env node
/*
  revisar-publico.mjs — se corre DENTRO de una copia, antes del primer commit.

    node revisar-publico.mjs ../publico/lash-brows-studio

  Recorre la carpeta y falla si encuentra algo que no deberia salir a un
  repositorio publico.

  ---------------------------------------------------------------------------
  POR QUE EXISTE

  Abrir un repositorio es una accion IRREVERSIBLE. Una vez que un secreto estuvo
  publico un rato, se asume filtrado: hay robots que clonan repos nuevos a los
  segundos de aparecer.

  Y borrar el secreto despues NO alcanza si el repositorio tiene historial: la
  contrasena sigue en el commit anterior, a un clic. Por eso la copia publica es
  siempre un repositorio NUEVO con UN commit, y por eso este script se corre
  antes de ese commit y no despues.
  ---------------------------------------------------------------------------
*/
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const raiz = path.resolve(process.argv[2] ?? '.');

/*
  Lista de permitidos, por proyecto: un archivo `.revisar-permitido` en la raiz,
  un valor por linea, `#` para comentarios.

  Existe porque hay proyectos donde un dato personal SI va a proposito. El
  curriculum es el caso obvio: publicar el correo y el telefono es literalmente
  para lo que sirve. Sin esta lista, el unico proyecto que tiene que llevar esos
  datos seria el unico que el revisor nunca deja publicar, y a los dos dias
  alguien corre el script con --force y deja de servir para nada.

  Que sea un archivo en el repo, y no una opcion de linea de comandos, es a
  proposito: queda a la vista de cualquiera que abra el proyecto, y agregar algo
  ahi es una decision que se ve en el diff.
*/
const permitidos = new Set();
{
  const archivo = path.join(raiz, '.revisar-permitido');
  if (existsSync(archivo)) {
    for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
      const v = linea.trim();
      if (v && !v.startsWith('#')) permitidos.add(v.toLowerCase());
    }
  }
}

/* Carpetas que ni se miran: son ruido o pesan de mas. */
const SALTAR = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out']);

/* Lo que NO puede estar, ni siquiera vacio. */
const PROHIBIDO_CARPETA = ['GeneradorLicencias', 'Licencias', 'Licencias.Pruebas'];

const PROHIBIDO_ARCHIVO = [
  /^\.env($|\.)(?!example)/i, // .env, .env.local — pero .env.example si va
  /\.(pem|key|pfx|p12|jks|keystore)$/i,
  /^id_rsa/i,
  /\.snk$/i, // llave de firma de .NET
];

/*
  Numeros de relleno CONOCIDOS.

  Estos son los que el codigo tiene a proposito: la lista negra de
  check-config.mjs y los ejemplos de la documentacion. Marcarlos seria gritar en
  falso justo en el archivo que existe para evitar el problema.
*/
const RELLENO_CONOCIDO = new Set([
  '50600000000',
  '50688888888',
  '50612345678',
  '8888-8888',
  '50688887777',
]);

/*
  Archivos que no se revisan.

  Los lockfiles traen cientos de "paquete@version" que parecen correos y ni un
  secreto. Revisarlos solo produce ruido, y el ruido es lo que hace que despues
  nadie lea la salida.
*/
const NO_REVISAR = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']);

/*
  Antes de buscar, se sacan del texto los tramos que producen falsos positivos
  garantizados:

    · d="M12 4 2.23 41.56 …"  → las coordenadas de un icono SVG se leen como IPs
    · "paquete@1.2.3"         → se lee como correo

  Es preferible cegarse en esos dos casos concretos que devolver una lista larga
  de falsos y que se termine ignorando la lista entera.
*/
function limpiarRuido(texto) {
  return texto
    .replace(/\sd="[^"]*"/g, ' ')
    .replace(/[\w./-]+@\d[\d.]*/g, ' ');
}

/* Patrones adentro del contenido. */
const PATRONES = [
  {
    nombre: 'telefono de Costa Rica',
    re: /\b506[2-8]\d{7}\b|\b[2-8]\d{3}-\d{4}\b/g,
    permitido: (v) => RELLENO_CONOCIDO.has(v),
  },
  {
    nombre: 'correo real',
    // El dominio de primer nivel tiene que ser LETRAS: asi "react@19.1.0" no
    // entra y "hola@aurastudio.com" si.
    re: /\b[\w.+-]+@(?!ejemplo|example|dominio)[\w-]+(\.[\w-]+)*\.[a-z]{2,24}\b/gi,
  },
  {
    nombre: 'clave con valor',
    re: /(password|contrasena|contraseña|apikey|api_key|secret|token)\s*[:=]\s*["'][^"'\s]{6,}["']/gi,
  },
  {
    nombre: 'IP publica',
    re: /\b(?!127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)((\d{1,3})\.){3}\d{1,3}\b/g,
    // Descarta lo que no puede ser una IP: cualquier octeto arriba de 255.
    permitido: (v) => v.split('.').some((o) => Number(o) > 255),
  },
  { nombre: 'clave privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { nombre: 'INSERT con datos', re: /INSERT\s+INTO/gi },
];

const EXTENSIONES = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.css',
  '.sql', '.sh', '.yml', '.yaml', '.env', '.txt', '.cs', '.config', '.xml',
]);

const hallazgos = [];
const avisos = [];

/** ¿git ignora este archivo? Si no hay git o no es un repo, se asume que NO. */
function gitIgnora(archivo) {
  try {
    execFileSync('git', ['check-ignore', '-q', archivo], {
      cwd: raiz,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false; // no ignorado, o git no pudo responder
  }
}

function recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    const completa = path.join(dir, nombre);
    const rel = path.relative(raiz, completa);

    if (statSync(completa).isDirectory()) {
      if (PROHIBIDO_CARPETA.includes(nombre)) {
        hallazgos.push(`CARPETA PROHIBIDA: ${rel}`);
        continue;
      }
      if (SALTAR.has(nombre)) continue;
      if (nombre === 'uploads') {
        avisos.push(`uploads/ presente (${rel}) — es contenido, no deberia ir al repo`);
        continue;
      }
      recorrer(completa);
      continue;
    }

    if (PROHIBIDO_ARCHIVO.some((re) => re.test(nombre))) {
      /*
        Un archivo prohibido que git IGNORA no llega al repositorio.

        El caso tipico es el .env de trabajo: existe en la maquina, hace falta
        para correr el proyecto, y esta en .gitignore. Bloquear por eso obliga a
        borrarlo para poder publicar y despues volver a escribirlo, que es la
        clase de friccion que termina en que alguien corra esto con --force.

        Si NO se puede consultar a git (una copia todavia sin `git init`), se
        bloquea igual: ante la duda, no se publica.
      */
      if (gitIgnora(completa)) {
        avisos.push(`${rel} existe pero git lo ignora — no llega al repositorio`);
      } else {
        hallazgos.push(`ARCHIVO PROHIBIDO: ${rel}`);
      }
      continue;
    }

    if (NO_REVISAR.has(nombre)) continue;
    if (!EXTENSIONES.has(path.extname(nombre))) continue;
    if (statSync(completa).size > 400_000) continue;

    const texto = limpiarRuido(readFileSync(completa, 'utf8'));

    for (const { nombre: etiqueta, re, permitido } of PATRONES) {
      const encontrados = [...new Set(texto.match(re) ?? [])].filter(
        (v) => !permitido?.(v) && !permitidos.has(v.toLowerCase()),
      );
      if (!encontrados.length) continue;

      const muestra = encontrados.slice(0, 3).join(', ');
      const mas = encontrados.length > 3 ? ` (+${encontrados.length - 3})` : '';
      hallazgos.push(`${etiqueta.toUpperCase()}: ${rel} → ${muestra}${mas}`);
    }
  }
}

console.log(`\n  Revisando ${raiz}\n`);
recorrer(raiz);

for (const a of avisos) console.log('   ·  ' + a);
if (avisos.length) console.log('');

if (hallazgos.length) {
  console.error('  NO PUBLICAR. Se encontro esto:\n');
  for (const h of hallazgos) console.error('   ✕  ' + h);
  console.error(`\n  ${hallazgos.length} cosas que revisar.`);
  console.error('  Corregilas en la COPIA y volve a correr esto antes del primer commit.\n');
  process.exit(1);
}

console.log('  Limpio. Se puede hacer el primer commit.\n');
console.log('  Recorda: repositorio NUEVO con UN commit.');
console.log('  Nunca un remote sobre el repo de trabajo — el historial guarda los secretos.\n');
