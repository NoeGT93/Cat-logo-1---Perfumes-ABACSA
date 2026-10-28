// Dónde guarda el admin: en GitHub (sitio publicado) o en el disco (desarrollo local).
import * as local from "./image-store.mjs";
import { MAP_PATH, imageUrl, mapAdd, mapRemove, mapSetMain, serializeMap } from "./image-store.mjs";
import { githubEnabled, rawBase, readRepoFile, updateRepo } from "./github.js";

export const storeMode = () => (githubEnabled() ? "github" : process.env.NODE_ENV === "production" ? "disabled" : "local");
export const previewBase = () => (storeMode() === "github" ? rawBase() : "");

const parse = (buf) => JSON.parse(buf.toString("utf8"));
const asFile = (map) => ({ path: MAP_PATH, content: Buffer.from(serializeMap(map)) });

export async function getMap() {
  return storeMode() === "github" ? parse(await readRepoFile(MAP_PATH)) : local.readMap();
}

// files: [{ name, buffer }]; mainName: nombre de la que será principal (opcional).
// Un solo commit para todas las fotos del producto.
export async function addImages(code, files, mainName) {
  const urls = files.map((f) => imageUrl(code, f.name));
  const mainUrl = mainName && urls[files.findIndex((f) => f.name === mainName)];
  if (storeMode() === "local") {
    files.forEach((f) => local.addImage(code, f.name, f.buffer));
    if (mainUrl) local.setMain(code, mainUrl);
    return urls;
  }
  await updateRepo(async (read) => {
    const map = parse(await read(MAP_PATH));
    urls.forEach((url) => mapAdd(map, code, url));
    if (mainUrl) mapSetMain(map, code, mainUrl);
    return [...files.map((f, i) => ({ path: `public${urls[i]}`, content: f.buffer })), asFile(map)];
  }, `Admin: ${files.length} foto(s) para ${code}`);
  return urls;
}

export async function setMain(code, url) {
  if (storeMode() === "local") return local.setMain(code, url);
  await updateRepo(async (read) => [asFile(mapSetMain(parse(await read(MAP_PATH)), code, url))], `Admin: foto principal de ${code}`);
}

// En GitHub también se borra el archivo (queda en el historial por si hace falta recuperarlo).
export async function removeImage(code, url) {
  if (storeMode() === "local") return local.removeImage(code, url);
  await updateRepo(
    async (read) => [asFile(mapRemove(parse(await read(MAP_PATH)), code, url)), { path: `public${url}`, content: null }],
    `Admin: quitar foto de ${code}`
  );
}
