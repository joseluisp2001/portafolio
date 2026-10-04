using System.Globalization;
using GestorDatos;

namespace formularios
{
    public partial class fmrAsistencia : Form
    {
        private readonly AsistenciaRepositorio _repo = new();
        private List<Puesto> _puestos = new();

        /// <summary>Fecha de trabajo. Sale del selector, no del reloj.</summary>
        private DateTime _fecha = DateTime.Today;

        private string _turnoCargado = "";
        private bool _hayCambios;
        private bool _ajustando;

        /// <summary>Se enciende cuando el formulario ya termino de abrirse.</summary>
        private bool _listo;

        /// <summary>Lo ultimo que hay que contarle al usuario del turno cargado.</summary>
        private string _aviso = "";

        /// <summary>Lo que el buscador dejo a la vista. Va aparte de <see cref="_aviso"/>.</summary>
        private string _avisoFiltro = "";

        /// <summary>
        /// Buscador de la lista del turno. Se arma por codigo porque el
        /// Designer de esta pantalla es de los viejos.
        /// </summary>
        private Buscador? _buscador;

        private const string COL_ID = "IdOficial";
        private const string COL_NOMBRE = "Nombre";
        private const string COL_CEDULA = "Cedula";
        private const string COL_SIT = "Situacion";
        private const string COL_LLEGO = "Llego";
        private const string COL_TARDIA = "Tardia";
        private const string COL_HORA = "HoraLlegada";
        private const string COL_PUESTO = "Puesto";
        private const string COL_TIPO = "Tipo";

        public fmrAsistencia()
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
            lblFecha.Left = margenTexto + 3;

            lblBanda.Font = Estilo.Titulo;
            lblBanda.ForeColor = Color.White;
            lblBanda.BackColor = Color.Transparent;
            Estilo.SubtituloBanda(lblFecha);
            lblFecha.AutoSize = false;
            Estilo.SobreBanda(btnMenuPrincipal);
            Estilo.AnclarDerecha(pnlBanda, btnMenuPrincipal);

            pnlFiltros.BackColor = Estilo.Superficie;
            pnlInferior.BackColor = Estilo.Superficie;

            foreach (var l in new[] { lblFechaSel, lblTurno })
            {
                l.Font = Estilo.Subtitulo;
                l.ForeColor = Estilo.TextoSuave;
            }

            Estilo.CampoTexto(cbxTurno);
            Estilo.CampoTexto(dtpFecha);

            Estilo.Primario(btnCargar);
            Estilo.Secundario(btnMarcarTodos);
            Estilo.Secundario(btnProyeccion);
            Estilo.Primario(btnGuardarTurno);
            Estilo.Secundario(btnPasarSustituciones);
            Estilo.Secundario(btnExcelDia);

            lblEstadoTurno.Font = Estilo.GrillaEncabezado;
            lblResumen.Font = Estilo.Subtitulo;
            lblResumen.ForeColor = Estilo.TextoSuave;

            ArmarBuscador();

            // Escape sale igual que el boton: pasando primero por la
            // pregunta de cambios sin guardar. Las demas pantallas ya lo
            // tenian; esta se habia quedado sin el.
            KeyPreview = true;
            KeyDown += (_, e) =>
            {
                if (e.KeyCode == Keys.Escape) btnMenuPrincipal_Click(this, EventArgs.Empty);
            };
        }

        /// <summary>
        /// Buscador de la lista del turno, en el segundo renglon de la
        /// franja de filtros.
        ///
        /// Con la planilla completa un turno trae varias decenas de
        /// nombres, y en la pantalla caben unos pocos: buscar por nombre
        /// o cedula es mas rapido que ir bajando con la rueda.
        ///
        /// Lo que esconde sigue estando: lo marcado en una fila
        /// escondida se guarda igual cuando se cierra el turno. El filtro
        /// es de lo que se ve, no de lo que se graba.
        /// </summary>
        private void ArmarBuscador()
        {
            _buscador = Buscador.Poner(
                pnlFiltros, 20, 82,
                "Buscar en la lista: nombre o cedula",
                () => Buscador.Opciones(dtgAsistencia, COL_NOMBRE, COL_CEDULA),
                FiltrarLista, 300);
        }

