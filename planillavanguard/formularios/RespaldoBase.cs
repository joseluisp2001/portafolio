using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using GestorDatos;
using Microsoft.Data.SqlClient;

namespace formularios
{
    /// <summary>
    /// Como quedo un respaldo. CarpetaDeTrabajo va vacia cuando el
    /// respaldo se saco directo en la carpeta que escogio el usuario;
    /// si no, dice en cual hubo que sacarlo.
    /// </summary>
    public record ResultadoRespaldo(string Archivo, long Bytes, string CarpetaDeTrabajo);

    /// <summary>
    /// El respaldo en si, sin nada de pantalla. Vive aparte para poder
    /// probarlo sin abrir la ventana.
    /// </summary>
    public static class Respaldo
    {
        /// <summary>
        /// La carpeta de respaldos del mantenimiento nocturno. Es la que
        /// se usa de segunda opcion porque en la instalacion ya se le da
        /// permiso a SQL Server, y ademas el usuario si la puede leer.
        /// </summary>
        public const string CarpetaComun = @"C:\PlanillaVanguard\Respaldos";

        /// <summary>
        /// Saca el respaldo y lo deja comprimido en la ruta pedida.
        ///
        /// El .bak de en medio se borra siempre: pesa varias veces lo
        /// que el zip y tiene los mismos datos adentro.
        ///
        /// <paramref name="avisar"/> recibe en que va, para que la
        /// pantalla lo pueda ir contando. Puede ser nulo.
        /// </summary>
        public static ResultadoRespaldo Generar(string zip, Action<string>? avisar = null)
        {
            // Con la base en el servidor, BACKUP escribiria en el disco
            // del SERVIDOR una ruta de Windows que alla no existe, y el
            // login de la app no tiene permiso de BACKUP ni debe tenerlo:
            // verificar el respaldo exige poder crear bases en todo el
            // servidor. El menu ya apaga el boton; esto es por si se
            // llega por otro lado, para que no aconseje cambiar de
            // carpeta cuando el problema no es la carpeta.
            if (ConexionCifrada.Existe)
                throw new InvalidOperationException(
                    "La base esta en el servidor. Los respaldos los saca el servidor " +
                    "todas las noches, cifrados y con una copia fuera de el. Desde " +
                    "esta computadora no se puede sacar uno.");

            string baseDatos = NombreDeLaBase();
            string destino = Path.GetDirectoryName(zip) ?? "";

            // El .bak de en medio lleva nombre propio, no el del zip.
            //
            // Con el nombre del zip habia una forma de perder datos: si
            // el usuario guardaba el zip con el mismo nombre que un
            // respaldo viejo de la carpeta de mantenimiento, el .bak de
            // trabajo lo sobreescribia y despues lo borraba. Un respaldo
            // bueno, borrado por sacar otro.
            string nombreBak =
                $"vanguard-temporal-{DateTime.Now:yyyyMMdd_HHmmss}-" +
                $"{Guid.NewGuid().ToString("N")[..8]}.bak";

            // Aqui hay dos cuentas de por medio y es lo que complica
            // todo: SQL Server escribe el .bak con la SUYA, y el programa
            // lo tiene que leer con la del usuario. Hace falta una
            // carpeta donde las dos puedan.
            //
            // La carpeta del servidor (Program Files\...\Backup) NO
            // sirve: SQL Server escribe ahi sin problema, pero el usuario
            // no la puede leer, y el respaldo quedaria de adorno.
            var candidatas = new List<string> { destino };
            if (!MismaCarpeta(destino, CarpetaComun)) candidatas.Add(CarpetaComun);

            var negadas = new List<string>();

            foreach (string carpeta in candidatas)
            {
                if (!ElProgramaPuede(carpeta)) { negadas.Add(carpeta); continue; }

                string bak = Path.Combine(carpeta, nombreBak);

                try
                {
                    avisar?.Invoke(MismaCarpeta(carpeta, destino)
                        ? "Sacando el respaldo. En una base grande esto tarda un rato..."
                        : $"En esa carpeta SQL Server no puede escribir. " +
                          $"Sacando el respaldo en {carpeta}...");

                    Sacar(baseDatos, bak);
                }
                catch (SqlException ex) when (EsPermiso(ex))
                {
                    // No pudo escribir ahi. Se prueba la siguiente sin
                    // dejar nada a medias.
                    negadas.Add(carpeta);
                    Borrar(bak);
                    continue;
                }

                try
                {
                    avisar?.Invoke("Comprimiendo...");

                    // Adentro del zip el archivo lleva nombre de gente,
                    // no el temporal: es lo que va a ver quien lo abra el
                    // dia que haya que restaurar.
                    Comprimir(bak, zip,
                        $"{baseDatos}_{DateTime.Now:yyyy-MM-dd_HHmm}.bak");

                    return new ResultadoRespaldo(zip, new FileInfo(zip).Length,
                        MismaCarpeta(carpeta, destino) ? "" : carpeta);
                }
                finally { Borrar(bak); }
            }

            throw new UnauthorizedAccessException(
                "SQL Server no pudo escribir el respaldo en " +
                string.Join(" ni en ", negadas) + ".\n\n" +
                "Escoja una carpeta donde el servicio de SQL Server tambien pueda " +
                "escribir: una memoria USB sirve, o " + CarpetaComun + ".\n" +
                "Si tiene que ser esa carpeta, dele permiso de escritura a la " +
                "cuenta " + CuentaDelServicio() + ".");
        }

