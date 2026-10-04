/* ============================================================
   PlanillaVanguard  -  ROL / VACANTE / EXTRA
   ------------------------------------------------------------
   Este es el UNICO script que hay que correrle a una base ya
   instalada para dejarla pareja con el programa. Reemplaza a
   PlanillaVanguard_PONER_AL_DIA.sql y a
   PlanillaVanguard_TIPO_EXTRA.sql: hace lo de esos dos y ademas
   agrega la marca de jornada en la lista de asistencia.

   Lo que hace, punto por punto:

     1. Los nueve roles en el campo Horario.
     2. Que un oficial pueda cubrir varios puestos el mismo dia.
     3. La columna Orden en los puestos.
     4. La casilla Tipo en la PROYECCION, ahora con TRES valores.
     5. La casilla Tipo en la ASISTENCIA (pasar lista), con los
        mismos tres valores.
     6. Las vistas rehechas para que los reportes traigan el Tipo.

   Los tres valores del Tipo son:

       Rol       entra por el rol que le toca ese dia
       Vacante   entra a una plaza que no tiene titular
       Extra     entra de extra, cubriendo a alguien que falto

   ADITIVO. No borra datos, no toca la asistencia ya registrada
   y se puede correr las veces que sea: los pasos que ya estan
   hechos se saltan solos.

   LO QUE NO HACE: cambiar el cuadro de puestos. Eso sigue siendo
   PlanillaVanguard_PUESTOS.sql, que si toca los datos de los
   puestos y hay que revisarlo antes de correrlo.

   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   Si la base se llama distinto, cambie el USE de abajo.

   Al final sale un cuadro que dice, punto por punto, si quedo
   'ya esta' o 'FALTA'. Tienen que estar todas en 'ya esta'.
   ============================================================ */

USE PlanillaVanguard;
GO

/* La base tiene indices filtrados. Con estas dos opciones
   apagadas, SQL Server no deja ni actualizar tablas ni crear
   vistas que sirvan despues. SSMS las pone en ON solo; sqlcmd
   no. Se dejan fijas aqui para que el script corra igual desde
   donde sea. */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ------------------------------------------------------------
   Antes de tocar nada: que esta si sea la base del sistema.
   Si el USE de arriba apunto a otro lado, el script se detiene
   sin haber hecho nada.
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Oficiales','U')        IS NULL
OR OBJECT_ID('dbo.AsistenciaDiaria','U') IS NULL
OR OBJECT_ID('dbo.ProyeccionDia','U')    IS NULL
BEGIN
    RAISERROR('Esta no es la base de PlanillaVanguard: faltan las tablas del sistema. Revise el USE del principio del archivo.', 16, 1);
    SET NOEXEC ON;
END
GO

PRINT '';
PRINT '============================================================';
PRINT ' PONIENDO LA BASE AL DIA';
PRINT '============================================================';
GO


/* ============================================================
   1. LOS NUEVE ROLES
   ------------------------------------------------------------
   El rol vive en el campo Horario:

       06:00 - 12:00      corto de la manana
       06:00 - 14:00
       07:00 - 16:00      corrido del dia
       12:00 - 18:00      corto de la tarde
       14:00 - 18:00
       14:00 - 21:00      extra de la tarde
       18:00 - 00:00
       00:00 - 06:00
       Autorizado Externo no va por horas, lo trae otra empresa,
                          pero si cubre puestos
   ============================================================ */
PRINT '';
PRINT '=== 1. LOS NUEVE ROLES ===';
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
             AND definition LIKE N'%06:00 - 12:00%'
             AND definition LIKE N'%07:00 - 16:00%'
             AND definition LIKE N'%12:00 - 18:00%'
             AND definition LIKE N'%14:00 - 21:00%'
             AND definition LIKE N'%Autorizado Externo%')
    PRINT '   Los nueve roles ya estaban habilitados.';
