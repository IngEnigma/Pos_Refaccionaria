/**
 * Convierte un manual HTML de docs/manual/ en PDF (requiere pdftotext, de poppler-utils).
 *   node docs/manual/generar-pdf.mjs                                  → manual.html → Manual-Usuario-TRT.pdf
 *   node docs/manual/generar-pdf.mjs tecnico.html Manual-Tecnico-TRT.pdf
 *   node docs/manual/generar-pdf.mjs despliegue.html Manual-Despliegue-TRT.pdf
 */
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const [entrada = 'manual.html', nombrePdf = 'Manual-Usuario-TRT.pdf'] = process.argv.slice(2);
const salida = path.join(dir, nombrePdf);
const opciones = { path: salida, format: 'A4', printBackground: true, preferCSSPageSize: true };

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(dir, entrada)).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf(opciones);

// Chromium no calcula números de página para el índice: se leen del primer PDF y se imprime otra vez.
// Cada página se aplana a una línea; un título se busca a partir de la página del anterior (van en orden).
const paginas = execFileSync('pdftotext', ['-layout', salida, '-'], { encoding: 'utf8' })
  .split('\f')
  .map((t) => t.replace(/\s+/g, ' '));
const titulos = await page.$$eval('.indice a', (links) =>
  links.map((a) => {
    const destino = document.querySelector(a.getAttribute('href')); // capítulo = <section>, subtema = <h2>
    const h = (destino.querySelector('h1') ?? destino).cloneNode(true);
    h.querySelector('.tag')?.remove();
    return h.textContent.replace(/\s+/g, ' ').trim();
  }),
);
let desde = 2; // índice 0 = portada, 1 = contenido
const numeros = titulos.map((t) => {
  const i = paginas.findIndex((p, k) => k >= desde && p.includes(t));
  if (i < 0) throw new Error(`No encontré «${t}» en el PDF; revisa el título o el índice.`);
  desde = i;
  return i + 1;
});
await page.$$eval('.indice .pg', (celdas, ns) => celdas.forEach((c, i) => (c.textContent = ns[i])), numeros);
await page.pdf(opciones);
await browser.close();
console.log(titulos.map((t, i) => `${String(numeros[i]).padStart(3)}  ${t}`).join('\n'));
console.log(`PDF: docs/manual/${nombrePdf}`);
