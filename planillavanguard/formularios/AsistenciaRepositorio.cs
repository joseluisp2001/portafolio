using System.Data;
using System.Text;
using Microsoft.Data.SqlClient;

namespace GestorDatos
{
    // ===============================================================
    // MODELOS
    // ===============================================================

    public class Puesto
    {
        public int IdPuesto { get; set; }
        public string Codigo { get; set; } = "";
        public string? Ubicacion { get; set; }

        public string Descripcion =>
            string.IsNullOrWhiteSpace(Ubicacion) ? Codigo : $"{Codigo}  -  {Ubicacion}";

        /// <summary>
        /// Arma la lista de un desplegable de puestos: la opcion vacia,
        /// los puestos activos y, de ultimo, los que ya se retiraron pero
        /// siguen guardados en registros de dias pasados.
        ///
        /// Sin esos ultimos la grilla reclama que el valor guardado no
        /// esta en la lista, y eso pasa apenas se cambia el cuadro de
        /// puestos: la asistencia vieja sigue apuntando a los de antes.
        /// </summary>
        public static List<Puesto> ParaGrilla(IEnumerable<Puesto> activos,
                                              string textoVacio,
                                              IEnumerable<int?>? yaUsados = null)
        {
            var lista = new List<Puesto> { new() { IdPuesto = 0, Codigo = textoVacio } };
            lista.AddRange(activos);

            if (yaUsados is null) return lista;

            foreach (int id in yaUsados.Where(x => x is > 0).Select(x => x!.Value).Distinct())
                if (lista.All(p => p.IdPuesto != id))
                    lista.Add(new Puesto { IdPuesto = id, Codigo = $"(puesto retirado #{id})" });

            return lista;
        }
    }

    /// <summary>Una linea de la lista de asistencia.</summary>
    public class LineaAsistencia
    {
        public int IdOficial { get; set; }
        public string Nombre { get; set; } = "";
        public string Cedula { get; set; } = "";
        public string Turno { get; set; } = "";
        public bool Llego { get; set; }
        public int? IdPuesto { get; set; }

        /// <summary>Codigo del puesto. Solo lo llenan las consultas que lo traen.</summary>
        public string Puesto { get; set; } = "";

        public bool Tardia { get; set; }
        public TimeSpan? HoraLlegada { get; set; }

        /// <summary>
        /// Con que entra ese dia: Rol, Vacante o Extra.
        /// Ver <see cref="TipoJornada"/>.
        /// </summary>
        public string Tipo { get; set; } = TipoJornada.Rol;

        /// <summary>Tiene incapacidad vigente ese dia.</summary>
        public bool Incapacitado { get; set; }
        public DateTime? FinIncapacidad { get; set; }

        /// <summary>Motivo por el que no esta: Ausente o Incapacidad.</summary>
        public string Motivo { get; set; } = "";
    }

    public class OficialDisponible
    {
        public int IdOficial { get; set; }
        public string Nombre { get; set; } = "";
        public string Cedula { get; set; } = "";
        public string Situacion { get; set; } = "";

        /// <summary>Su rol: un turno de horas o Autorizado Externo.</summary>
        public string Horario { get; set; } = "";

        public bool EsExterno => Roles.EsExterno(Horario);

        /// <summary>
        /// Ya quedo cubriendo otro puesto ese dia. No lo descalifica:
        /// solo avisa que si se le asigna, va a hacer un extra mas.
        /// </summary>
        public bool YaCubre =>
            Situacion.StartsWith("YA CUBRE", StringComparison.OrdinalIgnoreCase);
    }

    public class Sustitucion
    {
        public int IdSustitucion { get; set; }
        public int IdOficialAusente { get; set; }
        public string NombreAusente { get; set; } = "";
        public string CedulaAusente { get; set; } = "";
        public int IdOficialSustituto { get; set; }
        public string NombreSustituto { get; set; } = "";
        public string CedulaSustituto { get; set; } = "";

        /// <summary>
        /// Rol de quien cubre: su turno de horas, o Autorizado Externo.
        /// </summary>
        public string TurnoSustituto { get; set; } = "";

        public bool CubreExterno => Roles.EsExterno(TurnoSustituto);

        public int? IdPuesto { get; set; }
        public string Puesto { get; set; } = "";
        public string Turno { get; set; } = "";

        /// <summary>Por que falta. Solo lo trae la proyeccion.</summary>
        public string Motivo { get; set; } = "";
    }

    public class Incapacidad
    {
        public int IdIncapacidad { get; set; }
        public int IdOficial { get; set; }
        public string? NumeroBoleta { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public string? Observacion { get; set; }
    }

    // ===============================================================
    // REPOSITORIO
    // ===============================================================
    public class AsistenciaRepositorio
    {
        private readonly string _conexion;

        /// <summary>
        /// Los ocho turnos de horas, que son a los que se les pasa
        /// lista. Van ordenados por hora de entrada. Varios se
        /// traslapan: el de 14:00 - 21:00 cubre la tarde larga, y los
        /// de 06:00 - 12:00, 07:00 - 16:00 y 12:00 - 18:00 son los
        /// horarios cortos que se agregaron despues.
        /// </summary>
        public static readonly string[] Turnos =
        {
            "06:00 - 12:00",
            "06:00 - 14:00",
            "07:00 - 16:00",
            "12:00 - 18:00",
            "14:00 - 18:00",
            "14:00 - 21:00",
            "18:00 - 00:00",
            "00:00 - 06:00"
        };

