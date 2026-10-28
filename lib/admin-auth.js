// Sesión del admin: contraseña en ADMIN_PASSWORD (Vercel) y cookie firmada con HMAC por 12 h.
// Sin ADMIN_PASSWORD: abierto solo en desarrollo local; en producción el admin queda cerrado.
import crypto from "node:crypto";

export const COOKIE = "abacsa_admin";
const MAX_AGE = 60 * 60 * 12;
const password = () => process.env.ADMIN_PASSWORD || "";

export const authRequired = () => !!password() || process.env.NODE_ENV === "production";

const hash = (s) => crypto.createHash("sha256").update(String(s)).digest();
const sign = (value) => crypto.createHmac("sha256", password()).update(value).digest("hex");

export function checkPassword(input) {
  return !!password() && crypto.timingSafeEqual(hash(input), hash(password()));
}

export function sessionValue() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function isAuthed(cookieValue) {
  if (!authRequired()) return true;
  if (!password() || !cookieValue) return false;
  const [exp, sig = ""] = cookieValue.split(".");
  if (!(Number(exp) > Date.now())) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: MAX_AGE,
};
