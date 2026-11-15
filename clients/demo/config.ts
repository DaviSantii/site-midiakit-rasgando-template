import "@fontsource/kalam/400.css"
import "@fontsource/kalam/700.css"
import type { CreatorPortfolioProps, PortfolioBrand, PostcardProject } from "@/components/ui/creator-portfolio"
import { mar } from "./themes"

// Temas que o botão ao lado do nome troca (cores, fontes e ícones). Os dados da Luna não mudam.
export { themes } from "./themes"

// Perfil de demonstração. Luna Prado, os números, as campanhas e as marcas são
// fictícios. As fotos são do Pexels (licença livre), e os logos são só texto.

const work = (name: string, file: string, description: string, tags: string[]): PostcardProject => ({
  name,
  image: "/trabalho-" + file + ".jpg",
  role: "Publicidade · Reels e TikTok",
  description,
  tags,
})

// Logos brancos, pintados por máscara sobre selos nas cores da paleta.
const brand = (name: string, file: string, wide = true): PortfolioBrand => ({ name, logo: "/marcas/" + file + ".png", wide, fill: "#ffffff" })

const demo: CreatorPortfolioProps = {
  name: "Luna Prado",
  role: "Criadora de conteúdo",
  location: "Florianópolis · SC",
  since: "2026",
  headline: ["Luna", "Prado"],
  intro: "Lifestyle, viagens e bem-estar contados com leveza, do café da manhã ao pôr do sol na praia.",
  contactForm: false,
  noteStats: [
    { value: "820 mil", label: "no TikTok" },
    { value: "410 mil", label: "no Instagram" },
    { value: "95 mil", label: "no YouTube" },
  ],
  handFont: '"Kalam", "Segoe Print", "Bradley Hand", cursive',
  floaters: ["plane", "camera", "smile", "house"],
  email: "contato@lunaprado.example",
  labels: ["Início", "Sobre", "Trabalhos", "Marcas", "Redes", "Contato"],
  workTitle: "Trabalhos",
  workFrame: "portrait",
  brandsTitle: "Marcas",
  brands: [
    brand("Aurora Skin", "aurora"),
    brand("Maré Viagens", "mare"),
    brand("Passo Leve", "passo-leve"),
    brand("Grão & Cia", "grao"),
    brand("Lumen", "lumen", false),
    brand("Café Brisa", "brisa"),
    brand("Sol de Agosto", "sol"),
    brand("Ninho Casa", "ninho"),
  ],
  palette: mar.palette,

  routeTitle: "Redes e audiência",
  contactTitle: "Vamos colaborar?",
  phoneScreen: "/perfil.jpg",
  phoneGrid: ["/trabalho-mare.jpg", "/trabalho-aurora.jpg"],
  phoneGridLabels: ["1,2 mi", "640 mil"],
  about: {
    title: "Quem é a Luna?",
    subtitle: "Uma rotina leve, com o mar sempre por perto.",
    photo: "/capa.jpg",
    portrait: false,
    text: "Luna mostra a vida em Florianópolis entre trabalho, praia e viagens curtas pelo litoral. Os vídeos misturam rotina, dicas práticas e humor, e as marcas entram no dia a dia dela de um jeito natural, sem cara de anúncio.",
    facts: [
      { label: "Quem é", value: "Criadora de conteúdo, 27 anos" },
      { label: "Onde encontrar", value: "Florianópolis e litoral de Santa Catarina" },
      { label: "Segmentos", value: "Lifestyle, viagens, bem-estar e gastronomia" },
      { label: "Atenção", value: "Perfil fictício, criado para demonstração" },
    ],
    skills: ["Lifestyle", "Viagens", "Bem-estar", "Skincare", "Gastronomia", "Moda casual", "Storytelling", "Publicidade"],
  },
  projects: [
    work("Maré Viagens", "mare", "Roteiro de três dias pelo litoral catarinense, com hospedagem e passeios da Maré. 1,2 mi de visualizações.", ["Viagem", "Reels"]),
    work("Aurora Skin", "aurora", "Rotina de skincare da manhã com a linha nova da Aurora, gravada em casa. 640 mil visualizações.", ["Beleza", "TikTok"]),
    work("Passo Leve", "passo-leve", "Um dia inteiro andando pela cidade com o tênis novo da Passo Leve. 380 mil visualizações.", ["Moda", "Reels"]),
    work("Grão & Cia", "grao", "Café da manhã completo em dez minutos, com os grãos e granolas da Grão & Cia. 290 mil visualizações.", ["Gastronomia", "TikTok"]),
    work("Lumen", "lumen", "Teste da câmera do celular Lumen em fotos e vídeos do dia a dia. 210 mil visualizações.", ["Tecnologia", "Reels"]),
    work("Café Brisa", "brisa", "Manhã de trabalho remoto com o café especial da Brisa. 150 mil visualizações.", ["Lifestyle", "TikTok"]),
  ],
  route: [
    { year: "820 mil", title: "TikTok", place: "@luna.prado.demo", image: "/perfil.jpg", text: "31,4 mi de curtidas\n4,8 mi de visualizações por mês\n68% do público tem de 18 a 34 anos" },
    { year: "410 mil", title: "Instagram", place: "@luna.prado.demo", text: "Alcance médio de 1,1 mi por mês\n74% do público é feminino\nPrincipais cidades: Florianópolis, São Paulo e Curitiba" },
    { year: "95 mil", title: "YouTube", place: "Luna Prado", text: "Vlogs de viagem e rotina\n2,3 mi de visualizações no total" },
    { year: "8,7%", title: "Engajamento", place: "Média das redes", text: "Taxa média de engajamento nos últimos 90 dias\nNúmeros fictícios, para demonstração" },
  ],
  // Endereços de exemplo: o perfil não existe.
  links: [
    { label: "TikTok", url: "https://example.com/tiktok" },
    { label: "Instagram", url: "https://example.com/instagram" },
    { label: "YouTube", url: "https://example.com/youtube" },
  ],
  ui: {
    seeWork: "Ver trabalhos",
    writeMe: "Fale comigo",
    keepScrolling: "Continue rolando",
    tearsOpen: ", a página se rasga",
    turnOver: "Clique para Virar ↻",
    front: "↺ Clique para Voltar",
    backEyebrow: "Media kit",
    divider: "enviado com carinho · via DM",
    next: "Próximo",
    lastStop: "Por fim",
    visit: "Ver campanha ↗",
    ask: "Quero saber mais →",
    askMessage: "Oi, {first}!\n\nQueria saber mais sobre {project}. ",
    routeEyebrow: "Números · público",
    goesTo: "Vai direto para",
    messagePlaceholder: "Oi, {first}! Tenho uma campanha em mente…",
    mailSubject: "Parceria com {name}",
    to: "Para",
    from: "De",
    fromPlaceholder: "voce@marca.com",
    copyEmail: "Copiar e-mail",
    copied: "Copiado ✓",
    send: "Enviar",
    sent: "Enviado ✓",
    sentStamp: "ENVIADO",
    mailOpening: "Tentando abrir seu app de e-mail. Se nada abrir, copie o endereço e escreva direto.",
    sending: "Enviando…",
    sentConfirmed: "Mensagem enviada. Obrigado!",
    sendFailed: "Não foi possível enviar. Copie o endereço e escreva direto.",
    waitToSend: "Aguarde {s}s",
    madeWith: "todos os direitos reservados",
    backToTop: "Voltar ao topo ↑",
    tapForSound: "toque para ouvir",
    routeHint: "Clique aqui",
    emailLabel: "E-mail para contato",
    logoPrefix: "PORTFÓLIO ",
    seal: "PERFIL FICTÍCIO ✦ @LUNA.PRADO.DEMO ✦ MEDIA KIT ✦",
  },
}

export default demo
