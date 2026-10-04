/* ============================================================
   PlanillaVanguard  -  PUESTOS NUEVOS Y EXTRAS
   ------------------------------------------------------------
   Tres cosas, en este orden:

     1. Cambia el cuadro de puestos por el de ahora:
            CH 1, CH 2, CH 3, CH 4, CH 5, CH 6 C1, CH 7 C2,
            CH 8, CH 9.1, CH 9.2, CH 10, CH 11, CH 12.1,
            CH 12.2, CH 13, CH 14, CH 15.1, CH 15.2, BRAVO 0
        Los anteriores se retiran. Los que nunca se usaron se
        borran; los que ya aparecen en asistencia, sustituciones
        o proyecciones se dejan inactivos, porque borrarlos
        romperia esos registros.

     2. Permite repetir el codigo de chaleco. Un mismo chaleco
        pasa de un oficial a otro y en el traslape los dos lo
        tienen anotado: eso no es un error.

     3. Permite que un oficial cubra mas de un puesto el mismo
        dia. Aqui los extras son de todos los dias, y el indice
        unico viejo los bloqueaba.

   ADITIVO Y REPETIBLE. Se puede correr varias veces sin danar
   nada. No toca ningun dato de asistencia ya registrado.

   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   ============================================================ */

USE PlanillaVanguard;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ============================================================
   0. REVISION PREVIA
   ============================================================ */
IF OBJECT_ID('dbo.Puestos', 'U') IS NULL
BEGIN
    RAISERROR('No existe la tabla Puestos. Corra primero PlanillaVanguard_INSTALACION.sql.', 16, 1);
    SET NOEXEC ON;
END
GO

PRINT '=== 1. CUADRO DE PUESTOS ===';
GO

/* ------------------------------------------------------------
   La columna Orden guarda en que orden se recorren los puestos.
   Sin ella la lista salia por codigo interno y CH 10 aparecia
   antes que CH 2.
   ------------------------------------------------------------ */
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Puestos') AND name = 'Orden')
BEGIN
    ALTER TABLE dbo.Puestos ADD Orden INT NULL;
    PRINT '   Columna Orden agregada.';
END
ELSE PRINT '   La columna Orden ya existia.';
GO

/* El cuadro de hoy, en el orden en que se recorre la base */
IF OBJECT_ID('tempdb..#Nuevos') IS NOT NULL DROP TABLE #Nuevos;

CREATE TABLE #Nuevos (Orden INT NOT NULL, Codigo NVARCHAR(50) NOT NULL);

INSERT INTO #Nuevos (Orden, Codigo) VALUES
    ( 1, N'CH 1'),
    ( 2, N'CH 2'),
    ( 3, N'CH 3'),
    ( 4, N'CH 4'),
    ( 5, N'CH 5'),
    ( 6, N'CH 6 C1'),
    ( 7, N'CH 7 C2'),
    ( 8, N'CH 8'),
    ( 9, N'CH 9.1'),
    (10, N'CH 9.2'),
    (11, N'CH 10'),
    (12, N'CH 11'),
    (13, N'CH 12.1'),
    (14, N'CH 12.2'),
    (15, N'CH 13'),
    (16, N'CH 14'),
    (17, N'CH 15.1'),
    (18, N'CH 15.2'),
    (19, N'BRAVO 0');
GO

/* ------------------------------------------------------------
   1.a  Se retiran los anteriores.
        Primero se apagan todos los que no esten en la lista
        nueva. Nada se borra todavia.
   ------------------------------------------------------------ */
