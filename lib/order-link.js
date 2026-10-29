// El pedido viaja dentro del enlace (no se guarda nada): /pedido/ver?p=595-0*13~213-0*1
const MAX_ITEMS = 60;

export const encodeOrder = (items) => items.map((i) => `${encodeURIComponent(i.code)}*${i.qty}`).join("~");

// Devuelve [{ code, qty }] válido o [] si el texto no tiene el formato esperado.
export function decodeOrder(p = "") {
  return String(p)
    .split("~")
    .slice(0, MAX_ITEMS)
    .map((part) => {
      const [code, qty] = part.split("*");
      const n = Number(qty);
      try {
        return Number.isInteger(n) && n > 0 && n < 100000 ? { code: decodeURIComponent(code), qty: n } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
