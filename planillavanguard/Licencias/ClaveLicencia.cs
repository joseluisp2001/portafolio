using System.Security.Cryptography;
using System.Text;

namespace Licencias
{
    /// <summary>
    /// La clave que el cliente pega en la pantalla de activacion.
    ///
    /// Por dentro es el contenido de la licencia mas una firma de 64
    /// bytes, todo convertido a texto. La firma se hace con curva
    /// eliptica P-256: cualquiera puede comprobarla con la clave publica,
    /// pero solo quien tiene la clave privada puede producirla. Cambiar
    /// una sola letra de la clave, o el nombre del cliente, o la huella
    /// del equipo, deja la firma invalida.
    /// </summary>
    public static class ClaveLicencia
    {
        /// <summary>Largo de la firma P-256 en formato plano (r y s pegados).</summary>
        private const int BytesFirma = 64;

        /// <summary>Contenido minimo: formato, largo, un caracter de nombre, huella y fecha.</summary>
        private const int MinimoContenido = 2 + 1 + HuellaEquipo.Bytes + 2;

        public enum Estado
        {
            /// <summary>Todo bien: la licencia es de esta maquina.</summary>
            Valida,

            /// <summary>El texto no tiene forma de clave.</summary>
            Formato,

            /// <summary>La firma no es del proveedor: la clave es inventada o alterada.</summary>
            Firma,

            /// <summary>La clave es autentica, pero fue emitida para otra computadora.</summary>
            OtroEquipo,

            /// <summary>Este ejecutable se compilo sin clave publica.</summary>
            SinClavePublica
        }

        // ---------------------------------------------------------------
        // EMITIR   (solo corre en el generador, con la clave privada)
        // ---------------------------------------------------------------
        /// <summary>
        /// Firma una licencia y devuelve la clave lista para enviar. Vive
        /// aqui, al lado de la comprobacion, para que el formato se
        /// escriba y se lea en el mismo archivo y no se puedan
        /// desincronizar.
        /// </summary>
        public static string Armar(Licencia licencia, ECDsa privada)
        {
            byte[] contenido = licencia.Contenido();

            byte[] firma = privada.SignData(
                contenido,
                HashAlgorithmName.SHA256,
                DSASignatureFormat.IeeeP1363FixedFieldConcatenation);

            var todo = new byte[contenido.Length + firma.Length];
            Array.Copy(contenido, todo, contenido.Length);
            Array.Copy(firma, 0, todo, contenido.Length, firma.Length);

            return Base32.Codificar(todo);
        }

        // ---------------------------------------------------------------
        // COMPROBAR
        // ---------------------------------------------------------------
        /// <summary>
        /// Revisa una clave contra la maquina donde se esta corriendo.
        /// </summary>
        public static Estado Revisar(string clave, out Licencia? licencia) =>
            Revisar(clave, HuellaEquipo.Calcular(), out licencia);

        /// <summary>
        /// Revisa una clave contra una huella dada. La sobrecarga con
        /// huella explicita sirve para probar sin depender del hardware
        /// de quien corre la prueba.
        /// </summary>
        public static Estado Revisar(string clave, byte[] huellaDelEquipo,
                                     out Licencia? licencia)
        {
            licencia = null;

            if (string.IsNullOrWhiteSpace(clave)) return Estado.Formato;

            byte[]? todo = Base32.Decodificar(clave);
            if (todo is null || todo.Length < BytesFirma + MinimoContenido)
                return Estado.Formato;

            var contenido = todo.AsSpan(0, todo.Length - BytesFirma);
            var firma = todo.AsSpan(todo.Length - BytesFirma);

            // Primero la firma. Nada de lo que venga adentro se toma en
            // cuenta antes de saber que el bloque salio del proveedor.
            using var publica = AbrirClavePublica();
            if (publica is null) return Estado.SinClavePublica;

            bool autentica = publica.VerifyData(
                contenido, firma,
                HashAlgorithmName.SHA256,
                DSASignatureFormat.IeeeP1363FixedFieldConcatenation);

            if (!autentica) return Estado.Firma;

            var leida = Licencia.Leer(contenido);
            if (leida is null) return Estado.Formato;

            if (!HuellaEquipo.Coincide(leida.Huella, huellaDelEquipo))
                return Estado.OtroEquipo;

            licencia = leida;
            return Estado.Valida;
        }

        private static ECDsa? AbrirClavePublica()
        {
            if (ClavePublicaVanguard.Base64.Length == 0) return null;

            try
            {
                var ecdsa = ECDsa.Create();
                ecdsa.ImportSubjectPublicKeyInfo(
                    Convert.FromBase64String(ClavePublicaVanguard.Base64), out _);
                return ecdsa;
            }
            catch { return null; }
        }

        // ---------------------------------------------------------------
        // PRESENTACION
        // ---------------------------------------------------------------
        /// <summary>
        /// Parte la clave en lineas para mostrarla o mandarla por
        /// mensaje. Al leerla los saltos de linea se ignoran, asi que da
        /// lo mismo pegarla partida o de corrido.
        /// </summary>
        public static string EnLineas(string clave, int porLinea = 40)
        {
            var sb = new StringBuilder(clave.Length + clave.Length / porLinea + 1);

            for (int i = 0; i < clave.Length; i += porLinea)
            {
                if (i > 0) sb.AppendLine();
                sb.Append(clave, i, Math.Min(porLinea, clave.Length - i));
            }
            return sb.ToString();
        }

        /// <summary>El mensaje que se le muestra al cliente en cada caso.</summary>
        public static string Explicar(Estado estado) => estado switch
        {
            Estado.Valida => "Licencia activada.",
            Estado.Formato => "Esa clave esta incompleta o tiene caracteres de mas. " +
                              "Copiela otra vez completa.",
            Estado.Firma => "Esa clave no fue emitida por el proveedor del sistema.",
            Estado.OtroEquipo => "Esa licencia pertenece a otra computadora. " +
                                 "Solicite una para el codigo que aparece arriba.",
            Estado.SinClavePublica => "Esta copia del programa se compilo sin clave " +
                                      "publica. Comuniquese con el proveedor.",
            _ => "No se pudo activar."
        };
    }
}
