"use client";
import { useState } from "react";
import Image from "next/image";

// Muestra la foto (redimensionada por Next según `sizes`) o un placeholder si no existe o falla.
// El contenedor debe tener position: relative y tamaño definido.
export default function ProductImage({ src, alt, eager, sizes = "(max-width: 720px) 50vw, 25vw" }) {
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
  return <Image src={src} alt={alt} fill sizes={sizes} priority={eager} onError={() => setFailed(true)} />;
}
