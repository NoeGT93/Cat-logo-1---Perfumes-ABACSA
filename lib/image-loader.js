// Cargador de next/image sin servicio de optimización: las fotos de producto tienen una
// miniatura de 640 px (WebP) para tarjetas y móviles; anchos mayores usan la foto completa.
export default function loader({ src, width }) {
  if (!src.startsWith("/images/products/")) return src;
  return width <= 640 ? `${src}?w=640` : src;
}
