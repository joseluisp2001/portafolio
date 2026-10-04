using System.Security.Cryptography;
using Licencias;

namespace GeneradorLicencias
{
    /// <summary>
    /// La pantalla del proveedor. Recibe el nombre del cliente y el
    /// codigo que le aparece en pantalla, y devuelve la clave que hay
    /// que mandarle.
    ///
    /// Esta aplicacion no se entrega nunca: es la que tiene la clave
    /// privada.
    /// </summary>
    public class VentanaGenerador : Form
    {
        private static readonly Color Azul = Color.FromArgb(17, 44, 65);
        private static readonly Color AzulMedio = Color.FromArgb(42, 91, 128);
        private static readonly Color Fondo = Color.FromArgb(216, 222, 228);
        private static readonly Color Texto = Color.FromArgb(38, 42, 46);
        private static readonly Color TextoSuave = Color.FromArgb(102, 110, 118);
        private static readonly Color RojoTexto = Color.FromArgb(132, 32, 41);
        private static readonly Color VerdeTexto = Color.FromArgb(15, 81, 50);

        private readonly TextBox txtPublica = new();
        private readonly TextBox txtCliente = new();
        private readonly TextBox txtHuella = new();
        private readonly TextBox txtClave = new();
        private readonly Label lblEstado = new();

        public VentanaGenerador()
        {
            Text = "Generador de licencias - PlanillaVanguard";
            BackColor = Fondo;
            ForeColor = Texto;
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(820, 690);
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            Font = new Font("Segoe UI", 10F);

            Armar();
            MostrarClavePublica();
        }

        // ===============================================================
        // PANTALLA
        // ===============================================================
        private void Armar()
        {
            var banda = new Panel
            {
                Dock = DockStyle.Top,
                Height = 64,
                BackColor = Azul
            };
            banda.Controls.Add(new Label
            {
                Text = "Generador de licencias",
                Font = new Font("Segoe UI", 17F, FontStyle.Bold),
                ForeColor = Color.White,
                BackColor = Color.Transparent,
                AutoSize = true,
                Location = new Point(24, 16)
            });
            Controls.Add(banda);

            int y = 84;

            // ---------- Clave publica ----------
            Agregar(Titulo("1.  Clave publica de esta instalacion", 24, y));
            y += 30;

            Agregar(Nota(
                "Peguela en Licencias\\ClavePublicaVanguard.cs y recompile la aplicacion. " +
                "Esto se hace una sola vez: si cambia la clave publica, todas las licencias " +
                "ya entregadas dejan de servir.", 24, y, 770));
            y += 42;

            txtPublica.SetBounds(24, y, 640, 26);
            txtPublica.ReadOnly = true;
            txtPublica.BackColor = Color.White;
            txtPublica.Font = new Font("Consolas", 9F);
            Agregar(txtPublica);

            Agregar(Boton("Copiar", 676, y - 2, 118, 30, false,
                          (_, _) => Copiar(txtPublica.Text, "Clave publica copiada.")));
            y += 48;

            Agregar(Separador(y));
            y += 20;

            // ---------- Datos del cliente ----------
            Agregar(Titulo("2.  Emitir una licencia", 24, y));
            y += 38;

            Agregar(Etiqueta("Cliente", 24, y + 4));
            txtCliente.SetBounds(150, y, 500, 28);
            txtCliente.BackColor = Color.White;
            txtCliente.MaxLength = Licencia.LargoMaximoCliente;
            Agregar(txtCliente);
            y += 38;

            Agregar(Etiqueta("Codigo del equipo", 24, y + 4));
            txtHuella.SetBounds(150, y, 500, 28);
            txtHuella.BackColor = Color.White;
            txtHuella.Font = new Font("Consolas", 11F);
            txtHuella.CharacterCasing = CharacterCasing.Upper;
            Agregar(txtHuella);
            y += 32;

            Agregar(Nota("El que le aparece al cliente en la pantalla de activacion. " +
                         "Los guiones dan lo mismo.", 150, y, 500));
            y += 40;

            Agregar(Boton("Generar licencia", 150, y, 200, 38, true, (_, _) => Generar()));
            y += 56;

            Agregar(Separador(y));
            y += 20;

            // ---------- Resultado ----------
            Agregar(Titulo("3.  Clave para el cliente", 24, y));
            y += 34;

            txtClave.SetBounds(24, y, 640, 96);
            txtClave.ReadOnly = true;
            txtClave.Multiline = true;
            txtClave.BackColor = Color.White;
            txtClave.Font = new Font("Consolas", 10F);
            txtClave.ScrollBars = ScrollBars.Vertical;
            Agregar(txtClave);

            Agregar(Boton("Copiar clave", 676, y, 118, 34, true,
                          (_, _) => Copiar(SinSaltos(txtClave.Text), "Clave copiada.")));
            y += 108;

            lblEstado.SetBounds(24, y, 770, 24);
            lblEstado.ForeColor = TextoSuave;
            Agregar(lblEstado);
            y += 34;

            Agregar(Separador(y));
            y += 16;

            // ---------- Mantenimiento de la clave privada ----------
            Agregar(Boton("Respaldar clave privada", 24, y, 210, 34, false,
                          (_, _) => Respaldar()));
            Agregar(Boton("Restaurar desde respaldo", 246, y, 210, 34, false,
                          (_, _) => Restaurar()));
            Agregar(Boton("Abrir carpeta", 468, y, 150, 34, false,
                          (_, _) => AbrirCarpeta()));
        }

