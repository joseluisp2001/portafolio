# PlanillaVanguard

Programa de escritorio para controlar al personal de seguridad de una base:
quién entró, quién faltó, quién cubre al que faltó, incapacidades, días libres,
vacantes y cómo queda la planilla. Exporta a Excel.

**C# · .NET 10 · WinForms · SQL Server · ClosedXML.** Está en producción.

## Carpetas

```
PlanillaVanguard/PlanillaVanguard.slnx   ← se abre esta solución
formularios/          ← el programa (pantallas, repositorios, scripts SQL)
Licencias/            ← biblioteca de activación que va dentro del programa
GeneradorLicencias/   ← ventana para emitir claves (no se entrega al cliente)
Licencias.Pruebas/    ← pruebas del esquema de licencias
```

`PlanillaVanguard/` sólo tiene la solución y un formulario vacío. El código del
programa está en `formularios/`.

## Licencias

Licencia perpetua, una por computadora. El cliente ve un código de equipo, lo
manda y recibe una clave de texto de unos 156 caracteres.

- La clave es el contenido de la licencia más una firma **ECDSA P-256**, en Base32.
- El programa sólo trae la **clave pública**: comprueba, no puede firmar.
- El generador guarda la **clave privada** fuera del código, en
  `%APPDATA%\PlanillaVanguard\Emisor`, cifrada con DPAPI (sólo la abre el mismo
  usuario de Windows en la misma máquina).

> Este repositorio no trae ninguna clave privada. Si se compila el generador,
> crea una pareja nueva propia, que no sirve para las licencias ya entregadas.

## Cómo correrlo

Requiere Windows, Visual Studio 2022 17.13 o superior con el SDK de .NET 10 y SQL Server.

1. Crear la base con `formularios/PlanillaVanguard_INSTALAR_O_ACTUALIZAR.sql`.
2. Abrir `PlanillaVanguard/PlanillaVanguard.slnx` y arrancar `formularios`.

## Qué se sacó de esta copia

La carga de personal real de una base, la configuración del servidor y del
túnel WireGuard, y los scripts de respaldo del VPS.
