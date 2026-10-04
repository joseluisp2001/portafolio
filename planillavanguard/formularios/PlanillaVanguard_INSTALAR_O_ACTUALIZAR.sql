/* ============================================================
   PlanillaVanguard  -  INSTALAR O ACTUALIZAR
   ------------------------------------------------------------
   EL UNICO SCRIPT QUE HAY QUE CORRER. Sirve para las dos cosas
   y decide solo cual hacer:

     - Si la base NO existe, la crea completa y lista para usar.
     - Si la base YA existe, la pone al dia sin borrar nada.

   No hay que escoger ni acordarse de cual archivo va. Se corre
   este y ya. Se puede repetir las veces que sea: lo que ya esta
   hecho se salta solo.

   Reemplaza a todos los anteriores:
       PlanillaVanguard_INSTALACION.sql
       PlanillaVanguard_ROL_VACANTE_EXTRA.sql
       PlanillaVanguard_PONER_AL_DIA.sql
       PlanillaVanguard_ACTUALIZACION.sql
       PlanillaVanguard_TIPO_EXTRA.sql
       PlanillaVanguard_TURNOS_NUEVOS.sql

   ------------------------------------------------------------
   LO UNICO QUE HAY QUE REVISAR ANTES: LOS PUESTOS
   ------------------------------------------------------------
   Vaya al PASO 8. Si esta instalando un cliente nuevo, escriba
   ahi sus puestos: el programa no tiene pantalla para crearlos,
   salen de este bloque.

   En una base que ya existe, ese paso NO se toca, salvo que
   usted lo pida a proposito (dice como).

   ------------------------------------------------------------
   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   Al final sale un cuadro de comprobaciones: todas tienen que
   decir 'ya esta'.
   ============================================================ */

USE master;
GO

/* La base tiene indices filtrados. Con estas dos opciones
   apagadas, SQL Server no deja ni actualizar tablas ni crear
   vistas que sirvan despues. SSMS las pone en ON solo; sqlcmd
   no. Se dejan fijas aqui para que corra igual desde donde sea. */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


/* ============================================================
   1. LA BASE
   ------------------------------------------------------------
   Aqui se decide todo lo demas. El modo queda anotado en una
   tabla temporal porque las variables no cruzan los GO.
   ============================================================ */
IF OBJECT_ID('tempdb..#Modo') IS NOT NULL DROP TABLE #Modo;
CREATE TABLE #Modo (Instalando BIT NOT NULL);

INSERT INTO #Modo (Instalando)
SELECT CASE WHEN DB_ID('PlanillaVanguard') IS NULL THEN 1 ELSE 0 END;
GO

PRINT '';
PRINT '============================================================';

