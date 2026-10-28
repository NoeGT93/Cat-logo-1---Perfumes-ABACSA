// Escritura en el repositorio de GitHub (API REST de Git). Cada cambio del admin = un commit,
// y Vercel republica el sitio automáticamente al recibirlo.
// Variables: GITHUB_TOKEN (permiso Contents: read/write), GITHUB_REPO ("dueño/repo"), GITHUB_BRANCH (main).
const API = "https://api.github.com";
const cfg = () => ({ token: process.env.GITHUB_TOKEN, repo: process.env.GITHUB_REPO, branch: process.env.GITHUB_BRANCH || "main" });

export const githubEnabled = () => !!(cfg().token && cfg().repo);

// URL para previsualizar archivos recién guardados (el repo es público) antes de que Vercel termine de publicar.
export const rawBase = () => `https://raw.githubusercontent.com/${cfg().repo}/${cfg().branch}/public`;

async function gh(path, { method = "GET", body } = {}) {
  const { token, repo } = cfg();
  const res = await fetch(`${API}/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    const err = new Error(`GitHub ${res.status}: ${detail}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");

async function readAt(path, sha) {
  const f = await gh(`/contents/${encodePath(path)}?ref=${sha}`);
  return Buffer.from(f.content ?? (await gh(`/git/blobs/${f.sha}`)).content, "base64");
}

export async function readRepoFile(path) {
  return readAt(path, cfg().branch);
}

// build(read) recibe un lector anclado al último commit y devuelve [{ path, content: Buffer | null }]
// (null = borrar). Si alguien más cambió la rama mientras tanto, GitHub rechaza el commit (422)
// en lugar de sobrescribir: se avisa para volver a intentarlo.
export async function updateRepo(build, message) {
  const { branch } = cfg();
  const parent = (await gh(`/git/ref/heads/${branch}`)).object.sha;
  const files = await build((path) => readAt(path, parent));
  const baseTree = (await gh(`/git/commits/${parent}`)).tree.sha;
  const tree = await Promise.all(
    files.map(async (f) => ({
      path: f.path,
      mode: "100644",
      type: "blob",
      sha: f.content == null ? null : (await gh("/git/blobs", { method: "POST", body: { content: f.content.toString("base64"), encoding: "base64" } })).sha,
    }))
  );
  const newTree = await gh("/git/trees", { method: "POST", body: { base_tree: baseTree, tree } });
  const commit = await gh("/git/commits", { method: "POST", body: { message, tree: newTree.sha, parents: [parent] } });
  try {
    await gh(`/git/refs/heads/${branch}`, { method: "PATCH", body: { sha: commit.sha, force: false } });
  } catch (e) {
    if (e.status === 422) throw new Error("El catálogo cambió mientras guardabas. Recarga la página e intenta de nuevo.");
    throw e;
  }
  return commit.sha;
}
