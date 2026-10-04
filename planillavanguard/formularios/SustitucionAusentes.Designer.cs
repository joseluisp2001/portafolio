namespace formularios
{
    partial class SustitucionAusentes
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
            lblBanda = new Label();
            lblFecha = new Label();
            btnVolver = new Button();
            tlpGrillas = new TableLayoutPanel();
            grpAusentes = new GroupBox();
            dtgOficialesAusentes = new DataGridView();
            grpDisponibles = new GroupBox();
            dtgUsuariosaAsignar = new DataGridView();
            grpAsignados = new GroupBox();
            dtgOficialesAsignados = new DataGridView();
            pnlInferior = new Panel();
            btnAsignar = new Button();
            btnQuitar = new Button();
            btnVerificar = new Button();
            btnExcelSustituciones = new Button();
            btnGenerarReporte = new Button();
            lblResumen = new Label();

            pnlBanda.SuspendLayout();
            tlpGrillas.SuspendLayout();
            grpAusentes.SuspendLayout();
            grpDisponibles.SuspendLayout();
            grpAsignados.SuspendLayout();
            pnlInferior.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dtgOficialesAusentes).BeginInit();
            ((System.ComponentModel.ISupportInitialize)dtgUsuariosaAsignar).BeginInit();
            ((System.ComponentModel.ISupportInitialize)dtgOficialesAsignados).BeginInit();
            SuspendLayout();

            // ---------- Banda ----------
            lblBanda.Location = new Point(40, 22);
            lblBanda.Name = "lblBanda";
            lblBanda.Size = new Size(500, 32);
            lblBanda.Text = "SUSTITUCION DE AUSENTES";

            lblFecha.Location = new Point(43, 56);
            lblFecha.Name = "lblFecha";
            lblFecha.Size = new Size(600, 20);
            lblFecha.Text = "Fecha";

            btnVolver.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnVolver.Location = new Point(1160, 30);
            btnVolver.Name = "btnVolver";
            btnVolver.Size = new Size(160, 40);
            btnVolver.Text = "Volver al Menu";
            btnVolver.Click += btnVolver_Click;

            pnlBanda.Controls.Add(btnVolver);
            pnlBanda.Controls.Add(lblFecha);
            pnlBanda.Controls.Add(lblBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Location = new Point(0, 0);
            pnlBanda.Name = "pnlBanda";
            pnlBanda.Size = new Size(1360, 95);
            pnlBanda.TabIndex = 0;

            // ---------- Grillas ----------
            dtgOficialesAusentes.Dock = DockStyle.Fill;
            dtgOficialesAusentes.Name = "dtgOficialesAusentes";

            grpAusentes.Controls.Add(dtgOficialesAusentes);
            grpAusentes.Dock = DockStyle.Fill;
            grpAusentes.Name = "grpAusentes";
            grpAusentes.Padding = new Padding(8, 6, 8, 8);
            grpAusentes.TabStop = false;
            grpAusentes.Text = "1. Oficiales ausentes sin cubrir";

            dtgUsuariosaAsignar.Dock = DockStyle.Fill;
            dtgUsuariosaAsignar.Name = "dtgUsuariosaAsignar";

            grpDisponibles.Controls.Add(dtgUsuariosaAsignar);
            grpDisponibles.Dock = DockStyle.Fill;
            grpDisponibles.Name = "grpDisponibles";
            grpDisponibles.Padding = new Padding(8, 6, 8, 8);
            grpDisponibles.TabStop = false;
            grpDisponibles.Text = "2. Oficiales disponibles para cubrir";

            dtgOficialesAsignados.Dock = DockStyle.Fill;
            dtgOficialesAsignados.Name = "dtgOficialesAsignados";

            grpAsignados.Controls.Add(dtgOficialesAsignados);
            grpAsignados.Dock = DockStyle.Fill;
            grpAsignados.Name = "grpAsignados";
            grpAsignados.Padding = new Padding(8, 6, 8, 8);
            grpAsignados.TabStop = false;
            grpAsignados.Text = "3. Sustituciones asignadas";

            tlpGrillas.ColumnCount = 2;
            tlpGrillas.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F));
            tlpGrillas.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50F));
            tlpGrillas.RowCount = 2;
            tlpGrillas.RowStyles.Add(new RowStyle(SizeType.Percent, 58F));
            tlpGrillas.RowStyles.Add(new RowStyle(SizeType.Percent, 42F));
            tlpGrillas.Controls.Add(grpAusentes, 0, 0);
            tlpGrillas.Controls.Add(grpDisponibles, 1, 0);
            tlpGrillas.Controls.Add(grpAsignados, 0, 1);
            tlpGrillas.SetColumnSpan(grpAsignados, 2);
            tlpGrillas.Dock = DockStyle.Fill;
            tlpGrillas.Location = new Point(0, 95);
            tlpGrillas.Name = "tlpGrillas";
            tlpGrillas.Padding = new Padding(15, 10, 15, 5);
            tlpGrillas.Size = new Size(1360, 530);
            tlpGrillas.TabIndex = 1;

            // ---------- Inferior ----------
            btnAsignar.Location = new Point(20, 20);
            btnAsignar.Name = "btnAsignar";
            btnAsignar.Size = new Size(190, 48);
            btnAsignar.Text = "Asignar oficial";
            btnAsignar.Click += btnAsignar_Click;

            btnQuitar.Location = new Point(222, 20);
            btnQuitar.Name = "btnQuitar";
            btnQuitar.Size = new Size(180, 48);
            btnQuitar.Text = "Quitar asignacion";
            btnQuitar.Click += btnQuitar_Click;

            btnVerificar.Location = new Point(414, 20);
            btnVerificar.Name = "btnVerificar";
            btnVerificar.Size = new Size(220, 48);
            btnVerificar.Text = "Verificar por turno";
            btnVerificar.Click += btnVerificar_Click;

            btnExcelSustituciones.Location = new Point(646, 20);
            btnExcelSustituciones.Name = "btnExcelSustituciones";
            btnExcelSustituciones.Size = new Size(290, 48);
            btnExcelSustituciones.Text = "Excel de sustituciones";
            btnExcelSustituciones.Click += btnExcelSustituciones_Click;

            btnGenerarReporte.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnGenerarReporte.Location = new Point(1040, 20);
            btnGenerarReporte.Name = "btnGenerarReporte";
            btnGenerarReporte.Size = new Size(280, 48);
            btnGenerarReporte.Text = "Generar reporte del dia";
            btnGenerarReporte.Click += btnGenerarReporte_Click;

            // El resumen va en su propia linea: los botones ya ocupan
            // toda la primera y el texto crece segun los turnos.
            lblResumen.Location = new Point(22, 74);
            lblResumen.Name = "lblResumen";
            lblResumen.Size = new Size(1100, 22);
            lblResumen.Text = "";

            pnlInferior.Controls.Add(lblResumen);
            pnlInferior.Controls.Add(btnGenerarReporte);
            pnlInferior.Controls.Add(btnExcelSustituciones);
            pnlInferior.Controls.Add(btnVerificar);
            pnlInferior.Controls.Add(btnQuitar);
            pnlInferior.Controls.Add(btnAsignar);
            pnlInferior.Dock = DockStyle.Bottom;
            pnlInferior.Location = new Point(0, 605);
            pnlInferior.Name = "pnlInferior";
            pnlInferior.Size = new Size(1360, 108);
            pnlInferior.TabIndex = 2;

            // ---------- Formulario ----------
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1360, 713);
            Controls.Add(tlpGrillas);
            Controls.Add(pnlInferior);
            Controls.Add(pnlBanda);
            KeyPreview = true;
            Name = "SustitucionAusentes";
            Text = "Sustitucion de Ausentes";
            Load += SustitucionAusentes_Load;

            pnlBanda.ResumeLayout(false);
            tlpGrillas.ResumeLayout(false);
            grpAusentes.ResumeLayout(false);
            grpDisponibles.ResumeLayout(false);
            grpAsignados.ResumeLayout(false);
            pnlInferior.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)dtgOficialesAusentes).EndInit();
            ((System.ComponentModel.ISupportInitialize)dtgUsuariosaAsignar).EndInit();
            ((System.ComponentModel.ISupportInitialize)dtgOficialesAsignados).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private Panel pnlBanda;
        private Label lblBanda;
        private Label lblFecha;
        private Button btnVolver;
        private TableLayoutPanel tlpGrillas;
        private GroupBox grpAusentes;
        private DataGridView dtgOficialesAusentes;
        private GroupBox grpDisponibles;
        private DataGridView dtgUsuariosaAsignar;
        private GroupBox grpAsignados;
        private DataGridView dtgOficialesAsignados;
        private Panel pnlInferior;
        private Button btnAsignar;
        private Button btnQuitar;
        private Button btnVerificar;
        private Button btnExcelSustituciones;
        private Button btnGenerarReporte;
        private Label lblResumen;
    }
}
