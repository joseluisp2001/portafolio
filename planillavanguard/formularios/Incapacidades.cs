using System.Data;
using System.Globalization;
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Registro y control de incapacidades, con dias restantes.
    /// Construida por codigo: no lleva Designer ni resx.
    /// </summary>
    public class Incapacidades : Form
    {
        private readonly AsistenciaRepositorio _repo = new();
        private List<OficialDisponible> _oficiales = new();

        private readonly Panel pnlBanda = new();
        private readonly Label lblTitulo = new();
        private readonly Label lblSub = new();
        private readonly Button btnCerrar = new();

        private readonly GroupBox grpNueva = new();
        private readonly Label lblOficial = new();
        private readonly ComboBox cbxOficial = new();
        private readonly Label lblBoleta = new();
        private readonly TextBox txtBoleta = new();
        private readonly Label lblInicio = new();
        private readonly DateTimePicker dtpInicio = new();
        private readonly Label lblFin = new();
        private readonly DateTimePicker dtpFin = new();
        private readonly Label lblObs = new();
        private readonly TextBox txtObs = new();
        private readonly Label lblDias = new();
        private readonly Button btnAgregar = new();

        private readonly GroupBox grpLista = new();
        private readonly DataGridView dtg = new();
        private readonly CheckBox chkVigentes = new();
        private readonly Button btnEliminar = new();
        private readonly Label lblResumen = new();
        private readonly Panel pnlInferior = new();

        private readonly Panel pnlBusca = new();
        private readonly TextBox txtBuscar = new();
        private readonly Button btnBuscar = new();
        private readonly Button btnVerTodo = new();
        private readonly Button btnActualizar = new();

        public Incapacidades()
        {
            ConstruirInterfaz();
            Load += (_, _) => { CargarOficiales(); Cargar(); };
        }

        private void ConstruirInterfaz()
        {
            Estilo.Formulario(this);
            Text = "Incapacidades";
            ClientSize = new Size(1250, 720);
            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };

            // ---------- Banda ----------
            Estilo.Banda(pnlBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 95;

            int margenTexto = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);

            lblTitulo.Text = "INCAPACIDADES";
            lblTitulo.Font = Estilo.Titulo;
            lblTitulo.ForeColor = Color.White;
            lblTitulo.BackColor = Color.Transparent;
            lblTitulo.SetBounds(margenTexto, 22, 600, 32);

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

            // ---------- Formulario de alta ----------
            grpNueva.Text = "Agregar incapacidad";
            grpNueva.Font = Estilo.GrillaEncabezado;
            grpNueva.ForeColor = Estilo.Azul;
            grpNueva.BackColor = Estilo.Superficie;
            grpNueva.Dock = DockStyle.Top;
            grpNueva.Height = 175;
            grpNueva.Padding = new Padding(15, 10, 15, 10);

            lblOficial.Text = "Oficial";
            lblBoleta.Text = "Numero de boleta";
            lblInicio.Text = "Fecha de inicio";
            lblFin.Text = "Fecha de fin";
            lblObs.Text = "Observacion";

            foreach (var l in new[] { lblOficial, lblBoleta, lblInicio, lblFin, lblObs })
            {
                l.Font = Estilo.Subtitulo;
                l.ForeColor = Estilo.TextoSuave;
                l.AutoSize = true;
            }

            lblOficial.SetBounds(20, 30, 100, 19);
            cbxOficial.DropDownStyle = ComboBoxStyle.DropDownList;
            Estilo.CampoTexto(cbxOficial);
            cbxOficial.SetBounds(20, 52, 340, 28);

            lblBoleta.SetBounds(380, 30, 140, 19);
            Estilo.CampoTexto(txtBoleta);
            txtBoleta.MaxLength = 30;
            txtBoleta.SetBounds(380, 52, 180, 27);

            lblInicio.SetBounds(580, 30, 120, 19);
            dtpInicio.Format = DateTimePickerFormat.Short;
            Estilo.CampoTexto(dtpInicio);
            dtpInicio.SetBounds(580, 52, 160, 27);
            dtpInicio.Value = DateTime.Today;
            dtpInicio.ValueChanged += (_, _) => CalcularDias();

            lblFin.SetBounds(760, 30, 120, 19);
            dtpFin.Format = DateTimePickerFormat.Short;
            Estilo.CampoTexto(dtpFin);
            dtpFin.SetBounds(760, 52, 160, 27);
            dtpFin.Value = DateTime.Today.AddDays(2);
            dtpFin.ValueChanged += (_, _) => CalcularDias();

            lblDias.Font = Estilo.GrillaEncabezado;
            lblDias.ForeColor = Estilo.Azul;
            lblDias.AutoSize = true;
            lblDias.SetBounds(940, 58, 200, 20);

            lblObs.SetBounds(20, 92, 120, 19);
            Estilo.CampoTexto(txtObs);
            txtObs.MaxLength = 200;
            txtObs.SetBounds(20, 114, 900, 27);

            Estilo.Primario(btnAgregar);
            btnAgregar.Text = "Agregar incapacidad";
            btnAgregar.SetBounds(940, 108, 230, 40);
            btnAgregar.Click += (_, _) => Agregar();

            grpNueva.Controls.AddRange(new Control[]
            { btnAgregar, txtObs, lblObs, lblDias, dtpFin, lblFin,
              dtpInicio, lblInicio, txtBoleta, lblBoleta, cbxOficial, lblOficial });

            // ---------- Lista ----------
            Estilo.GridSoloLectura(dtg);
            dtg.Dock = DockStyle.Fill;
            dtg.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;

            // Buscador encima de la lista
            pnlBusca.Dock = DockStyle.Top;
            pnlBusca.Height = 44;
            pnlBusca.BackColor = Estilo.Fondo;

            Estilo.CampoTexto(txtBuscar);
            txtBuscar.SetBounds(2, 8, 300, 27);
            txtBuscar.PlaceholderText = "Buscar oficial, cedula o boleta";

            // Los oficiales ya estan cargados en memoria para el
            // desplegable, asi que las sugerencias salen de ahi.
            Estilo.Autocompletar(txtBuscar,
                () => _oficiales.Select(o => o.Nombre)
                                .Concat(_oficiales.Select(o => o.Cedula)),
                Cargar);

            Estilo.Primario(btnBuscar);
            btnBuscar.Text = "Buscar";
            btnBuscar.SetBounds(312, 6, 120, 31);
            btnBuscar.Click += (_, _) => Cargar();

            Estilo.Secundario(btnVerTodo);
            btnVerTodo.Text = "Ver todo";
            btnVerTodo.SetBounds(442, 6, 120, 31);
            btnVerTodo.Click += (_, _) => { txtBuscar.Clear(); Cargar(); };

            Estilo.Secundario(btnActualizar);
            btnActualizar.Text = "Actualizar lista";
            btnActualizar.SetBounds(572, 6, 150, 31);
            btnActualizar.Click += (_, _) => { CargarOficiales(); Cargar(); };

            pnlBusca.Controls.AddRange(new Control[]
            { btnActualizar, btnVerTodo, btnBuscar, txtBuscar });

            grpLista.Text = "Incapacidades registradas";
            grpLista.Font = Estilo.GrillaEncabezado;
            grpLista.ForeColor = Estilo.Azul;
            grpLista.BackColor = Estilo.Fondo;
            grpLista.Dock = DockStyle.Fill;
            grpLista.Padding = new Padding(15, 10, 15, 10);
            grpLista.Controls.Add(dtg);
            grpLista.Controls.Add(pnlBusca);
            dtg.BringToFront();

            // ---------- Inferior ----------
            pnlInferior.Dock = DockStyle.Bottom;
            pnlInferior.Height = 70;
            pnlInferior.BackColor = Estilo.Superficie;

            chkVigentes.Text = "Mostrar solo vigentes y programadas";
            chkVigentes.Font = Estilo.Subtitulo;
            chkVigentes.AutoSize = true;
            chkVigentes.SetBounds(20, 25, 300, 20);
            chkVigentes.CheckedChanged += (_, _) => Cargar();

            Estilo.Secundario(btnEliminar);
            btnEliminar.Text = "Eliminar seleccionada";
            btnEliminar.SetBounds(340, 15, 220, 40);
            btnEliminar.Click += (_, _) => Eliminar();

            lblResumen.Font = Estilo.Subtitulo;
            lblResumen.ForeColor = Estilo.TextoSuave;
            lblResumen.TextAlign = ContentAlignment.MiddleRight;
            lblResumen.SetBounds(600, 25, 620, 20);

            pnlInferior.Controls.AddRange(new Control[]
            { btnEliminar, chkVigentes });

            Controls.Add(grpLista);
            Controls.Add(pnlInferior);
            Controls.Add(grpNueva);
            Controls.Add(pnlBanda);

            // El resumen se agrega DESPUES de que el panel ya esta en la
            // ventana, y solo ahi se ancla.
            //
            // Puesto antes, el panel todavia medía lo que mide un panel
            // recien hecho -- 200 de ancho -- y el anclaje guardaba esa
            // distancia al borde: al abrirse la ventana el rotulo se iba
            // MIL pixeles a la derecha del borde, o sea que este renglon
            // no se veia nunca. Es el mismo tropiezo que ya tenia
            // resuelto Estilo.AnclarDerecha para los botones de la banda.
            lblResumen.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            pnlInferior.Controls.Add(lblResumen);

            CalcularDias();
        }

        // =============================================================
        // DATOS
        // =============================================================
        private void CargarOficiales()
        {
            try
            {
                _oficiales = _repo.ListarOficialesSimple();
                cbxOficial.DataSource = _oficiales
                    .Select(o => new
                    {
                        o.IdOficial,
                        Texto = o.EsExterno
                            ? $"{o.Nombre}   ({o.Cedula})   -  autorizado externo"
                            : $"{o.Nombre}   ({o.Cedula})   -  turno {o.Horario}"
                    })
                    .ToList();
                cbxOficial.DisplayMember = "Texto";
                cbxOficial.ValueMember = "IdOficial";
                cbxOficial.SelectedIndex = -1;
            }
            catch (Exception ex) { Error("No se pudo cargar la lista de oficiales.", ex); }
        }

        private void Cargar()
        {
            try
            {
                Cursor = Cursors.WaitCursor;

                DataTable t = _repo.ListarIncapacidades(chkVigentes.Checked, txtBuscar.Text);
                dtg.DataSource = t;
                Estilo.SinOrdenamiento(dtg);
                if (dtg.Columns.Contains("Id")) dtg.Columns["Id"]!.Visible = false;

                Resaltar();

                int activas = 0, programadas = 0;
                foreach (DataRow r in t.Rows)
                {
                    string e = r["Estado"].ToString() ?? "";
                    if (e == "Activa") activas++;
                    else if (e == "Programada") programadas++;
                }

                grpLista.Text = txtBuscar.Text.Trim().Length > 0
                    ? $"Incapacidades registradas  ({t.Rows.Count})  -  " +
                      $"filtrando por \"{txtBuscar.Text.Trim()}\""
                    : $"Incapacidades registradas  ({t.Rows.Count})";
                lblResumen.Text = $"Activas hoy: {activas}     |     " +
                                  $"Programadas: {programadas}     |     " +
                                  $"Total mostradas: {t.Rows.Count}";
            }
            catch (Exception ex) { Error("No se pudo cargar la lista.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>Activa en azul, programada en ambar, vencida en gris.</summary>
        private void Resaltar()
        {
            if (!dtg.Columns.Contains("Estado")) return;

            foreach (DataGridViewRow fila in dtg.Rows)
            {
                switch (fila.Cells["Estado"].Value?.ToString())
                {
                    case "Activa":
                        fila.DefaultCellStyle.BackColor = Estilo.LilaFondo;
                        fila.DefaultCellStyle.ForeColor = Estilo.LilaTexto;
                        break;
                    case "Programada":
                        fila.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                        fila.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
                        break;
                    default:
                        fila.DefaultCellStyle.ForeColor = Estilo.TextoSuave;
                        break;
                }
            }
        }

        private void CalcularDias()
        {
            int dias = (dtpFin.Value.Date - dtpInicio.Value.Date).Days + 1;

            if (dias < 1)
            {
                lblDias.Text = "Rango invalido";
                lblDias.ForeColor = Estilo.RojoTexto;
            }
            else
            {
                lblDias.Text = $"{dias} dia(s) de incapacidad";
                lblDias.ForeColor = Estilo.Azul;
            }
        }

        // =============================================================
        // AGREGAR
        // =============================================================
        private void Agregar()
        {
            if (cbxOficial.SelectedIndex < 0)
            {
                Avisar("Seleccione el oficial.");
                cbxOficial.Focus();
                return;
            }

            int idOficial = (int)cbxOficial.SelectedValue!;
            DateTime ini = dtpInicio.Value.Date;
            DateTime fin = dtpFin.Value.Date;

            if (fin < ini)
            {
                Avisar("La fecha de fin no puede ser anterior a la de inicio.");
                dtpFin.Focus();
                return;
            }

            int dias = (fin - ini).Days + 1;

            try
            {
                if (_repo.ExisteTraslape(idOficial, ini, fin))
                {
                    MessageBox.Show(
                        "Ese oficial ya tiene una incapacidad registrada que se cruza " +
                        "con esas fechas.\n\nRevise la lista de abajo antes de continuar.",
                        "Fechas traslapadas", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                Cursor = Cursors.WaitCursor;

                var (_, quitadas) = _repo.AgregarIncapacidad(new Incapacidad
                {
                    IdOficial = idOficial,
                    NumeroBoleta = string.IsNullOrWhiteSpace(txtBoleta.Text) ? null : txtBoleta.Text.Trim(),
                    FechaInicio = ini,
                    FechaFin = fin,
                    Observacion = string.IsNullOrWhiteSpace(txtObs.Text) ? null : txtObs.Text.Trim()
                });

                var cultura = CultureInfo.GetCultureInfo("es-CR");
                string quien = cbxOficial.Text;

                Limpiar();
                Cargar();

                // Sin ventana de "registrada": la incapacidad ya aparece
                // en la lista de abajo y el detalle queda en la barra.
                // Lo importante es cuantas faltas se le quitaron, porque
                // eso es lo que ya no le va a aparecer en el historial.
                lblResumen.Text =
                    $"Incapacidad registrada a {quien}   |   " +
                    $"del {ini.ToString("d 'de' MMMM", cultura)} " +
                    $"al {fin.ToString("d 'de' MMMM", cultura)}   |   {dias} dia(s)" +
                    (quitadas > 0
                        ? $"   |   se le quitaron {quitadas} ausencia(s) de esos dias"
                        : "");
            }
            catch (Exception ex) { Error("No se pudo registrar la incapacidad.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        private void Limpiar()
        {
            cbxOficial.SelectedIndex = -1;
            txtBoleta.Clear();
            txtObs.Clear();
            dtpInicio.Value = DateTime.Today;
            dtpFin.Value = DateTime.Today.AddDays(2);
            cbxOficial.Focus();
        }

        private void Eliminar()
        {
            if (dtg.CurrentRow is null || !dtg.Columns.Contains("Id"))
            {
                Avisar("Seleccione en la lista la incapacidad que quiere eliminar.");
                return;
            }

            var valor = dtg.CurrentRow.Cells["Id"].Value;
            if (valor is null) return;

            string oficial = dtg.CurrentRow.Cells["Oficial"].Value?.ToString() ?? "";

            var r = MessageBox.Show(
                $"Eliminar la incapacidad de {oficial}?\n\n" +
                "Los dias que ya se registraron en la asistencia no cambian.",
                "Confirmar", MessageBoxButtons.YesNo, MessageBoxIcon.Question);

            if (r == DialogResult.No) return;

            try
            {
                _repo.EliminarIncapacidad(Convert.ToInt32(valor));
                Cargar();
            }
            catch (Exception ex) { Error("No se pudo eliminar.", ex); }
        }

        /// <summary>Los avisos de un dato que falta van en la barra de abajo.</summary>
        private void Avisar(string m) => lblResumen.Text = m;

        private static void Error(string ctx, Exception ex) =>
            MessageBox.Show($"{ctx}\n\nDetalle tecnico:\n{ex.Message}",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
