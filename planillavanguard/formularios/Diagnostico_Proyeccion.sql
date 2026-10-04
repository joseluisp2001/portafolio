/* ============================================================
   PlanillaVanguard  -  DIAGNOSTICO DE LA PANTALLA DE PROYECCION
   ------------------------------------------------------------
   SOLO LEE. No crea, no modifica y no borra nada.

   Para que sirve
   --------------
   La grilla de proyeccion arma cada celda con un dato de la
   base. Si un dato viene de una forma que la grilla no espera
   (un horario con un espacio de mas, un motivo que ya no esta
   en la lista, un puesto borrado que todavia aparece guardado,
   un nombre nulo), Windows corta el dibujado y saca el cuadro
   gris de "el valor con formato de la celda tiene un tipo
   erroneo", y la pantalla queda a medio llenar: por eso debajo
   de un encabezado de horario pueden aparecer oficiales de
   otro.

   Este archivo busca justo esos datos. Cada bloque dice si esta
   BIEN o cuantas filas hay que corregir.

   COMO CORRERLO
   -------------
   En SSMS:  abra el archivo, escoja la base PlanillaVanguard
             arriba a la izquierda y presione F5.

   En consola:
       sqlcmd -S localhost -E -d PlanillaVanguard ^
              -i Diagnostico_Proyeccion.sql -o diagnostico_proyeccion.txt -W -s "|"

   Despues mande el archivo completo.
   ============================================================ */

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '===== 1. LOS OCHO HORARIOS OFICIALES =====';
PRINT 'Lo que el sistema conoce: 06:00 - 12:00, 06:00 - 14:00, 07:00 - 16:00,';
PRINT '12:00 - 18:00, 14:00 - 18:00, 14:00 - 21:00, 18:00 - 00:00, 00:00 - 06:00';
PRINT 'mas el rol Autorizado Externo.';
GO

SELECT
    o.Horario                                   AS Horario,
    N'[' + o.Horario + N']'                     AS ComoEstaGuardado,
    LEN(o.Horario)                              AS Largo,
    COUNT(*)                                    AS Oficiales,
    CASE
        WHEN o.Horario <> LTRIM(RTRIM(o.Horario))          THEN N'MAL: tiene espacios al inicio o al final'
        WHEN o.Horario COLLATE Latin1_General_BIN NOT IN (
                N'06:00 - 12:00', N'06:00 - 14:00', N'07:00 - 16:00',
                N'12:00 - 18:00', N'14:00 - 18:00', N'14:00 - 21:00',
                N'18:00 - 00:00', N'00:00 - 06:00', N'Autorizado Externo')
                                                            THEN N'MAL: no es ninguno de los horarios oficiales'
        ELSE N'bien'
    END                                         AS Estado
FROM dbo.Oficiales o
WHERE o.Activo = 1
GROUP BY o.Horario
ORDER BY Estado DESC, o.Horario;
GO

PRINT '===== 2. DIAS LIBRES =====';
PRINT 'Si el dia libre esta escrito distinto, al oficial le toca trabajar todos los dias.';
GO

SELECT
    o.DiaLibre                                  AS DiaLibre,
    N'[' + o.DiaLibre + N']'                    AS ComoEstaGuardado,
    COUNT(*)                                    AS Oficiales,
    CASE WHEN o.DiaLibre COLLATE Latin1_General_BIN NOT IN (
              N'Lunes', N'Martes', N'Miercoles', N'Jueves',
              N'Viernes', N'Sabado', N'Domingo', N'Ninguno')
         THEN N'MAL: no es un dia que el sistema conozca' ELSE N'bien' END AS Estado
FROM dbo.Oficiales o
WHERE o.Activo = 1
GROUP BY o.DiaLibre
ORDER BY Estado DESC, o.DiaLibre;
GO

PRINT '===== 3. DATOS DE TEXTO VACIOS O NULOS =====';
PRINT 'La grilla los lee como texto obligatorio: un nulo corta la carga.';
GO

