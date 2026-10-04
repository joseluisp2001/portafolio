/* ============================================================
   PlanillaVanguard  -  LA BAJA LIBERA LA PLAZA
   ------------------------------------------------------------
   Es la pieza que el sistema administrativo ya tenia y que aqui
   faltaba: cuando a un oficial se le da de baja, su plaza queda
   VACANTE sola.

   Hasta ahora eran dos pasos que habia que acordarse de hacer,
   y en orden: dar de baja a la persona en Editar personal, y
   despues ir a Vacantes y decir que el titular salio. Si se
   hacia solo el primero, la plaza seguia apareciendo "Ocupada"
   por alguien que ya no trabaja, y el numero de vacantes sin
   cubrir salia mas bajo que la realidad sin que nada avisara.

   Con esto la base lo hace sola, y da igual el orden:

       Se da de baja primero  ->  la plaza queda vacante en el
                                  acto, con motivo 'Otro'. El
                                  motivo de verdad se pone
                                  despues desde Vacantes, con el
                                  boton "Corregir el motivo".

       Se pasa por Vacantes   ->  la plaza ya quedo vacante con
       primero                    su motivo bien puesto, y la
                                  baja no le hace nada mas.

   Y de paso, si esa persona estaba cubriendo la plaza de otro,
   esa cobertura se suelta: quien no trabaja no puede estar
   cubriendo nada.

   ADITIVO. No borra datos, no cambia ninguna tabla, ninguna
   vista ni ningun procedimiento de los que ya estaban. Lo unico
   que agrega es un disparador sobre dbo.Oficiales. Se puede
   correr varias veces.

   ANTES hay que haber corrido PlanillaVanguard_VACANTES.sql:
   sin el cuadro de plazas esto no tiene sobre que trabajar.

   Ejecute el archivo COMPLETO (F5 sin seleccionar nada).
   Si la base se llama distinto, cambie el USE de abajo.
   ============================================================ */

USE PlanillaVanguard;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '=== LA BAJA LIBERA LA PLAZA ===';
GO

/* ------------------------------------------------------------
   0. Sin el cuadro de plazas no hay nada que hacer. Se para
      aqui mismo, con el aviso, en vez de fallar mas adelante
      con un error de SQL que no le dice nada a nadie.
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.Plazas','U') IS NULL
BEGIN
    PRINT '';
    PRINT '   FALTA UN PASO PREVIO.';
    PRINT '   Esta base todavia no tiene el cuadro de plazas.';
    PRINT '   Corra primero PlanillaVanguard_VACANTES.sql y despues este.';
    PRINT '';
    SET NOEXEC ON;
END
GO


/* ------------------------------------------------------------
   1. LO QUE YA ESTUVIERA DESCUADRADO

      El disparador trabaja de aqui en adelante: atiende la baja
      cuando ocurre. Lo que se haya dado de baja ANTES de correr
      este script no lo toca, porque ese cambio ya paso.

      Esta consulta muestra esos casos, si los hay. No corrige
      nada a proposito: cada uno se arregla desde la pantalla de
      Vacantes, con "Salio el titular" o "Quitar cobertura", que
      ademas pregunta el motivo de verdad.
   ------------------------------------------------------------ */
PRINT '';
PRINT '--- Plazas descuadradas de antes (si sale vacio, no hay nada que arreglar) ---';
GO

SELECT p.IdPlaza                        AS [Plaza],
       p.Rol                            AS [Rol],
       ISNULL(p.Codigo, N'')            AS [Codigo],
       p.Estado                         AS [Estado],
       o.Nombre                         AS [Persona],
       N'Es titular y ya esta inactivo' AS [Que pasa]
FROM   dbo.Plazas p
INNER JOIN dbo.Oficiales o ON o.IdOficial = p.IdOficialTitular
WHERE  o.Activo = 0

UNION ALL

SELECT p.IdPlaza, p.Rol, ISNULL(p.Codigo, N''), p.Estado, o.Nombre,
       N'La esta cubriendo y ya esta inactivo'
