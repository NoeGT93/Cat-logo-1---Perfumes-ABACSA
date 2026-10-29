// Verificación de escalas de precio: node scripts/test-pricing.mjs
import assert from "node:assert/strict";
import { priceFor, nextTier } from "../lib/config.js";
import { decodeOrder, encodeOrder } from "../lib/order-link.js";

const kit = { prices: { unit: 75, dozen: 65, bundle: 60, distributor: null } }; // 595-0
const duo = { prices: { unit: 85, dozen: 75, bundle: null, distributor: 68 } }; // 235-12
const noUnit = { prices: { unit: null, dozen: 50, bundle: null, distributor: null } };

assert.deepEqual(priceFor(kit, 1), { price: 75, tier: "Unidad", total: 75 });
assert.deepEqual(priceFor(kit, 3), { price: 75, tier: "Unidad", total: 225 });
assert.deepEqual(priceFor(kit, 4), { price: 65, tier: "Por mayor", total: 260 });
assert.deepEqual(priceFor(kit, 23), { price: 65, tier: "Por mayor", total: 1495 });
assert.deepEqual(priceFor(kit, 24), { price: 60, tier: "Fardo", total: 1440 });
assert.deepEqual(priceFor(duo, 30), { price: 68, tier: "Distribuidor", total: 2040 });
assert.equal(priceFor(noUnit, 3).price, null);
assert.equal(priceFor(noUnit, 4).price, 50);
assert.deepEqual(nextTier(kit, 1), { need: 3, price: 65, label: "Por mayor" });
assert.deepEqual(nextTier(kit, 4), { need: 20, price: 60, label: "Fardo" });
assert.equal(nextTier(kit, 24), null);
// Enlace de pedido: ida y vuelta, también con códigos con espacios
const order = [{ code: "595-0", qty: 13 }, { code: "7406305019878 COD 1007-8", qty: 2 }];
assert.deepEqual(decodeOrder(encodeOrder(order)), order);
assert.deepEqual(decodeOrder("595-0*0~x*abc~%E0%A4*1"), []);
console.log("pricing ok");
