using System.Data;
using GestorDatos;

namespace formularios
{
    public partial class ConsultarOficial : Form
    {
        private readonly OficialesRepositorio _repo = new();

        /// <summary>Nombres y cedulas que ofrece el autocompletado.</summary>
        private List<string> _paraBuscar = new();

        /// <summary>Lo que hay en pantalla. Es lo mismo que se exporta.</summary>
        private DataTable _tabla = new();

        // =============================================================
        // AJUSTES RAPIDOS DEL RESALTADO
        // =============================================================
        // static readonly y no const: siendo const, el compilador
        // resuelve el "if" al compilar y avisa de codigo inaccesible.
        // Ese aviso no dice nada nuevo (el interruptor esta puesto a
        // proposito) pero se mezcla con los que si importan.
        private static readonly bool RESALTAR_VENCIDAS = true;
        private static readonly bool BLOQUEAR_SELECCION = true;

        public ConsultarOficial()
        {
            InitializeComponent();
            AplicarEstilo();
        }

        private void AplicarEstilo()
        {
            Estilo.Formulario(this);

            Estilo.Banda(pnlBanda);

            int margenTexto = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);
            lblBanda.Left = margenTexto;
            lblBandaSub.Left = margenTexto + 3;

            lblBanda.Font = Estilo.Titulo;
            lblBanda.ForeColor = Color.White;
            lblBanda.BackColor = Color.Transparent;
            Estilo.SubtituloBanda(lblBandaSub);
            lblBandaSub.AutoSize = false;
            Estilo.SobreBanda(btnMenuPrincipal);
            Estilo.AnclarDerecha(pnlBanda, btnMenuPrincipal);

            pnlFiltros.BackColor = Color.White;
            foreach (var l in new[] { label1, label2, label4, label6, lblBuscar })
            {
                l.Font = Estilo.Subtitulo;
                l.ForeColor = Estilo.TextoSuave;
            }
            foreach (Control c in new Control[]
                { cbxHorario, cbxDiaLibre, cbxAutorizacion, cbxEstado, txtBuscar })
                Estilo.CampoTexto(c);

            Estilo.Autocompletar(txtBuscar, () => _paraBuscar, CargarDatos);

