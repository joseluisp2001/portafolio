using System.Globalization;
using ClosedXML.Excel;   // NuGet: ClosedXML
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Excel de sustituciones de una fecha. Trae las dos caras del
    /// mismo asunto:
    ///
    ///   - las coberturas que se habian PROYECTADO para ese dia
    ///   - las sustituciones que de verdad se hicieron en la LISTA
    ///     DE ASISTENCIA
    ///
    /// Asi se puede comparar lo planeado contra lo que paso.
    /// El mismo archivo lo generan Sustituciones y Proyeccion.
    /// El aspecto sale de EstiloExcel, igual que el resto de reportes.
    /// </summary>
    public static class ReporteSustitucionesExcel
    {
        private const string BASE_OPERATIVA = "Base 105  ·  Clinica Marcial Fallas";

        /// <param name="reales">Sustituciones de la lista de asistencia.</param>
        /// <param name="proyectadas">Coberturas planeadas en la proyeccion.</param>
        /// <param name="sinCubrir">Puestos que quedaron descubiertos ese dia.</param>
        public static void Generar(string ruta, DateTime fecha,
                                   List<Sustitucion> reales,
                                   List<Sustitucion> proyectadas,
                                   List<LineaAsistencia>? sinCubrir = null)
        {
            var cultura = CultureInfo.GetCultureInfo("es-CR");
            string fechaLarga = fecha.ToString("dddd d 'de' MMMM 'de' yyyy", cultura)
                                     .ToUpper(cultura);

            using var libro = new XLWorkbook();

            HojaSustituciones(libro, "Lista de asistencia", fechaLarga,
                "Sustituciones de la lista de asistencia",
                "Lo que de verdad se hizo ese dia.",
                reales, conMotivo: false);

            HojaSustituciones(libro, "Proyeccion", fechaLarga,
                "Coberturas proyectadas",
                "Lo que se habia planeado. No refleja asistencia real.",
                proyectadas, conMotivo: true);

            HojaSinCubrir(libro, fechaLarga, sinCubrir ?? new List<LineaAsistencia>());
            HojaComparacion(libro, fechaLarga, reales, proyectadas);

            libro.SaveAs(ruta);
        }

        // ---------------- Una hoja de sustituciones ----------------
        private static void HojaSustituciones(
            XLWorkbook libro, string nombreHoja, string fechaLarga,
            string titulo, string nota, List<Sustitucion> lista, bool conMotivo)
        {
            var ws = libro.Worksheets.Add(nombreHoja);

            string[] titulos = conMotivo
                ? new[] { "Turno", "Puesto", "Quien falta", "Cedula", "Motivo",
                          "Lo cubre", "Cedula", "Rol de quien cubre" }
                : new[] { "Turno", "Puesto", "Oficial ausente", "Cedula",
                          "Lo cubre", "Cedula", "Rol de quien cubre" };

            int cols = titulos.Length;
            int ft = Armar(ws, cols, titulo, fechaLarga, nota, titulos);

            int fila = ft + 1;
            foreach (var s in lista)
            {
                int c = 1;
                ws.Cell(fila, c++).Value = s.Turno;

                // Igual que en la hoja de los puestos sin cubrir: una
                // casilla en blanco se lee como un dato que falta, y lo
                // que pasa es que esa sustitucion quedo sin puesto.
                ws.Cell(fila, c++).Value = string.IsNullOrWhiteSpace(s.Puesto)
                    ? "(sin puesto)" : s.Puesto;
                ws.Cell(fila, c++).Value = s.NombreAusente;
                ws.Cell(fila, c++).Value = s.CedulaAusente;
                if (conMotivo) ws.Cell(fila, c++).Value = s.Motivo;
                ws.Cell(fila, c++).Value = s.NombreSustituto;
                ws.Cell(fila, c++).Value = s.CedulaSustituto;
                ws.Cell(fila, c).Value = s.TurnoSustituto;

                for (int k = 1; k <= cols; k++) EstiloExcel.Celda(ws.Cell(fila, k));
                fila++;
            }

            int ultima = fila - 1;

            if (lista.Count > 0)
            {
                EstiloExcel.Franjas(ws, ft + 1, ultima, cols);

                // El externo se ve de un vistazo: no sale de la planilla.
                int f = ft + 1;
                foreach (var s in lista)
                {
                    if (s.CubreExterno)
                    {
                        var r = ws.Range(f, 1, f, cols);
                        r.Style.Fill.BackgroundColor = EstiloExcel.LilaFondo;
                        r.Style.Font.FontColor = EstiloExcel.LilaTexto;
                    }
                    f++;
                }
            }

            fila = SinDatos(ws, cols, ft, fila, conMotivo
                ? "No se habia proyectado ninguna cobertura para este dia."
                : "No hubo sustituciones este dia.");

            EstiloExcel.Lineas(ws, ft, fila - 1, cols, columnasDeRotulo: 0);

            int externos = lista.Count(s => s.CubreExterno);

            int fr = Totales(ws, fila + 1, new (string, int)[]
            {
                ("Total de sustituciones",             lista.Count),
                ("Cubiertas por autorizado externo",   externos),
                ("Cubiertas por oficiales de la base", lista.Count - externos)
            });

            int fl = EstiloExcel.Leyenda(ws, fr + 2, cols, new (string, XLColor?, XLColor?)[]
            {
                ("Azul = lo cubrio un autorizado externo",
                 EstiloExcel.LilaFondo, EstiloExcel.LilaTexto)
            });

            EstiloExcel.Pie(ws, fl, cols);
            Medidas(ws, cols, ft);
        }

        // ---------------- Puestos sin cubrir ----------------
        private static void HojaSinCubrir(XLWorkbook libro, string fechaLarga,
                                          List<LineaAsistencia> sinCubrir)
        {
            var ws = libro.Worksheets.Add("Sin cubrir");
            const int COLS = 5;

            int ft = Armar(ws, COLS, "Puestos sin cubrir", fechaLarga,
                "Ausencias e incapacidades que se quedaron sin sustituto.",
                new[] { "Turno", "Motivo", "Oficial", "Cedula", "Puesto" });

            int fila = ft + 1;
            foreach (var l in sinCubrir)
            {
                ws.Cell(fila, 1).Value = l.Turno;
                ws.Cell(fila, 2).Value = l.Motivo;
                ws.Cell(fila, 3).Value = l.Nombre;
                ws.Cell(fila, 4).Value = l.Cedula;
                ws.Cell(fila, 5).Value =
                    string.IsNullOrWhiteSpace(l.Puesto) ? "(sin puesto)" : l.Puesto;

                for (int k = 1; k <= COLS; k++) EstiloExcel.Celda(ws.Cell(fila, k));

                var rango = ws.Range(fila, 1, fila, COLS);
                rango.Style.Fill.BackgroundColor = l.Incapacitado
                    ? EstiloExcel.LilaFondo : EstiloExcel.RojoFondo;
                rango.Style.Font.FontColor = l.Incapacitado
                    ? EstiloExcel.LilaTexto : EstiloExcel.RojoTexto;

                fila++;
            }

            fila = SinDatos(ws, COLS, ft, fila, "Todos los puestos quedaron cubiertos.");

            EstiloExcel.Lineas(ws, ft, fila - 1, COLS, columnasDeRotulo: 0);

            int fl = EstiloExcel.Leyenda(ws, fila + 1, COLS, new (string, XLColor?, XLColor?)[]
            {
                ("Rojo = ausencia sin cubrir",     EstiloExcel.RojoFondo, EstiloExcel.RojoTexto),
                ("Azul = incapacidad sin cubrir",  EstiloExcel.LilaFondo, EstiloExcel.LilaTexto)
            });

            EstiloExcel.Pie(ws, fl, COLS);
            Medidas(ws, COLS, ft);
        }

        // ---------------- Planeado contra real ----------------
        private static void HojaComparacion(XLWorkbook libro, string fechaLarga,
                                            List<Sustitucion> reales,
                                            List<Sustitucion> proyectadas)
        {
            var ws = libro.Worksheets.Add("Planeado vs real");
            const int COLS = 4;

            int ft = Armar(ws, COLS, "Lo planeado contra lo que paso", fechaLarga,
                "Por cada oficial que iba a faltar: quien lo iba a cubrir y quien lo cubrio.",
                new[] { "Oficial", "Se planeo que lo cubriera", "Lo cubrio", "Resultado" });

            var ids = proyectadas.Select(p => p.IdOficialAusente)
                                 .Concat(reales.Select(r => r.IdOficialAusente))
                                 .Distinct().ToList();

            int fila = ft + 1;
            var resultados = new List<string>();

            foreach (int id in ids)
            {
                var p = proyectadas.FirstOrDefault(x => x.IdOficialAusente == id);
                var r = reales.FirstOrDefault(x => x.IdOficialAusente == id);

                string nombre = p?.NombreAusente ?? r?.NombreAusente ?? "";
                string plan = p?.NombreSustituto ?? "";
                string real = r?.NombreSustituto ?? "";

                string resultado =
                    plan.Length == 0 ? "Cobertura no planeada" :
                    real.Length == 0 ? "Se planeo pero no se cubrio" :
                    plan == real ? "Se cumplio" : "Lo cubrio otra persona";

                resultados.Add(resultado);

                ws.Cell(fila, 1).Value = nombre;
                ws.Cell(fila, 2).Value = plan.Length == 0 ? "-" : plan;
                ws.Cell(fila, 3).Value = real.Length == 0 ? "-" : real;
                ws.Cell(fila, 4).Value = resultado;

                for (int k = 1; k <= COLS; k++) EstiloExcel.Celda(ws.Cell(fila, k));
                fila++;
            }

            int ultima = fila - 1;

            if (ids.Count > 0)
            {
                EstiloExcel.Franjas(ws, ft + 1, ultima, COLS);

                for (int i = 0; i < resultados.Count; i++)
                {
                    int f = ft + 1 + i;
                    var rango = ws.Range(f, 1, f, COLS);

                    if (resultados[i] == "Se cumplio")
                    {
                        ws.Cell(f, 4).Style.Font.FontColor = EstiloExcel.VerdeTexto;
                        ws.Cell(f, 4).Style.Font.Bold = true;
                    }
                    else if (resultados[i] == "Se planeo pero no se cubrio")
                    {
                        rango.Style.Fill.BackgroundColor = EstiloExcel.RojoFondo;
                        rango.Style.Font.FontColor = EstiloExcel.RojoTexto;
                    }
                    else
                    {
                        rango.Style.Fill.BackgroundColor = EstiloExcel.AmbarFondo;
                        rango.Style.Font.FontColor = EstiloExcel.AmbarTexto;
                    }
                }
            }

            fila = SinDatos(ws, COLS, ft, fila,
                "Ese dia no hubo coberturas ni planeadas ni reales.");

            EstiloExcel.Lineas(ws, ft, fila - 1, COLS, columnasDeRotulo: 0);

            int fl = EstiloExcel.Leyenda(ws, fila + 1, COLS, new (string, XLColor?, XLColor?)[]
            {
                ("Sin resaltar = se cumplio lo planeado",    null, null),
                ("Amarillo = cambio respecto a lo planeado",  EstiloExcel.AmbarFondo,
                                                              EstiloExcel.AmbarTexto),
                ("Rojo = se planeo pero nadie lo cubrio",     EstiloExcel.RojoFondo,
                                                              EstiloExcel.RojoTexto)
            });

            EstiloExcel.Pie(ws, fl, COLS);
            Medidas(ws, COLS, ft);
        }

        // ---------------- Utilidades ----------------
        /// <summary>Banner y encabezados. Devuelve la fila de los titulos.</summary>
        private static int Armar(IXLWorksheet ws, int cols, string titulo,
                                 string fechaLarga, string nota, string[] titulos)
        {
            int ft = EstiloExcel.Banner(ws, cols, titulo, BASE_OPERATIVA, fechaLarga, nota);

            for (int i = 0; i < titulos.Length; i++)
                ws.Cell(ft, i + 1).Value = titulos[i];

            EstiloExcel.Encabezado(ws, ft, cols);
            return ft;
        }

        private static int SinDatos(IXLWorksheet ws, int cols, int ft, int fila, string mensaje)
        {
            if (fila > ft + 1) return fila;

            ws.Range(fila, 1, fila, cols).Merge();
            ws.Cell(fila, 1).Value = mensaje;
            ws.Cell(fila, 1).Style.Font.Italic = true;
            ws.Cell(fila, 1).Style.Font.FontColor = EstiloExcel.TextoSuave;
            ws.Cell(fila, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Row(fila).Height = 22;
            return fila + 1;
        }

        /// <summary>Caja de totales. Devuelve la ultima fila que ocupo.</summary>
        private static int Totales(IXLWorksheet ws, int fila, (string Etiqueta, int Valor)[] datos)
        {
            // La caja ocupa tres columnas y no dos: el rotulo va repartido
            // entre las dos primeras y el numero en la tercera.
            //
            // Puesto solo en la primera, el autoajuste le pasaba a esa
            // columna el ancho del rotulo mas largo -- casi treinta
            // letras -- y arriba, en la tabla, esa columna es la del
            // turno, que con trece tiene de sobra. Quedaba al doble de lo
            // que necesita, quitandole campo a los nombres.
            ws.Range(fila, 1, fila, 3).Merge();
            var tit = ws.Cell(fila, 1);
            tit.Value = "RESUMEN";
            tit.Style.Fill.BackgroundColor = EstiloExcel.Azul;
            tit.Style.Font.FontColor = XLColor.White;
            tit.Style.Font.Bold = true;
            tit.Style.Font.FontSize = 9.5;
            tit.Style.Font.FontName = EstiloExcel.Fuente;
            tit.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Row(fila).Height = 18;

            for (int i = 0; i < datos.Length; i++)
            {
                int f = fila + 1 + i;

                ws.Range(f, 1, f, 2).Merge();
                ws.Cell(f, 1).Value = "   " + datos[i].Etiqueta;
                ws.Cell(f, 1).Style.Font.FontSize = 9.5;
                ws.Cell(f, 1).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 1).Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

                ws.Cell(f, 3).Value = datos[i].Valor;
                ws.Cell(f, 3).Style.Font.Bold = true;
                ws.Cell(f, 3).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                ws.Row(f).Height = 17;
            }

            int ultima = fila + datos.Length;
            var caja = ws.Range(fila, 1, ultima, 3);
            caja.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
            caja.Style.Border.OutsideBorderColor = EstiloExcel.Azul;
            caja.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            caja.Style.Border.InsideBorderColor = EstiloExcel.Linea;

            return ultima;
        }

        private static void Medidas(IXLWorksheet ws, int cols, int ft)
        {
            ws.Columns(1, cols).AdjustToContents();
            for (int c = 1; c <= cols; c++)
                if (ws.Column(c).Width > 34) ws.Column(c).Width = 34;

            EstiloExcel.Impresion(ws, ft, columnasFijas: 0);
        }
    }
}