ELSE
BEGIN
    /* La restriccion vieja cambia de nombre segun como se
       instalo la base, asi que se busca por su definicion. */
    DECLARE @borrar NVARCHAR(MAX) = N'';

    SELECT @borrar = @borrar +
           N'ALTER TABLE dbo.Oficiales DROP CONSTRAINT ' + QUOTENAME(cc.name) + N';'
    FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID('dbo.Oficiales')
      AND cc.definition LIKE N'%Horario%';

    IF LEN(@borrar) > 0 EXEC sp_executesql @borrar;

    /* Con el tiempo se cuelan valores escritos distinto, como
       '14:00-18:00' sin espacios. Se emparejan comparando sin
       espacios, para no perder a nadie cuando entre la
       restriccion. */
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

    /* Si todavia queda algo raro se avisa por nombre y apellido
       y la restriccion entra sin revisar lo viejo: asi el script
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

        PRINT '   Los nueve roles quedaron validados contra los datos existentes.';
    END
END
GO

/* El externo no tiene dia libre asignado: lleva Ninguno. */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
                 AND definition LIKE N'%DiaLibre%'
                 AND definition LIKE N'%Ninguno%')
BEGIN
    DECLARE @dl NVARCHAR(MAX) = N'';

    SELECT @dl = @dl +
           N'ALTER TABLE dbo.Oficiales DROP CONSTRAINT ' + QUOTENAME(cc.name) + N';'
    FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID('dbo.Oficiales')
      AND cc.definition LIKE N'%DiaLibre%';

    IF LEN(@dl) > 0 EXEC sp_executesql @dl;

    UPDATE dbo.Oficiales SET DiaLibre = LTRIM(RTRIM(DiaLibre))
    WHERE  DiaLibre <> LTRIM(RTRIM(DiaLibre));

    UPDATE dbo.Oficiales SET DiaLibre = N'Ninguno'
    WHERE  DiaLibre IS NULL OR DiaLibre = N'';

    /* Igual que con el horario: si lo guardado esta limpio, la
       restriccion entra revisada (WITH CHECK) y queda confiable.
       Solo si quedo algun dia raro se pone sin revisar, para que
       el script termine y el sistema quede usable, pero avisando
       cual es el dato malo. */
    IF EXISTS (SELECT 1 FROM dbo.Oficiales
               WHERE DiaLibre NOT IN (N'Lunes', N'Martes', N'Miercoles', N'Jueves',
                                      N'Viernes', N'Sabado', N'Domingo', N'Ninguno'))
    BEGIN
        PRINT '   ATENCION: hay oficiales con un dia libre que no se reconoce.';

        SELECT IdOficial, Nombre, Cedula, DiaLibre AS DiaLibreInvalido
        FROM   dbo.Oficiales
        WHERE  DiaLibre NOT IN (N'Lunes', N'Martes', N'Miercoles', N'Jueves',
                                N'Viernes', N'Sabado', N'Domingo', N'Ninguno');

        ALTER TABLE dbo.Oficiales WITH NOCHECK
            ADD CONSTRAINT CK_Oficiales_DiaLibre CHECK
            (
                /* Uno, varios separados por coma, o Ninguno */
                LEN(LTRIM(RTRIM(DiaLibre))) > 0
                AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        REPLACE(DiaLibre, N' ', N''),
                        N'Miercoles', N''), N'Domingo', N''), N'Viernes', N''),
                        N'Ninguno',   N''), N'Martes',  N''), N'Sabado',  N''),
                        N'Jueves',    N''), N'Lunes',   N''), N',', N'') = N''
            );

        PRINT '   Restriccion puesta (sin revisar lo viejo).';
    END
    ELSE
    BEGIN
        ALTER TABLE dbo.Oficiales WITH CHECK
            ADD CONSTRAINT CK_Oficiales_DiaLibre CHECK
            (
                /* Uno, varios separados por coma, o Ninguno */
                LEN(LTRIM(RTRIM(DiaLibre))) > 0
                AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        REPLACE(DiaLibre, N' ', N''),
                        N'Miercoles', N''), N'Domingo', N''), N'Viernes', N''),
                        N'Ninguno',   N''), N'Martes',  N''), N'Sabado',  N''),
                        N'Jueves',    N''), N'Lunes',   N''), N',', N'') = N''
            );

        PRINT '   Dia libre: se habilito Ninguno, para el autorizado externo.';
    END
END
ELSE PRINT '   El dia libre Ninguno ya estaba habilitado.';
GO


