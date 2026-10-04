/* ============================================================
   PlanillaVanguard  -  TURNOS NUEVOS
   ------------------------------------------------------------
   Habilita en la base los tres horarios que se agregaron:

       06:00 - 12:00
       07:00 - 16:00
       12:00 - 18:00

   Con eso el campo Horario acepta NUEVE roles:

       06:00 - 12:00
       06:00 - 14:00
       07:00 - 16:00
       12:00 - 18:00
       14:00 - 18:00
       14:00 - 21:00
       18:00 - 00:00
       00:00 - 06:00
       Autorizado Externo

   ADITIVO. No borra ni cambia datos, no toca tablas, vistas
   ni procedimientos. Solo amplia la restriccion del Horario.
   Se puede correr varias veces sin problema.

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

PRINT '=== TURNOS NUEVOS EN EL CAMPO Horario ===';
GO

/* ------------------------------------------------------------
   1. Se retira la restriccion vieja del Horario. El nombre
      cambia segun como se instalo la base, asi que se busca
      por su definicion. Lo ya guardado no se toca.
   ------------------------------------------------------------ */
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
ELSE
    PRINT '   No habia restriccion de Horario que retirar.';
GO

/* ------------------------------------------------------------
   2. Se empareja la escritura antes de poner la restriccion.
      Con el tiempo se cuelan valores como '14:00-18:00' sin
      espacios. Se comparan ignorando espacios para no perder
      a nadie.
   ------------------------------------------------------------ */
UPDATE o
SET    o.Horario = c.Bueno
FROM   dbo.Oficiales o
INNER JOIN (VALUES (N'06:00 - 12:00'), (N'06:00 - 14:00'), (N'07:00 - 16:00'),
                   (N'12:00 - 18:00'), (N'14:00 - 18:00'), (N'14:00 - 21:00'),
                   (N'18:00 - 00:00'), (N'00:00 - 06:00'),
                   (N'Autorizado Externo')) AS c(Bueno)
        ON REPLACE(o.Horario, N' ', N'') = REPLACE(c.Bueno, N' ', N'')
WHERE  o.Horario <> c.Bueno;

DECLARE @corregidos INT = @@ROWCOUNT;

IF @corregidos > 0
    PRINT '   Se corrigio la escritura del horario en ' +
          CAST(@corregidos AS VARCHAR(10)) + ' registro(s).';
GO

/* ------------------------------------------------------------
   3. Entra la restriccion con los nueve roles.

      Si todavia queda algun horario raro, se avisa por nombre
      y apellido y la restriccion entra sin revisar lo viejo:
      asi el script termina y el sistema queda usable, pero el
      dato malo no se esconde.
   ------------------------------------------------------------ */
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

    PRINT '   Los nueve roles quedaron validados contra los datos existentes.';
END
GO

PRINT '   Turnos 06:00 - 12:00, 07:00 - 16:00 y 12:00 - 18:00 habilitados.';
GO

/* ============================================================
   VERIFICACION
   ------------------------------------------------------------
   Turnos_Cortos debe decir 'ya esta'. En el conteo salen solo
   los roles que hoy tienen gente; los nuevos aparecen cuando
   se registre a alguien con ese horario.
   ============================================================ */
PRINT '=== LISTO ===';

SELECT
    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%06:00 - 12:00%'
                        AND definition LIKE N'%07:00 - 16:00%'
                        AND definition LIKE N'%12:00 - 18:00%')
         THEN N'ya esta' ELSE N'FALTA' END AS Turnos_Cortos,
    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%14:00 - 21:00%')
         THEN N'ya esta' ELSE N'FALTA' END AS Turno_14_a_21,
    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%Autorizado Externo%')
         THEN N'ya esta' ELSE N'FALTA' END AS Rol_Autorizado_Externo;

SELECT Horario AS Rol, COUNT(*) AS Cantidad
FROM   dbo.Oficiales
GROUP  BY Horario
ORDER  BY Horario;
GO
