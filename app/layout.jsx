import Link from "next/link";
import { CartProvider, CartButton } from "@/components/Cart";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import "./globals.css";

export const metadata = {
  title: "Catálogo ABACSA",
  description: "Encuentra lo que necesitas y descubre mucho más. Compra al detalle o por mayor y pide por WhatsApp.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <header className="site-header">
            <div className="wrap header-row">
              <Link href="/" className="logo" aria-label="ABACSA, inicio">
                <img src="/brand/mark.png" alt="" width="28" height="34" />
                <img src="/brand/wordmark.png" alt="ABACSA" width="80" height="15" />
              </Link>
              <nav className="nav">
                <Link href="/catalogo">Catálogo</Link>
              </nav>
              <CartButton />
            </div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div className="wrap footer-row">
              <img src="/brand/logo.png" alt="ABACSA — Encuentra lo que necesitas y descubre mucho más." className="footer-logo" />
              <div>
                <p>Quetzaltenango, Guatemala</p>
                <p>
                  WhatsApp:{" "}
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                    {WHATSAPP_DISPLAY}
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
