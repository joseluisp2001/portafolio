/* ============================================================
   PlanillaVanguard  -  INSTALACION DESDE CERO
   ------------------------------------------------------------
   Para un cliente NUEVO, en una computadora donde el sistema
   nunca se ha instalado. Crea la base completa y lista para
   usar: las tablas, las reglas, las vistas y los procedimientos.

   Si la base YA existe, este script no hace nada y avisa. Para
   una base que ya esta funcionando el archivo correcto es
   PlanillaVanguard_ROL_VACANTE_EXTRA.sql, que la pone al dia
   sin borrar nada.

   ------------------------------------------------------------
   ANTES DE CORRERLO, LEA ESTO
   ------------------------------------------------------------

   1. LOS PUESTOS. Vaya al PASO 6, hasta abajo, y escriba los
      puestos de ESTE cliente. Vienen tres de ejemplo que hay
      que reemplazar.

      Esto es obligatorio: el programa no tiene pantalla para
      crear puestos, salen de aqui. Sin puestos, al pasar lista
      no se le puede asignar puesto a nadie.

   2. EL NOMBRE DE LA BASE. Tiene que llamarse PlanillaVanguard.
      El programa la busca por ese nombre. Si por alguna razon
      necesita otro, cambielo en los tres USE de abajo y ademas
      cree en esa computadora la variable de entorno
      PLANILLA_CONEXION con la cadena de conexion completa.

   3. QUIEN VA A USARLO. Si el programa se va a abrir con un
      usuario de Windows distinto al que esta corriendo este
      script, vea el PASO 8 al final.

   ------------------------------------------------------------
   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   Al final sale un cuadro de comprobaciones: todas tienen que
   decir 'ya esta'.
   ============================================================ */

USE master;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '';
PRINT '============================================================';
PRINT ' INSTALANDO PlanillaVanguard';
PRINT '============================================================';
GO


/* ============================================================
   1. LA BASE
   ------------------------------------------------------------
   Si ya existe, el script se detiene aqui sin tocar nada. Eso
   es a proposito: correr una instalacion encima de una base con
   datos borraria el trabajo de meses.
   ============================================================ */
PRINT '';
PRINT '=== 1. LA BASE ===';
GO

IF DB_ID('PlanillaVanguard') IS NOT NULL
BEGIN
    PRINT '';
    PRINT '   *** LA BASE PlanillaVanguard YA EXISTE. NO SE TOCO NADA. ***';
    PRINT '';
    PRINT '   Si es una instalacion vieja que quiere poner al dia, corra';
    PRINT '   PlanillaVanguard_ROL_VACANTE_EXTRA.sql, que es aditivo.';
    PRINT '';
    PRINT '   Si de verdad quiere empezar de cero, primero saque un';
    PRINT '   respaldo y borre la base a mano. Este script no borra';
    PRINT '   bases: es la unica forma de no perder datos por un';
    PRINT '   descuido.';

    RAISERROR('La base ya existe. Instalacion cancelada.', 16, 1);
    SET NOEXEC ON;
END
GO

/* Modern_Spanish_CI_AS: sin distinguir mayusculas ni acentos, que
   es como se comparan los nombres y las cedulas en el sistema.
   Es la misma con la que trabajan las instalaciones anteriores;
   cambiarla haria que dos bases del mismo programa ordenaran y
   compararan distinto. */
CREATE DATABASE PlanillaVanguard
    COLLATE Modern_Spanish_CI_AS;
GO

/* SIMPLE: la base se respalda con el archivo .bak de todas las
   noches (vea la carpeta Mantenimiento), no con la cadena de
   registros. Con FULL el archivo de registro crece sin parar
   hasta llenar el disco, que es la falla mas comun en estas
   instalaciones. */
ALTER DATABASE PlanillaVanguard SET RECOVERY SIMPLE;
GO

PRINT '   Base PlanillaVanguard creada.';
GO

USE PlanillaVanguard;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


/* ============================================================
   2. LAS TABLAS
   ------------------------------------------------------------
   Van en orden: primero las que no dependen de nadie
   (Oficiales y Puestos) y despues las que las apuntan.
   ============================================================ */
PRINT '';
PRINT '=== 2. TABLAS ===';
GO

