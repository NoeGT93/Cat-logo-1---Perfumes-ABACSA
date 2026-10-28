// Prueba del admin en modo GitHub contra un GitHub simulado en memoria: node scripts/test-admin-github.mjs
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.GITHUB_TOKEN = "token-de-prueba";
process.env.GITHUB_REPO = "prueba/catalogo";

// --- GitHub falso: commits con árbol completo { ruta: base64 } ---
const commits = { c0: { tree: { "data/product-images.json": Buffer.from(fs.readFileSync("data/product-images.json")).toString("base64") }, parent: null } };
const trees = {}, blobs = {};
let head = "c0", n = 0;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url), p = u.pathname.replace("/repos/prueba/catalogo", ""), m = init.method || "GET";
  const body = init.body && JSON.parse(init.body);
  assert.equal(init.headers.Authorization, "Bearer token-de-prueba");
  if (m === "GET" && p === "/git/ref/heads/main") return json({ object: { sha: head } });
  if (m === "GET" && p.startsWith("/git/commits/")) { const sha = p.split("/").pop(); trees["t-" + sha] = commits[sha].tree; return json({ tree: { sha: "t-" + sha } }); }
  if (m === "GET" && p.startsWith("/contents/")) {
    const ref = u.searchParams.get("ref"), file = decodeURIComponent(p.slice(10));
    const content = commits[ref === "main" ? head : ref].tree[file];
    return content ? json({ content, sha: "x" }) : json({ message: "Not Found" }, 404);
  }
  if (m === "POST" && p === "/git/blobs") { const sha = "b" + ++n; blobs[sha] = body.content; return json({ sha }); }
  if (m === "POST" && p === "/git/trees") {
    const t = { ...trees[body.base_tree] };
    for (const e of body.tree) e.sha === null ? delete t[e.path] : (t[e.path] = blobs[e.sha]);
    const sha = "t" + ++n; trees[sha] = t; return json({ sha });
  }
  if (m === "POST" && p === "/git/commits") { const sha = "c" + ++n; commits[sha] = { tree: trees[body.tree], parent: body.parents[0], message: body.message }; return json({ sha }); }
  if (m === "PATCH" && p === "/git/refs/heads/main") {
    if (commits[body.sha].parent !== head) return json({ message: "Update is not a fast forward" }, 422);
    head = body.sha; return json({ object: { sha: head } });
  }
  throw new Error(`Llamada no simulada: ${m} ${p}`);
};

const store = await import("../lib/admin-store.js");
const tree = () => commits[head].tree;
const map = () => JSON.parse(Buffer.from(tree()["data/product-images.json"], "base64").toString());

assert.equal(store.storeMode(), "github");
assert.ok(store.previewBase().startsWith("https://raw.githubusercontent.com/prueba/catalogo/main/public"));

// 1. Subir 2 fotos a un producto sin fotos, eligiendo la segunda como principal → un solo commit
const before = Object.keys(commits).length;
await store.addImages("595-0", [
  { name: "a.jpg", buffer: Buffer.from("foto-a") },
  { name: "b.jpg", buffer: Buffer.from("foto-b") },
], "b.jpg");
assert.equal(Object.keys(commits).length, before + 1, "un commit por publicación");
assert.equal(Buffer.from(tree()["public/images/products/595-0/a.jpg"], "base64").toString(), "foto-a");
assert.deepEqual(map()["595-0"], { mainImage: "/images/products/595-0/b.jpg", gallery: ["/images/products/595-0/a.jpg", "/images/products/595-0/b.jpg"] });
assert.ok(map()["452-0"], "no toca los demás productos");

// 2. Cambiar principal
await store.setMain("595-0", "/images/products/595-0/a.jpg");
assert.equal(map()["595-0"].mainImage, "/images/products/595-0/a.jpg");

// 3. Quitar foto: borra asociación y archivo
await store.removeImage("595-0", "/images/products/595-0/a.jpg");
assert.equal(tree()["public/images/products/595-0/a.jpg"], undefined);
assert.deepEqual(map()["595-0"], { mainImage: "/images/products/595-0/b.jpg", gallery: ["/images/products/595-0/b.jpg"] });

// 4. Lectura del estado
assert.deepEqual((await store.getMap())["595-0"].gallery, ["/images/products/595-0/b.jpg"]);

// 5. Si otra persona guardó en medio, no se sobrescribe: error claro
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  if ((init.method || "GET") === "PATCH") head = "c0"; // simula un cambio ajeno justo antes
  return realFetch(url, init);
};
await assert.rejects(store.setMain("595-0", "/images/products/595-0/b.jpg"), /cambió mientras guardabas/);
globalThis.fetch = realFetch;

// 6. Formato no permitido
await assert.rejects(store.addImages("595-0", [{ name: "x.exe", buffer: Buffer.from("x") }]), /Formato no permitido/);

console.log("admin github ok");
