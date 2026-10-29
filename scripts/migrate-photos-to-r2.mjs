// Copia las fotos actuales (migration/products + migration/product-images.json) al bucket R2,
// genera la miniatura WebP de 640 px de cada una y escribe la asociación código -> fotos.
// No borra nada del repositorio.
//   node scripts/migrate-photos-to-r2.mjs           → R2 local (para `npm run dev` / `npm run preview`)
//   node scripts/migrate-photos-to-r2.mjs --remote  → R2 real de Cloudflare (requiere `npx wrangler login`)
// WRANGLER_PERSIST: carpeta del R2 local (útil en Windows si la ruta del proyecto es muy larga).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { getPlatformProxy } from "wrangler";

const remote = process.argv.includes("--remote");
const BUCKET = "abacsa-fotos";
const SRC = "migration";
const map = JSON.parse(fs.readFileSync(path.join(SRC, "product-images.json"), "utf8"));
const urls = Object.values(map).flatMap((e) => e.gallery);
const missing = urls.filter((u) => !fs.existsSync(path.join(SRC, u.replace(/^\/images\//, ""))));
if (missing.length) throw new Error("Faltan archivos: " + missing.join(", "));

const typeOf = (k) => (/\.png$/i.test(k) ? "image/png" : /\.webp$/i.test(k) ? "image/webp" : /\.json$/.test(k) ? "application/json" : "image/jpeg");

// Destino: R2 remoto con el comando oficial de wrangler (un archivo por llamada), o R2 local emulado.
let put, check, dispose = async () => {};
if (remote) {
  const wrangler = path.join("node_modules", "wrangler", "bin", "wrangler.js");
  const run = (...args) => execFileSync(process.execPath, [wrangler, "r2", "object", ...args, "--remote"], { stdio: "pipe" }).toString();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "abacsa-r2-"));
  put = (key, buf) => {
    const f = path.join(tmp, "obj");
    fs.writeFileSync(f, buf);
    for (let i = 1; ; i++) {
      try {
        return run("put", `${BUCKET}/${key}`, "--file", f, "--content-type", typeOf(key));
      } catch (e) {
        if (i === 3) throw e;
      }
    }
  };
  check = (key) => run("get", `${BUCKET}/${key}`, "--pipe");
} else {
  const persist = process.env.WRANGLER_PERSIST ? { path: process.env.WRANGLER_PERSIST } : true;
  const proxy = await getPlatformProxy({ persist });
  const b = proxy.env.PHOTOS;
  put = (key, buf) => b.put(key, buf, { httpMetadata: { contentType: typeOf(key) } });
  check = async (key) => (await b.get(key))?.text();
  dispose = proxy.dispose;
}

let n = 0;
for (const url of urls) {
  const key = url.replace(/^\/images\//, ""); // products/<código>/<nombre>
  const file = fs.readFileSync(path.join(SRC, key));
  const thumb = await sharp(file).resize(640, 640, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  await put(key, file);
  await put(key.replace(/^products\//, "thumbs/") + ".webp", thumb);
  process.stdout.write(`\r${++n}/${urls.length} ${key.slice(0, 60).padEnd(60)}`);
}
// La asociación se escribe al final: el catálogo solo "ve" las fotos cuando ya están todas.
await put("meta/product-images.json", Buffer.from(JSON.stringify(map, null, 2) + "\n"));

const saved = JSON.parse(await check("meta/product-images.json"));
if (JSON.stringify(saved) !== JSON.stringify(map)) throw new Error("La asociación guardada no coincide");
console.log(`\nListo: ${urls.length} fotos de ${Object.keys(map).length} productos en R2 ${remote ? "(Cloudflare)" : "(local)"}.`);
await dispose();
