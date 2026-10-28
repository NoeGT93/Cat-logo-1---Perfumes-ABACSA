import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import ProductDetail from "@/components/ProductDetail";

export function generateStaticParams() {
  return getProducts().map((p) => ({ code: p.code }));
}

export async function generateMetadata({ params }) {
  const p = getProduct(decodeURIComponent((await params).code));
  return { title: p ? `${p.name} (${p.code}) — ABACSA` : "Producto — ABACSA" };
}

export default async function ProductPage({ params }) {
  const product = getProduct(decodeURIComponent((await params).code));
  if (!product) notFound();
  return (
    <section className="wrap page">
      <Link href="/catalogo" className="back">← Catálogo</Link>
      <ProductDetail product={product} />
    </section>
  );
}
