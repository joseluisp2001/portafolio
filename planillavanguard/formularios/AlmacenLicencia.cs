namespace formularios
{
    /// <summary>
    /// Donde queda guardada la clave despues de activar.
    ///
    /// Primero se intenta en ProgramData, que es comun a todos los
    /// usuarios de Windows de esa computadora: asi el sistema queda
    /// activado aunque despues entre otra persona con su propia cuenta.
    /// Si esa carpeta no deja escribir, se cae a la carpeta del usuario,
    /// que siempre deja.
    ///
    /// La clave no se esconde ni se cifra a proposito: no hace falta.
    /// Va firmada y amarrada a esta maquina, asi que quien la copie a
    /// otra computadora no consigue nada.
    /// </summary>
    public static class AlmacenLicencia
    {
        private const string Archivo = "licencia.txt";

        private static string RutaComun => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "PlanillaVanguard", Archivo);

        private static string RutaUsuario => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PlanillaVanguard", Archivo);

        /// <summary>
        /// La clave guardada, o null si esta copia nunca se activo.
        /// </summary>
        public static string? Leer()
        {
            foreach (string ruta in new[] { RutaComun, RutaUsuario })
            {
                try
                {
                    if (File.Exists(ruta))
                    {
                        string texto = File.ReadAllText(ruta).Trim();
                        if (texto.Length > 0) return texto;
                    }
                }
                catch (Exception ex) { Registro.Anotar($"Licencia: no se pudo leer {ruta}", ex); }
            }

            return null;
        }

        /// <summary>
        /// Guarda la clave. Devuelve false solo si no se pudo escribir en
        /// ningun lado, que es el unico caso en que hay que avisarle al
        /// usuario que va a tener que activar otra vez la proxima vez.
        /// </summary>
        public static bool Guardar(string clave)
        {
            foreach (string ruta in new[] { RutaComun, RutaUsuario })
            {
                try
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(ruta)!);
                    File.WriteAllText(ruta, clave);
                    return true;
                }
                catch (Exception ex) { Registro.Anotar($"Licencia: no se pudo guardar en {ruta}", ex); }
            }

            return false;
        }
    }
}