SELECT
    SUM(CASE WHEN o.Nombre  IS NULL OR LTRIM(RTRIM(o.Nombre))  = N'' THEN 1 ELSE 0 END) AS NombresVacios,
    SUM(CASE WHEN o.Cedula  IS NULL OR LTRIM(RTRIM(o.Cedula))  = N'' THEN 1 ELSE 0 END) AS CedulasVacias,
    SUM(CASE WHEN o.Horario IS NULL                                  THEN 1 ELSE 0 END) AS HorariosNulos,
    SUM(CASE WHEN o.DiaLibre IS NULL                                 THEN 1 ELSE 0 END) AS DiasLibresNulos
FROM dbo.Oficiales o
WHERE o.Activo = 1;
GO

SELECT IdOficial, N'[' + ISNULL(Nombre, N'(nulo)') + N']' AS Nombre,
       N'[' + ISNULL(Cedula, N'(nulo)') + N']' AS Cedula, Horario
FROM dbo.Oficiales
WHERE Activo = 1
  AND (Nombre IS NULL OR LTRIM(RTRIM(Nombre)) = N''
    OR Cedula IS NULL OR LTRIM(RTRIM(Cedula)) = N'');
GO

PRINT '===== 4. MOTIVOS DE LA PROYECCION =====';
PRINT 'La lista del desplegable es: Incapacidad, Vacaciones, Permiso, Renuncia, Otro.';
GO

IF OBJECT_ID('dbo.ProyeccionDia', 'U') IS NULL
    PRINT '   ATENCION: la tabla dbo.ProyeccionDia NO EXISTE en esta base.';
ELSE
    EXEC sp_executesql N'
        SELECT
            ISNULL(pr.Motivo, N''(nulo)'')      AS Motivo,
            N''['' + ISNULL(pr.Motivo, N'''') + N'']'' AS ComoEstaGuardado,
            COUNT(*)                            AS Filas,
            CASE
                WHEN pr.Motivo IS NULL THEN N''bien (sin motivo)''
                WHEN pr.Motivo <> LTRIM(RTRIM(pr.Motivo)) THEN N''MAL: espacios de sobra''
                WHEN pr.Motivo COLLATE Latin1_General_BIN NOT IN (
                        N'''', N''Incapacidad'', N''Vacaciones'', N''Permiso'',
                        N''Renuncia'', N''Otro'')
                     THEN N''MAL: no esta en la lista del desplegable''
                ELSE N''bien''
            END                                 AS Estado
        FROM dbo.ProyeccionDia pr
        GROUP BY pr.Motivo
        ORDER BY Estado DESC, pr.Motivo;';
GO

PRINT '===== 5. PUESTOS QUE YA NO EXISTEN =====';
PRINT 'Un puesto borrado de la tabla, pero todavia guardado en un plan o en la asistencia.';
GO

IF OBJECT_ID('dbo.ProyeccionDia', 'U') IS NOT NULL
    EXEC sp_executesql N'
        SELECT N''ProyeccionDia'' AS Tabla, pr.IdPuesto AS PuestoQueNoExiste, COUNT(*) AS Filas
        FROM dbo.ProyeccionDia pr
        WHERE pr.IdPuesto IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM dbo.Puestos p WHERE p.IdPuesto = pr.IdPuesto)
        GROUP BY pr.IdPuesto;';
GO

SELECT N'AsistenciaDiaria' AS Tabla, a.IdPuesto AS PuestoQueNoExiste, COUNT(*) AS Filas
FROM dbo.AsistenciaDiaria a
WHERE a.IdPuesto IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.Puestos p WHERE p.IdPuesto = a.IdPuesto)
GROUP BY a.IdPuesto;
GO

PRINT '===== 6. PUESTOS CON EL CODIGO VACIO =====';
GO

SELECT IdPuesto, N'[' + ISNULL(Codigo, N'(nulo)') + N']' AS Codigo,
       N'[' + ISNULL(Ubicacion, N'(nulo)') + N']' AS Ubicacion, Activo
FROM dbo.Puestos
WHERE Codigo IS NULL OR LTRIM(RTRIM(Codigo)) = N'';
GO

PRINT '===== 7. LA COLUMNA Disponible DEL PLAN =====';
PRINT 'Si acepta nulos, la casilla de la grilla se queda sin valor y se traba el dibujado.';
GO

