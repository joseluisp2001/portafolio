// Anillo de partículas del hero, al estilo de antigravity.google.
// 65.536 partículas (16.384 en teléfono) simuladas en la GPU con dos texturas de
// posición que se turnan. Cada una tiene un sitio fijo y deriva con ruido simplex;
// cerca del anillo que sigue al mouse crece, toma color y se vuelve un guioncito
// orientado hacia afuera. Detrás del texto se apagan (zonas calmas) para que el
// contraste no dependa de dónde esté el anillo. En escritorio el lienzo va fijo
// detrás de toda la portada: sobre las franjas oscuras usa la paleta oscura y
// sobre las claras la clara (sin blanco, que ahí no se ve).
// Viene de GIT\fondos-vivos\sala\fx\antigravity.js. Se carga con import(): no
// entra en el JavaScript inicial de la página.

type Rgb = readonly [number, number, number];

export interface PaletaAnillo {
  lejos: Rgb;
  c1: Rgb;
  c2: Rgb;
  c3: Rgb;
  c4: Rgb;
}

export interface ColoresAnillo {
  oscuro: PaletaAnillo;
  claro: PaletaAnillo;
}

/** Tope de zonas calmas y de franjas oscuras por cuadro (uniformes del shader). */
export const MAX_ZONAS = 24;
export const MAX_OSCURAS = 4;

export interface EstadoAnillo {
  /** Centro del anillo en uv, y hacia arriba. */
  mx: number;
  my: number;
  /** Tiempo propio del anillo en segundos: no avanza mientras duerme. */
  t: number;
  dt: number;
  /** 0 a 1, ya con la curva aplicada. */
  entrada: number;
  pulso: number;
  /** Zonas calmas en uv (x0, y0, x1, y1 por zona), y hacia arriba. */
  zonas: Float32Array;
  /** Opacidad que queda dentro de cada zona: 0 la apaga del todo. */
  zonasAlfa: Float32Array;
  nZonas: number;
  /** Franjas oscuras en uv (y0, y1 por franja), y hacia arriba. Fuera de ellas, paleta clara. */
  oscuras: Float32Array;
  nOscuras: number;
  /** Desde esta altura (uv, y hacia arriba) empieza el encabezado: también es zona calma. */
  tope: number;
  /** Opacidad bajo el encabezado. */
  topeAlfa: number;
  /** Señales de la placa (lib/senales.ts): x, y, tamaño en px del lienzo, alfa, dureza. */
  sprites?: Float32Array;
  nSprites?: number;
  /** Lleva las partículas a su sitio en un solo cuadro (cuadro fijo, cambio de tamaño). */
  asentar?: boolean;
}

export interface Anillo {
  resize(w: number, h: number, dpr: number): void;
  frame(e: EstadoAnillo): void;
  destroy(): void;
}

interface Programa {
  p: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
}

function compilar(gl: WebGL2RenderingContext, tipo: number, src: string): WebGLShader {
  const s = gl.createShader(tipo);
  if (!s) throw new Error('Anillo: no se pudo crear un shader');
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('Anillo: un shader no compila. ' + log);
  }
  return s;
}

function programa(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): Programa {
  const vs = compilar(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compilar(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  if (!p) throw new Error('Anillo: no se pudo crear el programa');
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error('Anillo: el programa no enlaza. ' + log);
  }
  const u: Programa['u'] = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    if (info) u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

// Busca un formato de coma flotante en el que se pueda dibujar.
function formatoFlotante(gl: WebGL2RenderingContext): number {
  const prueba = (interno: number) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, interno, 4, 4, 0, gl.RGBA, gl.FLOAT, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);
    return ok;
  };
  if (gl.getExtension('EXT_color_buffer_float')) {
    if (prueba(gl.RGBA32F)) return gl.RGBA32F;
    if (prueba(gl.RGBA16F)) return gl.RGBA16F;
  }
  if (gl.getExtension('EXT_color_buffer_half_float') && prueba(gl.RGBA16F)) return gl.RGBA16F;
  throw new Error('Anillo: el navegador no dibuja en texturas de coma flotante');
}

