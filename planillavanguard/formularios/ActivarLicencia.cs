using Licencias;

namespace formularios
{
    /// <summary>
    /// Lo primero que ve un cliente nuevo. Le muestra el codigo de su
    /// computadora para que lo mande, y recibe la clave que le devuelven.
    ///
    /// Es la unica pantalla del sistema que puede cerrar la aplicacion
    /// completa: sin licencia no se abre nada mas.
    /// </summary>
    public class ActivarLicencia : Form
    {
        /// <summary>La licencia que quedo activada, si se activo.</summary>
        public Licencia? Licencia { get; private set; }

        private readonly byte[] _huella = HuellaEquipo.Calcular();

        private readonly TextBox txtEquipo = new();
        private readonly TextBox txtClave = new();
        private readonly Label lblEstado = new();

        public ActivarLicencia()
        {
            Text = "PlanillaVanguard  -  Activacion";

            Estilo.Formulario(this);

            // Estilo.Formulario deja las pantallas maximizadas, que es lo
            // correcto para las de trabajo. Esta es un cuadro chico.
            WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            ClientSize = new Size(760, 560);
            StartPosition = FormStartPosition.CenterScreen;

            Armar();
        }

        private void Armar()
        {
            // ---------- Banda ----------
            var banda = new Panel { Dock = DockStyle.Top, Height = 80 };
            Estilo.Banda(banda);
            Controls.Add(banda);

            int finLogo = Estilo.LogoEnBanda(banda, 44, 28);

            var marca = new Label
            {
                Text = "PlanillaVanguard",
                Font = Estilo.Titulo,
                ForeColor = Color.White,
                BackColor = Color.Transparent,
                AutoSize = true,
                Location = new Point(finLogo > 0 ? finLogo + 20 : 28, 26)
            };
            banda.Controls.Add(marca);
            marca.BringToFront();

            int y = 106;

            // ---------- Aviso ----------
            Controls.Add(new Label
            {
                Text = "Esta copia todavia no esta activada.",
                Font = Estilo.Titulo,
                ForeColor = Estilo.Azul,
                AutoSize = true,
                Location = new Point(32, y)
            });
            y += 44;

            Controls.Add(new Label
            {
                Text = "Cada licencia sirve para una sola computadora. " +
                       "Enviele el codigo de abajo a su proveedor y el le devuelve la clave.",
                Font = Estilo.Subtitulo,
                ForeColor = Estilo.TextoSuave,
                Location = new Point(32, y),
                Size = new Size(690, 40)
            });
            y += 48;

            // ---------- Codigo del equipo ----------
            Controls.Add(new Label
            {
                Text = "Codigo de esta computadora",
                Font = Estilo.Etiqueta,
                ForeColor = Estilo.Texto,
                AutoSize = true,
                Location = new Point(32, y)
            });
            y += 26;

            txtEquipo.SetBounds(32, y, 530, 34);
            txtEquipo.Text = HuellaEquipo.Texto(_huella);
            txtEquipo.ReadOnly = true;
            txtEquipo.Font = new Font("Consolas", 14F, FontStyle.Bold);
            txtEquipo.ForeColor = Estilo.Azul;
            txtEquipo.BackColor = Color.White;
            txtEquipo.TextAlign = HorizontalAlignment.Center;
            Controls.Add(txtEquipo);

            var btnCopiar = new Button { Text = "Copiar codigo", Size = new Size(160, 34) };
            btnCopiar.Location = new Point(576, y);
            Estilo.Secundario(btnCopiar);
            btnCopiar.Click += (_, _) => Copiar(txtEquipo.Text, "Codigo copiado.");
            Controls.Add(btnCopiar);
            y += 56;

            // ---------- Clave ----------
            Controls.Add(new Label
            {
                Text = "Pegue aqui la clave que le enviaron",
                Font = Estilo.Etiqueta,
                ForeColor = Estilo.Texto,
                AutoSize = true,
                Location = new Point(32, y)
            });
            y += 26;

            txtClave.SetBounds(32, y, 704, 116);
            txtClave.Multiline = true;
            txtClave.ScrollBars = ScrollBars.Vertical;
            txtClave.Font = new Font("Consolas", 11F);
            Estilo.CampoTexto(txtClave);
            Controls.Add(txtClave);
            y += 128;

            // ---------- Estado ----------
            lblEstado.SetBounds(32, y, 704, 44);
            lblEstado.Font = Estilo.Etiqueta;
            lblEstado.ForeColor = Estilo.TextoSuave;
            Controls.Add(lblEstado);
            y += 52;

            // ---------- Botones ----------
            var btnActivar = new Button { Text = "Activar", Size = new Size(190, 44) };
            btnActivar.Location = new Point(32, y);
            Estilo.Primario(btnActivar);
            btnActivar.Click += (_, _) => Activar();
            Controls.Add(btnActivar);

            var btnSalir = new Button { Text = "Salir", Size = new Size(140, 44) };
            btnSalir.Location = new Point(596, y);
            Estilo.Secundario(btnSalir);
            btnSalir.Click += (_, _) => { DialogResult = DialogResult.Cancel; Close(); };
            Controls.Add(btnSalir);

            CancelButton = btnSalir;

            // El foco arranca en el cuadro de pegar, no en el codigo: si
            // arranca en el codigo, Windows lo muestra todo resaltado y
            // parece que estuviera malo. AcceptButton no se pone porque
            // el cuadro es de varias lineas y se traga el Enter.
            ActiveControl = txtClave;
        }

        // ===============================================================
        // ACTIVAR
        // ===============================================================
        private void Activar()
        {
            var estado = ClaveLicencia.Revisar(txtClave.Text, _huella, out var licencia);

            if (estado != ClaveLicencia.Estado.Valida)
            {
                Aviso(ClaveLicencia.Explicar(estado), true);
                return;
            }

            // La clave se guarda sin saltos de linea: da lo mismo para
            // leerla, pero asi el archivo queda de una sola linea.
            string limpia = txtClave.Text.Replace("\r", "").Replace("\n", "").Trim();

            if (!AlmacenLicencia.Guardar(limpia))
            {
                Aviso("La licencia es correcta, pero no se pudo guardar en el disco. " +
                      "El sistema va a abrir, pero le va a pedir la clave otra vez.", true);
            }

            Licencia = licencia;
            DialogResult = DialogResult.OK;
            Close();
        }

        private void Copiar(string texto, string aviso)
        {
            try
            {
                Clipboard.SetText(texto);
                Aviso(aviso, false);
            }
            catch
            {
                Aviso("Windows no dejo usar el portapapeles. Copie el codigo a mano.", true);
            }
        }

        private void Aviso(string texto, bool malo)
        {
            lblEstado.Text = texto;
            lblEstado.ForeColor = malo ? Estilo.RojoTexto : Estilo.VerdeTexto;
        }
    }
}
