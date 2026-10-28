import { getProducts } from "@/lib/catalog";
import Catalog from "@/components/Catalog";

export const metadata = { title: "Catálogo — ABACSA" };

export default async function CatalogPage({ searchParams }) {
  const { q = "", cat = "" } = await searchParams;
  return (
    <section className="wrap page">
      <h1 className="page-title">Perfumes</h1>
      <Catalog key={`${q}|${cat}`} products={getProducts()} initialQuery={q} initialCategory={cat} />
    </section>
  );
}
