/* ============================================================
   PlanillaVanguard  -  DIAGNOSTICO DE LA BASE
   ------------------------------------------------------------
   SOLO LEE. No crea, no modifica y no borra nada.

   Sirve para saber como esta una base antes de actualizarla:
   que version de SQL Server es, que tablas y restricciones
   tiene, si ya se le corrio la actualizacion, y con que datos
   quedaria trabajando el sistema.

   COMO CORRERLO
   -------------
   En SSMS:  abra este archivo, escoja la base arriba a la
             izquierda y presione F5.

   En consola:
       sqlcmd -S localhost -E -d PlanillaVanguard ^
              -i Diagnostico_Base.sql -o diagnostico.txt -W -s "|"

   Despues mande el resultado completo.
   ============================================================ */

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '===== 1. SERVIDOR =====';
GO

SELECT
    @@SERVERNAME                            AS Servidor,
    ISNULL(CAST(SERVERPROPERTY('InstanceName') AS NVARCHAR(128)),
           N'(instancia por defecto)')      AS Instancia,
    SERVERPROPERTY('ProductVersion')        AS Version,
    SERVERPROPERTY('Edition')               AS Edicion,
    DB_NAME()                               AS BaseActual;
GO

PRINT '===== 2. BASES DE DATOS EN ESTE SERVIDOR =====';
GO

SELECT name AS Base, state_desc AS Estado, collation_name AS Intercalacion
FROM   sys.databases
WHERE  database_id > 4
ORDER BY name;
GO

PRINT '===== 3. TABLAS Y CUANTAS FILAS TIENEN =====';
GO

SELECT
    t.name                  AS Tabla,
    SUM(p.rows)             AS Filas
FROM   sys.tables t
INNER JOIN sys.partitions p
        ON p.object_id = t.object_id AND p.index_id IN (0, 1)
GROUP BY t.name
ORDER BY t.name;
GO

PRINT '===== 4. COLUMNAS DE CADA TABLA =====';
GO

SELECT
    t.name                  AS Tabla,
    c.column_id             AS Orden,
    c.name                  AS Columna,
    ty.name                 AS Tipo,
    CASE WHEN ty.name LIKE N'n%char' THEN c.max_length / 2
         ELSE c.max_length END          AS Largo,
    c.is_nullable           AS AceptaNulos,
    c.is_identity           AS EsIdentity
FROM   sys.columns c
INNER JOIN sys.tables t  ON t.object_id = c.object_id
INNER JOIN sys.types  ty ON ty.user_type_id = c.user_type_id
ORDER BY t.name, c.column_id;
GO

PRINT '===== 5. RESTRICCIONES CHECK (aqui es donde falla el script) =====';
GO

SELECT
    OBJECT_NAME(cc.parent_object_id)    AS Tabla,
    cc.name                             AS Restriccion,
    cc.definition                       AS Regla,
    cc.is_disabled                      AS Deshabilitada,
    cc.is_not_trusted                   AS SinValidar
FROM   sys.check_constraints cc
ORDER BY Tabla, Restriccion;
GO

PRINT '===== 6. VALORES POR DEFECTO =====';
GO

SELECT
    OBJECT_NAME(dc.parent_object_id)    AS Tabla,
    c.name                              AS Columna,
    dc.name                             AS Restriccion,
    dc.definition                       AS Valor
FROM   sys.default_constraints dc
INNER JOIN sys.columns c
        ON c.object_id = dc.parent_object_id
       AND c.column_id = dc.parent_column_id
ORDER BY Tabla, Columna;
GO

PRINT '===== 7. LLAVES FORANEAS =====';
GO

SELECT
    fk.name                                 AS Llave,
    OBJECT_NAME(fk.parent_object_id)        AS Tabla,
    OBJECT_NAME(fk.referenced_object_id)    AS Apunta_a,
    fk.is_disabled                          AS Deshabilitada
FROM   sys.foreign_keys fk
ORDER BY Tabla, Llave;
GO

PRINT '===== 8. INDICES =====';
GO

SELECT
    OBJECT_NAME(i.object_id)    AS Tabla,
    i.name                      AS Indice,
    i.type_desc                 AS Tipo,
    i.is_unique                 AS Unico,
    i.is_primary_key            AS EsLlavePrimaria,
    i.has_filter                AS EsFiltrado,
    i.filter_definition         AS Filtro
FROM   sys.indexes i
INNER JOIN sys.tables t ON t.object_id = i.object_id
WHERE  i.name IS NOT NULL
ORDER BY Tabla, Indice;
GO

PRINT '===== 9. VISTAS Y PROCEDIMIENTOS =====';
GO

