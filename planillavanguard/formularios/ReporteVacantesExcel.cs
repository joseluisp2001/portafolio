using System.Data;
using System.Globalization;
using ClosedXML.Excel;
using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Excel del cuadro de plazas: lo que se ve en pantalla, con el
    /// mismo filtro, mas un resumen por estado y por rol.
    ///
    /// Es el papel que hacia falta para llevar a una reunion: cuantas
    /// plazas hay, cuantas estan sin titular, desde cuando, por que, y
    /// quien las esta cubriendo mientras tanto.
    /// </summary>
    public static class ReporteVacantesExcel
    {
        public static void Generar(string ruta, DataTable datos, string filtro,
                                   ResumenPlazas totales)
        {
            var cultura = CultureInfo.GetCultureInfo("es-CR");
            string hoy = DateTime.Today.ToString("d 'de' MMMM 'de' yyyy", cultura);

            using var libro = new XLWorkbook();
            HojaPlazas(libro, datos, filtro, hoy, totales);
            HojaResumen(libro, datos, totales);
            libro.SaveAs(ruta);
        }

        // ---------------- HOJA 1: el cuadro ----------------
        private static void HojaPlazas(XLWorkbook libro, DataTable datos, string filtro,
                                       string hoy, ResumenPlazas totales)
        {
            var ws = libro.Worksheets.Add("Plazas");

            // La columna del codigo interno no le sirve a nadie en papel.
            var vista = SinColumna(datos, "Id");
            int cols = vista.Columns.Count;

            int ft = EstiloExcel.Banner(ws, cols, "Plazas y vacantes",
                "Base 105  ·  Clinica Marcial Fallas", $"Generado el {hoy}", filtro);

            for (int c = 0; c < cols; c++)
                ws.Cell(ft, c + 1).Value = vista.Columns[c].ColumnName;
            EstiloExcel.Encabezado(ws, ft, cols);

            int iEstado = vista.Columns.Contains("Estado")
                ? vista.Columns["Estado"]!.Ordinal : -1;
            int iCobertura = vista.Columns.Contains("Cobertura")
                ? vista.Columns["Cobertura"]!.Ordinal : -1;

            int fila = ft + 1;
            var marcas = new List<string>();

            foreach (DataRow r in vista.Rows)
            {
                for (int c = 0; c < cols; c++)
                {
                    var celda = ws.Cell(fila, c + 1);

                    // Las fechas como fecha y los numeros como numero:
                    // asi el cuadro se puede ordenar por "dias vacante"
                    // sin que 10 quede antes que 2.
                    switch (r[c])
                    {
                        // Un dato que no hay se deja en blanco de verdad: con
                        // una cadena vacia la celda cuenta como ocupada y el
                        // filtro de Excel ofrece un renglon vacio como si
                        // fuera un valor mas.
                        case null:
                        case DBNull:
                            break;

                        case DateTime fecha:
                            celda.Value = fecha;
                            break;

                        case int or short or long:
                            celda.Value = Convert.ToInt64(r[c]);
                            break;

                        default:
                            celda.Value = r[c]?.ToString() ?? "";
                            break;
                    }

                    EstiloExcel.Celda(celda, centrado: c != 0);

                    if (r[c] is DateTime) celda.Style.NumberFormat.Format = "dd/MM/yyyy";
                }

                string estado = iEstado >= 0 ? r[iEstado]?.ToString() ?? "" : "";
                string cobertura = iCobertura >= 0 ? r[iCobertura]?.ToString() ?? "" : "";

                marcas.Add(estado == EstadoPlaza.Vacante && cobertura == "SIN CUBRIR" ? "roja"
                         : estado == EstadoPlaza.Vacante ? "ambar"
                         : estado == EstadoPlaza.Bloqueada ? "gris"
                         : "");

                fila++;
            }

            int ultima = fila - 1;

            if (ultima >= ft + 1)
            {
                // La franja primero y el color de estado encima: al reves
                // el cuadro queda con parches.
                EstiloExcel.Franjas(ws, ft + 1, ultima, cols);

                for (int i = 0; i < marcas.Count; i++)
                {
                    var rango = ws.Range(ft + 1 + i, 1, ft + 1 + i, cols);

                    switch (marcas[i])
                    {
                        case "roja":
                            rango.Style.Fill.BackgroundColor = EstiloExcel.RojoFondo;
                            rango.Style.Font.FontColor = EstiloExcel.RojoTexto;
                            rango.Style.Font.Bold = true;
                            break;

                        case "ambar":
                            rango.Style.Fill.BackgroundColor = EstiloExcel.AmbarFondo;
                            rango.Style.Font.FontColor = EstiloExcel.AmbarTexto;
                            break;

                        case "gris":
                            rango.Style.Font.FontColor = EstiloExcel.TextoSuave;
                            rango.Style.Font.Italic = true;
                            break;
                    }
                }

                EstiloExcel.Lineas(ws, ft, ultima, cols, columnasDeRotulo: 0);
                ws.Range(ft, 1, ultima, cols).SetAutoFilter();
            }
            else
            {
                ws.Range(fila, 1, fila, cols).Merge();
                ws.Cell(fila, 1).Value = "No hay ninguna plaza que mostrar con ese filtro.";
                ws.Cell(fila, 1).Style.Font.Italic = true;
                ws.Cell(fila, 1).Style.Font.FontColor = EstiloExcel.TextoSuave;
                ws.Cell(fila, 1).Style.Alignment.Horizontal =
                    XLAlignmentHorizontalValues.Center;
                EstiloExcel.Lineas(ws, ft, fila, cols, columnasDeRotulo: 0);
                ultima = fila;
            }

            int fl = EstiloExcel.Leyenda(ws, ultima + 2, cols, new (string, XLColor?, XLColor?)[]
            {
                ("Rojo = vacante que nadie esta cubriendo",
                 EstiloExcel.RojoFondo, EstiloExcel.RojoTexto),
                ("Amarillo = vacante con alguien cubriendola",
                 EstiloExcel.AmbarFondo, EstiloExcel.AmbarTexto),
                ("Gris = plaza bloqueada, no se va a llenar", null, null)
            });

            EstiloExcel.Pie(ws, fl, cols,
                $"{totales.Total} plaza(s)  ·  {totales.SinCubrir} sin cubrir");

            ws.Columns(1, cols).AdjustToContents();
            for (int c = 1; c <= cols; c++)
                if (ws.Column(c).Width > 32) ws.Column(c).Width = 32;

            EstiloExcel.Impresion(ws, ft, columnasFijas: 0);
        }

        // ---------------- HOJA 2: el resumen ----------------
        private static void HojaResumen(XLWorkbook libro, DataTable datos,
                                        ResumenPlazas t)
        {
            var ws = libro.Worksheets.Add("Resumen");

            int fila = EstiloExcel.Banner(ws, 4, "Resumen de plazas",
                "Base 105  ·  Clinica Marcial Fallas");

            fila = Bloque(ws, fila, "COMO ESTAN", new (string, int)[]
            {
                ("Plazas en total",   t.Total),
                ("Ocupadas",          t.Ocupadas),
                ("Vacantes",          t.Vacantes),
                ("   de esas, sin cubrir", t.SinCubrir),
                ("Bloqueadas",        t.Bloqueadas)
            });

            fila = Bloque(ws, fila + 1, "POR ROL", Contar(datos, "Rol"));
            Bloque(ws, fila + 1, "POR MOTIVO DE LA VACANTE", Contar(datos, "Motivo"));

            ws.Columns(1, 3).AdjustToContents();
            if (ws.Column(1).Width < 26) ws.Column(1).Width = 26;

            // Sin fila de encabezado que congelar: es una lista de cajas.
            EstiloExcel.Impresion(ws, 0, columnasFijas: 0, apaisado: false);
        }

        private static (string, int)[] Contar(DataTable t, string columna)
        {
            if (!t.Columns.Contains(columna)) return Array.Empty<(string, int)>();

            var conteo = new Dictionary<string, int>();

            foreach (DataRow r in t.Rows)
            {
                string clave = r[columna]?.ToString() ?? "";
                if (clave.Trim().Length == 0) continue;
                conteo[clave] = conteo.TryGetValue(clave, out int n) ? n + 1 : 1;
            }

            return conteo.OrderBy(p => p.Key).Select(p => (p.Key, p.Value)).ToArray();
        }

        /// <summary>
        /// Una caja de totales. El rotulo va repartido en dos columnas y
        /// el numero en la tercera, para que un rotulo largo no le pase
        /// su ancho a la primera columna.
        /// </summary>
        private static int Bloque(IXLWorksheet ws, int fila, string titulo,
                                  (string Clave, int Cantidad)[] filas)
        {
            ws.Range(fila, 1, fila, 3).Merge();
            var tit = ws.Cell(fila, 1);
            tit.Value = titulo;
            tit.Style.Fill.BackgroundColor = EstiloExcel.AzulMedio;
            tit.Style.Font.FontColor = XLColor.White;
            tit.Style.Font.Bold = true;
            tit.Style.Font.FontSize = 10;
            tit.Style.Font.FontName = EstiloExcel.Fuente;
            tit.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Row(fila).Height = 19;

            int f = fila + 1;

            foreach (var (clave, cantidad) in filas)
            {
                ws.Range(f, 1, f, 2).Merge();
                ws.Cell(f, 1).Value = "   " + clave;
                ws.Cell(f, 1).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 1).Style.Font.FontSize = 10;
                ws.Cell(f, 1).Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;

                ws.Cell(f, 3).Value = cantidad;
                ws.Cell(f, 3).Style.Font.Bold = true;
                ws.Cell(f, 3).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                if ((f - fila) % 2 == 0)
                    ws.Range(f, 1, f, 3).Style.Fill.BackgroundColor = EstiloExcel.Franja;

                ws.Row(f).Height = 17;
                f++;
            }

            if (filas.Length == 0)
            {
                ws.Range(f, 1, f, 3).Merge();
                ws.Cell(f, 1).Value = "   (sin datos)";
                ws.Cell(f, 1).Style.Font.Italic = true;
                ws.Cell(f, 1).Style.Font.FontColor = EstiloExcel.TextoSuave;
                f++;
            }

            var caja = ws.Range(fila, 1, f - 1, 3);
            caja.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
            caja.Style.Border.OutsideBorderColor = EstiloExcel.Azul;
            caja.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            caja.Style.Border.InsideBorderColor = EstiloExcel.Linea;

            return f;
        }

        /// <summary>
        /// La misma tabla sin una columna. Se trabaja sobre una copia:
        /// la que esta en pantalla no se toca.
        /// </summary>
        private static DataTable SinColumna(DataTable t, string columna)
        {
            var copia = t.Copy();
            if (copia.Columns.Contains(columna)) copia.Columns.Remove(columna);
            return copia;
        }
    }
}
