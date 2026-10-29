// Fotografías en Cloudflare R2 (binding PHOTOS). Sin commits ni deploys: los cambios se ven al instante.
//   products/<código>/<nombre>          foto completa (≤ 1600 px)
//   thumbs/<código>/<nombre>.webp       miniatura de 640 px (opcional; si falta se sirve la completa)
//   meta/product-images.json            asociación código -> { mainImage, gallery }
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { imageUrl, mapAdd, mapRemove, mapSetMain } from "./image-store.mjs";

const MAP_KEY = "meta/product-images.json";
const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

// El bucket se puede inyectar (pruebas); por defecto el binding de Cloudflare.
let testBucket = null;
export const __setBucket = (b) => (testBucket = b);
async function bucket() {
  if (testBucket) return testBucket;
  const { env } = await getCloudflareContext({ async: true });
  if (!env.PHOTOS) throw new Error("Falta el binding PHOTOS (R2) en wrangler.jsonc");
  return env.PHOTOS;
}

const keyOf = (url) => url.replace(/^\/images\//, "");
const thumbKeyOf = (url) => keyOf(url).replace(/^products\//, "thumbs/") + ".webp";
export const contentType = (key) => TYPES[key.split(".").pop().toLowerCase()] ?? "application/octet-stream";

export async function getMap() {
  const obj = await (await bucket()).get(MAP_KEY);
  return obj ? obj.json() : {};
}

// Lectura + escritura condicionada al etag: si otra persona guardó en medio, no se sobrescribe.
async function updateMap(change) {
  const b = await bucket();
  const obj = await b.get(MAP_KEY);
  const map = obj ? await obj.json() : {};
  change(map);
  const body = JSON.stringify(map, null, 2) + "\n";
  const res = await b.put(MAP_KEY, body, {
    httpMetadata: { contentType: "application/json" },
    ...(obj && { onlyIf: { etagMatches: obj.etag } }),
  });
  if (!res) throw new Error("El catálogo cambió mientras guardabas. Recarga la página e intenta de nuevo.");
  return map;
}

// Objeto para servir /images/products/... (miniatura si se pide y existe).
export async function getPhoto(url, wantThumb) {
  const b = await bucket();
  if (wantThumb) {
    const t = await b.get(thumbKeyOf(url));
    if (t) return t;
  }
  return b.get(keyOf(url));
}

// files: [{ name, buffer, thumb?: Buffer }]; mainName: nombre de la foto principal (opcional).
export async function addImages(code, files, mainName) {
  const b = await bucket();
  const urls = files.map((f) => imageUrl(code, f.name));
  await Promise.all(
    files.flatMap((f, i) => [
      b.put(keyOf(urls[i]), f.buffer, { httpMetadata: { contentType: contentType(urls[i]) } }),
      f.thumb ? b.put(thumbKeyOf(urls[i]), f.thumb, { httpMetadata: { contentType: "image/webp" } }) : b.delete(thumbKeyOf(urls[i])),
    ])
  );
  const mainUrl = mainName && urls[files.findIndex((f) => f.name === mainName)];
  await updateMap((map) => {
    urls.forEach((u) => mapAdd(map, code, u));
    if (mainUrl) mapSetMain(map, code, mainUrl);
  });
  return urls;
}

export async function setMain(code, url) {
  await updateMap((map) => mapSetMain(map, code, url));
}

export async function removeImage(code, url) {
  await updateMap((map) => mapRemove(map, code, url));
  const b = await bucket();
  await b.delete([keyOf(url), thumbKeyOf(url)]);
}
