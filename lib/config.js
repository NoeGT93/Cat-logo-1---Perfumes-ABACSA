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

// Precio de referencia para sumar el pedido: el unitario; si no existe, el menor disponible.
export const refPrice = (p) => p.prices.unit ?? p.fromPrice;

export const PRICE_LABELS = {
  unit: "Unidad",
  dozen: "Docena",
  bundle: "Fardo",
  distributor: "Distribuidor",
};