        private void Agregar(Control c) => Controls.Add(c);

        private static Label Titulo(string texto, int x, int y) => new()
        {
            Text = texto,
            Font = new Font("Segoe UI", 12F, FontStyle.Bold),
            ForeColor = Color.FromArgb(17, 44, 65),
            AutoSize = true,
            Location = new Point(x, y)
        };

        private static Label Etiqueta(string texto, int x, int y) => new()
        {
            Text = texto,
            AutoSize = true,
            Location = new Point(x, y)
        };

        private static Label Nota(string texto, int x, int y, int ancho) => new()
        {
            Text = texto,
            Font = new Font("Segoe UI", 9F),
            ForeColor = Color.FromArgb(102, 110, 118),
            Location = new Point(x, y),
            Size = new Size(ancho, 36)
        };

        private static Panel Separador(int y) => new()
        {
            BackColor = Color.FromArgb(198, 205, 213),
            Location = new Point(24, y),
            Size = new Size(770, 1)
        };

        private static Button Boton(string texto, int x, int y, int ancho, int alto,
                                    bool primario, EventHandler alHacerClic)
        {
            var b = new Button
            {
                Text = texto,
                Cursor = Cursors.Hand,
                FlatStyle = FlatStyle.Flat,
                UseVisualStyleBackColor = false
            };
            b.SetBounds(x, y, ancho, alto);

            if (primario)
            {
                b.BackColor = Azul;
                b.ForeColor = Color.White;
                b.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
                b.FlatAppearance.BorderSize = 0;
                b.FlatAppearance.MouseOverBackColor = AzulMedio;
            }
            else
            {
                b.BackColor = Color.FromArgb(237, 240, 243);
                b.ForeColor = Azul;
                b.FlatAppearance.BorderSize = 1;
                b.FlatAppearance.BorderColor = Azul;
            }

            b.Click += alHacerClic;
            return b;
        }

        // ===============================================================
        // ACCIONES
        // ===============================================================
        /// <summary>
        /// True cuando la clave privada de esta computadora NO es la
        /// pareja de la clave publica que trae compilada la aplicacion.
        ///
        /// Cuando pasa eso, todo lo que se emita aqui le va a salir al
        /// cliente como "Esa clave no fue emitida por el proveedor del
        /// sistema", aunque la clave este bien hecha y sea del equipo
        /// correcto. Es exactamente lo que ocurrio el 10 de agosto de
        /// 2026 con dos generadores en dos computadoras distintas: la
        /// licencia se emitio, se mando, y nadie tenia como saber por
        /// que no entraba.
        /// </summary>
        private bool _emisorAjeno;

