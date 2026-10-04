using System.Data;
using System.Text;
using System.Text.RegularExpressions;
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Edicion y baja de oficiales.
    /// Antes de guardar muestra que cambio: valor anterior y nuevo.
    /// Construida por codigo: no lleva Designer ni resx.
    /// </summary>
    public class EditarOficial : Form
    {
        private readonly OficialesRepositorio _repo = new();

        /// <summary>
        /// Solo para avisar que plaza deja libre quien se va. Si la base
        /// no tiene el cuadro de plazas, no se usa.
        /// </summary>
        private readonly VacantesRepositorio _plazas = new();

        /// <summary>
        /// Nombres, cedulas y chalecos que ofrece el autocompletado. Se
        /// llena al abrir y se rehace cada vez que se guarda o se borra,
        /// para que un nombre recien cambiado se pueda buscar de una.
        /// </summary>
        private List<string> _paraBuscar = new();
        private Oficial? _actual;

        // ---------- Banda ----------
        private readonly Panel pnlBanda = new();
        private readonly Label lblTitulo = new();
        private readonly Label lblSub = new();
        private readonly Button btnCerrar = new();

        // ---------- Busqueda ----------
        private readonly Panel pnlBusca = new();
        private readonly Label lblBuscar = new();
        private readonly TextBox txtBuscar = new();
        private readonly CheckBox chkInactivos = new();
        private readonly Button btnBuscar = new();
        private readonly Label lblConteo = new();

        // ---------- Grilla ----------
        private readonly DataGridView dtg = new();
        private readonly GroupBox grpLista = new();

        // ---------- Panel de edicion ----------
        private readonly GroupBox grpEdit = new();

        /// <summary>
        /// Lo que se puede rodar cuando la ficha no cabe de alto. Va
        /// dentro del recuadro porque un GroupBox no sabe hacerlo.
        /// </summary>
        private readonly Panel pnlFicha = new();
        private readonly TextBox txtNombre = new();
        private readonly TextBox txtCedula = new();
        private readonly TextBox txtTelefono = new();
        private readonly ComboBox cbxHorario = new();
        private readonly Panel pnlDiaLibre = new();

        /// <summary>Las casillas de los dias libres, dentro de ese recuadro.</summary>
        private SelectorDiasLibres _diasLibres = null!;
        private readonly DateTimePicker dtpVencimiento = new();
        private readonly DateTimePicker dtpIngreso = new();
        private readonly ComboBox cbxAutorizado = new();
        private readonly TextBox txtChaleco = new();
        private readonly CheckBox chkActivo = new();
        private readonly Label lblContadores = new();

        private readonly Button btnGuardar = new();
        private readonly Button btnDeshacer = new();
        private readonly Button btnEliminar = new();

        public EditarOficial()
        {
            ConstruirInterfaz();
            Load += (_, _) => Buscar();
        }

        // =============================================================
        // INTERFAZ
        // =============================================================
        private void ConstruirInterfaz()
        {
            Estilo.Formulario(this);
            Text = "Editar oficiales";
            ClientSize = new Size(1360, 740);
            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };

            // ---------- Banda ----------
            Estilo.Banda(pnlBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 95;

            int margenTexto = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);

            lblTitulo.Text = "EDITAR PERSONAL";
            lblTitulo.Font = Estilo.Titulo;
            lblTitulo.ForeColor = Color.White;
            lblTitulo.BackColor = Color.Transparent;
            lblTitulo.SetBounds(margenTexto, 22, 600, 32);

            lblSub.Text = "Escoja un oficial de la lista, corrija y guarde.";
            Estilo.SubtituloBanda(lblSub);
            lblSub.AutoSize = false;
            lblSub.SetBounds(margenTexto + 3, 56, 600, 20);

            Estilo.SobreBanda(btnCerrar);
            btnCerrar.Text = "Volver al Menu";
            btnCerrar.Size = new Size(170, 40);
            btnCerrar.Click += (_, _) => Estilo.VolverAlMenu(this);

            pnlBanda.Controls.AddRange(new Control[] { btnCerrar, lblSub, lblTitulo });
            Estilo.AnclarDerecha(pnlBanda, btnCerrar);

            // ---------- Busqueda ----------
            pnlBusca.Dock = DockStyle.Top;
            pnlBusca.Height = 72;
            pnlBusca.BackColor = Estilo.Superficie;

            lblBuscar.Text = "Buscar por nombre o cedula";
            lblBuscar.Font = Estilo.Subtitulo;
            lblBuscar.ForeColor = Estilo.TextoSuave;
            lblBuscar.AutoSize = true;
            lblBuscar.SetBounds(22, 8, 250, 19);

            Estilo.CampoTexto(txtBuscar);
            txtBuscar.SetBounds(20, 30, 320, 27);
            Estilo.Autocompletar(txtBuscar, () => _paraBuscar, Buscar);

            Estilo.Primario(btnBuscar);
            btnBuscar.Text = "Buscar";
            btnBuscar.SetBounds(352, 27, 130, 33);
            btnBuscar.Click += (_, _) => Buscar();

            chkInactivos.Text = "Incluir inactivos";
            chkInactivos.Font = Estilo.Subtitulo;
            chkInactivos.AutoSize = true;
            chkInactivos.Checked = true;
            chkInactivos.SetBounds(500, 35, 160, 20);
            chkInactivos.CheckedChanged += (_, _) => Buscar();

            lblConteo.Font = Estilo.Subtitulo;
            lblConteo.ForeColor = Estilo.TextoSuave;
            lblConteo.AutoSize = true;
            lblConteo.SetBounds(680, 36, 400, 19);

            pnlBusca.Controls.AddRange(new Control[]
            { lblConteo, chkInactivos, btnBuscar, txtBuscar, lblBuscar });

            // ---------- Panel de edicion (derecha) ----------
            grpEdit.Text = "Datos de la persona";
            grpEdit.Font = Estilo.GrillaEncabezado;
            grpEdit.ForeColor = Estilo.Azul;
            grpEdit.BackColor = Estilo.Superficie;
            grpEdit.Dock = DockStyle.Right;
            grpEdit.Width = 470;
            grpEdit.Padding = new Padding(15, 10, 15, 10);

            // La ficha va dentro de un panel que se puede rodar.
            //
            // Necesita 650 pixeles de alto y en un monitor de 1366x768 no
            // hay tantos: los tres botones del final -- Guardar, Deshacer
            // y Dar de baja -- quedaban por debajo del borde y no habia
            // forma de llegar a ellos. En un monitor grande no se nota:
            // la barra solo aparece cuando de verdad no cabe.
            //
            // Va un panel de por medio porque un GroupBox no sabe rodar
            // su contenido; un panel si.
            pnlFicha.Dock = DockStyle.Fill;
            pnlFicha.AutoScroll = true;
            pnlFicha.BackColor = Estilo.Superficie;
            grpEdit.Controls.Add(pnlFicha);

            string[] etiquetas =
            { "Nombre", "Cedula", "Telefono", "Rol / Horario", "Dia libre",
              "Vence portacion", "Fecha de ingreso", "Autorizacion", "Codigo de chaleco" };

            Control[] campos =
            { txtNombre, txtCedula, txtTelefono, cbxHorario, pnlDiaLibre,
              dtpVencimiento, dtpIngreso, cbxAutorizado, txtChaleco };

            int y = 32;
            for (int i = 0; i < etiquetas.Length; i++)
            {
                var lbl = new Label
                {
                    Text = etiquetas[i],
                    Font = Estilo.Subtitulo,
                    ForeColor = Estilo.TextoSuave,
                    AutoSize = true
                };
                lbl.SetBounds(20, y, 160, 19);
                pnlFicha.Controls.Add(lbl);

                Estilo.CampoTexto(campos[i]);
                campos[i].SetBounds(20, y + 20, 420, 28);
                pnlFicha.Controls.Add(campos[i]);

                y += 52;
            }

            txtNombre.MaxLength = 120;
            txtCedula.MaxLength = 20;
            txtTelefono.MaxLength = 15;
            txtChaleco.MaxLength = 30;

            cbxHorario.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxHorario.Items.AddRange(AsistenciaRepositorio.TodosLosRoles());
            cbxHorario.SelectedIndexChanged += (_, _) => AjustarPorRol();

            // Las casillas de los dias libres van dentro del recuadro que
            // el bucle de arriba ya coloco en su sitio.
            _diasLibres = new SelectorDiasLibres(0, 0, pnlDiaLibre.Width);
            _diasLibres.Caja.Dock = DockStyle.Fill;
            pnlDiaLibre.Controls.Add(_diasLibres.Caja);

            cbxAutorizado.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxAutorizado.Items.AddRange(new object[] { "Autorizado", "Denegado", "Pendiente" });

            dtpVencimiento.Format = DateTimePickerFormat.Short;
            dtpIngreso.Format = DateTimePickerFormat.Short;

            chkActivo.Text = "Persona activa";
            chkActivo.Font = Estilo.Etiqueta;
            chkActivo.AutoSize = true;
            chkActivo.SetBounds(20, y + 2, 200, 22);

            lblContadores.Font = Estilo.Subtitulo;
            lblContadores.ForeColor = Estilo.TextoSuave;
            lblContadores.AutoSize = false;
            lblContadores.SetBounds(20, y + 28, 420, 20);

            Estilo.Primario(btnGuardar);
            btnGuardar.Text = "Guardar cambios";
            btnGuardar.SetBounds(20, y + 56, 210, 44);
            btnGuardar.Click += (_, _) => Guardar();

            Estilo.Secundario(btnDeshacer);
            btnDeshacer.Text = "Deshacer";
            btnDeshacer.SetBounds(242, y + 56, 198, 44);
            btnDeshacer.Click += (_, _) => MostrarOficial(_actual);

            Estilo.Secundario(btnEliminar);
            btnEliminar.Text = "Dar de baja / eliminar";
            btnEliminar.SetBounds(20, y + 106, 420, 42);
            btnEliminar.Click += (_, _) => Eliminar();

            pnlFicha.Controls.AddRange(new Control[]
            { btnEliminar, btnDeshacer, btnGuardar, lblContadores, chkActivo });

            // ---------- Grilla ----------
            Estilo.GridSoloLectura(dtg);
            dtg.Dock = DockStyle.Fill;
            dtg.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dtg.SelectionChanged += (_, _) => Seleccionar();

            grpLista.Text = "Oficiales";
            grpLista.Font = Estilo.GrillaEncabezado;
            grpLista.ForeColor = Estilo.Azul;
            grpLista.BackColor = Estilo.Fondo;
            grpLista.Dock = DockStyle.Fill;
            grpLista.Padding = new Padding(15, 10, 15, 10);
            grpLista.Controls.Add(dtg);

            Controls.Add(grpLista);
            Controls.Add(grpEdit);
            Controls.Add(pnlBusca);
            Controls.Add(pnlBanda);

            HabilitarEdicion(false);
        }

        private void HabilitarEdicion(bool activo)
        {
            foreach (Control c in pnlFicha.Controls)
                if (c != grpEdit) c.Enabled = activo;

            if (activo) AjustarPorRol();
        }

        /// <summary>
        /// Al autorizado externo no se le pide dia libre: no lo tiene.
        /// Ese campo se apaga y queda en Ninguno.
        /// </summary>
        private void AjustarPorRol()
        {
            bool externo = Roles.EsExterno(cbxHorario.SelectedItem?.ToString());

            _diasLibres.Enabled = !externo && cbxHorario.Enabled;

            if (externo) _diasLibres.Limpiar();
        }

        // =============================================================
        // DATOS
        // =============================================================
        /// <summary>
        /// Rehace la lista del autocompletado. Se llama al abrir y cada
        /// vez que la lista de personal cambia.
        /// </summary>
        private void RefrescarAutocompletado()
        {
            try { _paraBuscar = _repo.ParaAutocompletar(chkInactivos.Checked); }
            catch (Exception ex)
            {
                // Sin sugerencias se puede trabajar igual: la caja sigue
                // buscando. No vale la pena molestar al usuario por esto.
                Registro.Anotar("No se pudo cargar el autocompletado", ex);
            }
        }

        private void Buscar()
        {
            try
            {
                Cursor = Cursors.WaitCursor;

                // Se rehace en cada busqueda: son 74 textos cortos, y asi
                // un nombre que se acaba de cambiar ya se puede buscar
                // sin tener que avisarle a nadie desde donde se guarda.
                RefrescarAutocompletado();

                DataTable t = _repo.Buscar(txtBuscar.Text, chkInactivos.Checked);
                dtg.DataSource = t;
                Estilo.SinOrdenamiento(dtg);
                Resaltar();

                grpLista.Text = $"Oficiales  ({t.Rows.Count})";
                lblConteo.Text = $"{t.Rows.Count} oficial(es) en la lista";

                if (t.Rows.Count > 0)
                {
                    dtg.ClearSelection();
                    dtg.Rows[0].Selected = true;
                    dtg.CurrentCell = dtg.Rows[0].Cells[1];
                }
                else
                {
                    _actual = null;
                    LimpiarCampos();
                    HabilitarEdicion(false);
                }
            }
            catch (Exception ex) { Error("No se pudo cargar la lista.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        private void Resaltar()
        {
            foreach (DataGridViewRow f in dtg.Rows)
            {
                if (dtg.Columns.Contains("Rol / Horario") &&
                    Roles.EsExterno(f.Cells["Rol / Horario"].Value?.ToString()))
                {
                    f.DefaultCellStyle.BackColor = Estilo.LilaFondo;
                    f.DefaultCellStyle.ForeColor = Estilo.LilaTexto;
                }

                // El inactivo manda sobre el color anterior: es lo
                // primero que hay que ver en la lista.
                if (dtg.Columns.Contains("Estado") &&
                    f.Cells["Estado"].Value?.ToString() == "Inactivo")
                {
                    f.DefaultCellStyle.BackColor = Estilo.FilaAlterna;
                    f.DefaultCellStyle.ForeColor = Estilo.TextoSuave;
                }
            }
        }

        private void Seleccionar()
        {
            if (dtg.CurrentRow is null || !dtg.Columns.Contains("Codigo")) return;

            var v = dtg.CurrentRow.Cells["Codigo"].Value;
            if (v is null) return;

            try
            {
                _actual = _repo.ObtenerPorId(Convert.ToInt32(v));
                MostrarOficial(_actual);
                HabilitarEdicion(_actual is not null);
            }
            catch (Exception ex) { Error("No se pudo cargar el oficial.", ex); }
        }

        private void MostrarOficial(Oficial? o)
        {
            if (o is null) { LimpiarCampos(); return; }

            txtNombre.Text = o.Nombre;
            txtCedula.Text = o.Cedula;
            txtTelefono.Text = o.Telefono ?? "";

            // Si el rol o el dia guardados no estan en la lista (una
            // base vieja, por ejemplo), se agregan para no perderlos.
            if (!cbxHorario.Items.Contains(o.Horario))
                cbxHorario.Items.Add(o.Horario);
            _diasLibres.Valor = o.DiaLibre;
            dtpVencimiento.Value = o.VencimientoPortacion;
            dtpIngreso.Value = o.FechaIngreso;
            cbxAutorizado.SelectedItem = o.Autorizado;
            txtChaleco.Text = o.CodigoChaleco ?? "";
            chkActivo.Checked = o.Activo;

            lblContadores.Text = Roles.EsExterno(o.Horario)
                ? $"Codigo {o.IdOficial}   |   Autorizado externo: no lleva contadores"
                : $"Codigo {o.IdOficial}   |   Tardias: {o.Tardias}   |   " +
                  $"Ausencias: {o.Ausencias}   (no editables)";

            grpEdit.Text = $"Datos de {o.Nombre}";
            AjustarPorRol();
        }

        private void LimpiarCampos()
        {
            txtNombre.Clear(); txtCedula.Clear(); txtTelefono.Clear(); txtChaleco.Clear();
            cbxHorario.SelectedIndex = -1;
            _diasLibres.Limpiar();
            cbxAutorizado.SelectedIndex = -1;
            chkActivo.Checked = true;
            lblContadores.Text = "";
            grpEdit.Text = "Datos de la persona";
        }

        // =============================================================
        // VALIDACION
        // =============================================================
        private static readonly Regex RxNombre =
            new(@"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}(\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,})+$");
        private static readonly Regex RxCedula = new(@"^[1-9]-?\d{4}-?\d{4}$");
        private static readonly Regex RxDimex = new(@"^\d{11,12}$");
        private static readonly Regex RxTelefono = new(@"^[2-8]\d{3}-?\d{4}$");

        private static string NormalizarCedula(string cedula)
        {
            string d = new(cedula.Where(char.IsDigit).ToArray());
            return d.Length == 9
                ? $"{d[0]}-{d.Substring(1, 4)}-{d.Substring(5, 4)}"
                : d;
        }

        // =============================================================
        // GUARDAR
        // =============================================================
        private void Guardar()
        {
            if (_actual is null) { Avisar("Escoja primero un oficial de la lista."); return; }

            string nombre = txtNombre.Text.Trim();
            string cedula = txtCedula.Text.Trim();
            string telefono = txtTelefono.Text.Trim();

            var errores = new StringBuilder();

            if (nombre.Length < 5 || !RxNombre.IsMatch(nombre))
                errores.AppendLine("- Nombre: digite nombre y apellidos, solo letras.");

            if (!RxCedula.IsMatch(cedula) && !RxDimex.IsMatch(cedula))
                errores.AppendLine("- Cedula: use 1-2345-6789 o un DIMEX de 11 a 12 digitos.");

            if (telefono.Length > 0 && !RxTelefono.IsMatch(telefono))
                errores.AppendLine("- Telefono: deben ser 8 digitos, por ejemplo 8888-8888.");

            bool externo = Roles.EsExterno(cbxHorario.SelectedItem?.ToString());

            if (cbxHorario.SelectedIndex < 0)
                errores.AppendLine("- Falta el rol: un turno o Autorizado Externo.");

            // Al externo no se le pide dia libre: no lo tiene.
            else if (!externo && _diasLibres.Vacio)
                errores.AppendLine("- Falta el dia libre.");

            if (cbxAutorizado.SelectedIndex < 0) errores.AppendLine("- Falta la autorizacion.");

            if (dtpIngreso.Value.Date > DateTime.Today)
                errores.AppendLine("- La fecha de ingreso no puede ser futura.");

            if (dtpVencimiento.Value.Date < dtpIngreso.Value.Date)
                errores.AppendLine("- El vencimiento no puede ser anterior al ingreso.");

            if (errores.Length > 0)
            {
                MessageBox.Show("Corrija lo siguiente:\n\n" + errores,
                    "Datos incorrectos", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            string cedulaNorm = NormalizarCedula(cedula);

            try
            {
                if (_repo.ExisteCedula(cedulaNorm, _actual.IdOficial))
                {
                    MessageBox.Show("Ya hay otro oficial registrado con esa cedula.",
                        "Cedula duplicada", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
            }
            catch (Exception ex) { Error("No se pudo verificar la cedula.", ex); return; }

            var nuevo = new Oficial
            {
                IdOficial = _actual.IdOficial,
                Nombre = nombre,
                Cedula = cedulaNorm,
                Telefono = telefono.Length == 0 ? null : telefono,
                Horario = cbxHorario.SelectedItem!.ToString()!,
                DiaLibre = externo
                    ? AsistenciaRepositorio.SinDiaLibre
                    : _diasLibres.Valor,
                VencimientoPortacion = dtpVencimiento.Value.Date,
                FechaIngreso = dtpIngreso.Value.Date,
                Autorizado = cbxAutorizado.SelectedItem!.ToString()!,
                CodigoChaleco = txtChaleco.Text.Trim().Length == 0 ? null : txtChaleco.Text.Trim(),
                Activo = chkActivo.Checked
            };

            string cambios = CompararCambios(_actual, nuevo);

            if (cambios.Length == 0)
            {
                Avisar("No hay ningun cambio que guardar.");
                return;
            }

            // Quitarle la marca de "Persona activa" y guardar es la otra
            // forma de dar de baja a alguien, aparte del boton. Tambien
            // por ahi hay que preguntar el motivo: si no, la persona
            // quedaria de baja sin que conste por que, y su plaza
            // quedaria vacante con un motivo en blanco.
            //
            // La baja se manda ANTES de guardar el resto: el motivo y el
            // apagado tienen que ir juntos para que la plaza herede el
            // motivo de verdad.
            string motivoBaja = "";
            DateTime fechaBaja = DateTime.Today;
            bool dandoDeBaja = _actual.Activo && !nuevo.Activo;

            if (dandoDeBaja && _repo.SeAnotaLaSalida)
            {
                using var dlg = new SalidaDePersonal(nuevo.Nombre, TienePlaza(nuevo.IdOficial));
                if (dlg.ShowDialog(this) != DialogResult.OK) return;

                motivoBaja = dlg.Motivo;
                fechaBaja = dlg.Fecha;
            }

            // Ya no se pide confirmar ni se avisa que se guardo: si
            // presiono Guardar es porque quiere guardar. Lo que cambio
            // queda escrito abajo, que es lo unico que hacia falta ver.
            try
            {
                Cursor = Cursors.WaitCursor;

                if (dandoDeBaja)
                    _repo.Desactivar(nuevo.IdOficial, false, motivoBaja, fechaBaja);

                _repo.Actualizar(nuevo);

                int id = nuevo.IdOficial;
                string quien = nuevo.Nombre;
                int cuantos = cambios.Split('\n')
                                     .Count(l => l.TrimEnd().EndsWith(":"));

                Buscar();
                SeleccionarPorId(id);

                lblContadores.Text = $"Guardado: {cuantos} dato(s) cambiados en {quien}";
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number is 2601 or 2627)
            {
                // El chaleco si se puede repetir: en la practica un mismo
                // chaleco pasa de un oficial a otro y en el traslape los
                // dos lo tienen anotado. Lo unico que no se repite es la
                // cedula, y eso ya se reviso antes de llegar aqui.
                bool esChaleco = ex.Message.Contains("Chaleco",
                    StringComparison.OrdinalIgnoreCase);

                MessageBox.Show(
                    esChaleco
                        ? "La base todavia no deja repetir el codigo de chaleco.\n\n" +
                          "Corra una sola vez el archivo PlanillaVanguard_PUESTOS.sql " +
                          "y vuelva a guardar."
                        : "Ya hay otro oficial registrado con esa cedula.",
                    "Dato duplicado", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 547)
            {
                MessageBox.Show(
                    "Alguno de los datos no cumple con las reglas de la base.\n\n" +
                    "Revise el dia libre y la autorizacion.",
                    "Dato no permitido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            catch (Exception ex) { Error("No se pudo guardar.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>Arma el listado de que cambio: antes y despues.</summary>
        private static string CompararCambios(Oficial viejo, Oficial nuevo)
        {
            var sb = new StringBuilder();

            void Comparar(string campo, string? antes, string? despues)
            {
                antes ??= ""; despues ??= "";
                if (antes != despues)
                    sb.AppendLine($"   {campo}:\n      antes:   {(antes.Length == 0 ? "(vacio)" : antes)}" +
                                  $"\n      ahora:   {(despues.Length == 0 ? "(vacio)" : despues)}\n");
            }

            Comparar("Nombre", viejo.Nombre, nuevo.Nombre);
            Comparar("Cedula", viejo.Cedula, nuevo.Cedula);
            Comparar("Telefono", viejo.Telefono, nuevo.Telefono);
            Comparar("Rol / Horario", viejo.Horario, nuevo.Horario);
            Comparar("Dia libre", viejo.DiaLibre, nuevo.DiaLibre);
            Comparar("Vence portacion",
                     viejo.VencimientoPortacion.ToString("dd/MM/yyyy"),
                     nuevo.VencimientoPortacion.ToString("dd/MM/yyyy"));
            Comparar("Fecha de ingreso",
                     viejo.FechaIngreso.ToString("dd/MM/yyyy"),
                     nuevo.FechaIngreso.ToString("dd/MM/yyyy"));
            Comparar("Autorizacion", viejo.Autorizado, nuevo.Autorizado);
            Comparar("Chaleco", viejo.CodigoChaleco, nuevo.CodigoChaleco);
            Comparar("Estado", viejo.Activo ? "Activo" : "Inactivo",
                               nuevo.Activo ? "Activo" : "Inactivo");

            return sb.ToString();
        }

        private void SeleccionarPorId(int id)
        {
            if (!dtg.Columns.Contains("Codigo")) return;

            foreach (DataGridViewRow f in dtg.Rows)
            {
                if (Convert.ToInt32(f.Cells["Codigo"].Value ?? 0) == id)
                {
                    dtg.ClearSelection();
                    f.Selected = true;
                    dtg.CurrentCell = f.Cells[1];
                    return;
                }
            }
        }

        // =============================================================
        // ELIMINAR
        // =============================================================
        private void Eliminar()
        {
            if (_actual is null) { Avisar("Escoja primero un oficial de la lista."); return; }

            HistorialOficial h;
            try { h = _repo.ContarHistorial(_actual.IdOficial); }
            catch (Exception ex) { Error("No se pudo revisar el historial.", ex); return; }

            // Que plaza deja libre, si tiene alguna. Se pregunta aqui y
            // no en cada clic de la lista: es una consulta mas, y solo
            // hace falta en el momento de darlo de baja.
            string plaza = h.Plazas == 0
                ? ""
                : _plazas.PapelEnPlaza(_actual.IdOficial) is string papel
                    ? $"\n\nOJO: {papel}.\nAl darlo de baja, esa plaza queda VACANTE."
                    : "";

            // ---------- Con historial: solo baja logica ----------
            if (h.TieneHistorial)
            {
                var r = MessageBox.Show(
                    $"{_actual.Nombre} tiene historial en el sistema:\n\n" +
                    $"   Asistencia: {h.Asistencia} registro(s)\n" +
                    $"   Sustituciones: {h.Sustituciones}\n" +
                    $"   Incapacidades: {h.Incapacidades}\n" +
                    $"   Proyecciones: {h.Proyecciones}\n" +
                    $"   Plazas: {h.Plazas}\n\n" +
                    "No se puede borrar sin destruir esa evidencia.\n\n" +
                    "Lo que si se puede es DARLO DE BAJA: deja de aparecer en las " +
                    "listas de asistencia y en las proyecciones, pero su historial " +
                    "se conserva intacto." + plaza + "\n\n" +
                    "Desea darlo de baja?",
                    "Tiene historial", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);

                if (r == DialogResult.No) return;

                // Por que se va y desde cuando. Se pregunta despues de
                // que dijo que si, no antes: quien todavia no ha
                // decidido no tiene por que llenar un cuadro.
                //
                // Si la base no tiene donde anotarlo, no se pregunta y
                // la baja se hace igual que siempre.
                string motivo = "";
                DateTime fecha = DateTime.Today;

                if (_repo.SeAnotaLaSalida)
                {
                    using var dlg = new SalidaDePersonal(_actual.Nombre, plaza.Length > 0);
                    if (dlg.ShowDialog(this) != DialogResult.OK) return;

                    motivo = dlg.Motivo;
                    fecha = dlg.Fecha;
                }

                try
                {
                    _repo.Desactivar(_actual.IdOficial, false, motivo, fecha);

                    int id = _actual.IdOficial;
                    string quien = _actual.Nombre;

                    Buscar();
                    SeleccionarPorId(id);

                    lblContadores.Text =
                        $"{quien} quedo inactivo" +
                        (motivo.Length > 0 ? $" ({motivo}, {fecha:dd/MM/yyyy})" : "") +
                        (plaza.Length > 0 ? ". Su plaza quedo VACANTE" : "") +
                        ".   Para reactivarlo, marque 'Persona activa' y guarde.";
                }
                catch (Exception ex) { Error("No se pudo dar de baja.", ex); }
                return;
            }

            // ---------- Sin historial: se puede borrar ----------
            // Aqui si se pregunta, una sola vez: el borrado definitivo no
            // se puede deshacer. Antes se preguntaba dos veces seguidas.
            var confirma = MessageBox.Show(
                $"{_actual.Nombre} ({_actual.Cedula}) no tiene ningun registro asociado.\n\n" +
                "Se va a borrar de forma definitiva. ESTO NO SE PUEDE DESHACER.\n\n" +
                "Desea borrarlo?",
                "Borrado definitivo", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);

            if (confirma == DialogResult.No) return;

            try
            {
                Cursor = Cursors.WaitCursor;

                string quien = _actual.Nombre;
                _repo.EliminarDefinitivo(_actual.IdOficial);

                _actual = null;
                Buscar();

                lblConteo.Text = $"{quien} fue eliminado.";
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 547)
            {
                MessageBox.Show(
                    "La base impidio el borrado porque el oficial si tiene registros " +
                    "asociados.\n\nUse la opcion de dar de baja.",
                    "No se puede borrar", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            catch (Exception ex) { Error("No se pudo eliminar.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>
        /// Si esa persona es titular de alguna plaza. Solo sirve para
        /// decirselo en el cuadro de la baja; si no se pudo averiguar,
        /// se sigue sin ese aviso.
        /// </summary>
        private bool TienePlaza(int idOficial) =>
            _plazas.PapelEnPlaza(idOficial) is string papel && papel.StartsWith("es titular");

        /// <summary>Los avisos de un clic incompleto van bajo los datos, sin ventana.</summary>
        private void Avisar(string m) => lblContadores.Text = m;

        private static void Error(string ctx, Exception ex) =>
            MessageBox.Show($"{ctx}\n\nDetalle tecnico:\n{ex.Message}",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }

    // ===============================================================
    /// <summary>
    /// Por que se va la persona y desde cuando.
    ///
    /// Son dos datos y no se piden por gusto: es lo que despues hay
    /// que poder contestar cuando alguien pregunte por que quedo esa
    /// plaza sin titular. Si la persona tenia plaza, el mismo motivo
    /// pasa a ser el motivo de la vacante.
    /// </summary>
    public class SalidaDePersonal : Form
    {
        private readonly ComboBox cbxMotivo = new();
        private readonly DateTimePicker dtpFecha = new();

        public string Motivo => cbxMotivo.SelectedItem?.ToString() ?? MotivoSalida.Otro;
        public DateTime Fecha => dtpFecha.Value.Date;

        public SalidaDePersonal(string quien, bool tienePlaza)
        {
            Text = "Baja de personal";
            ClientSize = new Size(500, 230);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            StartPosition = FormStartPosition.CenterParent;
            MaximizeBox = false;
            MinimizeBox = false;

            var lblQuien = new Label { Text = quien, AutoSize = false };
            lblQuien.SetBounds(20, 16, 460, 24);
            lblQuien.Font = Estilo.GrillaEncabezado;
            lblQuien.ForeColor = Estilo.Azul;

            var lblNota = new Label
            {
                Text = tienePlaza
                    ? "Su plaza queda vacante con este mismo motivo."
                    : "Queda anotado en su ficha.",
                AutoSize = false
            };
            lblNota.SetBounds(20, 42, 460, 22);
            lblNota.Font = Estilo.Subtitulo;
            lblNota.ForeColor = Estilo.TextoSuave;

            var lblMotivo = new Label { Text = "Motivo", AutoSize = false };
            lblMotivo.SetBounds(20, 86, 90, 26);

            cbxMotivo.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxMotivo.SetBounds(120, 84, 240, 28);
            cbxMotivo.Items.AddRange(MotivoSalida.Todos);
            cbxMotivo.SelectedIndex = 0;

            var lblFecha = new Label { Text = "Desde", AutoSize = false };
            lblFecha.SetBounds(20, 130, 90, 26);

            dtpFecha.Format = DateTimePickerFormat.Short;
            dtpFecha.SetBounds(120, 128, 160, 28);
            dtpFecha.Value = DateTime.Today;

            var btnOk = new Button { Text = "Dar de baja" };
            btnOk.SetBounds(240, 174, 130, 38);
            btnOk.Click += (_, _) => DialogResult = DialogResult.OK;

            var btnNo = new Button { Text = "Cancelar", DialogResult = DialogResult.Cancel };
            btnNo.SetBounds(380, 174, 100, 38);

            Controls.AddRange(new Control[]
            { lblQuien, lblNota, lblMotivo, cbxMotivo, lblFecha, dtpFecha, btnOk, btnNo });

            BackColor = Estilo.Fondo;
            ForeColor = Estilo.Texto;
            if (Estilo.Icono is not null) Icon = Estilo.Icono;

            foreach (var l in new[] { lblMotivo, lblFecha })
            { l.Font = Estilo.Etiqueta; l.TextAlign = ContentAlignment.MiddleLeft; }

            Estilo.CampoTexto(cbxMotivo);
            Estilo.CampoTexto(dtpFecha);
            Estilo.Primario(btnOk);
            Estilo.Secundario(btnNo);

            AcceptButton = btnOk;
            CancelButton = btnNo;
        }
    }
}
