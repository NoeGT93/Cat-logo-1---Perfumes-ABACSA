"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import { CartButton, WhatsAppIcon } from "./Cart";
import { SearchIcon } from "./Catalog";

const NAV = [{ key: "", label: "Todos los productos" }, ...CATEGORIES];

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-main">
        <Link href="/" className="logo" aria-label="ABACSA, inicio">
          <img src="/brand/mark.png" alt="" width="30" height="36" />
          <img src="/brand/wordmark.png" alt="ABACSA" width="85" height="16" />
        </Link>

        <form action="/catalogo" className="header-search" role="search">
          <SearchIcon />
          <input type="search" name="q" enterKeyHint="search" placeholder="¿Qué estás buscando? Nombre, código o marca" aria-label="Buscar productos" />
        </form>

        <a className="header-contact" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
          <span className="header-contact-icon"><WhatsAppIcon size={20} /></span>
          <span>
            <small>Pedidos por WhatsApp</small>
            <strong>{WHATSAPP_DISPLAY}</strong>
          </span>
        </a>

        <Link href="/catalogo" className="header-icon-link" aria-label="Buscar productos">
          <SearchIcon />
        </Link>
        <CartButton />
      </div>

      <nav className="header-nav" aria-label="Categorías">
        <div className="wrap header-nav-row">
          <Suspense fallback={<NavLinks />}>
            <ActiveNavLinks />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

function ActiveNavLinks() {
  const pathname = usePathname();
  const cat = useSearchParams().get("cat") || "";
  return <NavLinks active={pathname === "/catalogo" ? cat : null} />;
}

function NavLinks({ active = null }) {
  return NAV.map((c) => (
    <Link
      key={c.key || "all"}
      href={c.key ? `/catalogo?cat=${c.key}` : "/catalogo"}
      className="header-nav-link"
      aria-current={active === c.key ? "page" : undefined}
    >
      {c.label}
    </Link>
  ));
}
