using System.Data;
using Microsoft.Data.SqlClient;

namespace GestorDatos
{
    // ===============================================================
    // MODELOS
    // ===============================================================
    /// <summary>
    /// Los estados en que puede estar una plaza. La base solo acepta
    /// estos tres.
    /// </summary>
    public static class EstadoPlaza
    {
        public const string Ocupada = "Ocupada";
        public const string Vacante = "Vacante";
        public const string Bloqueada = "Bloqueada";

        /// <summary>Lo que ofrece el filtro de la pantalla, en ese orden.</summary>
        public static readonly string[] Todos = { Vacante, Ocupada, Bloqueada };
    }

    /// <summary>
    /// Por que se fue el titular. Son los mismos motivos del sistema
    /// administrativo, y la base solo acepta estos.
    /// </summary>
    public static class MotivoVacante
    {
        public const string Traslado = "Traslado";
        public const string PlazaNueva = "Plaza nueva";
        public const string Otro = "Otro";

        public static readonly string[] Todos =
        {
            "Renuncia", "Abandono", "Despido", "Fin de contrato",
            "Sin portacion", Traslado, PlazaNueva, Otro
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

    /// <summary>
    /// Una persona para escoger de una lista: la que va a cubrir una
    /// plaza o la que va a quedar de titular.
    /// </summary>
    public class OficialSimple
    {
        public int IdOficial { get; set; }
        public string Nombre { get; set; } = "";
        public string Cedula { get; set; } = "";
        public string Rol { get; set; } = "";

        /// <summary>
        /// Ya es titular de otra plaza. No lo descalifica: solo avisa
        /// que ponerlo aqui lo mueve de puesto.
        /// </summary>
        public bool YaTienePlaza { get; set; }

        public string Descripcion =>
            $"{Nombre}   -   {Cedula}   -   {Rol}" +
            (YaTienePlaza ? "   (ya tiene plaza)" : "");
    }

    /// <summary>Cuantas plazas hay y como estan repartidas.</summary>
    public record ResumenPlazas(int Total, int Ocupadas, int Vacantes,
                                int Bloqueadas, int SinCubrir);

    // ===============================================================
    // REPOSITORIO
    // ===============================================================
    /// <summary>
    /// Las plazas de la base: el ciclo completo de una vacante.
    ///
    /// Una plaza es el PUESTO DE TRABAJO, no la persona: existe
    /// aunque nadie la ocupe. Alguien sale y la plaza queda vacante,
    /// se dice quien la cubre mientras tanto, y cuando llega el
    /// reemplazo vuelve a estar ocupada.
    ///
    /// Todo esto vive en su propia tabla y no toca ninguna de las que
    /// ya estaban: la asistencia, las sustituciones y la proyeccion
    /// siguen trabajando igual que antes.
    /// </summary>
    public class VacantesRepositorio
    {
        private readonly string _conexion;

        public VacantesRepositorio(string? conexion = null)
        {
            _conexion = conexion ?? Conexion.PorDefecto;
        }

        /// <summary>
        /// Si la base ya tiene la tabla de plazas.
        ///
        /// Se pregunta antes de cargar la pantalla para poder decir en
        /// castellano que falta correr PlanillaVanguard_VACANTES.sql,
        /// en vez de dejar salir el "nombre de objeto no valido" de
        /// SQL Server, que no le dice nada a quien esta trabajando.
        /// </summary>
        private static bool? _hayTabla;

        public bool HayTablaDePlazas()
        {
            if (_hayTabla is not null) return _hayTabla.Value;

            try
            {
                using var cn = new SqlConnection(_conexion);
                using var cmd = new SqlCommand(
                    "SELECT CASE WHEN OBJECT_ID('dbo.Plazas','U') IS NULL " +
                    "THEN 0 ELSE 1 END;", cn);
                cn.Open();
                _hayTabla = Convert.ToInt32(cmd.ExecuteScalar()) == 1;
            }
            catch
            {
                // Sin guardar la respuesta: un tropiezo de red al abrir
                // dejaria las plazas apagadas el resto de la sesion
                // aunque el cuadro si exista.
                return false;
            }

            return _hayTabla.Value;
        }

        // -----------------------------------------------------------
        // CONSULTAR
        // -----------------------------------------------------------
        /// <summary>
        /// Las plazas para la grilla. Sin estado salen todas.
        ///
        /// Las que estan SIN CUBRIR van de primeras: son las unicas
        /// sobre las que hay que hacer algo hoy. Despues las vacantes
        /// que ya alguien esta cubriendo, luego las ocupadas y de
        /// ultimo las bloqueadas, que no se van a llenar.
        ///
        /// La busqueda por texto no se hace aqui: son las plazas de una
        /// sola base, caben de sobra en memoria, y filtrarlas en la
        /// pantalla es inmediato y no consulta por cada letra.
        /// </summary>
        public DataTable Listar(string? estado = null)
        {
            string sql = @"
                SELECT IdPlaza                     AS [Id],
                       Rol                         AS [Rol],
                       ISNULL(Plaza, N'')          AS [Plaza],
                       Estado                      AS [Estado],
                       ISNULL(TitularNombre, N'')  AS [Titular],
                       Cobertura                   AS [Cobertura],
                       ISNULL(CubreNombre, N'')    AS [La cubre],
                       ISNULL(SalioNombre, N'')    AS [Salio],
                       ISNULL(MotivoVacante, N'')  AS [Motivo],
                       FechaVacante                AS [Desde],
                       DiasVacante                 AS [Dias],
                       ISNULL(Observacion, N'')    AS [Nota]
                FROM   vw_Plazas
                WHERE  1 = 1";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand { Connection = cn };

            if (!string.IsNullOrWhiteSpace(estado))
            {
                sql += " AND Estado = @E";
                cmd.Parameters.AddWithValue("@E", estado);
            }

            sql += @"
                ORDER BY CASE WHEN Estado = N'Vacante' AND Cobertura = N'SIN CUBRIR' THEN 0
                              WHEN Estado = N'Vacante'                               THEN 1
                              WHEN Estado = N'Ocupada'                               THEN 2
                              ELSE 3 END,
                         ISNULL(DiasVacante, 0) DESC, Rol, ISNULL(Plaza, N''), IdPlaza;";

            cmd.CommandText = sql;

            var t = new DataTable();
            using var da = new SqlDataAdapter(cmd);
            da.Fill(t);
            return t;
        }

        public ResumenPlazas Totales()
        {
            const string sql = @"
                SELECT COUNT(*),
                       SUM(CASE WHEN Estado = N'Ocupada'   THEN 1 ELSE 0 END),
                       SUM(CASE WHEN Estado = N'Vacante'   THEN 1 ELSE 0 END),
                       SUM(CASE WHEN Estado = N'Bloqueada' THEN 1 ELSE 0 END),
                       SUM(CASE WHEN Estado = N'Vacante' AND IdOficialCubre IS NULL
                                THEN 1 ELSE 0 END)
                FROM dbo.Plazas;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cn.Open();
            using var rd = cmd.ExecuteReader();

            if (!rd.Read() || rd.IsDBNull(0)) return new ResumenPlazas(0, 0, 0, 0, 0);

            return new ResumenPlazas(
                rd.GetInt32(0),
                rd.IsDBNull(1) ? 0 : rd.GetInt32(1),
                rd.IsDBNull(2) ? 0 : rd.GetInt32(2),
                rd.IsDBNull(3) ? 0 : rd.GetInt32(3),
                rd.IsDBNull(4) ? 0 : rd.GetInt32(4));
        }

        /// <summary>Como se llama una plaza, para poder nombrarla en los avisos.</summary>
        public string Describir(int idPlaza)
        {
            const string sql = @"
                SELECT Rol + CASE WHEN ISNULL(Codigo, N'') = N'' THEN N''
                                  ELSE N'  -  ' + Codigo END
                FROM dbo.Plazas WHERE IdPlaza = @P;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@P", idPlaza);
            cn.Open();
            return cmd.ExecuteScalar() as string ?? "";
        }

        /// <summary>
        /// De que plaza es titular hoy, si de alguna. Sirve para avisar
        /// antes de un traslado.
        /// </summary>
        public string? PlazaActualDe(int idOficial)
        {
            const string sql = @"
                SELECT TOP 1 Rol + CASE WHEN ISNULL(Codigo, N'') = N'' THEN N''
                                        ELSE N'  -  ' + Codigo END
                FROM dbo.Plazas WHERE IdOficialTitular = @O;";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@O", idOficial);
            cn.Open();
            return cmd.ExecuteScalar() as string;
        }

        /// <summary>
        /// Que papel tiene un oficial dentro de alguna plaza, dicho en
        /// castellano, o null si no aparece en ninguna.
        ///
        /// Sirve para avisar antes de darlo de baja o de borrarlo: lo
        /// que hay que decirle a quien lo esta haciendo no es "aparece
        /// en 1 plaza", sino cual y con que papel.
        ///
        /// Si sale en varias, manda el papel mas fuerte: primero ser el
        /// titular, luego estar cubriendola, y de ultimo constar como el
        /// que salio.
        /// </summary>
        public string? PapelEnPlaza(int idOficial)
        {
            if (!HayTablaDePlazas()) return null;

            const string sql = @"
                SELECT TOP 1
                       CASE WHEN IdOficialTitular = @O THEN N'es titular de'
                            WHEN IdOficialCubre   = @O THEN N'esta cubriendo'
                            ELSE N'consta como quien salio de' END
                     + N' la plaza '
                     + Rol + CASE WHEN ISNULL(Codigo, N'') = N'' THEN N''
                                  ELSE N'  -  ' + Codigo END
                FROM dbo.Plazas
                WHERE IdOficialTitular = @O
                   OR IdOficialCubre   = @O
                   OR IdOficialSalio   = @O
                ORDER BY CASE WHEN IdOficialTitular = @O THEN 0
                              WHEN IdOficialCubre   = @O THEN 1
                              ELSE 2 END, IdPlaza;";

            try
            {
                using var cn = new SqlConnection(_conexion);
                using var cmd = new SqlCommand(sql, cn);
                cmd.Parameters.AddWithValue("@O", idOficial);
                cn.Open();
                return cmd.ExecuteScalar() as string;
            }
            catch
            {
                // Es un dato de cortesia para un aviso: si no se pudo
                // averiguar, el aviso sale sin esa linea y la baja sigue
                // su camino. No tiene sentido tumbar la pantalla por esto.
                return null;
            }
        }

        /// <summary>
        /// Quien puede cubrir o tomar una plaza: todo el personal
        /// activo. El que ya es titular de otra sale marcado, porque
        /// tomarla lo moveria de puesto.
        ///
        /// Si se dice para CUAL plaza es, se saca de la lista al que
        /// salio de ella: nadie se cubre a si mismo, la base lo
        /// rechaza y no tiene sentido ofrecerlo.
        /// </summary>
        public List<OficialSimple> ParaCubrir(int idPlaza = 0)
        {
            string sql = @"
                SELECT o.IdOficial, o.Nombre, o.Cedula, o.Horario,
                       CASE WHEN EXISTS (SELECT 1 FROM dbo.Plazas p
                                         WHERE p.IdOficialTitular = o.IdOficial)
                            THEN 1 ELSE 0 END AS YaTiene
                FROM dbo.Oficiales o
                WHERE o.Activo = 1";

            if (idPlaza > 0)
                sql += @" AND o.IdOficial <> ISNULL(
                              (SELECT IdOficialSalio FROM dbo.Plazas
                               WHERE IdPlaza = @P), 0)";

            sql += " ORDER BY YaTiene, o.Nombre;";

            var lista = new List<OficialSimple>();
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            if (idPlaza > 0) cmd.Parameters.AddWithValue("@P", idPlaza);

            cn.Open();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                lista.Add(new OficialSimple
                {
                    IdOficial = rd.GetInt32(0),
                    Nombre = rd.GetString(1),
                    Cedula = rd.GetString(2),
                    Rol = rd.GetString(3),
                    YaTienePlaza = rd.GetInt32(4) == 1
                });
            return lista;
        }

