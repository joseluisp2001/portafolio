/* ============================================================
   PlanillaVanguard  -  TIPO ROL / EXTRA EN LA PROYECCION
   ------------------------------------------------------------
   Agrega a la proyeccion la casilla de Tipo, con dos valores:

       Rol     el oficial entra por el rol que le toca
       Extra   entra de extra, no le tocaba

   Lo que ya estaba guardado no se pierde: todas las lineas
   viejas quedan como 'Rol', menos las que ya tenian a alguien
   cubriendo, que pasan a 'Extra' porque eso es lo que son.

   Tambien se rehace la vista vw_ProyeccionDia para que el
   reporte del dia traiga la columna nueva.

   ADITIVO. No borra datos, no toca otras tablas ni los
   procedimientos. Se puede correr varias veces sin problema.

   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   Si la base se llama distinto, cambie el USE de abajo.
   ============================================================ */

USE PlanillaVanguard;
GO

/* SSMS las pone en ON solo; sqlcmd no. Se dejan fijas para que
   el script corra igual desde donde sea. */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '=== TIPO ROL / EXTRA EN ProyeccionDia ===';
GO

/* ------------------------------------------------------------
   1. La columna. Entra con valor por defecto 'Rol', asi que las
      lineas que ya estaban no quedan en nulo ni hay que tocarlas
      una por una.
   ------------------------------------------------------------ */
IF COL_LENGTH('dbo.ProyeccionDia', 'Tipo') IS NULL
BEGIN
    ALTER TABLE dbo.ProyeccionDia
        ADD Tipo NVARCHAR(10) NOT NULL
            CONSTRAINT DF_Proy_Tipo DEFAULT (N'Rol');

    /* Lo ya guardado que tiene a alguien cubriendo es un extra. Va
       con EXEC porque una columna recien creada no se puede nombrar
       en el mismo lote.

       Y va aqui adentro a proposito: el acomodo pasa una sola vez,
       la vez que la columna nace. Si estuviera suelto, volver a
       correr el script le pondria Extra otra vez a coberturas que
       usted hubiera pasado a Rol a mano. */
    EXEC(N'UPDATE dbo.ProyeccionDia
              SET Tipo = N''Extra''
            WHERE IdOficialSustituto IS NOT NULL;');

    PRINT '   Columna Tipo agregada. Las coberturas que ya estaban ' +
          'guardadas quedaron como Extra; el resto en Rol.';
END
ELSE PRINT '   La columna Tipo ya existia: no se toca lo guardado.';
GO

/* ------------------------------------------------------------
   2. La restriccion. Solo se aceptan los dos valores; cualquier
      otra cosa es un error de escritura, no un tipo nuevo.
   ------------------------------------------------------------ */
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

/* ------------------------------------------------------------
   3. La vista, para que el reporte del dia traiga el Tipo.
      Es la misma de siempre con una columna mas.
   ------------------------------------------------------------ */
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

PRINT '   Vista vw_ProyeccionDia actualizada.';
GO

/* ------------------------------------------------------------
   4. Como quedo
   ------------------------------------------------------------ */
SELECT Tipo, COUNT(*) AS Lineas
FROM dbo.ProyeccionDia
GROUP BY Tipo
ORDER BY Tipo;
GO

PRINT '=== LISTO. Ya se puede marcar Rol o Extra en la proyeccion. ===';
GO
