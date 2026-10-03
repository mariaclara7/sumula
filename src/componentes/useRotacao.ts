import { useEffect, useState } from 'react'
import { movimentoReduzido } from '../util/animacao'

/** Fase da troca: o item atual sai, o próximo entra (sem transição) e depois assenta. */
export type FaseRotacao = 'dentro' | 'saindo' | 'entrando'

const SAIDA = 300

/**
 * Passa sozinho pelos itens de um carrossel, a cada "duracao" ms. Pausa enquanto o mouse ou o foco estão
 * nele, e não anda sozinho com "reduzir movimento" ligado (aí a pessoa troca pelos botões).
 * "volta" muda a cada novo ciclo, para a barra de progresso recomeçar junto com o tempo.
 */
export function useRotacao(total: number, duracao: number) {
  const [indice, setIndice] = useState(0)
  const [proximo, setProximo] = useState(0)
  const [fase, setFase] = useState<FaseRotacao>('dentro')
  const [pausado, setPausado] = useState(false)
  const [volta, setVolta] = useState(0)
  const [reduzido] = useState(movimentoReduzido)
  const automatico = !reduzido && total > 1

  // Saída -> troca o conteúdo -> entrada.
  useEffect(() => {
    if (fase === 'saindo') {
      const tempo = setTimeout(() => {
        setIndice(proximo)
        setFase('entrando')
        setVolta((v) => v + 1)
      }, SAIDA)
      return () => clearTimeout(tempo)
    }
    if (fase === 'entrando') {
      const quadro = requestAnimationFrame(() => requestAnimationFrame(() => setFase('dentro')))
      return () => cancelAnimationFrame(quadro)
    }
  }, [fase, proximo])

  // Avança sozinho.
  useEffect(() => {
    if (!automatico || pausado || fase !== 'dentro') return
    const tempo = setTimeout(() => {
      setProximo((indice + 1) % total)
      setFase('saindo')
    }, duracao)
    return () => clearTimeout(tempo)
  }, [automatico, pausado, fase, indice, total, duracao, volta])

  function ir(destino: number) {
    if (total === 0) return
    const alvo = ((destino % total) + total) % total
    if (alvo === indice || fase !== 'dentro') return
    if (reduzido) {
      setIndice(alvo)
      setVolta((v) => v + 1)
      return
    }
    setProximo(alvo)
    setFase('saindo')
  }

  // Se a lista encolher (ex.: um card de sequência sumiu), volta para o começo.
  const atual = indice < total ? indice : 0

  return {
    indice: atual,
    fase,
    volta,
    pausado: pausado || !automatico,
    automatico,
    ir,
    anterior: () => ir(atual - 1),
    seguinte: () => ir(atual + 1),
    pausar: () => setPausado(true),
    retomar: () => {
      setPausado(false)
      setVolta((v) => v + 1)
    },
  }
}
