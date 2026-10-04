import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Estampado } from '@/config/site';

/*
  Donde viven los estampados.

  1. FUERA DE public/. Next arma el indice de public/ AL ARRANCAR, asi que un
     archivo escrito despues devuelve 404; y el contenedor se recrea en cada
     despliegue, asi que ademas se perderian. Es exactamente el bug que ya costo
     caro en shein-los-guido y que tech-services todavia arrastra.

  2. UN ARCHIVO JSON POR ESTAMPADO, no un indice unico.

     Con un solo indice, dos subidas al mismo tiempo lo leen, le agregan una
     entrada distinta cada una y la segunda escritura pisa a la primera: se
     pierde un estampado y nadie se entera. Un archivo por registro no puede
     tener ese problema.

  3. La carpeta se monta como volumen en el despliegue. Lo que hay adentro es lo
     unico que este proyecto genera, y es lo que hay que respaldar.
*/

const RAIZ = path.join(process.cwd(), 'uploads');
const IMAGENES = path.join(RAIZ, 'imagenes');
const DATOS = path.join(RAIZ, 'datos');

export async function asegurarCarpetas(): Promise<void> {
  await fs.mkdir(IMAGENES, { recursive: true });
  await fs.mkdir(DATOS, { recursive: true });
}

export const rutaImagen = (nombreArchivo: string): string => path.join(IMAGENES, nombreArchivo);

/**
 * Valida que el nombre no salga de la carpeta.
 *
 * Sin esto, un pedido a /uploads/../../.env lee lo que quiera del servidor. Se
 * comprueba resolviendo la ruta y confirmando que sigue adentro, que es lo unico
 * que aguanta las variantes con codificacion.
 */
export function rutaSegura(base: string, nombre: string): string | null {
  const completa = path.resolve(base, nombre);
  const raizNormalizada = path.resolve(base) + path.sep;
  return completa.startsWith(raizNormalizada) ? completa : null;
}

export async function guardar(estampado: Estampado): Promise<void> {
  await asegurarCarpetas();
  const destino = rutaSegura(DATOS, `${estampado.codigo}.json`);
  if (!destino) throw new Error('codigo invalido');
  await fs.writeFile(destino, JSON.stringify(estampado, null, 2), 'utf8');
}

export async function listar(): Promise<Estampado[]> {
  await asegurarCarpetas();

  const archivos = (await fs.readdir(DATOS)).filter((f) => f.endsWith('.json'));

  const leidos = await Promise.all(
    archivos.map(async (f) => {
      try {
        return JSON.parse(await fs.readFile(path.join(DATOS, f), 'utf8')) as Estampado;
      } catch {
        // Un JSON roto no puede tumbar el panel entero: se salta ese y sigue.
        console.error('[estampados] no se pudo leer', f);
        return null;
      }
    }),
  );

  return leidos
    .filter((e): e is Estampado => e !== null)
    .sort((a, b) => b.subidoEn.localeCompare(a.subidoEn));
}

export async function obtener(codigo: string): Promise<Estampado | null> {
  const destino = rutaSegura(DATOS, `${codigo}.json`);
  if (!destino) return null;
  try {
    return JSON.parse(await fs.readFile(destino, 'utf8')) as Estampado;
  } catch {
    return null;
  }
}

export async function borrar(codigo: string): Promise<boolean> {
  const estampado = await obtener(codigo);
  if (!estampado) return false;

  // Primero los archivos, despues el registro: si algo falla a la mitad, queda
  // un registro sin imagen (visible y corregible) y no una imagen huerfana que
  // nadie sabe de quien era.
  for (const nombre of [estampado.archivo, estampado.miniatura]) {
    const ruta = rutaSegura(IMAGENES, nombre);
    if (ruta) await fs.unlink(ruta).catch(() => {});
  }

  const registro = rutaSegura(DATOS, `${codigo}.json`);
  if (registro) await fs.unlink(registro).catch(() => {});

  return true;
}

/**
 * Los magic bytes del archivo, no su extension.
 *
 * En shein-los-guido hay un validador por magic bytes escrito y NADIE lo
 * importa: el POST valida solo por extension, asi que un .jpg con cualquier cosa
 * adentro se guarda y despues se sirve como image/jpeg. Aca se usa de verdad.
 */
export function tipoDeImagen(buffer: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }

  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }

  return null;
}

/** Deja solo letras, numeros y guiones. El codigo se usa como nombre de archivo. */
export function limpiarCodigo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}
