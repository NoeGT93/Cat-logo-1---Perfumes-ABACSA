import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/catalog";
import { CATEGORIES, WHATSAPP_NUMBER } from "@/lib/config";
import ProductCard from "@/components/ProductCard";
import { SearchIcon } from "@/components/Catalog";
import { WhatsAppIcon } from "@/components/Cart";
import { AddIcon, BrowseIcon, ConfirmIcon, SendIcon } from "@/components/StepIcons";

// Productos cuyas fotos se muestran en el banner (cambiar aquí).
const HERO_CODES = ["238-0", "235-2", "642-0"];

const STEPS = [
  { title: "Elige", text: "Busca en el catálogo", icon: <BrowseIcon /> },
  { title: "Agrega", text: "Docena y fardo con mejor precio", icon: <AddIcon /> },
  { title: "Envía", text: "Tu pedido por WhatsApp", icon: <SendIcon /> },
  { title: "Confirma", text: "Precio final, disponibilidad y envío", icon: <ConfirmIcon /> },
];

export default function Home() {
  const products = getProducts();
  const withPhoto = products.filter((p) => p.mainImage);
  // Destacados: primero los que tienen foto, en el orden del Excel.
  const featured = [...withPhoto, ...products.filter((p) => !p.mainImage)].slice(0, 8);
  // Banner: fotos reales de producto (la última de la galería suele ser los frascos juntos).
  const heroPick = [...HERO_CODES.map((c) => withPhoto.find((p) => p.code === c)).filter(Boolean), ...withPhoto];
  const heroPhotos = [...new Set(heroPick)].slice(0, 3).map((p) => ({ src: p.gallery.at(-1) || p.mainImage, alt: p.name }));

  const categories = CATEGORIES.map((c) => {
    const inCat = products.filter((p) => p.category === c.key);
    return { ...c, count: inCat.length, image: inCat.find((p) => p.mainImage)?.mainImage };
  }).filter((c) => c.count > 0);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Distribuidora ABACSA · Perfumes</p>
            <h1>Todo lo que necesitas para surtir tu negocio.</h1>
            <p className="lead">Encuentra variedad, buenos precios y opciones para comprar al detalle o por mayor.</p>
            <form action="/catalogo" className="search search-hero" role="search">
              <SearchIcon />
              <input type="search" name="q" enterKeyHint="search" placeholder="Busca por nombre, código o marca" aria-label="Buscar productos" />
              <button className="btn btn-accent">Buscar</button>
            </form>
            <div className="hero-actions">
              <Link href="/catalogo" className="btn btn-light">Ver catálogo ({products.length})</Link>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                <WhatsAppIcon size={18} /> Escríbenos
              </a>
            </div>
          </div>
          {heroPhotos.length > 0 && (
            <div className="hero-photos" aria-hidden="true">
              {heroPhotos.map((p, i) => (
                <div key={p.src} className={`hero-photo hero-photo-${i}`}>
                  <Image src={p.src} alt="" fill sizes="(max-width: 900px) 50vw, 360px" priority={i === 0} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="wrap steps" aria-labelledby="steps-title">
        <div className="steps-card">
          <div className="steps-head">
            <p className="eyebrow eyebrow-accent">Pedir es muy fácil</p>
            <h2 id="steps-title">Así de fácil</h2>
          </div>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="step-icon">{s.icon}</span>
                <h3><span className="step-num">{i + 1}.</span> {s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Compra por tipo</h2>
          <Link href="/catalogo" className="link">Ver todo →</Link>
        </div>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.key} href={`/catalogo?cat=${c.key}`} className="cat-tile">
              <span className="cat-img">
                {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 720px) 50vw, 300px" />}
              </span>
              <span className="cat-text">
                <strong>{c.label}</strong>
                <span>{c.count} {c.count === 1 ? "producto" : "productos"}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Productos destacados</h2>
          <Link href="/catalogo" className="link">Ver catálogo →</Link>
        </div>
        <div className="grid">
          {featured.map((p, i) => <ProductCard key={p.code} product={p} eager={i < 2} />)}
        </div>
      </section>

      <section className="wrap section">
        <div className="wholesale">
          <div>
            <h2>¿Tienes tienda o vendes por catálogo?</h2>
            <p>Precios por docena, fardo y distribuidor. Pregúntanos por tu pedido al por mayor.</p>
          </div>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola ABACSA, quiero información sobre precios por mayor.")}`}
            target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-auto">
            <WhatsAppIcon /> Consultar precios por mayor
          </a>
        </div>
      </section>
    </>
  );
}

