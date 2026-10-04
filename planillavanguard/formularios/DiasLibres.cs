

namespace GestorDatos
{
    /// <summary>
    /// El dia libre de un oficial, que puede ser mas de uno.
    ///
    /// Se guarda en el mismo campo de siempre, separando los dias por
    /// coma: "Domingo", "Sabado,Domingo", "Ninguno". Un solo dia se
    /// escribe igual que antes, asi que todo lo que ya estaba guardado
    /// sigue valiendo tal cual.
    ///
    /// Aqui vive lo de partir y armar esa lista, y de paso los pedazos
    /// de consulta que preguntan si alguien libra un dia dado. Van aqui
    /// y no escritos en cada consulta porque hay que preguntarlo en seis
    /// lugares distintos, y porque una base a la que todavia no le
    /// corrieron PlanillaVanguard_DIAS_LIBRES.sql no tiene la funcion:
    /// en ese caso se cae de vuelta a la comparacion de siempre y todo
    /// se comporta como antes.
    /// </summary>
    public static class DiasLibres
    {
        /// <summary>Para el que no tiene dia libre fijo, como el externo.</summary>
        public const string Ninguno = "Ninguno";

        private const char SEPARADOR = ',';

        /// <summary>Los siete dias, sin el "Ninguno".</summary>
        public static string[] Semana => AsistenciaRepositorio.Dias;

        // =============================================================
        // PARTIR Y ARMAR
        // =============================================================
        /// <summary>
        /// Los dias que libra esa persona. Vacio si no libra ninguno.
        /// </summary>
        public static string[] Partir(string? guardado)
        {
            if (string.IsNullOrWhiteSpace(guardado)) return Array.Empty<string>();

            var dias = guardado.Split(SEPARADOR, StringSplitOptions.RemoveEmptyEntries
                                               | StringSplitOptions.TrimEntries)
                               .Where(d => !d.Equals(Ninguno, StringComparison.OrdinalIgnoreCase))
                               .ToArray();

            // En el orden de la semana, no en el que se hayan marcado:
            // "Sabado,Domingo" se lee mejor que "Domingo,Sabado".
            return dias.OrderBy(d => Array.FindIndex(Semana,
                             s => s.Equals(d, StringComparison.OrdinalIgnoreCase)))
                       .ToArray();
        }

        /// <summary>
        /// Lo que se guarda en la base. Sin ningun dia marcado devuelve
        /// "Ninguno", que es lo que el campo espera: no admite vacio.
        /// </summary>
        public static string Armar(IEnumerable<string>? dias)
        {
            var buenos = (dias ?? Enumerable.Empty<string>())
                .Select(d => d?.Trim() ?? "")
                .Where(d => d.Length > 0 &&
                            !d.Equals(Ninguno, StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(d => Array.FindIndex(Semana,
                          s => s.Equals(d, StringComparison.OrdinalIgnoreCase)))
                .ToArray();

            return buenos.Length == 0 ? Ninguno : string.Join(SEPARADOR, buenos);
        }

        /// <summary>True si esa persona libra ese dia.</summary>
        public static bool Contiene(string? guardado, string dia) =>
            Partir(guardado).Any(d => d.Equals(dia, StringComparison.OrdinalIgnoreCase));

        /// <summary>
        /// Como se le muestra a una persona: "Sabado y Domingo" en vez
        /// de "Sabado,Domingo".
        /// </summary>
        public static string ParaMostrar(string? guardado)
        {
            var dias = Partir(guardado);

            return dias.Length switch
            {
                0 => Ninguno,
                1 => dias[0],
                _ => string.Join(", ", dias[..^1]) + " y " + dias[^1]
            };
        }

        // =============================================================
        // LOS PEDAZOS DE CONSULTA
        // =============================================================
        /// <summary>
        /// El pedazo de SQL que dice "esta persona libra ese dia".
        ///
        /// Busca el dia rodeado de comas dentro de la lista tambien
        /// rodeada de comas, para que "Domingo" no se confunda con nada
        /// y de igual en que orden esten escritos.
        ///
        /// Es SQL de siempre, sin funciones: asi la consulta corre igual
        /// en una base a la que todavia no le corrieron
        /// PlanillaVanguard_DIAS_LIBRES.sql. Con un solo dia guardado se
        /// comporta exactamente como la comparacion de antes.
        /// </summary>
        /// <param name="columna">La columna, con su alias: "o.DiaLibre".</param>
        /// <param name="parametro">El parametro del dia: "@Dia".</param>
        public static string Libra(string columna, string parametro) =>
            $"CHARINDEX(N',' + {parametro} + N',', " +
            $"N',' + REPLACE({columna}, N' ', N'') + N',') > 0";

        /// <summary>Lo contrario: "esa persona NO libra ese dia".</summary>
        public static string NoLibra(string columna, string parametro) =>
            $"CHARINDEX(N',' + {parametro} + N',', " +
            $"N',' + REPLACE({columna}, N' ', N'') + N',') = 0";
    }
}
