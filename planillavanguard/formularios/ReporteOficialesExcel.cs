using System.Data;
using System.Globalization;
using ClosedXML.Excel;   // NuGet: ClosedXML

namespace formularios
{
    /// <summary>
    /// Excel de la consulta de personal: lo que se ve en pantalla,
    /// con los mismos filtros, mas un resumen por rol y por turno.
    /// </summary>
    public static class ReporteOficialesExcel
    {
        private static readonly XLColor AZUL = XLColor.FromHtml("#112C41");
        private static readonly XLColor AZUL_MEDIO = XLColor.FromHtml("#2A5B80");
        private static readonly XLColor GRIS = XLColor.FromHtml("#F2F5F7");
        private static readonly XLColor ROJO_F = XLColor.FromHtml("#F8D7DA");
        private static readonly XLColor ROJO_T = XLColor.FromHtml("#842029");
        private static readonly XLColor LILA_F = XLColor.FromHtml("#DEE4F1");
        private static readonly XLColor LILA_T = XLColor.FromHtml("#34426A");
        private static readonly XLColor BORDE = XLColor.FromHtml("#B8C4CE");

        public static void Generar(string ruta, DataTable datos, string filtros)
        {
            var cultura = CultureInfo.GetCultureInfo("es-CR");
            string hoy = DateTime.Today.ToString("d 'de' MMMM 'de' yyyy", cultura);

            using var libro = new XLWorkbook();
            HojaPersonal(libro, datos, filtros, hoy);
            HojaResumen(libro, datos);
            libro.SaveAs(ruta);
        }

        // ---------------- HOJA 1: el listado ----------------
        private static void HojaPersonal(XLWorkbook libro, DataTable datos,
                                         string filtros, string hoy)
        {
            var ws = libro.Worksheets.Add("Personal");
            int cols = datos.Columns.Count;

            int FT = EstiloExcel.Banner(ws, cols, "Consulta de personal",
                "Base 105  ·  Clinica Marcial Fallas", $"Generado el {hoy}", filtros);

            for (int c = 0; c < cols; c++)
                ws.Cell(FT, c + 1).Value = datos.Columns[c].ColumnName;
            EstiloExcel.Encabezado(ws, FT, cols);

            int iRol = datos.Columns.Contains("Rol / Horario")
                ? datos.Columns["Rol / Horario"]!.Ordinal : -1;
            int iVence = datos.Columns.Contains("Vence portacion")
                ? datos.Columns["Vence portacion"]!.Ordinal : -1;

            int fila = FT + 1;
            var marcas = new List<(bool Vencida, bool Externo)>();

            foreach (DataRow r in datos.Rows)
            {
                for (int c = 0; c < cols; c++)
                {
                    var celda = ws.Cell(fila, c + 1);

                    // Las fechas van como fecha y los numeros como
                    // numero, no como texto que se les parezca. Se ve
                    // igual -- la fecha sigue saliendo dd/MM/yyyy --,
                    // pero asi Excel los ordena y los filtra bien: en
                    // texto, el filtro no ofrece "por fecha" y las
                    // ausencias se ordenan 1, 10, 2, y ademas cada
                    // numero sale con el triangulito verde de aviso.
                    switch (r[c])
                    {
                        // Un dato que no hay se deja en blanco de verdad: con
                        // una cadena vacia la celda cuenta como ocupada y el
                        // filtro de Excel ofrece un renglon vacio como si
                        // fuera un valor mas.
                        case null:
                        case DBNull:
                            break;

                        case DateTime fec:
                            celda.Value = fec;
                            break;

                        case int or short or long:
                            celda.Value = Convert.ToInt64(r[c]);
                            break;

                        case decimal or double or float:
                            celda.Value = Convert.ToDouble(r[c]);
                            break;

                        default:
                            celda.Value = r[c]?.ToString() ?? "";
                            break;
                    }

                    EstiloExcel.Celda(celda, centrado: c != 1);

                    // El formato va despues del estilo: Celda no lo toca,
                    // pero si se pusiera antes, cualquier cambio de alla
                    // se lo llevaria por delante.
                    if (r[c] is DateTime) celda.Style.NumberFormat.Format = "dd/MM/yyyy";
                }

                marcas.Add((
                    iVence >= 0 && r[iVence] is DateTime f && f < DateTime.Today,
                    iRol >= 0 && GestorDatos.Roles.EsExterno(r[iRol]?.ToString())));

                fila++;
            }

            int ultima = fila - 1;

            if (ultima >= FT + 1)
            {
                // La franja primero y el color de estado encima: al reves
                // el cuadro queda con parches.
                EstiloExcel.Franjas(ws, FT + 1, ultima, cols);

                for (int i = 0; i < marcas.Count; i++)
                {
                    int f = FT + 1 + i;
                    var rango = ws.Range(f, 1, f, cols);

                    if (marcas[i].Vencida)
                    {
                        rango.Style.Fill.BackgroundColor = EstiloExcel.RojoFondo;
                        rango.Style.Font.FontColor = EstiloExcel.RojoTexto;
                    }
                    else if (marcas[i].Externo)
                    {
                        rango.Style.Fill.BackgroundColor = EstiloExcel.LilaFondo;
                        rango.Style.Font.FontColor = EstiloExcel.LilaTexto;
                    }
                }

                EstiloExcel.Lineas(ws, FT, ultima, cols, columnasDeRotulo: 0);
                ws.Range(FT, 1, ultima, cols).SetAutoFilter();
            }

            int fl = EstiloExcel.Leyenda(ws, ultima + 2, cols, new (string, XLColor?, XLColor?)[]
            {
                ("Rojo = portacion de armas vencida",
                 EstiloExcel.RojoFondo, EstiloExcel.RojoTexto),
                ("Azul = autorizado externo",
                 EstiloExcel.LilaFondo, EstiloExcel.LilaTexto)
            });

            EstiloExcel.Pie(ws, fl, cols);

            ws.Columns(1, cols).AdjustToContents();
            for (int c = 1; c <= cols; c++)
                if (ws.Column(c).Width > 32) ws.Column(c).Width = 32;
            if (ws.Column(2).Width < 28) ws.Column(2).Width = 28;

            EstiloExcel.Impresion(ws, FT, columnasFijas: 0);
        }

