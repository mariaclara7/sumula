import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { usePalpites, usePartidas, useTimes } from '../api/consultas'
import type { Time } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { NavegacaoRodadas } from '../componentes/Simulacao'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { useConta } from '../conta/conta'
import { usePreferencias } from '../preferencias'
import {
  faixaDaChance,
  jogosAbertos,
  linhasDaRodada,
  rodadaDoCartola,
  rodadasComJogosAbertos,
  type Faixa,
  type LinhaCartola,
} from '../util/cartola'
import { formatarDataPartida } from '../util/formato'

type Modo = 'defesa' | 'ataque'

const pct = (x: number) => `${Math.round(x * 100)}%`
const decimal = (x: number) => x.toFixed(2).replace('.', ',')

const ESTILO_FAIXA: Record<Faixa, { selo: string; barra: string }> = {
  otima: { selo: 'border-verde bg-verde text-white', barra: 'bg-verde' },
  boa: { selo: 'border-texto bg-lima text-grafite', barra: 'bg-lima' },
  fraca: { selo: 'border-borda text-texto-2', barra: 'bg-[#b9b7ae]' },
}
const NOME_FAIXA: Record<Modo, Record<Faixa, string>> = {
  defesa: { otima: 'ÓTIMA', boa: 'BOA', fraca: 'ARRISCADA' },
  ataque: { otima: 'ÓTIMA', boa: 'BOA', fraca: 'FRACA' },
}

