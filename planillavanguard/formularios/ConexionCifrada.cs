using System.Security.Cryptography;
using System.Text;

namespace GestorDatos
{
    // ===============================================================
    // La conexion al servidor, guardada cifrada
    // ===============================================================
    /// <summary>
    /// La cadena de conexion a un SQL Server que NO esta en esta
    /// computadora, guardada cifrada en disco.
    ///
    /// Existe para el caso de la base en el servidor (septiembre de
    /// 2026). Esa cadena lleva usuario y contrasena, y ponerla en la
    /// variable PLANILLA_CONEXION la dejaria en texto plano: cualquiera
    /// que abra las variables del sistema la lee.
    ///
    /// Aca se guarda cifrada con DPAPI, atada a ESTA MAQUINA. Copiado a
    /// otra computadora, el archivo no se puede descifrar.
    ///
    /// Por que la maquina y no el usuario: por lo mismo que la licencia
    /// se guarda en ProgramData. Si fuera por usuario, otra persona que
    /// entrara a esta computadora con su propia cuenta de Windows no
    /// tendria el archivo, el programa caeria al SQL Server local, y
    /// abriria sin avisar la base VIEJA que quedo ahi el dia de la
    /// mudanza. Trabajaria con datos desactualizados creyendo que son
    /// los de verdad.
    /// </summary>
    public static class ConexionCifrada
    {
        public static string Ruta => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "PlanillaVanguard", "conexion.bin");

        /// <summary>
        /// Una sal propia del programa. Con DPAPI de maquina, cualquier
        /// programa de esta computadora podria descifrar el archivo sin
        /// ella; con ella tiene que saber ademas este valor. No es un
        /// secreto fuerte —esta dentro del ejecutable—, pero saca del
        /// medio a cualquier programa que no fue hecho para leer esto.
        ///
        /// Si se cambia, los conexion.bin ya guardados dejan de servir y
        /// hay que volver a generarlos.
        /// </summary>
        private static readonly byte[] Entropia =
            Encoding.UTF8.GetBytes("PlanillaVanguard/conexion-servidor/v1");

        public static bool Existe => File.Exists(Ruta);

        /// <summary>
        /// La cadena guardada, o null si no hay ninguna.
        ///
        /// SI EL ARCHIVO EXISTE PERO NO SE PUEDE LEER, NO devuelve null:
        /// lanza. Y es a proposito.
        ///
        /// Devolver null haria que el programa siguiera buscando y cayera
        /// al SQL Server local, con la base vieja del dia de la mudanza.
        /// Todo abriria normal, se veria bien, y se estaria trabajando
        /// sobre datos que ya no son los de verdad. Es mucho mejor que no
        /// abra y diga por que.
        /// </summary>
        public static string? Leer()
        {
            if (!File.Exists(Ruta)) return null;

            try
            {
                byte[] claro = ProtectedData.Unprotect(
                    File.ReadAllBytes(Ruta), Entropia, DataProtectionScope.LocalMachine);
                return Encoding.UTF8.GetString(claro);
            }
            catch (Exception ex)
            {
                throw new ConexionIlegibleException(Ruta, ex);
            }
        }

        /// <summary>Guarda la cadena, cifrada, reemplazando la anterior.</summary>
        public static void Guardar(string cadena)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Ruta)!);

            byte[] cifrado = ProtectedData.Protect(
                Encoding.UTF8.GetBytes(cadena), Entropia, DataProtectionScope.LocalMachine);

            // Primero a un temporal y despues se reemplaza: si se corta la
            // luz a la mitad, queda el archivo anterior entero en vez de uno
            // partido que el programa no pueda leer.
            string temporal = Ruta + ".tmp";
            File.WriteAllBytes(temporal, cifrado);
            File.Move(temporal, Ruta, overwrite: true);
        }

        /// <summary>
        /// Borra la conexion guardada. El programa vuelve a buscar el SQL
        /// Server de esta computadora.
        /// </summary>
        public static void Quitar()
        {
            if (File.Exists(Ruta)) File.Delete(Ruta);
        }
    }

    /// <summary>
    /// El archivo de la conexion al servidor esta, pero no se puede
    /// descifrar. Lo mas comun: se copio desde otra computadora, o se
    /// daño.
    /// </summary>
    public class ConexionIlegibleException : Exception
    {
        public ConexionIlegibleException(string ruta, Exception causa)
            : base(
                "El programa esta configurado para usar la base del servidor, " +
                "pero no puede leer esa configuracion.\n\n" +
                "Lo mas probable es que el archivo se haya copiado desde otra " +
                "computadora: solo sirve en la que se genero.\n\n" +
                "No se abrio la base de esta computadora a proposito: puede " +
                "estar desactualizada.\n\n" +
                $"Archivo: {ruta}",
                causa)
        { }
    }
}
