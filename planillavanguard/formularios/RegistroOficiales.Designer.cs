namespace formularios
{
    partial class RegistroOficiales
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
            pnlCampos = new Panel();
            label1 = new Label();
            label2 = new Label();
            label4 = new Label();
            label3 = new Label();
            label9 = new Label();
            label5 = new Label();
            label6 = new Label();
            label7 = new Label();
            txtNombre = new TextBox();
            txtCedula = new TextBox();
            txtTelefono = new TextBox();
            cbxHorario = new ComboBox();
            pnlDiaLibre = new Panel();
            dtpVencimiento = new DateTimePicker();
            dtpIngreso = new DateTimePicker();
            cbxAutorizado = new ComboBox();
            btnAgregarOficial = new Button();
            btnLimpiar = new Button();
            btnMenuPrincipal = new Button();
            pnlBanda.SuspendLayout();
            pnlCampos.SuspendLayout();
            SuspendLayout();

            // ---------- Banda ----------
            lblBanda.Location = new Point(40, 22);
            lblBanda.Name = "lblBanda";
            lblBanda.Size = new Size(500, 32);
            lblBanda.TabIndex = 0;
            lblBanda.Text = "REGISTRO DE PERSONAL";

            lblBandaSub.Location = new Point(43, 56);
            lblBandaSub.Name = "lblBandaSub";
            lblBandaSub.Size = new Size(500, 20);
            lblBandaSub.TabIndex = 1;
            lblBandaSub.Text = "Vanguard  -  Base 105  -  Clinica Marcial Fallas";

            pnlBanda.Controls.Add(lblBandaSub);
            pnlBanda.Controls.Add(lblBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Location = new Point(0, 0);
            pnlBanda.Name = "pnlBanda";
            pnlBanda.Size = new Size(1000, 95);
            pnlBanda.TabIndex = 0;

            // ---------- Etiquetas ----------
            label1.Location = new Point(25, 40);
            label1.Name = "label1";
            label1.Size = new Size(210, 30);
            label1.Text = "Nombre completo";

            label2.Location = new Point(25, 85);
            label2.Name = "label2";
            label2.Size = new Size(210, 30);
            label2.Text = "Cedula";

            label4.Location = new Point(25, 130);
            label4.Name = "label4";
            label4.Size = new Size(210, 30);
            label4.Text = "Telefono";

            label3.Location = new Point(25, 175);
            label3.Name = "label3";
            label3.Size = new Size(210, 30);
            label3.Text = "Rol / Horario";

            label9.Location = new Point(25, 220);
            label9.Name = "label9";
            label9.Size = new Size(210, 30);
            label9.Text = "Dia libre";

            label5.Location = new Point(25, 265);
            label5.Name = "label5";
            label5.Size = new Size(210, 30);
            label5.Text = "Vencimiento de portacion";

            label6.Location = new Point(25, 310);
            label6.Name = "label6";
            label6.Size = new Size(210, 30);
            label6.Text = "Fecha de ingreso";

            label7.Location = new Point(25, 355);
            label7.Name = "label7";
            label7.Size = new Size(210, 30);
            label7.Text = "Autorizacion";

            // ---------- Campos ----------
            txtNombre.Location = new Point(250, 42);
            txtNombre.MaxLength = 120;
            txtNombre.Name = "txtNombre";
            txtNombre.Size = new Size(430, 27);
            txtNombre.TabIndex = 0;

            txtCedula.Location = new Point(250, 87);
            txtCedula.MaxLength = 20;
            txtCedula.Name = "txtCedula";
            txtCedula.Size = new Size(430, 27);
            txtCedula.TabIndex = 1;

            txtTelefono.Location = new Point(250, 132);
            txtTelefono.MaxLength = 15;
            txtTelefono.Name = "txtTelefono";
            txtTelefono.Size = new Size(430, 27);
            txtTelefono.TabIndex = 2;

            // Nueve roles: los ocho turnos de horas y el autorizado
            // externo. La lista la pone el codigo, desde un solo lugar,
            // para que ningun formulario quede desfasado.
            cbxHorario.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxHorario.FormattingEnabled = true;
            cbxHorario.Location = new Point(250, 177);
            cbxHorario.Name = "cbxHorario";
            cbxHorario.Size = new Size(430, 28);
            cbxHorario.TabIndex = 3;
            cbxHorario.SelectedIndexChanged += cbxHorario_SelectedIndexChanged;

            pnlDiaLibre.Location = new Point(250, 222);
            pnlDiaLibre.Name = "pnlDiaLibre";
            pnlDiaLibre.Size = new Size(430, 28);
            pnlDiaLibre.TabIndex = 4;

            dtpVencimiento.Format = DateTimePickerFormat.Short;
            dtpVencimiento.Location = new Point(250, 267);
            dtpVencimiento.Name = "dtpVencimiento";
            dtpVencimiento.Size = new Size(430, 27);
            dtpVencimiento.TabIndex = 5;

            dtpIngreso.Format = DateTimePickerFormat.Short;
            dtpIngreso.Location = new Point(250, 312);
            dtpIngreso.Name = "dtpIngreso";
            dtpIngreso.Size = new Size(430, 27);
            dtpIngreso.TabIndex = 6;

            cbxAutorizado.DropDownStyle = ComboBoxStyle.DropDownList;
            cbxAutorizado.FormattingEnabled = true;
            cbxAutorizado.Items.AddRange(new object[] { "Autorizado", "Denegado", "Pendiente" });
            cbxAutorizado.Location = new Point(250, 357);
            cbxAutorizado.Name = "cbxAutorizado";
            cbxAutorizado.Size = new Size(430, 28);
            cbxAutorizado.TabIndex = 7;

            // ---------- Botones ----------
            btnAgregarOficial.Location = new Point(250, 415);
            btnAgregarOficial.Name = "btnAgregarOficial";
            btnAgregarOficial.Size = new Size(200, 52);
            btnAgregarOficial.TabIndex = 8;
            btnAgregarOficial.Text = "Agregar Oficial";
            btnAgregarOficial.Click += btnAgregarOficial_Click;

            btnLimpiar.Location = new Point(462, 415);
            btnLimpiar.Name = "btnLimpiar";
            btnLimpiar.Size = new Size(95, 52);
            btnLimpiar.TabIndex = 9;
            btnLimpiar.Text = "Limpiar";
            btnLimpiar.Click += btnLimpiar_Click;

            // 100 de ancho no alcanzaba para "Volver al Menu": el texto
            // se partia en dos renglones y el boton se veia apretado al
            // lado de los otros dos.
            btnMenuPrincipal.Location = new Point(565, 415);
            btnMenuPrincipal.Name = "btnMenuPrincipal";
            btnMenuPrincipal.Size = new Size(140, 52);
            btnMenuPrincipal.TabIndex = 10;
            btnMenuPrincipal.Text = "Volver al Menu";
            btnMenuPrincipal.Click += btnMenuPrincipal_Click;

            // ---------- Tarjeta ----------
            pnlCampos.Controls.Add(btnMenuPrincipal);
            pnlCampos.Controls.Add(btnLimpiar);
            pnlCampos.Controls.Add(btnAgregarOficial);
            pnlCampos.Controls.Add(cbxAutorizado);
            pnlCampos.Controls.Add(dtpIngreso);
            pnlCampos.Controls.Add(dtpVencimiento);
            pnlCampos.Controls.Add(pnlDiaLibre);
            pnlCampos.Controls.Add(cbxHorario);
            pnlCampos.Controls.Add(txtTelefono);
            pnlCampos.Controls.Add(txtCedula);
            pnlCampos.Controls.Add(txtNombre);
            pnlCampos.Controls.Add(label7);
            pnlCampos.Controls.Add(label6);
            pnlCampos.Controls.Add(label5);
            pnlCampos.Controls.Add(label9);
            pnlCampos.Controls.Add(label3);
            pnlCampos.Controls.Add(label4);
            pnlCampos.Controls.Add(label2);
            pnlCampos.Controls.Add(label1);
            pnlCampos.Location = new Point(40, 130);
            pnlCampos.Name = "pnlCampos";
            pnlCampos.Size = new Size(710, 495);
            pnlCampos.TabIndex = 1;

            // ---------- Formulario ----------
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1000, 680);
            Controls.Add(pnlCampos);
            Controls.Add(pnlBanda);
            KeyPreview = true;
            Name = "RegistroOficiales";
            Text = "Registro de Personal";
            Load += RegistroOficiales_Load;
            Resize += RegistroOficiales_Resize;
            pnlBanda.ResumeLayout(false);
            pnlCampos.ResumeLayout(false);
            pnlCampos.PerformLayout();
            ResumeLayout(false);
        }

        #endregion

        private Panel pnlBanda;
        private Label lblBanda;
        private Label lblBandaSub;
        private Panel pnlCampos;
        private Label label1;
        private Label label2;
        private Label label3;
        private Label label4;
        private Label label5;
        private Label label6;
        private Label label7;
        private Label label9;
        private TextBox txtNombre;
        private TextBox txtCedula;
        private TextBox txtTelefono;
        private ComboBox cbxHorario;
        private DateTimePicker dtpVencimiento;
        private DateTimePicker dtpIngreso;
        private ComboBox cbxAutorizado;
        private Panel pnlDiaLibre;
        private Button btnAgregarOficial;
        private Button btnLimpiar;
        private Button btnMenuPrincipal;
    }
}