/* QuotedIdentOn en 0 es problema: esa vista o procedimiento
   se creo con la opcion apagada y va a fallar al usarse si la
   base tiene indices filtrados. */
SELECT
    o.type_desc                                             AS Clase,
    o.name                                                  AS Nombre,
    OBJECTPROPERTY(o.object_id, 'ExecIsQuotedIdentOn')      AS QuotedIdentOn,
    OBJECTPROPERTY(o.object_id, 'ExecIsAnsiNullsOn')        AS AnsiNullsOn,
    o.create_date                                           AS Creado,
    o.modify_date                                           AS Modificado
FROM   sys.objects o
WHERE  o.type IN ('V', 'P')
ORDER BY o.type_desc, o.name;
GO

PRINT '===== 10. QUE ROLES HAY REGISTRADOS =====';
GO

IF OBJECT_ID('dbo.Oficiales', 'U') IS NOT NULL
    SELECT
        N'[' + ISNULL(Horario, N'<NULO>') + N']'    AS Horario,
        LEN(Horario)                                AS Largo,
        COUNT(*)                                    AS Cuantos
    FROM   dbo.Oficiales
    GROUP BY Horario
    ORDER BY Horario;
ELSE PRINT '   No existe la tabla Oficiales.';
GO

PRINT '===== 11. DIAS LIBRES Y AUTORIZACIONES =====';
GO

IF OBJECT_ID('dbo.Oficiales', 'U') IS NOT NULL
BEGIN
    SELECT
        N'[' + ISNULL(DiaLibre, N'<NULO>') + N']'   AS DiaLibre,
        COUNT(*)                                    AS Cuantos
    FROM   dbo.Oficiales
    GROUP BY DiaLibre
    ORDER BY DiaLibre;

    SELECT
        N'[' + ISNULL(Autorizado, N'<NULO>') + N']' AS Autorizado,
        COUNT(*)                                    AS Cuantos
    FROM   dbo.Oficiales
    GROUP BY Autorizado
    ORDER BY Autorizado;

    SELECT
        COUNT(*)                                        AS TotalPersonal,
        SUM(CASE WHEN Activo = 1 THEN 1 ELSE 0 END)     AS Activos,
        SUM(CASE WHEN Activo = 0 THEN 1 ELSE 0 END)     AS Inactivos
    FROM   dbo.Oficiales;
END
GO

PRINT '===== 12. SI YA SE CORRIO LA ACTUALIZACION =====';
GO

SELECT
    CASE WHEN OBJECT_ID('dbo.Incapacidades', 'U') IS NULL
         THEN N'FALTA' ELSE N'ya esta' END        AS Tabla_Incapacidades,
    CASE WHEN OBJECT_ID('dbo.ProyeccionDia', 'U') IS NULL
         THEN N'FALTA' ELSE N'ya esta' END        AS Tabla_ProyeccionDia,
    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%14:00 - 21:00%')
         THEN N'ya esta' ELSE N'FALTA' END        AS Turno_14_a_21,
    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%06:00 - 12:00%'
                        AND definition LIKE N'%07:00 - 16:00%'
                        AND definition LIKE N'%12:00 - 18:00%')
         THEN N'ya esta' ELSE N'FALTA' END        AS Turnos_Cortos,
    CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints
                      WHERE parent_object_id = OBJECT_ID('dbo.Oficiales')
                        AND definition LIKE N'%Autorizado Externo%')
         THEN N'ya esta' ELSE N'FALTA' END        AS Rol_Autorizado_Externo,
    CASE WHEN OBJECT_ID('dbo.sp_Proyeccion', 'P') IS NULL
         THEN N'FALTA' ELSE N'ya esta' END        AS Procedimiento_sp_Proyeccion;
GO

PRINT '===== 13. MOVIMIENTO REGISTRADO =====';
GO

IF OBJECT_ID('dbo.AsistenciaDiaria', 'U') IS NOT NULL
    SELECT
        MIN(Fecha)          AS PrimerDia,
        MAX(Fecha)          AS UltimoDia,
        COUNT(DISTINCT Fecha) AS DiasConLista,
        COUNT(*)            AS LineasDeAsistencia
    FROM   dbo.AsistenciaDiaria;
GO

IF OBJECT_ID('dbo.AsistenciaDiaria', 'U') IS NOT NULL
    SELECT Turno, COUNT(*) AS Lineas
    FROM   dbo.AsistenciaDiaria
    GROUP BY Turno
    ORDER BY Turno;
GO

PRINT '===== FIN DEL DIAGNOSTICO =====';
GO