FROM   dbo.Plazas p
INNER JOIN dbo.Oficiales o ON o.IdOficial = p.IdOficialCubre
WHERE  o.Activo = 0

ORDER BY [Que pasa], [Rol];
GO


/* ------------------------------------------------------------
   2. CUANDO Y POR QUE SE FUE

      Dos columnas nuevas en dbo.Oficiales, las mismas que ya
      tiene el sistema administrativo. Sin ellas el dato del por
      que vive solo en la plaza, y ahi se borra el dia que la
      plaza vuelve a tener titular: el ano entrante ya no habria
      como saber por que se fue quien se fue.

      Las dos entran NULL y sin valor por defecto: eso es un
      cambio de rotulo, no reescribe ni una fila de las que ya
      estan. Quien ya estaba inactivo se queda con las dos en
      blanco, que es la verdad: ese dato no se guardo nunca.
   ------------------------------------------------------------ */
PRINT '';
PRINT '--- Cuando y por que se fue ---';
GO

IF COL_LENGTH('dbo.Oficiales', 'FechaSalida') IS NULL
BEGIN
    ALTER TABLE dbo.Oficiales ADD FechaSalida DATE NULL;
    PRINT '   Columna FechaSalida agregada.';
END
ELSE PRINT '   FechaSalida ya existia.';
GO

IF COL_LENGTH('dbo.Oficiales', 'MotivoSalida') IS NULL
BEGIN
    ALTER TABLE dbo.Oficiales ADD MotivoSalida NVARCHAR(40) NULL;
    PRINT '   Columna MotivoSalida agregada.';
END
ELSE PRINT '   MotivoSalida ya existia.';
GO

/* Los mismos motivos que acepta una plaza vacante, menos
   'Plaza nueva': una plaza nueva no es un motivo por el que una
   persona se va. Asi cualquier motivo de salida sirve tal cual
   como motivo de la vacante, sin traducciones de por medio.

   Va en su propio lote porque una columna recien agregada no se
   puede nombrar en el mismo lote en que nacio. */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_Oficiales_MotivoSalida'
                 AND parent_object_id = OBJECT_ID('dbo.Oficiales'))
BEGIN
    ALTER TABLE dbo.Oficiales WITH CHECK
        ADD CONSTRAINT CK_Oficiales_MotivoSalida CHECK
        (
            MotivoSalida IS NULL OR MotivoSalida IN
            (N'Renuncia', N'Abandono', N'Despido', N'Fin de contrato',
             N'Sin portacion', N'Traslado', N'Otro')
        );

    PRINT '   Restriccion CK_Oficiales_MotivoSalida puesta.';
END
ELSE PRINT '   CK_Oficiales_MotivoSalida ya existia.';
GO

/* A proposito NO se pone una restriccion que obligue a que todo
   inactivo tenga fecha y motivo. Los que ya estaban de baja no
   los tienen y no hay de donde sacarlos, y una regla asi
   ademas trabaria el dia que alguien vuelve a entrar. Lo que
   pide los datos es la pantalla, no la base. */


/* ------------------------------------------------------------
   3. EL DISPARADOR

      Se dispara solo cuando el oficial PASA de activo a
      inactivo. Ni al registrarlo, ni al corregirle el telefono,
      ni al reactivarlo.

      Va con JOIN a inserted y deleted, y no con un numero
      suelto, porque una sola instruccion puede apagar a varias
      personas de un golpe y hay que atenderlas a todas.

      No escribe en dbo.Oficiales, asi que no se llama a si
      mismo.
   ------------------------------------------------------------ */
IF OBJECT_ID('dbo.tr_Oficiales_BajaLiberaPlaza','TR') IS NOT NULL
    DROP TRIGGER dbo.tr_Oficiales_BajaLiberaPlaza;
GO

