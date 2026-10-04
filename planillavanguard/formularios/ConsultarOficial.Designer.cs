namespace formularios
{
    partial class ConsultarOficial
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
            lblBandaSub = new Label();
            btnMenuPrincipal = new Button();
            pnlFiltros = new Panel();
            label1 = new Label();
            cbxHorario = new ComboBox();
            label2 = new Label();
            cbxDiaLibre = new ComboBox();
            label4 = new Label();
            cbxAutorizacion = new ComboBox();
            label6 = new Label();
            cbxEstado = new ComboBox();
            lblBuscar = new Label();
            txtBuscar = new TextBox();
            btnBuscar = new Button();
            btnFiltrar = new Button();
            btnLimpiar = new Button();
            btnExportar = new Button();
            lblLeyenda = new Label();
            dtgOficiales = new DataGridView();
            pnlBanda.SuspendLayout();
            pnlFiltros.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dtgOficiales).BeginInit();
            SuspendLayout();

            // ---------- Banda ----------
            lblBanda.Location = new Point(40, 22);
            lblBanda.Name = "lblBanda";
            lblBanda.Size = new Size(500, 32);
            lblBanda.Text = "CONSULTA DE PERSONAL";

            lblBandaSub.Location = new Point(43, 56);
            lblBandaSub.Name = "lblBandaSub";
            lblBandaSub.Size = new Size(500, 20);
            lblBandaSub.Text = "Vanguard  -  Base 105  -  Clinica Marcial Fallas";

            btnMenuPrincipal.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnMenuPrincipal.Location = new Point(1000, 30);
            btnMenuPrincipal.Name = "btnMenuPrincipal";
            btnMenuPrincipal.Size = new Size(160, 40);
            btnMenuPrincipal.Text = "Volver al Menu";
            btnMenuPrincipal.Click += btnMenuPrincipal_Click;

            pnlBanda.Controls.Add(btnMenuPrincipal);
            pnlBanda.Controls.Add(lblBandaSub);
            pnlBanda.Controls.Add(lblBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Location = new Point(0, 0);
            pnlBanda.Name = "pnlBanda";
            pnlBanda.Size = new Size(1200, 95);
            pnlBanda.TabIndex = 0;

            // ---------- Filtros ----------
            // El primer filtro es el rol: los ocho turnos y el
            // autorizado externo. La lista se llena por codigo desde el
            // repositorio, no aqui, para que no se desfase del resto.
            label1.AutoSize = true;
            label1.Location = new Point(22, 12);
            label1.Name = "label1";
            label1.Text = "Rol / Horario";

            cbxHorario.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxHorario.FormattingEnabled = true;
            cbxHorario.Location = new Point(20, 34);
            cbxHorario.Name = "cbxHorario";
            cbxHorario.Size = new Size(220, 28);
            cbxHorario.TabIndex = 0;

            label2.AutoSize = true;
            label2.Location = new Point(262, 12);
            label2.Name = "label2";
            label2.Text = "Dia libre";

            cbxDiaLibre.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxDiaLibre.FormattingEnabled = true;
            cbxDiaLibre.Location = new Point(260, 34);
            cbxDiaLibre.Name = "cbxDiaLibre";
            cbxDiaLibre.Size = new Size(200, 28);
            cbxDiaLibre.TabIndex = 1;

            label4.AutoSize = true;
            label4.Location = new Point(482, 12);
            label4.Name = "label4";
            label4.Text = "Autorizacion";

            cbxAutorizacion.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxAutorizacion.FormattingEnabled = true;
            cbxAutorizacion.Items.AddRange(new object[] { "Autorizado", "Denegado", "Pendiente" });
            cbxAutorizacion.Location = new Point(480, 34);
            cbxAutorizacion.Name = "cbxAutorizacion";
            cbxAutorizacion.Size = new Size(200, 28);
            cbxAutorizacion.TabIndex = 2;

            label6.AutoSize = true;
            label6.Location = new Point(702, 12);
            label6.Name = "label6";
            label6.Text = "Estado";

            cbxEstado.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxEstado.FormattingEnabled = true;
            cbxEstado.Items.AddRange(new object[] { "Activo", "Inactivo" });
            cbxEstado.Location = new Point(700, 34);
            cbxEstado.Name = "cbxEstado";
            cbxEstado.Size = new Size(200, 28);
            cbxEstado.TabIndex = 3;

            // Busqueda libre: nombre, cedula, telefono o chaleco
            lblBuscar.AutoSize = true;
            lblBuscar.Location = new Point(922, 12);
            lblBuscar.Name = "lblBuscar";
            lblBuscar.Text = "Buscar (nombre, cedula, chaleco)";

            txtBuscar.Location = new Point(920, 34);
            txtBuscar.Name = "txtBuscar";
            txtBuscar.Size = new Size(260, 28);
            txtBuscar.TabIndex = 4;

            btnBuscar.Location = new Point(586, 78);
            btnBuscar.Name = "btnBuscar";
            btnBuscar.Size = new Size(140, 36);
            btnBuscar.TabIndex = 7;
            btnBuscar.Text = "Buscar";
            btnBuscar.Click += btnBuscar_Click;

            // Segunda fila: los botones
            btnFiltrar.Location = new Point(20, 78);
            btnFiltrar.Name = "btnFiltrar";
            btnFiltrar.Size = new Size(140, 36);
            btnFiltrar.TabIndex = 4;
            btnFiltrar.Text = "Filtrar";
            btnFiltrar.Click += button1_Click;

            btnLimpiar.Location = new Point(172, 78);
            btnLimpiar.Name = "btnLimpiar";
            btnLimpiar.Size = new Size(160, 36);
            btnLimpiar.TabIndex = 5;
            btnLimpiar.Text = "Limpiar filtros";
            btnLimpiar.Click += btnLimpiar_Click;

            btnExportar.Location = new Point(344, 78);
            btnExportar.Name = "btnExportar";
            btnExportar.Size = new Size(230, 36);
            btnExportar.TabIndex = 6;
            btnExportar.Text = "Generar Excel";
            btnExportar.Click += btnExportar_Click;

            pnlFiltros.Controls.Add(btnExportar);
            pnlFiltros.Controls.Add(btnLimpiar);
            pnlFiltros.Controls.Add(btnBuscar);
            pnlFiltros.Controls.Add(txtBuscar);
            pnlFiltros.Controls.Add(lblBuscar);
            pnlFiltros.Controls.Add(btnFiltrar);
            pnlFiltros.Controls.Add(cbxEstado);
            pnlFiltros.Controls.Add(label6);
            pnlFiltros.Controls.Add(cbxAutorizacion);
            pnlFiltros.Controls.Add(label4);
            pnlFiltros.Controls.Add(cbxDiaLibre);
            pnlFiltros.Controls.Add(label2);
            pnlFiltros.Controls.Add(cbxHorario);
            pnlFiltros.Controls.Add(label1);
            pnlFiltros.Dock = DockStyle.Top;
            pnlFiltros.Location = new Point(0, 95);
            pnlFiltros.Name = "pnlFiltros";
            pnlFiltros.Size = new Size(1200, 130);
            pnlFiltros.TabIndex = 1;

            // ---------- Leyenda ----------
            lblLeyenda.Dock = DockStyle.Bottom;
            lblLeyenda.Location = new Point(0, 620);
            lblLeyenda.Name = "lblLeyenda";
            lblLeyenda.Size = new Size(1200, 30);
            lblLeyenda.Text = "Fondo rojo = portacion de armas vencida";

            // ---------- Grilla ----------
            dtgOficiales.Dock = DockStyle.Fill;
            dtgOficiales.Location = new Point(0, 225);
            dtgOficiales.Name = "dtgOficiales";
            dtgOficiales.Size = new Size(1200, 395);
            dtgOficiales.TabIndex = 2;

            // ---------- Formulario ----------
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1200, 650);
            Controls.Add(dtgOficiales);
            Controls.Add(lblLeyenda);
            Controls.Add(pnlFiltros);
            Controls.Add(pnlBanda);
            KeyPreview = true;
            Name = "ConsultarOficial";
            Text = "Consulta de Personal";
            Load += ConsultarOficial_Load;
            pnlBanda.ResumeLayout(false);
            pnlFiltros.ResumeLayout(false);
            pnlFiltros.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dtgOficiales).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private Panel pnlBanda;
        private Label lblBanda;
        private Label lblBandaSub;
        private Button btnMenuPrincipal;
        private Panel pnlFiltros;
        private Label label1;
        private ComboBox cbxHorario;
        private Label label2;
        private ComboBox cbxDiaLibre;
        private Label label4;
        private ComboBox cbxAutorizacion;
        private Label label6;
        private ComboBox cbxEstado;
        private Label lblBuscar;
        private TextBox txtBuscar;
        private Button btnBuscar;
        private Button btnFiltrar;
        private Button btnLimpiar;
        private Button btnExportar;
        private Label lblLeyenda;
        private DataGridView dtgOficiales;
    }
}
