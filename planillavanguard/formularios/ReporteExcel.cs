using System.Data;
using System.Globalization;
using ClosedXML.Excel;   // NuGet: ClosedXML

namespace formularios
{
    /// <summary>
    /// Reporte diario en Excel. El aspecto sale de EstiloExcel, que es
    /// el mismo para todos los reportes del sistema.
    /// </summary>
    public static class ReporteExcel
    {
        private const string BASE_OPERATIVA = "Base 105  ·  Clinica Marcial Fallas";

        /// <summary>
        /// El Tipo va pegado al turno, igual que en la pantalla: lo
        /// primero que se mira de una linea es de que horario es y si esa
        /// persona entro por su rol, a una plaza vacante o de extra.
        ///
        /// Antes no salia en el Excel aunque la consulta si lo traia: el
        /// dato se veia en pantalla y se perdia en el papel, que es donde
        /// hace falta cuando alguien pregunta por que fulano trabajo ese
        /// dia si no le tocaba.
        /// </summary>
        private static readonly string[] ENCABEZADOS =
        {
            "Turno", "Tipo", "Puesto", "Ubicacion", "Oficial", "Cedula",
            "Estado", "Hora llegada", "Sustituto", "Cedula sustituto"
        };

        public static void Generar(
            string ruta, DateTime fecha, DataTable datos,
            (int Total, int Presentes, int Tardias, int Ausentes, int Sustituciones) totales,
            List<GestorDatos.Sustitucion> sustituciones)
        {
            var cultura = CultureInfo.GetCultureInfo("es-CR");
            string fechaLarga = fecha.ToString("dddd d 'de' MMMM 'de' yyyy", cultura).ToUpper(cultura);

            using var libro = new XLWorkbook();
            HojaPrincipal(libro, fechaLarga, datos, totales);
            HojaTardias(libro, fechaLarga, datos);
            HojaSustituciones(libro, fechaLarga, sustituciones);
            libro.SaveAs(ruta);
        }

