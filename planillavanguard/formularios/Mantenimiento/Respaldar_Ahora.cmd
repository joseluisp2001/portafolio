@echo off
setlocal enableextensions
REM ============================================================
REM  PlanillaVanguard  -  RESPALDAR AHORA
REM  ------------------------------------------------------------
REM  Saca un respaldo de la base y la deja pulida.
REM
REM  NO reinicia el equipo ni borra temporales. Es el que se puede
REM  correr a cualquier hora, con la gente trabajando, sin susto.
REM  Este es el que conviene dejar en el escritorio.
REM ============================================================

call "%~dp0_Configuracion.cmd"

title Respaldo de %BASE%
echo.
echo  ============================================================
echo   RESPALDO DE LA BASE  -  %BASE%
echo  ============================================================
echo.

call :Preparar || goto :Fallo

set "ARCHIVO=%CARPETA_RESPALDOS%\%BASE%_COMPLETO_%SELLO%.bak"
set "ARCHIVO_LOG=%CARPETA_RESPALDOS%\%BASE%_REGISTRO_%SELLO%.trn"

echo  Servidor : %SERVIDOR%
echo  Base     : %BASE%
echo  Destino  : %CARPETA_RESPALDOS%
echo.

call :Anotar "----- RESPALDO MANUAL -----"

echo  [1/3] Respaldando...
call :Sql "%AQUI%sql\Respaldo.sql" -v Base="%BASE%" ArchivoCompleto="%ARCHIVO%" ArchivoRegistro="%ARCHIVO_LOG%"
if errorlevel 1 (
    call :Anotar "ERROR: fallo el respaldo"
    goto :Fallo
)
call :Anotar "Respaldo OK: %ARCHIVO%"

echo.
echo  [2/3] Puliendo la base...
call :Sql "%AQUI%sql\Mantenimiento.sql" -v Base="%BASE%"
if errorlevel 1 (
    REM  Que falle la pulida no invalida el respaldo, que ya esta
    REM  guardado. Se avisa pero no se trata como fracaso.
    echo  AVISO: la pulida no termino bien. El respaldo SI quedo guardado.
    call :Anotar "AVISO: fallo el mantenimiento (el respaldo si quedo)"
) else (
    call :Anotar "Mantenimiento OK"
)

echo.
echo  [3/3] Quitando respaldos de mas de %DIAS_RESPALDOS% dias...
call :Limpiar

echo.
echo  ============================================================
echo   LISTO
echo  ============================================================
echo.
echo   Archivo : %ARCHIVO%
echo   Registro: %REGISTRO%
echo.
call :Anotar "----- FIN (correcto) -----"
echo  Presione una tecla para cerrar.
pause >nul
endlocal
exit /b 0


REM ============================================================
REM  Rutinas
REM ============================================================

:Preparar
    if not exist "%CARPETA_RESPALDOS%" md "%CARPETA_RESPALDOS%" 2>nul
    if not exist "%CARPETA_REGISTRO%"  md "%CARPETA_REGISTRO%"  2>nul
    if not exist "%CARPETA_RESPALDOS%" (
        echo  ERROR: no se pudo crear "%CARPETA_RESPALDOS%".
        exit /b 1
    )
    where sqlcmd >nul 2>&1
    if errorlevel 1 (
        echo  ERROR: no se encontro sqlcmd. Instale las herramientas de linea
        echo         de comandos de SQL Server.
        exit /b 1
    )
    exit /b 0

:Sql
    REM  -b hace que sqlcmd devuelva error si el script falla.
    REM  Sin eso, el .cmd creeria que todo salio bien siempre.
    sqlcmd -S "%SERVIDOR%" -E -b -l 30 -i %*
    exit /b %errorlevel%

:Limpiar
    REM  forfiles no falla feo si no hay nada que borrar
    forfiles /p "%CARPETA_RESPALDOS%" /m *.bak /d -%DIAS_RESPALDOS% /c "cmd /c del /q @path" >nul 2>&1
    forfiles /p "%CARPETA_RESPALDOS%" /m *.trn /d -%DIAS_RESPALDOS% /c "cmd /c del /q @path" >nul 2>&1
    exit /b 0

:Anotar
    echo [%FECHA% %time:~0,8%] %~1>>"%REGISTRO%"
    exit /b 0

:Fallo
    echo.
    echo  ============================================================
    echo   NO SE PUDO RESPALDAR
    echo  ============================================================
    echo.
    echo   Revise el detalle arriba y el registro:
    echo   %REGISTRO%
    echo.
    call :Anotar "----- FIN (con error) -----"
    echo  Presione una tecla para cerrar.
    pause >nul
    endlocal
    exit /b 1

