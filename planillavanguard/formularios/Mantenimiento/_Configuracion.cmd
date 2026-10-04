@echo off
REM ============================================================
REM  PlanillaVanguard  -  Configuracion del mantenimiento
REM  ------------------------------------------------------------
REM  Este archivo NO se ejecuta solo. Lo llaman los demas.
REM  Es el unico lugar donde hay que tocar rutas y valores.
REM ============================================================

REM ---- Base de datos ----
set "SERVIDOR=localhost"
set "BASE=PlanillaVanguard"

REM ---- Donde se guardan los respaldos ----
REM  Se escogio fuera de la carpeta del programa para que no se
REM  mezcle con el codigo y para poder darle permiso a SQL Server
REM  sin abrirle toda la carpeta de trabajo.
set "CARPETA_RESPALDOS=C:\PlanillaVanguard\Respaldos"
set "CARPETA_REGISTRO=C:\PlanillaVanguard\Registro"

REM ---- Cuantos dias se conservan los respaldos ----
set "DIAS_RESPALDOS=30"

REM ---- Cuantos dias tiene que tener un temporal para borrarlo ----
REM  No se borran los de hoy: pueden estar en uso.
set "DIAS_TEMPORALES=3"

REM ---- Aviso antes de reiniciar, en segundos ----
set "SEGUNDOS_AVISO=300"

REM ---- Carpeta de este juego de scripts ----
set "AQUI=%~dp0"

REM ============================================================
REM  De aqui para abajo no hay nada que configurar
REM ============================================================
for /f "tokens=2 delims==" %%A in ('wmic os get LocalDateTime /value 2^>nul ^| find "="') do set "AHORA=%%A"
set "FECHA=%AHORA:~0,4%-%AHORA:~4,2%-%AHORA:~6,2%"
set "HORA=%AHORA:~8,2%%AHORA:~10,2%"
set "SELLO=%FECHA%_%HORA%"
set "MES=%AHORA:~0,4%-%AHORA:~4,2%"

set "REGISTRO=%CARPETA_REGISTRO%\mantenimiento_%MES%.log"
