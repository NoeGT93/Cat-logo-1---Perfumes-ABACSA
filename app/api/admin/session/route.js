import { NextResponse } from "next/server";
import { COOKIE, checkPassword, cookieOptions, sessionValue } from "@/lib/admin-auth";

// Iniciar sesión
export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos repetidos
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, sessionValue(), cookieOptions);
  return res;
}

// Cerrar sesión
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
