using System.Data;

namespace formularios
{
    /// <summary>
    /// La caja de busqueda que llevan las pantallas con lista: escribir,
    /// Buscar y Ver todo, con la lista de sugerencias que va apareciendo
    /// debajo segun se escribe.
    ///
    /// Esta aparte porque son ya nueve pantallas con lo mismo. Antes cada
    /// una armaba sus tres controles a mano y los conectaba a su manera,
    /// y por eso unas tenian sugerencias y otras no. Con esto se pone en
    /// una linea y todas se comportan igual.
    ///
    /// El filtro es de vista, no de datos: esconde lo que no coincide,
    /// no borra nada ni cambia lo que se guarda.
    /// </summary>
    public sealed class Buscador
    {
        public TextBox Caja { get; } = new();
        public Button BtnBuscar { get; } = new();
        public Button BtnVerTodo { get; } = new();

        /// <summary>Lo que hay escrito.</summary>
        public string Texto => Caja.Text;

        public bool HayFiltro => Caja.Text.Trim().Length > 0;

        /// <summary>Para ponerlo en el titulo de la lista: ' filtrando por "x"'.</summary>
        public string Coletilla =>
            HayFiltro ? $"   -   filtrando por \"{Caja.Text.Trim()}\"" : "";

        private Buscador() { }

        /// <summary>Lo que ocupa de ancho, para acomodar lo que va al lado.</summary>
        public static int AnchoTotal(int anchoCaja = 260) => anchoCaja + 240;

        /// <summary>
        /// Arma la caja y sus dos botones dentro de un panel, ya
        /// conectados.
        /// </summary>
        /// <param name="aviso">El texto gris de adentro: dice que se puede buscar.</param>
        /// <param name="opciones">De donde salen las sugerencias. Se pide en cada tecla.</param>
        /// <param name="alBuscar">Lo que hace la pantalla cuando se busca.</param>
        public static Buscador Poner(Control padre, int x, int y, string aviso,
                                     Func<IEnumerable<string?>> opciones,
                                     Action alBuscar, int anchoCaja = 260)
        {
            var b = new Buscador();

            Estilo.CampoTexto(b.Caja);
            b.Caja.SetBounds(x, y, anchoCaja, 28);
            b.Caja.PlaceholderText = aviso;

            // El Enter lo maneja Autocompletar: con la lista de
            // sugerencias abierta escoge, y con la lista cerrada busca.
            // Si la pantalla lo conectara por su cuenta, las dos cosas
            // chocarian.
            Estilo.Autocompletar(b.Caja, opciones, alBuscar);

            Estilo.Primario(b.BtnBuscar);
            b.BtnBuscar.Text = "Buscar";
            b.BtnBuscar.SetBounds(x + anchoCaja + 10, y - 2, 110, 32);
            b.BtnBuscar.Click += (_, _) => alBuscar();

            Estilo.Secundario(b.BtnVerTodo);
            b.BtnVerTodo.Text = "Ver todo";
            b.BtnVerTodo.SetBounds(x + anchoCaja + 130, y - 2, 110, 32);
            b.BtnVerTodo.Click += (_, _) => { b.Caja.Clear(); alBuscar(); };

            padre.Controls.AddRange(new Control[] { b.Caja, b.BtnBuscar, b.BtnVerTodo });

            return b;
        }

        public void Limpiar() => Caja.Clear();

        // =============================================================
        // FILTRAR
        // =============================================================
        /// <summary>
        /// Las filas de la tabla que traen el texto buscado, en una tabla
        /// nueva. Sin filtro devuelve la misma tabla, sin copiar nada.
        ///
        /// Sin decirle columnas busca en todas, que es lo que espera
        /// quien escribe: no tiene por que saber en cual columna cae lo
        /// que esta buscando.
        /// </summary>
        public static DataTable Filtrar(DataTable? tabla, string? filtro,
                                        params string[] columnas)
        {
            if (tabla is null) return new DataTable();
            if (string.IsNullOrWhiteSpace(filtro)) return tabla;

            var copia = tabla.Clone();

            foreach (DataRow r in tabla.Rows)
                if (Estilo.Coincide(filtro, Valores(r, columnas)))
                    copia.ImportRow(r);

            return copia;
        }

