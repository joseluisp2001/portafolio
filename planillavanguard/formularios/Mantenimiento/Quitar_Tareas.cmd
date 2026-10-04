@echo off
setlocal
REM ============================================================
REM  PlanillaVanguard  -  QUITAR LAS TAREAS PROGRAMADAS
REM  ------------------------------------------------------------
REM  Deja de correr el mantenimiento automatico. No borra ningun
REM  respaldo ni toca la base: solo quita las dos tareas.
REM
REM  Hay que abrirlo como administrador.
REM ============================================================

call "%~dp0_Configuracion.cmd"

title Quitar tareas de mantenimiento
echo.
echo  ============================================================
echo   QUITAR EL MANTENIMIENTO AUTOMATICO
echo  ============================================================
echo.

net session >nul 2>&1
if errorlevel 1 (
    echo   ERROR: hay que abrir este archivo como administrador.
    echo.
    pause
    exit /b 1
)

echo   Los respaldos que ya estan guardados NO se borran.
echo.
pause
echo.

schtasks /delete /f /tn "PlanillaVanguard - Mantenimiento 04:00" 2>nul
schtasks /delete /f /tn "PlanillaVanguard - Mantenimiento 21:00" 2>nul

echo.
echo   Listo. El mantenimiento automatico quedo desactivado.
echo   Puede seguir respaldando a mano con Respaldar_Ahora.cmd
echo.
echo [%FECHA% %time:~0,8%] Tareas programadas quitadas>>"%REGISTRO%"
pause
endlocal

