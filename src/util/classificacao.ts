import type { LinhaClassificacao, Resultado, Time } from '../api/tipos'

/** Um jogo com placar: disputado de verdade ou palpitado no simulador. */
export type JogoComPlacar = {
  mandanteId: number
  visitanteId: number
  golsMandante: number
  golsVisitante: number
  /** Para a ordem dos últimos resultados; basta ser comparável (ex.: data ISO). */
  data: string
}

const QUANTIDADE_ULTIMOS = 5

/**
 * Monta a tabela no navegador com os mesmos critérios da api-sumula (CalculadoraClassificacao):
 * pontos, vitórias, saldo, gols pró, confronto direto (só entre dois clubes) e, por último, o nome.
 */
export function calcularClassificacao(times: Time[], jogos: JogoComPlacar[]): LinhaClassificacao[] {
  const ordenados = [...jogos].sort((a, b) => a.data.localeCompare(b.data))

  const linhas = times.map((time) => {
    let vitorias = 0
    let empates = 0
    let derrotas = 0
    let golsPro = 0
    let golsContra = 0
    const resultados: Resultado[] = []

    for (const jogo of ordenados) {
      if (jogo.mandanteId !== time.id && jogo.visitanteId !== time.id) continue
      const [pro, contra] =
        jogo.mandanteId === time.id ? [jogo.golsMandante, jogo.golsVisitante] : [jogo.golsVisitante, jogo.golsMandante]
      golsPro += pro
      golsContra += contra
      if (pro > contra) {
        vitorias++
        resultados.push('vitoria')
      } else if (pro === contra) {
        empates++
        resultados.push('empate')
      } else {
        derrotas++
        resultados.push('derrota')
      }
    }

    const jogosDisputados = vitorias + empates + derrotas
    const pontos = vitorias * 3 + empates
    return {
      posicao: 0,
      time,
      pontos,
      jogos: jogosDisputados,
      vitorias,
      empates,
      derrotas,
      golsPro,
      golsContra,
      saldo: golsPro - golsContra,
      aproveitamento: jogosDisputados === 0 ? 0 : Math.round((pontos * 1000) / (jogosDisputados * 3)) / 10,
      ultimosResultados: resultados.slice(-QUANTIDADE_ULTIMOS),
    } satisfies LinhaClassificacao
  })

  const chave = (l: LinhaClassificacao) => `${l.pontos}|${l.vitorias}|${l.saldo}|${l.golsPro}`
  const grupos = new Map<string, LinhaClassificacao[]>()
  for (const linha of linhas) grupos.set(chave(linha), [...(grupos.get(chave(linha)) ?? []), linha])

  const ordenadas = [...grupos.values()]
    .sort(
      ([a], [b]) => b.pontos - a.pontos || b.vitorias - a.vitorias || b.saldo - a.saldo || b.golsPro - a.golsPro,
    )
    .flatMap((grupo) => desempatar(grupo, ordenados))

  return ordenadas.map((linha, indice) => ({ ...linha, posicao: indice + 1 }))
}

function desempatar(grupo: LinhaClassificacao[], jogos: JogoComPlacar[]) {
  // Nome completo, como na api-sumula.
  const porNome = [...grupo].sort((a, b) => a.time.nome.localeCompare(b.time.nome, 'pt-BR'))
  if (grupo.length !== 2) return porNome

  const [a, b] = grupo
  let pontosA = 0
  let pontosB = 0
  for (const jogo of jogos) {
    const entreOsDois =
      (jogo.mandanteId === a.time.id && jogo.visitanteId === b.time.id) ||
      (jogo.mandanteId === b.time.id && jogo.visitanteId === a.time.id)
    if (!entreOsDois) continue
    const golsA = jogo.mandanteId === a.time.id ? jogo.golsMandante : jogo.golsVisitante
    const golsB = jogo.mandanteId === b.time.id ? jogo.golsMandante : jogo.golsVisitante
    if (golsA > golsB) pontosA += 3
    else if (golsB > golsA) pontosB += 3
    else {
      pontosA++
      pontosB++
    }
  }

  if (pontosA === pontosB) return porNome
  return pontosA > pontosB ? [a, b] : [b, a]
}
