@echo off
setlocal enableextensions
REM ============================================================
REM  PlanillaVanguard  -  CONFIGURAR LA BASE EN EL SERVIDOR
REM  ------------------------------------------------------------
REM  Guarda, cifrada, la conexion a la base del servidor. Desde
REM  ese momento el programa deja de usar el SQL Server de esta
REM  computadora.
REM
REM  Pide servidor, usuario y contrasena. La contrasena no se ve
REM  al escribirla y no queda en texto plano en ningun lado.
REM  Prueba la conexion ANTES de guardar.
REM
REM  Para volver a la base de esta computadora:
REM      Configurar_Servidor.cmd -Quitar
REM
REM  Este .cmd solo llama al .ps1 de al lado. Existe porque
REM  Windows no deja correr scripts de PowerShell con doble clic,
REM  y los demas archivos de mantenimiento ya son .cmd.
REM ============================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Configurar_Servidor.ps1" %*
set "RESULTADO=%ERRORLEVEL%"

echo.
pause
exit /b %RESULTADO%
