@echo off
setlocal enableextensions enabledelayedexpansion
REM ============================================================
REM  PlanillaVanguard  -  RESPALDO PARA REVISION
REM  ------------------------------------------------------------
REM  Saca una copia de la base y la deja comprimida en el
REM  Escritorio, lista para mandarla.
REM
REM  A diferencia de Respaldar_Ahora.cmd, este NO le hace
REM  mantenimiento a la base: no reconstruye indices, no recorta
REM  el registro y no recalcula contadores. Deja la base EXACTA
REM  como esta, que es lo que hace falta cuando se quiere que
REM  alguien revise una falla.
REM
REM  Este archivo se vale solo: se puede copiar en un llave maya
REM  y correrlo en la maquina donde esta el sistema instalado,
REM  sin el resto de la carpeta.
REM
REM  Si al lado esta el archivo Diagnostico_Proyeccion.sql,
REM  tambien lo corre y mete el resultado en el mismo comprimido.
REM ============================================================

REM ---- Lo unico que se puede necesitar cambiar ----
set "SERVIDOR=localhost"
set "BASE=PlanillaVanguard"
set "CARPETA=C:\PlanillaVanguard\Respaldos"
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


REM ============================================================
REM  De aqui para abajo no hay nada que configurar
REM ============================================================
set "AQUI=%~dp0"
title Respaldo de %BASE% para revision

echo.
echo  ============================================================
echo   RESPALDO DE %BASE%  -  PARA MANDAR A REVISAR
echo  ============================================================
echo.

REM ---- 1. Buscar sqlcmd ----
REM  Casi siempre esta en la ruta, pero si SQL Server se instalo
REM  sin las herramientas de linea de comandos hay que buscarlo.
set "SQLCMD="
for /f "delims=" %%S in ('where sqlcmd 2^>nul') do if not defined SQLCMD set "SQLCMD=%%S"

if not defined SQLCMD (
    for %%D in (
        "%ProgramFiles%\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\sqlcmd.exe"
        "%ProgramFiles%\Microsoft SQL Server\Client SDK\ODBC\160\Tools\Binn\sqlcmd.exe"
        "%ProgramFiles%\Microsoft SQL Server\Client SDK\ODBC\150\Tools\Binn\sqlcmd.exe"
        "%ProgramFiles(x86)%\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\sqlcmd.exe"
        "%ProgramFiles(x86)%\Microsoft SQL Server\Client SDK\ODBC\160\Tools\Binn\sqlcmd.exe"
    ) do if not defined SQLCMD if exist %%D set "SQLCMD=%%~D"
)

if not defined SQLCMD (
    echo  ERROR: no se encontro sqlcmd en esta maquina.
    echo.
    echo  Instale "Microsoft Command Line Utilities for SQL Server"
    echo  o corra el respaldo desde SSMS.
    goto :Fallo
)

REM ---- 2. Sello de fecha y hora para el nombre ----
REM  Se saca con PowerShell y no con wmic, porque wmic ya no
REM  viene en las versiones nuevas de Windows.
for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmm"`) do set "SELLO=%%A"
if not defined SELLO set "SELLO=copia"

set "NOMBRE=%BASE%_%SELLO%"
set "ARCHIVO=%CARPETA%\%NOMBRE%.bak"
set "ESCRITORIO=%USERPROFILE%\Desktop"
set "COMPRIMIDO=%ESCRITORIO%\%NOMBRE%.zip"
set "DIAGNOSTICO=%CARPETA%\%NOMBRE%_diagnostico.txt"

echo  Servidor : %SERVIDOR%
echo  Base     : %BASE%
echo.

REM ---- 3. Carpeta de destino ----
if not exist "%CARPETA%" md "%CARPETA%" 2>nul
if not exist "%CARPETA%" (
    echo  ERROR: no se pudo crear la carpeta "%CARPETA%".
    goto :Fallo
)

REM ---- 4. El respaldo ----
REM  Sin COMPRESSION a proposito: la edicion Express no la
REM  soporta y el respaldo fallaria. El comprimido lo hace
REM  Windows mas abajo, que sirve en cualquier edicion.
echo  [1/4] Sacando la copia...
"%SQLCMD%" -S "%SERVIDOR%" -E -b -l 30 -Q "BACKUP DATABASE [%BASE%] TO DISK='%ARCHIVO%' WITH INIT, CHECKSUM, NAME='PlanillaVanguard - copia para revision'" 1>nul
if errorlevel 1 goto :SinPermiso

:Verificar
REM ---- 5. Comprobar que el archivo se pueda leer ----
echo  [2/4] Comprobando que la copia sirva...
"%SQLCMD%" -S "%SERVIDOR%" -E -b -l 30 -Q "RESTORE VERIFYONLY FROM DISK='%ARCHIVO%' WITH CHECKSUM" 1>nul
if errorlevel 1 (
    echo  ERROR: la copia quedo danada y no se puede leer.
    goto :Fallo
)

