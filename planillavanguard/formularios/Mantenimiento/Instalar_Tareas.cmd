@echo off
setlocal enableextensions
REM ============================================================
REM  PlanillaVanguard  -  INSTALAR LAS TAREAS PROGRAMADAS
REM  ------------------------------------------------------------
REM  Deja el mantenimiento corriendo solo a las 4:00 a.m. y a las
REM  9:00 p.m., y le da a SQL Server permiso para escribir en la
REM  carpeta de respaldos.
REM
REM  HAY QUE ABRIRLO COMO ADMINISTRADOR:
REM     clic derecho  ->  Ejecutar como administrador
REM
REM  Se corre UNA sola vez.
REM ============================================================

call "%~dp0_Configuracion.cmd"

set "TAREA_MADRUGADA=PlanillaVanguard - Mantenimiento 04:00"
set "TAREA_NOCHE=PlanillaVanguard - Mantenimiento 21:00"
set "SCRIPT=%AQUI%Mantenimiento_Nocturno.cmd"

title Instalar tareas de mantenimiento
echo.
echo  ============================================================
echo   INSTALAR EL MANTENIMIENTO AUTOMATICO
echo  ============================================================
echo.

REM ---------- Se comprueba que vaya con permisos ----------
net session >nul 2>&1
if errorlevel 1 (
    echo   ERROR: hay que abrir este archivo como administrador.
    echo.
    echo   Cierre esta ventana, haga clic derecho sobre
    echo   Instalar_Tareas.cmd y escoja "Ejecutar como administrador".
    echo.
    pause
    exit /b 1
)

if not exist "%SCRIPT%" (
    echo   ERROR: no se encontro "%SCRIPT%".
    pause
    exit /b 1
)

echo   Usuario   : %USERDOMAIN%\%USERNAME%
echo   Script    : %SCRIPT%
echo   Respaldos : %CARPETA_RESPALDOS%
echo.
echo   Se van a crear DOS tareas diarias:
echo      - %TAREA_MADRUGADA%
echo      - %TAREA_NOCHE%
echo.
echo   Cada una respalda la base, la pule, borra temporales,
echo   avisa %SEGUNDOS_AVISO% segundos antes y REINICIA el equipo.
echo.
pause

REM ============================================================
REM  1. Carpetas y permisos
REM ============================================================
echo.
echo  [1/3] Preparando carpetas y permisos...

if not exist "%CARPETA_RESPALDOS%" md "%CARPETA_RESPALDOS%"
if not exist "%CARPETA_REGISTRO%"  md "%CARPETA_REGISTRO%"

REM  Quien escribe el archivo .bak es el servicio de SQL Server, no
REM  usted. Sin este permiso el respaldo falla con "acceso denegado".
icacls "%CARPETA_RESPALDOS%" /grant "NT Service\MSSQLSERVER":(OI)(CI)M >nul 2>&1
if errorlevel 1 (
    echo        AVISO: no se pudo dar permiso a NT Service\MSSQLSERVER.
    echo        Si el respaldo falla por "acceso denegado", dele permiso
    echo        de Modificar a esa cuenta sobre %CARPETA_RESPALDOS%.
) else (
    echo        Permiso dado a NT Service\MSSQLSERVER.
)

REM ============================================================
REM  2. Como se van a ejecutar
REM ============================================================
echo.
echo  [2/3] Como debe correr el mantenimiento?
echo.
echo     1 = Aunque nadie tenga la sesion abierta  (recomendado)
echo         Windows le va a pedir su contrasena una vez, para
echo         guardarla el. Yo no la veo ni queda escrita aqui.
echo.
echo     2 = Solo cuando usted tenga la sesion abierta
echo         No pide contrasena, pero si a las 4:00 a.m. el equipo
echo         esta con la sesion cerrada, el respaldo NO se hace.
echo.
set "MODO="
set /p "MODO=  Escriba 1 o 2 y presione Enter: "

REM  Se arma con etiquetas y no con if/else entre parentesis: el
REM  valor lleva comillas por dentro y dentro de un bloque CMD las
REM  parte mal.
if "%MODO%"=="2" goto :SoloConSesion

set "COMO="
set "CREDENCIAL=/RU "%USERDOMAIN%\%USERNAME%" /RP *"
goto :CrearTareas

:SoloConSesion
set "COMO=/IT"
set "CREDENCIAL=/RU "%USERDOMAIN%\%USERNAME%""

:CrearTareas

REM ============================================================
REM  3. Las tareas
REM ============================================================
echo.
echo  [3/3] Creando las tareas...
echo.

schtasks /create /f /tn "%TAREA_MADRUGADA%" /tr "\"%SCRIPT%\"" ^
    /sc daily /st 04:00 /rl HIGHEST %CREDENCIAL% %COMO%
if errorlevel 1 goto :Fallo

schtasks /create /f /tn "%TAREA_NOCHE%" /tr "\"%SCRIPT%\"" ^
    /sc daily /st 21:00 /rl HIGHEST %CREDENCIAL% %COMO%
if errorlevel 1 goto :Fallo

echo.
echo  ============================================================
echo   LISTO
echo  ============================================================
echo.
echo   El mantenimiento va a correr todos los dias a las 4:00 a.m.
echo   y a las 9:00 p.m.
echo.
echo   Para verlas:      Programador de tareas de Windows
echo   Para probar ya:   schtasks /run /tn "%TAREA_MADRUGADA%"
echo   Para quitarlas:   Quitar_Tareas.cmd
echo.
echo   Si alguna vez sale el aviso de reinicio y no conviene,
echo   abra Cancelar_Reinicio.cmd
echo.
echo [%FECHA% %time:~0,8%] Tareas programadas instaladas>>"%REGISTRO%"
pause
endlocal
exit /b 0

:Fallo
echo.
echo   ERROR: no se pudieron crear las tareas.
echo.
echo   Lo mas comun es que la contrasena no coincida, o que la
echo   cuenta no tenga permiso para ejecutar tareas programadas.
echo.
pause
endlocal
exit /b 1

