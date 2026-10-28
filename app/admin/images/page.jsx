"use client";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/config";

const API = "/api/admin/images";
const MAX_SIDE = 1600;
const MAX_REQUEST = 4 * 1024 * 1024; // Vercel acepta ~4.5 MB por envío

// Reduce la foto en el navegador (lado mayor 1600 px, JPG) para subir rápido y dentro del límite.
// Las fotos ya preparadas (JPG ≤ 1600 px y < 1.5 MB) se envían tal cual.
async function prepare(file) {
  const bmp = await createImageBitmap(file);
  const { width: w, height: h } = bmp;
  const ready = file.type === "image/jpeg" && Math.max(w, h) <= MAX_SIDE && file.size <= 1.5 * 1024 * 1024;
  let blob = file;
  if (!ready) {
    const s = Math.min(1, MAX_SIDE / Math.max(w, h));
    const canvas = Object.assign(document.createElement("canvas"), { width: Math.round(w * s), height: Math.round(h * s) });
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  }
  bmp.close?.();
  const name = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") + ".jpg";
  return {
    id: crypto.randomUUID(),
    file: new File([blob], name, { type: "image/jpeg" }),
    preview: URL.createObjectURL(blob),
    size: `${w}×${h}`,
    ratioOk: Math.abs(w / h - 4 / 3) < 0.04,
  };
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
const catLabel = (k) => CATEGORIES.find((c) => c.key === k)?.label ?? "Sin categoría";

export default function AdminImages() {
  const [data, setData] = useState(null); // { mode, previewBase, products, map }
  const [auth, setAuth] = useState("checking"); // checking | login | ok
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [status, setStatus] = useState(null); // { type: ok|error|info, text }
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState([]); // fotos elegidas, aún sin publicar
  const [pendingMain, setPendingMain] = useState(null);

  async function call(init, okText) {
    const res = await fetch(API, init);
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) return setAuth("login");
    if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
    setData(json);
    setAuth("ok");
    if (okText) setStatus({ type: "ok", text: okText });
  }

  const reload = () => call().catch((e) => setStatus({ type: "error", text: e.message }));
  useEffect(() => {
    reload();
  }, []);

  const products = useMemo(() => {
    if (!data) return [];
    return data.products.map((p) => {
      const e = data.map[p.code];
      return { ...p, gallery: e?.gallery ?? [], mainImage: e?.mainImage ?? e?.gallery?.[0] ?? null };
    });
  }, [data]);

  const counts = { all: products.length, with: products.filter((p) => p.gallery.length).length };
  counts.without = counts.all - counts.with;

  const shown = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter(
      (p) =>
        (tab === "all" || (tab === "with") === p.gallery.length > 0) &&
        (!q || `${p.code} ${p.name} ${p.description}`.toLowerCase().includes(q))
    );
  }, [products, query, tab]);

  const current = products.find((p) => p.code === selected);
  const src = (url) => (data?.previewBase ?? "") + url;
  const savedText = data?.mode === "github" ? "Guardado. El sitio se actualiza en aprox. 1 minuto." : "Guardado.";

  function select(code) {
    clearPending();
    setSelected(code);
    setStatus(null);
    if (innerWidth < 880) requestAnimationFrame(() => document.querySelector(".admin-panel")?.scrollIntoView({ behavior: "smooth" }));
  }

  function clearPending() {
    pending.forEach((p) => URL.revokeObjectURL(p.preview));
    setPending([]);
    setPendingMain(null);
  }

  async function pick(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    try {
      const prepared = await Promise.all(files.map(prepare));
      setPending((p) => [...p, ...prepared].slice(0, 12));
      if (!current.gallery.length && !pendingMain) setPendingMain(prepared[0].id);
    } catch {
      setStatus({ type: "error", text: "No se pudo leer una de las fotos. Usa JPG, PNG o WebP." });
    }
    setBusy(false);
  }

  async function publish() {
    setBusy(true);
    setStatus({ type: "info", text: "Publicando…" });
    try {
      // Grupos que quepan en un envío; normalmente es uno solo (= un solo cambio en el sitio).
      const batches = [];
      for (const p of pending) {
        const last = batches.at(-1);
        if (last && last.size + p.file.size < MAX_REQUEST) last.items.push(p), (last.size += p.file.size);
        else batches.push({ items: [p], size: p.file.size });
      }
      const main = pending.find((p) => p.id === pendingMain)?.file.name;
      for (const b of batches) {
        const fd = new FormData();
        fd.append("code", selected);
        if (main && b.items.some((p) => p.file.name === main)) fd.append("main", main);
        b.items.forEach((p) => fd.append("files", p.file));
        await call({ method: "POST", body: fd });
      }
      clearPending();
      setStatus({ type: "ok", text: `${pending.length} foto(s) publicada(s). ${savedText}` });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    }
    setBusy(false);
  }

  async function patch(action, url) {
    if (action === "remove" && !confirm("¿Quitar esta foto del producto?")) return;
    setBusy(true);
    try {
      await call(
        { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: selected, action, url }) },
        action === "main" ? `Foto principal actualizada. ${savedText}` : `Foto quitada. ${savedText}`
      );
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    }
    setBusy(false);
  }

  if (auth === "checking")
    return <section className="wrap page">{status ? <p className="admin-status is-error">{status.text}</p> : <p className="muted">Cargando…</p>}</section>;
  if (auth === "login") return <Login onDone={reload} />;

  return (
    <section className="wrap page admin">
      <div className="admin-top">
        <div>
          <h1 className="page-title">Fotografías de productos</h1>
          <p className="muted">
            {counts.with} de {counts.all} productos con fotografía ·{" "}
            {data.mode === "github" ? "Los cambios se publican en el sitio (≈ 1 min)." : "Modo local: los cambios se guardan en esta computadora."}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={async () => { await fetch("/api/admin/session", { method: "DELETE" }); setAuth("login"); }}>
          Cerrar sesión
        </button>
      </div>
      {status && <p className={`admin-status is-${status.type}`} role="status">{status.text}</p>}

      <div className="admin-layout">
        <div className="admin-list">
          <input className="admin-filter" type="search" placeholder="Buscar por código o nombre" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="admin-tabs" role="group" aria-label="Filtrar">
            {[["all", "Todos"], ["without", "Sin foto"], ["with", "Con foto"]].map(([k, label]) => (
              <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{label} ({counts[k]})</button>
            ))}
          </div>
          <ul>
            {shown.map((p) => (
              <li key={p.code}>
                <button className="admin-row" aria-pressed={p.code === selected} onClick={() => select(p.code)}>
                  <span className="admin-thumb">{p.mainImage ? <img src={src(p.mainImage)} alt="" loading="lazy" /> : <NoPhoto />}</span>
                  <span className="admin-row-text">
                    <strong>{p.code}</strong>
                    <span>{p.name}</span>
                  </span>
                  <span className={`dot ${p.gallery.length ? "on" : ""}`} title={p.gallery.length ? "Con foto" : "Sin foto"}>{p.gallery.length}</span>
                </button>
              </li>
            ))}
            {!shown.length && <li className="admin-empty muted">Sin resultados</li>}
          </ul>
        </div>

        <div className="admin-panel">
          {!current ? (
            <p className="muted">Selecciona un producto de la lista para ver y subir sus fotografías.</p>
          ) : (
            <>
              <div>
                <p className="code">Código {current.code} · {catLabel(current.category)}</p>
                <h2>{current.name}</h2>
                <p className="muted desc">{current.description}</p>
              </div>

              <h3 className="admin-h3">Fotos publicadas ({current.gallery.length})</h3>
              {current.gallery.length ? (
                <ul className="admin-gallery">
                  {current.gallery.map((url) => (
                    <li key={url} className={url === current.mainImage ? "is-main" : ""}>
                      <span className="admin-gallery-img"><img src={src(url)} alt="" loading="lazy" /></span>
                      <span className="fname" title={url}>{url.split("/").pop()}</span>
                      <div className="admin-actions">
                        {url === current.mainImage ? (
                          <span className="badge">★ Principal</span>
                        ) : (
                          <button className="link-btn" disabled={busy} onClick={() => patch("main", url)}>Hacer principal</button>
                        )}
                        <button className="link-btn danger" disabled={busy} onClick={() => patch("remove", url)}>Quitar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Este producto aún no tiene fotos.</p>
              )}

              <h3 className="admin-h3">Agregar fotos</h3>
              <label
                className={`dropzone ${busy ? "is-busy" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }}
              >
                <strong>Elegir fotos</strong>
                <span className="muted">o arrástralas aquí · JPG, PNG o WebP · ideal 1600 × 1200 (4:3)</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden disabled={busy}
                  onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
              </label>

              {pending.length > 0 && (
                <div className="pending">
                  <p className="muted">Revisa las fotos antes de publicar. Marca cuál será la principal.</p>
                  <ul className="admin-gallery">
                    {pending.map((p) => {
                      const replaces = current.gallery.some((u) => u.endsWith("/" + p.file.name));
                      return (
                        <li key={p.id} className={p.id === pendingMain ? "is-main" : ""}>
                          <span className="admin-gallery-img"><img src={p.preview} alt="" /></span>
                          <span className="fname" title={p.file.name}>{p.file.name}</span>
                          <span className="fmeta">{p.size} · {kb(p.file.size)}</span>
                          {!p.ratioOk && <span className="warn">No es 4:3: puede recortarse</span>}
                          {replaces && <span className="warn">Reemplazará la foto con el mismo nombre</span>}
                          <label className="radio">
                            <input type="radio" name="pending-main" checked={p.id === pendingMain} onChange={() => setPendingMain(p.id)} /> Principal
                          </label>
                          <button className="link-btn danger" onClick={() => {
                            URL.revokeObjectURL(p.preview);
                            setPending((list) => list.filter((x) => x.id !== p.id));
                            if (pendingMain === p.id) setPendingMain(null);
                          }}>Descartar</button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="pending-actions">
                    <button className="btn btn-primary" disabled={busy} onClick={publish}>
                      {busy ? "Publicando…" : `Publicar ${pending.length} foto(s)`}
                    </button>
                    <button className="link-btn" disabled={busy} onClick={clearPending}>Cancelar</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Login({ onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (res.ok) onDone();
    else setError((await res.json().catch(() => ({}))).error || "No se pudo iniciar sesión");
  }
  return (
    <section className="wrap page">
      <form className="login" onSubmit={submit}>
        <h1>Administrador</h1>
        <p className="muted">Ingresa la contraseña para gestionar las fotografías.</p>
        <label className="login-field">
          <span>Contraseña</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        </label>
        {error && <p className="admin-status is-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </section>
  );
}

const NoPhoto = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a2acb8" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 18 5-5 4 4 3-3 4 4" />
  </svg>
);