/* ------------------------------------------------------------
   El personal.

   El ROL vive en el campo Horario. Son nueve: los ocho turnos
   de horas y el Autorizado Externo, que no va por horas porque
   lo trae otra empresa, pero si puede cubrir puestos.

   El dia libre lleva Ninguno cuando no tiene uno fijo, que es
   el caso del externo.
   ------------------------------------------------------------ */
CREATE TABLE dbo.Oficiales
(
    IdOficial            INT IDENTITY(1,1) NOT NULL,
    Nombre               NVARCHAR(120) NOT NULL,
    Cedula               NVARCHAR(20)  NOT NULL,
    Telefono             NVARCHAR(15)  NULL,
    Horario              NVARCHAR(20)  NOT NULL,
    DiaLibre             NVARCHAR(60)  NOT NULL,
    VencimientoPortacion DATE          NOT NULL,
    FechaIngreso         DATE          NOT NULL,
    Autorizado           NVARCHAR(15)  NOT NULL,

    /* Los mueve el modulo de asistencia. No se suman a mano:
       sp_RecalcularContadores los vuelve a contar del historial. */
    Tardias              INT NOT NULL CONSTRAINT DF_Oficiales_Tardias    DEFAULT (0),
    Ausencias            INT NOT NULL CONSTRAINT DF_Oficiales_Ausencias  DEFAULT (0),
    Vacaciones           INT NOT NULL CONSTRAINT DF_Oficiales_Vacaciones DEFAULT (0),

    /* El chaleco se puede repetir: uno pasa de un oficial a otro
       y en el traslape los dos lo tienen anotado. */
    CodigoChaleco        NVARCHAR(30) NULL,

    /* Al que se va no se le borra: se apaga, para que su
       historial siga cuadrando. */
    Activo               BIT NOT NULL CONSTRAINT DF_Oficiales_Activo DEFAULT (1),

    FechaRegistro        DATETIME2 NOT NULL
                         CONSTRAINT DF_Oficiales_FechaReg DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Oficiales      PRIMARY KEY (IdOficial),
    CONSTRAINT UQ_Oficiales_Cedula UNIQUE (Cedula),

    CONSTRAINT CK_Oficiales_Horario CHECK
    (
        Horario IN (N'06:00 - 12:00', N'06:00 - 14:00', N'07:00 - 16:00',
                    N'12:00 - 18:00', N'14:00 - 18:00', N'14:00 - 21:00',
                    N'18:00 - 00:00', N'00:00 - 06:00', N'Autorizado Externo')
    ),

    CONSTRAINT CK_Oficiales_DiaLibre CHECK
    (
        /* Uno, varios separados por coma, o Ninguno. Se revisa
           quitandole al texto los dias que si valen y despues las
           comas: si queda algo, habia algo que no era un dia. Los
           nombres largos se quitan primero. */
        LEN(LTRIM(RTRIM(DiaLibre))) > 0
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                REPLACE(DiaLibre, N' ', N''),
                N'Miercoles', N''), N'Domingo', N''), N'Viernes', N''),
                N'Ninguno',   N''), N'Martes',  N''), N'Sabado',  N''),
                N'Jueves',    N''), N'Lunes',   N''), N',', N'') = N''
    ),

    /* Sin la N, igual que en las instalaciones anteriores */
    CONSTRAINT CK_Oficiales_Autorizado CHECK
        (Autorizado IN ('Autorizado', 'Denegado', 'Pendiente')),

    CONSTRAINT CK_Oficiales_Contadores CHECK
        (Tardias >= 0 AND Ausencias >= 0 AND Vacaciones >= 0)
);
GO

PRINT '   Oficiales';
GO

/* ------------------------------------------------------------
   Los puestos de la base. Orden es en que orden se recorren;
   sin esa columna la lista sale por codigo interno y CH 10
   aparece antes que CH 2.
   ------------------------------------------------------------ */
CREATE TABLE dbo.Puestos
(
    IdPuesto  INT IDENTITY(1,1) NOT NULL,
    Codigo    NVARCHAR(20)  NOT NULL,
    Ubicacion NVARCHAR(150) NULL,
    Activo    BIT NOT NULL CONSTRAINT DF_Puestos_Activo DEFAULT (1),
    Orden     INT NULL,

    CONSTRAINT PK_Puestos        PRIMARY KEY (IdPuesto),
    CONSTRAINT UQ_Puestos_Codigo UNIQUE (Codigo)
);
GO

