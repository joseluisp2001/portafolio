using System.Data;
using System.Text;
using Microsoft.Data.SqlClient;   // NuGet: Microsoft.Data.SqlClient

namespace GestorDatos
{
    // ===============================================================
    // Cadena de conexion en un solo lugar
    // ===============================================================
    public static class Conexion
    {
        /// <summary>
        /// Donde se busca SQL Server, en este orden.
        ///
        /// Antes solo se probaba localhost, y eso alcanzaba porque la
        /// primera instalacion quedo con la instancia predeterminada.
        /// Pero el instalador de SQL Server Express, si uno se deja
        /// llevar por la opcion basica, crea una instancia LLAMADA
        /// SQLEXPRESS, y a esa no se llega con localhost a secas: el
        /// programa abria y reventaba con el error 40, "no se encontro
        /// el servidor", que no le dice nada a quien esta instalando.
        ///
        /// Probar las dos cuesta un segundo al abrir y evita tener que
        /// acordarse de configurar cada maquina.
        /// </summary>
        public static readonly string[] Servidores =
            { "localhost", @"localhost\SQLEXPRESS" };

        /// <summary>La cadena de conexion contra un servidor dado.</summary>
        public static string Para(string servidor) =>
            $@"Server={servidor};Database=PlanillaVanguard;" +
            @"Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;";

        /// <summary>La de siempre: SQL Server en la misma maquina.</summary>
        public static string Local => Para(Servidores[0]);

        /// <summary>
        /// La que se usa. Se averigua una sola vez al abrir el programa.
        ///
        /// En este orden:
        ///  1. La conexion al servidor guardada cifrada (ConexionCifrada).
        ///  2. La variable de entorno PLANILLA_CONEXION: la salida para
        ///     una instancia con otro nombre, o para revisar una copia de
        ///     la base restaurada aparte sin tocar la que esta trabajando.
        ///  3. El SQL Server de esta computadora.
        /// </summary>
        public static string PorDefecto { get; } = Averiguar();

        /// <summary>
        /// True si el programa trabaja contra la base del servidor.
        ///
        /// Se calcula desde el archivo y no se guarda al averiguar a
        /// proposito: si la averiguacion fallara, esta clase no terminaria
        /// de iniciarse, y preguntarle algo despues volveria a fallar. La
        /// red de seguridad de Program.cs necesita poder preguntar esto
        /// justo en ese momento.
        /// </summary>
        public static bool EnServidor => ConexionCifrada.Existe;

        /// <summary>
        /// Cual de los servidores conocidos contesta. Si ninguno lo
        /// hace, se devuelve el primero para que el programa falle donde
        /// siempre fallaba y con el mensaje de siempre: no tiene sentido
        /// inventar un error nuevo cuando lo que pasa es que SQL Server
        /// no esta instalado o no esta corriendo.
        /// </summary>
        private static string Averiguar()
        {
            // La base del servidor manda sobre todo. Si el archivo esta pero
            // no se puede leer, Leer() lanza en vez de devolver null: caer al
            // SQL Server local abriria la base VIEJA sin avisar.
            string? delServidor = ConexionCifrada.Leer();
            if (delServidor is { Length: > 0 }) return delServidor;

            string? forzada = Environment.GetEnvironmentVariable("PLANILLA_CONEXION");
            if (forzada is { Length: > 0 }) return forzada;

            foreach (string servidor in Servidores)
                if (Contesta(servidor))
                    return Para(servidor);

            return Local;
        }

