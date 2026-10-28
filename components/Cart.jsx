"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SITE_URL, WHATSAPP_NUMBER, money, nextTier, priceFor } from "@/lib/config";
import ProductImage from "./ProductImage";
import QuantitySelector from "./QuantitySelector";

const CartContext = createContext(null);
const KEY = "abacsa-cart-v1";
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

  // source: imagen (o botón) desde donde sale la animación hacia el carrito.
  const add = (product, qty = 1, source) => {
    flyToCart(source);
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

  const show = () => setOpen(true);

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

// El producto "vuela" hasta el ícono del pedido y el ícono rebota al recibirlo.
// Solo transform/opacity con WAAPI; sin desplazamiento si el usuario prefiere menos movimiento.
function flyToCart(source) {
  const target = document.getElementById("cart-icon");
  if (!target) return;
  const bump = () =>
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], {
      duration: 320,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    });
  const s = source?.getBoundingClientRect();
  if (!s?.width || matchMedia("(prefers-reduced-motion: reduce)").matches) return bump();

  const isImg = source.tagName === "IMG";
  const size = isImg ? Math.min(s.width, s.height, 140) : 18;
  const el = isImg ? source.cloneNode() : document.createElement("div");
  el.className = "fly-item";
  el.style.cssText = `left:${s.left + s.width / 2 - size / 2}px;top:${s.top + s.height / 2 - size / 2}px;width:${size}px;height:${size}px;`;
  document.body.appendChild(el);

  const t = target.getBoundingClientRect();
  const dx = t.left + t.width / 2 - (s.left + s.width / 2);
  const dy = t.top + t.height / 2 - (s.top + s.height / 2);
  el.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(0.6)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${12 / size})`, opacity: 0.4 },
    ],
    { duration: 600, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }
  ).finished.then(
    () => {
      el.remove();
      bump();
    },
    () => el.remove()
  );
}

// Lista del pedido (drawer y página /pedido).
function OrderLines({ onNavigate }) {
  const { items, setQty, remove } = useCart();
  return (
    <ul className="order-list">
      {items.map((i) => (
        <li key={i.code} className="line">
          <Link href={`/producto/${encodeURIComponent(i.code)}`} className="line-img" onClick={onNavigate}>
            <ProductImage src={i.mainImage} alt={i.name} sizes="64px" />
          </Link>
          <div className="line-info">
            <p className="line-name">{i.name}</p>
            <p className="code">
              Código {i.code}
              {i.price != null && <> · <span className="tier-tag">{i.tier}</span> {money(i.price)} c/u</>}
            </p>
            {i.next && i.next.need <= 6 && (
              <button className="tier-hint" onClick={() => setQty(i.code, i.qty + i.next.need)}>
                Agrega {i.next.need} más y paga {money(i.next.price)} c/u ({i.next.label.toLowerCase()})
              </button>
            )}
          </div>
          <div className="line-side">
            <div className="line-controls">
              <QuantitySelector value={i.qty} onChange={(q) => setQty(i.code, q)} min={0} small />
              <button className="line-remove" onClick={() => remove(i.code)} aria-label={`Quitar ${i.name}`}>
                <TrashIcon />
              </button>
            </div>
            <span className="line-total">{i.lineTotal != null ? money(i.lineTotal) : "Consultar"}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// Resumen: totales, aviso de precios y envío por WhatsApp.
function OrderSummary({ onContinue }) {
  const { items, count, total, missingPrice } = useCart();
  return (
    <div className="summary">
      <h2 className="summary-title">Resumen</h2>
      <div className="summary-row"><span>Total de productos</span><strong>{count}</strong></div>
      <div className="summary-row summary-total"><span>Total estimado</span><strong>{money(total)}{missingPrice && "+"}</strong></div>
      <p className="summary-note">
        <InfoIcon />
        <span>Los precios pueden variar según cantidad de compra (12+ docena, 24+ fardo). Te confirmaremos disponibilidad y precio final por WhatsApp.</span>
      </p>
      <a className="btn btn-whatsapp" href={whatsappUrl(items, total)} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon /> Solicitar por WhatsApp
      </a>
      {onContinue ? (
        <button className="continue-link" onClick={onContinue}><ArrowLeftIcon /> Continuar comprando</button>
      ) : (
        <Link href="/catalogo" className="continue-link"><ArrowLeftIcon /> Continuar comprando</Link>
      )}
    </div>
  );
}

function OrderHead({ onClose }) {
  const { count, clear } = useCart();
  return (
    <header className="order-head">
      <div>
        <h2>Tu pedido</h2>
        <p className="muted">{count === 0 ? "Sin productos" : `${count} ${count === 1 ? "producto" : "productos"}`}</p>
      </div>
      <div className="order-head-actions">
        {count > 0 && <button className="link-btn" onClick={() => confirm("¿Vaciar el pedido?") && clear()}>Vaciar</button>}
        {onClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </button>
        )}
      </div>
    </header>
  );
}

function OrderEmpty({ onNavigate }) {
  return (
    <div className="order-empty">
      <BagIcon size={36} />
      <p>Aún no has agregado productos.</p>
      <Link href="/catalogo" className="btn btn-primary" onClick={onNavigate}>Ver catálogo</Link>
    </div>
  );
}

// Drawer (se abre desde el ícono del pedido).
function OrderPanel({ onClose }) {
  const { items } = useCart();
  return (
    <div className="order">
      <OrderHead onClose={onClose} />
      {items.length === 0 ? (
        <OrderEmpty onNavigate={onClose} />
      ) : (
        <>
          <OrderLines onNavigate={onClose} />
          <div className="order-foot">
            <OrderSummary onContinue={onClose} />
            <Link href="/pedido" className="link-btn order-full" onClick={onClose}>Ver pedido en pantalla completa</Link>
          </div>
        </>
      )}
    </div>
  );
}

// Página /pedido: lista a la izquierda, resumen a la derecha.
export function OrderPage() {
  const { items } = useCart();
  return (
    <div className="order-page">
      <section className="order-page-list">
        <OrderHead />
        {items.length === 0 ? <OrderEmpty /> : <OrderLines />}
      </section>
      {items.length > 0 && (
        <aside className="order-page-summary">
          <OrderSummary />
        </aside>
      )}
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
    <button className="cart-btn" onClick={show} aria-label={`Ver pedido, ${count} productos${count ? `, ${money(total)}` : ""}`}>
      <span className="cart-icon" id="cart-icon">
        <CartIcon />
        {count > 0 && <span className="cart-count">{count > 99 ? "99+" : count}</span>}
      </span>
    </button>
  );
}

export const CartIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.6 8H6.4" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </svg>
);

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
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);
const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);
