import { NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";
import { COOKIE, isAuthed } from "@/lib/admin-auth";
import { addImages, getMap, previewBase, removeImage, setMain, storeMode } from "@/lib/admin-store";

export const dynamic = "force-dynamic";

const MAX_FILE = 3.5 * 1024 * 1024; // el navegador ya reduce las fotos a 1600 px antes de enviarlas
const MAX_FILES = 12;

const fail = (error, status = 400) => NextResponse.json({ error }, { status });

function guard(req) {
  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === "production") return fail("Falta configurar ADMIN_PASSWORD en Vercel.", 503);
  if (!isAuthed(req.cookies.get(COOKIE)?.value)) return fail("Sesión requerida", 401);
  if (storeMode() === "disabled") return fail("Falta configurar GITHUB_TOKEN y GITHUB_REPO en Vercel.", 503);
  return null;
}

const exists = (code) => getProducts().some((p) => p.code === code);

async function state() {
  // Orden del Excel: columna "No." (id)
  const products = getProducts()
    .map(({ id, code, name, description, category }) => ({ id, code, name, description, category }))
    .sort((a, b) => a.id - b.id);
  return { mode: storeMode(), previewBase: previewBase(), products, map: await getMap() };
}

async function run(fn) {
  try {
    await fn();
    return NextResponse.json(await state());
  } catch (e) {
    return fail(e.message, e.status === 401 || e.status === 403 ? 502 : 400);
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
  if (!exists(code)) return fail("Código inexistente");
  if (!files.length || files.length > MAX_FILES) return fail(`Envía entre 1 y ${MAX_FILES} fotos`);
  for (const f of files) {
    if (!/^image\/(jpeg|png|webp|avif)$/.test(f.type)) return fail(`Formato no permitido: ${f.name}`);
    if (f.size > MAX_FILE) return fail(`La foto ${f.name} pesa demasiado`);
  }
  const data = await Promise.all(files.map(async (f) => ({ name: f.name, buffer: Buffer.from(await f.arrayBuffer()) })));
  return run(() => addImages(code, data, form.get("main") || null));
}

export async function PATCH(req) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const { code, action, url } = await req.json();
  if (!exists(code)) return fail("Código inexistente");
  if (action === "main") return run(() => setMain(code, url));
  if (action === "remove") return run(() => removeImage(code, url));
  return fail("Acción inválida");
}
