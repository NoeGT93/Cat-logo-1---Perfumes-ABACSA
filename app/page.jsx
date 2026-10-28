import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/config";
import ProductCard from "@/components/ProductCard";

// Productos cuyas fotos principales (perfumes) forman la composición del banner (cambiar aquí).
const HERO_CODES = ["238-0", "235-2", "642-0"];

export default function Home() {
  const products = getProducts();
  const withPhoto = products.filter((p) => p.mainImage);
  // Destacados: 12 productos (3 filas en escritorio), primero los que tienen foto, en el orden del Excel.
  const featured = [...withPhoto, ...products.filter((p) => !p.mainImage)].slice(0, 12);
  const heroPick = [...HERO_CODES.map((c) => withPhoto.find((p) => p.code === c)).filter(Boolean), ...withPhoto];
  const heroPhotos = [...new Set(heroPick)].slice(0, 3);

  const categories = CATEGORIES.map((c) => {
    const inCat = products.filter((p) => p.category === c.key);
    return { ...c, count: inCat.length, image: inCat.find((p) => p.mainImage)?.mainImage };
  }).filter((c) => c.count > 0);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="hero-tagline">Encuentra lo que necesitas y descubre mucho más.</p>
            <h1>Todo lo que necesitas para surtir tu negocio.</h1>
            <p className="lead">Encuentra variedad, buenos precios y opciones para comprar al detalle o por mayor.</p>
            <div className="hero-row">
              <Link href="/catalogo" className="btn btn-primary btn-hero">
                Ver catálogo <ArrowIcon />
              </Link>
              <ul className="hero-features">
                <li><TagIcon /><span>Precios<br />especiales</span></li>
                <li><ChatIcon /><span>Pedidos<br />por WhatsApp</span></li>
                <li><ShieldIcon /><span>Variedad<br />para tu negocio</span></li>
              </ul>
            </div>
          </div>
          {heroPhotos.length > 0 && (
            <div className="hero-stack" aria-hidden="true">
              {heroPhotos.map((p, i) => (
                <div key={p.code} className={`hero-tile hero-tile-${i}`}>
                  <Image src={p.mainImage} alt="" fill sizes="(max-width: 900px) 50vw, 340px" priority={i === 0} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Productos destacados</h2>
          <Link href="/catalogo" className="link">Ver catálogo <ArrowIcon /></Link>
        </div>
        <div className="grid grid-featured">
          {featured.map((p, i) => <ProductCard key={p.code} product={p} eager={i < 4} />)}
        </div>
        <div className="section-foot">
          <Link href="/catalogo" className="btn btn-secondary">Ver los {products.length} productos <ArrowIcon /></Link>
        </div>
      </section>

      <section className="wrap section" id="categorias">
        <div className="section-head">
          <h2>Compra por categoría</h2>
        </div>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.key} href={`/catalogo?cat=${c.key}`} className="cat-tile">
              <span className="cat-img">
                {c.image ? <Image src={c.image} alt="" fill sizes="96px" /> : <BoxIcon />}
              </span>
              <span className="cat-text">
                <strong>{c.label}</strong>
                <span>Ver productos <ArrowIcon /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

const Svg = ({ children, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ArrowIcon = () => <Svg><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
const TagIcon = () => <Svg size={24} sw={1.5}><path d="M3 12V4h8l9.5 9.5-8 8L3 12Z" /><circle cx="7.5" cy="8.5" r="1.3" /></Svg>;
const ChatIcon = () => <Svg size={24} sw={1.5}><path d="M12 4C7 4 3.5 7.3 3.5 11.5c0 2.2 1 4.1 2.6 5.5L5.5 21l4-1.9c.8.2 1.6.3 2.5.3 5 0 8.5-3.3 8.5-7.9S17 4 12 4Z" /></Svg>;
const ShieldIcon = () => <Svg size={24} sw={1.5}><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></Svg>;
const BoxIcon = () => <Svg size={28} sw={1.4}><path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z" /><path d="m4 8 8 4 8-4M12 12v8" /></Svg>;
