using System.Data;
using Microsoft.Data.SqlClient;

namespace GestorDatos
{
    /// <summary>Una linea del plan de un dia proyectado.</summary>
    public class LineaProyeccion
    {
        public int IdOficial { get; set; }
        public string Nombre { get; set; } = "";
        public string Cedula { get; set; } = "";
        public string Turno { get; set; } = "";
        public int? IdPuesto { get; set; }

        /// <summary>False = no va a estar ese dia.</summary>
        public bool Disponible { get; set; } = true;

        /// <summary>Incapacidad, Vacaciones, Permiso, Renuncia u Otro.</summary>
        public string? Motivo { get; set; }

        public int? IdOficialSustituto { get; set; }
        public string NombreSustituto { get; set; } = "";

        /// <summary>
        /// Rol, Vacante o Extra: con que se cubre esa casilla ese dia.
        /// Cuando el titular falta y otro lo sustituye, casi siempre es
        /// un extra. Ver <see cref="TipoJornada"/>.
        /// </summary>
        public string Tipo { get; set; } = TipoJornada.Rol;

        /// <summary>Tiene incapacidad registrada para esa fecha: no se puede editar.</summary>
        public bool IncapacidadFija { get; set; }
        public DateTime? FinIncapacidad { get; set; }

        /// <summary>
        /// Quien va a estar de verdad en ese puesto: el titular si va, y
        /// si no, quien lo cubre. Vacio si el puesto queda descubierto.
        /// </summary>
        public string QuienEstara =>
            Disponible ? Nombre : NombreSustituto;

        public bool Descubierto => !Disponible && NombreSustituto.Length == 0;

        public bool EsExtra => TipoJornada.EsExtra(Tipo);

        public bool EsVacante => TipoJornada.EsVacante(Tipo);

        /// <summary>
        /// La casilla del NOMBRE en el cuadro de varios dias.
        ///
        /// Antes esta casilla cargaba las tres cosas juntas: el titular,
        /// quien lo cubria y el motivo. Ahora quien cubre tiene columna
        /// propia (ver <see cref="TextoCubre"/>) y aqui queda solo lo
        /// que es del titular: su nombre y, si falta, por que falta.
        /// </summary>
        public string TextoTitular
        {
            get
            {
                // La marca (extra)/(vacante) va sobre quien de verdad
                // ocupa la casilla. Si el titular esta, es el; si no,
                // se la lleva el que cubre, en la otra columna.
                if (Disponible) return ConExtra(Nombre);

                return string.IsNullOrWhiteSpace(Motivo)
                    ? Nombre
                    : Nombre + "\n" + Motivo!.Trim();
            }
        }

        /// <summary>
        /// La casilla de LO CUBRE, al lado de la del nombre: quien esta
        /// cubriendo al de la columna de la izquierda.
        ///
        /// Vacia cuando el titular va a estar, que es lo normal. Cuando
        /// falta y nadie lo toma, dice SIN CUBRIR, que es lo que hay que
        /// resolver antes de pegar el papel en la garita.
        /// </summary>
        public string TextoCubre =>
            Disponible ? ""
            : NombreSustituto.Length > 0 ? ConExtra(NombreSustituto)
            : "SIN CUBRIR";

        /// <summary>
        /// Cuantos renglones ocupa la fila de este oficial: el mayor de
        /// las dos casillas, porque las dos van en la misma fila.
        /// </summary>
        public int RenglonesCasilla =>
            Math.Max(Renglones(TextoTitular), Renglones(TextoCubre));

        private static int Renglones(string texto) =>
            texto.Length == 0 ? 0 : texto.Count(c => c == '\n') + 1;

        /// <summary>
        /// El nombre con la marca de como entra, cuando no entra por su
        /// rol. Un "Rol" no lleva nada: es lo normal y escribirlo en
        /// cada casilla solo llenaria el cuadro de ruido.
        /// </summary>
        private string ConExtra(string nombre) =>
            EsExtra   ? nombre + "  (extra)"   :
            EsVacante ? nombre + "  (vacante)" : nombre;
    }