        /// <summary>
        /// Si el programa puede leer, escribir y borrar en esa carpeta.
        /// Se prueba de verdad, con un archivo: preguntarle a Windows por
        /// los permisos da respuestas que despues no se cumplen.
        /// </summary>
        private static bool ElProgramaPuede(string carpeta)
        {
            if (string.IsNullOrWhiteSpace(carpeta)) return false;

            try
            {
                Directory.CreateDirectory(carpeta);

                string prueba = Path.Combine(carpeta, "vanguard-prueba.tmp");
                File.WriteAllText(prueba, "x");
                File.ReadAllText(prueba);
                File.Delete(prueba);

                return true;
            }
            catch { return false; }
        }

        private static bool MismaCarpeta(string a, string b)
        {
            try
            {
                return string.Equals(
                    Path.GetFullPath(a).TrimEnd('\\'),
                    Path.GetFullPath(b).TrimEnd('\\'),
                    StringComparison.OrdinalIgnoreCase);
            }
            catch { return false; }
        }

        private static void Borrar(string archivo)
        {
            try { if (File.Exists(archivo)) File.Delete(archivo); } catch { }
        }

        /// <summary>
        /// Con que cuenta corre SQL Server. Es lo que hay que ponerle a
        /// la carpeta cuando se quiere respaldar en un lugar fijo.
        /// </summary>
        public static string CuentaDelServicio()
        {
            try
            {
                using var cn = new SqlConnection(Conexion.PorDefecto);
                using var cmd = new SqlCommand(
                    "SELECT TOP 1 service_account FROM sys.dm_server_services " +
                    "WHERE servicename LIKE N'SQL Server (%';", cn);
                cn.Open();
                string cuenta = cmd.ExecuteScalar()?.ToString() ?? "";
                return cuenta.Length > 0 ? cuenta : "del servicio de SQL Server";
            }
            catch { return "del servicio de SQL Server"; }
        }

        /// <summary>
        /// El respaldo en si. Se comprueba con RESTORE VERIFYONLY: un
        /// archivo que no se puede leer no es un respaldo, y eso es mejor
        /// saberlo ahora que el dia que haga falta.
        /// </summary>
        public static void Sacar(string baseDatos, string archivo)
        {
            string nombre = "[" + baseDatos.Replace("]", "]]") + "]";

            using var cn = new SqlConnection(Conexion.PorDefecto);
            cn.Open();

            try { Correr(Sql(conCompresion: true)); }
            catch (SqlException ex) when (ex.Number is 1844 or 1845)
            {
                // Esa edicion de SQL Server no comprime. No importa: el
                // zip de despues comprime igual, solo que el archivo de
                // en medio pesa mas un rato.
                Correr(Sql(conCompresion: false));
            }

            using var verificar = new SqlCommand(
                "RESTORE VERIFYONLY FROM DISK = @A WITH CHECKSUM;", cn)
            { CommandTimeout = 0 };
            verificar.Parameters.AddWithValue("@A", archivo);
            verificar.ExecuteNonQuery();

            string Sql(bool conCompresion) =>
                $"BACKUP DATABASE {nombre} TO DISK = @A WITH INIT, CHECKSUM, " +
                (conCompresion ? "COMPRESSION, " : "") +
                "NAME = N'PlanillaVanguard - respaldo a mano';";

            void Correr(string sql)
            {
                using var cmd = new SqlCommand(sql, cn) { CommandTimeout = 0 };
                cmd.Parameters.AddWithValue("@A", archivo);
                cmd.ExecuteNonQuery();
            }
        }

