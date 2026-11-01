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

/**
 * Pix para a página "Apoie" (/apoie). Enquanto estiver null, a página diz que o apoio ainda não está disponível e o
 * link do rodapé não aparece. Use a chave aleatória, para não expor CPF, telefone ou e-mail.
 */
export const PIX: { chave: string; nome: string; cidade: string } | null = {
  chave: 'd274d315-30c2-4495-b8cc-813f78946a5b',
  nome: 'Maria Clara Albino Delmonico',
  cidade: 'Cornélio Procópio',
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

/**
 * Soma das chances de terminar entre as posições da faixa. Arredonda o resultado porque somar frações em ponto
 * flutuante sai torto: 0,6 + 0,3 + 0,1 dá 0,9999999999999999, e um time com 100% nas simulações apareceria
 * como "mais de 99%".
 */
export function chanceNaFaixa(posicoes: number[], faixa: Pick<Zona, 'de' | 'ate'>) {
  const soma = posicoes.slice(faixa.de - 1, faixa.ate).reduce((total, chance) => total + chance, 0)
  return Math.min(1, Math.max(0, Math.round(soma * 1e9) / 1e9))
}

export function zonaDaPosicao(posicao: number): Zona | undefined {
  return ZONAS.find((zona) => posicao >= zona.de && posicao <= zona.ate)
}
