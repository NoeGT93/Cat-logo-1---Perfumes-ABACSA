import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { money, priceFor } from "@/lib/config";
import { decodeOrder } from "@/lib/order-link";
import ProductImage from "@/components/ProductImage";

// Pedido enviado por WhatsApp: los códigos y cantidades vienen en el enlace (no se guarda nada).
// Los precios son los vigentes al abrirlo; el mensaje de WhatsApp conserva los del momento del pedido.
async function load(searchParams) {
  const { p } = await searchParams;
  const byCode = new Map((await getProducts()).map((x) => [x.code, x]));
  const items = decodeOrder(p)
    .filter((i) => byCode.has(i.code))
    .map((i) => {
      const product = byCode.get(i.code);
      return { ...i, product, ...priceFor(product, i.qty) };
    });
  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + (i.total ?? 0), 0);
  return { items, count, total };
}

// Vista previa en WhatsApp: foto del primer producto + resumen
export async function generateMetadata({ searchParams }) {
  const { items, count, total } = await load(searchParams);
  const title = items.length ? `Pedido ABACSA · ${count} ${count === 1 ? "unidad" : "unidades"} · ${money(total)}` : "Pedido ABACSA";
  const description = items.map((i) => `${i.qty} × ${i.product.name}`).join(", ").slice(0, 200);
  const image = items.find((i) => i.product.mainImage)?.product.mainImage;
  return { title, description, robots: { index: false }, openGraph: { title, description, images: image ? [image] : [] } };
}

export default async function SharedOrder({ searchParams }) {
  const { items, count, total } = await load(searchParams);
  return (
    <section className="wrap page">
      <div className="order-page">
        <section className="order-page-list">
          <header className="order-head">
            <div>
              <h1 className="shared-title">Pedido recibido por WhatsApp</h1>
              <p className="muted">
                {items.length ? `${count} ${count === 1 ? "unidad" : "unidades"} · ${items.length} ${items.length === 1 ? "código" : "códigos"}` : "Este enlace no contiene productos válidos."}
              </p>
            </div>
          </header>
          <ul className="order-list">
            {items.map((i) => (
              <li key={i.code} className="line shared-line">
                <Link href={`/producto/${encodeURIComponent(i.code)}`} className="line-img shared-img">
                  <ProductImage src={i.product.mainImage} alt={i.product.name} sizes="96px" />
                </Link>
                <div className="line-info">
                  <p className="line-name">{i.product.name}</p>
                  <p className="code">Código {i.code} · {i.product.description}</p>
                  <p className="code">
                    <strong>{i.qty} u.</strong>
                    {i.price != null ? <> × {money(i.price)} <span className="tier-tag">{i.tier}</span></> : " · precio a consultar"}
                  </p>
                </div>
                <span className="line-total">{i.total != null ? money(i.total) : "Consultar"}</span>
              </li>
            ))}
          </ul>
        </section>
        {items.length > 0 && (
          <aside className="order-page-summary">
            <div className="summary">
              <h2 className="summary-title">Resumen</h2>
              <div className="summary-row"><span>Total de unidades</span><strong>{count}</strong></div>
              <div className="summary-row summary-total"><span>Total estimado</span><strong>{money(total)}</strong></div>
              <p className="summary-note">Precios vigentes al abrir este enlace. El mensaje de WhatsApp conserva los precios del momento del pedido.</p>
              <Link href="/catalogo" className="continue-link">Ver catálogo</Link>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