        public static void Comprimir(string bak, string zip, string? nombreAdentro = null)
        {
            if (File.Exists(zip)) File.Delete(zip);

            using var archivo = ZipFile.Open(zip, ZipArchiveMode.Create);
            archivo.CreateEntryFromFile(bak, nombreAdentro ?? Path.GetFileName(bak),
                                        CompressionLevel.Optimal);
        }

        /// <summary>Los numeros de "no pude escribir ahi".</summary>
        public static bool EsPermiso(SqlException ex) =>
            ex.Errors.Cast<SqlError>().Any(e => e.Number is 3201 or 3013 or 15105);

        public static string NombreDeLaBase()
        {
            var partes = new SqlConnectionStringBuilder(Conexion.PorDefecto);
            if (partes.InitialCatalog.Length > 0) return partes.InitialCatalog;

            using var cn = new SqlConnection(Conexion.PorDefecto);
            using var cmd = new SqlCommand("SELECT DB_NAME();", cn);
            cn.Open();
            return cmd.ExecuteScalar()?.ToString() ?? "PlanillaVanguard";
        }

        public static string CarpetaDelServidor()
        {
            try
            {
                using var cn = new SqlConnection(Conexion.PorDefecto);
                using var cmd = new SqlCommand(
                    "SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') " +
                    "AS NVARCHAR(400));", cn);
                cn.Open();
                return cmd.ExecuteScalar()?.ToString() ?? "";
            }
            catch { return ""; }
        }

        public static string Tamano(long bytes) =>
            bytes >= 1024L * 1024 * 1024
                ? $"{bytes / 1024.0 / 1024 / 1024:0.0} GB"
            : bytes >= 1024 * 1024
                ? $"{bytes / 1024.0 / 1024:0.0} MB"
                : $"{bytes / 1024.0:0} KB";
    }

    /// <summary>
    /// Respaldo de la base a mano, desde el programa.
    ///
    /// Es distinto del respaldo nocturno de la carpeta Mantenimiento:
    /// aquel corre solo, todas las noches, y siempre a la misma carpeta.
    /// Este lo pide una persona, escoge donde guardarlo y se lo puede
    /// llevar en una memoria. Sirve para antes de una actualizacion,
    /// para llevarse una copia, o para entregarsela a otro.
    ///
    /// Va detras de una clave porque un respaldo es la base entera: quien
    /// se lleva el archivo se lleva todos los datos del personal.
    ///
    /// Construida por codigo: no lleva Designer ni resx.
    /// </summary>
    public class RespaldoBase : Form
    {
        // =============================================================
        // LA CLAVE
        // =============================================================
        /// <summary>
        /// La clave no va escrita aqui, va su huella. Asi no aparece al
        /// abrir el ejecutable con un editor de texto.
        ///
        /// Que quede claro hasta donde llega esto: son cuatro digitos, y
        /// quien sepa de programacion y tenga el ejecutable las puede
        /// probar todas en un segundo. Es un seguro contra el curioso
        /// que se sienta en la computadora, no contra alguien que se
        /// proponga sacar la base.
        /// </summary>
        private const string HuellaClave = "55OsGfMoL7muSWoICMmeu0aeRi2IxY5Gvv33Jj6lU9k=";

        private static readonly byte[] Sal =
            Encoding.UTF8.GetBytes("PlanillaVanguard.Respaldo.2026");

        private const int VUELTAS = 600_000;
        private const int INTENTOS = 3;

        private static bool ClaveBuena(string escrita)
        {
            byte[] huella = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(escrita.Trim()), Sal,
                VUELTAS, HashAlgorithmName.SHA256, 32);

            return CryptographicOperations.FixedTimeEquals(
                huella, Convert.FromBase64String(HuellaClave));
        }

