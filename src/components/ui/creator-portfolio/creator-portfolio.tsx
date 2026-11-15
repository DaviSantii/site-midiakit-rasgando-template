"use client"

// Creator Portfolio — versão em tons quentes terrosos, com tema de criador de conteúdo, do
// "Torn Postcard Portfolio" de Kedhareswer Naidu (21st.dev). A mecânica de
// rasgar o papel no scroll é a original; as ilustrações e a paleta foram
// refeitas: celular estilo TikTok na capa, selo do Instagram, produtos nos
// polaroids, papel pontilhado no lugar do mapa e corações no lugar da neve.
// Tudo é SVG gerado neste arquivo; fotos próprias entram pelas props.
import * as React from "react"

export type SceneKind = "dawn" | "lake" | "sun" | "forest" | "peak" | "night" | "river"

export type PostcardProject = {
  name: string
  year?: string
  role?: string
  description?: string
  tags?: string[]
  url?: string
  /** Handwritten caption under the polaroid. */
  note?: string
  /** Generated photo for the polaroid. Ignored when `image` is set. */
  scene?: SceneKind
  /** Your own photo (any URL). */
  image?: string
  /** A video (any URL) that plays muted in the polaroid while it is on top. Wins over `image`. */
  video?: string
}

export type PostcardStop = {
  year: string
  title: string
  place?: string
  text?: string
  /** Print shown beside the text; clicking it expands it on screen. */
  image?: string
}

export type PostcardAbout = {
  title?: string
  subtitle?: string
  /** The handwritten message on the front of the card. */
  text?: string
  /** The big photo on the front. A generated dawn scene when omitted. */
  photo?: string
  /** The face in the stamp. A drawn figure when omitted; `false` removes the stamp. */
  portrait?: string | false
  /** Rows on the back of the card. */
  facts?: { label: string; value: string }[]
  skills?: string[]
}

export type PostcardLink = { label: string; url: string }

export type PostcardPalette = {
  /** Night-blue chapters. */
  navy?: string
  /** The darkest blue: forests, shadows, the stage behind everything. */
  deep?: string
  /** Fog-beige chapters. */
  fog?: string
  /** Postcards, notes and polaroids. */
  paper?: string
  /** Text on paper. */
  ink?: string
  /** Rust: the squirrel, links, the active stop. */
  accent?: string
  /** Washi tape. */
  tape?: string
  /** Text on the dark chapters. */
  cream?: string
  /** Light text and navigation over a dark cover. */
  heroDark?: boolean
  /** Colors of the illustrations and backgrounds. */
  art?: Partial<PortfolioArt>
}

export type PortfolioBrand = {
  name: string
  logo: string
  /** Logo much wider than tall: gets a wider sticker. */
  wide?: boolean
  /** Sticker shape. Picked automatically when omitted. */
  shape?: "seal" | "stamp" | "torn" | "round"
  /** Sticker color. Falls back to the palette. */
  bg?: string
  /** Paints the logo: any CSS background (a color or layered gradients). Without it, the file's own colors. */
  fill?: string
  /** CSS filter on the logo (e.g. colored echoes). */
  logoFilter?: string
}

export type CreatorPortfolioProps = TornPostcardPortfolioProps

export type TornPostcardPortfolioProps = {
  name?: string
  role?: string
  location?: string
  /** Year on the logo stamp. */
  since?: string
  /** The cover headline, one string per line. */
  headline?: string[]
  /** Under the headline. */
  intro?: string
  /** The torn note under the eagle. Defaults to "<n> projects worth a slow look". */
  note?: string
  /** Numbers shown on the note, one per line, instead of `note`. */
  noteStats?: { value: string; label: string }[]
  /** Link of the round Instagram seal. Without it, the seal is only decoration. */
  sealUrl?: string
  /** Rede desenhada no meio do selo. Padrão: Instagram. */
  sealIcon?: "instagram" | "tiktok"
  /** Handwriting font of the site (loaded by the client's config). */
  handFont?: string
  /** Icons that float over the page, instead of hearts and sparkles. */
  floaters?: FloaterIcon[]
  about?: PostcardAbout
  projects?: PostcardProject[]
  route?: PostcardStop[]
  email?: string
  links?: PostcardLink[]
  /** Nav labels for the five chapters. */
  labels?: string[]
  workTitle?: string
  routeTitle?: string
  contactTitle?: string
  palette?: PostcardPalette
  /** Viewport-heights of scroll per chapter. */
  scrollPerChapter?: number
  /** Ease the tear toward the scroll position instead of following it 1:1. */
  smooth?: boolean
  /** When scrolling stops halfway through a tear, finish (or undo) it. */
  snap?: boolean
  /** Headline rises and the eagle glides in on first paint. */
  animateIn?: boolean
  /** Falling snow on the night-blue chapters. */
  snow?: boolean
  /** Screenshot shown on the cover phone (e.g. a TikTok profile). Without it, a drawn creator. */
  phoneScreen?: string
  /** Up to two photos shown as video thumbnails under `phoneScreen`. */
  phoneGrid?: string[]
  /** `false` replaces the contact form with the e-mail address and a copy button. */
  contactForm?: boolean
  /** Web3Forms access key. With it, the contact form really sends; without it, it only tries to open the visitor's mail app. */
  web3formsKey?: string
  /** Small labels over the `phoneGrid` thumbnails (e.g. view counts). */
  phoneGridLabels?: string[]
  /** Frame of the work polaroids. Defaults to "portrait" (9:16) when a project has a video. */
  workFrame?: "square" | "portrait"
  /** Brand logos (white, transparent background). With them, a chapter appears after the work. */
  brands?: PortfolioBrand[]
  brandsTitle?: string
  /** Photo behind the brand stickers, tinted with the palette. */
  brandsBackground?: string
  /** Fixed interface texts, to translate or reword the site. */
  ui?: Partial<PortfolioUi>
  /** Height of the pinned stage. Always a definite length. */
  height?: string
  className?: string
}

// #region logic
type Pt = [number, number]

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Seeded PRNG, so every drawing is identical on server and client. */
const rng = (seed: number) => {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ease = (x: number) => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

const fmt = (n: number) => String(Math.round(n * 100) / 100)

/** A tear: n + 1 vertical offsets (px) at evenly spaced x. Long waves plus ragged fibres. */
const tornEdge = (seed: number, n: number, amp: number): number[] => {
  const r = rng(seed)
  const a = r() * 6.283
  const b = r() * 6.283
  const out: number[] = []
  for (let i = 0; i <= n; i++) {
    const x = i / n
    let y = Math.sin(x * 6.283 * 1.15 + a) * amp * 0.55 + Math.sin(x * 6.283 * 3.4 + b) * amp * 0.28 + (r() - 0.5) * amp * 0.6
    if (r() < 0.07) y += (r() - 0.5) * amp * 1.5
    out.push(Math.round(y * 10) / 10)
  }
  return out
}

/** How far the white paper core shows past the tear, per point. */
const fiberDepth = (seed: number, n: number, min: number, max: number): number[] => {
  const r = rng(seed)
  const a = r() * 6.283
  const out: number[] = []
  for (let i = 0; i <= n; i++) {
    const wave = 0.5 + 0.5 * Math.sin((i / n) * 6.283 * 2.3 + a)
    out.push(Math.round((min + (max - min) * (wave * 0.7 + r() * 0.3)) * 10) / 10)
  }
  return out
}

/** Sheets overscan the stage by PAD px top and bottom so a tilt never shows an edge. */
const PAD = 40

const edgeY = (seam: number, off: number) =>
  "calc(" + PAD + "px + (100% - " + PAD * 2 + "px) * " + fmt(seam) + (off < 0 ? " - " + fmt(-off) : " + " + fmt(off)) + "px)"

/** clip-path for the piece above the tear (optionally pushed down by a fibre band). */
const upperClip = (edge: number[], seam: number, depth?: number[]) => {
  const n = edge.length - 1
  const pts = ["0 0", "100% 0"]
  for (let i = n; i >= 0; i--) pts.push(fmt((i / n) * 100) + "% " + edgeY(seam, edge[i] + (depth ? depth[i] : 0)))
  return "polygon(" + pts.join(",") + ")"
}

/** clip-path for the piece below the tear (optionally pulled up by a fibre band). */
const lowerClip = (edge: number[], seam: number, depth?: number[]) => {
  const n = edge.length - 1
  const pts: string[] = []
  for (let i = 0; i <= n; i++) pts.push(fmt((i / n) * 100) + "% " + edgeY(seam, edge[i] - (depth ? depth[i] : 0)))
  pts.push("100% 100%", "0 100%")
  return "polygon(" + pts.join(",") + ")"
}

/**
 * Scroll position (in chapters) → what every chapter is doing. Chapter k rests
 * for the first `hold` of its slice, then tears open; k + 1 grows out of the gap.
 */
const frame = (s: number, n: number, hold: number) => {
  const pos = clamp(s, 0, n - 1)
  const k = Math.min(Math.floor(pos), n - 1)
  const split = k < n - 1 ? ease((pos - k - hold) / (1 - hold)) : 0
  const chapters: { s: number; p: number; on: boolean }[] = []
  for (let i = 0; i < n; i++) {
    chapters.push({
      s: i === k ? split : 0,
      p: i === k ? 1 : i === k + 1 ? split : 0,
      on: i === k || (i === k + 1 && split > 0),
    })
  }
  return { k, split, active: split > 0.55 ? k + 1 : k, chapters }
}

/** Where to settle when scrolling stops halfway through a tear, or null to stay. */
const snapTarget = (s: number, n: number, hold: number, dir: number): number | null => {
  const pos = clamp(s, 0, n - 1)
  const k = Math.floor(pos)
  if (k >= n - 1) return null
  const split = ease((pos - k - hold) / (1 - hold))
  if (split <= 0.002 || split >= 0.998) return null
  const forward = dir > 0 ? split > 0.12 : split > 0.88
  return forward ? k + 1 : k + hold
}

const wrap = (i: number, n: number) => ((i % n) + n) % n

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "·"

const mailtoHref = (email: string, subject: string, body: string) => {
  const q: string[] = []
  if (subject) q.push("subject=" + encodeURIComponent(subject))
  if (body) q.push("body=" + encodeURIComponent(body))
  return "mailto:" + email + (q.length ? "?" + q.join("&") : "")
}

/** Midpoint-displacement mountain ridge from x0 to x1 around `base`. */
const ridge = (seed: number, x0: number, x1: number, base: number, amp: number, rough = 0.52, depth = 7): Pt[] => {
  const r = rng(seed)
  const n = Math.pow(2, depth)
  const ys: number[] = []
  for (let i = 0; i <= n; i++) ys.push(0)
  ys[0] = (r() - 0.5) * amp
  ys[n] = (r() - 0.5) * amp
  let step = n
  let a = amp
  while (step > 1) {
    const half = step / 2
    for (let i = half; i < n; i += step) ys[i] = (ys[i - half] + ys[i + half]) / 2 + (r() - 0.5) * a
    a *= rough
    step = half
  }
  return ys.map((y, i) => [x0 + ((x1 - x0) * i) / n, base + y] as Pt)
}

/** Catmull-Rom through points → cubic Bézier path. */
const curveThrough = (p: Pt[]) => {
  if (p.length < 2) return ""
  let d = "M" + fmt(p[0][0]) + " " + fmt(p[0][1])
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)]
    const b = p[i]
    const c = p[i + 1]
    const e = p[Math.min(p.length - 1, i + 2)]
    d += " C" + fmt(b[0] + (c[0] - a[0]) / 6) + " " + fmt(b[1] + (c[1] - a[1]) / 6) + " " + fmt(c[0] - (e[0] - b[0]) / 6) + " " + fmt(c[1] - (e[1] - b[1]) / 6) + " " + fmt(c[0]) + " " + fmt(c[1])
  }
  return d
}

/** How far along curveThrough(p) each point sits (0 → 1), and the curve's length. */
const measureCurve = (p: Pt[]): { fr: number[]; total: number } => {
  if (p.length < 2) return { fr: p.map(() => 0), total: 0 }
  const lens = [0]
  let total = 0
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)]
    const b = p[i]
    const c = p[i + 1]
    const e = p[Math.min(p.length - 1, i + 2)]
    const c1: Pt = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6]
    const c2: Pt = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6]
    let prev = b
    for (let k = 1; k <= 24; k++) {
      const t = k / 24
      const u = 1 - t
      const q: Pt = [
        u * u * u * b[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * c[0],
        u * u * u * b[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * c[1],
      ]
      total += Math.hypot(q[0] - prev[0], q[1] - prev[1])
      prev = q
    }
    lens.push(total)
  }
  return { fr: lens.map((l) => (total ? l / total : 0)), total }
}

const pathFractions = (p: Pt[]) => measureCurve(p).fr
// #endregion logic

/* ------------------------------------------------------------------ */
/* defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_PROJECTS: PostcardProject[] = [
  {
    name: "Hearth",
    year: "2026",
    role: "Product design & build",
    description: "A booking app for mountain lodges that feels like walking into a warm kitchen. Rooms, sauna slots and the bus timetable on one calm screen.",
    tags: ["React Native", "Design"],
    note: "4.9 on the store, no ads",
    scene: "dawn",
  },
  {
    name: "Frostline",
    year: "2025",
    role: "Data visualisation",
    description: "An avalanche and weather dashboard for ski patrols, readable at a glance and usable with gloves on.",
    tags: ["D3", "React"],
    note: "used by 12 patrol teams",
    scene: "peak",
  },
  {
    name: "Swan Count",
    year: "2025",
    role: "Design + iOS",
    description: "Citizen science for a lake that never freezes. Over a thousand whooper swans winter there, and volunteers count every one.",
    tags: ["SwiftUI", "Research"],
    note: "1,500 swans every winter",
    scene: "lake",
  },
  {
    name: "Ember",
    year: "2024",
    role: "Product design",
    description: "The companion app for a warm-light lamp: sunrise alarms, slow evenings and nothing that glows blue after nine.",
    tags: ["Figma", "Motion"],
    note: "the sunrise alarm",
    scene: "sun",
  },
  {
    name: "Trailhead",
    year: "2023",
    role: "Front-end",
    description: "Open-source trail maps that keep working offline, deep in the woods where the signal gives up.",
    tags: ["Maps", "PWA"],
    url: "https://example.com",
    note: "40 MB of forest, offline",
    scene: "forest",
  },
]

const DEFAULT_ROUTE: PostcardStop[] = [
  { year: "2019", title: "Went freelance", place: "Hyderabad", text: "Two cafés and a yoga studio. Learned to listen before drawing anything." },
  { year: "2020", title: "Designer at Nordlys", place: "Remote", text: "Design systems for a travel company. Shipped a booking flow that halved support tickets." },
  { year: "2022", title: "Lead designer, Frostline", place: "Bengaluru", text: "Built the data-viz team from one to five. Charts that work in a blizzard." },
  { year: "2024", title: "Design engineer, Hearth", place: "Remote", text: "Prototype in code, ship in code. Owned the app from first sketch to store." },
  { year: "2026", title: "Independent studio", place: "Anywhere with a view", text: "Taking on a few careful projects a year. Maybe yours." },
]

const DEFAULT_ABOUT: PostcardAbout = {
  title: "Postcard",
  subtitle: "How I slow down, recover and keep making good things",
  text: "If you need to reset, rebuild your focus and get your energy back, the best way is to make something with care, in good company. I design and build calm, useful products, and I like trading the noise for the view and shipping with the people who will use it.",
  facts: [
    { label: "Based in", value: "Hyderabad, India" },
    { label: "Doing", value: "Product design + front-end" },
    { label: "Experience", value: "7 years, 40+ launches" },
    { label: "Currently", value: "Open for new projects" },
  ],
  skills: ["Figma", "React", "TypeScript", "Motion", "Design systems", "Research"],
}

const DEFAULT_LINKS: PostcardLink[] = [
  { label: "GitHub", url: "https://github.com" },
  { label: "LinkedIn", url: "https://linkedin.com" },
  { label: "Dribbble", url: "https://dribbble.com" },
]

/** Fixed interface texts. {first}, {name} and {project} are filled in when used. */
const DEFAULT_UI = {
  seeWork: "See the work",
  writeMe: "Write to me",
  keepScrolling: "Keep scrolling",
  tearsOpen: " — the page tears open",
  turnOver: "Turn over ↻",
  front: "↺ Front",
  backEyebrow: "Media kit",
  divider: "sent with love · via DM",
  next: "Next",
  lastStop: "Last stop",
  visit: "Visit the site ↗",
  ask: "Ask me about it →",
  askMessage: "Hi {first},\n\nI'd love to hear more about {project}. ",
  routeEyebrow: "Analytics · top videos",
  goesTo: "It goes straight to",
  messagePlaceholder: "Dear {first}, I have a project in mind…",
  mailSubject: "A postcard for {name}",
  to: "To",
  from: "From",
  fromPlaceholder: "you@studio.com",
  copyEmail: "Copy email",
  copied: "Copied ✓",
  send: "Send postcard",
  sent: "Sent ✓",
  sentStamp: "SENT WITH CARE",
  mailOpening: "Trying to open your mail app. If nothing opens, copy the address and write directly.",
  sending: "Sending…",
  sentConfirmed: "Message sent — thank you!",
  sendFailed: "It didn't go through. Copy the address and write directly.",
  waitToSend: "Wait {s}s",
  routeHint: "",
  emailLabel: "E-mail",
  sealLabel: "Instagram",
  madeWith: "made with care & patience",
  backToTop: "Back to the top ↑",
  tapForSound: "tap for sound",
  logoPrefix: "EST. ",
  seal: "FOLLOW ON INSTAGRAM ✦ FOLLOW ON INSTAGRAM ✦",
}

export type PortfolioUi = typeof DEFAULT_UI

/** Espera entre um envio confirmado e o próximo, para poupar o limite mensal do formulário. */
const SEND_COOLDOWN_MS = 60_000

const HOLD = 0.32
const STEP_MS = 1000

/* ------------------------------------------------------------------ */
/* styles                                                             */
/* ------------------------------------------------------------------ */

