import { Link, useParams } from 'react-router'
import { usePalpites, useProbabilidades, useResumoTime, useTempos, useTimes } from '../api/consultas'
import type { LinhaClassificacao } from '../api/tipos'
import { Cartao } from '../componentes/Cartao'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { FormaRecente } from '../componentes/FormaRecente'
import { GraficoEvolucao } from '../componentes/GraficoEvolucao'
import { GraficoFaixas } from '../componentes/GraficoFaixas'
import { GraficoPosicoesFinais } from '../componentes/GraficoPosicoesFinais'
import { ListaPartidas } from '../componentes/ListaPartidas'
import { MatrizIntervalo } from '../componentes/MatrizIntervalo'
import { NumerosDoTime } from '../componentes/NumerosDoTime'
import { Pagina } from '../componentes/Pagina'
import { Rotulo } from '../componentes/TituloPagina'
import { FAIXAS_CHANCES, chanceNaFaixa } from '../config'
import { contar, useAnimacao } from '../util/animacao'
import { coresDoTime } from '../util/cores'
import { formatarChance, formatarPercentual, formatarSaldo } from '../util/formato'
import { faixaDaNota, notaDoTime } from '../util/notas'

// Cor da barra de cada faixa; a do título usa a cor do texto, como no design.
const COR_FAIXA: Record<string, string> = { Título: 'bg-texto' }

