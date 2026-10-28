"use client";
import { useRef } from "react";
import ProductCard from "./ProductCard";

// Fila deslizable con scroll nativo (scroll-snap); las flechas solo desplazan una "página".
export default function ProductCarousel({ products }) {
  const track = useRef(null);
  const page = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="carousel">
      <div className="carousel-track" ref={track}>
        {products.map((p, i) => (
          <div key={p.code} className="carousel-item">
            <ProductCard product={p} eager={i < 2} />
          </div>
        ))}
      </div>
      <button className="carousel-btn carousel-prev" onClick={() => page(-1)} aria-label="Anteriores">
        <Chevron dir={-1} />
      </button>
      <button className="carousel-btn carousel-next" onClick={() => page(1)} aria-label="Siguientes">
        <Chevron dir={1} />
      </button>
    </div>
  );
}

const Chevron = ({ dir }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir > 0 ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
  </svg>
);