CREATE TRIGGER dbo.tr_Oficiales_BajaLiberaPlaza
ON dbo.Oficiales
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    /* Si el guardado ni siquiera menciono esa columna no hay
       nada que mirar, que es el caso de casi todos. */
    IF NOT UPDATE(Activo) RETURN;

    IF NOT EXISTS (SELECT 1
                   FROM inserted i
                   INNER JOIN deleted d ON d.IdOficial = i.IdOficial
                   WHERE d.Activo = 1 AND i.Activo = 0)
        RETURN;

    DECLARE @Hoy DATE = CAST(GETDATE() AS DATE);

    /* -- Su plaza queda vacante --

       El motivo y la fecha son los mismos de la salida de la
       persona, que es lo que la pantalla de bajas acaba de
       preguntar. Los motivos son la misma lista, asi que pasan
       tal cual.

       Si por lo que sea vinieran en blanco -- una baja hecha
       desde la casilla "Persona activa", o desde otro lado --,
       la plaza queda en 'Otro' y con la fecha de hoy, y en la
       nota queda dicho que el motivo se puede corregir. */
    UPDATE p
    SET    Estado           = N'Vacante',
           IdOficialTitular = NULL,
           IdOficialSalio   = i.IdOficial,
           MotivoVacante    = CASE WHEN ISNULL(i.MotivoSalida, N'') = N''
                                   THEN N'Otro' ELSE i.MotivoSalida END,
           FechaVacante     = ISNULL(i.FechaSalida, @Hoy),
           IdOficialCubre   = NULL,
           Observacion      = CASE
                                  WHEN ISNULL(p.Observacion, N'') <> N''
                                       THEN p.Observacion
                                  WHEN ISNULL(i.MotivoSalida, N'') = N''
                                       THEN N'Quedo vacante sola al dar de baja al ' +
                                            N'titular, sin motivo anotado. Se corrige ' +
                                            N'desde Vacantes.'
                                  ELSE NULL
                              END
    FROM   dbo.Plazas p
    INNER JOIN inserted i ON i.IdOficial = p.IdOficialTitular
    INNER JOIN deleted  d ON d.IdOficial = i.IdOficial
    WHERE  d.Activo = 1 AND i.Activo = 0;

    /* -- Y suelta lo que estuviera cubriendo -- */
    UPDATE p
    SET    IdOficialCubre = NULL
    FROM   dbo.Plazas p
    INNER JOIN inserted i ON i.IdOficial = p.IdOficialCubre
    INNER JOIN deleted  d ON d.IdOficial = i.IdOficial
    WHERE  d.Activo = 1 AND i.Activo = 0;
END
GO

PRINT '   Disparador tr_Oficiales_BajaLiberaPlaza puesto.';
GO


/* ============================================================
   COMO QUEDO
   ============================================================ */
PRINT '';
PRINT '============================================================';
PRINT ' COMO QUEDO';
PRINT '============================================================';
GO

SELECT CASE WHEN COL_LENGTH('dbo.Oficiales','FechaSalida') IS NOT NULL
            THEN N'ya esta' ELSE N'FALTA' END AS Fecha_De_Salida,

       CASE WHEN COL_LENGTH('dbo.Oficiales','MotivoSalida') IS NOT NULL
            THEN N'ya esta' ELSE N'FALTA' END AS Motivo_De_Salida,

       CASE WHEN OBJECT_ID('dbo.tr_Oficiales_BajaLiberaPlaza','TR') IS NOT NULL
            THEN N'ya esta' ELSE N'FALTA' END AS La_Baja_Libera_La_Plaza;
GO

/* Nada de esto se perdio: son los mismos conteos de antes de
   correr el script. */
SELECT
    (SELECT COUNT(*) FROM dbo.Oficiales)                        AS Oficiales,
    (SELECT COUNT(*) FROM dbo.Oficiales WHERE Activo = 1)       AS Activos,
    (SELECT COUNT(*) FROM dbo.Plazas)                           AS Plazas,
    (SELECT COUNT(*) FROM dbo.Plazas WHERE Estado = N'Vacante') AS Vacantes;
GO

PRINT '';
PRINT '=== LISTO. De ahora en adelante, al dar de baja a alguien ===';
PRINT '    su plaza queda vacante sola. El motivo se corrige en';
PRINT '    la pantalla de Vacantes.';
GO

SET NOEXEC OFF;
GO
