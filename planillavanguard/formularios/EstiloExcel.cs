using ClosedXML.Excel;   // NuGet: ClosedXML

namespace formularios
{
    /// <summary>
    /// El aspecto de todos los Excel que salen del sistema, en un solo
    /// lugar. Si hay que cambiar un color o el grosor de una linea, se
    /// cambia aqui y los reportes quedan parejos.
    ///
    /// La idea es que los cuadros se lean como una tabla impresa: linea
    /// fina por dentro, marco grueso por fuera, y una linea mas marcada
    /// debajo del encabezado y despues de la primera columna.
    /// </summary>
    public static class EstiloExcel
    {
        // ---------- Colores ----------
        /// <summary>El azul de la marca. Es tambien el fondo del logo.</summary>
        public static readonly XLColor Azul = XLColor.FromHtml("#112C41");
        public static readonly XLColor AzulMedio = XLColor.FromHtml("#2A5B80");
        public static readonly XLColor AzulSuave = XLColor.FromHtml("#D6E2EC");

        /// <summary>Fondo de la primera columna, la que lleva el rotulo.</summary>
        public static readonly XLColor Rotulo = XLColor.FromHtml("#E4EBF2");

        /// <summary>Franja de las filas alternas. Suave, pero que se note al imprimir.</summary>
        public static readonly XLColor Franja = XLColor.FromHtml("#EDF3F8");

        /// <summary>Lineas de adentro del cuadro. Tienen que verse en papel.</summary>
        public static readonly XLColor Linea = XLColor.FromHtml("#9CB0C0");
        public static readonly XLColor Texto = XLColor.FromHtml("#262A2E");
        public static readonly XLColor TextoSuave = XLColor.FromHtml("#6B7580");

        public static readonly XLColor RojoFondo = XLColor.FromHtml("#F8D7DA");
        public static readonly XLColor RojoTexto = XLColor.FromHtml("#842029");
        public static readonly XLColor AmbarFondo = XLColor.FromHtml("#FFF3CD");
        public static readonly XLColor AmbarTexto = XLColor.FromHtml("#7A5200");
        public static readonly XLColor VerdeFondo = XLColor.FromHtml("#D6ECDE");
        public static readonly XLColor VerdeTexto = XLColor.FromHtml("#0F5132");
        public static readonly XLColor LilaFondo = XLColor.FromHtml("#DEE4F1");
        public static readonly XLColor LilaTexto = XLColor.FromHtml("#34426A");

        public const string Fuente = "Segoe UI";

        // =============================================================
        // BANNER
        // =============================================================
        /// <summary>
        /// El logo dentro de la banda: donde empieza, cuanto mide y
        /// hasta donde llega. Lo usa tambien <see cref="AcomodarTitulo"/>
        /// para no dejar que el titulo se le meta debajo.
        ///
        /// El alto sale de la proporcion de logo.png (477 x 215): puesto
        /// a ojo quedaba estirado a lo alto como un cinco por ciento, que
        /// en un logo se nota aunque no se sepa por que.
        /// </summary>
        private const int LOGO_MARGEN = 16;
        private const int LOGO_ANCHO = 140;
        private const int LOGO_ALTO = 63;
        private const int LOGO_DERECHA = LOGO_MARGEN + LOGO_ANCHO + 10;