        // -----------------------------------------------------------
        // EL CUADRO DE PLAZAS
        // -----------------------------------------------------------
        /// <summary>
        /// Agrega plazas al cuadro. Nacen vacantes, que es lo que son:
        /// un puesto de trabajo que todavia no tiene a nadie.
        /// </summary>
        public void Agregar(string rol, string? codigo, int cuantas)
        {
            const string sql = @"
                INSERT INTO dbo.Plazas (Rol, Codigo, Estado, MotivoVacante, FechaVacante)
                VALUES (@R, @C, N'Vacante', N'Plaza nueva', CAST(GETDATE() AS DATE));";

            using var cn = new SqlConnection(_conexion);
            cn.Open();
            using var tx = cn.BeginTransaction();

            try
            {
                for (int i = 0; i < Math.Max(1, cuantas); i++)
                {
                    using var cmd = new SqlCommand(sql, cn, tx);
                    cmd.Parameters.AddWithValue("@R", rol);

                    // Con varias de un golpe el codigo se numera solo:
                    // CH-1, CH-2... Escribir el mismo en todas no
                    // distinguiria una de otra.
                    string? c = string.IsNullOrWhiteSpace(codigo) ? null
                              : cuantas > 1 ? $"{codigo.Trim()}-{i + 1}"
                                            : codigo.Trim();

                    cmd.Parameters.AddWithValue("@C", (object?)c ?? DBNull.Value);
                    cmd.ExecuteNonQuery();
                }
                tx.Commit();
            }
            catch { tx.Rollback(); throw; }
        }