        /// <summary>Cuantos turnos hay que cerrar para dar el dia por completo.</summary>
        public static int TotalTurnos => Turnos.Length;

        /// <summary>
        /// Los nueve roles: los ocho turnos mas el autorizado externo.
        /// Es lo que se escoge al registrar y lo que sale en los filtros.
        /// </summary>
        public static string[] TodosLosRoles() =>
            Turnos.Concat(new[] { Roles.Externo }).ToArray();

        public static readonly string[] Dias =
            { "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo" };

        /// <summary>Para un externo, que no tiene dia libre fijo.</summary>
        public const string SinDiaLibre = "Ninguno";

        public static string[] DiasDeRegistro() =>
            Dias.Concat(new[] { SinDiaLibre }).ToArray();

        /// <summary>
        /// Si la base ya tiene donde guardar el tipo de jornada. Se
        /// pregunta una sola vez por cada objeto y queda guardado: se
        /// consulta en cada carga de turno y no tiene sentido volver a
        /// preguntarlo.
        ///
        /// Una base a la que todavia no le corrieron
        /// PlanillaVanguard_ROL_VACANTE_EXTRA.sql sigue funcionando
        /// igual que antes: todo entra como Rol y la columna no se
        /// guarda.
        /// </summary>
        private static bool? _hayTipo;

        /// <summary>
        /// Lo mismo, pero de vw_ReporteDiario, que es de donde sale el
        /// reporte del dia. Se pregunta aparte porque la tabla y la
        /// vista se pueden quedar desfasadas si alguien corre un script
        /// viejo encima, y pedirle a la vista una columna que no tiene
        /// tumba el reporte.
        /// </summary>
        private static bool? _hayTipoEnVista;

        public AsistenciaRepositorio(string? conexion = null)
        {
            _conexion = conexion ?? Conexion.PorDefecto;
        }

        /// <summary>True si dbo.AsistenciaDiaria ya tiene la columna Tipo.</summary>
        public bool HayTipo => TieneTipo("dbo.AsistenciaDiaria", ref _hayTipo);

        /// <summary>True si dbo.vw_ReporteDiario ya trae la columna Tipo.</summary>
        public bool HayTipoEnVista => TieneTipo("dbo.vw_ReporteDiario", ref _hayTipoEnVista);

        private bool TieneTipo(string objeto, ref bool? guardado)
        {
            if (guardado is not null) return guardado.Value;

            try
            {
                using var cn = new SqlConnection(_conexion);
                using var cmd = new SqlCommand(
                    "SELECT CASE WHEN COL_LENGTH(@O,'Tipo') IS NULL THEN 0 ELSE 1 END;", cn);
                cmd.Parameters.AddWithValue("@O", objeto);
                cn.Open();
                guardado = Convert.ToInt32(cmd.ExecuteScalar()) == 1;
            }
            catch
            {
                // Si la base no contesto, no se guarda la respuesta: un
                // tropiezo de red al abrir dejaria el Tipo apagado el
                // resto de la sesion aunque la columna si exista.
                return false;
            }

            return guardado.Value;
        }

        public static string DiaDeLaSemana(DateTime fecha) => fecha.DayOfWeek switch
        {
            DayOfWeek.Monday    => "Lunes",
            DayOfWeek.Tuesday   => "Martes",
            DayOfWeek.Wednesday => "Miercoles",
            DayOfWeek.Thursday  => "Jueves",
            DayOfWeek.Friday    => "Viernes",
            DayOfWeek.Saturday  => "Sabado",
            _                   => "Domingo"
        };

        // -----------------------------------------------------------
        // PUESTOS
        // -----------------------------------------------------------
        /// <summary>
        /// Los puestos activos, en el orden en que se recorren en la base
        /// (CH 1, CH 2, ... BRAVO 0). Ese orden vive en la columna Orden.
        ///
        /// Si la base todavia no tiene esa columna porque no se le corrio
        /// PlanillaVanguard_PUESTOS.sql, se cae de vuelta al orden por
        /// codigo interno en vez de reventar.
        /// </summary>
        public List<Puesto> ListarPuestos()
        {
            const string conOrden = @"
                SELECT IdPuesto, Codigo, Ubicacion
                FROM Puestos WHERE Activo = 1
                ORDER BY ISNULL(Orden, 2147483647), IdPuesto;";

            const string sinOrden = @"
                SELECT IdPuesto, Codigo, Ubicacion
                FROM Puestos WHERE Activo = 1 ORDER BY IdPuesto;";

            try { return LeerPuestos(conOrden); }
            catch (SqlException ex) when (ex.Number == 207) { return LeerPuestos(sinOrden); }
        }

        private List<Puesto> LeerPuestos(string sql)
        {
            var lista = new List<Puesto>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                lista.Add(new Puesto
                {
                    IdPuesto = rd.GetInt32(0),
                    Codigo = rd.GetString(1),
                    Ubicacion = rd.IsDBNull(2) ? null : rd.GetString(2)
                });
            return lista;
        }