        /// <summary>Deja a la vista solo las filas que traen lo buscado.</summary>
        private void FiltrarLista()
        {
            if (_buscador is null) return;

            _ajustando = true;
            try
            {
                int visibles = Buscador.Esconder(dtgAsistencia, _buscador.Texto,
                                                 COL_NOMBRE, COL_CEDULA, COL_SIT);

                // En su propio renglon y no en _aviso: lo del turno
                // ("ya cerrado", "3 con incapacidad") tiene que seguir
                // leyendose aunque se este filtrando.
                _avisoFiltro = !_buscador.HayFiltro
                    ? ""
                    : $"   |   filtrando por \"{_buscador.Texto.Trim()}\": " +
                      $"{visibles} de {dtgAsistencia.Rows.Count} a la vista " +
                      "(lo escondido se guarda igual)";
            }
            finally { _ajustando = false; }

            ActualizarResumen();
        }

        // =============================================================
        // CARGA
        // =============================================================
        private void fmrAsistencia_Load(object? sender, EventArgs e)
        {
            // No se puede pasar lista de dias futuros
            dtpFecha.MaxDate = DateTime.Today;
            dtpFecha.Value = DateTime.Today;
            dtpFecha.ValueChanged += FechaCambiada;

            cbxTurno.Items.AddRange(AsistenciaRepositorio.Turnos);

            try
            {
                _puestos = _repo.ListarPuestos();
                ConfigurarGrilla();
                MostrarFecha();
                MostrarEstadoDelDia();

                // Cambiar de turno carga la lista sola. Se conecta antes
                // de sugerir el turno para que la pantalla abra ya con la
                // lista de ese horario puesta.
                _listo = true;
                cbxTurno.SelectedIndexChanged += (_, _) => CargarTurnoAutomatico();

                SugerirTurnoPorHora();
            }
            catch (Exception ex)
            {
                MostrarError("No se pudo preparar el formulario.", ex);
            }
        }

        private void FechaCambiada(object? sender, EventArgs e)
        {
            if (_hayCambios && !ConfirmarDescartar())
            {
                dtpFecha.ValueChanged -= FechaCambiada;
                dtpFecha.Value = _fecha;
                dtpFecha.ValueChanged += FechaCambiada;
                return;
            }

            _fecha = dtpFecha.Value.Date;
            _turnoCargado = "";
            _hayCambios = false;
            _aviso = "";

            dtgAsistencia.Rows.Clear();
            lblEstadoTurno.Text = "";
            lblResumen.Text = "Presione Cargar turno para ver la lista de esa fecha.";

            MostrarFecha();
            MostrarEstadoDelDia();

            // La fecha tambien recarga sola: si ya hay un turno escogido,
            // la lista de ese dia entra de una vez.
            if (cbxTurno.SelectedIndex >= 0) CargarTurno();
        }

        private void MostrarFecha()
        {
            var cultura = CultureInfo.GetCultureInfo("es-CR");
            string texto = _fecha.ToString("dddd d 'de' MMMM 'de' yyyy", cultura).ToUpper(cultura);

            if (_fecha != DateTime.Today)
                texto += $"   ({(DateTime.Today - _fecha).Days} dia(s) atras)";

            lblFecha.Text = texto;
        }

        /// <summary>
        /// Solo es una sugerencia por la hora del reloj. Varios turnos se
        /// traslapan (los cortos de la manana y de la tarde, y el de
        /// 14:00 - 21:00), asi que se propone el turno largo de siempre y
        /// el usuario cambia en la lista si le toca otro.
        /// </summary>
        private void SugerirTurnoPorHora()
        {
            int h = DateTime.Now.Hour;
            cbxTurno.SelectedItem =
                h >= 6 && h < 14 ? "06:00 - 14:00" :
                h >= 14 && h < 18 ? "14:00 - 18:00" :
                h >= 18 && h < 21 ? "18:00 - 00:00" :
                h >= 21 ? "18:00 - 00:00" : "00:00 - 06:00";
        }

