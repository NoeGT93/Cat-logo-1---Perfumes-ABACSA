import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/catalog";
import { BUNDLE_QTY, CATEGORIES, DOZEN_QTY, WHATSAPP_NUMBER, money } from "@/lib/config";
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

  const minPrice = Math.min(...products.map((p) => p.fromPrice).filter((v) => v != null));

  const categories = CATEGORIES.map((c) => {
    const inCat = products.filter((p) => p.category === c.key);
    return { ...c, count: inCat.length, image: inCat.find((p) => p.mainImage)?.mainImage };
  }).filter((c) => c.count > 0);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Distribuidora en Quetzaltenango</p>
            <h1>
              Todo lo que necesitas para <span className="hero-hl">surtir tu negocio.</span>
            </h1>
            <p className="lead">Encuentra variedad, buenos precios y opciones para comprar al detalle o por mayor.</p>
            <ul className="hero-points">
              <li><CheckIcon /> Precio de docena desde {DOZEN_QTY} unidades</li>
              <li><CheckIcon /> Precio de fardo desde {BUNDLE_QTY} unidades</li>
              <li><CheckIcon /> Pide por WhatsApp, sin registrarte</li>
            </ul>
            {/* En escritorio el buscador ya está en el header */}
            <form action="/catalogo" className="search search-hero" role="search">
              <SearchIcon />
              <input type="search" name="q" enterKeyHint="search" placeholder="Busca por nombre, código o marca" aria-label="Buscar productos" />
            </form>
            <div className="hero-actions">
              <Link href="/catalogo" className="btn btn-accent btn-hero">
                Ver catálogo <ArrowIcon />
              </Link>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                <WhatsAppIcon size={18} /> Pedir por WhatsApp
              </a>
            </div>
          </div>
          {heroPhotos.length > 0 && (
            <div className="hero-media">
              <div className="hero-photos" aria-hidden="true">
                {heroPhotos.map((p, i) => (
                  <div key={p.src} className={`hero-photo hero-photo-${i}`}>
                    <Image src={p.src} alt="" fill sizes={i === 0 ? "(max-width: 900px) 100vw, 560px" : "(max-width: 900px) 50vw, 280px"} priority={i === 0} />
                  </div>
                ))}
              </div>
              {minPrice != null && (
                <p className="hero-badge">
                  <strong>{products.length} productos</strong>
                  <span>desde {money(minPrice)} c/u</span>
                </p>
              )}
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


const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