REM ---- 6. Diagnostico, si el .sql viene al lado ----
echo  [3/4] Revisando los datos...
if exist "%AQUI%Diagnostico_Proyeccion.sql" (
    "%SQLCMD%" -S "%SERVIDOR%" -E -d "%BASE%" -i "%AQUI%Diagnostico_Proyeccion.sql" -o "%DIAGNOSTICO%" -W -s "|" 1>nul 2>nul
) else if exist "%AQUI%..\Diagnostico_Proyeccion.sql" (
    "%SQLCMD%" -S "%SERVIDOR%" -E -d "%BASE%" -i "%AQUI%..\Diagnostico_Proyeccion.sql" -o "%DIAGNOSTICO%" -W -s "|" 1>nul 2>nul
) else (
    echo         (no se encontro Diagnostico_Proyeccion.sql: se omite)
)

REM ---- 7. Comprimir en el Escritorio ----
echo  [4/4] Comprimiendo en el Escritorio...

set "PARA_COMPRIMIR='%ARCHIVO%'"
if exist "%DIAGNOSTICO%" set "PARA_COMPRIMIR='%ARCHIVO%','%DIAGNOSTICO%'"

REM  Tambien se mete la bitacora del programa, que es donde el
REM  sistema anota las fallas de las pantallas.
set "BITACORA=%LOCALAPPDATA%\PlanillaVanguard\bitacora.txt"
if exist "%BITACORA%" set "PARA_COMPRIMIR=!PARA_COMPRIMIR!,'%BITACORA%'"

powershell -NoProfile -Command "Compress-Archive -Path %PARA_COMPRIMIR% -DestinationPath '%COMPRIMIDO%' -Force"
if errorlevel 1 (
    echo  AVISO: no se pudo comprimir. El respaldo SI quedo guardado en:
    echo         %ARCHIVO%
    goto :Listo
)

echo.
echo  ============================================================
echo   LISTO
echo  ============================================================
echo.
echo   Mande este archivo:
echo   %COMPRIMIDO%
echo.
echo   Adentro va la copia de la base, el diagnostico y la
echo   bitacora del programa, si existian.
echo   El original queda en %CARPETA%
echo.
explorer /select,"%COMPRIMIDO%" 2>nul
goto :Listo


REM ============================================================
REM  Si SQL Server no puede escribir en la carpeta, se usa la
REM  suya. El respaldo lo escribe el SERVICIO, no el usuario:
REM  por eso una carpeta del Escritorio casi siempre falla.
REM ============================================================
:SinPermiso
echo         La carpeta de siempre no sirvio. Probando con la del servidor...

REM  El cmd se enreda con una ruta entre comillas dentro de los
REM  acentos graves, asi que la consulta se manda con cmd /c.
set "CARPETA_SQL="
for /f "usebackq delims=" %%P in (`cmd /c ""%SQLCMD%" -S "%SERVIDOR%" -E -h -1 -W -Q "SET NOCOUNT ON; SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS NVARCHAR(400))"" 2^>nul`) do (
    if not defined CARPETA_SQL set "CARPETA_SQL=%%P"
)

if not defined CARPETA_SQL goto :FallaRespaldo
if "%CARPETA_SQL%"=="NULL" goto :FallaRespaldo

REM  La ruta del servidor puede venir con o sin la barra final:
REM  Windows aguanta la barra doble, asi que se pone siempre.
set "ARCHIVO=%CARPETA_SQL%\%NOMBRE%.bak"
set "CARPETA=%CARPETA_SQL%"

"%SQLCMD%" -S "%SERVIDOR%" -E -b -l 30 -Q "BACKUP DATABASE [%BASE%] TO DISK='%ARCHIVO%' WITH INIT, CHECKSUM, NAME='PlanillaVanguard - copia para revision'" 1>nul
if errorlevel 1 goto :FallaRespaldo

echo         Quedo en la carpeta del servidor: %CARPETA_SQL%
goto :Verificar

:FallaRespaldo
echo.
echo  ERROR: SQL Server no pudo escribir el respaldo.
echo.
echo  Casi siempre es permiso de carpeta: el archivo lo escribe el
echo  SERVICIO de SQL Server, no su usuario de Windows.
echo.
echo  Que hacer:
echo    1. Corra este archivo como administrador, o
echo    2. Deje que escriba en la carpeta propia de SQL Server, o
echo    3. Desde SSMS: clic derecho en la base, Tareas, Copia de
echo       seguridad.
echo.
goto :Fallo

:Fallo
echo.
echo  ============================================================
echo   NO SE PUDO SACAR LA COPIA
echo  ============================================================
echo.
echo  Presione una tecla para cerrar.
pause >nul
endlocal
exit /b 1

:Listo
echo  Presione una tecla para cerrar.
pause >nul
endlocal
exit /b 0
