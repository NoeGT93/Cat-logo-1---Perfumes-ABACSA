// Única puerta de entrada a los datos. Para migrar a una API/BD, reemplazar getProducts().
// Productos, precios y categorías vienen del Excel (data/*.json, parte del código);
// las fotos vienen de R2 en cada visita, así el admin no necesita un nuevo deploy.
import productsData from "@/data/products.json";
import categoriesData from "@/data/product-categories.json";
import { getMap } from "./photos";

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

// images: asociación código -> fotos ({} = sin fotos).
export function buildProducts(images = {}) {
  const categories = categoriesData;
  return productsData.map((p) => {
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

export async function getProducts() {
  return buildProducts(await getMap());
}

export async function getProduct(code) {
  return (await getProducts()).find((p) => p.code === code) || null;
}
