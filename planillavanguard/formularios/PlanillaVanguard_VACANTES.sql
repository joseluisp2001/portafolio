/* ============================================================
   PlanillaVanguard  -  VACANTES (PLAZAS)
   ------------------------------------------------------------
   Es lo mismo que ya tiene PlanillaVanguardAdmin, pero para una
   sola base: la 105.

   Una PLAZA es el puesto de trabajo, no la persona. Existe
   aunque nadie la ocupe, y ese es todo el punto: asi se puede
   decir que la base tiene 79 plazas, 65 ocupadas, 6 vacantes y
   8 bloqueadas.

   Los tres estados:

       Ocupada    tiene titular trabajando
       Vacante    el titular salio y todavia no hay reemplazo.
                  Se guarda quien salio, por que, desde cuando,
                  y quien la esta cubriendo mientras tanto.
       Bloqueada  la plaza existe en el papel pero no se va a
                  llenar. No cuenta como vacante por resolver.

   Hoy eso se anota a mano en el nombre del Excel, cosas como
   "VACANTE por Maria Lizeth Molina Carrillo". Aqui cada dato
   va en su campo y se puede consultar.

   ADITIVO. No borra nada, no toca ninguna tabla de las que ya
   estaban ni ninguno de los procedimientos. Se puede correr
   varias veces sin problema: lo que ya existe no se vuelve a
   crear.

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

PRINT '=== VACANTES (PLAZAS) ===';
GO


/* ------------------------------------------------------------
   1. LA TABLA

   El ROL se guarda como texto, igual que en Oficiales.Horario,
   y a proposito no lleva restriccion de valores: los turnos de
   la base ya cambiaron una vez (los cortos se agregaron
   despues) y no tiene sentido que agregar un turno obligue a
   venir a tocar esta tabla. El programa solo ofrece los roles
   que existen.
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Plazas','U') IS NULL
BEGIN
    CREATE TABLE dbo.Plazas
    (
        IdPlaza  INT IDENTITY(1,1) NOT NULL,

        /* Con que rol trabaja quien la ocupe */
        Rol      NVARCHAR(20) NOT NULL,

        /* Opcional: si la base numera sus plazas, aqui va */
        Codigo   NVARCHAR(20) NULL,

        Estado   NVARCHAR(15) NOT NULL
                 CONSTRAINT DF_Plazas_Estado DEFAULT (N'Vacante'),

        /* Quien la ocupa hoy */
        IdOficialTitular INT NULL,

        /* ---- Solo cuando esta vacante ---- */
        IdOficialSalio   INT NULL,   -- el titular anterior
        MotivoVacante    NVARCHAR(40) NULL,
        FechaVacante     DATE         NULL,
        IdOficialCubre   INT NULL,    -- quien la cubre mientras tanto

        Observacion   NVARCHAR(300) NULL,
        FechaRegistro DATETIME2 NOT NULL
            CONSTRAINT DF_Plazas_Registro DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_Plazas PRIMARY KEY (IdPlaza),

        CONSTRAINT FK_Plazas_Titular FOREIGN KEY (IdOficialTitular)
            REFERENCES dbo.Oficiales(IdOficial),
        CONSTRAINT FK_Plazas_Salio   FOREIGN KEY (IdOficialSalio)
            REFERENCES dbo.Oficiales(IdOficial),
        CONSTRAINT FK_Plazas_Cubre   FOREIGN KEY (IdOficialCubre)
            REFERENCES dbo.Oficiales(IdOficial),

        CONSTRAINT CK_Plazas_Estado CHECK
            (Estado IN (N'Ocupada', N'Vacante', N'Bloqueada')),

        /* La ocupada tiene titular; la vacante y la bloqueada no */
        CONSTRAINT CK_Plazas_Titular CHECK
        (
            (Estado =  N'Ocupada' AND IdOficialTitular IS NOT NULL)
            OR
            (Estado <> N'Ocupada' AND IdOficialTitular IS NULL)
        ),

        /* Solo la vacante puede tener a alguien cubriendola.
           Una bloqueada no se cubre: no se va a llenar. */
        CONSTRAINT CK_Plazas_Cubre CHECK
            (Estado = N'Vacante' OR (IdOficialCubre IS NULL
                                 AND IdOficialSalio IS NULL
                                 AND MotivoVacante  IS NULL)),

        CONSTRAINT CK_Plazas_MotivoVac CHECK
        (
            MotivoVacante IS NULL OR MotivoVacante IN
            (N'Renuncia', N'Abandono', N'Despido', N'Fin de contrato',
             N'Sin portacion', N'Traslado', N'Plaza nueva', N'Otro')
        ),

        /* Nadie se cubre a si mismo */
        CONSTRAINT CK_Plazas_Distintos CHECK
            (IdOficialCubre IS NULL OR IdOficialCubre <> IdOficialSalio)
    );

    PRINT '   Tabla Plazas creada.';