const TPP_CSS = `
.tpp-root{position:relative;width:100%;color:var(--tpp-ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;--tpp-serif:"Cormorant Garamond","Cormorant","Playfair Display","Didot","Bodoni 72",Georgia,"Times New Roman",serif;--tpp-hand:"Caveat","Segoe Print","Bradley Hand","Marker Felt","Comic Sans MS",cursive}
.tpp-root *,.tpp-root *::before,.tpp-root *::after{box-sizing:border-box}
.tpp-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit}
.tpp-root :where(button,a,textarea,input):focus-visible{outline:2px dashed currentColor;outline-offset:3px}
.tpp-svg{display:block;max-width:none}
.tpp-fill{position:absolute;inset:0;width:100%;height:100%}
.tpp-track{position:relative;width:100%}
.tpp-steps{display:none}
@media (pointer:coarse){
html{overscroll-behavior:none}
.tpp-steps{position:absolute;left:16px;right:16px;bottom:max(14px,env(safe-area-inset-bottom));z-index:40;display:flex;align-items:center;justify-content:center;gap:10px;pointer-events:none}
.tpp-next,.tpp-prev{display:flex;align-items:center;justify-content:center;height:44px;border-radius:99px;background:var(--tpp-paper);color:var(--tpp-ink);box-shadow:0 8px 20px -6px rgba(40,5,0,.65);pointer-events:auto}
.tpp-next{gap:8px;min-width:0;padding:0 20px;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;white-space:nowrap;animation:tpp-bob 1.8s ease-in-out infinite}
.tpp-prev{flex:0 0 44px;width:44px}.tpp-steps[data-last]{bottom:calc(max(14px,env(safe-area-inset-bottom)) + 56px)}
.tpp-next-label{display:none !important}
.tpp-ch:not([data-on]) *{animation-play-state:paused !important}
.tpp-ch:not([data-on]) .tpp-in,.tpp-ch:not([data-on]) .tpp-up,.tpp-ch:not([data-on]) .tpp-lo,.tpp-ch:not([data-on]) .tpp-par{will-change:auto}
}
.tpp-stage{position:sticky;top:0;width:100%;overflow:clip;container-type:size;container-name:tpp;background:var(--tpp-deep)}
.tpp-ch{position:absolute;inset:0;visibility:hidden}
.tpp-ch[data-on]{visibility:visible}
.tpp-in{position:absolute;inset:0;transform-origin:50% 55%;will-change:transform}
.tpp-up,.tpp-lo{position:absolute;left:0;right:0;top:-40px;bottom:-40px;will-change:transform}
.tpp-up{z-index:2;transform-origin:50% 0}
.tpp-lo{z-index:1;transform-origin:50% 100%}
.tpp-sh,.tpp-fib,.tpp-shade{position:absolute;inset:0}
.tpp-fib{background:var(--tpp-fiber)}
.tpp-shade{background:rgba(59,42,32,.3)}
.tpp-lo .tpp-shade{background:rgba(59,42,32,.18)}
.tpp-grain{position:absolute;inset:0;background-image:var(--tpp-gd);background-size:192px 192px;pointer-events:none}
.tpp-grain[data-light]{background-image:var(--tpp-gl)}
.tpp-box{position:absolute;left:0;right:0;top:40px;bottom:40px;overflow:clip}
.tpp-ub{position:absolute;left:0;right:0;top:0;height:calc(var(--seam) * 100%)}
.tpp-lb{position:absolute;left:0;right:0;bottom:0;top:calc(var(--seam) * 100% + 16px)}
.tpp-par{will-change:transform;transition:transform .25s ease-out}
.tpp-root[data-mode=stack] .tpp-stage{position:relative;container-type:normal;background:none}
.tpp-root[data-mode=stack] .tpp-ch{position:relative;inset:auto;visibility:visible;height:var(--tpp-h);container-type:size;container-name:tpp;overflow:clip}

.tpp-serif{font-family:var(--tpp-serif)}
.tpp-hand{font-family:var(--tpp-hand)}
.tpp-h{font-family:var(--tpp-serif);font-weight:300;text-transform:uppercase;letter-spacing:.06em;line-height:1.08;margin:0}
.tpp-hero-h{font-size:clamp(28px,min(4.8cqw,7.4cqh),70px);color:var(--tpp-hero-text);font-weight:500;text-shadow:0 2px 24px var(--tpp-hero-glow)}
.tpp-sec-h{font-size:clamp(24px,min(4cqw,6cqh),56px)}
.tpp-label{font-size:11px;letter-spacing:.24em;text-transform:uppercase}

.tpp-nav{position:absolute;left:0;right:0;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px clamp(16px,4cqw,44px);color:var(--tpp-navc,var(--tpp-cream));transition:color .5s;pointer-events:none}
.tpp-nav>*{pointer-events:auto}
.tpp-stage[data-tone=light] .tpp-nav,.tpp-stage[data-tone=light] .tpp-rail{--tpp-navc:var(--tpp-ink)}
.tpp-brand{font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;white-space:nowrap}
.tpp-links{display:flex;gap:clamp(12px,2.2cqw,28px)}
.tpp-link{position:relative;font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.7;transition:opacity .3s}
.tpp-link:hover,.tpp-link[aria-current=true]{opacity:1}
.tpp-link::after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:1px;background:currentColor;transform:scaleX(0);transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.tpp-link[aria-current=true]::after{transform:scaleX(1)}
.tpp-stage[data-tone=dark] .tpp-nav,.tpp-stage[data-tone=dark] .tpp-rail{filter:drop-shadow(0 1px 3px rgba(40,5,0,.6))}
.tpp-count{display:none;font-size:11px;letter-spacing:.2em}
.tpp-rail{position:absolute;right:clamp(10px,1.6cqw,22px);top:50%;z-index:40;display:flex;flex-direction:column;gap:12px;transform:translateY(-50%);color:var(--tpp-navc,var(--tpp-cream))}
.tpp-dot{display:block;width:9px;height:9px;border:1px solid currentColor;border-radius:99px;opacity:.6;transition:all .4s}
.tpp-dot[aria-current=true]{background:currentColor;opacity:1;transform:scale(1.25)}

.tpp-tag{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;background:var(--tpp-paper);color:var(--tpp-ink);clip-path:polygon(0 8%,4% 0,30% 6%,58% 0,84% 5%,100% 0,98% 46%,100% 100%,70% 94%,40% 100%,12% 95%,0 100%,2% 52%);transition:transform .35s cubic-bezier(.2,.8,.2,1),background .3s}
.tpp-tag:hover{transform:translateY(-3px) rotate(-1.5deg)}
.tpp-tag[data-ghost]{background:transparent;color:inherit;box-shadow:inset 0 0 0 1px currentColor;clip-path:none;border-radius:2px}
.tpp-tag:disabled{opacity:.6;cursor:not-allowed;transform:none}
.tpp-email{font-family:var(--tpp-hand);font-size:clamp(20px,3cqw,34px);line-height:1.2;color:var(--a-hand);overflow-wrap:anywhere;user-select:all}
.tpp-stats{display:grid;grid-template-columns:auto 1fr;gap:.35em .6em;align-items:baseline;text-align:left;color:var(--a-hand)}
.tpp-stat{display:contents}
.tpp-stat strong{font-size:1.9em;font-weight:700;line-height:1.1;white-space:nowrap;color:var(--tpp-accent)}
.tpp-route-hint{position:absolute;left:0;top:0;width:100px;margin:14px 0 0 -4px;color:var(--tpp-accent);pointer-events:none;text-align:center}
.tpp-route-hint svg{transform:scaleX(-1)}
.tpp-route-hint span{display:block;margin-top:-2px;font-family:var(--tpp-hand);font-size:17px;font-weight:700;line-height:1}
.tpp-trap{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0}

.tpp-paper{background:var(--tpp-paper);color:var(--tpp-ink);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 18px 40px -18px rgba(59,42,32,.55),0 3px 8px rgba(59,42,32,.18)}
.tpp-tape{position:absolute;width:76px;height:22px;background:var(--tpp-tape);opacity:.82;clip-path:polygon(0 10%,6% 0,12% 12%,20% 0,100% 0,96% 30%,100% 55%,95% 80%,100% 100%,0 100%,4% 70%,0 45%);mix-blend-mode:multiply;z-index:3;pointer-events:none}
.tpp-note{position:absolute;padding:14px 18px 16px;font-family:var(--tpp-hand);font-size:clamp(14px,1.35cqw,19px);line-height:1.15;text-align:center;clip-path:polygon(2% 6%,10% 0,22% 5%,40% 1%,60% 6%,78% 0,96% 4%,100% 22%,97% 48%,100% 76%,96% 100%,74% 95%,52% 100%,30% 94%,8% 100%,0 78%,3% 50%,0 24%);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.tpp-note:hover{transform:rotate(-1deg) translateY(-4px) scale(1.03)}
.tpp-hero-note{font-size:clamp(15px,1.5cqw,22px);padding:clamp(14px,1.5cqw,24px) clamp(16px,1.8cqw,28px)}

.tpp-glide{animation:tpp-glide 7s ease-in-out infinite}
@keyframes tpp-glide{0%,100%{transform:translate(0,0) rotate(4deg)}50%{transform:translate(-6px,-12px) rotate(1deg)}}
.tpp-phone .tpp-heart{transform-box:fill-box;transform-origin:50% 50%;animation:tpp-heart 2.7s ease-out infinite}
@keyframes tpp-heart{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translate(-14px,-60px) scale(1.3)}}
.tpp-phone .tpp-like{transform-box:fill-box;transform-origin:50% 50%;animation:tpp-pulse 2.7s ease-in-out infinite}
@keyframes tpp-pulse{0%,100%{transform:scale(1)}12%{transform:scale(1.25)}}
.tpp-phone .tpp-progress-bar{animation:tpp-play 6s linear infinite}
@keyframes tpp-play{from{width:0}to{width:108px}}
.tpp-float{position:absolute;bottom:-24px;font-size:var(--fs);line-height:1;opacity:.75;animation:tpp-up var(--fd) linear infinite;animation-delay:var(--fl);pointer-events:none}
@keyframes tpp-up{from{transform:translate(0,0)}to{transform:translate(var(--fx),calc(-100cqh - 60px))}}
.tpp-hint{display:inline-block;animation:tpp-bob 1.8s ease-in-out infinite}
@keyframes tpp-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}

.tpp-rise{animation:tpp-rise 1.1s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--rd,0s)}
@keyframes tpp-rise{from{opacity:0;transform:translateY(26px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
.tpp-flyin{animation:tpp-flyin 1.8s cubic-bezier(.2,.8,.2,1) both .3s}
@keyframes tpp-flyin{from{opacity:0;transform:translate(160px,-90px) scale(.7) rotate(8deg)}to{opacity:1;transform:none}}

.tpp-card3d{display:grid;perspective:1600px}
.tpp-card3d>*{grid-area:1/1}
.tpp-flip{display:grid;transition:transform .9s cubic-bezier(.3,.7,.2,1);transform-style:preserve-3d}
.tpp-flip>*{grid-area:1/1;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.tpp-flip[data-back]{transform:rotateY(180deg)}
.tpp-back{transform:rotateY(180deg)}
.tpp-postcard{width:min(800px,88cqw,calc((var(--seam) * 100cqh - 150px) * 1.66));aspect-ratio:1.62/1}
.tpp-pc-grid{display:grid;grid-template-columns:1fr 1px 1fr;gap:clamp(12px,2cqw,26px);height:100%;padding:clamp(14px,2.2cqw,26px)}
.tpp-rule{background:repeating-linear-gradient(to bottom,transparent 0,transparent calc(1.5em - 1px),rgba(59,42,32,.22) calc(1.5em - 1px),rgba(59,42,32,.22) 1.5em)}
.tpp-hw{font-family:var(--tpp-hand);font-size:clamp(13px,1.45cqw,19px);line-height:1.5em;color:var(--a-hand)}
.tpp-envelope{transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.tpp-envelope .tpp-letter{transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.tpp-envelope:hover{transform:rotate(-4deg) translateY(-4px)}
.tpp-envelope:hover .tpp-letter{transform:translateY(-26px)}

.tpp-polaroid{position:absolute;inset:0;padding:10px 10px 0;background:#fffdf8;box-shadow:0 22px 40px -18px rgba(0,0,0,.6),0 2px 6px rgba(0,0,0,.25);transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .5s}
.tpp-polaroid[data-f="1"]{animation:tpp-flick1 .75s cubic-bezier(.3,.6,.2,1)}
.tpp-polaroid[data-f="2"]{animation:tpp-flick2 .75s cubic-bezier(.3,.6,.2,1)}
@keyframes tpp-flick1{0%{translate:0 0;z-index:30}45%{translate:-70% -6%;z-index:30}55%{z-index:0}100%{translate:0 0;z-index:0}}
@keyframes tpp-flick2{0%{translate:0 0;z-index:30}45%{translate:-70% -6%;z-index:30}55%{z-index:0}100%{translate:0 0;z-index:0}}
.tpp-polaroid[data-in="1"]{animation:tpp-back1 .75s cubic-bezier(.3,.6,.2,1)}
.tpp-polaroid[data-in="2"]{animation:tpp-back2 .75s cubic-bezier(.3,.6,.2,1)}
@keyframes tpp-back1{0%{translate:0 0;z-index:0}45%{translate:-70% -6%;z-index:0}55%{z-index:30}100%{translate:0 0;z-index:30}}
@keyframes tpp-back2{0%{translate:0 0;z-index:0}45%{translate:-70% -6%;z-index:0}55%{z-index:30}100%{translate:0 0;z-index:30}}
.tpp-ncard{position:relative;background:#faf5ec;color:var(--tpp-ink);border-radius:14px;padding:clamp(14px,1.8cqw,22px);box-shadow:0 20px 40px -20px rgba(59,42,32,.5)}
.tpp-ncard::before{content:"";position:absolute;inset:5px;border:1px solid rgba(59,42,32,.35);border-radius:5px;pointer-events:none}
.tpp-chip{display:inline-block;padding:3px 9px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(59,42,32,.35);border-radius:99px}
.tpp-round{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:99px;border:1px solid currentColor;transition:background .3s,color .3s,transform .3s}
.tpp-round:hover{background:var(--tpp-cream);color:var(--tpp-ink);transform:scale(1.06)}
.tpp-pip{width:22px;height:4px;border-radius:2px;background:currentColor;opacity:.3;transition:opacity .3s,width .3s}
.tpp-pip[aria-current=true]{opacity:1;width:34px}
.tpp-dash{stroke-dasharray:7 9;animation:tpp-march 1.6s linear infinite}
@keyframes tpp-march{to{stroke-dashoffset:-32}}
.tpp-seal-ring{transform-box:view-box;transform-origin:110px 100px;animation:tpp-spin 28s linear infinite}
.tpp-seal-wrap{z-index:5}
.tpp-seal{transition:transform .5s cubic-bezier(.3,1.6,.4,1)}
.tpp-seal:hover{transform:rotate(-8deg) scale(1.05)}

.tpp-pin{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--tpp-ink);transition:transform .3s}
.tpp-pin:hover{transform:translate(-50%,-100%) translateY(-3px)}
.tpp-pin-dot{width:12px;height:12px;border-radius:99px;background:var(--tpp-paper);border:2px solid var(--tpp-ink);transition:background .3s,transform .3s}
.tpp-pin[aria-pressed=true] .tpp-pin-dot{background:var(--tpp-accent);border-color:var(--tpp-accent);transform:scale(1.3)}
.tpp-pin-y{font-family:var(--tpp-serif);font-size:15px;font-weight:600;letter-spacing:.06em;white-space:nowrap}
.tpp-walker{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:99px;border:1.5px dashed var(--tpp-accent);transition:left .9s cubic-bezier(.4,.1,.2,1),top .9s cubic-bezier(.4,.1,.2,1);pointer-events:none;animation:tpp-spin 6s linear infinite}
@keyframes tpp-spin{to{rotate:360deg}}
.tpp-progress{transition:stroke-dashoffset .9s cubic-bezier(.4,.1,.2,1)}
.tpp-stop{position:absolute;width:min(300px,40cqw);transition:left .6s cubic-bezier(.2,.8,.2,1),top .6s cubic-bezier(.2,.8,.2,1)}
.tpp-stop-wide{width:min(480px,50cqw)}
.tpp-stop-row{display:flex;align-items:center;gap:clamp(10px,1.4cqw,18px);margin-top:4px}
.tpp-stop-shot{position:relative;display:block;flex:0 0 min(32%,17cqh);overflow:hidden;border:1.5px solid rgba(59,42,32,.4);border-radius:6px;box-shadow:0 2px 8px rgba(59,42,32,.3);cursor:zoom-in}
.tpp-shot-view{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(30,10,4,.72);cursor:zoom-out}
.tpp-shot-view img{display:block;max-width:none;height:auto;border:8px solid #faf5ec;border-radius:10px;box-shadow:0 0 0 1px rgba(59,42,32,.45),0 30px 60px -20px rgba(0,0,0,.7);transform-origin:0 0;cursor:default}
.tpp-stop-shot img{display:block;width:100%;height:auto}

.tpp-stamp-btn{position:relative;transition:transform .3s;opacity:.55}
.tpp-stamp-btn[aria-pressed=true]{opacity:1;transform:rotate(-4deg) scale(1.08)}
.tpp-stamp-btn:hover{opacity:1}
.tpp-input{width:100%;background:transparent;border:0;border-bottom:1px solid rgba(59,42,32,.3);padding:4px 0;font-family:var(--tpp-hand);font-size:clamp(15px,1.5cqw,20px);color:var(--a-hand);outline:none}
.tpp-input::placeholder{color:rgba(122,74,44,.45)}
.tpp-msg{width:100%;height:100%;resize:none;background:transparent;border:0;outline:none;padding:0;font-family:var(--tpp-hand);font-size:clamp(15px,1.5cqw,20px);line-height:1.5em;color:var(--a-hand)}
.tpp-msg::placeholder{color:rgba(122,74,44,.45)}
.tpp-shake{animation:tpp-shake .45s}
.tpp-shake2{animation:tpp-shake2 .45s}
@keyframes tpp-shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes tpp-shake2{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.tpp-postmark{position:absolute;pointer-events:none;animation:tpp-stampin .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes tpp-stampin{from{opacity:0;transform:scale(1.8) rotate(-30deg)}to{opacity:.85;transform:scale(1) rotate(-12deg)}}
.tpp-luggage{position:relative;display:inline-flex;align-items:center;gap:8px;padding:8px 16px 8px 26px;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;background:var(--tpp-paper);color:var(--tpp-ink);clip-path:polygon(12px 0,100% 0,100% 100%,12px 100%,0 50%);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.tpp-luggage::before{content:"";position:absolute;left:12px;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:99px;background:var(--tpp-accent)}
.tpp-luggage:hover{transform:rotate(-3deg) translateY(-2px)}
.tpp-aurora{animation:tpp-aurora 14s ease-in-out infinite alternate;transform-box:view-box;transform-origin:50% 30%}
@keyframes tpp-aurora{from{transform:translateX(-30px) scaleY(.9);opacity:.55}to{transform:translateX(30px) scaleY(1.1);opacity:.85}}
.tpp-twinkle{animation:tpp-tw 3s ease-in-out infinite alternate}
@keyframes tpp-tw{from{opacity:.25}to{opacity:1}}

.tpp-brands{flex:1;min-height:0;width:100%;max-width:84cqw;display:flex;flex-wrap:wrap;justify-content:center;align-content:center;align-items:center;gap:clamp(8px,1.5cqw,22px)}
.tpp-stick{filter:drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 9px 12px rgba(40,5,0,.42))}
.tpp-sticker{--s:clamp(58px,min(9.6cqw,15.5cqh),150px);display:flex;align-items:center;justify-content:center;width:var(--s);height:var(--s);transition:scale .35s cubic-bezier(.2,1.5,.4,1),rotate .35s cubic-bezier(.2,.8,.2,1)}
.tpp-sticker:hover{scale:1.1;rotate:0deg !important}
.tpp-sticker[data-wide]{width:calc(var(--s) * 1.42);height:calc(var(--s) * .76)}
.tpp-sticker[data-shape=round]{border-radius:999px}
.tpp-logo{position:relative;width:68%;height:62%}
.tpp-sticker[data-wide] .tpp-logo{width:76%;height:58%}
.tpp-logo span{position:absolute;inset:0;background-size:contain;background-position:center;background-repeat:no-repeat}
.tpp-logo span[data-mask]{-webkit-mask-size:contain;mask-size:contain;-webkit-mask-position:center;mask-position:center;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}

.tpp-wide{display:block}
.tpp-wide-i{display:inline}
.tpp-narrow{display:none}
@container tpp (max-width:760px){
.tpp-links{display:none}
.tpp-count{display:block}
.tpp-wide,.tpp-wide-i{display:none}
.tpp-narrow{display:block}
.tpp-postcard{width:min(440px,90cqw);aspect-ratio:auto;height:min(calc(var(--seam) * 100cqh - 120px),620px)}
.tpp-pc-grid{grid-template-columns:1fr;grid-template-rows:auto 1px 1fr;gap:12px}
.tpp-hw{font-size:clamp(13px,3.7cqw,17px)}
.tpp-route-hint{margin-left:-96px}
.tpp-route-hint svg{transform:none}
.tpp-sticker{--s:clamp(54px,min(19cqw,10cqh),96px)}
.tpp-brands{gap:6px;max-width:94cqw}
.tpp-stop,.tpp-stop-wide{width:auto}
.tpp-note{font-size:14px}
.tpp-rail{display:none}
.tpp-hero-copy{top:48% !important}
.tpp-hero-phone{top:max(15%,76px) !important;right:5% !important;width:104px !important}
.tpp-hero-note{top:calc(max(15%,76px) + 14px) !important;left:4% !important;width:min(210px,calc(91% - 118px)) !important;font-size:13px;padding:12px 14px 14px}
.tpp-seal-wrap{top:max(22%,80px) !important;width:84px !important}
}
@container tpp (max-height:560px){
.tpp-hero-h{font-size:clamp(22px,min(4.4cqw,8cqh),60px)}
.tpp-hero-note{display:none}
}
@media (prefers-reduced-motion:reduce){
.tpp-root *,.tpp-root *::before,.tpp-root *::after{animation:none !important;transition:none !important}
.tpp-float{display:none}
}
`

