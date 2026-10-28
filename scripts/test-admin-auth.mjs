// Prueba de la sesión del admin: node scripts/test-admin-auth.mjs
import assert from "node:assert/strict";
process.env.ADMIN_PASSWORD = "clave-de-prueba";
const auth = await import("../lib/admin-auth.js");

assert.equal(auth.checkPassword("clave-de-prueba"), true);
assert.equal(auth.checkPassword("otra"), false);
assert.equal(auth.checkPassword(undefined), false);
const cookie = auth.sessionValue();
assert.equal(auth.isAuthed(cookie), true);
assert.equal(auth.isAuthed(undefined), false);
assert.equal(auth.isAuthed(cookie.replace(/.$/, (c) => (c === "a" ? "b" : "a"))), false, "firma alterada");
assert.equal(auth.isAuthed(`${Date.now() - 1000}.${cookie.split(".")[1]}`), false, "vencida o cambiada");
process.env.ADMIN_PASSWORD = "nueva-clave";
assert.equal(auth.isAuthed(cookie), false, "cambiar la contraseña invalida sesiones");
console.log("admin auth ok");
