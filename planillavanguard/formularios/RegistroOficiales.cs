using System.Text;
using System.Text.RegularExpressions;
using GestorDatos;
using Microsoft.Data.SqlClient;

namespace formularios
{
    public partial class RegistroOficiales : Form
    {
        private readonly OficialesRepositorio _repo = new();
        private readonly ErrorProvider errorProvider = new();

        /// <summary>Las casillas de los dias libres, en el recuadro del Designer.</summary>
        private SelectorDiasLibres _diasLibres = null!;

        /// <summary>
        /// Barra de abajo. Aqui sale lo que antes era una ventana de
        /// "registro exitoso" despues de cada oficial agregado.
        /// </summary>
        private readonly Label lblEstado = new();

        public RegistroOficiales()
        {
            InitializeComponent();

            errorProvider.ContainerControl = this;
            errorProvider.BlinkStyle = ErrorBlinkStyle.NeverBlink;

            AplicarEstilo();
        }

        private void AplicarEstilo()
        {
            Estilo.Formulario(this);

            Estilo.Banda(pnlBanda);

            int margenTexto = Math.Max(40, Estilo.LogoEnBanda(pnlBanda, 62) + 22);
            lblBanda.Left = margenTexto;
            lblBandaSub.Left = margenTexto + 3;

            lblBanda.Font = Estilo.Titulo;
            lblBanda.ForeColor = Color.White;
            lblBanda.BackColor = Color.Transparent;
            Estilo.SubtituloBanda(lblBandaSub);
            lblBandaSub.AutoSize = false;

            pnlCampos.BackColor = Color.White;
            pnlCampos.BorderStyle = BorderStyle.FixedSingle;

            foreach (var l in new[] { label1, label2, label3, label4, label5, label6, label7, label9 })
                Estilo.EtiquetaCampo(l);

            foreach (Control c in new Control[]
                { txtNombre, txtCedula, txtTelefono, cbxHorario,
                  dtpVencimiento, dtpIngreso, cbxAutorizado })
                Estilo.CampoTexto(c);

            Estilo.Primario(btnAgregarOficial);
            Estilo.Secundario(btnLimpiar);
            Estilo.Secundario(btnMenuPrincipal);

            // El mismo boton de siempre, arriba a la derecha, para que
            // esta pantalla se salga igual que todas las demas.
            Estilo.BotonVolverMenu(this, pnlBanda);

            lblEstado.Dock = DockStyle.Bottom;
            lblEstado.Height = 34;
            lblEstado.Font = Estilo.Subtitulo;
            lblEstado.ForeColor = Estilo.Texto;
            lblEstado.BackColor = Estilo.Superficie;
            lblEstado.TextAlign = ContentAlignment.MiddleLeft;
            lblEstado.Padding = new Padding(22, 0, 22, 0);
            Controls.Add(lblEstado);

            KeyDown += (_, e) => { if (e.KeyCode == Keys.Escape) btnMenuPrincipal_Click(this, EventArgs.Empty); };

            VigilarCedula();
        }

        // =============================================================
        // LA CEDULA SE REVISA MIENTRAS SE ESCRIBE
        // =============================================================
        /// <summary>
        /// La ultima cedula que ya se consulto, para no ir a la base en
        /// cada tecla ni repetir la consulta al salir y volver al campo.
        /// </summary>
        private string _cedulaRevisada = "";

        /// <summary>
        /// Conecta la revision de la cedula: al salir del campo y al
        /// presionar Enter dentro de el.
        ///
        /// Antes el duplicado se descubria hasta el final, al presionar
        /// Agregar: se llenaba el nombre, el telefono, el rol, el dia
        /// libre y las dos fechas para que al final saliera un cuadro
        /// diciendo que esa persona ya estaba. Ahora se sabe apenas se
        /// pasa al campo siguiente, que es cuando todavia no cuesta nada
        /// corregir.
        /// </summary>
        private void VigilarCedula()
        {
            txtCedula.Leave += (_, _) => RevisarCedula();

            // Con Enter se pasa al telefono, salvo que la cedula este
            // repetida: ahi se queda en el campo, que es lo que hay que
            // corregir.
            txtCedula.KeyDown += (_, e) =>
            {
                if (e.KeyCode != Keys.Enter) return;

                e.SuppressKeyPress = true;
                if (RevisarCedula()) txtTelefono.Focus();
                else txtCedula.SelectAll();
            };

            // Al empezar a cambiarla se borra la marca anterior: dejar
            // el aviso rojo de la cedula vieja mientras se escribe otra
            // hace creer que la nueva tambien esta repetida.
            txtCedula.TextChanged += (_, _) =>
            {
                if (txtCedula.Text.Trim() == _cedulaRevisada) return;

                _cedulaRevisada = "";
                errorProvider.SetError(txtCedula, "");
            };
        }

