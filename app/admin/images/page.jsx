"use client";
import { useEffect, useMemo, useState } from "react";
import ProductImage from "@/components/ProductImage";

export default function AdminImages() {
  const [products, setProducts] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const load = (res) =>
    res.json().then((data) => {
      if (!res.ok) throw new Error(data.error);
      setProducts(data);
    });

  useEffect(() => {
    fetch("/api/admin/images").then(load).catch((e) => setStatus(e.message));
  }, []);

  const shown = useMemo(() => {
    const f = filter.toLowerCase();
    return (products || []).filter((p) => !f || `${p.code} ${p.description}`.toLowerCase().includes(f));
  }, [products, filter]);
  const current = products?.find((p) => p.code === selected);
  const withPhotos = products?.filter((p) => p.gallery.length).length ?? 0;

  const run = async (promise, ok) => {
    setBusy(true);
    try {
      await load(await promise);
      setStatus(ok);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
    setBusy(false);
  };

  const upload = (files) => {
    if (!files.length) return;
    const fd = new FormData();
    fd.append("code", selected);
    for (const f of files) fd.append("files", f);
    run(fetch("/api/admin/images", { method: "POST", body: fd }), `${files.length} foto(s) guardada(s)`);
  };
  const patch = (action, url) =>
    run(
      fetch("/api/admin/images", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: selected, action, url }) }),
      action === "main" ? "Imagen principal actualizada" : "Asociación eliminada"
    );

  if (!products) return <section className="wrap page"><p>{status || "Cargando…"}</p></section>;

  return (
    <section className="wrap page admin">
      <h1 className="page-title">Fotografías de productos</h1>
      <p className="muted">
        {withPhotos} de {products.length} productos con fotografía. Solo para uso local durante el desarrollo.
      </p>
      {status && <p className="admin-status" role="status">{status}</p>}

      <div className="admin-layout">
        <div className="admin-list">
          <input className="admin-filter" type="search" placeholder="Filtrar por código o nombre" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <ul>
            {shown.map((p) => (
              <li key={p.code}>
                <button className="admin-row" aria-pressed={p.code === selected} onClick={() => {
                  setSelected(p.code);
                  if (innerWidth < 880) requestAnimationFrame(() => document.querySelector(".admin-panel")?.scrollIntoView());
                }}>
                  <span className="admin-thumb"><ProductImage src={p.mainImage} alt="" sizes="44px" /></span>
                  <span className="admin-row-text">
                    <strong>{p.code}</strong>
                    <span>{p.description}</span>
                  </span>
                  <span className={`dot ${p.gallery.length ? "on" : ""}`} title={p.gallery.length ? "Con foto" : "Sin foto"}>
                    {p.gallery.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-panel">
          {!current ? (
            <p className="muted">Selecciona un producto para gestionar sus fotografías.</p>
          ) : (
            <>
              <p className="code">{current.code}</p>
              <h2>{current.description}</h2>
              <div className="admin-main"><ProductImage src={current.mainImage} alt={current.name} sizes="360px" /></div>
              <label className={`btn btn-primary upload ${busy ? "is-busy" : ""}`}>
                + Agregar fotografías
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden disabled={busy}
                  onChange={(e) => { upload([...e.target.files]); e.target.value = ""; }} />
              </label>
              <p className="muted">Estado: {current.gallery.length} {current.gallery.length === 1 ? "fotografía asociada" : "fotografías asociadas"}</p>
              <ul className="admin-gallery">
                {current.gallery.map((url) => (
                  <li key={url} className={url === current.mainImage ? "is-main" : ""}>
                    <span className="admin-gallery-img"><ProductImage src={url} alt="" sizes="150px" /></span>
                    <span className="fname" title={url}>{url.split("/").pop()}</span>
                    {url === current.mainImage ? (
                      <span className="badge">Principal</span>
                    ) : (
                      <button className="link-btn" disabled={busy} onClick={() => patch("main", url)}>Hacer principal</button>
                    )}
                    <button className="link-btn danger" disabled={busy} onClick={() => patch("remove", url)}>Quitar</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