IF (SELECT Instalando FROM #Modo) = 1
BEGIN
    PRINT ' INSTALANDO DESDE CERO';
    PRINT '============================================================';
    PRINT '';
    PRINT '=== 1. LA BASE ===';
END
ELSE
BEGIN
    PRINT ' PONIENDO LA BASE AL DIA';
    PRINT '============================================================';
    PRINT '';
    PRINT '=== 1. LA BASE ===';
    PRINT '   Ya existe: no se toca. Solo se le agrega lo que le falte.';
END
GO

/* Modern_Spanish_CI_AS: sin distinguir mayusculas ni acentos,
   que es como se comparan los nombres y las cedulas. Es la misma
   de las instalaciones anteriores; cambiarla haria que dos bases
   del mismo programa ordenaran distinto.

   SIMPLE: la base se respalda con el .bak de todas las noches
   (carpeta Mantenimiento), no con la cadena de registros. Con
   FULL el archivo de registro crece hasta llenar el disco, que
   es la falla mas comun en estas instalaciones. */
IF (SELECT Instalando FROM #Modo) = 1
BEGIN
    EXEC('CREATE DATABASE PlanillaVanguard COLLATE Modern_Spanish_CI_AS;');
    EXEC('ALTER DATABASE PlanillaVanguard SET RECOVERY SIMPLE;');
    PRINT '   Base PlanillaVanguard creada.';
END
GO

USE PlanillaVanguard;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


/* ============================================================
   2. LAS TABLAS
   ------------------------------------------------------------
   Cada una entra solo si no esta. En una base que ya existe,
   esta parte no hace nada.
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
IF OBJECT_ID('dbo.Oficiales','U') IS NULL
BEGIN
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

        /* El chaleco se puede repetir: uno pasa de un oficial a
           otro y en el traslape los dos lo tienen anotado. */
        CodigoChaleco        NVARCHAR(30) NULL,

        /* Al que se va no se le borra: se apaga, para que su
           historial siga cuadrando. */
        Activo               BIT NOT NULL CONSTRAINT DF_Oficiales_Activo DEFAULT (1),

        FechaRegistro        DATETIME2 NOT NULL
                             CONSTRAINT DF_Oficiales_FechaReg DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_Oficiales        PRIMARY KEY (IdOficial),
        CONSTRAINT UQ_Oficiales_Cedula UNIQUE (Cedula),

        /* Sin la N adelante a proposito, aunque la columna sea
           nvarchar: asi quedo escrita en las instalaciones que ya
           estan funcionando. Comparar el esquema de una base nueva
           contra una vieja tiene que salir sin diferencias, para
           que el dia que salga una sea de verdad y no ruido. */
        CONSTRAINT CK_Oficiales_Autorizado CHECK
            (Autorizado IN ('Autorizado', 'Denegado', 'Pendiente')),

        CONSTRAINT CK_Oficiales_Contadores CHECK
            (Tardias >= 0 AND Ausencias >= 0 AND Vacaciones >= 0)
    );

    PRINT '   Oficiales';
END
GO

IF OBJECT_ID('dbo.Puestos','U') IS NULL
BEGIN
    /* Orden es en que orden se recorren; sin esa columna la
       lista sale por codigo interno y CH 10 aparece antes que
       CH 2. */
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

    PRINT '   Puestos';
END
GO

IF OBJECT_ID('dbo.AsistenciaDiaria','U') IS NULL
BEGIN
    /* Tipo dice con que entro ese dia:
           Rol      le tocaba
           Vacante  entro a una plaza sin titular
           Extra    entro cubriendo a alguien

       HoraLlegada va en TIME(0): se anota en horas y minutos,
       nunca en segundos. */
    CREATE TABLE dbo.AsistenciaDiaria
    (
        IdAsistencia INT IDENTITY(1,1) NOT NULL,
        Fecha        DATE          NOT NULL,
        IdOficial    INT           NOT NULL,
        Turno        NVARCHAR(20)  NOT NULL,
        IdPuesto     INT           NULL,
        Estado       NVARCHAR(15)  NOT NULL,
        Tardia       BIT NOT NULL CONSTRAINT DF_Asistencia_Tardia DEFAULT (0),
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

        CONSTRAINT CK_Asistencia_Estado
            CHECK (Estado IN ('Presente', 'Ausente', 'Incapacidad')),

        /* El que no llego no lleva tardia ni hora de llegada */
        CONSTRAINT CK_Asistencia_Tardia CHECK
        (
            (Estado <> 'Presente' AND Tardia = 0 AND HoraLlegada IS NULL)
            OR
            (Estado =  'Presente' AND (Tardia = 0 OR HoraLlegada IS NOT NULL))
        )
    );

    PRINT '   AsistenciaDiaria';
END
GO

IF OBJECT_ID('dbo.Sustituciones','U') IS NULL
BEGIN
    /* A proposito NO hay unico sobre IdOficialSustituto: un
       oficial puede cubrir varios puestos el mismo dia, y aqui
       los extras son de todos los dias. */
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

    PRINT '   Sustituciones';
END
GO

IF OBJECT_ID('dbo.ProyeccionDia','U') IS NULL
BEGIN
    /* El plan de un dia futuro. Vive aparte de la asistencia
       para no contaminar los contadores. */
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
             (N'Incapacidad', N'Vacaciones', N'Permiso', N'Renuncia', N'Otro'))
    );

    PRINT '   ProyeccionDia';
