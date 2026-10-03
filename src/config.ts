/** Código do football-data.org. BSA = Brasileirão Série A. */
export const COMPETICAO = 'BSA'
export const TEMPORADA = 2026
export const NOME_COMPETICAO = 'Brasileirão Série A'

/** Quem faz o site, no rodapé. Links sem endereço não aparecem. */
export const AUTORIA: { nome: string; links: { rotulo: string; url: string }[] } = {
  nome: 'Maria Clara',
  links: [
    { rotulo: 'LinkedIn', url: 'https://www.linkedin.com/in/mariaclara733/' },
    { rotulo: 'GitHub', url: 'https://github.com/mariaclara7' },
    { rotulo: 'Portfólio', url: 'https://mariaclaradev.pages.dev/' },
    { rotulo: 'E-mail', url: 'mailto:mcadelmonico@gmail.com' },
  ],
}

export type Zona = {
  nome: string
  /** Posições da zona, inclusivas. */
  de: number
  ate: number
  /** Classe Tailwind da faixa colorida ao lado da posição. */
  cor: string
  /** A mesma cor, para gráficos em SVG. */
  preenchimento: string
}

/**
 * Faixas de classificação do Brasileirão. As vagas podem mudar conforme os campeões
 * da Copa do Brasil e das competições continentais, então são uma referência.
 */
export const ZONAS: Zona[] = [
  { nome: 'Libertadores', de: 1, ate: 4, cor: 'bg-zona-libertadores', preenchimento: 'fill-zona-libertadores' },
  {
    nome: 'Pré-Libertadores',
    de: 5,
    ate: 6,
    cor: 'bg-zona-pre-libertadores',
    preenchimento: 'fill-zona-pre-libertadores',
  },
  { nome: 'Sul-Americana', de: 7, ate: 12, cor: 'bg-zona-sul-americana', preenchimento: 'fill-zona-sul-americana' },
  { nome: 'Rebaixamento', de: 17, ate: 20, cor: 'bg-zona-rebaixamento', preenchimento: 'fill-zona-rebaixamento' },
]

/** Faixas mostradas na página de chances: o título e cada zona da tabela. */
export const FAIXAS_CHANCES: Zona[] = [
  { nome: 'Título', de: 1, ate: 1, cor: 'bg-zona-libertadores', preenchimento: 'fill-zona-libertadores' },
  ...ZONAS,
]

/** Soma das chances de terminar entre as posições da faixa. */
export function chanceNaFaixa(posicoes: number[], faixa: Pick<Zona, 'de' | 'ate'>) {
  return posicoes.slice(faixa.de - 1, faixa.ate).reduce((soma, chance) => soma + chance, 0)
}

export function zonaDaPosicao(posicao: number): Zona | undefined {
  return ZONAS.find((zona) => posicao >= zona.de && posicao <= zona.ate)
}
