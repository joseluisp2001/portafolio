using System.Security.Cryptography;
using System.Text;

namespace GeneradorLicencias
{
    /// <summary>
    /// La clave privada con la que se firman todas las licencias.
    ///
    /// Es lo unico verdaderamente secreto de todo el sistema. Quien la
    /// tenga puede emitir licencias de PlanillaVanguard; quien no la
    /// tenga, no puede, por mas que abra el ejecutable del cliente.
    ///
    /// Se guarda cifrada con DPAPI: solo el usuario de Windows que la
    /// creo, y en esta misma maquina, puede volver a leerla. Ni siquiera
    /// copiando el archivo a otra computadora se puede abrir.
    ///
    /// Por eso mismo hay respaldo: si se quema el disco, sin respaldo se
    /// pierde la capacidad de emitir licencias para siempre y habria que
    /// recompilar la aplicacion con una clave nueva y reemplazar TODAS
    /// las licencias ya entregadas.
    /// </summary>
    public static class ClavesEmisor
    {
        public static string Carpeta { get; } = ArmarCarpeta();

        public static string RutaPrivada => Path.Combine(Carpeta, "clave-privada.bin");
        public static string RutaPublica => Path.Combine(Carpeta, "clave-publica.txt");
        public static string RutaBitacora => Path.Combine(Carpeta, "licencias-emitidas.csv");

        private static string ArmarCarpeta()
        {
            string carpeta = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "PlanillaVanguard", "Emisor");

            Directory.CreateDirectory(carpeta);
            return carpeta;
        }

        public static bool Existe => File.Exists(RutaPrivada);

        // ---------------------------------------------------------------
        // ABRIR (y crear la primera vez)
        // ---------------------------------------------------------------
        /// <summary>
        /// Devuelve la clave lista para firmar. Si todavia no hay par de
        /// claves, lo crea y deja la publica en un archivo de texto para
        /// poder pegarla en el codigo de la aplicacion.
        /// </summary>
        public static ECDsa Abrir()
        {
            if (!Existe) return Crear();

            byte[] cifrada = File.ReadAllBytes(RutaPrivada);
            byte[] pkcs8 = ProtectedData.Unprotect(
                cifrada, null, DataProtectionScope.CurrentUser);

            try
            {
                var ecdsa = ECDsa.Create();
                ecdsa.ImportPkcs8PrivateKey(pkcs8, out _);
                return ecdsa;
            }
            finally
            {
                CryptographicOperations.ZeroMemory(pkcs8);
            }
        }

        private static ECDsa Crear()
        {
            var ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);

            Guardar(ecdsa);
            File.WriteAllText(RutaPublica, PublicaBase64(ecdsa), Encoding.UTF8);

            return ecdsa;
        }

        private static void Guardar(ECDsa ecdsa)
        {
            byte[] pkcs8 = ecdsa.ExportPkcs8PrivateKey();

            try
            {
                byte[] cifrada = ProtectedData.Protect(
                    pkcs8, null, DataProtectionScope.CurrentUser);

                File.WriteAllBytes(RutaPrivada, cifrada);
            }
            finally
            {
                CryptographicOperations.ZeroMemory(pkcs8);
            }
        }

        /// <summary>La clave publica, que es la que va dentro de la aplicacion.</summary>
        public static string PublicaBase64(ECDsa ecdsa) =>
            Convert.ToBase64String(ecdsa.ExportSubjectPublicKeyInfo());

        // ---------------------------------------------------------------
        // RESPALDO
        // ---------------------------------------------------------------
        /// <summary>
        /// Escribe la clave privada en un archivo cifrado con contrasena,
        /// para guardarlo fuera de esta computadora. A diferencia del
        /// archivo de trabajo, este si se puede abrir en otra maquina,
        /// siempre que se sepa la contrasena.
        /// </summary>
        public static void Respaldar(string ruta, string contrasena)
        {
            using var ecdsa = Abrir();

            // 600 mil vueltas de PBKDF2: si alguien se roba el respaldo,
            // probar contrasenas al azar le sale carisimo.
            var parametros = new PbeParameters(
                PbeEncryptionAlgorithm.Aes256Cbc, HashAlgorithmName.SHA256, 600_000);

            byte[] cifrada = ecdsa.ExportEncryptedPkcs8PrivateKey(contrasena, parametros);
            File.WriteAllBytes(ruta, cifrada);
        }

        /// <summary>
        /// Vuelve a instalar la clave privada desde un respaldo. Se usa al
        /// cambiar de computadora o despues de una perdida.
        /// </summary>
        public static void Restaurar(string ruta, string contrasena)
        {
            byte[] cifrada = File.ReadAllBytes(ruta);

            using var ecdsa = ECDsa.Create();
            ecdsa.ImportEncryptedPkcs8PrivateKey(contrasena, cifrada, out _);

            Guardar(ecdsa);
            File.WriteAllText(RutaPublica, PublicaBase64(ecdsa), Encoding.UTF8);
        }

        // ---------------------------------------------------------------
        // BITACORA
        // ---------------------------------------------------------------
        /// <summary>
        /// Anota cada licencia emitida. Sirve para saber a quien se le
        /// vendio que, y para volver a mandar una clave que el cliente
        /// perdio sin tener que pedirle otra vez el codigo del equipo.
        /// </summary>
        public static void Anotar(Licencias.Licencia licencia, string clave)
        {
            bool nuevo = !File.Exists(RutaBitacora);

            var linea = new StringBuilder();
            if (nuevo) linea.AppendLine("Fecha;Cliente;Equipo;Clave");

            linea.Append(licencia.FechaEmision.ToString("dd/MM/yyyy")).Append(';')
                 .Append(licencia.Cliente.Replace(';', ',')).Append(';')
                 .Append(licencia.HuellaTexto).Append(';')
                 .Append(clave)
                 .AppendLine();

            File.AppendAllText(RutaBitacora, linea.ToString(), Encoding.UTF8);
        }
    }
}