        // -----------------------------------------------------------
        // LISTA DE ASISTENCIA
        // -----------------------------------------------------------
        /// <summary>
        /// Oficiales del turno para esa fecha. Excluye a quienes libran
        /// ese dia y marca a los que tienen incapacidad vigente.
        /// </summary>
        public List<LineaAsistencia> ListarOficialesDelTurno(DateTime fecha, string turno)
        {
            string dia = DiaDeLaSemana(fecha);

            // La columna Tipo puede no existir todavia. Se pide como
            // nulo en ese caso para que las posiciones del lector queden
            // igual y el resto de la consulta no cambie.
            string tipo = HayTipo ? "a.Tipo" : "CAST(NULL AS NVARCHAR(10))";

            string sql = $@"
                SELECT o.IdOficial, o.Nombre, o.Cedula, o.Horario,
                       a.Estado, a.IdPuesto, a.Tardia, a.HoraLlegada,
                       i.FechaFin, {tipo}
                FROM Oficiales o
                LEFT JOIN AsistenciaDiaria a
                       ON a.IdOficial = o.IdOficial AND a.Fecha = @Fecha
                LEFT JOIN Incapacidades i
                       ON i.IdOficial = o.IdOficial
                      AND @Fecha BETWEEN i.FechaInicio AND i.FechaFin
                WHERE o.Activo   = 1
                  AND o.Horario  = @Turno
                  AND {DiasLibres.NoLibra("o.DiaLibre", "@Dia")}
                ORDER BY o.Nombre;";

            var lista = new List<LineaAsistencia>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@Fecha", fecha.Date);
            cmd.Parameters.AddWithValue("@Turno", turno);
            cmd.Parameters.AddWithValue("@Dia", dia);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
            {
                string? estado = rd.IsDBNull(4) ? null : rd.GetString(4);
                bool incap = !rd.IsDBNull(8);

                lista.Add(new LineaAsistencia
                {
                    IdOficial = rd.GetInt32(0),
                    Nombre = rd.GetString(1),
                    Cedula = rd.GetString(2),
                    Turno = rd.GetString(3),
                    // Un incapacitado nunca arranca marcado como presente
                    Llego = !incap && (estado is null || estado == "Presente"),
                    IdPuesto = rd.IsDBNull(5) ? null : rd.GetInt32(5),
                    Tardia = !rd.IsDBNull(6) && rd.GetBoolean(6),
                    HoraLlegada = rd.IsDBNull(7) ? null : rd.GetTimeSpan(7),

                    // Un incapacitado no trabajo ese dia: la marca de
                    // como entraba no aplica y se deja en Rol.
                    Tipo = incap || rd.IsDBNull(9)
                        ? TipoJornada.Rol
                        : TipoJornada.Limpiar(rd.GetString(9)),

                    Incapacitado = incap,
                    FinIncapacidad = incap ? rd.GetDateTime(8) : null
                });
            }
            return lista;
        }

        /// <summary>Graba el turno completo. O entra todo, o nada.</summary>
        public void CerrarTurno(DateTime fecha, string turno, List<LineaAsistencia> lineas)
        {
            using var cn = new SqlConnection(_conexion);
            cn.Open();
            using var tx = cn.BeginTransaction();

            try
            {
                using (var del = new SqlCommand(
                    "DELETE FROM AsistenciaDiaria WHERE Fecha = @F AND Turno = @T;", cn, tx))
                {
                    del.Parameters.AddWithValue("@F", fecha.Date);
                    del.Parameters.AddWithValue("@T", turno);
                    del.ExecuteNonQuery();
                }

                bool conTipo = HayTipo;

                string ins = conTipo
                    ? @"INSERT INTO AsistenciaDiaria
                            (Fecha, IdOficial, Turno, IdPuesto, Estado,
                             Tardia, HoraLlegada, Tipo)
                        VALUES (@F, @O, @T, @P, @E, @Tar, @Hora, @Tipo);"
                    : @"INSERT INTO AsistenciaDiaria
                            (Fecha, IdOficial, Turno, IdPuesto, Estado,
                             Tardia, HoraLlegada)
                        VALUES (@F, @O, @T, @P, @E, @Tar, @Hora);";

                foreach (var l in lineas)
                {
                    // Tres estados. Solo un presente puede tener tardia.
                    string estado = l.Incapacitado ? "Incapacidad"
                                  : l.Llego        ? "Presente"
                                                   : "Ausente";

                    bool tardia = estado == "Presente" && l.Tardia;
                    TimeSpan? hora = tardia ? l.HoraLlegada : null;

                    using var cmd = new SqlCommand(ins, cn, tx);
                    cmd.Parameters.AddWithValue("@F", fecha.Date);
                    cmd.Parameters.AddWithValue("@O", l.IdOficial);
                    cmd.Parameters.AddWithValue("@T", turno);
                    cmd.Parameters.AddWithValue("@P", (object?)l.IdPuesto ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@E", estado);
                    cmd.Parameters.AddWithValue("@Tar", tardia);
                    cmd.Parameters.AddWithValue("@Hora", (object?)hora ?? DBNull.Value);

                    if (conTipo)
                        // El incapacitado no entro de ninguna forma:
                        // su linea queda en Rol y no en lo que hubiera
                        // marcado antes de que llegara la boleta.
                        cmd.Parameters.AddWithValue("@Tipo",
                            l.Incapacitado ? TipoJornada.Rol : TipoJornada.Limpiar(l.Tipo));

                    cmd.ExecuteNonQuery();
                }

                const string cierre = @"
                    DELETE FROM TurnosCerrados WHERE Fecha = @F AND Turno = @T;
                    INSERT INTO TurnosCerrados (Fecha, Turno, TotalOficiales, TotalAusentes)
                    VALUES (@F, @T, @Tot, @Aus);";

                using (var cmd = new SqlCommand(cierre, cn, tx))
                {
                    cmd.Parameters.AddWithValue("@F", fecha.Date);
                    cmd.Parameters.AddWithValue("@T", turno);
                    cmd.Parameters.AddWithValue("@Tot", lineas.Count);
                    cmd.Parameters.AddWithValue("@Aus",
                        lineas.Count(x => !x.Llego && !x.Incapacitado));
                    cmd.ExecuteNonQuery();
                }

                tx.Commit();
            }
            catch { tx.Rollback(); throw; }
        }

        public List<string> TurnosCerrados(DateTime fecha)
        {
            const string sql = "SELECT Turno FROM TurnosCerrados WHERE Fecha = @F;";
            var lista = new List<string>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read()) lista.Add(rd.GetString(0));
            return lista;
        }