PRINT '   Puestos';
GO

/* ------------------------------------------------------------
   La lista de asistencia: una linea por oficial y por dia.

   Tipo dice con que entro ese dia:
       Rol      le tocaba
       Vacante  entro a una plaza sin titular
       Extra    entro cubriendo a alguien
   ------------------------------------------------------------ */
CREATE TABLE dbo.AsistenciaDiaria
(
    IdAsistencia INT IDENTITY(1,1) NOT NULL,
    Fecha        DATE          NOT NULL,
    IdOficial    INT           NOT NULL,
    Turno        NVARCHAR(20)  NOT NULL,
    IdPuesto     INT           NULL,
    Estado       NVARCHAR(15)  NOT NULL,
    Tardia       BIT NOT NULL CONSTRAINT DF_Asistencia_Tardia DEFAULT (0),

    /* TIME(0) y no TIME a secas: la hora de llegada se anota en
       horas y minutos, nunca en segundos. TIME solo guardaria
       siete decimales de segundo que nadie escribe, y ademas
       dejaria esta base distinta a las que ya estan instaladas. */
    HoraLlegada  TIME(0)       NULL,
    Observacion  NVARCHAR(200) NULL,
    FechaCaptura DATETIME2 NOT NULL
                 CONSTRAINT DF_Asistencia_Captura DEFAULT (SYSDATETIME()),
    Tipo         NVARCHAR(10) NOT NULL
                 CONSTRAINT DF_Asistencia_Tipo DEFAULT (N'Rol'),

    CONSTRAINT PK_AsistenciaDiaria PRIMARY KEY (IdAsistencia),

    /* Un oficial, una linea por dia. Si se vuelve a cerrar el
       turno, el programa borra y reescribe. */
    CONSTRAINT UQ_Asistencia_Fecha_Oficial UNIQUE (Fecha, IdOficial),

    CONSTRAINT FK_Asistencia_Oficial
        FOREIGN KEY (IdOficial) REFERENCES dbo.Oficiales(IdOficial),
    CONSTRAINT FK_Asistencia_Puesto
        FOREIGN KEY (IdPuesto) REFERENCES dbo.Puestos(IdPuesto),

    /* Sin la N adelante a proposito, aunque la columna sea
       nvarchar. Asi quedan escritas en las instalaciones que ya
       estan funcionando, y comparar el esquema de una base nueva
       contra una vieja tiene que salir sin diferencias: si algun
       dia sale una, es una de verdad y no ruido. */
    CONSTRAINT CK_Asistencia_Estado
        CHECK (Estado IN ('Presente', 'Ausente', 'Incapacidad')),

    /* El que no llego no lleva tardia ni hora de llegada */
    CONSTRAINT CK_Asistencia_Tardia CHECK
    (
        (Estado <> 'Presente' AND Tardia = 0 AND HoraLlegada IS NULL)
        OR
        (Estado =  'Presente' AND (Tardia = 0 OR HoraLlegada IS NOT NULL))
    ),

    CONSTRAINT CK_Asistencia_Tipo
        CHECK (Tipo IN (N'Rol', N'Vacante', N'Extra'))
);
GO

PRINT '   AsistenciaDiaria';
GO

/* ------------------------------------------------------------
   Las sustituciones reales del dia: quien falto y quien lo
   cubrio.

   A proposito NO hay unico sobre IdOficialSustituto: un oficial
   puede cubrir varios puestos el mismo dia, y aqui los extras
   son de todos los dias.
   ------------------------------------------------------------ */
