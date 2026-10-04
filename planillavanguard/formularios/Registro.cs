namespace formularios
{
    /// <summary>
    /// Bitacora de fallas. Escribe en un archivo de texto al lado de los
    /// datos del usuario, para que un problema que solo aparece en la
    /// maquina donde esta instalado el sistema deje rastro.
    ///
    /// Nunca lanza: si no se puede escribir la bitacora, el programa
    /// sigue igual. Una bitacora que tumba la aplicacion no sirve.
    /// </summary>
    public static class Registro
    {
        private static readonly object _candado = new();

        /// <summary>Carpeta y archivo donde queda la bitacora.</summary>
        public static string Ruta { get; } = ArmarRuta();

        private static string ArmarRuta()
        {
            try
            {
                string carpeta = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "PlanillaVanguard");

                Directory.CreateDirectory(carpeta);
                return Path.Combine(carpeta, "bitacora.txt");
            }
            catch { return ""; }
        }

        /// <summary>Anota una linea con la fecha y la hora.</summary>
        public static void Anotar(string texto)
        {
            if (Ruta.Length == 0) return;

            try
            {
                // UTF8 explicito: si no, las tildes de los mensajes de
                // Windows salen como garabatos al abrir el archivo.
                lock (_candado)
                    File.AppendAllText(
                        Ruta,
                        $"{DateTime.Now:dd/MM/yyyy HH:mm:ss}  {texto}{Environment.NewLine}",
                        System.Text.Encoding.UTF8);
            }
            catch { }
        }

        public static void Anotar(string contexto, Exception ex) =>
            Anotar($"{contexto}  ->  {ex.GetType().Name}: {ex.Message}");
    }
}
