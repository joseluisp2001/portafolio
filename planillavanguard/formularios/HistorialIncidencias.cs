using System.Data;
using System.Globalization;
using ClosedXML.Excel;
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Historial de ausencias y tardias por oficial en un rango de fechas.
    /// Construida por codigo, sin Designer ni resx.
    /// </summary>
    public class HistorialIncidencias : Form
    {
        private readonly AsistenciaRepositorio _repo = new();

        private readonly Panel pnlBanda = new();
        private readonly Label lblTitulo = new();
        private readonly Label lblSub = new();
        private readonly Button btnCerrar = new();

        private readonly Panel pnlFiltro = new();
        private readonly Label lblDesde = new();
        private readonly DateTimePicker dtpDesde = new();
        private readonly Label lblHasta = new();
        private readonly DateTimePicker dtpHasta = new();
        private readonly Label lblTipo = new();
        private readonly ComboBox cbxTipo = new();
        private readonly Button btnBuscar = new();
        private readonly Button btnExportar = new();
        private readonly Label lblAviso = new();
        private Buscador? _buscador;

        /// <summary>
        /// Lo que trajo la base por el rango de fechas, sin filtrar. El
        /// buscador trabaja sobre estas copias: escribir y borrar no
        /// vuelve a consultar la base.
        /// </summary>
        private DataTable? _resumen;
        private DataTable? _detalle;

        private readonly GroupBox grpResumen = new();
        private readonly DataGridView dtgResumen = new();
        private readonly GroupBox grpDetalle = new();
        private readonly DataGridView dtgDetalle = new();
        private readonly TableLayoutPanel tlp = new();

        public HistorialIncidencias()
        {
            ConstruirInterfaz();
            Load += (_, _) => Buscar();
        }

        private void ConstruirInterfaz()
        {
            Estilo.Formulario(this);
            Text = "Historial de ausencias y tardias";
            ClientSize = new Size(1250, 720);
            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };

            // ---------- Banda ----------
            Estilo.Banda(pnlBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 95;

            int margenTexto = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);

            lblTitulo.Text = "HISTORIAL DE AUSENCIAS Y TARDIAS";
            lblTitulo.Font = Estilo.Titulo;
            lblTitulo.ForeColor = Color.White;
            lblTitulo.BackColor = Color.Transparent;
            lblTitulo.SetBounds(margenTexto, 22, 700, 32);

            lblSub.Text = "Vanguard  -  Base 105  -  Clinica Marcial Fallas";
            Estilo.SubtituloBanda(lblSub);
            lblSub.AutoSize = false;
            lblSub.SetBounds(margenTexto + 3, 56, 600, 20);

            Estilo.SobreBanda(btnCerrar);
            btnCerrar.Text = "Volver al Menu";
            btnCerrar.Size = new Size(170, 40);
            btnCerrar.Click += (_, _) => Estilo.VolverAlMenu(this);

            pnlBanda.Controls.AddRange(new Control[] { btnCerrar, lblSub, lblTitulo });
            Estilo.AnclarDerecha(pnlBanda, btnCerrar);

            // ---------- Filtros ----------
            pnlFiltro.Dock = DockStyle.Top;

            // Dos renglones: arriba el rango y el tipo, abajo el buscador.
            pnlFiltro.Height = 120;

            // Superficie, no blanco puro: es la misma franja de filtros
            // que tienen asistencia y proyeccion.
            pnlFiltro.BackColor = Estilo.Superficie;

            lblDesde.Text = "Desde";
            lblDesde.Font = Estilo.Subtitulo;
            lblDesde.ForeColor = Estilo.TextoSuave;
            lblDesde.AutoSize = true;
            lblDesde.SetBounds(22, 12, 100, 19);

            dtpDesde.Format = DateTimePickerFormat.Short;
            Estilo.CampoTexto(dtpDesde);
            dtpDesde.SetBounds(20, 34, 170, 28);
            dtpDesde.Value = DateTime.Today.AddDays(-30);

            lblHasta.Text = "Hasta";
            lblHasta.Font = Estilo.Subtitulo;
            lblHasta.ForeColor = Estilo.TextoSuave;
            lblHasta.AutoSize = true;
            lblHasta.SetBounds(212, 12, 100, 19);

            dtpHasta.Format = DateTimePickerFormat.Short;
            Estilo.CampoTexto(dtpHasta);
            dtpHasta.SetBounds(210, 34, 170, 28);
            dtpHasta.Value = DateTime.Today;

            lblTipo.Text = "Tipo";
            lblTipo.Font = Estilo.Subtitulo;
            lblTipo.ForeColor = Estilo.TextoSuave;
            lblTipo.AutoSize = true;
            lblTipo.SetBounds(402, 12, 100, 19);

            cbxTipo.DropDownStyle = ComboBoxStyle.DropDownList;
            Estilo.CampoTexto(cbxTipo);
            cbxTipo.SetBounds(400, 34, 200, 28);
            cbxTipo.Items.AddRange(new object[] { "Todas", "Ausencia", "Tardia" });
            cbxTipo.SelectedIndex = 0;

            Estilo.Primario(btnBuscar);
            btnBuscar.Text = "Buscar";
            btnBuscar.SetBounds(625, 30, 150, 36);
            btnBuscar.Click += (_, _) => Buscar();

            Estilo.Secundario(btnExportar);
            btnExportar.Text = "Exportar a Excel";
            btnExportar.SetBounds(790, 30, 190, 36);
            btnExportar.Click += (_, _) => Exportar();

            // Aqui salen los avisos. Antes "no hay incidencias en ese
            // rango" era una ventana, y como la busqueda corre sola al
            // abrir, lo primero que veia el usuario era un cuadro que
            // habia que cerrar.
            lblAviso.Font = Estilo.Subtitulo;
            lblAviso.ForeColor = Estilo.TextoSuave;
            lblAviso.TextAlign = ContentAlignment.MiddleLeft;
            lblAviso.AutoEllipsis = true;
            lblAviso.SetBounds(1000, 38, 230, 22);

            // El buscador va en el segundo renglon, debajo de las fechas:
            // el rango dice de cuando, y esto dice de quien.
            _buscador = Buscador.Poner(
                pnlFiltro, 20, 80,
                "Buscar oficial, cedula, turno o puesto",
                () => Buscador.Opciones(_resumen).Concat(Buscador.Opciones(_detalle)),
                Pintar, 300);

            pnlFiltro.Controls.AddRange(new Control[]
            { btnExportar, btnBuscar, cbxTipo, lblTipo,
              dtpHasta, lblHasta, dtpDesde, lblDesde });

            // ---------- Grillas ----------
            Estilo.GridSoloLectura(dtgResumen);
            dtgResumen.Dock = DockStyle.Fill;
            dtgResumen.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;

            grpResumen.Text = "Acumulado por oficial";
            grpResumen.Font = Estilo.GrillaEncabezado;
            grpResumen.ForeColor = Estilo.Azul;
            grpResumen.BackColor = Estilo.Fondo;
            grpResumen.Dock = DockStyle.Fill;
            grpResumen.Padding = new Padding(8, 6, 8, 8);
            grpResumen.Controls.Add(dtgResumen);

            Estilo.GridSoloLectura(dtgDetalle);
            dtgDetalle.Dock = DockStyle.Fill;
            dtgDetalle.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;

            grpDetalle.Text = "Detalle dia por dia";
            grpDetalle.Font = Estilo.GrillaEncabezado;
            grpDetalle.ForeColor = Estilo.Azul;
            grpDetalle.BackColor = Estilo.Fondo;
            grpDetalle.Dock = DockStyle.Fill;
            grpDetalle.Padding = new Padding(8, 6, 8, 8);
            grpDetalle.Controls.Add(dtgDetalle);

            tlp.Dock = DockStyle.Fill;
            tlp.ColumnCount = 1;
            tlp.RowCount = 2;
            tlp.RowStyles.Add(new RowStyle(SizeType.Percent, 42F));
            tlp.RowStyles.Add(new RowStyle(SizeType.Percent, 58F));
            tlp.Padding = new Padding(15, 10, 15, 15);
            tlp.BackColor = Estilo.Fondo;
            tlp.Controls.Add(grpResumen, 0, 0);
            tlp.Controls.Add(grpDetalle, 0, 1);

            Controls.Add(tlp);
            Controls.Add(pnlFiltro);
            Controls.Add(pnlBanda);

            // El aviso se agrega y se ancla DESPUES de que el panel ya
            // esta en la ventana: puesto antes, el panel medía todavia
            // 200 de ancho y el anclaje lo dejaba estirado casi mil
            // quinientos pixeles fuera de la pantalla, con lo que su
            // recorte con puntos suspensivos no entraba nunca.
            lblAviso.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            pnlFiltro.Controls.Add(lblAviso);
        }

        // =============================================================
        // BUSCAR
        // =============================================================
        private void Buscar()
        {
            if (dtpDesde.Value.Date > dtpHasta.Value.Date)
            {
                lblAviso.Text = "El 'Desde' quedo despues del 'Hasta': corrija el rango.";
                lblAviso.ForeColor = Estilo.RojoTexto;
                return;
            }

            try
            {
                Cursor = Cursors.WaitCursor;

                string? tipo = cbxTipo.SelectedIndex <= 0 ? null : cbxTipo.SelectedItem?.ToString();

                _resumen = _repo.ResumenIncidencias(dtpDesde.Value, dtpHasta.Value);
                _detalle = _repo.DetalleIncidencias(dtpDesde.Value, dtpHasta.Value, tipo);

                Pintar();

                Text = $"Historial  -  {dtpDesde.Value:dd/MM/yyyy} al {dtpHasta.Value:dd/MM/yyyy}";

                int dias = (dtpHasta.Value.Date - dtpDesde.Value.Date).Days + 1;

                lblAviso.Text = _resumen.Rows.Count == 0
                    ? $"En esos {dias} dia(s) no hay ninguna ausencia ni tardia registrada."
                    : $"{dias} dia(s)   |   {_resumen.Rows.Count} oficial(es) con incidencias   " +
                      $"|   {_detalle.Rows.Count} registro(s) en el detalle";

                lblAviso.ForeColor = _resumen.Rows.Count == 0
                    ? Estilo.TextoSuave : Estilo.Azul;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"No se pudo cargar el historial.\n\nDetalle tecnico:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>
        /// Vuelca a las dos grillas lo que pase el filtro de texto. Se
        /// llama al buscar por fechas y cada vez que se escribe en el
        /// buscador; a la base no se vuelve.
        ///
        /// El filtro cae sobre las dos: buscando un apellido queda el
        /// acumulado de esa persona arriba y sus dias abajo, que es
        /// justo lo que uno va a ver cuando busca a alguien.
        /// </summary>
        private void Pintar()
        {
            var resumen = Buscador.Filtrar(_resumen, _buscador?.Texto);
            var detalle = Buscador.Filtrar(_detalle, _buscador?.Texto);

            dtgResumen.DataSource = resumen;
            Estilo.SinOrdenamiento(dtgResumen);
            ResaltarResumen();

            dtgDetalle.DataSource = detalle;
            Estilo.SinOrdenamiento(dtgDetalle);
            ResaltarDetalle();

            bool filtrando = _buscador is not null && _buscador.HayFiltro;
            int totalRes = _resumen?.Rows.Count ?? 0;
            int totalDet = _detalle?.Rows.Count ?? 0;

            grpResumen.Text = filtrando
                ? $"Acumulado por oficial  ({resumen.Rows.Count} de {totalRes})" +
                  _buscador!.Coletilla
                : $"Acumulado por oficial  ({totalRes} con incidencias)";

            grpDetalle.Text = filtrando
                ? $"Detalle dia por dia  ({detalle.Rows.Count} de {totalDet} registros)"
                : $"Detalle dia por dia  ({totalDet} registro(s))";
        }

        /// <summary>Rojo si tiene 3 o mas ausencias, ambar si solo tardias.</summary>
        private void ResaltarResumen()
        {
            foreach (DataGridViewRow fila in dtgResumen.Rows)
            {
                int aus = Entero(fila, "Ausencias");
                int tar = Entero(fila, "Tardias");

                if (aus >= 3)
                {
                    fila.DefaultCellStyle.BackColor = Estilo.RojoFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.RojoTexto;
                }
                else if (aus > 0 || tar >= 3)
                {
                    fila.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
                }
            }
        }

        private void ResaltarDetalle()
        {
            if (!dtgDetalle.Columns.Contains("Tipo")) return;

            foreach (DataGridViewRow fila in dtgDetalle.Rows)
            {
                bool ausencia = fila.Cells["Tipo"].Value?.ToString() == "Ausencia";
                fila.DefaultCellStyle.BackColor = ausencia ? Estilo.RojoFondo : Estilo.AmbarFondo;
                fila.DefaultCellStyle.ForeColor = ausencia ? Estilo.RojoTexto : Estilo.AmbarTexto;
            }
        }

        private static int Entero(DataGridViewRow fila, string col)
        {
            if (!fila.DataGridView!.Columns.Contains(col)) return 0;
            var v = fila.Cells[col].Value;
            return v is null || v == DBNull.Value ? 0 : Convert.ToInt32(v);
        }

        // =============================================================
        // EXPORTAR
        // =============================================================
        private void Exportar()
        {
            if (dtgResumen.DataSource is not DataTable resumen || resumen.Rows.Count == 0)
            {
                lblAviso.Text = "No hay nada que exportar en ese rango.";
                lblAviso.ForeColor = Estilo.TextoSuave;
                return;
            }

            // Si el detalle no alcanzo a cargar, el Excel sale con la
            // hoja del acumulado y la de detalle vacia, en vez de
            // reventar con una conversion de un nulo.
            var detalle = dtgDetalle.DataSource as DataTable ?? TablaVacia();

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar el historial",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Historial_Incidencias_{dtpDesde.Value:yyyyMMdd}_{dtpHasta.Value:yyyyMMdd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                Cursor = Cursors.WaitCursor;
                GenerarExcel(dlg.FileName, resumen, detalle);

                // Se abre solo: quien pidio el historial lo quiere ver.
                Estilo.AbrirArchivo(dlg.FileName);
            }
            catch (IOException)
            {
                MessageBox.Show(
                    "No se pudo escribir el archivo. Probablemente ya lo tiene abierto en Excel.",
                    "Archivo en uso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"No se pudo exportar.\n\nDetalle tecnico:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>
        /// Tabla de una sola columna para la hoja de detalle cuando no
        /// hay nada que poner. Una tabla sin ninguna columna no se puede
        /// dibujar en el Excel: el ancho del encabezado seria cero.
        /// </summary>
        private static DataTable TablaVacia()
        {
            var t = new DataTable("Detalle");
            t.Columns.Add("Detalle", typeof(string));
            return t;
        }

        private void GenerarExcel(string ruta, DataTable resumen, DataTable detalle)
        {
            var cultura = CultureInfo.GetCultureInfo("es-CR");

            string rango =
                $"Del {dtpDesde.Value.ToString("d 'de' MMMM 'de' yyyy", cultura)} " +
                $"al {dtpHasta.Value.ToString("d 'de' MMMM 'de' yyyy", cultura)}";

            using var libro = new XLWorkbook();

            // ---------- Hoja 1: acumulado ----------
            var ws = libro.Worksheets.Add("Acumulado");
            // Si hay algo escrito en el buscador, el Excel sale con lo
            // filtrado, que es lo que se esta viendo. Eso hay que decirlo
            // en el papel: si no, parece el historial completo del rango
            // y no lo es.
            string? filtro = _buscador is not null && _buscador.HayFiltro
                ? $"Solo lo que coincide con \"{_buscador.Texto.Trim()}\""
                : null;

            int ft = EstiloExcel.Banner(ws, resumen.Columns.Count,
                "Historial de ausencias y tardias",
                "Base 105  ·  Clinica Marcial Fallas", rango.ToUpper(cultura), filtro);
            VolcarTabla(ws, resumen, ft);

            // ---------- Hoja 2: detalle ----------
            var ws2 = libro.Worksheets.Add("Detalle");
            int ft2 = EstiloExcel.Banner(ws2, detalle.Columns.Count,
                "Detalle dia por dia",
                "Base 105  ·  Clinica Marcial Fallas", rango.ToUpper(cultura), filtro);
            VolcarTabla(ws2, detalle, ft2);

            libro.SaveAs(ruta);
        }

        /// <summary>
        /// Vuelca una tabla con el aspecto de siempre: encabezado azul,
        /// franjas suaves y las lineas del cuadro.
        /// </summary>
        private static void VolcarTabla(IXLWorksheet ws, DataTable t, int filaTitulos)
        {
            int cols = t.Columns.Count;

            for (int c = 0; c < cols; c++)
                ws.Cell(filaTitulos, c + 1).Value = t.Columns[c].ColumnName;
            EstiloExcel.Encabezado(ws, filaTitulos, cols, 28);

            int fila = filaTitulos + 1;

            // La primera columna va a la izquierda solo cuando es un
            // nombre. En el detalle la primera es la fecha, y una fecha
            // pegada al borde izquierdo desalinea todo el cuadro.
            bool primeraEsTexto = t.Columns.Count > 0 &&
                                  t.Columns[0].DataType == typeof(string);

            foreach (DataRow r in t.Rows)
            {
                for (int c = 0; c < cols; c++)
                {
                    var celda = ws.Cell(fila, c + 1);

                    // Las fechas como fecha y los numeros como numero, no
                    // como texto que se les parezca: en texto, Excel les
                    // pone el triangulito verde de aviso, ordena las
                    // ausencias 1, 10, 2, y el filtro no ofrece ordenar
                    // por fecha.
                    switch (r[c])
                    {
                        // Un dato que no hay se deja en blanco de verdad: con
                        // una cadena vacia la celda cuenta como ocupada y el
                        // filtro de Excel ofrece un renglon vacio como si
                        // fuera un valor mas.
                        case null:
                        case DBNull:
                            break;

                        case DateTime fecha:
                            celda.Value = fecha;
                            break;

                        case int or short or long:
                            celda.Value = Convert.ToInt64(r[c]);
                            break;

                        case decimal or double or float:
                            celda.Value = Convert.ToDouble(r[c]);
                            break;

                        default:
                            celda.Value = r[c]?.ToString() ?? "";
                            break;
                    }

                    EstiloExcel.Celda(celda, centrado: c != 0 || !primeraEsTexto);

                    if (r[c] is DateTime) celda.Style.NumberFormat.Format = "dd/MM/yyyy";
                }
                fila++;
            }

            int ultima = fila - 1;

            if (ultima >= filaTitulos + 1)
            {
                // La franja primero y los colores encima, o quedan parches.
                EstiloExcel.Franjas(ws, filaTitulos + 1, ultima, cols);
                Resaltar(ws, t, filaTitulos, cols);
                EstiloExcel.Lineas(ws, filaTitulos, ultima, cols, columnasDeRotulo: 0);
                ws.Range(filaTitulos, 1, ultima, cols).SetAutoFilter();

                Leyenda(ws, t, ultima + 2, cols);
            }
            else
            {
                ws.Range(fila, 1, fila, cols).Merge();
                ws.Cell(fila, 1).Value = "No hay registros en ese rango de fechas.";
                ws.Cell(fila, 1).Style.Font.Italic = true;
                ws.Cell(fila, 1).Style.Font.FontColor = EstiloExcel.TextoSuave;
                ws.Cell(fila, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                EstiloExcel.Lineas(ws, filaTitulos, fila, cols, columnasDeRotulo: 0);
                ultima = fila;
            }

            EstiloExcel.Pie(ws, UltimaEscrita(ws, ultima) + 2, cols);

            ws.Columns(1, cols).AdjustToContents();
            for (int c = 1; c <= cols; c++)
                if (ws.Column(c).Width > 34) ws.Column(c).Width = 34;

            EstiloExcel.Impresion(ws, filaTitulos, columnasFijas: 0);
        }

        /// <summary>
        /// Los mismos colores que en pantalla: rojo el que lleva tres
        /// ausencias o mas, ambar el que tiene alguna ausencia o tres
        /// tardias; en el detalle, rojo la ausencia y ambar la tardia.
        ///
        /// El Excel salia en blanco y negro, asi que quien lo imprimia
        /// perdia justamente la senal que hace util el cuadro: a quien
        /// hay que llamar.
        /// </summary>
        private static void Resaltar(IXLWorksheet ws, DataTable t, int filaTitulos, int cols)
        {
            bool esResumen = t.Columns.Contains("Ausencias");
            bool esDetalle = t.Columns.Contains("Tipo");

            if (!esResumen && !esDetalle) return;

            for (int i = 0; i < t.Rows.Count; i++)
            {
                var r = t.Rows[i];
                var rango = ws.Range(filaTitulos + 1 + i, 1, filaTitulos + 1 + i, cols);

                if (esResumen)
                {
                    int aus = Numero(r, "Ausencias");
                    int tar = Numero(r, "Tardias");

                    if (aus >= 3)
                    {
                        rango.Style.Fill.BackgroundColor = EstiloExcel.RojoFondo;
                        rango.Style.Font.FontColor = EstiloExcel.RojoTexto;
                        rango.Style.Font.Bold = true;
                    }
                    else if (aus > 0 || tar >= 3)
                    {
                        rango.Style.Fill.BackgroundColor = EstiloExcel.AmbarFondo;
                        rango.Style.Font.FontColor = EstiloExcel.AmbarTexto;
                    }
                }
                else
                {
                    bool ausencia = (r["Tipo"]?.ToString() ?? "") == "Ausencia";

                    rango.Style.Fill.BackgroundColor = ausencia
                        ? EstiloExcel.RojoFondo : EstiloExcel.AmbarFondo;
                    rango.Style.Font.FontColor = ausencia
                        ? EstiloExcel.RojoTexto : EstiloExcel.AmbarTexto;
                }
            }
        }

        /// <summary>La leyenda que explica esos colores, segun la hoja.</summary>
        private static void Leyenda(IXLWorksheet ws, DataTable t, int fila, int cols)
        {
            if (t.Columns.Contains("Ausencias"))
                EstiloExcel.Leyenda(ws, fila, cols, new (string, XLColor?, XLColor?)[]
                {
                    ("Rojo = tres ausencias o mas",
                     EstiloExcel.RojoFondo, EstiloExcel.RojoTexto),
                    ("Amarillo = alguna ausencia, o tres tardias o mas",
                     EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto)
                });

            else if (t.Columns.Contains("Tipo"))
                EstiloExcel.Leyenda(ws, fila, cols, new (string, XLColor?, XLColor?)[]
                {
                    ("Rojo = ausencia",  EstiloExcel.RojoFondo, EstiloExcel.RojoTexto),
                    ("Amarillo = tardia", EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto)
                });
        }

        private static int Numero(DataRow r, string columna)
        {
            if (!r.Table.Columns.Contains(columna)) return 0;
            var v = r[columna];
            return v is null || v == DBNull.Value ? 0 : Convert.ToInt32(v);
        }

        /// <summary>
        /// Hasta donde llego lo escrito, contando la leyenda que se
        /// acaba de poner: el pie va despues de todo eso.
        /// </summary>
        private static int UltimaEscrita(IXLWorksheet ws, int minimo) =>
            Math.Max(minimo, ws.LastRowUsed()?.RowNumber() ?? minimo);
    }
}
