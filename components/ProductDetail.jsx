"use client";
import { useState } from "react";
import { PRICE_LABELS } from "@/lib/config";
import { useCart } from "./Cart";
import ProductImage from "./ProductImage";
import QuantitySelector from "./QuantitySelector";
import { money } from "./ProductCard";

export default function ProductDetail({ product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const images = product.gallery.length ? product.gallery : [product.mainImage].filter(Boolean);
  const [active, setActive] = useState(Math.max(0, images.indexOf(product.mainImage)));
  const prices = Object.entries(product.prices).filter(([, v]) => v != null);

  return (
    <div className="detail">
      <div className="gallery">
        <div className="gallery-main">
          <ProductImage key={images[active]} src={images[active]} alt={product.name} eager />
        </div>
        {images.length > 1 && (
          <div className="thumbs" role="group" aria-label="Fotografías">
            {images.map((src, i) => (
              <button key={src} className="thumb" aria-pressed={i === active} aria-label={`Ver foto ${i + 1}`} onClick={() => setActive(i)}>
                <ProductImage src={src} alt="" />
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

        {prices.length > 0 ? (
          <table className="prices">
            <caption>Precios por modalidad</caption>
            <tbody>
              {prices.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{PRICE_LABELS[k]}</th>
                  <td>{money(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Precio a consultar por WhatsApp.</p>
        )}
        <p className="note">Los precios pueden variar según cantidad de compra. ABACSA confirmará el precio final por WhatsApp.</p>

        <div className="buy-bar">
          <QuantitySelector value={qty} onChange={setQty} />
          <button className="btn btn-primary" onClick={() => add(product, qty)}>
            Agregar al pedido
          </button>
        </div>
      </div>
    </div>
  );
}
