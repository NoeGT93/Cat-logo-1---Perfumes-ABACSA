"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/lib/config";
import ProductImage from "./ProductImage";
import QuantitySelector from "./QuantitySelector";

const CartContext = createContext(null);
const KEY = "abacsa-cart-v1";
export const useCart = () => useContext(CartContext);

// items: [{ code, name, mainImage, qty }]. Se guarda lo mínimo para poder mostrar el pedido.
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const loaded = useRef(false);
  const toastTimer = useRef();

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY)) || []);
    } catch {}
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const notify = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const add = (product, qty = 1) => {
    setItems((list) => {
      const found = list.find((i) => i.code === product.code);
      if (found) return list.map((i) => (i.code === product.code ? { ...i, qty: i.qty + qty } : i));
      return [...list, { code: product.code, name: product.name, mainImage: product.mainImage, qty }];
    });
    notify(`Agregado: ${product.name}`);
  };
  const setQty = (code, qty) =>
    setItems((list) => (qty < 1 ? list.filter((i) => i.code !== code) : list.map((i) => (i.code === code ? { ...i, qty } : i))));
  const remove = (code) => setItems((list) => list.filter((i) => i.code !== code));
  const clear = () => setItems([]);
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, add, setQty, remove, clear, open, setOpen }}>
      {children}
      <CartDrawer />
      <div className="toast-region" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast">
            {toast.msg}
            <button className="toast-action" onClick={() => setOpen(true)}>Ver pedido</button>
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

export function whatsappMessage(items) {
  const total = items.reduce((n, i) => n + i.qty, 0);
  const lines = items.map((i) => `${i.qty} × Código ${i.code}\n${i.name}`).join("\n\n");
  return (
    "Hola ABACSA, deseo solicitar información sobre los siguientes productos:\n\n" +
    lines +
    `\n\nCantidad total: ${total} ${total === 1 ? "producto" : "productos"}\n\n` +
    "Por favor confirmar disponibilidad y precio correspondiente a la cantidad solicitada."
  );
}

export const whatsappUrl = (items) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage(items))}`;

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Ver pedido, ${count} productos`}>
      <BagIcon />
      <span>Pedido</span>
      {count > 0 && <span key={count} className="cart-count">{count > 99 ? "99+" : count}</span>}
    </button>
  );
}

function CartDrawer() {
  const { items, count, setQty, remove, clear, open, setOpen } = useCart();
  return (
    <div className="drawer-root" data-open={open} aria-hidden={!open} inert={!open ? true : undefined}>
      <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Tu pedido">
        <header className="drawer-head">
          <div>
            <h2>Tu pedido</h2>
            <p className="muted">{count === 0 ? "Sin productos" : `${count} ${count === 1 ? "producto" : "productos"}`}</p>
          </div>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>Aún no has agregado productos.</p>
            <Link href="/catalogo" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer-list">
              {items.map((i) => (
                <li key={i.code} className="line">
                  <Link href={`/producto/${encodeURIComponent(i.code)}`} className="line-img" onClick={() => setOpen(false)}>
                    <ProductImage src={i.mainImage} alt={i.name} sizes="72px" />
                  </Link>
                  <div className="line-info">
                    <p className="line-name">{i.name}</p>
                    <p className="code">Código {i.code}</p>
                    <div className="line-actions">
                      <QuantitySelector value={i.qty} onChange={(q) => setQty(i.code, q)} min={0} small />
                      <button className="link-btn" onClick={() => remove(i.code)}>Quitar</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="drawer-foot">
              <p className="note">
                ABACSA confirmará por WhatsApp disponibilidad, precio final según cantidad, modalidad y envío.
              </p>
              <a className="btn btn-whatsapp" href={whatsappUrl(items)} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Solicitar por WhatsApp
              </a>
              <div className="drawer-foot-row">
                <button className="link-btn" onClick={() => setOpen(false)}>Seguir comprando</button>
                <button className="link-btn" onClick={() => confirm("¿Vaciar el pedido?") && clear()}>Vaciar pedido</button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

export const BagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);
