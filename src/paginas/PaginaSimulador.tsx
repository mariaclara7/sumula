import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { usePalpites, usePartidas, useTimes } from '../api/consultas'
import type { LinhaClassificacao, Palpite, Partida, Time } from '../api/tipos'
import { BarraPalpite } from '../componentes/BarraPalpite'
import { Escudo } from '../componentes/Escudo'
import { BotaoPrincipal, Carregando, Erro, Vazio } from '../componentes/Estado'
import { LegendaZonas } from '../componentes/LegendaZonas'
import { Pagina } from '../componentes/Pagina'
import { TituloPagina } from '../componentes/TituloPagina'
import { useDeslizar } from '../componentes/useDeslizar'
import { COMPETICAO, TEMPORADA, zonaDaPosicao } from '../config'
import { gravarArmazenado, lerArmazenado, usePreferencias } from '../preferencias'
import { calcularClassificacao } from '../util/classificacao'
import { formatarDataPartida, formatarSaldo } from '../util/formato'
import {
  jogosDaSimulacao,
  lerGols,
  lerPalpitesSalvos,
  podePalpitar,
  preencherComPalpitesDaSumula,
  rodadaInicial,
  type PalpitesUsuario,
  type PlacarDigitado,
} from '../util/simulador'

const CHAVE_PALPITES = `sumula:simulador:${COMPETICAO}:${TEMPORADA}`

export function PaginaSimulador() {
  const partidas = usePartidas()
  const times = useTimes()
  const palpitesSumula = usePalpites()

  if (partidas.isPending || times.isPending) {
    return (
      <Pagina className="pt-9 pb-12">
        <Carregando />
      </Pagina>
    )
  }
  if (partidas.isError || times.isError) {
    return (
      <Pagina className="pt-9 pb-12">
        <Erro tentarDeNovo={() => partidas.refetch()} />
      </Pagina>
    )
  }
  if (partidas.data.length === 0) {
    return (
      <Pagina className="pt-9 pb-12">
        <Vazio>Ainda não há jogos desta temporada.</Vazio>
      </Pagina>
    )
  }

  return <Simulador partidas={partidas.data} times={times.data} palpitesSumula={palpitesSumula.data} />
}

type PropsSimulador = {
  partidas: Partida[]
  times: { lista: Time[]; porId: Map<number, Time> }
  palpitesSumula: Map<number, Palpite> | undefined
}