        /// <summary>
        /// Revisa la cedula que este escrita y deja dicho, abajo y en el
        /// campo, si esta libre o de quien es. Devuelve false solo si
        /// esta repetida: el formato malo se marca pero no detiene nada
        /// aqui, porque de eso ya se encarga la validacion de guardar.
        /// </summary>
        private bool RevisarCedula()
        {
            string cedula = txtCedula.Text.Trim();

            if (cedula.Length == 0) { _cedulaRevisada = ""; return true; }

            if (!RxCedula.IsMatch(cedula) && !RxDimex.IsMatch(cedula))
            {
                _cedulaRevisada = "";
                errorProvider.SetError(txtCedula,
                    "Cedula invalida. Use 1-2345-6789 o un DIMEX de 11 a 12 digitos.");

                lblEstado.Text = "Revise la cedula: se escribe 1-2345-6789, " +
                                 "o solo digitos si es DIMEX.";
                lblEstado.ForeColor = Estilo.AmbarTexto;
                return true;
            }

            Oficial? repetido;
            try
            {
                Cursor = Cursors.WaitCursor;
                repetido = _repo.BuscarPorCedula(cedula);
            }
            catch (Exception ex)
            {
                // Si la base no contesta no se puede afirmar que este
                // libre. Se dice asi, y el guardado lo vuelve a mirar.
                Registro.Anotar("Registro: no se pudo revisar la cedula", ex);

                _cedulaRevisada = "";
                lblEstado.Text = "No se pudo revisar la cedula contra la base. " +
                                 "Se vuelve a revisar al guardar.";
                lblEstado.ForeColor = Estilo.AmbarTexto;
                return true;
            }
            finally { Cursor = Cursors.Default; }

            _cedulaRevisada = cedula;

            if (repetido is null)
            {
                errorProvider.SetError(txtCedula, "");
                lblEstado.Text = $"Cedula {NormalizarCedula(cedula)} libre: " +
                                 "no hay nadie registrado con ese numero.";
                lblEstado.ForeColor = Estilo.VerdeTexto;
                return true;
            }

            // ---- Ya esta ocupada ----
            string quien = $"{repetido.Nombre} (codigo {repetido.IdOficial}, {repetido.Horario})";

            errorProvider.SetError(txtCedula, $"Esa cedula ya es de {repetido.Nombre}.");

            lblEstado.Text = repetido.Activo
                ? $"REPETIDA: esa cedula ya es de {quien}. No se puede registrar dos veces."
                : $"REPETIDA: esa cedula es de {quien}, que esta dado de baja. " +
                  "Para que vuelva, reactivelo desde Editar en vez de registrarlo de nuevo.";

            lblEstado.ForeColor = Estilo.RojoTexto;

            // A proposito no se devuelve el foco al campo: esto corre al
            // salir de el, y forzar el regreso dejaria al usuario preso
            // en la cedula sin poder ni salirse de la pantalla. El aviso
            // rojo y la marca del campo alcanzan, y guardar tampoco deja
            // pasar el duplicado.
            return false;
        }

        // =============================================================
        // CARGA
        // =============================================================
        private void RegistroOficiales_Load(object? sender, EventArgs e)
        {
            // Los nueve roles y los dias salen de un solo lugar. Si
            // manana entra otro rol, se agrega alla y todos los
            // formularios lo ven.
            cbxHorario.Items.AddRange(AsistenciaRepositorio.TodosLosRoles());

            // Las casillas de los dias libres se arman sobre el recuadro
            // que dejo el Designer, en el mismo lugar donde antes estaba
            // el desplegable de un solo dia.
            _diasLibres = new SelectorDiasLibres(0, 0, pnlDiaLibre.Width);
            _diasLibres.Caja.Dock = DockStyle.Fill;
            pnlDiaLibre.Controls.Add(_diasLibres.Caja);

            dtpIngreso.Value = DateTime.Today;
            dtpVencimiento.Value = DateTime.Today.AddYears(1);
            cbxAutorizado.SelectedItem = "Pendiente";
            cbxHorario.SelectedIndex = -1;
            _diasLibres?.Limpiar();

            CentrarPanel();
            txtNombre.Focus();
        }

        /// <summary>
        /// El autorizado externo no tiene dia libre asignado: ese campo
        /// se apaga para no pedir un dato que no existe.
        /// </summary>
        private void cbxHorario_SelectedIndexChanged(object? sender, EventArgs e)
        {
            bool externo = EsExterno;

            _diasLibres.Enabled = !externo;
            label9.ForeColor = externo ? Estilo.TextoSuave : Estilo.Texto;

            if (externo)
            {
                _diasLibres?.Limpiar();
                errorProvider.SetError(pnlDiaLibre, "");
            }

            btnAgregarOficial.Text = externo ? "Agregar Autorizado" : "Agregar Oficial";
        }

