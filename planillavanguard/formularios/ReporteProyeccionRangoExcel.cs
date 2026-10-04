using System.Globalization;
using ClosedXML.Excel;   // NuGet: ClosedXML
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Excel de la proyeccion de varios dias. Trae dos vistas del mismo
    /// plan, cada una en su hoja:
    ///
    ///   1. Una hoja por horario con el ROL, igual al cuaderno de la
    ///      base: filas numeradas, una columna por dia, el nombre de
    ///      quien entra, y al pie el bloque de los que libran.
    ///
    ///   2. Una hoja POR PUESTO, con el cuadro de puestos contra dias.
    ///
    /// En las dos, las casillas llevan SOLO el nombre. Sin cedulas, sin
    /// codigos: es el papel que se pega en la garita.
    /// </summary>
    public static class ReporteProyeccionRangoExcel
    {
        public static void Generar(string ruta, List<DiaProyectado> dias,
                                   List<FilaRango> filas, string turno,
                                   List<RolTurno>? roles = null)
        {
            var cultura = CuadroProyeccion.Cultura;

            DateTime desde = dias[0].Fecha;
            DateTime hasta = dias[^1].Fecha;

            string rango =
                ($"Del {desde.ToString("dddd d 'de' MMMM", cultura)} " +
                 $"al {hasta.ToString("dddd d 'de' MMMM 'de' yyyy", cultura)}")
                .ToUpper(cultura);

            using var libro = new XLWorkbook();

            // ---------- Una hoja de rol por horario ----------
            foreach (var rol in roles ?? new List<RolTurno>())
                HojaRol(libro, rol, dias, rango, cultura);

            // ---------- Hoja del cuadro por puesto ----------
            HojaPuestos(libro, dias, filas, turno, rango, cultura);

            libro.SaveAs(ruta);
        }

        // =============================================================
        // HOJA 1..N: EL ROL DE CADA HORARIO
        // =============================================================
        private static void HojaRol(XLWorkbook libro, RolTurno rol,
                                    List<DiaProyectado> dias, string rango,
                                    CultureInfo cultura)
        {
            int n = dias.Count;
            int cols = n + 1;                 // el numero de orden + un dia por columna

            var ws = libro.Worksheets.Add(NombreHoja("Rol " + rol.Turno, libro));

            int ft = EstiloExcel.Banner(ws, cols,
                $"Rol  {rol.Turno}",
                "Base 105  ·  Clinica Marcial Fallas",
                rango,
                "Documento de planificacion. No refleja asistencia real.");

            // ---------- Encabezados ----------
            ws.Cell(ft, 1).Value = "N°";
            for (int d = 0; d < n; d++)
                ws.Cell(ft, d + 2).Value = Titulo(dias[d].Fecha, cultura);

            EstiloExcel.Encabezado(ws, ft, cols, 34);

            // ---------- Las filas del rol ----------
            int fila = ft + 1;

            // Donde quedo cada fila. Hace falta porque una fila del rol
            // puede ocupar dos filas de la hoja, y despues hay que
            // repintar los estados encima de las franjas.
            var mapa = new List<(FilaRol F, int Nombres, int Cubre)>();

            foreach (var f in rol.Filas)
            {
                ws.Cell(fila, 1).Value = f.Numero;

                for (int d = 0; d < n; d++)
                {
                    var c = ws.Cell(fila, d + 2);

                    // Aqui va SOLO el titular, y debajo su motivo si ese
                    // dia falta. Quien lo cubre ya no se mete en esta
                    // casilla: tiene la suya, en la fila de abajo.
                    c.Value = f.Nombres[d] ?? "";
                    EstiloExcel.Celda(c, centrado: Reng(f.Renglones, d) <= 1);

                    if (f.SinCubrir[d])
                    {
                        EstiloExcel.Pintar(c, EstiloExcel.RojoFondo, EstiloExcel.RojoTexto);
                        c.Style.Font.Bold = true;
                        c.Style.Font.FontSize = 9;
                    }
                    else if (f.EsCobertura[d])
                    {
                        // Falta y lo cubre otro: se marca para que no se
                        // confunda con el titular de siempre.
                        EstiloExcel.Pintar(c, EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto);
                        c.Style.Font.Italic = true;
                    }
                }

                ws.Row(fila).Height = Alto(f.Nombres);

                int filaNombres = fila;
                fila++;

                // ---------- La fila de abajo: LO CUBRE ----------
                // Solo se dibuja cuando de verdad hay alguien cubriendo
                // en algun dia. La mayoria de las filas pasan la semana
                // completa sin una sola sustitucion, y una fila en
                // blanco debajo de cada una duplicaria el papel.
                int filaCubre = -1;

                if (f.HayCubre)
                {
                    filaCubre = fila;
                    FilaCubre(ws, fila, f.Cubre, f.SinCubrir, n);
                    fila++;
                }

                mapa.Add((f, filaNombres, filaCubre));
            }

            int ultimaDelRol = fila - 1;

            // Un horario puede quedar sin nadie en todo el rango (por
            // ejemplo si solo hay gente librando): ahi no hay filas que
            // pintar y se salta directo al bloque de libres.
            if (ultimaDelRol >= ft + 1)
            {
                EstiloExcel.Franjas(ws, ft + 1, ultimaDelRol, cols);
                RepintarEstados(ws, mapa, n);
                EstiloExcel.ColumnaRotulo(ws, ft + 1, ultimaDelRol);
                ws.Range(ft + 1, 1, ultimaDelRol, 1).Style.Alignment.Horizontal =
                    XLAlignmentHorizontalValues.Center;

                // El rotulo "Lo cubre" va despues de ColumnaRotulo, que
                // pone todo en negrita a 10: a ese ancho de columna no
                // cabria y la fila de abajo se leeria igual de fuerte
                // que la del titular, que es la que manda.
                foreach (var (_, _, filaC) in mapa.Where(x => x.Cubre > 0))
                {
                    var r = ws.Cell(filaC, 1);
                    r.Value = "Lo cubre";
                    r.Style.Font.Bold = false;
                    r.Style.Font.Italic = true;
                    r.Style.Font.FontSize = 8;
                    r.Style.Alignment.WrapText = true;
                }
            }

            // ---------- Bloque de los que libran ----------
            int filaLibre = fila;

            ws.Range(filaLibre, 1, filaLibre, cols).Merge();
            var tit = ws.Cell(filaLibre, 1);
            tit.Value = "LIBRE";
            tit.Style.Fill.BackgroundColor = EstiloExcel.AzulMedio;
            tit.Style.Font.FontColor = XLColor.White;
            tit.Style.Font.Bold = true;
            tit.Style.Font.FontSize = 10;
            tit.Style.Font.FontName = EstiloExcel.Fuente;
            tit.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            tit.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            ws.Row(filaLibre).Height = 20;

            fila = filaLibre + 1;

            for (int i = 0; i < rol.CuantosLibres; i++)
            {
                ws.Cell(fila, 1).Value = "";

                for (int d = 0; d < n; d++)
                {
                    var c = ws.Cell(fila, d + 2);
                    var lista = rol.Libres[d];
                    c.Value = i < lista.Count ? lista[i] : "";
                    EstiloExcel.Celda(c);
                    EstiloExcel.Pintar(c, EstiloExcel.VerdeFondo, EstiloExcel.VerdeTexto);
                }

                ws.Range(fila, 1, fila, 1).Style.Fill.BackgroundColor = EstiloExcel.VerdeFondo;
                ws.Row(fila).Height = 19;
                fila++;
            }

            int ultima = fila - 1;
            if (rol.CuantosLibres == 0) ultima = filaLibre;

            EstiloExcel.Lineas(ws, ft, ultima, cols);

            // Linea marcada arriba del bloque de libres, para separarlo
            ws.Range(filaLibre, 1, filaLibre, cols).Style.Border.TopBorder =
                XLBorderStyleValues.Medium;
            ws.Range(filaLibre, 1, filaLibre, cols).Style.Border.TopBorderColor =
                EstiloExcel.Azul;

            // ---------- Leyenda y pie ----------
            int sinCubrir = rol.Filas.Sum(f => f.SinCubrir.Count(x => x));
            int coberturas = rol.Filas.Sum(f => f.EsCobertura.Count(x => x));

            var leyenda = new List<(string, XLColor?, XLColor?)>
            {
                // Las lineas de la leyenda van a un solo renglon: el
                // alto es fijo y lo que se parta solo queda tapado.
                ($"Amarillo = lo cubre otro oficial ({coberturas} caso(s)). " +
                 "Arriba quien falta; abajo quien entra.",
                 EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto),
                ($"Rojo = ese dia el puesto queda sin cubrir ({sinCubrir} caso(s))",
                 EstiloExcel.RojoFondo, EstiloExcel.RojoTexto),
                ("Verde = libra ese dia y no entro a trabajar",
                 EstiloExcel.VerdeFondo, EstiloExcel.VerdeTexto)
            };

            if (rol.Extras > 0)
                leyenda.Add((
                    $"(extra) = no entra por rol, entra de extra " +
                    $"({rol.Extras} casilla(s) en el rango).", null, null));

            // Lo que en el cuaderno se sabe de memoria, aqui va escrito:
            // el que libraba y aparece arriba es porque entro a cubrir.
            if (rol.EntraronEnDiaLibre > 0)
                leyenda.Add((
                    $"{rol.EntraronEnDiaLibre} vez/veces alguien que libraba entro a cubrir: " +
                    "su nombre esta arriba, no en LIBRE.", null, null));

            int fl = EstiloExcel.Leyenda(ws, ultima + 2, cols, leyenda);

            EstiloExcel.Pie(ws, fl, cols, $"Rol {rol.Turno}");

            // ---------- Medidas ----------
            // 9 y no 5: la primera columna ya no lleva solo el numero de
            // orden, tambien el rotulo "Lo cubre" de la fila de abajo.
            ws.Column(1).Width = 9;

            // Los nombres van solos en su casilla, sin el "Lo cubre:"
            // pegado adelante, asi que con 26 entran completos. El alto
            // de la fila se calcula contando saltos de linea, no lo que
            // Excel parte solo, por eso importa que quepan.
            for (int c = 2; c <= cols; c++) ws.Column(c).Width = ANCHO_DIA;

            // Un cuadro de muchos dias no cabe en una pagina de ancho: al
            // obligarlo, Excel lo encoge hasta su minimo y no hay quien lo
            // lea. Pasados unos diez dias se deja que use las paginas que
            // haga falta, repitiendo la primera columna en cada una para
            // no perder de vista de que fila se trata.
            EstiloExcel.Impresion(ws, ft, paginasAncho: cols > 10 ? 0 : 1);
        }

        /// <summary>
        /// La fila de LO CUBRE: va pegada debajo de la de los nombres y
        /// dice, dia por dia, quien esta cubriendo al de arriba.
        ///
        /// El rotulo lo lleva la primera columna, no cada casilla: asi
        /// el nombre entra completo y no hay que repetir "Lo cubre:"
        /// una vez por dia.
        /// </summary>
        private static void FilaCubre(IXLWorksheet ws, int fila, string[] cubre,
                                      bool[] sinCubrir, int dias)
        {
            var rotulo = ws.Cell(fila, 1);
            rotulo.Value = "Lo cubre";
            rotulo.Style.Font.FontName = EstiloExcel.Fuente;
            rotulo.Style.Font.FontSize = 8;
            rotulo.Style.Font.Italic = true;
            rotulo.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            rotulo.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            rotulo.Style.Alignment.WrapText = true;

            int alto = 1;

            for (int d = 0; d < dias; d++)
            {
                var c = ws.Cell(fila, d + 2);
                string texto = d < cubre.Length ? cubre[d] ?? "" : "";

                c.Value = texto;
                EstiloExcel.Celda(c);

                if (texto.Length == 0) continue;

                alto = Math.Max(alto, RenglonesReales(texto));

                bool descubierto = d < sinCubrir.Length && sinCubrir[d];

                if (descubierto)
                {
                    EstiloExcel.Pintar(c, EstiloExcel.RojoFondo, EstiloExcel.RojoTexto);
                    c.Style.Font.Bold = true;
                }
                else
                {
                    EstiloExcel.Pintar(c, EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto);
                }
            }

            ws.Row(fila).Height = 17 + (alto - 1) * 13;
        }

        /// <summary>Ancho de las columnas de dia, en caracteres.</summary>
        private const double ANCHO_DIA = 33;

        /// <summary>
        /// Cuantos renglones ocupa DE VERDAD un texto en una casilla de
        /// dia: los saltos que trae escritos mas los que Excel parte
        /// solo por no caber a lo ancho.
        ///
        /// Esto ultimo es lo que se pasaba por alto antes. El alto de la
        /// fila se pone a mano (Excel no crece solo cuando uno se lo
        /// fija), y se calculaba contando nada mas los saltos escritos.
        /// Un nombre de mas de 33 caracteres se partia en dos y el
        /// segundo pedazo quedaba tapado por la fila de abajo.
        /// </summary>
        private static int RenglonesReales(string? texto)
        {
            if (string.IsNullOrEmpty(texto)) return 1;

            // -2 de margen: la casilla tiene relleno a los lados y una
            // palabra no se parte por la mitad, se baja entera.
            double utiles = ANCHO_DIA - 2;

            return texto.Split('\n')
                        .Sum(l => Math.Max(1, (int)Math.Ceiling(l.Length / utiles)));
        }

        /// <summary>
        /// Alto de una fila segun la casilla mas alta que tenga, ya
        /// contando lo que se parte solo.
        /// </summary>
        private static double Alto(IEnumerable<string?> textos)
        {
            int max = 1;
            foreach (string? t in textos) max = Math.Max(max, RenglonesReales(t));
            return 19 + (max - 1) * 13;
        }

        /// <summary>Renglones de una casilla, sin salirse del arreglo.</summary>
        private static int Reng(int[] renglones, int dia) =>
            dia >= 0 && dia < renglones.Length ? Math.Max(1, renglones[dia]) : 1;

        /// <summary>
        /// Las franjas se pintan por fila entera y borran los colores de
        /// estado, asi que estos se vuelven a poner encima. Se hace en
        /// este orden a proposito: si se mezclan celda por celda, el
        /// cuadro queda con parches.
        /// </summary>
        private static void RepintarEstados(IXLWorksheet ws,
                                            List<(FilaRol F, int Nombres, int Cubre)> mapa,
                                            int dias)
        {
            foreach (var (f, filaNombres, filaCubre) in mapa)
            {
                for (int d = 0; d < dias; d++)
                {
                    if (f.SinCubrir[d])
                        EstiloExcel.Pintar(ws.Cell(filaNombres, d + 2),
                            EstiloExcel.RojoFondo, EstiloExcel.RojoTexto);
                    else if (f.EsCobertura[d])
                        EstiloExcel.Pintar(ws.Cell(filaNombres, d + 2),
                            EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto);

                    // La fila de abajo lleva su propio color, y solo en
                    // los dias que tienen algo escrito: una casilla
                    // vacia pintada de amarillo se leeria como si ahi
                    // hubiera una cobertura que no existe.
                    if (filaCubre < 0) continue;

                    string texto = d < f.Cubre.Length ? f.Cubre[d] ?? "" : "";
                    if (texto.Length == 0) continue;

                    if (f.SinCubrir[d])
                        EstiloExcel.Pintar(ws.Cell(filaCubre, d + 2),
                            EstiloExcel.RojoFondo, EstiloExcel.RojoTexto);
                    else
                        EstiloExcel.Pintar(ws.Cell(filaCubre, d + 2),
                            EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto);
                }
            }
        }

        // =============================================================
        // HOJA FINAL: EL CUADRO POR PUESTO
        // =============================================================
        private static void HojaPuestos(XLWorkbook libro, List<DiaProyectado> dias,
                                        List<FilaRango> filas, string turno,
                                        string rango, CultureInfo cultura)
        {
            int n = dias.Count;
            int cols = n + 1;

            var ws = libro.Worksheets.Add("Por puesto");

            int ft = EstiloExcel.Banner(ws, cols,
                $"Proyeccion por puesto  ·  {n} dia(s)",
                $"Base 105  ·  Clinica Marcial Fallas  ·  Turno: {turno}",
                rango,
                "Debajo de cada puesto, la fila 'Lo cubre' dice quien esta " +
                "cubriendo al oficial de arriba.");

            ws.Cell(ft, 1).Value = "PUESTO";
            for (int d = 0; d < n; d++)
                ws.Cell(ft, d + 2).Value = Titulo(dias[d].Fecha, cultura);

            EstiloExcel.Encabezado(ws, ft, cols, 34);

            int fila = ft + 1;

            // Igual que en las hojas de rol: un puesto puede ocupar dos
            // filas de la hoja, asi que hay que acordarse de donde quedo
            // cada cual para repintar despues de las franjas.
            var mapa = new List<(FilaRango F, int Nombres, int Cubre)>();

            foreach (var f in filas)
            {
                ws.Cell(fila, 1).Value = f.Puesto;

                for (int d = 0; d < n; d++)
                {
                    var c = ws.Cell(fila, d + 2);
                    c.Value = f.Nombres[d] ?? "";
                    EstiloExcel.Celda(c, centrado: Reng(f.Renglones, d) <= 1);
                    if (f.SinCubrir[d]) c.Style.Font.Bold = true;
                }

                ws.Row(fila).Height = Alto(f.Nombres);

                int filaNombres = fila;
                fila++;

                int filaCubre = -1;

                if (f.HayCubre)
                {
                    filaCubre = fila;
                    FilaCubre(ws, fila, f.Cubre, f.SinCubrir, n);
                    fila++;
                }

                mapa.Add((f, filaNombres, filaCubre));
            }

            int ultima = fila - 1;

            EstiloExcel.Franjas(ws, ft + 1, ultima, cols);

            // Los estados se repintan encima de las franjas
            foreach (var (f, filaNombres, filaCubre) in mapa)
            {
                for (int d = 0; d < n; d++)
                {
                    if (f.SinCubrir[d])
                        EstiloExcel.Pintar(ws.Cell(filaNombres, d + 2),
                            EstiloExcel.RojoFondo, EstiloExcel.RojoTexto);
                    else if (f.EsSinPuesto)
                        EstiloExcel.Pintar(ws.Cell(filaNombres, d + 2),
                            EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto);

                    if (filaCubre < 0) continue;

                    string texto = d < f.Cubre.Length ? f.Cubre[d] ?? "" : "";
                    if (texto.Length == 0) continue;

                    if (f.SinCubrir[d])
                        EstiloExcel.Pintar(ws.Cell(filaCubre, d + 2),
                            EstiloExcel.RojoFondo, EstiloExcel.RojoTexto);
                    else
                        EstiloExcel.Pintar(ws.Cell(filaCubre, d + 2),
                            EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto);
                }
            }

            EstiloExcel.ColumnaRotulo(ws, ft + 1, ultima);

            // El rotulo de la fila de abajo, despues de ColumnaRotulo
            foreach (var (_, _, filaC) in mapa.Where(x => x.Cubre > 0))
            {
                var r = ws.Cell(filaC, 1);
                r.Value = "Lo cubre";
                r.Style.Font.Bold = false;
                r.Style.Font.Italic = true;
                r.Style.Font.FontSize = 8;
                r.Style.Alignment.WrapText = true;
            }

            // La fila de los que quedan sin puesto se marca aparte
            foreach (var (f, filaNombres, _) in mapa)
            {
                if (!f.EsSinPuesto) continue;

                EstiloExcel.Pintar(ws.Cell(filaNombres, 1),
                    EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto);
                ws.Range(filaNombres, 1, filaNombres, cols).Style.Border.TopBorder =
                    XLBorderStyleValues.Medium;
                ws.Range(filaNombres, 1, filaNombres, cols).Style.Border.TopBorderColor =
                    EstiloExcel.Azul;
            }

            EstiloExcel.Lineas(ws, ft, ultima, cols);

            int descubiertas = filas.Sum(f => f.SinCubrir.Count(x => x));

            int fl = EstiloExcel.Leyenda(ws, ultima + 2, cols, new (string, XLColor?, XLColor?)[]
            {
                ($"Rojo = ese dia el puesto queda sin cubrir ({descubiertas} casilla(s))",
                 EstiloExcel.RojoFondo, EstiloExcel.RojoTexto),
                ("Amarillo = personal sin puesto asignado ese dia",
                 EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto),
                ("Fila 'Lo cubre' = quien cubre al oficial de arriba. " +
                 "Solo sale donde hay sustitucion.", null, null),
                ("Bajo el nombre va el motivo de la falta. " +
                 "(extra) = entra de extra, no por rol.", null, null)
            });

            EstiloExcel.Pie(ws, fl, cols, $"Turno: {turno}");

            ws.Column(1).Width = 16;
            // Los nombres van solos en su casilla, sin el "Lo cubre:"
            // pegado adelante, asi que con 26 entran completos. El alto
            // de la fila se calcula contando saltos de linea, no lo que
            // Excel parte solo, por eso importa que quepan.
            for (int c = 2; c <= cols; c++) ws.Column(c).Width = ANCHO_DIA;

            // Un cuadro de muchos dias no cabe en una pagina de ancho: al
            // obligarlo, Excel lo encoge hasta su minimo y no hay quien lo
            // lea. Pasados unos diez dias se deja que use las paginas que
            // haga falta, repitiendo la primera columna en cada una para
            // no perder de vista de que fila se trata.
            EstiloExcel.Impresion(ws, ft, paginasAncho: cols > 10 ? 0 : 1);
        }

        // =============================================================
        private static string Titulo(DateTime f, CultureInfo cultura) =>
            f.ToString("dddd", cultura).ToUpper(cultura) + "\n" +
            f.ToString("d 'de' MMMM", cultura);

        /// <summary>
        /// Excel no acepta ':' ni nombres repetidos en las pestanas, y
        /// los horarios vienen justamente como 18:00 - 00:00.
        /// </summary>
        private static string NombreHoja(string propuesto, XLWorkbook libro)
        {
            string limpio = propuesto.Replace(":", ".");
            foreach (char c in new[] { '\\', '/', '?', '*', '[', ']' })
                limpio = limpio.Replace(c, ' ');

            if (limpio.Length > 31) limpio = limpio[..31];

            string final = limpio;
            int i = 2;
            while (libro.Worksheets.Any(h => string.Equals(h.Name, final,
                                                           StringComparison.OrdinalIgnoreCase)))
            {
                string sufijo = " " + i++;
                final = limpio[..Math.Min(limpio.Length, 31 - sufijo.Length)] + sufijo;
            }
            return final;
        }
    }
}

