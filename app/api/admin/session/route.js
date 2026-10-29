import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { COOKIE, checkPassword, cookieOptions, sessionValue } from "@/lib/admin-auth";

// Límite de intentos (binding LOGIN_LIMITER de Cloudflare: 10 por minuto). Sin binding, no limita.
async function tooMany() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.LOGIN_LIMITER) return false;
    return !(await env.LOGIN_LIMITER.limit({ key: "admin-login" })).success;
  } catch {
    return false;
  }
}

// Iniciar sesión
export async function POST(req) {
  if (await tooMany()) return NextResponse.json({ error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
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