        /// <summary>
        /// Cabecera de la marca mas los titulos del reporte. Devuelve la
        /// primera fila libre, para que el reporte siga desde ahi.
        ///
        /// El logo va flotando sobre la banda; como el fondo de la
        /// imagen es el mismo azul, no se nota el recorte.
        /// </summary>
        public static int Banner(IXLWorksheet ws, int cols, string titulo,
                                 string? subtitulo = null, string? fechas = null,
                                 string? nota = null)
        {
            // Cuatro columnas es el minimo para que la banda sea al menos
            // tan ancha como el logo que lleva encima. En una hoja de dos
            // columnas la banda sobresale un poco de la tabla; se prefiere
            // eso a un logo colgando fuera de la banda.
            if (cols < 4) cols = 4;

            // ---- Bloque de marca ----
            // El logo ya dice VANGUARD, asi que aqui no se repite: el
            // espacio se aprovecha para el nombre del reporte, que es lo
            // que uno busca cuando tiene diez papeles encima.
            ws.Range(1, 1, 4, cols).Merge();
            var marca = ws.Cell(1, 1);
            marca.Value = titulo.ToUpperInvariant();
            marca.Style.Fill.BackgroundColor = Azul;
            marca.Style.Font.FontColor = XLColor.White;
            marca.Style.Font.FontSize = 21;
            marca.Style.Font.Bold = true;
            marca.Style.Font.FontName = Fuente;
            marca.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            marca.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            marca.Style.Alignment.WrapText = true;

            for (int f = 1; f <= 4; f++) ws.Row(f).Height = 21;

            try
            {
                using var flujo = Estilo.LogoCrudo();
                if (flujo is not null)
                    ws.AddPicture(flujo)
                      .MoveTo(ws.Cell(1, 1), LOGO_MARGEN, 9)
                      .WithSize(LOGO_ANCHO, LOGO_ALTO);
            }
            catch { }

            // ---- Filete de acento ----
            ws.Range(5, 1, 5, cols).Merge();
            ws.Cell(5, 1).Style.Fill.BackgroundColor = AzulMedio;
            ws.Row(5).Height = 5;

            int fila = 6;

            if (!string.IsNullOrWhiteSpace(subtitulo))
            {
                ws.Range(fila, 1, fila, cols).Merge();
                var s = ws.Cell(fila, 1);
                s.Value = subtitulo;
                s.Style.Fill.BackgroundColor = AzulMedio;
                s.Style.Font.FontColor = XLColor.White;
                s.Style.Font.FontSize = 10.5;
                s.Style.Font.Bold = true;
                s.Style.Font.FontName = Fuente;
                s.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                s.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                ws.Row(fila).Height = 21;
                fila++;
            }

            if (!string.IsNullOrWhiteSpace(fechas))
            {
                ws.Range(fila, 1, fila, cols).Merge();
                var d = ws.Cell(fila, 1);
                d.Value = fechas;
                d.Style.Font.FontSize = 11.5;
                d.Style.Font.Bold = true;
                d.Style.Font.FontName = Fuente;
                d.Style.Font.FontColor = Azul;
                d.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                ws.Row(fila).Height = 18;
                fila++;
            }

            if (!string.IsNullOrWhiteSpace(nota))
            {
                ws.Range(fila, 1, fila, cols).Merge();
                var n = ws.Cell(fila, 1);
                n.Value = nota;
                n.Style.Font.FontSize = 9;
                n.Style.Font.Italic = true;
                n.Style.Font.FontName = Fuente;
                n.Style.Font.FontColor = TextoSuave;
                n.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                ws.Row(fila).Height = 14;
                fila++;
            }

            // Aire antes de la tabla
            ws.Row(fila).Height = 9;
            return fila + 1;
        }

        // =============================================================
        // TABLA
        // =============================================================
        /// <summary>Pinta la fila de encabezados de una tabla.</summary>
        public static void Encabezado(IXLWorksheet ws, int fila, int cols, double alto = 30)
        {
            var r = ws.Range(fila, 1, fila, cols);
            r.Style.Fill.BackgroundColor = Azul;
            r.Style.Font.FontColor = XLColor.White;
            r.Style.Font.Bold = true;
            r.Style.Font.FontSize = 10;
            r.Style.Font.FontName = Fuente;
            r.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            r.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            r.Style.Alignment.WrapText = true;
            ws.Row(fila).Height = alto;
        }

        /// <summary>
        /// Las lineas del cuadro. Es lo que hace que se vea como una
        /// tabla y no como texto suelto:
        ///
        ///   - linea fina gris entre todas las celdas
        ///   - marco grueso azul alrededor
        ///   - linea gruesa debajo del encabezado
        ///   - linea gruesa despues de la columna de rotulos
        /// </summary>
        public static void Lineas(IXLWorksheet ws, int filaEncabezado, int ultimaFila,
                                  int cols, int columnasDeRotulo = 1)
        {
            if (ultimaFila < filaEncabezado) return;

            var todo = ws.Range(filaEncabezado, 1, ultimaFila, cols);

            todo.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            todo.Style.Border.InsideBorderColor = Linea;
            todo.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
            todo.Style.Border.OutsideBorderColor = Azul;

            // Debajo del encabezado
            ws.Range(filaEncabezado, 1, filaEncabezado, cols)
              .Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            ws.Range(filaEncabezado, 1, filaEncabezado, cols)
              .Style.Border.BottomBorderColor = Azul;

            // Despues de la columna de rotulos
            if (columnasDeRotulo > 0 && columnasDeRotulo < cols)
            {
                var col = ws.Range(filaEncabezado, columnasDeRotulo, ultimaFila, columnasDeRotulo);
                col.Style.Border.RightBorder = XLBorderStyleValues.Medium;
                col.Style.Border.RightBorderColor = Azul;
            }
        }