    /// <summary>Un oficial al que le toca librar ese dia.</summary>
    public class OficialLibre
    {
        public int IdOficial { get; set; }
        public string Nombre { get; set; } = "";
        public string Turno { get; set; } = "";

        /// <summary>
        /// Le tocaba librar, pero entro a cubrir a alguien: ese dia si
        /// trabajo. Su nombre sale en el rol, en la fila del que falto,
        /// y NO tiene que salir tambien en el bloque de libres.
        ///
        /// Es justo lo que en el cuaderno se lee de memoria: si en una
        /// casilla aparece alguien que ese dia libraba, es porque entro
        /// a sustituir.
        /// </summary>
        public bool EntroACubrir { get; set; }
    }

    /// <summary>Un dia del plan, ya resuelto, para el reporte de varios dias.</summary>
    public class DiaProyectado
    {
        public DateTime Fecha { get; set; }
        public List<LineaProyeccion> Lineas { get; set; } = new();

        /// <summary>
        /// Los que libran ese dia. No entran en el rol, pero en el
        /// cuaderno van anotados aparte para saber a quien no buscar.
        /// </summary>
        public List<OficialLibre> Libres { get; set; } = new();

        /// <summary>True si esa fecha ya tenia un plan guardado.</summary>
        public bool Guardado { get; set; }
    }

    /// <summary>
    /// Proyeccion: el plan de un dia futuro. Vive aparte de la
    /// asistencia real para no contaminar los contadores.
    /// </summary>
    public class ProyeccionRepositorio
    {
        private readonly string _conexion;

        public static readonly string[] Motivos =
            { "Incapacidad", "Vacaciones", "Permiso", "Renuncia", "Otro" };

        /* Los tres tipos viven en TipoJornada, que es de donde tambien
           los toma la asistencia. Aqui quedan estos nombres porque la
           pantalla de proyeccion ya los usaba. */
        public const string TipoRol = TipoJornada.Rol;
        public const string TipoVacante = TipoJornada.Vacante;
        public const string TipoExtra = TipoJornada.Extra;

        /// <summary>Lo que ofrece el desplegable de Tipo.</summary>
        public static readonly string[] Tipos = TipoJornada.Todos;

        /// <summary>
        /// Si la base ya tiene la columna Tipo. Se pregunta una sola vez
        /// y queda guardado: CargarRango llama a Cargar hasta 62 veces
        /// seguidas y no tiene sentido revisarlo en cada vuelta.
        ///
        /// Una base a la que todavia no le corrieron
        /// PlanillaVanguard_TIPO_EXTRA.sql sigue funcionando igual que
        /// antes: todo entra como Rol y la columna no se guarda.
        /// </summary>
        private static bool? _hayTipo;

        /// <summary>
        /// Lo mismo, pero de la vista vw_ProyeccionDia, que es de donde
        /// sale el reporte del dia.
        ///
        /// Se pregunta aparte a proposito: la tabla y la vista se pueden
        /// quedar desfasadas si alguien corre un script viejo encima, y
        /// pedirle a la vista una columna que no tiene tumba el reporte.
        /// </summary>
        private static bool? _hayTipoEnVista;

        public ProyeccionRepositorio(string? conexion = null)
        {
            _conexion = conexion ?? Conexion.PorDefecto;
        }

        public bool HayTipo => TieneColumna("dbo.ProyeccionDia", "Tipo", ref _hayTipo);

        public bool HayTipoEnVista =>
            TieneColumna("dbo.vw_ProyeccionDia", "Tipo", ref _hayTipoEnVista);

        private bool TieneColumna(string objeto, string columna, ref bool? guardado)
        {
            if (guardado is not null) return guardado.Value;

            try
            {
                using var cn = new SqlConnection(_conexion);
                using var cmd = new SqlCommand(
                    "SELECT CASE WHEN COL_LENGTH(@O,@C) IS NULL THEN 0 ELSE 1 END;", cn);
                cmd.Parameters.AddWithValue("@O", objeto);
                cmd.Parameters.AddWithValue("@C", columna);
                cn.Open();
                guardado = Convert.ToInt32(cmd.ExecuteScalar()) == 1;
            }
            catch
            {
                // Si la base no contesto, no se guarda la respuesta:
                // un tropiezo de red al abrir dejaria el Tipo apagado
                // el resto de la sesion aunque la columna si exista.
                return false;
            }

            return guardado.Value;
        }