        private bool EsExterno => Roles.EsExterno(cbxHorario.SelectedItem?.ToString());

        private void RegistroOficiales_Resize(object? sender, EventArgs e) => CentrarPanel();

        private void CentrarPanel()
        {
            pnlCampos.Left = Math.Max(20, (ClientSize.Width - pnlCampos.Width) / 2);
            pnlCampos.Top = Math.Max(pnlBanda.Height + 20,
                (pnlBanda.Height + ClientSize.Height - pnlCampos.Height) / 2);
        }

        // =============================================================
        // PATRONES DE VALIDACION
        // =============================================================
        private static readonly Regex RxNombre =
            new(@"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}(\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,})+$");

        private static readonly Regex RxCedula = new(@"^[1-9]-?\d{4}-?\d{4}$");
        private static readonly Regex RxDimex = new(@"^\d{11,12}$");
        private static readonly Regex RxTelefono = new(@"^[2-8]\d{3}-?\d{4}$");

        // =============================================================
        // VALIDACION
        // =============================================================
        private bool ValidarFormulario()
        {
            errorProvider.Clear();
            var errores = new StringBuilder();
            Control? primerFallo = null;

            void Marcar(Control ctrl, string mensaje)
            {
                errorProvider.SetError(ctrl, mensaje);
                errores.AppendLine("- " + mensaje);
                primerFallo ??= ctrl;
            }

            // ---- Nombre ----
            string nombre = txtNombre.Text.Trim();
            if (nombre.Length == 0)
                Marcar(txtNombre, "Digite el nombre del oficial.");
            else if (nombre.Length < 5)
                Marcar(txtNombre, "El nombre es demasiado corto.");
            else if (!RxNombre.IsMatch(nombre))
                Marcar(txtNombre, "Digite nombre y apellidos, solo letras.");

            // ---- Cedula ----
            string cedula = txtCedula.Text.Trim();
            if (cedula.Length == 0)
            {
                Marcar(txtCedula, "Digite la cedula del oficial.");
            }
            else if (!RxCedula.IsMatch(cedula) && !RxDimex.IsMatch(cedula))
            {
                Marcar(txtCedula, "Cedula invalida. Use 1-2345-6789 o un DIMEX de 11 a 12 digitos.");
            }
            else
            {
                // Se vuelve a mirar aunque el campo ya se haya revisado
                // al salir de el: entre una cosa y otra alguien mas pudo
                // haber registrado a esa persona desde otra maquina.
                try
                {
                    var repetido = _repo.BuscarPorCedula(cedula);

                    if (repetido is not null)
                        Marcar(txtCedula,
                            $"Esa cedula ya es de {repetido.Nombre} " +
                            $"(codigo {repetido.IdOficial})" +
                            (repetido.Activo
                                ? "."
                                : ", que esta dado de baja: reactivelo desde Editar."));
                }
                catch (Exception ex)
                {
                    MostrarErrorBd("No se pudo verificar la cedula en la base de datos.", ex);
                    return false;
                }
            }

            // ---- Telefono ----
            string telefono = txtTelefono.Text.Trim();
            if (telefono.Length == 0)
                Marcar(txtTelefono, "Digite el numero de telefono.");
            else if (!RxTelefono.IsMatch(telefono))
                Marcar(txtTelefono, "Telefono invalido. Deben ser 8 digitos, por ejemplo 8888-8888.");

            // ---- Listas ----
            if (cbxHorario.SelectedIndex < 0)
                Marcar(cbxHorario, "Seleccione el rol: un turno o Autorizado Externo.");

            // Al externo no se le pide dia libre: no lo tiene.
            else if (!EsExterno && _diasLibres.Vacio)
                Marcar(pnlDiaLibre, "Marque al menos un dia libre.");

            if (cbxAutorizado.SelectedIndex < 0) Marcar(cbxAutorizado, "Seleccione la autorizacion.");

            // ---- Fechas ----
            if (dtpIngreso.Value.Date > DateTime.Today)
                Marcar(dtpIngreso, "La fecha de ingreso no puede ser futura.");
            else if (dtpIngreso.Value.Year < 1980)
                Marcar(dtpIngreso, "Revise la fecha de ingreso, parece incorrecta.");

            if (dtpVencimiento.Value.Date < dtpIngreso.Value.Date)
                Marcar(dtpVencimiento, "El vencimiento no puede ser anterior al ingreso.");

            if (errores.Length > 0)
            {
                MessageBox.Show(
                    "Corrija lo siguiente antes de guardar:\n\n" + errores,
                    "Datos incompletos o incorrectos",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);

                primerFallo?.Focus();
                return false;
            }

            // La portacion vencida ya no detiene el registro con una
            // pregunta: se marca el campo y el registro sigue. La fecha
            // se puede corregir despues desde Editar.
            if (dtpVencimiento.Value.Date < DateTime.Today)
                errorProvider.SetError(dtpVencimiento, "La portacion ya esta vencida.");

            return true;
        }

