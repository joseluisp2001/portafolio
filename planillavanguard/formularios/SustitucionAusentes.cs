using System.Globalization;
using GestorDatos;

namespace formularios
{
    public partial class SustitucionAusentes : Form
    {
        private readonly AsistenciaRepositorio _repo = new();
        private readonly ProyeccionRepositorio _repoProy = new();

        /// <summary>Fecha de trabajo. La manda quien abre el formulario.</summary>
        private readonly DateTime _fecha;

        private List<Puesto> _puestos = new();
        private List<LineaAsistencia> _ausentes = new();
        private List<OficialDisponible> _disponibles = new();

        /// <summary>Los disponibles que quedaron despues del filtro. Es lo que se ve.</summary>
        private List<OficialDisponible> _mostrados = new();

        private List<Sustitucion> _asignadas = new();

        private bool _cargando;

        // Buscador de la lista de disponibles. Se arma por codigo porque
        // el Designer solo conoce la grilla.
        private readonly Panel pnlBuscaDisp = new();
        private readonly TextBox txtBuscaDisp = new();
        private readonly Button btnBuscaDisp = new();
        private readonly Button btnVerTodoDisp = new();

        private const string COL_ID = "IdOficial";
        private const string COL_TURNO = "Turno";
        private const string COL_MOTIVO = "Motivo";
        private const string COL_OFICIAL = "Oficial";
        private const string COL_CEDULA = "Cedula";
        private const string COL_PUESTO = "Puesto";

        public SustitucionAusentes(DateTime? fecha = null)
        {
            _fecha = (fecha ?? DateTime.Today).Date;
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
            Estilo.SobreBanda(btnVolver);
            Estilo.AnclarDerecha(pnlBanda, btnVolver);

            AgregarVolverAtras();

            ArmarBuscadorDisponibles();

            tlpGrillas.BackColor = Estilo.Fondo;
            pnlInferior.BackColor = Estilo.Superficie;

            foreach (var g in new[] { grpAusentes, grpDisponibles, grpAsignados })
            {
                g.Font = Estilo.GrillaEncabezado;
                g.ForeColor = Estilo.Azul;
                g.BackColor = Estilo.Fondo;
            }

            Estilo.Primario(btnAsignar);
            Estilo.Secundario(btnQuitar);
            Estilo.Secundario(btnVerificar);
            Estilo.Secundario(btnExcelSustituciones);
            Estilo.Primario(btnGenerarReporte);

            lblResumen.Font = Estilo.Subtitulo;
            lblResumen.ForeColor = Estilo.TextoSuave;
            lblResumen.TextAlign = ContentAlignment.MiddleLeft;

            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };
        }

        /// <summary>
        /// Segunda salida, al lado de la del menu: devuelve un solo paso.
        ///
        /// Solo aparece cuando se entro desde otra pantalla. Abierta
        /// derecho desde el menu, "atras" y "al menu" harian lo mismo y
        /// el segundo boton solo estorbaria.
        /// </summary>
        private void AgregarVolverAtras()
        {
            Shown += (_, _) =>
            {
                if (Owner is null or MenuPrincipal) return;

                var b = new Button { Text = "Volver atras", Size = new Size(160, 40) };
                Estilo.SobreBanda(b);
                b.Click += (_, _) => Close();

                pnlBanda.Controls.Add(b);
                b.BringToFront();
                Estilo.AnclarDerecha(pnlBanda, b, btnVolver.Width + 12);
            };
        }

