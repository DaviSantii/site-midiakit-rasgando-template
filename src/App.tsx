import * as React from "react"
import CreatorPortfolio, { type CreatorPortfolioProps } from "@/components/ui/creator-portfolio"
import ThemeSwitcher, { type SiteTheme } from "@/components/ui/theme-switcher"
import * as client from "@client"

const profile: CreatorPortfolioProps = client.default
// Temas são opcionais: um cliente que exporta `themes` ganha o botão de troca no topo.
const themes = (client as { themes?: SiteTheme[] }).themes || []

const STORAGE_KEY = "media-kit-tema"

// Tema inicial: o do endereço (?tema=azul), senão o último escolhido, senão o primeiro.
const readSaved = () => {
  const fromUrl = new URLSearchParams(location.search).get("tema")
  if (themes.some((t) => t.id === fromUrl)) return fromUrl as string
  try {
    const id = localStorage.getItem(STORAGE_KEY)
    return themes.some((t) => t.id === id) ? (id as string) : themes[0]?.id
  } catch {
    return themes[0]?.id
  }
}

export default function App() {
  const [themeId, setThemeId] = React.useState(readSaved)
  const theme = themes.find((t) => t.id === themeId)

  if (!theme) return <CreatorPortfolio {...profile} />

  const choose = (id: string) => {
    setThemeId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Sem armazenamento (aba anônima, por exemplo): o tema vale só até recarregar.
    }
  }

  return (
    <div data-tema={theme.id}>
      <CreatorPortfolio
        {...profile}
        palette={theme.palette}
        handFont={theme.handFont ?? profile.handFont}
        floaters={theme.floaters ?? profile.floaters}
        sealIcon={theme.sealIcon ?? profile.sealIcon}
        brands={profile.brands?.map((b) => ({ ...b, fill: theme.brandFill ?? b.fill, bg: theme.brandBg ?? b.bg }))}
      />
      <ThemeSwitcher themes={themes} value={theme.id} onChange={choose} />
    </div>
  )
}
