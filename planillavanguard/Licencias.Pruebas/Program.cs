using Licencias;
using GeneradorLicencias;

// ===================================================================
// Pruebas del sistema de licencias.
//
// Se corren con:   dotnet run --project Licencias.Pruebas
//
// Vale la pena correrlas despues de tocar cualquier cosa de Licencias\,
// porque una falla aqui no se nota probando la aplicacion a mano: una
// licencia que se acepta cuando no deberia se ve exactamente igual que
// una que esta bien.
// ===================================================================

int fallas = 0;

void Vale(string nombre, bool ok)
{
    Console.WriteLine($"{(ok ? "  OK  " : " FALLA")}  {nombre}");
    if (!ok) fallas++;
}

// -------------------------------------------------------------------
// 1. La huella de esta maquina
// -------------------------------------------------------------------
byte[] huella = HuellaEquipo.Calcular();
string texto = HuellaEquipo.Texto(huella);

Console.WriteLine($"Huella de esta maquina: {texto}");
Console.WriteLine();

Vale("la huella tiene 12 bytes", huella.Length == 12);
Vale("el texto tiene 24 caracteres con guiones", texto.Length == 24);
Vale("las tres senas se leyeron", !huella.Take(4).All(b => b == 0)
                              && !huella.Skip(4).Take(4).All(b => b == 0)
                              && !huella.Skip(8).Take(4).All(b => b == 0));

// -------------------------------------------------------------------
// 2. La huella se lee escrita de cualquier forma
// -------------------------------------------------------------------
Vale("ida y vuelta exacta", HuellaEquipo.Leer(texto)!.SequenceEqual(huella));
Vale("sin guiones", HuellaEquipo.Leer(texto.Replace("-", ""))!.SequenceEqual(huella));
Vale("en minusculas", HuellaEquipo.Leer(texto.ToLowerInvariant())!.SequenceEqual(huella));
Vale("con espacios de mas", HuellaEquipo.Leer($"  {texto}  \r\n")!.SequenceEqual(huella));
Vale("con O en vez de 0 y I en vez de 1",
     HuellaEquipo.Leer(texto.Replace('0', 'O').Replace('1', 'I'))!.SequenceEqual(huella));
Vale("codigo corto se rechaza", HuellaEquipo.Leer(texto[..10]) is null);
Vale("codigo con basura se rechaza", HuellaEquipo.Leer("no soy un codigo valido!!") is null);

// -------------------------------------------------------------------
// 3. Emitir y comprobar
// -------------------------------------------------------------------
using var privada = ClavesEmisor.Abrir();

// Casi todo lo que sigue firma con la clave privada de ESTA maquina y
// despues comprueba contra la clave publica que trae compilada
// Licencias. Si no son pareja, fallan quince pruebas de golpe y ninguna
// dice el motivo real: parece que se rompio el formato de la licencia
// cuando lo unico que pasa es que el emisor es otro.
//
// Por eso se comprueba de primero y se corta aqui.
string publicaDeAqui = ClavesEmisor.PublicaBase64(privada);

if (publicaDeAqui != ClavePublicaVanguard.Base64)
{
    Console.WriteLine();
    Console.WriteLine("===================================================================");
    Console.WriteLine(" ESTA COMPUTADORA NO ES EL EMISOR DEL PROGRAMA");
    Console.WriteLine("===================================================================");
    Console.WriteLine(" La clave privada que hay aqui no es la pareja de la clave publica");
    Console.WriteLine(" compilada en Licencias\\ClavePublicaVanguard.cs.");
    Console.WriteLine();
    Console.WriteLine($" Publica de esta maquina : {publicaDeAqui}");
    Console.WriteLine($" Publica del programa    : {ClavePublicaVanguard.Base64}");
    Console.WriteLine();

    if (publicaDeAqui == ClavePublicaVanguard.Base64Retirada)
        Console.WriteLine(" Esta maquina tiene la clave RETIRADA. El emisor bueno es el otro.");

    Console.WriteLine();
    Console.WriteLine(" Lo que sigue no se puede probar desde aqui: las pruebas firman con");
    Console.WriteLine(" la privada de esta maquina y comprueban con la publica del programa.");
    Console.WriteLine();
    Console.WriteLine(" Para poder correrlas: restaure en esta maquina la clave privada del");
    Console.WriteLine(" emisor bueno con el boton 'Restaurar desde respaldo' del generador.");
    Console.WriteLine("===================================================================");

    return 2;
}

var licencia = new Licencia
{
    Cliente = "Cliente de prueba",
    Huella = huella,
    FechaEmision = DateOnly.FromDateTime(DateTime.Today)
};

string clave = ClaveLicencia.Armar(licencia, privada);
Console.WriteLine();
Console.WriteLine($"Largo de una clave: {clave.Length} caracteres");
Console.WriteLine();

var estado = ClaveLicencia.Revisar(clave, huella, out var leida);
Vale("la licencia recien emitida es valida", estado == ClaveLicencia.Estado.Valida);
Vale("conserva el nombre del cliente", leida?.Cliente == "Cliente de prueba");
Vale("conserva la fecha", leida?.FechaEmision == DateOnly.FromDateTime(DateTime.Today));
Vale("conserva la huella", leida is not null && leida.Huella.SequenceEqual(huella));

Vale("se acepta partida en lineas",
     ClaveLicencia.Revisar(ClaveLicencia.EnLineas(clave), huella, out _)
         == ClaveLicencia.Estado.Valida);