        // =============================================================
        // GRILLA
        // =============================================================
        private void ConfigurarGrilla()
        {
            Estilo.Grid(dtgAsistencia);
            dtgAsistencia.AutoGenerateColumns = false;
            dtgAsistencia.Columns.Clear();
            dtgAsistencia.SelectionMode = DataGridViewSelectionMode.CellSelect;

            dtgAsistencia.Columns.Add(new DataGridViewTextBoxColumn
            { Name = COL_ID, HeaderText = "Codigo", Width = 75, ReadOnly = true });

            dtgAsistencia.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = COL_NOMBRE, HeaderText = "Oficial", ReadOnly = true,
                AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, FillWeight = 180
            });

            dtgAsistencia.Columns.Add(new DataGridViewTextBoxColumn
            { Name = COL_CEDULA, HeaderText = "Cedula", Width = 120, ReadOnly = true });

            dtgAsistencia.Columns.Add(new DataGridViewTextBoxColumn
            { Name = COL_SIT, HeaderText = "Situacion", Width = 190, ReadOnly = true });

            // NullValue = false: una casilla sin valor se dibuja
            // desmarcada en vez de tumbar la pantalla con el
            // "valor con formato de la celda tiene un tipo erroneo".
            var colLlego = new DataGridViewCheckBoxColumn
            { Name = COL_LLEGO, HeaderText = "Llego", Width = 65 };
            colLlego.DefaultCellStyle.NullValue = false;
            dtgAsistencia.Columns.Add(colLlego);

            var colTardia = new DataGridViewCheckBoxColumn
            { Name = COL_TARDIA, HeaderText = "Tardia", Width = 65 };
            colTardia.DefaultCellStyle.NullValue = false;
            dtgAsistencia.Columns.Add(colTardia);

            // 130 y no 100: con 100 el titulo no cabe de un solo renglon,
            // se parte en dos y la segunda linea queda cortada por la
            // altura del encabezado. Se lee "Hora" y debajo un pedazo.
            dtgAsistencia.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = COL_HORA, HeaderText = "Hora llegada", Width = 130, MaxInputLength = 5,
                ToolTipText = "Escribala como 07:15 o 715. Solo aplica si la casilla de tardia esta marcada.",
                DefaultCellStyle = new DataGridViewCellStyle
                { Alignment = DataGridViewContentAlignment.MiddleCenter }
            });

            var colPuesto = new DataGridViewComboBoxColumn
            {
                Name = COL_PUESTO,
                HeaderText = "Puesto asignado",
                DisplayMember = nameof(Puesto.Descripcion),
                ValueMember = nameof(Puesto.IdPuesto),
                AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill,
                FillWeight = 230,
                FlatStyle = FlatStyle.Flat
            };

            // 0 es "(sin asignar)": asi una celda que todavia no se ha
            // llenado no tumba el dibujado de la grilla.
            colPuesto.DefaultCellStyle.NullValue = 0;
            colPuesto.DataSource = Puesto.ParaGrilla(_puestos, "(sin asignar)");
            dtgAsistencia.Columns.Add(colPuesto);

            // Con que entra ese dia. Va pegada al puesto porque se lee
            // junto con el: "puesto tal, y va de extra". Es lo que en el
            // cuaderno se anota al lado del nombre y lo que despues
            // manda en la planilla.
            var colTipo = new DataGridViewComboBoxColumn
            {
                Name = COL_TIPO,
                HeaderText = "Tipo",
                Width = 95,
                FlatStyle = FlatStyle.Flat,
                ToolTipText =
                    "Rol: le tocaba.  Vacante: plaza sin titular.  " +
                    "Extra: entra cubriendo a alguien."
            };
            colTipo.DefaultCellStyle.NullValue = TipoJornada.Rol;
            colTipo.Items.AddRange(TipoJornada.Todos);

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

            dtgAsistencia.Columns.Add(colTipo);

            Estilo.SinOrdenamiento(dtgAsistencia);

            dtgAsistencia.CurrentCellDirtyStateChanged += (_, _) =>
            {
                if (dtgAsistencia.IsCurrentCellDirty)
                    dtgAsistencia.CommitEdit(DataGridViewDataErrorContexts.Commit);
            };

            dtgAsistencia.CellValueChanged += Grilla_CellValueChanged;
        }

        /// <summary>True si esa fila corresponde a un oficial incapacitado.</summary>
        private static bool EsIncapacitado(DataGridViewRow fila) =>
            fila.Tag is bool b && b;

        /// <summary>True si la fila esta marcada con ese tipo de jornada.</summary>
        private static bool EsTipo(DataGridViewRow fila, string tipo) =>
            TipoJornada.Limpiar(fila.Cells[COL_TIPO].Value?.ToString()) == tipo;

        private void Grilla_CellValueChanged(object? sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || _ajustando) return;

            var fila = dtgAsistencia.Rows[e.RowIndex];
            string columna = dtgAsistencia.Columns[e.ColumnIndex].Name;

            _ajustando = true;
            try
            {
                // Un incapacitado no se puede marcar como presente, ni
                // tiene sentido decir con que entro: ese dia no entro.
                if (EsIncapacitado(fila) &&
                    (columna == COL_LLEGO || columna == COL_TARDIA || columna == COL_TIPO))
                {
                    fila.Cells[COL_LLEGO].Value = false;
                    fila.Cells[COL_TARDIA].Value = false;
                    fila.Cells[COL_HORA].Value = "";
                    fila.Cells[COL_TIPO].Value = TipoJornada.Rol;

                    // La casilla se devuelve sola; el porque va abajo, sin
                    // ventana de por medio.
                    lblResumen.Text =
                        $"{fila.Cells[COL_NOMBRE].Value} tiene incapacidad vigente: " +
                        "quitela desde el menu de Incapacidades si ya se reintegro.";
                    return;
                }

                bool llego = fila.Cells[COL_LLEGO].Value is bool b && b;

                if (columna == COL_LLEGO && !llego)
                {
                    fila.Cells[COL_TARDIA].Value = false;
                    fila.Cells[COL_HORA].Value = "";
                }

                if (columna == COL_TARDIA)
                {
                    bool tardia = fila.Cells[COL_TARDIA].Value is bool t && t;

                    if (tardia && !llego)
                    {
                        fila.Cells[COL_TARDIA].Value = false;
                        lblResumen.Text = "Marque primero 'Llego' para poder ponerle tardia.";
                    }
                    else if (tardia)
                    {
                        if (string.IsNullOrWhiteSpace(fila.Cells[COL_HORA].Value?.ToString()))
                            fila.Cells[COL_HORA].Value = DateTime.Now.ToString("HH:mm");
                    }
                    else fila.Cells[COL_HORA].Value = "";
                }

                if (columna == COL_HORA)
                {
                    string texto = fila.Cells[COL_HORA].Value?.ToString() ?? "";
                    var hora = ParsearHora(texto);

                    if (!string.IsNullOrWhiteSpace(texto) && hora is null)
                    {
                        fila.Cells[COL_HORA].Value = "";
                        lblResumen.Text = "Hora invalida: escribala como 07:15 o 1915.";
                    }
                    else if (hora is not null)
                    {
                        fila.Cells[COL_HORA].Value = $"{hora.Value.Hours:00}:{hora.Value.Minutes:00}";
                        if (llego) fila.Cells[COL_TARDIA].Value = true;
                    }
                }
            }
            finally { _ajustando = false; }

            _hayCambios = true;
            _aviso = "";
            PintarFila(fila);
            ActualizarResumen();
        }

        /// <summary>Acepta 7:15, 07:15, 715 o 0715.</summary>
        private static TimeSpan? ParsearHora(string? texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return null;
            string t = texto.Trim();

            if (t.Contains(':') && TimeSpan.TryParse(t, out var ts) &&
                ts >= TimeSpan.Zero && ts < TimeSpan.FromDays(1))
                return new TimeSpan(ts.Hours, ts.Minutes, 0);

            string d = new(t.Where(char.IsDigit).ToArray());
            if (d.Length == 3) d = "0" + d;

            if (d.Length == 4 &&
                int.TryParse(d[..2], out int h) && int.TryParse(d[2..], out int m) &&
                h < 24 && m < 60)
                return new TimeSpan(h, m, 0);

            return null;
        }

        private static void PintarFila(DataGridViewRow fila)
        {
            bool llego = fila.Cells[COL_LLEGO].Value is bool b && b;
            bool tardia = fila.Cells[COL_TARDIA].Value is bool t && t;

            if (EsIncapacitado(fila))
            {
                fila.DefaultCellStyle.BackColor = Estilo.LilaFondo;
                fila.DefaultCellStyle.ForeColor = Estilo.LilaTexto;
            }
            else if (!llego)
            {
                fila.DefaultCellStyle.BackColor = Estilo.RojoFondo;
                fila.DefaultCellStyle.ForeColor = Estilo.RojoTexto;
            }
            else if (tardia)
            {
                fila.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                fila.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
            }
            else
            {
                fila.DefaultCellStyle.BackColor = Estilo.Superficie;
                fila.DefaultCellStyle.ForeColor = Estilo.Texto;
            }
        }

        // =============================================================
        // CARGAR TURNO
        // =============================================================
        private void btnCargar_Click(object sender, EventArgs e)
        {
            if (cbxTurno.SelectedIndex < 0)
            {
                lblResumen.Text = "Escoja primero un turno en la lista de arriba.";
                return;
            }

            if (_hayCambios && !ConfirmarDescartar()) return;

            CargarTurno();
        }

        /// <summary>
        /// Se escogio otro turno en la lista: la asistencia de ese
        /// horario se carga sola, sin tener que presionar Cargar.
        ///
        /// Lo unico que se pregunta es si hay marcas sin guardar, porque
        /// ahi si se perderia trabajo. Si el usuario no quiere perderlas,
        /// el desplegable se devuelve al turno que estaba cargado.
        /// </summary>
        private void CargarTurnoAutomatico()
        {
            if (!_listo || cbxTurno.SelectedIndex < 0) return;

            if (_hayCambios && !ConfirmarDescartar())
            {
                _listo = false;
                try { cbxTurno.SelectedItem = _turnoCargado; }
                finally { _listo = true; }
                return;
            }

            CargarTurno();
        }

        private void CargarTurno()
        {
            _fecha = dtpFecha.Value.Date;
            string turno = cbxTurno.SelectedItem!.ToString()!;

            try
            {
                Cursor = Cursors.WaitCursor;
                _ajustando = true;

                var lineas = _repo.ListarOficialesDelTurno(_fecha, turno);
                dtgAsistencia.Rows.Clear();

                // Antes de meter las filas hay que asegurarse de que todo
                // puesto guardado exista en el desplegable, aunque ya se
                // haya retirado del cuadro actual.
                if (dtgAsistencia.Columns[COL_PUESTO] is DataGridViewComboBoxColumn col)
                    col.DataSource = Puesto.ParaGrilla(
                        _puestos, "(sin asignar)", lineas.Select(l => l.IdPuesto));

                foreach (var l in lineas)
                {
                    int i = dtgAsistencia.Rows.Add();
                    var fila = dtgAsistencia.Rows[i];
                    fila.Tag = l.Incapacitado;

                    fila.Cells[COL_ID].Value = l.IdOficial;
                    fila.Cells[COL_NOMBRE].Value = l.Nombre;
                    fila.Cells[COL_CEDULA].Value = l.Cedula;
                    fila.Cells[COL_SIT].Value = l.Incapacitado
                        ? $"INCAPACIDAD hasta {l.FinIncapacidad:dd/MM}"
                        : "";
                    fila.Cells[COL_LLEGO].Value = l.Llego;
                    fila.Cells[COL_TARDIA].Value = l.Tardia;
                    fila.Cells[COL_HORA].Value = l.HoraLlegada is null
                        ? ""
                        : $"{l.HoraLlegada.Value.Hours:00}:{l.HoraLlegada.Value.Minutes:00}";
                    fila.Cells[COL_PUESTO].Value = l.IdPuesto ?? 0;
                    fila.Cells[COL_TIPO].Value = TipoJornada.Limpiar(l.Tipo);

                    PintarFila(fila);
                }

                _ajustando = false;
                _turnoCargado = turno;
                _hayCambios = false;

                bool cerrado = _repo.TurnosCerrados(_fecha).Contains(turno);
                lblEstadoTurno.Text = cerrado ? "TURNO YA CERRADO" : "Turno sin cerrar";
                lblEstadoTurno.ForeColor = cerrado ? Estilo.VerdeTexto : Estilo.Ambar;

                int incap = lineas.Count(l => l.Incapacitado);

                // Antes cada carga abria una ventana. Ahora que el turno
                // se carga solo al cambiar la lista, el aviso va escrito
                // en la barra de abajo.
                _aviso =
                    lineas.Count == 0
                        ? "   |   nadie tiene ese horario ese dia"
                    : incap > 0
                        ? $"   |   {incap} con incapacidad: no se marcan presentes, " +
                          "asigneles sustituto"
                    : cerrado
                        ? "   |   turno ya cerrado: si guarda, lo reemplaza"
                        : "";

                // La columna Tipo no sirve de nada si la base no la
                // tiene, y eso hay que decirlo donde se ve la columna.
                if (!_repo.HayTipo)
                    _aviso += "   |   para marcar Rol/Vacante/Extra corra " +
                              "PlanillaVanguard_ROL_VACANTE_EXTRA.sql una sola vez";

                // El filtro que estuviera puesto se vuelve a aplicar
                // sobre la lista recien cargada, y de paso refresca el
                // resumen. Sin esto, al cambiar de turno la caja seguiria
                // con texto pero se verian todas las filas.
                FiltrarLista();
            }
            catch (Exception ex)
            {
                MostrarError("No se pudo cargar la lista del turno.", ex);
            }
            finally
            {
                _ajustando = false;
                Cursor = Cursors.Default;
            }
        }

        private void btnMarcarTodos_Click(object sender, EventArgs e)
        {
            if (dtgAsistencia.Rows.Count == 0) return;

            // Solo lo que esta a la vista: con un filtro puesto, "todos"
            // es lo que se ve. Sin filtro no hay diferencia, porque
            // entonces se ven todas.
            var editables = dtgAsistencia.Rows.Cast<DataGridViewRow>()
                                              .Where(f => f.Visible && !EsIncapacitado(f))
                                              .ToList();
            if (editables.Count == 0) return;

            bool todosMarcados = editables.All(f => f.Cells[COL_LLEGO].Value is bool b && b);

            _ajustando = true;
            foreach (var fila in editables)
            {
                fila.Cells[COL_LLEGO].Value = !todosMarcados;
                if (todosMarcados)
                {
                    fila.Cells[COL_TARDIA].Value = false;
                    fila.Cells[COL_HORA].Value = "";
                }
                PintarFila(fila);
            }
            _ajustando = false;

            _hayCambios = true;
            _aviso = "";
            ActualizarResumen();
        }

        private void btnProyeccion_Click(object sender, EventArgs e) =>
            Estilo.MostrarHijo(this, new Proyeccion(dtpFecha.Value), RecargarTrasVolver);

        /// <summary>
        /// Se vuelve de otra pantalla. Los puestos y lo registrado del
        /// dia pudieron cambiar alla, asi que se relee todo.
        ///
        /// Si hay cambios sin guardar en la grilla no se toca nada:
        /// borrarle al usuario lo que acaba de marcar seria peor que
        /// dejarle la pantalla un poco vieja.
        /// </summary>
        private void RecargarTrasVolver()
        {
            MostrarEstadoDelDia();

            if (_hayCambios) return;

            try { _puestos = _repo.ListarPuestos(); }
            catch { }

            if (!string.IsNullOrEmpty(_turnoCargado) && cbxTurno.SelectedIndex >= 0)
                btnCargar_Click(this, EventArgs.Empty);
        }

        // =============================================================
        // GUARDAR
        // =============================================================
        private void btnGuardarTurno_Click(object sender, EventArgs e) => GuardarTurno(true);

        private bool GuardarTurno(bool avisar)
        {
            if (string.IsNullOrEmpty(_turnoCargado) || dtgAsistencia.Rows.Count == 0)
            {
                lblResumen.Text = "No hay nada que guardar: escoja primero un turno.";
                return false;
            }

            var lineas = LeerGrilla();

            var sinHora = lineas.Where(l => l.Tardia && l.HoraLlegada is null).ToList();
            if (sinHora.Count > 0)
            {
                MessageBox.Show(
                    $"Hay {sinHora.Count} oficial(es) con tardia pero sin hora de llegada.\n\n" +
                    "Primero sin hora: " + sinHora[0].Nombre,
                    "Falta la hora de llegada", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return false;
            }

            var sinPuesto = lineas.Where(l => l.Llego && l.IdPuesto is null).ToList();
            if (sinPuesto.Count > 0)
            {
                MessageBox.Show(
                    $"Hay {sinPuesto.Count} oficial(es) presentes sin puesto asignado.\n\n" +
                    "El reporte del dia necesita el puesto de cada uno.\n\n" +
                    "Primero sin puesto: " + sinPuesto[0].Nombre,
                    "Falta asignar puesto", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return false;
            }

            // Un puesto con dos oficiales y un turno entero ausente ya no
            // se preguntan: los dos casos pasan de verdad y quien esta
            // pasando lista sabe lo que marco. Quedan anotados abajo.
            var repetido = lineas.Where(l => l.Llego && l.IdPuesto is not null)
                                 .GroupBy(l => l.IdPuesto)
                                 .FirstOrDefault(g => g.Count() > 1);

            string avisoGuardado = "";
            if (repetido is not null)
            {
                string codigo = _puestos.FirstOrDefault(p => p.IdPuesto == repetido.Key)?.Codigo ?? "?";
                avisoGuardado += $"   |   OJO: el puesto {codigo} quedo con " +
                                 $"{repetido.Count()} oficiales";
            }

            var normales = lineas.Where(l => !l.Incapacitado).ToList();
            if (normales.Count > 0 && normales.All(l => !l.Llego))
                avisoGuardado += $"   |   OJO: los {normales.Count} oficiales del turno " +
                                 "quedaron ausentes";

            try
            {
                Cursor = Cursors.WaitCursor;
                _repo.CerrarTurno(_fecha, _turnoCargado, lineas);
                _hayCambios = false;

                lblEstadoTurno.Text = "TURNO YA CERRADO";
                lblEstadoTurno.ForeColor = Estilo.VerdeTexto;
                MostrarEstadoDelDia();

                // Sin ventana de "guardado": si presiono Guardar es
                // porque queria guardar. El resultado va en la barra.
                if (avisar)
                {
                    _aviso = $"   |   turno guardado y cerrado{avisoGuardado}";
                    ActualizarResumen();
                }
                return true;
            }
            catch (Exception ex)
            {
                MostrarError("No se pudo guardar el turno. No se registro ningun cambio.", ex);
                return false;
            }
            finally { Cursor = Cursors.Default; }
        }

        private List<LineaAsistencia> LeerGrilla()
        {
            var lista = new List<LineaAsistencia>();

            foreach (DataGridViewRow fila in dtgAsistencia.Rows)
            {
                bool incap = EsIncapacitado(fila);
                int idPuesto = fila.Cells[COL_PUESTO].Value is int p ? p : 0;
                bool llego = !incap && fila.Cells[COL_LLEGO].Value is bool b && b;
                bool tardia = llego && fila.Cells[COL_TARDIA].Value is bool t && t;

                lista.Add(new LineaAsistencia
                {
                    IdOficial = Convert.ToInt32(fila.Cells[COL_ID].Value),
                    Nombre = fila.Cells[COL_NOMBRE].Value?.ToString() ?? "",
                    Llego = llego,
                    Tardia = tardia,
                    HoraLlegada = tardia ? ParsearHora(fila.Cells[COL_HORA].Value?.ToString()) : null,
                    IdPuesto = idPuesto == 0 ? null : idPuesto,
                    Tipo = TipoJornada.Limpiar(fila.Cells[COL_TIPO].Value?.ToString()),
                    Incapacitado = incap
                });
            }
            return lista;
        }

        // =============================================================
        // SUSTITUCIONES
        // =============================================================
        private void btnPasarSustituciones_Click(object sender, EventArgs e)
        {
            if (_hayCambios && !GuardarTurno(false)) return;

            // Se pasa a sustituciones sin preguntar. Lo que falte del dia
            // queda dicho alla en la barra de abajo.
            Estilo.MostrarHijo(this, new SustitucionAusentes(_fecha), RecargarTrasVolver);
        }

        // =============================================================
        // EXCEL DEL DIA
        // =============================================================
        /// <summary>
        /// El reporte del dia, pedido desde aqui mismo.
        ///
        /// Es exactamente el mismo Excel que sale en la pantalla de
        /// sustituciones; lo que cambia es que ya no hay que pasar por
        /// alla nada mas para pedirlo. Los turnos que falten por cerrar
        /// no lo detienen: se dice cuales faltan en la barra de abajo y
        /// el archivo sale con lo que hay.
        ///
        /// Si quedaron marcas sin guardar se guardan primero: el reporte
        /// se arma de lo que esta en la base, no de lo que se ve en la
        /// grilla, y sacarlo sin guardar dejaria por fuera lo que se
        /// acaba de marcar.
        /// </summary>
        private void btnExcelDia_Click(object sender, EventArgs e)
        {
            if (_hayCambios && !GuardarTurno(false)) return;

            ReporteDelDia.Generar(this, _fecha, _repo,
                                  texto => lblResumen.Text = texto,
                                  MostrarEstadoDelDia);
        }

        // =============================================================
        // RESUMEN
        // =============================================================
        private void ActualizarResumen()
        {
            var filas = dtgAsistencia.Rows.Cast<DataGridViewRow>().ToList();

            int total = filas.Count;
            int incap = filas.Count(EsIncapacitado);
            int ausentes = filas.Count(f => !EsIncapacitado(f) &&
                                            f.Cells[COL_LLEGO].Value is bool b && !b);
            int tardias = filas.Count(f => f.Cells[COL_TARDIA].Value is bool t && t);

            // Los que no entraron por su rol solo se cuentan cuando los
            // hay. En un dia parejo nadie va de extra ni a una vacante, y
            // dos contadores en cero solo alargarian la linea.
            int vacantes = filas.Count(f => EsTipo(f, TipoJornada.Vacante));
            int extras = filas.Count(f => EsTipo(f, TipoJornada.Extra));

            string fuera =
                (vacantes > 0 ? $"   |   Vacantes: {vacantes}" : "") +
                (extras > 0 ? $"   |   Extras: {extras}" : "");

            lblResumen.Text =
                $"Turno {_turnoCargado}   |   {total} oficial(es)   |   " +
                $"Presentes: {total - ausentes - incap}   |   Tardias: {tardias}   |   " +
                $"Ausentes: {ausentes}   |   Incapacidad: {incap}" + fuera +
                (_hayCambios ? "   |   CAMBIOS SIN GUARDAR" : "") + _aviso + _avisoFiltro;
        }

        private void MostrarEstadoDelDia()
        {
            try
            {
                int cerrados = _repo.TurnosCerrados(_fecha).Count;
                Text = $"Lista de Asistencia  -  {_fecha:dd/MM/yyyy}  -  " +
                       $"{cerrados} de {AsistenciaRepositorio.TotalTurnos} turnos cerrados";
            }
            catch { }
        }

        private bool ConfirmarDescartar() =>
            MessageBox.Show(
                "Hay cambios sin guardar en el turno actual.\n\nDesea descartarlos?",
                "Cambios sin guardar",
                MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes;

        private void btnMenuPrincipal_Click(object sender, EventArgs e)
        {
            if (_hayCambios && !ConfirmarDescartar()) return;
            _hayCambios = false;
            Estilo.VolverAlMenu(this);
        }

        private static void MostrarError(string contexto, Exception ex) =>
            MessageBox.Show($"{contexto}\n\nDetalle tecnico:\n{ex.Message}",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