CREATE TABLE dbo.Sustituciones
(
    IdSustitucion      INT IDENTITY(1,1) NOT NULL,
    Fecha              DATE         NOT NULL,
    Turno              NVARCHAR(20) NOT NULL,
    IdOficialAusente   INT          NOT NULL,
    IdOficialSustituto INT          NOT NULL,
    IdPuesto           INT          NULL,
    FechaCaptura       DATETIME2 NOT NULL
                       CONSTRAINT DF_Sustituciones_Captura DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Sustituciones PRIMARY KEY (IdSustitucion),

    /* Al que falta lo cubre uno solo */
    CONSTRAINT UQ_Sust_Ausente UNIQUE (Fecha, IdOficialAusente),

    CONSTRAINT FK_Sust_Ausente
        FOREIGN KEY (IdOficialAusente)   REFERENCES dbo.Oficiales(IdOficial),
    CONSTRAINT FK_Sust_Sustituto
        FOREIGN KEY (IdOficialSustituto) REFERENCES dbo.Oficiales(IdOficial),
    CONSTRAINT FK_Sust_Puesto
        FOREIGN KEY (IdPuesto)           REFERENCES dbo.Puestos(IdPuesto),

    CONSTRAINT CK_Sust_Distintos CHECK (IdOficialAusente <> IdOficialSustituto)
);
GO

PRINT '   Sustituciones';
GO

/* ------------------------------------------------------------
   El plan de un dia futuro. Vive aparte de la asistencia para
   no contaminar los contadores.
   ------------------------------------------------------------ */
CREATE TABLE dbo.ProyeccionDia
(
    IdProyeccion       INT IDENTITY(1,1) NOT NULL,
    Fecha              DATE          NOT NULL,
    IdOficial          INT           NOT NULL,
    Turno              NVARCHAR(20)  NOT NULL,
    IdPuesto           INT           NULL,
    Disponible         BIT NOT NULL CONSTRAINT DF_Proy_Disponible DEFAULT (1),
    Motivo             NVARCHAR(30)  NULL,
    IdOficialSustituto INT           NULL,
    Observacion        NVARCHAR(200) NULL,
    FechaRegistro      DATETIME2 NOT NULL
                       CONSTRAINT DF_Proy_Registro DEFAULT (SYSDATETIME()),
    Tipo               NVARCHAR(10) NOT NULL
                       CONSTRAINT DF_Proy_Tipo DEFAULT (N'Rol'),

    CONSTRAINT PK_ProyeccionDia PRIMARY KEY (IdProyeccion),

    /* Un oficial no aparece dos veces en el plan del mismo dia */
    CONSTRAINT UQ_Proy_Fecha_Oficial UNIQUE (Fecha, IdOficial),

    CONSTRAINT FK_Proy_Oficial
        FOREIGN KEY (IdOficial)          REFERENCES dbo.Oficiales(IdOficial),
    CONSTRAINT FK_Proy_Sustituto
        FOREIGN KEY (IdOficialSustituto) REFERENCES dbo.Oficiales(IdOficial),
    CONSTRAINT FK_Proy_Puesto
        FOREIGN KEY (IdPuesto)           REFERENCES dbo.Puestos(IdPuesto),

    /* Si va a estar, no lleva motivo ni sustituto */
    CONSTRAINT CK_Proy_Coherencia CHECK
        (Disponible = 0 OR (Motivo IS NULL AND IdOficialSustituto IS NULL)),

    CONSTRAINT CK_Proy_Distintos CHECK
        (IdOficialSustituto IS NULL OR IdOficialSustituto <> IdOficial),

    CONSTRAINT CK_Proy_Motivo CHECK
        (Motivo IS NULL OR Motivo IN
         (N'Incapacidad', N'Vacaciones', N'Permiso', N'Renuncia', N'Otro')),

    CONSTRAINT CK_Proy_Tipo CHECK (Tipo IN (N'Rol', N'Vacante', N'Extra'))
);
GO

PRINT '   ProyeccionDia';
GO

CREATE TABLE dbo.Incapacidades
(
    IdIncapacidad INT IDENTITY(1,1) NOT NULL,
    IdOficial     INT           NOT NULL,
    NumeroBoleta  NVARCHAR(30)  NULL,
    FechaInicio   DATE          NOT NULL,
    FechaFin      DATE          NOT NULL,
    Observacion   NVARCHAR(200) NULL,
    FechaRegistro DATETIME2 NOT NULL
                  CONSTRAINT DF_Incap_Registro DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Incapacidades PRIMARY KEY (IdIncapacidad),
    CONSTRAINT FK_Incap_Oficial
        FOREIGN KEY (IdOficial) REFERENCES dbo.Oficiales(IdOficial),
    CONSTRAINT CK_Incap_Fechas CHECK (FechaFin >= FechaInicio)
);
GO

