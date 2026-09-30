import { useSearchParams } from 'react-router'
import { useEvolucao, useTimes } from '../api/consultas'
import type { EvolucaoTime, Time } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { COR_FUNDO } from '../componentes/coresSeries'
import { GraficoComparativo, type Medida, type SerieTime } from '../componentes/GraficoComparativo'
import { useAnimacao } from '../util/animacao'
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
  const { progresso, repetir } = useAnimacao(evolucao.data !== undefined && times.data !== undefined)

  const estado =
    evolucao.isPending || times.isPending ? (
      <Carregando />
    ) : evolucao.isError || times.isError ? (
      <Erro tentarDeNovo={() => evolucao.refetch()} />
    ) : evolucao.data.every((e) => e.rodadas.length === 0) ? (
      <Vazio>O gráfico aparece depois da primeira rodada.</Vazio>
    ) : null
  if (estado || !evolucao.data || !times.data) return <Pagina className="pt-9 pb-12">{estado}</Pagina>

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
    <Pagina className="pt-9 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <TituloPagina>Evolução</TituloPagina>
          <p className="mt-3.5 text-[15px] text-texto-2">Compare até {MAXIMO_TIMES} times rodada a rodada.</p>
        </div>
        <Abas
          rotulo="Medida"
          opcoes={MEDIDAS}
          valor={medida}
          aoMudar={(v) => {
            atualizar('medida', v === 'posicao' ? null : v)
            repetir()
          }}
        />
      </div>

      <section className="mt-6 border-2 border-texto bg-superficie px-3.5 pt-[18px] pb-2.5">
        {series.length > 0 && (
          <ul className="flex flex-wrap gap-x-[18px] gap-y-2 px-1.5 pb-2.5 text-[13px] font-bold">
            {series.map((s) => (
              <li key={s.time.id} className="flex items-center gap-1.5">
                <span className={`inline-block h-[3px] w-3.5 ${COR_FUNDO[s.vaga]}`} />
                {s.time.nomeCurto}
              </li>
            ))}
          </ul>
        )}

        <GraficoComparativo series={series} medida={medida} quantidadeTimes={times.data.lista.length} progresso={progresso} />

        {series.length > 0 && (
          <details className="mt-2 border-t border-borda px-1.5 pt-2 text-sm">
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
      </section>

      <section className="mt-[18px] border-2 border-texto bg-superficie p-[18px]">
        <Rotulo className="mb-3.5 text-texto-2">
          <h2>
            TIMES ({series.length} DE {MAXIMO_TIMES})
          </h2>
        </Rotulo>
        <div className="flex flex-wrap gap-2">
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
                className={`flex cursor-pointer items-center gap-2 border-2 px-3 py-[7px] text-[13px] font-bold text-texto transition-[translate,scale,background-color] duration-150 enabled:hover:-translate-y-0.5 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                  selecionado ? 'border-texto bg-superficie-2' : 'border-borda bg-superficie'
                }`}
              >
                <span className={`inline-block size-2.5 rounded-full ${selecionado ? COR_FUNDO[vaga] : 'bg-borda'}`} />
                {time.nomeCurto}
              </button>
            )
          })}
        </div>
        {cheia && (
          <p className="mt-3.5 text-xs text-texto-2">
            Limite de {MAXIMO_TIMES} times. Tire um para escolher outro.
          </p>
        )}
      </section>
    </Pagina>
  )
}