        /// <summary>
        /// Franja suave en las filas pares. Se aplica a la fila entera,
        /// nunca celda por celda: si se mezcla con los colores de estado
        /// el cuadro queda con parches y se ve sucio.
        /// </summary>
        public static void Franjas(IXLWorksheet ws, int primera, int ultima, int cols)
        {
            for (int f = primera; f <= ultima; f++)
                if ((f - primera) % 2 == 1)
                    ws.Range(f, 1, f, cols).Style.Fill.BackgroundColor = Franja;
        }

        /// <summary>Estilo de la primera columna, la de los rotulos.</summary>
        public static void ColumnaRotulo(IXLWorksheet ws, int primera, int ultima, int col = 1)
        {
            var r = ws.Range(primera, col, ultima, col);
            r.Style.Fill.BackgroundColor = Rotulo;
            r.Style.Font.Bold = true;
            r.Style.Font.FontName = Fuente;
            r.Style.Font.FontColor = Azul;
            r.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            r.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            r.Style.Alignment.Indent = 1;
        }

        /// <summary>Aspecto de una celda de datos normal.</summary>
        public static void Celda(IXLCell c, bool centrado = true)
        {
            c.Style.Font.FontName = Fuente;
            c.Style.Font.FontSize = 10;
            c.Style.Font.FontColor = Texto;
            c.Style.Alignment.WrapText = true;
            c.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            c.Style.Alignment.Horizontal = centrado
                ? XLAlignmentHorizontalValues.Center
                : XLAlignmentHorizontalValues.Left;
        }

        /// <summary>Pinta una celda con uno de los colores de estado.</summary>
        public static void Pintar(IXLCell c, XLColor fondo, XLColor texto)
        {
            c.Style.Fill.BackgroundColor = fondo;
            c.Style.Font.FontColor = texto;
        }

        // =============================================================
        // LEYENDA Y PIE
        // =============================================================
        /// <summary>
        /// Caja de leyenda con su marco. Cada entrada ocupa dos columnas
        /// combinadas para que el texto no se derrame sobre la de al
        /// lado. Devuelve la primera fila libre.
        /// </summary>
        public static int Leyenda(IXLWorksheet ws, int fila, int cols,
                                  IEnumerable<(string Texto, XLColor? Fondo, XLColor? Letra)> entradas)
        {
            var lista = entradas.ToList();
            if (lista.Count == 0) return fila;

            int ancho = Math.Max(2, Math.Min(4, cols));

            ws.Range(fila, 1, fila, ancho).Merge();
            var tit = ws.Cell(fila, 1);
            tit.Value = "COMO LEER EL CUADRO";
            tit.Style.Fill.BackgroundColor = Azul;
            tit.Style.Font.FontColor = XLColor.White;
            tit.Style.Font.Bold = true;
            tit.Style.Font.FontSize = 9.5;
            tit.Style.Font.FontName = Fuente;
            tit.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Row(fila).Height = 18;

            int f = fila + 1;

            foreach (var (texto, fondo, letra) in lista)
            {
                ws.Range(f, 1, f, ancho).Merge();
                var c = ws.Cell(f, 1);
                c.Value = "   " + texto;
                c.Style.Font.FontSize = 9.5;
                c.Style.Font.FontName = Fuente;
                c.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

                if (fondo is not null) c.Style.Fill.BackgroundColor = fondo;
                c.Style.Font.FontColor = letra ?? Texto;

                ws.Row(f).Height = 17;
                f++;
            }

            var caja = ws.Range(fila, 1, f - 1, ancho);
            caja.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
            caja.Style.Border.OutsideBorderColor = Azul;
            caja.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            caja.Style.Border.InsideBorderColor = Linea;

            return f + 1;
        }

