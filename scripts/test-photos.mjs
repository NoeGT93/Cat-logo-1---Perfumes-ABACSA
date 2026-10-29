// Prueba del admin sobre R2 con un bucket simulado en memoria: node scripts/test-photos.mjs
import assert from "node:assert/strict";
import { getPlatformProxy } from "wrangler";

// R2 real emulado por wrangler, en memoria (no toca datos locales ni de Cloudflare)
const { env, dispose } = await getPlatformProxy({ persist: false });
const photos = await import("../lib/photos.js");
photos.__setBucket(env.PHOTOS);
const map = () => photos.getMap();

// 1. Subir 2 fotos (con miniatura) a un producto sin fotos, la segunda como principal
await photos.addImages("595-0", [
  { name: "a.jpg", buffer: new TextEncoder().encode("foto-a"), thumb: new TextEncoder().encode("mini-a") },
  { name: "b.jpg", buffer: new TextEncoder().encode("foto-b") },
], "b.jpg");
assert.deepEqual((await map())["595-0"], { mainImage: "/images/products/595-0/b.jpg", gallery: ["/images/products/595-0/a.jpg", "/images/products/595-0/b.jpg"] });
assert.equal(await (await photos.getPhoto("/images/products/595-0/a.jpg", true)).text(), "mini-a", "miniatura");
assert.equal(await (await photos.getPhoto("/images/products/595-0/b.jpg", true)).text(), "foto-b", "sin miniatura → foto completa");
assert.equal((await photos.getPhoto("/images/products/595-0/a.jpg")).httpMetadata.contentType, "image/jpeg");

// 2. Otros productos no se tocan
await photos.addImages("452-0", [{ name: "k.jpg", buffer: new Uint8Array([1]) }]);
assert.equal((await map())["595-0"].gallery.length, 2);

// 3. Cambiar principal y quitar (también borra archivo y miniatura)
await photos.setMain("595-0", "/images/products/595-0/a.jpg");
assert.equal((await map())["595-0"].mainImage, "/images/products/595-0/a.jpg");
await photos.removeImage("595-0", "/images/products/595-0/a.jpg");
assert.deepEqual((await map())["595-0"], { mainImage: "/images/products/595-0/b.jpg", gallery: ["/images/products/595-0/b.jpg"] });
assert.equal(await photos.getPhoto("/images/products/595-0/a.jpg", true), null);

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
await assert.rejects(photos.setMain("595-0", "/images/products/595-0/b.jpg"), /cambió mientras guardabas/);

await dispose();
console.log("photos r2 ok");