Vale("se acepta en minusculas y con guiones",
     ClaveLicencia.Revisar(
         string.Join('-', clave.ToLowerInvariant().Chunk(5).Select(c => new string(c))),
         huella, out _) == ClaveLicencia.Estado.Valida);

// -------------------------------------------------------------------
// 4. Lo que tiene que rechazar
// -------------------------------------------------------------------
byte[] otraMaquina = huella.Select(b => (byte)(b ^ 0xFF)).ToArray();
Vale("otra maquina se rechaza",
     ClaveLicencia.Revisar(clave, otraMaquina, out _) == ClaveLicencia.Estado.OtroEquipo);

var alterada = clave.ToCharArray();
alterada[clave.Length / 2] = alterada[clave.Length / 2] == 'A' ? 'B' : 'A';
Vale("clave alterada se rechaza",
     ClaveLicencia.Revisar(new string(alterada), huella, out _) == ClaveLicencia.Estado.Firma);

Vale("clave inventada se rechaza",
     ClaveLicencia.Revisar(new string('7', clave.Length), huella, out _)
         is ClaveLicencia.Estado.Firma or ClaveLicencia.Estado.Formato);

Vale("clave recortada se rechaza",
     ClaveLicencia.Revisar(clave[..^20], huella, out _)
         is ClaveLicencia.Estado.Firma or ClaveLicencia.Estado.Formato);

Vale("clave vacia se rechaza",
     ClaveLicencia.Revisar("", huella, out _) == ClaveLicencia.Estado.Formato);

// El caso que de verdad importa: alguien se arma su propio generador.
using var impostor = System.Security.Cryptography.ECDsa.Create(
    System.Security.Cryptography.ECCurve.NamedCurves.nistP256);

Vale("licencia de un emisor falso se rechaza",
     ClaveLicencia.Revisar(ClaveLicencia.Armar(licencia, impostor), huella, out _)
         == ClaveLicencia.Estado.Firma);

// -------------------------------------------------------------------
// 5. Tolerancia a cambios de hardware (dos de tres senas)
// -------------------------------------------------------------------
byte[] Cambiar(int desde, int hasta)
{
    byte[] copia = (byte[])huella.Clone();
    for (int i = desde; i < hasta; i++) copia[i] ^= 0xFF;
    return copia;
}

Vale("cambiar el disco NO tumba la licencia",
     ClaveLicencia.Revisar(clave, Cambiar(8, 12), out _) == ClaveLicencia.Estado.Valida);

Vale("cambiar la placa NO tumba la licencia",
     ClaveLicencia.Revisar(clave, Cambiar(4, 8), out _) == ClaveLicencia.Estado.Valida);

Vale("reinstalar Windows NO tumba la licencia",
     ClaveLicencia.Revisar(clave, Cambiar(0, 4), out _) == ClaveLicencia.Estado.Valida);

Vale("cambiar placa Y disco a la vez si se rechaza",
     ClaveLicencia.Revisar(clave, Cambiar(4, 12), out _) == ClaveLicencia.Estado.OtroEquipo);

byte[] soloGuidIgual = huella.Select(b => (byte)(b ^ 0xFF)).ToArray();
Array.Copy(huella, soloGuidIgual, 4);
Vale("falsificar solo la MachineGuid no alcanza",
     ClaveLicencia.Revisar(clave, soloGuidIgual, out _) == ClaveLicencia.Estado.OtroEquipo);

string ClaveCon(byte[] h) => ClaveLicencia.Armar(
    new Licencia { Cliente = "X", Huella = h, FechaEmision = DateOnly.FromDateTime(DateTime.Today) },
    privada);

Vale("licencia sin ninguna sena no vale para nadie",
     ClaveLicencia.Revisar(ClaveCon(new byte[12]), huella, out _)
         == ClaveLicencia.Estado.OtroEquipo);

// Maquina virtual sin seriales: solo se pudo leer la MachineGuid.
byte[] soloGuid = new byte[12];
Array.Copy(huella, soloGuid, 4);

Vale("si no habia senas de hardware, basta la MachineGuid",
     ClaveLicencia.Revisar(ClaveCon(soloGuid), huella, out _) == ClaveLicencia.Estado.Valida);

byte[] otroGuid = (byte[])huella.Clone();
otroGuid[2] ^= 0xFF;
Vale("...pero solo esa MachineGuid",
     ClaveLicencia.Revisar(ClaveCon(soloGuid), otroGuid, out _)
         == ClaveLicencia.Estado.OtroEquipo);

// -------------------------------------------------------------------
// 6. Nombres largos y con tildes
// -------------------------------------------------------------------
string nombreLargo = "Compañía de Seguridad Ñandú Limitada S.A.";
string recortado = nombreLargo[..Math.Min(nombreLargo.Length, Licencia.LargoMaximoCliente)];

var estadoLargo = ClaveLicencia.Revisar(
    ClaveLicencia.Armar(
        new Licencia { Cliente = recortado, Huella = huella,
                       FechaEmision = DateOnly.FromDateTime(DateTime.Today) },
        privada),
    huella, out var leidaLarga);

Vale("nombre con tildes y ñ sobrevive",
     estadoLargo == ClaveLicencia.Estado.Valida && leidaLarga!.Cliente == recortado);

Console.WriteLine();
Console.WriteLine(fallas == 0
    ? "TODAS LAS PRUEBAS PASARON"
    : $"{fallas} PRUEBA(S) FALLARON");

return fallas == 0 ? 0 : 1;