/* ------------------------------------------------------------------ */
/* drawing helpers                                                    */
/* ------------------------------------------------------------------ */

const ridgeD = (pts: Pt[], bottom: number) =>
  "M" + fmt(pts[0][0]) + " " + bottom + " " + pts.map((p) => "L" + fmt(p[0]) + " " + fmt(p[1])).join(" ") + " L" + fmt(pts[pts.length - 1][0]) + " " + bottom + " Z"

const lineD = (pts: Pt[]) => pts.map((p, i) => (i ? "L" : "M") + fmt(p[0]) + " " + fmt(p[1])).join(" ")

/** A row of fir trees as one path. */
const treesD = (seed: number, x0: number, x1: number, base: number, hMin: number, hMax: number, gap: number) => {
  const r = rng(seed)
  let d = ""
  for (let x = x0; x < x1; x += gap * (0.55 + r() * 0.9)) {
    const h = hMin + r() * (hMax - hMin)
    const w = h * (0.26 + r() * 0.08)
    const tiers = 5 + Math.floor(r() * 3)
    const right: Pt[] = []
    for (let j = 1; j <= tiers; j++) {
      const ty = base - h + (h * 0.9 * j) / tiers
      const tw = w * (0.25 + (0.75 * j) / tiers) * (0.85 + r() * 0.3)
      right.push([x + tw, ty])
      if (j < tiers) right.push([x + tw * 0.38, ty - h * 0.03])
    }
    const pts: Pt[] = [[x, base - h], ...right, [x + w * 0.07, base - h * 0.1], [x + w * 0.07, base + 4], [x - w * 0.07, base + 4], [x - w * 0.07, base - h * 0.1]]
    for (let j = right.length - 1; j >= 0; j--) pts.push([2 * x - right[j][0], right[j][1]])
    d += "M" + pts.map((p) => fmt(p[0]) + " " + fmt(p[1])).join(" L") + " Z "
  }
  return d + "M" + fmt(x0) + " " + fmt(base - 4) + " H" + fmt(x1 + gap) + " V" + fmt(base + 60) + " H" + fmt(x0) + " Z"
}

const sid = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "")

/** Paper grain: a tiny noise tile, painted once in the browser and repeated. */
function Grain({ light = false, opacity = 0.35 }: { uid?: string; light?: boolean; opacity?: number }) {
  return <div className="tpp-grain" data-light={light ? "" : undefined} aria-hidden="true" style={{ opacity }} />
}

/* ---------- palette helpers ---------- */

// Cores das ilustrações e fundos. Os nomes vêm da versão pastel; os valores
// padrão são a paleta terrosa. Cada perfil troca o que quiser em `palette.art`.
const DEFAULT_ART = {
  lav: "#ece1d0",
  lilac: "#d8c3a3",
  violet: "#8a5a36",
  peach: "#f2e9dc",
  blush: "#eadcc6",
  pink: "#b5582c",
  mint: "#c9cfae",
  mintD: "#7d8a52",
  butter: "#f0d9a8",
  sky: "#e6d5bb",
  cream: "#faf5ec",
  plum: "#3b2a20",
  hand: "#7a4a2c",
  glow: "#c98a4b",
  heroBg: "linear-gradient(180deg, #e8dac4 0%, #f1e3cc 55%, #f2e9dc 100%)",
  fogBg: "linear-gradient(180deg, color-mix(in oklab, var(--tpp-fog) 70%, #fff) 0%, var(--tpp-fog) 75%)",
  paperBg: "var(--tpp-paper)",
  nightBg: "radial-gradient(120% 80% at 50% 0%, var(--a-nightGlow) 0%, var(--tpp-navy) 50%, var(--tpp-deep) 100%)",
  nightBandBg: "var(--a-nightBg)",
  contactBg: "linear-gradient(180deg, var(--tpp-deep) 0%, var(--tpp-navy) 60%, var(--a-nightGlow) 100%)",
  wave1: "#e6cfae",
  wave2: "#d9b48c",
  wave3: "#c98a4b",
  wave4: "#a8582e",
  nightGlow: "#6e4630",
  nightWave: "#a8582e",
  nightBand: "#7a4428",
  nightFloor: "#5a3422",
  sun: "#f0d9a8",
  brandsBg: "linear-gradient(135deg, #4a3123, #a8582e)",
  sticker1: "#3b2a20",
  sticker2: "#a8582e",
  sticker3: "#7a4428",
  sticker4: "#8a5a36",
  /** As duas sombras coloridas da nota do TikTok. */
  tiktok1: "#8f9a64",
  tiktok2: "#c98a4b",
}

export type PortfolioArt = typeof DEFAULT_ART

const P = Object.fromEntries(Object.keys(DEFAULT_ART).map((k) => [k, "var(--a-" + k + ")"])) as Record<keyof PortfolioArt, string>

/** A soft wave from edge to edge, filled down to the bottom. */
const waveD = (seed: number, base: number, amp: number, waves = 2, w = 1600, h = 1000) => {
  const r = rng(seed)
  const ph = r() * 6.28
  const pts: Pt[] = []
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    pts.push([-100 + t * (w + 200), base + Math.sin(t * Math.PI * waves + ph) * amp + (r() - 0.5) * amp * 0.25])
  }
  return curveThrough(pts) + " L" + (w + 100) + " " + h + " L-100 " + h + " Z"
}

/** A closed, slightly wobbly blob. */
const blobD = (seed: number, cx: number, cy: number, rad: number, wob = 0.16) => {
  const r = rng(seed)
  const n = 9
  const p: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const k = rad * (1 - wob + r() * wob * 2)
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as Pt
  })
  let d = "M" + fmt(p[0][0]) + " " + fmt(p[0][1])
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n]
    const b = p[i]
    const c = p[(i + 1) % n]
    const e = p[(i + 2) % n]
    d += " C" + fmt(b[0] + (c[0] - a[0]) / 6) + " " + fmt(b[1] + (c[1] - a[1]) / 6) + " " + fmt(c[0] - (e[0] - b[0]) / 6) + " " + fmt(c[1] - (e[1] - b[1]) / 6) + " " + fmt(c[0]) + " " + fmt(c[1])
  }
  return d + " Z"
}

/** Four-point sparkle centred on x, y. */
const sparkD = (x: number, y: number, s: number) =>
  "M" + fmt(x) + " " + fmt(y - s) + " Q" + fmt(x) + " " + fmt(y) + " " + fmt(x + s) + " " + fmt(y) + " Q" + fmt(x) + " " + fmt(y) + " " + fmt(x) + " " + fmt(y + s) + " Q" + fmt(x) + " " + fmt(y) + " " + fmt(x - s) + " " + fmt(y) + " Q" + fmt(x) + " " + fmt(y) + " " + fmt(x) + " " + fmt(y - s) + " Z"

/** Heart centred on x, y. */
const heartD = (x: number, y: number, s: number) =>
  "M" + fmt(x) + " " + fmt(y + s * 0.9) + " C" + fmt(x - s * 1.4) + " " + fmt(y) + " " + fmt(x - s * 0.9) + " " + fmt(y - s) + " " + fmt(x) + " " + fmt(y - s * 0.35) + " C" + fmt(x + s * 0.9) + " " + fmt(y - s) + " " + fmt(x + s * 1.4) + " " + fmt(y) + " " + fmt(x) + " " + fmt(y + s * 0.9) + " Z"

export type FloaterIcon = "dumbbell" | "book" | "smile" | "shoe" | "plane" | "house" | "camera" | "phone" | "clapper" | "cross"

const FLOATER_PATHS: Record<FloaterIcon, React.ReactNode> = {
  dumbbell: <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.500 9v6M6.500 12h11" transform="rotate(-24 12 12)" />,
  book: <path d="M12 6.500C10 5 7 4.500 3.500 4.500v14c3.500 0 6.500.5 8.500 2 2-1.500 5-2 8.500-2v-14C17 4.500 14 5 12 6.500zM12 6.500v14" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14c1 2 2.500 3 4 3s3-1 4-3M9 9.500v.01M15 9.500v.01" />
    </>
  ),
  shoe: <path d="M3 8.500c1.500 1.500 3.500 2 5.500 1.500L10 8c1.500 2.500 4 4.500 7.500 5.300 2 .5 3.500 1.700 3.500 3.700v.5H3zM3 14.500h7M12.500 11.500l-1.500 1.500M15 13l-1.500 1.500" />,
  plane: <path d="M21 3 3 10.500l6.500 2.500L12 20zM9.500 13 21 3" />,
  house: <path d="M3.500 11.500 12 4l8.500 7.500M6 9.500V20h12V9.500M10 20v-5.500h4V20" />,
  camera: (
    <>
      <path d="M3.500 8.500h3.500L8.500 6h7l1.500 2.500h3.500V19h-17z" />
      <circle cx="12" cy="13.200" r="3.300" />
    </>
  ),
  phone: <path d="M8 2.500h8a1.500 1.500 0 0 1 1.500 1.500v16a1.500 1.500 0 0 1-1.500 1.500H8A1.500 1.500 0 0 1 6.500 20V4A1.500 1.500 0 0 1 8 2.500zM10.500 5.500h3M11 18.500h2" />,
  clapper: <path d="M3.500 10h17v10h-17zM3.500 10l-.700-3.800 16.400-3 .700 3.800M7.500 5.500l2 3.700M12 4.700l2 3.700M16.300 3.900l2 3.700" />,
  cross: <path d="M12 3v18M6.500 8.500h11" />,
}

/** Which icons float over the page; empty keeps the hearts and sparkles. */
const NO_FLOATERS: FloaterIcon[] = []
const FloatersContext = React.createContext<FloaterIcon[]>(NO_FLOATERS)

/** Things drifting up the page (the old snow). */
function Snow({ seed, count = 22, tone = "dark" }: { seed: number; count?: number; tone?: "dark" | "light" }) {
  const icons = React.useContext(FloatersContext)
  const bits = React.useMemo(() => {
    const r = rng(seed)
    const cols = tone === "light" ? [P.pink, P.violet, P.mintD] : [P.pink, P.violet, "#ffffff", P.glow]
    return Array.from({ length: count }, () => ({
      left: r() * 100,
      fs: icons.length ? 18 + r() * 14 : 9 + r() * 12,
      fd: 12 + r() * 14,
      fl: -r() * 26,
      fx: (r() - 0.5) * 80,
      c: cols[Math.floor(r() * cols.length)],
      g: r() < 0.55 ? "♥" : "✦",
      icon: icons.length ? icons[Math.floor(r() * icons.length)] : null,
      spin: (r() - 0.5) * 40,
    }))
  }, [seed, count, tone, icons])
  return (
    <div className="tpp-fill" aria-hidden="true" style={{ pointerEvents: "none", overflow: "clip" }}>
      {bits.map((f, i) => (
        <span
          key={i}
          className="tpp-float"
          style={{ left: f.left + "%", color: f.c, "--fs": f.fs + "px", "--fd": f.fd + "s", "--fl": f.fl + "s", "--fx": f.fx + "px" } as React.CSSProperties}
        >
          {f.icon ? (
            <svg className="tpp-svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ rotate: fmt(f.spin) + "deg" }}>
              {FLOATER_PATHS[f.icon]}
            </svg>
          ) : (
            f.g
          )}
        </span>
      ))}
    </div>
  )
}

/* ---------- the pastel cover ---------- */

const HERO_LAYERS = [
  { seed: 11, base: 520, amp: 46, waves: 2.2, fill: P.wave1, dp: 4 },
  { seed: 23, base: 640, amp: 54, waves: 1.6, fill: P.wave2, dp: 8 },
  { seed: 37, base: 760, amp: 42, waves: 2.6, fill: P.wave3, dp: 13 },
  { seed: 41, base: 880, amp: 34, waves: 1.8, fill: P.wave4, dp: 19 },
]

function HeroBackdrop({ uid }: { uid: string }) {
  const hasFloaters = React.useContext(FloatersContext).length > 0
  const art = React.useMemo(() => {
    const r = rng(5)
    return {
      layers: HERO_LAYERS.map((L) => ({ ...L, d: waveD(L.seed, L.base, L.amp, L.waves) })),
      blobs: [blobD(3, 240, 220, 190), blobD(7, 1380, 160, 160), blobD(9, 820, 90, 120)],
      sparks: Array.from({ length: 18 }, () => sparkD(r() * 1600, 60 + r() * 460, 5 + r() * 12)).join(" "),
    }
  }, [])
  return (
    <div className="tpp-fill" aria-hidden="true">
      <div className="tpp-fill" style={{ background: "var(--a-heroBg)" }} />
      <div className="tpp-par tpp-fill" data-dp={2}>
        <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
          <path d={art.blobs[0]} fill={P.sky} opacity=".7" />
          <path d={art.blobs[1]} fill={P.butter} opacity=".8" />
          <path d={art.blobs[2]} fill={P.mint} opacity=".6" />
        </svg>
      </div>
      <div className="tpp-par tpp-fill" data-dp={6}>
        <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
          {!hasFloaters && <path d={art.sparks} fill="#ffffff" opacity=".85" />}
        </svg>
      </div>
      {art.layers.map((L, i) => (
        <div key={i} className="tpp-par tpp-fill" data-dp={L.dp}>
          <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" style={{ overflow: "visible" }}>
            <path d={L.d} fill={L.fill} />
            <path d={L.d} fill="none" stroke="#ffffff" strokeOpacity=".7" strokeWidth="2" />
          </svg>
        </div>
      ))}
    </div>
  )
}

/* ---------- peach paper ---------- */

function FogPaper({ uid, peak = true, forest = false, seed = 5 }: { uid: string; peak?: boolean; forest?: boolean; seed?: number }) {
  const hasFloaters = React.useContext(FloatersContext).length > 0
  const art = React.useMemo(() => {
    const r = rng(seed * 7)
    return {
      w1: waveD(seed * 13, 640, 40, 1.8),
      w2: waveD(seed * 17, 780, 36, 2.4),
      big: [blobD(seed * 3, 1260, 300, 230), blobD(seed * 5, 1420, 520, 150), blobD(seed * 9, 1100, 560, 110)],
      dots: Array.from({ length: 60 }, () => [r() * 1600, r() * 1000, 2 + r() * 4, Math.floor(r() * 4)] as [number, number, number, number]),
    }
  }, [seed])
  const dotCols = [P.pink, P.violet, P.mintD, P.glow]
  return (
    <div className="tpp-fill" aria-hidden="true" style={{ background: "var(--a-fogBg)" }}>
      <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        {peak && (
          <g>
            <path d={art.big[0]} fill={P.lav} />
            <path d={art.big[1]} fill={P.mint} opacity=".9" />
            <path d={art.big[2]} fill={P.butter} />
            {!hasFloaters && <path d={sparkD(1180, 170, 22) + " " + sparkD(1460, 380, 14) + " " + sparkD(1010, 420, 10)} fill="#ffffff" />}
          </g>
        )}
        <path d={art.w1} fill="#ffffff" opacity=".35" />
        <path d={art.w2} fill="#eadcc6" opacity=".45" />
        {forest &&
          !hasFloaters &&
          art.dots.map(([x, y, s, c], i) => <circle key={i} cx={x} cy={y} r={s} fill={dotCols[c]} opacity=".45" />)}
      </svg>
      <Grain uid={uid} opacity={0.25} />
    </div>
  )
}

/* ---------- lavender paper ---------- */

