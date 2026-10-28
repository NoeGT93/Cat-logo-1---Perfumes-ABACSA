"use client";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/config";
import ProductCard from "./ProductCard";

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Búsqueda y filtros en el cliente: con decenas/cientos de productos no hace falta servidor.
export default function Catalog({ products, initialQuery = "", initialCategory = "" }) {
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState(CATEGORIES.some((c) => c.key === initialCategory) ? initialCategory : "");

  const results = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      if (cat && p.category !== cat) return false;
      const hay = norm([p.code, p.name, p.description, p.brand, p.family].join(" "));
      return terms.every((t) => hay.includes(t));
    });
  }, [products, q, cat]);

  const sync = (nq, ncat) => {
    const params = new URLSearchParams();
    if (nq) params.set("q", nq);
    if (ncat) params.set("cat", ncat);
    const s = params.toString();
    history.replaceState(null, "", s ? `?${s}` : location.pathname);
  };

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <SearchIcon />
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Buscar por nombre, código o marca"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              sync(e.target.value, cat);
            }}
            aria-label="Buscar productos"
          />
        </label>
      </div>

      <p className="result-count muted" aria-live="polite">
        {results.length} {results.length === 1 ? "producto" : "productos"}
      </p>

      {results.length ? (
        <div className="grid">
          {results.map((p, i) => <ProductCard key={p.code} product={p} eager={i < 2} />)}
        </div>
      ) : (
        <div className="empty">
          <p>No encontramos productos para “{q}”.</p>
          <button className="btn btn-secondary" onClick={() => { setQ(""); setCat(""); sync("", ""); }}>
            Ver todos los productos
          </button>
        </div>
      )}
    </>
  );
}

export const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