function crearTex(gl: WebGL2RenderingContext, interno: number, w: number, h: number, datos: Float32Array | null) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, interno, w, h, 0, gl.RGBA, gl.FLOAT, datos);
  return t;
}

// Ruido simplex 3D (Ashima Arts / Stefan Gustavson, licencia MIT).
const SIMPLEX = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// Triángulo que cubre todo el destino, sin atributos.
const VS_QUAD = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Simulación: una partícula por texel.
// xy = posición (uv, y arriba), z = intensidad de anillo suavizada, w = anillo crudo.
const FS_SIM = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uPos;
uniform sampler2D uRef;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uTime;
uniform float uK;
uniform float uRadio;
uniform float uPulso;
uniform float uElegible;
out vec4 o;
${SIMPLEX}
void main() {
  ivec2 tc = ivec2(gl_FragCoord.xy);
  vec4 prev = texelFetch(uPos, tc, 0);
  vec4 ref = texelFetch(uRef, tc, 0);
  float t = uTime;
  vec2 esc = vec2(1.0, uAspect);
  vec2 q = ref.xy * esc;
  // deriva con ruido simplex a tres escalas
  vec2 deriva =
      vec2(snoise(vec3(q * 1.3, t * 0.04)), snoise(vec3(q * 1.3 + 31.7, t * 0.04))) * 0.028
    + vec2(snoise(vec3(q * 4.2, t * 0.09 + 5.0)), snoise(vec3(q * 4.2 + 13.1, t * 0.09 + 5.0))) * 0.010
    + vec2(snoise(vec3(q * 12.0, t * 0.2 + 9.0)), snoise(vec3(q * 12.0 + 7.3, t * 0.2 + 9.0))) * 0.0035;
  vec2 p = q + deriva;
  vec2 d = p - uMouse * esc;
  float dist = length(d);
  vec2 dir = dist > 1e-5 ? d / dist : vec2(1.0, 0.0);
  // el ruido deforma el anillo para que no sea un círculo perfecto
  float bamboleo = snoise(vec3(dir * 1.4, t * 0.35)) * 0.032
                 + snoise(vec3(dir * 3.6 + 4.0, t * 0.6)) * 0.010;
  float r1 = uRadio * (1.0 + uPulso * 0.35) + bamboleo;
  float r2 = r1 - 0.07 + bamboleo * 0.6;
  float e1 = (dist - r1) / 0.028;
  float e2 = (dist - r2) / 0.008;
  float a1 = exp(-e1 * e1);
  float a2 = exp(-e2 * e2);
  float anillo = max(a1, a2 * 0.85);
  float meta = anillo * step(ref.w, uElegible);
  vec2 empuje = dir * (a1 * (0.032 + uPulso * 0.05) + a2 * 0.010);
  vec2 destino = (p + empuje) / esc;
  o.xy = mix(prev.xy, destino, uK);
  o.z = mix(prev.z, meta, min(1.0, uK * 1.3));
  o.w = anillo;
}`;

const VS_DIB = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uPos;
uniform sampler2D uRef;
uniform int uSize;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uPx;
uniform float uLejos;
uniform float uAlfaLejos;
uniform float uAlfa;
uniform vec4 uZonas[${MAX_ZONAS}];
uniform float uZonasAlfa[${MAX_ZONAS}];
uniform int uNZonas;
uniform vec2 uOscuras[${MAX_OSCURAS}];
uniform int uNOscuras;
uniform float uTope;
uniform float uTopeAlfa;
// 0 a 4: lejos, c1, c2, c3, c4 de la paleta oscura; 5 a 9, de la clara
uniform vec3 uPal[10];
out vec4 vCol;
out vec2 vDir;
out float vForma;
out float vTam;
void main() {
  int id = gl_VertexID;
  ivec2 tc = ivec2(id % uSize, id / uSize);
  vec4 p = texelFetch(uPos, tc, 0);
  vec4 r = texelFetch(uRef, tc, 0);
  float k = clamp(p.z, 0.0, 1.0);
  float e = smoothstep(0.04, 0.55, k);
  // ¿sobre una franja oscura? (borde suave de 12 px a 1280 de ancho)
  float oscuro = 0.0;
  for (int i = 0; i < ${MAX_OSCURAS}; i++) {
    if (i >= uNOscuras) break;
    vec2 f = uOscuras[i];
    oscuro = max(oscuro, smoothstep(f.x - 0.01, f.x + 0.01, p.y) * (1.0 - smoothstep(f.y - 0.01, f.y + 0.01, p.y)));
  }
  // 45 % cian, 40 % cian oscuro, 8 % blanco (el blanco es del texto) y 7 % tinta
  int j = r.z < 0.45 ? 1 : (r.z < 0.85 ? 2 : (r.z < 0.93 ? 3 : 4));
  vec3 c = mix(uPal[j + 5], uPal[j], oscuro);
  vec3 dotCol = mix(uPal[5], uPal[0], oscuro);
  float azar = fract(r.z * 17.13 + r.w * 3.7);
  // lejos del anillo: pocos puntitos tenues (sobre lo claro, más tenues: se leían como polvo)
  float lejos = step(r.w, uLejos) * uAlfaLejos * (0.55 + 0.45 * azar) * mix(0.3, 1.0, oscuro)
              + clamp(p.w, 0.0, 1.0) * 0.12 * step(r.w, 0.6);
  float alfa = mix(lejos, 0.92, e);
  // zonas calmas: detrás del texto el anillo se apaga (del todo, o al tope de la zona)
  float dentro = smoothstep(uTope - 0.02, uTope, p.y);
  float queda = mix(1.0, uTopeAlfa, dentro);
  for (int i = 0; i < ${MAX_ZONAS}; i++) {
    if (i >= uNZonas) break;
    vec4 z = uZonas[i];
    vec2 bordes = vec2(min(p.x - z.x, z.z - p.x), min(p.y - z.y, z.w - p.y) * uAspect);
    float d = smoothstep(-0.015, 0.02, min(bordes.x, bordes.y));
    dentro = max(dentro, d);
    queda = min(queda, mix(1.0, uZonasAlfa[i], d));
  }
  alfa *= queda * uAlfa;
  // dentro de la zona pierden el blanco y el cian fuerte: quedan grises y chicas
  vCol = vec4(mix(mix(dotCol, c, e), dotCol, dentro * 0.6), alfa);
  float tam = mix(1.8, mix(4.0, 8.5, azar), e) * uPx * mix(1.0, 0.65, dentro);
  vTam = tam;
  gl_PointSize = tam;
  vec2 d = (p.xy - uMouse) * vec2(1.0, uAspect);
  float l = length(d);
  vDir = l > 1e-5 ? d / l : vec2(1.0, 0.0);
  vForma = e;
  gl_Position = alfa < 0.01 ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(p.xy * 2.0 - 1.0, 0.0, 1.0);
}`;