/** /cartola: chance de SG (não levar gol) e de marcar de cada time na rodada, pelo modelo de gols da BraSúmula. */
export function PaginaCartola() {
  const partidas = usePartidas()
  const palpites = usePalpites()
  const times = useTimes()
  const [agora] = useState(() => Date.now())
  const [busca, setBusca] = useSearchParams()
  const modo: Modo = busca.get('modo') === 'ataque' ? 'ataque' : 'defesa'

  const rodadas = useMemo(
    () => (partidas.data && palpites.data ? rodadasComJogosAbertos(partidas.data, palpites.data, agora) : []),
    [partidas.data, palpites.data, agora],
  )
  const inicial = useMemo(
    () => (partidas.data && palpites.data ? rodadaDoCartola(partidas.data, palpites.data, agora) : null),
    [partidas.data, palpites.data, agora],
  )
  const [escolhida, setEscolhida] = useState<number | null>(null)
  const rodada = escolhida ?? inicial ?? rodadas[0] ?? null

  const jogos = useMemo(
    () => (partidas.data && palpites.data && rodada !== null ? jogosAbertos(partidas.data, palpites.data, rodada, agora) : []),
    [partidas.data, palpites.data, rodada, agora],
  )
  const linhas = useMemo(() => (palpites.data ? linhasDaRodada(jogos, palpites.data) : []), [jogos, palpites.data])

  function mudarModo(novo: Modo) {
    setBusca(
      (atual) => {
        const proxima = new URLSearchParams(atual)
        if (novo === 'defesa') proxima.delete('modo')
        else proxima.set('modo', novo)
        return proxima
      },
      { replace: true },
    )
  }

  if (partidas.isPending || palpites.isPending || times.isPending) {
    return (
      <Pagina className="pt-9 pb-12">
        <Carregando />
      </Pagina>
    )
  }
  if (partidas.isError || palpites.isError || times.isError) {
    return (
      <Pagina className="pt-9 pb-12">
        <Erro tentarDeNovo={() => Promise.all([partidas.refetch(), palpites.refetch(), times.refetch()])} />
      </Pagina>
    )
  }

  const chave = modo === 'defesa' ? 'sg' : 'marcar'
  const ordem = [...linhas].sort((a, b) => (modo === 'defesa' ? b.sg - a.sg : b.golsPro - a.golsPro) || a.timeId - b.timeId)
  const primeiro = jogos[0]

  return (
    <Pagina className="pt-9 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <Rotulo>{rodada !== null ? `RODADA ${rodada} · DICAS PARA ESCALAR` : 'DICAS PARA ESCALAR'}</Rotulo>
          <TituloPagina className="mt-2">Cartola</TituloPagina>
        </div>
        {primeiro && (
          <span className="bg-grafite px-3 py-[7px] font-mono text-[13px] font-extrabold text-lima uppercase">
            1º jogo: {formatarDataPartida(primeiro.data)}
          </span>
        )}
      </div>
      <p className="mt-[18px] max-w-[680px] text-[15px] leading-[1.55] text-pretty text-texto-2 md:text-[17px]">
        A chance de cada time terminar o jogo <b className="text-texto">sem levar gol</b> (o SG do Cartola) e de{' '}
        <b className="text-texto">marcar</b>, calculadas pelo modelo da BraSúmula para os jogos da rodada.
      </p>

      {rodada === null || linhas.length === 0 ? (
        <div className="mt-8">
          <Vazio>Ainda não há jogos por começar com previsão. Volte quando a próxima rodada estiver marcada.</Vazio>
        </div>
      ) : (
        <>
          {rodadas.length > 1 && (
            <div className="mt-6 max-w-[460px]">
              <NavegacaoRodadas rodadas={rodadas} rodada={rodada} aoMudar={setEscolhida} />
            </div>
          )}

          <Destaques linhas={ordem.slice(0, 3)} modo={modo} times={times.data.porId} />

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Abas
              rotulo="O que ver"
              valor={modo}
              aoMudar={mudarModo}
              opcoes={[
                { valor: 'defesa', rotulo: 'Defesa · chance de SG' },
                { valor: 'ataque', rotulo: 'Ataque · chance de gol' },
              ]}
            />
            <Legenda modo={modo} />
          </div>

          <div className="mt-3.5 grid items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <Caixa
              titulo={modo === 'defesa' ? 'Chance de SG na rodada' : 'Chance de marcar na rodada'}
              detalhe={`${linhas.length} TIMES · ${jogos.length} ${jogos.length === 1 ? 'JOGO' : 'JOGOS'}`}
            >
              <Tabela linhas={ordem} modo={modo} chave={chave} times={times.data.porId} />
            </Caixa>
            <div className="flex min-w-0 flex-col gap-4">
              <Caixa titulo="Jogos da rodada" detalhe="CHANCE DE SG">
                <JogosDaRodada linhas={linhas} times={times.data.porId} />
              </Caixa>
              <ComoCalculamos />
            </div>
          </div>
        </>
      )}

      <ListaEsperaPro />
    </Pagina>
  )
}

