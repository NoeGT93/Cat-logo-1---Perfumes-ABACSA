"use client";
import { useState } from "react";
import { BUNDLE_QTY, money, priceFor, priceTiers } from "@/lib/config";
import { CartIcon, useCart } from "./Cart";
import ProductImage from "./ProductImage";
import QuantitySelector from "./QuantitySelector";
import { categoryLabel } from "./ProductCard";

export default function ProductDetail({ product }) {
  const { add, qtyOf } = useCart();
  const [qty, setQty] = useState(1);
  const images = product.gallery.length ? product.gallery : [product.mainImage].filter(Boolean);
  const [active, setActive] = useState(Math.max(0, images.indexOf(product.mainImage)));
  const tiers = priceTiers(product);
  const inCart = qtyOf(product.code);
  // La escala se calcula con lo que ya hay en el pedido + lo que se va a agregar.
  const quote = priceFor(product, inCart + qty);
  const { bundle, distributor } = product.prices;
  const extraDistributor = bundle != null && distributor != null && distributor !== bundle;
  const category = categoryLabel(product.category);
  // Primera escala más barata que la unidad: para el aviso de ahorro
  const better = tiers.find((t) => tiers[0] && t.price < tiers[0].price);
  // Tocar una escala ajusta la cantidad al mínimo de esa escala (descontando lo que ya está en el pedido)
  const pickTier = (t) => setQty(Math.max(1, t.min - inCart));

  return (
    <div className="detail">
      <div className="gallery">
        {images.length > 1 && (
          <div className="thumbs" role="group" aria-label="Fotografías">
            {images.map((src, i) => (
              <button key={src} className="thumb" aria-pressed={i === active} aria-label={`Ver foto ${i + 1}`} onClick={() => setActive(i)}>
                <ProductImage src={src} alt="" sizes="72px" />
              </button>
            ))}
          </div>
        )}
        <div className="gallery-main">
          <ProductImage key={images[active]} src={images[active]} alt={product.name} eager sizes="(max-width: 880px) 100vw, 560px" />
        </div>
      </div>

      <div className="info">
        {product.brand && <p className="card-brand">{product.brand}</p>}
        <h1>{product.name}</h1>
        <p className="code">Código {product.code}</p>
        {category && <span className="pill">{category.replace(/s$/, "")}</span>}
        <p className="muted desc">{product.description}</p>

        {better && quote.price !== better.price && quote.tier !== "Fardo" && quote.tier !== "Distribuidor" && (
          <button className="savings" onClick={() => pickTier(better)}>
            <strong>Desde {better.min} unidades pagas {money(better.price)} c/u</strong>
            <span>Ahorras {money(tiers[0].price - better.price)} por unidad · Toca para elegir</span>
          </button>
        )}

        {tiers.length > 0 ? (
          <div className="tiers" role="radiogroup" aria-label="Precio según cantidad">
            {tiers.map((t, i) => {
              const max = tiers[i + 1]?.min - 1;
              const active = quote.tier === t.label;
              return (
                <button key={t.key} className="tier" role="radio" aria-checked={active} onClick={() => pickTier(t)}>
                  <span className="tier-name">
                    {t.label} <span className="tier-range">{max ? `${t.min}–${max} u.` : `${t.min}+ u.`}</span>
                  </span>
                  <span className="tier-price">{money(t.price)} <span className="muted">c/u</span></span>
                </button>
              );
            })}
            {extraDistributor && (
              <div className="tier tier-static">
                <span className="tier-name">Distribuidor <span className="tier-range">{BUNDLE_QTY}+ u.</span></span>
                <span className="tier-price">{money(distributor)} <span className="muted">c/u</span></span>
              </div>
            )}
          </div>
        ) : (
          <p className="muted">Precio a consultar por WhatsApp.</p>
        )}
        <p className="note">
          Los precios pueden variar según cantidad de compra.{inCart > 0 && ` Ya tienes ${inCart} en tu pedido.`}
        </p>

        <div className="buy-bar">
          <QuantitySelector value={qty} onChange={setQty} />
          <button className="btn btn-primary btn-buy" onClick={(e) => add(product, qty, document.querySelector(".gallery-main img") || e.currentTarget)}>
            <CartIcon size={20} />
            <span>Agregar al pedido</span>
            {quote.price != null && <span className="btn-sub">{qty} u. · {money(quote.price * qty)}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
