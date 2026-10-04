using System.Text;

namespace Licencias
{
    /// <summary>
    /// Lo que dice una licencia: para quien es, para cual maquina y
    /// cuando se emitio. No lleva vencimiento: las licencias de
    /// PlanillaVanguard son de un solo pago y no caducan.
    /// </summary>
    public sealed class Licencia
    {
        /// <summary>Numero de formato. Si algun dia cambia el contenido
        /// de la licencia, sube este numero y las viejas se siguen
        /// pudiendo leer.</summary>
        public const byte Formato = 1;

        /// <summary>Nombre del cliente, tal como aparece en pantalla.</summary>
        public string Cliente { get; init; } = "";

        /// <summary>La maquina para la que se emitio.</summary>
        public byte[] Huella { get; init; } = [];

        public DateOnly FechaEmision { get; init; }

        /// <summary>El codigo del equipo en forma legible.</summary>
        public string HuellaTexto => HuellaEquipo.Texto(Huella);

        // ---------------------------------------------------------------
        // ARMADO DEL CONTENIDO
        // ---------------------------------------------------------------
        // Este es el bloque de bytes que se firma. El orden y los tamanos
        // tienen que ser identicos al armar y al leer, por eso las dos
        // cosas viven juntas en este archivo.
        //
        //   1 byte    formato
        //   1 byte    largo del nombre
        //   n bytes   nombre en UTF8
        //  12 bytes   huella del equipo
        //   2 bytes   dias transcurridos desde el 1/1/2020
        // ---------------------------------------------------------------

        /// <summary>Nombre mas largo que este se recorta al emitir.</summary>
        public const int LargoMaximoCliente = 40;

        private static readonly DateOnly Origen = new(2020, 1, 1);

        internal byte[] Contenido()
        {
            byte[] nombre = Encoding.UTF8.GetBytes(Cliente);
            if (nombre.Length > 255) nombre = nombre[..255];

            var datos = new byte[2 + nombre.Length + HuellaEquipo.Bytes + 2];

            datos[0] = Formato;
            datos[1] = (byte)nombre.Length;

            int i = 2;
            Array.Copy(nombre, 0, datos, i, nombre.Length);
            i += nombre.Length;

            Array.Copy(Huella, 0, datos, i, HuellaEquipo.Bytes);
            i += HuellaEquipo.Bytes;

            ushort dias = (ushort)Math.Clamp(
                FechaEmision.DayNumber - Origen.DayNumber, 0, ushort.MaxValue);

            datos[i] = (byte)(dias & 0xFF);
            datos[i + 1] = (byte)(dias >> 8);

            return datos;
        }

        /// <summary>
        /// Lee el bloque. Devuelve null si no cuadra: cualquier byte de
        /// mas o de menos y la licencia no sirve.
        /// </summary>
        internal static Licencia? Leer(ReadOnlySpan<byte> datos)
        {
            if (datos.Length < 2) return null;
            if (datos[0] != Formato) return null;

            int largoNombre = datos[1];
            int total = 2 + largoNombre + HuellaEquipo.Bytes + 2;
            if (datos.Length != total) return null;

            int i = 2;
            string cliente = Encoding.UTF8.GetString(datos.Slice(i, largoNombre));
            i += largoNombre;

            byte[] huella = datos.Slice(i, HuellaEquipo.Bytes).ToArray();
            i += HuellaEquipo.Bytes;

            int dias = datos[i] | (datos[i + 1] << 8);

            return new Licencia
            {
                Cliente = cliente,
                Huella = huella,
                FechaEmision = Origen.AddDays(dias)
            };
        }
    }
}