        /// <summary>
        /// Deja la cedula en un solo formato para que "112345678" y
        /// "1-1234-5678" no entren como dos personas distintas.
        /// </summary>
        private static string NormalizarCedula(string cedula)
        {
            string soloDigitos = new(cedula.Where(char.IsDigit).ToArray());
            return soloDigitos.Length == 9
                ? $"{soloDigitos[0]}-{soloDigitos.Substring(1, 4)}-{soloDigitos.Substring(5, 4)}"
                : soloDigitos;
        }

        private static string CapitalizarNombre(string texto)
        {
            var cultura = System.Globalization.CultureInfo.GetCultureInfo("es-CR");
            return cultura.TextInfo.ToTitleCase(texto.ToLower(cultura));
        }

        // =============================================================
        // AGREGAR
        // =============================================================
        private void btnAgregarOficial_Click(object sender, EventArgs e)
        {
            if (!ValidarFormulario()) return;

            bool externo = EsExterno;

            var oficial = new Oficial
            {
                Nombre = CapitalizarNombre(txtNombre.Text.Trim()),
                Cedula = NormalizarCedula(txtCedula.Text.Trim()),
                Telefono = txtTelefono.Text.Trim(),
                Horario = cbxHorario.SelectedItem!.ToString()!,
                DiaLibre = externo
                    ? AsistenciaRepositorio.SinDiaLibre
                    : _diasLibres.Valor,
                VencimientoPortacion = dtpVencimiento.Value.Date,
                FechaIngreso = dtpIngreso.Value.Date,
                Autorizado = cbxAutorizado.SelectedItem!.ToString()!
                // Contadores en 0 por DEFAULT. CodigoChaleco en NULL.
            };

            try
            {
                Cursor = Cursors.WaitCursor;
                int nuevoId = _repo.Agregar(oficial);

                LimpiarFormulario();

                // Sin ventana de "registro exitoso": el formulario ya
                // quedo en blanco listo para el siguiente, y el codigo
                // asignado se lee abajo.
                lblEstado.Text =
                    (externo ? "Autorizado externo registrado" : "Oficial registrado") +
                    $"   |   Codigo {nuevoId}   |   {oficial.Nombre}   |   " +
                    $"{oficial.Cedula}   |   {oficial.Horario}" +
                    (externo ? "   |   queda disponible para sustituciones"
                             : $"   |   libra {oficial.DiaLibre}");
            }
            catch (SqlException ex) when (ex.Number is 2601 or 2627)
            {
                MessageBox.Show("Ya existe una persona registrada con esa cedula.",
                    "Cedula duplicada", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                errorProvider.SetError(txtCedula, "Cedula duplicada.");
                txtCedula.Focus();
            }
            catch (SqlException ex) when (ex.Number == 547)
            {
                MessageBox.Show(
                    "Alguno de los datos no cumple con las reglas de la base.\n\n" +
                    "Revise el rol, el dia libre y la autorizacion.\n\n" +
                    "Si la base todavia no conoce el rol de Autorizado Externo ni los " +
                    "turnos nuevos (14:00 - 21:00, 06:00 - 12:00, 07:00 - 16:00 y " +
                    "12:00 - 18:00), corra el archivo " +
                    "PlanillaVanguard_ACTUALIZACION.sql.",
                    "Dato no permitido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            catch (Exception ex)
            {
                MostrarErrorBd("No se pudo guardar el registro.", ex);
            }
            finally
            {
                Cursor = Cursors.Default;
            }
        }

        private void btnLimpiar_Click(object sender, EventArgs e) => LimpiarFormulario();

        private void LimpiarFormulario()
        {
            errorProvider.Clear();
            txtNombre.Clear();
            txtCedula.Clear();
            txtTelefono.Clear();
            cbxHorario.SelectedIndex = -1;
            _diasLibres?.Limpiar();
            cbxAutorizado.SelectedItem = "Pendiente";
            dtpIngreso.Value = DateTime.Today;
            dtpVencimiento.Value = DateTime.Today.AddYears(1);
            txtNombre.Focus();
        }

        // =============================================================
        // SALIR
        // =============================================================
        private void btnMenuPrincipal_Click(object sender, EventArgs e) =>
            Estilo.VolverAlMenu(this);

        private static void MostrarErrorBd(string contexto, Exception ex) =>
            MessageBox.Show($"{contexto}\n\nDetalle tecnico:\n{ex.Message}",
                "Error de base de datos", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
