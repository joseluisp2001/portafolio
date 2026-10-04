/**
 * Panel de Génesis: aprobar o rechazar las citas que llegan de la web.
 *
 * Existe porque WhatsApp no es confiable como única vía: la instancia se ha
 * desconectado sola varias veces, y cuando eso pasa las citas quedan sin
 * aprobar sin que nadie se entere. Esto habla directo con el calendario, así
 * que funciona aunque WhatsApp esté caído.
 *
 * Los datos se cargan ACÁ, en el servidor, y bajan ya resueltos. El acceso lo
 * protege `middleware.ts` (autenticación básica).
 */

import type { Metadata } from "next";

import { obtenerPendientes } from "@/app/manager/acciones";
import { PanelCitas } from "@/components/PanelCitas";
import { PanelHorario } from "@/components/PanelHorario";
import { PanelResenas } from "@/components/PanelResenas";
import { leerHorario } from "@/lib/horario-disco";
import { listar as listarResenas } from "@/lib/resenas";

export const metadata: Metadata = {
  title: "Panel — Génesis Roca",
  // Que no lo indexe nadie, aunque esté detrás de contraseña.
  robots: { index: false, follow: false },
};

// Nunca se cachea: mostrar una cita ya aprobada llevaría a aprobarla dos veces.
export const dynamic = "force-dynamic";

export default async function ManagerPage() {
  const { citas, error } = await obtenerPendientes();
  /* Con pendientes: es el unico lugar del sitio donde se ven. */
  const resenas = await listarResenas(true);
  const horario = await leerHorario();

  return (
    <main className="min-h-screen bg-cream px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-mocha/70">
            Panel del estudio
          </p>
          <h1 className="mt-1 font-serif text-3xl text-espresso">
            Citas por aprobar
          </h1>
          <p className="mt-2 text-sm text-mocha">
            Al aprobar, la cita se confirma en el calendario de Génesis.
          </p>
        </header>

        <PanelCitas citasIniciales={citas} errorInicial={error} />

        {/*
          Las reseñas van DEBAJO de las citas, y es a propósito: una cita sin
          aprobar es plata esperando y tiene hora; una reseña sin publicar puede
          esperar al rato. Lo urgente arriba.
        */}
        <PanelResenas iniciales={resenas} />

        {/*
          El horario va al final: es lo que MENOS seguido se toca. Una cita sin
          aprobar es de hoy; el horario se cambia cuando cambia la vida, no
          cada día. Ponerlo arriba haría bajar todos los días por algo que se
          usa una vez al mes.
        */}
        <PanelHorario iniciales={horario} />
      </div>
    </main>
  );
}
