import { getPhoto } from "@/lib/photos";

// Sirve las fotos desde R2 con la misma URL de siempre: /images/products/<código>/<nombre>
// ?w=640 entrega la miniatura WebP si existe (la usa el cargador de next/image en tarjetas).
export async function GET(req, { params }) {
  const { path } = await params;
  const url = "/images/products/" + path.map(encodeURIComponent).join("/").replace(/%20/g, " ");
  const obj = await getPhoto(decodeURIComponent(url), new URL(req.url).searchParams.get("w") === "640");
  if (!obj) return new Response("No encontrada", { status: 404 });

  const etag = obj.httpEtag;
  const headers = {
    "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
    // 1 h en el navegador y la CDN; si el admin reemplaza una foto con el mismo nombre se ve en < 1 h.
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}
