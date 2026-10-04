using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Las plazas de la base: las que quedaron sin titular y las que
    /// estan ocupadas.
    ///
    /// Es donde se resuelve el ciclo completo: alguien sale y su plaza
    /// queda vacante, se dice quien la cubre mientras tanto, y cuando
    /// llega el reemplazo la plaza vuelve a estar ocupada.
    ///
    /// Las que estan SIN CUBRIR salen primero y en rojo: son las unicas
    /// sobre las que hay que hacer algo hoy.
    ///
    /// Es la misma pantalla que ya tiene el sistema administrativo,
    /// hecha para una sola base. No toca la asistencia, ni las
    /// sustituciones, ni la proyeccion: vive en su propia tabla.
    /// </summary>
    public class Vacantes : Form
    {
        private readonly VacantesRepositorio _repo = new();

        private readonly Panel pnlBanda = new();
        private readonly Label lblBanda = new();
        private readonly Label lblSub = new();
        private readonly Button btnMenu = new();

        private readonly Panel pnlBarra = new();
        private readonly Label lblFiltro = new();
        private readonly ComboBox cbxEstado = new();
        private readonly TextBox txtBuscar = new();
        private readonly Button btnBuscar = new();
        private readonly Button btnVerTodo = new();
        private readonly Button btnExcel = new();

        private readonly DataGridView dtg = new();

        /// <summary>
        /// Las plazas tal como vinieron de la base, sin el filtro de
        /// texto. El buscador trabaja sobre esta copia: borrar lo escrito
        /// devuelve la lista entera sin volver a consultar.
        /// </summary>
        private System.Data.DataTable? _plazas;

        private readonly Panel pnlInferior = new();
        private readonly Button btnNueva = new();
        private readonly Button btnSalio = new();
        private readonly Button btnCubre = new();
        private readonly Button btnQuitarCobertura = new();
        private readonly Button btnReemplazar = new();
        private readonly Button btnBloquear = new();
        private readonly Button btnQuitarPlaza = new();
        private readonly Label lblResumen = new();

        /// <summary>
        /// La base todavia no tiene la tabla de plazas. Con esto en
        /// true la pantalla se queda quieta y solo explica que falta
        /// correr el script: cada boton reventaria igual.
        /// </summary>
        private bool _sinTabla;

        private const string TODAS = "(todas)";

        public Vacantes()
        {
            Armar();
            AplicarEstilo();
            Load += (_, _) => Arrancar();
        }

        // =============================================================
        private void Armar()
        {
            Text = "Vacantes";
            ClientSize = new Size(1360, 713);
            MinimumSize = new Size(1040, 620);

            // ---------- Banda ----------
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 95;

            lblBanda.Text = "VACANTES";
            lblBanda.SetBounds(40, 22, 500, 32);

            lblSub.Text = "Plazas de la Base 105";
            lblSub.SetBounds(43, 56, 600, 20);

            btnMenu.Text = "Volver al Menu";
            btnMenu.Size = new Size(160, 40);
            btnMenu.Click += (_, _) => Estilo.VolverAlMenu(this);

            pnlBanda.Controls.AddRange(new Control[] { lblBanda, lblSub, btnMenu });

            // ---------- Barra de filtros ----------
            pnlBarra.Dock = DockStyle.Top;
            pnlBarra.Height = 56;

            lblFiltro.Text = "Ver";
            lblFiltro.SetBounds(20, 18, 34, 22);

            cbxEstado.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxEstado.SetBounds(56, 14, 200, 28);
            cbxEstado.Items.Add(TODAS);
            foreach (string e in EstadoPlaza.Todos) cbxEstado.Items.Add(e + "s");
            cbxEstado.SelectedIndex = 0;
            cbxEstado.SelectedIndexChanged += (_, _) => Cargar();

            txtBuscar.SetBounds(276, 14, 260, 28);
            txtBuscar.PlaceholderText = "Buscar rol, plaza o persona";

            // Las sugerencias salen de lo que hay en la lista en ese
            // momento. El Enter lo maneja Autocompletar: con la lista de
            // sugerencias abierta escoge, y con la lista cerrada busca.
            Estilo.Autocompletar(txtBuscar, SugerenciasDeLaLista, () => Mostrar());

            btnBuscar.Text = "Buscar";
            btnBuscar.SetBounds(544, 12, 110, 32);
            btnBuscar.Click += (_, _) => Mostrar();

            btnVerTodo.Text = "Ver todo";
            btnVerTodo.SetBounds(662, 12, 110, 32);
            btnVerTodo.Click += (_, _) =>
            {
                txtBuscar.Clear();

                // Si ya estaba en "(todas)", cambiar el desplegable no
                // dispara nada y hay que recargar a mano.
                if (cbxEstado.SelectedIndex == 0) Cargar();
                else cbxEstado.SelectedIndex = 0;
            };

            // El Excel va arriba, con el filtro: saca lo que se este
            // viendo, asi que se lee de corrido "esto es lo que hay,
            // y esto es lo que me llevo".
            btnExcel.Text = "Excel del cuadro";
            btnExcel.SetBounds(790, 12, 190, 32);
            btnExcel.Click += (_, _) =>
            {
                if (_sinTabla) { Avisar(FaltaElScript()); return; }
                GenerarExcel();
            };

            pnlBarra.Controls.AddRange(new Control[]
            { lblFiltro, cbxEstado, txtBuscar, btnBuscar, btnVerTodo, btnExcel });

            // ---------- Grilla ----------
            dtg.Dock = DockStyle.Fill;
            dtg.SelectionChanged += (_, _) => AcomodarBotones();

            // ---------- Botones ----------
            pnlInferior.Dock = DockStyle.Bottom;
            pnlInferior.Height = 108;

            // Los siete caben en una sola fila hasta en la pantalla mas
            // apretada de la clinica (1280 de ancho): pasado ese borde,
            // el ultimo boton se saldria y no habria como presionarlo.
            Boton(btnNueva, "Nueva plaza", 20, 150, Nueva);
            Boton(btnSalio, "Salio el titular", 180, 170, SalidaOMotivo);
            Boton(btnCubre, "Quien la cubre", 360, 170, AsignarCobertura);
            Boton(btnQuitarCobertura, "Quitar cobertura", 540, 175, QuitarCobertura);
            Boton(btnReemplazar, "Llego el reemplazo", 725, 190, Reemplazar);
            Boton(btnBloquear, "Bloquear plaza", 925, 180, BloquearODesbloquear);
            Boton(btnQuitarPlaza, "Quitar plaza", 1115, 140, QuitarPlaza);

            // El renglon de avisos va de ancho fijo, sin anclar a la
            // derecha: cuando se agrega, el panel todavia no tiene su
            // ancho de verdad, y el anclaje calcularia mal la distancia
            // al borde y lo dejaria creciendo fuera de la ventana. Es lo
            // mismo que ya pasaba con los botones de la banda.
            lblResumen.SetBounds(22, 74, 1230, 22);
            lblResumen.Text = "";

            pnlInferior.Controls.AddRange(new Control[]
            {
                lblResumen, btnNueva, btnSalio, btnCubre, btnQuitarCobertura,
                btnReemplazar, btnBloquear, btnQuitarPlaza
            });

            Controls.Add(dtg);
            Controls.Add(pnlInferior);
            Controls.Add(pnlBarra);
            Controls.Add(pnlBanda);

            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };
        }

        private void Boton(Button b, string texto, int x, int ancho, Action alHacerClic)
        {
            b.Text = texto;
            b.SetBounds(x, 20, ancho, 48);
            b.Click += (_, _) =>
            {
                if (_sinTabla) { Avisar(FaltaElScript()); return; }
                alHacerClic();
            };
        }

        private void AplicarEstilo()
        {
            Estilo.Formulario(this);
            Estilo.Banda(pnlBanda);

            int margen = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);
            lblBanda.Left = margen;
            lblSub.Left = margen + 3;

            lblBanda.Font = Estilo.Titulo;
            lblBanda.ForeColor = Color.White;
            lblBanda.BackColor = Color.Transparent;
            Estilo.SubtituloBanda(lblSub);
            lblSub.AutoSize = false;
            Estilo.SobreBanda(btnMenu);
            Estilo.AnclarDerecha(pnlBanda, btnMenu);

            pnlBarra.BackColor = Estilo.Superficie;
            pnlInferior.BackColor = Estilo.Superficie;

            lblFiltro.Font = Estilo.Subtitulo;
            lblFiltro.ForeColor = Estilo.TextoSuave;
            lblFiltro.TextAlign = ContentAlignment.MiddleLeft;

            Estilo.CampoTexto(cbxEstado);
            Estilo.CampoTexto(txtBuscar);
            Estilo.Primario(btnBuscar);
            Estilo.Secundario(btnVerTodo);
            Estilo.Secundario(btnExcel);

            Estilo.Primario(btnReemplazar);
            Estilo.Primario(btnCubre);
            Estilo.Secundario(btnNueva);
            Estilo.Secundario(btnSalio);
            Estilo.Secundario(btnQuitarCobertura);
            Estilo.Secundario(btnBloquear);
            Estilo.Secundario(btnQuitarPlaza);

            lblResumen.Font = Estilo.Subtitulo;
            lblResumen.ForeColor = Estilo.TextoSuave;
            lblResumen.TextAlign = ContentAlignment.MiddleLeft;

            Estilo.GridSoloLectura(dtg);
            Estilo.SeleccionVerde(dtg);
        }

        // =============================================================
        private void Arrancar()
        {
            if (!_repo.HayTablaDePlazas())
            {
                _sinTabla = true;
                Avisar(FaltaElScript());
                return;
            }

            Cargar();
        }

        private static string FaltaElScript() =>
            "La base todavia no tiene el cuadro de plazas. Corra una sola vez " +
            "el archivo PlanillaVanguard_VACANTES.sql y vuelva a entrar.";

        /// <summary>
        /// Lo que puede sugerir el buscador: los roles, los codigos de
        /// plaza y los nombres de las plazas cargadas.
        ///
        /// Sale de la copia completa y no de lo que quedo filtrado: si
        /// saliera de la grilla, cada letra iria dejando la lista de
        /// sugerencias mas corta que lo que de verdad se puede buscar.
        /// </summary>
        private IEnumerable<string?> SugerenciasDeLaLista() =>
            Buscador.Opciones(_plazas, "Rol", "Plaza", "Titular",
                              "La cubre", "Salio", "Motivo");

        /// <summary>El estado escogido en el filtro, o null si son todas.</summary>
        private string? EstadoFiltro()
        {
            string escogido = cbxEstado.SelectedItem?.ToString() ?? TODAS;
            if (escogido == TODAS) return null;

            // En la lista salen en plural ("Vacantes"); la base los
            // guarda en singular.
            return EstadoPlaza.Todos.FirstOrDefault(e => escogido.StartsWith(e));
        }

        /// <summary>Relee las plazas de la base y las muestra.</summary>
        private void Cargar()
        {
            if (_sinTabla) return;

            int idAntes = PlazaEscogida();

            try
            {
                Cursor = Cursors.WaitCursor;
                _plazas = _repo.Listar(EstadoFiltro());
                Mostrar(idAntes);
                ActualizarResumen();
            }
            catch (Exception ex) { MostrarError("No se pudieron cargar las plazas.", ex); }
            finally { Cursor = Cursors.Default; AcomodarBotones(); }
        }

        /// <summary>
        /// Vuelca a la grilla las plazas que pasen el filtro de texto.
        ///
        /// El filtro se hace aqui y no en la base: son las plazas de una
        /// sola base, caben de sobra en memoria, y asi buscar es
        /// inmediato y no se consulta otra vez por cada letra.
        /// </summary>
        private void Mostrar(int volverA = 0)
        {
            if (volverA == 0) volverA = PlazaEscogida();

            var visibles = Buscador.Filtrar(_plazas, txtBuscar.Text);

            dtg.DataSource = visibles;

            if (dtg.Columns.Contains("Id")) dtg.Columns["Id"]!.Visible = false;

            // Sin esto la fecha sale con la hora pegada, 0:00:00,
            // que no significa nada y solo ensancha la columna.
            if (dtg.Columns.Contains("Desde"))
                dtg.Columns["Desde"]!.DefaultCellStyle.Format = "dd/MM/yyyy";

            Estilo.SinOrdenamiento(dtg);
            Pintar();
            VolverALaFila(volverA);
            AcomodarBotones();
        }

        /// <summary>
        /// Deja escogida la misma plaza que estaba antes de recargar.
        /// Sin esto, despues de cada accion la seleccion se va a la
        /// primera fila y hay que volver a buscar la plaza para hacerle
        /// lo siguiente.
        /// </summary>
        private void VolverALaFila(int idPlaza)
        {
            if (idPlaza == 0 || dtg.Rows.Count == 0) return;

            foreach (DataGridViewRow f in dtg.Rows)
            {
                if (Convert.ToInt32(f.Cells["Id"].Value ?? 0) != idPlaza) continue;

                dtg.ClearSelection();
                dtg.CurrentCell = f.Cells["Rol"];
                f.Selected = true;
                return;
            }
        }

        /// <summary>
        /// Rojo la vacante que nadie esta cubriendo, ambar la que si,
        /// y gris la bloqueada, que no se va a llenar. La ocupada se
        /// queda como cualquier otra fila: no hay nada que hacerle.
        /// </summary>
        private void Pintar()
        {
            foreach (DataGridViewRow f in dtg.Rows)
            {
                string estado = f.Cells["Estado"].Value?.ToString() ?? "";
                string cobertura = f.Cells["Cobertura"].Value?.ToString() ?? "";

                if (estado == EstadoPlaza.Vacante && cobertura == "SIN CUBRIR")
                {
                    f.DefaultCellStyle.BackColor = Estilo.RojoFondo;
                    f.DefaultCellStyle.ForeColor = Estilo.RojoTexto;
                }
                else if (estado == EstadoPlaza.Vacante)
                {
                    f.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                    f.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
                }
                else if (estado == EstadoPlaza.Bloqueada)
                {
                    f.DefaultCellStyle.ForeColor = Estilo.TextoSuave;
                }
            }
        }

        private void ActualizarResumen()
        {
            try
            {
                var t = _repo.Totales();
                lblResumen.Text =
                    $"{t.Total} plaza(s)   |   Ocupadas: {t.Ocupadas}   |   " +
                    $"Vacantes: {t.Vacantes}   |   Sin cubrir: {t.SinCubrir}   |   " +
                    $"Bloqueadas: {t.Bloqueadas}";
            }
            catch { }
        }

        /// <summary>
        /// Dos botones cambian de nombre segun como este la plaza
        /// escogida. Un boton por cada caso, con la mitad siempre
        /// apagados, no le sirve a nadie.
        ///
        ///     ocupada   ->  "Salio el titular"    /  "Bloquear plaza"
        ///     vacante   ->  "Corregir el motivo"  /  "Bloquear plaza"
        ///     bloqueada ->  "Corregir el motivo"  /  "Desbloquear plaza"
        /// </summary>
        private void AcomodarBotones()
        {
            string estado = EstadoDeLaFila();

            btnBloquear.Text = estado == EstadoPlaza.Bloqueada
                ? "Desbloquear plaza" : "Bloquear plaza";

            btnSalio.Text = estado == EstadoPlaza.Ocupada
                ? "Salio el titular" : "Corregir el motivo";
        }

        // =============================================================
        // ACCIONES
        // =============================================================
        private void Nueva()
        {
            using var dlg = new NuevaPlaza();
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                _repo.Agregar(dlg.Rol, dlg.Codigo, dlg.Cuantas);
                Cargar();
                Avisar(dlg.Cuantas == 1
                    ? $"Plaza nueva de {dlg.Rol}. Queda vacante hasta que tenga titular."
                    : $"{dlg.Cuantas} plazas nuevas de {dlg.Rol}. Quedan vacantes.");
            }
            catch (Exception ex) { MostrarError("No se pudo agregar la plaza.", ex); }
        }

        /// <summary>
        /// El mismo boton hace las dos caras del mismo asunto, segun
        /// como este la plaza:
        ///
        ///     ocupada  ->  el titular salio: la plaza queda vacante
        ///     vacante  ->  ya esta vacante: se corrige el por que
        ///
        /// El segundo caso hace falta desde que la baja de un oficial
        /// libera su plaza sola. Ese camino la deja con motivo 'Otro',
        /// porque la pantalla de bajas no pregunta el motivo, y sin esto
        /// no habria como ponerle el de verdad.
        /// </summary>
        private void SalidaOMotivo()
        {
            if (EstadoDeLaFila() == EstadoPlaza.Ocupada) SalioTitular();
            else CorregirMotivo();
        }

        private void SalioTitular()
        {
            int id = PlazaEscogida();
            if (id == 0) { Avisar("Escoja primero una plaza de la lista."); return; }

            string titular = Celda("Titular");

            using var dlg = new SalidaDeTitular(titular, TextoPlaza());
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                _repo.SalioTitular(id, dlg.Motivo, dlg.Fecha, dlg.Observacion);
                Cargar();
                Avisar($"{titular} salio de esa plaza ({dlg.Motivo}). " +
                       "Queda VACANTE y sin cubrir.   |   " +
                       "Si ademas hay que darlo de baja, eso se hace en " +
                       "Editar o dar de baja personal.");
            }
            catch (Exception ex) { MostrarError("No se pudo liberar la plaza.", ex); }
        }

        /// <summary>
        /// Cambia el por que de una plaza que ya esta vacante: el
        /// motivo, desde cuando, y la nota.
        /// </summary>
        private void CorregirMotivo()
        {
            int id = PlazaEscogida();
            if (id == 0) { Avisar("Escoja primero una plaza de la lista."); return; }

            if (EstadoDeLaFila() != EstadoPlaza.Vacante)
            {
                Avisar("Esa plaza esta bloqueada: no cuenta como vacante, " +
                       "asi que no lleva motivo. Desbloqueela primero.");
                return;
            }

            string salio = Celda("Salio");

            using var dlg = new SalidaDeTitular(
                salio.Length == 0 ? "Plaza sin titular" : salio,
                TextoPlaza(),
                Celda("Motivo"), FechaDeLaFila(), Celda("Nota"));

            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                _repo.CorregirMotivo(id, dlg.Motivo, dlg.Fecha, dlg.Observacion);
                Cargar();
                Avisar($"Motivo corregido: {dlg.Motivo}, desde el " +
                       $"{dlg.Fecha:dd/MM/yyyy}.");
            }
            catch (Exception ex) { MostrarError("No se pudo corregir el motivo.", ex); }
        }

        private void AsignarCobertura()
        {
            int id = PlazaEscogida();
            if (id == 0) { Avisar("Escoja primero una plaza de la lista."); return; }

            if (EstadoDeLaFila() != EstadoPlaza.Vacante)
            {
                Avisar("Solo se cubre una plaza vacante.");
                return;
            }

            var quien = Escoger("Quien la cubre mientras tanto", id);
            if (quien is null) return;

            try
            {
                _repo.AsignarCobertura(id, quien.IdOficial);
                Cargar();
                Avisar($"{quien.Nombre} queda cubriendo esa plaza.");
            }
            catch (Exception ex) { MostrarError("No se pudo asignar la cobertura.", ex); }
        }

        private void QuitarCobertura()
        {
            int id = PlazaEscogida();
            if (id == 0) { Avisar("Escoja primero una plaza de la lista."); return; }

            try
            {
                _repo.QuitarCobertura(id);
                Cargar();
                Avisar("La plaza quedo sin cubrir.");
            }
            catch (Exception ex) { MostrarError("No se pudo quitar la cobertura.", ex); }
        }

        private void Reemplazar()
        {
            int id = PlazaEscogida();
            if (id == 0) { Avisar("Escoja primero una plaza de la lista."); return; }

            if (EstadoDeLaFila() != EstadoPlaza.Vacante)
            {
                Avisar("Esa plaza no esta vacante. Para cambiar de titular, " +
                       "diga primero que el que estaba salio.");
                return;
            }

            var quien = Escoger("Quien pasa a ser el titular", id);
            if (quien is null) return;

            try
            {
                // Si ya tenia plaza, esto es un traslado: la que deja se
                // convierte en otra vacante y hay que decirlo.
                string? dejo = _repo.Reemplazar(id, quien.IdOficial);

                Cargar();
                Avisar($"{quien.Nombre} quedo como titular. Plaza ocupada." +
                       (dejo is null ? ""
                                     : $"   |   OJO: era titular de {dejo}, " +
                                       "y esa plaza quedo VACANTE por traslado."));
            }
            catch (Exception ex) { MostrarError("No se pudo poner el titular.", ex); }
        }

        private void BloquearODesbloquear()
        {
            int id = PlazaEscogida();
            if (id == 0) { Avisar("Escoja primero una plaza de la lista."); return; }

            string estado = EstadoDeLaFila();

            if (estado == EstadoPlaza.Ocupada)
            {
                Avisar("Una plaza ocupada no se bloquea. Diga primero que " +
                       "su titular salio.");
                return;
            }

            bool bloquear = estado != EstadoPlaza.Bloqueada;

            try
            {
                _repo.Bloquear(id, bloquear);
                Cargar();
                Avisar(bloquear
                    ? "Plaza bloqueada: existe en el papel pero deja de contar " +
                      "como vacante por resolver."
                    : "Plaza desbloqueada: vuelve a contar como vacante.");
            }
            catch (Exception ex) { MostrarError("No se pudo cambiar la plaza.", ex); }
        }

        private void QuitarPlaza()
        {
            int id = PlazaEscogida();
            if (id == 0) { Avisar("Escoja primero una plaza de la lista."); return; }

            string texto = TextoPlaza();

            try
            {
                // No se pregunta: una plaza ocupada no se deja quitar, y
                // volver a agregarla es un boton.
                bool quitada = _repo.Quitar(id);

                Cargar();
                Avisar(quitada
                    ? $"Se quito la plaza {texto} del cuadro."
                    : "Esa plaza tiene titular. Diga primero que salio y " +
                      "despues quitela.");
            }
            catch (Exception ex) { MostrarError("No se pudo quitar la plaza.", ex); }
        }

        /// <summary>
        /// El Excel de lo que se esta viendo: el mismo filtro de estado
        /// y el mismo texto buscado.
        /// </summary>
        private void GenerarExcel()
        {
            var visibles = dtg.DataSource as System.Data.DataTable;

            if (visibles is null || visibles.Rows.Count == 0)
            {
                Avisar("No hay ninguna plaza en la lista. No hay nada que exportar.");
                return;
            }

            string estado = EstadoFiltro() ?? "todas";
            string filtro = $"Plazas: {estado}" +
                            (txtBuscar.Text.Trim().Length > 0
                                ? $"   ·   buscando \"{txtBuscar.Text.Trim()}\"" : "");

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar el cuadro de plazas",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Plazas_Base105_{DateTime.Today:yyyy-MM-dd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                Cursor = Cursors.WaitCursor;

                ReporteVacantesExcel.Generar(dlg.FileName, visibles, filtro, _repo.Totales());

                Avisar($"Excel generado con {visibles.Rows.Count} plaza(s).   |   {dlg.FileName}");

                // Se abre solo: quien lo pidio lo quiere ver.
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

        /// <summary>
        /// El cuadrito para escoger a una persona. Se le dice para cual
        /// plaza es, para que no ofrezca al que salio de ella.
        /// </summary>
        private OficialSimple? Escoger(string titulo, int idPlaza)
        {
            List<OficialSimple> gente;
            try { gente = _repo.ParaCubrir(idPlaza); }
            catch (Exception ex)
            {
                MostrarError("No se pudo cargar el personal.", ex);
                return null;
            }

            if (gente.Count == 0)
            {
                Avisar("No hay personal activo para asignar.");
                return null;
            }

            using var dlg = new EscogerOficial(titulo, TextoPlaza(), gente);
            return dlg.ShowDialog(this) == DialogResult.OK ? dlg.Escogido : null;
        }

        // =============================================================
        private int PlazaEscogida()
        {
            if (dtg.CurrentRow is null || !dtg.Columns.Contains("Id")) return 0;
            var v = dtg.CurrentRow.Cells["Id"].Value;
            return v is null || v == DBNull.Value ? 0 : Convert.ToInt32(v);
        }

        private string Celda(string columna)
        {
            if (dtg.CurrentRow is null || !dtg.Columns.Contains(columna)) return "";
            return dtg.CurrentRow.Cells[columna].Value?.ToString() ?? "";
        }

        private string EstadoDeLaFila() => Celda("Estado");

        /// <summary>Desde cuando esta vacante la plaza escogida, si se sabe.</summary>
        private DateTime? FechaDeLaFila()
        {
            if (dtg.CurrentRow is null || !dtg.Columns.Contains("Desde")) return null;
            return dtg.CurrentRow.Cells["Desde"].Value as DateTime?;
        }

        private string TextoPlaza()
        {
            string plaza = Celda("Plaza");
            return Celda("Rol") + (plaza.Length == 0 ? "" : $"  -  {plaza}");
        }

        /// <summary>
        /// Lo que pasa se dice en la barra de abajo. Una ventana por
        /// cada accion estorbaria mas de lo que ayuda.
        /// </summary>
        private void Avisar(string mensaje) => lblResumen.Text = mensaje;

        private void MostrarError(string contexto, Exception ex)
        {
            Registro.Anotar(contexto, ex);
            MessageBox.Show($"{contexto}\n\nDetalle tecnico:\n{ex.Message}",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    // ===============================================================
    /// <summary>
    /// Escoger a una persona de una lista larga. Trae un campo de
    /// busqueda porque son varias decenas y bajar rodando no es forma
    /// de trabajar.
    /// </summary>
    public class EscogerOficial : Form
    {
        private readonly TextBox txtBuscar = new();
        private readonly ListBox lst = new();
        private readonly List<OficialSimple> _todos;

        public OficialSimple? Escogido { get; private set; }

        public EscogerOficial(string titulo, string plaza, List<OficialSimple> gente)
        {
            _todos = gente;

            Text = titulo;
            ClientSize = new Size(560, 480);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            StartPosition = FormStartPosition.CenterParent;
            MaximizeBox = false;
            MinimizeBox = false;

            var lblPlaza = new Label { Text = plaza, AutoSize = false };
            lblPlaza.SetBounds(20, 14, 520, 24);
            lblPlaza.Font = Estilo.GrillaEncabezado;
            lblPlaza.ForeColor = Estilo.Azul;

            var lbl = new Label { Text = "Buscar por nombre, cedula o rol", AutoSize = true };
            lbl.SetBounds(20, 48, 400, 20);
            lbl.Font = Estilo.Subtitulo;
            lbl.ForeColor = Estilo.TextoSuave;

            txtBuscar.SetBounds(20, 70, 520, 28);

            // Aqui la lista de abajo ya es la sugerencia: se va acortando
            // con cada letra. Ponerle ademas la listita flotante de
            // Autocompletar la taparia justo cuando hay que escoger de
            // ella.
            txtBuscar.TextChanged += (_, _) => Filtrar();

            lst.SetBounds(20, 108, 520, 300);
            lst.DisplayMember = nameof(OficialSimple.Descripcion);
            lst.DoubleClick += (_, _) => Aceptar();

            var btnOk = new Button { Text = "Escoger" };
            btnOk.SetBounds(310, 424, 110, 38);
            btnOk.Click += (_, _) => Aceptar();

            var btnNo = new Button { Text = "Cancelar", DialogResult = DialogResult.Cancel };
            btnNo.SetBounds(430, 424, 110, 38);

            Controls.AddRange(new Control[] { lblPlaza, lbl, txtBuscar, lst, btnOk, btnNo });

            BackColor = Estilo.Fondo;
            ForeColor = Estilo.Texto;
            if (Estilo.Icono is not null) Icon = Estilo.Icono;

            Estilo.CampoTexto(txtBuscar);
            Estilo.CampoTexto(lst);
            Estilo.Primario(btnOk);
            Estilo.Secundario(btnNo);

            AcceptButton = btnOk;
            CancelButton = btnNo;

            Filtrar();
        }

        private void Filtrar()
        {
            string t = txtBuscar.Text.Trim();

            lst.DataSource = t.Length == 0
                ? _todos
                : _todos.Where(o => Estilo.Coincide(t, o.Nombre, o.Cedula, o.Rol)).ToList();
        }

        private void Aceptar()
        {
            if (lst.SelectedItem is not OficialSimple o) return;
            Escogido = o;
            DialogResult = DialogResult.OK;
        }
    }

    // ===============================================================
    /// <summary>
    /// Por que salio el titular y desde cuando. Los dos datos se piden
    /// juntos porque son los que despues hay que ver en la lista de
    /// vacantes: sin ellos la plaza queda vacante sin poder decir por
    /// que.
    /// </summary>
    public class SalidaDeTitular : Form
    {
        private readonly ComboBox cbxMotivo = new();
        private readonly DateTimePicker dtpFecha = new();
        private readonly TextBox txtNota = new();

        public string Motivo => cbxMotivo.SelectedItem?.ToString() ?? MotivoVacante.Otro;
        public DateTime Fecha => dtpFecha.Value.Date;
        public string? Observacion =>
            txtNota.Text.Trim().Length == 0 ? null : txtNota.Text.Trim();

        /// <param name="motivo">
        /// Si viene, el cuadro no es para registrar una salida sino para
        /// corregir el por que de una plaza que ya esta vacante, y
        /// arranca con lo que esa plaza tenga puesto.
        /// </param>
        public SalidaDeTitular(string titular, string plaza,
                               string? motivo = null, DateTime? fecha = null,
                               string? nota = null)
        {
            bool corrigiendo = motivo is not null;

            Text = corrigiendo ? "Corregir el motivo" : "Salio el titular";
            ClientSize = new Size(520, 320);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            StartPosition = FormStartPosition.CenterParent;
            MaximizeBox = false;
            MinimizeBox = false;

            var lblQuien = new Label { Text = titular, AutoSize = false };
            lblQuien.SetBounds(20, 16, 480, 24);
            lblQuien.Font = Estilo.GrillaEncabezado;
            lblQuien.ForeColor = Estilo.Azul;

            var lblPlaza = new Label { Text = plaza, AutoSize = false };
            lblPlaza.SetBounds(20, 42, 480, 22);
            lblPlaza.Font = Estilo.Subtitulo;
            lblPlaza.ForeColor = Estilo.TextoSuave;

            var lblMotivo = new Label { Text = "Motivo", AutoSize = false };
            lblMotivo.SetBounds(20, 84, 90, 26);

            cbxMotivo.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxMotivo.SetBounds(120, 82, 240, 28);
            cbxMotivo.Items.AddRange(MotivoVacante.Todos);

            // Corrigiendo, arranca en lo que la plaza ya tenia. Limpiar
            // deja el motivo en uno de los que la base acepta, asi que
            // el indice nunca sale en -1.
            cbxMotivo.SelectedItem = corrigiendo
                ? MotivoVacante.Limpiar(motivo) : MotivoVacante.Todos[0];

            var lblFecha = new Label { Text = "Desde", AutoSize = false };
            lblFecha.SetBounds(20, 128, 90, 26);

            dtpFecha.Format = DateTimePickerFormat.Short;
            dtpFecha.SetBounds(120, 126, 160, 28);
            dtpFecha.Value = fecha?.Date ?? DateTime.Today;

            var lblNota = new Label { Text = "Nota", AutoSize = false };
            lblNota.SetBounds(20, 172, 90, 26);

            txtNota.SetBounds(120, 170, 370, 60);
            txtNota.Multiline = true;
            txtNota.PlaceholderText = "Opcional";
            txtNota.Text = nota ?? "";

            var btnOk = new Button { Text = "Guardar" };
            btnOk.SetBounds(270, 254, 110, 38);
            btnOk.Click += (_, _) => DialogResult = DialogResult.OK;

            var btnNo = new Button { Text = "Cancelar", DialogResult = DialogResult.Cancel };
            btnNo.SetBounds(390, 254, 110, 38);

            Controls.AddRange(new Control[]
            { lblQuien, lblPlaza, lblMotivo, cbxMotivo, lblFecha, dtpFecha,
              lblNota, txtNota, btnOk, btnNo });

            BackColor = Estilo.Fondo;
            ForeColor = Estilo.Texto;
            if (Estilo.Icono is not null) Icon = Estilo.Icono;

            foreach (var l in new[] { lblMotivo, lblFecha, lblNota })
            { l.Font = Estilo.Etiqueta; l.TextAlign = ContentAlignment.MiddleLeft; }

            Estilo.CampoTexto(cbxMotivo);
            Estilo.CampoTexto(dtpFecha);
            Estilo.CampoTexto(txtNota);
            Estilo.Primario(btnOk);
            Estilo.Secundario(btnNo);

            AcceptButton = btnOk;
            CancelButton = btnNo;
        }
    }

    // ===============================================================
    /// <summary>
    /// Una plaza nueva en el cuadro. Nace vacante: es un puesto de
    /// trabajo que todavia no tiene a nadie.
    /// </summary>
    public class NuevaPlaza : Form
    {
        private readonly ComboBox cbxRol = new();
        private readonly TextBox txtCodigo = new();
        private readonly NumericUpDown numCuantas = new();

        public string Rol => cbxRol.SelectedItem?.ToString() ?? "";
        public string? Codigo =>
            txtCodigo.Text.Trim().Length == 0 ? null : txtCodigo.Text.Trim();
        public int Cuantas => (int)numCuantas.Value;

        public NuevaPlaza()
        {
            Text = "Nueva plaza";
            ClientSize = new Size(520, 260);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            StartPosition = FormStartPosition.CenterParent;
            MaximizeBox = false;
            MinimizeBox = false;

            var lblTitulo = new Label
            { Text = "La plaza queda vacante hasta que se le ponga titular", AutoSize = false };
            lblTitulo.SetBounds(20, 16, 480, 24);
            lblTitulo.Font = Estilo.Subtitulo;
            lblTitulo.ForeColor = Estilo.TextoSuave;

            var lblRol = new Label { Text = "Rol", AutoSize = false };
            lblRol.SetBounds(20, 60, 90, 26);

            cbxRol.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxRol.SetBounds(120, 58, 240, 28);

            // Los roles salen de donde salen en todas las demas
            // pantallas: asi el dia que se agregue un turno, aqui
            // aparece solo.
            cbxRol.Items.AddRange(AsistenciaRepositorio.TodosLosRoles());
            cbxRol.SelectedIndex = 0;

            var lblCodigo = new Label { Text = "Codigo", AutoSize = false };
            lblCodigo.SetBounds(20, 104, 90, 26);

            txtCodigo.SetBounds(120, 102, 240, 28);
            txtCodigo.PlaceholderText = "Opcional, si la base las numera";

            var lblCuantas = new Label { Text = "Cuantas", AutoSize = false };
            lblCuantas.SetBounds(20, 148, 90, 26);

            numCuantas.SetBounds(120, 146, 80, 28);
            numCuantas.Minimum = 1;
            numCuantas.Maximum = 50;
            numCuantas.Value = 1;

            var btnOk = new Button { Text = "Agregar" };
            btnOk.SetBounds(270, 196, 110, 38);
            btnOk.Click += (_, _) => DialogResult = DialogResult.OK;

            var btnNo = new Button { Text = "Cancelar", DialogResult = DialogResult.Cancel };
            btnNo.SetBounds(390, 196, 110, 38);

            Controls.AddRange(new Control[]
            { lblTitulo, lblRol, cbxRol, lblCodigo, txtCodigo,
              lblCuantas, numCuantas, btnOk, btnNo });

            BackColor = Estilo.Fondo;
            ForeColor = Estilo.Texto;
            if (Estilo.Icono is not null) Icon = Estilo.Icono;

            foreach (var l in new[] { lblRol, lblCodigo, lblCuantas })
            { l.Font = Estilo.Etiqueta; l.TextAlign = ContentAlignment.MiddleLeft; }

            Estilo.CampoTexto(cbxRol);
            Estilo.CampoTexto(txtCodigo);
            Estilo.CampoTexto(numCuantas);
            Estilo.Primario(btnOk);
            Estilo.Secundario(btnNo);

            AcceptButton = btnOk;
            CancelButton = btnNo;
        }
    }
}