function NightPaper({ uid, seed = 3, trees = true, flakes = true }: { uid: string; seed?: number; trees?: boolean; flakes?: boolean }) {
  const art = React.useMemo(
    () => ({ w1: waveD(seed * 31, 820, 40, 2), w2: waveD(seed * 37, 900, 30, 2.8), b1: blobD(seed * 3, 140, 160, 130), b2: blobD(seed * 5, 1480, 260, 110) }),
    [seed],
  )
  return (
    <div className="tpp-fill" aria-hidden="true" style={{ background: trees ? "var(--a-nightBg)" : "var(--a-nightBandBg)" }}>
      <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <path d={art.b1} fill={P.glow} opacity=".18" />
        <path d={art.b2} fill={P.nightWave} opacity=".3" />
        {trees && (
          <g>
            <path d={art.w1} fill={P.nightBand} opacity=".7" />
            <path d={art.w2} fill={P.nightWave} opacity=".8" />
          </g>
        )}
      </svg>
      <Grain uid={uid} light opacity={0.18} />
      {flakes && <Snow seed={seed * 101} />}
    </div>
  )
}

/* ---------- brand sticker shapes ---------- */

const polygon = (pts: Pt[]) => "polygon(" + pts.map((p) => fmt(p[0]) + "% " + fmt(p[1]) + "%").join(",") + ")"

/** Round seal with a scalloped edge. */
const SEAL_CLIP = polygon(
  Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2
    const r = i % 2 ? 46 : 50
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r] as Pt
  }),
)

/** Postage stamp with a zigzag edge; `nx` teeth across, `ny` down. */
const stampClip = (nx: number, ny: number) => {
  const dx = 3
  const dy = (3 * nx) / ny
  const pts: Pt[] = []
  for (let i = 0; i < nx * 2; i++) pts.push([(i / (nx * 2)) * 100, i % 2 ? dy : 0])
  for (let i = 0; i < ny * 2; i++) pts.push([i % 2 ? 100 - dx : 100, (i / (ny * 2)) * 100])
  for (let i = 0; i < nx * 2; i++) pts.push([100 - (i / (nx * 2)) * 100, i % 2 ? 100 - dy : 100])
  for (let i = 0; i < ny * 2; i++) pts.push([i % 2 ? dx : 0, 100 - (i / (ny * 2)) * 100])
  return polygon(pts)
}
const STAMP_CLIP = stampClip(10, 10)
const STAMP_CLIP_WIDE = stampClip(14, 8)

/** A strip of torn paper. */
const TORN_CLIP = "polygon(1% 12%,8% 2%,20% 9%,36% 1%,52% 8%,70% 0%,86% 7%,99% 3%,97% 30%,100% 56%,97% 80%,99% 98%,84% 92%,66% 100%,46% 93%,28% 99%,12% 92%,1% 99%,3% 70%,0% 42%)"

/* ---------- brand marks ---------- */

/** TikTok-style note: the plum note with cyan and pink echoes. */
function TikTokMark({ size = 24 }: { size?: number | string }) {
  const d = "M13 3 V16 A4.2 4.2 0 1 1 8.8 11.8 M13 3 C13.4 5.8 15.4 7.6 18.4 7.8"
  return (
    <svg className="tpp-svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} transform="translate(-.9 -.7)" fill="none" stroke={P.tiktok1} strokeWidth="2.8" strokeLinecap="round" />
      <path d={d} transform="translate(.9 .7)" fill="none" stroke={P.tiktok2} strokeWidth="2.8" strokeLinecap="round" />
      <path d={d} fill="none" stroke={P.plum} strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  )
}

/** Instagram-style camera glyph on a pastel gradient tile. */
function InstaMark({ size = 24 }: { size?: number | string }) {
  const id = sid(React.useId()) + "-ig"
  return (
    <svg className="tpp-svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#f0c27a" />
          <stop offset=".5" stopColor="#c98a4b" />
          <stop offset="1" stopColor="var(--a-violet)" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6.5" fill={"url(#" + id + ")"} />
      <rect x="5" y="5" width="14" height="14" rx="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.3" cy="7.7" r="1.1" fill="#fff" />
    </svg>
  )
}

/* ---------- the phone on the cover (was the eagle) ---------- */

/** Phone showing a real screenshot (top) over a grid of video thumbnails. */
function PhoneScreen({ uid, screen, grid = [], labels = [] }: { uid: string; screen: string; grid?: string[]; labels?: string[] }) {
  const id = uid + "-phs"
  const tiles = grid.slice(0, 2)
  return (
    <svg className="tpp-svg tpp-phone" viewBox="0 0 120 200" width="100%" height="100%" aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={id + "-c"}>
          <rect x="6" y="6" width="108" height="188" rx="14" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="120" height="200" rx="20" fill="#3b2a20" />
      <g clipPath={"url(#" + id + "-c)"}>
        <rect x="6" y="6" width="108" height="188" fill="#ffffff" />
        <image href={screen} x="6" y="16" width="108" height="96" preserveAspectRatio="xMidYMin meet" />
        {tiles.map((src, i) => (
          <g key={i}>
            <image href={src} x={6 + i * 54.5} y="114" width="53.5" height="80" preserveAspectRatio="xMidYMid slice" />
            {labels[i] && (
              <>
                <path d={"M" + (10 + i * 54.5) + " 186 l0 -5 l4 2.5 Z"} fill="#ffffff" />
                <text x={16 + i * 54.5} y="186" fontSize="5" fontWeight="700" fill="#ffffff" fontFamily="system-ui,sans-serif" style={{ textShadow: "0 1px 2px rgba(0,0,0,.5)" }}>
                  {labels[i]}
                </text>
              </>
            )}
          </g>
        ))}
      </g>
      <rect x="44" y="9" width="32" height="5" rx="2.5" fill="#3b2a20" />
    </svg>
  )
}

function Phone({ uid }: { uid: string }) {
  const id = uid + "-ph"
  return (
    <svg className="tpp-svg tpp-phone" viewBox="0 0 120 200" width="100%" height="100%" aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id + "-s"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eadcc6" />
          <stop offset=".55" stopColor="#ece1d0" />
          <stop offset="1" stopColor="#e6d5bb" />
        </linearGradient>
        <clipPath id={id + "-c"}>
          <rect x="6" y="6" width="108" height="188" rx="14" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="120" height="200" rx="20" fill="#3b2a20" />
      <rect x="6" y="6" width="108" height="188" rx="14" fill={"url(#" + id + "-s)"} />
      <g clipPath={"url(#" + id + "-c)"}>
        <circle cx="30" cy="40" r="28" fill="#f0d9a8" opacity=".8" />
        {/* the creator, holding a product up to the camera */}
        <ellipse cx="58" cy="92" rx="22" ry="27" fill="#6b4a3a" />
        <path d="M24 200 C24 150 38 128 58 128 C78 128 92 150 92 200 Z" fill="#c86a3a" />
        <path d="M48 128 Q58 140 68 128" fill="none" stroke="#a8582e" strokeWidth="2" />
        <circle cx="58" cy="94" r="17" fill="#f2c9b0" />
        <path d="M40 92 C40 72 76 70 76 92 C70 82 50 80 40 92 Z" fill="#6b4a3a" />
        <circle cx="52" cy="96" r="1.6" fill={P.plum} />
        <circle cx="64" cy="96" r="1.6" fill={P.plum} />
        <path d="M53 103 Q58 107 63 103" fill="none" stroke="#a0644a" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M84 200 C84 170 82 150 76 136" fill="none" stroke="#c86a3a" strokeWidth="11" strokeLinecap="round" />
        <rect x="68" y="108" width="16" height="30" rx="4" fill={P.mint} stroke="#ffffff" strokeWidth="1.5" />
        <rect x="71" y="102" width="10" height="8" rx="2" fill={P.violet} />
        <circle cx="76" cy="138" r="5" fill="#f2c9b0" />
        {/* app chrome */}
        <text x="60" y="22" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#ffffff" fontFamily="system-ui,sans-serif">
          Following | For You
        </text>
        <circle cx="101" cy="98" r="7" fill="#ffffff" />
        <circle cx="101" cy="98" r="5.5" fill="#c86a3a" />
        <path className="tpp-like" d={heartD(101, 118, 5.5)} fill="#b5582c" />
        <text x="101" y="131" textAnchor="middle" fontSize="5" fontWeight="700" fill="#ffffff" fontFamily="system-ui,sans-serif">
          48K
        </text>
        <path d="M95 140 h12 a3 3 0 0 1 3 3 v5 a3 3 0 0 1 -3 3 h-7 l-4 3 v-3 h-1 a3 3 0 0 1 -3 -3 v-5 a3 3 0 0 1 3 -3 Z" fill="#ffffff" />
        <text x="101" y="161" textAnchor="middle" fontSize="5" fontWeight="700" fill="#ffffff" fontFamily="system-ui,sans-serif">
          138
        </text>
        <path d="M96 170 l10 -5 l-2 4 l4 4 l-10 1 l2 -3 Z" fill="#ffffff" />
        <rect x="14" y="170" width="52" height="4" rx="2" fill="#ffffff" opacity=".9" />
        <rect x="14" y="178" width="36" height="4" rx="2" fill="#ffffff" opacity=".7" />
        <rect x="6" y="189" width="108" height="2" fill="#ffffff" opacity=".35" />
        <rect className="tpp-progress-bar" x="6" y="189" width="64" height="2" fill="#ffffff" />
        {[0, 1, 2].map((k) => (
          <path key={k} className="tpp-heart" d={heartD(101, 118, 3.4)} fill={k === 1 ? "#ffffff" : "#c98a4b"} style={{ animationDelay: -k * 0.9 + "s" }} />
        ))}
      </g>
      <rect x="44" y="9" width="32" height="5" rx="2.5" fill="#3b2a20" />
    </svg>
  )
}

/* ---------- the Instagram seal (was the squirrel) ---------- */

function InstaSeal({ uid, text, icon = "instagram" }: { uid: string; text: string; icon?: "instagram" | "tiktok" }) {
  const id = uid + "-seal"
  const scallop = React.useMemo(() => {
    const n = 28
    const pts: Pt[] = []
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2
      const r = i % 2 ? 84 : 92
      pts.push([110 + Math.cos(a) * r, 100 + Math.sin(a) * r])
    }
    return lineD(pts) + " Z"
  }, [])
  return (
    <svg className="tpp-svg tpp-seal" viewBox="0 0 220 200" width="100%" height="100%" aria-hidden="true" style={{ overflow: "visible", filter: "drop-shadow(0 10px 18px rgba(59,42,32,.25))" }}>
      <defs>
        <path id={id + "-ring"} d="M110 100 m-62 0 a62 62 0 1 1 124 0 a62 62 0 1 1 -124 0" />
      </defs>
      <path d={scallop} fill={P.cream} stroke={P.pink} strokeWidth="2" />
      <circle cx="110" cy="100" r="76" fill="none" stroke={P.pink} strokeWidth="1" strokeDasharray="2 4" />
      <g className="tpp-seal-ring">
        <text fontSize="11.5" fontWeight="700" letterSpacing="3.2" fill={P.violet} fontFamily="system-ui,sans-serif">
          <textPath href={"#" + id + "-ring"}>{text}</textPath>
        </text>
      </g>
      <g transform="translate(84 74)">
        {icon === "tiktok" ? <TikTokMark size={52} /> : <InstaMark size={52} />}
      </g>
    </svg>
  )
}

/* ---------- sparkle clusters (were pine branches) ---------- */

function Sparkles({ seed = 9 }: { seed?: number }) {
  const hasFloaters = React.useContext(FloatersContext).length > 0
  const art = React.useMemo(() => {
    const r = rng(seed)
    const cols = ["#ffffff", P.pink, P.violet, "#c98a4b", P.mintD]
    return Array.from({ length: 14 }, (_, i) => ({
      d: i % 4 === 3 ? heartD(r() * 300, 20 + r() * 190, 6 + r() * 8) : sparkD(r() * 300, 20 + r() * 190, 6 + r() * 16),
      c: cols[Math.floor(r() * cols.length)],
      o: 0.6 + r() * 0.4,
    }))
  }, [seed])
  if (hasFloaters) return null
  return (
    <svg className="tpp-svg" viewBox="-20 0 340 230" width="100%" height="100%" aria-hidden="true" style={{ overflow: "visible" }}>
      {art.map((s, i) => (
        <path key={i} className={i % 3 ? undefined : "tpp-twinkle"} d={s.d} fill={s.c} opacity={s.o} style={{ animationDelay: -i * 0.4 + "s" }} />
      ))}
    </svg>
  )
}

/* ---------- product photos (generated) ---------- */

function Scene({ kind = "dawn", seed = 1 }: { kind?: SceneKind; seed?: number }) {
  const art = React.useMemo(() => {
    const r = rng(seed * 3)
    return Array.from({ length: 6 }, () => sparkD(20 + r() * 360, 20 + r() * 120, 4 + r() * 8)).join(" ")
  }, [seed])
  const shadow = <ellipse cx="200" cy="248" rx="96" ry="11" fill={P.plum} opacity=".1" />
  let bg = P.blush
  let disc = P.peach
  let body: React.ReactNode = null
  if (kind === "dawn") {
    // skincare: a serum dropper and a cream jar
    bg = P.blush
    disc = P.peach
    body = (
      <>
        {shadow}
        <ellipse cx="190" cy="78" rx="14" ry="17" fill={P.lilac} />
        <rect x="174" y="90" width="32" height="28" rx="6" fill={P.violet} />
        <rect x="160" y="116" width="60" height="128" rx="12" fill="#f8f1e6" />
        <rect x="166" y="170" width="48" height="68" rx="8" fill="#d9a36b" opacity=".75" />
        <rect x="168" y="138" width="44" height="26" rx="3" fill={P.cream} />
        <text x="190" y="155" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="1.5" fill={P.violet} fontFamily="system-ui,sans-serif">
          SERUM
        </text>
        <rect x="236" y="196" width="72" height="50" rx="10" fill={P.mint} />
        <rect x="232" y="184" width="80" height="18" rx="6" fill={P.mintD} />
      </>
    )
  } else if (kind === "sun") {
    // beauty: a lipstick and a powder compact
    bg = P.butter
    disc = "#efe0c8"
    body = (
      <>
        {shadow}
        <path d="M158 112 L158 80 L182 66 L182 112 Z" fill="#a8442a" />
        <rect x="154" y="110" width="32" height="44" rx="3" fill="#d4a056" />
        <rect x="150" y="152" width="40" height="92" rx="5" fill={P.lilac} />
        <circle cx="262" cy="196" r="50" fill={P.blush} />
        <circle cx="262" cy="196" r="38" fill="#d9b48c" />
        <circle cx="250" cy="184" r="10" fill="#ffffff" opacity=".45" />
      </>
    )
  } else if (kind === "river") {
    // haircare: a pump bottle and a comb
    bg = P.sky
    disc = "#efe5d6"
    body = (
      <>
        {shadow}
        <rect x="184" y="72" width="22" height="34" rx="4" fill={P.violet} />
        <path d="M195 74 L195 62 L226 62" fill="none" stroke={P.violet} strokeWidth="7" strokeLinecap="round" />
        <path d="M160 128 Q160 104 195 104 Q230 104 230 128 L232 236 Q232 246 222 246 L168 246 Q158 246 158 236 Z" fill={P.blush} />
        <rect x="170" y="150" width="50" height="56" rx="6" fill={P.cream} />
        <path d="M180 170 h30 M180 182 h22" stroke={P.pink} strokeWidth="4" strokeLinecap="round" />
        <rect x="258" y="136" width="18" height="110" rx="5" fill={P.butter} />
        <path d="M276 146 h16 M276 158 h16 M276 170 h16 M276 182 h16 M276 194 h16 M276 206 h16 M276 218 h16 M276 230 h16" stroke="#d4a056" strokeWidth="4" strokeLinecap="round" />
      </>
    )
  } else if (kind === "lake") {
    // wellness: a supplement jar and capsules
    bg = P.mint
    disc = "#ece6d4"
    body = (
      <>
        {shadow}
        <rect x="150" y="128" width="96" height="118" rx="16" fill="#ffffff" />
        <rect x="144" y="106" width="108" height="30" rx="9" fill={P.lilac} />
        <rect x="162" y="160" width="72" height="50" rx="6" fill={P.peach} />
        <path d={heartD(198, 185, 10)} fill={P.pink} />
        {[[270, 226, 20], [292, 236, -30], [110, 230, 60], [126, 214, -10]].map(([x, y, a], i) => (
          <g key={i} transform={"translate(" + x + " " + y + ") rotate(" + a + ")"}>
            <rect x="-13" y="-6" width="26" height="12" rx="6" fill={i % 2 ? P.butter : P.blush} />
            <rect x="0" y="-6" width="13" height="12" rx="6" fill={i % 2 ? "#c98a4b" : P.pink} opacity=".7" />
          </g>
        ))}
      </>
    )
  } else if (kind === "forest") {
    // pet & home: a potted plant and a candle
    bg = P.peach
    disc = "#f5ecdf"
    body = (
      <>
        {shadow}
        {[[-40, 150], [-10, 140], [20, 146], [45, 160], [-60, 170]].map(([a, y], i) => (
          <ellipse key={i} cx="170" cy={y} rx="12" ry="40" fill={i % 2 ? P.mintD : "#8f9a64"} transform={"rotate(" + a + " 170 200)"} />
        ))}
        <path d="M138 196 L202 196 L194 246 L146 246 Z" fill="#d9b48c" />
        <rect x="134" y="188" width="72" height="14" rx="5" fill="#b9824f" />
        <rect x="246" y="190" width="56" height="56" rx="8" fill={P.cream} />
        <rect x="246" y="206" width="56" height="16" fill={P.lilac} opacity=".7" />
        <path d="M274 190 L274 178" stroke={P.plum} strokeWidth="2" />
        <path d="M274 160 C282 170 280 178 274 180 C268 178 266 170 274 160 Z" fill="#e8b86b" />
        <g fill={P.plum} opacity=".2">
          <circle cx="92" cy="96" r="7" />
          <circle cx="80" cy="84" r="3.5" />
          <circle cx="90" cy="80" r="3.5" />
          <circle cx="100" cy="82" r="3.5" />
          <circle cx="106" cy="92" r="3.5" />
        </g>
      </>
    )
  } else if (kind === "peak") {
    // behind the scenes: a ring light around a phone
    bg = P.lav
    disc = "#f1e8da"
    body = (
      <>
        {shadow}
        <path d="M200 214 L200 246 M200 246 L170 248 M200 246 L230 248" stroke={P.plum} strokeWidth="5" strokeLinecap="round" />
        <circle cx="200" cy="140" r="72" fill="none" stroke="#ffffff" strokeWidth="18" />
        <circle cx="200" cy="140" r="72" fill="none" stroke={P.butter} strokeWidth="6" opacity=".8" />
        <rect x="180" y="104" width="40" height="72" rx="8" fill="#3b2a20" />
        <rect x="184" y="110" width="32" height="60" rx="5" fill={P.blush} />
        <circle cx="200" cy="138" r="7" fill="#ffffff" />
      </>
    )
  } else {
    // a video frame with a play button
    bg = P.lilac
    disc = P.lav
    body = (
      <>
        {shadow}
        <rect x="120" y="70" width="160" height="170" rx="18" fill="#ffffff" />
        <rect x="132" y="82" width="136" height="120" rx="10" fill={P.blush} />
        <circle cx="200" cy="142" r="24" fill="#ffffff" opacity=".9" />
        <path d="M192 128 L214 142 L192 156 Z" fill={P.pink} />
        <rect x="132" y="214" width="80" height="8" rx="4" fill={P.lav} />
        <path d={heartD(256, 218, 7)} fill={P.pink} />
      </>
    )
  }
  return (
    <svg className="tpp-svg tpp-fill" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill={bg} />
      <circle cx="200" cy="160" r="112" fill={disc} />
      <path d={art} fill="#ffffff" opacity=".8" />
      {body}
    </svg>
  )
}

