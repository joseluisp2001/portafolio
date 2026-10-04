using System.Text;

namespace Licencias
{
    /// <summary>
    /// Pasa bytes a texto y de vuelta, con un alfabeto pensado para que
    /// una persona copie la clave sin equivocarse.
    ///
    /// No estan la I, la L, la O ni la U: la I se confunde con el 1, la O
    /// con el 0 y la U con la V cuando alguien dicta una clave por
    /// telefono. Al leer se aceptan igual y se traducen, asi que si el
    /// cliente escribe una O donde iba un 0, la clave sirve de todos
    /// modos. Los guiones y los espacios se ignoran.
    /// </summary>
    internal static class Base32
    {
        private const string Alfabeto = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

        public static string Codificar(byte[] datos)
        {
            var sb = new StringBuilder((datos.Length * 8 + 4) / 5);

            int acumulado = 0;
            int bits = 0;

            foreach (byte b in datos)
            {
                acumulado = (acumulado << 8) | b;
                bits += 8;

                while (bits >= 5)
                {
                    bits -= 5;
                    sb.Append(Alfabeto[(acumulado >> bits) & 31]);
                }
            }

            // Los bits que sobran se completan con ceros a la derecha.
            if (bits > 0) sb.Append(Alfabeto[(acumulado << (5 - bits)) & 31]);

            return sb.ToString();
        }

        /// <summary>
        /// Devuelve los bytes, o null si el texto trae algun caracter que
        /// no pertenece al alfabeto.
        /// </summary>
        public static byte[]? Decodificar(string texto)
        {
            var salida = new List<byte>(texto.Length * 5 / 8 + 1);

            int acumulado = 0;
            int bits = 0;

            foreach (char bruto in texto)
            {
                char c = Normalizar(bruto);
                if (c == '\0') continue;          // guion, espacio, salto de linea

                int valor = Alfabeto.IndexOf(c);
                if (valor < 0) return null;       // caracter que no existe en el alfabeto

                acumulado = (acumulado << 5) | valor;
                bits += 5;

                if (bits >= 8)
                {
                    bits -= 8;
                    salida.Add((byte)((acumulado >> bits) & 0xFF));
                }
            }

            return [.. salida];
        }

        /// <summary>
        /// Deja el caracter listo para buscarlo en el alfabeto. Devuelve
        /// '\0' para lo que hay que saltarse (guiones, espacios, saltos).
        /// </summary>
        private static char Normalizar(char c)
        {
            if (char.IsWhiteSpace(c) || c == '-' || c == '_' || c == '.') return '\0';

            c = char.ToUpperInvariant(c);

            return c switch
            {
                'I' or 'L' => '1',
                'O' => '0',
                'U' => 'V',
                _ => c
            };
        }

        /// <summary>Cuantos caracteres del alfabeto trae el texto.</summary>
        public static int Largo(string texto)
        {
            int n = 0;
            foreach (char c in texto)
                if (Normalizar(c) != '\0') n++;
            return n;
        }
    }
}
