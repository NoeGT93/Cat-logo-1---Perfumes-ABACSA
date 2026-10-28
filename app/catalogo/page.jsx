import { getProducts } from "@/lib/catalog";
import Catalog from "@/components/Catalog";

export const metadata = { title: "Catálogo — ABACSA" };

export default async function CatalogPage({ searchParams }) {
  const { q = "", cat = "" } = await searchParams;
  return (
    <section className="wrap page">
      <div className="page-head">
        <p className="eyebrow eyebrow-accent">Catálogo ABACSA</p>
        <h1 className="page-title">Perfumes</h1>
        <p className="muted">Precio por unidad. Por docena, fardo o distribuidor te confirmamos el mejor precio por WhatsApp.</p>
      </div>
      <Catalog key={`${q}|${cat}`} products={getProducts()} initialQuery={q} initialCategory={cat} />
    </section>
  );
}