/**
 * Looping video for a polaroid; plays only while it is the top card.
 * `soundOn` is the visitor's choice (the mute button). Browsers block autoplay
 * with sound until the visitor clicks or taps the page, so when that happens it
 * plays muted, reports `blocked`, and unmutes on the first click or key press.
 */
function PolaroidVideo({
  src,
  poster,
  playing,
  soundOn,
  blocked,
  onBlocked,
  hint,
}: {
  src: string
  poster?: string
  playing: boolean
  soundOn: boolean
  blocked: boolean
  onBlocked: (b: boolean) => void
  hint: string
}) {
  const ref = React.useRef(null as HTMLVideoElement | null)
  React.useEffect(() => {
    const v = ref.current
    if (!v) return
    if (!playing) {
      v.pause()
      return
    }
    const start = () => {
      if (!soundOn) {
        v.muted = true
        onBlocked(false)
        v.play().catch(() => undefined)
        return
      }
      v.muted = false
      v.play().then(
        () => onBlocked(false),
        () => {
          v.muted = true
          onBlocked(true)
          v.play().catch(() => undefined)
        },
      )
    }
    start()
    // Ao voltar de outra aba ou app, o celular pode deixar o vídeo parado ou mudo.
    const onReturn = () => {
      if (document.visibilityState === "visible") start()
    }
    document.addEventListener("visibilitychange", onReturn)
    window.addEventListener("pageshow", onReturn)
    return () => {
      document.removeEventListener("visibilitychange", onReturn)
      window.removeEventListener("pageshow", onReturn)
    }
  }, [playing, soundOn, onBlocked])
  React.useEffect(() => {
    if (!blocked || !playing || !soundOn) return
    const unmute = () => {
      const v = ref.current
      if (!v) return
      v.muted = false
      v.play().then(
        () => onBlocked(false),
        () => {
          // Ainda bloqueado: volta ao mudo para o vídeo não parar.
          v.muted = true
          v.play().catch(() => undefined)
        },
      )
    }
    // Só o clique completo libera o som. No início do toque (pointerdown) o som
    // ligaria antes do clique, e o botão de silenciar o desligaria em seguida.
    const onKey = (e: KeyboardEvent) => {
      // Em botões, a tecla gera um clique logo depois.
      if (!(e.target instanceof Element && e.target.closest("button, a"))) unmute()
    }
    document.addEventListener("click", unmute)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", unmute)
      document.removeEventListener("keydown", onKey)
    }
  }, [blocked, playing, soundOn, onBlocked])
  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        className="tpp-fill"
        style={{ objectFit: "cover", maxWidth: "none" }}
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      {blocked && playing && soundOn && (
        <span className="tpp-label absolute" style={{ left: 8, bottom: 8, padding: "5px 9px", fontSize: 9, background: "rgba(59,42,32,.75)", color: "#f6ecdc", borderRadius: 99, pointerEvents: "none" }}>
          🔇 {hint}
        </span>
      )}
    </>
  )
}

function Photo({ src, kind, seed, alt }: { src?: string; kind?: SceneKind; seed?: number; alt?: string }) {
  return (
    <div className="relative overflow-clip" style={{ position: "absolute", inset: 0 }}>
      {src ? (
        <img src={src} alt={alt || ""} className="tpp-fill" style={{ objectFit: "cover", maxWidth: "none" }} draggable={false} />
      ) : (
        <Scene kind={kind} seed={seed} />
      )}
    </div>
  )
}

function Avatar() {
  return (
    <svg className="tpp-svg tpp-fill" viewBox="0 0 80 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="80" height="100" fill={P.blush} />
      <circle cx="18" cy="22" r="16" fill={P.butter} opacity=".9" />
      <path d={sparkD(64, 20, 6)} fill="#ffffff" />
      <ellipse cx="40" cy="58" rx="17" ry="22" fill="#6b4a3a" />
      <path d="M18 100 C18 80 28 72 40 72 C52 72 62 80 62 100 Z" fill={P.lilac} />
      <path d="M34 72 Q40 80 46 72" fill="none" stroke={P.violet} strokeWidth="1.2" />
      <circle cx="40" cy="54" r="11" fill="#f2c9b0" />
      <path d="M28 54 C28 40 52 40 52 54 C47 47 33 47 28 54 Z" fill="#6b4a3a" />
      <circle cx="36.5" cy="55" r="1" fill="#2a1d14" />
      <circle cx="43.5" cy="55" r="1" fill="#2a1d14" />
      <path d="M37 59.5 Q40 62 43 59.5" stroke="#a0644a" strokeWidth="1.1" fill="none" />
      <circle cx="33" cy="58" r="2" fill="#c86a3a" opacity=".6" />
      <circle cx="47" cy="58" r="2" fill="#c86a3a" opacity=".6" />
    </svg>
  )
}

