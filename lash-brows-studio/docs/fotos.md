# Las fotos del sitio

> **Al 8-9-2026, las 21 fotos del sitio son del estudio.** No queda ninguna de
> banco ni generada por IA.

Este archivo nació cuando todas eran de relleno de [Pexels](https://www.pexels.com),
puestas para que el sitio no se viera con cuadros grises mientras llegaban las
reales. Ya no hace falta: **las reales llegaron.**

Las últimas tres cayeron el 8-9-2026:

| Archivo | Qué era |
| --- | --- |
| `servicios/laminado-cejas.jpg` | Pexels |
| `servicios/henna.jpg` | Pexels — y encima mostraba una **depilación con hilo**, que es otro servicio |
| `sobre-el-estudio.jpg` | **Generada por IA.** Se notaba: la anatomía no cerraba entre el ojo, la ceja y el pincel |

Los originales viven en `Imagenes necesarias para el proyecto/` y
`scripts/place-real-images.mjs` los recorta a cada hueco. **No edites los
archivos de `public/` a mano**: el script los vuelve a generar y pisa el cambio.

> La diferencia entre una foto de banco y un trabajo real la nota una clienta al
> instante, y es justamente lo que vende. Por eso vale la pena que esto se quede
> así.

## Cómo reemplazarlas

1. Guardá tu foto con **exactamente el mismo nombre de archivo**.
2. Respetá la **relación de aspecto** de la tabla. Si no, `object-cover` va a
   recortar por el centro y puede cortar una cara.
3. Volvé a generar los previews borrosos:

```bash
node scripts/fetch-images.mjs --blur
```

Ese último paso importa: sin él la foto nueva carga sin el efecto de desenfoque
y se ve un salto feo en conexiones lentas.

## Qué va en cada archivo
| Archivo | Relación | Tamaño sugerido | Qué debería mostrar |
|---|---|---|---|
| `hero.jpg` | 4:5 (vertical) | 1200 × 1500 | La foto que abre el sitio. Una mirada terminada, luz suave, tonos cálidos. Es la más importante de todas. |
| `sobre-el-estudio.jpg` | 4:5 (vertical) | 900 × 1125 | Clienta recostada en la cabina con laminado + henna. Sale de la misma foto que la tarjeta de "Laminado + Henna", pero recortada desde arriba para que entre el estudio y no salgan idénticas. 900 y no 1200 porque el original mide 900 de ancho. |
| `servicios/volumen-medio.jpg` | 4:5 | 900 × 1125 | Volumen Medio. Densidad pareja, se nota sin ser dramático. |
| `servicios/mega-volumen.jpg` | 4:5 | 900 × 1125 | Mega Volumen. Lo más denso de la carta. |
| `servicios/rimel.jpg` | 4:5 | 900 × 1125 | Rímel. El efecto más natural, como rímel bien puesto. |
| `servicios/wispy.jpg` | 4:5 | 900 × 1125 | Wispy. Picos alternados, efecto despeinado a propósito. |
| `servicios/volumen-egipcio.jpg` | 4:5 | 900 × 1125 | Volumen Egipcio (4D). Fibra tecnológica. |
| `servicios/volumen-ingles.jpg` | 4:5 | 900 × 1125 | Volumen Inglés (5D). Fibra tecnológica. |
| `servicios/volumen-griego.jpg` | 4:5 | 900 × 1125 | Volumen Griego (6D). Fibra tecnológica, la más densa. |
| `servicios/laminado-cejas.jpg` | 4:5 | 900 × 1125 | Laminado de cejas, vello peinado hacia arriba. Foto real desde el 8-9-2026 (`laminado.jpeg`). |
| `servicios/henna.jpg` | 4:5 | 900 × 1125 | Henna. Cejas pigmentadas, con la forma marcada. Foto real desde el 8-9-2026 (`henna.jpeg`). |
| `servicios/laminado-henna.jpg` | 4:5 | 900 × 1125 | Laminado + Henna juntos: forma, cuerpo y color. |
| `galeria/01.jpg` | 4:5 | 800 × 1000 | Trabajos reales. Mezclá primeros planos de ojos con fotos de la cabina: la galería se ve mejor cuando no son ocho fotos del mismo encuadre. |
| `galeria/02.jpg` | 3:4 | 800 × 1067 | ↑ |
| `galeria/03.jpg` | 1:1 | 800 × 800 | ↑ |
| `galeria/04.jpg` | 4:5 | 800 × 1000 | ↑ |
| `galeria/05.jpg` | 3:4 | 800 × 1067 | ↑ |
| `galeria/06.jpg` | 1:1 | 800 × 800 | ↑ |
| `galeria/07.jpg` | 4:5 | 800 × 1000 | ↑ |
| `galeria/08.jpg` | 3:4 | 800 × 1067 | ↑ |
| `logo.png` | cuadrado | 144 × 144 | El monograma GR, con fondo transparente. **No se edita a mano**: lo genera `scripts/crop-logo.mjs` desde `Imagenes necesarias para el proyecto/Logo.jpeg`, buscando el monograma y descartando el texto que va debajo. |

Las relaciones de la galería están **alternadas a propósito** (4:5, 3:4, 1:1).
Es lo que hace que el mosaico tenga alturas distintas en vez de parecer una
grilla de catálogo. Si ponés las ocho en la misma relación, se pierde el efecto.

## Los textos alternativos

Cada foto tiene su `alt` en `config/site.ts`, en el arreglo `gallery` y en el
campo `imageAlt` de cada servicio. **Cambialos junto con la foto.** No son un
trámite: son lo que lee una persona ciega y lo que lee Google.

Un `alt` bueno describe el resultado, no el archivo:

- Mal: `"imagen1"`, `"foto de pestañas"`
- Bien: `"Extensiones de volumen ruso en clienta de ojos almendrados, vista de frente"`
