import Link from "next/link";
import { headers } from "next/headers";
import { Inter, Poppins } from "next/font/google";
import { CartProvider } from "@/components/Cart";
import Header from "@/components/Header";
import { getProducts } from "@/lib/catalog";
import { SITE_URL, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import "./globals.css";

// Inter para lectura; Poppins para títulos, precios y botones.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

// metadataBase = dominio desde el que se visita (o NEXT_PUBLIC_SITE_URL): las vistas previas de
// WhatsApp/Facebook usan URLs absolutas de las fotos.
export async function generateMetadata() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const base = SITE_URL || (host ? `${h.get("x-forwarded-proto") || "https"}://${host}` : undefined);
  return {
    ...(base && { metadataBase: new URL(base) }),
    title: "Catálogo ABACSA",
    description: "Encuentra lo que necesitas y descubre mucho más. Compra al detalle o por mayor y pide por WhatsApp.",
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ffffff",
};

// Todas las páginas leen las fotos de R2 en cada visita (sin deploy al cambiar fotos).
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  // Solo lo que el pedido necesita para mostrar nombre, foto y precio.
  const products = (await getProducts()).map(({ code, name, mainImage, prices, fromPrice }) => ({ code, name, mainImage, prices, fromPrice }));
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`}>
      <body>
        <CartProvider products={products}>
          <Header />
          <main className="main">{children}</main>
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