/* ============================================================
   2. UN OFICIAL PUEDE CUBRIR VARIOS PUESTOS EL MISMO DIA
   ------------------------------------------------------------
   Habia un indice unico filtrado sobre
   (Fecha, IdOficialSustituto) que lo impedia. Con los extras
   eso pasa todos los dias, asi que sale.

   Lo que SI se mantiene: UQ_Proy_Fecha_Oficial, que evita que
   un oficial aparezca dos veces en el plan del mismo dia, y
   cualquier unico sobre (Fecha, IdPuesto), porque un puesto si
   deberia tener un solo sustituto.
   ============================================================ */
PRINT '';
PRINT '=== 2. EXTRAS: UN OFICIAL, VARIOS PUESTOS ===';
GO

DECLARE @extras NVARCHAR(MAX) = N'';

SELECT @extras = @extras +
       CASE WHEN i.is_unique_constraint = 1
            THEN N'ALTER TABLE dbo.ProyeccionDia DROP CONSTRAINT ' + QUOTENAME(i.name) + N';'
            ELSE N'DROP INDEX ' + QUOTENAME(i.name) + N' ON dbo.ProyeccionDia;'
       END
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

DECLARE @extras2 NVARCHAR(MAX) = N'';

SELECT @extras2 = @extras2 +
       CASE WHEN i.is_unique_constraint = 1
            THEN N'ALTER TABLE dbo.Sustituciones DROP CONSTRAINT ' + QUOTENAME(i.name) + N';'
            ELSE N'DROP INDEX ' + QUOTENAME(i.name) + N' ON dbo.Sustituciones;'
       END
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
   3. EL ORDEN DE LOS PUESTOS
   ------------------------------------------------------------
   Sin esta columna la lista sale por codigo interno y CH 10
   aparece antes que CH 2. Aqui solo se crea la columna; los
   numeros de orden los pone PlanillaVanguard_PUESTOS.sql.
   ============================================================ */
PRINT '';
PRINT '=== 3. ORDEN DE LOS PUESTOS ===';
GO

IF COL_LENGTH('dbo.Puestos', 'Orden') IS NULL
BEGIN
    ALTER TABLE dbo.Puestos ADD Orden INT NULL;
    PRINT '   Columna Orden agregada (vacia). Corra PlanillaVanguard_PUESTOS.sql';
    PRINT '   para numerarla en el orden en que se recorre la base.';
END
ELSE PRINT '   La columna Orden ya existia.';
GO


/* ============================================================
   4. TIPO EN LA PROYECCION: ROL / VACANTE / EXTRA
   ============================================================ */
PRINT '';
PRINT '=== 4. TIPO EN LA PROYECCION ===';
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
       coberturas que usted hubiera pasado a Rol o a Vacante
       a mano. */
    EXEC(N'UPDATE dbo.ProyeccionDia
              SET Tipo = N''Extra''
            WHERE IdOficialSustituto IS NOT NULL;');

    PRINT '   Columna Tipo agregada. Las coberturas que ya estaban guardadas';
    PRINT '   quedaron como Extra; todo lo demas en Rol.';
END
ELSE PRINT '   La columna Tipo ya existia: no se toca lo guardado.';
GO

/* La restriccion. Ojo: una base a la que se le corrio el script
   viejo tiene CK_Proy_Tipo con solo dos valores, y con esa
   puesta el programa no podria guardar Vacante. Por eso, si la
   que hay no menciona Vacante, se cambia. */
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = 'CK_Proy_Tipo'
             AND parent_object_id = OBJECT_ID('dbo.ProyeccionDia')
             AND definition NOT LIKE N'%Vacante%')
BEGIN
    ALTER TABLE dbo.ProyeccionDia DROP CONSTRAINT CK_Proy_Tipo;
    PRINT '   La restriccion anterior solo aceptaba Rol y Extra: se retiro.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_Proy_Tipo'
                 AND parent_object_id = OBJECT_ID('dbo.ProyeccionDia'))
BEGIN
    /* Por si quedo algo raro de una corrida a medias */
    UPDATE dbo.ProyeccionDia
       SET Tipo = N'Rol'
     WHERE Tipo NOT IN (N'Rol', N'Vacante', N'Extra');

    ALTER TABLE dbo.ProyeccionDia
        ADD CONSTRAINT CK_Proy_Tipo
        CHECK (Tipo IN (N'Rol', N'Vacante', N'Extra'));

    PRINT '   Restriccion CK_Proy_Tipo puesta con los tres valores.';
