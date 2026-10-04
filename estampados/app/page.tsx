import { listar } from '@/lib/almacen';
import Panel from '@/components/Panel';

/*
  Se lee del disco en cada visita: lo que hay cargado cambia todo el tiempo y
  esto lo abre una sola persona. Nada que cachear.
*/
export const dynamic = 'force-dynamic';

export default async function Inicio() {
  return <Panel iniciales={await listar()} />;
}