        /// <summary>Deja el Tipo en uno de los tres valores que la base acepta.</summary>
        public static string LimpiarTipo(string? tipo) => TipoJornada.Limpiar(tipo);

        /// <summary>True si esa fecha ya tiene un plan guardado.</summary>
        public bool ExisteProyeccion(DateTime fecha)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(
                "SELECT COUNT(1) FROM ProyeccionDia WHERE Fecha = @F;", cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cn.Open();
            return (int)cmd.ExecuteScalar() > 0;
        }

        /// <summary>
        /// Arma el plan del dia. Toma los oficiales que corresponden por
        /// horario y dia libre, les aplica lo que ya se haya guardado, y
        /// marca automaticamente a los que tienen incapacidad esa fecha.
        /// </summary>
        public List<LineaProyeccion> Cargar(DateTime fecha, string? turno = null)
        {
            string dia = AsistenciaRepositorio.DiaDeLaSemana(fecha);

            // La columna Tipo puede no existir todavia. Se pide como
            // nulo en ese caso para que el resto de la consulta y las
            // posiciones del lector queden igual.
            string tipo = HayTipo ? "pr.Tipo" : "CAST(NULL AS NVARCHAR(10))";

            string sql = $@"
                SELECT
                    o.IdOficial, o.Nombre, o.Cedula, o.Horario,
                    pr.IdPuesto, pr.Disponible, pr.Motivo,
                    pr.IdOficialSustituto, ISNULL(sus.Nombre, N''),
                    i.FechaFin, {tipo}
                FROM Oficiales o
                LEFT JOIN ProyeccionDia pr
                       ON pr.IdOficial = o.IdOficial AND pr.Fecha = @F
                LEFT JOIN Oficiales sus
                       ON sus.IdOficial = pr.IdOficialSustituto
                LEFT JOIN Incapacidades i
                       ON i.IdOficial = o.IdOficial
                      AND @F BETWEEN i.FechaInicio AND i.FechaFin
                WHERE o.Activo = 1
                  AND {DiasLibres.NoLibra("o.DiaLibre", "@Dia")}
                  AND o.Horario <> @Externo";

            if (!string.IsNullOrWhiteSpace(turno)) sql += " AND o.Horario = @T";
            sql += " ORDER BY o.Horario, o.Nombre;";

            var lista = new List<LineaProyeccion>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cmd.Parameters.AddWithValue("@Dia", dia);
            cmd.Parameters.AddWithValue("@Externo", Roles.Externo);
            if (!string.IsNullOrWhiteSpace(turno)) cmd.Parameters.AddWithValue("@T", turno);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
            {
                bool incap = !rd.IsDBNull(9);
                bool hayPlan = !rd.IsDBNull(5);

                lista.Add(new LineaProyeccion
                {
                    IdOficial = rd.GetInt32(0),
                    Nombre = rd.GetString(1),
                    Cedula = rd.GetString(2),
                    Turno = rd.GetString(3),
                    IdPuesto = rd.IsDBNull(4) ? null : rd.GetInt32(4),

                    // La incapacidad manda: no se puede planear como disponible
                    Disponible = incap ? false : (!hayPlan || rd.GetBoolean(5)),
                    Motivo = incap ? "Incapacidad"
                                   : (rd.IsDBNull(6) ? null : rd.GetString(6)),

                    IdOficialSustituto = rd.IsDBNull(7) ? null : rd.GetInt32(7),
                    NombreSustituto = rd.GetString(8),

                    Tipo = rd.IsDBNull(10) ? TipoRol : LimpiarTipo(rd.GetString(10)),

                    IncapacidadFija = incap,
                    FinIncapacidad = incap ? rd.GetDateTime(9) : null
                });
            }

            return lista;
        }