END
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
        FechaRegistro DATETIME2 NOT NULL
                      CONSTRAINT DF_Incap_Registro DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_Incapacidades PRIMARY KEY (IdIncapacidad),
        CONSTRAINT FK_Incap_Oficial
            FOREIGN KEY (IdOficial) REFERENCES dbo.Oficiales(IdOficial),
        CONSTRAINT CK_Incap_Fechas CHECK (FechaFin >= FechaInicio)
    );

    PRINT '   Incapacidades';
END
GO

IF OBJECT_ID('dbo.TurnosCerrados','U') IS NULL
BEGIN
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

    PRINT '   TurnosCerrados';
END
GO

IF OBJECT_ID('dbo.ReportesDiarios','U') IS NULL
BEGIN
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

    PRINT '   ReportesDiarios';
END
GO

IF (SELECT Instalando FROM #Modo) = 0
    PRINT '   Las 8 tablas ya estaban.';
GO


/* ============================================================
   3. LAS COLUMNAS QUE LE PUEDEN FALTAR A UNA BASE VIEJA
   ------------------------------------------------------------
   En una instalacion nueva ya vienen puestas arriba. Esto es
   para las bases que se instalaron antes de agosto de 2026.
   ============================================================ */
PRINT '';
PRINT '=== 3. COLUMNAS ===';
GO

IF COL_LENGTH('dbo.Puestos', 'Orden') IS NULL
BEGIN
    ALTER TABLE dbo.Puestos ADD Orden INT NULL;
    PRINT '   Puestos.Orden agregada (vacia). Numerela en el paso 8.';
END
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
       coberturas que usted hubiera pasado a Rol o a Vacante. */
    EXEC(N'UPDATE dbo.ProyeccionDia
              SET Tipo = N''Extra''
            WHERE IdOficialSustituto IS NOT NULL;');

    PRINT '   ProyeccionDia.Tipo agregada (las coberturas quedaron en Extra).';
END
GO

IF COL_LENGTH('dbo.AsistenciaDiaria', 'Tipo') IS NULL
BEGIN
    ALTER TABLE dbo.AsistenciaDiaria
        ADD Tipo NVARCHAR(10) NOT NULL
            CONSTRAINT DF_Asistencia_Tipo DEFAULT (N'Rol');

    /* Nada se rellena hacia atras. Los dias ya pasados quedan en
       Rol, que es lo unico que se puede afirmar: esa marca no se
       pidio entonces, y ponerle Extra o Vacante por adivinanza
       seria inventar un dato de planilla. */
    PRINT '   AsistenciaDiaria.Tipo agregada (lo ya registrado quedo en Rol).';
END
GO

IF (SELECT Instalando FROM #Modo) = 0
    PRINT '   Revisadas.';
GO


/* ============================================================
   4. LAS REGLAS
   ------------------------------------------------------------
   Los nueve roles, el dia libre Ninguno y los tres tipos de
   jornada. Se ponen si faltan y se amplian si estan cortas.
   ============================================================ */
PRINT '';
PRINT '=== 4. REGLAS ===';
GO

/* ---------- Los nueve roles ----------
       06:00 - 12:00      corto de la manana
       06:00 - 14:00
       07:00 - 16:00      corrido del dia
       12:00 - 18:00      corto de la tarde
       14:00 - 18:00
       14:00 - 21:00      extra de la tarde
       18:00 - 00:00
       00:00 - 06:00
       Autorizado Externo no va por horas, lo trae otra empresa,
                          pero si cubre puestos                   */
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
             AND definition LIKE N'%06:00 - 12:00%'
             AND definition LIKE N'%07:00 - 16:00%'
             AND definition LIKE N'%12:00 - 18:00%'
             AND definition LIKE N'%14:00 - 21:00%'
             AND definition LIKE N'%Autorizado Externo%')
    PRINT '   Los nueve roles ya estaban.';
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
       espacios, para no perder a nadie cuando entre la regla. */
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
       y la regla entra sin revisar lo viejo: asi el script
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

        PRINT '   Regla puesta (sin revisar lo viejo).';
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

        PRINT '   Los nueve roles quedaron habilitados y validados.';
    END
END
GO

/* ---------- El dia libre Ninguno, para el externo ---------- */
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
       regla entra revisada y queda confiable. */
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

        PRINT '   Regla puesta (sin revisar lo viejo).';
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
ELSE PRINT '   El dia libre Ninguno ya estaba.';
GO

/* ---------- Rol / Vacante / Extra ----------
   Ojo: una base a la que se le corrio el script viejo tiene
   estas reglas con solo dos valores, y con esas puestas el
   programa no podria guardar Vacante. Por eso, si la que hay no
   menciona Vacante, se cambia. */
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = 'CK_Proy_Tipo'
             AND parent_object_id = OBJECT_ID('dbo.ProyeccionDia')
             AND definition NOT LIKE N'%Vacante%')
BEGIN
    ALTER TABLE dbo.ProyeccionDia DROP CONSTRAINT CK_Proy_Tipo;
    PRINT '   La regla anterior de la proyeccion solo aceptaba Rol y Extra: se retiro.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_Proy_Tipo'
                 AND parent_object_id = OBJECT_ID('dbo.ProyeccionDia'))
