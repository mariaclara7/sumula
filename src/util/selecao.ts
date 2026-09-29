/**
 * Seleção de times para comparar. Cada time ocupa uma "vaga" fixa, e a vaga define a cor.
 * Assim, tirar um time não repinta os outros: a cor acompanha o time, não a ordem na lista.
 */
export type Selecao = (number | null)[]

export const MAXIMO_TIMES = 5

/** Lê "12,,7" (vaga do meio vazia) da URL. Ignora ids inválidos e repetidos. */
export function lerSelecao(valor: string | null, maximo = MAXIMO_TIMES): Selecao {
  const vagas: Selecao = Array(maximo).fill(null)
  const vistos = new Set<number>()

  ;(valor ?? '').split(',').slice(0, maximo).forEach((parte, indice) => {
    const id = Number(parte)
    if (parte !== '' && Number.isInteger(id) && id > 0 && !vistos.has(id)) {
      vagas[indice] = id
      vistos.add(id)
    }
  })

  return vagas
}

/** Escreve para a URL, sem as vagas vazias do fim. */
export function escreverSelecao(selecao: Selecao) {
  const ultima = selecao.findLastIndex((id) => id !== null)
  return selecao
    .slice(0, ultima + 1)
    .map((id) => id ?? '')
    .join(',')
}

/** Tira o time se já estiver selecionado; senão ocupa a primeira vaga livre (se houver). */
export function alternar(selecao: Selecao, timeId: number): Selecao {
  const indice = selecao.indexOf(timeId)
  if (indice >= 0) return selecao.map((id, i) => (i === indice ? null : id))

  const livre = selecao.indexOf(null)
  if (livre < 0) return selecao
  return selecao.map((id, i) => (i === livre ? timeId : id))
}