function Simulador({ partidas, times, palpitesSumula }: PropsSimulador) {
  const [busca, setBusca] = useSearchParams()
  const [palpites, setPalpites] = useState<PalpitesUsuario>(() => lerPalpitesSalvos(lerArmazenado(CHAVE_PALPITES)))

  useEffect(() => {
    gravarArmazenado(CHAVE_PALPITES, Object.keys(palpites).length === 0 ? null : JSON.stringify(palpites))
  }, [palpites])

  const rodadas = useMemo(() => [...new Set(partidas.map((p) => p.rodada))].sort((a, b) => a - b), [partidas])
  const rodadaDaUrl = Number(busca.get('rodada'))
  const rodada = rodadas.includes(rodadaDaUrl) ? rodadaDaUrl : rodadaInicial(partidas)

  function irPara(nova: number) {
    setBusca(
      (atual) => {
        atual.set('rodada', String(nova))
        return atual
      },
      { replace: true },
    )
  }

  const restantes = partidas.filter(podePalpitar)
  const palpitados = restantes.filter((p) => palpites[p.id]?.mandante != null && palpites[p.id]?.visitante != null)

  // Tabela só com os jogos disputados (para o ▲▼) e tabela com os palpites.
  const real = useMemo(() => calcularClassificacao(times.lista, jogosDaSimulacao(partidas, {})), [partidas, times.lista])
  const simulada = useMemo(
    () => calcularClassificacao(times.lista, jogosDaSimulacao(partidas, palpites)),
    [partidas, times.lista, palpites],
  )
  const posicaoReal = new Map(real.map((l) => [l.time.id, l.posicao]))

  function alterar(partidaId: number, lado: keyof PlacarDigitado, texto: string) {
    setPalpites((atuais) => {
      const atual = atuais[partidaId] ?? { mandante: null, visitante: null }
      const novo = { ...atual, [lado]: lerGols(texto) }
      const copia = { ...atuais }
      if (novo.mandante === null && novo.visitante === null) delete copia[partidaId]
      else copia[partidaId] = novo
      return copia
    })
  }

  function limpar() {
    if (window.confirm('Apagar todos os seus palpites?')) setPalpites({})
  }

  const daRodada = partidas
    .filter((p) => p.rodada === rodada)
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
  const pendentesPorRodada = new Map<number, number>()
  for (const p of restantes) {
    const palpitado = palpites[p.id]?.mandante != null && palpites[p.id]?.visitante != null
    if (!palpitado) pendentesPorRodada.set(p.rodada, (pendentesPorRodada.get(p.rodada) ?? 0) + 1)
  }

  const indice = rodadas.indexOf(rodada)

  return (
    <Pagina className="pt-9 pb-12">
      <TituloPagina>Simulador</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        Os jogos que já aconteceram estão travados. Dê seu palpite nos que faltam e veja a tabela mudar na hora. Os
        palpites ficam salvos neste navegador.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3.5">
        <BotaoPrincipal
          onClick={() => palpitesSumula && setPalpites((atuais) => preencherComPalpitesDaSumula(partidas, atuais, palpitesSumula))}
          className={palpitesSumula ? '' : 'pointer-events-none opacity-50'}
        >
          Preencher com o palpite da Súmula
        </BotaoPrincipal>
        <button
          type="button"
          onClick={limpar}
          disabled={Object.keys(palpites).length === 0}
          className="cursor-pointer border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Limpar meus palpites
        </button>
        <span className="font-mono text-sm font-bold tabular-nums" aria-live="polite">
          {palpitados.length} de {restantes.length} jogos palpitados
        </span>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section aria-label="Jogos da rodada">
          <div className="flex items-center gap-2 border-2 border-texto bg-superficie p-1.5">
            <BotaoRodada rotulo="Rodada anterior" desabilitado={indice <= 0} onClick={() => irPara(rodadas[indice - 1])}>
              ◀
            </BotaoRodada>
            <label className="flex-1 text-center">
              <span className="sr-only">Escolher a rodada</span>
              <select
                value={rodada}
                onChange={(evento) => irPara(Number(evento.target.value))}
                className="w-full cursor-pointer bg-transparent text-center text-lg font-black"
              >
                {rodadas.map((r) => (
                  <option key={r} value={r}>
                    Rodada {r}
                    {pendentesPorRodada.get(r) ? ` (${pendentesPorRodada.get(r)})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <BotaoRodada
              rotulo="Próxima rodada"
              desabilitado={indice >= rodadas.length - 1}
              onClick={() => irPara(rodadas[indice + 1])}
            >
              ▶
            </BotaoRodada>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[13px]">
            <span className="font-mono font-bold text-texto-2">
              {pendentesPorRodada.get(rodada)
                ? `${pendentesPorRodada.get(rodada)} sem palpite nesta rodada`
                : daRodada.some(podePalpitar)
                  ? 'Rodada toda palpitada ✓'
                  : 'Rodada encerrada'}
            </span>
            <a href="#tabela-simulada" className="font-bold text-destaque lg:hidden">
              Ver a tabela ↓
            </a>
          </div>

          <ul className="mt-3 flex flex-col gap-2.5">
            {daRodada.map((partida) => {
              const mandante = times.porId.get(partida.mandanteId)
              const visitante = times.porId.get(partida.visitanteId)
              if (!mandante || !visitante) return null
              return (
                <JogoDoSimulador
                  key={partida.id}
                  partida={partida}
                  mandante={mandante}
                  visitante={visitante}
                  palpite={palpites[partida.id]}
                  sugestao={palpitesSumula?.get(partida.id)}
                  aoAlterar={(lado, texto) => alterar(partida.id, lado, texto)}
                />
              )
            })}
          </ul>
        </section>

        <section id="tabela-simulada" aria-label="Tabela simulada" className="scroll-mt-4 lg:sticky lg:top-4">
          <TabelaSimulada linhas={simulada} posicaoReal={posicaoReal} />
          <p className="mt-2 text-xs text-texto-2">
            ▲▼ comparam com a{' '}
            <Link to="/" className="font-bold text-destaque hover:underline">
              tabela de verdade
            </Link>
            . Desempate: pontos, vitórias, saldo, gols pró e confronto direto.
          </p>
        </section>
      </div>
    </Pagina>
  )
}

function BotaoRodada({
  rotulo,
  desabilitado,
  onClick,
  children,
}: {
  rotulo: string
  desabilitado: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={onClick}
      className="grid size-10 cursor-pointer place-items-center bg-texto text-sm text-texto-invertido transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

type PropsJogo = {
  partida: Partida
  mandante: Time
  visitante: Time
  palpite: PlacarDigitado | undefined
  sugestao: Palpite | undefined
  aoAlterar: (lado: keyof PlacarDigitado, texto: string) => void
}

const ESTADO: Partial<Record<Partida['status'], string>> = {
  adiada: 'Adiado',
  cancelada: 'Cancelado',
  emAndamento: 'Ao vivo',
}

function JogoDoSimulador({ partida, mandante, visitante, palpite, sugestao, aoAlterar }: PropsJogo) {
  const editavel = podePalpitar(partida)
  const encerrado = partida.temResultado

  return (
    <li className={`border-2 px-3 py-2.5 ${editavel ? 'border-texto bg-superficie' : 'border-borda bg-superficie-2'}`}>
      <div className="flex justify-between font-mono text-[11px] font-bold text-texto-2">
        <span>{formatarDataPartida(partida.data)}</span>
        <span>{encerrado ? '🔒 Encerrado' : (ESTADO[partida.status] ?? 'Seu palpite')}</span>
      </div>
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <NomeTime time={mandante} />
          <Escudo time={mandante} tamanho={24} />
        </div>
        <div className="flex items-center gap-1.5">
          {editavel ? (
            <>
              <CampoGols time={mandante} valor={palpite?.mandante ?? null} aoAlterar={(t) => aoAlterar('mandante', t)} />
              <span aria-hidden className="font-black text-texto-2">×</span>
              <CampoGols time={visitante} valor={palpite?.visitante ?? null} aoAlterar={(t) => aoAlterar('visitante', t)} />
            </>
          ) : (
            <span className="min-w-[88px] bg-texto px-2 py-2 text-center font-mono text-base font-extrabold text-texto-invertido tabular-nums">
              {encerrado ? `${partida.golsMandante} × ${partida.golsVisitante}` : '—'}
            </span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Escudo time={visitante} tamanho={24} />
          <NomeTime time={visitante} />
        </div>
      </div>
      {editavel && sugestao && <BarraPalpite palpite={sugestao} mandante={mandante} visitante={visitante} />}
    </li>
  )
}

/** No celular os campos de placar ocupam o meio: fica a sigla, com o nome completo para leitores de tela. */
function NomeTime({ time }: { time: Time }) {
  return (
    <span className="truncate text-sm font-bold" title={time.nomeCurto}>
      <span aria-hidden className="sm:hidden">
        {time.sigla}
      </span>
      <span className="sr-only sm:not-sr-only">{time.nomeCurto}</span>
    </span>
  )
}

function CampoGols({ time, valor, aoAlterar }: { time: Time; valor: number | null; aoAlterar: (texto: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      value={valor ?? ''}
      onChange={(evento) => aoAlterar(evento.target.value)}
      onFocus={(evento) => evento.target.select()}
      aria-label={`Gols do ${time.nomeCurto}`}
      className="size-10 border-2 border-texto bg-fundo text-center font-mono text-lg font-extrabold tabular-nums focus:bg-lima focus:text-grafite focus:outline-none"
    />
  )
}

const COLUNAS = 'grid grid-cols-[40px_minmax(0,1fr)_40px_36px_36px_44px]'

function TabelaSimulada({ linhas, posicaoReal }: { linhas: LinhaClassificacao[]; posicaoReal: Map<number, number> }) {
  const { meuTime } = usePreferencias()
  const corpo = useRef<HTMLDivElement>(null)
  useDeslizar(corpo, linhas.map((l) => l.time.id).join(), 500)

  return (
    <div className="border-2 border-texto bg-superficie">
      <div role="table" aria-label="Classificação simulada">
        <div
          role="row"
          className={`${COLUNAS} h-9 items-center border-b-2 border-texto text-center font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2`}
        >
          <span role="columnheader">#</span>
          <span role="columnheader" className="text-left">TIME</span>
          <span role="columnheader">
            <abbr title="Pontos" className="no-underline">P</abbr>
          </span>
          <span role="columnheader">
            <abbr title="Jogos" className="no-underline">J</abbr>
          </span>
          <span role="columnheader">
            <abbr title="Vitórias" className="no-underline">V</abbr>
          </span>
          <span role="columnheader">
            <abbr title="Saldo de gols" className="no-underline">SG</abbr>
          </span>
        </div>
        <div ref={corpo} role="rowgroup">
          {linhas.map((linha) => {
            const zona = zonaDaPosicao(linha.posicao)
            const variacao = (posicaoReal.get(linha.time.id) ?? linha.posicao) - linha.posicao
            return (
              <div
                key={linha.time.id}
                role="row"
                data-deslizar={linha.time.id}
                className={`${COLUNAS} h-10 items-center border-b border-borda text-center last:border-b-0 ${
                  meuTime === linha.time.id ? 'bg-realce' : 'bg-superficie'
                }`}
              >
                <div role="cell" className="flex h-full items-center gap-2">
                  <span title={zona?.nome} className={`h-full w-1 ${zona?.cor ?? 'bg-transparent'}`} />
                  <span className="text-base font-black">{linha.posicao}</span>
                </div>
                <div role="cell" className="flex min-w-0 items-center gap-2 text-left">
                  <Escudo time={linha.time} tamanho={22} />
                  <span className="truncate text-sm font-bold">{linha.time.nomeCurto}</span>
                  {variacao !== 0 && (
                    <span
                      title={`${variacao > 0 ? 'Sobe' : 'Cai'} ${Math.abs(variacao)} em relação à tabela de verdade`}
                      className={`font-mono text-[11px] font-extrabold whitespace-nowrap ${variacao > 0 ? 'text-verde' : 'text-vermelho'}`}
                    >
                      {variacao > 0 ? `▲${variacao}` : `▼${-variacao}`}
                    </span>
                  )}
                </div>
                <span role="cell" className="text-base font-black tabular-nums">{linha.pontos}</span>
                <span role="cell" className="font-mono text-[13px] text-texto-2 tabular-nums">{linha.jogos}</span>
                <span role="cell" className="font-mono text-[13px] tabular-nums">{linha.vitorias}</span>
                <span role="cell" className="font-mono text-[13px] tabular-nums">{formatarSaldo(linha.saldo)}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="border-t border-borda px-3 pb-3">
        <LegendaZonas className="mt-3" />
      </div>
    </div>
  )
}
