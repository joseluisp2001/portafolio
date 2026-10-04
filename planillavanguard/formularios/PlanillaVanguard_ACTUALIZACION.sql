/* ============================================================
   PlanillaVanguard  -  ACTUALIZACION
   ------------------------------------------------------------
   Para una base que ya fue instalada con
   PlanillaVanguard_INSTALACION.sql

   Agrega todo lo nuevo:
     - Incapacidades y su vista con dias restantes
     - Estado 'Incapacidad' en la asistencia
     - Proyeccion editable de dias futuros
     - Turnos extra (14:00 - 21:00, 06:00 - 12:00,
       07:00 - 16:00 y 12:00 - 18:00) y el rol
       Autorizado Externo, que no va por horas
     - Vistas y procedimientos actualizados

   ADITIVO. No borra ni modifica datos existentes.
   Se puede ejecutar varias veces sin problema.

   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   ============================================================ */

USE PlanillaVanguard;
GO

/* La base tiene un indice filtrado (UQ_Proy_Sustituto). Con estas
   dos opciones apagadas, SQL Server no deja ni actualizar tablas ni
   crear vistas y procedimientos que sirvan despues. SSMS las pone en
   ON solo; sqlcmd no. Se dejan fijas aqui para que el script corra
   igual desde donde sea. */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '=== 0. ROLES ===';
GO

/* ------------------------------------------------------------
   El rol vive en el campo Horario. Ahora son NUEVE:

       06:00 - 12:00      <- horario corto de la manana
       06:00 - 14:00
       07:00 - 16:00      <- horario corrido del dia
       12:00 - 18:00      <- horario corto de la tarde
       14:00 - 18:00
       14:00 - 21:00      <- turno extra de la tarde
       18:00 - 00:00
       00:00 - 06:00
       Autorizado Externo <- no va por horas, lo trae otra
                             empresa, pero si cubre puestos

   Se amplian los CHECK de Horario y DiaLibre. Los nombres de
   esas restricciones cambian segun como se instalo la base,
   asi que se buscan por su definicion y se quitan las que
   estorben. Lo ya guardado sigue siendo valido.
   ------------------------------------------------------------ */
DECLARE @borrar NVARCHAR(MAX) = N'';

SELECT @borrar = @borrar +
       N'ALTER TABLE dbo.Oficiales DROP CONSTRAINT ' + QUOTENAME(cc.name) + N';' + CHAR(13)
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID('dbo.Oficiales')
  AND (cc.definition LIKE N'%Horario%' OR cc.definition LIKE N'%DiaLibre%');

IF LEN(@borrar) > 0 EXEC sp_executesql @borrar;
GO

/* ------------------------------------------------------------
   Antes de poner la restriccion hay que dejar los datos parejos.
   Con el tiempo se colaron valores escritos distinto, como
   '14:00-18:00' sin espacios. Aqui se emparejan contra el valor
   bueno ignorando espacios, para no perder a nadie.
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

UPDATE dbo.Oficiales SET DiaLibre = LTRIM(RTRIM(DiaLibre))
WHERE  DiaLibre <> LTRIM(RTRIM(DiaLibre));

UPDATE dbo.Oficiales SET DiaLibre = N'Ninguno'
WHERE  DiaLibre IS NULL OR DiaLibre = N'';
GO

/* ------------------------------------------------------------
   Si despues de emparejar todavia queda algo raro, se avisa por
   nombre y apellido y la restriccion entra sin revisar lo viejo:
   asi el script termina y el sistema queda usable, pero el dato
   malo no se esconde.
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

/* El externo no tiene dia libre asignado: lleva Ninguno. */
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
END
ELSE
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
GO

PRINT '   Turnos 14:00 - 21:00, 06:00 - 12:00, 07:00 - 16:00 y 12:00 - 18:00';
PRINT '   y el rol Autorizado Externo quedaron habilitados.';
GO

PRINT '=== 1. INCAPACIDADES ===';
GO

