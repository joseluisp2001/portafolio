/* ============================================================
   PlanillaVanguard  -  RESPALDO
   ------------------------------------------------------------
   Saca el respaldo completo, lo verifica y, si la base esta en
   modelo FULL, saca tambien el respaldo del registro.

   Ese ultimo paso importa: la base esta en FULL, y en ese modelo
   el archivo de registro (.ldf) crece sin parar hasta que se le
   saca respaldo. Sin esto, el disco se llena solo.

   Lo llama Respaldar_Ahora.cmd. Recibe las rutas por parametro.
   ============================================================ */

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @base     SYSNAME       = N'$(Base)';
DECLARE @completo NVARCHAR(500) = N'$(ArchivoCompleto)';
DECLARE @registro NVARCHAR(500) = N'$(ArchivoRegistro)';

/* ---------- 1. Respaldo completo ---------- */
PRINT '   Sacando el respaldo completo...';

BACKUP DATABASE @base
TO DISK = @completo
WITH INIT,
     COMPRESSION,
     CHECKSUM,
     NAME        = N'PlanillaVanguard - respaldo completo',
     DESCRIPTION = N'Respaldo automatico del sistema PlanillaVanguard';

/* ---------- 2. Se comprueba que el archivo sirva ----------
   Un respaldo que no se puede leer no es un respaldo. Esto lo
   revisa sin tener que restaurarlo. */
PRINT '   Comprobando que el archivo se pueda leer...';

RESTORE VERIFYONLY FROM DISK = @completo WITH CHECKSUM;

PRINT '   El respaldo completo quedo bien.';

/* ---------- 3. Respaldo del registro, solo si hace falta ----------
   recovery_model: 1 = FULL, 2 = BULK_LOGGED, 3 = SIMPLE.
   En SIMPLE el registro se recicla solo y esto no aplica. */
DECLARE @modelo TINYINT =
    (SELECT recovery_model FROM sys.databases WHERE name = @base);

IF @modelo IN (1, 2)
BEGIN
    PRINT '   La base esta en modelo FULL: se respalda el registro.';

    BACKUP LOG @base
    TO DISK = @registro
    WITH INIT,
         COMPRESSION,
         CHECKSUM,
         NAME = N'PlanillaVanguard - respaldo del registro';

    PRINT '   Registro respaldado y liberado.';
END
ELSE
    PRINT '   La base esta en modelo SIMPLE: el registro no necesita respaldo.';
GO

/* ---------- 4. Como quedo ---------- */
SELECT
    d.name                                                   AS Base,
    d.recovery_model_desc                                    AS Modelo,
    CAST(SUM(mf.size) * 8.0 / 1024 AS DECIMAL(10,1))         AS TamanoMB
FROM sys.databases d
JOIN sys.master_files mf ON mf.database_id = d.database_id
WHERE d.name = N'$(Base)'
GROUP BY d.name, d.recovery_model_desc;
GO