        private static object?[] Valores(DataRow r, string[] columnas)
        {
            var crudos = columnas.Length == 0
                ? r.ItemArray
                : columnas.Where(c => r.Table.Columns.Contains(c))
                          .Select(c => r[c])
                          .ToArray();

            return crudos.Select(ComoTexto).Cast<object?>().ToArray();
        }

        /// <summary>
        /// El valor de una celda, como texto para buscar dentro de el.
        ///
        /// Las fechas van escritas de las dos maneras en que la gente las
        /// escribe: 03/08/2026 y 3/8/2026. Dejandolas con el ToString de
        /// siempre, buscar "08/2026" no hallaba el 3 de agosto, porque el
        /// sistema lo escribe "3/8/2026 0:00:00"; y al reves tampoco.
        ///
        /// Las casillas de si/no no son texto: nadie busca "True".
        /// </summary>
        private static string ComoTexto(object? v) => v switch
        {
            null => "",
            DBNull => "",
            bool => "",
            DateTime d => $"{d:dd/MM/yyyy} {d:d/M/yyyy}",
            _ => v.ToString() ?? ""
        };

        /// <summary>
        /// Los textos que puede sugerir la lista de una tabla.
        ///
        /// Solo de las columnas de texto: sugerir numeros y fechas
        /// llenaria la lista de "3", "12" y "01/08/2026", que nadie
        /// escribe para buscar. El filtro si los mira, asi que escribir
        /// una fecha sigue funcionando; lo unico que no hace es
        /// proponerla.
        /// </summary>
        public static IEnumerable<string?> Opciones(DataTable? tabla,
                                                    params string[] columnas)
        {
            if (tabla is null) yield break;

            foreach (DataColumn c in tabla.Columns)
            {
                if (c.DataType != typeof(string)) continue;
                if (columnas.Length > 0 && !columnas.Contains(c.ColumnName)) continue;

                foreach (DataRow r in tabla.Rows)
                    if (r[c] is string s && s.Trim().Length > 0)
                        yield return s;
            }
        }

        /// <summary>
        /// Esconde las filas que no traen el texto buscado, para las
        /// grillas que se llenan a mano y no tienen tabla detras.
        /// Devuelve cuantas quedaron a la vista.
        /// </summary>
        public static int Esconder(DataGridView g, string? filtro,
                                   params string[] columnas)
        {
            // La fila donde esta parado el cursor no se puede esconder:
            // Windows lo rechaza. Se suelta primero y despues se vuelve a
            // parar en la primera que quede a la vista.
            g.CurrentCell = null;

            bool sinFiltro = string.IsNullOrWhiteSpace(filtro);
            int visibles = 0;
            DataGridViewRow? primera = null;

            foreach (DataGridViewRow f in g.Rows)
            {
                bool pasa = sinFiltro || Estilo.Coincide(filtro, Celdas(f, columnas));

                f.Visible = pasa;
                if (!pasa) continue;

                visibles++;
                primera ??= f;
            }

            if (primera is not null)
            {
                var celda = primera.Cells.Cast<DataGridViewCell>()
                                         .FirstOrDefault(c => c.Visible);
                if (celda is not null) g.CurrentCell = celda;
            }

            return visibles;
        }

        private static object?[] Celdas(DataGridViewRow f, string[] columnas) =>
            Crudos(f, columnas).Select(ComoTexto).Cast<object?>().ToArray();

        private static object?[] Crudos(DataGridViewRow f, string[] columnas)
        {
            var g = f.DataGridView;

            if (g is null || columnas.Length == 0)
                return f.Cells.Cast<DataGridViewCell>().Select(c => c.Value).ToArray();

            return columnas.Where(c => g.Columns.Contains(c))
                           .Select(c => f.Cells[c].Value)
                           .ToArray();
        }

        /// <summary>
        /// Lo que puede sugerir una grilla llena a mano: el texto de esas
        /// columnas, fila por fila.
        /// </summary>
        public static IEnumerable<string?> Opciones(DataGridView g,
                                                    params string[] columnas)
        {
            // De los valores tal cual, no de los ya vueltos texto: asi
            // solo se sugiere lo que de verdad es texto, y no fechas ni
            // casillas de si/no.
            foreach (DataGridViewRow f in g.Rows)
                foreach (var v in Crudos(f, columnas))
                    if (v is string s && s.Trim().Length > 0)
                        yield return s;
        }
    }
}
