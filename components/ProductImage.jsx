"use client";
import { useState } from "react";

// Muestra la foto o un placeholder limpio si no existe o falla al cargar.
export default function ProductImage({ src, alt, eager }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="ph" role="img" aria-label={`${alt} — fotografía no disponible`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m4 18 5-5 4 4 3-3 4 4" />
        </svg>
        <span>Foto próximamente</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />;
}
