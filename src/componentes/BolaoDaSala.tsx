import type { ReactNode } from 'react'
import type { ParticipanteSala } from '../api/salas'
import type { Partida } from '../api/tipos'
import type { Bolao, LinhaBolao } from '../util/bolao'
import { formatarDataPartida } from '../util/formato'
import { AvatarParticipante } from './AvatarParticipante'
import { BotaoPrincipal } from './Estado'
import { Rotulo } from './TituloPagina'

type Props = {
  bolao: Bolao
  partidas: Partida[]
  participantes: ParticipanteSala[]
  euId: number | undefined
  agora: number
  /** Link direto para esta aba (?aba=bolao). */
  link: string
  /** Leva para a aba de palpites (só para quem está na sala). */
  aoPalpitar?: () => void
  aoCopiar: (url: string) => void
}

const pts = (n: number) => `${n} ${n === 1 ? 'pt' : 'pts'}`

/** A aba "Bolão" da sala: rei da rodada, a sua posição, ranking, pontos por rodada e as regras. */
export function BolaoDaSala({ bolao, partidas, participantes, euId, agora, link, aoPalpitar, aoCopiar }: Props) {
  const pessoa = new Map(participantes.map((p) => [p.id, p]))
  const { desde, ranking } = bolao

  return (
    <section aria-label="Bolão" className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-texto-2">
          {desde !== null && (
            <span className="border-2 border-texto bg-lima px-2.5 py-1 text-xs font-extrabold text-grafite">Valendo desde a rodada {desde}</span>
          )}
          <span>
            Placar exato <b className="text-texto">3 pts</b> · resultado certo <b className="text-texto">1 pt</b> · o palpite fecha
            quando o jogo começa
          </span>
        </div>
        <button
          type="button"
          onClick={() => aoCopiar(link)}
          className="cursor-pointer border-2 border-texto bg-superficie px-3.5 py-2 text-[13px] font-extrabold transition-[transform,box-shadow] duration-75 hover:shadow-[3px_3px_0_var(--texto)] active:translate-x-px active:translate-y-px active:shadow-none"
        >
          Copiar link do bolão
        </button>
      </div>

      {desde === null ? (
        <Aviso icone="🏁" titulo="Não há mais rodadas para o bolão nesta temporada">
          O bolão começou depois da última rodada. Ele volta com a próxima temporada.
        </Aviso>
      ) : bolao.jogosContados === 0 ? (
        <Aviso
          icone="🏁"
          titulo={`O bolão começa na rodada ${desde}`}
          acao={aoPalpitar && <BotaoPrincipal onClick={aoPalpitar}>Fazer palpites</BotaoPrincipal>}
        >
          {primeiroJogo(partidas, desde, agora)}Faça os seus palpites antes de cada jogo começar. Placar exato vale 3 pontos,
          resultado certo vale 1.
        </Aviso>
      ) : (
        <>
          <div className="mt-[18px] grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Rei bolao={bolao} pessoa={pessoa} />
            <MinhaPosicao ranking={ranking} euId={euId} pessoa={pessoa} />
          </div>

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Caixa titulo="Ranking" detalhe={`${bolao.rodadas.length} ${bolao.rodadas.length === 1 ? 'RODADA' : 'RODADAS'} · ${bolao.jogosContados} ${bolao.jogosContados === 1 ? 'JOGO' : 'JOGOS'}`}>
              <Ranking bolao={bolao} pessoa={pessoa} euId={euId} />
              <p className="mx-[18px] mb-3.5 border-t border-dashed border-borda pt-2.5 text-[13px] text-texto-2">
                Empate em pontos: na frente quem cravou mais placares; depois, quem acertou mais resultados.
              </p>
            </Caixa>
            <div className="flex min-w-0 flex-col gap-4">
              <Caixa titulo="Pontos por rodada">
                <PorRodada bolao={bolao} pessoa={pessoa} euId={euId} />
              </Caixa>
              <ComoFunciona />
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function primeiroJogo(partidas: Partida[], rodada: number, agora: number) {
  const proximo = partidas
    .filter((p) => p.rodada === rodada && p.status !== 'cancelada' && Date.parse(p.data) > agora)
    .sort((a, b) => a.data.localeCompare(b.data))[0]
  return proximo ? `Primeiro jogo: ${formatarDataPartida(proximo.data)}. ` : ''
}

function nomeDe(pessoa: Map<number, ParticipanteSala>, id: number, euId: number | undefined) {
  return id === euId ? 'Você' : (pessoa.get(id)?.nome ?? '?')
}

function Rei({ bolao, pessoa }: { bolao: Bolao; pessoa: Map<number, ParticipanteSala> }) {
  const rodada = bolao.ultimaEncerrada
  const reis = rodada === null ? [] : (bolao.reis.get(rodada) ?? [])
  const linhas = reis.map((id) => bolao.ranking.find((l) => l.id === id)!).filter(Boolean)
  const exemplo = linhas[0]

  return (
    <div className="corte-duplo relative flex items-center gap-5 overflow-hidden bg-grafite px-6 py-6 text-creme md:px-7">
      {rodada !== null && (
        <span aria-hidden className="absolute -top-5 -right-1.5 text-[110px] leading-none font-black text-lima opacity-[.09]">
          {rodada}
        </span>
      )}
      <span aria-hidden className="text-[48px] leading-none drop-shadow-[0_4px_0_#6f8a1c] md:text-[54px]">
        👑
      </span>
      <div className="relative min-w-0">
        {rodada === null ? (
          <>
            <Rotulo className="text-lima">REI DA RODADA</Rotulo>
            <div className="mt-2 text-2xl leading-tight font-black">Sai no fim da rodada {bolao.rodadas[0]}</div>
            <div className="mt-1.5 text-sm text-cinza">Quem fizer mais pontos na rodada leva a coroa.</div>
          </>
        ) : reis.length === 0 ? (
          <>
            <Rotulo className="text-lima">REI DA RODADA {rodada}</Rotulo>
            <div className="mt-2 text-2xl leading-tight font-black">Ninguém pontuou</div>
            <div className="mt-1.5 text-sm text-cinza">Sem coroa nesta rodada.</div>
          </>
        ) : (
          <>
            <Rotulo className="text-lima">{reis.length > 1 ? `REIS DA RODADA ${rodada}` : `REI DA RODADA ${rodada}`}</Rotulo>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              {reis.map((id) => (
                <span key={id} className="flex min-w-0 items-center gap-2.5 text-[28px] leading-none font-black tracking-[-1px] md:text-[34px]">
                  <AvatarParticipante participante={pessoa.get(id) ?? { nome: '?', cor: 0 }} tamanho={34} />
                  <span className="truncate">{pessoa.get(id)?.nome}</span>
                </span>
              ))}
            </div>
            {exemplo && (
              <div className="mt-2 text-sm text-cinza">
                <b className="text-lima">{pts(exemplo.porRodada[rodada])}</b> na rodada{reis.length > 1 ? ' (empate)' : ''}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MinhaPosicao({ ranking, euId, pessoa }: { ranking: LinhaBolao[]; euId: number | undefined; pessoa: Map<number, ParticipanteSala> }) {
  const eu = ranking.find((l) => l.id === euId)
  const lider = ranking[0]
  const alvo = eu ?? lider
  if (!alvo) return null
  // Quem está logo à frente (para "X atrás de Fulano") e quem vem logo atrás do líder (para a vantagem).
  const frente = ranking.filter((l) => l.posicao < alvo.posicao).at(-1)
  const segundo = ranking.find((l) => l.posicao > 1)

  return (
    <div className="flex flex-col justify-between gap-3 border-2 border-texto bg-superficie px-6 py-5">
      <Rotulo>{eu ? 'SUA POSIÇÃO' : 'QUEM LIDERA'}</Rotulo>
      {eu ? (
        <div className="text-[64px] leading-[.9] font-black tracking-[-3px]">
          {eu.posicao}º <small className="text-[22px] tracking-[-.5px] text-texto-2">de {ranking.length}</small>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-[34px] leading-none font-black tracking-[-1px]">
          <AvatarParticipante participante={pessoa.get(lider.id) ?? { nome: '?', cor: 0 }} tamanho={34} />
          {pessoa.get(lider.id)?.nome}
        </div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-texto-2">
        <Numero valor={pts(alvo.pontos)} texto="no total" />
        {eu && frente && (
          <Numero valor={String(frente.pontos - eu.pontos)} texto={`atrás de ${nomeDe(pessoa, frente.id, euId)}`} />
        )}
        {eu && eu.posicao === 1 && segundo && <Numero valor={String(eu.pontos - segundo.pontos)} texto="de vantagem" />}
        <Numero valor={`👑 ${alvo.coroas}`} texto={alvo.coroas === 1 ? 'rodada vencida' : 'rodadas vencidas'} />
      </div>
    </div>
  )
}

function Numero({ valor, texto }: { valor: string; texto: string }) {
  return (
    <span>
      <b className="block text-[22px] font-black tracking-[-.5px] text-texto">{valor}</b>
      {texto}
    </span>
  )
}

function Caixa({ titulo, detalhe, children }: { titulo: string; detalhe?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-2 border-texto bg-superficie">
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-texto px-[18px] py-3.5">
        <h3 className="text-xl font-black tracking-[-.5px]">{titulo}</h3>
        {detalhe && <span className="font-mono text-[10px] font-extrabold tracking-[2px] text-texto-2">{detalhe}</span>}
      </div>
      {children}
    </div>
  )
}

const TH = 'px-2 sm:px-3 py-2.5 font-mono text-[10px] font-extrabold tracking-[1.5px] text-texto-2 border-b border-borda'
const TD = 'px-2 sm:px-3 py-3 border-b border-borda tabular-nums'

function Ranking({ bolao, pessoa, euId }: { bolao: Bolao; pessoa: Map<number, ParticipanteSala>; euId: number | undefined }) {
  const ultimas = bolao.rodadas.slice(-3)
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-11 text-center`}>#</th>
            <th className={`${TH} text-left`}>PESSOA</th>
            <th className={`${TH} text-right`}>PTS</th>
            <th className={`${TH} text-right`}>
              <abbr title="Placares exatos" className="no-underline">EXATOS</abbr>
            </th>
            <th className={`${TH} text-right`}>
              <abbr title="Resultados certos" className="no-underline">RESULT.</abbr>
            </th>
            <th className={`${TH} text-right`}>
              <span aria-hidden>👑</span>
              <span className="sr-only">Rodadas vencidas</span>
            </th>
            <th className={`${TH} text-right max-sm:hidden`}>ÚLTIMAS</th>
          </tr>
        </thead>
        <tbody>
          {bolao.ranking.map((l) => {
            const p = pessoa.get(l.id)
            const lider = l.posicao === 1 && l.pontos > 0
            return (
              <tr key={l.id} className={lider ? 'bg-realce' : ''}>
                <td className={`${TD} text-center text-lg font-black`}>{l.posicao}</td>
                <td className={TD}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    {p && <AvatarParticipante participante={p} tamanho={28} />}
                    <b className="truncate font-extrabold">
                      {p?.nome}
                      {l.id === euId && <span className="font-medium text-texto-2"> (você)</span>}
                    </b>
                  </span>
                </td>
                <td className={`${TD} text-right text-xl font-black`}>{l.pontos}</td>
                <td className={`${TD} text-right`}>{l.exatos}</td>
                <td className={`${TD} text-right`}>{l.resultados}</td>
                <td className={`${TD} text-right`}>{l.coroas}</td>
                <td className={`${TD} text-right max-sm:hidden`}>
                  <span className="inline-flex gap-[3px]">
                    {ultimas.map((r) => {
                      const rei = bolao.reis.get(r)?.includes(l.id)
                      return (
                        <span
                          key={r}
                          title={`Rodada ${r}: ${pts(l.porRodada[r])}${rei ? ' (rei)' : ''}`}
                          className={`grid size-[22px] place-items-center font-mono text-[10px] font-extrabold ${
                            rei ? 'bg-lima text-grafite' : 'bg-superficie-2'
                          }`}
                        >
                          {l.porRodada[r]}
                        </span>
                      )
                    })}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PorRodada({ bolao, pessoa, euId }: { bolao: Bolao; pessoa: Map<number, ParticipanteSala>; euId: number | undefined }) {
  // As últimas 6 rodadas (3 no celular); as mais antigas ficam no total.
  const rodadas = bolao.rodadas.slice(-6)
  const soNoPc = (i: number) => (i < rodadas.length - 3 ? 'max-sm:hidden' : '')
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-center text-sm">
        <thead>
          <tr>
            <th className={`${TH} text-left`}>PESSOA</th>
            {rodadas.map((r, i) => (
              <th key={r} className={`${TH} ${soNoPc(i)}`}>
                R{r}
              </th>
            ))}
            <th className={`${TH} border-l-2 border-l-texto`}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {bolao.ranking.map((l) => (
            <tr key={l.id}>
              <td className={`${TD} text-left`}>
                <span className="flex items-center gap-2">
                  {pessoa.get(l.id) && <AvatarParticipante participante={pessoa.get(l.id)!} tamanho={22} />}
                  <b className="truncate font-extrabold">{nomeDe(pessoa, l.id, euId)}</b>
                </span>
              </td>
              {rodadas.map((r, i) => {
                const rei = bolao.reis.get(r)?.includes(l.id)
                return (
                  <td key={r} className={`${TD} ${soNoPc(i)} ${rei ? 'bg-lima font-black text-grafite' : ''}`}>
                    {rei && (
                      <span aria-hidden className="mr-0.5 text-[11px]">
                        👑
                      </span>
                    )}
                    {l.porRodada[r]}
                    {rei && <span className="sr-only"> (rei da rodada)</span>}
                  </td>
                )
              })}
              <td className={`${TD} border-l-2 border-l-texto text-base font-black`}>{l.pontos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ComoFunciona() {
  return (
    <Caixa titulo="Como funciona">
      <div className="flex flex-col gap-2.5 px-[18px] py-4 text-sm leading-normal">
        <Regra pontos="+3" estilo="border-verde bg-verde text-white">
          <b>Cravou o placar.</b> Palpite 2×1, jogo terminou 2×1.
        </Regra>
        <Regra pontos="+1" estilo="border-verde text-verde">
          <b>Acertou o resultado.</b> Quem venceu, ou o empate (palpite 1×0, terminou 3×1).
        </Regra>
        <Regra pontos="0" estilo="border-borda text-texto-2">
          Errou o resultado ou não palpitou.
        </Regra>
        <p className="border-t border-dashed border-borda pt-2.5 text-[13px] text-texto-2">
          🔒 Cada palpite fecha no horário em que o jogo começa. 👑 Rei da rodada: quem fez mais pontos na rodada (empate, todos
          levam). Só diversão: sem dinheiro e sem prêmio.
        </p>
      </div>
    </Caixa>
  )
}

function Regra({ pontos, estilo, children }: { pontos: string; estilo: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`min-w-[46px] flex-none border-2 py-0.5 text-center text-[15px] font-black ${estilo}`}>{pontos}</span>
      <span>{children}</span>
    </div>
  )
}

function Aviso({ icone, titulo, acao, children }: { icone: string; titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-[18px] flex max-w-[760px] flex-wrap items-center gap-5 border-2 border-dashed border-texto bg-superficie p-6">
      <span aria-hidden className="text-[40px]">
        {icone}
      </span>
      <div className="min-w-[220px] flex-1">
        <h3 className="text-[22px] font-black tracking-[-.5px]">{titulo}</h3>
        <p className="mt-1 text-sm leading-normal text-texto-2">{children}</p>
      </div>
      {acao}
    </div>
  )
}