END
ELSE PRINT '   Plazas ya existia: no se toca.';
GO

/* Un oficial ocupa una sola plaza. Filtrado, porque las
   vacantes y las bloqueadas dejan el titular en NULL y NULL si
   se puede repetir. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UQ_Plazas_Titular'
                 AND object_id = OBJECT_ID('dbo.Plazas'))
BEGIN
    EXEC(N'CREATE UNIQUE INDEX UQ_Plazas_Titular ON dbo.Plazas(IdOficialTitular)
               WHERE IdOficialTitular IS NOT NULL;');
    PRINT '   Indice UQ_Plazas_Titular puesto.';
END
ELSE PRINT '   UQ_Plazas_Titular ya existia.';
GO


/* ------------------------------------------------------------
   2. LAS VISTAS

   vw_Plazas   todas, como se ven en pantalla
   vw_Vacantes solo las vacantes, con quien salio y quien cubre
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.vw_Plazas','V') IS NOT NULL DROP VIEW dbo.vw_Plazas;
GO

CREATE VIEW dbo.vw_Plazas
AS
SELECT
    pl.IdPlaza,
    pl.Rol,
    pl.Codigo      AS Plaza,
    pl.Estado,
    tit.Nombre     AS TitularNombre,
    tit.Cedula     AS TitularCedula,
    sal.Nombre     AS SalioNombre,
    sal.Cedula     AS SalioCedula,
    pl.MotivoVacante,
    pl.FechaVacante,
    DATEDIFF(DAY, pl.FechaVacante, CAST(GETDATE() AS DATE)) AS DiasVacante,
    cub.Nombre     AS CubreNombre,
    cub.Cedula     AS CubreCedula,
    ISNULL(cub.Horario, N'') AS CubreRol,
    CASE WHEN pl.Estado <> N'Vacante'    THEN N''
         WHEN pl.IdOficialCubre IS NULL  THEN N'SIN CUBRIR'
         ELSE N'Cubierta' END AS Cobertura,
    pl.Observacion
FROM dbo.Plazas pl
LEFT JOIN dbo.Oficiales tit ON tit.IdOficial = pl.IdOficialTitular
LEFT JOIN dbo.Oficiales sal ON sal.IdOficial = pl.IdOficialSalio
LEFT JOIN dbo.Oficiales cub ON cub.IdOficial = pl.IdOficialCubre;
GO

PRINT '   Vista vw_Plazas lista.';
GO

IF OBJECT_ID('dbo.vw_Vacantes','V') IS NOT NULL DROP VIEW dbo.vw_Vacantes;
GO

CREATE VIEW dbo.vw_Vacantes
AS
SELECT *
FROM dbo.vw_Plazas
WHERE Estado = N'Vacante';
GO

PRINT '   Vista vw_Vacantes lista.';
GO


/* ============================================================
   COMO QUEDO
   ------------------------------------------------------------
   Las tres comprobaciones tienen que decir 'ya esta'.
   ============================================================ */
PRINT '';
PRINT '============================================================';
PRINT ' COMO QUEDO';
PRINT '============================================================';
GO

SELECT
    CASE WHEN OBJECT_ID('dbo.Plazas','U') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Tabla_Plazas,

    CASE WHEN OBJECT_ID('dbo.vw_Plazas','V') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Vista_Plazas,

    CASE WHEN OBJECT_ID('dbo.vw_Vacantes','V') IS NOT NULL
         THEN N'ya esta' ELSE N'FALTA' END AS Vista_Vacantes;
GO

/* Nada de esto se perdio: los conteos son los mismos de antes
   de correr el script. */
SELECT
    (SELECT COUNT(*) FROM dbo.Oficiales)        AS Oficiales,
    (SELECT COUNT(*) FROM dbo.Puestos)          AS Puestos,
    (SELECT COUNT(*) FROM dbo.AsistenciaDiaria) AS Asistencia,
    (SELECT COUNT(*) FROM dbo.Sustituciones)    AS Sustituciones,
    (SELECT COUNT(*) FROM dbo.Plazas)           AS Plazas;
GO

PRINT '';
PRINT '=== LISTO. Abra el programa y entre a Vacantes. ===';
PRINT '    La tabla arranca vacia: las plazas se agregan desde';
PRINT '    esa misma pantalla, con el boton Nueva plaza.';
GO
