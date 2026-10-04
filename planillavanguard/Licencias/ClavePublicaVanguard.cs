namespace Licencias
{
    /// <summary>
    /// La clave publica del emisor. Con esta clave el programa solo puede
    /// COMPROBAR firmas, nunca fabricarlas: aunque alguien abra el
    /// ejecutable y la copie, no le sirve para generar licencias.
    ///
    /// La clave privada, que es la que si fabrica licencias, vive
    /// unicamente en la maquina del proveedor, dentro del programa
    /// GeneradorLicencias, y no esta en este repositorio ni tiene que
    /// estarlo nunca.
    ///
    /// Este valor lo escribe el GeneradorLicencias la primera vez que se
    /// abre. Mientras este vacio, la aplicacion no acepta ninguna
    /// licencia.
    ///
    /// OJO AL CAMBIARLA: el dia que este valor cambia, TODA licencia
    /// emitida con el par anterior deja de servir de golpe, en todas las
    /// computadoras donde ya este instalado el programa. No basta con
    /// recompilar aqui: hay que repartir el ejecutable nuevo Y volver a
    /// emitir las licencias de los clientes que ya estaban.
    /// </summary>
    public static class ClavePublicaVanguard
    {
        /// <summary>
        /// El emisor de hoy. Cambiada el 10 de agosto de 2026 por
        /// decision del proveedor: el generador bueno paso a ser el de
        /// la otra computadora.
        /// </summary>
        public const string Base64 =
            "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEtg66k8RNcYrTMl4dTGOgDb1JQCBW" +
            "H9rDOB3HA+aLQHDECjKKAN5IEf+aG876aNVtW8Rsf/opiBiiLceWl5y2uA==";

        /// <summary>
        /// El emisor anterior, retirado el 10 de agosto de 2026. NO se
        /// usa para nada: se deja escrito solo para poder reconocer una
        /// clave vieja cuando un cliente reclame que "antes le servia".
        ///
        /// Licencias que quedaron invalidadas al cambiar:
        ///   05/08/2026  Equipo de desarrollo   M29N-W1V1-9VMP-NJ0S-NJE0
        ///   08/08/2026  CGI Marcial Fallas     PPX1-CRZF-AGGM-9P15-SHN0
        /// </summary>
        public const string Base64Retirada =
            "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYJ/SbqNjWmbiMACh87LJKHGGxHDc" +
            "NDJTSjsOwa7ijAnyvAZJL2qjsjEVm3Q+uysS9tUwHcEVFfRNSzVun6jUsw==";
    }
}
