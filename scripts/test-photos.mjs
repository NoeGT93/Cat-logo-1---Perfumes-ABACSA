// Prueba del admin sobre R2 con un bucket simulado en memoria: node scripts/test-photos.mjs
import assert from "node:assert/strict";
import { getPlatformProxy } from "wrangler";

// R2 real emulado por wrangler, en memoria (no toca datos locales ni de Cloudflare)
const { env, dispose } = await getPlatformProxy({ persist: false });
const photos = await import("../lib/photos.js");
photos.__setBucket(env.PHOTOS);
const map = () => photos.getMap();

// 1. Subir 2 fotos (con miniatura) a un producto sin fotos, la segunda como principal
const [A, B] = await photos.addImages("595-0", [
  { name: "a.jpg", buffer: new TextEncoder().encode("foto-a"), thumb: new TextEncoder().encode("mini-a") },
  { name: "b.jpg", buffer: new TextEncoder().encode("foto-b") },
], "b.jpg");
assert.match(A, /^\/images\/products\/595-0\/a-[0-9a-f]{8}\.jpg$/,"nombre con huella del contenido");
assert.deepEqual((await map())["595-0"], { mainImage: B, gallery: [A, B] });
// Misma foto = mismo nombre; foto distinta con el mismo nombre de archivo = URL nueva (sin caché vieja)
const [A2] = await photos.addImages("595-0", [{ name: "a.jpg", buffer: new TextEncoder().encode("foto-a") }]);
assert.equal(A2, A);
const [A3] = await photos.addImages("595-0", [{ name: "a.jpg", buffer: new TextEncoder().encode("foto-a-nueva") }]);
assert.notEqual(A3, A);
await photos.removeImage("595-0", A3);
assert.equal(await (await photos.getPhoto(A, true)).text(), "mini-a", "miniatura");
assert.equal(await (await photos.getPhoto(B, true)).text(), "foto-b", "sin miniatura → foto completa");
assert.equal((await photos.getPhoto(A)).httpMetadata.contentType, "image/jpeg");

// 2. Otros productos no se tocan
await photos.addImages("452-0", [{ name: "k.jpg", buffer: new Uint8Array([1]) }]);
assert.equal((await map())["595-0"].gallery.length, 2);

// 3. Cambiar principal y quitar (también borra archivo y miniatura)
await photos.setMain("595-0", A);
assert.equal((await map())["595-0"].mainImage, A);
await photos.removeImage("595-0", A);
assert.deepEqual((await map())["595-0"], { mainImage: B, gallery: [B] });
assert.equal(await photos.getPhoto(A, true), null);

// 4. Errores claros
await assert.rejects(photos.setMain("595-0", "/images/products/595-0/no.jpg"), /no está asociada/);
await assert.rejects(photos.addImages("595-0", [{ name: "x.exe", buffer: new Uint8Array([1]) }]), /Formato no permitido/);

// 5. Si el mapa cambió entre la lectura y la escritura, no se sobrescribe
const realGet = env.PHOTOS.get.bind(env.PHOTOS);
photos.__setBucket({
  ...env.PHOTOS,
  put: env.PHOTOS.put.bind(env.PHOTOS),
  delete: env.PHOTOS.delete.bind(env.PHOTOS),
  get: async (k) => {
    const obj = await realGet(k);
    if (k === "meta/product-images.json") await env.PHOTOS.put(k, JSON.stringify({ cambio: "ajeno" }));
    return obj;
  },
});
await assert.rejects(photos.setMain("595-0", B), /cambió mientras guardabas/);

await dispose();
console.log("photos r2 ok");
