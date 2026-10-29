// Convierte el Excel de precios en data/products.json.
// Uso: npm run import -- [ruta.xlsx]   (por defecto ./PERFUME.xlsx)
// Solo lee el Excel; nunca lo modifica. product-categories.json solo recibe
// los códigos nuevos (las correcciones manuales se conservan). Las fotos viven en R2 y no se tocan.
import fs from "node:fs";
import XLSX from "xlsx";

const file = process.argv[2] || "PERFUME.xlsx";
const wb = XLSX.read(fs.readFileSync(file));
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null, raw: true });

// Localiza la fila de encabezados por la columna "Código"
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const headerIdx = rows.findIndex((r) => r.some((c) => norm(c) === "codigo"));
if (headerIdx < 0) throw new Error("No se encontró la columna 'Código'");
const header = rows[headerIdx].map(norm);
const col = (start) => {
  const i = header.findIndex((h) => h.startsWith(start));
  if (i < 0) throw new Error(`Columna no encontrada: ${start}`);
  return i;
};
const C = {
  no: col("no"), code: col("codigo"), desc: col("descripcion"), qty: col("cant"),
  unit: col("unitario"), dozen: col("docena"), bundle: col("fardo"), dist: col("distribuidor"),
  family: col("familia"), brand: col("marca"),
};

const text = (v) => (v == null || String(v).trim() === "" ? null : String(v).trim());
const num = (v) => {
  if (v == null || String(v).trim() === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const products = rows
  .slice(headerIdx + 1)
  .filter((r) => text(r[C.code]))
  .map((r, i) => ({
    id: num(r[C.no]) ?? i + 1,
    code: text(r[C.code]),
    description: text(r[C.desc]),
    quantity: num(r[C.qty]),
    prices: { unit: num(r[C.unit]), dozen: num(r[C.dozen]), bundle: num(r[C.bundle]), distributor: num(r[C.dist]) },
    family: text(r[C.family]),
    brand: text(r[C.brand]),
  }));

fs.writeFileSync("data/products.json", JSON.stringify(products, null, 2) + "\n");

// Categoría inferida desde la descripción; editable a mano en product-categories.json
const infer = (d = "") => {
  d = d.toUpperCase();
  if (/\bDUO\b/.test(d)) return "duos";
  if (/\bKIT\b/.test(d)) return "kits";
  if (/\bCOLONIA\b/.test(d)) return "colonias";
  return "perfumes";
};
const catFile = "data/product-categories.json";
const cats = fs.existsSync(catFile) ? JSON.parse(fs.readFileSync(catFile, "utf8")) : {};
for (const p of products) cats[p.code] ??= infer(p.description);
fs.writeFileSync(catFile, JSON.stringify(cats, null, 2) + "\n");


console.log(`${products.length} productos importados desde ${file}`);
