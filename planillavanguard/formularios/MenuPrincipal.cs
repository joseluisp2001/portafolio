using GestorDatos;

namespace formularios
{
    public partial class MenuPrincipal : Form
    {
        public MenuPrincipal()
        {
            InitializeComponent();
            AplicarEstilo();
        }

        private void AplicarEstilo()
        {
            Estilo.Formulario(this);

            Estilo.Banda(pnlBanda);

            // El logo va a la izquierda y el nombre se corre para no
            // quedar encima. Si el logo no carga, todo queda como antes.
            int finLogo = Estilo.LogoEnBanda(pnlBanda, 84, 40);
            if (finLogo > 0)
            {
                lblMarca.Left = finLogo + 26;
                lblLema.Left = finLogo + 29;
            }

            lblMarca.Font = Estilo.TituloGrande;
            lblMarca.ForeColor = Color.White;
            lblMarca.BackColor = Color.Transparent;
            Estilo.SubtituloBanda(lblLema);
            lblLema.AutoSize = false;

            lblSeccion.Font = Estilo.Titulo;
            lblSeccion.ForeColor = Estilo.Azul;

            // Operacion diaria en azul relleno
            Estilo.Primario(btnAsistencia);
            Estilo.Primario(btnSustituciones);
            Estilo.Primario(btnProyeccion);
            Estilo.Primario(btnIncapacidades);
            Estilo.Primario(btnRegistrar);
            Estilo.Primario(btnEditar);
            Estilo.Primario(btnVacantes);

            // Consulta y reportes en contorno
            Estilo.Secundario(btnConsultar);
            Estilo.Secundario(btnVerificar);
            Estilo.Secundario(btnReportes);
            Estilo.Secundario(btnHistorial);
            Estilo.Secundario(btnProyeccionRango);
            Estilo.Secundario(btnRespaldo);
            Estilo.Secundario(btnSalir);

            // Una linea que diga que hace cada boton. Son once opciones:
            // el nombre solo no siempre alcanza para saber cual es cual.
            Explicar(btnAsistencia, "Pasar lista de un turno y cerrarlo.");
            Explicar(btnSustituciones, "Asignar quien cubre a los que faltaron hoy y generar el reporte del dia.");
            Explicar(btnProyeccion, "Planear un dia por adelantado. No toca la asistencia real.");
            Explicar(btnIncapacidades, "Registrar boletas y ver las que estan vigentes.");
            Explicar(btnRegistrar, "Dar de alta un oficial o un autorizado externo.");
            Explicar(btnEditar, "Cambiar los datos de alguien o darlo de baja.");
            Explicar(btnVacantes, "Plazas sin titular: quien salio, quien la cubre y cuando llega el reemplazo.");
            Explicar(btnConsultar, "Ver la planilla completa y exportarla.");
            Explicar(btnVerificar, "Revisar como quedo el dia de hoy: turno por turno y puesto por puesto.");
            Explicar(btnReportes, "Generar el Excel de un dia que ya paso.");
            Explicar(btnHistorial, "Acumulado de ausencias y tardias por oficial.");
            Explicar(btnProyeccionRango, "Cuadro de varios dias en una sola hoja de Excel.");

            // Con la base en el servidor el respaldo lo saca el servidor
            // cada noche; desde aqui no se puede (ver Respaldo.Generar).
            // El texto va en el boton y no en el globito porque un boton
            // apagado no muestra globito. ConexionCifrada y no Conexion:
            // esta no depende de que la conexion haya arrancado bien.
            if (ConexionCifrada.Existe)
            {
                btnRespaldo.Text = "Respaldo de la base de datos  (lo saca el servidor cada noche)";
                btnRespaldo.Enabled = false;
            }
            else
            {
                Explicar(btnRespaldo, "Copia de seguridad de la base. Pide clave.");
            }

            pnlMenu.BackColor = Color.Transparent;
            Estilo.PieDePagina(lblPie);

            // En el pie queda a nombre de quien esta la licencia: sirve
            // para saber de un vistazo que copia se esta usando.
            lblPie.Text = ControlLicencia.Pie();
        }