            Estilo.Primario(btnFiltrar);
            Estilo.Primario(btnBuscar);
            Estilo.Secundario(btnLimpiar);
            Estilo.Primario(btnExportar);
            Estilo.PieDePagina(lblLeyenda);

            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };
        }

        // =============================================================
        // CARGA
        // =============================================================
        private void ConsultarOficial_Load(object sender, EventArgs e)
        {
            // Los nueve roles salen del repositorio: un solo lugar manda.
            cbxHorario.Items.AddRange(AsistenciaRepositorio.TodosLosRoles());
            cbxDiaLibre.Items.AddRange(AsistenciaRepositorio.DiasDeRegistro());

            // Las sugerencias de la caja de busqueda. Si falla, la caja
            // sigue buscando igual: solo se queda sin lista.
            try { _paraBuscar = _repo.ParaAutocompletar(); }
            catch (Exception ex) { Registro.Anotar("No se pudo cargar el autocompletado", ex); }

            Estilo.GridSoloLectura(dtgOficiales);
            dtgOficiales.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dtgOficiales.RowTemplate.Height = 28;

            if (BLOQUEAR_SELECCION)
                dtgOficiales.SelectionChanged += (_, _) =>
                {
                    if (dtgOficiales.SelectedCells.Count > 0) dtgOficiales.ClearSelection();
                };

            CargarDatos();
        }

        private void CargarDatos()
        {
            try
            {
                Cursor = Cursors.WaitCursor;

                _tabla = _repo.Listar(
                    ValorSeleccionado(cbxHorario),
                    ValorSeleccionado(cbxDiaLibre),
                    ValorSeleccionado(cbxAutorizacion),
                    ValorSeleccionado(cbxEstado),
                    txtBuscar.Text);

                dtgOficiales.DataSource = _tabla;

                Estilo.SinOrdenamiento(dtgOficiales);
                ResaltarPortacionesVencidas();
                MostrarResumen(_tabla.Rows.Count);

                dtgOficiales.ClearSelection();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"No se pudo cargar la lista de personal.\n\nDetalle tecnico:\n{ex.Message}",
                    "Error de base de datos", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                Cursor = Cursors.Default;
            }
        }

        private static string? ValorSeleccionado(ComboBox combo) =>
            combo.SelectedIndex < 0 ? null : combo.SelectedItem?.ToString();

        private void ResaltarPortacionesVencidas()
        {
            if (!RESALTAR_VENCIDAS) return;

            foreach (DataGridViewRow fila in dtgOficiales.Rows)
            {
                // El externo se marca aparte: no es de la planilla,
                // lo trae otra empresa.
                if (dtgOficiales.Columns.Contains("Rol / Horario") &&
                    Roles.EsExterno(fila.Cells["Rol / Horario"].Value?.ToString()))
                {
                    fila.DefaultCellStyle.BackColor = Estilo.LilaFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.LilaTexto;
                }

                if (dtgOficiales.Columns.Contains("Vence portacion") &&
                    fila.Cells["Vence portacion"].Value is DateTime vence &&
                    vence < DateTime.Today)
                {
                    fila.DefaultCellStyle.BackColor = Estilo.RojoFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.RojoTexto;
                }
            }
        }

        private bool HayFiltro =>
            cbxHorario.SelectedIndex >= 0 ||
            cbxDiaLibre.SelectedIndex >= 0 ||
            cbxAutorizacion.SelectedIndex >= 0 ||
            cbxEstado.SelectedIndex >= 0 ||
            txtBuscar.Text.Trim().Length > 0;

        private void MostrarResumen(int cantidad)
        {
            int vencidas = 0, externos = 0;

            foreach (DataGridViewRow f in dtgOficiales.Rows)
            {
                if (dtgOficiales.Columns.Contains("Vence portacion") &&
                    f.Cells["Vence portacion"].Value is DateTime v && v < DateTime.Today)
                    vencidas++;

                if (dtgOficiales.Columns.Contains("Rol / Horario") &&
                    Roles.EsExterno(f.Cells["Rol / Horario"].Value?.ToString()))
                    externos++;
            }

            Text = HayFiltro
                ? $"Consulta de Personal  -  {cantidad} resultado(s) con filtro"
                : $"Consulta de Personal  -  {cantidad} registro(s) en total";

            // Cuando no hay resultados se dice aqui mismo, sin ventana:
            // basta con quitar un filtro para volver a ver la lista.
            lblLeyenda.Text = cantidad == 0 && HayFiltro
                ? "Nadie cumple con los filtros seleccionados. Quite alguno y busque de nuevo."
                : $"Mostrando {cantidad} persona(s):  {cantidad - externos} oficial(es) " +
                  $"y {externos} autorizado(s) externo(s).     " +
                  $"Fondo rojo = portacion vencida ({vencidas}).     " +
                  "Fondo azul = autorizado externo.";
        }

        // =============================================================
        // BOTONES
        // =============================================================
        private void button1_Click(object sender, EventArgs e) => CargarDatos();

        private void btnBuscar_Click(object sender, EventArgs e) => CargarDatos();

        private void btnLimpiar_Click(object sender, EventArgs e)
        {
            cbxHorario.SelectedIndex = -1;
            cbxDiaLibre.SelectedIndex = -1;
            cbxAutorizacion.SelectedIndex = -1;
            cbxEstado.SelectedIndex = -1;
            txtBuscar.Clear();
            CargarDatos();
        }

        // =============================================================
        // EXCEL
        // =============================================================
        private void btnExportar_Click(object sender, EventArgs e)
        {
            if (_tabla.Rows.Count == 0)
            {
                MessageBox.Show(
                    "No hay nada que exportar con los filtros actuales.",
                    "Sin datos", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar la consulta de personal",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Consulta_Personal_Base105_{DateTime.Today:yyyy-MM-dd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                Cursor = Cursors.WaitCursor;
                ReporteOficialesExcel.Generar(dlg.FileName, _tabla, DescripcionDeFiltros());

                // Se abre solo: quien pidio el Excel lo quiere ver.
                Estilo.AbrirArchivo(dlg.FileName);
            }
            catch (IOException)
            {
                MessageBox.Show(
                    "No se pudo escribir el archivo. Probablemente ya lo tiene abierto " +
                    "en Excel. Cierrelo e intente de nuevo.",
                    "Archivo en uso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (UnauthorizedAccessException)
            {
                MessageBox.Show(
                    "No tiene permiso para guardar en esa carpeta. Escoja otra, " +
                    "por ejemplo Documentos.",
                    "Sin permiso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"No se pudo generar el Excel.\n\nDetalle tecnico:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>Que filtros estaban puestos, para dejarlo escrito en el Excel.</summary>
        private string DescripcionDeFiltros()
        {
            if (!HayFiltro) return "Todo el personal registrado, sin filtros";

            var partes = new List<string>();
            void Agregar(string etiqueta, ComboBox c)
            {
                if (c.SelectedIndex >= 0) partes.Add($"{etiqueta}: {c.SelectedItem}");
            }

            Agregar("Rol", cbxHorario);
            Agregar("Dia libre", cbxDiaLibre);
            Agregar("Autorizacion", cbxAutorizacion);
            Agregar("Estado", cbxEstado);

            if (txtBuscar.Text.Trim().Length > 0)
                partes.Add($"Busqueda: {txtBuscar.Text.Trim()}");

            return string.Join("     |     ", partes);
        }

        private void btnMenuPrincipal_Click(object sender, EventArgs e) =>
            Estilo.VolverAlMenu(this);
    }
}