        private void MostrarClavePublica()
        {
            try
            {
                bool primera = !ClavesEmisor.Existe;

                using var ecdsa = ClavesEmisor.Abrir();
                string mia = ClavesEmisor.PublicaBase64(ecdsa);
                txtPublica.Text = mia;

                _emisorAjeno = mia != ClavePublicaVanguard.Base64;

                if (_emisorAjeno)
                {
                    Aviso("OJO: esta computadora NO es el emisor del programa. Lo que emita " +
                          "aqui le va a salir rechazado al cliente.", true);
                    return;
                }

                Aviso(primera
                    ? "Se creo el par de claves de esta instalacion. Respalde la clave privada."
                    : "Listo para emitir.", primera);
            }
            catch (Exception ex)
            {
                Aviso($"No se pudo abrir la clave privada: {ex.Message}", true);
            }
        }

        /// <summary>
        /// Se llama antes de emitir. Si el emisor no cuadra con el
        /// programa, se detiene y se explica, en vez de entregar una
        /// clave que no va a servir.
        ///
        /// Se pregunta a proposito, aunque en el resto del sistema no se
        /// pregunte nada: aqui equivocarse cuesta una llamada del cliente
        /// y una licencia mal entregada.
        /// </summary>
        private bool DejarEmitir()
        {
            if (!_emisorAjeno) return true;

            var r = MessageBox.Show(
                "La clave privada de esta computadora no es la pareja de la clave " +
                "publica que trae compilada la aplicacion.\n\n" +
                "Si emite igual, el cliente va a pegar la clave y le va a salir " +
                "'Esa clave no fue emitida por el proveedor del sistema'.\n\n" +
                "Lo correcto es emitir desde la computadora que si tiene la clave " +
                "privada buena, o restaurar aqui esa clave con el boton de abajo.\n\n" +
                "Emitir de todos modos?",
                "Este no es el emisor del programa",
                MessageBoxButtons.YesNo, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2);

            return r == DialogResult.Yes;
        }

        private void Generar()
        {
            txtClave.Clear();

            string cliente = txtCliente.Text.Trim();
            if (cliente.Length == 0)
            {
                Aviso("Escriba el nombre del cliente.", true);
                txtCliente.Focus();
                return;
            }

            byte[]? huella = HuellaEquipo.Leer(txtHuella.Text);
            if (huella is null)
            {
                Aviso("El codigo del equipo no esta completo. Son 20 caracteres.", true);
                txtHuella.Focus();
                return;
            }

            if (!DejarEmitir()) return;

            try
            {
                var licencia = new Licencia
                {
                    Cliente = cliente,
                    Huella = huella,
                    FechaEmision = DateOnly.FromDateTime(DateTime.Today)
                };

                using var ecdsa = ClavesEmisor.Abrir();
                string clave = ClaveLicencia.Armar(licencia, ecdsa);

                ClavesEmisor.Anotar(licencia, clave);

                txtClave.Text = ClaveLicencia.EnLineas(clave);
                Copiar(clave, $"Licencia de {cliente} generada y copiada al portapapeles.");
            }
            catch (Exception ex)
            {
                Aviso($"No se pudo generar: {ex.Message}", true);
            }
        }

