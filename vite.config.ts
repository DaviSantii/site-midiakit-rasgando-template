import { existsSync, readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// Cliente aberto por `npm run dev` quando nenhum é informado.
const DEV_CLIENT = "demo"

// Cada build leva só um cliente: a configuração entra por @client e os arquivos
// vêm de clients/<nome>/public, para nenhum site carregar dados de outro.
const resolveClient = (command: string, mode: string) => {
  const clients = readdirSync(path("./clients"))
  const usage = "Clientes disponíveis: " + clients.join(", ")
  if (command === "build" && mode === "production") {
    throw new Error("Informe o cliente: npm run build -- --mode <nome>. " + usage)
  }
  const client = command === "serve" && mode === "development" ? DEV_CLIENT : mode
  if (!existsSync(path("./clients/" + client + "/config.ts"))) {
    throw new Error('Cliente "' + client + '" não encontrado. ' + usage)
  }
  return client
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** Dados de clients/<nome>/site.json. Só `title` e `description` são obrigatórios. */
type SiteJson = {
  title: string
  description: string
  url?: string
  image?: string
  /** Quem é a pessoa, para os buscadores (dados estruturados e resumo sem JavaScript). */
  person?: {
    name: string
    alternateName?: string[]
    jobTitle?: string
    location?: string
    email?: string
    /** Perfis nas redes; o Google usa para ligar a página à pessoa. */
    sameAs?: string[]
  }
  /** Parágrafos do resumo em texto, iguais ao que a página mostra. */
  summary?: string[]
  brands?: string[]
  keywords?: string[]
}

const readSite = (client: string): SiteJson => JSON.parse(readFileSync(path("./clients/" + client + "/site.json"), "utf8"))

/** Rótulo de um link de rede, tirado do endereço. */
const networkLabel = (url: string) => {
  const host = new URL(url).hostname.replace(/^www\./, "")
  const name = host.includes("tiktok") ? "TikTok" : host.includes("instagram") ? "Instagram" : host.includes("youtube") ? "YouTube" : host
  const handle = new URL(url).pathname.replace(/\/$/, "").split("/").pop() || ""
  return name + (handle ? " " + (handle.startsWith("@") ? handle : "@" + handle) : "")
}

// Título, prévia do link e dados para buscadores vão direto no HTML: WhatsApp,
// redes e alguns buscadores não executam o JavaScript do site. Nada disso aparece
// na tela; o resumo fica num <noscript>, com o mesmo conteúdo que a página mostra.
const siteHead = (client: string): Plugin => ({
  name: "site-head",
  transformIndexHtml(html) {
    const site = readSite(client)
    const title = escapeHtml(site.title)
    const description = escapeHtml(site.description)
    const url = site.url ? site.url.replace(/\/$/, "") + "/" : ""
    // A imagem de prévia precisa de endereço completo.
    const image = url && site.image ? url + site.image.replace(/^\//, "") : ""
    const p = site.person
    const tags = [
      '<meta name="description" content="' + description + '" />',
      '<meta name="robots" content="index, follow, max-image-preview:large" />',
      url && '<link rel="canonical" href="' + escapeHtml(url) + '" />',
      site.keywords?.length && '<meta name="keywords" content="' + escapeHtml(site.keywords.join(", ")) + '" />',
      p && '<meta name="author" content="' + escapeHtml(p.name) + '" />',
      '<meta property="og:type" content="profile" />',
      '<meta property="og:locale" content="pt_BR" />',
      p && '<meta property="og:site_name" content="' + escapeHtml(p.name) + '" />',
      '<meta property="og:title" content="' + title + '" />',
      '<meta property="og:description" content="' + description + '" />',
      url && '<meta property="og:url" content="' + escapeHtml(url) + '" />',
      image && '<meta property="og:image" content="' + escapeHtml(image) + '" />',
      image && '<meta name="twitter:card" content="summary_large_image" />',
      '<meta name="twitter:title" content="' + title + '" />',
      '<meta name="twitter:description" content="' + description + '" />',
      image && '<meta name="twitter:image" content="' + escapeHtml(image) + '" />',
      p && '<script type="application/ld+json">' + jsonLd(site, url, image) + "</script>",
    ].filter(Boolean)
    const head = html.replace(/<title>.*<\/title>/, "<title>" + title + "</title>\n    " + tags.join("\n    "))
    return head.replace('<div id="root"></div>', '<div id="root"></div>\n    ' + noscript(site))
  },
  // robots.txt e sitemap.xml, só no build e só com endereço definido.
  generateBundle() {
    const site = readSite(client)
    if (!site.url) return
    const url = site.url.replace(/\/$/, "") + "/"
    const today = new Date().toISOString().slice(0, 10)
    this.emitFile({ type: "asset", fileName: "robots.txt", source: "User-agent: *\nAllow: /\n\nSitemap: " + url + "sitemap.xml\n" })
    this.emitFile({
      type: "asset",
      fileName: "sitemap.xml",
      source:
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>' +
        escapeHtml(url) +
        "</loc><lastmod>" +
        today +
        "</lastmod></url>\n</urlset>\n",
    })
  },
})

/** Dados estruturados (schema.org): página de perfil de uma pessoa. */
const jsonLd = (site: SiteJson, url: string, image: string) => {
  const p = site.person!
  const person = {
    "@type": "Person",
    name: p.name,
    alternateName: p.alternateName,
    jobTitle: p.jobTitle,
    description: site.description,
    image: image || undefined,
    email: p.email ? "mailto:" + p.email : undefined,
    address: p.location ? { "@type": "PostalAddress", addressLocality: p.location, addressCountry: "BR" } : undefined,
    sameAs: p.sameAs,
    knowsAbout: site.keywords,
  }
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: site.title,
    description: site.description,
    url: url || undefined,
    inLanguage: "pt-BR",
    mainEntity: person,
  }
  // "</" dentro do JSON fecharia a tag <script>.
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

/** Resumo em texto para quem lê o HTML sem executar JavaScript. Não aparece na tela. */
const noscript = (site: SiteJson) => {
  const p = site.person
  if (!p) return ""
  const parts = [
    "<h1>" + escapeHtml(p.name) + (p.alternateName?.length ? " (" + escapeHtml(p.alternateName[0]) + ")" : "") + "</h1>",
    "<p>" + escapeHtml([p.jobTitle, p.location].filter(Boolean).join(" · ")) + "</p>",
    ...(site.summary || []).map((s) => "<p>" + escapeHtml(s) + "</p>"),
    p.sameAs?.length && "<h2>Redes</h2><ul>" + p.sameAs.map((u) => '<li><a href="' + escapeHtml(u) + '">' + escapeHtml(networkLabel(u)) + "</a></li>").join("") + "</ul>",
    site.brands?.length && "<h2>Marcas</h2><p>" + escapeHtml(site.brands.join(", ")) + "</p>",
    p.email && '<h2>Contato</h2><p><a href="mailto:' + escapeHtml(p.email) + '">' + escapeHtml(p.email) + "</a></p>",
  ].filter(Boolean)
  return "<noscript><main>" + parts.join("") + "</main></noscript>"
}

export default defineConfig(({ command, mode }) => {
  const client = resolveClient(command, mode)
  return {
    plugins: [react(), tailwindcss(), siteHead(client)],
    publicDir: path("./clients/" + client + "/public"),
    // Gerar um build com o servidor ligado não pode derrubá-lo.
    server: { watch: { ignored: ["**/dist/**"] } },
    optimizeDeps: { entries: ["index.html"] },
    build: { outDir: "dist/" + client, emptyOutDir: true },
    resolve: {
      alias: [
        { find: /^@client$/, replacement: path("./clients/" + client + "/config.ts") },
        // Os componentes do 21st.dev importam "@/components/ui/<nome>"; aqui cada
        // um fica numa pasta própria: src/components/ui/<nome>/<nome>.tsx
        {
          find: /^@\/components\/ui\/([^/]+)$/,
          replacement: path("./src/components/ui/$1/$1.tsx"),
        },
        { find: /^@\//, replacement: path("./src/") },
      ],
    },
  }
})