        /// <summary>
        /// True si en ese servidor hay un SQL Server que responde.
        ///
        /// Se pregunta contra master y no contra PlanillaVanguard a
        /// proposito: en una instalacion recien hecha el servidor ya
        /// esta arriba pero la base todavia no existe, y preguntando por
        /// ella se descartaria un servidor que si sirve.
        /// </summary>
        private static bool Contesta(string servidor)
        {
            try
            {
                using var cn = new SqlConnection(
                    $@"Server={servidor};Database=master;Trusted_Connection=True;" +
                    @"Encrypt=False;TrustServerCertificate=True;Connect Timeout=3;");

                cn.Open();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }

    // ===============================================================
    // Roles
    // ===============================================================
    /// <summary>
    /// El rol se guarda en el mismo campo Horario. Son nueve: los ocho
    /// turnos de horas y el autorizado externo, que no va por horas
    /// porque lo trae otra empresa, pero si puede cubrir puestos.
    /// </summary>
    public static class Roles
    {
        public const string Externo = "Autorizado Externo";

        public static bool EsExterno(string? horario) =>
            string.Equals(horario, Externo, StringComparison.OrdinalIgnoreCase);
    }

    // ===============================================================
    // Tipo de jornada
    // ===============================================================
    /// <summary>
    /// Con que entra el oficial ese dia. Es lo que en el cuaderno se
    /// anota al lado del nombre, y es lo que despues manda en la
    /// planilla:
    ///
    ///     Rol      le tocaba, entra por el rol que tiene asignado
    ///     Vacante  entra a una plaza que no tiene titular
    ///     Extra    entra de extra, cubriendo a alguien que falto
    ///
    /// Vive en el campo Tipo, tanto en la asistencia como en la
    /// proyeccion, y la base solo acepta estos tres valores.
    /// </summary>
    public static class TipoJornada
    {
        public const string Rol = "Rol";
        public const string Vacante = "Vacante";
        public const string Extra = "Extra";

        /// <summary>Lo que ofrecen los desplegables, en ese orden.</summary>
        public static readonly string[] Todos = { Rol, Vacante, Extra };

        /// <summary>
        /// Deja el tipo en uno de los tres valores que la base acepta.
        /// Cualquier otra cosa (nulo, vacio, un dato viejo) cae en Rol,
        /// que es lo normal.
        /// </summary>
        public static string Limpiar(string? tipo) =>
            Todos.FirstOrDefault(
                t => string.Equals(t, tipo?.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? Rol;

        public static bool EsRol(string? tipo) => Limpiar(tipo) == Rol;
        public static bool EsVacante(string? tipo) => Limpiar(tipo) == Vacante;
        public static bool EsExtra(string? tipo) => Limpiar(tipo) == Extra;
    }

    // ===============================================================
    // Motivo de salida
    // ===============================================================
    /// <summary>
    /// Por que se fue una persona. Son los mismos motivos por los que
    /// una plaza queda vacante, menos "Plaza nueva", que no es un
    /// motivo por el que alguien se vaya.
    ///
    /// Que sean la misma lista no es casualidad: cuando se da de baja
    /// al titular de una plaza, el motivo de la salida pasa tal cual a
    /// ser el motivo de la vacante.
    /// </summary>
    public static class MotivoSalida
    {
        public const string Otro = "Otro";

        public static readonly string[] Todos =
        {
            "Renuncia", "Abandono", "Despido", "Fin de contrato",
            "Sin portacion", "Traslado", Otro
        };

        /// <summary>
        /// Deja el motivo en uno de los que la base acepta. Cualquier
        /// otra cosa cae en Otro, que es para lo que esta.
        /// </summary>
        public static string Limpiar(string? motivo) =>
            Todos.FirstOrDefault(
                m => string.Equals(m, motivo?.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? Otro;
    }

    // ===============================================================
    // Modelo
    // ===============================================================
    public class Oficial
    {
        public int IdOficial { get; set; }

        public string Nombre { get; set; } = "";
        public string Cedula { get; set; } = "";
        public string? Telefono { get; set; }

        /// <summary>
        /// El rol: uno de los ocho turnos de horas, o
        /// "Autorizado Externo".
        /// </summary>
        public string Horario { get; set; } = "";
        public string DiaLibre { get; set; } = "";
        public DateTime VencimientoPortacion { get; set; }
        public DateTime FechaIngreso { get; set; }
        public string Autorizado { get; set; } = "Pendiente";

        // Los mueve el modulo de asistencia, no el registro
        public int Tardias { get; set; }
        public int Ausencias { get; set; }
        public int Vacaciones { get; set; }

        public string? CodigoChaleco { get; set; }
        public bool Activo { get; set; } = true;
    }

    /// <summary>Cuanto historial tiene un oficial. Decide si se puede borrar.</summary>
    /// <remarks>
    /// Plazas entra de ultimo y con valor por defecto para que una base
    /// que todavia no tiene el cuadro de plazas siga contando igual que
    /// antes.
    /// </remarks>
    public record HistorialOficial(int Asistencia, int Sustituciones,
                                   int Incapacidades, int Proyecciones,
                                   int Plazas = 0)
    {
        public int Total =>
            Asistencia + Sustituciones + Incapacidades + Proyecciones + Plazas;

        public bool TieneHistorial => Total > 0;
    }

    // ===============================================================
    // Acceso a datos
    // ===============================================================
    public class OficialesRepositorio
    {
        private readonly string _conexion;

        public OficialesRepositorio(string? conexion = null)
        {
            _conexion = conexion ?? Conexion.PorDefecto;
        }

        // -----------------------------------------------------------
        // INSERTAR
        // -----------------------------------------------------------
        public int Agregar(Oficial o)
        {
            const string sql = @"
                INSERT INTO Oficiales
                    (Nombre, Cedula, Telefono, Horario, DiaLibre,
                     VencimientoPortacion, FechaIngreso, Autorizado)
                VALUES
                    (@Nombre, @Cedula, @Telefono, @Horario, @DiaLibre,
                     @Vencimiento, @Ingreso, @Autorizado);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            LlenarParametros(cmd, o);
            cn.Open();
            return (int)cmd.ExecuteScalar();
        }

        // -----------------------------------------------------------
        // ACTUALIZAR
        // -----------------------------------------------------------
        /// <summary>
        /// Actualiza los datos del oficial. Los contadores no se tocan:
        /// esos los maneja el modulo de asistencia.
        /// </summary>
        public void Actualizar(Oficial o)
        {
            // Marcar "Persona activa" y guardar es la otra forma de
            // reactivar a alguien, aparte del boton de baja. Si quedaran
            // la fecha y el motivo de la salida anterior, esa persona
            // seguiria saliendo en las listas como que se fue, estando
            // trabajando.
            string limpiarSalida = HayColumnasDeSalida && o.Activo
                ? ", FechaSalida = NULL, MotivoSalida = NULL"
                : "";

            string sql = $@"
                UPDATE Oficiales SET
                    Nombre               = @Nombre,
                    Cedula               = @Cedula,
                    Telefono             = @Telefono,
                    Horario              = @Horario,
                    DiaLibre             = @DiaLibre,
                    VencimientoPortacion = @Vencimiento,
                    FechaIngreso         = @Ingreso,
                    Autorizado           = @Autorizado,
                    CodigoChaleco        = @Chaleco,
                    Activo               = @Activo
                    {limpiarSalida}
                WHERE IdOficial = @Id;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            LlenarParametros(cmd, o);
            cmd.Parameters.AddWithValue("@Chaleco", (object?)o.CodigoChaleco ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Activo", o.Activo);
            cmd.Parameters.AddWithValue("@Id", o.IdOficial);

            cn.Open();
            cmd.ExecuteNonQuery();
        }

        private static void LlenarParametros(SqlCommand cmd, Oficial o)
        {
            // El externo no tiene dia libre asignado: se guarda Ninguno
            // para que no lo saque de ninguna lista por dia.
            string diaLibre = string.IsNullOrWhiteSpace(o.DiaLibre)
                ? "Ninguno" : o.DiaLibre;

            cmd.Parameters.AddWithValue("@Nombre", o.Nombre);
            cmd.Parameters.AddWithValue("@Cedula", o.Cedula);
            cmd.Parameters.AddWithValue("@Telefono", (object?)o.Telefono ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Horario", o.Horario);
            cmd.Parameters.AddWithValue("@DiaLibre", diaLibre);
            cmd.Parameters.AddWithValue("@Vencimiento", o.VencimientoPortacion);
            cmd.Parameters.AddWithValue("@Ingreso", o.FechaIngreso);
            cmd.Parameters.AddWithValue("@Autorizado", o.Autorizado);
        }

        // -----------------------------------------------------------
        // CONSULTAR
        // -----------------------------------------------------------
        public Oficial? ObtenerPorId(int id)
        {
            const string sql = @"
                SELECT IdOficial, Nombre, Cedula, Telefono, Horario, DiaLibre,
                       VencimientoPortacion, FechaIngreso, Autorizado,
                       Tardias, Ausencias, Vacaciones, CodigoChaleco, Activo
                FROM Oficiales WHERE IdOficial = @Id;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@Id", id);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            if (!rd.Read()) return null;

            return new Oficial
            {
                IdOficial = rd.GetInt32(0),
                Nombre = rd.GetString(1),
                Cedula = rd.GetString(2),
                Telefono = rd.IsDBNull(3) ? null : rd.GetString(3),
                Horario = rd.GetString(4),
                DiaLibre = rd.GetString(5),
                VencimientoPortacion = rd.GetDateTime(6),
                FechaIngreso = rd.GetDateTime(7),
                Autorizado = rd.GetString(8),
                Tardias = rd.GetInt32(9),
                Ausencias = rd.GetInt32(10),
                Vacaciones = rd.GetInt32(11),
                CodigoChaleco = rd.IsDBNull(12) ? null : rd.GetString(12),
                Activo = rd.GetBoolean(13)
            };
        }

        /// <summary>
        /// Para la grilla de consulta. Los filtros son opcionales.
        /// El texto busca por nombre, cedula, telefono o codigo de chaleco.
        /// </summary>
        public DataTable Listar(string? horario = null,
                                string? diaLibre = null,
                                string? autorizado = null,
                                string? estado = null,
                                string? texto = null)
        {
            var sql = new StringBuilder($@"
                SELECT
                    IdOficial            AS [Codigo],
                    Nombre               AS [Nombre],
                    Cedula               AS [Cedula],
                    Telefono             AS [Telefono],
                    Horario              AS [Rol / Horario],
                    REPLACE(DiaLibre, N',', N', ')  AS [Dia libre],
                    VencimientoPortacion AS [Vence portacion],
                    FechaIngreso         AS [Ingreso],
                    Autorizado           AS [Autorizado],
                    Tardias              AS [Tardias],
                    Ausencias            AS [Ausencias],
                    Vacaciones           AS [Vacaciones],
                    CodigoChaleco        AS [Chaleco],
                    CASE WHEN Activo = 1 THEN N'Activo' ELSE N'Inactivo' END AS [Estado]
                    {ColumnasDeSalida(estado != "Activo")}
                FROM Oficiales
                WHERE 1 = 1");

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand();

            if (!string.IsNullOrWhiteSpace(horario))
            {
                sql.Append(" AND Horario = @Horario");
                cmd.Parameters.AddWithValue("@Horario", horario);
            }
            if (!string.IsNullOrWhiteSpace(diaLibre))
            {
                sql.Append($" AND {DiasLibres.Libra("DiaLibre", "@DiaLibre")}");
                cmd.Parameters.AddWithValue("@DiaLibre", diaLibre);
            }
            if (!string.IsNullOrWhiteSpace(autorizado))
            {
                sql.Append(" AND Autorizado = @Autorizado");
                cmd.Parameters.AddWithValue("@Autorizado", autorizado);
            }
            if (!string.IsNullOrWhiteSpace(estado))
            {
                sql.Append(" AND Activo = @Activo");
                cmd.Parameters.AddWithValue("@Activo", estado == "Activo");
            }
            if (!string.IsNullOrWhiteSpace(texto))
            {
                sql.Append(" AND (Nombre LIKE @T OR Cedula LIKE @T " +
                           "OR Telefono LIKE @T OR CodigoChaleco LIKE @T)");
                cmd.Parameters.AddWithValue("@T", "%" + texto.Trim() + "%");
            }

            sql.Append(" ORDER BY Nombre;");

            cmd.Connection = cn;
            cmd.CommandText = sql.ToString();

            var tabla = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(tabla);
            return tabla;
        }

        /// <summary>
        /// Para la pantalla de edicion. Busca por nombre, cedula o
        /// codigo de chaleco.
        /// </summary>
        public DataTable Buscar(string? texto = null, bool incluirInactivos = true)
        {
            var sql = new StringBuilder($@"
                SELECT
                    IdOficial            AS [Codigo],
                    Nombre               AS [Nombre],
                    Cedula               AS [Cedula],
                    Telefono             AS [Telefono],
                    Horario              AS [Rol / Horario],
                    REPLACE(DiaLibre, N',', N', ')  AS [Dia libre],
                    Autorizado           AS [Autorizado],
                    CodigoChaleco        AS [Chaleco],
                    Tardias              AS [Tardias],
                    Ausencias            AS [Ausencias],
                    CASE WHEN Activo = 1 THEN N'Activo' ELSE N'Inactivo' END AS [Estado]
                    {ColumnasDeSalida(incluirInactivos)}
                FROM Oficiales
                WHERE 1 = 1");

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand();

            if (!string.IsNullOrWhiteSpace(texto))
            {
                sql.Append(" AND (Nombre LIKE @T OR Cedula LIKE @T OR CodigoChaleco LIKE @T)");
                cmd.Parameters.AddWithValue("@T", "%" + texto.Trim() + "%");
            }
            if (!incluirInactivos) sql.Append(" AND Activo = 1");

            sql.Append(" ORDER BY Nombre;");

            cmd.Connection = cn;
            cmd.CommandText = sql.ToString();

            var tabla = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(tabla);
            return tabla;
        }

        /// <summary>
        /// Nombres, cedulas y chalecos para el autocompletado de las
        /// cajas de busqueda. Son los mismos campos por los que busca
        /// <see cref="Buscar"/>, para que la lista no pueda sugerir algo
        /// que despues no aparezca.
        ///
        /// Se pide una sola vez al abrir la pantalla: son unas pocas
        /// decenas de textos cortos.
        /// </summary>
        public List<string> ParaAutocompletar(bool incluirInactivos = true)
        {
            string sql = @"
                SELECT Nombre, Cedula, ISNULL(CodigoChaleco, N'')
                FROM Oficiales";

            if (!incluirInactivos) sql += " WHERE Activo = 1";
            sql += " ORDER BY Nombre;";

            var lista = new List<string>();

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cn.Open();

            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                for (int c = 0; c < 3; c++)
                {
                    string valor = rd.GetString(c);
                    if (valor.Length > 0) lista.Add(valor);
                }

            return lista;
        }

        /// <summary>
        /// Quien tiene ya esa cedula, o null si esta libre.
        ///
        /// Devuelve la persona entera y no un si/no porque lo que hace
        /// falta decirle al usuario es a quien se la esta repitiendo:
        /// casi siempre es alguien que ya estaba en la planilla, o uno
        /// que se dio de baja y ahora vuelve. Con el nombre delante, se
        /// sabe de una si hay que corregir el numero o ir a reactivarlo.
        ///
        /// Busca por los puros digitos, asi que "1-1234-5678",
        /// "112345678" y "1 1234 5678" son la misma persona: si se
        /// comparara el texto tal cual, el mismo senor entraria dos
        /// veces con solo cambiar los guiones.
        ///
        /// Mira tambien a los inactivos a proposito: un oficial dado de
        /// baja sigue ocupando su cedula.
        /// </summary>
        public Oficial? BuscarPorCedula(string cedula, int idExcluir = 0)
        {
            string digitos = new(cedula.Where(char.IsDigit).ToArray());
            if (digitos.Length == 0) return null;

            const string sql = @"
                SELECT TOP 1 IdOficial, Nombre, Cedula, Telefono, Horario, DiaLibre,
                       VencimientoPortacion, FechaIngreso, Autorizado,
                       Tardias, Ausencias, Vacaciones, CodigoChaleco, Activo
                FROM Oficiales
                WHERE IdOficial <> @Id
                  AND REPLACE(REPLACE(REPLACE(Cedula, '-', ''), ' ', ''), '.', '') = @Digitos
                ORDER BY Activo DESC, IdOficial;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@Digitos", digitos);
            cmd.Parameters.AddWithValue("@Id", idExcluir);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            if (!rd.Read()) return null;

            return new Oficial
            {
                IdOficial = rd.GetInt32(0),
                Nombre = rd.GetString(1),
                Cedula = rd.GetString(2),
                Telefono = rd.IsDBNull(3) ? null : rd.GetString(3),
                Horario = rd.GetString(4),
                DiaLibre = rd.GetString(5),
                VencimientoPortacion = rd.GetDateTime(6),
                FechaIngreso = rd.GetDateTime(7),
                Autorizado = rd.GetString(8),
                Tardias = rd.GetInt32(9),
                Ausencias = rd.GetInt32(10),
                Vacaciones = rd.GetInt32(11),
                CodigoChaleco = rd.IsDBNull(12) ? null : rd.GetString(12),
                Activo = rd.GetBoolean(13)
            };
        }

        /// <summary>
        /// True si esa cedula ya existe en otro oficial.
        ///
        /// Va por el mismo camino que <see cref="BuscarPorCedula"/>, o
        /// sea comparando digitos: antes comparaba el texto tal cual y
        /// "1-1234-5678" contra "112345678" pasaba como dos personas
        /// distintas, que es justo el duplicado que se quiere evitar.
        /// </summary>
        public bool ExisteCedula(string cedula, int idExcluir = 0) =>
            BuscarPorCedula(cedula, idExcluir) is not null;

        public int Contar()
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand("SELECT COUNT(1) FROM Oficiales;", cn);
            cn.Open();
            return (int)cmd.ExecuteScalar();
        }

        // -----------------------------------------------------------
        // ELIMINAR
        // -----------------------------------------------------------
        /// <summary>
        /// Si la base ya tiene el cuadro de plazas. Se pregunta una sola
        /// vez y queda guardado, igual que el Tipo de la asistencia: se
        /// consulta en cada intento de borrado y no cambia mientras el
        /// programa este abierto.
        /// </summary>
        private static bool? _hayPlazas;

        /// <summary>
        /// Si la base ya tiene donde anotar cuando y por que se fue la
        /// persona. Sin esas columnas todo sigue funcionando igual que
        /// antes, solo que sin ese dato.
        /// </summary>
        private static bool? _hayColumnasDeSalida;

        private bool HayColumnasDeSalida
        {
            get
            {
                if (_hayColumnasDeSalida is not null) return _hayColumnasDeSalida.Value;

                try
                {
                    using var cn = new SqlConnection(_conexion);
                    using var cmd = new SqlCommand(
                        "SELECT CASE WHEN COL_LENGTH('dbo.Oficiales','MotivoSalida') IS NULL " +
                        "OR COL_LENGTH('dbo.Oficiales','FechaSalida') IS NULL " +
                        "THEN 0 ELSE 1 END;", cn);
                    cn.Open();
                    _hayColumnasDeSalida = Convert.ToInt32(cmd.ExecuteScalar()) == 1;
                }
                catch { return false; }

                return _hayColumnasDeSalida.Value;
            }
        }

        /// <summary>Para que la pantalla sepa si tiene sentido pedir el motivo.</summary>
        public bool SeAnotaLaSalida => HayColumnasDeSalida;

        /// <summary>
        /// Las dos columnas de la salida para las grillas: cuando se fue
        /// y por que. Son las que vuelven la consulta de personal, puesta
        /// en Estado = Inactivo, la lista de quienes se fueron, con su
        /// motivo y su Excel.
        /// </summary>
        /// <param name="hayInactivos">
        /// Si la consulta puede traer gente de baja. Pidiendo solo a los
        /// activos las dos columnas saldrian vacias en todas las filas,
        /// y no es que estorben en pantalla: en el Excel cuentan, porque
        /// la hoja se encoge para caber en una pagina de ancho y dos
        /// columnas de mas achican la letra de todo el cuadro como un
        /// 13 por ciento. La planilla de todos los dias es la de los
        /// activos, y esa se imprime como siempre.
        /// </param>
        private string ColumnasDeSalida(bool hayInactivos) =>
            HayColumnasDeSalida && hayInactivos
                ? @", FechaSalida  AS [Salio el],
                     ISNULL(MotivoSalida, N'') AS [Motivo de salida]"
                : "";

        private bool HayPlazas
        {
            get
            {
                if (_hayPlazas is not null) return _hayPlazas.Value;

                try
                {
                    using var cn = new SqlConnection(_conexion);
                    using var cmd = new SqlCommand(
                        "SELECT CASE WHEN OBJECT_ID('dbo.Plazas','U') IS NULL " +
                        "THEN 0 ELSE 1 END;", cn);
                    cn.Open();
                    _hayPlazas = Convert.ToInt32(cmd.ExecuteScalar()) == 1;
                }
                catch
                {
                    // Si la base no contesto, no se guarda la respuesta: un
                    // tropiezo de red al preguntar dejaria las plazas fuera
                    // de la cuenta el resto de la sesion aunque si existan.
                    return false;
                }

                return _hayPlazas.Value;
            }
        }

        /// <summary>
        /// Cuenta cuantos registros dependen de ese oficial.
        /// Si hay historial, borrarlo destruiria evidencia.
        /// </summary>
        /// <remarks>
        /// Las plazas cuentan como historial: la tabla las apunta con tres
        /// llaves (titular, quien la cubre y quien salio de ella), asi que
        /// borrar a alguien que aparece en una plaza es algo que la base
        /// no deja hacer. Sin contarlas, el programa decia "no tiene
        /// ningun registro asociado" y acto seguido salia el error de la
        /// llave foranea, que no le dice nada a quien esta trabajando.
        ///
        /// En una base a la que todavia no le corrieron
        /// PlanillaVanguard_VACANTES.sql se cuenta cero, y todo se
        /// comporta igual que antes.
        /// </remarks>
        public HistorialOficial ContarHistorial(int idOficial)
        {
            string plazas = HayPlazas
                ? @"(SELECT COUNT(*) FROM Plazas
                      WHERE IdOficialTitular = @Id
                         OR IdOficialCubre   = @Id
                         OR IdOficialSalio   = @Id)"
                : "0";

            string sql = $@"
                SELECT
                    (SELECT COUNT(*) FROM AsistenciaDiaria WHERE IdOficial = @Id),
                    (SELECT COUNT(*) FROM Sustituciones
                      WHERE IdOficialAusente = @Id OR IdOficialSustituto = @Id),
                    (SELECT COUNT(*) FROM Incapacidades WHERE IdOficial = @Id),
                    (SELECT COUNT(*) FROM ProyeccionDia
                      WHERE IdOficial = @Id OR IdOficialSustituto = @Id),
                    {plazas};";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@Id", idOficial);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            return rd.Read()
                ? new HistorialOficial(rd.GetInt32(0), rd.GetInt32(1),
                                       rd.GetInt32(2), rd.GetInt32(3), rd.GetInt32(4))
                : new HistorialOficial(0, 0, 0, 0);
        }

        /// <summary>
        /// Baja logica: el oficial deja de aparecer en listas y proyecciones
        /// pero su historial queda intacto. Es lo correcto casi siempre.
        /// </summary>
        /// <remarks>
        /// El motivo y la fecha se guardan en el mismo UPDATE que apaga
        /// al oficial, y no en uno aparte, porque el disparador de la
        /// base los lee de ahi para dejar su plaza vacante con el motivo
        /// de verdad. En dos pasos, la plaza quedaria en 'Otro'.
        ///
        /// Los dos son opcionales: en una base a la que todavia no le
        /// corrieron PlanillaVanguard_SALIDA.sql no hay donde guardarlos
        /// y la baja se hace igual que siempre.
        ///
        /// Al reactivar se borran: quien esta trabajando no tiene fecha
        /// de salida.
        /// </remarks>
        public void Desactivar(int idOficial, bool activo,
                               string? motivo = null, DateTime? fecha = null)
        {
            string sql;

            if (!HayColumnasDeSalida)
                sql = "UPDATE Oficiales SET Activo = @A WHERE IdOficial = @Id;";
            else if (activo)
                sql = @"UPDATE Oficiales
                        SET Activo = 1, FechaSalida = NULL, MotivoSalida = NULL
                        WHERE IdOficial = @Id;";
            else
                sql = @"UPDATE Oficiales
                        SET Activo = 0, FechaSalida = @F, MotivoSalida = @M
                        WHERE IdOficial = @Id;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@A", activo);
            cmd.Parameters.AddWithValue("@Id", idOficial);

            if (HayColumnasDeSalida && !activo)
            {
                cmd.Parameters.AddWithValue("@F", (fecha ?? DateTime.Today).Date);
                cmd.Parameters.AddWithValue("@M",
                    string.IsNullOrWhiteSpace(motivo)
                        ? DBNull.Value : MotivoSalida.Limpiar(motivo));
            }

            cn.Open();
            cmd.ExecuteNonQuery();
        }

        /// <summary>
        /// Borrado definitivo. Solo funciona si el oficial no tiene
        /// ningun registro asociado. La base lo impide si lo tiene.
        /// </summary>
        public void EliminarDefinitivo(int idOficial)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(
                "DELETE FROM Oficiales WHERE IdOficial = @Id;", cn);
            cmd.Parameters.AddWithValue("@Id", idOficial);
            cn.Open();
            cmd.ExecuteNonQuery();
        }
    }
}
