"use client";
import { useState } from "react";
import { BUNDLE_QTY, money, priceFor, priceTiers } from "@/lib/config";
import { useCart } from "./Cart";
import ProductImage from "./ProductImage";
import QuantitySelector from "./QuantitySelector";

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

  return (
    <div className="detail">
      <div className="gallery">
        <div className="gallery-main">
          <ProductImage key={images[active]} src={images[active]} alt={product.name} eager sizes="(max-width: 880px) 100vw, 640px" />
        </div>
        {images.length > 1 && (
          <div className="thumbs" role="group" aria-label="Fotografías">
            {images.map((src, i) => (
              <button key={src} className="thumb" aria-pressed={i === active} aria-label={`Ver foto ${i + 1}`} onClick={() => setActive(i)}>
                <ProductImage src={src} alt="" sizes="72px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="info">
        <p className="code">Código {product.code}</p>
        <h1>{product.name}</h1>
        <p className="muted desc">{product.description}</p>
        <dl className="meta">
          {product.brand && <><dt>Marca</dt><dd>{product.brand}</dd></>}
          {product.family && <><dt>Familia</dt><dd>{product.family}</dd></>}
        </dl>

        {tiers.length > 0 ? (
          <table className="prices">
            <caption>Precio según cantidad (por producto)</caption>
            <tbody>
              {tiers.map((t, i) => {
                const max = tiers[i + 1]?.min - 1;
                return (
                  <tr key={t.key} data-active={quote.tier === t.label}>
                    <th scope="row">
                      {t.label}
                      <span className="tier-range">{max ? `${t.min}–${max} u.` : `${t.min}+ u.`}</span>
                    </th>
                    <td>{money(t.price)} <span className="muted">c/u</span></td>
                  </tr>
                );
              })}
              {extraDistributor && (
                <tr>
                  <th scope="row">Distribuidor<span className="tier-range">{BUNDLE_QTY}+ u.</span></th>
                  <td>{money(distributor)} <span className="muted">c/u</span></td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <p className="muted">Precio a consultar por WhatsApp.</p>
        )}
        <p className="note">
          {inCart > 0 && <>Ya tienes {inCart} en tu pedido. </>}ABACSA confirmará el precio final por WhatsApp.
        </p>

        <div className="buy-bar">
          <QuantitySelector value={qty} onChange={setQty} />
          <button className="btn btn-primary btn-buy" onClick={(e) => add(product, qty, document.querySelector(".gallery-main img") || e.currentTarget)}>
            <span>Agregar al pedido</span>
            {quote.price != null && <span className="btn-sub">{money(quote.price * qty)} · {quote.tier.toLowerCase()}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