BEGIN
    UPDATE dbo.ProyeccionDia SET Tipo = N'Rol'
     WHERE Tipo NOT IN (N'Rol', N'Vacante', N'Extra');

    ALTER TABLE dbo.ProyeccionDia
        ADD CONSTRAINT CK_Proy_Tipo
        CHECK (Tipo IN (N'Rol', N'Vacante', N'Extra'));

    PRINT '   Proyeccion: Rol, Vacante y Extra habilitados.';
END
ELSE PRINT '   Proyeccion: los tres tipos ya estaban.';
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = 'CK_Asistencia_Tipo'
             AND parent_object_id = OBJECT_ID('dbo.AsistenciaDiaria')
             AND definition NOT LIKE N'%Vacante%')
BEGIN
    ALTER TABLE dbo.AsistenciaDiaria DROP CONSTRAINT CK_Asistencia_Tipo;
    PRINT '   La regla anterior de la asistencia no aceptaba Vacante: se retiro.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_Asistencia_Tipo'
                 AND parent_object_id = OBJECT_ID('dbo.AsistenciaDiaria'))
BEGIN
    UPDATE dbo.AsistenciaDiaria SET Tipo = N'Rol'
     WHERE Tipo NOT IN (N'Rol', N'Vacante', N'Extra');

    ALTER TABLE dbo.AsistenciaDiaria
        ADD CONSTRAINT CK_Asistencia_Tipo
        CHECK (Tipo IN (N'Rol', N'Vacante', N'Extra'));

    PRINT '   Asistencia: Rol, Vacante y Extra habilitados.';
END
ELSE PRINT '   Asistencia: los tres tipos ya estaban.';
GO


/* ============================================================
   5. INDICES
   ------------------------------------------------------------
   Los de las consultas que el programa hace todos los dias.
   Cada uno entra solo si falta.
   ============================================================ */
PRINT '';
PRINT '=== 5. INDICES ===';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Oficiales_Nombre'
               AND object_id = OBJECT_ID('dbo.Oficiales'))
    EXEC(N'CREATE INDEX IX_Oficiales_Nombre ON dbo.Oficiales(Nombre);');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Asistencia_Fecha'
               AND object_id = OBJECT_ID('dbo.AsistenciaDiaria'))
    EXEC(N'CREATE INDEX IX_Asistencia_Fecha ON dbo.AsistenciaDiaria(Fecha);');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Asistencia_FechaTurno'
               AND object_id = OBJECT_ID('dbo.AsistenciaDiaria'))
    EXEC(N'CREATE INDEX IX_Asistencia_FechaTurno ON dbo.AsistenciaDiaria(Fecha, Turno);');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Asistencia_Oficial'
               AND object_id = OBJECT_ID('dbo.AsistenciaDiaria'))
    EXEC(N'CREATE INDEX IX_Asistencia_Oficial ON dbo.AsistenciaDiaria(IdOficial, Fecha);');

