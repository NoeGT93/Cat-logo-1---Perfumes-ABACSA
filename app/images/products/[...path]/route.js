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
    // Fotos subidas desde el admin: nombre con huella del contenido (foto-1a2b3c4d.jpg) → nunca cambian, caché de 1 año.
    // Fotos migradas con su nombre original: caché corta.
    "Cache-Control": /-[0-9a-f]{8}\.\w+$/i.test(url) ? "public, max-age=31536000, immutable" : "public, max-age=600",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}
