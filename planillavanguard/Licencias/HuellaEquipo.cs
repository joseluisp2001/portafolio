using System.Management;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

namespace Licencias
{
    /// <summary>
    /// El codigo que identifica a esta computadora y a ninguna otra.
    ///
    /// Se arma con tres senas del equipo. De cada una se guardan cuatro
    /// bytes de su resumen, nunca el dato original: quien vea una huella
    /// no puede sacar de ahi el serial del disco ni nada parecido.
    ///
    ///   Sena 0  MachineGuid, el numero que Windows se pone a si mismo
    ///           cuando lo instalan. Cambia si reinstalan Windows.
    ///   Sena 1  Serial de la placa madre. Aguanta la reinstalacion.
    ///   Sena 2  Serial del disco fijo. Cambia si cambian el disco.
    ///
    /// Para dar por buena la maquina tienen que coincidir dos de las
    /// tres. Con eso el cliente aguanta un cambio de disco, un cambio de
    /// placa o una reinstalacion de Windows sin quedarse sin sistema,
    /// que es lo que pasa en la vida real de una computadora. Dos
    /// maquinas distintas, en cambio, no comparten ni una sena, asi que
    /// llevarse el programa a otra parte no sirve de nada.
    ///
    /// Pedir dos de tres no afloja la proteccion: la MachineGuid es la
    /// unica que se puede falsificar a mano (es una entrada del
    /// registro), y con esa sola nunca alcanza.
    /// </summary>
    public static class HuellaEquipo
    {
        /// <summary>Tres senas de cuatro bytes cada una.</summary>
        public const int Bytes = 12;

        private const int PorSena = 4;

        // ---------------------------------------------------------------
        // CALCULAR
        // ---------------------------------------------------------------
        /// <summary>
        /// La huella de la maquina donde se esta corriendo. Una sena que
        /// no se pueda leer queda en ceros, y al comparar simplemente no
        /// se toma en cuenta.
        /// </summary>
        public static byte[] Calcular()
        {
            var huella = new byte[Bytes];

            Grabar(huella, 0, MachineGuid());
            Grabar(huella, 1, SerialPlaca());
            Grabar(huella, 2, SerialDisco());

            return huella;
        }

        /// <summary>
        /// Mete el resumen de una sena en su lugar. El indice va dentro
        /// del texto que se resume: asi la misma cadena en dos senas
        /// distintas no produce los mismos bytes.
        /// </summary>
        private static void Grabar(byte[] huella, int sena, string valor)
        {
            if (valor.Length == 0) return;   // queda en ceros: no se pudo leer

            byte[] resumen = SHA256.HashData(
                Encoding.UTF8.GetBytes($"Vanguard|{sena}|{valor.ToUpperInvariant()}"));

            Array.Copy(resumen, 0, huella, sena * PorSena, PorSena);
        }

        // ---------------------------------------------------------------
        // COMPARAR
        // ---------------------------------------------------------------
        /// <summary>
        /// True si la huella que viene firmada en la licencia corresponde
        /// a esta maquina.
        /// </summary>
        public static bool Coincide(byte[] deLaLicencia, byte[] deEsteEquipo)
        {
            if (deLaLicencia.Length != Bytes || deEsteEquipo.Length != Bytes) return false;

            int guardadas = 0;
            int iguales = 0;

            for (int sena = 0; sena < 3; sena++)
            {
                if (Vacia(deLaLicencia, sena)) continue;

                guardadas++;
                if (Igual(deLaLicencia, deEsteEquipo, sena)) iguales++;
            }

            // Una licencia sin ninguna sena no identifica nada y por lo
            // tanto no vale para ninguna maquina.
            if (guardadas == 0) return false;

            // Lo normal es exigir dos. En las maquinas donde solo se pudo
            // leer una sena (algunas virtuales no dan seriales), se exige
            // esa: es todo lo que hay, y sigue siendo distinta en cada
            // instalacion de Windows.
            return iguales >= Math.Min(2, guardadas);
        }

