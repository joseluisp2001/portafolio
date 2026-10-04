using Licencias;

namespace formularios
{
    /// <summary>
    /// El porton de entrada. Corre antes que cualquier pantalla: si la
    /// copia no esta activada para esta computadora, la aplicacion no
    /// abre.
    /// </summary>
    public static class ControlLicencia
    {
        /// <summary>
        /// La licencia con la que se abrio, para mostrar a nombre de quien
        /// esta el sistema. Null antes de <see cref="Verificar"/>.
        /// </summary>
        public static Licencia? Actual { get; private set; }

        /// <summary>
        /// True si se puede seguir. Si no hay licencia buena, abre la
        /// pantalla de activacion; si el usuario la cierra sin activar,
        /// devuelve false y la aplicacion termina sin abrir nada.
        /// </summary>
        public static bool Verificar()
        {
            string? guardada = AlmacenLicencia.Leer();

            if (guardada is not null &&
                ClaveLicencia.Revisar(guardada, out var licencia) == ClaveLicencia.Estado.Valida)
            {
                Actual = licencia;
                return true;
            }

            using var pantalla = new ActivarLicencia();
            if (pantalla.ShowDialog() != DialogResult.OK) return false;

            Actual = pantalla.Licencia;
            return true;
        }

        /// <summary>
        /// La linea que va en el pie del menu principal.
        /// </summary>
        public static string Pie() =>
            Actual is null
                ? "Sistema PlanillaVanguard"
                : $"Sistema PlanillaVanguard  -  Licencia de {Actual.Cliente}";
    }
}
