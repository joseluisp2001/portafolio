import pool from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Producto {
  IdProducto: number;
  Nombre: string;
  Descripcion: string | null;
  TipoProducto: string | null;
  Talla: string | null;
  Precio: number;
  RutaImagen: string | null;
}

export async function listarProductos(): Promise<Producto[]> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM Productos ORDER BY IdProducto DESC');
  return rows as Producto[];
}

export async function obtenerProducto(id: number): Promise<Producto | null> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM Productos WHERE IdProducto = ?', [id]);
  return (rows[0] as Producto) || null;
}

export async function registrarProducto(p: Omit<Producto, 'IdProducto'>): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO Productos (Nombre, Descripcion, TipoProducto, Talla, Precio, RutaImagen) VALUES (?, ?, ?, ?, ?, ?)',
    [p.Nombre, p.Descripcion, p.TipoProducto, p.Talla, p.Precio, p.RutaImagen]
  );
  return result.insertId;
}

export async function actualizarProducto(id: number, p: Partial<Producto>): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE Productos SET Nombre=?, Descripcion=?, TipoProducto=?, Talla=?, Precio=?, RutaImagen=? WHERE IdProducto=?',
    [p.Nombre, p.Descripcion, p.TipoProducto, p.Talla, p.Precio, p.RutaImagen, id]
  );
  return result.affectedRows > 0;
}

export async function eliminarProducto(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM Productos WHERE IdProducto = ?', [id]);
  return result.affectedRows > 0;
}

export async function obtenerRutaImagen(id: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT RutaImagen FROM Productos WHERE IdProducto = ?', [id]);
  return (rows[0] as { RutaImagen: string | null })?.RutaImagen || null;
}
