"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/config";
import { CartButton } from "./Cart";
import { SearchIcon } from "./Catalog";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Productos" },
  { href: "/#categorias", label: "Categorías" },
];

function Search({ className }) {
  return (
    <form action="/catalogo" className={className} role="search">
      <SearchIcon />
      <input type="search" name="q" enterKeyHint="search" placeholder="Buscar por código, nombre o marca…" aria-label="Buscar productos" />
    </form>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);

  return (
    <>
      <header className="site-header">
        <div className="wrap header-main">
          <Link href="/" className="logo" aria-label="ABACSA, inicio">
            <img src="/brand/mark.png" alt="" width="30" height="36" />
            <span className="logo-text">
              <img src="/brand/wordmark.png" alt="ABACSA" width="96" height="18" />
              <span>Distribuidora</span>
            </span>
          </Link>

          <Search className="header-search" />

          <nav className="header-links" aria-label="Principal">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>

          <CartButton />
          <button className="menu-btn" aria-label="Menú" aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu((m) => !m)}>
            <MenuIcon open={menu} />
          </button>
        </div>

        {menu && (
          <nav id="mobile-menu" className="mobile-menu">
            <div className="wrap">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.label}</Link>
              ))}
              <p className="mobile-menu-label">Categorías</p>
              {CATEGORIES.map((c) => (
                <Link key={c.key} href={`/catalogo?cat=${c.key}`} onClick={() => setMenu(false)}>{c.label}</Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      {/* En móvil el buscador va debajo del header y se desplaza con la página */}
      <div className="wrap mobile-search">
        <Search className="header-search" />
      </div>
    </>
  );
}

const MenuIcon = ({ open }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
  </svg>
);
