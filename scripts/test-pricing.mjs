// Verificación de escalas de precio: node scripts/test-pricing.mjs
import assert from "node:assert/strict";
import { priceFor, nextTier } from "../lib/config.js";

const kit = { prices: { unit: 75, dozen: 65, bundle: 60, distributor: null } }; // 595-0
const duo = { prices: { unit: 85, dozen: 75, bundle: null, distributor: 68 } }; // 235-12
const noUnit = { prices: { unit: null, dozen: 50, bundle: null, distributor: null } };

assert.deepEqual(priceFor(kit, 1), { price: 75, tier: "Unidad", total: 75 });
assert.deepEqual(priceFor(kit, 11), { price: 75, tier: "Unidad", total: 825 });
assert.deepEqual(priceFor(kit, 13), { price: 65, tier: "Docena", total: 845 });
assert.deepEqual(priceFor(kit, 24), { price: 60, tier: "Fardo", total: 1440 });
assert.deepEqual(priceFor(duo, 30), { price: 68, tier: "Distribuidor", total: 2040 });
assert.equal(priceFor(noUnit, 3).price, null);
assert.equal(priceFor(noUnit, 12).price, 50);
assert.deepEqual(nextTier(kit, 10), { need: 2, price: 65, label: "Docena" });
assert.deepEqual(nextTier(kit, 12), { need: 12, price: 60, label: "Fardo" });
assert.equal(nextTier(kit, 24), null);
console.log("pricing ok");