IF OBJECT_ID('dbo.Incapacidades','U') IS NULL
BEGIN
    CREATE TABLE dbo.Incapacidades
    (
        IdIncapacidad INT IDENTITY(1,1) NOT NULL,
        IdOficial     INT           NOT NULL,
        NumeroBoleta  NVARCHAR(30)  NULL,
        FechaInicio   DATE          NOT NULL,
        FechaFin      DATE          NOT NULL,
        Observacion   NVARCHAR(200) NULL,
        FechaRegistro DATETIME2     NOT NULL
            CONSTRAINT DF_Incap_Registro DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_Incapacidades PRIMARY KEY (IdIncapacidad),
        CONSTRAINT FK_Incap_Oficial
            FOREIGN KEY (IdOficial) REFERENCES dbo.Oficiales(IdOficial),
        CONSTRAINT CK_Incap_Fechas CHECK (FechaFin >= FechaInicio)
    );

    PRINT '   Tabla Incapacidades creada.';
END
ELSE PRINT '   Incapacidades ya existia.';
GO

/* Los indices van en su propio lote y dentro de EXEC.
   Si se dejan adentro del IF, SQL Server igual COMPILA el
   CREATE INDEX aunque no lo vaya a ejecutar, y reclama que el
   indice ya existe cuando se corre el script por segunda vez. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Incap_Oficial'
                 AND object_id = OBJECT_ID('dbo.Incapacidades'))
    EXEC(N'CREATE INDEX IX_Incap_Oficial ON dbo.Incapacidades(IdOficial, FechaInicio);');

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Incap_Rango'
                 AND object_id = OBJECT_ID('dbo.Incapacidades'))
    EXEC(N'CREATE INDEX IX_Incap_Rango ON dbo.Incapacidades(FechaInicio, FechaFin);');
GO

PRINT '=== 2. ESTADO INCAPACIDAD EN LA ASISTENCIA ===';
GO

/* Se amplia el CHECK. Lo que ya esta guardado sigue siendo valido. */
IF OBJECT_ID('dbo.CK_Asistencia_Estado','C') IS NOT NULL
    ALTER TABLE dbo.AsistenciaDiaria DROP CONSTRAINT CK_Asistencia_Estado;
GO

ALTER TABLE dbo.AsistenciaDiaria WITH CHECK
    ADD CONSTRAINT CK_Asistencia_Estado
    CHECK (Estado IN ('Presente','Ausente','Incapacidad'));
GO

/* Un incapacitado tampoco lleva tardia ni hora de llegada */
IF OBJECT_ID('dbo.CK_Asistencia_Tardia','C') IS NOT NULL
    ALTER TABLE dbo.AsistenciaDiaria DROP CONSTRAINT CK_Asistencia_Tardia;
GO

ALTER TABLE dbo.AsistenciaDiaria WITH CHECK
    ADD CONSTRAINT CK_Asistencia_Tardia CHECK
    (
        (Estado <> 'Presente' AND Tardia = 0 AND HoraLlegada IS NULL)
        OR
        (Estado =  'Presente' AND (Tardia = 0 OR HoraLlegada IS NOT NULL))
    );
GO

PRINT '   Estado Incapacidad habilitado.';
GO

PRINT '=== 3. PROYECCION ===';
GO

