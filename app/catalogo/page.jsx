import { getProducts } from "@/lib/catalog";
import Catalog from "@/components/Catalog";
import { CATEGORIES } from "@/lib/config";

export const metadata = { title: "Catálogo — ABACSA" };

export default async function CatalogPage({ searchParams }) {
  const { q = "", cat = "" } = await searchParams;
  return (
    <section className="wrap page">
      <div className="page-head">
        <p className="eyebrow eyebrow-accent">Catálogo ABACSA</p>
        <h1 className="page-title">{CATEGORIES.find((c) => c.key === cat)?.label ?? "Todos los productos"}</h1>
        <p className="muted">Precio por unidad. Desde 12 u. del mismo producto aplica precio de docena y desde 24 u., de fardo.</p>
      </div>
      <Catalog key={`${q}|${cat}`} products={getProducts()} initialQuery={q} initialCategory={cat} />
    </section>
  );
}