        public List<string> TurnosPendientes(DateTime fecha)
        {
            var cerrados = TurnosCerrados(fecha);
            return Turnos.Where(t => !cerrados.Contains(t)).ToList();
        }

        // -----------------------------------------------------------
        // SUSTITUCIONES
        // -----------------------------------------------------------
        /// <summary>Ausentes e incapacitados: ambos dejan el puesto solo.</summary>
        public List<LineaAsistencia> ListarAusentes(DateTime fecha)
        {
            const string sql = @"
                SELECT a.IdOficial, o.Nombre, o.Cedula, a.Turno, a.IdPuesto, a.Estado,
                       ISNULL(p.Codigo, N'')
                FROM AsistenciaDiaria a
                INNER JOIN Oficiales o ON o.IdOficial = a.IdOficial
                LEFT  JOIN Puestos   p ON p.IdPuesto  = a.IdPuesto
                WHERE a.Fecha = @F AND a.Estado IN ('Ausente','Incapacidad')
                ORDER BY a.Turno, o.Nombre;";

            var lista = new List<LineaAsistencia>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
            {
                string estado = rd.GetString(5);
                lista.Add(new LineaAsistencia
                {
                    IdOficial = rd.GetInt32(0),
                    Nombre = rd.GetString(1),
                    Cedula = rd.GetString(2),
                    Turno = rd.GetString(3),
                    IdPuesto = rd.IsDBNull(4) ? null : rd.GetInt32(4),
                    Puesto = rd.GetString(6),
                    Llego = false,
                    Incapacitado = estado == "Incapacidad",
                    Motivo = estado == "Incapacidad" ? "Incapacidad" : "Ausente"
                });
            }
            return lista;
        }

        /// <summary>
        /// Todo el personal que puede cubrir un puesto ese dia, sin
        /// importar el turno al que pertenezca. Incluye a los autorizados
        /// externos.
        ///
        /// Solo se dejan por fuera los que de verdad no pueden: inactivos,
        /// incapacitados y los que ya se marcaron ausentes ese dia.
        ///
        /// El que ya esta cubriendo otro puesto SI sigue apareciendo: en
        /// la base 105 es normal que un oficial haga extras y agarre mas
        /// de un puesto el mismo dia. Se avisa en la columna Situacion
        /// para que quien asigna lo tenga claro.
        /// </summary>
        public List<OficialDisponible> ListarDisponibles(DateTime fecha, string turnoActual)
        {
            string dia = DiaDeLaSemana(fecha);

            string libra = DiasLibres.Libra("o.DiaLibre", "@Dia");

            string sql = $@"
                SELECT o.IdOficial, o.Nombre, o.Cedula, o.Horario,
                       CASE
                           WHEN x.Cubriendo > 0 THEN
                                N'YA CUBRE ' + CAST(x.Cubriendo AS NVARCHAR(3)) +
                                N' puesto(s)  -  extra'
                           WHEN o.Horario  = @Externo THEN N'Autorizado externo'
                           WHEN {libra}               THEN N'Libra hoy  -  turno ' + o.Horario
                           WHEN o.Horario  = @Turno   THEN N'Mismo turno ' + o.Horario
                           ELSE N'Turno ' + o.Horario
                       END AS Situacion
                FROM Oficiales o
                OUTER APPLY (
                    SELECT COUNT(*) AS Cubriendo
                    FROM Sustituciones s
                    WHERE s.Fecha = @F AND s.IdOficialSustituto = o.IdOficial
                ) x
                WHERE o.Activo = 1
                  AND o.IdOficial NOT IN (
                        SELECT IdOficial FROM AsistenciaDiaria
                        WHERE Fecha = @F AND Estado IN ('Ausente','Incapacidad'))
                  AND o.IdOficial NOT IN (
                        SELECT IdOficial FROM Incapacidades
                        WHERE @F BETWEEN FechaInicio AND FechaFin)
                ORDER BY
                    CASE
                        WHEN x.Cubriendo > 0       THEN 3
                        WHEN o.Horario  = @Externo THEN 2
                        WHEN {libra}               THEN 1
                        ELSE 0
                    END,
                    o.Nombre;";

            var lista = new List<OficialDisponible>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cmd.Parameters.AddWithValue("@Turno", turnoActual);
            cmd.Parameters.AddWithValue("@Dia", dia);
            cmd.Parameters.AddWithValue("@Externo", Roles.Externo);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                lista.Add(new OficialDisponible
                {
                    IdOficial = rd.GetInt32(0),
                    Nombre = rd.GetString(1),
                    Cedula = rd.GetString(2),
                    Horario = rd.GetString(3),
                    Situacion = rd.GetString(4)
                });
            return lista;
        }

