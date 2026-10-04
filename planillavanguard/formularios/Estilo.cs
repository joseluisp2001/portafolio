namespace formularios
{
    /// <summary>
    /// Paleta y estilos de toda la aplicacion, tomados del logo Vanguard.
    /// Si quiere cambiar la apariencia, este es el unico archivo que toca.
    /// </summary>
    public static class Estilo
    {
        // ---------- Colores ----------
        public static readonly Color Azul = Color.FromArgb(17, 44, 65);        // #112C41
        public static readonly Color AzulMedio = Color.FromArgb(42, 91, 128);  // #2A5B80
        public static readonly Color AzulClaro = Color.FromArgb(214, 226, 236);

        /// <summary>Fondo general. Gris calido, mas suave que el blanco.</summary>
        public static readonly Color Fondo = Color.FromArgb(216, 222, 228);

        /// <summary>Fondo de tarjetas, paneles y celdas. Roto, no blanco puro.</summary>
        public static readonly Color Superficie = Color.FromArgb(237, 240, 243);

        /// <summary>Filas alternas de las grillas.</summary>
        public static readonly Color FilaAlterna = Color.FromArgb(226, 231, 236);

        public static readonly Color Borde = Color.FromArgb(198, 205, 213);

        /// <summary>
        /// Lineas de la cuadricula. Bastante mas oscuro que Borde: sobre
        /// el fondo claro de las celdas, un gris suave no se alcanza a
        /// ver y la tabla parece que no tuviera lineas.
        /// </summary>
        public static readonly Color LineaGrilla = Color.FromArgb(140, 156, 172);
        public static readonly Color Texto = Color.FromArgb(38, 42, 46);
        public static readonly Color TextoSuave = Color.FromArgb(102, 110, 118);

        public static readonly Color RojoFondo = Color.FromArgb(246, 213, 216);
        public static readonly Color RojoTexto = Color.FromArgb(132, 32, 41);
        public static readonly Color AmbarFondo = Color.FromArgb(252, 240, 205);
        public static readonly Color AmbarTexto = Color.FromArgb(122, 82, 0);
        public static readonly Color VerdeFondo = Color.FromArgb(214, 236, 222);
        public static readonly Color VerdeTexto = Color.FromArgb(15, 81, 50);

        /// <summary>Fila escogida en las pantallas de sustitucion.</summary>
        public static readonly Color VerdeSeleccion = Color.FromArgb(190, 228, 201);

        /// <summary>Incapacidad: azul grisaceo, distinto de ausencia.</summary>
        public static readonly Color LilaFondo = Color.FromArgb(222, 228, 241);
        public static readonly Color LilaTexto = Color.FromArgb(52, 66, 106);

        public static readonly Color Ambar = Color.FromArgb(200, 132, 18);

        // ---------- Tipografias ----------
        public static readonly Font TituloGrande = new("Segoe UI", 22F, FontStyle.Bold);
        public static readonly Font Titulo = new("Segoe UI", 16F, FontStyle.Bold);
        public static readonly Font Subtitulo = new("Segoe UI", 10F);
        public static readonly Font Etiqueta = new("Segoe UI", 11F);
        public static readonly Font Campo = new("Segoe UI", 11F);
        public static readonly Font Boton = new("Segoe UI", 11F, FontStyle.Bold);
        public static readonly Font BotonSuave = new("Segoe UI", 11F);
        public static readonly Font Grilla = new("Segoe UI", 10F);
        public static readonly Font GrillaEncabezado = new("Segoe UI", 10F, FontStyle.Bold);

        // ---------- Marca ----------
        // El logo y el icono van incrustados en el ejecutable (ver el
        // .csproj). Si algun dia faltan, se devuelve null y las pantallas
        // siguen funcionando con puro texto.
        private static Image? _logo;
        private static bool _logoBuscado;
        private static Icon? _icono;
        private static bool _iconoBuscado;

        /// <summary>El logo de Vanguard, o null si no se pudo cargar.</summary>
        public static Image? Logo
        {
            get
            {
                if (_logoBuscado) return _logo;
                _logoBuscado = true;
                try
                {
                    using var s = typeof(Estilo).Assembly
                        .GetManifestResourceStream("Vanguard.logo.png");
                    if (s is not null) _logo = Image.FromStream(s);
                }
                catch { _logo = null; }
                return _logo;
            }
        }

        /// <summary>
        /// El logo crudo, sin decodificar. Es lo que necesita ClosedXML
        /// para meterlo en la cabecera de los Excel. Devuelve un flujo
        /// nuevo cada vez: quien lo pide lo cierra.
        /// </summary>
        public static Stream? LogoCrudo()
        {
            try
            {
                return typeof(Estilo).Assembly
                    .GetManifestResourceStream("Vanguard.logo.png");
            }
            catch { return null; }
        }

        /// <summary>El icono de la ventana, o null si no se pudo cargar.</summary>
        public static Icon? Icono
        {
            get
            {
                if (_iconoBuscado) return _icono;
                _iconoBuscado = true;
                try
                {
                    using var s = typeof(Estilo).Assembly
                        .GetManifestResourceStream("Vanguard.icono.ico");
                    if (s is not null) _icono = new Icon(s);
                }
                catch { _icono = null; }
                return _icono;
            }
        }

        /// <summary>
        /// Pone el logo dentro de la banda azul, a la izquierda, y
        /// devuelve cuanto espacio horizontal ocupo. Los titulos se
        /// corren a la derecha usando ese valor.
        ///
        /// Devuelve 0 si el logo no se pudo cargar: asi la pantalla
        /// queda igual que antes en vez de salir con un hueco.
        /// </summary>
        public static int LogoEnBanda(Panel banda, int alto, int margenIzquierdo = 30)
        {
            var img = Logo;
            if (img is null) return 0;

            int ancho = (int)(alto * (img.Width / (double)img.Height));

            var caja = new PictureBox
            {
                Image = img,
                SizeMode = PictureBoxSizeMode.Zoom,
                BackColor = Color.Transparent
            };
            caja.SetBounds(margenIzquierdo, (banda.Height - alto) / 2, ancho, alto);

            banda.Controls.Add(caja);
            caja.BringToFront();

            return margenIzquierdo + ancho;
        }

        // ---------- Formulario ----------
        public static void Formulario(Form f)
        {
            f.BackColor = Fondo;
            f.ForeColor = Texto;
            f.StartPosition = FormStartPosition.CenterScreen;
            f.WindowState = FormWindowState.Maximized;

            if (Icono is not null) f.Icon = Icono;
        }

        public static void Banda(Panel p) => p.BackColor = Azul;

        public static void TituloBanda(Label l, string texto)
        {
            l.Text = texto;
            l.Font = Titulo;
            l.ForeColor = Color.White;
            l.BackColor = Color.Transparent;
            l.AutoSize = true;
        }

        public static void SubtituloBanda(Label l)
        {
            l.Font = Subtitulo;
            l.ForeColor = AzulClaro;
            l.BackColor = Color.Transparent;
            l.AutoSize = true;
        }

        // ---------- Botones ----------
        public static void Primario(Button b)
        {
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 0;
            b.FlatAppearance.MouseOverBackColor = AzulMedio;
            b.BackColor = Azul;
            b.ForeColor = Color.White;
            b.Font = Boton;
            b.Cursor = Cursors.Hand;
            b.UseVisualStyleBackColor = false;
        }

        public static void Secundario(Button b)
        {
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 1;
            b.FlatAppearance.BorderColor = Azul;
            b.FlatAppearance.MouseOverBackColor = AzulClaro;
            b.BackColor = Superficie;
            b.ForeColor = Azul;
            b.Font = BotonSuave;
            b.Cursor = Cursors.Hand;
            b.UseVisualStyleBackColor = false;
        }

        /// <summary>Boton que va dentro de la banda azul.</summary>
        public static void SobreBanda(Button b)
        {
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 1;
            b.FlatAppearance.BorderColor = Color.White;
            b.FlatAppearance.MouseOverBackColor = AzulMedio;
            b.BackColor = Azul;
            b.ForeColor = Color.White;
            b.Font = BotonSuave;
            b.Cursor = Cursors.Hand;
            b.UseVisualStyleBackColor = false;
        }

        // ---------- Campos ----------
        public static void CampoTexto(Control c)
        {
            c.Font = Campo;
            c.BackColor = Color.White;
            c.ForeColor = Texto;
        }

        public static void EtiquetaCampo(Label l)
        {
            l.Font = Etiqueta;
            l.ForeColor = Texto;
            l.TextAlign = ContentAlignment.MiddleRight;
            l.AutoSize = false;
        }

        // ---------- Grillas ----------
        public static void Grid(DataGridView g)
        {
            g.EnableHeadersVisualStyles = false;

            g.ColumnHeadersDefaultCellStyle.BackColor = Azul;
            g.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;

            // Sin esto, el encabezado de la columna activa se pinta del
            // azul brillante del sistema y desentona con la banda.
            g.ColumnHeadersDefaultCellStyle.SelectionBackColor = Azul;
            g.ColumnHeadersDefaultCellStyle.SelectionForeColor = Color.White;

            g.ColumnHeadersDefaultCellStyle.Font = GrillaEncabezado;
            g.ColumnHeadersDefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleLeft;
            g.ColumnHeadersDefaultCellStyle.Padding = new Padding(6, 0, 0, 0);
            g.ColumnHeadersHeight = 34;
            g.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing;

            g.DefaultCellStyle.Font = Grilla;
            g.DefaultCellStyle.ForeColor = Texto;
            g.DefaultCellStyle.BackColor = Superficie;
            g.DefaultCellStyle.SelectionBackColor = AzulClaro;
            g.DefaultCellStyle.SelectionForeColor = Texto;
            g.DefaultCellStyle.Padding = new Padding(6, 0, 4, 0);

            g.AlternatingRowsDefaultCellStyle.BackColor = FilaAlterna;

            g.BackgroundColor = Fondo;
            g.BorderStyle = BorderStyle.FixedSingle;

            // Cuadricula completa. Antes era SingleHorizontal, que solo
            // pinta las lineas de arriba y abajo: las columnas quedaban
            // sueltas y a simple vista la tabla se veia sin lineas.
            g.CellBorderStyle = DataGridViewCellBorderStyle.Single;
            g.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.Single;
            g.GridColor = LineaGrilla;

            g.RowTemplate.Height = 30;
            g.RowHeadersVisible = false;
            g.AllowUserToAddRows = false;
            g.AllowUserToDeleteRows = false;
            g.AllowUserToOrderColumns = false;
            g.AllowUserToResizeRows = false;
            g.MultiSelect = false;
            g.SelectionMode = DataGridViewSelectionMode.FullRowSelect;

            SinCuadroDeError(g);
        }

        /// <summary>
        /// Quita el cuadro gris que WinForms muestra solo cuando una
        /// celda no se puede formatear o un valor no esta en la lista
        /// ("el valor con formato de la celda tiene un tipo erroneo").
        ///
        /// Ese cuadro no lo puede leer nadie que no sea programador, sale
        /// una vez por celda mala (o sea, decenas de veces seguidas) y
        /// deja la pantalla trabada. En su lugar la falla se anota en la
        /// bitacora con la fila, la columna, el valor y el tipo que se
        /// esperaba, que es justo lo que hace falta para arreglarla.
        /// </summary>
        public static void SinCuadroDeError(DataGridView g)
        {
            g.DataError += (_, e) =>
            {
                // Sin esto WinForms vuelve a lanzar la excepcion y tumba
                // la pantalla.
                e.ThrowException = false;

                string columna = e.ColumnIndex >= 0 && e.ColumnIndex < g.Columns.Count
                    ? g.Columns[e.ColumnIndex].Name
                    : "?";

                object? valor = null;
                Type? esperado = null;

                try
                {
                    var celda = g.Rows[e.RowIndex].Cells[e.ColumnIndex];
                    valor = celda.Value;
                    esperado = celda.FormattedValueType;
                }
                catch { }

                string linea =
                    $"Grilla: fila {e.RowIndex}, columna '{columna}', " +
                    $"valor '{valor ?? "(nulo)"}' ({valor?.GetType().Name ?? "null"}), " +
                    $"se esperaba {esperado?.Name ?? "?"}, contexto {e.Context}";

                // La falla puede venir sin excepcion adjunta. Anotarla
                // igual: lo que interesa es la celda que la provoco.
                if (e.Exception is null) Registro.Anotar(linea);
                else Registro.Anotar(linea, e.Exception);
            };
        }

        public static void GridSoloLectura(DataGridView g)
        {
            Grid(g);
            g.ReadOnly = true;
            g.EditMode = DataGridViewEditMode.EditProgrammatically;
            g.AllowUserToResizeColumns = false;
        }

        /// <summary>
        /// Deja la fila escogida en verde claro en vez del azul de siempre.
        /// Se usa en las pantallas donde se arma una sustitucion: asi se ve
        /// de un vistazo a quien se escogio de cada lado antes de asignar.
        /// Va despues de Grid o GridSoloLectura.
        /// </summary>
        public static void SeleccionVerde(DataGridView g)
        {
            g.DefaultCellStyle.SelectionBackColor = VerdeSeleccion;
            g.DefaultCellStyle.SelectionForeColor = VerdeTexto;
        }

        public static void SinOrdenamiento(DataGridView g)
        {
            foreach (DataGridViewColumn c in g.Columns)
                c.SortMode = DataGridViewColumnSortMode.NotSortable;
        }

        // ---------- Volver al menu ----------
        /// <summary>
        /// Pega un boton al borde derecho de la banda y lo deja ahi
        /// aunque la ventana cambie de tamano.
        ///
        /// El anclaje normal no sirve: cuando el boton se agrega, la
        /// banda todavia no tiene su ancho real, asi que el sistema
        /// calcula mal la distancia al borde y el boton termina en
        /// medio de la banda o fuera de la pantalla. Por eso la
        /// posicion se recalcula a mano cada vez que la banda cambia.
        ///
        /// desplazamiento sirve para poner mas de un boton en fila:
        /// el segundo se corre a la izquierda del primero.
        /// </summary>
        public static void AnclarDerecha(Panel banda, Button boton,
                                         int desplazamiento = 0, int margen = 40)
        {
            boton.Anchor = AnchorStyles.Top | AnchorStyles.Right;

            void Colocar()
            {
                int x = banda.ClientSize.Width - boton.Width - margen - desplazamiento;
                boton.Location = new Point(Math.Max(10, x), (banda.Height - boton.Height) / 2);
            }

            banda.SizeChanged += (_, _) => Colocar();
            Colocar();
        }

        /// <summary>
        /// Boton "Volver al Menu" listo: estilo, tamano, posicion en la
        /// banda y el clic que devuelve al menu principal. Toda pantalla
        /// tiene que tener uno.
        /// </summary>
        public static Button BotonVolverMenu(Form formulario, Panel banda,
                                             int desplazamiento = 0)
        {
            var b = new Button { Text = "Volver al Menu", Size = new Size(170, 40) };

            SobreBanda(b);
            b.Click += (_, _) => VolverAlMenu(formulario);

            banda.Controls.Add(b);
            b.BringToFront();
            AnclarDerecha(banda, b, desplazamiento);

            return b;
        }

        /// <summary>
        /// Abre el archivo recien generado con el programa que le
        /// corresponda. Si el sistema no puede abrirlo, no se interrumpe
        /// nada: el archivo ya quedo guardado igual.
        /// </summary>
        public static void AbrirArchivo(string ruta)
        {
            try
            {
                System.Diagnostics.Process.Start(
                    new System.Diagnostics.ProcessStartInfo(ruta) { UseShellExecute = true });
            }
            catch { }
        }

        /// <summary>
        /// Cierra el formulario y todos los que lo abrieron, hasta
        /// llegar al menu principal.
        ///
        /// Hace falta porque algunas pantallas se abren en cadena
        /// (asistencia abre sustituciones, y sustituciones abre la
        /// verificacion). Sin esto, el boton solo devolvia un paso.
        /// Cada formulario de la cadena conserva su propia pregunta de
        /// cambios sin guardar: si alguno se niega a cerrar, ahi se
        /// queda el usuario.
        /// </summary>
        public static void VolverAlMenu(Form formulario)
        {
            var cadena = new List<Form>();

            for (Form? actual = formulario;
                 actual is not null && actual is not MenuPrincipal;
                 actual = actual.Owner)
            {
                cadena.Add(actual);
            }

            foreach (var f in cadena)
            {
                if (!f.IsDisposed) f.Close();
            }
        }

        // ---------- Abrir otra pantalla ----------
        /// <summary>
        /// Abre una pantalla encima de esta y, al volver, recarga lo que
        /// se le indique.
        ///
        /// Hace falta porque la pantalla de abajo se queda con lo que
        /// leyo al abrirse: si el usuario va a proyeccion, cambia algo y
        /// regresa, la grilla seguiria mostrando lo de antes. Si el
        /// usuario se fue derecho al menu, el formulario de abajo ya va
        /// cerrandose y no se recarga nada.
        /// </summary>
        public static void MostrarHijo(Form padre, Form hijo, Action? alVolver = null)
        {
            using (hijo) hijo.ShowDialog(padre);

            if (alVolver is null) return;
            if (padre.IsDisposed || !padre.Visible) return;

            try { alVolver(); } catch { }
        }

        // ---------- Filtro de texto ----------
        /// <summary>
        /// True si el texto buscado aparece en alguno de los valores.
        /// Ignora mayusculas y tildes para que "jose" encuentre a "José".
        /// Un filtro vacio deja pasar todo.
        /// </summary>
        public static bool Coincide(string? filtro, params object?[] valores)
        {
            if (string.IsNullOrWhiteSpace(filtro)) return true;

            string buscado = Normalizar(filtro);

            foreach (var v in valores)
            {
                string texto = v?.ToString() ?? "";
                if (texto.Length > 0 && Normalizar(texto).Contains(buscado)) return true;
            }
            return false;
        }

        private static string Normalizar(string texto)
        {
            var sb = new System.Text.StringBuilder(texto.Length);

            foreach (char c in texto.Trim().ToLowerInvariant()
                                    .Normalize(System.Text.NormalizationForm.FormD))
            {
                if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
                    != System.Globalization.UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            }
            return sb.ToString();
        }

        public static void PieDePagina(Label l)
        {
            l.Font = Subtitulo;
            l.ForeColor = TextoSuave;
            l.BackColor = Color.Transparent;
            l.TextAlign = ContentAlignment.MiddleLeft;
            l.Padding = new Padding(20, 0, 0, 0);
        }

        // ===============================================================
        // AUTOCOMPLETADO DE LAS CAJAS DE BUSQUEDA
        // ===============================================================
        /// <summary>
        /// Le pone autocompletado a una caja de busqueda: segun se
        /// escribe, aparece debajo una lista con lo que coincide, y al
        /// escoger una se hace la busqueda.
        ///
        /// No se usa el autocompletado que trae Windows a proposito. Ese
        /// solo halla por el principio del texto: escribiendo "Perez" no
        /// encontraria a "Juan Perez". El buscador del sistema halla por
        /// cualquier pedazo, y si la lista se comportara distinto, la
        /// misma caja estaria haciendo dos cosas diferentes.
        ///
        /// <paramref name="opciones"/> se pide en cada tecla, no se
        /// guarda: asi la lista siempre sale de lo que la pantalla tenga
        /// cargado en ese momento, sin que haya que avisarle cuando
        /// recarga.
        ///
        /// <paramref name="alBuscar"/> es lo que la pantalla hace al
        /// presionar Enter. Se le pasa aqui porque con la lista abierta
        /// el Enter escoge, y solo con la lista cerrada busca; si cada
        /// pantalla manejara su propio Enter, las dos cosas chocarian.
        /// </summary>
        public static void Autocompletar(TextBox caja,
                                         Func<IEnumerable<string?>> opciones,
                                         Action alBuscar,
                                         int maximo = 8)
        {
            var lista = new ListBox
            {
                Visible = false,
                Font = Campo,
                BorderStyle = BorderStyle.FixedSingle,
                BackColor = Color.White,
                ForeColor = Texto,
                IntegralHeight = false
            };

            bool poniendoTexto = false;

            caja.TextChanged += (_, _) => { if (!poniendoTexto) Refrescar(); };
            caja.KeyDown += Teclado;
            caja.Leave += (_, _) => { if (!ElRatonEstaEnLaLista()) Cerrar(); };
            caja.Disposed += (_, _) => lista.Dispose();

            lista.Click += (_, _) => Escoger();
            lista.KeyDown += (_, e) =>
            { if (e.KeyCode == Keys.Enter) { Escoger(); e.Handled = true; } };

            // -----------------------------------------------------------
            void Refrescar()
            {
                string texto = caja.Text.Trim();
                if (texto.Length == 0) { Cerrar(); return; }

                var hallados = opciones()
                    .Where(o => !string.IsNullOrWhiteSpace(o))
                    .Select(o => o!.Trim())
                    .Distinct(StringComparer.CurrentCultureIgnoreCase)
                    .Where(o => Coincide(texto, o))
                    // Las que empiezan por lo escrito van de primeras: es
                    // lo que la persona esta buscando casi siempre.
                    .OrderByDescending(o => Normalizar(o).StartsWith(Normalizar(texto)))
                    .ThenBy(o => o, StringComparer.CurrentCultureIgnoreCase)
                    .Take(maximo)
                    .ToArray();

                // Una sola opcion que ya es lo escrito no aporta nada.
                if (hallados.Length == 0 ||
                    (hallados.Length == 1 &&
                     string.Equals(hallados[0], texto, StringComparison.CurrentCultureIgnoreCase)))
                { Cerrar(); return; }

                lista.BeginUpdate();
                lista.Items.Clear();
                lista.Items.AddRange(hallados);
                lista.EndUpdate();

                Colocar(hallados.Length);
            }

            void Colocar(int cuantos)
            {
                var form = caja.FindForm();
                if (form is null || caja.Parent is null) return;

                if (lista.Parent != form)
                {
                    lista.Parent?.Controls.Remove(lista);
                    form.Controls.Add(lista);
                }

                // La caja puede estar dentro de varios paneles, asi que
                // su posicion se traduce a coordenadas del formulario.
                Point abajo = form.PointToClient(
                    caja.Parent.PointToScreen(new Point(caja.Left, caja.Bottom)));

                int alto = Math.Min(cuantos, maximo) * lista.ItemHeight + 4;

                lista.SetBounds(abajo.X, abajo.Y + 1, caja.Width, alto);
                lista.Visible = true;
                lista.BringToFront();
            }

            void Cerrar()
            {
                lista.Visible = false;
                lista.SelectedIndex = -1;
            }

            void Escoger()
            {
                if (lista.SelectedItem is not string escogido) return;

                poniendoTexto = true;
                try
                {
                    caja.Text = escogido;
                    caja.SelectionStart = caja.Text.Length;
                }
                finally { poniendoTexto = false; }

                Cerrar();
                caja.Focus();
                alBuscar();
            }

            void Teclado(object? sender, KeyEventArgs e)
            {
                if (!lista.Visible)
                {
                    // Sin lista abierta, Enter es lo de siempre: buscar.
                    if (e.KeyCode == Keys.Enter)
                    {
                        Cerrar();
                        alBuscar();
                        e.SuppressKeyPress = true;
                    }
                    return;
                }

                switch (e.KeyCode)
                {
                    case Keys.Down:
                        Mover(1);
                        e.SuppressKeyPress = true;
                        break;

                    case Keys.Up:
                        Mover(-1);
                        e.SuppressKeyPress = true;
                        break;

                    case Keys.Enter:
                        // Con algo escogido de la lista, Enter la toma.
                        // Sin nada escogido, busca lo que este escrito.
                        if (lista.SelectedIndex >= 0) Escoger();
                        else { Cerrar(); alBuscar(); }
                        e.SuppressKeyPress = true;
                        break;

                    case Keys.Escape:
                        Cerrar();
                        e.SuppressKeyPress = true;
                        break;

                    case Keys.Tab:
                        Cerrar();
                        break;
                }
            }

            void Mover(int paso)
            {
                if (lista.Items.Count == 0) return;

                int i = lista.SelectedIndex + paso;
                if (i < 0) i = lista.Items.Count - 1;
                if (i >= lista.Items.Count) i = 0;

                lista.SelectedIndex = i;
            }

            bool ElRatonEstaEnLaLista()
            {
                // Al hacer clic en la lista, la caja pierde el foco antes
                // de que llegue el clic. Sin esta comprobacion la lista se
                // cerraria justo antes de que se pueda escoger nada.
                if (!lista.Visible || lista.Parent is null) return false;

                return lista.Bounds.Contains(lista.Parent.PointToClient(Cursor.Position));
            }
        }
    }
}
