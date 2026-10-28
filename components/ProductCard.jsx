"use client";
import Link from "next/link";
import { CATEGORIES, money, refPrice } from "@/lib/config";
import { useCart } from "./Cart";
import ProductImage from "./ProductImage";
import QuantitySelector from "./QuantitySelector";

export default function ProductCard({ product, eager }) {
  const { add, setQty, qtyOf } = useCart();
  const qty = qtyOf(product.code);
  const href = `/producto/${encodeURIComponent(product.code)}`;
  const category = CATEGORIES.find((c) => c.key === product.category)?.label;
  const unit = refPrice(product);

  return (
    <article className="card" data-in-cart={qty > 0}>
      <Link href={href} className="card-img">
        <ProductImage src={product.mainImage} alt={product.name} eager={eager} />
        {category && <span className="badge-cat">{category}</span>}
        {qty > 0 && <span className="badge-qty">{qty} en pedido</span>}
      </Link>
      <div className="card-body">
        {product.brand && <p className="card-brand">{product.brand}</p>}
        <Link href={href} className="card-name">{product.name}</Link>
        <p className="code">Código {product.code}</p>
        <div className="card-price">
          {unit != null ? (
            <>
              <span className="price">{money(unit)}</span>
              <span className="muted"> c/u</span>
              {product.fromPrice < unit && <p className="price-from">Desde {money(product.fromPrice)} por mayor</p>}
            </>
          ) : (
            <span className="muted">Consultar precio</span>
          )}
        </div>
        <div className="card-cta">
          {qty > 0 ? (
            <QuantitySelector value={qty} onChange={(q) => setQty(product.code, q)} min={0} small block />
          ) : (
            <button className="btn btn-add" onClick={(e) => add(product, 1, e.currentTarget.closest(".card").querySelector(".card-img img") || e.currentTarget)} aria-label={`Agregar ${product.name} al pedido`}>
              <PlusIcon /> Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
