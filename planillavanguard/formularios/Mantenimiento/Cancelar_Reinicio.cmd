@echo off
setlocal
REM ============================================================
REM  PlanillaVanguard  -  CANCELAR EL REINICIO
REM  ------------------------------------------------------------
REM  Si salio el aviso de que el equipo se va a reiniciar y en ese
REM  momento no conviene, esto lo detiene.
REM
REM  Solo sirve durante los minutos del aviso. Despues de que el
REM  equipo se apago ya no hay nada que cancelar.
REM
REM  Conviene tener un acceso directo a este archivo al lado del
REM  de respaldar.
REM ============================================================

call "%~dp0_Configuracion.cmd"

title Cancelar reinicio
echo.
echo  ============================================================
echo   CANCELAR EL REINICIO PROGRAMADO
echo  ============================================================
echo.

shutdown /a 2>nul

if errorlevel 1 (
    echo   No habia ningun reinicio pendiente.
    echo.
    echo   Puede ser que el aviso ya se vencio, o que este
    echo   mantenimiento todavia no llego al paso del reinicio.
) else (
    echo   LISTO: se cancelo el reinicio.
    echo.
    echo   Ojo: el proximo mantenimiento programado lo va a volver
    echo   a intentar a su hora. Esto cancela solo el de ahora.
    echo [%FECHA% %time:~0,8%] Reinicio cancelado a mano>>"%REGISTRO%"
)

echo.
echo  Presione una tecla para cerrar.
pause >nul
endlocal