/* Solo las tardias: son pocas y se consultan aparte en el
   historial de incidencias. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Asistencia_Tardia'
               AND object_id = OBJECT_ID('dbo.AsistenciaDiaria'))
    EXEC(N'CREATE INDEX IX_Asistencia_Tardia ON dbo.AsistenciaDiaria(Tardia, Fecha)
               WHERE Tardia = 1;');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sust_Fecha'
               AND object_id = OBJECT_ID('dbo.Sustituciones'))
    EXEC(N'CREATE INDEX IX_Sust_Fecha ON dbo.Sustituciones(Fecha);');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Proy_Fecha'
               AND object_id = OBJECT_ID('dbo.ProyeccionDia'))
    EXEC(N'CREATE INDEX IX_Proy_Fecha ON dbo.ProyeccionDia(Fecha, Turno);');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Incap_Oficial'
               AND object_id = OBJECT_ID('dbo.Incapacidades'))
    EXEC(N'CREATE INDEX IX_Incap_Oficial ON dbo.Incapacidades(IdOficial, FechaInicio);');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Incap_Rango'
               AND object_id = OBJECT_ID('dbo.Incapacidades'))
    EXEC(N'CREATE INDEX IX_Incap_Rango ON dbo.Incapacidades(FechaInicio, FechaFin);');
GO

PRINT '   Los 9 indices estan.';
GO

/* ---------- Un oficial puede cubrir varios puestos el mismo dia ----------
   Las bases viejas traen un indice unico filtrado sobre
   (Fecha, IdOficialSustituto) que lo impide. Con los extras eso
   pasa todos los dias, asi que sale.

   Lo que SI se mantiene: UQ_Proy_Fecha_Oficial, que evita que un
   oficial aparezca dos veces en el plan del mismo dia, y
   UQ_Sust_Ausente, porque al que falta lo cubre uno solo. */
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
  AND  i.is_unique = 1 AND i.is_primary_key = 0
  AND  c.name = 'IdOficialSustituto';

IF LEN(@extras) > 0
BEGIN
    EXEC sp_executesql @extras;
    PRINT '   Proyeccion: un oficial ya puede cubrir varios puestos el mismo dia.';
END
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
  AND  i.is_unique = 1 AND i.is_primary_key = 0
  AND  c.name = 'IdOficialSustituto';

IF LEN(@extras2) > 0
BEGIN
    EXEC sp_executesql @extras2;
    PRINT '   Sustituciones: un oficial ya puede cubrir varios puestos el mismo dia.';
END
GO


/* ============================================================
   6. VISTAS
   ------------------------------------------------------------
   Se rehacen siempre. Una vista no guarda datos: es una
   consulta guardada, asi que rehacerla no cuesta ni pierde nada,
   y garantiza que quede la version de hoy.
   ============================================================ */
PRINT '';
PRINT '=== 6. VISTAS ===';
GO

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

/* La vieja vw_Incidencias chocaba de nombre con la de
   incapacidades. Si quedo por ahi, sale. */
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

PRINT '   Las 4 vistas quedaron al dia.';
GO


/* ============================================================
   7. PROCEDIMIENTOS
   ------------------------------------------------------------
   Tambien se rehacen siempre, por lo mismo que las vistas.
   ============================================================ */
PRINT '';
PRINT '=== 7. PROCEDIMIENTOS ===';
GO

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