IF OBJECT_ID('dbo.ProyeccionDia', 'U') IS NOT NULL
    SELECT c.name AS Columna, t.name AS Tipo,
           CASE WHEN c.is_nullable = 1 THEN N'MAL: acepta nulos' ELSE N'bien: NOT NULL' END AS Estado
    FROM sys.columns c
    INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
    WHERE c.object_id = OBJECT_ID('dbo.ProyeccionDia')
      AND c.name IN ('Disponible', 'Turno', 'Fecha', 'IdOficial');
GO

IF OBJECT_ID('dbo.ProyeccionDia', 'U') IS NOT NULL
    EXEC sp_executesql N'
        SELECT COUNT(*) AS FilasDelPlanConDisponibleNulo
        FROM dbo.ProyeccionDia WHERE Disponible IS NULL;';
GO

PRINT '===== 8. SUSTITUTOS Y OFICIALES QUE YA NO ESTAN =====';
GO

IF OBJECT_ID('dbo.ProyeccionDia', 'U') IS NOT NULL
    EXEC sp_executesql N'
        SELECT
            (SELECT COUNT(*) FROM dbo.ProyeccionDia pr
             WHERE NOT EXISTS (SELECT 1 FROM dbo.Oficiales o
                               WHERE o.IdOficial = pr.IdOficial))
                AS PlanesDeOficialesQueNoExisten,
            (SELECT COUNT(*) FROM dbo.ProyeccionDia pr
             WHERE pr.IdOficialSustituto IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM dbo.Oficiales o
                               WHERE o.IdOficial = pr.IdOficialSustituto))
                AS SustitutosQueNoExisten;';
GO

PRINT '===== 9. ESTADOS DE LA ASISTENCIA =====';
PRINT 'Solo valen Presente, Ausente e Incapacidad.';
GO

SELECT a.Estado, COUNT(*) AS Filas,
       CASE WHEN a.Estado COLLATE Latin1_General_BIN
                 NOT IN (N'Presente', N'Ausente', N'Incapacidad')
            THEN N'MAL: estado desconocido' ELSE N'bien' END AS Revision
FROM dbo.AsistenciaDiaria a
GROUP BY a.Estado
ORDER BY Revision DESC;
GO

PRINT '===== 10. OBJETOS QUE EL SISTEMA NECESITA =====';
GO

SELECT N'ProyeccionDia'            AS Objeto, N'tabla'         AS Tipo,
       CASE WHEN OBJECT_ID('dbo.ProyeccionDia','U')          IS NULL THEN N'FALTA' ELSE N'esta' END AS Estado
UNION ALL SELECT N'Puestos', N'tabla',
       CASE WHEN OBJECT_ID('dbo.Puestos','U')                IS NULL THEN N'FALTA' ELSE N'esta' END
UNION ALL SELECT N'Incapacidades', N'tabla',
       CASE WHEN OBJECT_ID('dbo.Incapacidades','U')          IS NULL THEN N'FALTA' ELSE N'esta' END
UNION ALL SELECT N'TurnosCerrados', N'tabla',
       CASE WHEN OBJECT_ID('dbo.TurnosCerrados','U')         IS NULL THEN N'FALTA' ELSE N'esta' END
UNION ALL SELECT N'ReportesDiarios', N'tabla',
       CASE WHEN OBJECT_ID('dbo.ReportesDiarios','U')        IS NULL THEN N'FALTA' ELSE N'esta' END
UNION ALL SELECT N'Sustituciones', N'tabla',
       CASE WHEN OBJECT_ID('dbo.Sustituciones','U')          IS NULL THEN N'FALTA' ELSE N'esta' END
UNION ALL SELECT N'vw_ProyeccionDia', N'vista',
       CASE WHEN OBJECT_ID('dbo.vw_ProyeccionDia','V')       IS NULL THEN N'FALTA' ELSE N'esta' END
UNION ALL SELECT N'vw_Incapacidades', N'vista',
       CASE WHEN OBJECT_ID('dbo.vw_Incapacidades','V')       IS NULL THEN N'FALTA' ELSE N'esta' END
UNION ALL SELECT N'sp_RecalcularContadores', N'procedimiento',
       CASE WHEN OBJECT_ID('dbo.sp_RecalcularContadores','P') IS NULL THEN N'FALTA' ELSE N'esta' END;
GO

PRINT '===== FIN DEL DIAGNOSTICO =====';
PRINT 'Todo lo que diga MAL o FALTA es lo que hay que corregir.';
GO
