import { Link, useParams } from 'react-router'
import { useProbabilidades, useResumoTime, useTimes } from '../api/consultas'
import type { LinhaClassificacao } from '../api/tipos'
import { BarraChance } from '../componentes/BarraChance'
import { Cartao } from '../componentes/Cartao'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { FormaRecente } from '../componentes/FormaRecente'
import { GraficoEvolucao } from '../componentes/GraficoEvolucao'
import { GraficoPosicoesFinais } from '../componentes/GraficoPosicoesFinais'
import { ListaPartidas } from '../componentes/ListaPartidas'
import { FAIXAS_CHANCES, chanceNaFaixa } from '../config'
import { formatarPercentual, formatarSaldo } from '../util/formato'

export function PaginaTime() {
  const timeId = Number(useParams().timeId)
  const resumo = useResumoTime(timeId)
  const times = useTimes()

  if (resumo.isPending || times.isPending) return <Carregando />
  if (resumo.isError || times.isError) {
    return (resumo.error as { status?: number } | null)?.status === 404 ? (
      <Vazio>Time não encontrado nesta competição.</Vazio>
    ) : (
      <Erro tentarDeNovo={() => resumo.refetch()} />
    )
  }

  const { time, geral } = resumo.data
  const recortes: [string, LinhaClassificacao][] = [
    ['Geral', resumo.data.geral],
    ['Em casa', resumo.data.casa],
    ['Fora', resumo.data.fora],
    ['1º turno', resumo.data.primeiroTurno],
    ['2º turno', resumo.data.segundoTurno],
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Escudo time={time} tamanho="g" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{time.nome}</h1>
          <Link to={`/confronto?a=${time.id}`} className="text-sm text-destaque hover:underline">
            Comparar com outro time →
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicador rotulo="Posição" valor={`${geral.posicao}º`} />
        <Indicador rotulo="Pontos" valor={String(geral.pontos)} />
        <Indicador rotulo="Aproveitamento" valor={formatarPercentual(geral.aproveitamento)} />
        <Indicador rotulo="Saldo de gols" valor={formatarSaldo(geral.saldo)} />
      </dl>

      <Cartao titulo="Posição rodada a rodada">
        <GraficoEvolucao pontos={resumo.data.evolucao} quantidadeTimes={times.data.lista.length} nomeTime={time.nomeCurto} />
      </Cartao>

      <ChancesDoTime timeId={time.id} nomeTime={time.nomeCurto} />

      <Cartao titulo="Desempenho">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm tabular-nums">
            <thead className="border-b border-borda text-xs text-texto-3">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-medium">Recorte</th>
                <th scope="col" className="px-2 py-2 font-medium">Pontos</th>
                <th scope="col" className="px-2 py-2 font-medium">Jogos</th>
                <th scope="col" className="px-2 py-2 font-medium">V-E-D</th>
                <th scope="col" className="px-2 py-2 font-medium">Gols</th>
                <th scope="col" className="px-2 py-2 font-medium">Aproveitamento</th>
                <th scope="col" className="px-2 py-2 font-medium">Últimos 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda text-center">
              {recortes.map(([rotulo, linha]) => (
                <tr key={rotulo}>
                  <th scope="row" className="px-4 py-2 text-left font-medium">{rotulo}</th>
                  <td className="px-2 py-2 font-bold">{linha.pontos}</td>
                  <td className="px-2 py-2">{linha.jogos}</td>
                  <td className="px-2 py-2">{`${linha.vitorias}-${linha.empates}-${linha.derrotas}`}</td>
                  <td className="px-2 py-2">{`${linha.golsPro}:${linha.golsContra}`}</td>
                  <td className="px-2 py-2">{formatarPercentual(linha.aproveitamento)}</td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center">
                      <FormaRecente resultados={linha.ultimosResultados} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>

      <div className="grid gap-4 md:grid-cols-2">
        <Cartao titulo="Últimos jogos">
          <ListaPartidas partidas={resumo.data.ultimasPartidas} times={times.data.porId} vazio="Nenhum jogo disputado." />
        </Cartao>
        <Cartao titulo="Próximos jogos">
          <ListaPartidas partidas={resumo.data.proximasPartidas} times={times.data.porId} vazio="Nenhum jogo agendado." />
        </Cartao>
      </div>
    </div>
  )
}

function ChancesDoTime({ timeId, nomeTime }: { timeId: number; nomeTime: string }) {
  const { data, isPending, isError } = useProbabilidades()
  const chances = data?.times.find((t) => t.time.id === timeId)

  if (isError) return null

  return (
    <Cartao titulo="Chances até o fim do campeonato">
      {isPending || !chances ? (
        <Carregando />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-4 py-4 sm:grid-cols-3 lg:grid-cols-6">
            {FAIXAS_CHANCES.map((faixa) => (
              <div key={faixa.nome}>
                <dt className="mb-1 text-xs text-texto-3">{faixa.nome}</dt>
                <dd className="text-lg font-semibold">
                  <BarraChance chance={chanceNaFaixa(chances.posicoes, faixa)} cor={faixa.cor} alinhamento="esquerda" />
                </dd>
              </div>
            ))}
            <div>
              <dt className="mb-1 text-xs text-texto-3">Pontos esperados</dt>
              <dd className="text-lg font-semibold tabular-nums">{Math.round(chances.pontosEsperados)}</dd>
            </div>
          </dl>
          <h3 className="border-t border-borda px-4 pt-3 text-xs font-medium text-texto-3">Posição final</h3>
          <GraficoPosicoesFinais posicoes={chances.posicoes} nomeTime={nomeTime} />
        </>
      )}
      <p className="border-t border-borda px-4 py-2 text-xs text-texto-3">
        Baseado em {data?.simulacoes.toLocaleString('pt-BR') ?? 'milhares de'} simulações dos jogos restantes.{' '}
        <Link to="/chances" className="text-destaque hover:underline">
          Ver todos os times
        </Link>
      </p>
    </Cartao>
  )
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-borda bg-superficie px-4 py-3">
      <dt className="text-xs text-texto-3">{rotulo}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}
