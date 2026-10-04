import mysql from 'mysql2/promise';

/**
 * La conexion a MySQL.
 *
 * Las tres tiendas (tech-services, shein-los-guido y rapitelas) hablan con la
 * MISMA tabla `Productos`. Este archivo tenia 14 lineas y le faltaban los
 * cuatro ajustes que shein ya habia resuelto, cada uno por un bug concreto:
 *
 * `charset: 'utf8mb4'` no es opcional en una tienda en espanol. Sin el, mysql2
 * negocia el juego de caracteres por defecto del servidor y los nombres llegan
 * rotos: un producto que la app movil guarde como "Reparacion" con tilde se lee
 * bien en shein y "ReparaciÃ³n" aca. Mismo dato, misma tabla, dos resultados.
 *
 * `decimalNumbers` deja que los DECIMAL vuelvan como numero y no como string.
 * `components/ProductCard.tsx` declara `Precio: number` y hace
 * `price.toLocaleString('es-CR')` — sin esto llega el texto "15000.00", y
 * `String.prototype.toLocaleString` lo devuelve tal cual: la tienda mostraba
 * "₡15000.00".
 *
 * `timezone: 'Z'` para que las fechas no se corran segun donde este el
 * servidor.
 *
 * `connectTimeout` para que, si la base no esta, falle rapido y la pagina
 * muestre su aviso, en vez de dejar al cliente mirando una pantalla en blanco.
 */
const pool = mysql.createPool({
  /*
    OJO con estos valores por defecto: si las variables de entorno no llegan,
    esto intenta entrar como root sin contrasena a una base local. En
    desarrollo es comodo; en el servidor significa que un despliegue con el
    .env mal cargado no falla con un error claro sino con uno de conexion.
    Se dejan como estaban para no romper el entorno local de nadie, pero es
    candidato a revisar. Ver "Arreglos a medias" en las notas.
  */
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'TechServices',

  charset: 'utf8mb4',
  decimalNumbers: true,
  timezone: 'Z',

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 8000,
});

export default pool;
