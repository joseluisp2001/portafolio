using GestorDatos;

namespace formularios
{
    /// <summary>
    /// Las siete casillas para marcar que dias libra una persona.
    ///
    /// Antes era un desplegable de un solo dia. Se cambio porque en la
    /// operacion hay gente que libra dos -- sabado y domingo -- y al
    /// escoger uno solo el sistema la esperaba el otro dia y le marcaba
    /// una ausencia que no era.
    ///
    /// Van en una sola fila, con el nombre del dia en tres letras, para
    /// caber en el mismo espacio donde estaba el desplegable y no tener
    /// que mover toda la ficha. El nombre completo sale en el globito al
    /// dejar el raton encima.
    /// </summary>
    public sealed class SelectorDiasLibres
    {
        private readonly CheckBox[] _casillas;
        private readonly ToolTip _globo = new() { InitialDelay = 400 };

        /// <summary>El recuadro que las contiene. Es lo que se agrega a la pantalla.</summary>
        public Panel Caja { get; } = new();

        /// <summary>Se llama cuando se marca o se desmarca alguna.</summary>
        public event EventHandler? Cambio;

        public SelectorDiasLibres(int x, int y, int ancho, int alto = 28)
        {
            Caja.SetBounds(x, y, ancho, alto);
            Caja.BackColor = Color.Transparent;

            var dias = AsistenciaRepositorio.Dias;
            _casillas = new CheckBox[dias.Length];

            // El ancho se reparte entre los siete: asi la fila entra
            // completa aunque la ficha sea mas angosta en otra pantalla.
            int paso = ancho / dias.Length;

            for (int i = 0; i < dias.Length; i++)
            {
                var c = new CheckBox
                {
                    Text = dias[i][..3],
                    Tag = dias[i],
                    Font = Estilo.Subtitulo,
                    ForeColor = Estilo.Texto,
                    AutoSize = false,
                    Cursor = Cursors.Hand
                };

                c.SetBounds(i * paso, 2, paso - 4, 24);
                c.CheckedChanged += (_, _) => Cambio?.Invoke(this, EventArgs.Empty);

                _globo.SetToolTip(c, dias[i]);

                _casillas[i] = c;
                Caja.Controls.Add(c);
            }
        }

        /// <summary>
        /// Lo que se guarda en la base: los dias separados por coma, o
        /// "Ninguno" si no hay ninguno marcado.
        /// </summary>
        public string Valor
        {
            get => DiasLibres.Armar(
                _casillas.Where(c => c.Checked).Select(c => (string)c.Tag!));

            set
            {
                var marcados = DiasLibres.Partir(value);

                foreach (var c in _casillas)
                    c.Checked = marcados.Contains((string)c.Tag!,
                                                  StringComparer.OrdinalIgnoreCase);
            }
        }

        /// <summary>True si no hay ningun dia marcado.</summary>
        public bool Vacio => !_casillas.Any(c => c.Checked);

        /// <summary>Como se lee: "Sabado y Domingo".</summary>
        public string Texto => DiasLibres.ParaMostrar(Valor);

        public bool Enabled
        {
            get => Caja.Enabled;
            set
            {
                Caja.Enabled = value;

                // Apagado se ve gris, para que se note que no aplica:
                // al autorizado externo no se le pide dia libre.
                foreach (var c in _casillas)
                    c.ForeColor = value ? Estilo.Texto : Estilo.TextoSuave;
            }
        }

        public void Limpiar()
        {
            foreach (var c in _casillas) c.Checked = false;
        }
    }
}
