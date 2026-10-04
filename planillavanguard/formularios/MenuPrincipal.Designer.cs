namespace formularios
{
    partial class MenuPrincipal
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) components.Dispose();
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            pnlBanda = new Panel();
            lblMarca = new Label();
            lblLema = new Label();
            pnlMenu = new Panel();
            lblSeccion = new Label();
            btnAsistencia = new Button();
            btnSustituciones = new Button();
            btnProyeccion = new Button();
            btnProyeccionRango = new Button();
            btnIncapacidades = new Button();
            btnRegistrar = new Button();
            btnEditar = new Button();
            btnVacantes = new Button();
            btnConsultar = new Button();
            btnVerificar = new Button();
            btnReportes = new Button();
            btnHistorial = new Button();
            btnRespaldo = new Button();
            btnSalir = new Button();
            lblPie = new Label();
            pnlBanda.SuspendLayout();
            pnlMenu.SuspendLayout();
            SuspendLayout();

            // ---------- Banda ----------
            lblMarca.Location = new Point(40, 30);
            lblMarca.Name = "lblMarca";
            lblMarca.Size = new Size(400, 45);
            lblMarca.Text = "VANGUARD";

            lblLema.Location = new Point(43, 78);
            lblLema.Name = "lblLema";
            lblLema.Size = new Size(400, 22);
            lblLema.Text = "SECURITY   ·   FACILITY   ·   TECHNOLOGY";

            pnlBanda.Controls.Add(lblLema);
            pnlBanda.Controls.Add(lblMarca);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Location = new Point(0, 0);
            pnlBanda.Name = "pnlBanda";
            pnlBanda.Size = new Size(1000, 130);
            pnlBanda.TabIndex = 0;

            // ---------- Botones ----------
            lblSeccion.Location = new Point(0, 0);
            lblSeccion.Name = "lblSeccion";
            lblSeccion.Size = new Size(760, 34);
            lblSeccion.Text = "PLANILLA  -  BASE 105";
            lblSeccion.TextAlign = ContentAlignment.MiddleCenter;

            // ----- Columna izquierda: operacion diaria -----
            // Van en el orden en que se usan durante el dia: se pasa
            // lista, se cubren los que faltaron, y de ahi lo demas.
            btnAsistencia.Location = new Point(0, 50);
            btnAsistencia.Name = "btnAsistencia";
            btnAsistencia.Size = new Size(370, 56);
            btnAsistencia.Text = "Asistencia y Reporte del dia";
            btnAsistencia.Click += btnAsistencia_Click;

            btnSustituciones.Location = new Point(0, 114);
            btnSustituciones.Name = "btnSustituciones";
            btnSustituciones.Size = new Size(370, 56);
            btnSustituciones.Text = "Sustitucion de ausentes";
            btnSustituciones.Click += btnSustituciones_Click;

            btnProyeccion.Location = new Point(0, 178);
            btnProyeccion.Name = "btnProyeccion";
            btnProyeccion.Size = new Size(370, 56);
            btnProyeccion.Text = "Proyeccion de personal";
            btnProyeccion.Click += btnProyeccion_Click;

            btnIncapacidades.Location = new Point(0, 242);
            btnIncapacidades.Name = "btnIncapacidades";
            btnIncapacidades.Size = new Size(370, 56);
            btnIncapacidades.Text = "Incapacidades";
            btnIncapacidades.Click += btnIncapacidades_Click;

            btnRegistrar.Location = new Point(0, 306);
            btnRegistrar.Name = "btnRegistrar";
            btnRegistrar.Size = new Size(370, 56);
            btnRegistrar.Text = "Registrar Oficial o Autorizado";
            btnRegistrar.Click += btnRegistrar_Click;

            btnEditar.Location = new Point(0, 370);
            btnEditar.Name = "btnEditar";
            btnEditar.Size = new Size(370, 56);
            btnEditar.Text = "Editar o dar de baja personal";
            btnEditar.Click += btnEditar_Click;

            // Las plazas de la base: cerca de registrar y de editar
            // personal, que es de donde viene una vacante.
            btnVacantes.Location = new Point(0, 434);
            btnVacantes.Name = "btnVacantes";
            btnVacantes.Size = new Size(370, 56);
            btnVacantes.Text = "Vacantes";
            btnVacantes.Click += btnVacantes_Click;

            // ----- Columna derecha: consulta y reportes -----
            btnConsultar.Location = new Point(390, 50);
            btnConsultar.Name = "btnConsultar";
            btnConsultar.Size = new Size(370, 56);
            btnConsultar.Text = "Consultar personal y generar Excel";
            btnConsultar.Click += btnConsultar_Click;

            btnVerificar.Location = new Point(390, 114);
            btnVerificar.Name = "btnVerificar";
            btnVerificar.Size = new Size(370, 56);
            btnVerificar.Text = "Verificar el dia (turnos y puestos)";
            btnVerificar.Click += btnVerificar_Click;

            btnReportes.Location = new Point(390, 178);
            btnReportes.Name = "btnReportes";
            btnReportes.Size = new Size(370, 56);
            btnReportes.Text = "Reportes de otros dias";
            btnReportes.Click += btnReportes_Click;

            btnHistorial.Location = new Point(390, 242);
            btnHistorial.Name = "btnHistorial";
            btnHistorial.Size = new Size(370, 56);
            btnHistorial.Text = "Historial de ausencias y tardias";
            btnHistorial.Click += btnHistorial_Click;

            btnProyeccionRango.Location = new Point(390, 306);
            btnProyeccionRango.Name = "btnProyeccionRango";
            btnProyeccionRango.Size = new Size(370, 56);
            btnProyeccionRango.Text = "Proyeccion de varios dias (Excel)";
            btnProyeccionRango.Click += btnProyeccionRango_Click;

            btnSalir.Location = new Point(390, 370);
            btnSalir.Name = "btnSalir";
            btnSalir.Size = new Size(370, 56);
            btnSalir.Text = "Salir";
            btnSalir.Click += btnSalir_Click;

            // Franja aparte, abajo de todo: no es tarea de todos los
            // dias y pide clave, asi que no va mezclado con lo demas.
            btnRespaldo.Location = new Point(0, 502);
            btnRespaldo.Name = "btnRespaldo";
            btnRespaldo.Size = new Size(760, 50);
            btnRespaldo.Text = "Respaldo de la base de datos  (solo administrador)";
            btnRespaldo.Click += btnRespaldo_Click;

            pnlMenu.Controls.Add(btnRespaldo);
            pnlMenu.Controls.Add(btnSalir);
            pnlMenu.Controls.Add(btnProyeccionRango);
            pnlMenu.Controls.Add(btnHistorial);
            pnlMenu.Controls.Add(btnReportes);
            pnlMenu.Controls.Add(btnVerificar);
            pnlMenu.Controls.Add(btnConsultar);
            pnlMenu.Controls.Add(btnVacantes);
            pnlMenu.Controls.Add(btnEditar);
            pnlMenu.Controls.Add(btnRegistrar);
            pnlMenu.Controls.Add(btnIncapacidades);
            pnlMenu.Controls.Add(btnProyeccion);
            pnlMenu.Controls.Add(btnSustituciones);
            pnlMenu.Controls.Add(btnAsistencia);
            pnlMenu.Controls.Add(lblSeccion);
            pnlMenu.Location = new Point(60, 170);
            pnlMenu.Name = "pnlMenu";
            pnlMenu.Size = new Size(760, 560);
            pnlMenu.TabIndex = 1;

            // ---------- Pie ----------
            lblPie.Dock = DockStyle.Bottom;
            lblPie.Location = new Point(0, 630);
            lblPie.Name = "lblPie";
            lblPie.Size = new Size(1000, 30);
            lblPie.Text = "Sistema PlanillaVanguard";

            // ---------- Formulario ----------
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1000, 740);
            Controls.Add(pnlMenu);
            Controls.Add(lblPie);
            Controls.Add(pnlBanda);
            Name = "MenuPrincipal";
            Text = "PlanillaVanguard  -  Base 105";
            Load += MenuPrincipal_Load;
            Resize += MenuPrincipal_Resize;
            pnlBanda.ResumeLayout(false);
            pnlMenu.ResumeLayout(false);
            ResumeLayout(false);
        }

        #endregion

        private Panel pnlBanda;
        private Label lblMarca;
        private Label lblLema;
        private Panel pnlMenu;
        private Label lblSeccion;
        private Button btnAsistencia;
        private Button btnSustituciones;
        private Button btnProyeccion;
        private Button btnProyeccionRango;
        private Button btnIncapacidades;
        private Button btnRegistrar;
        private Button btnEditar;
        private Button btnVacantes;
        private Button btnConsultar;
        private Button btnVerificar;
        private Button btnReportes;
        private Button btnHistorial;
        private Button btnRespaldo;
        private Button btnSalir;
        private Label lblPie;
    }
}
