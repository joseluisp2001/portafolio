using System.Globalization;
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Una linea del cuadro de varios dias: un puesto y quien lo va a
    /// ocupar cada dia del rango.
    /// </summary>
    public class FilaRango
    {
        public string Puesto { get; set; } = "";

        /// <summary>Un texto por dia. Si hay varios turnos, van en lineas aparte.</summary>
        public string[] Nombres { get; set; } = Array.Empty<string>();

        /// <summary>
        /// La columna de al lado: quien cubre al de la casilla de la
        /// izquierda. Va renglon con renglon contra Nombres, para que en
        /// un puesto con varios oficiales cada quien quede frente al
        /// suyo.
        /// </summary>
        public string[] Cubre { get; set; } = Array.Empty<string>();

        /// <summary>
        /// True si en algun dia del rango hay algo que decir en la fila
        /// de abajo. Cuando es false esa fila no se dibuja: la mayoria
        /// de los puestos pasan la semana sin una sola sustitucion y no
        /// tiene sentido gastarles un renglon en blanco.
        /// </summary>
        public bool HayCubre => Cubre.Any(c => !string.IsNullOrWhiteSpace(c));

        /// <summary>Por dia: true si ese dia el puesto quedaria descubierto.</summary>
        public bool[] SinCubrir { get; set; } = Array.Empty<bool>();

        /// <summary>Por dia: cuantos renglones ocupa la casilla.</summary>
        public int[] Renglones { get; set; } = Array.Empty<int>();

        /// <summary>La fila de los que quedan sin puesto asignado.</summary>
        public bool EsSinPuesto { get; set; }
    }

    /// <summary>
    /// Una linea del rol de un horario: el numero de orden y quien va
    /// ese dia, igual que en el cuaderno de la base.
    /// </summary>
    public class FilaRol
    {
        public int Numero { get; set; }

        /// <summary>
        /// El nombre del titular de esa casilla, y debajo el motivo si
        /// ese dia no va a estar.
        /// </summary>
        public string[] Nombres { get; set; } = Array.Empty<string>();

        /// <summary>
        /// La columna de al lado: el nombre de quien esta cubriendo al
        /// titular, o SIN CUBRIR si nadie lo tomo. Vacia los dias en que
        /// el titular si va, que son la mayoria.
        /// </summary>
        public string[] Cubre { get; set; } = Array.Empty<string>();

        /// <summary>
        /// True si en algun dia de esta fila hay alguien cubriendo. Si
        /// no, la fila de abajo no se dibuja y el rol queda tan corto
        /// como antes.
        /// </summary>
        public bool HayCubre => Cubre.Any(c => !string.IsNullOrWhiteSpace(c));

        /// <summary>Por dia: true si ese nombre es de quien cubre, no del titular.</summary>
        public bool[] EsCobertura { get; set; } = Array.Empty<bool>();

        /// <summary>Por dia: true si ese puesto del rol quedo sin nadie.</summary>
        public bool[] SinCubrir { get; set; } = Array.Empty<bool>();

        /// <summary>Por dia: true si quien entra ese dia va de extra.</summary>
        public bool[] EsExtra { get; set; } = Array.Empty<bool>();

        /// <summary>Por dia: cuantos renglones ocupa la casilla.</summary>
        public int[] Renglones { get; set; } = Array.Empty<int>();
    }

    /// <summary>El rol completo de un horario a lo largo del rango.</summary>
    public class RolTurno
    {
        public string Turno { get; set; } = "";
        public List<FilaRol> Filas { get; set; } = new();

        /// <summary>Por dia, la lista de los que de verdad libran.</summary>
        public List<string>[] Libres { get; set; } = Array.Empty<List<string>>();

        /// <summary>Cuantos renglones hace falta reservar para el bloque de libres.</summary>
        public int CuantosLibres { get; set; }

        /// <summary>
        /// Cuantas veces, en todo el rango, alguien que libraba entro a
        /// cubrir. Son extras trabajados en dia libre: interesa verlo.
        /// </summary>
        public int EntraronEnDiaLibre { get; set; }

        /// <summary>Casillas marcadas como extra en todo el rango.</summary>
        public int Extras => Filas.Sum(f => f.EsExtra.Count(x => x));
    }

    /// <summary>
    /// Arma el cuadro puestos por dias. Lo usan la grilla de la pantalla
    /// y el Excel, para que los dos muestren exactamente lo mismo.
    /// </summary>
    public static class CuadroProyeccion
    {
        public static readonly CultureInfo Cultura = CultureInfo.GetCultureInfo("es-CR");

        /// <summary>Encabezado corto de una columna de dia: "lun 04/08".</summary>
        public static string Encabezado(DateTime f) =>
            f.ToString("ddd dd/MM", Cultura);

        public static List<FilaRango> Armar(List<DiaProyectado> dias, List<Puesto> puestos)
        {
            var filas = new List<FilaRango>();
            int n = dias.Count;
            if (n == 0) return filas;

            // ---------- Una fila por puesto ----------
            foreach (var p in puestos)
            {
                var fila = new FilaRango
                {
                    Puesto = p.Codigo,
                    Nombres = new string[n],
                    Cubre = new string[n],
                    SinCubrir = new bool[n],
                    Renglones = new int[n]
                };

                bool tieneAlgo = false;

                for (int i = 0; i < n; i++)
                {
                    // Un mismo puesto puede tener gente de varios turnos
                    // el mismo dia. Todos van, uno por linea.
                    var enElPuesto = dias[i].Lineas
                        .Where(l => l.IdPuesto == p.IdPuesto).ToList();

                    if (enElPuesto.Count == 0) continue;

                    tieneAlgo = true;

                    var par = Emparejar(enElPuesto);
                    fila.Nombres[i] = par.Nombres;
                    fila.Cubre[i] = par.Cubre;
                    fila.Renglones[i] = par.Renglones;

                    fila.SinCubrir[i] = enElPuesto.Any(l => l.Descubierto);
                }

                // Un puesto que nadie ocupa en todo el rango solo estorba
                if (tieneAlgo) filas.Add(fila);
            }

            // ---------- Los que quedan sin puesto ----------
            var sinPuesto = new FilaRango
            {
                Puesto = "SIN PUESTO",
                Nombres = new string[n],
                Cubre = new string[n],
                SinCubrir = new bool[n],
                Renglones = new int[n],
                EsSinPuesto = true
            };

            bool haySinPuesto = false;

            for (int i = 0; i < n; i++)
            {
                var sueltos = dias[i].Lineas
                    .Where(l => l.IdPuesto is null && l.TextoTitular.Length > 0)
                    .ToList();

                if (sueltos.Count == 0) continue;

                haySinPuesto = true;

                var par = Emparejar(sueltos);
                sinPuesto.Nombres[i] = par.Nombres;
                sinPuesto.Cubre[i] = par.Cubre;
                sinPuesto.Renglones[i] = par.Renglones;
            }

            if (haySinPuesto) filas.Add(sinPuesto);

            return filas;
        }

        /// <summary>
        /// Pone las dos casillas de una misma celda renglon con renglon.
        ///
        /// Un puesto puede tener varios oficiales el mismo dia, y cada
        /// uno puede ocupar uno o dos renglones (el nombre y, si falta,
        /// el motivo). Si cada columna se armara por su lado, el que
        /// cubre terminaria frente al oficial equivocado. Aqui cada
        /// oficial reserva la misma cantidad de renglones en las dos
        /// columnas, rellenando con vacios lo que le sobre.
        /// </summary>
        private static (string Nombres, string Cubre, int Renglones) Emparejar(
            List<LineaProyeccion> lineas)
        {
            var izquierda = new List<string>();
            var derecha = new List<string>();

            foreach (var l in lineas)
            {
                int alto = Math.Max(1, l.RenglonesCasilla);
                izquierda.AddRange(Renglonear(l.TextoTitular, alto));
                derecha.AddRange(Renglonear(l.TextoCubre, alto));
            }

            return (string.Join("\n", izquierda),
                    string.Join("\n", derecha).TrimEnd('\n'),
                    izquierda.Count);
        }

        /// <summary>Parte un texto en renglones y lo rellena hasta el alto pedido.</summary>
        private static List<string> Renglonear(string texto, int alto)
        {
            var partes = texto.Length == 0
                ? new List<string>()
                : texto.Split('\n').ToList();

            while (partes.Count < alto) partes.Add("");
            return partes;
        }

        /// <summary>
        /// Arma el rol de cada horario tal como se lleva en el cuaderno:
        /// una columna por dia, las filas numeradas con quien entra ese
        /// dia, y al pie los que libran.
        ///
        /// El orden de las filas es alfabetico, igual todos los dias, de
        /// forma que cada oficial se queda en su renglon y se nota de un
        /// vistazo cuando falta o cuando lo cubre otro.
        /// </summary>
        public static List<RolTurno> ArmarRol(List<DiaProyectado> dias)
        {
            var roles = new List<RolTurno>();
            int n = dias.Count;
            if (n == 0) return roles;

            // Los horarios que de verdad aparecen, en el orden oficial
            var presentes = AsistenciaRepositorio.Turnos
                .Where(t => dias.Any(d => d.Lineas.Any(l => l.Turno == t) ||
                                          d.Libres.Any(l => l.Turno == t)))
                .ToList();

            foreach (string turno in presentes)
            {
                // Por dia: los oficiales del turno, siempre en el mismo orden
                var porDia = dias
                    .Select(d => d.Lineas.Where(l => l.Turno == turno)
                                         .OrderBy(l => l.Nombre, StringComparer.CurrentCultureIgnoreCase)
                                         .ToList())
                    .ToList();

                int alto = porDia.Max(x => x.Count);

                var rol = new RolTurno
                {
                    Turno = turno,
                    Libres = new List<string>[n]
                };

                for (int fila = 0; fila < alto; fila++)
                {
                    var f = new FilaRol
                    {
                        Numero = fila + 1,
                        Nombres = new string[n],
                        Cubre = new string[n],
                        EsCobertura = new bool[n],
                        SinCubrir = new bool[n],
                        EsExtra = new bool[n],
                        Renglones = new int[n]
                    };

                    for (int d = 0; d < n; d++)
                    {
                        if (fila >= porDia[d].Count) continue;

                        var linea = porDia[d][fila];

                        // El nombre va en su casilla y quien lo cubre en
                        // la de abajo, cada uno por aparte.
                        f.Nombres[d] = linea.TextoTitular;
                        f.Cubre[d] = linea.TextoCubre;
                        f.EsCobertura[d] = !linea.Disponible && linea.NombreSustituto.Length > 0;
                        f.SinCubrir[d] = linea.Descubierto;
                        f.EsExtra[d] = linea.EsExtra;
                        f.Renglones[d] = linea.RenglonesCasilla;
                    }

                    rol.Filas.Add(f);
                }

                for (int d = 0; d < n; d++)
                {
                    var delTurno = dias[d].Libres.Where(l => l.Turno == turno).ToList();

                    // El que libraba pero entro a cubrir NO va en este
                    // bloque: su nombre ya esta arriba, en la fila del
                    // companero al que sustituyo. Ponerlo en los dos
                    // lados seria decir que ese dia trabajo y libro.
                    rol.Libres[d] = delTurno
                        .Where(l => !l.EntroACubrir)
                        .Select(l => l.Nombre)
                        .OrderBy(x => x, StringComparer.CurrentCultureIgnoreCase)
                        .ToList();

                    rol.EntraronEnDiaLibre += delTurno.Count(l => l.EntroACubrir);
                    rol.CuantosLibres = Math.Max(rol.CuantosLibres, rol.Libres[d].Count);
                }

                roles.Add(rol);
            }

            return roles;
        }

        /// <summary>Deja solo las filas donde aparece el texto buscado.</summary>
        public static List<FilaRango> Filtrar(List<FilaRango> filas, string? texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return filas;

            // Tambien se busca en la fila de abajo: quien entra a cubrir
            // solo aparece ahi, y si no se mirara, buscar su nombre no
            // encontraria el puesto donde ese dia estuvo.
            return filas.Where(f =>
                Estilo.Coincide(texto, f.Puesto) ||
                f.Nombres.Any(n => Estilo.Coincide(texto, n)) ||
                f.Cubre.Any(c => Estilo.Coincide(texto, c))).ToList();
        }
    }

    /// <summary>
    /// Proyeccion de varios dias seguidos: se escoge desde cuando y de
    /// cuantos dias es el margen, y sale un cuadro de puestos por dias
    /// con el nombre de quien va a estar en cada uno.
    ///
    /// Solo consulta y exporta. Para cambiar el plan de un dia esta la
    /// pantalla de Proyeccion.
    /// Construida por codigo: no lleva Designer ni resx.
    /// </summary>
    public class ProyeccionRango : Form
    {
        private readonly ProyeccionRepositorio _repo = new();
        private readonly AsistenciaRepositorio _repoAsis = new();

        private List<Puesto> _puestos = new();
        private List<DiaProyectado> _dias = new();
        private List<FilaRango> _filas = new();
        private List<RolTurno> _roles = new();

        private const int MARGEN_MAXIMO = 62;

        private const string C_ROTULO = "Rotulo";

        /// <summary>
        /// Espera antes de recargar. La fecha, el margen y el turno
        /// recargan solos, y sin esta pausa una vuelta del margen de 7 a
        /// 14 dispararia siete consultas seguidas.
        /// </summary>
        private readonly System.Windows.Forms.Timer _recarga = new() { Interval = 400 };

        /// <summary>Se enciende cuando la pantalla ya cargo por primera vez.</summary>
        private bool _listo;

        // ---------- Banda ----------
        private readonly Panel pnlBanda = new();
        private readonly Label lblTitulo = new();
        private readonly Label lblSub = new();
        private readonly Button btnCerrar = new();

        // ---------- Filtros ----------
        private readonly Panel pnlFiltro = new();
        private readonly Label lblDesde = new();
        private readonly DateTimePicker dtpDesde = new();
        private readonly Label lblMargen = new();
        private readonly NumericUpDown numMargen = new();
        private readonly Label lblHasta = new();
        private readonly Label lblTurno = new();
        private readonly ComboBox cbxTurno = new();
        private readonly Button btnCargar = new();

        private readonly Label lblBuscar = new();
        private readonly TextBox txtBuscar = new();
        private readonly Button btnBuscar = new();
        private readonly Button btnLimpiar = new();

        // ---------- Grilla ----------
        private readonly GroupBox grp = new();
        private readonly DataGridView dtg = new();

        /// <summary>
        /// Botones para saltar de un horario a otro. Las secciones van
        /// una debajo de la otra y las de abajo quedan fuera de la
        /// pantalla: sin estos botones parece que solo esta la primera.
        /// </summary>
        private readonly FlowLayoutPanel pnlSecciones = new();

        /// <summary>Titulo y renglon donde empieza cada seccion.</summary>
        private readonly List<(string Titulo, int Fila)> _secciones = new();

        // ---------- Inferior ----------
        private readonly Panel pnlInferior = new();
        private readonly Button btnExcel = new();
        private readonly Label lblResumen = new();

        public ProyeccionRango(DateTime? desde = null)
        {
            ConstruirInterfaz();
            if (desde is not null) dtpDesde.Value = desde.Value;

            _recarga.Tick += (_, _) => { _recarga.Stop(); Cargar(); };

            Load += (_, _) => Iniciar();
            FormClosed += (_, _) => _recarga.Dispose();
        }

        // =============================================================
        // INTERFAZ
        // =============================================================
        private void ConstruirInterfaz()
        {
            Estilo.Formulario(this);
            Text = "Proyeccion de varios dias";
            ClientSize = new Size(1360, 740);
            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };

            // ---------- Banda ----------
            Estilo.Banda(pnlBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 95;

            int margenTexto = Estilo.LogoEnBanda(pnlBanda, 62) + 22;
            if (margenTexto < 40) margenTexto = 40;

            lblTitulo.Text = "PROYECCION DE VARIOS DIAS";
            lblTitulo.Font = Estilo.Titulo;
            lblTitulo.ForeColor = Color.White;
            lblTitulo.BackColor = Color.Transparent;
            lblTitulo.SetBounds(margenTexto, 22, 700, 32);

            lblSub.Text = "Cuadro por dia. Cuando alguien falta: el titular, " +
                          "quien lo cubre y el motivo.";
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
            pnlFiltro.Height = 132;
            pnlFiltro.BackColor = Estilo.Superficie;

            lblDesde.Text = "Desde";
            lblMargen.Text = "Margen (dias)";
            lblTurno.Text = "Turno";
            lblBuscar.Text = "Buscar oficial o puesto";

            foreach (var l in new[] { lblDesde, lblMargen, lblTurno, lblBuscar })
            {
                l.Font = Estilo.Subtitulo;
                l.ForeColor = Estilo.TextoSuave;
                l.AutoSize = true;
            }

            lblDesde.SetBounds(22, 10, 120, 19);
            dtpDesde.Format = DateTimePickerFormat.Long;
            Estilo.CampoTexto(dtpDesde);
            dtpDesde.SetBounds(20, 32, 290, 28);
            dtpDesde.Value = DateTime.Today.AddDays(1);

            // Los tres filtros recargan el cuadro solos. Antes habia que
            // presionar "Cargar proyeccion" y la pantalla se quedaba con
            // el horario anterior.
            dtpDesde.ValueChanged += (_, _) => PedirRecarga();

            lblMargen.SetBounds(332, 10, 140, 19);
            numMargen.Minimum = 1;
            numMargen.Maximum = MARGEN_MAXIMO;
            numMargen.Value = 7;
            numMargen.Font = Estilo.Campo;
            numMargen.BackColor = Color.White;
            numMargen.TextAlign = HorizontalAlignment.Center;
            numMargen.SetBounds(330, 32, 90, 28);
            numMargen.ValueChanged += (_, _) => PedirRecarga();

            lblHasta.Font = Estilo.GrillaEncabezado;
            lblHasta.ForeColor = Estilo.Azul;
            lblHasta.AutoSize = false;
            lblHasta.SetBounds(438, 36, 420, 22);

            lblTurno.SetBounds(872, 10, 100, 19);
            cbxTurno.DropDownStyle = ComboBoxStyle.DropDownList;
            Estilo.CampoTexto(cbxTurno);
            cbxTurno.SetBounds(870, 32, 170, 28);
            cbxTurno.Items.Add("Todos los turnos");
            cbxTurno.Items.AddRange(AsistenciaRepositorio.Turnos);
            cbxTurno.SelectedIndex = 0;
            cbxTurno.SelectedIndexChanged += (_, _) => PedirRecarga();

            Estilo.Primario(btnCargar);
            btnCargar.Text = "Recargar proyeccion";
            btnCargar.SetBounds(1050, 28, 200, 36);
            btnCargar.Click += (_, _) => Cargar();

            // ----- Segunda fila: la busqueda -----
            lblBuscar.SetBounds(22, 74, 220, 19);
            Estilo.CampoTexto(txtBuscar);
            txtBuscar.SetBounds(20, 96, 290, 27);
            Estilo.Autocompletar(txtBuscar, OpcionesDeBusqueda, Pintar);

            Estilo.Primario(btnBuscar);
            btnBuscar.Text = "Buscar";
            btnBuscar.SetBounds(330, 93, 130, 33);
            btnBuscar.Click += (_, _) => Pintar();

            Estilo.Secundario(btnLimpiar);
            btnLimpiar.Text = "Ver todo";
            btnLimpiar.SetBounds(472, 93, 130, 33);
            btnLimpiar.Click += (_, _) => { txtBuscar.Clear(); Pintar(); };

            pnlFiltro.Controls.AddRange(new Control[]
            { btnLimpiar, btnBuscar, txtBuscar, lblBuscar,
              btnCargar, cbxTurno, lblTurno, lblHasta,
              numMargen, lblMargen, dtpDesde, lblDesde });

            // ---------- Grilla ----------
            Estilo.GridSoloLectura(dtg);
            dtg.Dock = DockStyle.Fill;
            dtg.AllowUserToResizeColumns = true;
            dtg.DefaultCellStyle.WrapMode = DataGridViewTriState.True;
            dtg.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.AllCells;
            dtg.RowTemplate.Height = 30;

            grp.Text = "Cuadro por horario y por puesto";
            grp.Font = Estilo.GrillaEncabezado;
            grp.ForeColor = Estilo.Azul;
            grp.BackColor = Estilo.Fondo;
            grp.Dock = DockStyle.Fill;
            grp.Padding = new Padding(15, 10, 15, 10);
            grp.Controls.Add(dtg);

            // La franja de botones va arriba y la grilla ocupa lo que
            // sobra. Se manda la grilla al frente para que el acomodo
            // quede en ese orden.
            pnlSecciones.Dock = DockStyle.Top;
            pnlSecciones.Height = 44;
            pnlSecciones.BackColor = Estilo.Fondo;
            pnlSecciones.WrapContents = false;
            pnlSecciones.AutoScroll = true;
            pnlSecciones.Padding = new Padding(0, 4, 0, 4);
            grp.Controls.Add(pnlSecciones);
            dtg.BringToFront();

            // ---------- Inferior ----------
            pnlInferior.Dock = DockStyle.Bottom;
            pnlInferior.Height = 80;
            pnlInferior.BackColor = Estilo.Superficie;

            Estilo.Primario(btnExcel);
            btnExcel.Text = "Generar Excel del cuadro";
            btnExcel.SetBounds(20, 18, 320, 44);
            btnExcel.Click += (_, _) => GenerarExcel();

            lblResumen.Font = Estilo.Subtitulo;
            lblResumen.ForeColor = Estilo.TextoSuave;
            lblResumen.TextAlign = ContentAlignment.MiddleLeft;
            lblResumen.SetBounds(360, 30, 880, 22);

            pnlInferior.Controls.AddRange(new Control[] { lblResumen, btnExcel });

            Controls.Add(grp);
            Controls.Add(pnlInferior);
            Controls.Add(pnlFiltro);
            Controls.Add(pnlBanda);

            Resize += (_, _) => Acomodar();
            MostrarRango();
        }

        private void Acomodar()
        {
            int ancho = ClientSize.Width;
            if (ancho < 400) return;

            btnCerrar.Location = new Point(ancho - btnCerrar.Width - 40, 30);
        }

        // =============================================================
        // DATOS
        // =============================================================
        private void Iniciar()
        {
            Acomodar();

            try
            {
                _puestos = _repoAsis.ListarPuestos();
                Cargar();
                _listo = true;
            }
            catch (Exception ex) { Error("No se pudo preparar el formulario.", ex); }
        }

        /// <summary>
        /// Se movio un filtro. El cuadro se recarga solo, pero no de
        /// inmediato: se espera un momento por si el usuario sigue
        /// moviendo el margen o la fecha.
        /// </summary>
        private void PedirRecarga()
        {
            MostrarRango();
            if (!_listo) return;

            _recarga.Stop();
            _recarga.Start();
        }

        private DateTime Hasta => dtpDesde.Value.Date.AddDays((int)numMargen.Value - 1);

        private void MostrarRango()
        {
            lblHasta.Text =
                $"hasta el {Hasta.ToString("dddd d 'de' MMMM", CuadroProyeccion.Cultura)}" +
                $"   ({(int)numMargen.Value} dia(s))";
        }

        private void Cargar()
        {
            try
            {
                Cursor = Cursors.WaitCursor;

                string? turno = cbxTurno.SelectedIndex <= 0
                    ? null : cbxTurno.SelectedItem?.ToString();

                _dias = _repo.CargarRango(dtpDesde.Value, Hasta, turno);
                _filas = CuadroProyeccion.Armar(_dias, _puestos);
                _roles = CuadroProyeccion.ArmarRol(_dias);

                // Si no hay nada, se dice en la barra de abajo. Una
                // ventana emergente estorbaria: la pantalla recarga sola
                // cada vez que se mueve un filtro.
                Pintar();
            }
            catch (Exception ex) { Error("No se pudo cargar la proyeccion.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        /// <summary>
        /// Vuelca al grid lo que haya en memoria, ya filtrado y partido
        /// en secciones: primero el rol de cada horario, con su bloque de
        /// libres, y de ultimo el cuadro por puesto.
        ///
        /// Es el mismo reparto que tiene el Excel, donde cada rol va en su
        /// hoja. En pantalla no hay pestanas, asi que las secciones se
        /// separan con una banda de titulo: antes salia todo pegado en una
        /// sola lista y no se sabia donde terminaba un horario y empezaba
        /// el otro.
        /// </summary>
        private void Pintar()
        {
            string filtro = txtBuscar.Text;
            var puestosVisibles = CuadroProyeccion.Filtrar(_filas, filtro);

            dtg.Rows.Clear();
            dtg.Columns.Clear();
            _secciones.Clear();

            if (_dias.Count == 0) { ArmarBotonesDeSeccion(); ActualizarResumen(puestosVisibles, 0); return; }

            ArmarColumnas();

            int secciones = 0;

            // ---------- Lo primero: el resumen de todos juntos ----------
            if (_roles.Count > 0)
            {
                secciones++;
                _secciones.Add(("Resumen", dtg.Rows.Count));

                Banda("RESUMEN\ntodos los horarios", Estilo.Azul, Color.White);
                PintarResumen();
            }

            // ---------- Una seccion por horario ----------
            foreach (var rol in _roles)
            {
                var recorte = FiltrarRol(rol, filtro);
                if (!recorte.Hay) continue;

                if (secciones > 0) AgregarSeparador();
                secciones++;

                _secciones.Add((rol.Turno, dtg.Rows.Count));
                Banda($"ROL\n{rol.Turno}", Estilo.Azul, Color.White);
                PintarFilasDelRol(recorte.Filas);

                int cuantosLibres = recorte.Libres.Max(l => l.Count);
                if (cuantosLibres > 0)
                {
                    Banda("LIBRE", Estilo.AzulMedio, Color.White);
                    PintarLibres(recorte.Libres, cuantosLibres);
                }
            }

            // ---------- Seccion final: el cuadro por puesto ----------
            if (puestosVisibles.Count > 0)
            {
                if (secciones > 0) AgregarSeparador();
                secciones++;

                _secciones.Add(("Por puesto", dtg.Rows.Count));
                Banda("POR PUESTO", Estilo.Azul, Color.White);
                PintarPuestos(puestosVisibles);
            }

            dtg.ClearSelection();
            ArmarBotonesDeSeccion();
            ActualizarResumen(puestosVisibles, secciones);
        }

        /// <summary>
        /// Rehace la franja de botones: uno por horario y otro para el
        /// cuadro por puesto. Al presionarlos la grilla salta a esa
        /// seccion, que es lo unico que hacia falta para darse cuenta de
        /// que los demas horarios si estan, mas abajo.
        /// </summary>
        private void ArmarBotonesDeSeccion()
        {
            foreach (Control c in pnlSecciones.Controls.Cast<Control>().ToList()) c.Dispose();
            pnlSecciones.Controls.Clear();

            if (_secciones.Count == 0) return;

            var rotulo = new Label
            {
                Text = "Ir a:",
                Font = Estilo.Subtitulo,
                ForeColor = Estilo.TextoSuave,
                AutoSize = false,
                Size = new Size(42, 32),
                TextAlign = ContentAlignment.MiddleLeft
            };
            pnlSecciones.Controls.Add(rotulo);

            foreach (var (titulo, fila) in _secciones)
            {
                var b = new Button { Text = titulo, Size = new Size(130, 32) };
                Estilo.Secundario(b);

                int destino = fila;
                b.Click += (_, _) => SaltarA(destino);

                pnlSecciones.Controls.Add(b);
            }
        }

        private void SaltarA(int fila)
        {
            if (fila < 0 || fila >= dtg.Rows.Count) return;

            dtg.FirstDisplayedScrollingRowIndex = fila;
            dtg.ClearSelection();
        }

        private void ArmarColumnas()
        {
            dtg.Columns.Add(new DataGridViewTextBoxColumn
            {
                Name = C_ROTULO,
                HeaderText = "Rol / Puesto",
                Width = 160,
                Frozen = true,
                DefaultCellStyle = new DataGridViewCellStyle
                {
                    Font = Estilo.GrillaEncabezado,
                    BackColor = Estilo.AzulClaro,
                    Alignment = DataGridViewContentAlignment.MiddleCenter
                }
            });

            for (int i = 0; i < _dias.Count; i++)
            {
                // Mas anchas que antes: la casilla de una sustitucion
                // lleva "Lo cubre: Fulano  (extra)" y con 150 se partia
                // en dos renglones de mas.
                dtg.Columns.Add(new DataGridViewTextBoxColumn
                {
                    Name = "D" + i,
                    HeaderText = CuadroProyeccion.Encabezado(_dias[i].Fecha),
                    Width = 210
                });
            }

            Estilo.SinOrdenamiento(dtg);
        }

        /// <summary>Banda de titulo que abre una seccion.</summary>
        private void Banda(string texto, Color fondo, Color letra)
        {
            var fila = dtg.Rows[dtg.Rows.Add()];
            fila.Cells[C_ROTULO].Value = texto;

            fila.DefaultCellStyle.BackColor = fondo;
            fila.DefaultCellStyle.ForeColor = letra;
            fila.DefaultCellStyle.SelectionBackColor = fondo;
            fila.DefaultCellStyle.SelectionForeColor = letra;
            fila.DefaultCellStyle.Font = Estilo.GrillaEncabezado;
            fila.DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter;
        }

        /// <summary>Renglon en blanco para que las secciones respiren.</summary>
        private void AgregarSeparador()
        {
            var fila = dtg.Rows[dtg.Rows.Add()];
            fila.DefaultCellStyle.BackColor = Estilo.Fondo;
            fila.DefaultCellStyle.SelectionBackColor = Estilo.Fondo;
        }

        /// <summary>
        /// El cuadro chico de arriba: una linea por horario y, al pie,
        /// la suma de todos. Es para ver el rango completo de un vistazo,
        /// sin bajar horario por horario.
        ///
        /// Se arma con el rango completo, no con lo que deje la busqueda:
        /// un resumen filtrado no seria un resumen.
        /// </summary>
        private void PintarResumen()
        {
            int n = _dias.Count;

            var totalEntran = new int[n];
            var totalLibran = new int[n];
            var totalSinCubrir = new int[n];
            var totalCubren = new int[n];
            var totalExtras = new int[n];

            foreach (var rol in _roles)
            {
                var fila = dtg.Rows[dtg.Rows.Add()];
                fila.Cells[C_ROTULO].Value = rol.Turno;

                for (int d = 0; d < n; d++)
                {
                    int sinCubrir = rol.Filas.Count(f => f.SinCubrir[d]);
                    int cubren = rol.Filas.Count(f => f.EsCobertura[d]);
                    int entran = rol.Filas.Count(f => !f.SinCubrir[d] &&
                                                      !string.IsNullOrEmpty(f.Nombres[d]));
                    int libran = rol.Libres[d].Count;
                    int extras = rol.Filas.Count(f => f.EsExtra[d]);

                    totalEntran[d] += entran;
                    totalLibran[d] += libran;
                    totalSinCubrir[d] += sinCubrir;
                    totalCubren[d] += cubren;
                    totalExtras[d] += extras;

                    fila.Cells["D" + d].Value = Casilla(entran, libran, cubren, sinCubrir, extras);

                    if (sinCubrir > 0)
                    {
                        fila.Cells["D" + d].Style.BackColor = Estilo.RojoFondo;
                        fila.Cells["D" + d].Style.ForeColor = Estilo.RojoTexto;
                    }
                }
            }

            // ---------- La suma de todos los horarios ----------
            var suma = dtg.Rows[dtg.Rows.Add()];
            suma.Cells[C_ROTULO].Value = "TODOS";
            suma.DefaultCellStyle.Font = Estilo.GrillaEncabezado;
            suma.DefaultCellStyle.BackColor = Estilo.AzulClaro;
            suma.DefaultCellStyle.ForeColor = Estilo.Azul;
            suma.DefaultCellStyle.SelectionBackColor = Estilo.AzulClaro;
            suma.DefaultCellStyle.SelectionForeColor = Estilo.Azul;

            for (int d = 0; d < n; d++)
            {
                suma.Cells["D" + d].Value = Casilla(
                    totalEntran[d], totalLibran[d], totalCubren[d],
                    totalSinCubrir[d], totalExtras[d]);

                if (totalSinCubrir[d] > 0)
                {
                    suma.Cells["D" + d].Style.BackColor = Estilo.RojoFondo;
                    suma.Cells["D" + d].Style.ForeColor = Estilo.RojoTexto;
                }
            }
        }

        /// <summary>Lo que dice cada casilla del resumen, en una linea por dato.</summary>
        private static string Casilla(int entran, int libran, int cubren,
                                      int sinCubrir, int extras)
        {
            var partes = new List<string>
            {
                $"{entran} entran",
                $"{libran} libran"
            };

            if (cubren > 0) partes.Add($"{cubren} cubriendo");
            if (extras > 0) partes.Add($"{extras} de extra");
            if (sinCubrir > 0) partes.Add($"{sinCubrir} SIN CUBRIR");

            return string.Join("\n", partes);
        }

        private void PintarFilasDelRol(List<FilaRol> filas)
        {
            foreach (var f in filas)
            {
                var fila = dtg.Rows[dtg.Rows.Add()];
                fila.Cells[C_ROTULO].Value = f.Numero;

                for (int d = 0; d < _dias.Count; d++)
                {
                    var celda = fila.Cells["D" + d];

                    // Aqui va solo el titular, y debajo su motivo si ese
                    // dia falta. Quien lo cubre va en la fila de abajo.
                    celda.Value = f.Nombres[d] ?? "";

                    if (f.SinCubrir[d])
                    {
                        celda.Style.BackColor = Estilo.RojoFondo;
                        celda.Style.ForeColor = Estilo.RojoTexto;
                    }
                    else if (f.EsCobertura[d])
                    {
                        // Falta y lo cubre otro: se marca para que no se
                        // confunda con el titular de siempre.
                        celda.Style.BackColor = Estilo.AmbarFondo;
                        celda.Style.ForeColor = Estilo.AmbarTexto;
                    }
                }

                if (f.HayCubre) FilaDeCobertura(f.Cubre, f.SinCubrir);
            }
        }

        /// <summary>
        /// La fila de abajo: quien esta cubriendo al de la fila de
        /// arriba, dia por dia. Solo se agrega donde de verdad hay
        /// alguien cubriendo; si no, el cuadro tendria el doble de
        /// renglones para no decir nada.
        /// </summary>
        private void FilaDeCobertura(string[] cubre, bool[] sinCubrir)
        {
            var fila = dtg.Rows[dtg.Rows.Add()];

            // En cursiva y mas chico que el numero de la fila de arriba:
            // es un rotulo, no un puesto mas del rol.
            fila.Cells[C_ROTULO].Value = "Lo cubre";
            fila.Cells[C_ROTULO].Style.Font = new Font("Segoe UI", 8F, FontStyle.Italic);

            for (int d = 0; d < _dias.Count; d++)
            {
                var celda = fila.Cells["D" + d];
                string texto = d < cubre.Length ? cubre[d] ?? "" : "";
                celda.Value = texto;

                if (texto.Length == 0) continue;

                bool descubierto = d < sinCubrir.Length && sinCubrir[d];

                celda.Style.BackColor = descubierto ? Estilo.RojoFondo : Estilo.AmbarFondo;
                celda.Style.ForeColor = descubierto ? Estilo.RojoTexto : Estilo.AmbarTexto;
            }
        }

        private void PintarLibres(List<string>[] libres, int cuantos)
        {
            for (int i = 0; i < cuantos; i++)
            {
                var fila = dtg.Rows[dtg.Rows.Add()];

                for (int d = 0; d < _dias.Count; d++)
                {
                    var celda = fila.Cells["D" + d];
                    celda.Value = i < libres[d].Count ? libres[d][i] : "";
                    celda.Style.BackColor = Estilo.VerdeFondo;
                    celda.Style.ForeColor = Estilo.VerdeTexto;
                }
            }
        }

        private void PintarPuestos(List<FilaRango> visibles)
        {
            foreach (var f in visibles)
            {
                var fila = dtg.Rows[dtg.Rows.Add()];
                fila.Cells[C_ROTULO].Value = f.Puesto;

                for (int d = 0; d < _dias.Count; d++)
                {
                    var celda = fila.Cells["D" + d];
                    celda.Value = f.Nombres[d] ?? "";

                    if (f.SinCubrir[d])
                    {
                        celda.Style.BackColor = Estilo.RojoFondo;
                        celda.Style.ForeColor = Estilo.RojoTexto;
                    }
                }

                if (f.EsSinPuesto)
                {
                    fila.DefaultCellStyle.BackColor = Estilo.AmbarFondo;
                    fila.DefaultCellStyle.ForeColor = Estilo.AmbarTexto;
                }

                if (f.HayCubre) FilaDeCobertura(f.Cubre, f.SinCubrir);
            }
        }

        /// <summary>
        /// Deja de un rol solo lo que coincida con la busqueda. Si lo
        /// buscado es el horario mismo, el rol pasa entero.
        /// </summary>
        private (List<FilaRol> Filas, List<string>[] Libres, bool Hay)
            FiltrarRol(RolTurno rol, string? texto)
        {
            int n = _dias.Count;

            bool vacio = string.IsNullOrWhiteSpace(texto);
            bool esElHorario = !vacio && Estilo.Coincide(texto, rol.Turno);

            if (vacio || esElHorario)
                return (rol.Filas, rol.Libres,
                        rol.Filas.Count > 0 || rol.Libres.Any(l => l.Count > 0));

            var filas = rol.Filas
                .Where(f => f.Nombres.Any(x => Estilo.Coincide(texto, x)) ||
                            f.Cubre.Any(x => Estilo.Coincide(texto, x)))
                .ToList();

            var libres = new List<string>[n];
            for (int d = 0; d < n; d++)
                libres[d] = rol.Libres[d].Where(x => Estilo.Coincide(texto, x)).ToList();

            return (filas, libres, filas.Count > 0 || libres.Any(l => l.Count > 0));
        }

        /// <summary>
        /// Lo que el autocompletado ofrece. Sale de los datos crudos del
        /// rango, no del texto ya armado de las casillas: ahi los tres
        /// renglones van pegados con saltos de linea y no servirian de
        /// sugerencia.
        /// </summary>
        private IEnumerable<string?> OpcionesDeBusqueda()
        {
            foreach (var f in _filas) yield return f.Puesto;

            foreach (var rol in _roles) yield return rol.Turno;

            foreach (var dia in _dias)
            {
                foreach (var l in dia.Lineas)
                {
                    yield return l.Nombre;
                    yield return l.NombreSustituto;
                    yield return l.Motivo;
                }

                foreach (var libre in dia.Libres) yield return libre.Nombre;
            }
        }

        private void ActualizarResumen(List<FilaRango> visibles, int secciones)
        {
            int descubiertos = _filas.Sum(f => f.SinCubrir.Count(x => x));
            int guardados = _dias.Count(d => d.Guardado);

            grp.Text = $"Cuadro por horario y por puesto  " +
                       $"({secciones} seccion(es), {_dias.Count} dia(s))";

            if (_dias.Count == 0 || (_filas.Count == 0 && _roles.Count == 0))
            {
                lblResumen.Text =
                    "No hay personal proyectado en ese rango. Revise el turno " +
                    "escogido, o corra el script de puestos si la base no los tiene.";
                return;
            }

            int extras = _roles.Sum(r => r.Extras);

            lblResumen.Text =
                $"Dias: {_dias.Count}   |   " +
                $"Horarios ({_roles.Count}): {string.Join(", ", _roles.Select(r => r.Turno))}   |   " +
                $"Puestos con gente: {_filas.Count(f => !f.EsSinPuesto)}   |   " +
                $"Con plan guardado: {guardados}   |   " +
                $"De extra: {extras}   |   " +
                $"Casillas sin cubrir: {descubiertos}" +
                (txtBuscar.Text.Trim().Length > 0
                    ? $"   |   filtrando por \"{txtBuscar.Text.Trim()}\": " +
                      $"{visibles.Count} puesto(s)"
                    : "");
        }

        // =============================================================
        // EXCEL
        // =============================================================
        private void GenerarExcel()
        {
            if (_dias.Count == 0 || (_filas.Count == 0 && _roles.Count == 0))
            {
                MessageBox.Show("No hay proyeccion cargada para ese rango.", "Sin datos",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            // Se exporta lo que se ve: si hay un filtro puesto, ese es el
            // cuadro que el usuario quiere.
            var visibles = CuadroProyeccion.Filtrar(_filas, txtBuscar.Text);

            if (visibles.Count == 0 && _roles.Count == 0)
            {
                MessageBox.Show("El filtro no deja ninguna fila. Limpielo y reintente.",
                    "Sin datos", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            string turno = cbxTurno.SelectedIndex <= 0
                ? "Todos los turnos"
                : cbxTurno.SelectedItem!.ToString()!;

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar la proyeccion de varios dias",
                Filter = "Libro de Excel (*.xlsx)|*.xlsx",
                FileName = $"Proyeccion_Base105_{dtpDesde.Value:yyyy-MM-dd}_a_{Hasta:yyyy-MM-dd}.xlsx",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                Cursor = Cursors.WaitCursor;

                ReporteProyeccionRangoExcel.Generar(
                    dlg.FileName, _dias, visibles, turno, _roles);

                // Se abre solo: quien pidio el Excel lo quiere ver.
                lblResumen.Text =
                    $"Excel del {dtpDesde.Value:dd/MM/yyyy} al {Hasta:dd/MM/yyyy}   |   " +
                    $"{_roles.Count} rol(es) mas el cuadro por puesto   |   {dlg.FileName}";

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
            catch (Exception ex) { Error("No se pudo generar el Excel.", ex); }
            finally { Cursor = Cursors.Default; }
        }

        private static void Error(string ctx, Exception ex) =>
            MessageBox.Show($"{ctx}\n\nDetalle tecnico:\n{ex.Message}",
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