        /// <summary>
        /// Caja de busqueda encima de la lista de disponibles. Con la
        /// planilla completa la lista es larga, y buscar por nombre es
        /// mas rapido que ir bajando.
        /// </summary>
        private void ArmarBuscadorDisponibles()
        {
            pnlBuscaDisp.Dock = DockStyle.Top;
            pnlBuscaDisp.Height = 40;
            pnlBuscaDisp.BackColor = Estilo.Fondo;

            Estilo.CampoTexto(txtBuscaDisp);
            txtBuscaDisp.SetBounds(2, 5, 240, 27);
            txtBuscaDisp.PlaceholderText = "Buscar oficial o cedula";

            // Las sugerencias salen de los que estan cargados en ese
            // momento, o sea de los que de verdad pueden cubrir ese
            // puesto: la lista nunca propone a alguien que despues no
            // aparece. El Enter lo maneja Autocompletar.
            Estilo.Autocompletar(
                txtBuscaDisp,
                () => _disponibles.SelectMany(d => new[] { d.Nombre, d.Cedula, d.Horario }),
                MostrarDisponibles);

            Estilo.Primario(btnBuscaDisp);
            btnBuscaDisp.Text = "Buscar";
            btnBuscaDisp.SetBounds(250, 3, 110, 31);
            btnBuscaDisp.Click += (_, _) => MostrarDisponibles();

            Estilo.Secundario(btnVerTodoDisp);
            btnVerTodoDisp.Text = "Ver todo";
            btnVerTodoDisp.SetBounds(368, 3, 110, 31);
            btnVerTodoDisp.Click += (_, _) =>
            { txtBuscaDisp.Clear(); MostrarDisponibles(); };

            pnlBuscaDisp.Controls.AddRange(new Control[]
            { btnVerTodoDisp, btnBuscaDisp, txtBuscaDisp });

            grpDisponibles.Controls.Add(pnlBuscaDisp);

            // La grilla se acomoda de ultima: asi el buscador se queda
            // con su franja arriba y la grilla ocupa lo que sobra.
            dtgUsuariosaAsignar.BringToFront();
        }

        // =============================================================
        private void SustitucionAusentes_Load(object? sender, EventArgs e)
        {
            var cultura = CultureInfo.GetCultureInfo("es-CR");
            lblFecha.Text = _fecha.ToString("dddd d 'de' MMMM 'de' yyyy", cultura).ToUpper(cultura);
            Text = $"Sustitucion de Ausentes  -  {_fecha:dd/MM/yyyy}";

            try
            {
                _puestos = _repo.ListarPuestos();
                ConfigurarGrillas();
                CargarTodo();
            }
            catch (Exception ex) { MostrarError("No se pudo abrir el formulario.", ex); }
        }

