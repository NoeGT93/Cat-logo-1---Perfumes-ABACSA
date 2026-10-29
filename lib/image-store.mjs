// Asociación producto -> fotografías: { [código]: { mainImage, gallery: [url] } }.
// Funciones puras, compartidas por el admin (lib/photos.js) y las pruebas.
const ALLOWED = /\.(jpe?g|png|webp|avif)$/i;

export const safe = (s) => String(s).replace(/[^\w.-]/g, "_");

// Ruta pública de una foto: /images/products/<código>/<nombre>
export function imageUrl(code, fileName) {
  const name = safe(String(fileName).split(/[\\/]/).pop());
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
