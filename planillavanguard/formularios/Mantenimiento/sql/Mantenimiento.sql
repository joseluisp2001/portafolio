/* ============================================================
   PlanillaVanguard  -  PULIDA DE LA BASE
   ------------------------------------------------------------
   Lo que se le hace a la base despues de respaldarla:

     1. Revisar que no este danada (DBCC CHECKDB)
     2. Reacomodar los indices, que es lo que se ensucia con el
        uso diario de la lista de asistencia
     3. Poner al dia las estadisticas
     4. Recalcular los contadores de tardias y ausencias
     5. Recortar el registro si quedo inflado

   SOLO LEE Y ACOMODA. No borra ni cambia ningun dato del
   sistema: ni asistencia, ni proyecciones, ni oficiales.

   Se corre despues del respaldo a proposito: si algo saliera
   mal aqui, el respaldo de hace un minuto ya esta guardado.
   ============================================================ */

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE [$(Base)];
GO

/* ============================================================
   1. REVISION DE INTEGRIDAD
   ============================================================ */
PRINT '=== 1. Revisando que la base no este danada ===';
GO

DBCC CHECKDB WITH NO_INFOMSGS, ALL_ERRORMSGS;
GO

PRINT '   Si no salio ningun mensaje arriba, la base esta sana.';
GO

/* ============================================================
   2. INDICES
   ------------------------------------------------------------
   Se reacomodan los que esten desordenados. Con una base de
   este tamano se puede reconstruir todo sin problema, pero se
   respeta el criterio de siempre:

       menos de 10% de desorden  -> se deja
       entre 10% y 30%           -> se reorganiza
       mas de 30%                -> se reconstruye
   ============================================================ */
PRINT '=== 2. Acomodando los indices ===';
GO

DECLARE @tabla   SYSNAME,
        @indice  SYSNAME,
        @desorden FLOAT,
        @sql     NVARCHAR(MAX),
        @tocados INT = 0;

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT  QUOTENAME(s.name) + N'.' + QUOTENAME(t.name),
            QUOTENAME(i.name),
            ps.avg_fragmentation_in_percent
    FROM    sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ps
    JOIN    sys.indexes i ON i.object_id = ps.object_id AND i.index_id = ps.index_id
    JOIN    sys.tables  t ON t.object_id = i.object_id
    JOIN    sys.schemas s ON s.schema_id = t.schema_id
    WHERE   i.name IS NOT NULL
      AND   ps.page_count > 8                      -- los muy chicos no valen la pena
      AND   ps.avg_fragmentation_in_percent > 10;

OPEN cur;
FETCH NEXT FROM cur INTO @tabla, @indice, @desorden;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'ALTER INDEX ' + @indice + N' ON ' + @tabla +
               CASE WHEN @desorden > 30 THEN N' REBUILD;' ELSE N' REORGANIZE;' END;

    BEGIN TRY
        EXEC sp_executesql @sql;
        SET @tocados += 1;
    END TRY
    BEGIN CATCH
        PRINT '   No se pudo acomodar ' + @indice + ' de ' + @tabla +
              ': ' + ERROR_MESSAGE();
    END CATCH

    FETCH NEXT FROM cur INTO @tabla, @indice, @desorden;
END

CLOSE cur;
DEALLOCATE cur;

PRINT '   Indices acomodados: ' + CAST(@tocados AS VARCHAR(10));
GO

/* ============================================================
   3. ESTADISTICAS
   ============================================================ */
PRINT '=== 3. Poniendo al dia las estadisticas ===';
GO

EXEC sp_updatestats;
GO

/* ============================================================
   4. CONTADORES DEL SISTEMA
   ------------------------------------------------------------
   No suma: los vuelve a contar desde el historial. Si alguna vez
   quedaron descuadrados, aqui se enderezan.
   ============================================================ */
PRINT '=== 4. Recalculando tardias y ausencias ===';
GO

IF OBJECT_ID('dbo.sp_RecalcularContadores', 'P') IS NOT NULL
BEGIN
    EXEC dbo.sp_RecalcularContadores;
    PRINT '   Contadores al dia.';
END
ELSE
    PRINT '   No existe sp_RecalcularContadores: se omite.';
GO

/* ============================================================
   5. REGISTRO DE TRANSACCIONES
   ------------------------------------------------------------
   Ya se le saco respaldo en el paso anterior, asi que el espacio
   quedo libre. Si el archivo crecio mucho, se recorta. Solo se
   toca si pasa de 128 MB: recortarlo cada rato hace mas mal que
   bien.
   ============================================================ */
PRINT '=== 5. Revisando el archivo de registro ===';
GO

DECLARE @log SYSNAME, @mb INT, @cmd NVARCHAR(500);

SELECT TOP 1 @log = name, @mb = size / 128
FROM   sys.database_files
WHERE  type_desc = 'LOG'
ORDER  BY size DESC;

IF @mb > 128
BEGIN
    SET @cmd = N'DBCC SHRINKFILE (' + QUOTENAME(@log) + N', 128) WITH NO_INFOMSGS;';
    EXEC sp_executesql @cmd;
    PRINT '   El registro estaba en ' + CAST(@mb AS VARCHAR(10)) + ' MB: se recorto.';
END
ELSE
    PRINT '   El registro esta en ' + CAST(@mb AS VARCHAR(10)) + ' MB. Bien asi.';
GO

/* ============================================================
   RESUMEN
   ============================================================ */
PRINT '=== COMO QUEDO LA BASE ===';
GO

SELECT
    (SELECT COUNT(*) FROM dbo.Oficiales)                       AS Oficiales,
    (SELECT COUNT(*) FROM dbo.Oficiales WHERE Activo = 1)      AS Activos,
    (SELECT COUNT(*) FROM dbo.Puestos WHERE Activo = 1)        AS PuestosActivos,
    (SELECT COUNT(*) FROM dbo.AsistenciaDiaria)                AS LineasAsistencia,
    (SELECT COUNT(DISTINCT Fecha) FROM dbo.AsistenciaDiaria)   AS DiasRegistrados,
    (SELECT COUNT(*) FROM dbo.ProyeccionDia)                   AS LineasProyeccion;
GO