        private void ConfigurarGrillas()
        {
            var g = dtgOficialesAusentes;
            Estilo.Grid(g);
            Estilo.SeleccionVerde(g);
            g.AutoGenerateColumns = false;
            g.Columns.Clear();

            g.Columns.Add(new DataGridViewTextBoxColumn
            { Name = COL_ID, HeaderText = "Id", Visible = false });
            g.Columns.Add(new DataGridViewTextBoxColumn
            { Name = COL_TURNO, HeaderText = "Turno", Width = 110, ReadOnly = true });
            g.Columns.Add(new DataGridViewTextBoxColumn
            { Name = COL_MOTIVO, HeaderText = "Motivo", Width = 100, ReadOnly = true });
            g.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = COL_OFICIAL, HeaderText = "Oficial", ReadOnly = true,
                AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill, FillWeight = 170
            });
            g.Columns.Add(new DataGridViewTextBoxColumn
            { Name = COL_CEDULA, HeaderText = "Cedula", Width = 115, ReadOnly = true });

            var colPuesto = new DataGridViewComboBoxColumn
            {
                Name = COL_PUESTO,
                HeaderText = "Puesto a cubrir",
                DisplayMember = nameof(Puesto.Descripcion),
                ValueMember = nameof(Puesto.IdPuesto),
                AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill,
                FillWeight = 190,
                FlatStyle = FlatStyle.Flat
            };

            // 0 es "(sin puesto)": una celda a medio llenar no puede
            // tumbar el dibujado de la grilla.
            colPuesto.DefaultCellStyle.NullValue = 0;
            colPuesto.DataSource = Puesto.ParaGrilla(_puestos, "(sin puesto)");
            g.Columns.Add(colPuesto);

            Estilo.SinOrdenamiento(g);

            g.CurrentCellDirtyStateChanged += (_, _) =>
            {
                if (g.IsCurrentCellDirty) g.CommitEdit(DataGridViewDataErrorContexts.Commit);
            };
            g.SelectionChanged += AusenteSeleccionado;

            Estilo.GridSoloLectura(dtgUsuariosaAsignar);
            Estilo.GridSoloLectura(dtgOficialesAsignados);
            Estilo.SeleccionVerde(dtgUsuariosaAsignar);
            Estilo.SeleccionVerde(dtgOficialesAsignados);
            dtgUsuariosaAsignar.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dtgOficialesAsignados.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;

            dtgUsuariosaAsignar.CellDoubleClick += (_, e) =>
            { if (e.RowIndex >= 0) btnAsignar_Click(this, EventArgs.Empty); };

            dtgOficialesAsignados.CellDoubleClick += (_, e) =>
            { if (e.RowIndex >= 0) btnQuitar_Click(this, EventArgs.Empty); };
        }

        private void CargarTodo()
        {
            CargarAusentes();
            CargarAsignadas();
            ActualizarResumen();
        }

        private void CargarAusentes()
        {
            _ausentes = _repo.ListarAusentes(_fecha);

            var cubiertos = _repo.ListarSustituciones(_fecha)
                                 .Select(s => s.IdOficialAusente).ToHashSet();
            var pendientes = _ausentes.Where(a => !cubiertos.Contains(a.IdOficial)).ToList();

            _cargando = true;
            dtgOficialesAusentes.Rows.Clear();

            // Los registros del dia pueden traer puestos que ya se
            // retiraron del cuadro: hay que dejarlos en el desplegable.
            if (dtgOficialesAusentes.Columns[COL_PUESTO] is DataGridViewComboBoxColumn col)
                col.DataSource = Puesto.ParaGrilla(
                    _puestos, "(sin puesto)", pendientes.Select(a => a.IdPuesto));

            foreach (var a in pendientes)
            {
                int i = dtgOficialesAusentes.Rows.Add();
                var fila = dtgOficialesAusentes.Rows[i];
                fila.Cells[COL_ID].Value = a.IdOficial;
                fila.Cells[COL_TURNO].Value = a.Turno;
                fila.Cells[COL_MOTIVO].Value = a.Motivo;
                fila.Cells[COL_OFICIAL].Value = a.Nombre;
                fila.Cells[COL_CEDULA].Value = a.Cedula;
                fila.Cells[COL_PUESTO].Value = a.IdPuesto ?? 0;

                if (a.Incapacitado)
                {
                    fila.DefaultCellStyle.BackColor = Estilo.LilaFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.LilaTexto;
                }
            }
            _cargando = false;

            grpAusentes.Text = $"1. Puestos sin cubrir  ({pendientes.Count})";

            // Se fuerza la seleccion: el evento ocurre cuando las celdas
            // todavia estan vacias, por eso hay que dispararlo a mano.
            if (dtgOficialesAusentes.Rows.Count > 0)
            {
                dtgOficialesAusentes.ClearSelection();
                dtgOficialesAusentes.CurrentCell = dtgOficialesAusentes.Rows[0].Cells[COL_OFICIAL];
                dtgOficialesAusentes.Rows[0].Selected = true;
                AusenteSeleccionado(null, EventArgs.Empty);
            }
            else VaciarDisponibles("2. Oficiales disponibles para cubrir  -  " +
                                   "no hay nadie pendiente de cubrir");
        }

        /// <summary>
        /// Deja la lista de disponibles vacia pero con sus encabezados
        /// puestos, y dice por que esta vacia. Un recuadro gris sin
        /// titulos no distingue "no hay nadie" de "se rompio algo".
        /// </summary>
        private void VaciarDisponibles(string titulo)
        {
            _disponibles = new();
            _mostrados = new();

            dtgUsuariosaAsignar.DataSource = AFilas(_disponibles);
            OcultarColumna(dtgUsuariosaAsignar, "IdOficial");
            Estilo.SinOrdenamiento(dtgUsuariosaAsignar);

            grpDisponibles.Text = titulo;
        }

        private void AusenteSeleccionado(object? sender, EventArgs e)
        {
            if (_cargando) return;

            var ausente = AusenteElegido();
            if (ausente is null)
            {
                VaciarDisponibles("2. Oficiales disponibles para cubrir  -  " +
                                  "escoja primero un puesto de la lista de la izquierda");
                return;
            }

            try
            {
                // Se cargan todos, sin importar el turno, mas los
                // autorizados externos. Los incapacitados no aparecen.
                // El que ya esta cubriendo otro puesto tambien sale:
                // los extras son parte del dia a dia.
                _disponibles = _repo.ListarDisponibles(_fecha, ausente.Turno);
                MostrarDisponibles();
            }
            catch (Exception ex)
            {
                MostrarError("No se pudieron cargar los oficiales disponibles.", ex);
            }
        }

        /// <summary>
        /// La forma de una fila de la lista de disponibles.
        ///
        /// Antes eran objetos anonimos y, cuando no habia nadie que
        /// mostrar, se le pasaba null a la grilla: la grilla se quedaba
        /// sin columnas y en pantalla salia un recuadro gris vacio, sin
        /// encabezados, que parecia una pantalla rota. Con un tipo con
        /// nombre se le puede pasar una lista vacia y los titulos se
        /// quedan puestos.
        /// </summary>
        private sealed record FilaDisponible(int IdOficial, string Oficial, string Cedula,
                                             string Rol, string Situacion);

        private static List<FilaDisponible> AFilas(IEnumerable<OficialDisponible> datos) =>
            datos.Select(d => new FilaDisponible(
                     d.IdOficial, d.Nombre, d.Cedula, d.Horario, d.Situacion))
                 .ToList();

        /// <summary>Vuelca a la grilla los disponibles que pasen el filtro.</summary>
        private void MostrarDisponibles()
        {
            var ausente = AusenteElegido();

            _mostrados = _disponibles
                .Where(d => Estilo.Coincide(txtBuscaDisp.Text,
                                            d.Nombre, d.Cedula, d.Horario, d.Situacion))
                .ToList();

            dtgUsuariosaAsignar.DataSource = AFilas(_mostrados);

            OcultarColumna(dtgUsuariosaAsignar, "IdOficial");
            Estilo.SinOrdenamiento(dtgUsuariosaAsignar);
            Pintar(dtgUsuariosaAsignar, _mostrados);

            int externos = _mostrados.Count(d => d.EsExterno);
            int extras = _mostrados.Count(d => d.YaCubre);

            grpDisponibles.Text = ausente is null
                ? "2. Oficiales disponibles para cubrir"
                : $"2. Disponibles para cubrir a {ausente.Nombre}  " +
                  $"(turno {ausente.Turno})  -  {_mostrados.Count} de {_disponibles.Count}, " +
                  $"{externos} externo(s), {extras} en extra";
        }

        /// <summary>
        /// Ambar el que ya esta cubriendo otro puesto (va a hacer un
        /// extra) y azul el que viene de afuera.
        /// </summary>
        private static void Pintar(DataGridView g, List<OficialDisponible> datos)
        {
            foreach (DataGridViewRow f in g.Rows)
            {
                var d = datos.ElementAtOrDefault(f.Index);
                if (d is null) continue;

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
        }

        /// <summary>Marca en la grilla a los que vienen de afuera.</summary>
        private static void PintarExternos(DataGridView g)
        {
            if (!g.Columns.Contains("Rol")) return;

            foreach (DataGridViewRow f in g.Rows)
            {
                if (Roles.EsExterno(f.Cells["Rol"].Value?.ToString()))
                {
                    f.DefaultCellStyle.BackColor = Estilo.LilaFondo;
                    f.DefaultCellStyle.ForeColor = Estilo.LilaTexto;
                }
            }
        }

        private void CargarAsignadas()
        {
            _asignadas = _repo.ListarSustituciones(_fecha);

            dtgOficialesAsignados.DataSource = _asignadas.Select(s => new
            {
                s.IdSustitucion, s.Turno, Puesto = s.Puesto,
                Ausente = s.NombreAusente, Cubre = s.NombreSustituto,
                Rol = s.TurnoSustituto
            }).ToList();

            OcultarColumna(dtgOficialesAsignados, "IdSustitucion");
            Estilo.SinOrdenamiento(dtgOficialesAsignados);
            PintarExternos(dtgOficialesAsignados);

            grpAsignados.Text = $"3. Sustituciones asignadas  ({_asignadas.Count})";
        }

        // =============================================================
        private void btnAsignar_Click(object sender, EventArgs e)
        {
            var ausente = AusenteElegido();
            var sustituto = SustitutoElegido();

            if (ausente is null) { Avisar("Seleccione el puesto sin cubrir, arriba a la izquierda."); return; }
            if (sustituto is null) { Avisar("Seleccione quien va a cubrir, en la lista de la derecha."); return; }
            if (ausente.IdOficial == sustituto.IdOficial) { Avisar("Un oficial no puede cubrirse a si mismo."); return; }

            // Sin puesto tambien se asigna: en el reporte sale en blanco y
            // se puede corregir despues. Solo queda dicho abajo.
            int idPuesto = PuestoElegido();

            try
            {
                Cursor = Cursors.WaitCursor;
                _repo.AsignarSustituto(_fecha, ausente.Turno, ausente.IdOficial,
                                       sustituto.IdOficial, idPuesto == 0 ? null : idPuesto);

                string msg = $"{sustituto.Nombre} quedo cubriendo a {ausente.Nombre}." +
                             (idPuesto == 0 ? "   |   OJO: quedo sin puesto asignado." : "");
                CargarTodo();
                lblResumen.Text = msg;
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number is 2601 or 2627)
            {
                // Si la base todavia trae el indice unico viejo, no deja
                // que un oficial cubra dos puestos el mismo dia. Los
                // extras si se permiten: hay que correr el script.
                MessageBox.Show(
                    "La base no acepto la asignacion porque ese oficial ya esta " +
                    "cubriendo otro puesto ese dia.\n\n" +
                    "Si es un extra y quiere permitirlo, corra una sola vez el " +
                    "archivo PlanillaVanguard_PUESTOS.sql.",
                    "Falta actualizar la base", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                CargarTodo();
            }
            catch (Exception ex) { MostrarError("No se pudo guardar la sustitucion.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        private void btnQuitar_Click(object sender, EventArgs e)
        {
            if (dtgOficialesAsignados.CurrentRow is null ||
                !dtgOficialesAsignados.Columns.Contains("IdSustitucion"))
            { Avisar("Seleccione abajo la sustitucion que quiere quitar."); return; }

            var valor = dtgOficialesAsignados.CurrentRow.Cells["IdSustitucion"].Value;
            if (valor is null) return;

            int id = Convert.ToInt32(valor);
            var s = _asignadas.FirstOrDefault(x => x.IdSustitucion == id);
            if (s is null) return;

            // No se pregunta: si presiono Quitar es porque la quiere
            // quitar, y volver a asignarla es un doble clic.
            try
            {
                _repo.QuitarSustitucion(id);
                CargarTodo();
                lblResumen.Text = $"Se quito la sustitucion de {s.NombreSustituto}.";
            }
            catch (Exception ex) { MostrarError("No se pudo quitar la sustitucion.", ex); }
        }

        private void btnVerificar_Click(object sender, EventArgs e)
        {
            try
            {
                // Al volver se recarga todo: en la verificacion se pudo
                // haber cerrado un turno o cambiado algo del dia.
                Estilo.MostrarHijo(this, new VerificarAsignaciones(_fecha), CargarTodo);
            }
            catch (Exception ex) { MostrarError("No se pudo abrir la verificacion.", ex); }
        }

        // =============================================================
        // EXCEL DE SUSTITUCIONES
        // =============================================================
        /// <summary>
        /// Un solo archivo con las dos caras: lo que se hizo en la lista
        /// de asistencia y lo que se habia dejado planeado en la
        /// proyeccion, mas los puestos que quedaron descubiertos.
        /// </summary>
        private void btnExcelSustituciones_Click(object sender, EventArgs e)
        {
            List<Sustitucion> reales, proyectadas;
            List<LineaAsistencia> sinCubrir;

            try
            {
                reales = _repo.ListarSustituciones(_fecha);
                proyectadas = _repoProy.ListarCoberturas(_fecha);

                var cubiertos = reales.Select(s => s.IdOficialAusente).ToHashSet();
                sinCubrir = _repo.ListarAusentes(_fecha)
                                 .Where(a => !cubiertos.Contains(a.IdOficial))
                                 .ToList();
            }
            catch (Exception ex)
            {
                MostrarError("No se pudieron leer las sustituciones de esa fecha.", ex);
                return;
            }

            if (reales.Count == 0 && proyectadas.Count == 0 && sinCubrir.Count == 0)
            {
                MessageBox.Show(
                    "Esa fecha no tiene sustituciones, ni coberturas proyectadas, " +
                    "ni puestos sin cubrir.\n\nNo hay nada que exportar.",
                    "Sin datos", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar el Excel de sustituciones",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Sustituciones_Base105_{_fecha:yyyy-MM-dd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                Cursor = Cursors.WaitCursor;
                ReporteSustitucionesExcel.Generar(
                    dlg.FileName, _fecha, reales, proyectadas, sinCubrir);

                // Se abre solo: quien pidio el Excel lo quiere ver.
                lblResumen.Text =
                    $"Excel de sustituciones del {_fecha:dd/MM/yyyy}   |   " +
                    $"De la lista: {reales.Count}   |   Proyectadas: {proyectadas.Count}   |   " +
                    $"Sin cubrir: {sinCubrir.Count}";

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
            catch (Exception ex) { MostrarError("No se pudo generar el Excel.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        // =============================================================
        /// <summary>
        /// El Excel del dia. Es el mismo que ahora tambien se puede
        /// pedir desde la lista de asistencia, asi que el trabajo lo
        /// hace <see cref="ReporteDelDia"/> y aqui solo se dice con que
        /// fecha y donde poner los avisos.
        ///
        /// Los turnos que falten por cerrar ya no lo detienen: antes si,
        /// y el dia que un turno se quedaba sin pasar lista no habia
        /// forma de sacar el Excel de ese dia.
        /// </summary>
        private void btnGenerarReporte_Click(object sender, EventArgs e) =>
            ReporteDelDia.Generar(this, _fecha, _repo,
                                  texto => lblResumen.Text = texto,
                                  ActualizarResumen);

        // =============================================================
        private LineaAsistencia? AusenteElegido()
        {
            if (dtgOficialesAusentes.CurrentRow is null) return null;
            var v = dtgOficialesAusentes.CurrentRow.Cells[COL_ID].Value;
            if (v is null) return null;
            int id = Convert.ToInt32(v);
            return _ausentes.FirstOrDefault(a => a.IdOficial == id);
        }

        private int PuestoElegido()
        {
            if (dtgOficialesAusentes.CurrentRow is null) return 0;
            return dtgOficialesAusentes.CurrentRow.Cells[COL_PUESTO].Value is int p ? p : 0;
        }

        private OficialDisponible? SustitutoElegido()
        {
            if (dtgUsuariosaAsignar.CurrentRow is null) return null;
            if (!dtgUsuariosaAsignar.Columns.Contains("IdOficial")) return null;
            var v = dtgUsuariosaAsignar.CurrentRow.Cells["IdOficial"].Value;
            if (v is null) return null;
            int id = Convert.ToInt32(v);
            return _disponibles.FirstOrDefault(d => d.IdOficial == id);
        }

        private static void OcultarColumna(DataGridView g, string nombre)
        {
            if (g.Columns.Contains(nombre)) g.Columns[nombre]!.Visible = false;
        }

        private void ActualizarResumen()
        {
            try
            {
                var t = _repo.Totales(_fecha);
                var pendientes = _repo.TurnosPendientes(_fecha);
                int total = AsistenciaRepositorio.TotalTurnos;

                lblResumen.Text =
                    $"Turnos: {total - pendientes.Count}/{total}   |   " +
                    $"Oficiales: {t.Total}   |   " +
                    $"Tardias: {t.Tardias}   |   Ausentes: {t.Ausentes}   |   " +
                    $"Cubiertos: {t.Sustituciones}";

                // El boton nunca se apaga: el reporte se puede generar
                // aunque falten turnos. Cuando falta alguno se pone en
                // ambar, que es la senal de que el dia va incompleto,
                // pero se deja presionable.
                bool listo = pendientes.Count == 0;
                btnGenerarReporte.Enabled = true;
                btnGenerarReporte.BackColor = listo ? Estilo.Azul : Estilo.Ambar;
                btnGenerarReporte.ForeColor = Color.White;
            }
            catch { }
        }

        private void btnVolver_Click(object sender, EventArgs e) => Estilo.VolverAlMenu(this);

        /// <summary>
        /// Lo que falta se dice en la barra de abajo. Antes era una
        /// ventana por cada clic incompleto y estorbaba mas de lo que
        /// ayudaba.
        /// </summary>
        private void Avisar(string m) => lblResumen.Text = m;

        private static void MostrarError(string ctx, Exception ex) =>
            MessageBox.Show($"{ctx}\n\nDetalle tecnico:\n{ex.Message}",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
