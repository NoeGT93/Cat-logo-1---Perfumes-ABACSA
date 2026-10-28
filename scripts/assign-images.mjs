// Asocia fotografías a un producto desde la terminal (o desde Claude).
// Uso: node scripts/assign-images.mjs <código> <foto1> [foto2 ...] [--main <nombre-de-foto>]
import fs from "node:fs";
import path from "node:path";
import { addImage, setMain } from "../lib/image-store.mjs";

const args = process.argv.slice(2);
const mainIdx = args.indexOf("--main");
const main = mainIdx >= 0 ? args.splice(mainIdx, 2)[1] : null;
const [code, ...files] = args;
if (!code || !files.length) {
  console.error("Uso: node scripts/assign-images.mjs <código> <foto1> [foto2 ...] [--main <nombre>]");
  process.exit(1);
}

const codes = JSON.parse(fs.readFileSync("data/products.json", "utf8")).map((p) => p.code);
if (!codes.includes(code)) {
  console.error(`El código ${code} no existe en data/products.json`);
  process.exit(1);
}

const urls = files.map((f) => addImage(code, path.basename(f), fs.readFileSync(f)));
if (main) setMain(code, urls.find((u) => u.endsWith("/" + path.basename(main))));
console.log(`${code}: ${urls.length} foto(s) asociada(s)\n${urls.join("\n")}`);