/** A perforated stamp. */
function Stamp({ children, w = 70, h = 86, color = "#faf5ec", label }: { children: React.ReactNode; w?: number; h?: number; color?: string; label?: string }) {
  const m = sid(React.useId())
  const holes: React.ReactNode[] = []
  const step = 7
  for (let x = step / 2; x < w; x += step) holes.push(<circle key={"t" + x} cx={x} cy={0} r={2.4} />, <circle key={"b" + x} cx={x} cy={h} r={2.4} />)
  for (let y = step / 2; y < h; y += step) holes.push(<circle key={"l" + y} cx={0} cy={y} r={2.4} />, <circle key={"r" + y} cx={w} cy={y} r={2.4} />)
  return (
    <div style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 2px 3px rgba(59,42,32,.25))" }}>
      <svg className="tpp-svg" width={w} height={h} viewBox={"0 0 " + w + " " + h} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        <defs>
          <mask id={m}>
            <rect width={w} height={h} fill="#fff" />
            <g fill="#000">{holes}</g>
          </mask>
        </defs>
        <rect width={w} height={h} fill={color} mask={"url(#" + m + ")"} />
      </svg>
      <div style={{ position: "absolute", inset: 6, overflow: "clip" }}>{children}</div>
      {label && (
        <span className="tpp-serif" style={{ position: "absolute", left: 8, bottom: 7, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#fff", textShadow: "0 1px 2px rgba(59,42,32,.5)" }}>
          {label}
        </span>
      )}
    </div>
  )
}

function Logo({ mark, since, prefix }: { mark: string; since: string; prefix: string }) {
  return (
    <svg className="tpp-svg" width="46" height="54" viewBox="0 0 46 54" aria-hidden="true">
      <rect x="1" y="1" width="44" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="5" y="5" width="36" height="28" rx="4" fill="currentColor" opacity=".12" />
      <path d="M19 12 L30 19 L19 26 Z" fill="currentColor" />
      <text x="23" y="44" textAnchor="middle" fontSize="8" fontWeight="700" letterSpacing="1.5" fill="currentColor" fontFamily="Georgia,serif">
        {mark}
      </text>
      <text x="23" y="50.5" textAnchor="middle" fontSize="4.2" letterSpacing=".8" fill="currentColor" fontFamily="Georgia,serif">
        {prefix + since}
      </text>
    </svg>
  )
}

function Postmark({ text, date }: { text: string; date: string }) {
  const m = sid(React.useId())
  return (
    <svg className="tpp-svg" width="120" height="78" viewBox="0 0 120 78" aria-hidden="true" style={{ color: P.violet }}>
      <defs>
        <path id={m} d="M14 39 a25 25 0 1 1 50 0 a25 25 0 1 1 -50 0" />
      </defs>
      <circle cx="39" cy="39" r="31" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="39" cy="39" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
      <text fontSize="7.5" letterSpacing="2" fill="currentColor" fontFamily="Georgia,serif" fontWeight="700">
        <textPath href={"#" + m}>{text}</textPath>
      </text>
      <text x="39" y="42" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="Georgia,serif" fontWeight="700">
        {date}
      </text>
      {[30, 39, 48].map((y) => (
        <path key={y} d={"M72 " + y + " q8 -5 16 0 t16 0 t16 0"} fill="none" stroke="currentColor" strokeWidth="1.4" />
      ))}
    </svg>
  )
}

/** A little rising bar chart (was the compass). */
function Trend() {
  return (
    <svg className="tpp-svg" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="40" width="10" height="18" rx="3" fill="currentColor" opacity=".25" />
      <rect x="20" y="30" width="10" height="28" rx="3" fill="currentColor" opacity=".4" />
      <rect x="34" y="20" width="10" height="38" rx="3" fill="currentColor" opacity=".6" />
      <rect x="48" y="8" width="10" height="50" rx="3" fill="currentColor" opacity=".85" />
      <path d="M6 32 L22 22 L36 14 L56 2" fill="none" stroke={P.pink} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 2 L56 2 L56 8" fill="none" stroke={P.pink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Dotted grid paper with soft blobs (was the topographic map). */
function DotGrid({ seed = 4 }: { seed?: number }) {
  const art = React.useMemo(() => ({ a: blobD(seed * 3, 260, 260, 200), b: blobD(seed * 7, 1340, 760, 230), c: blobD(seed * 11, 1240, 180, 120) }), [seed])
  const dots: React.ReactNode[] = []
  for (let x = 40; x < 1600; x += 40) for (let y = 40; y < 1000; y += 40) dots.push(<circle key={x + "-" + y} cx={x} cy={y} r="1.6" />)
  return (
    <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d={art.a} fill={P.blush} opacity=".55" />
      <path d={art.b} fill={P.mint} opacity=".55" />
      <path d={art.c} fill={P.butter} opacity=".7" />
      <g fill="var(--tpp-ink)" opacity=".14">
        {dots}
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* the tearing chapter                                                */
/* ------------------------------------------------------------------ */

type ChapterProps = {
  index: number
  seam: number
  seed: number
  label: string
  last?: boolean
  setRef: (i: number, el: HTMLDivElement | null) => void
  uid: string
  upperBg: React.ReactNode
  upper: React.ReactNode
  lowerBg?: React.ReactNode
  lower?: React.ReactNode
}

function Chapter({ index, seam, seed, label, last, setRef, uid, upperBg, upper, lowerBg, lower }: ChapterProps) {
  const clips = React.useMemo(() => {
    const n = 84
    const edge = tornEdge(seed, n, 16)
    const up = fiberDepth(seed + 1, n, 6, 22)
    const lo = fiberDepth(seed + 2, n, 4, 16)
    return {
      upper: upperClip(edge, seam),
      upperFib: upperClip(edge, seam, up),
      upperShade: upperClip(edge, seam, up.map((v) => v + 7)),
      lower: lowerClip(edge, seam),
      lowerFib: lowerClip(edge, seam, lo),
      lowerShade: lowerClip(edge, seam, lo.map((v) => v + 5)),
    }
  }, [seed, seam])
  return (
    <div
      ref={(el) => setRef(index, el)}
      className="tpp-ch"
      data-on={index === 0 ? "" : undefined}
      data-seam={last ? 1 : seam}
      role="region"
      aria-label={label}
      style={{ "--seam": last ? 1 : seam, zIndex: 10 - index } as React.CSSProperties}
    >
      <div className="tpp-in">
        {!last && (
          <div className="tpp-lo">
            <div className="tpp-shade" style={{ clipPath: clips.lowerShade }} />
            <div className="tpp-fib" style={{ clipPath: clips.lowerFib }}>
              <Grain uid={uid} opacity={0.4} />
            </div>
            <div className="tpp-sh" style={{ clipPath: clips.lower }}>
              <div className="tpp-box">
                {lowerBg}
                <div className="tpp-lb">{lower}</div>
              </div>
            </div>
          </div>
        )}
        <div className="tpp-up">
          {!last && <div className="tpp-shade" style={{ clipPath: clips.upperShade }} />}
          {!last && (
            <div className="tpp-fib" style={{ clipPath: clips.upperFib }}>
              <Grain uid={uid} opacity={0.4} />
            </div>
          )}
          <div className="tpp-sh" style={last ? undefined : { clipPath: clips.upper }}>
            <div className="tpp-box">
              {upperBg}
              <div className="tpp-ub">{upper}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Pops in (staggered by `d`) as its chapter grows out of the tear. */
function Pop({ d = 0, r = 0, className = "", style, children }: { d?: number; r?: number; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className={"tpp-pop " + className} data-d={d} data-r={r} style={style}>
      {children}
    </div>
  )
}

/**
 * Writes one chapter's tear straight onto its layers: the top sheet lifts by
 * `s`, the bottom one drops, and with `p` < 1 the chapter is still growing out
 * of the gap with its pieces landing in turn. Transforms only, so a frame never
 * restyles the drawings inside.
 */
function paint(el: HTMLElement, s: number, p: number, H: number) {
  const seam = Number(el.dataset.seam) || 1
  const inn = el.firstElementChild as HTMLElement | null
  if (!inn) return
  const lo = inn.querySelector(":scope > .tpp-lo") as HTMLElement | null
  const up = inn.querySelector(":scope > .tpp-up") as HTMLElement | null
  inn.style.transform = p < 1 ? "translateY(" + fmt((1 - p) * 3) + "%)" : ""
  if (up) up.style.transform = s > 0 ? "translateY(" + fmt(-s * (seam * (H + 80) + 70)) + "px) rotate(" + (-1.4 * s).toFixed(3) + "deg)" : ""
  if (lo) lo.style.transform = s > 0 ? "translateY(" + fmt(s * ((1 - seam) * (H + 80) + 80)) + "px) rotate(" + (1 * s).toFixed(3) + "deg)" : ""
  el.querySelectorAll(".tpp-pop").forEach((node) => {
    const pop = node as HTMLElement
    const q = clamp((p - (Number(pop.dataset.d) || 0)) * 2.6, 0, 1)
    if (q >= 1) {
      pop.style.opacity = ""
      pop.style.transform = ""
    } else {
      pop.style.opacity = q.toFixed(3)
      pop.style.transform = "translateY(" + fmt((1 - q) * 46) + "px) rotate(" + fmt((1 - q) * (Number(pop.dataset.r) || 0)) + "deg) scale(" + (0.94 + 0.06 * q).toFixed(3) + ")"
    }
  })
}

/* ------------------------------------------------------------------ */
/* the template                                                       */
/* ------------------------------------------------------------------ */

export default function CreatorPortfolio({
  name = "Kedhareswer",
  role = "Product designer & front-end developer",
  location = "Hyderabad, India",
  since = "2019",
  headline = ["How to build things", "that feel like home?"],
  intro = "Calm, careful products for people who would rather be outside.",
  note,
  about = DEFAULT_ABOUT,
  projects = DEFAULT_PROJECTS,
  route = DEFAULT_ROUTE,
  email = "hello@example.com",
  links = DEFAULT_LINKS,
  labels: labelsProp,
  workTitle = "Work — field notes",
  routeTitle = "The route so far",
  contactTitle = "Write me a postcard",
  palette,
  scrollPerChapter = 1.4,
  smooth = true,
  snap = true,
  animateIn = true,
  snow = true,
  phoneScreen,
  phoneGrid,
  contactForm = true,
  web3formsKey,
  noteStats,
  sealUrl,
  sealIcon,
  handFont,
  floaters,
  brands = [],
  brandsTitle = "Brands",
  brandsBackground,
  phoneGridLabels,
  workFrame,
  ui,
  height = "100svh",
  className = "",
}: TornPostcardPortfolioProps) {
  const uid = sid(React.useId())
  const pal = {
    navy: "#4a3123",
    deep: "#2b1d16",
    fog: "#f2e9dc",
    paper: "#faf5ec",
    ink: "#3b2a20",
    accent: "#a24e24",
    tape: "#d9c3a0",
    cream: "#f6ecdc",
    ...palette,
  }
  const txt = { ...DEFAULT_UI, ...ui }
  const hasBrands = brands.length > 0
  const N = hasBrands ? 6 : 5
  const routeIdx = hasBrands ? 4 : 3
  const contactIdx = N - 1
  const heroDark = !!palette?.heroDark
  const labels = labelsProp || (hasBrands ? ["Cover", "About", "Work", "Brands", "Route", "Write"] : ["Cover", "About", "Work", "Route", "Write"])
  const first = name.split(" ")[0]
  const ab = { ...DEFAULT_ABOUT, ...about }
  const list = projects.length ? projects : DEFAULT_PROJECTS
  const stops = route.length ? route : DEFAULT_ROUTE
  const mark = initials(name)

  // No celular, a barra do navegador some ao rolar e a tela cresce. O palco
  // acompanha (dvh) para não sobrar faixa embaixo; a pista de rolagem fica fixa
  // (svh) para o capítulo atual não saltar quando a altura muda.
  const stageHeight = height === "100svh" ? "100dvh" : height
  const trackFactor = 1 + (N - 1) * scrollPerChapter + 0.35

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  /** Pixels de rolagem por capítulo. Nunca zero: com a janela sem altura ao carregar, 0/0 travaria a página em NaN. */
  const chapterScroll = React.useCallback(() => {
    const track = trackRef.current ? trackRef.current.offsetHeight : window.innerHeight * trackFactor
    return Math.max(1, track / trackFactor) * scrollPerChapter
  }, [trackFactor, scrollPerChapter])

  // O fundo da página acompanha o palco, para nenhum respiro do navegador aparecer em branco.
  React.useEffect(() => {
    document.documentElement.style.backgroundColor = pal.deep
    document.body.style.backgroundColor = pal.deep
  }, [pal.deep])
  const chRefs = React.useRef([] as (HTMLDivElement | null)[])
  const setRef = React.useCallback((i: number, el: HTMLDivElement | null) => {
    chRefs.current[i] = el
  }, [])

  const [active, setActive] = React.useState(0)
  const [soundOn, setSoundOn] = React.useState(true)
  const [soundBlocked, setSoundBlocked] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  const stack = reduced

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  /* ---- scroll → tear ---- */
  React.useEffect(() => {
    const els = chRefs.current
    if (stack) {
      stageRef.current?.setAttribute("data-tone", "dark")
      els.forEach((el) => {
        if (!el) return
        paint(el, 0, 1, 0)
        el.setAttribute("data-on", "")
        el.inert = false
        el.removeAttribute("aria-hidden")
      })
      return
    }
    let target = 0
    let cur = 0
    let raf = 0
    let last = performance.now()
    let shown = -1
    let toneAt = -1
    let lastY = window.scrollY
    let dir = 1
    let touching = false
    let timer = 0

    // No toque, a rolagem do celular manda: sem suavização extra e sem encaixe por código.
    const touch = window.matchMedia("(pointer: coarse)").matches
    const unit = chapterScroll
    const measure = () => {
      const t = trackRef.current
      if (!t) return
      target = clamp(-t.getBoundingClientRect().top / unit(), 0, N - 1)
    }
    const prev: { s: number; p: number }[] = els.map(() => ({ s: -1, p: -1 }))
    const apply = (s: number) => {
      const f = frame(s, N, HOLD)
      const H = stageRef.current ? stageRef.current.offsetHeight : window.innerHeight
      f.chapters.forEach((c, i) => {
        const el = els[i]
        if (!el) return
        if (c.on) el.setAttribute("data-on", "")
        else el.removeAttribute("data-on")
        if (!c.on && prev[i].s === 0 && prev[i].p === 0) return
        const sv = c.on ? c.s : 0
        const pv = c.on ? c.p : 0
        if (prev[i].s === sv && prev[i].p === pv) return
        prev[i] = { s: sv, p: pv }
        paint(el, sv, pv, H)
      })
      const under = f.split > 0.82 ? f.k + 1 : f.k
      if (under !== toneAt && stageRef.current) {
        toneAt = under
        stageRef.current.setAttribute("data-tone", (under === 0 ? (heroDark ? "dark" : "light") : under === contactIdx || under === 2 || (hasBrands && under === 3) ? "dark" : "light"))
      }
      if (f.active !== shown) {
        shown = f.active
        els.forEach((el, i) => {
          if (!el) return
          el.inert = i !== shown
          if (i !== shown) el.setAttribute("aria-hidden", "true")
          else el.removeAttribute("aria-hidden")
        })
        setActive(shown)
      }
    }
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      cur = smooth && !touch ? cur + (target - cur) * (1 - Math.exp(-dt / 110)) : target
      if (Math.abs(target - cur) < 0.0004) cur = target
      apply(cur)
      raf = cur !== target ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      measure()
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    const settle = () => {
      if (!snap || touching || touch) return
      const t = trackRef.current
      if (!t) return
      const goal = snapTarget(target, N, HOLD, dir)
      if (goal === null) return
      const top = t.getBoundingClientRect().top + window.scrollY + goal * unit()
      window.scrollTo({ top: Math.ceil(top) + 1, behavior: "smooth" })
    }
    const onScroll = () => {
      const y = window.scrollY
      if (y !== lastY) dir = y > lastY ? 1 : -1
      lastY = y
      kick()
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 170)
    }
    const onTouchStart = () => {
      touching = true
    }
    const onTouchEnd = () => {
      touching = false
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 260)
    }

    measure()
    cur = target
    apply(cur)
    addEventListener("scroll", onScroll, { passive: true })
    addEventListener("resize", kick)
    addEventListener("touchstart", onTouchStart, { passive: true })
    addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      removeEventListener("scroll", onScroll)
      removeEventListener("resize", kick)
      removeEventListener("touchstart", onTouchStart)
      removeEventListener("touchend", onTouchEnd)
    }
  }, [stack, smooth, snap, scrollPerChapter, N, heroDark, hasBrands, contactIdx, chapterScroll])

  /* ---- paper grain, painted once ---- */
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const tile = (rgb: number[], max: number, seed: number) => {
      const c = document.createElement("canvas")
      c.width = c.height = 128
      const g = c.getContext("2d")
      if (!g) return "none"
      const img = g.createImageData(128, 128)
      const r = rng(seed)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = r()
        img.data[i] = rgb[0]
        img.data[i + 1] = rgb[1]
        img.data[i + 2] = rgb[2]
        img.data[i + 3] = Math.round(v * v * v * max)
      }
      g.putImageData(img, 0, 0)
      return "url(" + c.toDataURL() + ")"
    }
    root.style.setProperty("--tpp-gd", tile([40, 32, 24], 46, 1))
    root.style.setProperty("--tpp-gl", tile([255, 255, 255], 44, 2))
  }, [])

  /* ---- pointer parallax ---- */
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || stack) return
    let raf = 0
    let mx = 0
    let my = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      mx = (e.clientX / window.innerWidth) * 2 - 1
      my = (e.clientY / window.innerHeight) * 2 - 1
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          root.querySelectorAll(".tpp-ch[data-on] .tpp-par").forEach((node) => {
            const el = node as HTMLElement
            const dp = Number(el.dataset.dp) || 0
            el.style.transform = "translate3d(" + fmt(mx * dp) + "px," + fmt(my * dp * 0.5) + "px,0)"
          })
        })
    }
    root.addEventListener("pointermove", onMove)
    return () => {
      root.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [stack])

  const go = React.useCallback(
    (i: number) => {
      if (stack) {
        const el = chRefs.current[i]
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" })
        return
      }
      const t = trackRef.current
      const st = stageRef.current
      if (!t || !st) return
      const top = t.getBoundingClientRect().top + window.scrollY + i * chapterScroll()
      window.scrollTo({ top: Math.ceil(top) + 1, behavior: "smooth" })
    },
    [stack, chapterScroll],
  )

  /* ---- no toque: um capítulo por vez, com o rasgo inteiro ---- */
  const stepping = React.useRef(false)
  const stepChapter = React.useCallback(
    (dir: 1 | -1) => {
      const t = trackRef.current
      if (!t || stepping.current) return
      const unit = chapterScroll()
      const base = t.getBoundingClientRect().top + window.scrollY
      const k = Math.floor((window.scrollY - base) / unit)
      const next = k + dir
      if (next < 0 || next > N - 1) return
      // A parte parada do capítulo não mostra nada: a animação já começa no rasgo.
      const from = dir > 0 ? k + HOLD : k
      const to = dir > 0 ? next : next + HOLD
      const startedAt = performance.now()
      stepping.current = true
      const run = (now: number) => {
        const p = Math.min(1, (now - startedAt) / STEP_MS)
        window.scrollTo(0, Math.ceil(base + (from + (to - from) * p) * unit) + 1)
        if (p < 1) requestAnimationFrame(run)
        else stepping.current = false
      }
      requestAnimationFrame(run)
    },
    [N, chapterScroll],
  )
  React.useEffect(() => {
    if (stack || !window.matchMedia("(pointer: coarse)").matches) return
    let x = 0
    let y = 0
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      x = e.touches[0].clientX
      y = e.touches[0].clientY
    }
    // A página não rola com o dedo; pinça continua livre para ampliar.
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.cancelable) e.preventDefault()
    }
    const onEnd = (e: TouchEvent) => {
      const c = e.changedTouches[0]
      if (e.touches.length || !c) return
      const dx = c.clientX - x
      const dy = c.clientY - y
      if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) stepChapter(dy < 0 ? 1 : -1)
    }
    document.addEventListener("touchstart", onStart, { passive: true })
    document.addEventListener("touchmove", onMove, { passive: false })
    document.addEventListener("touchend", onEnd, { passive: true })
    return () => {
      document.removeEventListener("touchstart", onStart)
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend", onEnd)
    }
  }, [stack, stepChapter])

  /* ---- chapter state ---- */
  const [flipped, setFlipped] = React.useState(false)
  // Print ampliado: `from` é a posição da miniatura, de onde ele cresce e para onde volta.
  const [shot, setShot] = React.useState(null as { src: string; alt: string; ratio: number; from: DOMRect } | null)
  const shotViewRef = React.useRef(null as HTMLDivElement | null)
  const shotImgRef = React.useRef(null as HTMLImageElement | null)
  const shotClosing = React.useRef(false)
  const animateShot = (closing: boolean) => {
    const view = shotViewRef.current
    const img = shotImgRef.current
    if (!view || !img || !shot || reduced) return null
    img.getAnimations().forEach((a) => a.cancel())
    const to = img.getBoundingClientRect()
    const small = "translate(" + fmt(shot.from.left - to.left) + "px," + fmt(shot.from.top - to.top) + "px) scale(" + (shot.from.width / to.width).toFixed(4) + ")"
    const timing = { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)", direction: closing ? "reverse" : "normal", fill: "both" } as const
    view.animate([{ backgroundColor: "rgba(30,10,4,0)" }, { backgroundColor: "rgba(30,10,4,.72)" }], timing)
    return img.animate([{ transform: small }, { transform: "none" }], timing)
  }
  const closeShot = () => {
    if (shotClosing.current) return
    shotClosing.current = true
    const done = () => {
      shotClosing.current = false
      setShot(null)
    }
    const anim = animateShot(true)
    if (anim) anim.finished.then(done, done)
    else done()
  }
  React.useLayoutEffect(() => {
    if (shot) animateShot(false)
  }, [shot])
  React.useEffect(() => {
    if (!shot) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShot()
    }
    addEventListener("keydown", onKey)
    addEventListener("scroll", closeShot, { passive: true })
    return () => {
      removeEventListener("keydown", onKey)
      removeEventListener("scroll", closeShot)
    }
  }, [shot])
  const [pi, setPi] = React.useState(0)
  const [flick, setFlick] = React.useState({ out: -1, into: -1, n: 0 })
  const [stop, setStop] = React.useState(stops.length - 1)
  const [message, setMessage] = React.useState("")
  const [from, setFrom] = React.useState("")
  const [stampKind, setStampKind] = React.useState(0)
  const [sent, setSent] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const [trap, setTrap] = React.useState("")
  const [sendUntil, setSendUntil] = React.useState(0)
  const [waitLeft, setWaitLeft] = React.useState(0)
  const [shake, setShake] = React.useState(0)
  const [copied, setCopied] = React.useState(false)
  const msgRef = React.useRef(null as HTMLTextAreaElement | null)

  const step = (delta: number) => {
    const n = list.length
    const next = wrap(pi + delta, n)
    setFlick((f) => ({ out: delta > 0 ? pi : -1, into: delta < 0 ? next : -1, n: f.n + 1 }))
    setPi(next)
  }

  const ask = (p: PostcardProject) => {
    setMessage(txt.askMessage.replace("{first}", first).replace("{project}", p.name))
    setSent(false)
    setNotice("")
    go(contactIdx)
  }

  // A espera entre envios sobrevive a recarregar a página, neste navegador.
  const cooldownKey = "tpp-next-send:" + email
  React.useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(cooldownKey))
      if (saved > Date.now()) setSendUntil(saved)
    } catch {
      // sem armazenamento, a espera vale só até recarregar
    }
  }, [cooldownKey])
  React.useEffect(() => {
    if (!sendUntil) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((sendUntil - Date.now()) / 1000))
      setWaitLeft(left)
      if (!left) setSendUntil(0)
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [sendUntil])

  const send = async () => {
    if (sending || waitLeft > 0) return
    // Campo invisível preenchido: é robô. Finge que enviou, sem gastar o limite.
    if (trap) {
      setSent(true)
      setNotice(txt.sentConfirmed)
      return
    }
    if (!message.trim()) {
      setShake((s) => s + 1)
      msgRef.current?.focus({ preventScroll: true })
      return
    }
    const subject = txt.mailSubject.replace("{name}", name)
    const sender = from.trim()
    setSent(false)
    if (!web3formsKey) {
      // Sem serviço de envio: só dá para tentar abrir o app de e-mail, sem confirmação.
      const body = message.trim() + (sender ? "\n\n— " + sender : "")
      setNotice(txt.mailOpening)
      window.location.href = mailtoHref(email, subject, body)
      return
    }
    setSending(true)
    setNotice(txt.sending)
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: web3formsKey, subject, message: message.trim(), ...(sender ? { email: sender, replyto: sender } : {}) }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "send failed")
      setSent(true)
      setNotice(txt.sentConfirmed)
      const until = Date.now() + SEND_COOLDOWN_MS
      setSendUntil(until)
      try {
        window.localStorage.setItem(cooldownKey, String(until))
      } catch {
        // sem armazenamento, a espera vale só até recarregar
      }
    } catch {
      setNotice(txt.sendFailed)
    } finally {
      setSending(false)
    }
  }

  const copy = () => {
    navigator.clipboard?.writeText(email).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      },
      () => undefined,
    )
  }

  /* ---- route map geometry ---- */
  const [narrow, setNarrow] = React.useState(false)
  const [mapAr, setMapAr] = React.useState(1.8)
  const [mapH, setMapH] = React.useState(500)
  const mapRef = React.useRef(null as HTMLDivElement | null)
  React.useEffect(() => {
    const st = stageRef.current
    const mp = mapRef.current
    if (!st) return
    const ro = new ResizeObserver(() => {
      setNarrow(st.offsetWidth <= 760)
      if (mp && mp.offsetHeight) {
        setMapAr(mp.offsetWidth / mp.offsetHeight)
        setMapH(mp.offsetHeight)
      }
    })
    ro.observe(st)
    if (mp) ro.observe(mp)
    return () => ro.disconnect()
  }, [])
  const pts = React.useMemo(() => {
    const n = stops.length
    return stops.map((_, i) => {
      const t = n > 1 ? i / (n - 1) : 0.5
      // Quadro com print é mais alto: no celular, os pontos sobem para não ficarem atrás dele.
      return narrow ? ([i % 2 ? 72 : 26, 8 + t * (stops.some((s) => s.image) ? 48 : 58)] as Pt) : ([8 + t * 84, 62 - Math.sin(t * Math.PI * 2.2 + 0.4) * 26] as Pt)
    })
  }, [stops, narrow])
  const trail = React.useMemo(() => {
    const scaled = pts.map((p) => [p[0] * mapAr, p[1]] as Pt)
    const m = measureCurve(scaled)
    return { d: curveThrough(scaled), fr: m.fr, total: m.total, w: 100 * mapAr }
  }, [pts, mapAr])

  const projectsCount = list.length
  const year = new Date().getFullYear()
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
  const cur = list[pi] || list[0]
  /** With any video, the polaroids switch to TikTok's portrait 9:16 frame. */
  const hasVideo = list.some((p) => !!p.video)
  const portrait = workFrame ? workFrame === "portrait" : hasVideo
  const audible = soundOn && !soundBlocked
  const stamps = ["tiktok", "instagram", "heart"]

  const rootStyle = {
    "--tpp-navy": pal.navy,
    "--tpp-deep": pal.deep,
    "--tpp-fog": "color-mix(in oklab, " + pal.fog + " 92%, var(--color-background, #fff))",
    "--tpp-paper": "color-mix(in oklab, " + pal.paper + " 94%, var(--color-background, #fff))",
    "--tpp-fiber": "color-mix(in oklab, #f7f4ee 94%, var(--color-background, #fff))",
    "--tpp-ink": pal.ink,
    "--tpp-accent": pal.accent,
    "--tpp-tape": pal.tape,
    "--tpp-cream": pal.cream,
    ...(handFont ? { "--tpp-hand": handFont } : {}),
    "--tpp-hero-text": heroDark ? pal.cream : pal.ink,
    "--tpp-hero-glow": heroDark ? "rgba(60,5,0,.45)" : "rgba(255,255,255,.7)",
    ...Object.fromEntries(Object.entries({ ...DEFAULT_ART, ...palette?.art }).map(([k, v]) => ["--a-" + k, v])),
    "--tpp-h": height,
  } as React.CSSProperties

  const stampArt = (k: number) =>
    k === 0 ? (
      <div className="tpp-fill flex items-center justify-center" style={{ background: "#eadcc6" }}>
        <TikTokMark size="70%" />
      </div>
    ) : k === 1 ? (
      <div className="tpp-fill flex items-center justify-center" style={{ background: "#ece1d0" }}>
        <InstaMark size="64%" />
      </div>
    ) : (
      <div className="tpp-fill flex items-center justify-center" style={{ background: "#f0d9a8" }}>
        <svg className="tpp-svg" width="64%" height="64%" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21 C3 14 3 7 8 5.5 C10.4 4.8 11.6 6.4 12 7.4 C12.4 6.4 13.6 4.8 16 5.5 C21 7 21 14 12 21 Z" fill="#b5582c" />
        </svg>
      </div>
    )

  /* ================= chapters ================= */

  const hero = (
    <Chapter
      index={0}
      seam={0.89}
      seed={101}
      label={labels[0]}
      setRef={setRef}
      uid={uid}
      upperBg={
        <div className="tpp-fill" aria-hidden="true">
          <HeroBackdrop uid={uid} />
          <Grain uid={uid} light opacity={0.18} />
          {snow && <Snow seed={7} count={20} />}
        </div>
      }
      upper={
        <div className="tpp-fill">
          <div className="tpp-hero-copy absolute inset-x-0 flex flex-col items-center px-5 text-center" style={{ top: "34%" }}>
            <Pop d={0}>
              <h1 className="tpp-h tpp-hero-h">
                {headline.map((l, i) => (
                  <span key={i} className={"block " + (animateIn ? "tpp-rise" : "")} style={{ "--rd": 0.15 + i * 0.18 + "s" } as React.CSSProperties}>
                    {l}
                  </span>
                ))}
              </h1>
            </Pop>
            <Pop d={0.15}>
              <p className={"mt-5 max-w-[34ch] text-[13px] leading-relaxed sm:text-[15px] " + (animateIn ? "tpp-rise" : "")} style={{ color: "var(--tpp-hero-text)", "--rd": ".55s" } as React.CSSProperties}>
                {intro}
              </p>
            </Pop>
            <Pop d={0.25} className={"mt-7 flex flex-wrap justify-center gap-3 " + (animateIn ? "tpp-rise" : "")} style={{ "--rd": ".75s" } as React.CSSProperties}>
              <button type="button" className="tpp-tag" onClick={() => go(2)}>
                {txt.seeWork}
              </button>
              <button type="button" className="tpp-tag" data-ghost="" style={{ color: "var(--tpp-hero-text)" }} onClick={() => go(contactIdx)}>
                {txt.writeMe}
              </button>
            </Pop>
          </div>
          <div className="tpp-par tpp-hero-phone absolute" data-dp={-14} style={{ right: "8%", top: "max(13%, 78px)", width: "clamp(112px, 13cqw, 200px)", aspectRatio: "0.6" }}>
            <div className={animateIn ? "tpp-flyin" : ""} style={{ width: "100%", height: "100%" }}>
              <div className="tpp-glide" style={{ width: "100%", height: "100%" }}>
                {phoneScreen ? <PhoneScreen uid={uid} screen={phoneScreen} grid={phoneGrid} labels={phoneGridLabels} /> : <Phone uid={uid} />}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="tpp-note tpp-paper tpp-hero-note"
            onClick={() => go(2)}
            style={{ left: "6%", top: "calc(max(13%, 78px) + 12px)", width: "clamp(240px, 24cqw, 360px)", transform: "rotate(-2deg)" }}
          >
            {noteStats ? (
              <span className="tpp-stats">
                {noteStats.map((s) => (
                  <span key={s.label} className="tpp-stat">
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </span>
                ))}
              </span>
            ) : (
              <span style={{ display: "block", color: "var(--a-hand)" }}>{note || projectsCount + " projects worth a slow look"}</span>
            )}
            <span className="tpp-label" style={{ display: "block", marginTop: 6, fontFamily: "inherit", fontSize: 9, opacity: 0.6 }}>
              {role}
            </span>
          </button>
        </div>
      }
      lowerBg={<FogPaper uid={uid} seed={2} peak={false} forest />}
      lower={
        <div className="flex h-full items-start justify-between px-[clamp(16px,4cqw,44px)] pt-[clamp(10px,3cqh,30px)]" style={{ color: pal.ink }}>
          <button type="button" className="tpp-label tpp-next-label flex items-center gap-3" onClick={() => go(1)}>
            <span className="tpp-hint" aria-hidden="true">
              ↓
            </span>
            <span>
              {txt.keepScrolling}<span className="tpp-wide-i">{txt.tearsOpen}</span>
            </span>
          </button>
          <span className="tpp-label tpp-wide" style={{ opacity: 0.65 }}>
            {role} · {location}
          </span>
        </div>
      }
    />
  )

  const postcardFront = (
    <div className="tpp-paper relative h-full overflow-clip" style={{ borderRadius: 3 }}>
      <Grain uid={uid} opacity={0.35} />
      <div className="tpp-pc-grid relative">
        <div className="relative min-h-0" style={{ minHeight: narrow ? "24cqh" : undefined }}>
          <div className="absolute overflow-clip" style={{ left: 0, top: 0, right: "6%", bottom: narrow ? "8%" : "22%", border: "5px solid " + pal.navy, boxShadow: "0 6px 14px rgba(0,0,0,.25)" }}>
            <Photo src={ab.photo} kind="dawn" seed={4} alt={name} />
          </div>
          <svg className="tpp-svg tpp-wide absolute" viewBox="0 0 200 40" style={{ right: "6%", bottom: 0, width: "44%" }} aria-hidden="true">
            <path d="M0 24 Q20 8 40 24 T80 24 T120 24 T160 24 T200 24" fill="none" stroke={pal.accent} strokeOpacity=".55" strokeWidth="1.6" />
          </svg>
        </div>
        <div className="relative" style={{ background: "rgba(59,42,32,.25)" }}>
          <span className="tpp-label tpp-wide absolute left-1/2 top-1/2 whitespace-nowrap" style={{ transform: "translate(-50%,-50%) rotate(-90deg)", fontSize: 8, background: "var(--tpp-paper)", padding: "0 6px", color: pal.ink, opacity: 0.8 }}>
            {txt.divider}
          </span>
        </div>
        <div className="relative flex min-h-0 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="tpp-h" style={{ fontSize: "clamp(22px, min(3cqw, 5cqh), 40px)", color: "var(--a-violet)", fontWeight: 400 }}>
                {ab.title}
              </h2>
              <p className="mt-1 text-[12px] leading-snug sm:text-[13px]" style={{ color: pal.ink, maxWidth: "24ch" }}>
                {ab.subtitle}
              </p>
            </div>
            {ab.portrait !== false && (
              <div className="shrink-0" style={{ transform: "rotate(3deg)" }}>
                <Stamp w={narrow ? 52 : 64} h={narrow ? 64 : 78} label={mark}>
                  {ab.portrait ? <img src={ab.portrait} alt="" className="tpp-fill" style={{ objectFit: "cover", maxWidth: "none" }} /> : <Avatar />}
                </Stamp>
              </div>
            )}
          </div>
          <div className="tpp-rule tpp-hw mt-3 min-h-0 flex-1 overflow-clip" style={{ textIndent: "2.5em", textAlign: "justify", hyphens: "auto" }}>
            {ab.text}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="tpp-hand" style={{ color: "var(--a-hand)", fontSize: 18 }}>
              — {name}
            </span>
            <button type="button" className="tpp-label flex items-center gap-2" style={{ fontSize: 10, color: pal.accent }} onClick={() => setFlipped(true)}>
              {txt.turnOver}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const postcardBack = (
    <div className="tpp-paper relative h-full overflow-clip" style={{ borderRadius: 3 }}>
      <Grain uid={uid} opacity={0.35} />
      <div className="relative flex h-full flex-col p-[clamp(16px,2.4cqw,30px)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tpp-label" style={{ color: pal.accent, fontSize: 10 }}>
              {txt.backEyebrow}
            </p>
            <h3 className="tpp-h mt-1" style={{ fontSize: "clamp(22px, min(3cqw, 5cqh), 38px)", fontWeight: 400 }}>
              {name}
            </h3>
            <p className="mt-1 text-[13px]" style={{ opacity: 0.75 }}>
              {role}
            </p>
          </div>
          <div style={{ transform: "rotate(-10deg)", flexShrink: 0 }} className="tpp-wide">
            <Postmark text={"· " + location.toUpperCase() + " · " + since + " "} date={since} />
          </div>
        </div>
        <dl className="mt-4 grid min-h-0 flex-1 content-center gap-x-6 gap-y-3" style={{ gridTemplateColumns: narrow ? "1fr" : "1fr 1fr" }}>
          {(ab.facts || []).map((f) => (
            <div key={f.label}>
              <dt className="tpp-label" style={{ fontSize: 9, opacity: 0.6 }}>
                {f.label}
              </dt>
              <dd className="tpp-hand tpp-rule m-0" style={{ fontSize: "clamp(16px,1.7cqw,22px)", lineHeight: "1.5em", color: "var(--a-hand)" }}>
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          {(ab.skills || []).map((s) => (
            <span key={s} className="tpp-chip">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <a href={"mailto:" + email} className="tpp-label" style={{ fontSize: 10, color: pal.accent }}>
            {email}
          </a>
          <button type="button" className="tpp-label" style={{ fontSize: 10, color: pal.accent }} onClick={() => setFlipped(false)}>
            {txt.front}
          </button>
        </div>
      </div>
    </div>
  )

  const aboutCh = (
    <Chapter
      index={1}
      seam={0.89}
      seed={202}
      label={labels[1]}
      setRef={setRef}
      uid={uid}
      upperBg={
        <>
          <FogPaper uid={uid} seed={2} />
          {snow && floaters?.length ? <Snow seed={41} count={12} tone="light" /> : null}
        </>
      }
      upper={
        <div className="tpp-fill flex items-center justify-center" style={{ paddingTop: 56 }}>
          <Pop d={0.05} r={-4} className="tpp-wide absolute" style={{ right: "7%", top: "15%", width: "clamp(80px,9cqw,130px)" }}>
            <div className="tpp-envelope relative" style={{ aspectRatio: "1.45", transform: "rotate(8deg)" }} aria-hidden="true">
              <div className="tpp-letter absolute" style={{ left: "10%", right: "10%", top: "-10%", height: "80%", background: "#fbfaf6", boxShadow: "0 2px 4px rgba(0,0,0,.15)" }}>
                <div className="tpp-rule absolute" style={{ inset: "18% 12%", fontSize: 6 }} />
              </div>
              <svg className="tpp-svg tpp-fill" viewBox="0 0 145 100" preserveAspectRatio="none">
                <rect y="20" width="145" height="80" fill="#f2e9dc" />
                <path d="M0 20 L72 66 L145 20 L145 100 L0 100 Z" fill="#eadcc6" />
                <path d="M0 100 L60 58 M145 100 L85 58" stroke="#c9a27a" />
                <rect x="104" y="72" width="30" height="22" fill="#d8c3a3" />
              </svg>
            </div>
          </Pop>
          <Pop d={0.12} r={-3}>
            <div className="tpp-card3d tpp-postcard" style={{ transform: "rotate(-1.2deg)" }}>
              <div className="tpp-flip" data-back={flipped ? "" : undefined}>
                <div aria-hidden={flipped} style={{ minHeight: 0 }}>
                  {postcardFront}
                </div>
                <div className="tpp-back" aria-hidden={!flipped} style={{ minHeight: 0 }}>
                  {postcardBack}
                </div>
              </div>
              <span className="tpp-tape" style={{ left: -18, top: 14, transform: "rotate(-38deg)" }} />
            </div>
          </Pop>
        </div>
      }
      lowerBg={<NightPaper uid={uid} seed={5} trees={false} flakes={false} />}
      lower={
        <div className="relative h-full">
          <div className="absolute" style={{ left: "-2%", top: -30, width: "clamp(160px,20cqw,300px)", aspectRatio: "1.5" }}>
            <Sparkles seed={9} />
          </div>
          <span className="tpp-label tpp-next-label absolute" style={{ right: "clamp(16px,4cqw,44px)", top: "clamp(10px,3cqh,26px)", color: "var(--tpp-cream)" }}>
            {txt.next} — {workTitle}
          </span>
        </div>
      }
    />
  )

  const polaroids = list.map((p, j) => {
    const n = list.length
    const depth = wrap(j - pi, n)
    const tr =
      depth === 0
        ? "rotate(-3deg)"
        : depth === 1
          ? "translate(7%, 3%) rotate(5deg) scale(.95)"
          : depth === 2
            ? "translate(-7%, 5%) rotate(-8deg) scale(.9)"
            : "translate(0, 6%) rotate(2deg) scale(.86)"
    const f = flick.out === j ? (flick.n % 2 ? "1" : "2") : undefined
    const g = flick.into === j ? (flick.n % 2 ? "1" : "2") : undefined
    return (
      <div
        key={j}
        className="tpp-polaroid"
        data-f={f}
        data-in={g}
        aria-hidden={depth !== 0}
        style={{ transform: tr, zIndex: 20 - depth, opacity: depth > 2 ? 0 : 1 }}
      >
        <div className="relative w-full overflow-clip" style={{ aspectRatio: portrait ? "9 / 16" : "1", background: "#ccc" }}>
          {p.video ? (
            <PolaroidVideo src={p.video} poster={p.image} playing={depth === 0 && active === 2} soundOn={soundOn} blocked={soundBlocked} onBlocked={setSoundBlocked} hint={txt.tapForSound} />
          ) : (
            <Photo src={p.image} kind={p.scene || (["dawn", "peak", "lake", "sun", "forest", "river", "night"] as SceneKind[])[j % 7]} seed={j + 2} alt={p.name} />
          )}
        </div>
        <p className="tpp-hand m-0 px-1 pt-3 text-center" style={{ color: "#3b2a20", fontSize: "clamp(14px,1.6cqw,21px)", lineHeight: 1.1 }}>
          {p.note || p.name}
        </p>
      </div>
    )
  })

  const workCh = (
    <Chapter
      index={2}
      seam={0.9}
      seed={303}
      label={labels[2]}
      setRef={setRef}
      uid={uid}
      upperBg={<NightPaper uid={uid} seed={3} flakes={snow} />}
      upper={
        <div className="tpp-fill flex flex-col" style={{ paddingTop: "clamp(64px, 10cqh, 96px)", color: "var(--tpp-cream)" }}>
          <div className="absolute" style={{ left: "-3%", top: "-4%", width: "clamp(150px,18cqw,280px)", aspectRatio: "1.5", transform: "rotate(10deg)" }}>
            <Sparkles seed={13} />
          </div>
          <Pop d={0.05} className="tpp-seal-wrap absolute" style={{ right: "-1%", top: "max(11%, 84px)", width: "clamp(110px,15cqw,220px)", aspectRatio: "1.1" }}>
            {sealUrl ? (
              <a href={sealUrl} target="_blank" rel="noreferrer" aria-label={txt.sealLabel} style={{ display: "block", width: "100%", height: "100%" }}>
                <InstaSeal uid={uid} text={txt.seal} icon={sealIcon} />
              </a>
            ) : (
              <InstaSeal uid={uid} text={txt.seal} icon={sealIcon} />
            )}
          </Pop>
          <Pop d={0} className="text-center">
            <h2 className="tpp-h tpp-sec-h" style={{ color: "var(--tpp-cream)" }}>
              {workTitle}
            </h2>
            <p className="tpp-label mt-3" style={{ opacity: 0.6 }}>
              {String(pi + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
            </p>
          </Pop>
          <div
            className="relative mx-auto flex w-full min-h-0 flex-1 items-center justify-center gap-[clamp(20px,5cqw,80px)] px-[clamp(16px,5cqw,64px)]"
            style={{ flexDirection: narrow ? "column" : "row", maxWidth: 1100, paddingBottom: narrow ? 8 : "6cqh", gap: narrow ? 14 : undefined }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") step(1)
              if (e.key === "ArrowLeft") step(-1)
            }}
          >
            <svg className="tpp-svg tpp-wide pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path className="tpp-dash" d="M30 72 C42 92 50 40 62 46" fill="none" stroke="var(--tpp-cream)" strokeOpacity=".55" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
            </svg>
            <Pop d={0.1} r={-6}>
              <button
                type="button"
                className="relative block"
                aria-label={"Next project (showing " + cur.name + ")"}
                onClick={() => step(1)}
                style={
                  portrait
                    ? { width: narrow ? "min(40cqw, calc(40cqh * .5))" : "min(24cqw, calc(64cqh * .5), 300px)", aspectRatio: "0.5" }
                    : { width: narrow ? "min(50cqw, calc(34cqh * .88))" : "min(28cqw, calc(54cqh * .88), 360px)", aspectRatio: "0.86" }
                }
              >
                {polaroids}
                <span className="tpp-tape" style={{ left: "50%", top: -10, marginLeft: -38, transform: "rotate(-4deg)", zIndex: 40 }} />
              </button>
            </Pop>
            <Pop d={0.22} r={3} style={{ width: narrow ? "100%" : "min(420px, 40cqw)", maxWidth: 460 }}>
              <div className="tpp-ncard" aria-live="polite">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="tpp-h" style={{ fontSize: "clamp(22px,2.6cqw,34px)", fontWeight: 400, letterSpacing: ".04em" }}>
                    {cur.name}
                  </h3>
                  <span className="tpp-serif shrink-0" style={{ fontSize: 15, opacity: 0.7 }}>
                    {cur.year}
                  </span>
                </div>
                {cur.role && (
                  <p className="tpp-label mt-1" style={{ fontSize: 9.5, color: pal.accent }}>
                    {cur.role}
                  </p>
                )}
                {cur.description && (
                  <p className="mt-3 text-[13px] leading-relaxed sm:text-[14px]" style={{ display: "-webkit-box", WebkitLineClamp: narrow ? 3 : 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {cur.description}
                  </p>
                )}
                {cur.tags && cur.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cur.tags.map((t) => (
                      <span key={t} className="tpp-chip">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  {cur.url ? (
                    <a href={cur.url} target="_blank" rel="noreferrer" className="tpp-label" style={{ fontSize: 10, color: pal.accent, borderBottom: "1px solid currentColor", paddingBottom: 2 }}>
                      {txt.visit}
                    </a>
                  ) : (
                    <button type="button" className="tpp-label" style={{ fontSize: 10, color: pal.accent, borderBottom: "1px solid currentColor", paddingBottom: 2 }} onClick={() => ask(cur)}>
                      {txt.ask}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3" style={{ color: "var(--tpp-cream)" }}>
                <div className="flex items-center gap-2">
                  <button type="button" className="tpp-round" aria-label="Previous project" onClick={() => step(-1)}>
                    ←
                  </button>
                  <button type="button" className="tpp-round" aria-label="Next project" onClick={() => step(1)}>
                    →
                  </button>
                  {hasVideo && (
                    <button
                      type="button"
                      className="tpp-round"
                      aria-label={audible ? "Mute video" : "Unmute video"}
                      aria-pressed={!audible}
                      title={audible ? "Mute" : "Unmute"}
                      onClick={() => setSoundOn(!audible)}
                    >
                      <svg className="tpp-svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" />
                        {audible ? (
                          <path d="M16.5 8.5 a5 5 0 0 1 0 7 M19 6 a8.5 8.5 0 0 1 0 12" />
                        ) : (
                          <path d="M16 9 L21 14 M21 9 L16 14" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5" role="group" aria-label="Projects">
                  {list.map((p, j) => (
                    <button
                      key={j}
                      type="button"
                      className="tpp-pip"
                      aria-label={p.name}
                      aria-current={j === pi}
                      onClick={() => j !== pi && step(j - pi)}
                    />
                  ))}
                </div>
              </div>
            </Pop>
          </div>
        </div>
      }
      lowerBg={<NightPaper uid={uid} seed={4} trees={false} flakes={false} />}
      lower={
        <div className="relative h-full">
          <span className="tpp-label tpp-next-label absolute" style={{ left: "clamp(16px,4cqw,44px)", top: "clamp(8px,2cqh,22px)", color: "var(--tpp-cream)", opacity: 0.8 }}>
            {txt.next} — {hasBrands ? brandsTitle : routeTitle}
          </span>
        </div>
      }
    />
  )

  const stickers = brands.map((b, i) => {
    const jit = rng(i * 7 + 3)
    const shape = b.shape || (b.wide ? (["torn", "round", "stamp"] as const)[i % 3] : (["seal", "stamp", "round"] as const)[i % 3])
    const clip = shape === "seal" ? SEAL_CLIP : shape === "stamp" ? (b.wide ? STAMP_CLIP_WIDE : STAMP_CLIP) : shape === "torn" ? TORN_CLIP : undefined
    return (
      <Pop key={b.name} d={0.04 + i * 0.03} r={(jit() - 0.5) * 16} className="tpp-stick" style={{ translate: fmt((jit() - 0.5) * 16) + "px " + fmt((jit() - 0.5) * 22) + "px" }}>
        <div
          className="tpp-sticker"
          data-wide={b.wide ? "" : undefined}
          data-shape={shape}
          style={{ background: b.bg || "var(--a-sticker" + ((i % 4) + 1) + ")", rotate: fmt((jit() - 0.5) * 14) + "deg", clipPath: clip }}
        >
          <div className="tpp-logo" role="img" aria-label={b.name} style={{ filter: b.logoFilter }}>
            <span style={b.fill ? ({ background: b.fill, WebkitMaskImage: "url(" + b.logo + ")", maskImage: "url(" + b.logo + ")" } as React.CSSProperties) : { backgroundImage: "url(" + b.logo + ")" }} data-mask={b.fill ? "" : undefined} />
          </div>
        </div>
      </Pop>
    )
  })

  const brandsCh = hasBrands ? (
    <Chapter
      index={3}
      seam={0.9}
      seed={606}
      label={labels[3]}
      setRef={setRef}
      uid={uid}
      upperBg={
        <div className="tpp-fill" aria-hidden="true" style={{ background: "var(--a-brandsBg)" }}>
          {brandsBackground && (
            <>
              <img src={brandsBackground} alt="" className="tpp-fill" style={{ objectFit: "cover", maxWidth: "none" }} draggable={false} />
              <div className="tpp-fill" style={{ background: "var(--a-brandsBg)", opacity: 0.78 }} />
            </>
          )}
          <Grain uid={uid} light opacity={0.18} />
          {snow && <Snow seed={67} count={14} />}
        </div>
      }
      upper={
        <div className="tpp-fill flex flex-col items-center" style={{ paddingTop: "clamp(64px, 10cqh, 96px)", paddingBottom: "clamp(10px, 3cqh, 32px)", color: "var(--tpp-cream)" }}>
          <Pop d={0} className="text-center">
            <h2 className="tpp-h tpp-sec-h" style={{ color: "var(--tpp-cream)" }}>
              {brandsTitle}
            </h2>
          </Pop>
          <div className="tpp-brands">{stickers}</div>
        </div>
      }
      lowerBg={<NightPaper uid={uid} seed={7} trees={false} flakes={false} />}
      lower={
        <div className="relative h-full">
          <span className="tpp-label tpp-next-label absolute" style={{ right: "clamp(16px,4cqw,44px)", top: "clamp(8px,2cqh,22px)", color: "var(--tpp-cream)", opacity: 0.8 }}>
            {txt.next} — {routeTitle}
          </span>
        </div>
      }
    />
  ) : null

  const px = 100 / Math.max(1, mapH)
  const st = stops[stop] || stops[0]
  const sp = pts[stop] || [50, 50]
  // Quadro com print é largo: fica abaixo do ponto, para não cobrir os vizinhos.
  const cardLeft = narrow ? undefined : st.image ? "clamp(0px, calc(" + sp[0] + "% - min(240px,25cqw)), calc(100% - min(480px,50cqw)))" : sp[0] > 58 ? "calc(" + sp[0] + "% - min(300px,40cqw) - 28px)" : "calc(" + sp[0] + "% + 28px)"
  const cardTop = narrow ? undefined : st.image ? "calc(" + clamp(sp[1], 18, 55) + "% + 14px)" : "calc(" + clamp(sp[1], 18, 70) + "% - 60px)"

  const routeCh = (
    <Chapter
      index={routeIdx}
      seam={0.88}
      seed={404}
      label={labels[routeIdx]}
      setRef={setRef}
      uid={uid}
      upperBg={
        <div className="tpp-fill" aria-hidden="true" style={{ background: "var(--a-paperBg)" }}>
          <DotGrid />
          <Grain uid={uid} opacity={0.45} />
          {snow && floaters?.length ? <Snow seed={53} count={12} tone="light" /> : null}
        </div>
      }
      upper={
        <div className="tpp-fill flex flex-col" style={{ paddingTop: "clamp(64px, 10cqh, 96px)", color: pal.ink }}>
          <Pop d={0} className="flex items-end justify-between gap-4 px-[clamp(16px,5cqw,64px)]">
            <div>
              <p className="tpp-label" style={{ color: pal.accent }}>
                {txt.routeEyebrow}
              </p>
              <h2 className="tpp-h tpp-sec-h mt-2">{routeTitle}</h2>
            </div>
            <div className="tpp-wide" style={{ color: pal.ink, opacity: 0.7 }}>
              <Trend />
            </div>
          </Pop>
          <div
            ref={mapRef}
            className="relative mx-[clamp(16px,5cqw,64px)] mb-[3cqh] mt-[2cqh] min-h-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") setStop((s) => Math.min(stops.length - 1, s + 1))
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") setStop((s) => Math.max(0, s - 1))
            }}
          >
            <svg className="tpp-svg tpp-fill" viewBox={"0 0 " + fmt(trail.w) + " 100"} preserveAspectRatio="none" aria-hidden="true" style={{ overflow: "visible" }}>
              <path d={trail.d} fill="none" stroke={pal.ink} strokeOpacity=".5" strokeWidth={1.6 * px} strokeDasharray={fmt(2 * px) + " " + fmt(8 * px)} strokeLinecap="round" />
              <path
                className="tpp-progress"
                d={trail.d}
                fill="none"
                stroke={pal.accent}
                strokeWidth={2.6 * px}
                strokeLinecap="round"
                strokeDasharray={fmt(trail.total + 1) + " " + fmt(trail.total + 1)}
                strokeDashoffset={fmt(trail.total * (1 - (trail.fr[stop] || 0)))}
              />
            </svg>
            <span className="tpp-walker" style={{ left: sp[0] + "%", top: sp[1] + "%" }} aria-hidden="true" />
            {stops.map((s, i) => (
              <Pop key={i} d={0.08 + i * 0.05} style={{ position: "absolute", left: pts[i][0] + "%", top: pts[i][1] + "%" }}>
                <button
                  type="button"
                  className="tpp-pin"
                  aria-pressed={i === stop}
                  aria-label={s.year + " — " + s.title}
                  onClick={() => setStop(i)}
                  onMouseEnter={() => setStop(i)}
                  onFocus={() => setStop(i)}
                  style={{ left: 0, top: 0 }}
                >
                  <span className="tpp-pin-y">{s.year}</span>
                  <span className="tpp-pin-dot" />
                </button>
              </Pop>
            ))}
            {txt.routeHint && stops.length > 2 && (
              <div className="absolute" style={{ left: pts[2][0] + "%", top: pts[2][1] + "%" }}>
                <div className="tpp-route-hint">
                  <svg className="tpp-svg" width="100" height="62" viewBox="0 0 100 62" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M26 58C20 36 34 20 54 21c14 1 24 2 38-14" />
                    <path d="M80 6l13 0-1 13" />
                  </svg>
                  <span>{txt.routeHint}</span>
                </div>
              </div>
            )}
            <Pop
              d={0.3}
              className={"tpp-stop" + (st.image ? " tpp-stop-wide" : "")}
              style={narrow ? { left: 0, right: 0, bottom: 0 } : { left: cardLeft, top: cardTop }}
            >
              <div className="tpp-ncard" aria-live="polite" style={{ transform: "rotate(-1deg)" }}>
                <p className="tpp-label" style={{ fontSize: 9.5, color: pal.accent }}>
                  {st.year}
                  {st.place ? " · " + st.place : ""}
                </p>
                <div className="tpp-stop-row">
                  <div className="min-w-0 flex-1">
                    <h3 className="tpp-serif" style={{ fontSize: "clamp(19px,1.9cqw,25px)", margin: 0, fontWeight: 600, lineHeight: 1.15 }}>
                      {st.title}
                    </h3>
                    {st.text && <p className="mt-2 text-[13px] leading-relaxed" style={{ whiteSpace: "pre-line" }}>{st.text}</p>}
                  </div>
                  {st.image && (
                    <button
                      type="button"
                      className="tpp-stop-shot"
                      aria-label={"Ampliar métricas do " + st.title}
                      onClick={(e) => {
                        const thumb = e.currentTarget.firstElementChild as HTMLImageElement
                        const from = e.currentTarget.getBoundingClientRect()
                        setShot({ src: st.image as string, alt: "Métricas do " + st.title, ratio: thumb.naturalWidth / thumb.naturalHeight || from.width / from.height, from })
                      }}
                    >
                      <img src={st.image} alt="" />
                    </button>
                  )}
                </div>
              </div>
            </Pop>
          </div>
        </div>
      }
      lowerBg={<NightPaper uid={uid} seed={6} trees={false} flakes={false} />}
      lower={
        <div className="relative h-full">
          <span className="tpp-label tpp-next-label absolute" style={{ right: "clamp(16px,4cqw,44px)", top: "clamp(8px,2cqh,22px)", color: "var(--tpp-cream)", opacity: 0.8 }}>
            {txt.lastStop} — {contactTitle}
          </span>
        </div>
      }
    />
  )

  const night = (
    <div className="tpp-fill" aria-hidden="true" style={{ background: "var(--a-contactBg)" }}>
      <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={uid + "-sun"}>
            <stop offset="0" stopColor={P.sun} stopOpacity=".9" />
            <stop offset="1" stopColor={P.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={uid + "-au"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset=".55" stopColor="#ffffff" stopOpacity=".12" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <NightSky />
        <g className="tpp-aurora">
          <path d="M-100 300 C200 120 420 340 700 200 C950 80 1150 260 1400 140 C1550 70 1650 120 1700 100 L1700 330 C1500 360 1300 260 1100 360 C850 470 650 300 420 400 C200 490 60 380 -100 460 Z" fill={"url(#" + uid + "-au)"} />
        </g>
        <circle cx="1280" cy="170" r="150" fill={"url(#" + uid + "-sun)"} />
        <circle cx="1280" cy="170" r="48" fill={P.sun} />
        <path d={blobD(31, 300, 200, 90)} fill={P.glow} opacity=".14" />
        <path d={blobD(37, 420, 230, 60)} fill={P.glow} opacity=".1" />
        <path d={waveD(808, 780, 50, 2)} fill={P.nightWave} opacity=".55" />
        <path d={waveD(919, 880, 36, 2.6)} fill={P.nightFloor} />
      </svg>
      <Grain uid={uid} light opacity={0.18} />
      {snow && <Snow seed={23} count={22} />}
    </div>
  )

  const contactCh = (
    <Chapter
      index={contactIdx}
      seam={1}
      seed={505}
      label={labels[contactIdx]}
      last
      setRef={setRef}
      uid={uid}
      upperBg={night}
      upper={
        <div className="tpp-fill flex flex-col items-center" style={{ paddingTop: "clamp(64px, 10cqh, 96px)", color: "var(--tpp-cream)" }}>
          <Pop d={0} className="px-5 text-center">
            <h2 className="tpp-h tpp-sec-h">{contactTitle}</h2>
            {contactForm && (
              <p className="tpp-label mt-3" style={{ opacity: 0.6 }}>
                {txt.goesTo} {email}
              </p>
            )}
          </Pop>
          {contactForm ? (
            <Pop d={0.12} r={-2} className="mt-[3cqh] w-full px-4" style={{ maxWidth: 760 }}>
              <form
                className={"tpp-paper relative overflow-clip " + (shake ? (shake % 2 ? "tpp-shake" : "tpp-shake2") : "")}
                style={{ borderRadius: 3, transform: "rotate(-.6deg)" }}
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
              >
                <Grain uid={uid} opacity={0.35} />
                <div className="relative grid gap-[clamp(12px,2.4cqw,28px)] p-[clamp(14px,2.4cqw,28px)]" style={{ gridTemplateColumns: narrow ? "1fr" : "1.25fr 1px 1fr" }}>
                  <label className="relative block">
                    <span className="sr-only">Your message</span>
                    <div className="tpp-rule" style={{ height: narrow ? "6em" : "clamp(7.5em, 26cqh, 10.5em)", fontSize: "clamp(15px,1.5cqw,20px)" }}>
                      <textarea
                        ref={msgRef}
                        className="tpp-msg"
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value)
                          setSent(false)
                          setNotice("")
                        }}
                        placeholder={txt.messagePlaceholder.replace("{first}", first)}
                      />
                    </div>
                  </label>
                  {!narrow && <div style={{ background: "rgba(59,42,32,.22)" }} />}
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div role="group" aria-label="Choose a stamp" className="flex gap-2">
                        {stamps.map((s, k) => (
                          <button key={s} type="button" className="tpp-stamp-btn" aria-pressed={k === stampKind} aria-label={s + " stamp"} onClick={() => setStampKind(k)}>
                            <Stamp w={narrow ? 34 : 40} h={narrow ? 42 : 50}>
                              {stampArt(k)}
                            </Stamp>
                          </button>
                        ))}
                      </div>
                      <div style={{ transform: "rotate(4deg)" }}>
                        <Stamp w={narrow ? 52 : 62} h={narrow ? 64 : 76} label="POST">
                          {stampArt(stampKind)}
                        </Stamp>
                      </div>
                    </div>
                    <div className="tpp-hw" style={{ lineHeight: 1.7 }}>
                      <div style={{ borderBottom: "1px solid rgba(59,42,32,.3)" }}>{txt.to}: {name}</div>
                      <div className="tpp-wide" style={{ borderBottom: "1px solid rgba(59,42,32,.3)" }}>
                        {location}
                      </div>
                    </div>
                    {/* Armadilha: invisível para pessoas, robôs costumam preencher. */}
                    <div className="tpp-trap" aria-hidden="true">
                      <label>
                        Company site
                        <input type="text" name="company_site" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
                      </label>
                    </div>
                    <label className="block">
                      <span className="tpp-label" style={{ fontSize: 9, opacity: 0.6 }}>
                        {txt.from}
                      </span>
                      <input className="tpp-input" type="email" value={from} onChange={(e) => setFrom(e.target.value)} placeholder={txt.fromPlaceholder} autoComplete="email" />
                    </label>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <button type="button" className="tpp-label" style={{ fontSize: 9.5, opacity: 0.7 }} onClick={copy}>
                        {copied ? txt.copied : txt.copyEmail}
                      </button>
                      <button type="submit" className="tpp-tag" disabled={sending || waitLeft > 0} style={{ background: pal.ink, color: "#faf5ec" }}>
                        {sending ? txt.sending : waitLeft > 0 ? txt.waitToSend.replace("{s}", String(waitLeft)) : txt.send}
                      </button>
                    </div>
                  </div>
                </div>
                {sent && (
                  <div className="tpp-postmark" style={{ right: narrow ? 0 : 6, top: narrow ? 8 : 14 }}>
                    <Postmark text={"· " + txt.sentStamp + " · " + location.toUpperCase() + " "} date={today} />
                  </div>
                )}
              </form>
              <p className="tpp-hand mt-2 text-center" style={{ color: "var(--tpp-cream)", fontSize: 16, minHeight: "1.2em" }} aria-live="polite">
                {notice}
              </p>
            </Pop>
          ) : (
            <Pop d={0.12} r={-2} className="mt-[4cqh] w-full px-4" style={{ maxWidth: 560 }}>
              <div className="tpp-paper relative overflow-clip text-center" style={{ borderRadius: 3, transform: "rotate(-.6deg)" }}>
                <Grain uid={uid} opacity={0.35} />
                <div className="relative flex flex-col items-center gap-4 p-[clamp(20px,3.4cqw,40px)]">
                  <span className="tpp-label" style={{ fontSize: 10, opacity: 0.65 }}>
                    {txt.emailLabel}
                  </span>
                  <span className="tpp-email">{email}</span>
                  <button type="button" className="tpp-tag" style={{ background: pal.ink, color: "#faf5ec" }} onClick={copy}>
                    {copied ? txt.copied : txt.copyEmail}
                  </button>
                </div>
              </div>
            </Pop>
          )}
          <Pop d={0.25} className="mt-[1.5cqh] flex flex-wrap justify-center gap-3 px-4">
            {links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="tpp-luggage">
                {l.label}
              </a>
            ))}
          </Pop>
          <div className="mt-auto flex w-full items-center justify-between gap-3 px-[clamp(16px,4cqw,44px)] pb-4 text-[11px]" style={{ color: "var(--tpp-cream)" }}>
            <span>
              © {year} {name} · {txt.madeWith}
            </span>
            <button type="button" className="tpp-label" style={{ fontSize: 10 }} onClick={() => go(0)}>
              {txt.backToTop}
            </button>
          </div>
        </div>
      }
    />
  )


  return (
    <div
      ref={rootRef}
      className={"tpp-root " + className}
      data-mode={stack ? "stack" : "pin"}
      style={rootStyle}
    >
      <style>{TPP_CSS}</style>
      <FloatersContext.Provider value={floaters || NO_FLOATERS}>
      <div ref={trackRef} className="tpp-track" style={{ height: stack ? "auto" : "calc(" + height + " * " + fmt(trackFactor) + ")" }}>
        <div ref={stageRef} className="tpp-stage" data-tone="dark" style={{ height: stack ? "auto" : stageHeight }}>
          {hero}
          {aboutCh}
          {workCh}
          {brandsCh}
          {routeCh}
          {contactCh}

          <nav className="tpp-nav" aria-label="Chapters">
            <button type="button" className="tpp-brand" onClick={() => go(0)}>
              {name}
            </button>
            <div className="tpp-links">
              {labels.map((l, i) => (
                <button key={l} type="button" className="tpp-link" aria-current={i === active} onClick={() => go(i)}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="tpp-count" aria-hidden="true">
                {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
              </span>
              <button type="button" aria-label={name + " — back to the cover"} onClick={() => go(0)}>
                <Logo mark={mark} since={since} prefix={txt.logoPrefix} />
              </button>
            </div>
          </nav>
          {!stack && (
            <div className="tpp-rail" role="group" aria-label="Chapter progress">
              {labels.map((l, i) => (
                <button key={l} type="button" className="tpp-dot" aria-label={l} aria-current={i === active} onClick={() => go(i)} />
              ))}
            </div>
          )}
          {!stack && (
            <div className="tpp-steps" data-last={active === N - 1 ? "" : undefined}>
              {active > 0 && (
                <button type="button" className="tpp-prev" aria-label={"Voltar: " + labels[active - 1]} onClick={() => stepChapter(-1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20V4M5 11l7-7 7 7" />
                  </svg>
                </button>
              )}
              {active < N - 1 && (
                <button type="button" className="tpp-next" aria-label={txt.next + ": " + labels[active + 1]} onClick={() => stepChapter(1)}>
                  {labels[active + 1]}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 4v16M5 13l7 7 7-7" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {shot && (
            <div ref={shotViewRef} className="tpp-shot-view" role="dialog" aria-modal="true" aria-label={shot.alt} onClick={closeShot}>
              <img
                ref={shotImgRef}
                src={shot.src}
                alt={shot.alt}
                style={{ width: "min(92cqw, " + fmt(88 * shot.ratio) + "cqh, 1320px)", aspectRatio: String(shot.ratio) }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </div>
      </FloatersContext.Provider>
    </div>
  )
}

function NightSky() {
  const hasFloaters = React.useContext(FloatersContext).length > 0
  const stars = React.useMemo(() => {
    const r = rng(42)
    return Array.from({ length: 40 }, () => ({ x: r() * 1600, y: r() * 620, s: 4 + r() * 10, d: r() * 3 }))
  }, [])
  if (hasFloaters) return null
  return (
    <g>
      {stars.map((s, i) => (
        <path key={i} className={i % 3 ? undefined : "tpp-twinkle"} d={sparkD(s.x, s.y, s.s)} fill="#fff" opacity=".85" style={{ animationDelay: -s.d + "s" }} />
      ))}
    </g>
  )
}