        private void Respaldar()
        {
            string? contrasena = PedirContrasena(
                "Contrasena para el respaldo",
                "Sin esta contrasena el respaldo no sirve de nada. Apuntela aparte.");

            if (contrasena is null) return;

            if (contrasena.Length < 8)
            {
                Aviso("La contrasena del respaldo tiene que tener al menos 8 caracteres.", true);
                return;
            }

            using var dialogo = new SaveFileDialog
            {
                Title = "Guardar respaldo de la clave privada",
                FileName = "vanguard-clave-privada-respaldo.p8",
                Filter = "Respaldo de clave (*.p8)|*.p8"
            };

            if (dialogo.ShowDialog(this) != DialogResult.OK) return;

            try
            {
                ClavesEmisor.Respaldar(dialogo.FileName, contrasena);
                Aviso("Respaldo guardado. Llevelo a otra computadora o a una memoria.", false);
            }
            catch (Exception ex)
            {
                Aviso($"No se pudo respaldar: {ex.Message}", true);
            }
        }

        private void Restaurar()
        {
            using var dialogo = new OpenFileDialog
            {
                Title = "Abrir respaldo de la clave privada",
                Filter = "Respaldo de clave (*.p8)|*.p8|Todos los archivos|*.*"
            };

            if (dialogo.ShowDialog(this) != DialogResult.OK) return;

            string? contrasena = PedirContrasena(
                "Contrasena del respaldo",
                "La que uso cuando genero el archivo.");

            if (contrasena is null) return;

            try
            {
                ClavesEmisor.Restaurar(dialogo.FileName, contrasena);
                MostrarClavePublica();
                Aviso("Clave privada restaurada. Compruebe que la clave publica de arriba " +
                      "sea la misma que tiene compilada la aplicacion.", false);
            }
            catch (CryptographicException)
            {
                Aviso("Contrasena incorrecta o archivo danado.", true);
            }
            catch (Exception ex)
            {
                Aviso($"No se pudo restaurar: {ex.Message}", true);
            }
        }

        private void AbrirCarpeta()
        {
            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(
                    ClavesEmisor.Carpeta) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                Aviso($"No se pudo abrir la carpeta: {ex.Message}", true);
            }
        }

        // ===============================================================
        // AUXILIARES
        // ===============================================================
        private void Copiar(string texto, string aviso)
        {
            if (texto.Length == 0) return;

            try
            {
                Clipboard.SetText(texto);
                Aviso(aviso, false);
            }
            catch
            {
                Aviso("Windows no dejo usar el portapapeles. Copie el texto a mano.", true);
            }
        }

        private void Aviso(string texto, bool malo)
        {
            lblEstado.Text = texto;
            lblEstado.ForeColor = malo ? RojoTexto : VerdeTexto;
        }

        private static string SinSaltos(string texto) =>
            texto.Replace("\r", "").Replace("\n", "");

        /// <summary>
        /// Cuadro chiquito para escribir una contrasena. Devuelve null si
        /// la persona cancela.
        /// </summary>
        private string? PedirContrasena(string titulo, string nota)
        {
            using var f = new Form
            {
                Text = titulo,
                FormBorderStyle = FormBorderStyle.FixedDialog,
                StartPosition = FormStartPosition.CenterParent,
                ClientSize = new Size(440, 150),
                MaximizeBox = false,
                MinimizeBox = false,
                BackColor = Fondo,
                Font = Font
            };

            var lbl = new Label
            {
                Text = nota,
                Location = new Point(20, 16),
                Size = new Size(400, 40),
                ForeColor = TextoSuave
            };

            var txt = new TextBox
            {
                UseSystemPasswordChar = true,
                Location = new Point(20, 62),
                Width = 400,
                BackColor = Color.White
            };

            var aceptar = Boton("Aceptar", 240, 100, 90, 32, true, (_, _) =>
            {
                f.DialogResult = DialogResult.OK;
                f.Close();
            });

            var cancelar = Boton("Cancelar", 336, 100, 90, 32, false, (_, _) =>
            {
                f.DialogResult = DialogResult.Cancel;
                f.Close();
            });

            f.Controls.AddRange([lbl, txt, aceptar, cancelar]);
            f.AcceptButton = aceptar;
            f.CancelButton = cancelar;

            return f.ShowDialog(this) == DialogResult.OK && txt.Text.Length > 0
                ? txt.Text
                : null;
        }
    }
}
