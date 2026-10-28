"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SITE_URL, WHATSAPP_NUMBER, money, nextTier, priceFor } from "@/lib/config";
import ProductImage from "./ProductImage";
import QuantitySelector from "./QuantitySelector";

const CartContext = createContext(null);
const KEY = "abacsa-cart-v1";
const DESKTOP = "(min-width: 1100px)";
export const useCart = () => useContext(CartContext);

// Se guarda solo { code, qty }; nombre, foto y precio salen siempre del catálogo actual.
export function CartProvider({ products, children }) {
  const [saved, setSaved] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const loaded = useRef(false);
  const toastTimer = useRef();

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY)) || [];
      setSaved(raw.filter((i) => i && i.code && i.qty > 0).map(({ code, qty }) => ({ code, qty })));
    } catch {}
  }, []);

  // La primera ejecución ocurre antes de leer localStorage: no sobrescribir con [].
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {}
  }, [saved]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const byCode = useMemo(() => new Map(products.map((p) => [p.code, p])), [products]);
  const items = useMemo(
    () =>
      saved
        .filter((i) => byCode.has(i.code))
        .map((i) => {
          const p = byCode.get(i.code);
          const { price, tier, total } = priceFor(p, i.qty);
          return { ...i, name: p.name, mainImage: p.mainImage, price, tier, lineTotal: total, next: nextTier(p, i.qty) };
        }),
    [saved, byCode]
  );
  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + (i.lineTotal ?? 0), 0);
  const missingPrice = items.some((i) => i.price == null);

  const notify = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const add = (product, qty = 1) => {
    setSaved((list) =>
      list.some((i) => i.code === product.code)
        ? list.map((i) => (i.code === product.code ? { ...i, qty: i.qty + qty } : i))
        : [...list, { code: product.code, qty }]
    );
    notify(`Agregado: ${product.name}`);
  };
  const setQty = (code, qty) =>
    setSaved((list) => (qty < 1 ? list.filter((i) => i.code !== code) : list.map((i) => (i.code === code ? { ...i, qty } : i))));
  const remove = (code) => setSaved((list) => list.filter((i) => i.code !== code));
  const clear = () => setSaved([]);
  const qtyOf = (code) => saved.find((i) => i.code === code)?.qty ?? 0;

  // En escritorio el pedido ya está visible en el panel lateral: no abrir el drawer encima.
  const show = () => {
    if (count > 0 && matchMedia(DESKTOP).matches) document.getElementById("order-panel")?.focus();
    else setOpen(true);
  };

  const value = { items, count, total, missingPrice, add, setQty, remove, clear, qtyOf, open, setOpen, show };
  return (
    <CartContext.Provider value={value}>
      {children}
      <div className="drawer-root" data-open={open} aria-hidden={!open} inert={!open ? true : undefined}>
        <div className="drawer-backdrop" onClick={() => setOpen(false)} />
        <aside className="drawer" role="dialog" aria-modal="true" aria-label="Tu pedido">
          <OrderPanel onClose={() => setOpen(false)} />
        </aside>
      </div>
      <MobileOrderBar />
      <div className="toast-region" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast">
            <CheckIcon />
            <span className="toast-msg">{toast.msg}</span>
            <button className="toast-action" onClick={show}>Ver pedido</button>
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

// Envuelve el contenido: en escritorio, con productos en el pedido, aparece el panel fijo a la derecha.
export function OrderShell({ children }) {
  const { count } = useCart();
  return (
    <div className="shell" data-has-items={count > 0}>
      <main>{children}</main>
      {count > 0 && (
        <aside className="side-panel" id="order-panel" tabIndex={-1} aria-label="Tu pedido">
          <OrderPanel />
        </aside>
      )}
    </div>
  );
}

function OrderPanel({ onClose }) {
  const { items, count, total, missingPrice, setQty, remove, clear } = useCart();
  return (
    <div className="order">
      <header className="order-head">
        <div>
          <h2>Tu pedido</h2>
          <p className="muted">{count === 0 ? "Sin productos" : `${count} ${count === 1 ? "producto" : "productos"}`}</p>
        </div>
        {onClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="order-empty">
          <BagIcon size={36} />
          <p>Aún no has agregado productos.</p>
          <Link href="/catalogo" className="btn btn-secondary" onClick={onClose}>
            Ver catálogo
          </Link>
        </div>
      ) : (
        <>
          <ul className="order-list">
            {items.map((i) => (
              <li key={i.code} className="line">
                <Link href={`/producto/${encodeURIComponent(i.code)}`} className="line-img" onClick={onClose}>
                  <ProductImage src={i.mainImage} alt={i.name} sizes="64px" />
                </Link>
                <div className="line-info">
                  <div className="line-top">
                    <p className="line-name">{i.name}</p>
                    <button className="line-remove" onClick={() => remove(i.code)} aria-label={`Quitar ${i.name}`}>
                      <CloseIcon size={16} />
                    </button>
                  </div>
                  <p className="code">
                    Código {i.code}
                    {i.price != null && <> · <span className="tier-tag">{i.tier}</span> {money(i.price)} c/u</>}
                  </p>
                  <div className="line-actions">
                    <QuantitySelector value={i.qty} onChange={(q) => setQty(i.code, q)} min={0} small />
                    <span className="line-total">{i.lineTotal != null ? money(i.lineTotal) : "Consultar"}</span>
                  </div>
                  {i.next && i.next.need <= 6 && (
                    <button className="tier-hint" onClick={() => setQty(i.code, i.qty + i.next.need)}>
                      Agrega {i.next.need} más y paga {money(i.next.price)} c/u ({i.next.label.toLowerCase()})
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <footer className="order-foot">
            <div className="total-row">
              <span>Total estimado</span>
              <strong>{money(total)}{missingPrice && "+"}</strong>
            </div>
            <p className="note">
              Precio por producto: 1–11 u. unidad, 12+ docena, 24+ fardo/distribuidor. ABACSA te confirma el precio final, disponibilidad y envío.
            </p>
            <a className="btn btn-whatsapp" href={whatsappUrl(items, total)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Solicitar por WhatsApp
            </a>
            <div className="order-foot-row">
              {onClose ? <button className="link-btn" onClick={onClose}>Seguir comprando</button> : <span />}
              <button className="link-btn" onClick={() => confirm("¿Vaciar el pedido?") && clear()}>Vaciar pedido</button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

function MobileOrderBar() {
  const { count, total, missingPrice, setOpen } = useCart();
  if (!count) return null;
  return (
    <div className="order-bar">
      <button className="order-bar-btn" onClick={() => setOpen(true)}>
        <span className="order-bar-count">{count > 99 ? "99+" : count}</span>
        <span>Ver pedido</span>
        <strong>{money(total)}{missingPrice && "+"}</strong>
      </button>
    </div>
  );
}

// Resumen con formato de WhatsApp (*negrita*). WhatsApp no permite adjuntar fotos desde un enlace:
// con SITE_URL cada producto lleva su enlace, y WhatsApp muestra la foto (og:image) como vista previa.
export function whatsappMessage(items, total) {
  const count = items.reduce((n, i) => n + i.qty, 0);
  const lines = items
    .map((i, n) => {
      const price = i.price != null ? `${i.qty} u. × ${money(i.price)} (${i.tier.toLowerCase()}) = *${money(i.lineTotal)}*` : `${i.qty} u. · precio a consultar`;
      const link = SITE_URL ? `\n   📷 ${SITE_URL}/producto/${encodeURIComponent(i.code)}` : "";
      return `${n + 1}. *${i.name}* — Cód. ${i.code}\n   ${price}${link}`;
    })
    .join("\n\n");
  return (
    "Hola ABACSA 👋, quiero hacer este pedido:\n\n" +
    "🛍️ *RESUMEN DEL PEDIDO*\n\n" +
    lines +
    "\n\n━━━━━━━━━━\n" +
    `Productos: *${count}* ${count === 1 ? "unidad" : "unidades"} (${items.length} ${items.length === 1 ? "código" : "códigos"})\n` +
    `Total estimado: *${money(total)}*\n\n` +
    "Por favor confirmar disponibilidad, precio final y envío. ¡Gracias!"
  );
}

export const whatsappUrl = (items, total) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage(items, total))}`;

export function CartButton() {
  const { count, total, show } = useCart();
  return (
    <button className="cart-btn" onClick={show} aria-label={`Ver pedido, ${count} productos`}>
      <BagIcon />
      <span className="cart-label">{count > 0 ? money(total) : "Pedido"}</span>
      {count > 0 && <span key={count} className="cart-count">{count > 99 ? "99+" : count}</span>}
    </button>
  );
}

export const BagIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);
const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);
