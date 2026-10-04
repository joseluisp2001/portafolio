# ============================================================================
#  PlanillaVanguard - configurar la base en el servidor
# ----------------------------------------------------------------------------
#  Guarda, CIFRADA, la cadena de conexion a la base del servidor. Desde ese
#  momento el programa deja de usar el SQL Server de esta computadora.
#
#  No se corre directo: se usa Configurar_Servidor.cmd, que se ocupa de los
#  permisos de PowerShell.
#
#  POR QUE EXISTE: la contrasena de la base no puede quedar en texto plano en
#  esta computadora. Este script la pide una vez, sin mostrarla en pantalla, y
#  la guarda cifrada con DPAPI atada a ESTA MAQUINA. Copiado a otra
#  computadora, el archivo no sirve.
#
#  TIENE QUE COINCIDIR CON ConexionCifrada.cs: la misma ruta, la misma
#  entropia y el mismo alcance (LocalMachine). Si se cambia uno, se cambia el
#  otro; si no, el programa no puede leer lo que este script guarda.
#
#  Uso:
#    Configurar_Servidor.cmd            pide los datos y guarda
#    Configurar_Servidor.cmd -Quitar    borra la configuracion: el programa
#                                       vuelve al SQL Server de esta PC
# ============================================================================

param(
    [switch]$Quitar,
    # Solo para pruebas. En uso normal NO se pasa: el programa lee siempre
    # de ProgramData, y guardar en otro lado no tendria ningun efecto.
    [string]$Ruta = (Join-Path $env:ProgramData 'PlanillaVanguard\conexion.bin')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security

# Igual que en ConexionCifrada.cs. No cambiar uno sin el otro.
$Entropia = [System.Text.Encoding]::UTF8.GetBytes('PlanillaVanguard/conexion-servidor/v1')
$Alcance  = [System.Security.Cryptography.DataProtectionScope]::LocalMachine

Write-Host ''
Write-Host '  PlanillaVanguard - base de datos en el servidor' -ForegroundColor Cyan
Write-Host '  ------------------------------------------------'
Write-Host ''

# --- Volver a la base de esta computadora -----------------------------------
if ($Quitar) {
    if (Test-Path $Ruta) {
        Remove-Item $Ruta -Force
        Write-Host '  Listo: se quito la configuracion del servidor.' -ForegroundColor Green
        Write-Host '  El programa vuelve a usar el SQL Server de esta computadora.'
        Write-Host ''
        Write-Host '  OJO: la base de esta computadora quedo como estaba el dia de la' -ForegroundColor Yellow
        Write-Host '  mudanza. Lo que se registro despues en el servidor NO esta aca.' -ForegroundColor Yellow
        Write-Host '  Antes de trabajar, hay que traer un respaldo del servidor.' -ForegroundColor Yellow
    } else {
        Write-Host '  No habia configuracion del servidor. No se toco nada.'
    }
    Write-Host ''
    exit 0
}

# --- Pedir los datos ---------------------------------------------------------
Write-Host '  Los datos se los da quien instalo el servidor.'
Write-Host '  La contrasena NO se ve mientras se escribe, y no queda guardada en'
Write-Host '  ningun lado en texto plano.'
Write-Host ''

$servidor = Read-Host '  Servidor (ej. 10.66.0.1,1433)'
if ([string]::IsNullOrWhiteSpace($servidor)) { Write-Host '  Cancelado.'; exit 1 }

$usuario = Read-Host '  Usuario de la base (ej. planilla_app)'
if ([string]::IsNullOrWhiteSpace($usuario)) { Write-Host '  Cancelado.'; exit 1 }

$segura = Read-Host '  Contrasena' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura)
try {
    $clave = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
} finally {
    # La contrasena en claro vive lo minimo posible en memoria.
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
if ([string]::IsNullOrEmpty($clave)) { Write-Host '  Cancelado.'; exit 1 }

# Encrypt=True aunque el tunel ya cifre: si algun dia el tunel quedara mal
# configurado, los datos igual no viajarian en claro.
$cadena = "Server=$($servidor.Trim());Database=PlanillaVanguard;" +
          "User Id=$($usuario.Trim());Password=$clave;" +
          "Encrypt=True;TrustServerCertificate=True;Connect Timeout=10;"

# --- Probar ANTES de guardar -------------------------------------------------
# Guardar una configuracion que no funciona dejaria el programa sin poder
# abrir. Se prueba primero; si falla, se pregunta.
Write-Host ''
Write-Host '  Probando la conexion...'
$funciona = $false
try {
    $cn = New-Object System.Data.SqlClient.SqlConnection $cadena
    $cn.Open()
    $cmd = $cn.CreateCommand()
    $cmd.CommandText = 'SELECT COUNT(*) FROM dbo.Oficiales'
    $oficiales = $cmd.ExecuteScalar()
    $cn.Close()
    $funciona = $true
    Write-Host "  Conecta bien. La base tiene $oficiales oficiales." -ForegroundColor Green
} catch {
    Write-Host '  NO se pudo conectar:' -ForegroundColor Red
    Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ''
    Write-Host '  Revise que haya internet y que WireGuard este activo.'
}

if (-not $funciona) {
    $r = Read-Host '  Guardar de todos modos? (s/n)'
    if ($r -notmatch '^[sS]') {
        Write-Host '  No se guardo nada.'
        exit 1
    }
}

# --- Guardar cifrado ---------------------------------------------------------
$carpeta = Split-Path $Ruta -Parent
if (-not (Test-Path $carpeta)) { New-Item -ItemType Directory -Path $carpeta -Force | Out-Null }

$bytes   = [System.Text.Encoding]::UTF8.GetBytes($cadena)
$cifrado = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $Entropia, $Alcance)

# Primero a un temporal y despues se reemplaza, igual que ConexionCifrada.Guardar.
$temporal = "$Ruta.tmp"
[System.IO.File]::WriteAllBytes($temporal, $cifrado)
Move-Item -Path $temporal -Destination $Ruta -Force

# Nada de la contrasena queda en variables al salir.
$clave = $null; $cadena = $null; $bytes = $null

Write-Host ''
Write-Host "  Guardado, cifrado, en: $Ruta" -ForegroundColor Green
Write-Host '  Abra PlanillaVanguard: ya trabaja contra el servidor.'
Write-Host ''
Write-Host '  Recordatorio: si todavia no se hizo, correr Quitar_Tareas.cmd.' -ForegroundColor Yellow
Write-Host '  Las tareas nocturnas respaldan la base de ESTA computadora, que' -ForegroundColor Yellow
Write-Host '  ya no es la que se usa.' -ForegroundColor Yellow
Write-Host ''