PRINT '   Incapacidades';
GO

/* Que turnos ya se cerraron cada dia */
CREATE TABLE dbo.TurnosCerrados
(
    Fecha          DATE         NOT NULL,
    Turno          NVARCHAR(20) NOT NULL,
    TotalOficiales INT          NOT NULL,
    TotalAusentes  INT          NOT NULL,
    FechaCierre    DATETIME2 NOT NULL
                   CONSTRAINT DF_TurnosCerrados_Fecha DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_TurnosCerrados PRIMARY KEY (Fecha, Turno)
);
GO

PRINT '   TurnosCerrados';
GO

/* Que dias ya tienen el reporte generado */
CREATE TABLE dbo.ReportesDiarios
(
    Fecha              DATE          NOT NULL,
    TotalOficiales     INT           NOT NULL,
    TotalPresentes     INT           NOT NULL,
    TotalAusentes      INT           NOT NULL,
    TotalSustituciones INT           NOT NULL,
    RutaArchivo        NVARCHAR(400) NULL,
    FechaGeneracion    DATETIME2 NOT NULL
                       CONSTRAINT DF_Reportes_Fecha DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_ReportesDiarios PRIMARY KEY (Fecha)
);
GO

PRINT '   ReportesDiarios';
GO


/* ============================================================
   3. INDICES
   ------------------------------------------------------------
   Los de las consultas que el programa hace todos los dias.
   ============================================================ */
PRINT '';
PRINT '=== 3. INDICES ===';
GO

CREATE INDEX IX_Oficiales_Nombre       ON dbo.Oficiales(Nombre);

CREATE INDEX IX_Asistencia_Fecha       ON dbo.AsistenciaDiaria(Fecha);
CREATE INDEX IX_Asistencia_FechaTurno  ON dbo.AsistenciaDiaria(Fecha, Turno);
CREATE INDEX IX_Asistencia_Oficial     ON dbo.AsistenciaDiaria(IdOficial, Fecha);

/* Solo las tardias: son pocas y se consultan aparte en el
   historial de incidencias. */
CREATE INDEX IX_Asistencia_Tardia      ON dbo.AsistenciaDiaria(Tardia, Fecha)
    WHERE Tardia = 1;

CREATE INDEX IX_Sust_Fecha             ON dbo.Sustituciones(Fecha);

CREATE INDEX IX_Proy_Fecha             ON dbo.ProyeccionDia(Fecha, Turno);

CREATE INDEX IX_Incap_Oficial          ON dbo.Incapacidades(IdOficial, FechaInicio);
CREATE INDEX IX_Incap_Rango            ON dbo.Incapacidades(FechaInicio, FechaFin);
GO

PRINT '   9 indices creados.';
GO


/* ============================================================
   4. VISTAS
   ============================================================ */
PRINT '';
PRINT '=== 4. VISTAS ===';
GO

/* ---------- Incapacidades con dias restantes ---------- */
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

PRINT '   vw_Incapacidades';
GO

/* ---------- El reporte del dia ---------- */
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

PRINT '   vw_ReporteDiario';
GO

/* ---------- Ausencias y tardias, para el historial ---------- */
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

PRINT '   vw_IncidenciasAsistencia';
GO

/* ---------- El plan de un dia ---------- */
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

PRINT '   vw_ProyeccionDia';
GO


/* ============================================================
   5. PROCEDIMIENTOS
   ============================================================ */
PRINT '';
PRINT '=== 5. PROCEDIMIENTOS ===';
GO

/* Quien trabaja una fecha, marcando incapacitados */
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

PRINT '   sp_Proyeccion';
GO

/* Recalculo de contadores. NO suma: cuenta desde el historial. */
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

PRINT '   sp_RecalcularContadores';
GO

/* El nombre viejo, que todavia se llama desde algunos lados */
CREATE PROCEDURE dbo.sp_RecalcularAusencias
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_RecalcularContadores;
END
GO

PRINT '   sp_RecalcularAusencias';
GO


