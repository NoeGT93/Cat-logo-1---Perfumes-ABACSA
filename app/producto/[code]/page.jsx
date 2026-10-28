import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import { money, refPrice } from "@/lib/config";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";

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

// Relacionados: misma categoría primero, luego el resto; con foto antes que sin foto.
function related(product, all, n = 4) {
  const score = (p) => (p.category === product.category ? 2 : 0) + (p.mainImage ? 1 : 0);
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
  return (
    <>
      <section className="wrap page">
        <Link href="/catalogo" className="back">← Catálogo</Link>
        <ProductDetail product={product} />
      </section>
      <section className="wrap section related">
        <div className="section-head">
          <h2>También te puede interesar</h2>
          <Link href={`/catalogo${product.category ? `?cat=${product.category}` : ""}`} className="link">Ver más →</Link>
        </div>
        <div className="grid">
          {related(product, all).map((p) => <ProductCard key={p.code} product={p} />)}
        </div>
      </section>
    </>
  );
}
