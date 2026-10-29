import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Las páginas que muestran fotos se generan en cada visita (leen R2), así que no hace falta caché incremental.
export default defineCloudflareConfig({});
