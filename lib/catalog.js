// Única puerta de entrada a los datos. Para migrar a una API/BD, reemplazar getProducts().
import fs from "node:fs";
import path from "node:path";

const read = (f) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", f), "utf8"));

const PREFIX = /^(O\.R\.\s*|EST\.\s*|ESTUCHE\s+|KIT\s+|DUO\s+|COLONIA\s+|PERFUME\s+)+/i;

// "O.R. EST. KIT MORTON 110ML COD 451-0" -> "Morton". La descripción completa se conserva aparte.
export function displayName(description = "") {
  const base =
    description
      .replace(PREFIX, "")
      .replace(/\s+COD\s+\S+/gi, "")
      .replace(/(\s+X)?\s+\d+\s*ML\b/gi, "")
      .replace(/\s+/g, " ")
      .replace(/\s*\/\s*/g, " / ")
      .trim() || description;
  return base.toLowerCase().replace(/(^|\s)(\S)/g, (_, s, c) => s + c.toUpperCase()).replace(/ And /g, " and ");
}

export function getProducts() {
  const images = read("product-images.json");
  const categories = read("product-categories.json");
  return read("products.json").map((p) => {
    const valid = Object.values(p.prices).filter((v) => v != null);
    const img = images[p.code] || {};
    const gallery = img.gallery || [];
    return {
      ...p,
      name: displayName(p.description),
      category: categories[p.code] || null,
      fromPrice: valid.length ? Math.min(...valid) : null,
      mainImage: img.mainImage || gallery[0] || null,
      gallery,
    };
  });
}

export function getProduct(code) {
  return getProducts().find((p) => p.code === code) || null;
}
