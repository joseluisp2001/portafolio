/* ============================================================
   PlanillaVanguard  -  PONER LA BASE AL DIA
   ------------------------------------------------------------
   Un solo archivo con TODO lo que le falta a la base para
   quedar pareja con el programa. Al 8 de agosto de 2026 son
   tres cosas:

     1. Los tres horarios nuevos (06:00-12:00, 07:00-16:00 y
        12:00-18:00). Hoy la base los rechaza y el programa si
        los ofrece en la lista.

     2. Que un oficial pueda cubrir varios puestos el mismo dia.
        Hay un indice unico que lo impide, y los extras son cosa
        de todos los dias.

     3. La casilla Tipo (Rol / Extra) en la proyeccion, con su
        vista al dia.

   ADITIVO. No borra datos, no toca los puestos ni los oficiales
   (solo empareja la escritura del horario, ver el paso 1), y se
   puede correr las veces que sea.

   LO QUE NO HACE: los puestos. Si quiere la columna Orden para
   que el cuadro salga en el orden de la garita, ese es
   PlanillaVanguard_PUESTOS.sql, que si toca los datos de los
   puestos y hay que revisarlo antes de correrlo.

   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   Si la base se llama distinto, cambie el USE de abajo.

   Al final sale un cuadro que dice, punto por punto, si quedo
   'ya esta' o 'FALTA'.
   ============================================================ */

USE PlanillaVanguard;
GO

/* SSMS las pone en ON solo; sqlcmd no. Se dejan fijas para que
   el script corra igual desde donde sea. */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '';
PRINT '============================================================';
PRINT ' PONIENDO LA BASE AL DIA';
PRINT '============================================================';
GO

/* ============================================================
   1. LOS NUEVE HORARIOS
   ============================================================ */
PRINT '';
PRINT '=== 1. HORARIOS ===';
GO

/* La restriccion vieja cambia de nombre segun como se instalo
   la base, asi que se busca por su definicion. */
DECLARE @borrar NVARCHAR(MAX) = N'';

SELECT @borrar = @borrar +
       N'ALTER TABLE dbo.Oficiales DROP CONSTRAINT ' + QUOTENAME(cc.name) + N';' + CHAR(13)
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID('dbo.Oficiales')
  AND cc.definition LIKE N'%Horario%';

IF LEN(@borrar) > 0
BEGIN
    EXEC sp_executesql @borrar;
    PRINT '   Restriccion anterior del Horario retirada.';
END
ELSE PRINT '   No habia restriccion de Horario que retirar.';
GO

/* Con el tiempo se cuelan valores como '14:00-18:00' sin
   espacios. Se emparejan comparando sin espacios, para no
   perder a nadie cuando entre la restriccion. */
UPDATE o
SET    o.Horario = c.Bueno
FROM   dbo.Oficiales o
INNER JOIN (VALUES (N'06:00 - 12:00'), (N'06:00 - 14:00'), (N'07:00 - 16:00'),
                   (N'12:00 - 18:00'), (N'14:00 - 18:00'), (N'14:00 - 21:00'),
                   (N'18:00 - 00:00'), (N'00:00 - 06:00'),
                   (N'Autorizado Externo')) AS c(Bueno)
        ON REPLACE(o.Horario, N' ', N'') = REPLACE(c.Bueno, N' ', N'')
WHERE  o.Horario <> c.Bueno;

IF @@ROWCOUNT > 0
    PRINT '   Se emparejo la escritura del horario en algunos registros.';
GO

/* Si queda algun horario raro se avisa por nombre y apellido y
   la restriccion entra sin revisar lo viejo: asi el script
   termina y el sistema queda usable, pero el dato malo no se
   esconde. */
IF EXISTS (SELECT 1 FROM dbo.Oficiales
           WHERE Horario NOT IN (N'06:00 - 12:00', N'06:00 - 14:00',
                                 N'07:00 - 16:00', N'12:00 - 18:00',
                                 N'14:00 - 18:00', N'14:00 - 21:00',
                                 N'18:00 - 00:00', N'00:00 - 06:00',
                                 N'Autorizado Externo'))
BEGIN
    PRINT '   ATENCION: hay oficiales con un horario que no es ninguno de los nueve.';
    PRINT '   Corrijalos desde Editar personal. Salen listados abajo.';

    SELECT IdOficial, Nombre, Cedula, Horario AS HorarioInvalido
    FROM   dbo.Oficiales
    WHERE  Horario NOT IN (N'06:00 - 12:00', N'06:00 - 14:00',
                           N'07:00 - 16:00', N'12:00 - 18:00',
                           N'14:00 - 18:00', N'14:00 - 21:00',
                           N'18:00 - 00:00', N'00:00 - 06:00',
                           N'Autorizado Externo');

    ALTER TABLE dbo.Oficiales WITH NOCHECK
        ADD CONSTRAINT CK_Oficiales_Horario CHECK
        (
            Horario IN (N'06:00 - 12:00', N'06:00 - 14:00', N'07:00 - 16:00',
                        N'12:00 - 18:00', N'14:00 - 18:00', N'14:00 - 21:00',
                        N'18:00 - 00:00', N'00:00 - 06:00', N'Autorizado Externo')
        );

    PRINT '   Restriccion puesta (sin revisar lo viejo).';
END
ELSE
BEGIN
    ALTER TABLE dbo.Oficiales WITH CHECK
        ADD CONSTRAINT CK_Oficiales_Horario CHECK
        (
            Horario IN (N'06:00 - 12:00', N'06:00 - 14:00', N'07:00 - 16:00',
                        N'12:00 - 18:00', N'14:00 - 18:00', N'14:00 - 21:00',
                        N'18:00 - 00:00', N'00:00 - 06:00', N'Autorizado Externo')
        );

    PRINT '   Los nueve horarios quedaron habilitados.';