        /// <summary>
        /// Quita una plaza del cuadro. Solo se deja si no tiene
        /// titular: una plaza ocupada se libera primero diciendo que
        /// su titular salio.
        /// </summary>
        public bool Quitar(int idPlaza)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(
                "DELETE FROM dbo.Plazas WHERE IdPlaza = @P AND IdOficialTitular IS NULL;", cn);
            cmd.Parameters.AddWithValue("@P", idPlaza);
            cn.Open();
            return cmd.ExecuteNonQuery() > 0;
        }

        // -----------------------------------------------------------
        // EL CICLO DE LA VACANTE
        // -----------------------------------------------------------
        /// <summary>
        /// El titular se fue: la plaza queda vacante, con su nombre,
        /// el motivo y desde cuando.
        ///
        /// Al oficial no se le toca nada: si ademas hay que darlo de
        /// baja, eso se hace donde siempre, en Editar personal. Aqui
        /// solo se resuelve la plaza.
        /// </summary>
        public void SalioTitular(int idPlaza, string motivo, DateTime fecha,
                                 string? observacion = null)
        {
            const string sql = @"
                UPDATE dbo.Plazas
                SET Estado           = N'Vacante',
                    IdOficialSalio   = IdOficialTitular,
                    IdOficialTitular = NULL,
                    MotivoVacante    = @M,
                    FechaVacante     = @F,
                    IdOficialCubre   = NULL,
                    Observacion      = ISNULL(@Obs, Observacion)
                WHERE IdPlaza = @P AND Estado = N'Ocupada';";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@P", idPlaza);
            cmd.Parameters.AddWithValue("@M", MotivoVacante.Limpiar(motivo));
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cmd.Parameters.AddWithValue("@Obs",
                string.IsNullOrWhiteSpace(observacion)
                    ? DBNull.Value : observacion.Trim());
            cn.Open();
            cmd.ExecuteNonQuery();
        }

        /// <summary>
        /// Corrige el motivo, la fecha y la nota de una plaza que YA
        /// esta vacante.
        ///
        /// Hace falta desde que la baja de un oficial libera su plaza
        /// sola: en ese camino la base no tiene de donde sacar el motivo
        /// de verdad y la deja en 'Otro'. Sin esto, esa plaza se
        /// quedaria diciendo 'Otro' para siempre, porque "Salio el
        /// titular" solo trabaja sobre plazas ocupadas.
        ///
        /// No toca el estado ni a las personas: solo el por que.
        /// </summary>
        public void CorregirMotivo(int idPlaza, string motivo, DateTime fecha,
                                   string? observacion)
        {
            const string sql = @"
                UPDATE dbo.Plazas
                SET MotivoVacante = @M,
                    FechaVacante  = @F,
                    Observacion   = @Obs
                WHERE IdPlaza = @P AND Estado = N'Vacante';";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@P", idPlaza);
            cmd.Parameters.AddWithValue("@M", MotivoVacante.Limpiar(motivo));
            cmd.Parameters.AddWithValue("@F", fecha.Date);
            cmd.Parameters.AddWithValue("@Obs",
                string.IsNullOrWhiteSpace(observacion)
                    ? DBNull.Value : observacion.Trim());
            cn.Open();
            cmd.ExecuteNonQuery();
        }

        /// <summary>
        /// Quien la cubre mientras no haya reemplazo.
        ///
        /// El que salio de esa misma plaza no se acepta. La base
        /// tambien lo impide, pero el error que devuelve nombra una
        /// restriccion y no le sirve de nada a quien esta trabajando.
        /// </summary>
        public void AsignarCobertura(int idPlaza, int idOficial)
        {
            const string sql = @"
                IF EXISTS (SELECT 1 FROM dbo.Plazas
                           WHERE IdPlaza = @P AND IdOficialSalio = @O)
                    THROW 50001, N'Esa persona es justamente la que salio de esa plaza. Escoja a otra para cubrirla.', 1;

                UPDATE dbo.Plazas SET IdOficialCubre = @O
                WHERE IdPlaza = @P AND Estado = N'Vacante';";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@P", idPlaza);
            cmd.Parameters.AddWithValue("@O", idOficial);
            cn.Open();
            cmd.ExecuteNonQuery();
        }

        public void QuitarCobertura(int idPlaza)
        {
            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(
                "UPDATE dbo.Plazas SET IdOficialCubre = NULL WHERE IdPlaza = @P;", cn);
            cmd.Parameters.AddWithValue("@P", idPlaza);
            cn.Open();
            cmd.ExecuteNonQuery();
        }

        /// <summary>
        /// Llego el reemplazo: la plaza vuelve a estar ocupada y se
        /// borra el dato de quien salio.
        ///
        /// Devuelve la plaza que el nuevo titular dejo, si venia de
        /// otra, o null si no tenia ninguna.
        /// </summary>
        /// <remarks>
        /// Las dos cosas van en una sola transaccion: si el nuevo
        /// titular ya tenia plaza, primero hay que soltarla y despues
        /// tomar esta. Al reves -- o a medias -- un oficial quedaria
        /// un instante como titular de dos, que es justo lo que el
        /// indice unico no permite, y en pantalla saldria un error de
        /// indice duplicado que no le dice nada a nadie.
        /// </remarks>
        public string? Reemplazar(int idPlaza, int idOficialNuevo)
        {
            string? dejo = PlazaActualDe(idOficialNuevo);

            using var cn = new SqlConnection(_conexion);
            cn.Open();
            using var tx = cn.BeginTransaction();

            try
            {
                // Primero se suelta la plaza que tuviera, si tenia
                const string soltar = @"
                    UPDATE dbo.Plazas
                    SET Estado           = N'Vacante',
                        IdOficialTitular = NULL,
                        IdOficialSalio   = @O,
                        MotivoVacante    = N'Traslado',
                        FechaVacante     = CAST(GETDATE() AS DATE),
                        IdOficialCubre   = NULL
                    WHERE IdOficialTitular = @O AND IdPlaza <> @P;";

                using (var cmd = new SqlCommand(soltar, cn, tx))
                {
                    cmd.Parameters.AddWithValue("@O", idOficialNuevo);
                    cmd.Parameters.AddWithValue("@P", idPlaza);
                    cmd.ExecuteNonQuery();
                }

                const string tomar = @"
                    UPDATE dbo.Plazas
                    SET Estado           = N'Ocupada',
                        IdOficialTitular = @O,
                        IdOficialSalio   = NULL,
                        MotivoVacante    = NULL,
                        FechaVacante     = NULL,
                        IdOficialCubre   = NULL
                    WHERE IdPlaza = @P AND Estado = N'Vacante';";

                using (var cmd = new SqlCommand(tomar, cn, tx))
                {
                    cmd.Parameters.AddWithValue("@P", idPlaza);
                    cmd.Parameters.AddWithValue("@O", idOficialNuevo);
                    cmd.ExecuteNonQuery();
                }

                tx.Commit();
                return dejo;
            }
            catch { tx.Rollback(); throw; }
        }

        /// <summary>
        /// Bloquea o desbloquea una plaza.
        ///
        /// Una plaza bloqueada existe en el papel pero no se va a
        /// llenar, y deja de contar como vacante por resolver.
        /// </summary>
        public void Bloquear(int idPlaza, bool bloquear)
        {
            string sql = bloquear
                ? @"UPDATE dbo.Plazas
                    SET Estado = N'Bloqueada', IdOficialCubre = NULL,
                        IdOficialSalio = NULL, MotivoVacante = NULL, FechaVacante = NULL
                    WHERE IdPlaza = @P AND Estado = N'Vacante';"
                : @"UPDATE dbo.Plazas SET Estado = N'Vacante'
                    WHERE IdPlaza = @P AND Estado = N'Bloqueada';";

            using var cn = new SqlConnection(_conexion);
            using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@P", idPlaza);
            cn.Open();
            cmd.ExecuteNonQuery();
        }
    }
}