        /// <summary>Linea de pie con la hora de generacion.</summary>
        public static void Pie(IXLWorksheet ws, int fila, int cols, string? extra = null)
        {
            ws.Range(fila, 1, fila, cols).Merge();
            var c = ws.Cell(fila, 1);
            c.Value = $"Generado el {DateTime.Now:dd/MM/yyyy 'a las' HH:mm}" +
                      (string.IsNullOrWhiteSpace(extra) ? "" : "  ·  " + extra) +
                      "  ·  Sistema PlanillaVanguard";
            c.Style.Font.FontSize = 8.5;
            c.Style.Font.Italic = true;
            c.Style.Font.FontName = Fuente;
            c.Style.Font.FontColor = TextoSuave;
            c.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        // =============================================================
        // ROTULOS QUE NO CABEN
        // =============================================================
        /// <summary>
        /// Deja legible todo rotulo combinado cuyo texto no quepa en el
        /// ancho de las columnas que abarca: lo ajusta en varias lineas y
        /// hace crecer la fila lo necesario.
        ///
        /// Hace falta porque un texto en celdas combinadas no se derrama
        /// sobre la de al lado como haria en una celda suelta: lo que no
        /// cabe simplemente no se ve. Se notaba en las hojas angostas --
        /// una proyeccion de un solo dia tiene dos columnas -- donde la
        /// leyenda "Amarillo = lo cubre otro oficial" salia cortada a
        /// media frase, y en la hoja de puestos sin cubrir cuando estaba
        /// vacia, donde ni el subtitulo se alcanzaba a leer.
        ///
        /// Y hace falta hacerlo a mano porque Excel no ajusta solo el
        /// alto de una fila con celdas combinadas: esa es la unica cosa
        /// que su autoajuste no sabe hacer.
        ///
        /// Solo crece filas, nunca las encoge: una hoja que ya estaba
        /// bien se queda igual.
        /// </summary>
        /// <summary>
        /// Corre el titulo de la banda cuando el logo se le montaria
        /// encima.
        ///
        /// El titulo va centrado en toda la banda, y el logo pegado a la
        /// izquierda. En una hoja ancha no se tocan, pero en una angosta
        /// -- el resumen del personal, la hoja de tardias, una proyeccion
        /// de un solo dia -- el centro cae dentro del logo y el nombre
        /// del reporte quedaba escrito debajo de el.
        ///
        /// Cuando eso pasa, el titulo pasa a empezar donde termina el
        /// logo. Donde si hay campo no se toca nada: sigue centrado como
        /// siempre.
        /// </summary>
        public static void AcomodarTitulo(IXLWorksheet ws)
        {
            var banda = ws.MergedRanges.FirstOrDefault(
                r => r.RangeAddress.FirstAddress.RowNumber == 1 &&
                     r.RangeAddress.FirstAddress.ColumnNumber == 1);

            if (banda is null) return;

            var celda = banda.FirstCell();
            string titulo = celda.GetString();
            if (titulo.Trim().Length == 0) return;
            if (celda.Style.Alignment.Horizontal != XLAlignmentHorizontalValues.Center) return;

            double px = 0;
            for (int c = banda.RangeAddress.FirstAddress.ColumnNumber;
                 c <= banda.RangeAddress.LastAddress.ColumnNumber; c++)
                px += ws.Column(c).Width * 7 + 5;

            double tamano = celda.Style.Font.FontSize;
            if (tamano < 1) tamano = 21;

            // Ancho aproximado del titulo en pantalla, en negrita.
            double anchoTitulo = titulo.Length * tamano * 0.57;
            double empieza = (px - anchoTitulo) / 2;

            if (empieza >= LOGO_DERECHA) return;

            celda.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

            // La sangria de Excel se cuenta en letras del tamano normal,
            // que rondan los siete pixeles.
            celda.Style.Alignment.Indent = (int)Math.Ceiling(LOGO_DERECHA / 7.0);
        }

        /// <summary>
        /// Hace crecer la fila de titulos cuando alguno no cabe en el
        /// ancho de su columna.
        ///
        /// Los titulos van con ajuste de texto pero con el alto de la
        /// fila clavado, asi que un titulo que necesitaba tres renglones
        /// -- "Vence portacion", "Cedula sustituto" en una columna
        /// angosta -- se leia a medias.
        ///
        /// Solo crece, nunca encoge: una fila que ya estaba bien se
        /// queda como estaba.
        /// </summary>
        public static void AcomodarEncabezado(IXLWorksheet ws, int fila)
        {
            var usada = ws.Row(fila).LastCellUsed();
            if (usada is null) return;

            double alto = ws.Row(fila).Height;
            double necesario = alto;

            for (int c = 1; c <= usada.Address.ColumnNumber; c++)
            {
                var celda = ws.Cell(fila, c);
                string texto = celda.GetString();
                if (texto.Trim().Length == 0) continue;

                double ancho = ws.Column(c).Width;
                if (ancho < 1) continue;

                double tamano = celda.Style.Font.FontSize;
                if (tamano < 1) tamano = 11;

                double caben = ancho * (11.0 / tamano) * 0.95;
                int lineas = (int)Math.Ceiling(texto.Length / caben);
                if (lineas <= 1) continue;
                if (lineas > 3) lineas = 3;

                necesario = Math.Max(necesario, tamano * 1.45 * lineas + 6);
            }

            if (necesario > alto) ws.Row(fila).Height = necesario;
        }

        public static void AcomodarRotulos(IXLWorksheet ws)
        {
            foreach (var rango in ws.MergedRanges.ToList())
            {
                var celda = rango.FirstCell();
                string texto = celda.GetString();
                if (texto.Trim().Length == 0) continue;

                int fila = rango.RangeAddress.FirstAddress.RowNumber;
                int desde = rango.RangeAddress.FirstAddress.ColumnNumber;
                int hasta = rango.RangeAddress.LastAddress.ColumnNumber;

                double ancho = 0;
                for (int c = desde; c <= hasta; c++) ancho += ws.Column(c).Width;
                if (ancho < 1) continue;

                double tamano = celda.Style.Font.FontSize;
                if (tamano < 1) tamano = 11;

                // El ancho de columna se mide en letras del tamano
                // normal, asi que con una letra mas pequena caben mas.
                //
                // El 0.95 es margen a proposito: la cuenta sale de un
                // ancho promedio de letra, y una frase con muchas emes y
                // aes ocupa mas de lo que dice la cuenta. Ajustar de mas
                // un rotulo que iba a caber raspando no cuesta nada;
                // cortarle el final a una frase, si.
                double caben = ancho * (11.0 / tamano) * 0.95;
                int lineas = (int)Math.Ceiling(texto.Length / caben);

                if (lineas <= 1) continue;
                if (lineas > 4) lineas = 4;

                celda.Style.Alignment.WrapText = true;
                ws.Row(fila).Height = Math.Max(ws.Row(fila).Height, tamano * 1.45 * lineas);
            }
        }

        // =============================================================
        // IMPRESION
        // =============================================================
        /// <summary>
        /// Deja la hoja lista para imprimir: apaisada, ajustada al ancho
        /// de la pagina y repitiendo el encabezado en cada hoja. Se
        /// apagan las lineas de cuadricula de Excel para que solo se
        /// vean las del cuadro.
        /// </summary>
        /// <param name="paginasAncho">
        /// En cuantas paginas de ancho cabe la hoja. Uno es lo normal:
        /// el cuadro se encoge hasta caber en una. Cero es "las que
        /// haga falta", y sirve para los cuadros muy anchos -- una
        /// proyeccion de un mes tiene una columna por dia -- donde
        /// obligarlos a una sola pagina los deja tan chiquitos que no se
        /// pueden leer. En ese caso se repite la primera columna en cada
        /// pagina, para no perder de vista de que fila se trata.
        /// </param>
        public static void Impresion(IXLWorksheet ws, int filaEncabezado,
                                     int columnasFijas = 1, bool apaisado = true,
                                     int paginasAncho = 1)
        {
            // Se aprovecha que esto es lo ultimo que hace toda hoja, y
            // que para entonces las columnas ya tienen su ancho de
            // verdad: es el unico momento en que se puede saber si un
            // rotulo cabe o no, o si el titulo choca con el logo.
            AcomodarRotulos(ws);
            AcomodarTitulo(ws);
            if (filaEncabezado > 0) AcomodarEncabezado(ws, filaEncabezado);

            // Una hoja sin fila de encabezado -- el resumen del personal
            // es una lista de cajas, no una tabla -- no tiene nada que
            // congelar ni que repetir arriba de cada pagina.
            if (filaEncabezado > 0)
            {
                ws.SheetView.FreezeRows(filaEncabezado);
                ws.PageSetup.SetRowsToRepeatAtTop(filaEncabezado, filaEncabezado);
            }

            if (columnasFijas > 0) ws.SheetView.FreezeColumns(columnasFijas);

            ws.ShowGridLines = false;

            ws.PageSetup.PageOrientation = apaisado
                ? XLPageOrientation.Landscape : XLPageOrientation.Portrait;
            ws.PageSetup.FitToPages(paginasAncho, 0);

            if (paginasAncho != 1 && columnasFijas > 0)
                ws.PageSetup.SetColumnsToRepeatAtLeft(1, columnasFijas);
            ws.PageSetup.CenterHorizontally = true;
            ws.PageSetup.Margins.Left = 0.25;
            ws.PageSetup.Margins.Right = 0.25;
            ws.PageSetup.Margins.Top = 0.4;
            ws.PageSetup.Margins.Bottom = 0.4;
        }
    }
}
