@echo off
setlocal enableextensions enabledelayedexpansion
REM ============================================================
REM  PlanillaVanguard  -  MANTENIMIENTO PROGRAMADO
REM  ------------------------------------------------------------
REM  Es el que corren las tareas de las 4:00 a.m. y 9:00 p.m.
REM
REM  Hace, en este orden:
REM     1. Respalda la base y la deja pulida
REM     2. Borra archivos temporales viejos
REM     3. Avisa que va a reiniciar y reinicia
REM
REM  El reinicio SOLO ocurre si el respaldo salio bien. Si algo
REM  fallo, el equipo se queda encendido a proposito: es preferible
REM  llegar y encontrar el aviso a que se reinicie tapando el error.
REM
REM  Para probarlo sin que reinicie:
REM     Mantenimiento_Nocturno.cmd /sinreinicio
REM ============================================================

call "%~dp0_Configuracion.cmd"

set "REINICIAR=si"
if /i "%~1"=="/sinreinicio" set "REINICIAR=no"

set "ARCHIVO=%CARPETA_RESPALDOS%\%BASE%_COMPLETO_%SELLO%.bak"
set "ARCHIVO_LOG=%CARPETA_RESPALDOS%\%BASE%_REGISTRO_%SELLO%.trn"

call :Anotar "==================================================="
call :Anotar "MANTENIMIENTO PROGRAMADO  (reinicio: %REINICIAR%)"

echo.
echo  ============================================================
echo   MANTENIMIENTO PROGRAMADO  -  %FECHA% %HORA%
echo  ============================================================
echo.

REM ---------- Preparar ----------
if not exist "%CARPETA_RESPALDOS%" md "%CARPETA_RESPALDOS%" 2>nul
if not exist "%CARPETA_REGISTRO%"  md "%CARPETA_REGISTRO%"  2>nul

where sqlcmd >nul 2>&1
if errorlevel 1 (
    call :Anotar "ERROR: no se encontro sqlcmd"
    goto :SalirConError
)

REM ---------- 1. Respaldo ----------
echo  [1/4] Respaldando la base...
call :Anotar "Paso 1: respaldo"

sqlcmd -S "%SERVIDOR%" -E -b -l 30 -i "%AQUI%sql\Respaldo.sql" ^
       -v Base="%BASE%" ArchivoCompleto="%ARCHIVO%" ArchivoRegistro="%ARCHIVO_LOG%" ^
       >>"%REGISTRO%" 2>&1

if errorlevel 1 (
    call :Anotar "ERROR: el respaldo fallo. NO se reinicia."
    goto :SalirConError
)
call :Anotar "   respaldo OK: %ARCHIVO%"

REM ---------- 2. Pulida ----------
echo  [2/4] Puliendo la base...
call :Anotar "Paso 2: mantenimiento"

sqlcmd -S "%SERVIDOR%" -E -b -l 60 -i "%AQUI%sql\Mantenimiento.sql" ^
       -v Base="%BASE%" >>"%REGISTRO%" 2>&1

if errorlevel 1 (
    REM  El respaldo ya esta guardado, que es lo que no se puede
    REM  perder. Se sigue adelante y queda anotado.
    call :Anotar "   AVISO: el mantenimiento no termino bien"
) else (
    call :Anotar "   mantenimiento OK"
)

REM ---------- 3. Limpieza ----------
echo  [3/4] Limpiando temporales y respaldos viejos...
call :Anotar "Paso 3: limpieza"
call :Limpiar

REM ---------- 4. Reinicio ----------
REM  Ojo al escribir dentro de un bloque entre parentesis: un
REM  parentesis suelto en un echo lo cierra antes de tiempo y CMD
REM  se cae. Por eso aqui se salta a una etiqueta.
if /i "%REINICIAR%"=="no" goto :SinReinicio