        // ---------------- HOJA 2: el resumen ----------------
        private static void HojaResumen(XLWorkbook libro, DataTable datos)
        {
            var ws = libro.Worksheets.Add("Resumen");

            int fila = EstiloExcel.Banner(ws, 4, "Resumen del personal",
                "Base 105  ·  Clinica Marcial Fallas");
            fila = Bloque(ws, fila, "POR ROL", Contar(datos, "Rol / Horario"));
            fila = Bloque(ws, fila + 1, "POR DIA LIBRE", Contar(datos, "Dia libre"));
            fila = Bloque(ws, fila + 1, "POR AUTORIZACION", Contar(datos, "Autorizado"));
            Bloque(ws, fila + 1, "POR ESTADO", Contar(datos, "Estado"));

            ws.Columns(1, 2).AdjustToContents();
            if (ws.Column(1).Width < 28) ws.Column(1).Width = 28;

            // Esta hoja no es una tabla sino una lista de cajas, asi que
            // no tiene fila de encabezado que congelar: se pasa 0. Aun
            // asi hace falta pasar por aqui, que es donde se acomodan los
            // rotulos que no caben y el titulo que choca con el logo, y
            // donde la hoja queda lista para imprimir. Antes se quedaba
            // sin nada de eso.
            EstiloExcel.Impresion(ws, 0, columnasFijas: 0, apaisado: false);
        }

        private static List<(string Clave, int Cantidad)> Contar(DataTable t, string columna)
        {
            var lista = new List<(string, int)>();
            if (!t.Columns.Contains(columna)) return lista;

            var conteo = new Dictionary<string, int>();
            foreach (DataRow r in t.Rows)
            {
                string clave = r[columna]?.ToString() ?? "";
                if (clave.Length == 0) clave = "(sin dato)";
                conteo[clave] = conteo.TryGetValue(clave, out int n) ? n + 1 : 1;
            }

            foreach (var par in conteo.OrderBy(p => p.Key))
                lista.Add((par.Key, par.Value));

            return lista;
        }

        private static int Bloque(IXLWorksheet ws, int fila, string titulo,
                                  List<(string Clave, int Cantidad)> filas)
        {
            ws.Range(fila, 1, fila, 2).Merge();
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
                ws.Cell(f, 1).Value = "   " + clave;
                ws.Cell(f, 2).Value = cantidad;
                ws.Cell(f, 1).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 1).Style.Font.FontSize = 10;
                ws.Cell(f, 2).Style.Font.Bold = true;
                ws.Cell(f, 2).Style.Font.FontName = EstiloExcel.Fuente;
                ws.Cell(f, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                if ((f - fila) % 2 == 0)
                    ws.Range(f, 1, f, 2).Style.Fill.BackgroundColor = EstiloExcel.Franja;
                ws.Row(f).Height = 17;
                f++;
            }

            if (filas.Count == 0)
            {
                ws.Cell(f, 1).Value = "   (sin datos)";
                ws.Cell(f, 1).Style.Font.Italic = true;
                ws.Cell(f, 1).Style.Font.FontColor = EstiloExcel.TextoSuave;
                f++;
            }

            var caja = ws.Range(fila, 1, f - 1, 2);
            caja.Style.Border.OutsideBorder = XLBorderStyleValues.Medium;
            caja.Style.Border.OutsideBorderColor = EstiloExcel.Azul;
            caja.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            caja.Style.Border.InsideBorderColor = EstiloExcel.Linea;

            return f;
        }
    }
}
