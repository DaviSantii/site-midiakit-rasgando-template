import * as React from "react"
import { createPortal } from "react-dom"
import type { FloaterIcon, PostcardPalette } from "@/components/ui/creator-portfolio"

/** Um visual completo do site: cores, fundos, fontes e ícones, sem os textos. */
export type SiteTheme = {
  id: string
  label: string
  /** Fundo CSS da bolinha que representa o tema no botão e no menu. */
  swatch: string
  palette: PostcardPalette
  handFont?: string
  floaters?: FloaterIcon[]
  sealIcon?: "instagram" | "tiktok"
  /** Cor que pinta os logos das marcas (no lugar do branco). */
  brandFill?: string
  /** Cor do selo das marcas. */
  brandBg?: string
}

type Props = {
  themes: SiteTheme[]
  value: string
  onChange: (id: string) => void
}

const SIZE = 30

/**
 * Botão redondo ao lado do nome, no topo do site, que abre a lista de temas.
 * Fica fora do componente do media kit: entra por portal no menu do topo e se
 * posiciona logo depois do nome, sem mudar o layout de lá.
 */
export default function ThemeSwitcher({ themes, value, onChange }: Props) {
  const [host, setHost] = React.useState<HTMLElement | null>(null)
  const [pos, setPos] = React.useState({ left: 0, top: 0 })
  const [open, setOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const current = themes.find((t) => t.id === value) || themes[0]

  // O menu do topo é montado pelo componente do media kit; espera ele existir.
  React.useEffect(() => {
    let frame = 0
    const find = () => {
      const nav = document.querySelector<HTMLElement>(".tpp-nav")
      if (nav) setHost(nav)
      else frame = requestAnimationFrame(find)
    }
    find()
    return () => cancelAnimationFrame(frame)
  }, [])

  // Acompanha a largura do nome, que muda com a fonte do tema e o tamanho da tela.
  React.useLayoutEffect(() => {
    if (!host) return
    const brand = host.querySelector<HTMLElement>(".tpp-brand")
    if (!brand) return
    const place = () => setPos({ left: brand.offsetLeft + brand.offsetWidth + 12, top: brand.offsetTop + brand.offsetHeight / 2 - SIZE / 2 })
    place()
    const ro = new ResizeObserver(place)
    ro.observe(brand)
    window.addEventListener("resize", place)
    document.fonts?.ready.then(place)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", place)
    }
  }, [host, value])

  // Fecha ao clicar fora ou apertar Esc.
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!host) return null

  return createPortal(
    <div ref={wrapRef} style={{ position: "absolute", left: pos.left, top: pos.top, zIndex: 60, pointerEvents: "auto" }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={"Trocar o tema do site (atual: " + current.label + ")"}
        title="Trocar o tema"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,.9)",
          background: current.swatch,
          boxShadow: "0 2px 8px rgba(0,0,0,.28)",
          cursor: "pointer",
          padding: 0,
        }}
      />
      {open && (
        <div
          role="menu"
          aria-label="Temas"
          style={{
            position: "absolute",
            top: SIZE + 10,
            left: 0,
            minWidth: 168,
            padding: 6,
            borderRadius: 16,
            background: "#ffffff",
            color: "#1f2a2e",
            boxShadow: "0 12px 32px rgba(0,0,0,.25)",
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
          }}
        >
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === current.id}
              onClick={() => {
                onChange(t.id)
                setOpen(false)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 10px",
                border: 0,
                borderRadius: 12,
                background: t.id === current.id ? "rgba(0,0,0,.06)" : "transparent",
                color: "inherit",
                font: "inherit",
                fontSize: 14,
                fontWeight: t.id === current.id ? 700 : 500,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", background: t.swatch, flex: "none", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)" }} />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>,
    host,
  )
}
