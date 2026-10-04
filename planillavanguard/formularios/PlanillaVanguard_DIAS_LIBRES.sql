/* ============================================================
   PlanillaVanguard  -  VARIOS DIAS LIBRES POR PERSONA
   ------------------------------------------------------------
   Hasta ahora cada oficial tenia UN dia libre. En la operacion
   hay gente que libra dos -- sabado y domingo -- y no habia
   donde anotarlo: al escoger uno, el sistema esperaba a esa
   persona el otro dia y le marcaba una ausencia que no era.

   Con esto el dia libre puede ser uno, varios o ninguno. Se
   guardan en el mismo campo, separados por coma:

       Domingo               libra un dia
       Sabado,Domingo        libra los dos
       Ninguno               no tiene dia fijo

   Lo que ya estaba guardado NO SE TOCA y sigue valiendo igual:
   un solo dia se sigue escribiendo como siempre.

   ADITIVO. No borra datos. Lo que hace es:
      1. Ensanchar la columna, que era de diez letras.
      2. Rehacer la restriccion para que acepte varios dias.
      3. Rehacer sp_Proyeccion, que comparaba el dia libre con
         un igual y con una lista siempre daba que la persona
         trabajaba los siete dias.

   Todo con SQL de siempre, sin funciones nuevas. Es a
   proposito: los scripts de instalacion y actualizacion barren
   las restricciones de esta tabla y las vuelven a poner, y una
   restriccion que dependiera de una funcion se perderia en ese
   barrido sin que nadie se diera cuenta.

   Se puede correr varias veces.

   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   Si la base se llama distinto, cambie el USE de abajo.
   ============================================================ */

USE PlanillaVanguard;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '=== VARIOS DIAS LIBRES POR PERSONA ===';
GO


/* ------------------------------------------------------------
   1. LA COLUMNA

      De diez letras no cabe "Sabado,Domingo", que son catorce.
      Se ensancha a sesenta, que alcanza para los siete dias con
      sus comas.

      Ensanchar un NVARCHAR es cambio de rotulo: no reescribe
      ninguna fila ni pierde nada de lo guardado.
   ------------------------------------------------------------ */
IF COL_LENGTH('dbo.Oficiales', 'DiaLibre') < 120   /* 60 letras = 120 bytes */
BEGIN
    /* La restriccion se quita para poder tocar la columna; la
       nueva se pone mas abajo. */
    IF EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_Oficiales_DiaLibre'
                 AND parent_object_id = OBJECT_ID('dbo.Oficiales'))
        ALTER TABLE dbo.Oficiales DROP CONSTRAINT CK_Oficiales_DiaLibre;

    ALTER TABLE dbo.Oficiales ALTER COLUMN DiaLibre NVARCHAR(60) NOT NULL;

    PRINT '   Columna DiaLibre ensanchada a 60.';
END
ELSE PRINT '   La columna ya estaba ensanchada.';
GO


/* ------------------------------------------------------------
   2. LA RESTRICCION

      Antes: uno de ocho valores.
      Ahora: una lista de dias buenos separados por coma.

      Como se revisa sin funciones: se le van quitando al texto
      los nombres de dia que si valen, y despues las comas. Si
      queda algo, es que habia algo que no era un dia.

          "Sabado,Domingo"  ->  quita Domingo  ->  "Sabado,"
                            ->  quita Sabado   ->  ","
                            ->  quita comas    ->  ""      pasa

          "Lunesito"        ->  quita Lunes    ->  "ito"    no pasa

      Los nombres largos se quitan primero, o "Miercoles" se
      comeria la parte de otro.
   ------------------------------------------------------------ */
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = 'CK_Oficiales_DiaLibre'
             AND parent_object_id = OBJECT_ID('dbo.Oficiales'))
    ALTER TABLE dbo.Oficiales DROP CONSTRAINT CK_Oficiales_DiaLibre;
GO

ALTER TABLE dbo.Oficiales WITH CHECK
    ADD CONSTRAINT CK_Oficiales_DiaLibre CHECK
    (
        LEN(LTRIM(RTRIM(DiaLibre))) > 0
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                REPLACE(DiaLibre, N' ', N''),
                N'Miercoles', N''), N'Domingo', N''), N'Viernes', N''),
                N'Ninguno',   N''), N'Martes',  N''), N'Sabado',  N''),
                N'Jueves',    N''), N'Lunes',   N''), N',', N'') = N''
    );
GO

