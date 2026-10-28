// Asociación producto -> fotografías (data/product-images.json).
// Usado por /api/admin/images y por scripts/assign-images.mjs.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "data", "product-images.json");
const ALLOWED = /\.(jpe?g|png|webp|avif)$/i;

export const readMap = () => JSON.parse(fs.readFileSync(FILE, "utf8"));
const writeMap = (m) => fs.writeFileSync(FILE, JSON.stringify(m, null, 2) + "\n");

const safe = (s) => String(s).replace(/[^\w.-]/g, "_");

// Copia la foto (nombre original) a public/images/products/<código>/ y la asocia.
export function addImage(code, fileName, buffer) {
  const name = safe(path.basename(fileName));
  if (!ALLOWED.test(name)) throw new Error(`Formato no permitido: ${fileName}`);
  const dir = path.join(ROOT, "public", "images", "products", safe(code));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buffer);

  const url = `/images/products/${safe(code)}/${name}`;
  const map = readMap();
  const entry = (map[code] ??= { mainImage: null, gallery: [] });
  if (!entry.gallery.includes(url)) entry.gallery.push(url);
  entry.mainImage ??= url;
  writeMap(map);
  return url;
}

export function setMain(code, url) {
  const map = readMap();
  if (!map[code]?.gallery.includes(url)) throw new Error("La imagen no está asociada a este producto");
  map[code].mainImage = url;
  writeMap(map);
}

// Quita la asociación; el archivo se conserva en disco.
export function removeImage(code, url) {
  const map = readMap();
  const entry = map[code];
  if (!entry) return;
  entry.gallery = entry.gallery.filter((g) => g !== url);
  if (entry.mainImage === url) entry.mainImage = entry.gallery[0] ?? null;
  if (!entry.gallery.length) delete map[code];
  writeMap(map);
}
