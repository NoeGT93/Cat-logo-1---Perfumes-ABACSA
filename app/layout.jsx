import Link from "next/link";
import { Inter, Poppins } from "next/font/google";
import { CartProvider, CartButton, OrderShell, WhatsAppIcon } from "@/components/Cart";
import { getProducts } from "@/lib/catalog";
import { SITE_URL, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import "./globals.css";

// Inter para lectura; Poppins para títulos, precios y botones.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

export const metadata = {
  ...(SITE_URL && { metadataBase: new URL(SITE_URL) }),
  title: "Catálogo ABACSA",
  description: "Encuentra lo que necesitas y descubre mucho más. Compra al detalle o por mayor y pide por WhatsApp.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#08465d",
};

export default function RootLayout({ children }) {
  // Solo lo que el pedido necesita para mostrar nombre, foto y precio.
  const products = getProducts().map(({ code, name, mainImage, prices, fromPrice }) => ({ code, name, mainImage, prices, fromPrice }));
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`}>
      <body>
        <CartProvider products={products}>
          <div className="topbar">
            <div className="wrap topbar-row">
              <span>Al detalle y por mayor · Quetzaltenango</span>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={14} /> {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>
          <header className="site-header">
            <div className="wrap header-row">
              <Link href="/" className="logo" aria-label="ABACSA, inicio">
                <img src="/brand/mark.png" alt="" width="28" height="34" />
                <img src="/brand/wordmark.png" alt="ABACSA" width="80" height="15" />
              </Link>
              <nav className="nav">
                <Link href="/">Inicio</Link>
                <Link href="/catalogo">Catálogo</Link>
              </nav>
              <CartButton />
            </div>
          </header>
          <OrderShell>{children}</OrderShell>
          <footer className="site-footer">
            <div className="wrap footer-grid">
              <div>
                <img src="/brand/logo.png" alt="ABACSA — Encuentra lo que necesitas y descubre mucho más." className="footer-logo" />
              </div>
              <div>
                <h3>Catálogo</h3>
                <Link href="/catalogo">Todos los productos</Link>
                <Link href="/catalogo?cat=kits">Kits</Link>
                <Link href="/catalogo?cat=duos">Dúos</Link>
              </div>
              <div>
                <h3>Contacto</h3>
                <p>Quetzaltenango, Guatemala</p>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
            <div className="wrap footer-legal">© ABACSA · Precios sujetos a confirmación por WhatsApp</div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