END
ELSE PRINT '   CK_Proy_Tipo ya aceptaba los tres valores.';
GO


/* ============================================================
   5. TIPO EN LA ASISTENCIA: ROL / VACANTE / EXTRA
   ------------------------------------------------------------
   Esto es lo nuevo. Hasta ahora, al pasar lista solo se decia
   si el oficial llego, si llego tarde y en que puesto quedo.
   Faltaba lo que en el cuaderno se anota al lado del nombre:
   con que se le paga ese dia.

       Rol       entra por el rol que le toca
       Vacante   entra a una plaza sin titular
       Extra     entra de extra, cubriendo a alguien

   NO se rellena nada hacia atras. Los dias que ya estaban
   pasados quedan todos en Rol, que es lo unico que se puede
   afirmar: en esos dias esa marca no se pidio, y ponerle
   Extra o Vacante por adivinanza seria inventar un dato de
   planilla. Los dias viejos que hagan falta se corrigen a mano
   desde la pantalla de asistencia.
   ============================================================ */
PRINT '';
PRINT '=== 5. TIPO EN LA ASISTENCIA (PASAR LISTA) ===';
GO

IF COL_LENGTH('dbo.AsistenciaDiaria', 'Tipo') IS NULL
BEGIN
    ALTER TABLE dbo.AsistenciaDiaria
        ADD Tipo NVARCHAR(10) NOT NULL
            CONSTRAINT DF_Asistencia_Tipo DEFAULT (N'Rol');

    PRINT '   Columna Tipo agregada. Lo ya registrado quedo en Rol.';
END
ELSE PRINT '   La columna Tipo ya existia: no se toca lo registrado.';
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = 'CK_Asistencia_Tipo'
             AND parent_object_id = OBJECT_ID('dbo.AsistenciaDiaria')
             AND definition NOT LIKE N'%Vacante%')
BEGIN
    ALTER TABLE dbo.AsistenciaDiaria DROP CONSTRAINT CK_Asistencia_Tipo;
    PRINT '   La restriccion anterior no aceptaba Vacante: se retiro.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_Asistencia_Tipo'
                 AND parent_object_id = OBJECT_ID('dbo.AsistenciaDiaria'))
BEGIN
    UPDATE dbo.AsistenciaDiaria
       SET Tipo = N'Rol'
     WHERE Tipo NOT IN (N'Rol', N'Vacante', N'Extra');

    ALTER TABLE dbo.AsistenciaDiaria
        ADD CONSTRAINT CK_Asistencia_Tipo
        CHECK (Tipo IN (N'Rol', N'Vacante', N'Extra'));

    PRINT '   Restriccion CK_Asistencia_Tipo puesta con los tres valores.';
END
ELSE PRINT '   CK_Asistencia_Tipo ya aceptaba los tres valores.';
GO

/* A proposito no se le pone indice al Tipo: todo lo que el
   programa consulta va filtrado por Fecha, y para eso ya esta
   IX_Asistencia_Fecha. Un indice de mas en la tabla que mas se
   escribe solo hace lento el guardar el turno. */


/* ============================================================
   6. LAS VISTAS, CON EL TIPO ADENTRO
   ------------------------------------------------------------
   Son las mismas de siempre con una columna mas. Se rehacen
   completas porque una vista no se puede ampliar por pedazos.
   ============================================================ */
PRINT '';
PRINT '=== 6. VISTAS ===';
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

PRINT '   vw_ProyeccionDia rehecha con la columna Tipo.';
GO

IF OBJECT_ID('dbo.vw_ReporteDiario','V') IS NOT NULL DROP VIEW dbo.vw_ReporteDiario;
GO