        /// <summary>
        /// El globito que sale al dejar el raton encima de un boton.
        /// Se comparte uno solo para todo el menu: uno por boton seria
        /// once objetos haciendo lo mismo.
        /// </summary>
        private readonly ToolTip _globo = new()
        { AutoPopDelay = 9000, InitialDelay = 450, ReshowDelay = 200 };

        private void Explicar(Button b, string texto) => _globo.SetToolTip(b, texto);

        private void MenuPrincipal_Load(object? sender, EventArgs e) => CentrarPanel();

        private void MenuPrincipal_Resize(object? sender, EventArgs e) => CentrarPanel();

        private void CentrarPanel()
        {
            pnlMenu.Left = Math.Max(20, (ClientSize.Width - pnlMenu.Width) / 2);
            pnlMenu.Top = Math.Max(pnlBanda.Height + 20,
                                   (ClientSize.Height - pnlMenu.Height) / 2 + 20);
        }

        // =============================================================
        // BOTONES
        // =============================================================
        /// <summary>
        /// Abre una pantalla desde el menu.
        ///
        /// La pantalla se construye aqui adentro, no afuera: si algo le
        /// falla al armarse (la base caida, una tabla que no esta), el
        /// menu se queda en pie con el aviso en el pie en vez de tumbar
        /// todo el programa con el cuadro gris de Windows.
        /// </summary>
        private void Abrir(string nombre, Func<Form> construir)
        {
            try
            {
                Cursor = Cursors.WaitCursor;
                using var frm = construir();
                Cursor = Cursors.Default;

                frm.ShowDialog(this);

                // Al volver el pie queda como estaba: si la vez pasada
                // hubo una falla, el aviso en rojo no se queda pegado.
                lblPie.Text = ControlLicencia.Pie();
                lblPie.ForeColor = Estilo.TextoSuave;
            }
            catch (Exception ex)
            {
                Registro.Anotar($"Menu: no se pudo abrir {nombre}", ex);

                lblPie.Text = $"No se pudo abrir {nombre}.  {ex.Message}";
                lblPie.ForeColor = Estilo.RojoTexto;
            }
            finally { Cursor = Cursors.Default; }
        }

        private void btnAsistencia_Click(object sender, EventArgs e) =>
            Abrir("la lista de asistencia", () => new fmrAsistencia());

        // Desde el menu se entra al dia de hoy, que es el unico que se
        // esta cubriendo. Para un dia pasado se entra por Reportes.
        private void btnSustituciones_Click(object sender, EventArgs e) =>
            Abrir("la sustitucion de ausentes", () => new SustitucionAusentes(DateTime.Today));

        private void btnVerificar_Click(object sender, EventArgs e) =>
            Abrir("la verificacion del dia", () => new VerificarAsignaciones(DateTime.Today));

        private void btnProyeccion_Click(object sender, EventArgs e) =>
            Abrir("la proyeccion", () => new Proyeccion());

        private void btnProyeccionRango_Click(object sender, EventArgs e) =>
            Abrir("la proyeccion de varios dias", () => new ProyeccionRango());

        private void btnIncapacidades_Click(object sender, EventArgs e) =>
            Abrir("las incapacidades", () => new Incapacidades());

        private void btnRegistrar_Click(object sender, EventArgs e) =>
            Abrir("el registro de personal", () => new RegistroOficiales());

        private void btnEditar_Click(object sender, EventArgs e) =>
            Abrir("la edicion de personal", () => new EditarOficial());

        private void btnVacantes_Click(object sender, EventArgs e) =>
            Abrir("las vacantes", () => new Vacantes());

        private void btnConsultar_Click(object sender, EventArgs e) =>
            Abrir("la consulta de personal", () => new ConsultarOficial());

        private void btnReportes_Click(object sender, EventArgs e) =>
            Abrir("los reportes de otros dias", () => new ReportesAnteriores());

        private void btnHistorial_Click(object sender, EventArgs e) =>
            Abrir("el historial", () => new HistorialIncidencias());

        private void btnRespaldo_Click(object sender, EventArgs e) =>
            Abrir("el respaldo", () => new RespaldoBase());

        // Salir no pregunta: si presiono Salir es porque quiere salir.
        private void btnSalir_Click(object sender, EventArgs e) => Application.Exit();
    }
}