        // ---------------- HOJA 1: el reporte ----------------
        private static void HojaPrincipal(
            XLWorkbook libro, string fechaLarga, DataTable datos,
            (int Total, int Presentes, int Tardias, int Ausentes, int Sustituciones) t)
        {
            var ws = libro.Worksheets.Add("Reporte Diario");
            const int COLS = 10;

            int ft = EstiloExcel.Banner(ws, COLS,
                "Planilla  ·  Reporte diario", BASE_OPERATIVA, fechaLarga);

            for (int i = 0; i < ENCABEZADOS.Length; i++)
                ws.Cell(ft, i + 1).Value = ENCABEZADOS[i];
            EstiloExcel.Encabezado(ws, ft, COLS);

            // ---------- Datos ----------
            int fila = ft + 1;
            var estados = new List<string>();

            foreach (DataRow r in datos.Rows)
            {
                string estado = Txt(r["Estado"]);
                estados.Add(estado);

                ws.Cell(fila, 1).Value = Txt(r["Turno"]);

                // Una base a la que no le corrieron el script del Tipo no
                // trae esa columna: se pone Rol, que es lo que eran todas
                // antes de que existiera la marca.
                ws.Cell(fila, 2).Value = datos.Columns.Contains("Tipo")
                    ? Txt(r["Tipo"]) : "Rol";

                ws.Cell(fila, 3).Value = Txt(r["Puesto"]);
                ws.Cell(fila, 4).Value = Txt(r["Ubicacion"]);
                ws.Cell(fila, 5).Value = Txt(r["Oficial"]);
                ws.Cell(fila, 6).Value = Txt(r["Cedula"]);
                ws.Cell(fila, 7).Value = estado;
                ws.Cell(fila, 8).Value = Txt(r["HoraLlegada"]);
                ws.Cell(fila, 9).Value = Txt(r["Sustituto"]);
                ws.Cell(fila, 10).Value = Txt(r["CedulaSustituto"]);

                for (int c = 1; c <= COLS; c++)
                    EstiloExcel.Celda(ws.Cell(fila, c),
                                      centrado: c is 1 or 2 or 6 or 7 or 8 or 10);

                fila++;
            }

            int ultima = fila - 1;

            if (ultima >= ft + 1)
            {
                // Primero la franja de toda la fila, despues el color de
                // estado encima. Al reves quedan parches.
                EstiloExcel.Franjas(ws, ft + 1, ultima, COLS);

                for (int i = 0; i < estados.Count; i++)
                {
                    int f = ft + 1 + i;
                    var rango = ws.Range(f, 1, f, COLS);

                    switch (estados[i])
                    {
                        // La 7 es Estado y la 8 la hora de llegada. Se
                        // corrieron un lugar cuando entro la columna del
                        // Tipo.
                        case "Ausente":
                            rango.Style.Fill.BackgroundColor = EstiloExcel.RojoFondo;
                            rango.Style.Font.FontColor = EstiloExcel.RojoTexto;
                            ws.Cell(f, 7).Style.Font.Bold = true;
                            break;

                        case "Tardia":
                            rango.Style.Fill.BackgroundColor = EstiloExcel.AmbarFondo;
                            rango.Style.Font.FontColor = EstiloExcel.AmbarTexto;
                            ws.Cell(f, 7).Style.Font.Bold = true;
                            ws.Cell(f, 8).Style.Font.Bold = true;
                            break;

                        case "Incapacidad":
                            rango.Style.Fill.BackgroundColor = EstiloExcel.LilaFondo;
                            rango.Style.Font.FontColor = EstiloExcel.LilaTexto;
                            ws.Cell(f, 7).Style.Font.Bold = true;
                            break;

                        default:
                            ws.Cell(f, 7).Style.Font.FontColor = EstiloExcel.VerdeTexto;
                            break;
                    }
                }

                EstiloExcel.Lineas(ws, ft, ultima, COLS, columnasDeRotulo: 0);
                ws.Range(ft, 1, ultima, COLS).SetAutoFilter();
            }

            // ---------- Resumen ----------
            int fr = Resumen(ws, ultima + 2, new (string, int, XLColor?, XLColor?)[]
            {
                ("Total de oficiales", t.Total,         null, null),
                ("Presentes",          t.Presentes,     null, null),
                ("Tardias",            t.Tardias,       t.Tardias  > 0 ? EstiloExcel.AmbarFondo : null,
                                                        EstiloExcel.AmbarTexto),
                ("Ausentes",           t.Ausentes,      t.Ausentes > 0 ? EstiloExcel.RojoFondo : null,
                                                        EstiloExcel.RojoTexto),
                ("Sustituciones",      t.Sustituciones, null, null)
            });

            int fl = EstiloExcel.Leyenda(ws, fr + 2, COLS, new (string, XLColor?, XLColor?)[]
            {
                ("Amarillo = llego tarde",  EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto),
                ("Rojo = no llego",         EstiloExcel.RojoFondo,  EstiloExcel.RojoTexto),
                ("Azul = incapacidad",      EstiloExcel.LilaFondo,  EstiloExcel.LilaTexto)
            });

            EstiloExcel.Pie(ws, fl, COLS);

            // ---------- Medidas ----------
            // Las columnas tambien se corrieron un lugar: 4 es Ubicacion,
            // 5 el Oficial, 8 la hora y 9 el Sustituto.
            ws.Columns(1, COLS).AdjustToContents();

            // Tope para todas, no solo para la ubicacion: un nombre muy
            // largo, o un puesto con una descripcion larga, estiraba su
            // columna sin limite y encogia el resto del cuadro al
            // imprimir.
            for (int c = 1; c <= COLS; c++)
                if (ws.Column(c).Width > 34) ws.Column(c).Width = 34;

            if (ws.Column(4).Width > 40) ws.Column(4).Width = 40;
            if (ws.Column(5).Width < 28) ws.Column(5).Width = 28;
            if (ws.Column(9).Width < 24) ws.Column(9).Width = 24;
            if (ws.Column(8).Width < 13) ws.Column(8).Width = 13;

            EstiloExcel.Impresion(ws, ft, columnasFijas: 0);
        }

        // ---------------- HOJA 2: tardias ----------------
        private static void HojaTardias(XLWorkbook libro, string fechaLarga, DataTable datos)
        {
            var ws = libro.Worksheets.Add("Tardias");
            const int COLS = 5;

            int ft = EstiloExcel.Banner(ws, COLS,
                "Tardias del dia", BASE_OPERATIVA, fechaLarga);

            string[] titulos = { "Turno", "Puesto", "Oficial", "Cedula", "Hora de llegada" };
            for (int i = 0; i < titulos.Length; i++) ws.Cell(ft, i + 1).Value = titulos[i];
            EstiloExcel.Encabezado(ws, ft, COLS);

            int fila = ft + 1;

            foreach (DataRow r in datos.Rows)
            {
                if (Txt(r["Estado"]) != "Tardia") continue;

                ws.Cell(fila, 1).Value = Txt(r["Turno"]);
                ws.Cell(fila, 2).Value = Txt(r["Puesto"]);
                ws.Cell(fila, 3).Value = Txt(r["Oficial"]);
                ws.Cell(fila, 4).Value = Txt(r["Cedula"]);
                ws.Cell(fila, 5).Value = Txt(r["HoraLlegada"]);

                for (int c = 1; c <= COLS; c++)
                    EstiloExcel.Celda(ws.Cell(fila, c), centrado: c != 3);

                ws.Range(fila, 1, fila, COLS).Style.Fill.BackgroundColor = EstiloExcel.AmbarFondo;
                ws.Range(fila, 1, fila, COLS).Style.Font.FontColor = EstiloExcel.AmbarTexto;
                ws.Cell(fila, 5).Style.Font.Bold = true;
                fila++;
            }

            fila = SinDatos(ws, COLS, ft, fila, "Ningun oficial llego tarde este dia.");

            EstiloExcel.Lineas(ws, ft, fila - 1, COLS, columnasDeRotulo: 0);
            EstiloExcel.Pie(ws, fila + 1, COLS);

            ws.Columns(1, COLS).AdjustToContents();
            if (ws.Column(3).Width < 28) ws.Column(3).Width = 28;
            EstiloExcel.Impresion(ws, ft, columnasFijas: 0);
        }