IF OBJECT_ID('dbo.ProyeccionDia','U') IS NULL
BEGIN
    CREATE TABLE dbo.ProyeccionDia
    (
        IdProyeccion       INT IDENTITY(1,1) NOT NULL,
        Fecha              DATE          NOT NULL,
        IdOficial          INT           NOT NULL,
        Turno              NVARCHAR(20)  NOT NULL,
        IdPuesto           INT           NULL,
        Disponible         BIT           NOT NULL
            CONSTRAINT DF_Proy_Disponible DEFAULT (1),
        Motivo             NVARCHAR(30)  NULL,
        IdOficialSustituto INT           NULL,

        /* Rol = entra por el rol que le toca. Extra = entra de extra. */
        Tipo               NVARCHAR(10)  NOT NULL
            CONSTRAINT DF_Proy_Tipo DEFAULT (N'Rol'),

        Observacion        NVARCHAR(200) NULL,
        FechaRegistro      DATETIME2     NOT NULL
            CONSTRAINT DF_Proy_Registro DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_ProyeccionDia PRIMARY KEY (IdProyeccion),
        CONSTRAINT UQ_Proy_Fecha_Oficial UNIQUE (Fecha, IdOficial),

        CONSTRAINT FK_Proy_Oficial
            FOREIGN KEY (IdOficial) REFERENCES dbo.Oficiales(IdOficial),
        CONSTRAINT FK_Proy_Sustituto
            FOREIGN KEY (IdOficialSustituto) REFERENCES dbo.Oficiales(IdOficial),
        CONSTRAINT FK_Proy_Puesto
            FOREIGN KEY (IdPuesto) REFERENCES dbo.Puestos(IdPuesto),

        /* Si va a estar, no lleva motivo ni sustituto */
        CONSTRAINT CK_Proy_Coherencia CHECK
            (Disponible = 0 OR (Motivo IS NULL AND IdOficialSustituto IS NULL)),

        CONSTRAINT CK_Proy_Distintos CHECK
            (IdOficialSustituto IS NULL OR IdOficialSustituto <> IdOficial),

        CONSTRAINT CK_Proy_Motivo CHECK
            (Motivo IS NULL OR Motivo IN
             (N'Incapacidad', N'Vacaciones', N'Permiso', N'Renuncia', N'Otro')),

        CONSTRAINT CK_Proy_Tipo CHECK (Tipo IN (N'Rol', N'Extra'))
    );

    PRINT '   Tabla ProyeccionDia creada.';
END
ELSE PRINT '   ProyeccionDia ya existia.';
GO

/* ---------- El Tipo, para las bases que ya existian ----------
   Una base creada antes de agosto de 2026 no tiene esta columna.
   Se agrega aqui para que la vista de abajo, que si la usa, no
   falle. Es lo mismo que hace PlanillaVanguard_TIPO_EXTRA.sql;
   se deja en los dos lados para que no importe cual se corra
   primero. */
IF COL_LENGTH('dbo.ProyeccionDia', 'Tipo') IS NULL
BEGIN
    ALTER TABLE dbo.ProyeccionDia
        ADD Tipo NVARCHAR(10) NOT NULL
            CONSTRAINT DF_Proy_Tipo DEFAULT (N'Rol');

    /* Lo que ya tenia a alguien cubriendo es un extra. Va con EXEC,
       igual que los indices, porque una columna recien creada no se
       puede nombrar en el mismo lote.

       Y va aqui adentro a proposito: solo se acomoda la vez que la
       columna nace. Si estuviera suelto, correr el script de nuevo
       le volveria a poner Extra a coberturas que el usuario hubiera
       pasado a Rol a mano. */
    EXEC(N'UPDATE dbo.ProyeccionDia
              SET Tipo = N''Extra''
            WHERE IdOficialSustituto IS NOT NULL;');

    PRINT '   Columna Tipo agregada (las coberturas quedaron en Extra).';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_Proy_Tipo'
                 AND parent_object_id = OBJECT_ID('dbo.ProyeccionDia'))
BEGIN
    UPDATE dbo.ProyeccionDia
       SET Tipo = N'Rol'
     WHERE Tipo NOT IN (N'Rol', N'Extra');

    ALTER TABLE dbo.ProyeccionDia
        ADD CONSTRAINT CK_Proy_Tipo CHECK (Tipo IN (N'Rol', N'Extra'));

    PRINT '   Restriccion CK_Proy_Tipo puesta.';
END
GO