        // =============================================================
        // CONTROLES
        // =============================================================
        private readonly Panel pnlBanda = new();
        private readonly Label lblTitulo = new();
        private readonly Label lblSub = new();

        private readonly Label lblClave = new();
        private readonly TextBox txtClave = new();
        private readonly Button btnEntrar = new();

        private readonly Label lblPaso = new();
        private readonly Button btnRespaldar = new();
        private readonly Button btnAbrirCarpeta = new();
        private readonly Button btnCerrar = new();

        private int _fallidos;
        private bool _abierto;
        private string _ultimoArchivo = "";

        public RespaldoBase()
        {
            ConstruirInterfaz();
            Load += (_, _) => txtClave.Focus();
        }

        // =============================================================
        // INTERFAZ
        // =============================================================
        private void ConstruirInterfaz()
        {
            Estilo.Formulario(this);
            Text = "Respaldo de la base de datos";
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterParent;
            ClientSize = new Size(720, 380);
            KeyPreview = true;
            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) Close(); };

            // ---------- Banda ----------
            Estilo.Banda(pnlBanda);
            pnlBanda.Dock = DockStyle.Top;
            pnlBanda.Height = 88;

            int margen = Math.Max(36, Estilo.LogoEnBanda(pnlBanda, 56) + 20);

            lblTitulo.Text = "RESPALDO DE LA BASE";
            lblTitulo.Font = Estilo.Titulo;
            lblTitulo.ForeColor = Color.White;
            lblTitulo.BackColor = Color.Transparent;
            lblTitulo.SetBounds(margen, 20, 560, 30);

            lblSub.Text = "Saca una copia completa y la deja comprimida donde usted diga.";
            Estilo.SubtituloBanda(lblSub);
            lblSub.AutoSize = false;
            lblSub.SetBounds(margen + 3, 52, 620, 20);

            pnlBanda.Controls.AddRange(new Control[] { lblSub, lblTitulo });

            // ---------- Clave ----------
            lblClave.Text = "Clave de administrador";
            lblClave.Font = Estilo.Subtitulo;
            lblClave.ForeColor = Estilo.TextoSuave;
            lblClave.AutoSize = true;
            lblClave.SetBounds(36, 112, 300, 20);

            Estilo.CampoTexto(txtClave);
            txtClave.UseSystemPasswordChar = true;
            txtClave.Font = new Font("Consolas", 13F);
            txtClave.TextAlign = HorizontalAlignment.Center;
            txtClave.SetBounds(34, 136, 200, 34);
            txtClave.KeyDown += (_, e) =>
            {
                if (e.KeyCode != Keys.Enter) return;
                e.SuppressKeyPress = true;
                Entrar();
            };

            Estilo.Primario(btnEntrar);
            btnEntrar.Text = "Entrar";
            btnEntrar.SetBounds(248, 134, 140, 38);
            btnEntrar.Click += (_, _) => Entrar();

            // ---------- Trabajo ----------
            Estilo.Primario(btnRespaldar);
            btnRespaldar.Text = "Escoger donde guardar y respaldar";
            btnRespaldar.SetBounds(34, 190, 390, 48);
            btnRespaldar.Visible = false;
            btnRespaldar.Click += (_, _) => Respaldar();

            Estilo.Secundario(btnAbrirCarpeta);
            btnAbrirCarpeta.Text = "Abrir la carpeta";
            btnAbrirCarpeta.SetBounds(436, 190, 180, 48);
            btnAbrirCarpeta.Visible = false;
            btnAbrirCarpeta.Click += (_, _) => AbrirCarpeta();

            // ---------- Aviso ----------
            // Todo lo que pasa se cuenta aqui, en la misma ventana. No
            // hay cuadros de "listo" ni de "clave incorrecta": estorban
            // en una pantalla que se usa de corrido.
            lblPaso.Font = Estilo.Subtitulo;
            lblPaso.ForeColor = Estilo.TextoSuave;
            lblPaso.AutoSize = false;
            lblPaso.SetBounds(36, 252, 650, 74);
            lblPaso.Text = "Escriba la clave para continuar.";

            Estilo.Secundario(btnCerrar);
            btnCerrar.Text = "Cerrar";
            btnCerrar.SetBounds(556, 328, 130, 38);
            btnCerrar.Click += (_, _) => Close();

            Controls.AddRange(new Control[]
            { btnCerrar, lblPaso, btnAbrirCarpeta, btnRespaldar,
              btnEntrar, txtClave, lblClave, pnlBanda });
        }

        private void Aviso(string texto, bool malo = false)
        {
            lblPaso.Text = texto;
            lblPaso.ForeColor = malo ? Estilo.RojoTexto : Estilo.TextoSuave;
            lblPaso.Refresh();
        }

        // =============================================================
        // CLAVE
        // =============================================================
        private void Entrar()
        {
            if (_abierto) return;

            if (!ClaveBuena(txtClave.Text))
            {
                _fallidos++;
                txtClave.Clear();

                if (_fallidos >= INTENTOS)
                {
                    Aviso("Clave incorrecta tres veces. La ventana se va a cerrar.", true);
                    Close();
                    return;
                }

                Aviso($"Clave incorrecta. Le quedan {INTENTOS - _fallidos} intento(s).", true);
                return;
            }

            _abierto = true;

            lblClave.Visible = false;
            txtClave.Visible = false;
            btnEntrar.Visible = false;
            btnRespaldar.Visible = true;

            Aviso("Listo. Presione el boton y escoja en que carpeta quiere el archivo.");
        }

        // =============================================================
        // RESPALDO
        // =============================================================
        private void Respaldar()
        {
            string baseDatos;
            try { baseDatos = Respaldo.NombreDeLaBase(); }
            catch (Exception ex)
            {
                Aviso("No se pudo leer a que base esta conectado el sistema.\n" +
                      ex.Message, true);
                return;
            }

            string sello = DateTime.Now.ToString("yyyy-MM-dd_HHmm");

            using var dlg = new SaveFileDialog
            {
                Title = "Guardar el respaldo de la base",
                Filter = "Respaldo comprimido (*.zip)|*.zip",
                FileName = $"{baseDatos}_Respaldo_{sello}.zip",
                InitialDirectory = Environment.GetFolderPath(
                    Environment.SpecialFolder.MyDocuments),
                OverwritePrompt = true
            };
            if (dlg.ShowDialog(this) != DialogResult.OK) return;

            Cursor = Cursors.WaitCursor;
            btnRespaldar.Enabled = false;
            btnAbrirCarpeta.Visible = false;

            try
            {
                var listo = Respaldo.Generar(dlg.FileName, t => Aviso(t));

                _ultimoArchivo = listo.Archivo;
                btnAbrirCarpeta.Visible = true;

                Aviso($"Respaldo listo:\n{listo.Archivo}\n" +
                      $"{Respaldo.Tamano(listo.Bytes)}   ·   base {baseDatos}   ·   " +
                      $"{DateTime.Now:dd/MM/yyyy hh:mm tt}" +
                      (listo.CarpetaDeTrabajo.Length > 0
                          ? $"\n(SQL Server no pudo escribir en esa carpeta: el respaldo " +
                            $"se saco en {listo.CarpetaDeTrabajo} y de ahi se comprimio)"
                          : ""));

                Registro.Anotar($"Respaldo manual de {baseDatos} en {listo.Archivo} " +
                                $"({listo.Bytes} bytes)");
            }
            catch (UnauthorizedAccessException ex)
            {
                Aviso(ex.Message, true);
                Registro.Anotar("Respaldo manual: sin permiso para escribir", ex);
            }
            catch (SqlException ex)
            {
                Aviso("SQL Server no pudo sacar el respaldo.\n" + ex.Message, true);
                Registro.Anotar("Respaldo manual fallido", ex);
            }
            catch (Exception ex)
            {
                Aviso("No se pudo terminar el respaldo.\n" + ex.Message, true);
                Registro.Anotar("Respaldo manual fallido", ex);
            }
            finally
            {
                btnRespaldar.Enabled = true;
                Cursor = Cursors.Default;
            }
        }

        private void AbrirCarpeta()
        {
            if (_ultimoArchivo.Length == 0 || !File.Exists(_ultimoArchivo)) return;

            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "explorer.exe",
                    Arguments = $"/select,\"{_ultimoArchivo}\"",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                Aviso("No se pudo abrir la carpeta.\n" + ex.Message, true);
            }
        }
    }
}
