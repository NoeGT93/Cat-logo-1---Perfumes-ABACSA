import { NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";
import { addImage, removeImage, setMain } from "@/lib/image-store.mjs";

// Solo para desarrollo local: sin autenticación, escribe en disco.
const blocked = () =>
  process.env.NODE_ENV === "production" && NextResponse.json({ error: "Solo disponible en desarrollo" }, { status: 403 });

const list = () =>
  getProducts().map(({ code, name, description, mainImage, gallery }) => ({ code, name, description, mainImage, gallery }));

const exists = (code) => getProducts().some((p) => p.code === code);

export async function GET() {
  return blocked() || NextResponse.json(list());
}

export async function POST(req) {
  if (blocked()) return blocked();
  const form = await req.formData();
  const code = form.get("code");
  if (!exists(code)) return NextResponse.json({ error: "Código inexistente" }, { status: 400 });
  try {
    for (const f of form.getAll("files")) addImage(code, f.name, Buffer.from(await f.arrayBuffer()));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  return NextResponse.json(list());
}

export async function PATCH(req) {
  if (blocked()) return blocked();
  const { code, action, url } = await req.json();
  try {
    if (action === "main") setMain(code, url);
    else if (action === "remove") removeImage(code, url);
    else throw new Error("Acción inválida");
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  return NextResponse.json(list());
}