PRINT '   Restriccion CK_Oficiales_DiaLibre rehecha: ya acepta varios dias.';
GO


/* ------------------------------------------------------------
   3. LA PROYECCION

      sp_Proyeccion sacaba de la lista a quien libraba ese dia
      comparando con un igual. Contra "Sabado,Domingo" esa
      comparacion nunca da, asi que esa persona aparecia
      trabajando los siete dias: justo lo que hay que arreglar.

      Ahora se busca el dia rodeado de comas dentro de la lista
      tambien rodeada de comas. Asi "Domingo" no se confunde con
      nada y da igual en que orden esten escritos.

      Con un solo dia funciona igual que siempre.
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.sp_Proyeccion', 'P') IS NULL
    PRINT '   sp_Proyeccion no existe en esta base: no hay nada que rehacer.';
GO

IF OBJECT_ID('dbo.sp_Proyeccion', 'P') IS NOT NULL
BEGIN
    /* Es el mismo procedimiento de siempre, copiado tal cual del
       instalador, con una sola linea distinta: la del dia libre. */
    DECLARE @sql NVARCHAR(MAX) = N'
ALTER PROCEDURE dbo.sp_Proyeccion
    @Fecha DATE,
    @Turno NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Dia NVARCHAR(10) =
        CASE DATEPART(WEEKDAY, @Fecha)
            WHEN 1 THEN N''Domingo''  WHEN 2 THEN N''Lunes''
            WHEN 3 THEN N''Martes''   WHEN 4 THEN N''Miercoles''
            WHEN 5 THEN N''Jueves''   WHEN 6 THEN N''Viernes''
            ELSE N''Sabado'' END;

    /* El autorizado externo no entra en la proyeccion por turnos:
       no trabaja por horas. Aparece cuando hay que cubrir. */
    SELECT
        o.IdOficial,
        o.Nombre  AS Oficial,
        o.Cedula,
        o.Horario AS Turno,
        o.DiaLibre,
        CASE WHEN i.IdIncapacidad IS NOT NULL
             THEN N''Incapacidad'' ELSE N''Disponible'' END AS Situacion,
        i.FechaFin AS FinIncapacidad
    FROM dbo.Oficiales o
    LEFT JOIN dbo.Incapacidades i
           ON i.IdOficial = o.IdOficial
          AND @Fecha BETWEEN i.FechaInicio AND i.FechaFin
    WHERE o.Activo = 1
      AND CHARINDEX(N'','' + @Dia + N'','',
                    N'','' + REPLACE(o.DiaLibre, N'' '', N'''') + N'','') = 0
      AND o.Horario <> N''Autorizado Externo''
      AND (@Turno IS NULL OR o.Horario = @Turno)
    ORDER BY o.Horario, o.Nombre;
END';

    EXEC sp_executesql @sql;
    PRINT '   sp_Proyeccion rehecho: ya entiende varios dias libres.';
END
GO


/* ============================================================
   COMO QUEDO
   ============================================================ */
PRINT '';
PRINT '============================================================';
PRINT ' COMO QUEDO';
PRINT '============================================================';
GO

SELECT
    CASE WHEN COL_LENGTH('dbo.Oficiales','DiaLibre') >= 120
         THEN N'ya esta' ELSE N'FALTA' END AS Columna_Ensanchada,

    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE name = 'CK_Oficiales_DiaLibre'
                        AND parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%REPLACE%')
         THEN N'ya esta' ELSE N'FALTA' END AS Restriccion_De_Varios,

    CASE WHEN EXISTS (SELECT 1 FROM sys.sql_modules
                      WHERE object_id = OBJECT_ID('dbo.sp_Proyeccion')
                        AND definition LIKE N'%CHARINDEX%')
         THEN N'ya esta'
         WHEN OBJECT_ID('dbo.sp_Proyeccion','P') IS NULL
         THEN N'no aplica' ELSE N'FALTA' END AS Proyeccion_Al_Dia;
GO

/* Como quedo repartido el dia libre. Nada de esto cambio al
   correr el script: es lo que ya habia. */
SELECT REPLACE(DiaLibre, N',', N', ') AS [Dia libre], COUNT(*) AS [Cuantos]
FROM   dbo.Oficiales
GROUP  BY DiaLibre
ORDER  BY [Cuantos] DESC;
GO

PRINT '';
PRINT '=== LISTO. Ahora una persona puede librar varios dias. ===';
PRINT '    En Registrar y en Editar personal se marcan con casillas.';
GO
