import { useRef, useState, type ReactNode } from 'react'
import type { LinhaClassificacao, Palpite, Partida, Time } from '../api/tipos'
import { zonaDaPosicao } from '../config'
import { usePreferencias } from '../preferencias'
import { formatarDataPartida, formatarSaldo } from '../util/formato'
import { podePalpitar, type PlacarDigitado } from '../util/simulador'
import { Abas } from './Abas'
import { BarraPalpite } from './BarraPalpite'
import { Escudo } from './Escudo'
import { LegendaZonas } from './LegendaZonas'
import { Seletor } from './Seletor'
import { useDeslizar } from './useDeslizar'
import { Sigla } from './Sigla'

// Peças do simulador usadas também na sala: navegação de rodadas, o jogo com os campos de placar e a tabela.

type PropsNavegacao = {
  rodadas: number[]
  rodada: number
  aoMudar: (rodada: number) => void
  /** Texto ao lado de cada rodada na lista, ex.: "3 sem palpite". */
  detalhe?: (rodada: number) => string | undefined
}

export function NavegacaoRodadas({ rodadas, rodada, aoMudar, detalhe }: PropsNavegacao) {
  const indice = rodadas.indexOf(rodada)
  return (
    <div className="flex items-center gap-2 border-2 border-texto bg-superficie p-1.5">
      <BotaoRodada rotulo="Rodada anterior" desabilitado={indice <= 0} onClick={() => aoMudar(rodadas[indice - 1])}>
        ◀
      </BotaoRodada>
      <div className="flex flex-1 justify-center">
        <Seletor
          rotulo="Escolher a rodada"
          valor={rodada}
          aoMudar={aoMudar}
          opcoes={rodadas.map((r) => ({ valor: r, rotulo: `Rodada ${r}`, detalhe: detalhe?.(r) }))}
          className="flex items-center gap-2 px-3 py-1 text-lg font-black hover:text-destaque focus-visible:bg-lima focus-visible:text-grafite focus-visible:outline-none"
        >
          Rodada {rodada}
          <span aria-hidden className="text-xs">
            ▼
          </span>
        </Seletor>
      </div>
      <BotaoRodada
        rotulo="Próxima rodada"
        desabilitado={indice >= rodadas.length - 1}
        onClick={() => aoMudar(rodadas[indice + 1])}
      >
        ▶
      </BotaoRodada>
    </div>
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
  children: ReactNode
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
  sugestao?: Palpite
  /** Só mostra o placar, sem deixar editar (link compartilhado, palpite de outra pessoa na sala). */
  somenteLeitura: boolean
  aoAlterar?: (lado: keyof PlacarDigitado, texto: string) => void
  /** Texto no canto do card quando o jogo ainda vai acontecer. */
  rotulo?: string
  /** Cor do placar palpitado quando é só leitura (a cor da pessoa na sala). */
  corPlacar?: { fundo: string; texto: string }
  /** Conteúdo extra embaixo do jogo (os palpites dos outros na sala). */
  children?: ReactNode
}

const ESTADO: Partial<Record<Partida['status'], string>> = {
  adiada: 'Adiado',
  cancelada: 'Cancelado',
  emAndamento: 'Ao vivo',
}

export function JogoDoSimulador({
  partida,
  mandante,
  visitante,
  palpite,
  sugestao,
  somenteLeitura,
  aoAlterar,
  rotulo,
  corPlacar,
  children,
}: PropsJogo) {
  const editavel = podePalpitar(partida) && !somenteLeitura && aoAlterar !== undefined
  const palpitado = podePalpitar(partida) && palpite?.mandante != null && palpite.visitante != null
  const encerrado = partida.temResultado
  const coloridoPelaPessoa = !encerrado && palpitado && corPlacar

  return (
    <li
      className={`border-2 px-3 py-2.5 ${editavel || palpitado ? 'border-texto bg-superficie' : 'border-borda bg-superficie-2'}`}
    >
      <div className="flex justify-between gap-2 font-mono text-[11px] font-bold text-texto-2">
        <span>{formatarDataPartida(partida.data)}</span>
        <span className="truncate">
          {encerrado
            ? '🔒 Encerrado'
            : (ESTADO[partida.status] ?? rotulo ?? (somenteLeitura ? 'Palpite compartilhado' : 'Seu palpite'))}
        </span>
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
              <span aria-hidden className="font-black text-texto-2">
                ×
              </span>
              <CampoGols time={visitante} valor={palpite?.visitante ?? null} aoAlterar={(t) => aoAlterar('visitante', t)} />
            </>
          ) : (
            <span
              className={`min-w-[88px] px-2 py-2 text-center font-mono text-base font-extrabold tabular-nums ${
                coloridoPelaPessoa ? '' : encerrado || palpitado ? 'bg-texto text-texto-invertido' : 'bg-superficie-2 text-texto-2'
              }`}
              style={coloridoPelaPessoa ? { background: corPlacar.fundo, color: corPlacar.texto } : undefined}
            >
              {encerrado
                ? `${partida.golsMandante} × ${partida.golsVisitante}`
                : palpitado
                  ? `${palpite!.mandante} × ${palpite!.visitante}`
                  : corPlacar
                    ? 'sem palpite'
                    : '—'}
            </span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Escudo time={visitante} tamanho={24} />
          <NomeTime time={visitante} />
        </div>
      </div>
      {editavel && sugestao && <BarraPalpite palpite={sugestao} mandante={mandante} visitante={visitante} />}
      {children}
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

type ModoTabela = 'palpites' | 'hoje' | 'lado'

type PropsTabela = {
  /** Tabela final com os palpites. */
  linhas: LinhaClassificacao[]
  /** Tabela de verdade, de hoje (só os jogos disputados). */
  real: LinhaClassificacao[]
  /** Cabeçalho acima da tabela (na sala: de quem é a tabela). */
  titulo?: ReactNode
}

/**
 * A tabela com os palpites, e duas outras vistas para comparar com a de hoje: a tabela de verdade e as duas
 * posições lado a lado. Ao trocar entre "com os palpites" e "hoje", as linhas deslizam para o lugar novo.
 */
export function TabelaSimulada({ linhas, real, titulo }: PropsTabela) {
  const [modo, setModo] = useState<ModoTabela>('palpites')
  const posicaoReal = new Map(real.map((l) => [l.time.id, l.posicao]))

  return (
    <div className="border-2 border-texto bg-superficie">
      {titulo && <div className="border-b-2 border-texto px-4 py-3">{titulo}</div>}
      <div className="border-b-2 border-texto px-3 py-2.5">
        <Abas
          rotulo="Qual tabela mostrar"
          valor={modo}
          aoMudar={setModo}
          opcoes={[
            { valor: 'palpites', rotulo: 'Com os palpites' },
            { valor: 'hoje', rotulo: 'Hoje' },
            { valor: 'lado', rotulo: 'Lado a lado' },
          ]}
        />
      </div>
      {modo === 'lado' ? (
        <LadoALado linhas={linhas} posicaoReal={posicaoReal} />
      ) : (
        <Classificacao
          linhas={modo === 'hoje' ? real : linhas}
          posicaoReal={modo === 'hoje' ? undefined : posicaoReal}
          rotulo={modo === 'hoje' ? 'Classificação de hoje' : 'Classificação com os palpites'}
        />
      )}
      <div className="border-t border-borda px-3 pb-3">
        <LegendaZonas className="mt-3" />
      </div>
    </div>
  )
}

function Classificacao({
  linhas,
  posicaoReal,
  rotulo,
}: {
  linhas: LinhaClassificacao[]
  /** Com ▲▼ em relação à tabela de hoje; sem, é a própria tabela de hoje. */
  posicaoReal: Map<number, number> | undefined
  rotulo: string
}) {
  const { meuTime } = usePreferencias()
  const corpo = useRef<HTMLDivElement>(null)
  useDeslizar(corpo, linhas.map((l) => l.time.id).join(), 500)

  return (
    <div role="table" aria-label={rotulo}>
      <div
        role="row"
        className={`${COLUNAS} h-9 items-center border-b-2 border-texto text-center font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2`}
      >
        <span role="columnheader">#</span>
        <span role="columnheader" className="text-left">
          TIME
        </span>
        <span role="columnheader">
          <Sigla dica="Pontos: 3 por vitória, 1 por empate">P</Sigla>
        </span>
        <span role="columnheader">
          <Sigla dica="Jogos disputados">J</Sigla>
        </span>
        <span role="columnheader">
          <Sigla dica="Vitórias">V</Sigla>
        </span>
        <span role="columnheader">
          <Sigla dica="Saldo de gols: gols marcados menos gols sofridos">SG</Sigla>
        </span>
      </div>
      <div ref={corpo} role="rowgroup">
        {linhas.map((linha) => {
          const zona = zonaDaPosicao(linha.posicao)
          const variacao = posicaoReal ? (posicaoReal.get(linha.time.id) ?? linha.posicao) - linha.posicao : 0
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
                    title={`${variacao > 0 ? 'Sobe' : 'Cai'} ${Math.abs(variacao)} em relação à tabela de hoje`}
                    className={`font-mono text-[11px] font-extrabold whitespace-nowrap ${variacao > 0 ? 'text-verde' : 'text-vermelho'}`}
                  >
                    {variacao > 0 ? `▲${variacao}` : `▼${-variacao}`}
                  </span>
                )}
              </div>
              <span role="cell" className="text-base font-black tabular-nums">
                {linha.pontos}
              </span>
              <span role="cell" className="font-mono text-[13px] text-texto-2 tabular-nums">
                {linha.jogos}
              </span>
              <span role="cell" className="font-mono text-[13px] tabular-nums">
                {linha.vitorias}
              </span>
              <span role="cell" className="font-mono text-[13px] tabular-nums">
                {formatarSaldo(linha.saldo)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const COLUNAS_LADO = 'grid grid-cols-[minmax(0,1fr)_64px_64px_56px]'

/** Uma linha por time: a posição de hoje, a posição no fim com os palpites e quanto muda. */
function LadoALado({ linhas, posicaoReal }: { linhas: LinhaClassificacao[]; posicaoReal: Map<number, number> }) {
  const { meuTime } = usePreferencias()
  return (
    <div role="table" aria-label="Posição hoje e com os palpites">
      <div
        role="row"
        className={`${COLUNAS_LADO} h-9 items-center border-b-2 border-texto px-3 text-center font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2`}
      >
        <span role="columnheader" className="text-left">
          TIME
        </span>
        <span role="columnheader">
          <Sigla dica="Posição na tabela de verdade, hoje">HOJE</Sigla>
        </span>
        <span role="columnheader">
          <Sigla dica="Posição no fim do campeonato, com os palpites">FIM</Sigla>
        </span>
        <span role="columnheader">
          <Sigla dica="Quantas posições o time sobe (▲) ou cai (▼) até o fim, com os palpites">MUDA</Sigla>
        </span>
      </div>
      {linhas.map((linha) => {
        const hoje = posicaoReal.get(linha.time.id) ?? linha.posicao
        const variacao = hoje - linha.posicao
        return (
          <div
            key={linha.time.id}
            role="row"
            className={`${COLUNAS_LADO} h-10 items-center border-b border-borda px-3 text-center last:border-b-0 ${
              meuTime === linha.time.id ? 'bg-realce' : ''
            }`}
          >
            <div role="cell" className="flex min-w-0 items-center gap-2 text-left">
              <Escudo time={linha.time} tamanho={22} />
              <span className="truncate text-sm font-bold">{linha.time.nomeCurto}</span>
            </div>
            <Posicao posicao={hoje} apagada />
            <Posicao posicao={linha.posicao} />
            <span
              role="cell"
              className={`font-mono text-[13px] font-extrabold ${variacao > 0 ? 'text-verde' : variacao < 0 ? 'text-vermelho' : 'text-texto-3'}`}
            >
              {variacao > 0 ? `▲${variacao}` : variacao < 0 ? `▼${-variacao}` : '='}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Posicao({ posicao, apagada = false }: { posicao: number; apagada?: boolean }) {
  const zona = zonaDaPosicao(posicao)
  return (
    <span role="cell" className="flex items-center justify-center gap-1.5" title={zona?.nome}>
      <span aria-hidden className={`h-4 w-1 ${zona?.cor ?? 'bg-transparent'}`} />
      <span className={`text-[15px] font-black tabular-nums ${apagada ? 'text-texto-2' : ''}`}>{posicao}º</span>
    </span>
  )
}