IF OBJECT_ID('dbo.sp_RecalcularContadores','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RecalcularContadores;
GO

/* NO suma: cuenta desde el historial. Asi, si alguna vez los
   contadores quedaron descuadrados, aqui se enderezan. */
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

/* El nombre viejo, que todavia se llama desde algunos lados */
CREATE PROCEDURE dbo.sp_RecalcularAusencias
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_RecalcularContadores;
END
GO

EXEC dbo.sp_RecalcularContadores;

PRINT '   Los 3 procedimientos quedaron al dia y los contadores recalculados.';
GO


/* ============================================================
   8. LOS PUESTOS
   ------------------------------------------------------------
   *** LA UNICA PARTE QUE HAY QUE TOCAR ***

   Escriba aqui los puestos del cliente, en el orden en que se
   recorren en la base. El numero es ese orden; despues el codigo
   que sale en los cuadros; despues la ubicacion, que puede ir
   vacia (N'').

   CUANDO SE APLICA:
     - En una instalacion nueva, siempre: la tabla esta vacia.
     - En una base que ya tiene puestos, NUNCA, para no pisarle
       lo suyo.

   PARA CAMBIARLOS EN UNA BASE QUE YA LOS TIENE, ponga la linea
   de abajo en 1 y vuelva a correr el script:

         SET @aplicar = 0;     <-- cambiela a 1

   Al aplicarla:
     - el puesto que ya existe se le acomoda orden y ubicacion,
       y queda activo;
     - el que no existia, entra;
     - el que ya no esta en la lista se APAGA, no se borra,
       porque los dias en que se uso tienen que seguir cuadrando.
   ============================================================ */
PRINT '';
PRINT '=== 8. PUESTOS ===';
GO

DECLARE @aplicar BIT;

SET @aplicar = 0;     /* <-- 1 para forzar la lista sobre una base que ya tiene puestos */

/* En una instalacion nueva se aplica sola */
IF NOT EXISTS (SELECT 1 FROM dbo.Puestos) SET @aplicar = 1;

IF @aplicar = 0
BEGIN
    DECLARE @hay INT = (SELECT COUNT(*) FROM dbo.Puestos);
    PRINT '   La base ya tiene ' + CAST(@hay AS VARCHAR(10)) +
          ' puesto(s): no se toca ninguno.';
END
ELSE
BEGIN
    IF OBJECT_ID('tempdb..#Puestos') IS NOT NULL DROP TABLE #Puestos;

    /* El COLLATE DATABASE_DEFAULT no es adorno.
       Una tabla temporal nace en tempdb, y hereda la intercalacion
       del SERVIDOR, no la de esta base. Si el servidor se instalo
       en ingles queda en SQL_Latin1_General_CP1_CI_AS mientras que
       la base es Modern_Spanish_CI_AS, y al comparar
       n.Codigo = p.Codigo SQL Server no sabe con cual de las dos
       reglas comparar: aborta con el error 468 y no entra ningun
       puesto.
       Con DATABASE_DEFAULT la columna toma la intercalacion de
       ESTA base y las dos partes hablan el mismo idioma. */
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
           p.Ubicacion = NULLIF(n.Ubicacion, N''),
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

    PRINT '   Nuevos: '     + CAST(@nuevos     AS VARCHAR(10)) +
          '   Acomodados: ' + CAST(@acomodados AS VARCHAR(10)) +
          '   Apagados: '   + CAST(@apagados   AS VARCHAR(10));
END
GO

IF EXISTS (SELECT 1 FROM dbo.Puestos WHERE Codigo LIKE N'PUESTO [123]')
BEGIN
    PRINT '';
    PRINT '   *** OJO: estan los puestos de EJEMPLO. ***';
    PRINT '   Vuelva al paso 8, escriba los del cliente, ponga @aplicar en 1';
    PRINT '   y corra el script otra vez.';
END
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
    CASE WHEN (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0) = 8
         THEN N'ya esta' ELSE N'FALTA' END AS Las_8_Tablas,

    CASE WHEN (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) = 4
         THEN N'ya esta' ELSE N'FALTA' END AS Las_4_Vistas,

    CASE WHEN (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) = 3
         THEN N'ya esta' ELSE N'FALTA' END AS Los_3_Procedimientos,

    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE name = 'CK_Oficiales_Horario'
                        AND definition LIKE N'%07:00 - 16:00%'
                        AND definition LIKE N'%Autorizado Externo%')
         THEN N'ya esta' ELSE N'FALTA' END AS Los_9_Roles,

    CASE WHEN COL_LENGTH('dbo.AsistenciaDiaria','Tipo') IS NOT NULL
     AND EXISTS (SELECT 1 FROM sys.check_constraints
                 WHERE name = 'CK_Asistencia_Tipo' AND definition LIKE N'%Vacante%')
     AND COL_LENGTH('dbo.ProyeccionDia','Tipo') IS NOT NULL
     AND EXISTS (SELECT 1 FROM sys.check_constraints
                 WHERE name = 'CK_Proy_Tipo' AND definition LIKE N'%Vacante%')
         THEN N'ya esta' ELSE N'FALTA' END AS Rol_Vacante_Extra,

    CASE WHEN COL_LENGTH('dbo.Puestos','Orden') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Orden_De_Puestos,

    CASE WHEN NOT EXISTS (
             SELECT 1
             FROM sys.indexes i
             INNER JOIN sys.index_columns ic
                     ON ic.object_id = i.object_id AND ic.index_id = i.index_id
             INNER JOIN sys.columns c
                     ON c.object_id = i.object_id AND c.column_id = ic.column_id
             WHERE i.object_id = OBJECT_ID('dbo.ProyeccionDia')
               AND i.is_unique = 1 AND i.is_primary_key = 0
               AND c.name = 'IdOficialSustituto')
         THEN N'ya esta' ELSE N'FALTA' END AS Extras_Permitidos;
