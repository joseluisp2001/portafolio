# Currículum

Currículum como documento: se lee en pantalla y se imprime perfecto.

## Qué resuelve
No es una landing personal con degradados. Es **un documento**: se lee de arriba
a abajo, se imprime en dos páginas sin desarmarse, y el que lo recibe puede
reenviarlo.

Estética **print-first**: se diseña la hoja y la pantalla la muestra. La prueba
es imprimir a PDF y abrirlo — si hay que tocar algo, no está terminado.

## Qué mirar
- `@page A4` y `break-inside: avoid` en cada bloque: **un puesto de trabajo
  nunca se parte entre dos páginas**, que es el defecto más común de los
  currículums hechos en web.
- En pantalla las habilidades se abren de a una y hay un pase de imágenes con
  fundido; **al imprimir se abren todas y el pase desaparece.** No son dos
  diseños: es el mismo con la parte interactiva apagada donde no existe.
- Newsreader con el eje `opsz`: el nombre y un subtítulo dejan de verse
  dibujados con el mismo grosor de trazo. Números de estilo antiguo en el texto
  corrido y tabulares en las fechas.
- `scripts/revisar-publico.mjs`: revisa una carpeta antes de publicarla y falla
  si encuentra claves, teléfonos, correos o IPs. Con lista de permitidos por
  proyecto.
- **El movimiento es solo de pantalla.** La hoja se posa, el nombre y los
  títulos suben palabra por palabra detrás de una máscara, los bloques aparecen
  al bajar y la galería funde sin pasar por el blanco. Todo lo que se esconde
  cuelga de `html[data-mov]`, que pone un script en `<head>` salvo con
  "reducir movimiento": en papel, sin JavaScript o con esa preferencia, la
  página está entera y quieta. `pnpm probar:movimiento` lo comprueba en un
  Chromium de verdad (20 pruebas, con el servidor de desarrollo corriendo).
- La demo de registro/ingreso **no autentica nada y está hecha para que se
  note**: sin `fetch`, sin `action`, sin almacenamiento, `autocomplete="off"`, y
  el aviso arriba de todo. Un formulario que se ve real y no valida nada recoge
  contraseñas bajo falsa apariencia.

## Cómo correrlo

```bash
pnpm install
pnpm dev --port 3016
```

Para el PDF: `Ctrl/Cmd + P` desde el navegador.

Para el Word, en español y en inglés: `pnpm word`. Sale en `public/documentos/`
(el sitio lo ofrece para descargar junto al botón de PDF), en
`.docx` y en `.doc`, armado para que lo lea un ATS: una columna, sin tablas ni
imágenes, el contacto en el cuerpo y títulos de sección con estilo de Word. El
español sale del mismo `config/cv.ts` que el sitio y el inglés de
`config/cv-en.ts`; si una lista no tiene el mismo largo en los dos, el
generador falla en vez de dejar un hueco. El `.doc` lo escribe Word, así que
ese paso necesita Word instalado.

---

Los proyectos que muestra están en repos aparte:
[soda](../soda) ·
[barberia](../barberia) ·
[veterinaria](../veterinaria) ·
[ferreteria](../ferreteria) ·
[estampados](../estampados)