UPDATE p
SET    p.Activo = 0
FROM   dbo.Puestos p
WHERE  p.Activo = 1
   AND NOT EXISTS (SELECT 1 FROM #Nuevos n WHERE n.Codigo = p.Codigo);

PRINT '   Puestos anteriores desactivados: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
GO

/* ------------------------------------------------------------
   1.b  Los viejos que nunca se usaron se borran de verdad.
        Los que si tienen historial se quedan inactivos: el dato
        del dia en que se usaron tiene que seguir cuadrando.
   ------------------------------------------------------------ */
DELETE p
FROM   dbo.Puestos p
WHERE  p.Activo = 0
   AND NOT EXISTS (SELECT 1 FROM #Nuevos n WHERE n.Codigo = p.Codigo)
   AND NOT EXISTS (SELECT 1 FROM dbo.AsistenciaDiaria a WHERE a.IdPuesto = p.IdPuesto)
   AND NOT EXISTS (SELECT 1 FROM dbo.Sustituciones   s WHERE s.IdPuesto = p.IdPuesto)
   AND NOT EXISTS (SELECT 1 FROM dbo.ProyeccionDia  pr WHERE pr.IdPuesto = p.IdPuesto);

PRINT '   Puestos anteriores borrados por no tener historial: ' + CAST(@@ROWCOUNT AS VARCHAR(10));

IF EXISTS (SELECT 1 FROM dbo.Puestos p
           WHERE p.Activo = 0
             AND NOT EXISTS (SELECT 1 FROM #Nuevos n WHERE n.Codigo = p.Codigo))
BEGIN
    PRINT '   Los siguientes quedaron INACTIVOS porque tienen registros asociados:';

    SELECT p.IdPuesto, p.Codigo, p.Ubicacion,
           (SELECT COUNT(*) FROM dbo.AsistenciaDiaria a WHERE a.IdPuesto = p.IdPuesto) AS EnAsistencia,
           (SELECT COUNT(*) FROM dbo.Sustituciones   s WHERE s.IdPuesto = p.IdPuesto) AS EnSustituciones,
           (SELECT COUNT(*) FROM dbo.ProyeccionDia  pr WHERE pr.IdPuesto = p.IdPuesto) AS EnProyecciones
    FROM   dbo.Puestos p
    WHERE  p.Activo = 0
      AND  NOT EXISTS (SELECT 1 FROM #Nuevos n WHERE n.Codigo = p.Codigo)
    ORDER BY p.Codigo;
END
GO

/* ------------------------------------------------------------
   1.c  Entran los nuevos. Si alguno ya existia con ese mismo
        codigo, se reactiva en vez de duplicarlo, y se le deja la
        escritura nueva.

        Esto le pasa a BRAVO 0, que ya estaba como 'Bravo 0': se
        reconoce como el mismo puesto, conserva su ubicacion y su
        historial, y solo se le acomoda el nombre.
   ------------------------------------------------------------ */
UPDATE p
SET    p.Activo = 1,
       p.Orden  = n.Orden,
       p.Codigo = n.Codigo
FROM   dbo.Puestos p
INNER JOIN #Nuevos n ON n.Codigo = p.Codigo;

PRINT '   Puestos que ya existian y se reactivaron: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
GO

/* La insercion se arma segun las columnas que tenga la tabla:
   Ubicacion existe en la instalacion normal, pero se comprueba
   para que el script no dependa de eso. */
DECLARE @insertar NVARCHAR(MAX);

IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.Puestos') AND name = 'Ubicacion')
    SET @insertar = N'
        INSERT INTO dbo.Puestos (Codigo, Ubicacion, Activo, Orden)
        SELECT n.Codigo, N'''', 1, n.Orden
        FROM   #Nuevos n
        WHERE  NOT EXISTS (SELECT 1 FROM dbo.Puestos p WHERE p.Codigo = n.Codigo)
        ORDER  BY n.Orden;';
ELSE
    SET @insertar = N'
        INSERT INTO dbo.Puestos (Codigo, Activo, Orden)
        SELECT n.Codigo, 1, n.Orden
        FROM   #Nuevos n
        WHERE  NOT EXISTS (SELECT 1 FROM dbo.Puestos p WHERE p.Codigo = n.Codigo)
        ORDER  BY n.Orden;';

EXEC sp_executesql @insertar;

PRINT '   Puestos nuevos insertados: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
GO

DROP TABLE #Nuevos;
GO

PRINT '=== 2. EL CODIGO DE CHALECO SE PUEDE REPETIR ===';
GO

/* ------------------------------------------------------------
   Se quita cualquier regla de unicidad sobre CodigoChaleco.
   El nombre cambia segun como se instalo la base, asi que se
   busca por la columna. Los datos no se tocan.
   ------------------------------------------------------------ */
DECLARE @quitar NVARCHAR(MAX) = N'';

/* Restricciones UNIQUE */
SELECT @quitar = @quitar +
       N'ALTER TABLE dbo.Oficiales DROP CONSTRAINT ' + QUOTENAME(i.name) + N';' + CHAR(13)
FROM   sys.indexes i
INNER JOIN sys.index_columns ic
        ON ic.object_id = i.object_id AND ic.index_id = i.index_id
INNER JOIN sys.columns c
        ON c.object_id = i.object_id AND c.column_id = ic.column_id
WHERE  i.object_id = OBJECT_ID('dbo.Oficiales')
  AND  i.is_unique = 1
  AND  i.is_unique_constraint = 1
  AND  i.is_primary_key = 0
  AND  c.name = 'CodigoChaleco';

/* Indices unicos sueltos */
SELECT @quitar = @quitar +
       N'DROP INDEX ' + QUOTENAME(i.name) + N' ON dbo.Oficiales;' + CHAR(13)
FROM   sys.indexes i
INNER JOIN sys.index_columns ic
        ON ic.object_id = i.object_id AND ic.index_id = i.index_id
INNER JOIN sys.columns c
        ON c.object_id = i.object_id AND c.column_id = ic.column_id
WHERE  i.object_id = OBJECT_ID('dbo.Oficiales')
  AND  i.is_unique = 1
  AND  i.is_unique_constraint = 0
  AND  i.is_primary_key = 0
  AND  c.name = 'CodigoChaleco';

IF LEN(@quitar) > 0
BEGIN
    EXEC sp_executesql @quitar;
    PRINT '   Se quito la unicidad del chaleco. Ahora se puede repetir.';
END
ELSE PRINT '   El chaleco ya se podia repetir: no habia nada que quitar.';
GO

PRINT '=== 3. UN OFICIAL PUEDE CUBRIR VARIOS PUESTOS (EXTRAS) ===';
GO

/* ------------------------------------------------------------
   En la proyeccion habia un indice unico filtrado
   (Fecha, IdOficialSustituto) que impedia que el mismo oficial
   cubriera dos puestos el mismo dia. Con los extras eso pasa
   seguido, asi que sale.

   Lo que si se mantiene: UQ_Proy_Fecha_Oficial, que evita que
   un oficial aparezca dos veces en el plan del mismo dia.
   ------------------------------------------------------------ */
DECLARE @extras NVARCHAR(MAX) = N'';

SELECT @extras = @extras +
       CASE WHEN i.is_unique_constraint = 1
            THEN N'ALTER TABLE dbo.ProyeccionDia DROP CONSTRAINT ' + QUOTENAME(i.name) + N';'
            ELSE N'DROP INDEX ' + QUOTENAME(i.name) + N' ON dbo.ProyeccionDia;'
       END + CHAR(13)
FROM   sys.indexes i
INNER JOIN sys.index_columns ic
        ON ic.object_id = i.object_id AND ic.index_id = i.index_id
INNER JOIN sys.columns c
        ON c.object_id = i.object_id AND c.column_id = ic.column_id
WHERE  i.object_id = OBJECT_ID('dbo.ProyeccionDia')
  AND  i.is_unique = 1
  AND  i.is_primary_key = 0
  AND  c.name = 'IdOficialSustituto';

IF LEN(@extras) > 0
BEGIN
    EXEC sp_executesql @extras;
    PRINT '   Proyeccion: un oficial ya puede cubrir varios puestos el mismo dia.';
END
ELSE PRINT '   Proyeccion: ya lo permitia.';
GO

/* Lo mismo en las sustituciones reales de la lista de asistencia.
   Ojo: si hay un unico sobre (Fecha, IdPuesto) se deja, porque un
   puesto si deberia tener un solo sustituto. */
DECLARE @extras2 NVARCHAR(MAX) = N'';

SELECT @extras2 = @extras2 +
       CASE WHEN i.is_unique_constraint = 1
            THEN N'ALTER TABLE dbo.Sustituciones DROP CONSTRAINT ' + QUOTENAME(i.name) + N';'
            ELSE N'DROP INDEX ' + QUOTENAME(i.name) + N' ON dbo.Sustituciones;'
       END + CHAR(13)
FROM   sys.indexes i
INNER JOIN sys.index_columns ic
        ON ic.object_id = i.object_id AND ic.index_id = i.index_id
INNER JOIN sys.columns c
        ON c.object_id = i.object_id AND c.column_id = ic.column_id
WHERE  i.object_id = OBJECT_ID('dbo.Sustituciones')
  AND  i.is_unique = 1
  AND  i.is_primary_key = 0
  AND  c.name = 'IdOficialSustituto';

IF LEN(@extras2) > 0
BEGIN
    EXEC sp_executesql @extras2;
    PRINT '   Sustituciones: un oficial ya puede cubrir varios puestos el mismo dia.';
END
ELSE PRINT '   Sustituciones: ya lo permitia.';
GO

/* ============================================================
   VERIFICACION
   ------------------------------------------------------------
   Deben salir los 19 puestos activos, en orden, y las tres
   comprobaciones en 'ya esta'.
   ============================================================ */
PRINT '=== LISTO ===';

SELECT Orden, Codigo, Ubicacion, Activo
FROM   dbo.Puestos
WHERE  Activo = 1
ORDER  BY ISNULL(Orden, 2147483647), IdPuesto;

SELECT
    (SELECT COUNT(*) FROM dbo.Puestos WHERE Activo = 1) AS PuestosActivos,
    (SELECT COUNT(*) FROM dbo.Puestos WHERE Activo = 0) AS PuestosRetirados;

SELECT
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns
                      WHERE object_id = OBJECT_ID('dbo.Puestos') AND name = 'Orden')
         THEN N'ya esta' ELSE N'FALTA' END AS Columna_Orden,

    CASE WHEN EXISTS (
             SELECT 1
             FROM sys.indexes i
             INNER JOIN sys.index_columns ic
                     ON ic.object_id = i.object_id AND ic.index_id = i.index_id
             INNER JOIN sys.columns c
                     ON c.object_id = i.object_id AND c.column_id = ic.column_id
             WHERE i.object_id = OBJECT_ID('dbo.Oficiales')
               AND i.is_unique = 1 AND i.is_primary_key = 0
               AND c.name = 'CodigoChaleco')
         THEN N'FALTA' ELSE N'ya esta' END AS Chaleco_Se_Puede_Repetir,

    CASE WHEN EXISTS (
             SELECT 1
             FROM sys.indexes i
             INNER JOIN sys.index_columns ic
                     ON ic.object_id = i.object_id AND ic.index_id = i.index_id
             INNER JOIN sys.columns c
                     ON c.object_id = i.object_id AND c.column_id = ic.column_id
             WHERE i.object_id = OBJECT_ID('dbo.ProyeccionDia')
               AND i.is_unique = 1 AND i.is_primary_key = 0
               AND c.name = 'IdOficialSustituto')
         THEN N'FALTA' ELSE N'ya esta' END AS Extras_En_Proyeccion,

    CASE WHEN EXISTS (
             SELECT 1
             FROM sys.indexes i
             INNER JOIN sys.index_columns ic
                     ON ic.object_id = i.object_id AND ic.index_id = i.index_id
             INNER JOIN sys.columns c
                     ON c.object_id = i.object_id AND c.column_id = ic.column_id
             WHERE i.object_id = OBJECT_ID('dbo.Sustituciones')
               AND i.is_unique = 1 AND i.is_primary_key = 0
               AND c.name = 'IdOficialSustituto')
         THEN N'FALTA' ELSE N'ya esta' END AS Extras_En_Sustituciones;
GO

SET NOEXEC OFF;
GO
