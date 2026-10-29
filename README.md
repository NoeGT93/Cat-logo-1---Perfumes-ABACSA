# Catálogo ABACSA

Catálogo digital comercial: Facebook / Instagram → catálogo → pedido → WhatsApp (+502 4031-7724).
Sin pagos, login ni registro de clientes. Next.js 15 en **Cloudflare Workers** (adaptador OpenNext), fotos en **Cloudflare R2**.

```
GitHub (código, productos, precios) ──push──> Cloudflare Workers Builds ──> Worker
Admin /admin ──────────────────────────────> R2 (fotos + asociación)   ← sin commits ni deploys
```

## Desarrollo

```bash
npm install
cp .env.example .dev.vars          # contraseña local del admin
npm run migrate-photos             # carga las fotos de migration/ al R2 local (una vez)
npm run dev                        # http://localhost:3000
npm run preview                    # runtime real de Workers en local
npm test
```

## Estructura

| Ruta | Qué es |
| --- | --- |
| `data/products.json` | 40 productos generados desde `PERFUME.xlsx` (no editar a mano) |
| `data/product-categories.json` | Código → `kits` / `duos` / `perfumes` / `colonias`. **Corregir aquí a mano** |
| `lib/catalog.js` | Productos + fotos (lee R2 en cada visita) |
| `lib/photos.js` | Acceso a R2: fotos, miniaturas y asociación código → fotos |
| `app/images/products/[...path]` | Sirve las fotos desde R2 en `/images/products/<código>/<nombre>` (`?w=640` = miniatura) |
| `lib/image-loader.js` | Cargador de `next/image`: miniatura ≤ 640 px, foto completa para pantallas grandes |
| `/admin` | Administrador de fotografías (contraseña; guarda en R2) |
| `migration/` | Copia de las fotos y la asociación tal como estaban en GitHub/Vercel (respaldo) |
| `wrangler.jsonc` | Configuración de Cloudflare (bucket R2 `abacsa-fotos`, límite de intentos de login) |

### R2

| Clave | Contenido |
| --- | --- |
| `products/<código>/<nombre>` | Foto completa (≤ 1600 px) |
| `thumbs/<código>/<nombre>.webp` | Miniatura 640 px (el admin la genera en el navegador) |
| `meta/product-images.json` | `{ código: { mainImage, gallery } }` — escrituras condicionadas (no se pisan) |

## Actualizar precios desde el Excel

1. Reemplazar `PERFUME.xlsx` y ejecutar `npm run import`.
2. Hacer commit y push: Cloudflare publica la nueva versión. Las fotos (R2) no se tocan.

## Fotografías

`/admin` → contraseña → elegir producto → “Elegir fotos” → revisar y marcar la principal → “Publicar”. También “Hacer principal” y “Quitar”. Los cambios se ven **al instante**, sin deploy. El navegador reduce las fotos a 1600 px (JPG) y genera la miniatura WebP de 640 px.

## Precios

| Cantidad (mismo código) | Precio |
| --- | --- |
| 1–11 | Unidad |
| 12–23 | Docena |
| 24+ | Fardo (si no existe, Distribuidor) |

El pedido suma con la escala de cada producto y lo presenta como **total estimado**; ABACSA confirma por WhatsApp.

## Publicar en Cloudflare (una vez)

```bash
npx wrangler login
npx wrangler r2 bucket create abacsa-fotos
npm run migrate-photos -- --remote
npx wrangler secret put ADMIN_PASSWORD
npm run deploy
```

Publicación automática (Workers Builds) conectada a la rama `cloudflare`: cada push compila y publica solo. Las fotos (admin → R2) no generan builds.