        /// <summary>
        /// Guarda el plan. Reemplaza lo que hubiera para esa fecha
        /// (y turno, si se indica). O entra todo, o no entra nada.
        /// </summary>
        public void Guardar(DateTime fecha, string? turno, List<LineaProyeccion> lineas)
        {
            using var cn = new SqlConnection(_conexion);
            cn.Open();
            using var tx = cn.BeginTransaction();

            try
            {
                string del = "DELETE FROM ProyeccionDia WHERE Fecha = @F";
                if (!string.IsNullOrWhiteSpace(turno)) del += " AND Turno = @T";

                using (var cmd = new SqlCommand(del + ";", cn, tx))
                {
                    cmd.Parameters.AddWithValue("@F", fecha.Date);
                    if (!string.IsNullOrWhiteSpace(turno))
                        cmd.Parameters.AddWithValue("@T", turno);
                    cmd.ExecuteNonQuery();
                }

                bool conTipo = HayTipo;

                string ins = conTipo
                    ? @"INSERT INTO ProyeccionDia
                            (Fecha, IdOficial, Turno, IdPuesto,
                             Disponible, Motivo, IdOficialSustituto, Tipo)
                        VALUES (@F, @O, @T, @P, @D, @M, @S, @Tipo);"
                    : @"INSERT INTO ProyeccionDia
                            (Fecha, IdOficial, Turno, IdPuesto,
                             Disponible, Motivo, IdOficialSustituto)
                        VALUES (@F, @O, @T, @P, @D, @M, @S);";

                foreach (var l in lineas)
                {
                    using var cmd = new SqlCommand(ins, cn, tx);
                    cmd.Parameters.AddWithValue("@F", fecha.Date);
                    cmd.Parameters.AddWithValue("@O", l.IdOficial);
                    cmd.Parameters.AddWithValue("@T", l.Turno);
                    cmd.Parameters.AddWithValue("@P", (object?)l.IdPuesto ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@D", l.Disponible);
                    cmd.Parameters.AddWithValue("@M",
                        l.Disponible ? DBNull.Value : (object?)l.Motivo ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@S",
                        l.Disponible ? DBNull.Value : (object?)l.IdOficialSustituto ?? DBNull.Value);

                    if (conTipo)
                        cmd.Parameters.AddWithValue("@Tipo", LimpiarTipo(l.Tipo));

                    cmd.ExecuteNonQuery();
                }

                tx.Commit();
            }
            catch { tx.Rollback(); throw; }
        }

        /// <summary>
        /// Quien puede cubrir un puesto ese dia. Se carga todo el
        /// personal, sea del turno que sea, mas los autorizados externos.
        /// Solo se descartan los inactivos y los incapacitados.
        ///
        /// El que ya quedo cubriendo otro puesto sigue en la lista: en la
        /// base 105 los oficiales hacen extras seguido y uno solo puede
        /// tomar mas de un puesto el mismo dia. Se marca en Situacion
        /// para que quien planea lo vea antes de asignarlo.
        ///
        /// yaUsados es para lo que de verdad no tiene sentido: que
        /// alguien se cubra a si mismo.
        /// </summary>
        public List<OficialDisponible> ListarDisponibles(
            DateTime fecha, string turnoActual, IEnumerable<int> yaUsados)
        {
            string dia = AsistenciaRepositorio.DiaDeLaSemana(fecha);

            string libra = DiasLibres.Libra("o.DiaLibre", "@Dia");

            string sql = $@"
                SELECT o.IdOficial, o.Nombre, o.Cedula, o.Horario,
                       CASE
                           WHEN x.Cubriendo > 0 THEN
                                N'YA CUBRE ' + CAST(x.Cubriendo AS NVARCHAR(3)) +
                                N' puesto(s)  -  extra'
                           WHEN o.Horario  = @Externo THEN N'Autorizado externo'
                           WHEN {libra}               THEN N'Libra ese dia  -  turno ' + o.Horario
                           WHEN o.Horario  = @T       THEN N'Mismo turno ' + o.Horario
                           ELSE N'Turno ' + o.Horario
                       END AS Situacion
                FROM Oficiales o
                OUTER APPLY (
                    SELECT COUNT(*) AS Cubriendo
                    FROM ProyeccionDia pr
                    WHERE pr.Fecha = @F AND pr.IdOficialSustituto = o.IdOficial
                ) x
                WHERE o.Activo = 1
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

            var usados = new HashSet<int>(yaUsados);
            var lista = new List<OficialDisponible>();

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cmd.Parameters.AddWithValue("@T", turnoActual);
            cmd.Parameters.AddWithValue("@Dia", dia);
            cmd.Parameters.AddWithValue("@Externo", Roles.Externo);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
            {
                int id = rd.GetInt32(0);
                if (usados.Contains(id)) continue;

                lista.Add(new OficialDisponible
                {
                    IdOficial = id,
                    Nombre = rd.GetString(1),
                    Cedula = rd.GetString(2),
                    Horario = rd.GetString(3),
                    Situacion = rd.GetString(4)
                });
            }
            return lista;
        }

        /// <summary>
        /// El plan de varios dias seguidos, uno por fecha.
        ///
        /// Cada dia se arma igual que en la pantalla de proyeccion: los
        /// que trabajan ese dia por horario y dia libre, con lo que se
        /// haya guardado encima. Los dias que nunca se planearon salen
        /// con el reparto de siempre, que es justo lo que se quiere ver
        /// cuando uno proyecta la semana entrante.
        ///
        /// El rango se limita a 62 dias: mas alla de dos meses el Excel
        /// deja de ser legible y la consulta se vuelve pesada.
        /// </summary>
        public List<DiaProyectado> CargarRango(DateTime desde, DateTime hasta,
                                               string? turno = null)
        {
            var lista = new List<DiaProyectado>();

            DateTime ini = desde.Date;
            DateTime fin = hasta.Date;
            if (fin < ini) (ini, fin) = (fin, ini);

            const int TOPE = 62;
            if ((fin - ini).Days + 1 > TOPE) fin = ini.AddDays(TOPE - 1);

            for (DateTime f = ini; f <= fin; f = f.AddDays(1))
            {
                lista.Add(new DiaProyectado
                {
                    Fecha = f,
                    Lineas = Cargar(f, turno),
                    Libres = ListarLibres(f, turno),
                    Guardado = ExisteProyeccion(f)
                });
            }
            return lista;
        }

        /// <summary>
        /// A quienes les toca librar esa fecha, marcando quien de ellos
        /// entro igual a cubrir a un companero.
        ///
        /// Esa marca es la que evita la contradiccion del rol: un oficial
        /// que libraba pero entro a sustituir aparece con su nombre en la
        /// casilla del que falto, asi que no puede figurar tambien en el
        /// bloque de libres. En el cuaderno eso se sabe de memoria; aqui
        /// hay que dejarlo escrito.
        ///
        /// Se mira contra ProyeccionDia, que es de donde sale el rol: asi
        /// el papel siempre cuadra consigo mismo.
        ///
        /// El autorizado externo no aparece: no tiene dia libre fijo.
        /// </summary>
        public List<OficialLibre> ListarLibres(DateTime fecha, string? turno = null)
        {
            string dia = AsistenciaRepositorio.DiaDeLaSemana(fecha);

            string sql = $@"
                SELECT o.IdOficial, o.Nombre, o.Horario,
                       CASE WHEN EXISTS (
                                SELECT 1 FROM ProyeccionDia pr
                                WHERE pr.Fecha = @F
                                  AND pr.IdOficialSustituto = o.IdOficial)
                            THEN 1 ELSE 0 END AS EntroACubrir
                FROM Oficiales o
                WHERE o.Activo = 1
                  AND {DiasLibres.Libra("o.DiaLibre", "@Dia")}
                  AND o.Horario <> @Externo";

            if (!string.IsNullOrWhiteSpace(turno)) sql += " AND o.Horario = @T";
            sql += " ORDER BY o.Horario, o.Nombre;";

            var lista = new List<OficialLibre>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cmd.Parameters.AddWithValue("@Dia", dia);
            cmd.Parameters.AddWithValue("@Externo", Roles.Externo);
            if (!string.IsNullOrWhiteSpace(turno)) cmd.Parameters.AddWithValue("@T", turno);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                lista.Add(new OficialLibre
                {
                    IdOficial = rd.GetInt32(0),
                    Nombre = rd.GetString(1),
                    Turno = rd.GetString(2),
                    EntroACubrir = rd.GetInt32(3) == 1
                });
            return lista;
        }

        /// <summary>Datos ya armados para el Excel de proyeccion.</summary>
        public DataTable ObtenerReporte(DateTime fecha)
        {
            // El Tipo va pegado al Turno: lo primero que se mira de una
            // linea es de que horario es y si esa persona va por rol o
            // de extra.
            string tipo = HayTipoEnVista ? "Tipo AS [Tipo]," : "N'Rol' AS [Tipo],";

            string sql = $@"
                SELECT
                    Turno      AS [Turno],
                    {tipo}
                    Puesto     AS [Puesto],
                    Ubicacion  AS [Ubicacion],
                    Oficial    AS [Oficial planeado],
                    Cedula     AS [Cedula],
                    Situacion  AS [Situacion],
                    Cubre      AS [Lo cubre],
                    CedulaCubre AS [Cedula de quien cubre]
                FROM vw_ProyeccionDia
                WHERE Fecha = @F
                ORDER BY Turno, Puesto, Oficial;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);

            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }

        /// <summary>
        /// Las coberturas planeadas de esa fecha: quien iba a faltar y
        /// quien lo iba a cubrir. Es la sustitucion en su version
        /// proyectada, antes de que el dia ocurra.
        /// </summary>
        public List<Sustitucion> ListarCoberturas(DateTime fecha)
        {
            const string sql = @"
                SELECT pr.IdProyeccion,
                       pr.IdOficial,          o.Nombre,   o.Cedula,
                       pr.IdOficialSustituto, sus.Nombre, sus.Cedula, sus.Horario,
                       pr.IdPuesto,           ISNULL(p.Codigo, N''),
                       pr.Turno,              ISNULL(pr.Motivo, N'')
                FROM ProyeccionDia pr
                INNER JOIN Oficiales o   ON o.IdOficial   = pr.IdOficial
                INNER JOIN Oficiales sus ON sus.IdOficial = pr.IdOficialSustituto
                LEFT  JOIN Puestos   p   ON p.IdPuesto    = pr.IdPuesto
                WHERE pr.Fecha = @F AND pr.IdOficialSustituto IS NOT NULL
                ORDER BY pr.Turno, o.Nombre;";

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
                    Turno = rd.GetString(10),
                    Motivo = rd.GetString(11)
                });
            return lista;
        }

        public (int Total, int Asignados, int NoDisponibles, int Cubiertos)
            Totales(DateTime fecha)
        {
            const string sql = @"
                SELECT
                    COUNT(*),
                    SUM(CASE WHEN Disponible = 1 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN Disponible = 0 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN IdOficialSustituto IS NOT NULL THEN 1 ELSE 0 END)
                FROM ProyeccionDia WHERE Fecha = @F;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cn.Open();
            using var rd = cmd.ExecuteReader();

            if (!rd.Read() || rd.IsDBNull(1)) return (0, 0, 0, 0);
            return (rd.GetInt32(0), rd.GetInt32(1), rd.GetInt32(2), rd.GetInt32(3));
        }

        /// <summary>Fechas que ya tienen plan guardado.</summary>
        public DataTable DiasProyectados()
        {
            const string sql = @"
                SELECT
                    Fecha                                                  AS [Fecha],
                    COUNT(*)                                               AS [Oficiales],
                    SUM(CASE WHEN Disponible = 0 THEN 1 ELSE 0 END)        AS [No disponibles],
                    SUM(CASE WHEN IdOficialSustituto IS NOT NULL
                             THEN 1 ELSE 0 END)                            AS [Cubiertos]
                FROM ProyeccionDia
                GROUP BY Fecha
                ORDER BY Fecha DESC;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }
    }
}
