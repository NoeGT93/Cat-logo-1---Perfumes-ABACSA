# Catálogo ABACSA

Sitio publicado: https://cat-logo-1-perfumes-abacsa.vercel.app

Catálogo digital comercial: Facebook / Instagram → catálogo → pedido → WhatsApp (+502 4031-7724).
Sin pagos, login ni registro. Next.js 15, sin otras dependencias de UI.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Estructura

| Ruta | Qué es |
| --- | --- |
| `data/products.json` | 40 productos generados desde `PERFUME.xlsx` (no editar a mano) |
| `data/product-categories.json` | Código → `kits` / `duos` / `perfumes` / `colonias`. Inferido de la descripción; **corregir aquí a mano** |
| `data/product-images.json` | Código → `{ mainImage, gallery }` |
| `public/images/products/<código>/` | Fotografías con su nombre original |
| `lib/config.js` | WhatsApp, filtros, etiquetas de precios |
| `lib/catalog.js` | Única lectura de datos (reemplazar aquí por API/BD/ERP en el futuro) |
| `/admin` | Administrador de fotografías (con contraseña; guarda en GitHub) |

## Actualizar precios desde el Excel

1. Reemplazar `PERFUME.xlsx` en la raíz del proyecto (o indicar otra ruta).
2. Ejecutar:
   ```bash
   npm run import
   # o: npm run import -- "C:/ruta/a/otro.xlsx"
   ```
3. Se regenera `data/products.json`. Las categorías corregidas a mano y las fotos asociadas **se conservan**; los códigos nuevos reciben categoría inferida.

El Excel nunca se modifica. Campos vacíos → `null`; un precio `null` no se muestra.

## Fotografías

- **Desde la web:** `https://cat-logo-1-perfumes-abacsa.vercel.app/admin` → contraseña → elegir producto → “Elegir fotos” → revisar y marcar la principal → “Publicar”. También “Hacer principal” y “Quitar”.
  Cada acción es un commit en este repositorio (`public/images/products/<código>/` + `data/product-images.json`) y Vercel republica en ≈ 1 minuto. El navegador reduce las fotos a 1600 px (JPG) antes de subirlas.
- **En local:** `npm run dev` → `/admin` (sin contraseña si no hay `ADMIN_PASSWORD`; guarda en el disco, luego hacer commit).
- **Desde la terminal / Claude:**
  ```bash
  node scripts/assign-images.mjs 595-0 fotos/DSC_5736.jpg fotos/DSC_5737.jpg --main DSC_5736.jpg
  ```

Productos sin foto muestran un placeholder.

### Configuración del admin web (Vercel → Settings → Environment Variables)

| Variable | Valor |
| --- | --- |
| `ADMIN_PASSWORD` | Contraseña del admin (larga; cambiarla cierra todas las sesiones) |
| `GITHUB_TOKEN` | Token *fine-grained* de GitHub, solo para este repositorio, permiso **Contents: Read and write** |
| `GITHUB_REPO` | `NoeGT93/Cat-logo-1---Perfumes-ABACSA` |
| `GITHUB_BRANCH` | `main` (opcional) |

Después de guardarlas: Deployments → último → Redeploy. Las miniaturas del admin se leen de `raw.githubusercontent.com` (el repositorio debe seguir siendo público). Pruebas: `npm test`.

## Precios

Escalas por producto (mismo código), en `lib/config.js` (`DOZEN_QTY`, `BUNDLE_QTY`):

| Cantidad | Precio |
| --- | --- |
| 1–11 | Unidad |
| 12–23 | Docena |
| 24+ | Fardo (si no existe, Distribuidor: son la misma escala) |

El pedido suma automáticamente con la escala que corresponde a cada producto y lo presenta como **total estimado**; ABACSA confirma por WhatsApp. Verificación: `npm test`.

## WhatsApp con foto

WhatsApp no permite adjuntar fotos desde un enlace `wa.me`. El mensaje incluye un enlace por producto y WhatsApp muestra su foto como vista previa.

Las fotos del banner de inicio se eligen en `HERO_CODES` (`app/page.jsx`).