        public void AsignarSustituto(DateTime fecha, string turno,
                                     int idAusente, int idSustituto, int? idPuesto)
        {
            const string sql = @"
                INSERT INTO Sustituciones
                    (Fecha, Turno, IdOficialAusente, IdOficialSustituto, IdPuesto)
                VALUES (@F, @T, @A, @S, @P);";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cmd.Parameters.AddWithValue("@T", turno);
            cmd.Parameters.AddWithValue("@A", idAusente);
            cmd.Parameters.AddWithValue("@S", idSustituto);
            cmd.Parameters.AddWithValue("@P", (object?)idPuesto ?? DBNull.Value);
            cn.Open();
            cmd.ExecuteNonQuery();
        }

        public void QuitarSustitucion(int idSustitucion)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(
                "DELETE FROM Sustituciones WHERE IdSustitucion = @Id;", cn);
            cmd.Parameters.AddWithValue("@Id", idSustitucion);
            cn.Open();
            cmd.ExecuteNonQuery();
        }

        public List<Sustitucion> ListarSustituciones(DateTime fecha)
        {
            const string sql = @"
                SELECT s.IdSustitucion,
                       s.IdOficialAusente,   oa.Nombre, oa.Cedula,
                       s.IdOficialSustituto, os.Nombre, os.Cedula, os.Horario,
                       s.IdPuesto,           ISNULL(p.Codigo, N''),
                       s.Turno
                FROM Sustituciones s
                INNER JOIN Oficiales oa ON oa.IdOficial = s.IdOficialAusente
                INNER JOIN Oficiales os ON os.IdOficial = s.IdOficialSustituto
                LEFT  JOIN Puestos   p  ON p.IdPuesto   = s.IdPuesto
                WHERE s.Fecha = @F
                ORDER BY s.Turno, oa.Nombre;";

            var lista = new List<Sustitucion>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                lista.Add(new Sustitucion
                {
                    IdSustitucion = rd.GetInt32(0),
                    IdOficialAusente = rd.GetInt32(1),
                    NombreAusente = rd.GetString(2),
                    CedulaAusente = rd.GetString(3),
                    IdOficialSustituto = rd.GetInt32(4),
                    NombreSustituto = rd.GetString(5),
                    CedulaSustituto = rd.GetString(6),
                    TurnoSustituto = rd.GetString(7),
                    IdPuesto = rd.IsDBNull(8) ? null : rd.GetInt32(8),
                    Puesto = rd.GetString(9),
                    Turno = rd.GetString(10)
                });
            return lista;
        }