/* ============================================================
   6. LOS PUESTOS DEL CLIENTE
   ------------------------------------------------------------
   *** ESTA ES LA PARTE QUE HAY QUE CAMBIAR ***

   Escriba aqui los puestos de ESTE cliente, en el orden en que
   se recorren en la base. El numero de la izquierda es ese
   orden; el texto del medio es el codigo que va a salir en los
   cuadros, y el ultimo es la ubicacion (puede ir vacio, entre
   comillas seguidas: N'').

   Los tres de abajo son de ejemplo y HAY QUE REEMPLAZARLOS.

   ------------------------------------------------------------
   ESTE BLOQUE SIRVE DESPUES, TAMBIEN
   ------------------------------------------------------------
   El programa no tiene pantalla para crear puestos. El dia que
   el cliente agregue, quite o reacomode alguno, copie este
   bloque completo (desde el USE de abajo hasta el GO del final),
   cambie la lista y correlo solo. Se puede repetir las veces que
   sea:

       - el puesto que ya existe se le acomoda el orden y la
         ubicacion, y queda activo;
       - el que no existia, entra;
       - el que ya no aparece en la lista se APAGA, no se borra,
         porque los dias en que se uso tienen que seguir
         cuadrando.
   ============================================================ */
PRINT '';
PRINT '=== 6. PUESTOS ===';
GO

USE PlanillaVanguard;
GO

IF OBJECT_ID('tempdb..#Puestos') IS NOT NULL DROP TABLE #Puestos;

/* El COLLATE DATABASE_DEFAULT no es adorno: una tabla temporal
   nace en tempdb y hereda la intercalacion del SERVIDOR, no la de
   esta base. Si no coinciden, comparar n.Codigo = p.Codigo revienta
   con el error 468 y no entra ningun puesto. */
CREATE TABLE #Puestos
(
    Orden     INT           NOT NULL,
    Codigo    NVARCHAR(20)  COLLATE DATABASE_DEFAULT NOT NULL,
    Ubicacion NVARCHAR(150) COLLATE DATABASE_DEFAULT NULL
);

/* ---------- LA LISTA DEL CLIENTE VA AQUI ---------- */
INSERT INTO #Puestos (Orden, Codigo, Ubicacion) VALUES
    ( 1, N'PUESTO 1', N'CAMBIE ESTO por la ubicacion real'),
    ( 2, N'PUESTO 2', N''),
    ( 3, N'PUESTO 3', N'');
/* ---------- HASTA AQUI ---------- */

/* Los que ya estaban: se les acomoda y se reactivan */
UPDATE p
SET    p.Orden     = n.Orden,
       p.Ubicacion = n.Ubicacion,
       p.Activo    = 1
FROM   dbo.Puestos p
INNER JOIN #Puestos n ON n.Codigo = p.Codigo;

DECLARE @acomodados INT = @@ROWCOUNT;

/* Los nuevos */
INSERT INTO dbo.Puestos (Codigo, Ubicacion, Activo, Orden)
SELECT n.Codigo, NULLIF(n.Ubicacion, N''), 1, n.Orden
FROM   #Puestos n
WHERE  NOT EXISTS (SELECT 1 FROM dbo.Puestos p WHERE p.Codigo = n.Codigo);

DECLARE @nuevos INT = @@ROWCOUNT;