// Rectángulo redondeado girado en dirección radial. Sale premultiplicado: el
// lienzo es transparente y el navegador lo compone sobre el hero.
const FS_DIB = `#version 300 es
precision highp float;
in vec4 vCol;
in vec2 vDir;
in float vForma;
in float vTam;
out vec4 o;
void main() {
  vec2 pc = gl_PointCoord - 0.5;
  pc.y = -pc.y;
  vec2 q = vec2(dot(pc, vDir), dot(pc, vec2(-vDir.y, vDir.x)));
  vec2 b = mix(vec2(0.3), vec2(0.42, 0.12), vForma);
  float rr = mix(0.28, 0.11, vForma);
  vec2 dq = abs(q) - b + rr;
  float sd = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0) - rr;
  float aa = 0.9 / max(vTam, 1.0);
  float a = 1.0 - smoothstep(-aa, aa, sd);
  float alfa = vCol.a * a;
  if (alfa < 0.004) discard;
  o = vec4(vCol.rgb * alfa, alfa);
}`;

// Señales de la placa: puntos redondos, con halo suave (dureza 0) o nítidos (1).
// Van en px del lienzo; el color es el cian del sitio.
const VS_SPR = `#version 300 es
layout(location = 0) in vec4 aDato;
layout(location = 1) in float aDureza;
uniform vec2 uLienzo;
uniform float uPx;
out float vAlfa;
out float vDureza;
void main() {
  gl_Position = vec4(aDato.x / uLienzo.x * 2.0 - 1.0, 1.0 - aDato.y / uLienzo.y * 2.0, 0.0, 1.0);
  gl_PointSize = aDato.z * uPx;
  vAlfa = aDato.w;
  vDureza = aDureza;
}`;

