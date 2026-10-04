/*
  Pruebas del movimiento del curriculum, en un Chromium de verdad.

  Uso, con el servidor de desarrollo corriendo en el 3016:
    node scripts/probar-movimiento.mjs [url]

  Cada prueba sale de un defecto que ya aparecio (revision del 21-9-2026, ver
  la nota de Obsidian "Prompt — Animaciones del currículum"). Termina con
  "TODO OK" o con la lista de las que fallan, y sale con codigo 1 si falla
  alguna.

  Playwright NO es dependencia de este proyecto: se usa el que ya esta
  instalado con la skill playwright-skill. Otra ruta: PLAYWRIGHT=ruta.
*/
import { createRequire } from 'node:module';

const PLAYWRIGHT =
  process.env.PLAYWRIGHT || 'C:/Users/Usuario/.claude/skills/playwright-skill/node_modules/playwright';
const { chromium } = createRequire(import.meta.url)(PLAYWRIGHT);

const URL = process.argv[2] || 'http://localhost:3016';
const r = {};

// Baja de a poco hasta el final, como alguien leyendo.
async function recorrer(page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= alto; y += 350) {
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);
}

const opac = (page, i) => page.evaluate((i) => Number(getComputedStyle(document.querySelectorAll('.lamina')[i]).opacity).toFixed(2), i);
const actualIdx = (page) => page.evaluate(() => [...document.querySelectorAll('.lamina')].findIndex((i) => i.classList.contains('lamina-actual')));