echo  [4/4] Avisando y reiniciando...
call :Anotar "Paso 4: aviso de reinicio (%SEGUNDOS_AVISO% segundos)"

set /a MINUTOS=%SEGUNDOS_AVISO%/60

REM  Dos avisos, porque no siempre se ven los dos:
REM   - msg saca un cuadro en la sesion de quien este trabajando
REM   - shutdown /c saca el aviso propio de Windows con la cuenta atras
msg * /time:%SEGUNDOS_AVISO% "MANTENIMIENTO: el equipo se va a reiniciar en %MINUTOS% minutos. Guarde y cierre el sistema PlanillaVanguard. Para cancelar, abra Cancelar_Reinicio.cmd" 2>nul

shutdown /r /f /t %SEGUNDOS_AVISO% ^
    /c "Mantenimiento de PlanillaVanguard. El equipo se reinicia en %MINUTOS% minutos. Guarde su trabajo. Para cancelar: Cancelar_Reinicio.cmd"

if errorlevel 1 (
    call :Anotar "ERROR: no se pudo programar el reinicio"
    goto :SalirConError
)

call :Anotar "FIN (correcto, reinicio en %SEGUNDOS_AVISO% s)"
endlocal
exit /b 0


:SinReinicio
    echo  [4/4] Se omite el reinicio: se pidio /sinreinicio
    call :Anotar "Paso 4: reinicio omitido"
    call :Anotar "FIN correcto, sin reiniciar"
    endlocal
    exit /b 0


REM ============================================================
REM  Rutinas
REM ============================================================

:Limpiar
    REM  ---- Respaldos pasados de fecha ----
    forfiles /p "%CARPETA_RESPALDOS%" /m *.bak /d -%DIAS_RESPALDOS% /c "cmd /c del /q @path" >nul 2>&1
    forfiles /p "%CARPETA_RESPALDOS%" /m *.trn /d -%DIAS_RESPALDOS% /c "cmd /c del /q @path" >nul 2>&1

    REM  ---- Registros de mas de un ano ----
    forfiles /p "%CARPETA_REGISTRO%" /m *.log /d -365 /c "cmd /c del /q @path" >nul 2>&1

    REM  ---- Temporales ----
    REM  Solo los que ya tienen dias. Los de hoy pueden estar en uso
    REM  por un programa abierto, y borrarlos rompe cosas.
    call :LimpiarCarpeta "%TEMP%"
    call :LimpiarCarpeta "%LOCALAPPDATA%\Temp"
    call :LimpiarCarpeta "%SystemRoot%\Temp"

    REM  ---- Papelera ----
    REM  Se vacia con PowerShell, que lo hace de forma segura.
    powershell -NoProfile -NonInteractive -Command "try { Clear-RecycleBin -Force -ErrorAction Stop } catch {}" >nul 2>&1

    call :Anotar "   limpieza terminada"
    exit /b 0

:LimpiarCarpeta
    set "OBJETIVO=%~1"
    if not exist "%OBJETIVO%" exit /b 0

    REM  Los archivos en uso simplemente no se borran y no pasa nada.
    forfiles /p "%OBJETIVO%" /s /m *.* /d -%DIAS_TEMPORALES% /c "cmd /c del /q /f @path" >nul 2>&1

    REM  Y las carpetas que quedaron vacias
    for /f "delims=" %%D in ('dir "%OBJETIVO%" /ad /b /s 2^>nul ^| sort /r') do (
        rd "%%D" 2>nul
    )
    exit /b 0

:Anotar
    echo [%FECHA% %time:~0,8%] %~1>>"%REGISTRO%"
    exit /b 0

:SalirConError
    call :Anotar "FIN (con error). El equipo NO se reinicio."
    REM  Se deja un aviso visible para quien llegue al turno
    msg * "PlanillaVanguard: el mantenimiento de las %HORA% fallo. El equipo NO se reinicio. Revise %REGISTRO%" 2>nul
    endlocal
    exit /b 1