        // ---------------- HOJA 3: sustituciones ----------------
        private static void HojaSustituciones(
            XLWorkbook libro, string fechaLarga, List<GestorDatos.Sustitucion> lista)
        {
            var ws = libro.Worksheets.Add("Sustituciones");
            const int COLS = 4;

            int ft = EstiloExcel.Banner(ws, COLS,
                "Sustituciones del dia", BASE_OPERATIVA, fechaLarga);

            string[] titulos = { "Turno", "Puesto", "Oficial ausente", "Lo cubre" };
            for (int i = 0; i < titulos.Length; i++) ws.Cell(ft, i + 1).Value = titulos[i];
            EstiloExcel.Encabezado(ws, ft, COLS);

            int fila = ft + 1;

            foreach (var s in lista)
            {
                ws.Cell(fila, 1).Value = s.Turno;
                ws.Cell(fila, 2).Value = s.Puesto;
                ws.Cell(fila, 3).Value = s.NombreAusente;
                ws.Cell(fila, 4).Value = s.NombreSustituto;

                for (int c = 1; c <= COLS; c++)
                    EstiloExcel.Celda(ws.Cell(fila, c), centrado: c <= 2);

                fila++;
            }

            int ultima = fila - 1;
            if (lista.Count > 0) EstiloExcel.Franjas(ws, ft + 1, ultima, COLS);

            fila = SinDatos(ws, COLS, ft, fila, "No hubo sustituciones este dia.");

            EstiloExcel.Lineas(ws, ft, fila - 1, COLS, columnasDeRotulo: 0);
            EstiloExcel.Pie(ws, fila + 1, COLS);

            ws.Columns(1, COLS).AdjustToContents();
            if (ws.Column(3).Width < 28) ws.Column(3).Width = 28;
            if (ws.Column(4).Width < 28) ws.Column(4).Width = 28;
            EstiloExcel.Impresion(ws, ft, columnasFijas: 0);
        }

        // ---------------- Utilidades ----------------
        /// <summary>
        /// Si la hoja quedo vacia, deja una linea diciendolo. Es mejor
        /// que una tabla en blanco, que siempre deja la duda de si el
        /// reporte fallo.
        /// </summary>
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
        private static int Resumen(IXLWorksheet ws, int fila,
                                   (string Etiqueta, int Valor, XLColor? Fondo, XLColor? Letra)[] datos)
        {
            ws.Range(fila, 1, fila, 2).Merge();
            var tit = ws.Cell(fila, 1);
            tit.Value = "RESUMEN DEL DIA";
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
                var (etiqueta, valor, fondo, letra) = datos[i];

                ws.Cell(f, 1).Value = "   " + etiqueta;
                ws.Cell(f, 2).Value = valor;

                ws.Cell(f, 1).Style.Font.FontSize = 9.5;
                ws.Cell(f, 1).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 2).Style.Font.Bold = true;
                ws.Cell(f, 2).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                if (fondo is not null)
                {
                    ws.Range(f, 1, f, 2).Style.Fill.BackgroundColor = fondo;
                    ws.Range(f, 1, f, 2).Style.Font.FontColor = letra ?? EstiloExcel.Texto;
                }

                ws.Row(f).Height = 17;
            }

            int ultima = fila + datos.Length;
            var caja = ws.Range(fila, 1, ultima, 2);
            caja.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
            caja.Style.Border.OutsideBorderColor = EstiloExcel.Azul;
            caja.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            caja.Style.Border.InsideBorderColor = EstiloExcel.Linea;

            return ultima;
        }

        private static string Txt(object? v) =>
            v is null || v == DBNull.Value ? "" : v.ToString() ?? "";
    }
}