const FS_SPR = `#version 300 es
precision mediump float;
in float vAlfa;
in float vDureza;
uniform vec3 uColor;
out vec4 o;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float suave = (1.0 - r) * (1.0 - r);
  float nitido = 1.0 - smoothstep(0.55, 1.0, r);
  float a = vAlfa * mix(suave, nitido, vDureza);
  o = vec4(uColor * a, a);
}`;

/** Tope de puntos de señal por cuadro. */
const MAX_SPRITES = 1024;
const CIAN = [0x06 / 255, 0xb6 / 255, 0xd4 / 255] as const; // --color-accent

export function crearAnillo(
  canvas: HTMLCanvasElement,
  { movil, colores }: { movil: boolean; colores: ColoresAnillo }
): Anillo {
  // Sin antialias: el shader ya suaviza los bordes y el búfer extra pesa en el teléfono.
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('Anillo: sin WebGL2');
  try {
    return armar(canvas, gl, { movil, colores });
  } catch (e) {
    // que no quede un contexto vivo si algo falló a mitad de camino
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    throw e;
  }
}

function armar(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  { movil, colores }: { movil: boolean; colores: ColoresAnillo }
): Anillo {
  const interno = formatoFlotante(gl);
  const S = movil ? 128 : 256;
  const N = S * S;
  const elegible = movil ? 0.3 : 0.14; // parte de las partículas que se enciende en el anillo
  const lejos = movil ? 0.14 : 0.06; // parte visible como puntito tenue
  const alfaLejos = 0.45;

  // Sitios fijos: rejilla con temblor para cubrir el hero parejo.
  const ref = new Float32Array(N * 4);
  const ini = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const x = ((i % S) + Math.random()) / S;
    const y = (((i / S) | 0) + Math.random()) / S;
    ref.set([x, y, Math.random(), Math.random()], i * 4);
    ini[i * 4] = x;
    ini[i * 4 + 1] = y;
  }
  const texRef = crearTex(gl, gl.RGBA32F, S, S, ref);
  const pos = [crearTex(gl, interno, S, S, ini), crearTex(gl, interno, S, S, ini)];
  const fbo = pos.map((t) => {
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Anillo: no se pudo preparar la textura de simulación');
    }
    return f;
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const sim = programa(gl, VS_QUAD, FS_SIM);
  const dib = programa(gl, VS_DIB, FS_DIB);
  const vao = gl.createVertexArray();
  const spr = programa(gl, VS_SPR, FS_SPR);
  const vaoSpr = gl.createVertexArray();
  const bufSpr = gl.createBuffer();
  gl.bindVertexArray(vaoSpr);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufSpr);
  gl.bufferData(gl.ARRAY_BUFFER, MAX_SPRITES * 5 * 4, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  const paleta = new Float32Array(30);
  [colores.oscuro, colores.claro].forEach((p, k) =>
    [p.lejos, p.c1, p.c2, p.c3, p.c4].forEach((c, i) => paleta.set(c, (k * 5 + i) * 3)),
  );

  let W = 0;
  let H = 0;
  let DPR = 1;
  let cur = 0;
  let primero = true;

  return {
    resize(w, h, dpr) {
      W = w;
      H = h;
      DPR = dpr;
    },

    frame({ mx, my, t, dt, entrada, pulso, zonas, zonasAlfa, nZonas, oscuras, nOscuras, tope, topeAlfa, asentar, sprites, nSprites = 0 }) {
      if (!W || !H) return;
      // el primer cuadro salta directo al estado final: sirve al cuadro fijo
      const k = primero || asentar ? 1 : 1 - Math.exp(-dt * 7);
      primero = false;
      const aspecto = H / W;
      const radio = (H > W ? 0.34 : 0.2) * (0.35 + 0.65 * entrada);
      const escala = movil ? 0.9 : Math.min(1.35, Math.max(0.75, W / 1280));

      gl.bindVertexArray(vao);

      // 1) simulación
      const nxt = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[nxt]);
      gl.viewport(0, 0, S, S);
      gl.disable(gl.BLEND);
      gl.useProgram(sim.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pos[cur]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texRef);
      gl.uniform1i(sim.u.uPos, 0);
      gl.uniform1i(sim.u.uRef, 1);
      gl.uniform2f(sim.u.uMouse, mx, my);
      gl.uniform1f(sim.u.uAspect, aspecto);
      gl.uniform1f(sim.u.uTime, t);
      gl.uniform1f(sim.u.uK, k);
      gl.uniform1f(sim.u.uRadio, radio);
      gl.uniform1f(sim.u.uPulso, pulso);
      gl.uniform1f(sim.u.uElegible, elegible);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      cur = nxt;

      // 2) dibujo sobre un lienzo transparente, en premultiplicado
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(dib.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pos[cur]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texRef);
      gl.uniform1i(dib.u.uPos, 0);
      gl.uniform1i(dib.u.uRef, 1);
      gl.uniform1i(dib.u.uSize, S);
      gl.uniform2f(dib.u.uMouse, mx, my);
      gl.uniform1f(dib.u.uAspect, aspecto);
      gl.uniform1f(dib.u.uPx, DPR * escala);
      gl.uniform1f(dib.u.uLejos, lejos);
      gl.uniform1f(dib.u.uAlfaLejos, alfaLejos);
      gl.uniform1f(dib.u.uAlfa, entrada);
      gl.uniform4fv(dib.u.uZonas, zonas);
      gl.uniform1fv(dib.u.uZonasAlfa, zonasAlfa);
      gl.uniform1i(dib.u.uNZonas, Math.min(nZonas, MAX_ZONAS));
      gl.uniform2fv(dib.u.uOscuras, oscuras);
      gl.uniform1i(dib.u.uNOscuras, Math.min(nOscuras, MAX_OSCURAS));
      gl.uniform1f(dib.u.uTope, tope);
      gl.uniform1f(dib.u.uTopeAlfa, topeAlfa);
      gl.uniform3fv(dib.u.uPal, paleta);
      gl.drawArrays(gl.POINTS, 0, N);

      // 3) señales de la placa, encima de las partículas
      const ns = sprites ? Math.min(nSprites, MAX_SPRITES) : 0;
      if (ns > 0 && sprites) {
        gl.useProgram(spr.p);
        gl.bindVertexArray(vaoSpr);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufSpr);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, sprites, 0, ns * 5);
        gl.uniform2f(spr.u.uLienzo, W, H);
        gl.uniform1f(spr.u.uPx, DPR);
        gl.uniform3f(spr.u.uColor, CIAN[0], CIAN[1], CIAN[2]);
        gl.drawArrays(gl.POINTS, 0, ns);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      }
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    },

    destroy() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      fbo.forEach((f) => gl.deleteFramebuffer(f));
      pos.forEach((t) => gl.deleteTexture(t));
      gl.deleteTexture(texRef);
      gl.deleteProgram(sim.p);
      gl.deleteProgram(dib.p);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(spr.p);
      gl.deleteVertexArray(vaoSpr);
      gl.deleteBuffer(bufSpr);
      // No se pierde el contexto a propósito: en desarrollo el efecto se monta dos
      // veces sobre el mismo lienzo y un contexto perdido no vuelve.
    },
  };
}
