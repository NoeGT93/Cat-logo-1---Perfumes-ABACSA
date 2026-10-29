// Copia las fotos actuales (migration/products + migration/product-images.json) al bucket R2,
// genera la miniatura WebP de 640 px de cada una y escribe la asociación código -> fotos.
// No borra nada del repositorio.
//   node scripts/migrate-photos-to-r2.mjs           → R2 local (para `npm run dev` / `npm run preview`)
//   node scripts/migrate-photos-to-r2.mjs --remote  → R2 real de Cloudflare (requiere `npx wrangler login`)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getPlatformProxy } from "wrangler";

const remote = process.argv.includes("--remote");
const SRC = "migration";
const map = JSON.parse(fs.readFileSync(path.join(SRC, "product-images.json"), "utf8"));

// Para R2 remoto se usa una copia de la configuración con el bucket marcado como remoto.
let configPath = "wrangler.jsonc";
if (remote) {
  const cfg = fs.readFileSync(configPath, "utf8").replace('"bucket_name": "abacsa-fotos"', '"bucket_name": "abacsa-fotos", "remote": true');
  configPath = ".wrangler-migrate.jsonc";
  fs.writeFileSync(configPath, cfg);
}
// WRANGLER_PERSIST: carpeta del R2 local (útil en Windows si la ruta del proyecto es muy larga)
const persist = process.env.WRANGLER_PERSIST ? { path: process.env.WRANGLER_PERSIST } : true;
const { env, dispose } = await getPlatformProxy({ configPath, remoteBindings: remote, persist });
const bucket = env.PHOTOS;

const urls = Object.values(map).flatMap((e) => e.gallery);
const missing = urls.filter((u) => !fs.existsSync(path.join(SRC, u.replace(/^\/images\//, ""))));
if (missing.length) throw new Error("Faltan archivos: " + missing.join(", "));

let n = 0;
for (const url of urls) {
  const key = url.replace(/^\/images\//, ""); // products/<código>/<nombre>
  const file = fs.readFileSync(path.join(SRC, key));
  const type = /\.png$/i.test(key) ? "image/png" : /\.webp$/i.test(key) ? "image/webp" : "image/jpeg";
  const thumb = await sharp(file).resize(640, 640, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  await bucket.put(key, file, { httpMetadata: { contentType: type } });
  await bucket.put(key.replace(/^products\//, "thumbs/") + ".webp", thumb, { httpMetadata: { contentType: "image/webp" } });
  process.stdout.write(`\r${++n}/${urls.length} ${key.slice(0, 60).padEnd(60)}`);
}
await bucket.put("meta/product-images.json", JSON.stringify(map, null, 2) + "\n", { httpMetadata: { contentType: "application/json" } });

// Verificación: la asociación en R2 es idéntica y cada foto existe
const saved = await (await bucket.get("meta/product-images.json")).json();
if (JSON.stringify(saved) !== JSON.stringify(map)) throw new Error("La asociación guardada no coincide");
for (const url of urls) if (!(await bucket.head(url.replace(/^\/images\//, "")))) throw new Error("No quedó en R2: " + url);
console.log(`\nListo: ${urls.length} fotos de ${Object.keys(map).length} productos en R2 ${remote ? "(Cloudflare)" : "(local)"}.`);

await dispose();
if (remote) fs.rmSync(configPath);
