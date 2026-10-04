using System.Data;
using System.Globalization;
using ClosedXML.Excel;
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Proyeccion editable: el plan de un dia futuro.
    /// Se marca quien no va a estar y se le asigna cobertura.
    ///
    /// Nunca escribe en AsistenciaDiaria. Es un plan, no un hecho.
    /// Construida por codigo: no lleva Designer ni resx.
    /// </summary>
    public class Proyeccion : Form
    {
        private readonly ProyeccionRepositorio _repo = new();
        private readonly AsistenciaRepositorio _repoAsis = new();

        private List<Puesto> _puestos = new();
        private List<LineaProyeccion> _plan = new();
        private List<OficialDisponible> _disponibles = new();

        private bool _cargando;
        private bool _hayCambios;

        /// <summary>Se enciende cuando la pantalla ya cargo por primera vez.</summary>
        private bool _listo;

        /// <summary>Se enciende mientras el filtro se devuelve por codigo.</summary>
        private bool _devolviendoFiltro;

        // Lo que hay cargado en pantalla. Sirve para devolver el filtro
        // si el cambio no se pudo aplicar.
        private DateTime _fechaCargada = DateTime.Today;
        private int _turnoCargado;

        /// <summary>Lo ultimo que hay que contarle al usuario del plan cargado.</summary>
        private string _aviso = "";

        private const string C_ID = "IdOficial";
        private const string C_TURNO = "Turno";
        private const string C_OFICIAL = "Oficial";
        private const string C_CEDULA = "Cedula";
        private const string C_PUESTO = "Puesto";
        private const string C_TIPO = "Tipo";
        private const string C_VA = "VaAEstar";
        private const string C_MOTIVO = "Motivo";
        private const string C_CUBRE = "Cubre";

        /// <summary>
        /// Marca de los renglones de titulo que parten la grilla por
        /// horario. No son oficiales: no se guardan, no se cuentan y no
        /// se les puede asignar cobertura.
        /// </summary>
        private const string TAG_BANDA = "banda";

        private static bool EsBanda(DataGridViewRow f) => (f.Tag as string) == TAG_BANDA;

        // ---------- Controles ----------
        private readonly Panel pnlBanda = new();
        private readonly Label lblTitulo = new();
        private readonly Label lblSub = new();
        private readonly Button btnCerrar = new();

        private readonly Panel pnlFiltro = new();
        private readonly Label lblFecha = new();
        private readonly DateTimePicker dtpFecha = new();
        private readonly Label lblTurno = new();
        private readonly ComboBox cbxTurno = new();
        private readonly Button btnCargar = new();
        private readonly Label lblDia = new();

        private readonly Label lblBuscar = new();
        private readonly TextBox txtBuscar = new();
        private readonly Button btnBuscar = new();
        private readonly Button btnVerTodo = new();
        private readonly Button btnVariosDias = new();

        private readonly TableLayoutPanel tlp = new();
        private readonly GroupBox grpPlan = new();
        private readonly DataGridView dtgPlan = new();
        private readonly GroupBox grpDisp = new();
        private readonly DataGridView dtgDisp = new();

        private readonly Panel pnlInferior = new();
        private readonly Button btnAsignar = new();
        private readonly Button btnQuitar = new();
        private readonly Button btnGuardar = new();
        private readonly Button btnReporte = new();
        private readonly Button btnExcelSust = new();
        private readonly Label lblResumen = new();

        public Proyeccion(DateTime? fechaInicial = null)
        {
            ConstruirInterfaz();
            if (fechaInicial is not null) dtpFecha.Value = fechaInicial.Value;
            Load += (_, _) => { Acomodar(); Iniciar(); };
            Resize += (_, _) => Acomodar();
        }

        // =============================================================
        // INTERFAZ
        // =============================================================
        private void ConstruirInterfaz()
        {
            Estilo.Formulario(this);
            Text = "Proyeccion de personal";
            ClientSize = new Size(1360, 740);
            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };
            // Al salir no se pregunta nada: lo que este a medio hacer se
            // guarda solo. Solo se detiene la salida si el plan tiene
            // algo que corregir, y en ese caso el propio guardado dice que.
            FormClosing += (_, e) =>
            {
                if (_hayCambios && !Guardar(false)) e.Cancel = true;
            };

            // ---------- Banda ----------
            Estilo.Banda(pnlBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 95;

            int margenTexto = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);

            lblTitulo.Text = "PROYECCION DE PERSONAL";
            lblTitulo.Font = Estilo.Titulo;
            lblTitulo.ForeColor = Color.White;
            lblTitulo.BackColor = Color.Transparent;
            lblTitulo.SetBounds(margenTexto, 22, 700, 32);

            lblSub.Text = "Plan de un dia. No afecta la asistencia real ni los contadores.";
            Estilo.SubtituloBanda(lblSub);
            lblSub.AutoSize = false;
            lblSub.SetBounds(margenTexto + 3, 56, 700, 20);

            Estilo.SobreBanda(btnCerrar);
            btnCerrar.Text = "Volver al Menu";
            btnCerrar.Size = new Size(170, 40);
            btnCerrar.Click += (_, _) => Estilo.VolverAlMenu(this);

            pnlBanda.Controls.AddRange(new Control[] { btnCerrar, lblSub, lblTitulo });
            Estilo.AnclarDerecha(pnlBanda, btnCerrar);

            // ---------- Filtros ----------
            pnlFiltro.Dock = DockStyle.Top;
            pnlFiltro.Height = 140;
            pnlFiltro.BackColor = Estilo.Superficie;

            lblFecha.Text = "Fecha a proyectar";
            lblTurno.Text = "Turno";
            lblBuscar.Text = "Buscar oficial, cedula o puesto";
            foreach (var l in new[] { lblFecha, lblTurno, lblBuscar })
            {
                l.Font = Estilo.Subtitulo;
                l.ForeColor = Estilo.TextoSuave;
                l.AutoSize = true;
            }

            lblFecha.SetBounds(22, 12, 150, 19);
            dtpFecha.Format = DateTimePickerFormat.Long;
            Estilo.CampoTexto(dtpFecha);
            dtpFecha.SetBounds(20, 34, 300, 28);
            dtpFecha.Value = DateTime.Today.AddDays(1);

            // La fecha y el turno recargan solos. Antes habia que
            // acordarse de presionar "Cargar plan" y la pantalla se
            // quedaba mostrando el horario anterior.
            dtpFecha.ValueChanged += (_, _) => { MostrarDia(); FiltroCambiado(); };

            lblTurno.SetBounds(342, 12, 100, 19);
            cbxTurno.DropDownStyle = ComboBoxStyle.DropDownList;
            Estilo.CampoTexto(cbxTurno);
            cbxTurno.SetBounds(340, 34, 220, 28);
            cbxTurno.Items.Add("Todos los turnos");
            cbxTurno.Items.AddRange(AsistenciaRepositorio.Turnos);
            cbxTurno.SelectedIndex = 0;
            cbxTurno.SelectedIndexChanged += (_, _) => FiltroCambiado();

            Estilo.Primario(btnCargar);
            btnCargar.Text = "Recargar plan";
            btnCargar.SetBounds(585, 30, 170, 36);
            btnCargar.Click += (_, _) => Cargar();

            lblDia.Font = Estilo.GrillaEncabezado;
            lblDia.ForeColor = Estilo.Azul;
            lblDia.AutoSize = true;
            lblDia.SetBounds(780, 40, 400, 20);

            // ----- Segunda fila: buscar dentro del plan cargado -----
            lblBuscar.SetBounds(22, 78, 260, 19);
            Estilo.CampoTexto(txtBuscar);
            txtBuscar.SetBounds(20, 100, 300, 27);
            Estilo.Autocompletar(txtBuscar, OpcionesDeBusqueda, Filtrar);

            Estilo.Primario(btnBuscar);
            btnBuscar.Text = "Buscar";
            btnBuscar.SetBounds(332, 97, 120, 33);
            btnBuscar.Click += (_, _) => Filtrar();

            Estilo.Secundario(btnVerTodo);
            btnVerTodo.Text = "Ver todo";
            btnVerTodo.SetBounds(464, 97, 120, 33);
            btnVerTodo.Click += (_, _) => { txtBuscar.Clear(); Filtrar(); };

            Estilo.Secundario(btnVariosDias);
            btnVariosDias.Text = "Proyeccion de varios dias";
            btnVariosDias.SetBounds(600, 95, 260, 37);
            btnVariosDias.Click += (_, _) => AbrirVariosDias();

            pnlFiltro.Controls.AddRange(new Control[]
            { btnVariosDias, btnVerTodo, btnBuscar, txtBuscar, lblBuscar,
              lblDia, btnCargar, cbxTurno, lblTurno, dtpFecha, lblFecha });

            // ---------- Grillas ----------
            Estilo.Grid(dtgPlan);
            Estilo.SeleccionVerde(dtgPlan);
            dtgPlan.Dock = DockStyle.Fill;
            dtgPlan.SelectionMode = DataGridViewSelectionMode.CellSelect;

            grpPlan.Text = "1. Plan del dia  -  desmarque a quien no va a estar";
            grpDisp.Text = "2. Quien puede cubrir";

            foreach (var g in new[] { grpPlan, grpDisp })
            {
                g.Font = Estilo.GrillaEncabezado;
                g.ForeColor = Estilo.Azul;
                g.BackColor = Estilo.Fondo;
                g.Dock = DockStyle.Fill;
                g.Padding = new Padding(8, 6, 8, 8);
            }
            grpPlan.Controls.Add(dtgPlan);

            Estilo.GridSoloLectura(dtgDisp);
            Estilo.SeleccionVerde(dtgDisp);
            dtgDisp.Dock = DockStyle.Fill;
            dtgDisp.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dtgDisp.CellDoubleClick += (_, e) => { if (e.RowIndex >= 0) Asignar(); };
            grpDisp.Controls.Add(dtgDisp);

            tlp.Dock = DockStyle.Fill;
            tlp.ColumnCount = 2;
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 68F));
            tlp.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 32F));
            tlp.RowCount = 1;
            tlp.Padding = new Padding(15, 10, 15, 5);
            tlp.BackColor = Estilo.Fondo;
            tlp.Controls.Add(grpPlan, 0, 0);
            tlp.Controls.Add(grpDisp, 1, 0);

            // ---------- Inferior ----------
            pnlInferior.Dock = DockStyle.Bottom;

            // Dos renglones: los botones arriba y, cuando la pantalla es
            // angosta, el resumen debajo (ver Acomodar).
            pnlInferior.Height = 100;
            pnlInferior.BackColor = Estilo.Superficie;

            Estilo.Primario(btnAsignar);
            btnAsignar.Text = "Asignar cobertura";
            btnAsignar.SetBounds(20, 20, 195, 48);
            btnAsignar.Click += (_, _) => Asignar();

            Estilo.Secundario(btnQuitar);
            btnQuitar.Text = "Quitar cobertura";
            btnQuitar.SetBounds(227, 20, 180, 48);
            btnQuitar.Click += (_, _) => Quitar();

            Estilo.Primario(btnGuardar);
            btnGuardar.Text = "Guardar proyeccion";
            btnGuardar.SetBounds(419, 20, 210, 48);
            btnGuardar.Click += (_, _) => Guardar(true);

            // Va a la izquierda, con posicion fija: asi nunca se sale
            // de la pantalla aunque la ventana cambie de tamano.
            Estilo.Primario(btnReporte);
            btnReporte.Text = "Generar reporte de proyeccion";
            btnReporte.SetBounds(641, 20, 300, 48);
            btnReporte.Click += (_, _) => GenerarReporte();

            Estilo.Secundario(btnExcelSust);
            btnExcelSust.Text = "Excel de sustituciones";
            btnExcelSust.SetBounds(953, 20, 260, 48);
            btnExcelSust.Click += (_, _) => GenerarExcelSustituciones();

            lblResumen.Font = Estilo.Subtitulo;
            lblResumen.ForeColor = Estilo.TextoSuave;
            lblResumen.TextAlign = ContentAlignment.MiddleRight;
            lblResumen.SetBounds(1230, 34, 380, 22);

            pnlInferior.Controls.AddRange(new Control[]
            { lblResumen, btnExcelSust, btnReporte, btnGuardar, btnQuitar, btnAsignar });

            Controls.Add(tlp);
            Controls.Add(pnlInferior);
            Controls.Add(pnlFiltro);
            Controls.Add(pnlBanda);

            MostrarDia();
        }

        /// <summary>
        /// Recoloca lo que va pegado a la derecha. Se hace por codigo
        /// porque el anclaje calcula mal cuando la posicion se define
        /// antes de que el panel tenga su ancho real.
        /// </summary>
        private void Acomodar()
        {
            int ancho = ClientSize.Width;
            if (ancho < 400) return;

            int izquierda = btnExcelSust.Right + 30;
            int disponible = ancho - izquierda - 20;

            // Al lado de los botones caben 200 pixeles o no cabe nada: en
            // una pantalla de 1366 los botones ya llegan hasta 1213 y lo
            // que quedaba no alcanzaba, asi que el resumen se salia de la
            // ventana y no se leia. Cuando no hay campo al lado, se pasa
            // a su propio renglon debajo, que para eso el panel tiene dos.
            if (disponible < 240)
            {
                lblResumen.TextAlign = ContentAlignment.MiddleLeft;
                lblResumen.SetBounds(22, 72, Math.Max(240, ancho - 44), 22);
            }
            else
            {
                lblResumen.TextAlign = ContentAlignment.MiddleRight;
                lblResumen.SetBounds(izquierda, 34, disponible, 22);
            }
        }

        private void ConfigurarGrilla()
        {
            dtgPlan.AutoGenerateColumns = false;
            dtgPlan.Columns.Clear();

            dtgPlan.Columns.Add(new DataGridViewTextBoxColumn
            { Name = C_ID, HeaderText = "Id", Visible = false });

            dtgPlan.Columns.Add(new DataGridViewTextBoxColumn
            { Name = C_TURNO, HeaderText = "Turno", Width = 110, ReadOnly = true });

            dtgPlan.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = C_OFICIAL, HeaderText = "Oficial", ReadOnly = true,
                AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, FillWeight = 150
            });

            dtgPlan.Columns.Add(new DataGridViewTextBoxColumn
            { Name = C_CEDULA, HeaderText = "Cedula", Width = 110, ReadOnly = true });

            var colPuesto = new DataGridViewComboBoxColumn
            {
                Name = C_PUESTO,
                HeaderText = "Puesto planeado",
                DisplayMember = nameof(Puesto.Descripcion),
                ValueMember = nameof(Puesto.IdPuesto),
                AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill,
                FillWeight = 175,
                FlatStyle = FlatStyle.Flat
            };

            // Mientras la fila se esta llenando, la celda del desplegable
            // pasa un instante en nulo. Sin NullValue eso se formatea
            // como "", que no es ningun IdPuesto de la lista, y la grilla
            // reclama. Con 0 apunta a "(sin asignar)", que si existe.
            colPuesto.DefaultCellStyle.NullValue = 0;
            colPuesto.DataSource = Puesto.ParaGrilla(_puestos, "(sin asignar)");
            dtgPlan.Columns.Add(colPuesto);

            // Rol, Vacante o Extra: con que se cubre esa casilla ese dia.
            // Va pegada al puesto porque se lee junto con el: "puesto
            // tal, y va de extra".
            var colTipo = new DataGridViewComboBoxColumn
            {
                Name = C_TIPO,
                HeaderText = "Tipo",
                Width = 95,
                FlatStyle = FlatStyle.Flat
            };
            colTipo.DefaultCellStyle.NullValue = ProyeccionRepositorio.TipoRol;
            colTipo.Items.AddRange(ProyeccionRepositorio.Tipos);

            // Una base a la que no le han corrido el script todavia no
            // tiene donde guardar esto. Se deja ver, pero no se deja
            // cambiar: marcarlo y que se pierda al guardar seria peor.
            if (!_repo.HayTipo)
            {
                colTipo.ReadOnly = true;
                colTipo.ToolTipText =
                    "Corra PlanillaVanguard_ROL_VACANTE_EXTRA.sql para poder marcar " +
                    "Rol, Vacante o Extra.";
            }

            dtgPlan.Columns.Add(colTipo);

            // NullValue = false es lo que evita que una casilla sin valor
            // tumbe la pantalla. Una casilla vacia se formatea como texto
            // "" y el pintado espera un bool: de ahi sale el
            // "System.FormatException: el valor con formato de la celda
            // tiene un tipo erroneo" que aparecia al abrir. Con esto, un
            // valor nulo se dibuja simplemente como casilla desmarcada.
            var colVa = new DataGridViewCheckBoxColumn
            { Name = C_VA, HeaderText = "Va a estar", Width = 90 };
            colVa.DefaultCellStyle.NullValue = false;
            dtgPlan.Columns.Add(colVa);

            var colMotivo = new DataGridViewComboBoxColumn
            {
                Name = C_MOTIVO,
                HeaderText = "Motivo",
                Width = 130,
                FlatStyle = FlatStyle.Flat
            };
            colMotivo.DefaultCellStyle.NullValue = "";
            colMotivo.Items.Add("");
            colMotivo.Items.AddRange(ProyeccionRepositorio.Motivos);
            dtgPlan.Columns.Add(colMotivo);

            dtgPlan.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = C_CUBRE, HeaderText = "Lo cubre", ReadOnly = true,
                AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, FillWeight = 150
            });

            Estilo.SinOrdenamiento(dtgPlan);

            dtgPlan.CurrentCellDirtyStateChanged += (_, _) =>
            {
                if (dtgPlan.IsCurrentCellDirty)
                    dtgPlan.CommitEdit(DataGridViewDataErrorContexts.Commit);
            };

            dtgPlan.CellValueChanged += Plan_CellValueChanged;
            dtgPlan.SelectionChanged += (_, _) => CargarDisponibles();
        }

        // =============================================================
        // DATOS
        // =============================================================
        private void Iniciar()
        {
            try
            {
                _puestos = _repoAsis.ListarPuestos();
                ConfigurarGrilla();
                Cargar();
                _listo = true;
            }
            catch (Exception ex) { Error("No se pudo preparar el formulario.", ex); }
        }

        /// <summary>
        /// Se movio la fecha o el turno. El plan se vuelve a cargar solo.
        ///
        /// Lo que estuviera a medio marcar se guarda antes, sin
        /// preguntar: cambiar de horario no tiene por que costarle al
        /// usuario lo que ya habia hecho. Si el plan tiene algo que
        /// corregir, el guardado lo dice y el filtro se devuelve a como
        /// estaba, para que la pantalla nunca muestre una fecha que no
        /// corresponde con la grilla.
        /// </summary>
        private void FiltroCambiado()
        {
            if (!_listo || _cargando || _devolviendoFiltro) return;

            if (_hayCambios && !Guardar(false)) { DevolverFiltro(); return; }

            Cargar();
        }

        private void DevolverFiltro()
        {
            _devolviendoFiltro = true;
            try
            {
                dtpFecha.Value = _fechaCargada;
                cbxTurno.SelectedIndex = _turnoCargado;
            }
            finally { _devolviendoFiltro = false; }

            MostrarDia();
        }

        private void MostrarDia()
        {
            string dia = AsistenciaRepositorio.DiaDeLaSemana(dtpFecha.Value).ToUpper();
            int faltan = (dtpFecha.Value.Date - DateTime.Today).Days;

            lblDia.Text = faltan switch
            {
                0 => $"{dia}   (hoy)",
                1 => $"{dia}   (manana)",
                > 1 => $"{dia}   (faltan {faltan} dias)",
                _ => $"{dia}   (hace {-faltan} dias)"
            };
        }

        private void Cargar()
        {
            try
            {
                Cursor = Cursors.WaitCursor;
                _cargando = true;

                string? turno = cbxTurno.SelectedIndex <= 0
                    ? null : cbxTurno.SelectedItem?.ToString();

                _plan = _repo.Cargar(dtpFecha.Value, turno);

                // Los horarios se ponen en el orden oficial (el que
                // arranca a las 06:00), el mismo del cuadro de varios
                // dias y del cuaderno de la base. La base los devuelve
                // en orden alfabetico, que empieza por el de medianoche.
                var orden = AsistenciaRepositorio.Turnos.ToList();
                _plan = _plan
                    .OrderBy(l => orden.IndexOf(l.Turno) is var i && i < 0 ? int.MaxValue : i)
                    .ThenBy(l => l.Nombre, StringComparer.CurrentCultureIgnoreCase)
                    .ToList();

                dtgPlan.Rows.Clear();

                // Un plan guardado puede apuntar a un puesto que ya se
                // retiro del cuadro. Si no esta en el desplegable, la
                // grilla reclama al meter la fila.
                if (dtgPlan.Columns[C_PUESTO] is DataGridViewComboBoxColumn col)
                    col.DataSource = Puesto.ParaGrilla(
                        _puestos, "(sin asignar)", _plan.Select(l => l.IdPuesto));

                // Lo mismo con los motivos: una base vieja puede tener
                // guardado un motivo que ya no esta en la lista, y un
                // desplegable con un valor que no conoce tambien tumba
                // la pantalla. Se agrega en vez de perderlo.
                if (dtgPlan.Columns[C_MOTIVO] is DataGridViewComboBoxColumn colM)
                    foreach (string motivo in _plan.Select(l => l.Motivo ?? "").Distinct())
                        if (!colM.Items.Contains(motivo)) colM.Items.Add(motivo);

                string horarioAnterior = "";

                foreach (var l in _plan)
                {
                    // El plan viene ordenado por horario. Cada vez que
                    // cambia se abre una banda con el nombre del horario:
                    // asi se ve de una que estan todos, uno tras otro, y
                    // no solo el primero.
                    if (l.Turno != horarioAnterior)
                    {
                        horarioAnterior = l.Turno;
                        AgregarBanda(l.Turno, _plan.Count(x => x.Turno == l.Turno));
                    }

                    int i = dtgPlan.Rows.Add();
                    var f = dtgPlan.Rows[i];
                    f.Tag = l.IncapacidadFija;

                    f.Cells[C_ID].Value = l.IdOficial;
                    f.Cells[C_TURNO].Value = l.Turno;
                    f.Cells[C_OFICIAL].Value = l.Nombre;
                    f.Cells[C_CEDULA].Value = l.Cedula;
                    f.Cells[C_PUESTO].Value = l.IdPuesto ?? 0;
                    f.Cells[C_TIPO].Value = ProyeccionRepositorio.LimpiarTipo(l.Tipo);
                    f.Cells[C_VA].Value = l.Disponible;
                    f.Cells[C_MOTIVO].Value = l.Motivo ?? "";
                    f.Cells[C_CUBRE].Value = l.IncapacidadFija && l.NombreSustituto == ""
                        ? $"(incapacidad hasta {l.FinIncapacidad:dd/MM})"
                        : l.NombreSustituto;

                    Pintar(f);
                }

                _cargando = false;
                _hayCambios = false;

                _fechaCargada = dtpFecha.Value.Date;
                _turnoCargado = cbxTurno.SelectedIndex;

                bool existe = _repo.ExisteProyeccion(dtpFecha.Value);
                int incap = _plan.Count(l => l.IncapacidadFija);

                // Lo que antes salia en una ventana aparte ahora va
                // escrito en el titulo de la grilla: la pantalla recarga
                // sola cada vez que se mueve la fecha o el turno, y un
                // aviso emergente en cada cambio estorbaria.
                _aviso =
                    _plan.Count == 0
                        ? "  -  nadie tiene ese horario ese dia (puede que a todos les toque libre)"
                    : incap > 0
                        ? $"  -  {incap} con incapacidad, ya marcados: asigneles cobertura"
                    : existe
                        ? "  -  esta fecha ya tenia plan guardado"
                        : "";

                // La columna Tipo no sirve de nada si la base no la
                // tiene, y eso hay que decirlo donde se ve la columna.
                if (!_repo.HayTipo)
                    _aviso += "  -  para usar el Tipo (Rol/Vacante/Extra) corra " +
                              "PlanillaVanguard_ROL_VACANTE_EXTRA.sql una sola vez";

                // Filtrar deja visibles las filas que coincidan, escoge la
                // primera y de ahi salen los disponibles.
                Filtrar();
                ActualizarResumen();
            }
            catch (Exception ex) { Error("No se pudo cargar el plan.", ex); }
            finally { _cargando = false; Cursor = Cursors.Default; }
        }

        /// <summary>
        /// Renglon de titulo de un horario. Las celdas de casilla y de
        /// lista se cambian por celdas de texto: si no, la banda saldria
        /// con una casilla de "va a estar" y un desplegable de puesto que
        /// no significan nada.
        ///
        /// El cambio de celda solo no basta. Una celda que no dice de que
        /// tipo es hereda el de su columna (bool en la casilla, int en el
        /// desplegable) y, con el valor en nulo, el dibujado revienta con
        /// "el valor con formato de la celda tiene un tipo erroneo" y
        /// deja la grilla a medio llenar. Por eso a cada celda de la
        /// banda se le dice que es de texto y se le pone cadena vacia:
        /// asi no depende de nada de la columna.
        /// </summary>
        private void AgregarBanda(string horario, int cuantos)
        {
            var f = dtgPlan.Rows[dtgPlan.Rows.Add()];
            f.Tag = TAG_BANDA;

            DeTexto(f, C_VA);
            DeTexto(f, C_MOTIVO);
            DeTexto(f, C_PUESTO);
            DeTexto(f, C_TIPO);

            f.Cells[C_TURNO].Value = horario;
            f.Cells[C_OFICIAL].Value = $"HORARIO {horario}   ·   {cuantos} oficial(es)";

            f.ReadOnly = true;
            f.DefaultCellStyle.BackColor = Estilo.Azul;
            f.DefaultCellStyle.ForeColor = Color.White;
            f.DefaultCellStyle.SelectionBackColor = Estilo.Azul;
            f.DefaultCellStyle.SelectionForeColor = Color.White;
            f.DefaultCellStyle.Font = Estilo.GrillaEncabezado;
        }

        /// <summary>
        /// Deja una celda de la banda como celda de texto vacia, sin
        /// heredar nada de su columna. El valor se pone despues de
        /// meterla en la fila: una celda suelta todavia no tiene grilla
        /// donde guardarlo.
        /// </summary>
        private static void DeTexto(DataGridViewRow f, string columna)
        {
            var celda = new DataGridViewTextBoxCell { ValueType = typeof(string) };

            f.Cells[columna] = celda;
            celda.Style.NullValue = "";
            celda.Value = "";
        }

        private static bool EsFija(DataGridViewRow f) => f.Tag is bool b && b;

        /// <summary>Codigo del puesto que tiene puesto una fila, para poder buscarlo.</summary>
        private string CodigoPuesto(DataGridViewRow f)
        {
            int id = f.Cells[C_PUESTO].Value is int p ? p : 0;
            return id == 0 ? "" : _puestos.FirstOrDefault(x => x.IdPuesto == id)?.Descripcion ?? "";
        }

        /// <summary>
        /// Lo que el autocompletado ofrece: exactamente los mismos campos
        /// donde busca <see cref="Filtrar"/>, para que no pueda sugerir
        /// algo que despues no halla.
        /// </summary>
        private IEnumerable<string?> OpcionesDeBusqueda() =>
            _plan.Select(l => l.Nombre)
                 .Concat(_plan.Select(l => l.Cedula))
                 .Concat(_plan.Select(l => l.NombreSustituto))
                 .Concat(_plan.Select(l => l.Turno))
                 .Concat(_puestos.Select(p => p.Descripcion));

        /// <summary>
        /// Esconde las filas que no coincidan con lo que se escribio en
        /// la caja de busqueda. Se esconden, no se borran: al guardar se
        /// sigue mandando el plan completo, con filtro o sin filtro.
        /// </summary>
        private void Filtrar()
        {
            string texto = txtBuscar.Text;

            bool antes = _cargando;
            _cargando = true;

            // Una fila con el cursor encima no se puede esconder, asi que
            // primero se suelta el cursor.
            dtgPlan.CurrentCell = null;

            DataGridViewRow? primera = null;
            int visibles = 0;

            // Primero las filas de oficiales...
            foreach (DataGridViewRow f in dtgPlan.Rows)
            {
                if (EsBanda(f)) continue;

                bool ok = Estilo.Coincide(texto,
                    f.Cells[C_OFICIAL].Value, f.Cells[C_CEDULA].Value,
                    f.Cells[C_TURNO].Value, f.Cells[C_CUBRE].Value,
                    CodigoPuesto(f));

                f.Visible = ok;
                if (!ok) continue;

                visibles++;
                primera ??= f;
            }

            // ...y despues cada banda, que solo se queda si a su horario
            // le sobrevivio alguien al filtro.
            DataGridViewRow? banda = null;
            bool hayEnLaSeccion = false;

            foreach (DataGridViewRow f in dtgPlan.Rows)
            {
                if (EsBanda(f))
                {
                    if (banda is not null) banda.Visible = hayEnLaSeccion;
                    banda = f;
                    hayEnLaSeccion = false;
                    continue;
                }

                if (f.Visible) hayEnLaSeccion = true;
            }

            if (banda is not null) banda.Visible = hayEnLaSeccion;

            // La seleccion tambien se mueve con el filtro puesto, asi que
            // el candado se suelta hasta despues de acomodarla.
            if (primera is not null)
            {
                dtgPlan.CurrentCell = primera.Cells[C_OFICIAL];
                primera.Selected = true;
            }

            _cargando = antes;

            grpPlan.Text = (visibles == _plan.Count
                ? $"1. Plan del dia  ({_plan.Count} oficiales)  -  " +
                  "desmarque a quien no va a estar"
                : $"1. Plan del dia  ({visibles} de {_plan.Count} oficiales)  -  " +
                  $"filtrando por \"{texto.Trim()}\"") + _aviso;

            if (primera is not null) CargarDisponibles();
            else VaciarDisponibles("2. Quien puede cubrir  -  " +
                                   "el filtro no dejo ninguna linea a la vista");
        }

        private void AbrirVariosDias()
        {
            if (_hayCambios && !Guardar(false)) return;

            Estilo.MostrarHijo(this, new ProyeccionRango(dtpFecha.Value), Cargar);
        }

        private void Plan_CellValueChanged(object? sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || _cargando) return;

            var fila = dtgPlan.Rows[e.RowIndex];
            if (EsBanda(fila)) return;

            string col = dtgPlan.Columns[e.ColumnIndex].Name;

            _cargando = true;
            try
            {
                if (EsFija(fila) && (col == C_VA || col == C_MOTIVO))
                {
                    fila.Cells[C_VA].Value = false;
                    fila.Cells[C_MOTIVO].Value = "Incapacidad";

                    // Se explica en la barra de abajo, sin ventana: el
                    // usuario ya vio que la casilla se devolvio sola.
                    lblResumen.Text =
                        $"{fila.Cells[C_OFICIAL].Value} tiene incapacidad registrada: " +
                        "para cambiarlo, quite la incapacidad desde ese menu.";
                    return;
                }

                bool va = fila.Cells[C_VA].Value is bool b && b;

                if (col == C_VA)
                {
                    if (va)
                    {
                        fila.Cells[C_MOTIVO].Value = "";
                        fila.Cells[C_CUBRE].Value = "";
                        QuitarSustitutoDeModelo(fila);
                    }
                    else if (string.IsNullOrWhiteSpace(fila.Cells[C_MOTIVO].Value?.ToString()))
                    {
                        fila.Cells[C_MOTIVO].Value = "Permiso";
                    }
                }

                if (col == C_MOTIVO && va &&
                    !string.IsNullOrWhiteSpace(fila.Cells[C_MOTIVO].Value?.ToString()))
                {
                    fila.Cells[C_VA].Value = false;
                }
            }
            finally { _cargando = false; }

            _hayCambios = true;
            Pintar(fila);
            CargarDisponibles();
            ActualizarResumen();
        }

        private void Pintar(DataGridViewRow f)
        {
            bool va = f.Cells[C_VA].Value is bool b && b;
            bool cubierto = !string.IsNullOrWhiteSpace(f.Cells[C_CUBRE].Value?.ToString())
                            && !EsFija(f);

            if (EsFija(f))
            {
                f.DefaultCellStyle.BackColor = Estilo.LilaFondo;
                f.DefaultCellStyle.ForeColor = Estilo.LilaTexto;
            }
            else if (va)
            {
                f.DefaultCellStyle.BackColor = Estilo.Superficie;
                f.DefaultCellStyle.ForeColor = Estilo.Texto;
            }
            else if (cubierto)
            {
                f.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                f.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
            }
            else
            {
                f.DefaultCellStyle.BackColor = Estilo.RojoFondo;
                f.DefaultCellStyle.ForeColor = Estilo.RojoTexto;
            }
        }

        // =============================================================
        // DISPONIBLES
        // =============================================================
        /// <summary>
        /// La forma de una fila de la lista de la derecha. Con un tipo
        /// con nombre se le puede pasar una lista vacia a la grilla y los
        /// encabezados se quedan puestos; pasandole null quedaba un
        /// recuadro gris sin titulos que parecia una pantalla rota.
        /// </summary>
        private sealed record FilaDisponible(int IdOficial, string Oficial,
                                             string Rol, string Situacion);

        private static List<FilaDisponible> AFilas(IEnumerable<OficialDisponible> datos) =>
            datos.Select(d => new FilaDisponible(
                     d.IdOficial, d.Nombre, d.Horario, d.Situacion))
                 .ToList();

        /// <summary>Vacia la lista de la derecha diciendo por que esta vacia.</summary>
        private void VaciarDisponibles(string titulo)
        {
            _disponibles = new();

            dtgDisp.DataSource = AFilas(_disponibles);
            if (dtgDisp.Columns.Contains("IdOficial"))
                dtgDisp.Columns["IdOficial"]!.Visible = false;
            Estilo.SinOrdenamiento(dtgDisp);

            grpDisp.Text = titulo;
        }

        private void CargarDisponibles()
        {
            if (_cargando) return;

            var fila = dtgPlan.CurrentRow;
            if (fila is null || EsBanda(fila))
            {
                VaciarDisponibles("2. Quien puede cubrir  -  escoja una linea del plan");
                return;
            }

            bool va = fila.Cells[C_VA].Value is bool b && b;
            if (va)
            {
                VaciarDisponibles("2. Quien puede cubrir  -  " +
                                  "ese oficial si va a estar, no necesita cobertura");
                return;
            }

            try
            {
                string turno = fila.Cells[C_TURNO].Value?.ToString() ?? "";
                var usados = SustitutosUsados(exceptoFila: fila);

                // Se cargan todos, del turno que sean, mas los
                // autorizados externos. Los incapacitados quedan fuera.
                _disponibles = _repo.ListarDisponibles(dtpFecha.Value, turno, usados);

                dtgDisp.DataSource = AFilas(_disponibles);

                if (dtgDisp.Columns.Contains("IdOficial"))
                    dtgDisp.Columns["IdOficial"]!.Visible = false;
                Estilo.SinOrdenamiento(dtgDisp);

                foreach (DataGridViewRow f in dtgDisp.Rows)
                {
                    var d = _disponibles.ElementAtOrDefault(f.Index);
                    if (d is null) continue;

                    // El que ya cubre algo se marca en ambar: se puede
                    // escoger igual, pero que se vea que es un extra.
                    if (d.YaCubre)
                    {
                        f.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                        f.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
                    }
                    else if (d.EsExterno)
                    {
                        f.DefaultCellStyle.BackColor = Estilo.LilaFondo;
                        f.DefaultCellStyle.ForeColor = Estilo.LilaTexto;
                    }
                }

                string nombre = fila.Cells[C_OFICIAL].Value?.ToString() ?? "";
                int externos = _disponibles.Count(d => d.EsExterno);
                int extras = _disponibles.Count(d => d.YaCubre);
                grpDisp.Text = $"2. Puede cubrir a {nombre}  " +
                               $"({_disponibles.Count}, {externos} externo(s), " +
                               $"{extras} en extra)";
            }
            catch (Exception ex) { Error("No se pudieron cargar los disponibles.", ex); }
        }

        /// <summary>
        /// Quienes NO pueden aparecer como cobertura.
        ///
        /// Queda un solo caso: el propio oficial al que se le esta
        /// buscando quien lo cubra, porque nadie se cubre a si mismo.
        ///
        /// El que ya quedo cubriendo otro puesto ese dia SI sigue en la
        /// lista: aqui los oficiales hacen extras seguido y uno solo
        /// puede agarrar dos o tres puestos el mismo dia. Antes se les
        /// sacaba de la lista y por eso desaparecian.
        /// </summary>
        private List<int> SustitutosUsados(DataGridViewRow? exceptoFila = null)
        {
            var lista = new List<int>();

            if (exceptoFila is not null)
                lista.Add(Convert.ToInt32(exceptoFila.Cells[C_ID].Value ?? 0));

            return lista;
        }

        private void Asignar()
        {
            var fila = dtgPlan.CurrentRow;
            if (fila is null || EsBanda(fila))
            { Avisar("Escoja en el plan a quien hay que cubrir."); return; }

            if (fila.Cells[C_VA].Value is bool b && b)
            {
                Avisar("Ese oficial si va a estar. Desmarque 'Va a estar' antes de asignarle cobertura.");
                return;
            }

            if (dtgDisp.CurrentRow is null || !dtgDisp.Columns.Contains("IdOficial"))
            { Avisar("Escoja a la derecha quien lo va a cubrir."); return; }

            var v = dtgDisp.CurrentRow.Cells["IdOficial"].Value;
            if (v is null) return;

            int idSust = Convert.ToInt32(v);
            int idOficial = Convert.ToInt32(fila.Cells[C_ID].Value);

            var sustituto = _disponibles.FirstOrDefault(d => d.IdOficial == idSust);
            var linea = _plan.FirstOrDefault(l => l.IdOficial == idOficial);
            if (sustituto is null || linea is null) return;

            linea.IdOficialSustituto = idSust;
            linea.NombreSustituto = sustituto.Nombre;

            // El que entra a cubrir a otro esta haciendo un extra, asi
            // que la casilla se marca sola. Si en ese caso era relevo por
            // rol, se devuelve a mano en el desplegable.
            //
            // Si la base todavia no tiene la columna no se marca nada:
            // dejar "Extra" en pantalla y que se pierda al guardar seria
            // peor que no marcarlo.
            bool marcaExtra = _repo.HayTipo;
            if (marcaExtra) linea.Tipo = ProyeccionRepositorio.TipoExtra;

            _cargando = true;
            try
            {
                fila.Cells[C_CUBRE].Value = sustituto.Nombre;
                if (marcaExtra)
                    fila.Cells[C_TIPO].Value = ProyeccionRepositorio.TipoExtra;
            }
            finally { _cargando = false; }

            _hayCambios = true;

            Pintar(fila);
            CargarDisponibles();
            ActualizarResumen();
            lblResumen.Text = $"{sustituto.Nombre} cubriria a {linea.Nombre}" +
                              (marcaExtra ? ", marcado como extra." : ".");
        }

        private void Quitar()
        {
            var fila = dtgPlan.CurrentRow;
            if (fila is null || EsBanda(fila))
            { Avisar("Escoja la linea a la que quiere quitarle la cobertura."); return; }

            QuitarSustitutoDeModelo(fila);

            // Se deshace tambien la marca de extra que puso el asignar:
            // sin nadie cubriendo, esa casilla ya no es un extra.
            bool marcaExtra = _repo.HayTipo;

            if (marcaExtra)
            {
                int idFila = Convert.ToInt32(fila.Cells[C_ID].Value ?? 0);
                var quitada = _plan.FirstOrDefault(l => l.IdOficial == idFila);
                if (quitada is not null) quitada.Tipo = ProyeccionRepositorio.TipoRol;
            }

            _cargando = true;
            try
            {
                fila.Cells[C_CUBRE].Value = "";
                if (marcaExtra)
                    fila.Cells[C_TIPO].Value = ProyeccionRepositorio.TipoRol;
            }
            finally { _cargando = false; }

            _hayCambios = true;

            Pintar(fila);
            CargarDisponibles();
            ActualizarResumen();
        }

        private void QuitarSustitutoDeModelo(DataGridViewRow fila)
        {
            int id = Convert.ToInt32(fila.Cells[C_ID].Value ?? 0);
            var linea = _plan.FirstOrDefault(l => l.IdOficial == id);
            if (linea is null) return;

            linea.IdOficialSustituto = null;
            linea.NombreSustituto = "";
        }

        // =============================================================
        // GUARDAR
        // =============================================================
        private bool Guardar(bool avisar)
        {
            if (dtgPlan.Rows.Count == 0)
            {
                Avisar("No hay nada que guardar. Cargue un plan primero.");
                return false;
            }

            var lineas = LeerGrilla();

            var sinMotivo = lineas.Where(l => !l.Disponible &&
                                              string.IsNullOrWhiteSpace(l.Motivo)).ToList();
            if (sinMotivo.Count > 0)
            {
                MessageBox.Show(
                    $"Hay {sinMotivo.Count} oficial(es) marcados como que no van a estar, " +
                    "pero sin motivo.\n\n" +
                    "Primero sin motivo: " + sinMotivo[0].Nombre,
                    "Falta el motivo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return false;
            }

            // Un puesto con dos oficiales se guarda igual, sin preguntar:
            // en la practica pasa (traslapes, refuerzos) y quien planea
            // sabe lo que esta haciendo. Solo se deja anotado abajo.
            var repetido = lineas.Where(l => l.Disponible && l.IdPuesto is not null)
                                 .GroupBy(l => l.IdPuesto)
                                 .FirstOrDefault(g => g.Count() > 1);

            string avisoRepetido = "";
            if (repetido is not null)
            {
                string codigo = _puestos.FirstOrDefault(p => p.IdPuesto == repetido.Key)?.Codigo ?? "?";
                avisoRepetido = $"   |   OJO: el puesto {codigo} quedo con " +
                                $"{repetido.Count()} oficiales";
            }

            try
            {
                Cursor = Cursors.WaitCursor;

                // Se guarda contra la fecha y el turno que estan CARGADOS,
                // no contra lo que diga el filtro. Cuando el usuario mueve
                // la fecha, el plan pendiente se guarda solo, y para ese
                // momento el selector ya marca el dia nuevo: guardarlo ahi
                // le pasaria el plan de un dia al otro.
                string? turno = _turnoCargado <= 0
                    ? null : cbxTurno.Items[_turnoCargado]?.ToString();

                _repo.Guardar(_fechaCargada, turno, lineas);
                _hayCambios = false;
                ActualizarResumen();

                // Si presiono Guardar es porque quiere guardar: no hay
                // ventana de "listo", el aviso va en la barra de abajo.
                if (avisar)
                    lblResumen.Text =
                        $"Proyeccion del {_fechaCargada:dd/MM/yyyy} guardada   |   " +
                        $"Planeados: {lineas.Count(l => l.Disponible)}   |   " +
                        $"Con cobertura: {lineas.Count(l => l.IdOficialSustituto is not null)}" +
                        avisoRepetido;

                return true;
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number is 2601 or 2627)
            {
                // La base vieja tenia un indice unico que no dejaba que un
                // oficial cubriera dos puestos el mismo dia. Ahora si se
                // permite, porque los extras son cosa de todos los dias,
                // pero hace falta correr el script para quitarlo.
                MessageBox.Show(
                    "La base todavia no deja que un oficial cubra mas de un puesto " +
                    "el mismo dia.\n\n" +
                    "Corra el archivo PlanillaVanguard_PUESTOS.sql una sola vez y " +
                    "vuelva a guardar. Despues de eso los extras entran sin problema.",
                    "Falta actualizar la base", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return false;
            }
            catch (Exception ex)
            {
                Error("No se pudo guardar. No se registro ningun cambio.", ex);
                return false;
            }
            finally { Cursor = Cursors.Default; }
        }

        private List<LineaProyeccion> LeerGrilla()
        {
            var lista = new List<LineaProyeccion>();

            foreach (DataGridViewRow f in dtgPlan.Rows)
            {
                // Las bandas de horario son rotulos, no oficiales: si se
                // colaran aqui entrarian a la base con IdOficial 0.
                if (EsBanda(f)) continue;

                int id = Convert.ToInt32(f.Cells[C_ID].Value);
                var origen = _plan.FirstOrDefault(l => l.IdOficial == id);

                bool va = f.Cells[C_VA].Value is bool b && b;
                int idPuesto = f.Cells[C_PUESTO].Value is int p ? p : 0;
                string motivo = f.Cells[C_MOTIVO].Value?.ToString() ?? "";

                lista.Add(new LineaProyeccion
                {
                    IdOficial = id,
                    Nombre = f.Cells[C_OFICIAL].Value?.ToString() ?? "",
                    Turno = f.Cells[C_TURNO].Value?.ToString() ?? "",
                    IdPuesto = idPuesto == 0 ? null : idPuesto,
                    Disponible = va,
                    Motivo = va || string.IsNullOrWhiteSpace(motivo) ? null : motivo,
                    Tipo = ProyeccionRepositorio.LimpiarTipo(
                        f.Cells[C_TIPO].Value?.ToString()),
                    IdOficialSustituto = va ? null : origen?.IdOficialSustituto
                });
            }
            return lista;
        }

        // =============================================================
        // REPORTE
        // =============================================================
        private void GenerarReporte()
        {
            if (dtgPlan.Rows.Count == 0)
            {
                Avisar("Cargue primero el plan de una fecha.");
                return;
            }

            // Siempre se guarda antes de exportar. Si nunca se guardo,
            // la tabla estaria vacia y el Excel saldria en blanco.
            if (!Guardar(false)) return;

            DateTime fecha = _fechaCargada;
            var datos = _repo.ObtenerReporte(fecha);

            if (datos.Rows.Count == 0)
            {
                MessageBox.Show(
                    "No hay datos para exportar en esa fecha.",
                    "Sin proyeccion", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar la proyeccion",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Proyeccion_Base105_{fecha:yyyy-MM-dd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                Cursor = Cursors.WaitCursor;
                ExportarExcel(dlg.FileName, fecha, datos);

                // El archivo se abre solo: quien pidio el reporte lo
                // quiere ver, no confirmar dos veces.
                lblResumen.Text = $"Proyeccion del {fecha:dd/MM/yyyy} generada en {dlg.FileName}";
                Estilo.AbrirArchivo(dlg.FileName);
            }
            catch (IOException)
            {
                MessageBox.Show(
                    "No se pudo escribir el archivo. Probablemente ya lo tiene abierto " +
                    "en Excel. Cierrelo e intente de nuevo.",
                    "Archivo en uso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex) { Error("No se pudo generar el reporte.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>
        /// El mismo Excel de sustituciones que sale del modulo de
        /// sustituciones, pero pedido desde aqui. Trae las coberturas
        /// proyectadas y, si ese dia ya se paso lista, tambien las
        /// sustituciones reales, para poder compararlas.
        /// </summary>
        private void GenerarExcelSustituciones()
        {
            if (dtgPlan.Rows.Count == 0)
            {
                Avisar("Cargue primero el plan de una fecha.");
                return;
            }

            // Si hay cambios en pantalla se guardan antes: si no, el
            // Excel saldria con lo viejo.
            if (_hayCambios && !Guardar(false)) return;

            DateTime fecha = _fechaCargada;

            List<Sustitucion> proyectadas, reales;
            List<LineaAsistencia> sinCubrir;

            try
            {
                proyectadas = _repo.ListarCoberturas(fecha);
                reales = _repoAsis.ListarSustituciones(fecha);

                var cubiertos = reales.Select(s => s.IdOficialAusente).ToHashSet();
                sinCubrir = _repoAsis.ListarAusentes(fecha)
                                     .Where(a => !cubiertos.Contains(a.IdOficial))
                                     .ToList();
            }
            catch (Exception ex)
            {
                Error("No se pudieron leer las sustituciones de esa fecha.", ex);
                return;
            }

            if (proyectadas.Count == 0 && reales.Count == 0)
            {
                MessageBox.Show(
                    "Esa fecha no tiene ninguna cobertura, ni proyectada ni real.\n\n" +
                    "Asigne coberturas en el plan antes de exportar.",
                    "Sin sustituciones", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar el Excel de sustituciones",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Sustituciones_Base105_{fecha:yyyy-MM-dd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                Cursor = Cursors.WaitCursor;
                ReporteSustitucionesExcel.Generar(
                    dlg.FileName, fecha, reales, proyectadas, sinCubrir);

                lblResumen.Text =
                    $"Excel de sustituciones del {fecha:dd/MM/yyyy}   |   " +
                    $"Proyectadas: {proyectadas.Count}   |   De la lista: {reales.Count}";
                Estilo.AbrirArchivo(dlg.FileName);
            }
            catch (IOException)
            {
                MessageBox.Show(
                    "No se pudo escribir el archivo. Probablemente ya lo tiene abierto " +
                    "en Excel. Cierrelo e intente de nuevo.",
                    "Archivo en uso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex) { Error("No se pudo generar el Excel.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        private void ExportarExcel(string ruta, DateTime fecha, DataTable datos)
        {
            var cultura = CultureInfo.GetCultureInfo("es-CR");
            string fechaLarga = fecha.ToString("dddd d 'de' MMMM 'de' yyyy", cultura).ToUpper(cultura);

            using var libro = new XLWorkbook();
            var ws = libro.Worksheets.Add("Proyeccion");
            int cols = datos.Columns.Count;

            int ft = EstiloExcel.Banner(ws, cols,
                "Proyeccion de personal", "Base 105  ·  Clinica Marcial Fallas", fechaLarga,
                "Documento de planificacion. No refleja asistencia real.");

            for (int c = 0; c < cols; c++)
                ws.Cell(ft, c + 1).Value = datos.Columns[c].ColumnName;
            EstiloExcel.Encabezado(ws, ft, cols);

            // ---------- Datos ----------
            int fila = ft + 1;
            int asignados = 0, noVan = 0, cubiertos = 0, extras = 0;
            var estados = new List<(bool Va, bool Cubierto)>();

            foreach (DataRow r in datos.Rows)
            {
                string situacion = r["Situacion"]?.ToString() ?? "";
                string cubre = r["Lo cubre"]?.ToString() ?? "";
                bool va = situacion == "Asignado";
                bool cubierto = !va && !string.IsNullOrWhiteSpace(cubre);

                if (va) asignados++;
                else { noVan++; if (cubierto) cubiertos++; }

                if (string.Equals(r["Tipo"]?.ToString(), ProyeccionRepositorio.TipoExtra,
                                  StringComparison.OrdinalIgnoreCase)) extras++;

                estados.Add((va, cubierto));

                for (int c = 0; c < cols; c++)
                {
                    object? v = r[c];
                    ws.Cell(fila, c + 1).Value =
                        v is null || v == DBNull.Value ? "" : v.ToString();

                    // Los nombres van a la izquierda y todo lo demas
                    // centrado. Se mira por nombre de columna: por
                    // numero se descuadraba cada vez que se agregaba
                    // una columna nueva al reporte.
                    string titulo = datos.Columns[c].ColumnName;
                    EstiloExcel.Celda(ws.Cell(fila, c + 1),
                        centrado: titulo is not ("Oficial planeado" or "Lo cubre"));
                }

                fila++;
            }

            int ultima = fila - 1;

            if (ultima >= ft + 1)
            {
                EstiloExcel.Franjas(ws, ft + 1, ultima, cols);

                for (int i = 0; i < estados.Count; i++)
                {
                    if (estados[i].Va) continue;

                    var rango = ws.Range(ft + 1 + i, 1, ft + 1 + i, cols);
                    rango.Style.Fill.BackgroundColor = estados[i].Cubierto
                        ? EstiloExcel.AmbarFondo : EstiloExcel.RojoFondo;
                    rango.Style.Font.FontColor = estados[i].Cubierto
                        ? EstiloExcel.AmbarTexto : EstiloExcel.RojoTexto;
                }

                EstiloExcel.Lineas(ws, ft, ultima, cols, columnasDeRotulo: 0);
                ws.Range(ft, 1, ultima, cols).SetAutoFilter();
            }

            // ---------- Resumen ----------
            int fr = ultima + 2;
            ws.Range(fr, 1, fr, 2).Merge();
            var tit = ws.Cell(fr, 1);
            tit.Value = "RESUMEN DE LA PROYECCION";
            tit.Style.Fill.BackgroundColor = EstiloExcel.Azul;
            tit.Style.Font.FontColor = XLColor.White;
            tit.Style.Font.Bold = true;
            tit.Style.Font.FontSize = 9.5;
            tit.Style.Font.FontName = EstiloExcel.Fuente;
            tit.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Row(fr).Height = 18;

            var res = new (string E, int V)[]
            {
                ("Oficiales planeados", asignados),
                ("No van a estar",      noVan),
                ("Con cobertura",       cubiertos),
                ("Entran de extra",     extras),
                ("Puestos sin cubrir",  noVan - cubiertos)
            };

            for (int i = 0; i < res.Length; i++)
            {
                int f = fr + 1 + i;
                ws.Cell(f, 1).Value = "   " + res[i].E;
                ws.Cell(f, 2).Value = res[i].V;
                ws.Cell(f, 1).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 1).Style.Font.FontSize = 9.5;
                ws.Cell(f, 2).Style.Font.Bold = true;
                ws.Cell(f, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                ws.Row(f).Height = 17;

                if (res[i].E == "Puestos sin cubrir" && res[i].V > 0)
                {
                    ws.Range(f, 1, f, 2).Style.Fill.BackgroundColor = EstiloExcel.RojoFondo;
                    ws.Range(f, 1, f, 2).Style.Font.FontColor = EstiloExcel.RojoTexto;
                }
            }

            var caja = ws.Range(fr, 1, fr + res.Length, 2);
            caja.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
            caja.Style.Border.OutsideBorderColor = EstiloExcel.Azul;
            caja.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            caja.Style.Border.InsideBorderColor = EstiloExcel.Linea;

            int fl = EstiloExcel.Leyenda(ws, fr + res.Length + 3, cols,
                new (string, XLColor?, XLColor?)[]
                {
                    ("Amarillo = tiene quien lo cubra",
                     EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto),
                    ("Rojo = puesto sin cubrir",
                     EstiloExcel.RojoFondo, EstiloExcel.RojoTexto)
                });

            EstiloExcel.Pie(ws, fl, cols);

            ws.Columns(1, cols).AdjustToContents();
            for (int c = 1; c <= cols; c++)
                if (ws.Column(c).Width > 34) ws.Column(c).Width = 34;

            EstiloExcel.Impresion(ws, ft, columnasFijas: 0);

            libro.SaveAs(ruta);
        }

        // =============================================================
        private void ActualizarResumen()
        {
            var filas = dtgPlan.Rows.Cast<DataGridViewRow>()
                                    .Where(f => !EsBanda(f)).ToList();

            int total = filas.Count;
            int noVan = filas.Count(f => f.Cells[C_VA].Value is bool b && !b);
            int cubiertos = filas.Count(f =>
                f.Cells[C_VA].Value is bool b && !b &&
                !string.IsNullOrWhiteSpace(f.Cells[C_CUBRE].Value?.ToString()));

            lblResumen.Text =
                $"Planeados: {total - noVan}   |   No van: {noVan}   |   " +
                $"Cubiertos: {cubiertos}   |   Sin cubrir: {noVan - cubiertos}" +
                (_hayCambios ? "   |   SIN GUARDAR" : "");
        }

        /// <summary>
        /// Lo que falta se dice en la barra de abajo, no en una ventana:
        /// son avisos de un clic incompleto, no errores.
        /// </summary>
        private void Avisar(string m) => lblResumen.Text = m;

        private static void Error(string ctx, Exception ex) =>
            MessageBox.Show($"{ctx}\n\nDetalle tecnico:\n{ex.Message}",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
