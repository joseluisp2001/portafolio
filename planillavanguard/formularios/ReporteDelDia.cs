using GestorDatos;

namespace formularios
{
    /// <summary>
    /// El Excel del dia, con todo lo que hay que hacer alrededor:
    /// preguntar donde guardarlo, generarlo, recalcular los contadores
    /// y abrirlo.
    ///
    /// Vive aparte porque ahora se pide desde dos lados -- de la lista
    /// de asistencia y de la sustitucion de ausentes -- y son el mismo
    /// reporte. Con una copia en cada pantalla, el dia que haya que
    /// cambiarle algo se arreglaria en una y la otra seguiria como
    /// estaba.
    /// </summary>
    public static class ReporteDelDia
    {
        /// <summary>
        /// Genera el reporte de esa fecha.
        ///
        /// Los turnos que falten por cerrar NO lo detienen. Nadie sale
        /// perjudicado por eso: el reporte y los contadores se arman de
        /// lo que hay guardado en la asistencia, y de un turno que no se
        /// cerro no hay ni una linea, asi que esos oficiales no salen en
        /// el Excel ni se les suma ninguna falta. Lo que si hace falta es
        /// que quien lo genera sepa que el dia quedo incompleto, y eso se
        /// dice en la barra de abajo.
        /// </summary>
        /// <param name="avisar">Donde escribir lo que pasa: la barra de la pantalla que lo pidio.</param>
        /// <param name="alGenerar">Se llama cuando el reporte ya quedo, antes del ultimo aviso. Sirve para que la pantalla recargue sus contadores.</param>
        public static void Generar(Form duenno, DateTime fecha, AsistenciaRepositorio repo,
                                   Action<string> avisar, Action? alGenerar = null)
        {
            var pendientes = repo.TurnosPendientes(fecha);
            string aviso = pendientes.Count == 0
                ? ""
                : $"   |   OJO: {pendientes.Count} turno(s) sin pasar lista " +
                  $"({string.Join(", ", pendientes)}): no salen en el reporte.";

            // No se pregunta si se vuelve a generar ni si quedan puestos
            // sin cubrir: los contadores se recalculan desde el historial
            // y los puestos descubiertos salen marcados en el propio
            // reporte.
            var datos = repo.ObtenerReporte(fecha);
            if (datos.Rows.Count == 0)
            {
                MessageBox.Show("No hay registros de asistencia para esa fecha.\n\n" +
                    "EL REPORTE NO FUE GENERADO.",
                    "Sin datos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar el reporte del dia",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Reporte_Diario_Base105_{fecha:yyyy-MM-dd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };

            // El aviso de los turnos que faltan se pone antes de abrir el
            // cuadro de guardar: si la persona se arrepiente y cancela, el
            // renglon de abajo le queda diciendo que el dia va incompleto.
            if (aviso.Length > 0) avisar(aviso.TrimStart(' ', '|'));

            if (dlg.ShowDialog(duenno) != DialogResult.OK) return;

            string ruta = dlg.FileName;

            try
            {
                duenno.Cursor = Cursors.WaitCursor;

                var totales = repo.Totales(fecha);
                var sustituciones = repo.ListarSustituciones(fecha);

                // 1. Primero el archivo. Si falla, la base queda intacta.
                ReporteExcel.Generar(ruta, fecha, datos, totales, sustituciones);

                // 2. Solo si el archivo salio, se recalculan los contadores.
                try { repo.RegistrarReporte(fecha, ruta); }
                catch
                {
                    try { if (File.Exists(ruta)) File.Delete(ruta); } catch { }
                    throw;
                }

                alGenerar?.Invoke();

                avisar($"Reporte del {fecha:dd/MM/yyyy} generado   |   " +
                       $"Oficiales: {totales.Total}   |   Tardias: {totales.Tardias}   |   " +
                       $"Ausentes: {totales.Ausentes}   |   {ruta}" + aviso);

                // Se abre solo: quien pidio el reporte lo quiere ver.
                Estilo.AbrirArchivo(ruta);
            }
            catch (IOException)
            {
                MessageBox.Show(
                    "No se pudo escribir el archivo. Probablemente ya lo tiene abierto " +
                    "en Excel. Cierrelo e intente de nuevo.\n\n" +
                    "EL REPORTE NO FUE GENERADO y no se modifico ningun contador.",
                    "Archivo en uso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (UnauthorizedAccessException)
            {
                MessageBox.Show(
                    "No tiene permiso para guardar en esa carpeta. Escoja otra, " +
                    "por ejemplo Documentos.\n\nEL REPORTE NO FUE GENERADO.",
                    "Sin permiso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                Registro.Anotar("No se pudo generar el reporte del dia", ex);

                MessageBox.Show(
                    "EL REPORTE NO FUE GENERADO.\n\nNo se modifico ningun contador.\n\n" +
                    $"Detalle tecnico:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally { duenno.Cursor = Cursors.Default; }
        }
    }
}
