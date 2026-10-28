import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import { CATEGORIES, money, refPrice } from "@/lib/config";
import ProductDetail from "@/components/ProductDetail";
import ProductCarousel from "@/components/ProductCarousel";

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export function generateStaticParams() {
  return getProducts().map((p) => ({ code: p.code }));
}

// og:image = foto principal: es la vista previa que WhatsApp muestra al compartir el enlace.
export async function generateMetadata({ params }) {
  const p = getProduct(decodeURIComponent((await params).code));
  if (!p) return { title: "Producto — ABACSA" };
  const title = `${p.name} (${p.code}) — ABACSA`;
  const price = refPrice(p);
  const description = `${p.description}${price != null ? ` · ${money(price)} c/u` : ""}`;
  return { title, description, openGraph: { title, description, images: p.mainImage ? [p.mainImage] : [] } };
}

// Relacionados: con foto primero (misma categoría antes), luego los que aún no tienen foto.
function related(product, all, n = 4) {
  const score = (p) => (p.mainImage ? 2 : 0) + (p.category === product.category ? 1 : 0);
  return all
    .filter((p) => p.code !== product.code)
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((x) => x.p);
}

export default async function ProductPage({ params }) {
  const code = decodeURIComponent((await params).code);
  const all = getProducts();
  const product = all.find((p) => p.code === code);
  if (!product) notFound();
  const cat = CATEGORIES.find((c) => c.key === product.category);
  return (
    <section className="wrap page">
      <nav className="breadcrumb" aria-label="Ruta">
        <Link href="/">Inicio</Link>
        <Chevron />
        {cat ? <Link href={`/catalogo?cat=${cat.key}`}>{cat.label}</Link> : <Link href="/catalogo">Productos</Link>}
        <Chevron />
        <span aria-current="page">{product.name}</span>
      </nav>
      <div className="product-main">
        <ProductDetail product={product} />
      </div>
      <div className="product-related">
        <div className="section-head">
          <h2>Productos relacionados</h2>
          <Link href={cat ? `/catalogo?cat=${cat.key}` : "/catalogo"} className="link">Ver más</Link>
        </div>
        <ProductCarousel products={related(product, all, 10)} />
      </div>
    </section>
  );
}
