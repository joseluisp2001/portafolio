namespace GeneradorLicencias
{
    internal static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            // Con --exportar crea el par de claves si todavia no existe y
            // deja la publica en clave-publica.txt, sin abrir ventana. Es
            // el paso que se hace una sola vez, antes de compilar la
            // aplicacion que va al cliente.
            if (args.Contains("--exportar"))
            {
                using var ecdsa = ClavesEmisor.Abrir();
                File.WriteAllText(ClavesEmisor.RutaPublica,
                                  ClavesEmisor.PublicaBase64(ecdsa));
                return;
            }

            ApplicationConfiguration.Initialize();
            Application.Run(new VentanaGenerador());
        }
    }
}
