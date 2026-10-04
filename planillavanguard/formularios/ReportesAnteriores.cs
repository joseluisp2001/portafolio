using System.Data;
using System.Globalization;
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Genera el reporte de cualquier dia que ya tenga asistencia.
    /// Construida por codigo: no lleva Designer ni resx.
    /// </summary>
    public class ReportesAnteriores : Form
    {
        private readonly AsistenciaRepositorio _repo = new();

        private readonly Panel pnlBanda = new();
        private readonly Label lblTitulo = new();
        private readonly Label lblSub = new();
        private readonly Button btnCerrar = new();

        private readonly GroupBox grp = new();
        private readonly DataGridView dtg = new();
        private readonly Panel pnlBuscar = new();
        private Buscador? _buscador;

        /// <summary>
        /// Todos los dias con asistencia, sin filtrar. El buscador
        /// trabaja sobre esta copia y no vuelve a la base.
        /// </summary>
        private DataTable? _dias;

        private readonly Panel pnlInferior = new();
        private readonly Label lblAviso = new();
        private readonly Button btnVerDetalle = new();
        private readonly Button btnGenerar = new();
        private readonly Button btnActualizar = new();

        public ReportesAnteriores()
        {
            ConstruirInterfaz();
            Load += (_, _) => Cargar();
        }

        private void ConstruirInterfaz()
        {
            Estilo.Formulario(this);
            Text = "Reportes de otros dias";
            ClientSize = new Size(1150, 700);
            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };

            Estilo.Banda(pnlBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 95;

            int margenTexto = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);

            lblTitulo.Text = "REPORTES DE OTROS DIAS";
            lblTitulo.Font = Estilo.Titulo;
            lblTitulo.ForeColor = Color.White;
            lblTitulo.BackColor = Color.Transparent;
            lblTitulo.SetBounds(margenTexto, 22, 600, 32);

            lblSub.Text = "Escoja un dia de la lista y genere su reporte en Excel.";
            Estilo.SubtituloBanda(lblSub);
            lblSub.AutoSize = false;
            lblSub.SetBounds(margenTexto + 3, 56, 600, 20);

            Estilo.SobreBanda(btnCerrar);
            btnCerrar.Text = "Volver al Menu";
            btnCerrar.Size = new Size(170, 40);
            btnCerrar.Click += (_, _) => Estilo.VolverAlMenu(this);

            pnlBanda.Controls.AddRange(new Control[] { btnCerrar, lblSub, lblTitulo });
            Estilo.AnclarDerecha(pnlBanda, btnCerrar);

            Estilo.GridSoloLectura(dtg);
            dtg.Dock = DockStyle.Fill;
            dtg.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dtg.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) Generar(); };

            grp.Text = "Dias con asistencia registrada";
            grp.Font = Estilo.GrillaEncabezado;
            grp.ForeColor = Estilo.Azul;
            grp.BackColor = Estilo.Fondo;
            grp.Dock = DockStyle.Fill;
            grp.Padding = new Padding(15, 10, 15, 10);
            grp.Controls.Add(dtg);

            // Buscador en su franja, encima de la lista. La lista crece
            // un dia por cada dia trabajado: al ano son mas de
            // trescientos renglones y buscar el mes o el dia a mano es
            // ir rodando la rueda un buen rato.
            pnlBuscar.Dock = DockStyle.Top;
            pnlBuscar.Height = 44;
            pnlBuscar.BackColor = Estilo.Fondo;

            _buscador = Buscador.Poner(
                pnlBuscar, 2, 6,
                "Buscar fecha (08/2026) o estado (Si, No)",
                () => Buscador.Opciones(_dias),
                Pintar, 300);

            grp.Controls.Add(pnlBuscar);

            // La grilla de ultima: asi el buscador se queda con su
            // franja arriba y la lista ocupa lo que sobra.
            dtg.BringToFront();

            pnlInferior.Dock = DockStyle.Bottom;
            pnlInferior.Height = 80;
            pnlInferior.BackColor = Estilo.Superficie;

            Estilo.Secundario(btnVerDetalle);
            btnVerDetalle.Text = "Ver detalle del dia";
            btnVerDetalle.SetBounds(20, 20, 210, 42);
            btnVerDetalle.Click += (_, _) => VerDetalle();

            Estilo.Primario(btnGenerar);
            btnGenerar.Text = "Generar reporte del dia escogido";
            btnGenerar.SetBounds(255, 20, 320, 42);
            btnGenerar.Click += (_, _) => Generar();

            Estilo.Secundario(btnActualizar);
            btnActualizar.Text = "Actualizar lista";
            btnActualizar.SetBounds(590, 20, 170, 42);
            btnActualizar.Click += (_, _) => Cargar(avisarVacio: false);

            lblAviso.Font = Estilo.Subtitulo;
            lblAviso.ForeColor = Estilo.TextoSuave;
            lblAviso.TextAlign = ContentAlignment.MiddleRight;
            lblAviso.SetBounds(780, 30, 340, 22);
            lblAviso.AutoEllipsis = true;
            lblAviso.Text = "Doble clic sobre un dia tambien genera el reporte.";

            pnlInferior.Controls.AddRange(new Control[]
            { btnActualizar, btnGenerar, btnVerDetalle });

            Controls.Add(grp);
            Controls.Add(pnlInferior);
            Controls.Add(pnlBanda);

            // El aviso se agrega DESPUES de que el panel ya esta en la
            // ventana, y solo ahi se ancla.
            //
            // Puesto antes, el panel todavia media lo que mide un panel
            // recien hecho -- 200 de ancho -- y el anclaje guardaba esa
            // distancia al borde: al abrirse la ventana el renglon se
            // estiraba casi mil pixeles fuera de la pantalla, y como su
            // texto va pegado a la derecha, los avisos de esta pantalla
            // no se alcanzaban a ver. Es el mismo tropiezo que ya tenia
            // resuelto Estilo.AnclarDerecha para los botones de la banda.
            lblAviso.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            pnlInferior.Controls.Add(lblAviso);
        }

        // =============================================================
        /// <summary>
        /// Relee la lista de dias. avisarVacio se apaga cuando la recarga
        /// no la pidio el usuario, para no repetirle el mismo mensaje
        /// cada vez que vuelve de otra pantalla.
        /// </summary>
        private void Cargar(bool avisarVacio = true)
        {
            try
            {
                Cursor = Cursors.WaitCursor;

                _dias = _repo.DiasConDatos();
                Pintar();

                if (_dias.Rows.Count == 0 && avisarVacio)
                    lblAviso.Text = "Todavia no hay ningun dia con asistencia registrada.";
            }
            catch (Exception ex) { Error("No se pudo cargar la lista de dias.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>
        /// Vuelca a la lista los dias que pasen el filtro de texto. Se
        /// llama al cargar y cada vez que se busca.
        /// </summary>
        private void Pintar()
        {
            var visibles = Buscador.Filtrar(_dias, _buscador?.Texto);

            dtg.DataSource = visibles;
            Estilo.SinOrdenamiento(dtg);

            if (dtg.Columns.Contains("Fecha"))
                dtg.Columns["Fecha"]!.DefaultCellStyle.Format = "dd/MM/yyyy";

            Resaltar();

            int total = _dias?.Rows.Count ?? 0;

            grp.Text = _buscador is not null && _buscador.HayFiltro
                ? $"Dias con asistencia registrada  ({visibles.Rows.Count} de {total})" +
                  _buscador.Coletilla
                : $"Dias con asistencia registrada  ({total})";
        }

        /// <summary>Rojo los dias con turnos sin cerrar.</summary>
        private void Resaltar()
        {
            if (!dtg.Columns.Contains("Turnos cerrados")) return;

            bool hayReporte = dtg.Columns.Contains("Reporte generado");

            foreach (DataGridViewRow fila in dtg.Rows)
            {
                int cerrados = Convert.ToInt32(fila.Cells["Turnos cerrados"].Value ?? 0);

                if (cerrados < AsistenciaRepositorio.TotalTurnos)
                {
                    fila.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
                }
                else if (hayReporte && fila.Cells["Reporte generado"].Value?.ToString() == "Si")
                {
                    fila.DefaultCellStyle.BackColor = Estilo.VerdeFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.VerdeTexto;
                }
            }
        }

        private DateTime? FechaElegida()
        {
            if (dtg.CurrentRow is null || !dtg.Columns.Contains("Fecha")) return null;
            var v = dtg.CurrentRow.Cells["Fecha"].Value;
            return v is DateTime d ? d : null;
        }

        /// <summary>
        /// Cuantos turnos tiene cerrados el dia escogido. Si la columna
        /// no viniera, devuelve el total: asi el dia se trata como
        /// completo en vez de marcar de incompleto uno que si lo esta.
        /// </summary>
        private int TurnosCerradosDeLaFila()
        {
            if (dtg.CurrentRow is null || !dtg.Columns.Contains("Turnos cerrados"))
                return AsistenciaRepositorio.TotalTurnos;

            var v = dtg.CurrentRow.Cells["Turnos cerrados"].Value;
            return v is null || v == DBNull.Value
                ? AsistenciaRepositorio.TotalTurnos
                : Convert.ToInt32(v);
        }

        private void VerDetalle()
        {
            var fecha = FechaElegida();
            if (fecha is null) { Avisar("Escoja un dia de la lista."); return; }

            // Al volver se relee: en la verificacion se pudo cerrar un
            // turno o cambiar una sustitucion.
            Estilo.MostrarHijo(this, new VerificarAsignaciones(fecha.Value),
                               () => Cargar(avisarVacio: false));
        }

        // =============================================================
        private void Generar()
        {
            var fecha = FechaElegida();
            if (fecha is null) { Avisar("Escoja un dia de la lista."); return; }

            DateTime f = fecha.Value;
            var cultura = CultureInfo.GetCultureInfo("es-CR");

            // Un dia incompleto se genera igual, sin preguntar: el reporte
            // sale con los turnos que si se capturaron y se avisa abajo.
            //
            // La columna se comprueba antes de leerla: pedirle a la
            // grilla una celda que no existe tumba la pantalla, y aqui
            // lo unico que se pierde es el aviso de "dia incompleto".
            int totalTurnos = AsistenciaRepositorio.TotalTurnos;
            int cerrados = TurnosCerradosDeLaFila();

            var datos = _repo.ObtenerReporte(f);
            if (datos.Rows.Count == 0)
            {
                MessageBox.Show("Ese dia no tiene registros.\n\nEL REPORTE NO FUE GENERADO.",
                    "Sin datos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar el reporte",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Reporte_Diario_Base105_{f:yyyy-MM-dd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            string ruta = dlg.FileName;

            try
            {
                Cursor = Cursors.WaitCursor;

                var totales = _repo.Totales(f);
                var sustituciones = _repo.ListarSustituciones(f);

                ReporteExcel.Generar(ruta, f, datos, totales, sustituciones);

                // Solo se registra si el dia esta completo, para no marcar
                // como reportado un dia que quedo a medias.
                if (cerrados == totalTurnos)
                {
                    try { _repo.RegistrarReporte(f, ruta); }
                    catch
                    {
                        try { if (File.Exists(ruta)) File.Delete(ruta); } catch { }
                        throw;
                    }
                }

                Cargar(avisarVacio: false);

                // Se abre solo. El detalle del dia queda escrito abajo.
                lblAviso.Text =
                    $"Reporte del {f.ToString("d 'de' MMMM", cultura)} generado   |   " +
                    $"Oficiales: {totales.Total}   |   Tardias: {totales.Tardias}   |   " +
                    $"Ausentes: {totales.Ausentes}" +
                    (cerrados < totalTurnos
                        ? $"   |   OJO: solo {cerrados} de {totalTurnos} turnos cerrados"
                        : "");

                Estilo.AbrirArchivo(ruta);
            }
            catch (IOException)
            {
                MessageBox.Show(
                    "No se pudo escribir el archivo. Probablemente ya lo tiene abierto " +
                    "en Excel. Cierrelo e intente de nuevo.\n\nEL REPORTE NO FUE GENERADO.",
                    "Archivo en uso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"EL REPORTE NO FUE GENERADO.\n\nDetalle tecnico:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>Los avisos de un clic incompleto van en la barra de abajo.</summary>
        private void Avisar(string m) => lblAviso.Text = m;

        private static void Error(string ctx, Exception ex) =>
            MessageBox.Show($"{ctx}\n\nDetalle tecnico:\n{ex.Message}",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
