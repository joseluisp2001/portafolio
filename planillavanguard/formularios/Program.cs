using GestorDatos;

namespace formularios
{
    internal static class Program
    {
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            // To customize application configuration such as set high DPI settings or default font,
            // see https://aka.ms/applicationconfiguration.
            ApplicationConfiguration.Initialize();

            // Red de seguridad. Se pone antes que nada para que cubra
            // hasta la pantalla de activacion.
            AtajarFallas();

            // Sin licencia valida para esta computadora no se abre nada.
            // Verificar muestra la pantalla de activacion si hace falta.
            if (!ControlLicencia.Verificar()) return;

            Application.Run(new MenuPrincipal());
        }

        /// <summary>
        /// Recoge las fallas que ninguna pantalla atrapo.
        ///
        /// Sin esto, cualquier descuido termina en el cuadro gris de
        /// Windows con el rastro de la pila: el usuario no entiende nada,
        /// no queda anotado en ningun lado y el programa se cierra
        /// perdiendo lo que estuviera a medio hacer.
        ///
        /// Con esto la falla queda en la bitacora, se explica en
        /// castellano y el programa sigue abierto: lo que ya estaba
        /// guardado no se pierde, y el usuario puede cerrar la pantalla
        /// que fallo y seguir en las demas.
        /// </summary>
        private static void AtajarFallas()
        {
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);

            Application.ThreadException += (_, e) => Avisar(e.Exception);

            // Lo que revienta fuera del hilo de las pantallas ya no se
            // puede salvar: solo se alcanza a dejar anotado.
            AppDomain.CurrentDomain.UnhandledException += (_, e) =>
                Registro.Anotar("Falla sin atrapar (fuera de las pantallas)",
                                e.ExceptionObject as Exception ?? new Exception("desconocida"));
        }

        private static void Avisar(Exception ex)
        {
            Registro.Anotar("Falla sin atrapar", ex);

            // Los dos fallos propios de la base en el servidor se explican
            // aparte: el mensaje generico de abajo habla de "cerrar la
            // pantalla y volver a intentarlo", y en estos casos reintentar
            // no arregla nada.
            if (ExplicarFallaDeServidor(ex)) return;

            MessageBox.Show(
                "Ocurrio un error inesperado y la operacion se detuvo.\n\n" +
                "Lo que ya estaba guardado no se perdio. Cierre esta pantalla " +
                "y vuelva a intentarlo.\n\n" +
                $"Detalle tecnico:\n{ex.Message}\n\n" +
                $"Quedo anotado en:\n{Registro.Ruta}",
                "Error inesperado", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }

        /// <summary>
        /// Los numeros con los que SQL Server dice "no llegue": sin red,
        /// el servidor no contesta, se agoto el tiempo. Cualquier otro
        /// numero es un error de la consulta, no de la conexion.
        /// </summary>
        private static readonly HashSet<int> SinConexion =
            new() { -2, -1, 0, 2, 40, 53, 121, 258, 10053, 10054, 10060, 10061, 11001, 11004 };

        /// <summary>
        /// True si la falla es de la base en el servidor y ya se le explico
        /// al usuario.
        ///
        /// OJO: aca adentro se pregunta a ConexionCifrada y NUNCA a Conexion.
        /// Si la falla vino de iniciar Conexion, esa clase quedo rota, y
        /// tocarla de nuevo desde aca volveria a lanzar la misma excepcion
        /// dentro de la red de seguridad.
        /// </summary>
        private static bool ExplicarFallaDeServidor(Exception ex)
        {
            // Una falla al iniciar una clase llega envuelta en una
            // TypeInitializationException que dice, en ingles, "The type
            // initializer threw an exception". Lo que paso de verdad esta
            // adentro.
            Exception causa = ex is TypeInitializationException { InnerException: { } interna }
                ? interna
                : ex;

            // 1. El archivo de la conexion esta, pero no se puede leer.
            if (causa is ConexionIlegibleException)
            {
                MessageBox.Show(causa.Message, "No se puede usar la base del servidor",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                return true;
            }

            // 2. No hay manera de llegar al servidor.
            //
            // Sólo en modo servidor: con la base en esta computadora, un
            // "no llegue" significa que SQL Server no esta corriendo, y para
            // eso ya esta el mensaje de siempre.
            if (ConexionCifrada.Existe &&
                causa is Microsoft.Data.SqlClient.SqlException sql &&
                SinConexion.Contains(sql.Number))
            {
                MessageBox.Show(
                    "No hay conexion con el servidor de la base de datos.\n\n" +
                    "Revise dos cosas:\n" +
                    "  1. Que esta computadora tenga internet.\n" +
                    "  2. Que WireGuard este activo (el icono junto al reloj).\n\n" +
                    "Lo que ya estaba guardado esta a salvo en el servidor. " +
                    "Cuando vuelva la conexion, cierre esta pantalla y vuelva " +
                    "a intentarlo.\n\n" +
                    $"Quedo anotado en:\n{Registro.Ruta}",
                    "Sin conexion con el servidor",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return true;
            }

            return false;
        }
    }
}