(async () => {
  const b = await chromium.launch();

  // --- gal-1: volver a la anterior tambien funde, y el avance siguiente tambien
  {
    const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.locator('[data-revelar="cortina"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Pausar el pase' }).click(); // que no avance solo durante la prueba
    await page.getByRole('button', { name: 'Lámina siguiente' }).click();
    await page.waitForTimeout(230);
    await page.getByRole('button', { name: 'Lámina anterior' }).click();
    await page.waitForTimeout(40);
    const vuelta = await opac(page, await actualIdx(page));
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Lámina siguiente' }).click();
    await page.waitForTimeout(150);
    const siguiente = await opac(page, await actualIdx(page));
    await page.waitForTimeout(160);
    r.gal1_fundido = { opacidadAl40msDeVolver: vuelta, opacidadAl150msDelSiguiente: siguiente, ok: vuelta < 0.6 && siguiente < 0.9 };

    // --- pausa-1: mouse y foco por separado
    await page.getByRole('button', { name: 'Reanudar el pase' }).click();
    await page.mouse.move(5, 5);
    await page.locator('[data-revelar="cortina"]').hover();
    await page.locator('[data-revelar="cortina"]').click(); // clic en la imagen: el foco sale de los botones
    await page.waitForTimeout(150);
    const t1 = await page.evaluate(() => document.querySelector('.barra-progreso')?.getAnimations()[0]?.currentTime);
    await page.waitForTimeout(800);
    const t2 = await page.evaluate(() => document.querySelector('.barra-progreso')?.getAnimations()[0]?.currentTime);
    // foco adentro y el mouse se va
    // foco de teclado: Tab desde el boton anterior
    await page.getByRole('button', { name: 'Lámina anterior' }).focus();
    await page.keyboard.press('Tab');
    await page.mouse.move(5, 5);
    await page.waitForTimeout(150);
    const t3 = await page.evaluate(() => document.querySelector('.barra-progreso')?.getAnimations()[0]?.currentTime);
    await page.waitForTimeout(800);
    const t4 = await page.evaluate(() => document.querySelector('.barra-progreso')?.getAnimations()[0]?.currentTime);
    r.pausa1 = { mouseEncimaTrasClic: t1 === t2, focoAdentroSinMouse: t3 === t4, ok: t1 === t2 && t3 === t4 };

    // --- clic con mouse y sacar el mouse: el pase sigue
    await page.evaluate(() => document.activeElement.blur());
    await page.getByRole('button', { name: 'Lámina siguiente' }).click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(200);
    const c1 = await page.evaluate(() => document.querySelector('.barra-progreso')?.getAnimations()[0]?.currentTime);
    await page.waitForTimeout(600);
    const c2 = await page.evaluate(() => document.querySelector('.barra-progreso')?.getAnimations()[0]?.currentTime);
    r.clicYSeguir = { c1, c2, ok: c2 > c1 };

    // --- vivo-1: aria-live apagado mientras rota, prendido en pausa
    await page.evaluate(() => document.activeElement.blur());
    await page.mouse.move(5, 5);
    await page.waitForTimeout(200);
    const rotando = await page.evaluate(() => document.querySelector('[aria-live]').getAttribute('aria-live'));
    await page.getByRole('button', { name: 'Pausar el pase' }).click();
    const pausado = await page.evaluate(() => document.querySelector('[aria-live]').getAttribute('aria-live'));
    r.vivo1 = { rotando, pausado, ok: rotando === 'off' && pausado === 'polite' };

    // --- pie-1: el renglon del pie mide lo mismo en las seis laminas
    const altos = [];
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: /^Ver / }).nth(i).click();
      await page.waitForTimeout(80);
      altos.push(await page.evaluate(() => Math.round(document.querySelector('[aria-live]').getBoundingClientRect().height)));
    }
    r.pie1 = { altos, ok: new Set(altos).size === 1 };

    // --- gal-2: el riel de la actual se distingue desde el primer cuadro
    r.gal2 = await page.evaluate(() => {
      const rieles = [...document.querySelectorAll('[aria-current] > span')].map((s) => getComputedStyle(s).backgroundColor);
      const i = [...document.querySelectorAll('[aria-current]')].findIndex((b) => b.getAttribute('aria-current') === 'true');
      return { actual: rieles[i], otro: rieles[(i + 1) % rieles.length], ok: rieles[i] !== rieles[(i + 1) % rieles.length] };
    });

    // --- sub-1: el subrayado es un ::after que escala, no un fondo
    const enlace = page.locator('a.subrayable').first();
    const antes = await enlace.evaluate((a) => getComputedStyle(a, '::after').transform);
    await enlace.hover();
    await page.waitForTimeout(400);
    const despues = await enlace.evaluate((a) => getComputedStyle(a, '::after').transform);
    const fondo = await enlace.evaluate((a) => getComputedStyle(a).backgroundImage);
    r.sub1 = { antes, despues, fondo, ok: antes.includes('matrix(0') && despues === 'none' && fondo === 'none' };
    await page.close();
  }

  // --- masc-1: antes de subir, no asoma nada de la palabra
  {
    const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    const franja = await page.evaluate(() => {
      // Un titulo todavia sin revelar: el ultimo.
      const h = [...document.querySelectorAll('.seccion:not([data-visto])')].at(-1);
      const m = h.querySelector('.mascara').getBoundingClientRect();
      const p = h.querySelector('.palabra').getBoundingClientRect();
      return { mascaraAbajo: m.bottom, palabraArriba: p.top, visiblePx: +(m.bottom - p.top).toFixed(1) };
    });
    r.masc1 = { ...franja, ok: franja.visiblePx <= 0 };
    await page.close();
  }

  // --- coreo-1: la primera seccion arranca despues que el resumen
  {
    const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    r.coreo1 = await page.evaluate(() => {
      const resumen = document.querySelector('.entrada.prosa');
      const h2 = document.querySelector('.seccion[data-visto]');
      return {
        retardoPrimeraSeccion: h2 && h2.style.getPropertyValue('--retardo'),
        resumenEntradaMs: getComputedStyle(resumen).getPropertyValue('--entrada'),
      };
    });
    await page.close();
    // Medirlo en el tiempo: cuando empieza a moverse cada uno
    const p2 = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await p2.addInitScript(() => {
      window.__marcas = {};
      const mirar = () => {
        const t = performance.now();
        const resumen = document.querySelector('.entrada.prosa');
        const h2 = document.querySelector('.seccion .palabra');
        if (resumen && !window.__marcas.resumen && Number(getComputedStyle(resumen).opacity) > 0.02) window.__marcas.resumen = t;
        if (h2 && !window.__marcas.seccion && getComputedStyle(h2).transform !== 'none') {
          const m = new DOMMatrix(getComputedStyle(h2).transform);
          if (m.m42 < 18) window.__marcas.seccion = t;
        }
        if (!window.__marcas.resumen || !window.__marcas.seccion) requestAnimationFrame(mirar);
      };
      requestAnimationFrame(mirar);
    });
    await p2.goto(URL, { waitUntil: 'networkidle' });
    await p2.waitForTimeout(2000);
    const m = await p2.evaluate(() => window.__marcas);
    r.coreo1.tiempos = m;
    r.coreo1.ok = m.resumen && m.seccion && m.seccion >= m.resumen;
    await p2.close();
  }

  // --- fondo-1: recargar con la pagina al fondo deja todo visible
  for (const vp of [{ width: 360, height: 740 }, { width: 1280, height: 900 }]) {
    const page = await b.newPage({ viewport: vp });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const e = await page.evaluate(() => ({
      y: Math.round(scrollY),
      idiomas: [...document.querySelectorAll('li[data-revelar]')].slice(-2).map((li) => getComputedStyle(li).opacity),
    }));
    r['fondo1_' + vp.width] = { ...e, ok: e.y > 0 && e.idiomas.every((o) => o === '1') };
    await page.close();
  }

  // --- foco-1: con Tab, nunca queda enfocado algo invisible
  {
    const page = await b.newPage({ viewport: { width: 640, height: 450 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1300);
    const malos = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(60);
      const e = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return null;
        const b = a.closest('[data-revelar]');
        return { que: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 30), revelado: !b || b.hasAttribute('data-visto') };
      });
      if (e && !e.revelado) malos.push(e.que);
    }
    r.foco1 = { focosEnBloquesSinRevelar: malos, ok: malos.length === 0 };
    await page.close();
  }

  // --- find-1: sin movimiento, el nombre y los titulos se encuentran enteros
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    r.find1 = await page.evaluate(() => ({
      nombre: window.find('Prado Gutiérrez'),
      titulo: (getSelection().removeAllRanges(), window.find('Lo que sé hacer')),
    }));
    r.find1.ok = r.find1.nombre && r.find1.titulo;
    await ctx.close();
  }

  // --- cortina: arranca rapido (a los 150 ms de empezar ya se ve mas de un
  //     tercio). Se mide desde que EMPIEZA: si entra en pantalla junto con otros
  //     bloques, le toca su escalon (--retardo), y eso no es lentitud.
  {
    const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1300);
    await page.evaluate(() => document.querySelector('[data-revelar="cortina"]').scrollIntoView({ block: 'center' }));
    await page.waitForSelector('[data-revelar="cortina"][data-visto]');
    const retardo = await page.evaluate(
      () => parseFloat(document.querySelector('[data-revelar="cortina"]').style.getPropertyValue('--retardo')) || 0,
    );
    await page.waitForTimeout(retardo + 150);
    const clip = await page.evaluate(() => getComputedStyle(document.querySelector('.cortina')).clipPath);
    const tapado = parseFloat(clip.match(/inset\(([\d.]+)%/)?.[1] ?? '0');
    r.cortina = { retardo, clipA150msDeEmpezar: clip, ok: tapado < 66 };
    await page.close();
  }

  // --- todo aparece al bajar hasta el final, en escritorio y en telefono
  for (const vp of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
    const page = await b.newPage({ viewport: vp });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await recorrer(page);
    const e = await page.evaluate(() => ({
      total: document.querySelectorAll('[data-revelar]').length,
      escondidos: [...document.querySelectorAll('[data-revelar]')].filter(
        (el) => getComputedStyle(el).opacity !== '1' || getComputedStyle(el).transform !== 'none',
      ).length,
      anchoPagina: document.documentElement.scrollWidth,
    }));
    r['recorrido_' + vp.width] = { ...e, ok: e.escondidos === 0 && e.anchoPagina <= vp.width };
    await page.close();
  }

  // --- reducir movimiento: nada escondido, nada se desplaza, sin avance solo
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    const e = await page.evaluate(() => ({
      mov: document.documentElement.hasAttribute('data-mov'),
      escondidos: [...document.querySelectorAll('[data-revelar], .palabra, .entrada, .hoja')].filter(
        (el) => getComputedStyle(el).opacity !== '1' || getComputedStyle(el).transform !== 'none',
      ).length,
      barraAnimada: !!document.querySelector('.barra-progreso'),
    }));
    r.reducir = { ...e, ok: !e.mov && e.escondidos === 0 && !e.barraAnimada };
    await ctx.close();
  }

  // --- sin JavaScript: todo visible
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    const e = await page.evaluate(() => ({
      mov: document.documentElement.hasAttribute('data-mov'),
      escondidos: [...document.querySelectorAll('[data-revelar]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
    }));
    r.sinJS = { ...e, ok: !e.mov && e.escondidos === 0 };
    await ctx.close();
  }

  // --- salida de emergencia: si el JS de la pagina no llega, a los 3 s todo aparece
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.route('**/_next/static/chunks/**', (ruta) => ruta.abort());
    await page.goto(URL, { waitUntil: 'load' });
    const alCargar = await page.evaluate(() => document.documentElement.hasAttribute('data-mov'));
    await page.waitForTimeout(3300);
    const e = await page.evaluate(() => ({
      mov: document.documentElement.hasAttribute('data-mov'),
      escondidos: [...document.querySelectorAll('[data-revelar]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
    }));
    r.emergencia = { movAlCargar: alCargar, ...e, ok: alCargar && !e.mov && e.escondidos === 0 };
    await ctx.close();
  }

  // --- los Word de la barra de arriba: existen y son Word de verdad
  {
    const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    const enlaces = await page.$$eval('a[href$=".docx"]', (as) => as.map((a) => a.href));
    const respuestas = [];
    for (const href of enlaces) {
      const res = await page.request.get(href);
      const cuerpo = await res.body();
      respuestas.push({
        archivo: href.split('/').pop(),
        estado: res.status(),
        // Un .docx es un ZIP: empieza con "PK".
        esZip: cuerpo.subarray(0, 2).toString() === 'PK',
      });
    }
    r.descargas = {
      respuestas,
      ok: enlaces.length === 2 && respuestas.every((x) => x.estado === 200 && x.esZip),
    };
    await page.close();
  }

  // --- papel: recien cargada, sin scroll, nada escondido ni corrido
  {
    const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(300);
    const e = await page.evaluate(() => ({
      escondidos: [...document.querySelectorAll('[data-revelar], .palabra, .entrada, .hoja, .abrible li')]
        .filter((el) => el.closest('.no-imprimir') === null)
        .filter((el) => getComputedStyle(el).opacity !== '1' || getComputedStyle(el).transform !== 'none').length,
      reglaDeSeccion: getComputedStyle(document.querySelector('.seccion')).borderBottomColor,
    }));
    r.papel = { ...e, ok: e.escondidos === 0 && e.reglaDeSeccion !== 'rgba(0, 0, 0, 0)' };
    await page.close();
  }

  await b.close();
  const fallas = Object.entries(r).filter(([, v]) => v && v.ok === false).map(([k]) => k);
  console.log(JSON.stringify(r, null, 2));
  console.log(fallas.length ? 'FALLAN: ' + fallas.join(', ') : 'TODO OK');
  if (fallas.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
