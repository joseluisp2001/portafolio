const SIGNATURES: { magic: number[]; offset?: number; ext: string }[] = [
  { magic: [0xFF, 0xD8, 0xFF], ext: 'jpg' },
  { magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], ext: 'png' },
  { magic: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], ext: 'gif' },
  { magic: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], ext: 'gif' },
  { magic: [0x57, 0x45, 0x42, 0x50], offset: 8, ext: 'webp' },
];

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export function validateImage(buffer: Buffer): { valid: boolean; ext?: string; error?: string } {
  if (!buffer || buffer.length === 0) return { valid: false, error: 'Archivo vacío' };
  if (buffer.length > MAX_SIZE) return { valid: false, error: 'Archivo excede 8 MB' };
  if (buffer.length < 12) return { valid: false, error: 'Archivo demasiado pequeño' };

  for (const sig of SIGNATURES) {
    const offset = sig.offset || 0;
    const match = sig.magic.every((byte, i) => buffer[offset + i] === byte);
    if (match) return { valid: true, ext: sig.ext };
  }

  return { valid: false, error: 'Formato no reconocido. Aceptados: JPG, PNG, GIF, WEBP' };
}

export function generateImageName(tienda: string, tipo: string, nombre: string, ext: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  // Sin espacios ni tildes en el nombre del archivo: con "Desamparados Tech"
  // tal cual, el archivo quedaba con un espacio y el optimizador de imágenes
  // de Next respondía 400. Las fotos existían pero NINGUNA se veía en la tienda.
  const aSlug = (t: string, largo: number) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, largo);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${aSlug(tienda, 20)}-${aSlug(tipo, 10)}-${date}-${time}-${aSlug(nombre, 30)}-${suffix}.${ext}`;
}