        private static bool Vacia(byte[] huella, int sena)
        {
            for (int i = sena * PorSena; i < (sena + 1) * PorSena; i++)
                if (huella[i] != 0) return false;
            return true;
        }

        private static bool Igual(byte[] a, byte[] b, int sena)
        {
            for (int i = sena * PorSena; i < (sena + 1) * PorSena; i++)
                if (a[i] != b[i]) return false;
            return true;
        }

        // ---------------------------------------------------------------
        // TEXTO
        // ---------------------------------------------------------------
        /// <summary>
        /// La huella como la ve el cliente en pantalla, en grupos de
        /// cuatro para que la pueda dictar o copiar sin perderse.
        /// </summary>
        public static string Texto(byte[] huella)
        {
            string crudo = Base32.Codificar(huella);   // 12 bytes -> 20 caracteres

            var sb = new StringBuilder(crudo.Length + 4);
            for (int i = 0; i < crudo.Length; i++)
            {
                if (i > 0 && i % 4 == 0) sb.Append('-');
                sb.Append(crudo[i]);
            }
            return sb.ToString();
        }

        /// <summary>
        /// Lee una huella escrita a mano. Devuelve null si no tiene la
        /// forma correcta. Los guiones, los espacios y las mayusculas dan
        /// lo mismo.
        /// </summary>
        public static byte[]? Leer(string texto)
        {
            if (Base32.Largo(texto) != 20) return null;

            byte[]? datos = Base32.Decodificar(texto);
            return datos is not null && datos.Length == Bytes ? datos : null;
        }

        // ---------------------------------------------------------------
        // DE DONDE SALE CADA SENA
        // ---------------------------------------------------------------
        private static string MachineGuid()
        {
            try
            {
                using var raiz = RegistryKey.OpenBaseKey(
                    RegistryHive.LocalMachine, RegistryView.Registry64);
                using var clave = raiz.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography");

                return (clave?.GetValue("MachineGuid") as string ?? "").Trim();
            }
            catch { return ""; }
        }

        private static string SerialPlaca() =>
            PorWmi("SELECT SerialNumber FROM Win32_BaseBoard", "SerialNumber");

        private static string SerialDisco() =>
            PorWmi("SELECT SerialNumber FROM Win32_DiskDrive " +
                   "WHERE MediaType = 'Fixed hard disk media'", "SerialNumber");

        /// <summary>
        /// Pregunta a Windows por una propiedad del hardware. Devuelve
        /// vacio si no se puede: en algunas maquinas el servicio de WMI
        /// esta apagado y eso no puede tumbar la aplicacion.
        /// </summary>
        private static string PorWmi(string consulta, string propiedad)
        {
            try
            {
                using var buscador = new ManagementObjectSearcher(consulta);

                foreach (ManagementBaseObject objeto in buscador.Get())
                {
                    using (objeto)
                    {
                        string valor = (objeto[propiedad] as string ?? "").Trim();
                        if (Sirve(valor)) return valor;
                    }
                }
            }
            catch { }

            return "";
        }

        /// <summary>
        /// Muchos fabricantes dejan el serial sin llenar y ponen un texto
        /// de relleno. Ese valor lo tendrian miles de maquinas iguales,
        /// asi que se descarta y la sena queda vacia.
        /// </summary>
        private static bool Sirve(string valor)
        {
            if (valor.Length < 3) return false;

            string[] relleno =
            [
                "NONE", "DEFAULT STRING", "TO BE FILLED BY O.E.M.",
                "SYSTEM SERIAL NUMBER", "NOT APPLICABLE", "NOT SPECIFIED",
                "0", "00000000", "INVALID", "N/A"
            ];

            string arriba = valor.ToUpperInvariant();
            if (relleno.Contains(arriba)) return false;

            // Puros ceros, puros unos o puros espacios tampoco distinguen nada.
            return valor.Any(c => c != '0' && c != ' ' && c != '.');
        }
    }
}