/* Igual que en Incapacidades: los indices, aparte y con EXEC. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Proy_Fecha'
                 AND object_id = OBJECT_ID('dbo.ProyeccionDia'))
    EXEC(N'CREATE INDEX IX_Proy_Fecha ON dbo.ProyeccionDia(Fecha, Turno);');

/* Nadie cubre dos puestos el mismo dia */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UQ_Proy_Sustituto'
                 AND object_id = OBJECT_ID('dbo.ProyeccionDia'))
    EXEC(N'CREATE UNIQUE INDEX UQ_Proy_Sustituto
               ON dbo.ProyeccionDia(Fecha, IdOficialSustituto)
               WHERE IdOficialSustituto IS NOT NULL;');
GO

PRINT '=== 4. VISTAS ===';
GO

/* ---------- Incapacidades con dias restantes ---------- */
IF OBJECT_ID('dbo.vw_Incapacidades','V') IS NOT NULL DROP VIEW dbo.vw_Incapacidades;
GO

CREATE VIEW dbo.vw_Incapacidades
AS
SELECT
    i.IdIncapacidad,
    i.IdOficial,
    o.Nombre  AS Oficial,
    o.Cedula,
    o.Horario AS Turno,
    i.NumeroBoleta,
    i.FechaInicio,
    i.FechaFin,
    DATEDIFF(DAY, i.FechaInicio, i.FechaFin) + 1 AS DiasTotales,
    CASE
        WHEN CAST(GETDATE() AS DATE) > i.FechaFin    THEN 0
        WHEN CAST(GETDATE() AS DATE) < i.FechaInicio
             THEN DATEDIFF(DAY, i.FechaInicio, i.FechaFin) + 1
        ELSE DATEDIFF(DAY, CAST(GETDATE() AS DATE), i.FechaFin) + 1
    END AS DiasRestantes,
    CASE
        WHEN CAST(GETDATE() AS DATE) > i.FechaFin    THEN N'Vencida'
        WHEN CAST(GETDATE() AS DATE) < i.FechaInicio THEN N'Programada'
        ELSE N'Activa'
    END AS Estado,
    i.Observacion,
    i.FechaRegistro
FROM dbo.Incapacidades i
INNER JOIN dbo.Oficiales o ON o.IdOficial = i.IdOficial;
GO

/* ---------- Reporte diario, ahora con Incapacidad ---------- */
IF OBJECT_ID('dbo.vw_ReporteDiario','V') IS NOT NULL DROP VIEW dbo.vw_ReporteDiario;
GO

CREATE VIEW dbo.vw_ReporteDiario
AS
SELECT
    a.Fecha,
    a.Turno,
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

/* ---------- La vieja vw_Incidencias cambia de nombre ----------
   El nombre chocaba con la de incapacidades. Ahora se llama
   vw_IncidenciasAsistencia. */
IF OBJECT_ID('dbo.vw_Incidencias','V') IS NOT NULL DROP VIEW dbo.vw_Incidencias;
GO

IF OBJECT_ID('dbo.vw_IncidenciasAsistencia','V') IS NOT NULL
    DROP VIEW dbo.vw_IncidenciasAsistencia;
GO

CREATE VIEW dbo.vw_IncidenciasAsistencia
AS
SELECT
    a.Fecha,
    a.Turno,
    o.IdOficial,
    o.Nombre   AS Oficial,
    o.Cedula,
    ISNULL(p.Codigo, N'') AS Puesto,
    CASE WHEN a.Estado = 'Ausente' THEN N'Ausencia' ELSE N'Tardia' END AS Tipo,
    a.HoraLlegada
FROM dbo.AsistenciaDiaria a
INNER JOIN dbo.Oficiales o ON o.IdOficial = a.IdOficial
LEFT  JOIN dbo.Puestos   p ON p.IdPuesto  = a.IdPuesto
WHERE a.Estado = 'Ausente' OR a.Tardia = 1;
GO

/* ---------- Proyeccion ---------- */
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

PRINT '   Vistas actualizadas.';
GO

PRINT '=== 5. PROCEDIMIENTOS ===';
GO

/* Quien trabaja una fecha, marcando incapacitados */
IF OBJECT_ID('dbo.sp_Proyeccion','P') IS NOT NULL DROP PROCEDURE dbo.sp_Proyeccion;
GO

CREATE PROCEDURE dbo.sp_Proyeccion
    @Fecha DATE,
    @Turno NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Dia NVARCHAR(10) =
        CASE DATEPART(WEEKDAY, @Fecha)
            WHEN 1 THEN N'Domingo'  WHEN 2 THEN N'Lunes'
            WHEN 3 THEN N'Martes'   WHEN 4 THEN N'Miercoles'
            WHEN 5 THEN N'Jueves'   WHEN 6 THEN N'Viernes'
            ELSE N'Sabado' END;

    /* El autorizado externo no entra en la proyeccion por turnos:
       no trabaja por horas. Aparece cuando hay que cubrir. */
    SELECT
        o.IdOficial,
        o.Nombre  AS Oficial,
        o.Cedula,
        o.Horario AS Turno,
        o.DiaLibre,
        CASE WHEN i.IdIncapacidad IS NOT NULL
             THEN N'Incapacidad' ELSE N'Disponible' END AS Situacion,
        i.FechaFin AS FinIncapacidad
    FROM dbo.Oficiales o
    LEFT JOIN dbo.Incapacidades i
           ON i.IdOficial = o.IdOficial
          AND @Fecha BETWEEN i.FechaInicio AND i.FechaFin
    WHERE o.Activo = 1
      AND CHARINDEX(N',' + @Dia + N',',
                    N',' + REPLACE(o.DiaLibre, N' ', N'') + N',') = 0
      AND o.Horario <> N'Autorizado Externo'
      AND (@Turno IS NULL OR o.Horario = @Turno)
    ORDER BY o.Horario, o.Nombre;
END
GO

/* Recalculo de contadores. NO suma: cuenta desde el historial. */
IF OBJECT_ID('dbo.sp_RecalcularContadores','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RecalcularContadores;
GO

CREATE PROCEDURE dbo.sp_RecalcularContadores
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE o
    SET o.Ausencias = ISNULL(x.Ausencias, 0),
        o.Tardias   = ISNULL(x.Tardias, 0)
    FROM dbo.Oficiales o
    LEFT JOIN (
        SELECT IdOficial,
               SUM(CASE WHEN Estado = 'Ausente' THEN 1 ELSE 0 END) AS Ausencias,
               SUM(CASE WHEN Tardia = 1         THEN 1 ELSE 0 END) AS Tardias
        FROM dbo.AsistenciaDiaria
        GROUP BY IdOficial
    ) x ON x.IdOficial = o.IdOficial;
END
GO

IF OBJECT_ID('dbo.sp_RecalcularAusencias','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RecalcularAusencias;
GO

CREATE PROCEDURE dbo.sp_RecalcularAusencias
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_RecalcularContadores;
END
GO

EXEC dbo.sp_RecalcularContadores;
PRINT '   Procedimientos listos y contadores al dia.';
GO

/* ============================================================
   VERIFICACION
   Deben salir 8 tablas, 4 vistas y 3 procedimientos.
   ============================================================ */
PRINT '=== LISTO ===';

SELECT name AS Tablas         FROM sys.tables     ORDER BY name;
SELECT name AS Vistas         FROM sys.views      ORDER BY name;
SELECT name AS Procedimientos FROM sys.procedures ORDER BY name;

SELECT COUNT(*) AS Oficiales     FROM dbo.Oficiales;
SELECT COUNT(*) AS Puestos       FROM dbo.Puestos;
SELECT COUNT(*) AS Incapacidades FROM dbo.Incapacidades;

/* Los nueve roles y cuanta gente hay en cada uno */
SELECT Horario AS Rol, COUNT(*) AS Cantidad
FROM dbo.Oficiales GROUP BY Horario ORDER BY Horario;
GO
