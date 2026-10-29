import { NextResponse } from "next/server";
import { buildProducts } from "@/lib/catalog";
import { COOKIE, isAuthed } from "@/lib/admin-auth";
import { addImages, getMap, removeImage, setMain } from "@/lib/photos";

export const dynamic = "force-dynamic";

const MAX_FILE = 3.5 * 1024 * 1024; // el navegador ya reduce las fotos a 1600 px antes de enviarlas
const MAX_THUMB = 512 * 1024;
const MAX_FILES = 12;
const IMAGE = /^image\/(jpeg|png|webp|avif)$/;

const fail = (error, status = 400) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

function guard(req) {
  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === "production") return fail("Falta configurar el secreto ADMIN_PASSWORD en Cloudflare.", 503);
  if (!isAuthed(req.cookies.get(COOKIE)?.value)) return fail("Sesión requerida", 401);
  // Solo peticiones del propio sitio (además de la cookie SameSite=Strict)
  const origin = req.headers.get("origin");
  if (req.method !== "GET" && origin && origin !== new URL(req.url).origin) return fail("Origen no permitido", 403);
  return null;
}

const codes = new Set(buildProducts().map((p) => p.code));

async function state() {
  // Orden del Excel: columna "No." (id)
  const products = buildProducts()
    .map(({ id, code, name, description, category }) => ({ id, code, name, description, category }))
    .sort((a, b) => a.id - b.id);
  return { products, map: await getMap() };
}

async function run(fn) {
  try {
    await fn();
    return NextResponse.json(await state(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(e.message);
  }
}

export async function GET(req) {
  return guard(req) || run(() => {});
}

export async function POST(req) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const form = await req.formData();
  const code = form.get("code");
  const files = form.getAll("files").filter((f) => typeof f === "object");
  const thumbs = new Map(form.getAll("thumbs").filter((f) => typeof f === "object").map((t) => [t.name.replace(/\.webp$/, ""), t]));
  if (!codes.has(code)) return fail("Código inexistente");
  if (!files.length || files.length > MAX_FILES) return fail(`Envía entre 1 y ${MAX_FILES} fotos`);
  for (const f of files) {
    if (!IMAGE.test(f.type)) return fail(`Formato no permitido: ${f.name}`);
    if (f.size > MAX_FILE) return fail(`La foto ${f.name} pesa demasiado`);
    const t = thumbs.get(f.name);
    if (t && (t.type !== "image/webp" || t.size > MAX_THUMB)) return fail(`Miniatura inválida: ${f.name}`);
  }
  const data = await Promise.all(
    files.map(async (f) => {
      const t = thumbs.get(f.name);
      return { name: f.name, buffer: await f.arrayBuffer(), thumb: t ? await t.arrayBuffer() : null };
    })
  );
  return run(() => addImages(code, data, form.get("main") || null));
}

export async function PATCH(req) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const { code, action, url } = await req.json();
  if (!codes.has(code)) return fail("Código inexistente");
  if (action === "main") return run(() => setMain(code, url));
  if (action === "remove") return run(() => removeImage(code, url));
  return fail("Acción inválida");
}
