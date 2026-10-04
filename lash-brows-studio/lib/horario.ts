import { site } from "@/config/site";

/**
 * El horario que Génesis edita desde el panel.
 *
 * Hasta el 9-9-2026 el horario vivía en `config/site.ts`, o sea que cambiarlo
 * era editar código, compilar y desplegar. Ahora vive en disco, en el mismo
 * volumen que las reseñas, y ella lo cambia desde /manager.
 *
 * UNA FILA POR DÍA DE LA SEMANA, no por grupos.
 *
 * El config los agrupaba ("Lunes a viernes"), que se lee lindo pero obliga a
 * que los cinco días sean idénticos. Con una fila por día, un miércoles que
 * abre más tarde deja de ser un caso imposible. Para mostrarlo al público se
 * vuelven a agrupar solos — ver `agrupar()`.
 *
 * ESTE ARCHIVO NO TOCA EL DISCO, y no es un detalle: lo importan componentes
 * que corren en el navegador. Leer y guardar vive en `lib/horario-disco.ts`,
 * que sí importa `node:fs` y por eso no puede entrar al paquete del cliente.
 */

export interface DiaHorario {
  /** 0 = domingo … 6 = sábado. Igual que `Date.getDay()`. */
  dia: number;
  abierto: boolean;
  /** "HH:MM" en 24 h. */
  apertura: string;
  cierre: string;
  /**
   * Cada cuántos minutos arranca una cita.
   *
   * Es lo que decide cuántos espacios ve la clienta. Con 180 —lo que estaba
   * fijo en el código— un laminado de 30 minutos sólo se ofrecía a las 9:00,
   * 12:00 y 15:00: tres arranques por día donde caben doce, y el resto del día
   * escondido aunque el calendario estuviera vacío.
   */
  intervalo: number;
}

export const NOMBRE_DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

/**
 * El horario que se usa mientras nadie haya tocado el panel: el que estaba en
 * `config/site.ts`, desarmado en días sueltos.
 *
 * Se deriva en vez de copiarse a mano para que el sitio recién desplegado
 * muestre exactamente lo mismo que mostraba antes.
 */
export function horarioPorOmision(): DiaHorario[] {
  return Array.from({ length: 7 }, (_, dia) => {
    /* El casteo es el mismo que hacía `ruleForWeekday` antes: `as const` deja
       `weekdays` como tupla de literales, y `includes` de un `number` no
       compila contra eso. */
    const regla = site.hours.find((r) =>
      (r.weekdays as readonly number[]).includes(dia),
    );
    const abierto = Boolean(regla && regla.open && regla.close);
    return {
      dia,
      abierto,
      apertura: regla?.open ?? "09:00",
      cierre: regla?.close ?? "18:00",
      intervalo: site.calendar.slotIntervalMinutes,
    };
  });
}

/** "HH:MM" válido en 24 h. */
export function horaValida(valor: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(valor);
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Normaliza lo que venga del disco a los siete días, en orden.
 *
 * Un archivo escrito por una versión anterior —o editado a mano en el
 * servidor— puede traer días de menos, repetidos o con horas imposibles. En vez
 * de confiar, se reconstruyen los siete y cada uno se acepta sólo si es
 * coherente; si no, cae al valor por omisión de ese día.
 *
 * La alternativa era `JSON.parse` y castear, que es lo que hace `listar()` en
 * las reseñas y que ya quedó anotado como su punto flojo.
 */
export function normalizar(datos: unknown): DiaHorario[] {
  const omision = horarioPorOmision();
  if (!Array.isArray(datos)) return omision;

  return omision.map((porOmision) => {
    const crudo = datos.find(
      (d): d is Record<string, unknown> =>
        typeof d === "object" && d !== null && (d as { dia?: unknown }).dia === porOmision.dia,
    );
    if (!crudo) return porOmision;

    const apertura = typeof crudo.apertura === "string" && horaValida(crudo.apertura)
      ? crudo.apertura
      : porOmision.apertura;
    const cierre = typeof crudo.cierre === "string" && horaValida(crudo.cierre)
      ? crudo.cierre
      : porOmision.cierre;
    const intervalo =
      typeof crudo.intervalo === "number" &&
      Number.isFinite(crudo.intervalo) &&
      crudo.intervalo >= 15 &&
      crudo.intervalo <= 480
        ? Math.round(crudo.intervalo)
        : porOmision.intervalo;

    /* Un día que cierra antes de abrir no es un horario raro: es un día sin
       ningún espacio. Se marca cerrado en vez de generar una lista vacía que
       parecería "todo ocupado". */
    const coherente = aMinutos(cierre) > aMinutos(apertura);

    return {
      dia: porOmision.dia,
      abierto: crudo.abierto === true && coherente,
      apertura,
      cierre,
      intervalo,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Para mostrarlo                                                             */
/* -------------------------------------------------------------------------- */

export interface TramoHorario {
  /** "Lunes a viernes", "Sábado", "Domingo". */
  etiqueta: string;
  dias: number[];
  abierto: boolean;
  apertura: string;
  cierre: string;
}

/** "09:00" → "9:00 a. m." */
export function enDoceHoras(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

/**
 * Junta días seguidos con el mismo horario, para que el público lea
 * "Lunes a viernes" y no siete renglones.
 *
 * Se recorre de lunes a domingo y no de domingo a sábado: en Costa Rica la
 * semana laboral empieza el lunes, y agrupar desde el domingo partiría el
 * bloque de lunes a viernes en dos.
 */
export function agrupar(dias: DiaHorario[]): TramoHorario[] {
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const porDia = new Map(dias.map((d) => [d.dia, d]));
  const tramos: TramoHorario[] = [];

  for (const dia of orden) {
    const d = porDia.get(dia);
    if (!d) continue;

    const ultimo = tramos[tramos.length - 1];
    const igual =
      ultimo &&
      ultimo.abierto === d.abierto &&
      (!d.abierto || (ultimo.apertura === d.apertura && ultimo.cierre === d.cierre));

    if (igual) {
      ultimo.dias.push(dia);
    } else {
      tramos.push({
        etiqueta: "",
        dias: [dia],
        abierto: d.abierto,
        apertura: d.apertura,
        cierre: d.cierre,
      });
    }
  }

  /*
    Sólo el primer día va con mayúscula: "Lunes a viernes", no "Lunes a
    Viernes". En español los días son minúscula, y la primera va en mayúscula
    sólo porque abre la frase. Es exactamente como estaban escritas las
    etiquetas en el config antes de que esto se generara solo, y cambiarlo
    habría sido un cambio visible en la página sin que nadie lo pidiera.
  */
  const enMinuscula = (dia: number) => NOMBRE_DIAS[dia].toLocaleLowerCase("es");

  for (const tramo of tramos) {
    const primero = NOMBRE_DIAS[tramo.dias[0]];
    const ultimo = enMinuscula(tramo.dias[tramo.dias.length - 1]);
    tramo.etiqueta =
      tramo.dias.length === 1
        ? primero
        : tramo.dias.length === 2
          ? `${primero} y ${ultimo}`
          : `${primero} a ${ultimo}`;
  }

  return tramos;
}