/* Los que salieron de la lista: se apagan, nunca se borran */
UPDATE p
SET    p.Activo = 0
FROM   dbo.Puestos p
WHERE  p.Activo = 1
  AND  NOT EXISTS (SELECT 1 FROM #Puestos n WHERE n.Codigo = p.Codigo);

DECLARE @apagados INT = @@ROWCOUNT;

DROP TABLE #Puestos;

PRINT '   Puestos nuevos: '     + CAST(@nuevos     AS VARCHAR(10));
PRINT '   Puestos acomodados: ' + CAST(@acomodados AS VARCHAR(10));
PRINT '   Puestos apagados: '   + CAST(@apagados   AS VARCHAR(10));
GO

/* Va por variable: PRINT no acepta una consulta adentro. */
DECLARE @cuantos INT = (SELECT COUNT(*) FROM dbo.Puestos);
PRINT '   Puestos cargados: ' + CAST(@cuantos AS VARCHAR(10));

IF EXISTS (SELECT 1 FROM dbo.Puestos WHERE Codigo LIKE N'PUESTO [123]')
BEGIN
    PRINT '';
    PRINT '   *** OJO: quedaron los puestos de EJEMPLO. ***';
    PRINT '   Vuelva al paso 6 de este archivo, escriba los del cliente';
    PRINT '   y corra ese bloque otra vez.';
END
GO


/* ============================================================
   7. COMO QUEDO
   ------------------------------------------------------------
   Las cinco comprobaciones tienen que decir 'ya esta'.
   ============================================================ */
PRINT '';
PRINT '============================================================';
PRINT ' COMO QUEDO';
PRINT '============================================================';
GO

SELECT
    CASE WHEN (SELECT COUNT(*) FROM sys.tables) = 8
         THEN N'ya esta' ELSE N'FALTA' END AS Las_8_Tablas,

    CASE WHEN (SELECT COUNT(*) FROM sys.views) = 4
         THEN N'ya esta' ELSE N'FALTA' END AS Las_4_Vistas,

    CASE WHEN (SELECT COUNT(*) FROM sys.procedures) = 3
         THEN N'ya esta' ELSE N'FALTA' END AS Los_3_Procedimientos,

    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE name = 'CK_Oficiales_Horario'
                        AND definition LIKE N'%Autorizado Externo%')
         THEN N'ya esta' ELSE N'FALTA' END AS Los_9_Roles,

    CASE WHEN COL_LENGTH('dbo.AsistenciaDiaria','Tipo') IS NOT NULL
     AND COL_LENGTH('dbo.ProyeccionDia','Tipo')    IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Rol_Vacante_Extra;
GO

/* Los puestos que quedaron. Si aqui todavia salen PUESTO 1, 2 y
   3, vuelva al paso 6: esos son los de ejemplo. */
SELECT Orden, Codigo, Ubicacion, Activo
FROM   dbo.Puestos
ORDER  BY ISNULL(Orden, 2147483647), IdPuesto;
GO

/* Las tablas arrancan vacias, menos los puestos. El personal se
   registra desde el programa. */
SELECT
    (SELECT COUNT(*) FROM dbo.Oficiales)        AS Oficiales,
    (SELECT COUNT(*) FROM dbo.Puestos)          AS Puestos,
    (SELECT COUNT(*) FROM dbo.AsistenciaDiaria) AS Asistencia,
    (SELECT COUNT(*) FROM dbo.ProyeccionDia)    AS Proyeccion;
GO


/* ============================================================
   8. SI EL PROGRAMA LO ABRE OTRO USUARIO DE WINDOWS
   ------------------------------------------------------------
   El programa entra a la base con el usuario de Windows que
   tenga la sesion abierta, sin contrasena. Si ese usuario es el
   mismo que corrio este script, ya quedo listo y no hay nada
   mas que hacer.

   Si no, quite el comentario de las dos lineas de abajo,
   cambie el nombre por el del usuario o el grupo, y correlas.
   El nombre va como lo ve Windows, por ejemplo:

       MAQUINA\Vigilancia        una cuenta de esa computadora
       EMPRESA\Supervisores      un grupo del dominio
   ============================================================ */

-- CREATE LOGIN [MAQUINA\Vigilancia] FROM WINDOWS;
-- GO
-- USE PlanillaVanguard;
-- CREATE USER [MAQUINA\Vigilancia] FOR LOGIN [MAQUINA\Vigilancia];
-- ALTER ROLE db_owner ADD MEMBER [MAQUINA\Vigilancia];
-- GO


PRINT '';
PRINT '=== LISTO ===';
PRINT '';
PRINT 'Falta, en este orden:';
PRINT '  1. Revisar arriba que los puestos sean los del cliente.';
PRINT '  2. Abrir el programa y activar la licencia de esa computadora.';
PRINT '  3. Registrar el personal desde Registro de personal.';
PRINT '  4. Instalar el respaldo automatico: carpeta Mantenimiento,';
PRINT '     archivo Instalar_Tareas.cmd, con clic derecho y';
PRINT '     Ejecutar como administrador.';
GO

SET NOEXEC OFF;
GO
