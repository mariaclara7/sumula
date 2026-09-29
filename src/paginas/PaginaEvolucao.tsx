import { useSearchParams } from 'react-router'
import { useEvolucao, useTimes } from '../api/consultas'
import type { EvolucaoTime, Time } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { Cartao } from '../componentes/Cartao'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { COR_FUNDO } from '../componentes/coresSeries'
import { GraficoComparativo, type Medida, type SerieTime } from '../componentes/GraficoComparativo'
import { MAXIMO_TIMES, alternar, escreverSelecao, lerSelecao, type Selecao } from '../util/selecao'

const MEDIDAS: { valor: Medida; rotulo: string }[] = [
  { valor: 'posicao', rotulo: 'Posição' },
  { valor: 'pontos', rotulo: 'Pontos' },
]

/** Sem escolha na URL, começa pelos quatro primeiros da tabela. */
function selecaoPadrao(evolucao: EvolucaoTime[]): Selecao {
  const primeiros = [...evolucao]
    .filter((e) => e.rodadas.length > 0)
    .sort((a, b) => a.rodadas[a.rodadas.length - 1].posicao - b.rodadas[b.rodadas.length - 1].posicao)
    .slice(0, 4)
    .map((e) => e.timeId)
  return [...primeiros, ...Array(MAXIMO_TIMES - primeiros.length).fill(null)]
}

export function PaginaEvolucao() {
  const [busca, setBusca] = useSearchParams()
  const evolucao = useEvolucao()
  const times = useTimes()
  const medida: Medida = busca.get('medida') === 'pontos' ? 'pontos' : 'posicao'

  if (evolucao.isPending || times.isPending) return <Carregando />
  if (evolucao.isError || times.isError) return <Erro tentarDeNovo={() => evolucao.refetch()} />
  if (evolucao.data.every((e) => e.rodadas.length === 0)) return <Vazio>O gráfico aparece depois da primeira rodada.</Vazio>

  const selecao = busca.has('times') ? lerSelecao(busca.get('times')) : selecaoPadrao(evolucao.data)
  const porTime = new Map(evolucao.data.map((e) => [e.timeId, e.rodadas]))

  const series: SerieTime[] = selecao.flatMap((timeId, vaga) => {
    const time = timeId === null ? undefined : times.data.porId.get(timeId)
    return time ? [{ time, vaga, pontos: porTime.get(time.id) ?? [] }] : []
  })

  function atualizar(chave: string, valor: string | null) {
    setBusca(
      (atual) => {
        if (valor === null) atual.delete(chave)
        else atual.set(chave, valor)
        return atual
      },
      { replace: true },
    )
  }

  // Ordem do seletor: a tabela atual.
  const ultimaPosicao = (time: Time) => porTime.get(time.id)?.at(-1)?.posicao ?? Number.MAX_SAFE_INTEGER
  const opcoes = [...times.data.lista].sort((a, b) => ultimaPosicao(a) - ultimaPosicao(b))
  const cheia = !selecao.includes(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evolução</h1>
          <p className="mt-1 text-sm text-texto-2">Compare até {MAXIMO_TIMES} times rodada a rodada.</p>
        </div>
        <Abas
          rotulo="Medida"
          opcoes={MEDIDAS}
          valor={medida}
          aoMudar={(v) => atualizar('medida', v === 'posicao' ? null : v)}
        />
      </div>

      <Cartao>
        {series.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 px-4 pt-3 text-xs text-texto-2">
            {series.map((s) => (
              <li key={s.time.id} className="flex items-center gap-1.5">
                <span className={`inline-block h-0.5 w-3 rounded ${COR_FUNDO[s.vaga]}`} />
                {s.time.nomeCurto}
              </li>
            ))}
          </ul>
        )}

        <GraficoComparativo series={series} medida={medida} quantidadeTimes={times.data.lista.length} />

        {series.length > 0 && (
          <details className="border-t border-borda px-4 py-2 text-sm">
            <summary className="cursor-pointer text-texto-2">Ver dados em tabela</summary>
            <div className="max-h-72 overflow-auto">
              <table className="mt-2 w-full text-center tabular-nums">
                <thead className="text-xs text-texto-3">
                  <tr>
                    <th className="py-1 font-medium">Rodada</th>
                    {series.map((s) => (
                      <th key={s.time.id} className="px-2 py-1 font-medium">
                        {s.time.sigla}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(series.reduce((maior, s) => (s.pontos.length > maior.length ? s.pontos : maior), series[0].pontos)).map(
                    ({ rodada }) => (
                      <tr key={rodada}>
                        <td className="py-0.5">{rodada}</td>
                        {series.map((s) => {
                          const ponto = s.pontos.find((p) => p.rodada === rodada)
                          return (
                            <td key={s.time.id} className="px-2 py-0.5">
                              {ponto ? (medida === 'posicao' ? `${ponto.posicao}º` : ponto.pontos) : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </Cartao>

      <Cartao titulo={`Times (${series.length} de ${MAXIMO_TIMES})`}>
        <div className="flex flex-wrap gap-2 p-4">
          {opcoes.map((time) => {
            const vaga = selecao.indexOf(time.id)
            const selecionado = vaga >= 0
            return (
              <button
                key={time.id}
                type="button"
                aria-pressed={selecionado}
                disabled={!selecionado && cheia}
                onClick={() => atualizar('times', escreverSelecao(alternar(selecao, time.id)))}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  selecionado
                    ? 'border-texto-3 bg-superficie-2 font-medium text-texto'
                    : 'border-borda text-texto-2 enabled:hover:border-texto-3 enabled:hover:text-texto'
                }`}
              >
                {selecionado && <span className={`inline-block size-2.5 rounded-full ${COR_FUNDO[vaga]}`} />}
                {time.nomeCurto}
              </button>
            )
          })}
        </div>
        {cheia && (
          <p className="border-t border-borda px-4 py-2 text-xs text-texto-3">
            Limite de {MAXIMO_TIMES} times. Tire um para escolher outro.
          </p>
        )}
      </Cartao>
    </div>
  )
}