        // -----------------------------------------------------------
        // INCAPACIDADES
        // -----------------------------------------------------------
        /// <summary>
        /// Todas, con dias restantes y estado calculados por la vista.
        /// El texto busca por nombre, cedula o numero de boleta.
        /// </summary>
        public DataTable ListarIncapacidades(bool soloVigentes = false, string? texto = null)
        {
            var sql = new StringBuilder(@"
                SELECT
                    IdIncapacidad  AS [Id],
                    Oficial        AS [Oficial],
                    Cedula         AS [Cedula],
                    Turno          AS [Turno],
                    NumeroBoleta   AS [Boleta],
                    FechaInicio    AS [Inicio],
                    FechaFin       AS [Fin],
                    DiasTotales    AS [Dias totales],
                    DiasRestantes  AS [Dias restantes],
                    Estado         AS [Estado],
                    Observacion    AS [Observacion]
                FROM vw_Incapacidades
                WHERE 1 = 1");

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand { Connection = cn };

            if (soloVigentes) sql.Append(" AND Estado <> N'Vencida'");

            if (!string.IsNullOrWhiteSpace(texto))
            {
                sql.Append(" AND (Oficial LIKE @T OR Cedula LIKE @T OR NumeroBoleta LIKE @T)");
                cmd.Parameters.AddWithValue("@T", "%" + texto.Trim() + "%");
            }

            sql.Append(" ORDER BY CASE Estado WHEN N'Activa' THEN 0 " +
                       "WHEN N'Programada' THEN 1 ELSE 2 END, FechaFin;");

            cmd.CommandText = sql.ToString();

            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }

        /// <summary>
        /// Todo el personal activo, de cualquier rol, para los
        /// desplegables de los formularios.
        /// </summary>
        public List<OficialDisponible> ListarOficialesSimple()
        {
            const string sql = @"
                SELECT IdOficial, Nombre, Cedula, Horario
                FROM Oficiales WHERE Activo = 1 ORDER BY Nombre;";

            var lista = new List<OficialDisponible>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                lista.Add(new OficialDisponible
                {
                    IdOficial = rd.GetInt32(0),
                    Nombre = rd.GetString(1),
                    Cedula = rd.GetString(2),
                    Horario = rd.GetString(3),
                    Situacion = rd.GetString(3)
                });
            return lista;
        }

        /// <summary>True si el oficial ya tiene una incapacidad que se traslapa.</summary>
        public bool ExisteTraslape(int idOficial, DateTime inicio, DateTime fin)
        {
            const string sql = @"
                SELECT COUNT(1) FROM Incapacidades
                WHERE IdOficial = @O
                  AND @Ini <= FechaFin AND @Fin >= FechaInicio;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@O", idOficial);
            cmd.Parameters.AddWithValue("@Ini", inicio.Date);
            cmd.Parameters.AddWithValue("@Fin", fin.Date);
            cn.Open();
            return (int)cmd.ExecuteScalar() > 0;
        }

        /// <summary>
        /// Registra la incapacidad y le perdona las ausencias que caigan
        /// dentro de esas fechas.
        ///
        /// La boleta casi nunca llega el mismo dia: al oficial ya se le
        /// paso lista como ausente y la incapacidad aparece despues. Esas
        /// ausencias no son faltas, asi que los dias que quedaron en
        /// 'Ausente' dentro del rango pasan a 'Incapacidad' y el contador
        /// del oficial se vuelve a sacar. Los dias en que si llego a
        /// trabajar no se tocan: si estuvo, estuvo.
        ///
        /// Devuelve el codigo de la incapacidad y cuantas ausencias se
        /// le quitaron.
        /// </summary>
        public (int Id, int AusenciasQuitadas) AgregarIncapacidad(Incapacidad i)
        {
            const string ins = @"
                INSERT INTO Incapacidades
                    (IdOficial, NumeroBoleta, FechaInicio, FechaFin, Observacion)
                VALUES (@O, @B, @Ini, @Fin, @Obs);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            const string perdonar = @"
                UPDATE AsistenciaDiaria
                SET Estado      = N'Incapacidad',
                    Tardia      = 0,
                    HoraLlegada = NULL
                WHERE IdOficial = @O
                  AND Fecha BETWEEN @Ini AND @Fin
                  AND Estado = N'Ausente';";

            // El contador se rehace de la asistencia, que es la fuente:
            // asi no queda un numero suelto que dependa de restas.
            const string contadores = @"
                UPDATE o
                SET o.Ausencias = ISNULL(x.Ausencias, 0),
                    o.Tardias   = ISNULL(x.Tardias, 0)
                FROM Oficiales o
                LEFT JOIN (
                    SELECT IdOficial,
                           SUM(CASE WHEN Estado = N'Ausente' THEN 1 ELSE 0 END) AS Ausencias,
                           SUM(CASE WHEN Tardia = 1          THEN 1 ELSE 0 END) AS Tardias
                    FROM AsistenciaDiaria
                    WHERE IdOficial = @O
                    GROUP BY IdOficial
                ) x ON x.IdOficial = o.IdOficial
                WHERE o.IdOficial = @O;";

            using var cn = new SqlConnection(_conexion);
            cn.Open();
            using var tx = cn.BeginTransaction();

            try
            {
                int id;
                using (var cmd = new SqlCommand(ins, cn, tx))
                {
                    cmd.Parameters.AddWithValue("@O", i.IdOficial);
                    cmd.Parameters.AddWithValue("@B", (object?)i.NumeroBoleta ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Ini", i.FechaInicio.Date);
                    cmd.Parameters.AddWithValue("@Fin", i.FechaFin.Date);
                    cmd.Parameters.AddWithValue("@Obs", (object?)i.Observacion ?? DBNull.Value);
                    id = (int)cmd.ExecuteScalar();
                }

                int quitadas;
                using (var cmd = new SqlCommand(perdonar, cn, tx))
                {
                    cmd.Parameters.AddWithValue("@O", i.IdOficial);
                    cmd.Parameters.AddWithValue("@Ini", i.FechaInicio.Date);
                    cmd.Parameters.AddWithValue("@Fin", i.FechaFin.Date);
                    quitadas = cmd.ExecuteNonQuery();
                }

                using (var cmd = new SqlCommand(contadores, cn, tx))
                {
                    cmd.Parameters.AddWithValue("@O", i.IdOficial);
                    cmd.ExecuteNonQuery();
                }

                tx.Commit();
                return (id, quitadas);
            }
            catch { tx.Rollback(); throw; }
        }

        public void EliminarIncapacidad(int idIncapacidad)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(
                "DELETE FROM Incapacidades WHERE IdIncapacidad = @Id;", cn);
            cmd.Parameters.AddWithValue("@Id", idIncapacidad);
            cn.Open();
            cmd.ExecuteNonQuery();
        }

        // -----------------------------------------------------------
        // PROYECCION
        // -----------------------------------------------------------
        /// <summary>Quien trabaja una fecha. Solo consulta.</summary>
        public DataTable Proyeccion(DateTime fecha, string? turno = null)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand("sp_Proyeccion", cn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@Fecha", fecha.Date);
            cmd.Parameters.AddWithValue("@Turno", (object?)turno ?? DBNull.Value);

            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }

        // -----------------------------------------------------------
        // VERIFICACION POR TURNO
        // -----------------------------------------------------------
        public DataTable ResumenPorTurno(DateTime fecha)
        {
            const string sql = @"
                SELECT
                    a.Turno                                                   AS [Turno],
                    COUNT(*)                                                  AS [Oficiales],
                    SUM(CASE WHEN a.Estado='Presente'    THEN 1 ELSE 0 END)   AS [Presentes],
                    SUM(CASE WHEN a.Tardia=1             THEN 1 ELSE 0 END)   AS [Tardias],
                    SUM(CASE WHEN a.Estado='Ausente'     THEN 1 ELSE 0 END)   AS [Ausentes],
                    SUM(CASE WHEN a.Estado='Incapacidad' THEN 1 ELSE 0 END)   AS [Incapacidad],
                    ISNULL(s.Cubiertos,0)                                     AS [Cubiertos],
                    SUM(CASE WHEN a.Estado IN ('Ausente','Incapacidad') THEN 1 ELSE 0 END)
                        - ISNULL(s.Cubiertos,0)                               AS [Sin cubrir],
                    SUM(CASE WHEN a.Estado='Presente' AND a.IdPuesto IS NULL
                             THEN 1 ELSE 0 END)                               AS [Sin puesto]
                FROM AsistenciaDiaria a
                LEFT JOIN (
                    SELECT Turno, COUNT(*) AS Cubiertos
                    FROM Sustituciones WHERE Fecha=@F GROUP BY Turno
                ) s ON s.Turno = a.Turno
                WHERE a.Fecha = @F
                GROUP BY a.Turno, s.Cubiertos
                ORDER BY a.Turno;";

            return Consultar(sql, fecha);
        }

        public DataTable DetalleDelDia(DateTime fecha, string? turno = null)
        {
            // El Tipo va pegado al Turno: lo primero que se mira de una
            // linea es de que horario es y si esa persona entro por su
            // rol, a una vacante o de extra.
            string tipo = HayTipoEnVista ? "Tipo AS [Tipo]," : "N'Rol' AS [Tipo],";

            string sql = $@"
                SELECT
                    Turno         AS [Turno],
                    {tipo}
                    Puesto        AS [Puesto],
                    Ubicacion     AS [Ubicacion],
                    Oficial       AS [Oficial asignado],
                    EstadoDetalle AS [Estado],
                    CONVERT(VARCHAR(5), HoraLlegada, 108) AS [Hora llegada],
                    Sustituto     AS [Lo cubre]
                FROM vw_ReporteDiario
                WHERE Fecha = @F";

            if (!string.IsNullOrWhiteSpace(turno)) sql += " AND Turno = @T";
            sql += " ORDER BY Turno, Puesto, Oficial;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            if (!string.IsNullOrWhiteSpace(turno)) cmd.Parameters.AddWithValue("@T", turno);

            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }

        // -----------------------------------------------------------
        // HISTORIAL DE INCIDENCIAS
        // -----------------------------------------------------------
        public DataTable ResumenIncidencias(DateTime desde, DateTime hasta)
        {
            const string sql = @"
                SELECT
                    o.Nombre  AS [Oficial],
                    o.Cedula  AS [Cedula],
                    o.Horario AS [Turno],
                    SUM(CASE WHEN a.Estado='Ausente' THEN 1 ELSE 0 END) AS [Ausencias],
                    SUM(CASE WHEN a.Tardia=1         THEN 1 ELSE 0 END) AS [Tardias],
                    COUNT(*)                                            AS [Dias registrados]
                FROM AsistenciaDiaria a
                INNER JOIN Oficiales o ON o.IdOficial = a.IdOficial
                WHERE a.Fecha BETWEEN @D AND @H
                GROUP BY o.Nombre, o.Cedula, o.Horario
                HAVING SUM(CASE WHEN a.Estado='Ausente' THEN 1 ELSE 0 END) > 0
                    OR SUM(CASE WHEN a.Tardia=1         THEN 1 ELSE 0 END) > 0
                ORDER BY [Ausencias] DESC, [Tardias] DESC, o.Nombre;";

            return ConsultarRango(sql, desde, hasta);
        }

        public DataTable DetalleIncidencias(DateTime desde, DateTime hasta, string? tipo = null)
        {
            string sql = @"
                SELECT
                    Fecha    AS [Fecha],
                    Turno    AS [Turno],
                    Oficial  AS [Oficial],
                    Cedula   AS [Cedula],
                    Puesto   AS [Puesto],
                    Tipo     AS [Tipo],
                    CONVERT(VARCHAR(5), HoraLlegada, 108) AS [Hora llegada]
                FROM vw_IncidenciasAsistencia
                WHERE Fecha BETWEEN @D AND @H";

            if (!string.IsNullOrWhiteSpace(tipo)) sql += " AND Tipo = @Tipo";
            sql += " ORDER BY Fecha DESC, Oficial;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@D", desde.Date);
            cmd.Parameters.AddWithValue("@H", hasta.Date);
            if (!string.IsNullOrWhiteSpace(tipo)) cmd.Parameters.AddWithValue("@Tipo", tipo);

            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }

        // -----------------------------------------------------------
        // REPORTE DIARIO
        // -----------------------------------------------------------
        public bool ReporteYaGenerado(DateTime fecha)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(
                "SELECT COUNT(1) FROM ReportesDiarios WHERE Fecha = @F;", cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cn.Open();
            return (int)cmd.ExecuteScalar() > 0;
        }

        public DataTable ObtenerReporte(DateTime fecha)
        {
            string tipo = HayTipoEnVista ? "Tipo," : "N'Rol' AS Tipo,";

            string sql = $@"
                SELECT Turno, {tipo} Puesto, Ubicacion, Oficial, Cedula,
                       EstadoDetalle AS Estado,
                       CONVERT(VARCHAR(5), HoraLlegada, 108) AS HoraLlegada,
                       Sustituto, CedulaSustituto
                FROM vw_ReporteDiario
                WHERE Fecha = @F
                ORDER BY Turno, Puesto, Oficial;";

            return Consultar(sql, fecha);
        }

        /// <summary>Dias que ya tienen asistencia registrada, para el selector.</summary>
        public DataTable DiasConDatos()
        {
            const string sql = @"
                SELECT
                    a.Fecha                                                   AS [Fecha],
                    COUNT(*)                                                  AS [Oficiales],
                    SUM(CASE WHEN a.Estado='Ausente'     THEN 1 ELSE 0 END)   AS [Ausentes],
                    SUM(CASE WHEN a.Tardia=1             THEN 1 ELSE 0 END)   AS [Tardias],
                    SUM(CASE WHEN a.Estado='Incapacidad' THEN 1 ELSE 0 END)   AS [Incapacidad],
                    (SELECT COUNT(*) FROM TurnosCerrados tc WHERE tc.Fecha=a.Fecha) AS [Turnos cerrados],
                    CASE WHEN EXISTS (SELECT 1 FROM ReportesDiarios r WHERE r.Fecha=a.Fecha)
                         THEN N'Si' ELSE N'No' END                            AS [Reporte generado]
                FROM AsistenciaDiaria a
                GROUP BY a.Fecha
                ORDER BY a.Fecha DESC;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }

        public void RegistrarReporte(DateTime fecha, string? rutaArchivo)
        {
            using var cn = new SqlConnection(_conexion);
            cn.Open();
            using var tx = cn.BeginTransaction();

            try
            {
                using (var sp = new SqlCommand("sp_RecalcularContadores", cn, tx))
                {
                    sp.CommandType = CommandType.StoredProcedure;
                    sp.ExecuteNonQuery();
                }

                const string sql = @"
                    DELETE FROM ReportesDiarios WHERE Fecha = @F;

                    INSERT INTO ReportesDiarios
                        (Fecha, TotalOficiales, TotalPresentes,
                         TotalAusentes, TotalSustituciones, RutaArchivo)
                    SELECT @F,
                        (SELECT COUNT(*) FROM AsistenciaDiaria WHERE Fecha=@F),
                        (SELECT COUNT(*) FROM AsistenciaDiaria WHERE Fecha=@F AND Estado='Presente'),
                        (SELECT COUNT(*) FROM AsistenciaDiaria WHERE Fecha=@F AND Estado='Ausente'),
                        (SELECT COUNT(*) FROM Sustituciones    WHERE Fecha=@F),
                        @Ruta;";

                using (var cmd = new SqlCommand(sql, cn, tx))
                {
                    cmd.Parameters.AddWithValue("@F", fecha.Date);
                    cmd.Parameters.AddWithValue("@Ruta", (object?)rutaArchivo ?? DBNull.Value);
                    cmd.ExecuteNonQuery();
                }

                tx.Commit();
            }
            catch { tx.Rollback(); throw; }
        }

        public (int Total, int Presentes, int Tardias, int Ausentes, int Sustituciones)
            Totales(DateTime fecha)
        {
            const string sql = @"
                SELECT
                    (SELECT COUNT(*) FROM AsistenciaDiaria WHERE Fecha=@F),
                    (SELECT COUNT(*) FROM AsistenciaDiaria WHERE Fecha=@F AND Estado='Presente'),
                    (SELECT COUNT(*) FROM AsistenciaDiaria WHERE Fecha=@F AND Tardia=1),
                    (SELECT COUNT(*) FROM AsistenciaDiaria WHERE Fecha=@F AND Estado='Ausente'),
                    (SELECT COUNT(*) FROM Sustituciones    WHERE Fecha=@F);";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cn.Open();
            using var rd = cmd.ExecuteReader();
            return rd.Read()
                ? (rd.GetInt32(0), rd.GetInt32(1), rd.GetInt32(2), rd.GetInt32(3), rd.GetInt32(4))
                : (0, 0, 0, 0, 0);
        }

        // -----------------------------------------------------------
        private DataTable Consultar(string sql, DateTime fecha)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }

        private DataTable ConsultarRango(string sql, DateTime desde, DateTime hasta)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@D", desde.Date);
            cmd.Parameters.AddWithValue("@H", hasta.Date);
            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }
    }
}
