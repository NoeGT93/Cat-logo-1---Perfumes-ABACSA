export const WHATSAPP_NUMBER = "50240317724";
export const WHATSAPP_DISPLAY = "+502 4031-7724";

// Filtros del catálogo. Las claves deben coincidir con data/product-categories.json
export const CATEGORIES = [
  { key: "kits", label: "Kits" },
  { key: "duos", label: "Dúos" },
  { key: "perfumes", label: "Perfumes" },
  { key: "colonias", label: "Colonias" },
];

// Departamentos de la tienda. Perfumes es el primero; agregar más aquí cuando existan productos.
export const DEPARTMENTS = [{ key: "perfumes", label: "Perfumes", href: "/catalogo" }];

export const money = (n) =>
  `Q${Number(n).toLocaleString("es-GT", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

// Precio de lista (1 unidad); si no existe, el menor disponible.
export const refPrice = (p) => p.prices.unit ?? p.fromPrice;

// URL pública del sitio (para enlaces con foto en WhatsApp). Opcional: si no se define
// NEXT_PUBLIC_SITE_URL, en el navegador se usa la dirección desde la que se abrió el catálogo.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/$/, "");

// Escalas de precio, contadas por producto (mismo código).
export const DOZEN_QTY = 4; // "Por mayor" (columna Docena del Excel)
export const BUNDLE_QTY = 24;

// Fardo y distribuidor son la misma escala: se usa fardo y, si no existe, distribuidor.
export function priceTiers(p) {
  const { unit, dozen, bundle, distributor } = p.prices;
  return [
    { key: "unit", label: "Unidad", min: 1, price: unit },
    { key: "dozen", label: "Por mayor", min: DOZEN_QTY, price: dozen },
    { key: "bundle", label: bundle != null ? "Fardo" : "Distribuidor", min: BUNDLE_QTY, price: bundle ?? distributor },
  ].filter((t) => t.price != null);
}

// Precio que corresponde a una cantidad: la escala más alta alcanzada. null = consultar.
export function priceFor(p, qty) {
  const tier = priceTiers(p).filter((t) => t.min <= qty).at(-1);
  return tier ? { price: tier.price, tier: tier.label, total: tier.price * qty } : { price: null, tier: null, total: null };
}

// Siguiente escala más barata: { need, price, label } o null.
export function nextTier(p, qty) {
  const current = priceFor(p, qty).price;
  const t = priceTiers(p).find((t) => t.min > qty && (current == null || t.price < current));
  return t ? { need: t.min - qty, price: t.price, label: t.label } : null;
}