function Destaques({ linhas, modo, times }: { linhas: LinhaCartola[]; modo: Modo; times: Map<number, Time> }) {
  return (
    <div className="mt-7 grid gap-3.5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
      {linhas.map((l, i) => {
        const time = times.get(l.timeId)
        const adversario = times.get(l.adversarioId)
        if (!time || !adversario) return null
        const valor = modo === 'defesa' ? l.sg : l.marcar
        const escuro = i === 0
        return (
          <div
            key={l.timeId}
            className={`relative overflow-hidden px-[22px] py-5 transition-[transform,box-shadow] duration-200 ${
              escuro
                ? 'corte-duplo bg-grafite text-creme'
                : 'border-2 border-texto bg-superficie hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_var(--color-lima)]'
            }`}
          >
            <span aria-hidden className={`absolute -top-[18px] -right-1.5 text-[96px] leading-none font-black ${escuro ? 'text-lima opacity-10' : 'opacity-[.06]'}`}>
              0{i + 1}
            </span>
            <Rotulo className={escuro ? 'text-lima' : 'text-texto-2'}>
              {escuro ? (modo === 'defesa' ? 'MELHOR SG DA RODADA' : 'ATAQUE DA RODADA') : `${i + 1}º LUGAR`}
            </Rotulo>
            <div className="mt-3 flex items-center gap-2.5 text-2xl font-black tracking-[-.5px]">
              <Escudo time={time} tamanho={escuro ? 38 : 30} circulo />
              <span className="truncate">{time.nomeCurto}</span>
            </div>
            <div className={`mt-3 leading-none font-black tracking-[-3px] ${escuro ? 'text-[76px] text-lima' : 'text-[64px]'}`}>{pct(valor)}</div>
            <div className={`mt-1.5 text-sm ${escuro ? 'text-cinza' : 'text-texto-2'}`}>
              {modo === 'defesa' ? 'de chance de não levar gol' : 'de chance de marcar'} · {l.emCasa ? 'em casa contra' : 'fora contra'}{' '}
              {adversario.nomeCurto}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Legenda({ modo }: { modo: Modo }) {
  const itens: [Faixa, string][] =
    modo === 'defesa'
      ? [
          ['otima', 'Ótima: 45% ou mais'],
          ['boa', 'Boa: 30% a 44%'],
          ['fraca', 'Arriscada: menos de 30%'],
        ]
      : [
          ['otima', 'Ótima: 80% ou mais'],
          ['boa', 'Boa: 65% a 79%'],
          ['fraca', 'Fraca: menos de 65%'],
        ]
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-texto-2">
      {itens.map(([faixa, texto]) => (
        <li key={faixa} className="flex items-center gap-1.5">
          <span aria-hidden className={`size-3 border-2 ${ESTILO_FAIXA[faixa].selo}`} />
          {texto}
        </li>
      ))}
    </ul>
  )
}

function Caixa({ titulo, detalhe, children }: { titulo: string; detalhe?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-2 border-texto bg-superficie">
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-texto px-[18px] py-3.5">
        <h2 className="text-xl font-black tracking-[-.5px]">{titulo}</h2>
        {detalhe && <span className="font-mono text-[10px] font-extrabold tracking-[2px] text-texto-2">{detalhe}</span>}
      </div>
      {children}
    </div>
  )
}

const TH = 'border-b border-borda px-1.5 py-2.5 font-mono text-[10px] font-extrabold tracking-[1.5px] whitespace-nowrap text-texto-2 sm:px-2.5'
const TD = 'border-b border-borda px-1.5 py-2.5 tabular-nums sm:px-2.5'

function Tabela({ linhas, modo, chave, times }: { linhas: LinhaCartola[]; modo: Modo; chave: 'sg' | 'marcar'; times: Map<number, Time> }) {
  const { meuTime } = usePreferencias()
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${TH} w-10 text-center`}>#</th>
            <th className={`${TH} text-left`}>TIME</th>
            <th className={`${TH} text-left max-sm:hidden`}>CONTRA</th>
            <th className={`${TH} text-left`}>{modo === 'defesa' ? 'CHANCE DE SG' : 'CHANCE DE MARCAR'}</th>
            <th className={`${TH} text-right max-sm:hidden`}>{modo === 'defesa' ? 'GOLS DO ADV.' : 'GOLS ESPERADOS'}</th>
            <th className={`${TH} max-sm:hidden ${modo === 'ataque' ? 'text-right' : ''}`}>{modo === 'ataque' ? '2+ GOLS' : <span className="sr-only">Avaliação</span>}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => {
            const time = times.get(l.timeId)
            const adversario = times.get(l.adversarioId)
            if (!time || !adversario) return null
            const valor = l[chave]
            const faixa = faixaDaChance(valor, modo)
            const contra = `${l.emCasa ? 'vs' : '@'} ${adversario.sigla}`
            return (
              <tr key={l.timeId} className={time.id === meuTime ? 'bg-realce' : ''}>
                <td className={`${TD} text-center text-base font-black`}>{i + 1}</td>
                <td className={TD}>
                  <span className="flex items-center gap-2.5">
                    <Escudo time={time} tamanho={26} circulo />
                    <span className="min-w-0">
                      <span className="block truncate font-extrabold">{time.nomeCurto}</span>
                      <span className="block font-mono text-[11px] font-bold text-texto-2 sm:hidden">{contra}</span>
                    </span>
                  </span>
                </td>
                <td className={`${TD} max-sm:hidden`}>
                  <span
                    className="flex items-center gap-1.5 font-mono text-xs font-bold whitespace-nowrap text-texto-2"
                    title={l.emCasa ? `Em casa contra ${adversario.nomeCurto}` : `Fora contra ${adversario.nomeCurto}`}
                  >
                    {l.emCasa ? 'vs' : '@'} <Escudo time={adversario} tamanho={18} circulo /> {adversario.sigla}
                  </span>
                </td>
                <td className={TD}>
                  <span className="flex min-w-[118px] items-center gap-2.5">
                    <span className="relative h-2.5 flex-1 bg-superficie-2">
                      <span className={`absolute inset-y-0 left-0 ${ESTILO_FAIXA[faixa].barra}`} style={{ width: `${valor * 100}%` }} />
                    </span>
                    <b className="min-w-[42px] text-right text-base font-black">{pct(valor)}</b>
                  </span>
                </td>
                <td className={`${TD} text-right font-bold max-sm:hidden`}>{decimal(modo === 'defesa' ? l.golsContra : l.golsPro)}</td>
                <td className={`${TD} max-sm:hidden ${modo === 'ataque' ? 'text-right font-bold' : ''}`}>
                  {modo === 'ataque' ? (
                    pct(l.doisOuMais)
                  ) : (
                    <span className={`border-[1.5px] px-1.5 py-0.5 font-mono text-[10px] font-extrabold tracking-[1px] ${ESTILO_FAIXA[faixa].selo}`}>
                      {NOME_FAIXA[modo][faixa]}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function JogosDaRodada({ linhas, times }: { linhas: LinhaCartola[]; times: Map<number, Time> }) {
  const jogos = linhas.filter((l) => l.emCasa)
  const melhor = Math.max(...linhas.map((l) => l.sg))
  const selo = (x: number) => (
    <span className={`border-[1.5px] px-1.5 py-0.5 font-mono text-xs font-extrabold ${ESTILO_FAIXA[faixaDaChance(x, 'defesa')].selo}`}>{pct(x)}</span>
  )
  return (
    <ul>
      {jogos.map((casa) => {
        const fora = linhas.find((l) => l.partida.id === casa.partida.id && !l.emCasa)!
        const mandante = times.get(casa.timeId)
        const visitante = times.get(fora.timeId)
        if (!mandante || !visitante) return null
        return (
          <li key={casa.partida.id} className="border-b border-borda px-4 py-3 last:border-b-0">
            <div className="flex justify-between font-mono text-[11px] font-bold text-texto-2">
              <span>{formatarDataPartida(casa.partida.data)}</span>
              {(casa.sg === melhor || fora.sg === melhor) && <span>MELHOR SG</span>}
            </div>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5">
              <span className="flex items-center gap-2 text-sm font-extrabold" title={mandante.nomeCurto}>
                <Escudo time={mandante} tamanho={22} circulo />
                {mandante.sigla} {selo(casa.sg)}
              </span>
              <span aria-hidden className="font-mono text-xs font-black text-texto-2">
                ×
              </span>
              <span className="flex items-center justify-end gap-2 text-sm font-extrabold" title={visitante.nomeCurto}>
                {selo(fora.sg)} {visitante.sigla}
                <Escudo time={visitante} tamanho={22} circulo />
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ComoCalculamos() {
  return (
    <Caixa titulo="Como calculamos">
      <div className="flex flex-col gap-2.5 px-[18px] py-4 text-sm leading-normal">
        <p>
          O modelo da BraSúmula estima quantos gols cada time deve fazer no jogo (o mesmo que gera o palpite da Súmula), a
          partir do desempenho em casa e fora no campeonato.
        </p>
        <p className="bg-fundo px-2.5 py-2 font-mono text-[13px] font-bold">SG = chance de o adversário fazer 0 gols</p>
        <p className="text-[13px] text-texto-2">
          Ex.: se o adversário deve fazer 0,65 gol, a chance de SG é 52%. É probabilidade, não certeza: zebra acontece.
        </p>
      </div>
    </Caixa>
  )
}

/** "Em breve · BraSúmula Pro": guarda o e-mail de quem quer ser avisado (mede o interesse antes de contratar dados). */
function ListaEsperaPro() {
  const { usuario } = useConta()
  const [email, setEmail] = useState('')
  const [armadilha, setArmadilha] = useState('')
  const [estado, setEstado] = useState<'livre' | 'enviando' | 'pronto'>('livre')
  const [erro, setErro] = useState<string | null>(null)
  const valor = email || usuario?.email || ''

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEstado('enviando')
    try {
      const resposta = await fetch('/api/lista-espera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: valor, origem: 'cartola', site: armadilha }),
      })
      if (!resposta.ok) {
        const dados = (await resposta.json().catch(() => null)) as { erro?: string } | null
        throw new Error(dados?.erro ?? 'Não deu para guardar agora. Tente de novo.')
      }
      setEstado('pronto')
    } catch (e) {
      setErro(e instanceof TypeError ? 'Sem conexão. Confira a internet e tente de novo.' : (e as Error).message)
      setEstado('livre')
    }
  }

  return (
    <section
      aria-label="BraSúmula Pro"
      className="corte-canto mt-10 flex flex-wrap items-center justify-between gap-5 bg-grafite px-6 py-[26px] text-creme md:px-7"
    >
      <div className="max-w-[580px]">
        <Rotulo className="text-lima">EM BREVE · BRASÚMULA PRO</Rotulo>
        <h2 className="mt-1.5 text-[26px] leading-[1.15] font-black tracking-[-.5px]">Pontuação esperada de cada jogador</h2>
        <p className="mt-1.5 text-sm leading-normal text-cinza">
          Scouts, chance de valorizar e a escalação com mais pontos esperados para o seu orçamento. Deixe o seu e-mail para ser
          avisado quando abrir.
        </p>
      </div>
      {estado === 'pronto' ? (
        <p role="status" className="max-w-[340px] text-[15px] font-bold">
          <span className="text-lima">✓ Pronto!</span> Avisamos você em <span className="break-all">{valor}</span> quando o Pro abrir.
        </p>
      ) : (
        <form onSubmit={enviar} className="flex max-w-full flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label htmlFor="email-pro" className="sr-only">
              Seu e-mail
            </label>
            <input
              id="email-pro"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              value={valor}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[46px] min-w-0 flex-1 basis-[220px] border-2 border-linha-escura bg-transparent px-3.5 text-sm font-semibold text-creme placeholder:text-cinza focus:border-lima focus:outline-none"
            />
            {/* Campo escondido: gente não vê nem preenche; robô preenche. */}
            <input
              type="text"
              name="site"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={armadilha}
              onChange={(e) => setArmadilha(e.target.value)}
              className="absolute -left-[9999px] h-px w-px opacity-0"
            />
            <button
              type="submit"
              disabled={estado === 'enviando'}
              className="h-[46px] cursor-pointer border-2 border-lima bg-lima px-[18px] text-sm font-black text-grafite transition-colors hover:bg-transparent hover:text-lima disabled:cursor-wait disabled:opacity-60"
            >
              {estado === 'enviando' ? 'Guardando…' : 'Quero ser avisado'}
            </button>
          </div>
          {erro && (
            <p role="alert" className="text-sm font-bold text-[#ff8a8d]">
              {erro}
            </p>
          )}
          <p className="text-xs text-cinza">
            Usamos o e-mail só para esse aviso.{' '}
            <Link to="/privacidade" className="font-bold text-lima hover:underline">
              Privacidade
            </Link>
          </p>
        </form>
      )}
    </section>
  )
}
