namespace formularios
{
    partial class fmrAsistencia
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
            btnMenuPrincipal = new Button();
            lblFecha = new Label();
            lblBanda = new Label();
            pnlFiltros = new Panel();
            lblEstadoTurno = new Label();
            btnMarcarTodos = new Button();
            btnCargar = new Button();
            cbxTurno = new ComboBox();
            lblTurno = new Label();
            dtpFecha = new DateTimePicker();
            lblFechaSel = new Label();
            pnlInferior = new Panel();
            lblResumen = new Label();
            btnPasarSustituciones = new Button();
            btnGuardarTurno = new Button();
            btnExcelDia = new Button();
            dtgAsistencia = new DataGridView();
            btnProyeccion = new Button();
            pnlBanda.SuspendLayout();
            pnlFiltros.SuspendLayout();
            pnlInferior.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dtgAsistencia).BeginInit();
            SuspendLayout();
            // 
            // pnlBanda
            // 
            pnlBanda.Controls.Add(btnMenuPrincipal);
            pnlBanda.Controls.Add(lblFecha);
            pnlBanda.Controls.Add(lblBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Location = new Point(0, 0);
            pnlBanda.Name = "pnlBanda";
            pnlBanda.Size = new Size(1200, 95);
            pnlBanda.TabIndex = 0;
            // 
            // btnMenuPrincipal
            // 
            btnMenuPrincipal.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnMenuPrincipal.Location = new Point(1000, 30);
            btnMenuPrincipal.Name = "btnMenuPrincipal";
            btnMenuPrincipal.Size = new Size(160, 40);
            btnMenuPrincipal.TabIndex = 0;
            btnMenuPrincipal.Text = "Volver al Menu";
            btnMenuPrincipal.Click += btnMenuPrincipal_Click;
            // 
            // lblFecha
            // 
            lblFecha.Location = new Point(43, 56);
            lblFecha.Name = "lblFecha";
            lblFecha.Size = new Size(700, 20);
            lblFecha.TabIndex = 1;
            lblFecha.Text = "Fecha";
            // 
            // lblBanda
            // 
            lblBanda.Location = new Point(40, 22);
            lblBanda.Name = "lblBanda";
            lblBanda.Size = new Size(500, 32);
            lblBanda.TabIndex = 2;
            lblBanda.Text = "LISTA DE ASISTENCIA";
            // 
            // pnlFiltros
            // 
            pnlFiltros.Controls.Add(lblEstadoTurno);
            pnlFiltros.Controls.Add(btnProyeccion);
            pnlFiltros.Controls.Add(btnMarcarTodos);
            pnlFiltros.Controls.Add(btnCargar);
            pnlFiltros.Controls.Add(cbxTurno);
            pnlFiltros.Controls.Add(lblTurno);
            pnlFiltros.Controls.Add(dtpFecha);
            pnlFiltros.Controls.Add(lblFechaSel);
            pnlFiltros.Dock = DockStyle.Top;
            pnlFiltros.Location = new Point(0, 95);
            pnlFiltros.Name = "pnlFiltros";
            // Alto para dos renglones: arriba la fecha, el turno y los
            // botones; abajo el buscador de la lista.
            pnlFiltros.Size = new Size(1200, 122);
            pnlFiltros.TabIndex = 1;
            // 
            // lblEstadoTurno
            // 
            lblEstadoTurno.AutoSize = true;
            lblEstadoTurno.Location = new Point(1000, 40);
            lblEstadoTurno.Name = "lblEstadoTurno";
            lblEstadoTurno.Size = new Size(0, 15);
            lblEstadoTurno.TabIndex = 0;
            // 
            // btnMarcarTodos
            // 
            btnMarcarTodos.Location = new Point(598, 30);
            btnMarcarTodos.Name = "btnMarcarTodos";
            btnMarcarTodos.Size = new Size(200, 36);
            btnMarcarTodos.TabIndex = 3;
            btnMarcarTodos.Text = "Marcar / desmarcar todos";
            btnMarcarTodos.Click += btnMarcarTodos_Click;
            // 
            // btnCargar
            // 
            btnCargar.Location = new Point(435, 30);
            btnCargar.Name = "btnCargar";
            btnCargar.Size = new Size(150, 36);
            btnCargar.TabIndex = 2;
            btnCargar.Text = "Cargar turno";
            btnCargar.Click += btnCargar_Click;
            // 
            // cbxTurno
            // 
            cbxTurno.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxTurno.FormattingEnabled = true;
            cbxTurno.Location = new Point(210, 34);
            cbxTurno.Name = "cbxTurno";
            cbxTurno.Size = new Size(210, 23);
            cbxTurno.TabIndex = 1;
            // 
            // lblTurno
            // 
            lblTurno.AutoSize = true;
            lblTurno.Location = new Point(212, 12);
            lblTurno.Name = "lblTurno";
            lblTurno.Size = new Size(39, 15);
            lblTurno.TabIndex = 5;
            lblTurno.Text = "Turno";
            // 
            // dtpFecha
            // 
            dtpFecha.Format = DateTimePickerFormat.Short;
            dtpFecha.Location = new Point(20, 34);
            dtpFecha.Name = "dtpFecha";
            dtpFecha.Size = new Size(170, 23);
            dtpFecha.TabIndex = 0;
            // 
            // lblFechaSel
            // 
            lblFechaSel.AutoSize = true;
            lblFechaSel.Location = new Point(22, 12);
            lblFechaSel.Name = "lblFechaSel";
            lblFechaSel.Size = new Size(102, 15);
            lblFechaSel.TabIndex = 6;
            lblFechaSel.Text = "Fecha a pasar lista";
            // 
            // pnlInferior
            // 
            pnlInferior.Controls.Add(lblResumen);
            pnlInferior.Controls.Add(btnPasarSustituciones);
            pnlInferior.Controls.Add(btnGuardarTurno);
            pnlInferior.Controls.Add(btnExcelDia);
            pnlInferior.Dock = DockStyle.Bottom;
            pnlInferior.Location = new Point(0, 540);
            pnlInferior.Name = "pnlInferior";
            pnlInferior.Size = new Size(1200, 110);
            pnlInferior.TabIndex = 3;
            //
            // lblResumen
            //
            // El resumen va en su propio renglon, debajo de los botones:
            // con tres botones arriba ya no le queda campo al lado, y el
            // texto crece segun lo que haya que contar del turno.
            lblResumen.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            lblResumen.Location = new Point(20, 72);
            lblResumen.Name = "lblResumen";
            lblResumen.Size = new Size(1155, 25);
            lblResumen.TabIndex = 0;
            lblResumen.Text = "Escoja fecha y turno, luego presione Cargar turno.";
            //
            // btnPasarSustituciones
            //
            btnPasarSustituciones.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnPasarSustituciones.Location = new Point(945, 14);
            btnPasarSustituciones.Name = "btnPasarSustituciones";
            btnPasarSustituciones.Size = new Size(230, 46);
            btnPasarSustituciones.TabIndex = 1;
            btnPasarSustituciones.Text = "Pasar a sustituciones";
            btnPasarSustituciones.Click += btnPasarSustituciones_Click;
            //
            // btnGuardarTurno
            //
            btnGuardarTurno.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnGuardarTurno.Location = new Point(700, 14);
            btnGuardarTurno.Name = "btnGuardarTurno";
            btnGuardarTurno.Size = new Size(230, 46);
            btnGuardarTurno.TabIndex = 2;
            btnGuardarTurno.Text = "Guardar y cerrar turno";
            btnGuardarTurno.Click += btnGuardarTurno_Click;
            //
            // btnExcelDia
            //
            // El Excel del dia, aqui mismo: antes habia que pasar a
            // sustituciones nada mas para pedirlo.
            btnExcelDia.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnExcelDia.Location = new Point(455, 14);
            btnExcelDia.Name = "btnExcelDia";
            btnExcelDia.Size = new Size(230, 46);
            btnExcelDia.TabIndex = 3;
            btnExcelDia.Text = "Generar Excel del dia";
            btnExcelDia.Click += btnExcelDia_Click;
            // 
            // dtgAsistencia
            // 
            dtgAsistencia.Dock = DockStyle.Fill;
            dtgAsistencia.Location = new Point(0, 175);
            dtgAsistencia.Name = "dtgAsistencia";
            dtgAsistencia.Size = new Size(1200, 390);
            dtgAsistencia.TabIndex = 2;
            // 
            // btnProyeccion
            // 
            btnProyeccion.Location = new Point(811, 30);
            btnProyeccion.Name = "btnProyeccion";
            btnProyeccion.Size = new Size(170, 36);
            btnProyeccion.TabIndex = 4;
            btnProyeccion.Text = "Ver proyeccion";
            btnProyeccion.Click += btnProyeccion_Click;
            // 
            // fmrAsistencia
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1200, 650);
            Controls.Add(dtgAsistencia);
            Controls.Add(pnlInferior);
            Controls.Add(pnlFiltros);
            Controls.Add(pnlBanda);
            Name = "fmrAsistencia";
            Text = "Lista de Asistencia";
            Load += fmrAsistencia_Load;
            pnlBanda.ResumeLayout(false);
            pnlFiltros.ResumeLayout(false);
            pnlFiltros.PerformLayout();
            pnlInferior.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)dtgAsistencia).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private Panel pnlBanda;
        private Label lblBanda;
        private Label lblFecha;
        private Button btnMenuPrincipal;
        private Panel pnlFiltros;
        private Label lblFechaSel;
        private DateTimePicker dtpFecha;
        private Label lblTurno;
        private ComboBox cbxTurno;
        private Button btnCargar;
        private Button btnMarcarTodos;
        private Button btnProyeccion;
        private Label lblEstadoTurno;
        private Panel pnlInferior;
        private Button btnGuardarTurno;
        private Button btnPasarSustituciones;
        private Button btnExcelDia;
        private Label lblResumen;
        private DataGridView dtgAsistencia;
    }
}