export function PaginaTime() {
  const timeId = Number(useParams().timeId)
  const resumo = useResumoTime(timeId)
  const times = useTimes()
  const palpites = usePalpites()
  const { progresso } = useAnimacao(resumo.data !== undefined && times.data !== undefined)

  if (resumo.isPending || times.isPending) return <Pagina className="pt-9 pb-12"><Carregando /></Pagina>
  if (resumo.isError || times.isError) {
    return (
      <Pagina className="pt-9 pb-12">
        {(resumo.error as { status?: number } | null)?.status === 404 ? (
          <Vazio>Time não encontrado nesta competição.</Vazio>
        ) : (
          <Erro tentarDeNovo={() => resumo.refetch()} />
        )}
      </Pagina>
    )
  }

  const { time, geral } = resumo.data
  const cores = coresDoTime(time)
  const nota = notaDoTime(geral.aproveitamento)
  const recortes: [string, LinhaClassificacao][] = [
    ['Geral', resumo.data.geral],
    ['Em casa', resumo.data.casa],
    ['Fora', resumo.data.fora],
    ['1º turno', resumo.data.primeiroTurno],
    ['2º turno', resumo.data.segundoTurno],
  ]
  const quantidadeTimes = times.data.lista.length

  return (
    <div>
      <div className="transition-colors duration-300" style={{ background: cores.principal, color: cores.secundaria }}>
        <Pagina className="flex flex-wrap items-center gap-5 py-8">
          <Escudo
            time={time}
            tamanho={88}
            circulo
            invertido
            contorno={`0 0 0 4px ${cores.principal}, 0 0 0 6px ${cores.secundaria}`}
          />
          <div className="min-w-[200px] flex-1">
            <div className="font-mono text-xs font-extrabold tracking-[2px] opacity-75">
              OVR {contar(nota, progresso)} · {faixaDaNota(nota).nome}
            </div>
            {/* Nomes como "Athletico Paranaense" não cabem em 40px num celular: o tamanho acompanha a tela. */}
            <h1 className="mt-1.5 text-[clamp(22px,7.5vw,40px)] leading-[.9] font-black tracking-[-2px] break-words hyphens-auto uppercase md:text-[64px]">
              {time.nomeCurto}
            </h1>
          </div>
          <Link
            to={`/confronto?a=${time.id}`}
            className="border-2 border-grafite bg-lima px-4 py-3 text-sm font-extrabold text-grafite shadow-[4px_4px_0_#111] transition-[translate,box-shadow] duration-75 hover:text-grafite active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Comparar com outro time →
          </Link>
        </Pagina>
      </div>

      <Pagina className="flex flex-col gap-[18px] pt-6 pb-12">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Indicador
            rotulo="POSIÇÃO"
            valor={`${Math.max(1, Math.round(quantidadeTimes - (quantidadeTimes - geral.posicao) * progresso))}º`}
          />
          <Indicador rotulo="PONTOS" valor={String(contar(geral.pontos, progresso))} />
          <Indicador rotulo="APROVEITAMENTO" valor={formatarPercentual(Math.round(geral.aproveitamento * progresso * 10) / 10)} />
          <Indicador rotulo="SALDO DE GOLS" valor={formatarSaldo(contar(geral.saldo, progresso))} />
        </dl>

        <Cartao titulo="Posição rodada a rodada">
          <div className="px-2.5 pt-3 pb-1.5">
            <GraficoEvolucao
              pontos={resumo.data.evolucao}
              quantidadeTimes={quantidadeTimes}
              nomeTime={time.nomeCurto}
              progresso={progresso}
            />
          </div>
          <Link
            to={`/evolucao?times=${time.id}`}
            className="block border-t border-borda px-4 py-3 text-[13px] font-bold text-destaque hover:underline"
          >
            Comparar a evolução com outros times →
          </Link>
        </Cartao>

        <ChancesDoTime timeId={time.id} nomeTime={time.nomeCurto} progresso={progresso} />

        <Cartao titulo="Desempenho">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-center">
              <thead className="font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2">
                <tr className="h-[34px]">
                  <th scope="col" className="px-4 text-left font-extrabold">RECORTE</th>
                  <th scope="col" className="w-[70px] font-extrabold">PTS</th>
                  <th scope="col" className="w-[60px] font-extrabold">J</th>
                  <th scope="col" className="w-20 font-extrabold">V-E-D</th>
                  <th scope="col" className="w-[70px] font-extrabold">GOLS</th>
                  <th scope="col" className="w-[110px] font-extrabold">APROV.</th>
                  <th scope="col" className="w-[150px] pr-4 font-extrabold">ÚLTIMOS 5</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px] font-medium">
                {recortes.map(([rotulo, linha]) => (
                  <tr key={rotulo} className="h-[46px] border-t border-borda">
                    <th scope="row" className="px-4 text-left font-sans text-base font-bold">{rotulo}</th>
                    <td className="font-sans text-lg font-black">{linha.pontos}</td>
                    <td>{linha.jogos}</td>
                    <td>{`${linha.vitorias}-${linha.empates}-${linha.derrotas}`}</td>
                    <td>{`${linha.golsPro}:${linha.golsContra}`}</td>
                    <td>{formatarPercentual(linha.aproveitamento)}</td>
                    <td className="pr-4">
                      <div className="flex justify-center">
                        <FormaRecente resultados={linha.ultimosResultados} tamanho="m" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>

        <NumerosDoTime timeId={time.id} />

        <TemposDoTime timeId={time.id} nomeTime={time.nomeCurto} />

        <div className="grid gap-[18px] md:grid-cols-2">
          <Cartao titulo="Últimos jogos">
            <ListaPartidas
              partidas={resumo.data.ultimasPartidas}
              times={times.data.porId}
              perspectiva={time.id}
              vazio="Nenhum jogo disputado."
            />
          </Cartao>
          <Cartao titulo="Próximos jogos">
            <ListaPartidas
              partidas={resumo.data.proximasPartidas}
              times={times.data.porId}
              palpites={palpites.data}
              vazio="Nenhum jogo agendado."
            />
          </Cartao>
        </div>
      </Pagina>
    </div>
  )
}

function ChancesDoTime({ timeId, nomeTime, progresso }: { timeId: number; nomeTime: string; progresso: number }) {
  const { data, isPending, isError } = useProbabilidades()
  const chances = data?.times.find((t) => t.time.id === timeId)

  if (isError) return null

  return (
    <Cartao titulo="Chances até o fim do campeonato">
      {isPending || !chances ? (
        <Carregando />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 p-4 md:grid-cols-6">
            {FAIXAS_CHANCES.map((faixa) => {
              const chance = chanceNaFaixa(chances.posicoes, faixa)
              return (
                <div key={faixa.nome}>
                  <dt className="text-xs text-texto-2">{faixa.nome}</dt>
                  <dd className="mt-0.5 mb-1.5 text-[26px] font-black">{formatarChance(chance)}</dd>
                  <dd className="h-1.5 bg-superficie-2">
                    {chance > 0 && (
                      <div
                        className={`h-full ${COR_FAIXA[faixa.nome] ?? faixa.cor}`}
                        style={{ width: `max(${chance * 100 * progresso}%, 2px)` }}
                      />
                    )}
                  </dd>
                </div>
              )
            })}
            <div>
              <dt className="text-xs text-texto-2">Pontos esperados</dt>
              <dd className="mt-0.5 text-[26px] font-black tabular-nums">{contar(chances.pontosEsperados, progresso)}</dd>
            </div>
          </dl>
          <div className="px-4 pt-1.5 pb-4">
            <Rotulo className="mb-2.5 text-[11px] tracking-[1.5px] text-texto-2">
              <h3>POSIÇÃO FINAL</h3>
            </Rotulo>
            <GraficoPosicoesFinais posicoes={chances.posicoes} nomeTime={nomeTime} progresso={progresso} />
            <p className="mt-3 text-xs text-texto-2">
              Baseado em {data.simulacoes.toLocaleString('pt-BR')} simulações dos jogos restantes.{' '}
              <Link to="/chances" className="font-bold text-destaque hover:underline">
                Ver todos os times
              </Link>
            </p>
          </div>
        </>
      )}
    </Cartao>
  )
}

function TemposDoTime({ timeId, nomeTime }: { timeId: number; nomeTime: string }) {
  const { data, isPending, isError } = useTempos()
  const tempos = data?.times.find((t) => t.time.id === timeId)

  if (isError || (data && (!tempos || tempos.jogos === 0))) return null

  return (
    <Cartao titulo="1º x 2º tempo">
      {isPending || !tempos ? (
        <Carregando />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-6">
            <Destaque
              rotulo="Gols no 1º tempo"
              valor={`${tempos.golsProPrimeiroTempo}:${tempos.golsContraPrimeiroTempo}`}
              detalhe="marcados : sofridos"
            />
            <Destaque
              rotulo="Gols no 2º tempo"
              valor={`${tempos.golsProSegundoTempo}:${tempos.golsContraSegundoTempo}`}
              detalhe="marcados : sofridos"
            />
            <Destaque
              rotulo="Pontos depois do intervalo"
              valor={formatarSaldo(tempos.pontosDepoisDoIntervalo)}
              detalhe={`${tempos.pontosNoIntervalo} no intervalo → ${tempos.pontos} no fim`}
              cor={
                tempos.pontosDepoisDoIntervalo > 0
                  ? 'text-verde'
                  : tempos.pontosDepoisDoIntervalo < 0
                    ? 'text-vermelho'
                    : undefined
              }
            />
            <Destaque rotulo="Viradas" valor={`${tempos.viradasAFavor} / ${tempos.viradasContra}`} detalhe="a favor / sofridas" />
            <Destaque
              rotulo="Pontos cedidos vencendo"
              valor={String(tempos.pontosPerdidosVencendo)}
              detalhe="em jogos que vencia no intervalo"
            />
            <Destaque
              rotulo="Pontos buscados perdendo"
              valor={String(tempos.pontosConquistadosPerdendo)}
              detalhe="em jogos que perdia no intervalo"
            />
          </dl>

          <div className="border-t border-borda px-2 py-3 sm:px-4">
            <MatrizIntervalo transicoes={tempos.transicoes} />
          </div>

          {tempos.faixas && data && (
            <div className="border-t border-borda">
              <Rotulo className="px-4 pt-3 text-[11px] tracking-[1.5px] text-texto-2">
                <h3>GOLS POR FAIXA DE MINUTO</h3>
              </Rotulo>
              <GraficoFaixas faixas={tempos.faixas} rotulos={data.rotulosFaixas} nomeTime={nomeTime} />
            </div>
          )}
        </>
      )}
      <Link
        to="/tempos"
        className="block border-t border-borda px-4 py-3 text-[13px] font-bold text-destaque hover:underline"
      >
        Comparar com os outros times →
      </Link>
    </Cartao>
  )
}

function Destaque({ rotulo, valor, detalhe, cor }: { rotulo: string; valor: string; detalhe: string; cor?: string }) {
  return (
    <div>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd className={`text-[26px] font-black tabular-nums ${cor ?? ''}`}>{valor}</dd>
      <dd className="text-xs text-texto-2">{detalhe}</dd>
    </div>
  )
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="border-2 border-texto bg-superficie px-4 py-3.5 transition-[translate,box-shadow] duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_#c6f432]">
      <dt className="font-mono text-[11px] font-extrabold tracking-[1.5px] text-texto-2">{rotulo}</dt>
      <dd className="mt-1 text-[38px] leading-[1.1] font-black tracking-[-1px] tabular-nums">{valor}</dd>
    </div>
  )
}
