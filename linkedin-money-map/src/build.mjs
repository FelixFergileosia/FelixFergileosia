import fs from "fs";
import { createRequire } from "module";
const require = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require("playwright");
const [csvPath, tplPath, outDir] = process.argv.slice(2);
const lines = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const head = lines[0].split(",");
const rows = lines.slice(1).map(l => { const v = l.split(","); const o = Object.fromEntries(head.map((h, i) => [h, v[i]])); return {
  provinsi: o.provinsi, kode: +o.kode_provinsi, simpanan: +o.simpanan_juta_rp, kredit: +o.kredit_juta_rp,
  modal_kerja: +o.kredit_modal_kerja_juta_rp, investasi: +o.kredit_investasi_juta_rp, konsumsi: +o.kredit_konsumsi_juta_rp,
  umkm: +o.kredit_umkm_juta_rp, ldr: +o.rasio_kredit_simpanan_persen }; });
const html = fs.readFileSync(tplPath, "utf8").replace("__DATA__", JSON.stringify(rows));
fs.mkdirSync(outDir, { recursive: true });
const htmlOut = `${outDir}/peta-uang-indonesia-juli-2026.html`;
fs.writeFileSync(htmlOut, html);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
const errs = []; page.on("pageerror", e => errs.push(e.message)); page.on("console", m => m.type() === "error" && errs.push(m.text()));
await page.goto("file://" + htmlOut); await page.evaluate(() => document.fonts.ready);
console.log(JSON.stringify(await page.evaluate(() => window.STATS)));
// overflow check: any text element outside its slide?
console.log("overflow:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll(".slide")].map(s => {
  const r = s.getBoundingClientRect(); return [...s.querySelectorAll("text, h1, .sub, .legend, .points, .note, .cta")].filter(e => { const b = e.getBoundingClientRect(); return b.right > r.right - 40 || b.bottom > r.bottom - 92 && !e.closest("footer"); }).map(e => e.textContent.slice(0, 40)); }))));
const n = await page.locator(".slide").count();
for (let i = 0; i < n; i++) await page.locator(".slide").nth(i).screenshot({ path: `${outDir}/slide-${i + 1}.png` });
await page.pdf({ path: `${outDir}/peta-uang-indonesia-juli-2026-carousel.pdf`, width: "1080px", height: "1350px", printBackground: true });
await browser.close();
if (errs.length) console.log("ERRORS", errs);
