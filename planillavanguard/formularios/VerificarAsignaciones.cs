using System.Data;
using System.Globalization;
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Revision previa al reporte: como quedo cada turno y el detalle
    /// puesto por puesto. Construida por codigo, sin Designer ni resx.
    /// </summary>
    public class VerificarAsignaciones : Form
    {
        private readonly AsistenciaRepositorio _repo = new();
        private readonly DateTime _fecha;

        private readonly Panel pnlBanda = new();
        private readonly Label lblTitulo = new();
        private readonly Label lblFecha = new();
        private readonly Button btnVolverPaso = new();
        private readonly Button btnCerrar = new();

        private readonly Panel pnlFiltro = new();
        private readonly Label lblFiltro = new();
        private readonly ComboBox cbxTurno = new();
        private readonly Label lblAviso = new();
        private Buscador? _buscador;

        /// <summary>
        /// El detalle completo del turno escogido, sin filtrar. El
        /// buscador trabaja sobre esta copia: asi borrar lo escrito
        /// devuelve la lista entera sin tener que ir a la base otra vez.
        /// </summary>
        private DataTable? _detalle;

        private readonly GroupBox grpResumen = new();
        private readonly DataGridView dtgResumen = new();
        private readonly GroupBox grpDetalle = new();
        private readonly DataGridView dtgDetalle = new();
        private readonly TableLayoutPanel tlp = new();

        public VerificarAsignaciones(DateTime fecha)
        {
            _fecha = fecha;
            ConstruirInterfaz();
            Load += (_, _) => Cargar();
        }

        private void ConstruirInterfaz()
        {
            Estilo.Formulario(this);
            Text = "Verificacion de asignaciones";
            ClientSize = new Size(1200, 700);
            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };

            var cultura = CultureInfo.GetCultureInfo("es-CR");

            Estilo.Banda(pnlBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 95;

            int margenTexto = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);

            lblTitulo.Text = "VERIFICACION DE ASIGNACIONES";
            lblTitulo.Font = Estilo.Titulo;
            lblTitulo.ForeColor = Color.White;
            lblTitulo.BackColor = Color.Transparent;
            lblTitulo.SetBounds(margenTexto, 22, 600, 32);

            lblFecha.Text = _fecha.ToString("dddd d 'de' MMMM 'de' yyyy", cultura).ToUpper(cultura);
            Estilo.SubtituloBanda(lblFecha);
            lblFecha.AutoSize = false;
            lblFecha.SetBounds(margenTexto + 3, 56, 600, 20);

            // Dos salidas: una vuelve a la pantalla anterior, la otra
            // se va derecho al menu principal.
            Estilo.SobreBanda(btnVolverPaso);
            btnVolverPaso.Text = "Volver atras";
            btnVolverPaso.Size = new Size(160, 40);
            btnVolverPaso.Click += (_, _) => Close();

            Estilo.SobreBanda(btnCerrar);
            btnCerrar.Text = "Volver al Menu";
            btnCerrar.Size = new Size(170, 40);
            btnCerrar.Click += (_, _) => Estilo.VolverAlMenu(this);

            pnlBanda.Controls.AddRange(new Control[] { btnVolverPaso, btnCerrar, lblFecha, lblTitulo });

            // El de menu pegado al borde y el de un paso atras a su lado.
            Estilo.AnclarDerecha(pnlBanda, btnCerrar);
            Estilo.AnclarDerecha(pnlBanda, btnVolverPaso, btnCerrar.Width + 12);

            // Entrando derecho desde el menu, "atras" y "al menu" harian
            // lo mismo: se esconde el de atras para no poner dos botones
            // que llevan al mismo lugar.
            Shown += (_, _) =>
            {
                if (Owner is null or MenuPrincipal) btnVolverPaso.Visible = false;
            };

            pnlFiltro.Dock = DockStyle.Top;
            pnlFiltro.Height = 70;

            // La misma franja de filtros que las demas pantallas. Con
            // blanco puro esta se veia de otro sistema.
            pnlFiltro.BackColor = Estilo.Superficie;

            lblFiltro.Text = "Ver detalle del turno";
            lblFiltro.Font = Estilo.Subtitulo;
            lblFiltro.ForeColor = Estilo.TextoSuave;
            lblFiltro.AutoSize = true;
            lblFiltro.SetBounds(22, 10, 200, 19);

            cbxTurno.DropDownStyle = ComboBoxStyle.DropDownList;
            Estilo.CampoTexto(cbxTurno);
            cbxTurno.SetBounds(20, 32, 260, 28);
            cbxTurno.Items.Add("Todos los turnos");
            cbxTurno.Items.AddRange(AsistenciaRepositorio.Turnos);
            cbxTurno.SelectedIndex = 0;
            cbxTurno.SelectedIndexChanged += (_, _) => CargarDetalle();

            // El buscador va al lado del turno: se escoge el turno y se
            // busca dentro de el. Filtra el detalle, que es la lista
            // larga; el resumen son ocho renglones y se ve entero.
            _buscador = Buscador.Poner(
                pnlFiltro, 300, 32,
                "Buscar puesto, oficial o quien lo cubre",
                () => Buscador.Opciones(_detalle),
                PintarDetalle, 280);

            // Sin AutoSize y anclado a los dos lados: la lista de turnos
            // pendientes puede ser larga, y con AutoSize se salia del
            // panel en vez de recortarse.
            lblAviso.Font = Estilo.GrillaEncabezado;
            lblAviso.AutoSize = false;
            lblAviso.AutoEllipsis = true;
            lblAviso.TextAlign = ContentAlignment.MiddleLeft;
            lblAviso.SetBounds(840, 34, 320, 26);

            pnlFiltro.Controls.AddRange(new Control[] { cbxTurno, lblFiltro });

            Estilo.GridSoloLectura(dtgResumen);
            dtgResumen.Dock = DockStyle.Fill;
            dtgResumen.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;

            grpResumen.Text = "Resumen por turno";
            grpResumen.Font = Estilo.GrillaEncabezado;
            grpResumen.ForeColor = Estilo.Azul;
            grpResumen.BackColor = Estilo.Fondo;
            grpResumen.Dock = DockStyle.Fill;
            grpResumen.Padding = new Padding(8, 6, 8, 8);
            grpResumen.Controls.Add(dtgResumen);

            Estilo.GridSoloLectura(dtgDetalle);
            dtgDetalle.Dock = DockStyle.Fill;
            dtgDetalle.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;

            grpDetalle.Text = "Detalle puesto por puesto";
            grpDetalle.Font = Estilo.GrillaEncabezado;
            grpDetalle.ForeColor = Estilo.Azul;
            grpDetalle.BackColor = Estilo.Fondo;
            grpDetalle.Dock = DockStyle.Fill;
            grpDetalle.Padding = new Padding(8, 6, 8, 8);
            grpDetalle.Controls.Add(dtgDetalle);

            tlp.Dock = DockStyle.Fill;
            tlp.ColumnCount = 1;
            tlp.RowCount = 2;
            tlp.RowStyles.Add(new RowStyle(SizeType.Percent, 32F));
            tlp.RowStyles.Add(new RowStyle(SizeType.Percent, 68F));
            tlp.Padding = new Padding(15, 10, 15, 15);
            tlp.BackColor = Estilo.Fondo;
            tlp.Controls.Add(grpResumen, 0, 0);
            tlp.Controls.Add(grpDetalle, 0, 1);

            Controls.Add(tlp);
            Controls.Add(pnlFiltro);
            Controls.Add(pnlBanda);

            // El aviso se agrega y se ancla DESPUES de que el panel ya
            // esta en la ventana: puesto antes, el panel todavia medía
            // 200 de ancho y el anclaje lo dejaba creciendo casi mil
            // pixeles fuera de la pantalla, con lo que su recorte con
            // puntos suspensivos nunca entraba a funcionar.
            lblAviso.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            pnlFiltro.Controls.Add(lblAviso);
        }

        private void Cargar()
        {
            try
            {
                Cursor = Cursors.WaitCursor;

                DataTable resumen = _repo.ResumenPorTurno(_fecha);
                dtgResumen.DataSource = resumen;
                Estilo.SinOrdenamiento(dtgResumen);
                ResaltarResumen();

                CargarDetalle();
                MostrarAviso(resumen);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"No se pudo cargar la verificacion.\n\nDetalle tecnico:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally { Cursor = Cursors.Default; }
        }

        private void CargarDetalle()
        {
            try
            {
                string? turno = cbxTurno.SelectedIndex <= 0 ? null : cbxTurno.SelectedItem?.ToString();

                _detalle = _repo.DetalleDelDia(_fecha, turno);
                PintarDetalle();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"No se pudo cargar el detalle.\n\nDetalle tecnico:\n{ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        /// <summary>
        /// Vuelca al detalle lo que pase el filtro de texto. Se llama al
        /// cargar y cada vez que se busca; a la base no se vuelve.
        /// </summary>
        private void PintarDetalle()
        {
            string? turno = cbxTurno.SelectedIndex <= 0 ? null : cbxTurno.SelectedItem?.ToString();

            var visibles = Buscador.Filtrar(_detalle, _buscador?.Texto);

            dtgDetalle.DataSource = visibles;
            Estilo.SinOrdenamiento(dtgDetalle);
            ResaltarDetalle();

            int total = _detalle?.Rows.Count ?? 0;

            string cuantos = _buscador is not null && _buscador.HayFiltro
                ? $"({visibles.Rows.Count} de {total})"
                : $"({total})";

            grpDetalle.Text = (turno is null
                ? $"Detalle puesto por puesto  -  todos los turnos  {cuantos}"
                : $"Detalle del turno {turno}  {cuantos}")
                + (_buscador?.Coletilla ?? "");
        }

        private void ResaltarResumen()
        {
            foreach (DataGridViewRow fila in dtgResumen.Rows)
            {
                int sinCubrir = ValorEntero(fila, "Sin cubrir");
                int sinPuesto = ValorEntero(fila, "Sin puesto");
                int tardias = ValorEntero(fila, "Tardias");

                if (sinCubrir > 0 || sinPuesto > 0)
                {
                    fila.DefaultCellStyle.BackColor = Estilo.RojoFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.RojoTexto;
                }
                else if (tardias > 0)
                {
                    fila.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
                }
            }
        }

        private void ResaltarDetalle()
        {
            if (!dtgDetalle.Columns.Contains("Estado")) return;

            foreach (DataGridViewRow fila in dtgDetalle.Rows)
            {
                string estado = fila.Cells["Estado"].Value?.ToString() ?? "";

                if (estado == "Tardia")
                {
                    fila.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
                }
                else if (estado == "Ausente")
                {
                    object? cubre = dtgDetalle.Columns.Contains("Lo cubre")
                        ? fila.Cells["Lo cubre"].Value : null;

                    bool cubierto = cubre is not null && cubre != DBNull.Value &&
                                    !string.IsNullOrWhiteSpace(cubre.ToString());

                    fila.DefaultCellStyle.BackColor = cubierto ? Color.Gainsboro : Estilo.RojoFondo;
                    fila.DefaultCellStyle.ForeColor = cubierto ? Estilo.Texto : Estilo.RojoTexto;
                }
            }
        }

        private void MostrarAviso(DataTable resumen)
        {
            var pendientes = _repo.TurnosPendientes(_fecha);
            int descubiertos = 0, tardias = 0;

            foreach (DataRow r in resumen.Rows)
            {
                descubiertos += Entero(r, "Sin cubrir");
                tardias += Entero(r, "Tardias");
            }

            if (pendientes.Count > 0)
            {
                lblAviso.Text = $"Faltan {pendientes.Count} turno(s) por pasar lista: " +
                                string.Join(", ", pendientes);
                lblAviso.ForeColor = Estilo.RojoTexto;
            }
            else if (descubiertos > 0)
            {
                lblAviso.Text = $"Los {AsistenciaRepositorio.TotalTurnos} turnos estan " +
                                $"cerrados, pero quedan {descubiertos} puesto(s) sin cubrir.";
                lblAviso.ForeColor = Estilo.Ambar;
            }
            else
            {
                lblAviso.Text = $"Todo cuadra: los {AsistenciaRepositorio.TotalTurnos} turnos " +
                                "estan cerrados y no hay puestos descubiertos." +
                                (tardias > 0 ? $"  Hubo {tardias} tardia(s)." : "");
                lblAviso.ForeColor = Estilo.VerdeTexto;
            }
        }

        /// <summary>
        /// Un numero de la tabla del resumen. Si la columna no viniera
        /// (una base a medio actualizar) cuenta como cero en vez de
        /// tumbar la pantalla.
        /// </summary>
        private static int Entero(DataRow r, string columna)
        {
            if (!r.Table.Columns.Contains(columna)) return 0;
            var v = r[columna];
            return v is null || v == DBNull.Value ? 0 : Convert.ToInt32(v);
        }

        private static int ValorEntero(DataGridViewRow fila, string columna)
        {
            if (!fila.DataGridView!.Columns.Contains(columna)) return 0;
            var v = fila.Cells[columna].Value;
            return v is null || v == DBNull.Value ? 0 : Convert.ToInt32(v);
        }
    }
}
