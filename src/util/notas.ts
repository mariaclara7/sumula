import type { Artilheiro, LinhaClassificacao } from '../api/tipos'

/*
 * Notas no estilo de game (OVR, ataque, defesa, atributos de jogador). Nenhuma vem da API:
 * são fórmulas simples a partir dos números reais, só para dar uma leitura rápida.
 */

/** Toda nota fica entre 40 e 99, como nos cards de videogame. */
export function limitarNota(valor: number) {
  return Math.max(40, Math.min(99, Math.round(valor)))
}

/** Nota geral do time a partir do aproveitamento (0–100): 100% vale 99, 0% vale 50. */
export function notaDoTime(aproveitamento: number) {
  return limitarNota(50 + aproveitamento * 0.58)
}

export type Faixa = { nome: 'OURO' | 'PRATA' | 'BRONZE'; cor: string }

export function faixaDaNota(nota: number): Faixa {
  if (nota >= 85) return { nome: 'OURO', cor: 'bg-lima' }
  if (nota >= 75) return { nome: 'PRATA', cor: 'bg-prata' }
  return { nome: 'BRONZE', cor: 'bg-bronze' }
}

/** Gols por jogo de toda a liga (marcados = sofridos, somando todos os times). */
export function mediaDeGols(linhas: LinhaClassificacao[]) {
  const jogos = linhas.reduce((soma, l) => soma + l.jogos, 0)
  const gols = linhas.reduce((soma, l) => soma + l.golsPro, 0)
  return jogos === 0 ? 0 : gols / jogos
}

/** Ataque: gols marcados por jogo comparados com a média da liga. Na média, vale 78. */
export function notaDeAtaque(linha: LinhaClassificacao, media: number) {
  if (linha.jogos === 0 || media === 0) return 50
  return limitarNota(50 + (linha.golsPro / linha.jogos / media) * 28)
}

/** Defesa: quanto menos gols sofridos por jogo em relação à média, maior. Na média, vale 78. */
export function notaDeDefesa(linha: LinhaClassificacao, media: number) {
  if (linha.jogos === 0 || media === 0) return 50
  const sofridos = Math.max(linha.golsContra / linha.jogos, 0.1)
  return limitarNota(50 + (media / sofridos) * 28)
}

/** Nota do jogador pelos gols por jogo. Sem o número de jogos, usa só os gols. */
export function notaDoJogador(artilheiro: Artilheiro) {
  if (artilheiro.jogos) return limitarNota(60 + (artilheiro.gols / artilheiro.jogos) * 45)
  return limitarNota(55 + artilheiro.gols * 2)
}

export type Atributo = { rotulo: string; nota: number | null; cor: string }

/** Atributos do card do jogador. Fica sem nota (null) o que depende de um dado que a API não trouxe. */
export function atributosDoJogador(artilheiro: Artilheiro): Atributo[] {
  const { gols, jogos, assistencias, penaltis } = artilheiro
  return [
    { rotulo: 'FINALIZAÇÃO', nota: jogos ? limitarNota(50 + (gols / jogos) * 70) : null, cor: 'bg-forte' },
    { rotulo: 'PASSE', nota: assistencias === null ? null : limitarNota(50 + assistencias * 6), cor: 'bg-azul' },
    { rotulo: 'PÊNALTI', nota: penaltis === null ? null : penaltis ? limitarNota(55 + penaltis * 10) : 40, cor: 'bg-laranja' },
    { rotulo: 'PRESENÇA', nota: jogos ? limitarNota(50 + jogos * 1.6) : null, cor: 'bg-verde' },
  ]
}