CREATE VIEW dbo.vw_ReporteDiario
AS
SELECT
    a.Fecha,
    a.Turno,
    a.Tipo,
    p.Codigo   AS Puesto,
    p.Ubicacion,
    o.Nombre   AS Oficial,
    o.Cedula,
    o.Horario  AS RolOficial,
    a.Estado,
    a.Tardia,
    a.HoraLlegada,
    CASE WHEN a.Estado = 'Ausente'     THEN N'Ausente'
         WHEN a.Estado = 'Incapacidad' THEN N'Incapacidad'
         WHEN a.Tardia = 1             THEN N'Tardia'
         ELSE N'Presente' END AS EstadoDetalle,
    sus.Nombre AS Sustituto,
    sus.Cedula AS CedulaSustituto,
    ISNULL(sus.Horario, N'') AS RolSustituto,
    a.Observacion
FROM dbo.AsistenciaDiaria a
INNER JOIN dbo.Oficiales o     ON o.IdOficial = a.IdOficial
LEFT  JOIN dbo.Puestos   p     ON p.IdPuesto  = a.IdPuesto
LEFT  JOIN dbo.Sustituciones s ON s.Fecha = a.Fecha
                              AND s.IdOficialAusente = a.IdOficial
LEFT  JOIN dbo.Oficiales sus   ON sus.IdOficial = s.IdOficialSustituto;
GO

PRINT '   vw_ReporteDiario rehecha con la columna Tipo.';
GO


/* ============================================================
   COMO QUEDO
   ------------------------------------------------------------
   Las siete comprobaciones tienen que decir 'ya esta'.
   ============================================================ */
PRINT '';
PRINT '============================================================';
PRINT ' COMO QUEDO';
PRINT '============================================================';
GO

SELECT
    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%07:00 - 16:00%'
                        AND definition LIKE N'%Autorizado Externo%')
         THEN N'ya esta' ELSE N'FALTA' END AS Los_Nueve_Roles,

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

    CASE WHEN COL_LENGTH('dbo.Puestos','Orden') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Orden_De_Puestos,

    CASE WHEN COL_LENGTH('dbo.ProyeccionDia','Tipo') IS NOT NULL
     AND EXISTS (SELECT 1 FROM sys.check_constraints
                 WHERE name = 'CK_Proy_Tipo'
                   AND parent_object_id = OBJECT_ID('dbo.ProyeccionDia')
                   AND definition LIKE N'%Vacante%')
         THEN N'ya esta' ELSE N'FALTA' END AS Tipo_En_Proyeccion,

    CASE WHEN COL_LENGTH('dbo.AsistenciaDiaria','Tipo') IS NOT NULL
     AND EXISTS (SELECT 1 FROM sys.check_constraints
                 WHERE name = 'CK_Asistencia_Tipo'
                   AND parent_object_id = OBJECT_ID('dbo.AsistenciaDiaria')
                   AND definition LIKE N'%Vacante%')
         THEN N'ya esta' ELSE N'FALTA' END AS Tipo_En_Asistencia,

    CASE WHEN COL_LENGTH('dbo.vw_ProyeccionDia','Tipo') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Tipo_En_Vista_Proyeccion,

    CASE WHEN COL_LENGTH('dbo.vw_ReporteDiario','Tipo') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Tipo_En_Vista_Reporte;
GO

/* Nada de esto se perdio: los conteos de abajo son los mismos
   de antes de correr el script. */
SELECT
    (SELECT COUNT(*) FROM dbo.Oficiales)        AS Oficiales,
    (SELECT COUNT(*) FROM dbo.Puestos)          AS Puestos,
    (SELECT COUNT(*) FROM dbo.AsistenciaDiaria) AS Asistencia,
    (SELECT COUNT(*) FROM dbo.Sustituciones)    AS Sustituciones,
    (SELECT COUNT(*) FROM dbo.ProyeccionDia)    AS Proyeccion,
    (SELECT COUNT(*) FROM dbo.Incapacidades)    AS Incapacidades;
GO

/* Como quedo repartido el Tipo */
SELECT N'Proyeccion' AS Donde, Tipo, COUNT(*) AS Lineas
FROM   dbo.ProyeccionDia GROUP BY Tipo
UNION ALL
SELECT N'Asistencia', Tipo, COUNT(*)
FROM   dbo.AsistenciaDiaria GROUP BY Tipo
ORDER  BY Donde, Tipo;
GO

PRINT '';
PRINT '=== LISTO. Cierre y vuelva a abrir el programa. ===';
GO

SET NOEXEC OFF;
GO
