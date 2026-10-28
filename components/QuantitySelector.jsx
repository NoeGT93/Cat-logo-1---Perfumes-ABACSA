"use client";

export default function QuantitySelector({ value, onChange, min = 1, max = 9999, small }) {
  const set = (n) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div className={`qty${small ? " qty-sm" : ""}`}>
      <button type="button" onClick={() => set(value - 1)} aria-label="Disminuir cantidad" disabled={value <= min && min > 0}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label="Cantidad"
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) set(n);
        }}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" onClick={() => set(value + 1)} aria-label="Aumentar cantidad">
        +
      </button>
    </div>
  );
}
