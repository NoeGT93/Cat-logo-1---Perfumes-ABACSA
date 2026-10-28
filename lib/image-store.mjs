// Asociación producto -> fotografías (data/product-images.json).
// Las funciones map* son puras (las usa también el admin web que guarda en GitHub);
// addImage/setMain/removeImage escriben en el disco local (desarrollo y scripts/assign-images.mjs).
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "data", "product-images.json");
const ALLOWED = /\.(jpe?g|png|webp|avif)$/i;

export const MAP_PATH = "data/product-images.json";
export const safe = (s) => String(s).replace(/[^\w.-]/g, "_");

// Ruta pública de una foto: /images/products/<código>/<nombre>
export function imageUrl(code, fileName) {
  const name = safe(path.basename(fileName));
  if (!ALLOWED.test(name)) throw new Error(`Formato no permitido: ${fileName}`);
  return `/images/products/${safe(code)}/${name}`;
}

export function mapAdd(map, code, url) {
  const entry = (map[code] ??= { mainImage: null, gallery: [] });
  if (!entry.gallery.includes(url)) entry.gallery.push(url);
  entry.mainImage ??= url;
  return map;
}

export function mapSetMain(map, code, url) {
  if (!map[code]?.gallery.includes(url)) throw new Error("La imagen no está asociada a este producto");
  map[code].mainImage = url;
  return map;
}

export function mapRemove(map, code, url) {
  const entry = map[code];
  if (!entry?.gallery.includes(url)) throw new Error("La imagen no está asociada a este producto");
  entry.gallery = entry.gallery.filter((g) => g !== url);
  if (entry.mainImage === url) entry.mainImage = entry.gallery[0] ?? null;
  if (!entry.gallery.length) delete map[code];
  return map;
}

export const serializeMap = (m) => JSON.stringify(m, null, 2) + "\n";

// --- Disco local ---
export const readMap = () => JSON.parse(fs.readFileSync(FILE, "utf8"));
const writeMap = (m) => fs.writeFileSync(FILE, serializeMap(m));

export function addImage(code, fileName, buffer) {
  const url = imageUrl(code, fileName);
  fs.mkdirSync(path.join(ROOT, "public", path.dirname(url)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "public", url), buffer);
  writeMap(mapAdd(readMap(), code, url));
  return url;
}

export function setMain(code, url) {
  writeMap(mapSetMain(readMap(), code, url));
}

// Quita la asociación; el archivo se conserva en disco.
export function removeImage(code, url) {
  writeMap(mapRemove(readMap(), code, url));
}
