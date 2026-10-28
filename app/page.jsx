import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/config";
import ProductCard from "@/components/ProductCard";
import { SearchIcon } from "@/components/Catalog";

export default function Home() {
  const products = getProducts();
  // Destacados: primero los que ya tienen foto, en el orden del Excel.
  const featured = [...products].sort((a, b) => !!b.mainImage - !!a.mainImage).slice(0, 8);

  return (
    <>
      <section className="hero wrap">
        <h1>Todo lo que necesitas para surtir tu negocio.</h1>
        <p className="lead">Encuentra variedad, buenos precios y opciones para comprar al detalle o por mayor.</p>
        <form action="/catalogo" className="search search-lg" role="search">
          <SearchIcon />
          <input type="search" name="q" enterKeyHint="search" placeholder="Buscar por nombre, código o marca" aria-label="Buscar productos" />
          <button className="btn btn-primary">Buscar</button>
        </form>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Perfumes</h2>
          <Link href="/catalogo" className="link">Ver todo ({products.length})</Link>
        </div>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <Link key={c.key} href={`/catalogo?cat=${c.key}`} className="chip">
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Productos destacados</h2>
        </div>
        <div className="grid">
          {featured.map((p, i) => <ProductCard key={p.code} product={p} eager={i < 4} />)}
        </div>
        <div className="center">
          <Link href="/catalogo" className="btn btn-secondary">Ver catálogo completo</Link>
        </div>
      </section>

      <section className="wrap section steps">
        <h2>Así de fácil</h2>
        <ol>
          <li><strong>Elige</strong> tus productos y agrégalos al pedido.</li>
          <li><strong>Envía</strong> tu pedido por WhatsApp.</li>
          <li><strong>ABACSA confirma</strong> disponibilidad, precio según cantidad y envío.</li>
        </ol>
      </section>
    </>
  );
}
