"use client";
import Link from "next/link";
import { useCart } from "./Cart";
import ProductImage from "./ProductImage";

export const money = (n) => `Q${Number.isInteger(n) ? n : n.toFixed(2)}`;

export default function ProductCard({ product, eager }) {
  const { add } = useCart();
  const href = `/producto/${encodeURIComponent(product.code)}`;
  return (
    <article className="card">
      <Link href={href} className="card-img">
        <ProductImage src={product.mainImage} alt={product.name} eager={eager} />
      </Link>
      <div className="card-body">
        <Link href={href} className="card-name">{product.name}</Link>
        <p className="code">Código {product.code}</p>
        <div className="card-foot">
          <p className="price">
            {product.fromPrice != null ? <><span className="muted">Desde</span> {money(product.fromPrice)}</> : <span className="muted">Consultar precio</span>}
          </p>
          <button className="btn btn-add" onClick={() => add(product)} aria-label={`Agregar ${product.name} al pedido`}>
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
