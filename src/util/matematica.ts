import type { SituacaoMatematica } from '../api/tipos'
import { ZONAS } from '../config'

export type Selo = { texto: string; tom: 'bom' | 'ruim' | 'neutro' }

const rebaixamento = ZONAS.find((z) => z.nome === 'Rebaixamento')!
const libertadores = ZONAS.find((z) => z.nome === 'Libertadores')!
const sulAmericana = ZONAS.find((z) => z.nome === 'Sul-Americana')!

/** Última posição fora do rebaixamento (16ª no Brasileirão). */
export const ULTIMA_POSICAO_SEGURA = rebaixamento.de - 1

/** O que já está decidido para o time, do mais importante ao menos. */
export function selosMatematicos(s: SituacaoMatematica): Selo[] {
  if (s.piorPosicaoPossivel === 1) return [{ texto: 'Campeão', tom: 'bom' }]
  if (s.melhorPosicaoPossivel >= rebaixamento.de) return [{ texto: 'Rebaixado', tom: 'ruim' }]

  const selos: Selo[] = []
  if (s.piorPosicaoPossivel <= libertadores.ate) selos.push({ texto: 'Garantido na Libertadores', tom: 'bom' })
  else if (s.piorPosicaoPossivel <= sulAmericana.ate) selos.push({ texto: 'Garantido em copa continental', tom: 'bom' })
  else if (s.piorPosicaoPossivel <= ULTIMA_POSICAO_SEGURA) selos.push({ texto: 'Livre do rebaixamento', tom: 'bom' })

  if (s.melhorPosicaoPossivel > 1 && s.jogosRestantes > 0) selos.push({ texto: 'Sem chance de título', tom: 'neutro' })
  if (s.melhorPosicaoPossivel > libertadores.ate) selos.push({ texto: 'Fora da Libertadores direta', tom: 'neutro' })
  return selos
}

export type Meta = {
  rotulo: string
  /** Total de pontos que garante a meta, sem depender de ninguém. */
  pontos: number
  /** Quantos pontos ainda faltam (0 = já garantido). */
  faltam: number
  /** Máximo de pontos que o time ainda pode somar. */
  maximo: number
  /** Se o time ainda consegue a meta sozinho, somando todos os pontos que disputa. */
  dependeSoDele: boolean
  /** Já não dá mais para alcançar, nem com ajuda. */
  impossivel: boolean
}

/** Metas principais: título, Libertadores e fugir do rebaixamento. */
export function metas(s: SituacaoMatematica): Meta[] {
  const meta = (rotulo: string, ate: number): Meta => {
    const pontos = s.pontosParaGarantir[ate - 1] ?? 0
    return {
      rotulo,
      pontos,
      faltam: Math.max(0, pontos - s.pontos),
      maximo: s.pontosMaximos,
      dependeSoDele: pontos <= s.pontosMaximos,
      impossivel: s.melhorPosicaoPossivel > ate,
    }
  }

  return [
    meta('Título', 1),
    meta('Libertadores', libertadores.ate),
    meta('Fugir do rebaixamento', ULTIMA_POSICAO_SEGURA),
  ]
}