END
GO

/* ============================================================
   2. UN OFICIAL PUEDE CUBRIR VARIOS PUESTOS EL MISMO DIA
   ============================================================ */
PRINT '';
PRINT '=== 2. EXTRAS ===';
GO

/* En la proyeccion hay un indice unico filtrado
   (Fecha, IdOficialSustituto) que impide que el mismo oficial
   cubra dos puestos el mismo dia. Con los extras eso pasa
   seguido, asi que sale.

   Lo que SI se mantiene: UQ_Proy_Fecha_Oficial, que evita que
   un oficial aparezca dos veces en el plan del mismo dia. */
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

/* Lo mismo en las sustituciones reales de la lista de
   asistencia. Ojo: si hay un unico sobre (Fecha, IdPuesto) se
   deja, porque un puesto si deberia tener un solo sustituto. */
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
   3. LA CASILLA TIPO (ROL / EXTRA)
   ============================================================ */
PRINT '';
PRINT '=== 3. TIPO ROL / EXTRA ===';
GO

IF COL_LENGTH('dbo.ProyeccionDia', 'Tipo') IS NULL
BEGIN
    ALTER TABLE dbo.ProyeccionDia
        ADD Tipo NVARCHAR(10) NOT NULL
            CONSTRAINT DF_Proy_Tipo DEFAULT (N'Rol');

    /* Lo ya guardado que tiene a alguien cubriendo es un extra.
       Va con EXEC porque una columna recien creada no se puede
       nombrar en el mismo lote.

       Y va aqui adentro a proposito: el acomodo pasa una sola
       vez, la vez que la columna nace. Si estuviera suelto,
       volver a correr el script le pondria Extra otra vez a
       coberturas que usted hubiera pasado a Rol a mano. */
    EXEC(N'UPDATE dbo.ProyeccionDia
              SET Tipo = N''Extra''
            WHERE IdOficialSustituto IS NOT NULL;');

    PRINT '   Columna Tipo agregada. Las coberturas que ya estaban guardadas';
    PRINT '   quedaron como Extra; todo lo demas en Rol.';
END
ELSE PRINT '   La columna Tipo ya existia: no se toca lo guardado.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_Proy_Tipo'
                 AND parent_object_id = OBJECT_ID('dbo.ProyeccionDia'))
BEGIN
    /* Por si acaso quedo algo raro de una corrida a medias */
    UPDATE dbo.ProyeccionDia
       SET Tipo = N'Rol'
     WHERE Tipo NOT IN (N'Rol', N'Extra');

    ALTER TABLE dbo.ProyeccionDia
        ADD CONSTRAINT CK_Proy_Tipo CHECK (Tipo IN (N'Rol', N'Extra'));

    PRINT '   Restriccion CK_Proy_Tipo puesta.';
END
ELSE PRINT '   CK_Proy_Tipo ya existia.';
GO

/* ============================================================
   4. LA VISTA, CON EL TIPO ADENTRO
   ============================================================ */
PRINT '';
PRINT '=== 4. VISTA vw_ProyeccionDia ===';
GO

IF OBJECT_ID('dbo.vw_ProyeccionDia','V') IS NOT NULL DROP VIEW dbo.vw_ProyeccionDia;
GO

CREATE VIEW dbo.vw_ProyeccionDia
AS
SELECT
    pr.IdProyeccion,
    pr.Fecha,
    pr.Turno,
    pr.Tipo,
    p.Codigo    AS Puesto,
    p.Ubicacion,
    o.IdOficial,
    o.Nombre    AS Oficial,
    o.Cedula,
    pr.Disponible,
    CASE WHEN pr.Disponible = 1 THEN N'Asignado'
         ELSE ISNULL(pr.Motivo, N'No disponible') END AS Situacion,
    sus.Nombre  AS Cubre,
    sus.Cedula  AS CedulaCubre,
    ISNULL(sus.Horario, N'') AS RolCubre,
    pr.Motivo,
    pr.Observacion
FROM dbo.ProyeccionDia pr
INNER JOIN dbo.Oficiales o   ON o.IdOficial   = pr.IdOficial
LEFT  JOIN dbo.Puestos   p   ON p.IdPuesto    = pr.IdPuesto
LEFT  JOIN dbo.Oficiales sus ON sus.IdOficial = pr.IdOficialSustituto;
GO

PRINT '   Vista rehecha con la columna Tipo.';
GO

/* ============================================================
   COMO QUEDO
   ------------------------------------------------------------
   Las cuatro comprobaciones tienen que decir 'ya esta'.
   ============================================================ */
PRINT '';
PRINT '============================================================';
PRINT ' COMO QUEDO';
PRINT '============================================================';
GO

SELECT
    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE name = 'CK_Oficiales_Horario'
                        AND parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%07:00 - 16:00%')
         THEN N'ya esta' ELSE N'FALTA' END AS Los_Nueve_Horarios,

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

    CASE WHEN COL_LENGTH('dbo.ProyeccionDia','Tipo') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Columna_Tipo,

    CASE WHEN COL_LENGTH('dbo.vw_ProyeccionDia','Tipo') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Tipo_En_La_Vista;
GO

/* Los horarios que hay hoy, con cuanta gente en cada uno */
SELECT Horario, COUNT(*) AS Oficiales
FROM   dbo.Oficiales
WHERE  Activo = 1
GROUP  BY Horario
ORDER  BY Horario;
GO

/* Como quedo repartida la proyeccion */
SELECT Tipo, COUNT(*) AS Lineas
FROM   dbo.ProyeccionDia
GROUP  BY Tipo
ORDER  BY Tipo;
GO

PRINT '';
PRINT '=== LISTO. Cierre y vuelva a abrir el programa. ===';
GO