GO

/* Lo que hay adentro. En una instalacion nueva todo va en cero
   menos los puestos; en una que ya venia trabajando, estos
   numeros tienen que ser los mismos de antes de correr esto. */
SELECT
    (SELECT COUNT(*) FROM dbo.Oficiales)        AS Oficiales,
    (SELECT COUNT(*) FROM dbo.Puestos)          AS Puestos,
    (SELECT COUNT(*) FROM dbo.AsistenciaDiaria) AS Asistencia,
    (SELECT COUNT(*) FROM dbo.Sustituciones)    AS Sustituciones,
    (SELECT COUNT(*) FROM dbo.ProyeccionDia)    AS Proyeccion,
    (SELECT COUNT(*) FROM dbo.Incapacidades)    AS Incapacidades;
GO

SELECT Orden, Codigo, Ubicacion, Activo
FROM   dbo.Puestos
ORDER  BY ISNULL(Orden, 2147483647), IdPuesto;
GO

DROP TABLE #Modo;
GO


/* ============================================================
   SI EL PROGRAMA LO ABRE OTRO USUARIO DE WINDOWS
   ------------------------------------------------------------
   El programa entra a la base con el usuario de Windows que
   tenga la sesion abierta, sin contrasena. Si ese usuario es el
   mismo que corrio este script, ya quedo listo.

   Si no, quite el comentario de las lineas de abajo, cambie el
   nombre por el del usuario o el grupo, y correlas. El nombre va
   como lo ve Windows, por ejemplo:

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
PRINT '=== LISTO. Cierre y vuelva a abrir el programa. ===';
PRINT '';
PRINT 'Si esta instalando un cliente nuevo, falta:';
PRINT '  1. Revisar arriba que los puestos sean los de el.';
PRINT '  2. Activar la licencia de esa computadora.';
PRINT '  3. Registrar el personal desde Registro de personal.';
PRINT '  4. Instalar el respaldo automatico: carpeta Mantenimiento,';
PRINT '     Instalar_Tareas.cmd, clic derecho y Ejecutar como';
PRINT '     administrador.';
GO
